---
name: harbor-electron-ipc
description: >
  Governs the four-point IPC wiring between the Electron renderer and main process. Auto-triggers
  when a new renderer→main IPC call is added or when src/shared/ipc.ts, src/preload/index.ts, or
  src/main/index.ts IPC handlers are modified. Do not trigger for main-process-only code or
  renderer-only UI work with no IPC.
---

# Harbor — Electron IPC wiring

All renderer → main communication goes through a four-point wiring enforced by **ADR 0011**
(security baseline). The renderer never touches Node APIs directly — `nodeIntegration` is
`false` and `contextIsolation` is `true` from the scaffold.

## Mandatory pipeline (on adding a renderer→main IPC call)

1. **Channel constant** — add a typed channel name to `src/shared/ipc.ts`.
2. **`ipcMain.handle`** — register the handler in `src/main/index.ts` using the channel constant.
3. **Preload `contextBridge`** — expose a typed method on the preload surface in `src/preload/index.ts`.
4. **Typed `window.harbor`** — the renderer calls `window.harbor.<method>()`, never `ipcRenderer`
   directly and never `import 'electron'`.

All four points must be in sync. A channel without a handler, or a preload method without a
`window.harbor` type, is a broken wire.

## Rules (from recorded decisions)

- **ADR 0011**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, preload via
  `contextBridge.exposeInMainWorld`. Dev and prod are identical — no relaxed dev mode.
- **ADR 0011**: `window.harbor` is the single typed surface the renderer may call.
- Channel names are centralized in `src/shared/ipc.ts` — no string literals in handlers or calls.

## Anti-patterns (never)

- **Never** set `nodeIntegration: true` to "make it work" — route through IPC. No shortcuts.
- **Never** `import 'electron'` in renderer code — use `window.harbor.<method>()`.
- **Never** use a string literal for an IPC channel name — import the constant from `src/shared/ipc.ts`.
- **Never** expose a preload method without a matching `window.harbor` type in `src/shared/ipc.ts`.
- **Never** create a "relaxed dev mode" with different security settings — dev and prod are identical (ADR 0011).

## References

- ADR 0011 (security baseline), ADR 0003 (Electron)
- `src/shared/ipc.ts`, `src/main/index.ts` (ipcMain.handle), `src/preload/index.ts` (contextBridge)
- `src/renderer/src/App.tsx` (consumes `window.harbor`)