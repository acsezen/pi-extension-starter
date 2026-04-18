import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import type { StarterStateController } from "../state/session-state.js";
import { STARTER_STATUS_KEY } from "../types.js";

export function applyStarterUi(ctx: ExtensionContext, state: StarterStateController): void {
	const snapshot = state.getSnapshot();
	const theme = ctx.ui.theme;

	const statusText = [
		theme.fg("accent", snapshot.settings.workflowMode),
		theme.fg("muted", `${snapshot.checklist.open} aberta(s)`),
		theme.fg("dim", snapshot.activeModelLabel ?? "sem modelo"),
	].join(theme.fg("dim", " · "));

	ctx.ui.setStatus(STARTER_STATUS_KEY, statusText);

	if (snapshot.settings.footerMode === "default") {
		ctx.ui.setFooter(undefined);
		return;
	}

	ctx.ui.setFooter((tui, footerTheme, footerData) => {
		const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

		return {
			dispose: unsubscribe,
			invalidate() {},
			render(width: number): string[] {
				const latest = state.getSnapshot();
				const left = footerTheme.fg(
					"accent",
					`starter ${latest.checklist.completed}/${latest.checklist.total} concluidas`,
				);

				const statuses = footerData.getExtensionStatuses();
				const statusCount = statuses.size;
				const branch = footerData.getGitBranch();
				const rightParts = [
					latest.activeModelLabel ?? "sem modelo",
					`modo:${latest.settings.workflowMode}`,
					`status:${statusCount}`,
					branch ? `git:${branch}` : undefined,
				].filter((value): value is string => Boolean(value));
				const right = footerTheme.fg("dim", rightParts.join(" · "));

				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
				return [truncateToWidth(left + pad + right, width)];
			},
		};
	});
}
