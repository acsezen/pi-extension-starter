import type {
	ExtensionAPI,
	MessageRenderer,
	RegisteredCommand,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import {
	STARTER_COMMAND_NAME,
	STARTER_INFO_MESSAGE_TYPE,
	STARTER_TOOL_NAME,
	type StarterInfoMessageDetails,
} from "../types.js";

export function createStarterCommand(
	pi: ExtensionAPI,
): Omit<RegisteredCommand, "name" | "sourceInfo"> {
	return {
		description: "Show the starter package metadata and next customization steps.",
		handler: async (args) => {
			const note = args.trim();
			const details: StarterInfoMessageDetails = {
				commandName: STARTER_COMMAND_NAME,
				toolName: STARTER_TOOL_NAME,
				timestamp: Date.now(),
			};

			if (note.length > 0) {
				details.note = note;
			}

			pi.sendMessage({
				customType: STARTER_INFO_MESSAGE_TYPE,
				content: buildStarterMessage(note),
				display: true,
				details,
			});
		},
	};
}

export function createStarterInfoRenderer(): MessageRenderer<StarterInfoMessageDetails> {
	return (message, { expanded }, theme) => {
		const details = message.details;
		let text = `${theme.fg("accent", "[starter]")} ${message.content}`;

		if (expanded && details) {
			text += `\n${theme.fg("dim", `Command: /${details.commandName}`)}`;
			text += `\n${theme.fg("dim", `Tool: ${details.toolName}`)}`;
			text += `\n${theme.fg("dim", `Generated: ${new Date(details.timestamp).toISOString()}`)}`;

			if (details.note) {
				text += `\n${theme.fg("muted", `Note: ${details.note}`)}`;
			}
		}

		return new Text(text, 0, 0);
	};
}

function buildStarterMessage(note: string): string {
	const lines = [
		"Starter extension loaded.",
		"Rename the package metadata, command names, and tool names before publishing.",
		"Use `pi -e ./src/index.ts` for a local smoke test.",
	];

	if (note.length > 0) {
		lines.push(`Argument received: ${note}`);
	}

	return lines.join("\n");
}
