# ADR 0005 — SQLite + Drizzle ORM for local storage

## Status
accepted

## Context
Harbor is local-first desktop, single-user. It persists projects, synced issues (Linear/GitHub/nucci-projects), PTY sessions, token/consumption tracking, and harness config. These have real relations (project → issues → sessions → consumption) that justify relational storage over flat files.

## Decision
Use **SQLite** (single file, no server) with **Drizzle ORM** for type-safe schema, migrations, and queries in TypeScript.

## Alternatives
- **SQLite + Knex** — mature query builder, but less type-safe than Drizzle and no schema-as-code-first DX.
- **JSON / LowDB** — simplest, but breaks down once relations and queries grow; no relational integrity.
- **Prisma** — powerful, but heavy for a desktop app (query engine binary, slower cold start).

## Consequences
- One file (`harbor.db`) holds all state; easy backup/ export.
- Drizzle provides type-safe queries and schema migrations with minimal runtime overhead.
- No server process; SQLite is embedded in the Electron main process via `better-sqlite3`.
- `better-sqlite3` is a native addon — needs `electron-rebuild` (same as `node-pty`).