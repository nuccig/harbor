---
name: harbor-electron-smoke-test
description: >
  Governs tests that exercise native addons (node-pty, better-sqlite3, keytar) which cannot
  run under plain Node due to ABI mismatch. Auto-triggers when a test file imports or spawns
  a native addon, or when a test fails with an ABI/version mismatch error. Do not trigger for
  pure-TypeScript unit tests with no native binding.
---

# Harbor — Electron native-addon smoke test pattern

Native addons are rebuilt against the Electron ABI (ADR 0010). Running them under plain Node
(vitest's default) causes an ABI mismatch crash. The smoke-test pattern spawns the Electron
binary to run the addon in the correct runtime, then parses the result.

## Mandatory pipeline (on writing a test that touches a native addon)

1. Write a self-check CJS script that exercises the addon and outputs a JSON result marked
   with `__SMOKE_RESULT__` (so vitest can parse it out of stdout).
2. The vitest test spawns the Electron binary with the self-check script as an argument.
3. The test captures stdout, extracts the `__SMOKE_RESULT__` JSON, and asserts on it.
4. Use `tests/smoke.test.ts` as the template — it already wires this for AC-005/006/008/009/010.
5. Never import a native addon directly in a vitest test file — the ABI mismatch crashes Node.

## Rules (from recorded decisions)

- **ADR 0010**: native addons are rebuilt against Electron, not Node.
- **L-9**: plain-Node tests on Electron-rebuilt addons fail with ABI mismatch. Spawn Electron.
- **L-11**: ACs that require GUI/interactivity must be flagged `requires-manual-verify: true`;
  the smoke pattern covers *runtime* checks, not *interactive* ones.

## Anti-patterns (never)

- **Never** `import 'better-sqlite3'` or `import 'node-pty'` directly in a `.test.ts` file run
  by vitest — ABI mismatch. Spawn the Electron binary instead.
- **Never** mark a GUI-dependent AC as auto-verified because a smoke test passed — smoke tests
  verify runtime wiring, not interactive behavior (L-11).
- **Never** run smoke tests without a built Electron binary present (`npm run build` first if
  the test loads from `out/`).

## Template

See `tests/smoke.test.ts` — it spawns Electron, runs a self-check, parses `__SMOKE_RESULT__`,
and asserts. Copy this structure for any new native-addon test.

## References

- ADR 0010 (rebuild strategy), L-9 (smoke pattern), L-11 (GUI AC deferral)
- `tests/smoke.test.ts`