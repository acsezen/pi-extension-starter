import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(scriptDir, "..");
const gitDir = join(rootDir, ".git");
const huskyBin = join(rootDir, "node_modules", "husky", "bin.js");

if (!existsSync(gitDir)) {
	console.log("prepare: skipping Husky install because .git was not found.");
	process.exit(0);
}

const result = spawnSync(process.execPath, [huskyBin], {
	cwd: rootDir,
	stdio: "inherit",
});

process.exit(result.status ?? 1);
