---
id: 002
title: SessionCard primitive (ui/) — actions, log disclosure, CSS, unit tests
status: pending
depends_on: [001]   # component itself has ZERO app/ imports; the unit test imports selectSessionViews/sessionActionLabels/fixture from Task 001 — see Context
parallel_ok: false   # plan R6 recommends sequential T1→T2→T3; escape hatch (local test fixture) exists but is not taken here — see Context
covers: [AC-001, AC-002, AC-003, AC-004, AC-007, AC-008, AC-009, AC-018]
ears_pattern: WHEN/THEN, WHILE/THEN
verify:
  - npm run lint
  - npm run typecheck
  - npm run test
created: 2026-07-10
---

# Task 002 — SessionCard primitive (ui/), CSS, unit tests

## Goal

Build the single reusable `ui/SessionCard.tsx` primitive that both Shell render points
(Overview panel and Sessions board, wired in Task 003) will use identically: meta + StatusChip
+ up to 2 icon-button actions + an inline log disclosure panel. Per the gate HITL override
(D-011/ADR-0004), this component receives **fully resolved props** and imports **nothing** from
`app/` — all domain mapping (status→actions matrix, status→tone, aria-label text, log line
lookup) was already resolved by Task 001's `selectSessionViews`. This task's job is presentation
and interaction only: which icon shows, whether the log panel is open, and the animation gate.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/ui/SessionCard.tsx` (create)
- `src/renderer/src/ui/primitives.module.css` (modify — append only, do not touch existing rules)
- `src/renderer/src/ui/index.ts` (modify — add one export line)
- `tests/renderer/ui/session-card.test.tsx` (create)

Do **not** touch: `src/renderer/src/app/*`, `src/renderer/src/shell/*`, `src/renderer/src/App.tsx`,
`src/renderer/src/ui/Button.tsx`, `src/renderer/src/ui/StatusChip.tsx`,
`src/renderer/src/concepts/**`, `tests/renderer/setup.ts`, `tests/renderer/model/*`,
`tests/renderer/shell/*`, `package.json`/`package-lock.json`. In particular, `Button.tsx`
(`IconButton`) and `StatusChip.tsx` are consumed as-is, unmodified (ADR-0002/ADR-0003 — their
existing contracts already cover both use cases here).

## Governing skill

None — this codebase has no dedicated component-authoring skill; follow the sibling primitives'
established pattern (`MetricTile.tsx`/`StatusChip.tsx`: a function component in `ui/`, a
`*.module.css` import, composing other `ui/` primitives, zero `app/` imports).

## Steps

### 1. `ui/SessionCard.tsx` (new file)

Full authoritative contract (props interface + JSX) is
`plan.md §"ui/SessionCard.tsx — primitive com props resolvidas (ADR-0004 rev. gate)"` — read it
in full before writing this file. Condensed structural summary (plan.md wins on any
discrepancy):

- `export interface SessionCardLogLine { time: string; text: string }` — a type **owned by this
  file**, not imported from Task 001's `SessionLogLine` in `mock-catalog.ts`. It is
  structurally identical, and TS structural typing makes that sufficient — a
  `SessionViewModel.logLines` value from Task 001 is assignable to this type without any import
  or cast. This duplication is deliberate (ADR-0004 Alternatives — "SessionCard importando
  tipos/helpers de app/" was explicitly rejected at the gate).
- `export interface SessionCardProps { agent, task, statusLabel, statusTone, paused,
  canTogglePause, togglePauseLabel, logLabel, logLines, onTogglePause, reduceMotion }` — exactly
  the field list and JSDoc comments in the plan; every prop arrives pre-resolved (no domain
  logic, no lookup, no matrix decision inside this component beyond the two *presentational*
  branches noted below).
- `export function SessionCard(props: SessionCardProps)` — local state: `const [open, setOpen] = useState(false)` and `const panelId = useId()`.
- DOM structure (top to bottom): a `styles.sessionCard` wrapper containing a
  `styles.sessionCardRow` with (a) `styles.sessionMeta` (`<strong>{agent}</strong>` +
  `<span>{task}</span>`), (b) a `StatusChip` (`icon={paused ? Pause : undefined}`,
  `label={statusLabel}`, `tone={statusTone}` — passing `icon={undefined}` when not paused lets
  `StatusChip`'s own `defaultIconsByTone` pick the right icon for that tone, unchanged), (c) a
  `styles.sessionCardControls` cluster with:
  - **conditionally** (`canTogglePause &&`) an `IconButton` with `aria-label={togglePauseLabel}`,
    `onClick={onTogglePause}`, `variant="quiet"`, containing
    `<SemanticIcon decorative>{paused ? <Play /> : <Pause />}</SemanticIcon>` — this is the
    **only** other presentational branch in the component (icon choice driven by `paused`,
    exactly like `StatusChip`'s own `defaultIconsByTone` pattern);
  - **always** an `IconButton` with `aria-controls={panelId}`, `aria-expanded={open}`,
    `aria-label={logLabel}`, `onClick={() => setOpen((v) => !v)}`, `variant="quiet"`, containing
    `<SemanticIcon decorative><TerminalWindow /></SemanticIcon>`.
  - After the row, **conditionally rendered** (`{open && (...)}`) — not `hidden`-attribute-gated
    (ADR-0004 Alternatives explicitly rejects always-mounted-`hidden`) — an `<ol id={panelId}
    className={logPanelClasses}>` where
    `logPanelClasses = reduceMotion ? styles.sessionLog : \`${styles.sessionLog} ${styles.sessionLogAnimated}\`` (backtick
    template, not string concat — matches the codebase's existing `Button.tsx`/`SemanticIcon.tsx`
    class-join idiom style but as a template literal per plan.md). Each `<li key={line.time}>`
    contains `<span className={\`${styles.sessionLogTime} ${styles.data}\`}>{line.time}</span>`
    (note: composes with the **existing** `.data` utility class already in
    `primitives.module.css` — do not duplicate a mono/tabular-nums declaration) and
    `<span className={styles.sessionLogText}>{line.text}</span>`.
- Imports needed: `useId, useState` from `'react'`; `Pause, Play, TerminalWindow` from
  `'@phosphor-icons/react'` (confirmed present in the installed `@phosphor-icons/react@^2.1.10`
  — same package already used elsewhere in this codebase, e.g. `Shell.tsx`'s nav icons); `Button`
  re-exported as `IconButton` — import `{ IconButton, SemanticIcon, StatusChip }` from the
  **sibling files directly** (`'./Button'`, `'./SemanticIcon'`, `'./StatusChip'`), matching how
  `MetricTile.tsx` imports `styles from './primitives.module.css'` by relative sibling path
  rather than through the `ui/index.ts` barrel (avoids a self-import-via-barrel).
- **Hard constraint, checked manually (not by tooling — see Acceptance check)**: zero `import`
  statements from any path containing `../app` or `src/renderer/src/app` in this file. No
  `SessionViewModel`, no `isSessionActive`, no `mockCatalog`, no `ExperienceState`.

### 2. `ui/primitives.module.css` — append the SessionCard block

Append (do not reorder or touch existing rules) the exact CSS block from
`plan.md §"CSS novo (tokens universais, nenhum par novo) — split ui/primitives × shell"`, the
`ui/primitives.module.css` half only (**not** the `.sessionList` rules — those belong to
`shell.module.css` and are Task 003's scope):

```css
/* ui/primitives.module.css — interior do card (SessionCard, P2.4) */
.sessionCard {
  display: grid;
  gap: var(--space-2);
}

