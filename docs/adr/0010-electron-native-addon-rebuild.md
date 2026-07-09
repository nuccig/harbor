# ADR 0010 — Electron native addon rebuild strategy

## Status

accepted

## Context

Harbor ships three native addons — `node-pty`, `better-sqlite3`, `keytar` (ADR 0003, 0005, 0006). Each must be rebuilt against the Electron ABI (which differs from the Node ABI the addon's own install script targets). On Windows with Node 24 and current Visual Studio tooling, two install-time failure modes appeared during the scaffold cycle:

- **MSB8020 (ClangCL not installed)** — Node 24 headers set `clang: 1` by default; `better-sqlite3`'s own install script builds against Node headers, which makes MSVC generate a `ClangCL`-toolset project. Without the optional ClangCL component, `npm install` fails before the postinstall hook runs.
- **MSB8040 (Spectre-mitigated libs missing)** — `node-pty` 1.1.0 hardcodes `SpectreMitigation: 'Spectre'` in `binding.gyp` and `deps/winpty/src/winpty.gyp`. VS does not install Spectre-mitigated libs by default, so the rebuild fails.

Both failures are install-time, repeat on every `npm install`, and silently break onboarding unless the new dev has the exact optional VS components installed. The scaffold needs a deterministic install that works on a clean Windows + VS install.

## Decision

Adopt a three-step install-time strategy, all wired into the `postinstall` script:

1. **`npm install --ignore-scripts`** (documented install command) — skip sub-package build scripts so `better-sqlite3` never builds against Node headers.
2. **`node scripts/patch-node-pty.cjs`** — patch `node-pty`'s `binding.gyp` and `winpty.gyp` to set `SpectreMitigation: 'false'`, sidestepping the missing Spectre-mitigated VS libs.
3. **`electron-rebuild`** (postinstall) — rebuild all three native addons against the Electron ABI (which uses plain MSVC v143, no Clang flag, no Spectre flag).

The `postinstall` script reads: `node scripts/patch-node-pty.cjs && electron-rebuild`. The install command for new contributors is `npm install --ignore-scripts`; this is documented in the onboarding/README.

## Alternatives

- **Plain `npm install` + `postinstall: electron-rebuild`** — fails on Node 24 because `better-sqlite3`'s install script runs before the postinstall hook and triggers MSB8020. Rejected (broken install).
- **Install VS ClangCL + Spectre-mitigated libs** — resolves both MSB8020 and MSB8040 without patches, but adds two optional VS components every contributor must install. Rejected: heavier onboarding than a one-line patch script.
- **Switch to a `better-sqlite3` version that respects `--ignore-scripts`** — already true; the issue is the install script running at all. The flag is the fix.

## Consequences

- `npm install --ignore-scripts` is the canonical install command for this repo (must be documented in the README).
- `scripts/patch-node-pty.cjs` lives in the repo; it runs on every install and is idempotent (no-op if already patched or if `node-pty` is absent).
- **Ceiling**: `node-pty` native code has no Spectre mitigation. Acceptable for a local-first single-user desktop app. If Spectre hardening becomes a hard requirement, install the VS "Spectre-mitigated libs" component and remove the patch script.
- Future native addons added to the project follow the same pattern (`--ignore-scripts` + `electron-rebuild`).
- Supersedes nothing; complements ADR 0003 / 0005 / 0006 (which name the addons but not the rebuild strategy).

## References

- `decisions.md` D-IMPL-5, D-IMPL-6
- `learnings.md` L-5, L-6, L-10
- `scripts/patch-node-pty.cjs`
- `package.json` `postinstall` script