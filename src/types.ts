export const STARTER_COMMAND_NAME = "starter-about";
export const STARTER_TOOL_NAME = "starter_echo";
export const STARTER_INFO_MESSAGE_TYPE = "starter-info";

export interface StarterInfoMessageDetails {
	commandName: string;
	toolName: string;
	timestamp: number;
	note?: string;
}

export interface StarterToolResultDetails {
	originalText: string;
	outputText: string;
	uppercaseApplied: boolean;
}
