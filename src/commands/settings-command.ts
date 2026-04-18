import type { RegisteredCommand } from "@mariozechner/pi-coding-agent";
import type { StarterStateController } from "../state/session-state.js";
import { applyStarterUi } from "../ui/footer.js";
import { createStarterSettingsPanel } from "../ui/settings-panel.js";
import {
	STARTER_FOOTER_MODES,
	STARTER_MODEL_NOTIFICATION_MODES,
	STARTER_SETTINGS_COMMAND_NAME,
	STARTER_SETTING_IDS,
	STARTER_WORKFLOW_MODES,
	type StarterSettingId,
	type StarterSessionSettings,
} from "../types.js";

export function createStarterSettingsCommand(
	state: StarterStateController,
): Omit<RegisteredCommand, "name" | "sourceInfo"> {
	return {
		description: "Abre um painel SettingsList com estado persistido e reidratacao por branch.",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify(`/${STARTER_SETTINGS_COMMAND_NAME} requer modo interativo`, "warning");
				return;
			}

			await ctx.ui.custom<void>((tui, theme, _keybindings, done) => {
				return createStarterSettingsPanel({
					state,
					theme,
					tui,
					onChange: (id, value) => {
						const nextSettings = applySettingChange(state.getSettings(), id, value);
						state.updateSettings(nextSettings);
						applyStarterUi(ctx, state);
					},
					onClose: () => done(),
				});
			});
		},
	};
}

function applySettingChange(
	settings: StarterSessionSettings,
	id: StarterSettingId,
	value: string,
): StarterSessionSettings {
	switch (id) {
		case STARTER_SETTING_IDS.workflowMode:
			if (STARTER_WORKFLOW_MODES.includes(value as (typeof STARTER_WORKFLOW_MODES)[number])) {
				return { ...settings, workflowMode: value as StarterSessionSettings["workflowMode"] };
			}
			return settings;

		case STARTER_SETTING_IDS.footerMode:
			if (STARTER_FOOTER_MODES.includes(value as (typeof STARTER_FOOTER_MODES)[number])) {
				return { ...settings, footerMode: value as StarterSessionSettings["footerMode"] };
			}
			return settings;

		case STARTER_SETTING_IDS.modelNotificationMode:
			if (
				STARTER_MODEL_NOTIFICATION_MODES.includes(
					value as (typeof STARTER_MODEL_NOTIFICATION_MODES)[number],
				)
			) {
				return {
					...settings,
					modelNotificationMode: value as StarterSessionSettings["modelNotificationMode"],
				};
			}
			return settings;
	}
}
