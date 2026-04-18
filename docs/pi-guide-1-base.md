# Pi Extension Creation Guide: Fundamentals

This guide exists to help agents and maintainers of this starter build `pi` extensions in the way recommended by the documentation and the project's real examples.

## Series Scope

This material is split across 3 files:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Sources of Truth

This document was consolidated from:

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/docs/packages.md`
- `packages/coding-agent/examples/extensions/README.md`
- canonically useful examples: `packages/coding-agent/examples/extensions/hello.ts`, `packages/coding-agent/examples/extensions/todo.ts`, `packages/coding-agent/examples/extensions/tools.ts`, `packages/coding-agent/examples/extensions/status-line.ts`, `packages/coding-agent/examples/extensions/custom-footer.ts`, `packages/coding-agent/examples/extensions/model-status.ts`

When there is a conflict, prioritize `extensions.md` and `packages.md` first, then the examples.

## Recommended Profiles

The official `pi` examples show two common profiles:

1. `minimal`
   - small extensions
   - usually a single tool or hook
   - main inspiration: `hello.ts`

2. `stateful-ui`
   - extensions with command, configuration, state, UI, and rehydration
   - main inspiration: `tools.ts`, `todo.ts`, `status-line.ts`, `custom-footer.ts`

This repository uses `stateful-ui` as the baseline for the main starter.

## Recommended Model

- `pi` extensions are TypeScript modules loaded directly by the runtime
- the recommended distribution format is an npm or git package with a `pi` manifest in `package.json`
- the package should remain source-first
- the main entrypoint should remain in `package.json > pi.extensions`

Minimal example:

```json
{
  "name": "my-pi-extension",
  "type": "module",
  "pi": {
    "extensions": ["./src/index.ts"]
  }
}
```

## Recommended Structure

For small extensions:

```text
src/
  index.ts
```

For real and evolving extensions:

```text
src/
  index.ts
  commands/
  state/
  tools/
  ui/
  types.ts
test/
  helpers/
docs/
```

In the current starter, the recommended structure already appears in a concrete form:

```text
src/
  index.ts
  commands/settings-command.ts
  state/session-state.ts
  tools/starter-checklist-tool.ts
  ui/footer.ts
  ui/settings-panel.ts
  types.ts
```

Practical rules:

- `src/index.ts` should compose extension registration, not contain all logic
- `commands/` for slash commands
- `state/` for rehydration, persistence, and in-memory state
- `tools/` for reusable and testable tools
- `ui/` for interactive rendering, footer, status, and helper components
- `types.ts` for public IDs, defaults, and shared contracts
- `test/helpers/` for mocks of `ExtensionAPI`, context, `sessionManager`, and footer

## How to Write the Extension

Every extension exports a default function that receives `ExtensionAPI`.

Recommended pattern:

```ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI): void {
  pi.registerCommand("my-settings", {
    description: "Open settings",
    handler: async (_args, ctx) => {
      ctx.ui.notify("ok", "info");
    },
  });
}
```

## Tools

### Preferred Pattern

Prefer `defineTool()` for tools declared outside `registerTool()`. This preserves type inference and makes unit testing and reuse easier.

Reference example: `hello.ts`.

```ts
import { defineTool } from "@mariozechner/pi-coding-agent";
import { StringEnum } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";

export const myTool = defineTool({
  name: "my_tool",
  label: "My Tool",
  description: "Does something useful",
  parameters: Type.Object({
    action: StringEnum(["list", "add"] as const, {
      description: "Operation to perform",
    }),
    text: Type.Optional(Type.String()),
  }),
  async execute() {
    return {
      content: [{ type: "text", text: "ok" }],
      details: { saved: true },
    };
  },
});
```

### Schemas

- use `@sinclair/typebox` for schemas
- for string enums, prefer `StringEnum` from `@mariozechner/pi-ai`
- avoid manual literal unions when `StringEnum` covers the use case

## Commands

Recommended pattern:

- register via `pi.registerCommand("name", { description, handler })`
- keep `args` parsing explicit
- use `ctx.ui.custom()` when rich interaction is needed
- use `ctx.ui.notify()` for lightweight feedback

In the current starter, the main command opens a `SettingsList` and persists configuration with immediate updates.

## State

Use two different channels, each with a distinct responsibility:

1. `pi.appendEntry()`
   - session metadata
   - user preferences
   - configuration that does not depend on the result of a specific tool

2. tool result `details`
   - state that must correctly follow the current branch
   - rendering and rehydration data tied to the tool history

The current starter uses exactly this split:

- UI configuration in `appendEntry()`
- tool checklist in `details`
