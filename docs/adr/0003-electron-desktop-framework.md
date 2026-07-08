# ADR 0003 — Electron as desktop framework

## Status
accepted

## Context
Harbor must run coding agents (opencode, codex, claude-code) via real PTYs so the user can interact with them as live terminals. This requires a desktop app with native process spawning. The project is greenfield; the user chose Electron over Tauri (Rust backend) to keep the entire stack TypeScript and avoid a second language.

## Decision
Use **Electron** as the desktop framework. The main process spawns PTYs via `node-pty` (native addon) and exposes them to the renderer through IPC.

## Alternatives
- **Tauri + Rust (`portable-pty`)** — proven by Alethe (the fork inspiration), lighter binary (~10MB vs ~150MB). Rejected: user opted to avoid Rust and keep the stack TS-only.
- **Browser-only (no PTY)** — cannot run interactive coding agents as real terminals. Rejected: PTY is a hard requirement.

## Consequences
- Larger binary (~150MB with Chromium bundled) — acceptable for a power-user desktop tool.
- `node-pty` requires a native rebuild per Electron version; wired via `electron-rebuild`.
- Full TypeScript stack; no second language to maintain.
- Auto-update via `electron-updater` (see ADR 0007).