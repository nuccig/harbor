# ADR 0013 — electron-vite + ESM build tooling

## Status

proposed (awaiting approval to promote to `docs/adr/`)

## Context

ADR 0004 fixes React + Vite for the renderer, and ADR 0003 fixes Electron for the main process. But an Electron app has three build targets — main process, preload script, renderer — with different constraints: the main and preload run in Node (CommonJS or ESM depending on the Electron version and `package.json`), the renderer runs in Chromium. Wiring Vite separately for each target (three configs, two dev servers, a manual `electron .` watcher) is doable but is pure boilerplate; every Electron+Vite project writes the same glue.

`electron-vite` is a mature plugin that consolidates the three targets into one config (`electron.vite.config.ts`) and one command each for `dev` and `build`. The convention (`src/main`, `src/preload`, `src/renderer`) matches the directory layout the scaffold already uses. Electron 33+ supports `"type": "module"` in `package.json`, so the main process and preload can both be ESM — but the preload, loaded into a sandboxed context, must output `.mjs` (not `.js`, which the sandbox resolves as CommonJS under `"type": "module"`). This is a non-obvious wiring detail that, if not recorded, will be re-discovered on the next project.

## Decision

- Use **`electron-vite`** as the single build tool for all three targets (main, preload, renderer). One config: `electron.vite.config.ts`. One command: `electron-vite dev` / `electron-vite build`.
- Set `"type": "module"` in `package.json` (Electron 33+ supports ESM in the main process).
- The preload outputs `.mjs`; the main process references it as `../preload/index.mjs`. Main outputs `.js` (ESM under `"type": "module"`).
- `package.json` scripts map to the canonical TASKS.md commands: `dev` = `electron-vite dev` (HMR main + renderer), `build` = `electron-vite build` (3 bundles), `app` = `electron .` (loads `out/main/index.js`, which loads `out/renderer/index.html` in prod).

## Alternatives

- **Manual Vite + `electron .` orchestration** — works, but requires two processes for dev (Vite dev server + Electron watcher), a separate Vite config for the renderer, and hand-rolled build steps for main + preload. More boilerplate, more failure modes, no upside over `electron-vite`.
- **`electron-forge` + Vite plugin** — official Electron toolchain, but its Vite story is less consolidated than `electron-vite`'s three-target model; the auto-update path (ADR 0007) is also stronger with `electron-builder`, which `electron-vite` pairs with cleanly.

## Consequences

- Directory layout is fixed: `src/main/`, `src/preload/`, `src/renderer/`. New features follow this split.
- The `.mjs` preload output is a known wiring trap; any change to `"type": "module"` or the preload build config must keep the main→preload reference in sync.
- `electron.vite.config.ts` is the single place to add build plugins (e.g. alias paths, env injection) for any target.
- Supersedes nothing; complements ADR 0004 (which names Vite for the renderer but not the main/preload build).

## References

- `decisions.md` D-IMPL-3, D-IMPL-4
- `learnings.md` L-8
- `electron.vite.config.ts`
- `package.json` (`"type": "module"`, scripts)
- `src/main/index.ts` (preload path reference)