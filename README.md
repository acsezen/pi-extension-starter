# pi-extension-starter

Starter template for building `pi` extensions as source-first npm packages, now with a baseline profile closer to real extensions: session state, interactive UI, lifecycle hooks, and a tool with branch-aware `details`.

## What This Starter Demonstrates

- `package.json > pi.extensions` pointing to `./src/index.ts`
- `src/state/session-state.ts` with persistence via `pi.appendEntry()`
- `src/tools/starter-checklist-tool.ts` with `defineTool()` and typed `details` to rebuild state per branch
- `src/commands/settings-command.ts` with `ctx.ui.custom()` + `SettingsList` + `getSettingsListTheme()`
- `src/ui/footer.ts` with `ctx.ui.setStatus()` and `ctx.ui.setFooter()`
- `session_start`, `session_tree`, and `model_select` hooks
- test helpers in `test/helpers/`
- local validation with `npm run check`
- automated releases with `release-please` + npm publish

## Current Structure

```text
src/
  index.ts
  commands/
    settings-command.ts
  state/
    session-state.ts
  tools/
    starter-checklist-tool.ts
  ui/
    footer.ts
    settings-panel.ts
  types.ts
test/
  helpers/
    mock-command-context.ts
    mock-extension-api.ts
    mock-extension-context.ts
    mock-footer-data.ts
  index.test.ts
docs/
  pi-guide-1-base.md
  pi-guide-2-runtime.md
  pi-guide-3-release.md
```

## Starter Behavior

- Slash command: `/starter-settings`
- Tool name: `starter_checklist`
- Session entry type: `starter-settings-state`

The command opens a `SettingsList` panel to toggle persisted settings.
The tool maintains a simple checklist and stores its state in `details`, which makes reconstruction correct across `fork`, `tree`, and session reloads.
The hooks reapply status/footer and synchronize in-memory state when the session changes.

## Quick Start

1. Update the package metadata in `package.json`.
2. Rename the public identifiers in `src/types.ts`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the full validation:

   ```bash
   npm run check
   ```

5. Run a smoke test with the real `pi` runtime:

   ```bash
   pi -e ./src/index.ts
   ```

6. Optionally test local installation as a package:

   ```bash
   pi install .
   ```

## Included Architecture Patterns

### 1. Session State via `appendEntry()`

`src/state/session-state.ts` persists user preferences such as:

- workflow mode
- footer mode
- model-switch notifications

This data is session metadata. That is why the starter uses `pi.appendEntry()` and rehydrates it on `session_start` and `session_tree`.

### 2. Branch-Aware State via `details`

`src/tools/starter-checklist-tool.ts` returns structured `details` in each result.
The starter uses that history to rebuild the current branch checklist without depending on loose process state.

### 3. Official Interactive UI

`src/commands/settings-command.ts` opens a panel with:

- `ctx.ui.custom()`
- `SettingsList`
- `getSettingsListTheme()`
- immediate updates when toggling options

### 4. Explicit Lifecycle

`src/index.ts` registers:

- `session_start`
- `session_tree`
- `model_select`

This shows how to reapply behavior after reloads, branch navigation, and model changes.

### 5. Status and Footer

`src/ui/footer.ts` demonstrates:

- `ctx.ui.setStatus()` for compact, persistent status
- `ctx.ui.setFooter()` for a custom footer that uses `footerData`

## Included Tests

The starter now includes reusable mocks for `pi` extensions:

- `test/helpers/mock-extension-api.ts`
- `test/helpers/mock-command-context.ts`
- `test/helpers/mock-extension-context.ts`
- `test/helpers/mock-footer-data.ts`

They cover what a stateful extension usually needs to validate:

- command and tool registration
- lifecycle hooks
- `appendEntry()`
- `setStatus()` and `setFooter()`
- `SettingsList` panel

## Release Flow

The repository includes two workflows:

- `validate.yml`: runs `npm run check` on pushes and pull requests
- `release.yml`: uses `release-please` to open/update release PRs and publishes to npm when a release is created

Before publishing, confirm:

```bash
npm run check
npm run pack:check
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
  - `STARTER_SETTINGS_COMMAND_NAME`
  - `STARTER_TOOL_NAME`
  - `STARTER_SETTINGS_ENTRY_TYPE`
  - defaults for `DEFAULT_STARTER_SESSION_SETTINGS`
- `LICENSE`
  - copyright holder

## Local Documentation

This starter treats the following files as the local implementation contract:

- `AGENTS.md`
- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

They were derived from the official `pi` docs and examples in:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`

## Notes

- The package remains source-first. There is no mandatory build step for `pi` to load the extension.
- Core `pi` dependencies stay in `peerDependencies` with `"*"`.
- `@mariozechner/pi-ai` appears in the starter because `StringEnum()` is part of the recommended pattern for string enums.