.sessionCardRow {
  align-items: center;
  display: flex;
  gap: var(--space-3);
  justify-content: space-between;
  min-block-size: 44px;
}

.sessionMeta {
  display: grid;
  gap: var(--space-1);
  min-inline-size: 0;
}

.sessionCardControls {
  align-items: center;
  display: inline-flex;
  flex: none;
  gap: var(--space-1);
}

.sessionLog {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  display: grid;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: var(--space-3);
}

.sessionLog > li {
  display: flex;
  font-size: var(--type-small);
  gap: var(--space-3);
}

.sessionLogTime {
  color: var(--ink-muted); /* auditado: 6.86–9.68:1 — memory/contrast-audit.md F2 */
  flex: none;
  /* mono/tabular via composição com a utilitária .data no TSX (mesmo module) */
}

.sessionLogText {
  color: var(--ink); /* auditado: 12.62–17.64:1 — memory/contrast-audit.md F1 */
  overflow-wrap: anywhere;
}

.sessionLogAnimated {
  animation: session-log-expand var(--duration-fast) var(--ease-standard);
}

@keyframes session-log-expand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sessionLogAnimated {
    animation: none; /* defesa em profundidade; o gate primário é a classe condicional */
  }
}
```

These color/opacity values are **audited** (`memory/contrast-audit.md` F1/F2) — do not
recompute, adjust, or introduce a different token. No new `:hover` state is added anywhere
(ADR-0003 — `IconButton` reuses the app-wide `.button`/`.iconButton` states as-is; this file
does not declare a `.sessionCard*:hover` rule of any kind).

### 3. `ui/index.ts` — barrel export

Add one line: `export * from './SessionCard'`. Insert alphabetically among the existing
`export * from './...'` lines (after `'./SemanticIcon'`, before `'./Skeleton'`) to match the
file's existing ordering convention.

### 4. `tests/renderer/ui/session-card.test.tsx` (new file)

Follow the `tests/renderer/ui/metric-tile.test.tsx` pattern (render-only unit test, no
provider needed — `SessionCard` takes no context) plus `@testing-library/user-event` for
interaction (this codebase's existing convention in `shell-settings.test.tsx`/
`onboarding-flow.test.tsx`).

Setup: import `mockCatalog`, `createInitialExperienceState`, `experienceReducer`,
`selectSessionViews`, `sessionActionLabels` from `'../../../src/renderer/src/app'` (or the
specific sub-modules — either is fine, this is the test file, not the component; the "zero
`app/` imports" constraint applies only to `SessionCard.tsx` itself). Import `SessionCard` from
`'../../../src/renderer/src/ui'`.

- **Derive test fixtures from Task 001's selector, never hand-roll a mock view model**: call
  `selectSessionViews(createInitialExperienceState())` to get the 3 seed-status views
  (Running/Ready/Complete), and separately call it again on
  `experienceReducer(createInitialExperienceState(), { type: 'toggleSessionPaused', sessionId: <the seed's Running session id, found by filtering, not hardcoded> })`
  to get a real Paused view. This gives 4 distinct `canTogglePause`/`statusTone` combinations to
  exercise the matrix without the component ever depending on `app/` at runtime — the test
  wires the already-resolved props in, same as Task 003's Shell integration will.
- **Button count per card (AC-001/002/003)**: for each of the 4 views, render
  `<SessionCard {...propsFromView} onTogglePause={vi.fn()} reduceMotion={false} />` and assert
  `screen.getAllByRole('button', { name: ... })` — actually, simplest: query
  `container.querySelectorAll('button')` (or `within(container).getAllByRole('button')`) and
  assert `.length === (view.canTogglePause ? 2 : 1)` — derived from the view, never a bare `1`
  or `2` literal in the assertion.
- **Accessible names (AC-004)**: for the Running and Paused views, assert
  `screen.getByRole('button', { name: sessionActionLabels(view).pause })` (Running) /
  `sessionActionLabels(view).resume` (Paused) exist, and
  `screen.getByRole('button', { name: sessionActionLabels(view).log })` exists for every view —
  derive the expected string via the exported `sessionActionLabels`, never inline the template.
- **Toggle click (AC-005/006 at component level — the actual status flip is Task 003's
  integration concern; here only the callback wiring is under test)**: click the pause/resume
  button (when present) and assert the `onTogglePause` spy was called exactly once, with no
  arguments (per the plan's `onClick={onTogglePause}` — a plain callback, not
  `onTogglePause(sessionId)`).
- **Log disclosure open (AC-007/009)**: click the log button → the panel `<ol>` appears with
  `role` implied by the element (query via `screen.getByRole('list')` scoped to the card, or
  `container.querySelector('ol')`), containing exactly `view.logLines.length` `<li>` items (not
  a literal `8`/`7`/`9` — read the length off the same view object used to render); each
  `<li>` contains that line's `time` and `text` verbatim (assert on `textContent`, not just
  presence, to catch a wrong-field or mis-ordered render). Assert `aria-expanded="true"` on the
  log button, and that the button's `aria-controls` value equals the rendered panel's `id`
  attribute (`getByRole('list')` then compare `.id` to the button's
  `getAttribute('aria-controls')`).
- **Log disclosure close + focus retention (AC-008)**: click the log button again → the panel is
  gone from the DOM (`queryByRole('list')` → `null`) **and** `document.activeElement` is still
  the log button (not `document.body`, not lost) — assert both in the same test, since AC-008 is
  specifically about focus not moving, not just about the panel closing.
- **Reduced motion gate (plan §Test strategy, class-by-substring — `css-module-class-asserts`
  learning)**: render with `reduceMotion={false}`, open the log, assert the panel's `className`
  **contains** the substring `sessionLogAnimated` (via `[class*="sessionLogAnimated"]` selector
  or `.className.includes(...)` — never assert the full class string, which includes a CSS
  Modules hash); render again with `reduceMotion={true}`, open the log, assert the className
  does **not** contain that substring.
- **Independent disclosure per instance (AC-018, component level)**: render two `SessionCard`
  instances in the same container using two different views (e.g. the Ready and Complete
  views — distinct `logLabel`s so their log buttons have distinct accessible names), open the
  first one's log panel, and assert the second's log button still has `aria-expanded="false"`
  and no panel — proves `useState` is per-instance, not shared module state.
- **Static content, no timers (AC-018 continuity)**: nothing in this component schedules
  anything — do not add `vi.useFakeTimers()`/`vi.advanceTimersByTime()` anywhere in this test
  file; if a test appears to need a timer, that is a sign the component under test regressed
  (introduced a timer/interval that shouldn't exist), not a reason to add fake-timer scaffolding.

## Acceptance check

- [ ] AC-001/002/003 (component level): rendered button count equals
      `view.canTogglePause ? 2 : 1` for every status, derived from the view object in the test,
      never hardcoded.
- [ ] AC-004: every rendered button has a non-empty `aria-label` whose text matches
      `sessionActionLabels(view)`'s corresponding field, and differs between two cards with
      different `agent`/`task` (distinguishable across cards, per spec).
- [ ] AC-007: opening the log renders exactly `view.logLines.length` list items with the
      fixture's exact `time`/`text` content; no line is ever generated in the test or component
      (no `Date.now()`, no `Math.random()`, nothing timer-driven anywhere in `SessionCard.tsx`).
- [ ] AC-008: closing the log via the same control leaves `document.activeElement` on that
      control.
- [ ] AC-009: the log button's `aria-expanded` reflects `open` exactly, `aria-controls` points
      at the actual rendered panel's `id`, and the panel appears immediately after the actions
      cluster in DOM order (not before, not detached elsewhere).
- [ ] AC-018 (component level): two `SessionCard` instances have fully independent `open` state.
- [ ] **Zero imports of `app/` in `ui/SessionCard.tsx`** (D-011/ADR-0004 override — this is an
      explicit acceptance criterion, not a nice-to-have; `npm run lint`/`npm run typecheck`
      **do not catch this** — `eslint.config.mjs` at the repo root has no import-boundary rule
      configured, confirmed by reading it during the plan/handoff phase, so an accidental
      `import { ... } from '../app/...'` would compile and pass every automated check silently).
      **Before reporting this task PASS, manually search this file for the substring `../app`
      (or `from '../../app'`, or any relative path segment containing `app`) and confirm zero
      matches** — this is a self-review step, not something the verify gate performs.
- [ ] No new `:hover` CSS rule was added anywhere in `primitives.module.css` for this feature
      (ADR-0003 — grep the diff for `:hover` near the new `.sessionCard*`/`.sessionLog*` rules;
      there should be none).

## Validation criteria

`npm run lint`, `npm run typecheck`, and `npm run test` green for the tree containing Task 001's
files already merged plus this task's files (sequential build — this task's own test file
imports Task 001's `selectSessionViews`/`sessionActionLabels`, so it cannot pass in a tree that
lacks Task 001; that dependency is expected and declared in this task's `depends_on`).

## Context

- Full component contract (props, DOM, all rationale):
  [ADR-0004](../adr/0004-sessioncard-log-disclosure.md), and `plan.md §"ui/SessionCard.tsx"` /
  `§"CSS novo"` for the literal code. This task file's step 1/2 are a condensed, load-bearing
  summary — if either ever diverges from `plan.md`, `plan.md` is the source of truth (per
  `memory/handoff-002.md`, to avoid a third copy that can drift in a future fix-loop).
- **The component/test asymmetry is deliberate, not an oversight**: `SessionCard.tsx` itself has
  zero runtime dependency on Task 001 (its props are plain primitives/callbacks, its own
  `SessionCardLogLine` type is structurally — not nominally — compatible with Task 001's
  `SessionLogLine`). Only this task's **test file** imports Task 001's selector/labels/fixture,
  to derive expected values instead of hardcoding them. Do not "fix" this by adding an import to
  the component to match the test, and do not remove the test's derivation in favor of literal
  strings/counts to avoid the Task 001 dependency — both would violate an explicit constraint
  (ADR-0004 zero-import rule; constitution `css-module-class-asserts`/no-hardcoded-counts
  learning) (`memory/handoff-002.md` Descoberta #1).
- Icon names confirmed present in the installed `@phosphor-icons/react@2.1.10`: `Pause`, `Play`,
  `TerminalWindow` — these are the library's stable short aliases (the package marks them
  deprecated in favor of a `*Icon`-suffixed name, but the rest of this codebase already uses the
  short names, e.g. `CheckCircle` in `StatusChip.tsx` — keep that convention).
- Do not touch `Button.tsx` or `StatusChip.tsx` — both are validated against this component's
  needs already (`aria-expanded`/`aria-controls` flow through `IconButtonProps`'s
  `ButtonHTMLAttributes` spread with no new prop required; `StatusChip`'s existing `icon` prop
  accepts the `Pause` override directly).
