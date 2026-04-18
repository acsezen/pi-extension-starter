import type {
	ExtensionCommandContext,
	ExtensionContext,
	ReadonlyFooterDataProvider,
} from "@mariozechner/pi-coding-agent";
import type { Api, Model } from "@mariozechner/pi-ai";
import type { Component } from "@mariozechner/pi-tui";

interface MockExtensionContextOptions {
	branchEntries?: unknown[];
	hasUI?: boolean;
	model?: Model<Api>;
}

interface NotificationRecord {
	message: string;
	type: "info" | "warning" | "error" | undefined;
}

export interface MockUiState {
	customComponent: Component | undefined;
	footerFactory:
		| ((
				tui: MockTui,
				theme: MockTheme,
				footerData: ReadonlyFooterDataProvider,
		  ) => Component & { dispose?(): void })
		| undefined;
	notifications: NotificationRecord[];
	statuses: Map<string, string>;
	theme: MockTheme;
	tui: MockTui;
	requestRenderCount: number;
}

interface MockTheme {
	bold(text: string): string;
	fg(color: string, text: string): string;
}

interface MockTui {
	requestRender(): void;
}

export function createMockExtensionContext(options?: MockExtensionContextOptions) {
	const notifications: NotificationRecord[] = [];
	const statuses = new Map<string, string>();

	const uiState: MockUiState = {
		customComponent: undefined,
		footerFactory: undefined,
		notifications,
		statuses,
		theme: {
			bold(text: string) {
				return text;
			},
			fg(_color: string, text: string) {
				return text;
			},
		},
		tui: {
			requestRender() {
				uiState.requestRenderCount += 1;
			},
		},
		requestRenderCount: 0,
	};

	const sessionManager = {
		getBranch() {
			return options?.branchEntries ?? [];
		},
		getEntries() {
			return options?.branchEntries ?? [];
		},
	} as ExtensionContext["sessionManager"];

	const ui = {
		theme: uiState.theme,
		select: async () => undefined,
		confirm: async () => false,
		input: async () => undefined,
		notify(message: string, type?: "info" | "warning" | "error") {
			notifications.push({ message, type });
		},
		setStatus(key: string, text: string | undefined) {
			if (text === undefined) {
				statuses.delete(key);
				return;
			}
			statuses.set(key, text);
		},
		setFooter(
			factory:
				| ((
						tui: MockTui,
						theme: MockTheme,
						footerData: ReadonlyFooterDataProvider,
				  ) => Component & { dispose?(): void })
				| undefined,
		) {
			uiState.footerFactory = factory;
		},
		custom<T>(
			factory: (
				tui: MockTui,
				theme: MockTheme,
				keybindings: Record<string, never>,
				done: (value: T) => void,
			) => Component | Promise<Component>,
		) {
			return Promise.resolve(factory(uiState.tui, uiState.theme, {}, (_value: T) => {})).then(
				(component) => {
					uiState.customComponent = component;
					return undefined as T;
				},
			);
		},
		setWorkingMessage() {},
		setHiddenThinkingLabel() {},
		setEditorText() {},
		setEditorComponent() {},
		setToolsExpanded() {},
		pasteToEditor() {},
		editor: async () => undefined,
		setWidget() {},
		setHeader() {},
		setTitle() {},
		onTerminalInput() {
			return () => {};
		},
	} as unknown as ExtensionContext["ui"];

	const context: ExtensionContext = {
		ui,
		hasUI: options?.hasUI ?? true,
		cwd: process.cwd(),
		sessionManager,
		modelRegistry: {} as ExtensionContext["modelRegistry"],
		model: options?.model,
		isIdle() {
			return true;
		},
		signal: undefined,
		abort() {},
		hasPendingMessages() {
			return false;
		},
		shutdown() {},
		getContextUsage() {
			return undefined;
		},
		compact() {},
		getSystemPrompt() {
			return "system";
		},
	};

	return {
		context,
		uiState,
	};
}

export function createMockCommandContext(options?: MockExtensionContextOptions) {
	const { context, uiState } = createMockExtensionContext(options);
	const commandContext: ExtensionCommandContext = {
		...context,
		waitForIdle: async () => {},
		newSession: async () => ({ cancelled: false }),
		fork: async () => ({ cancelled: false }),
		navigateTree: async () => ({ cancelled: false }),
		switchSession: async () => ({ cancelled: false }),
		reload: async () => {},
	};

	return {
		context: commandContext,
		uiState,
	};
}
