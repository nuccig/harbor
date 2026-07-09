# ADR 0011 — Electron security baseline

## Status

proposed (awaiting approval to promote to `docs/adr/`)

## Context

Electron's defaults (`nodeIntegration: true`, `contextIsolation: false`) give the renderer direct access to Node APIs and the filesystem. This is a well-known security debt surface: any XSS in the renderer — a malicious npm package in the React tree, a markdown-rendered payload, a third-party widget — becomes arbitrary code execution with full filesystem and OS access. Migrating an existing app from `nodeIntegration: true` to a preload + `contextBridge` model is invasive: every renderer-to-main call changes shape, preload scripts must be authored, and the IPC surface must be re-typed. Doing this migration later costs more than doing it once at the scaffold.

The scaffold is the cheapest moment to lock the secure baseline: there is no renderer code yet, no IPC surface to migrate, no third-party packages in the tree. The cost is one preload script + a `contextBridge` call. The cost of the insecure-then-migrate path is the same preload work plus a refactor of every existing call site.

## Decision

Set the Electron security baseline from the scaffold, identical in dev and prod:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- A preload script exposes a minimal, explicitly-typed API to the renderer via `contextBridge.exposeInMainWorld`.
- All renderer → main communication goes through typed `ipcRenderer.invoke` / `ipcMain.handle` pairs, with channel names centralized in `src/shared/ipc.ts`.

Dev and prod use the same configuration. There is no "relaxed dev mode."

## Alternatives

- **`nodeIntegration: true` in dev, migrate later** — rejected. The migration cost is higher than the one-time setup cost, and the insecure window during dev is a real attack surface (HMR, sourcemaps, dev-only packages).
- **`contextIsolation: true` without `sandbox: true`** — sandbox further restricts the preload's access to Node APIs, shrinking the trusted surface. The scaffold's preload needs only `ipcRenderer`, which works under sandbox. No reason to leave `sandbox: false`.

## Consequences

- Every new feature that needs a renderer → main call adds (a) a channel constant in `src/shared/ipc.ts`, (b) an `ipcMain.handle` in `src/main/index.ts`, (c) an exposed method on the preload `contextBridge` surface, (d) a typed `window.harbor` method consumed by the renderer. This four-point wiring is the cost of the security baseline; it is intentional and should not be shortcut.
- `window.harbor` is the single typed surface the renderer may call. Renderer code must never import `electron` or use `require`.
- Any feature that genuinely needs Node APIs in the renderer (e.g. a terminal widget reading a PTY stream) routes through IPC, not through `nodeIntegration`.
- Supersedes nothing; complements ADR 0003 (which names Electron but not its security model).

## References

- `decisions.md` D-IMPL-2
- `src/main/index.ts` (BrowserWindow webPreferences)
- `src/preload/index.ts`
- `src/shared/ipc.ts`