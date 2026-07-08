# Harbor — Agent Contract

## Issue Source

source: nucci-projects

## Stack

- Language: TypeScript + Node 20+
- Desktop: Electron (`node-pty` for PTYs)
- Frontend: React 18+ + Vite
- Storage: SQLite + Drizzle ORM (`better-sqlite3`)
- Credentials: OS keychain (`keytar`)
- Distribution: electron-builder + GitHub Releases + electron-updater
- Background: event loop main process; worker_threads for CPU-bound only
- Verify gate: `npm run lint && npm run typecheck && npm run test`
- Decisions: `docs/adr/` (one decision per file)