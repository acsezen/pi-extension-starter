# Pi Extension Creation Guide: Runtime and UI

This is the second document in the series:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## State and Reconstruction

If the behavior depends on session state:

- prefer reconstructing from persisted history
- use `session_start` and `session_tree` for rehydration
- use `model_select` when UI or behavior depends on the current model
- do not rely only on in-memory variables

Canonical examples:

- `todo.ts`
- `tools.ts`
- `model-status.ts`

In the current starter:

- `src/state/session-state.ts` rehydrates session configuration from `appendEntry()`
- the same module rebuilds the checklist from `starter_checklist` `details`
- `src/index.ts` reapplies UI on `session_start`, `session_tree`, and `model_select`

## `appendEntry()` vs `details`

This distinction needs to be explicit in any stateful extension:

### Use `appendEntry()` when:

- the data is session metadata
- the extension is persisting user preferences
- the state does not need to be derived from a specific tool result

### Use `details` when:

- the state must correctly follow `fork`, `tree`, and history branching
- rendering depends on the previous tool result
- the extension needs to rebuild current-branch state by reading tool results

In the starter:

- `starter-settings-state` is written with `pi.appendEntry()`
- the `starter_checklist` checklist lives in `details`

## Interactive UI

When the extension needs a user-focused panel, the recommended pattern is:

- `ctx.ui.custom()`
- `SettingsList`
- `getSettingsListTheme()`

Canonically relevant example: `tools.ts`.

In the current starter, `src/ui/settings-panel.ts` demonstrates:

- dynamic title and summary
- searchable `SettingsList`
- change callback applied immediately
- re-rendering without relying on command-handler hacks

## Status and Footer

`pi` offers two main levels for persistent UI:

### `ctx.ui.setStatus()`

Use it for a short summary that is always available.

Good for:

- active/inactive state
- current model
- small counters

### `ctx.ui.setFooter()`

Use it when the extension needs to replace the entire footer.

Good for:

- custom layout
- combining data from `ctx.sessionManager`, `ctx.model`, and `footerData`
- showing the git branch and multiple statuses at the same time

In the current starter, `src/ui/footer.ts` uses both:

- `setStatus()` for the compact summary
- `setFooter()` for a custom footer when the user selects that mode in the panel

## Minimal Recommended Lifecycle for `stateful-ui` Extensions

For extensions with state and UI, treat these hooks as the baseline:

1. `session_start`
   - rehydrates state
   - reapplies status/footer/widget/header

2. `session_tree`
   - rehydrates the active branch state
   - reapplies the UI derived from that branch

3. `model_select`
   - synchronizes any model-dependent UI
   - in some cases, emits notify/status

This trio is present in the starter.

## Tool Rendering

For tools:

- use `renderCall()` and `renderResult()` when TUI UX matters
- keep the collapsed view short
- use `expanded` to detail larger lists
- avoid overly verbose renderers

In the starter:

- `src/tools/starter-checklist-tool.ts` uses `renderCall()` to show action + arguments
- `renderResult()` shows a concise summary and expands the list when needed

## Runtime Tests

Since `pi` does not expose an official mock kit for extensions, the starter includes base helpers in `test/helpers/`.

They cover what usually matters to validate:

- command/tool/hook registration
- `appendEntry()`
- `ctx.ui.custom()`
- `ctx.ui.setStatus()`
- `ctx.ui.setFooter()`
- `sessionManager.getBranch()`

If a real extension grows, prefer evolving these helpers instead of reinventing mocks per package.
