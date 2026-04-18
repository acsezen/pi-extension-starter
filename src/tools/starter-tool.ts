import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { STARTER_TOOL_NAME, type StarterToolResultDetails } from "../types.js";

export const starterTool = defineTool({
	name: STARTER_TOOL_NAME,
	label: "Starter Echo",
	description: "Echo text back to the agent. Rename this tool before your first real release.",
	parameters: Type.Object({
		text: Type.String({
			minLength: 1,
			description: "Text that should be echoed back to the model.",
		}),
		uppercase: Type.Optional(
			Type.Boolean({
				description: "When true, convert the returned text to uppercase.",
			}),
		),
	}),
	async execute(_toolCallId, params) {
		const originalText = params.text.trim();
		const uppercaseApplied = params.uppercase ?? false;
		const outputText = uppercaseApplied ? originalText.toUpperCase() : originalText;
		const details: StarterToolResultDetails = {
			originalText,
			outputText,
			uppercaseApplied,
		};

		return {
			content: [{ type: "text", text: `Starter echo: ${outputText}` }],
			details,
		};
	},
});
