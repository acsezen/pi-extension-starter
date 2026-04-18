import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createStarterSettingsCommand } from "./commands/settings-command.js";
import { createStarterState } from "./state/session-state.js";
import { createStarterChecklistTool } from "./tools/starter-checklist-tool.js";
import { applyStarterUi } from "./ui/footer.js";
import { STARTER_SETTINGS_COMMAND_NAME } from "./types.js";

export default function starterExtension(pi: ExtensionAPI): void {
	const state = createStarterState(pi);

	pi.registerCommand(STARTER_SETTINGS_COMMAND_NAME, createStarterSettingsCommand(state));
	pi.registerTool(createStarterChecklistTool(state));

	pi.on("session_start", async (_event, ctx) => {
		state.restoreFromContext(ctx);
		applyStarterUi(ctx, state);
	});

	pi.on("session_tree", async (_event, ctx) => {
		state.restoreFromContext(ctx);
		applyStarterUi(ctx, state);
	});

	pi.on("model_select", async (event, ctx) => {
		state.setModel(event.model);
		applyStarterUi(ctx, state);

		if (state.getSettings().modelNotificationMode === "notify" && event.source !== "restore") {
			ctx.ui.notify(`Modelo ativo: ${event.model.provider}/${event.model.id}`, "info");
		}
	});
}
