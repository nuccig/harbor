---
id: 004
severity: low
status: open
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

<Filled by sdd-fix-review: what changed, or the rationale for `wontfix`.>
