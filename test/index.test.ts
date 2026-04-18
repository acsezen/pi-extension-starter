import assert from "node:assert/strict";
import test from "node:test";
import starterExtension from "../src/index.js";
import { createStarterSettingsCommand } from "../src/commands/settings-command.js";
import { createStarterState } from "../src/state/session-state.js";
import { createStarterChecklistTool } from "../src/tools/starter-checklist-tool.js";
import {
	STARTER_SETTINGS_COMMAND_NAME,
	STARTER_SETTINGS_ENTRY_TYPE,
	STARTER_STATUS_KEY,
	STARTER_TOOL_NAME,
	type StarterChecklistToolDetails,
} from "../src/types.js";
import { createMockExtensionApi } from "./helpers/mock-extension-api.js";
import { createMockCommandContext } from "./helpers/mock-command-context.js";
import { createMockExtensionContext } from "./helpers/mock-extension-context.js";
import { createMockFooterData } from "./helpers/mock-footer-data.js";

test("registra command, tool e hooks do starter stateful-ui", () => {
	const mock = createMockExtensionApi();

	starterExtension(mock.api);

	assert.ok(mock.registeredCommands.has(STARTER_SETTINGS_COMMAND_NAME));
	assert.equal(mock.registeredTools.length, 1);
	assert.equal(mock.registeredTools[0]?.name, STARTER_TOOL_NAME);
	assert.equal(mock.registeredHandlers.get("session_start")?.length, 1);
	assert.equal(mock.registeredHandlers.get("session_tree")?.length, 1);
	assert.equal(mock.registeredHandlers.get("model_select")?.length, 1);
});

test("rehidrata settings e detalhes da tool no session_start e aplica footer/status", async () => {
	const mock = createMockExtensionApi();
	starterExtension(mock.api);

	const { context, uiState } = createMockExtensionContext({
		model: { provider: "openai", id: "gpt-5.4-mini" } as never,
		branchEntries: [
			{
				type: "custom",
				customType: STARTER_SETTINGS_ENTRY_TYPE,
				data: {
					workflowMode: "manual",
					footerMode: "custom",
					modelNotificationMode: "quiet",
				},
			},
			{
				type: "message",
				message: {
					role: "toolResult",
					toolName: STARTER_TOOL_NAME,
					details: {
						action: "add",
						items: [{ id: 1, text: "Documentar o starter", done: false }],
						nextId: 2,
					},
				},
			},
		],
	});

	const handler = mock.registeredHandlers.get("session_start")?.[0];
	assert.ok(handler);
	await handler?.({ reason: "startup" }, context);

	const status = uiState.statuses.get(STARTER_STATUS_KEY);
	assert.ok(status);
	assert.match(status, /manual/);
	assert.match(status, /1 aberta\(s\)/);
	assert.ok(uiState.footerFactory);

	const footerData = createMockFooterData({
		branch: "main",
		statuses: uiState.statuses,
	});
	const footerComponent = uiState.footerFactory?.(uiState.tui, uiState.theme, footerData.data);
	assert.ok(footerComponent);

	const renderedLine = footerComponent?.render(120)?.[0] ?? "";
	assert.match(renderedLine, /gpt-5\.4-mini/);
	assert.match(renderedLine, /modo:manual/);
	assert.match(renderedLine, /git:main/);
});

test("settings command alterna configuracao e persiste appendEntry imediatamente", async () => {
	const mock = createMockExtensionApi();
	const state = createStarterState(mock.api);
	const command = createStarterSettingsCommand(state);
	const { context, uiState } = createMockCommandContext();

	await command.handler("", context);

	assert.ok(uiState.customComponent);
	uiState.customComponent?.handleInput?.(" ");

	assert.equal(mock.appendedEntries.length, 1);
	assert.deepEqual(mock.appendedEntries[0], {
		customType: STARTER_SETTINGS_ENTRY_TYPE,
		data: {
			workflowMode: "manual",
			footerMode: "custom",
			modelNotificationMode: "notify",
		},
	});

	const status = uiState.statuses.get(STARTER_STATUS_KEY);
	assert.ok(status);
	assert.match(status, /manual/);
	assert.ok(uiState.requestRenderCount > 0);
});

test("tool retorna details branch-aware e atualiza estado em memoria", async () => {
	const mock = createMockExtensionApi();
	const state = createStarterState(mock.api);
	const tool = createStarterChecklistTool(state);

	await tool.execute(
		"tool-1",
		{ action: "add", text: "Cobrir session_tree" },
		new AbortController().signal,
		async () => {},
		{} as never,
	);

	const toggleResult = await tool.execute(
		"tool-2",
		{ action: "toggle", id: 1 },
		new AbortController().signal,
		async () => {},
		{} as never,
	);

	const details = toggleResult.details as StarterChecklistToolDetails;

	assert.equal(details.items.length, 1);
	assert.equal(details.items[0]?.done, true);
	assert.equal(state.getSnapshot().checklist.completed, 1);
	assert.match(
		toggleResult.content[0]?.type === "text" ? toggleResult.content[0].text : "",
		/\[x\] #1/,
	);
});

test("model_select respeita a configuracao de notificacao", async () => {
	const mock = createMockExtensionApi();
	starterExtension(mock.api);

	const sessionStart = mock.registeredHandlers.get("session_start")?.[0];
	const modelSelect = mock.registeredHandlers.get("model_select")?.[0];
	assert.ok(sessionStart);
	assert.ok(modelSelect);

	const { context, uiState } = createMockExtensionContext({
		branchEntries: [
			{
				type: "custom",
				customType: STARTER_SETTINGS_ENTRY_TYPE,
				data: {
					workflowMode: "guided",
					footerMode: "default",
					modelNotificationMode: "quiet",
				},
			},
		],
	});

	await sessionStart?.({ reason: "startup" }, context);
	await modelSelect?.(
		{
			model: { provider: "openai", id: "gpt-5.4" },
			previousModel: undefined,
			source: "command",
		},
		context,
	);

	assert.equal(uiState.notifications.length, 0);
	const status = uiState.statuses.get(STARTER_STATUS_KEY);
	assert.ok(status);
	assert.match(status, /gpt-5\.4/);
});
