# pi-extension-starter

Starter template for building Pi extensions as source-first npm packages.

This template follows the current `pi` docs model:

- package distribution via `package.json > pi.extensions`
- TypeScript source entrypoint loaded directly by Pi
- local validation with `npm run check`
- release notes generated with `conventional-changelog`
- CI/CD for npm publication after successful validation

## Included

- `src/index.ts` entrypoint with one command, one tool, and one custom message renderer
- `test/index.test.ts` covering registration, command output, and tool execution
- `AGENTS.md` with repo-specific instructions for agents working on Pi extensions
- `docs/pi-guide-1-base.md`, `docs/pi-guide-2-runtime.md`, and `docs/pi-guide-3-release.md` summarizing the recommended authoring model from the official Pi docs and examples
- `.husky` hooks for `pre-commit` and `commit-msg`
- `commitlint` configured for Conventional Commits
- `.github/workflows/ci.yml` and `.github/workflows/cd.yml`
- `scripts/generate-changelog.mjs` and `scripts/prepare-husky.mjs`

## Quick Start

1. Rename the package metadata in `package.json`.
2. Rename the starter constants in `src/types.ts`.
3. Initialize Git if you have not already:

   ```bash
   git init
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Validate the template:

   ```bash
   npm run check
   ```

6. Smoke test the extension with Pi:

   ```bash
   pi -e ./src/index.ts
   ```

7. Optional local install as a package:

   ```bash
   pi install .
   ```

## Agent Guide

This starter now includes an explicit authoring guide for agents and maintainers:

- `AGENTS.md`
- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

Use those files as the local implementation contract when evolving the extension.
They were derived from the official Pi sources in:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`

## Starter Behavior

- Slash command: `/starter-about`
- Tool name: `starter_echo`
- Custom message type: `starter-info`

Rename those three identifiers before publishing your real package.

## Release Flow

The included CD workflow follows the same style used in `pi-tool-view`:

- CI runs on pushes and pull requests to `main` and `master`.
- CD only runs after CI succeeds for a direct push to `main` or `master`.
- The head commit message must contain the standalone word `release`.
- CD bumps `patch`, updates `CHANGELOG.md`, publishes to npm, tags the release, and creates a GitHub Release.

If the same commit message also contains the standalone word `test`, the workflow publishes a test build with the npm tag `test` instead of creating a normal release.

Example release commit message:

```text
chore: release starter package
```

Example test publish commit message:

```text
chore: release test candidate
```

## Changelog

Generate or refresh the changelog from Conventional Commits:

```bash
npm run changelog
```

Generate release notes only:

```bash
npm run changelog:release
```

## Customize Before Publishing

- `package.json`
  - `name`
  - `description`
  - `author`
  - `repository`
  - `bugs`
  - `homepage`
- `src/types.ts`
  - `STARTER_COMMAND_NAME`
  - `STARTER_TOOL_NAME`
  - `STARTER_INFO_MESSAGE_TYPE`
- `LICENSE`
  - copyright holder

## Notes

- The package is intentionally source-first. There is no build step required for Pi to load the extension.
- Runtime dependencies for distributed Pi packages must live in `dependencies`. This starter currently only needs peer dependencies and dev dependencies.
- Husky installation is skipped automatically when `.git` is missing, which keeps `npm install` working before `git init`.
