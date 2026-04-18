export const STARTER_SETTINGS_COMMAND_NAME = "starter-settings";
export const STARTER_TOOL_NAME = "starter_checklist";
export const STARTER_SETTINGS_ENTRY_TYPE = "starter-settings-state";
export const STARTER_STATUS_KEY = "starter-template";

export const STARTER_SETTING_IDS = {
	workflowMode: "workflow-mode",
	footerMode: "footer-mode",
	modelNotificationMode: "model-notification-mode",
} as const;

export const STARTER_WORKFLOW_MODES = ["guided", "manual"] as const;
export const STARTER_FOOTER_MODES = ["custom", "default"] as const;
export const STARTER_MODEL_NOTIFICATION_MODES = ["notify", "quiet"] as const;
export const STARTER_CHECKLIST_ACTIONS = ["list", "add", "toggle", "clear"] as const;

export type StarterSettingId = (typeof STARTER_SETTING_IDS)[keyof typeof STARTER_SETTING_IDS];
export type StarterWorkflowMode = (typeof STARTER_WORKFLOW_MODES)[number];
export type StarterFooterMode = (typeof STARTER_FOOTER_MODES)[number];
export type StarterModelNotificationMode = (typeof STARTER_MODEL_NOTIFICATION_MODES)[number];
export type StarterChecklistAction = (typeof STARTER_CHECKLIST_ACTIONS)[number];

export interface StarterSessionSettings {
	workflowMode: StarterWorkflowMode;
	footerMode: StarterFooterMode;
	modelNotificationMode: StarterModelNotificationMode;
}

export const DEFAULT_STARTER_SESSION_SETTINGS: StarterSessionSettings = {
	workflowMode: "guided",
	footerMode: "custom",
	modelNotificationMode: "notify",
};

export interface StarterChecklistItem {
	id: number;
	text: string;
	done: boolean;
}

export interface StarterChecklistToolDetails {
	action: StarterChecklistAction;
	items: StarterChecklistItem[];
	nextId: number;
	error?: string;
}

export interface StarterChecklistSummary {
	total: number;
	open: number;
	completed: number;
	nextId: number;
}

export interface StarterRuntimeSnapshot {
	settings: StarterSessionSettings;
	checklist: StarterChecklistSummary;
	activeModelLabel?: string;
}
