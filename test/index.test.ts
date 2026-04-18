import assert from "node:assert/strict";
import test from "node:test";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	MessageRenderer,
	RegisteredCommand,
} from "@mariozechner/pi-coding-agent";
import starterExtension, {
	createStarterCommand,
	starterTool,
	STARTER_COMMAND_NAME,
	STARTER_INFO_MESSAGE_TYPE,
	STARTER_TOOL_NAME,
	type StarterInfoMessageDetails,
	type StarterToolResultDetails,
} from "../src/index.js";

type SentMessage = Parameters<ExtensionAPI["sendMessage"]>[0];
type CommandOptions = Omit<RegisteredCommand, "name" | "sourceInfo">;

function createMockExtensionApi() {
	const registeredCommands = new Map<string, CommandOptions>();
	const registeredRenderers = new Map<string, MessageRenderer>();
	const registeredTools: unknown[] = [];
	const sentMessages: SentMessage[] = [];

	const api: Pick<
		ExtensionAPI,
		"registerCommand" | "registerMessageRenderer" | "registerTool" | "sendMessage"
	> = {
		registerCommand(name, command) {
			registeredCommands.set(name, command);
		},
		registerMessageRenderer<T>(customType: string, renderer: MessageRenderer<T>) {
			registeredRenderers.set(customType, renderer as MessageRenderer);
		},
		registerTool(tool) {
			registeredTools.push(tool);
		},
		sendMessage(message) {
			sentMessages.push(message);
		},
	};

	return {
		api: api as ExtensionAPI,
		registeredCommands,
		registeredRenderers,
		registeredTools,
		sentMessages,
	};
}

test("registers the starter command, message renderer, and tool", () => {
	const mock = createMockExtensionApi();

	starterExtension(mock.api);

	assert.equal(mock.registeredCommands.size, 1);
	assert.ok(mock.registeredCommands.has(STARTER_COMMAND_NAME));
	assert.ok(mock.registeredRenderers.has(STARTER_INFO_MESSAGE_TYPE));
	assert.equal(mock.registeredTools.length, 1);
	assert.equal(mock.registeredTools[0], starterTool);
});

test("starter command sends a structured starter-info message", async () => {
	const mock = createMockExtensionApi();
	const command = createStarterCommand(mock.api);

	await command.handler("rename me before publishing", {} as ExtensionCommandContext);

	assert.equal(mock.sentMessages.length, 1);

	const message = mock.sentMessages[0];
	assert.ok(message);
	assert.equal(typeof message.content, "string");
	if (typeof message.content !== "string") {
		throw new Error("Expected starter command to send string content.");
	}

	const details = message.details as StarterInfoMessageDetails;

	assert.equal(message.customType, STARTER_INFO_MESSAGE_TYPE);
	assert.equal(message.display, true);
	assert.match(message.content, /Starter extension loaded\./);
	assert.match(message.content, /rename me before publishing/);
	assert.equal(details.commandName, STARTER_COMMAND_NAME);
	assert.equal(details.toolName, STARTER_TOOL_NAME);
	assert.equal(details.note, "rename me before publishing");
	assert.equal(typeof details.timestamp, "number");
});

test("starter tool uppercases text when requested", async () => {
	const result = await starterTool.execute(
		"tool-1",
		{ text: "pi starter", uppercase: true },
		new AbortController().signal,
		async () => {},
		{} as never,
	);

	const details = result.details as StarterToolResultDetails;

	assert.deepEqual(result.content, [{ type: "text", text: "Starter echo: PI STARTER" }]);
	assert.equal(details.originalText, "pi starter");
	assert.equal(details.outputText, "PI STARTER");
	assert.equal(details.uppercaseApplied, true);
});
