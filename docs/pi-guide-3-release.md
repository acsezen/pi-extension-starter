# Pi Extension Creation Guide: Packaging and Validation

This is the third document in the series:

- `docs/pi-guide-1-base.md`
- `docs/pi-guide-2-runtime.md`
- `docs/pi-guide-3-release.md`

## Dependencies

Mandatory rules derived from `packages.md`:

- runtime dependencies go in `dependencies`
- `devDependencies` will not be available when the package is installed by `pi`
- core `pi` packages must stay in `peerDependencies` with `"*"`

In the current starter, that means:

- `@mariozechner/pi-agent-core`
- `@mariozechner/pi-ai`
- `@mariozechner/pi-coding-agent`
- `@mariozechner/pi-tui`
- `@sinclair/typebox`

Because the code uses `StringEnum()`, `@mariozechner/pi-ai` also appears in `devDependencies` for local development and tests.

## Distribution as a Pi Package

To publish as a shareable package:

- keep `keywords` with `pi-package`
- configure `package.json > pi.extensions`
- keep `type: "module"`
- include only what is necessary in the tarball

Validate with:

```bash
npm run pack:check
```

Quick test without installing:

```bash
pi -e ./src/index.ts
```

Local installation as a package:

```bash
pi install .
```

## Implementation Checklist

Before considering an extension ready:

1. The package exposes `pi.extensions` pointing to `src/index.ts`.
2. The code is modularized across `index`, `commands`, `state`, `tools`, `ui`, and `types`.
3. Tools use typed schemas with `TypeBox` and, when appropriate, `StringEnum`.
4. Public IDs and shared contracts are centralized.
5. Session state uses `appendEntry()` and branch-aware state uses `details`.
6. `session_start`, `session_tree`, and `model_select` hooks were considered.
7. There are tests for registration and main behavior.
8. `npm run check` passes.
9. The smoke test `pi -e ./src/index.ts` was run or at least attempted.
10. `npm run pack:check` confirms the npm package is clean.

## GitHub Automation

The current starter includes:

- `.github/workflows/validate.yml`: runs `npm ci`, executes `npm run check`, and validates pushes and pull requests on `main` and `master`
- `.github/workflows/release.yml`: uses `googleapis/release-please-action`, opens or updates release PRs from Conventional Commits, checks out the tag when a release is created, runs `npm run check`, and publishes to npm with provenance

Related files:

- `release-please-config.json`
- `.release-please-manifest.json`

## Anti-Patterns

Avoid:

- requiring a build only so `pi` can load the extension
- putting runtime dependencies in `devDependencies`
- storing important state only in process variables
- using `appendEntry()` for everything, including state that should live in `details`
- depending on UI without fallback when the code may run in other modes
- keeping temporary starter IDs in a public release

## Delivery

When the starter's public API changes:

- update `README.md`
- update `docs/pi-guide-*.md`
- review `AGENTS.md` to keep the baseline file list consistent
