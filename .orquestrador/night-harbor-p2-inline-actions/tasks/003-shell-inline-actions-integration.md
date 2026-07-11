---
id: 003
title: Shell integration — both session render points wired to live state via SessionCard
status: pending
depends_on: [001, 002]
parallel_ok: false   # strictly sequential — this task imports directly from both Task 001 and Task 002; no parallelization option exists (plan.md §Task decomposition preview)
covers: [AC-005, AC-006, AC-010, AC-011, AC-012, AC-014, AC-015, AC-016, AC-018, AC-020]   # AC-016: zero-diff em concepts/** confirmado aqui; AC-020: full verify gate + não-regressão (analyze findings 1–2)
ears_pattern: WHEN/THEN, GIVEN/WHEN/THEN, WHERE/WHEN/THEN, WHILE/THEN
verify:
  - npm run lint
  - npm run typecheck
  - npm run test
created: 2026-07-10
---

# Task 003 — Shell integration (both session render points + reduced-motion hook)

## Goal

Wire the two existing session render points in `Shell.tsx` — the Overview panel's
"Active agent sessions" group and the Sessions board — to the live state from Task 001
(`selectSessionViews`, `toggleSessionPaused`) through Task 002's `SessionCard`, so both surfaces
show the same live status/actions for the same session (AC-010) and the KPI "Active agents" tile
tracks pauses (AC-011). Add the shared `useEffectiveReducedMotion()` hook (system preference OR
app setting) and adopt it in `App.tsx`, replacing the inline composition that already exists
there. This is the last of the three tasks — it is the only one that touches rendered
integration behavior end-to-end and therefore the only one that can verify AC-005/006/010–012/
014/015/018 at the level the spec actually requires (interaction, keyboard, cross-surface
consistency).

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/shell/Shell.tsx`
- `src/renderer/src/shell/shell.module.css`
- `src/renderer/src/app/use-reduced-motion.ts`
- `src/renderer/src/App.tsx`
- `tests/renderer/shell/inline-actions.test.tsx` (create)

Do **not** touch: `src/renderer/src/app/experience-model.ts`, `src/renderer/src/app/mock-catalog.ts`,
`src/renderer/src/app/selectors.ts`, `src/renderer/src/ui/*`, `src/renderer/src/concepts/**`,
`tests/renderer/setup.ts`, `tests/renderer/model/*`, `tests/renderer/ui/*`,
`tests/renderer/shell-settings/shell-settings.test.tsx`,
`tests/renderer/integration/app-integration.test.tsx`, `package.json`/`package-lock.json`.

## Governing skill

None — follow the existing `Shell.tsx` component patterns (`ScenarioGroup`, direct
`useExperienceState`/`useExperienceDispatch` calls in board-level function components) already
established in this file for the other groups.

## Steps

### 1. `app/use-reduced-motion.ts` — add `useEffectiveReducedMotion()`

Current file (read before editing) exports `getSystemPrefersReducedMotion()` and
`useReducedMotionPreference()` (composes `motion/react`'s `useReducedMotion` with the system
query). Add a third export that also folds in the app's own setting:

```ts
import { useExperienceState } from './ExperienceProvider'
// … existing imports/exports unchanged …

export function useEffectiveReducedMotion(): boolean {
  const systemOrMotionPreference = useReducedMotionPreference()
  const { settingsDraft } = useExperienceState()
  return systemOrMotionPreference || settingsDraft.reduceMotion
}
```

No import cycle: `ExperienceProvider.tsx` imports only from `./experience-model` today, not from
`./use-reduced-motion`, so `use-reduced-motion.ts` importing `useExperienceState` from
`./ExperienceProvider` is a one-directional, acyclic addition. `app/index.ts` (not in this
task's scope) already does `export * from './use-reduced-motion'` — the new export propagates
through the barrel automatically, no edit needed there.

### 2. `App.tsx` — adopt the hook, remove the duplicated composition

Current (read before editing, lines 1–7 and 33–37):

```tsx
import {
  ExperienceProvider,
  useExperience,
  useReducedMotionPreference
} from './app/index'
// …
const [state, dispatch] = useExperience()
const systemReducedMotion = useReducedMotionPreference()
const reduceMotion = systemReducedMotion || state.settingsDraft.reduceMotion
```

Change to:

```tsx
import {
  ExperienceProvider,
  useExperience,
  useEffectiveReducedMotion
} from './app/index'
// …
const [state, dispatch] = useExperience()
const reduceMotion = useEffectiveReducedMotion()
```

Behavior is identical by construction (same OR of the same two sources); the existing 48
integration tests that exercise `reduceMotion`-dependent rendering (ambient layer suspense
branch, `MotionConfig`) are the regression net here — no new `App.tsx`-specific test is required
by this task (they already cover this path via `tests/renderer/integration/app-integration.test.tsx`,
out of this task's scope, unmodified).

### 3. `shell/shell.module.css` — add `.sessionList` (list layout only)

Current file (read before editing): `.itemList`/`.activityList` rules span lines 153–189 and
back the *other* still-unmigrated lists (issues, activity) — **do not touch, remove, or rename
any of those rules**; sessions are moving off `.itemList` onto a new class, `.itemList` itself
stays exactly as-is for its remaining consumers (issues queue in both Overview and the Issues
board, activity feed). Append (position: anywhere after the existing `.itemList`/`.activityList`
block is fine, e.g. right after it) the layout-only class from
`plan.md §"CSS novo"`'s `shell.module.css` half:

```css
.sessionList {
  display: grid;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.sessionList > li {
  border-block-end: 1px solid var(--border);
  padding-block: var(--space-2);
}

.sessionList > li:last-child {
  border-block-end: 0;
}
```

Note this is deliberately a lighter rule set than `.itemList > li` (no `flex`/`align-items`/
`justify-content`/`min-block-size` — the card itself, not the `<li>`, now owns that internal
layout via `.sessionCard`/`.sessionCardRow` from Task 002).

### 4. `shell/Shell.tsx` — both render points

Current file (read before editing, exact line numbers as of this task's authoring):

- Imports at lines 1–29: `mapSessionStatusToTone` locally declared at lines 33–45 (uses
  `isSessionActive`, imported at line 17 alongside `selectShellView`); `ui` barrel import at
  lines 20–28 (`Button, FocusHeading, MetricTile, SemanticIcon, SkipLink, SkipTarget,
  StatusChip`).
- Overview's sessions `ScenarioGroup` at lines 179–203: `renderReady={(sessions) => (<ul
  className={styles.itemList}>{sessions.map(...)}</ul>)}`, using
  `mapSessionStatusToTone(session.status)` inline per item.
- Static `Sessions()` board function at lines 292–314: no hooks, reads `mockCatalog.sessions`
  directly, same `<ul className={styles.itemList}>` markup duplicated verbatim from the
  Overview block (the exact duplication ADR-0004 names as the deriving pressure for a single
  shared component).

Changes:

- Add `SessionCard` to the `ui` barrel import (alphabetical: `..., SemanticIcon, SessionCard,
  SkipLink, ...`).
- Add `import { useEffectiveReducedMotion } from '../app/use-reduced-motion'` and add
  `selectSessionViews` to the existing `import { isSessionActive, selectShellView } from
  '../app/selectors'` line — **but see the next bullet**, `isSessionActive` itself is about to
  become unused here.
- **Delete** the local `mapSessionStatusToTone` function (lines 33–45) — Task 001 already added
  an equivalent (plus the missing `Paused` case) inside `selectors.ts`, and every session now
  arrives with `statusTone` pre-resolved on the view model, so no call site needs to compute
  tone locally anymore. Once this function is deleted, **also remove `isSessionActive` from the
  `'../app/selectors'` import** — it was only ever used inside the now-deleted function; leaving
  it imported-but-unused is a lint/typecheck risk depending on the exact `tseslint` ruleset, and
  is dead code regardless. (`mapIssuePriorityToTone` and `mapProjectStatusToTone`, the two other
  local mappers in this file, are untouched — they serve issues/project, not sessions, and are
  out of scope.)
- **Overview's sessions group** (`renderReady`): replace the `<ul className={styles.itemList}>`
  body with:

  ```tsx
  renderReady={(sessions) => (
    <ul className={styles.sessionList}>
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionCard
            agent={session.agent}
            canTogglePause={session.canTogglePause}
            logLabel={session.logLabel}
            logLines={session.logLines}
            onTogglePause={() => dispatch({ type: 'toggleSessionPaused', sessionId: session.id })}
            paused={session.paused}
            reduceMotion={reduceMotion}
            statusLabel={session.status}
            statusTone={session.statusTone}
            task={session.task}
            togglePauseLabel={session.togglePauseLabel}
          />
        </li>
      ))}
    </ul>
  )}
  ```

  `dispatch` is already available in `Overview()` (existing `const dispatch =
  useExperienceDispatch()` at the top of the function, line 120) — no new hook call needed for
  it. Add `const reduceMotion = useEffectiveReducedMotion()` once near the top of `Overview()`
  (alongside the existing `state`/`dispatch`/`{ overview }` destructuring), used by this block.
  `overview.sessions`'s `renderReady` callback parameter is now `SessionViewModel[]` (Task 001's
  type change) — no cast needed, it flows through `ScenarioGroup<T>`'s existing generic.
- **Sessions board** (`function Sessions()`): currently a plain function with no hooks. Change
  to:

  ```tsx
  function Sessions() {
    const state = useExperienceState()
    const dispatch = useExperienceDispatch()
    const reduceMotion = useEffectiveReducedMotion()
    const sessions = selectSessionViews(state)

    return (
      <section className={styles.destinationPanel} data-surface="sessions">
        <h2>Agent session board</h2>
        <ul className={styles.sessionList}>
          {sessions.map((session) => (
            <li key={session.id}>
              <SessionCard
                agent={session.agent}
                canTogglePause={session.canTogglePause}
                logLabel={session.logLabel}
                logLines={session.logLines}
                onTogglePause={() => dispatch({ type: 'toggleSessionPaused', sessionId: session.id })}
                paused={session.paused}
                reduceMotion={reduceMotion}
                statusLabel={session.status}
                statusTone={session.statusTone}
                task={session.task}
                togglePauseLabel={session.togglePauseLabel}
              />
            </li>
          ))}
        </ul>
      </section>
    )
  }
  ```

  `useExperienceState`/`useExperienceDispatch` are already imported at the top of `Shell.tsx`
  (lines 11–13, used by `Overview()`/`Shell()`) — reuse those same imports, do not re-import.
  This is the one place the board genuinely changes character: it goes from a static function
  reading the frozen catalog directly to a stateful one deriving from
  `selectSessionViews(state)` — matches AC-010/ADR-0001 ("board Sessions chama
  selectSessionViews direto... ganhando estado; segue sem cenários, paridade com hoje" — no
  `ScenarioGroup`/`ScenarioPresenter` wrapper is added here, matching the board's existing
  no-scenario behavior for every other destination).

### 5. `tests/renderer/shell/inline-actions.test.tsx` (new file)

Mirror `tests/renderer/shell-settings/shell-settings.test.tsx`'s harness style (local
`ExperienceProvider` wrapper + a small completion harness component defined in this file — there
is no shared harness module in this codebase to import from; every integration test file defines
its own small harness, by convention). At minimum define an `OnboardingCompletionHarness`-style
component (copy the pattern, not the whole file) that dispatches `completeOnboarding` to reach
the Shell, and reuse the existing `expectStatusChip`-style helper idiom
(`element.closest('[class*="statusChip"]')`, assert `.className` **contains**
`statusChip_<tone>` — substring, never the full hashed class).

Derive every count/id/label used below from `mockCatalog`/`sessionActionLabels`, never a bare
literal (constitution `css-module-class-asserts` learning — checklist item on every diff of this
file):

- **AC-005/006 — pause/resume in place**: find the seed's Running session (filter
  `mockCatalog.sessions` for `status === 'Running'`, don't hardcode the id/agent/task), click its
  pause button (`getByRole('button', { name: sessionActionLabels(session).pause })`), then
  assert: the chip text is now `'Paused'` with a `statusChip_warning` substring class (find the
  chip via `screen.getByText('Paused').closest('[class*="statusChip"]')`, scoped to that
  session's card if there are multiple `Paused`-labeled elements possible — there shouldn't be,
  only one session transitions), and the same button's accessible name is now
  `sessionActionLabels(session).resume`. Click it again → chip back to
  `statusChip_success`/`'Running'` text, button name back to `.pause`.
- **AC-010 — cross-surface consistency**: pause a session in the Overview panel, navigate to the
  Sessions board via the primary nav (`getByRole('navigation', { name: 'Primary navigation' })`
  → click/keyboard-activate the `'Sessions'` button, same pattern as the existing
  `shell-settings.test.tsx` navigation tests), and assert the same session shows `'Paused'` +
  a `Resume session …` button there too. Then reverse the direction: pause in the board, navigate
  back to Overview, assert consistency there.
- **AC-011 — KPI tracks the pause**: read the "Active agents" tile's numeral **before** pausing
  (derive expected value from `mockCatalog.sessions.filter((s) => s.status === 'Running').length`,
  scoped query via the existing `Key metrics` group heading + `closest('[data-surface-slot]')`
  pattern already used in `shell-settings.test.tsx`), pause the Running session, and assert the
  same tile now shows `String(runningCountBeforePause - 1)`. Do not assert anything about the
  sparkline (D-007a — it stays the static fixture, out of scope for this AC).
- **AC-012 — scenario non-regression**: for each of `loading`/`empty`/`error` (dispatch
  `selectScenario` before completing onboarding, or use a small scenario harness mirroring
  `ScenarioOnboardingHarness` from `shell-settings.test.tsx`), assert
  `screen.queryByRole('button', { name: /Pause session|Resume session|Session log/ })` is `null`
  within the sessions group specifically (scope the query to the group via
  `closest('[data-surface-slot]')`, same pattern as the KPI scenario tests already in
  `shell-settings.test.tsx`) — no action button and no log panel render when the group itself
  isn't in the `ready` state. Also assert the existing loading/empty/error copy for the sessions
  group still renders unchanged (non-regression of the pre-existing scenario behavior, which this
  task's `.itemList`→`.sessionList` class swap must not disturb — see "Regression note" below).
- **AC-014 — keyboard tab order**: within the Running session's card, `userEvent.tab()` from a
  known starting point and assert the focus sequence reaches the pause button before the log
  button (use `sessionActionLabels(session)` to identify each by accessible name at each tab
  step, e.g. assert `document.activeElement` matches
  `screen.getByRole('button', { name: sessionActionLabels(session).pause })` then the next
  `tab()` matches the log button). Repeat for a Ready/Complete session (only 1 button — assert
  the very next focusable element after the card's non-interactive content is the log button
  directly, no pause/resume stop in between). Order must be consistent across the two cards
  tested (content → pause/resume when present → log, per AC-014's wording).
- **AC-015 — reduced motion, both paths**: **setting path** — navigate to Settings →
  Appearance & motion (mirrors the existing category-navigation pattern in
  `shell-settings.test.tsx`) and toggle the reduce-motion control (whatever labeled control
  already exists there for `settingsDraft.reduceMotion` — read `src/renderer/src/settings/` if
  the control's accessible name isn't obvious from `Shell.tsx`/plan.md alone), navigate back to
  Overview or the Sessions board, open a log panel, and assert its class does **not** contain
  `sessionLogAnimated` (substring check). **System path** — in a *separate* test, stub
  `window.matchMedia` **locally in this test file** (do not touch `tests/renderer/setup.ts` —
  constitution boundary, and empirically unnecessary per `plan.md §Test strategy`, which proved
  the full 185-test suite green today with no global stub) with the exact shape motion-dom
  requires (verified empirically in the plan phase):

  ```ts
  function stubMatchMedia(matches: boolean) {
    const original = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches, media: query, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {},
        addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
      })
    })
    return () => Object.defineProperty(window, 'matchMedia', { configurable: true, value: original })
  }
  ```

  Install the stub with `matches: true` **before** rendering (the motion-dom singleton
  initializes per test-file isolate; installing before render guarantees the fresh read sees
  `true`), open a log panel, assert no `sessionLogAnimated` substring, and restore the original
  `matchMedia` (via the returned restore function) in an `afterEach`/`finally` so this stub
  cannot leak into other tests in this file.
- **AC-018 — cross-card independence (integration level)**: open the log panel on two different
  session cards at once (e.g. the Running and the Ready session, both present in the same
  rendered list) and assert both panels are simultaneously present with `aria-expanded="true"`
  each; close one, assert the other is unaffected (still open). This exercises the same
  guarantee as Task 002's component-level test, but here across the actual rendered Shell tree
  with real dispatch wiring, not isolated props.
- **AC-013 (light confirmatory check, primary coverage is Task 001's reducer test)**: mount a
  fresh, untouched provider (no dispatch at all) and assert every seed session shows its
  original seed status (`'Running'`/`'Ready'`/`'Complete'`, never `'Paused'`) — proves nothing
  about a *previous* test run or component leaks state across a fresh mount.

**Regression note (read before writing this file)**: the `.itemList` → `.sessionList` class swap
on sessions changes which CSS class the `<li>` wrapper carries, but no test in this codebase
(including the pre-existing `shell-settings.test.tsx`, out of this task's scope and **not to be
edited**) asserts against `.itemList` directly for sessions — its existing session-related
assertions (`expectStatusChip('Running', 'success')`, heading text, nav labels) are role/text
/`statusChip_*`-substring based and remain valid by construction, per `plan.md §Risks`. This
task's job here is to **run the full verify gate** (not just this new test file) before
reporting PASS, specifically to catch any such regression empirically rather than by inspection
alone — do not skip `npm run test` for the full suite in favor of running only this task's new
file.

## Acceptance check

- [ ] AC-005/006: pause/resume flips chip tone+label and button label+action in place, on both
      render points independently reachable.
- [ ] AC-010: pausing on either surface is reflected on the other without re-pausing or extra
      interaction — same underlying state, read twice.
- [ ] AC-011: "Active agents" KPI value decreases by exactly 1 (derived, not literal) when the
      one Running session is paused, and the sparkline series is unaffected.
- [ ] AC-012: zero action buttons or log panels render in the sessions group under
      loading/empty/error, and the pre-existing scenario copy for that group is unchanged by
      this task's `.itemList`→`.sessionList` swap.
- [ ] AC-014: Tab order within a card is content → pause/resume (if present) → log, consistent
      across a 2-button and a 1-button card.
- [ ] AC-015: both the setting-driven and system-driven reduced-motion paths suppress the
      `sessionLogAnimated` class on open; the system-path stub is local to this test file only,
      never added to `tests/renderer/setup.ts`.
- [ ] AC-018 (integration level): two cards' log panels are independently open/closed within the
      same mounted Shell tree.
- [ ] AC-013 (confirmatory): a fresh mount always shows seed statuses, never a leftover Paused
      from a prior interaction in the same test file (each test starts its own `render(...)`).
- [ ] Full verify gate (`npm run lint && npm run typecheck && npm run test`) is green for the
      **entire** repository tree, not just this task's new/changed files — this is the task that
      changes a CSS class consumed by pre-existing tests outside this feature's scope
      (`shell-settings.test.tsx`), so a scoped-only test run would not be sufficient evidence.
- [ ] Zero diff in `src/renderer/src/concepts/command-deck/` and
      `src/renderer/src/concepts/signal-poster/` (AC-016 — this task, like the other two, never
      touches `concepts/**`; confirm via `git status`/`git diff --stat` scoped to that path
      before reporting PASS).

## Validation criteria

Full verify gate green (`npm run lint`, `npm run typecheck`, `npm run test`) on the tree with
all three tasks' files present — this is the final task in the sequence, so "the tree" here is
simply the full working tree with no more tasks pending after it.

## Context

- This task assumes Task 001's `selectSessionViews`/`sessionActionLabels`/`SessionRuntimeStatus`/
  `SessionViewModel` and Task 002's `SessionCard`/`SessionCardProps` already exist exactly as
  their respective task files specify — if either is missing or diverges (e.g. a differently
  named prop), this task cannot be implemented as written; that is a signal to go verify the
  upstream task's actual output against its own task file, not to improvise a workaround here.
- Full design rationale for why the board gains state (was static, ADR-0001), why the two call
  sites end up byte-for-byte identical in shape (ADR-0004, mitigating the mapping-duplication
  objection that originally motivated recommending `shell/` over `ui/` at the plan stage), and
  why `useEffectiveReducedMotion` lives in `app/` rather than being computed inline again per
  call site: [ADR-0001](../adr/0001-live-session-state-slice.md),
  [ADR-0004](../adr/0004-sessioncard-log-disclosure.md).
- Do not add a 5th status tone, a hover state, an overflow/kebab menu, or a toast/activity-feed
  entry per pause/resume — all explicitly out of scope per `spec.md §Out` and closed by the gate
  (D-009/D-010; `memory/decisions.md`). If a review pass suggests any of these, it is scope
  creep to flag back to the controller, not something to implement here.
- `App.tsx`'s ambient-layer branch (`state.concept === 'night-harbor' && !reduceMotion`) and the
  48 existing integration tests that already exercise `reduceMotion` end-to-end are the
  regression net for step 2 — this task does not need to add a new `App.tsx`-specific test.
