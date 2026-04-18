import type {
	ExtensionAPI,
	MessageRenderer,
	RegisteredCommand,
} from "@mariozechner/pi-coding-agent";

type CommandOptions = Omit<RegisteredCommand, "name" | "sourceInfo">;
type RegisteredToolSummary = { name: string };

export interface MockExtensionApi {
	api: ExtensionAPI;
	registeredCommands: Map<string, CommandOptions>;
	registeredTools: RegisteredToolSummary[];
	registeredHandlers: Map<string, Array<(event: unknown, ctx: unknown) => unknown>>;
	registeredRenderers: Map<string, MessageRenderer>;
	appendedEntries: Array<{ customType: string; data: unknown }>;
}

export function createMockExtensionApi(): MockExtensionApi {
	const registeredCommands = new Map<string, CommandOptions>();
	const registeredTools: RegisteredToolSummary[] = [];
	const registeredHandlers = new Map<string, Array<(event: unknown, ctx: unknown) => unknown>>();
	const registeredRenderers = new Map<string, MessageRenderer>();
	const appendedEntries: Array<{ customType: string; data: unknown }> = [];

	const api: Pick<
		ExtensionAPI,
		"appendEntry" | "on" | "registerCommand" | "registerMessageRenderer" | "registerTool"
	> = {
		appendEntry(customType, data) {
			appendedEntries.push({ customType, data });
		},
		on(event, handler) {
			const handlers = registeredHandlers.get(event) ?? [];
			handlers.push(handler as (event: unknown, ctx: unknown) => unknown);
			registeredHandlers.set(event, handlers);
		},
		registerCommand(name, command) {
			registeredCommands.set(name, command);
		},
		registerMessageRenderer(customType, renderer) {
			registeredRenderers.set(customType, renderer as MessageRenderer);
		},
		registerTool(tool) {
			registeredTools.push({ name: tool.name });
		},
	};

	return {
		api: api as ExtensionAPI,
		registeredCommands,
		registeredTools,
		registeredHandlers,
		registeredRenderers,
		appendedEntries,
	};
}
