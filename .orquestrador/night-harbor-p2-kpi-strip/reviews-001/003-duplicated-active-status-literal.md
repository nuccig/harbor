---
id: 003
severity: low
status: resolved
location: src/renderer/src/app/selectors.ts:88; src/renderer/src/shell/Shell.tsx (mapSessionStatusToTone)
created: 2026-07-10
---

# "Running" as the definition of "active" is duplicated across two files with no shared source of truth

## Problem

`buildKpiViewModels()` in `src/renderer/src/app/selectors.ts:88` derives the active-agents KPI via
`mockCatalog.sessions.filter((s) => s.status === 'Running').length`. `mapSessionStatusToTone` in
`src/renderer/src/shell/Shell.tsx` independently encodes the same domain fact — that `'Running'`
is the "active" status — for a different purpose (tone mapping). The string `'Running'` as "what
counts as active" is now tribal knowledge duplicated across two files rather than a single named
source of truth. ADR-0001 discusses and accepts this coupling (R2, "FECHADO"), and a
fixture-derived test guards the current value, so this is not a functional defect — but it is a
minor maintainability smell: if a future status value (e.g. a new "Paused" state) needs to be
considered "active" too, both call sites need to be found and updated in lockstep, with nothing
enforcing that.

## Suggested fix

Optional, non-blocking: extract a small shared predicate (e.g. `isSessionActive(status)`)
colocated with `mapSessionStatusToTone`, and have both `buildKpiViewModels()` and the tone mapper
call it, so "what counts as active" has one definition.

## Resolution

**Decision: extracted the shared predicate** (not documented `wontfix`) — the fix is a two-line,
low-risk change that removes the smell outright rather than just narrating it, and the dependency
direction the handoff called out (`app/` must not import from `shell/`) is trivially respected
because `Shell.tsx` already imports from `../app/selectors` (`selectShellView`), so adding one more
named import to that existing, already-correctly-directed edge costs nothing new.

Added `export function isSessionActive(status: string): boolean { return status === 'Running' }`
to `src/renderer/src/app/selectors.ts` (app/ layer), directly above `buildKpiViewModels`, which now
calls `mockCatalog.sessions.filter((s) => isSessionActive(s.status))` instead of the inline
`s.status === 'Running'` comparison.

`src/renderer/src/shell/Shell.tsx` now imports `isSessionActive` from `../app/selectors` alongside
`selectShellView`, and `mapSessionStatusToTone` checks `isSessionActive(status)` first (returning
`'success'`) before falling through to its existing `switch` for `'Ready'`/`'Complete'`/default —
same external behavior, single source of truth for "what counts as active" instead of two
independent literals.

This does not contradict ADR-0001 R2 ("FECHADO") — that ADR accepts `Shell.tsx` importing
domain-mapping helpers from `app/`, which is exactly the direction this fix uses; it only removes
the specific duplicated-literal smell, it doesn't reopen the ADR's broader coupling discussion.

Verified: `npm run lint && npm run typecheck && npm run test` all pass, 185/185 tests (no existing
test needed to change — `mapSessionStatusToTone`'s external behavior is unchanged, and the
`shell-settings.test.tsx` StatusChip tone assertions for `'Running'` → `success` still pass
unmodified).
