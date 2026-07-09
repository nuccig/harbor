# ADR 0012 — harbor.db path (dev vs prod)

## Status

proposed (awaiting approval to promote to `docs/adr/`)

## Context

ADR 0005 fixes SQLite as the storage and `harbor.db` as the single file, but does not say where the file lives. Dev and prod have conflicting needs:

- **Dev** wants the database file in the repo working tree (gitignored) so it can be deleted, inspected, swapped, and reset trivially between runs. Hunting for it under `%APPDATA%/harbor/` adds friction to every debug session.
- **Prod** wants the database isolated per user and per OS, following the Electron convention (`app.getPath('userData')`), so it survives app updates and respects OS-level user separation.

Switching on `NODE_ENV` is a one-line ternary; introducing a config file or an env var for this is boilerplate for a value that changes exactly twice (dev vs prod).

## Decision

- **Dev** (`NODE_ENV !== 'production'`): `harbor.db` at `process.cwd()/harbor.db`, gitignored.
- **Prod** (`NODE_ENV === 'production'`): `harbor.db` at `app.getPath('userData')/harbor.db`.
- Switch is a ternary in `resolveDbPath()` in `src/main/index.ts`. No config file, no extra env var.

## Alternatives

- **`userData` in both dev and prod** — rejected. Debugging a database hidden under `%APPDATA%/harbor/` is friction; devs will write throwaway scripts to find/delete it. The repo-local dev path is cheaper.
- **A dedicated env var (`HARBOR_DB_PATH`)** — YAGNI. The dev/prod split is the only axis that matters; `NODE_ENV` already encodes it.
- **A config file** — same YAGNI; adds a parse step and a fail mode for a single ternary's worth of logic.

## Consequences

- `.gitignore` must keep `harbor.db`, `harbor.db-wal`, `harbor.db-shm` ignored so dev runs do not leak the dev DB into git.
- Features that touch the DB get the path via `resolveDbPath()` (or via the opened database passed from main); they must not hardcode a location.
- If a future feature needs multiple databases (e.g. a separate cache DB), the same dev/prod split applies — extend `resolveDbPath` with a filename argument rather than introducing a new mechanism.
- Supersedes nothing; complements ADR 0005 (which names the storage but not the path).

## References

- `decisions.md` D-IMPL-1
- `src/main/index.ts` (`resolveDbPath`)
- `.gitignore`