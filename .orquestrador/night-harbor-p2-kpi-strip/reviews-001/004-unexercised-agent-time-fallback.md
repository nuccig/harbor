---
id: 004
severity: low
status: resolved
location: src/renderer/src/app/selectors.ts:90-91
created: 2026-07-10
---

# `agent-time` lookup's `'—'` fallback branch is never exercised by a test

## Problem

`buildKpiViewModels()` computes agent time as:

```ts
mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value ?? '—'
```

The `?? '—'` fallback (for when `recentUsage` has no "Agent time" entry) is never exercised by any
test — the fixture always contains that label, so this branch is currently dead from a coverage
standpoint. Low severity: the fixture is frozen/stable, and the existing AC-017
unchanged-catalog check would catch an accidental removal of the field indirectly. Still, it's an
unexercised branch in new code, and a silent `'—'` displayed to the user (rather than a build/test
failure) is exactly the kind of thing a direct test would catch immediately.

## Suggested fix

Optional: add a small unit test constructing a `recentUsage`-shaped input without the "Agent
time" label against a testable extraction of the lookup logic, to confirm the `'—'` fallback
renders as expected. Not blocking.

## Resolution

Took the first of the two routes the handoff offered: extracted the lookup as a pure, exported
function rather than mocking the `mock-catalog` module. `src/renderer/src/app/selectors.ts` now
exports:

```ts
export function resolveAgentTime(recentUsage: MockCatalog['recentUsage']): string {
  return recentUsage.find((u) => u.label === 'Agent time')?.value ?? '—'
}
```

`buildKpiViewModels()` calls `resolveAgentTime(mockCatalog.recentUsage)` instead of inlining the
lookup. Added a test in `tests/renderer/model/selectors.test.ts` ("falls back to an em dash when
recentUsage has no Agent time entry") that filters `mockCatalog.recentUsage` down to an array
without the `'Agent time'` label (derived from the fixture, not a hand-built literal array) and
asserts `resolveAgentTime(...)` returns `'—'`; a second assertion in the same test confirms the
happy path still returns the fixture's real value when the label is present, so both branches of
the `??` are directly exercised.

Verified: `npm run lint && npm run typecheck && npm run test` all pass, 185/185 tests (up from
181; +1 from this fix, +3 from issue 002).
