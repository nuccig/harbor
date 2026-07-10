---
id: 003
title: Shell integration — KPI strip replaces "Recent usage" in the utility slot
status: pending
depends_on: [001, 002]
covers: [AC-001, AC-002, AC-014, AC-018]
ears_pattern: WHEN/THEN, AFTER/THEN
created: 2026-07-10
---

# Task 003 — Shell integration (KPI strip replaces "Recent usage")

## Goal

Swap the Overview's `utility` slot from rendering `recentUsage` as a `DataList` to rendering
`overview.kpis` as a 4-tile `MetricTile` strip — the only edit anywhere in `Shell.tsx`/
`shell.module.css` for this feature.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/shell/Shell.tsx`
- `src/renderer/src/shell/shell.module.css`
- `tests/renderer/shell-settings/shell-settings.test.tsx`

Do **not** touch: `src/renderer/src/app/mock-catalog.ts`, `src/renderer/src/app/selectors.ts`,
`src/renderer/src/ui/*`, `src/renderer/src/concepts/concepts.module.css`, `package.json`,
`tests/renderer/model/selectors.test.ts`, `tests/renderer/ui/metric-tile.test.tsx`.

## Serial Locks

`depends_on: [001, 002]` — this task is strictly serial after both:

- Needs Task 001's `overview.kpis: ScenarioSlice<readonly KpiViewModel[]>` field on
  `OverviewViewModel` (the `slice` prop this task wires up does not exist before Task 001).
- Needs Task 002's `MetricTile` export from `../ui` (this task imports and renders it; the
  component does not exist before Task 002).

Both are genuine compile-time dependencies (Shell.tsx would not typecheck without either), not
a style preference — this task cannot start until both land.

## Governing skill

None. Follow the existing `ScenarioGroup`/`ScenarioPresenter` convention already used by every
other Overview group in `Shell.tsx` — this is an established in-repo pattern, not a
skill-tool-governed one.

## Steps

1. In `Shell.tsx`, import `MetricTile` alongside the other `../ui` imports (append to the
   existing named-import block from `'../ui'`).
2. Replace the `utility`-slot `ScenarioGroup` (currently ~lines 244–250, the one rendering
   `<DataList items={usage} />` from `overview.recentUsage`, titled "Recent usage") with:

   ```tsx
   <ScenarioGroup
     onAction={handleAction}
     renderReady={(kpis) => (
       <ul className={styles.kpiStrip}>
         {kpis.map((kpi) => (
           <li key={kpi.id}>
             <MetricTile label={kpi.label} value={kpi.value} series={kpi.series} />
           </li>
         ))}
       </ul>
     )}
     slice={overview.kpis}
     slot="utility"
     title="Key metrics"
   />
   ```

   `slot="utility"` is preserved unchanged (only `slice`/`title`/`renderReady` change) — this
   is what keeps `concepts.module.css`'s existing `[data-surface-slot='utility']` grid rules
   applying with zero edits to that file (AC-014's "zero edit to legacy concepts" depends on
   this attribute staying put). Do not touch any of the other 4 `ScenarioGroup` blocks
   (primary/metrics/queue/activity) — AC-018.
3. Remove the now-dead `DataList` helper function (defined near the top of `Shell.tsx`, ~line
   83). Before this change it has exactly one call site — the `renderReady` you just replaced
   in step 2 — and no other consumer anywhere in the file (confirmed by search). After step 2 it
   has zero call sites. Leaving it in place would be dead code; deleting it does not affect any
   of the other 4 groups (none of them use `DataList`) and is safe under AC-018. (Note: this
   is a small, deliberate deviation from the plan's literal "DataList intocado" phrasing — the
   plan did not anticipate that the swap leaves `DataList` fully unreferenced; removing
   orphaned dead code is the correct call, not a scope violation, since no other file/group
   depends on it.) Also remove the now-orphaned `.dataList` selector fragments in
   `shell.module.css` (combined via comma with `.projectSummary` in ~4 blocks around lines
   120–146): drop only the `.dataList`-related selector parts (and any `.dataList`-only rules),
   keeping the `.projectSummary` styling identical — analyze-agent finding #2, same dead-code
   rationale as the JS helper.
4. Add `.kpiStrip` to `shell.module.css` (nested layout *inside* the utility slot — it does not
   replace the slot's own per-concept grid-column span):

   ```css
   .kpiStrip {
     display: grid;
     gap: var(--space-3);
     grid-template-columns: repeat(2, minmax(0, 1fr));
     list-style: none;
     margin: 0;
     padding: 0;
   }
   ```

   2×2 by default; no new media-query breakpoint is needed (verified at plan time against both
   the 1024×700 baseline and 1440×900 expansion evaluation viewports already in
   `concepts.module.css`).
5. Extend `tests/renderer/shell-settings/shell-settings.test.tsx`:
   - In the first test ("opens Overview after onboarding and exposes all five operational
     groups"), change the `screen.getByRole('heading', { level: 2, name: 'Recent usage' })`
     assertion to `name: 'Key metrics'`.
   - Add `expect(screen.queryByRole('heading', { name: 'Recent usage' })).not.toBeInTheDocument()`
     (or `toBeNull()`) to prove the old panel is gone, not just renamed (AC-002).
   - Add a new test asserting the "Key metrics" group renders exactly 4 tiles, in the fixed
     semantic order `Active agents, Issue queue, Success rate, Agent time` (AC-001). Scope the
     query to the "Key metrics" group specifically (e.g.
     `screen.getByRole('heading', { level: 2, name: 'Key metrics' }).closest('[data-surface-slot]')`
     or the group `<section>`) before asserting tile count/order **and see the naming-collision
     gotcha below before writing label lookups**.
   - Leave every existing assertion for the other 4 groups (`Current project`,
     `Active agent sessions`, `Issue queue` group heading, `Activity`) exactly as-is — this is
     the concrete evidence for AC-018 (non-regression).

## Acceptance check

- [ ] AC-001: Overview (ready) shows a "Key metrics" section containing exactly 4 tiles, in
      order Active agents → Issue queue → Success rate → Agent time.
- [ ] AC-002: the "Recent usage" heading is absent anywhere in the rendered Overview; "Key
      metrics" occupies the same slot (`data-surface-slot="utility"`) it used to occupy.
- [ ] AC-018: the other 4 Overview groups (Current project / Active agent sessions / Issue
      queue / Activity) keep their existing headings and content assertions unmodified and
      passing — no structural or copy regression from this change.

## Validation criteria (optional)

`npm run lint && npm run typecheck && npm run test` green for the whole repo (this is the
integration point — the first point at which all three tasks' code coexists, so this is where
the full verify gate first has a chance to be meaningfully green end-to-end).

## Context

- **Naming-collision gotcha (concrete, not hypothetical)**: the existing "Issue queue" *group*
  heading (`<h2>Issue queue</h2>`, `slot="queue"`, unaffected by this feature) and the new KPI
  tile *label* "Issue queue" (one of the 4 `MetricTile` labels, per ADR-0001/plan.md) are the
  exact same text. A bare `screen.getByText('Issue queue')` after this change will match two
  elements (the group's `<h2>` and the tile's label `<span>`) and throw. Scope every new query
  with `within(...)` against the specific section/group you mean (e.g. the "Key metrics"
  `<section>` for the tile label, `getByRole('heading', { level: 2, ... })` for the group
  heading) rather than a bare `getByText`.
- `overview.kpis`/`MetricTile` are the only two new symbols this task consumes — both come from
  the two upstream tasks; this task adds no new derivation logic and no new component, only
  wiring.
- The `<ul>`/`<li>` markup (not a bare `<div>` grid) is deliberate: a named list of 4 items
  exposes the tile count to assistive technology for free, mirroring the `itemList`/
  `activityList` pattern already used by the sessions/issues/activity groups in this same file.
- Do not add a Shell-level test asserting `var()`-resolved colors per concept — jsdom cannot
  compute CSS custom properties, so AC-013/AC-014's color-behavior proof lives in Task 002's
  structural class-presence checks plus the (already-complete) contrast audit, not here. This
  task's own AC-018 responsibility is behavioral/structural non-regression of the *other 4*
  groups, not color.
