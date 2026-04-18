import type { ReadonlyFooterDataProvider } from "@mariozechner/pi-coding-agent";

export function createMockFooterData(options?: {
	branch?: string | null;
	statuses?: ReadonlyMap<string, string>;
	providerCount?: number;
}) {
	const listeners = new Set<() => void>();
	let branch = options?.branch ?? null;
	let statuses = options?.statuses ?? new Map<string, string>();
	let providerCount = options?.providerCount ?? 0;

	const data: ReadonlyFooterDataProvider = {
		getGitBranch() {
			return branch;
		},
		getExtensionStatuses() {
			return statuses;
		},
		getAvailableProviderCount() {
			return providerCount;
		},
		onBranchChange(callback) {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
	};

	return {
		data,
		setBranch(nextBranch: string | null) {
			branch = nextBranch;
			for (const listener of listeners) {
				listener();
			}
		},
		setStatuses(nextStatuses: ReadonlyMap<string, string>) {
			statuses = nextStatuses;
		},
		setProviderCount(nextProviderCount: number) {
			providerCount = nextProviderCount;
		},
	};
}
