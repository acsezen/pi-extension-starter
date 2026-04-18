import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createStarterCommand, createStarterInfoRenderer } from "./commands/starter-command.js";
import { starterTool } from "./tools/starter-tool.js";
import { STARTER_COMMAND_NAME, STARTER_INFO_MESSAGE_TYPE } from "./types.js";

export default function starterExtension(pi: ExtensionAPI): void {
	pi.registerMessageRenderer(STARTER_INFO_MESSAGE_TYPE, createStarterInfoRenderer());
	pi.registerCommand(STARTER_COMMAND_NAME, createStarterCommand(pi));
	pi.registerTool(starterTool);
}

export { createStarterCommand, createStarterInfoRenderer } from "./commands/starter-command.js";
export { starterTool } from "./tools/starter-tool.js";
export * from "./types.js";
