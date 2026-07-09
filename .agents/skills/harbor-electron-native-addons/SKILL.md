---
name: harbor-electron-native-addons
description: >
  Governs adding, upgrading, or rebuilding native addons (node-pty, better-sqlite3, keytar,
  or any new one) in this Electron project. Auto-triggers when package.json gains a native
  dependency, when scripts/patch-*.cjs is touched, or when a rebuild fails with MSB8020/MSB8040.
  Do not trigger for pure-TypeScript deps with no native binding.
---

# Harbor — Electron native addons

This project ships native addons that must be rebuilt against the Electron ABI, not the Node
ABI. The rebuild strategy is locked by **ADR 0010** and must be followed on every install
and every native-addon change.

## Mandatory pipeline (on add/upgrade a native addon)

1. Add the dep to `package.json` `dependencies` (not devDependencies — it ships).
2. Document the install command as `npm install --ignore-scripts` (never plain `npm install`
   — sub-package install scripts build against Node headers and fail on Node 24+).
3. Ensure the `postinstall` script runs `node scripts/patch-node-pty.cjs && electron-rebuild`.
4. If the new addon has its own install-script-vs-Node-headers pitfall (like better-sqlite3's
   clang flag), add a patch script alongside `scripts/patch-node-pty.cjs` and chain it into
   postinstall **before** `electron-rebuild`.
5. Run `npm install --ignore-scripts` then `npm run postinstall` (or the full install) and
   confirm the addon loads under Electron (not just under Node — ABI differs).

## Rules (from recorded decisions)

- **ADR 0010**: `--ignore-scripts` + patch + `electron-rebuild` is the canonical install.
- **ADR 0003/0005/0006**: node-pty, better-sqlite3, keytar are the three initial native addons.
- **Ceiling (ADR 0010)**: node-pty native code has no Spectre mitigation. Acceptable for a
  local-first single-user desktop app. If Spectre hardening becomes a requirement, install
  the VS "Spectre-mitigated libs" component and remove `scripts/patch-node-pty.cjs`.

## Anti-patterns (never)

- **Never** run plain `npm install` and trust the postinstall alone — better-sqlite3's install
  script runs *before* postinstall and fails (MSB8020) on Node 24+.
- **Never** rebuild a native addon against Node headers and ship it — it will crash under
  Electron with an ABI mismatch.
- **Never** add a native addon without documenting the install command in the README/onboarding.
- **Never** delete `scripts/patch-node-pty.cjs` without replacing the Spectre workaround (install
  VS Spectre-mitigated libs first, per ADR 0010 ceiling).

## Prerequisites (document for onboarding)

Windows: VS 2022 with C++ toolset v143 + Python 3 + Windows SDK. macOS: Xcode CLT. Linux: build-essential + python3.

## References

- ADR 0010 (rebuild strategy), ADR 0003 (Electron), ADR 0005 (SQLite), ADR 0006 (keychain)
- `scripts/patch-node-pty.cjs`, `package.json` postinstall
- Learnings L-5, L-6, L-10