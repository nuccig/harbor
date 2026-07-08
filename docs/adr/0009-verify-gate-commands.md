# ADR 0009 — Verify gate commands

## Status
accepted

## Context
The project needs a deterministic verify gate that the bootstrap and later SDD flows run before any commit or PR. The stack is Electron + React + Vite + TypeScript.

## Decision
The verify gate runs these commands:

| Role       | Command                  |
|------------|--------------------------|
| lint       | `eslint .`               |
| typecheck  | `tsc --noEmit`           |
| test       | `vitest run`             |
| build      | `vite build` (+ `electron-builder` for installers) |
| e2e        | `playwright test` (optional — add when UI is stable) |

## Alternatives
- **Jest instead of Vitest** — works, but Vitest is Vite-native (shares the Vite config, zero extra setup, faster in watch mode).
- **Mandatory Playwright now** — YAGNI; add when there is a stable UI surface worth end-to-end testing.

## Consequences
- The verify gate is: `npm run lint && npm run typecheck && npm run test`.
- `npm run build` produces the renderer bundle; `electron-builder` produces installers (release only).
- Playwright is deferred — install when the first E2E test is written, not before.