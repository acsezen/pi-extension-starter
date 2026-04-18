import type { Theme } from "@mariozechner/pi-coding-agent";
import { getSettingsListTheme, initTheme } from "@mariozechner/pi-coding-agent";
import {
	Container,
	Spacer,
	type TUI,
	type SettingItem,
	SettingsList,
	Text,
	truncateToWidth,
} from "@mariozechner/pi-tui";
import type { StarterStateController } from "../state/session-state.js";
import {
	STARTER_FOOTER_MODES,
	STARTER_MODEL_NOTIFICATION_MODES,
	STARTER_SETTING_IDS,
	STARTER_WORKFLOW_MODES,
	type StarterSettingId,
} from "../types.js";

interface StarterSettingsPanelOptions {
	state: StarterStateController;
	theme: Theme;
	tui: TUI;
	onChange(id: StarterSettingId, value: string): void;
	onClose(): void;
}

export function createStarterSettingsPanel(options: StarterSettingsPanelOptions) {
	initTheme(undefined, false);

	const container = new Container();

	container.addChild(
		new Text(options.theme.bold(options.theme.fg("accent", "Starter Settings")), 0, 0),
	);
	container.addChild(new Spacer(1));
	container.addChild({
		render(width: number): string[] {
			const snapshot = options.state.getSnapshot();
			const lines = [
				options.theme.fg("muted", `Workflow: ${snapshot.settings.workflowMode}`),
				options.theme.fg("muted", `Footer: ${snapshot.settings.footerMode}`),
				options.theme.fg("muted", `Modelo: ${snapshot.activeModelLabel ?? "sem modelo"}`),
				options.theme.fg(
					"dim",
					`Checklist: ${snapshot.checklist.open} aberta(s), ${snapshot.checklist.completed} concluida(s)`,
				),
			];

			return lines.map((line) => truncateToWidth(line, width));
		},
		invalidate() {},
	});
	container.addChild(new Spacer(1));

	const settingsList = new SettingsList(
		createSettingItems(options.state),
		8,
		getSettingsListTheme(),
		(id, newValue) => {
			options.onChange(id as StarterSettingId, newValue);
			options.tui.requestRender();
		},
		options.onClose,
		{ enableSearch: true },
	);

	container.addChild(settingsList);

	return {
		render(width: number) {
			return container.render(width);
		},
		invalidate() {
			container.invalidate();
		},
		handleInput(data: string) {
			settingsList.handleInput(data);
			options.tui.requestRender();
		},
	};
}

function createSettingItems(state: StarterStateController): SettingItem[] {
	const settings = state.getSettings();

	return [
		{
			id: STARTER_SETTING_IDS.workflowMode,
			label: "Workflow",
			description:
				"Mostra como persistir preferências com pi.appendEntry() e reaplicar a UI após reload/tree.",
			currentValue: settings.workflowMode,
			values: [...STARTER_WORKFLOW_MODES],
		},
		{
			id: STARTER_SETTING_IDS.footerMode,
			label: "Footer",
			description: "Alterna entre footer padrão e footer customizado usando ctx.ui.setFooter().",
			currentValue: settings.footerMode,
			values: [...STARTER_FOOTER_MODES],
		},
		{
			id: STARTER_SETTING_IDS.modelNotificationMode,
			label: "Model notices",
			description: "Controla se o hook model_select dispara notify() quando o modelo muda.",
			currentValue: settings.modelNotificationMode,
			values: [...STARTER_MODEL_NOTIFICATION_MODES],
		},
	];
}
