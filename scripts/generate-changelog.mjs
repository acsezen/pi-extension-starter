import { ConventionalChangelog } from "conventional-changelog";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "full";
const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(scriptDir, "..");
const packageJsonPath = join(rootDir, "package.json");
const changelogPath = join(rootDir, "CHANGELOG.md");
const releaseNotesPath = join(rootDir, "RELEASE_NOTES.md");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const version = packageJson.version;
const releaseNotes = await generateReleaseNotes();

if (mode === "release") {
	await writeFile(releaseNotesPath, withTrailingNewline(releaseNotes), "utf8");
	process.exit(0);
}

if (mode !== "full") {
	throw new Error(`Unsupported changelog mode: ${mode}`);
}

const existingChangelog = await readFile(changelogPath, "utf8");

if (hasVersionEntry(existingChangelog, version)) {
	process.exit(0);
}

const updatedChangelog = insertReleaseBlock(existingChangelog, releaseNotes);
await writeFile(changelogPath, withTrailingNewline(updatedChangelog), "utf8");

async function generateReleaseNotes() {
	let generated = "";

	try {
		generated = (await runConventionalChangelog()).trim();
	} catch {
		generated = "";
	}

	if (generated.length > 0 && hasMeaningfulReleaseContent(generated)) {
		return generated;
	}

	return [
		`## ${version} (${today()})`,
		"",
		"### Notes",
		"",
		"- No categorized changes were generated from commit history.",
		"- Automated release notes are populated from Conventional Commits such as `feat:` and `fix:`.",
	].join("\n");
}

async function runConventionalChangelog() {
	const generator = new ConventionalChangelog(rootDir);
	let output = "";

	generator.readPackage(packageJsonPath);
	generator.readRepository();
	generator.loadPreset("conventionalcommits");
	generator.options({ releaseCount: 1 });

	for await (const chunk of generator.write()) {
		output += chunk;
	}

	return output;
}

function insertReleaseBlock(existingChangelog, releaseBlock) {
	const normalized = normalizeNewlines(existingChangelog).trimEnd();
	const block = withTrailingNewline(releaseBlock.trim());
	const unreleasedMatch = normalized.match(/^## \[Unreleased\][\s\S]*?(?=^##\s|$)/m);

	if (unreleasedMatch) {
		const insertAt = unreleasedMatch.index + unreleasedMatch[0].length;
		const before = normalized.slice(0, insertAt).trimEnd();
		const after = normalized.slice(insertAt).trimStart();

		if (after.length === 0) {
			return `${before}\n\n${block}`;
		}

		return `${before}\n\n${block}\n${after}`;
	}

	const firstSectionMatch = normalized.match(/^##\s/m);

	if (firstSectionMatch) {
		const before = normalized.slice(0, firstSectionMatch.index).trimEnd();
		const after = normalized.slice(firstSectionMatch.index).trimStart();
		return `${before}\n\n${block}\n${after}`;
	}

	return `${normalized}\n\n${block}`;
}

function hasVersionEntry(changelog, currentVersion) {
	const normalized = normalizeNewlines(changelog);
	return (
		normalized.includes(`## [${currentVersion}]`) ||
		normalized.includes(`## [${currentVersion}](`) ||
		normalized.includes(`## ${currentVersion} (`) ||
		normalized.includes(`## ${currentVersion}\n`)
	);
}

function hasMeaningfulReleaseContent(value) {
	const normalized = normalizeNewlines(value);
	return /^###\s/m.test(normalized) || /^[*-]\s/m.test(normalized);
}

function normalizeNewlines(value) {
	return value.replace(/\r\n/g, "\n");
}

function withTrailingNewline(value) {
	return `${normalizeNewlines(value).trimEnd()}\n`;
}

function today() {
	return new Date().toISOString().slice(0, 10);
}
