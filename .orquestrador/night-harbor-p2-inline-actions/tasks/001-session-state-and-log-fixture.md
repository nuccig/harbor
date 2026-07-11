---
id: 001
title: Live session state — pausedSessionIds slice + sessionLogs fixture + resolved SessionViewModel selector
status: pending
depends_on: []
parallel_ok: false   # plan R6 recommends sequential T1→T2→T3 (see Context — escape hatch exists but is not taken here)
covers: [AC-001, AC-002, AC-003, AC-013, AC-017, AC-019]
ears_pattern: WHEN/THEN, GIVEN/WHEN/THEN, AFTER/THEN
verify:
  - npm run lint
  - npm run typecheck
  - npm run test
created: 2026-07-10
---

# Task 001 — Live session state + log fixture + resolved view model

## Goal

Give the experience a live, seed-agnostic `pausedSessionIds` slice with a pure toggle action,
extend the mock catalog with a deterministic `sessionLogs` fixture, and add a single merge
selector `selectSessionViews()` that resolves **all** session→presentation mapping (status,
tone, action matrix, aria-labels, log lines) once — so the two Shell call sites (built in Task
003) and the KPI derivation become dumb consumers of an already-resolved view model. This is
the data/state foundation the other two tasks build on; it does not touch React rendering.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/app/experience-model.ts`
- `src/renderer/src/app/mock-catalog.ts`
- `src/renderer/src/app/selectors.ts`
- `tests/renderer/model/experience-model.test.ts`
- `tests/renderer/model/selectors.test.ts`

Do **not** touch: `src/renderer/src/ui/*`, `src/renderer/src/shell/*`, `src/renderer/src/App.tsx`,
`src/renderer/src/concepts/**`, `tests/renderer/setup.ts`, `tests/renderer/ui/*`,
`tests/renderer/shell/*`, `package.json`/`package-lock.json`.

## Governing skill

None. There is no dedicated skill for this codebase's `selectors.ts`/`mock-catalog.ts`
view-model convention — follow the established in-repo pattern (`selectScenarioSlice`,
`freezeItems`, `freezeArray`) directly, per ADR-0001 and `plan.md §Data & contracts`.

## Steps

### 1. `experience-model.ts` — state + action + reducer case

Current shape (read before editing): `ExperienceState` (lines 63–77 today) ends with
`toast: ToastMessage | null`; `ExperienceAction` (lines 95–118) ends with
`{ type: 'recoverScenario' }`; `createInitialExperienceState()` (lines 149–165) ends with
`toast: null`; `experienceReducer`'s switch (lines 171–251) ends with `case 'recoverScenario'`.

- Add `pausedSessionIds: readonly string[]` as a new field on `ExperienceState` (any position;
  appending after `toast` is fine and keeps the diff minimal).
- Add `{ type: 'toggleSessionPaused'; sessionId: string }` as a new member of the
  `ExperienceAction` union (append after `recoverScenario`).
- Add `pausedSessionIds: []` to the object returned by `createInitialExperienceState()`
  (AC-013 by construction — every fresh session starts with nothing paused).
- Add a new `case 'toggleSessionPaused':` to `experienceReducer`'s switch, exact logic from
  `plan.md §"experience-model.ts — slice + ação (ADR-0001)"`:

  ```ts
  case 'toggleSessionPaused': {
    const isPaused = state.pausedSessionIds.includes(action.sessionId)
    return {
      ...state,
      pausedSessionIds: isPaused
        ? state.pausedSessionIds.filter((id) => id !== action.sessionId)
        : [...state.pausedSessionIds, action.sessionId]
    }
  }
  ```

  Pure, no side effects, **no import of `mock-catalog.ts`** (ADR-0001 Decision #2 — the reducer
  stays seed-agnostic; the "is this session actually pausable" guard lives in the selector, not
  here — see step 3). Adding an import from `mock-catalog.ts` here would create a reverse
  module dependency against the existing `mock-catalog.ts → experience-model.ts` type-only
  import (line 1–8 of `mock-catalog.ts`) — do not do this.

### 2. `mock-catalog.ts` — `SessionLogLine` type + `sessionLogs` fixture block

- Add `export interface SessionLogLine { time: string; text: string }` near the top of the file
  (alongside the other type exports, before the `mockCatalog` const).
- Add a new top-level `sessionLogs` property to the `mockCatalog` object (any position, e.g.
  after the existing `kpis` block at line 137–146). **Type it explicitly** —
  `sessionLogs: Object.freeze<Readonly<Record<string, readonly SessionLogLine[]>>>({...})` —
  because without the explicit `Record<string, …>` annotation TS infers a closed union of the
  3 literal keys used in the object literal, and later `mockCatalog.sessionLogs[session.id]`
  (step 3, where `session.id: string`) would fail to typecheck against that narrower inferred
  type.
- Copy the **exact** 24 log lines (3 sessions × 8/7/9 entries) from
  `plan.md §"mock-catalog.ts — bloco novo sessionLogs (G2/AC-007; conteúdo exato, congelado)"`
  verbatim — do not paraphrase, reorder, or re-time them; these are D-012 copy, closed at the
  gate. Reproduced here only as the load-bearing literal (plan.md remains the source of truth
  if the two ever diverge):

  - `session-104` (Running, 8 lines, `09:41:02`→`09:45:20`, ends "Awaiting next instruction")
  - `session-103` (Ready, 7 lines, `09:12:44`→`09:16:23`, ends "Session idle · waiting for review")
  - `session-102` (Complete, 9 lines, `08:03:17`→`08:13:01`, ends "Session complete")

  Each entry uses the existing `freezeItems([...])` helper (already imported/defined in this
  file) — wrap each session's array in `freezeItems([...])`, and the whole `sessionLogs` map
  in `Object.freeze({...})` as shown in the plan.
- Leave every existing `mockCatalog.sessions` entry (ids, agent, task, status) byte-for-byte
  unchanged — AC-019. Do not add, remove, or reorder any session entries.

### 3. `selectors.ts` — status/tone types, `sessionActionLabels`, `SessionViewModel`, `selectSessionViews`, `buildKpiViewModels` signature change

Current file (read before editing): `isSessionActive` at lines 90–92; `buildKpiViewModels()`
(no-arg) at lines 100–130 computing `activeAgents` from `mockCatalog.sessions.filter(...)`
directly; `OverviewViewModel` interface at lines 180–187 with
`sessions: ScenarioSlice<typeof mockCatalog.sessions>`; `selectOverviewView` at lines 189–208
building the `sessions:`/`kpis:` fields independently.

- Add `export type SessionRuntimeStatus = 'Running' | 'Paused' | 'Ready' | 'Complete'` and
  `export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'`.
- Add an **exported** `sessionActionLabels(session: { agent: string; task: string })` function —
  the copy is D-012, exact and frozen (also quoted in `memory/handoff-002.md` as the
  fast-reference — this is the authoritative body):

  ```ts
  export function sessionActionLabels(session: { agent: string; task: string }) {
    return {
      pause: `Pause session ${session.agent}: ${session.task}`,
      resume: `Resume session ${session.agent}: ${session.task}`,
      log: `Session log for ${session.agent}: ${session.task}`
    }
  }
  ```

  This is exported specifically so Task 002's and Task 003's tests can derive expected
  accessible names from the fixture instead of hardcoding strings (constitution
  `css-module-class-asserts` learning extends to copy strings, not just class names, per
  existing codebase test style).
- Add a **module-private** (not exported) `mapSessionStatusToTone(status: SessionRuntimeStatus)`
  helper used only inside `selectSessionViews`, per `plan.md`:

  ```ts
  function mapSessionStatusToTone(status: SessionRuntimeStatus): StatusTone {
    if (isSessionActive(status)) return 'success'
    switch (status) {
      case 'Ready':
      case 'Paused':
        return 'warning'
      default:
        return 'neutral'
    }
  }
  ```

  **Naming note**: `Shell.tsx` (Task 003's scope, not this task's) currently has its own local
  function with the exact same name and near-identical body (`Shell.tsx:33-45`, missing the
  `Paused` case). That is expected and temporary — the two same-named functions live in
  different files/modules so there is no compile conflict, and Task 003 deletes the `Shell.tsx`
  copy once it switches the two render call sites to read the pre-resolved `statusTone` field
  off the view model instead of computing it locally. Do not touch `Shell.tsx` in this task.
- Add `export interface SessionViewModel { ... }` and `export function selectSessionViews(state)`
  exactly per `plan.md §"selectors.ts — merge único + view model RESOLVIDO + KPI vivo"` — the
  full authoritative interface and function body live there; the two structurally load-bearing
  points to get right:
  - `status` is computed as `state.pausedSessionIds.includes(session.id) && isSessionActive(session.status) ? 'Paused' : (session.status as SessionRuntimeStatus)`
    — the `as SessionRuntimeStatus` cast is required because `mockCatalog.sessions[number].status`
    is typed as plain `string` (the fixture array isn't declared `as const`), and the guard
    `isSessionActive(session.status)` is what stops a stray id in `pausedSessionIds` from
    ever painting a Ready/Complete session as Paused.
  - `logLines: mockCatalog.sessionLogs[session.id] ?? []` — the `?? []` is defensive (every
    seed id has a block by construction; the invariant is asserted in this task's own test,
    step 4 below, so a future catalog edit that drops a session's log block fails loudly in
    this test rather than silently rendering an empty panel).
- Change `buildKpiViewModels()` from a no-arg function reading `mockCatalog.sessions` directly
  to `buildKpiViewModels(sessions: readonly SessionViewModel[])`, replacing the internal
  `mockCatalog.sessions.filter((s) => isSessionActive(s.status))` with
  `sessions.filter((s) => isSessionActive(s.status))`. This function is **not exported** and has
  exactly one caller (`selectOverviewView`, same file) — no other module references it, so this
  signature change is fully contained within this task's file scope.
- Change `OverviewViewModel.sessions` field type from `ScenarioSlice<typeof mockCatalog.sessions>`
  to `ScenarioSlice<readonly SessionViewModel[]>` (additive — every field the old type had is
  still present on `SessionViewModel` via the `...session` spread in `selectSessionViews`, plus
  new presentation fields; existing readers of `.agent`/`.task`/`.id`/`.status` keep compiling).
- In `selectOverviewView`, compute the merge **once** and feed both dependent fields — this is a
  single coherent edit inside one function, not two separate changes (see
  `memory/handoff-002.md` Descoberta #3):

  ```ts
  const sessions = selectSessionViews(state)
  // …
  sessions: selectScenarioSlice(state, sessions, overviewCopy.sessions),
  // …
  kpis: selectScenarioSlice(state, buildKpiViewModels(sessions), overviewCopy.kpis)
  ```

  Leave `overviewCopy.sessions` and every other field of `selectOverviewView` (currentProject,
  issueQueue, recentUsage, activity) untouched.

**Self-verifiability check (informational, not a step)**: `Shell.tsx` is not in this task's
scope and is not edited here. Because `SessionViewModel` is a structural superset of
`mockCatalog.sessions[number]` (same `id`/`agent`/`task`/`status` shape, `status` narrowed to a
string-compatible union, plus new fields), `Shell.tsx`'s existing (untouched) consumption of
`overview.sessions` — `session.agent`, `session.task`, `mapSessionStatusToTone(session.status)`
— keeps typechecking against the new `SessionViewModel[]` without any change on the `Shell.tsx`
side. This task's own `npm run typecheck`/`npm run test` should pass standalone, before Task 002
or Task 003 exist in the tree — mirrors the self-verifiability note in the P2.3 precedent task
file (`001-kpi-data-model.md §Validation criteria`).

### 4. Extend `tests/renderer/model/experience-model.test.ts`

Follow the existing file's style (`reduce()` helper already defined at the top; `it.each` for
enumerable variants; `toEqual({...state, field: …})` for "only this field changed" assertions).

- `createInitialExperienceState().pausedSessionIds` is `[]` (use `.toEqual([])`, not `.toBe`).
- Toggling a fresh id adds it: `experienceReducer(state, { type: 'toggleSessionPaused', sessionId: 'session-104' })`
  → `next.pausedSessionIds` contains `'session-104'`, and `next` otherwise equals
  `{ ...state, pausedSessionIds: [...state.pausedSessionIds, 'session-104'] }` (mirrors the
  existing "only this field changed" assertion idiom already used throughout this file).
- Toggling the same id twice is idempotent: apply the action twice via the existing `reduce()`
  helper and assert the result deep-equals the state before either toggle (round-trip).
- Toggling two different ids and then removing one preserves the other (basic set-membership
  sanity, avoids a reducer bug that clears the whole array instead of filtering one id).

### 5. Extend `tests/renderer/model/selectors.test.ts`

Follow the existing file's style (`withScenario()` helper already defined; `describe` blocks
grouped by concern — this task adds a new `describe('session view models', …)` block, mirroring
the existing `describe('KPI view models', …)` block added in the P2.3 run).

- **Default (no toggles) ≡ seed**: for every `mockCatalog.sessions` entry, the corresponding
  `selectSessionViews(createInitialExperienceState())` entry has the same `id`/`agent`/`task`/
  `status` as the seed, `paused === false`, and `statusTone`/`canTogglePause`/`togglePauseLabel`/
  `logLabel` consistent with that status (derive the expected values from
  `sessionActionLabels(session)` and the status→tone/matrix rules — never hardcode a tone
  string or label per session; loop over the fixture).
- **Pause transition**: dispatch `toggleSessionPaused` for the seed's Running session (find it
  by filtering `mockCatalog.sessions` for `status === 'Running'` — do not hardcode the id) →
  resulting view has `status === 'Paused'`, `statusTone === 'warning'`, `paused === true`,
  `canTogglePause === true`, `togglePauseLabel === sessionActionLabels(session).resume`.
- **Guard — spurious id never repaints a non-active session**: dispatch `toggleSessionPaused`
  for the seed's Ready (or Complete) session id — since the reducer is seed-agnostic (step 1),
  this successfully adds that id to `pausedSessionIds`, but `selectSessionViews` must still
  report that session's `status` as its original seed status (`'Ready'`/`'Complete'`), not
  `'Paused'` — this is the `isSessionActive` guard from `plan.md`, and the only test that
  actually exercises it.
- **KPI recompute after transition**: with the Running session paused, `buildKpiViewModels`
  (exercised via `selectOverviewView(...).kpis`) reports `active-agents` value ===
  `String(runningCountBeforePause - 1)`, where `runningCountBeforePause` is derived from
  `mockCatalog.sessions.filter((s) => s.status === 'Running').length` in the test — never a
  literal.
- **Log fixture invariant**: for every `mockCatalog.sessions[i].id`, `mockCatalog.sessionLogs[id]`
  exists, has `6 <= length <= 10` (this is the G2/AC-007 log-line range — distinct from the
  separate 8–12 KPI-series range already tested elsewhere in this file; do not conflate the
  two), and every `time` value within that session's block is unique (assert via
  `new Set(lines.map((l) => l.time)).size === lines.length`) — this is the invariant the `key`
  prop in Task 002's/Task 003's rendered `<ol>` will rely on (handoff-002.md risk: duplicate
  `key` breaks React silently without an obvious test failure unless this invariant is asserted
  here).
- **AC-019 (frozen/unchanged seed)**: after a sequence of several `toggleSessionPaused`
  dispatches (pause + resume + pause a different session), `mockCatalog.sessions` remains
  `Object.isFrozen(...)` and deep-equal to its value captured before any dispatch; and calling
  `selectSessionViews` on the *initial* (untouched) state still produces the seed-equivalent
  merge (this overlaps with "default ≡ seed" above but specifically re-asserts it *after*
  exercising the reducer on a *separate* state object, to prove no shared mutation occurred).

## Acceptance check

- [ ] AC-001/002/003 (data half): `selectSessionViews` produces `canTogglePause` `true` for
      every Running/Paused seed-derived view and `false` for every Ready/Complete one — the
      matrix is data, testable without React (the DOM half — actual button count — is Task
      002's/Task 003's concern).
- [ ] AC-013: `createInitialExperienceState().pausedSessionIds` is `[]` by construction; a fresh
      provider mount always starts with no session paused, regardless of prior dispatches in a
      previous mount (in-memory only, no persistence import anywhere in this task's files).
- [ ] AC-017 (data half only — the audit itself is `memory/contrast-audit.md`, already done in
      the plan phase, not this task's responsibility): the tone this task assigns to Paused is
      exactly `'warning'` (same tone as Ready, per ADR-0002) — this is the mapping the audit was
      performed against; do not invent a different tone.
- [ ] AC-019: `mockCatalog.sessions` is byte-for-byte unchanged from before this task, stays
      frozen through any sequence of `toggleSessionPaused` dispatches, and the default merge
      (no dispatches) is equivalent to the seed for every session.
- [ ] No import of `mockCatalog`/`mock-catalog.ts` inside `experience-model.ts`'s reducer or
      action types (ADR-0001 — seed-agnostic reducer; a grep for `mock-catalog` in
      `experience-model.ts` should return nothing).
- [ ] `mockCatalog.sessionLogs` type-checks when indexed by `session.id: string` (i.e., the
      explicit `Record<string, readonly SessionLogLine[]>` annotation from step 2 is present —
      omitting it is a typecheck failure, not a runtime one, so it will surface in
      `npm run typecheck`).

## Validation criteria

`npm run lint`, `npm run typecheck`, and `npm run test` green for the tree containing only this
task's files changed (Task 002/Task 003 files do not exist yet in this task's own verification
run — that is expected, per the self-verifiability note in step 3). This task is the most
upstream of the three and fully self-verifiable in isolation.

## Context

- Full rationale for the state shape, the seed-agnostic reducer, and the single-merge-selector
  design: [ADR-0001](../adr/0001-live-session-state-slice.md). Do not re-derive or second-guess
  it here — in particular, do not reach for a `Record<string, status>` overrides map or a full
  session snapshot in state; both were considered and rejected (ADR-0001 Alternatives).
- The `mapSessionStatusToTone`/tone-assignment rationale (Paused reuses `warning` + `Pause`
  icon, no 5th tone) is [ADR-0002](../adr/0002-paused-status-warning-tone-reuse.md) — the actual
  numeric contrast re-audit for the Paused/Ready pair is `memory/contrast-audit.md`, not
  anything this task computes or re-verifies.
- Downstream consumer heads-up (informational, not a blocker): Task 002's component test
  (`tests/renderer/ui/session-card.test.tsx`) imports `selectSessionViews` and
  `sessionActionLabels` from this task's `selectors.ts`, and reads `mockCatalog.sessionLogs`
  indirectly through the view model, to derive its own render assertions without hardcoding.
  Task 003 imports `selectSessionViews` directly for the Sessions board and relies on
  `SessionCard`'s props matching this task's `SessionViewModel` field names exactly (structural
  compatibility, no shared import — see Task 002's own "zero imports of `app/`" constraint).
  Neither of those files is in this task's scope; this task does not need to coordinate with
  them beyond keeping the field names in `plan.md`'s contract.
- Do not implement, stub, or reference `SessionCard`, `IconButton`, `StatusChip`, or any React
  rendering in this task — this task is pure state/selector logic, zero JSX, zero `.tsx` files
  changed.
