import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { Api, Model } from "@mariozechner/pi-ai";
import {
	DEFAULT_STARTER_SESSION_SETTINGS,
	STARTER_CHECKLIST_ACTIONS,
	STARTER_FOOTER_MODES,
	STARTER_MODEL_NOTIFICATION_MODES,
	STARTER_SETTINGS_ENTRY_TYPE,
	STARTER_TOOL_NAME,
	STARTER_WORKFLOW_MODES,
	type StarterChecklistAction,
	type StarterChecklistItem,
	type StarterChecklistToolDetails,
	type StarterRuntimeSnapshot,
	type StarterSessionSettings,
} from "../types.js";

const EMPTY_CHECKLIST_DETAILS: StarterChecklistToolDetails = {
	action: "list",
	items: [],
	nextId: 1,
};

export interface StarterStateController {
	getSettings(): StarterSessionSettings;
	getChecklistDetails(): StarterChecklistToolDetails;
	getSnapshot(): StarterRuntimeSnapshot;
	updateSettings(nextSettings: StarterSessionSettings, options?: { persist?: boolean }): void;
	replaceChecklist(details: StarterChecklistToolDetails): void;
	restoreFromContext(ctx: ExtensionContext): void;
	setModel(model: Model<Api> | undefined): void;
}

export function createStarterState(pi: Pick<ExtensionAPI, "appendEntry">): StarterStateController {
	let settings = cloneSettings(DEFAULT_STARTER_SESSION_SETTINGS);
	let checklist = cloneChecklistDetails(EMPTY_CHECKLIST_DETAILS);
	let activeModelLabel: string | undefined;

	return {
		getSettings() {
			return cloneSettings(settings);
		},

		getChecklistDetails() {
			return cloneChecklistDetails(checklist);
		},

		getSnapshot() {
			return {
				settings: cloneSettings(settings),
				checklist: summarizeChecklist(checklist),
				...(activeModelLabel ? { activeModelLabel } : {}),
			};
		},

		updateSettings(nextSettings, options) {
			settings = cloneSettings(nextSettings);
			if (options?.persist !== false) {
				pi.appendEntry(STARTER_SETTINGS_ENTRY_TYPE, settings);
			}
		},

		replaceChecklist(details) {
			checklist = cloneChecklistDetails(details);
		},

		restoreFromContext(ctx) {
			settings = cloneSettings(DEFAULT_STARTER_SESSION_SETTINGS);
			checklist = cloneChecklistDetails(EMPTY_CHECKLIST_DETAILS);

			for (const entry of ctx.sessionManager.getBranch()) {
				if (entry.type === "custom" && entry.customType === STARTER_SETTINGS_ENTRY_TYPE) {
					const parsedSettings = parseStarterSessionSettings(entry.data);
					if (parsedSettings) {
						settings = parsedSettings;
					}
					continue;
				}

				if (entry.type !== "message") {
					continue;
				}

				const message = entry.message;
				if (message.role !== "toolResult" || message.toolName !== STARTER_TOOL_NAME) {
					continue;
				}

				const parsedChecklist = parseStarterChecklistDetails(message.details);
				if (parsedChecklist) {
					checklist = parsedChecklist;
				}
			}

			activeModelLabel = formatModelLabel(ctx.model);
		},

		setModel(model) {
			activeModelLabel = formatModelLabel(model);
		},
	};
}

function parseStarterSessionSettings(value: unknown): StarterSessionSettings | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const workflowMode = value.workflowMode;
	const footerMode = value.footerMode;
	const modelNotificationMode = value.modelNotificationMode;

	if (
		typeof workflowMode !== "string" ||
		typeof footerMode !== "string" ||
		typeof modelNotificationMode !== "string"
	) {
		return undefined;
	}

	if (
		!isStarterWorkflowMode(workflowMode) ||
		!isStarterFooterMode(footerMode) ||
		!isStarterModelNotificationMode(modelNotificationMode)
	) {
		return undefined;
	}

	return {
		workflowMode,
		footerMode,
		modelNotificationMode,
	};
}

function parseStarterChecklistDetails(value: unknown): StarterChecklistToolDetails | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	if (
		!STARTER_CHECKLIST_ACTIONS.includes(
			value.action as (typeof STARTER_CHECKLIST_ACTIONS)[number],
		) ||
		!Array.isArray(value.items) ||
		typeof value.nextId !== "number"
	) {
		return undefined;
	}

	const items: StarterChecklistItem[] = [];
	for (const item of value.items) {
		if (
			!isRecord(item) ||
			typeof item.id !== "number" ||
			typeof item.text !== "string" ||
			typeof item.done !== "boolean"
		) {
			return undefined;
		}

		items.push({
			id: item.id,
			text: item.text,
			done: item.done,
		});
	}

	return {
		action: value.action as StarterChecklistAction,
		items,
		nextId: value.nextId,
		...(typeof value.error === "string" ? { error: value.error } : {}),
	};
}

function summarizeChecklist(details: StarterChecklistToolDetails) {
	const completed = details.items.filter((item) => item.done).length;
	return {
		total: details.items.length,
		open: details.items.length - completed,
		completed,
		nextId: details.nextId,
	};
}

function cloneSettings(settings: StarterSessionSettings): StarterSessionSettings {
	return { ...settings };
}

function cloneChecklistDetails(details: StarterChecklistToolDetails): StarterChecklistToolDetails {
	return {
		action: details.action,
		items: details.items.map((item) => ({ ...item })),
		nextId: details.nextId,
		...(details.error ? { error: details.error } : {}),
	};
}

function formatModelLabel(model: Model<Api> | undefined): string | undefined {
	if (!model) {
		return undefined;
	}

	return `${model.provider}/${model.id}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isStarterWorkflowMode(value: string): value is StarterSessionSettings["workflowMode"] {
	return STARTER_WORKFLOW_MODES.includes(value as StarterSessionSettings["workflowMode"]);
}

function isStarterFooterMode(value: string): value is StarterSessionSettings["footerMode"] {
	return STARTER_FOOTER_MODES.includes(value as StarterSessionSettings["footerMode"]);
}

function isStarterModelNotificationMode(
	value: string,
): value is StarterSessionSettings["modelNotificationMode"] {
	return STARTER_MODEL_NOTIFICATION_MODES.includes(
		value as StarterSessionSettings["modelNotificationMode"],
	);
}
