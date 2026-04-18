import { StringEnum } from "@mariozechner/pi-ai";
import { defineTool } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import type { StarterStateController } from "../state/session-state.js";
import {
	STARTER_CHECKLIST_ACTIONS,
	STARTER_TOOL_NAME,
	type StarterChecklistAction,
	type StarterChecklistItem,
	type StarterChecklistToolDetails,
} from "../types.js";

const StarterChecklistParams = Type.Object({
	action: StringEnum([...STARTER_CHECKLIST_ACTIONS], {
		description: "Operation to perform on the starter checklist.",
	}),
	text: Type.Optional(
		Type.String({
			minLength: 1,
			description: "Checklist item text. Required for add.",
		}),
	),
	id: Type.Optional(
		Type.Number({
			minimum: 1,
			description: "Checklist item ID. Required for toggle.",
		}),
	),
});

export function createStarterChecklistTool(state: StarterStateController) {
	return defineTool({
		name: STARTER_TOOL_NAME,
		label: "Starter Checklist",
		description:
			"Manage a sample checklist. The result details are intentionally branch-aware so extensions can reconstruct state from tool history.",
		parameters: StarterChecklistParams,
		async execute(_toolCallId, params) {
			const current = state.getChecklistDetails();
			const next = runChecklistAction(
				current.items,
				current.nextId,
				params.action,
				params.text,
				params.id,
			);
			state.replaceChecklist(next);

			return {
				content: [{ type: "text", text: buildChecklistContent(next) }],
				details: next,
			};
		},
		renderCall(args, theme) {
			let text =
				theme.fg("toolTitle", theme.bold(`${STARTER_TOOL_NAME} `)) + theme.fg("muted", args.action);
			if (args.text) {
				text += ` ${theme.fg("dim", `"${args.text}"`)}`;
			}
			if (typeof args.id === "number") {
				text += ` ${theme.fg("accent", `#${args.id}`)}`;
			}
			return new Text(text, 0, 0);
		},
		renderResult(result, { expanded }, theme) {
			const details = result.details as StarterChecklistToolDetails | undefined;
			if (!details) {
				const textContent = result.content[0];
				return new Text(textContent?.type === "text" ? textContent.text : "", 0, 0);
			}

			if (details.error) {
				return new Text(theme.fg("error", `Erro: ${details.error}`), 0, 0);
			}

			if (details.items.length === 0) {
				return new Text(theme.fg("dim", "Checklist vazio"), 0, 0);
			}

			const visibleItems = expanded ? details.items : details.items.slice(0, 4);
			let text = theme.fg("muted", `${details.items.length} item(ns) no branch atual:`);

			for (const item of visibleItems) {
				const mark = item.done ? theme.fg("success", "✓") : theme.fg("dim", "○");
				const itemText = item.done ? theme.fg("dim", item.text) : theme.fg("muted", item.text);
				text += `\n${mark} ${theme.fg("accent", `#${item.id}`)} ${itemText}`;
			}

			if (!expanded && details.items.length > visibleItems.length) {
				text += `\n${theme.fg("dim", `... ${details.items.length - visibleItems.length} mais`)}`;
			}

			return new Text(text, 0, 0);
		},
	});
}

function runChecklistAction(
	items: StarterChecklistItem[],
	nextId: number,
	action: StarterChecklistAction,
	text: string | undefined,
	id: number | undefined,
): StarterChecklistToolDetails {
	const workingItems = items.map((item) => ({ ...item }));

	switch (action) {
		case "list":
			return { action, items: workingItems, nextId };

		case "add": {
			const trimmedText = text?.trim();
			if (!trimmedText) {
				return { action, items: workingItems, nextId, error: "text required for add" };
			}

			workingItems.push({
				id: nextId,
				text: trimmedText,
				done: false,
			});
			return { action, items: workingItems, nextId: nextId + 1 };
		}

		case "toggle": {
			if (typeof id !== "number") {
				return { action, items: workingItems, nextId, error: "id required for toggle" };
			}

			const target = workingItems.find((item) => item.id === id);
			if (!target) {
				return { action, items: workingItems, nextId, error: `item #${id} not found` };
			}

			target.done = !target.done;
			return { action, items: workingItems, nextId };
		}

		case "clear":
			return { action, items: [], nextId: 1 };
	}
}

function buildChecklistContent(details: StarterChecklistToolDetails): string {
	if (details.error) {
		return `Starter checklist error: ${details.error}`;
	}

	if (details.items.length === 0) {
		return "Starter checklist is empty.";
	}

	return details.items
		.map((item) => `[${item.done ? "x" : " "}] #${item.id}: ${item.text}`)
		.join("\n");
}
