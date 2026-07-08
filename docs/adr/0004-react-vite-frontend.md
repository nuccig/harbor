# ADR 0004 — React + Vite as frontend stack

## Status
accepted

## Context
The Electron renderer needs a UI framework for the dashboard, kanban, panes, and terminal views. `xterm.js` (the standard PTY renderer) is React-friendly. The project benefits from a mature component ecosystem for dashboards and grids.

## Decision
Use **React 18+ with Vite** as the frontend build tool and framework inside the Electron renderer.

## Alternatives
- **Vue + Vite** — lighter, good DX, but a thinner ecosystem for terminal/dashboards.
- **Svelte + Vite** — smallest bundle, but fewer mature libraries for the dashboard/kanban use case.

## Consequences
- `xterm.js` integrates naturally via React components.
- Mature ecosystem for UI components (kanban, tables, charts).
- Same stack as Alethe (proven for this exact domain).
- Vite gives fast HMR during development; build outputs load into Electron's renderer.