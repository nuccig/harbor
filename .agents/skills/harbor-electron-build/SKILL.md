---
name: harbor-electron-build
description: >
  Governs the electron-vite build config and ESM wiring for the three Electron targets
  (main, preload, renderer). Auto-triggers when electron.vite.config.ts, src/main/,
  src/preload/, or the package.json build/type config is touched. Do not trigger for
  renderer-only React component work (that's frontend, not build wiring).
---

# Harbor — electron-vite + ESM build wiring

The project uses `electron-vite` to consolidate three build targets (main, preload, renderer)
into one config. The ESM + preload `.mjs` wiring is a known trap — **ADR 0013** locks it.

## Mandatory pipeline (on touching build config)

1. `electron.vite.config.ts` is the **single** config for all three targets. Do not add
   separate Vite configs.
2. `"type": "module"` in `package.json` → main outputs `.js` (ESM), preload outputs `.mjs`.
3. The main process references the preload as `../preload/index.mjs` (not `.js`). If this
   reference breaks, the preload silently fails to load.
4. Scripts map to canonical TASKS.md commands: `dev` = `electron-vite dev`, `build` =
   `electron-vite build`, `app` = `electron .`.
5. Directory layout is fixed: `src/main/`, `src/preload/`, `src/renderer/`. New code follows
   this split.

## Rules (from recorded decisions)

- **ADR 0013**: `electron-vite` is the single build tool. One config, one command per action.
- **ADR 0004**: React + Vite for the renderer (subsumed by electron-vite's renderer target).
- **L-8**: preload `.mjs` output is non-obvious under `"type": "module"` — the sandbox resolves
  `.js` as CommonJS, which breaks. `.mjs` is required.

## Anti-patterns (never)

- **Never** change `"type": "module"` to `"commonjs"` without updating the preload output
  extension and the main→preload reference in sync.
- **Never** add a second Vite config for the renderer — `electron.vite.config.ts` covers it.
- **Never** reference the preload as `.js` under `"type": "module"` — it must be `.mjs`.
- **Never** put main/preload/renderer code outside their fixed directories.

## References

- ADR 0013 (electron-vite + ESM), ADR 0004 (React + Vite)
- `electron.vite.config.ts`, `package.json` (`"type": "module"`, scripts)
- Learning L-8