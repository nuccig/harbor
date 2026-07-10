---
id: 003
severity: low
status: open
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

<Filled by sdd-fix-review: what changed, or the rationale for `wontfix`.>
