---
id: 001
title: KPI data model — mock-catalog fixture + selectors derivation
status: pending
depends_on: []
covers: [AC-001, AC-005, AC-007, AC-008, AC-010, AC-011, AC-012, AC-017]
ears_pattern: WHEN/THEN, GIVEN/WHEN/THEN, AFTER/THEN
created: 2026-07-10
---

# Task 001 — KPI data model (mock-catalog fixture + selectors derivation)

## Goal

Add the `kpis` fixture block to `mock-catalog.ts` and the `buildKpiViewModels()` derivation +
`kpis` scenario slice to `selectors.ts`, so `OverviewViewModel.kpis` exposes 4 order-locked,
fixture-derived KPI view models without touching or removing `recentUsage`.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/app/mock-catalog.ts`
- `src/renderer/src/app/selectors.ts`
- `tests/renderer/model/selectors.test.ts`

Do **not** touch: `src/renderer/src/ui/*`, `src/renderer/src/shell/*`,
`src/renderer/src/concepts/concepts.module.css`, `package.json`/`package-lock.json`,
`tests/renderer/ui/metric-tile.test.tsx`, `tests/renderer/shell-settings/shell-settings.test.tsx`.

## Governing skill

None. There is no dedicated skill for this codebase's `selectors.ts`/`mock-catalog.ts`
view-model convention — follow the established in-repo pattern (`selectScenarioSlice`,
`freezeItems`) directly; it is documented below and in ADR-0001.

## Steps

1. In `mock-catalog.ts`, add a `freezeArray` helper as a one-line sibling of the existing
   `freezeItems` (which freezes arrays of objects): `freezeArray` freezes arrays of primitives
   (`Object.freeze([...items])`), since KPI series are `number[]`, not object arrays.
2. Add a new top-level `kpis` block to the `mockCatalog` object (after `integrations`, or any
   position — object key order is not asserted anywhere):

   ```ts
   kpis: Object.freeze({
     successRate: 92,
     series: Object.freeze({
       'active-agents': freezeArray([1, 2, 2, 1, 2, 3, 2, 1, 2, 1]),
       queue: freezeArray([2, 3, 4, 3, 2, 3, 4, 3, 2, 3]),
       'success-rate': freezeArray([88, 90, 89, 91, 93, 90, 94, 92, 95, 92]),
       'agent-time': freezeArray([2.6, 2.8, 3.0, 3.1, 2.9, 3.3, 3.5, 3.4, 3.6, 3.42])
     })
   })
   ```

   Copy these literal arrays **exactly** from ADR-0001 — do not re-pick values. They are hand
   authored (never `Math.random`), 10 points each (inside the mandated 8–12 range), chosen for
   visible min/max amplitude at 16px bar height. Task 002 (MetricTile component test) reads
   these same arrays directly from `mockCatalog.kpis.series` for its own fixture-driven length
   assertions — changing point counts here changes what that task's tests expect too (see
   "Context" below).
3. In `selectors.ts`, add the view-model type and the pure derivation function:

   ```ts
   export interface KpiViewModel {
     id: 'active-agents' | 'queue' | 'success-rate' | 'agent-time'
     label: string
     value: string
     series: readonly number[]
   }

   function buildKpiViewModels(): readonly KpiViewModel[] {
     const activeAgents = mockCatalog.sessions.filter((s) => s.status === 'Running').length
     const queued = mockCatalog.issueQueue.length
     const agentTime =
       mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value ?? '—'
     return [
       { id: 'active-agents', label: 'Active agents', value: String(activeAgents),
         series: mockCatalog.kpis.series['active-agents'] },
       { id: 'queue', label: 'Issue queue', value: String(queued),
         series: mockCatalog.kpis.series.queue },
       { id: 'success-rate', label: 'Success rate', value: `${mockCatalog.kpis.successRate}%`,
         series: mockCatalog.kpis.series['success-rate'] },
       { id: 'agent-time', label: 'Agent time', value: agentTime,
         series: mockCatalog.kpis.series['agent-time'] }
     ]
   }
   ```

   The array order above **is** the AC-001 order contract (active agents → queue → success
   rate → agent time) — do not reorder. `agent-time` is looked up by `label`, not array index
   (ADR-0001 rationale: a `recentUsage` reorder must not silently break this KPI).
4. Add a copy block to the existing `overviewCopy` object (same file, mirrors the shape of
   `overviewCopy.usage`, which — like this one — has no `emptyAction`):

   ```ts
   kpis: {
     loadingLabel: 'Loading key metrics…',
     emptyTitle: 'No metrics yet',
     emptyGuidance: 'Metrics appear after simulated agent sessions run.',
     errorTitle: 'Key metrics could not be loaded',
     errorCause: 'The simulated metrics source is unavailable.'
   }
   ```

5. Add `kpis: ScenarioSlice<readonly KpiViewModel[]>` to the `OverviewViewModel` interface, and
   construct it in `selectOverviewView` the same way every other field is constructed:
   `kpis: selectScenarioSlice(state, buildKpiViewModels(), overviewCopy.kpis)`. Leave
   `recentUsage`'s field and construction line completely unmodified (AC-017) — this is an
   additive change only.

6. Extend `tests/renderer/model/selectors.test.ts`:
   - Add `view.kpis.status` to the existing `it.each(['default'|'loading'|'empty'|'error'])`
     loop ("maps %s to a %s slice across the Overview groups") alongside the other 5 fields —
     this is the codebase's established place where scenario-mechanics coverage
     (AC-010/AC-011/AC-012) lives for every Overview field; there is no separate
     Shell-render-level scenario test for any of the other groups either, so don't invent one
     here.
   - Add one dedicated assertion per scenario, mirroring the existing per-field examples
     already in the file (`uses deterministic loading copy…`, `provides guidance and a
     pertinent action for an empty slice`, `provides a named cause and shared recovery for an
     error slice`):
     - loading: `view.kpis` (scenario `loading`) equals
       `{ status: 'loading', label: 'Loading key metrics…' }`.
     - empty: `view.kpis` (scenario `empty`) equals
       `{ status: 'empty', title: 'No metrics yet', guidance: 'Metrics appear after simulated agent sessions run.' }`
       — assert there is **no** `action` key (unlike `currentProject`/`sessions`/`issueQueue`,
       which do have one).
     - error: `view.kpis` (scenario `error`) equals
       `{ status: 'error', title: 'Key metrics could not be loaded', cause: 'The simulated metrics source is unavailable.', recovery: { id: 'recover-scenario', label: 'Try again' } }`.
   - Add a new `describe('KPI view models', …)` block (scenario `default`) asserting:
     - exactly 4 entries, in id order `['active-agents', 'queue', 'success-rate', 'agent-time']`
       (AC-001, order/count only — the rendered-DOM half of AC-001 is Task 003's concern).
     - `active-agents` value === `String(mockCatalog.sessions.filter((s) => s.status === 'Running').length)`;
       `queue` value === `String(mockCatalog.issueQueue.length)`; `agent-time` value ===
       `mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value` — all three
       **recomputed inline in the test**, never hardcoded as a literal (AC-007; constitution
       rule against hardcoded counts).
     - `success-rate` value === `` `${mockCatalog.kpis.successRate}%` `` (AC-008 — genuinely new
       fixture field, not derived from any existing block).
     - loop over the 4 series in `mockCatalog.kpis.series` and assert
       `length >= 8 && length <= 12` for each (AC-005, fixture-driven, no hardcoded `10`).
   - Add an assertion that `mockCatalog.recentUsage` is unchanged (3 items, same labels/values
     as before this task) and that `view.recentUsage.status` still resolves per scenario
     exactly as the pre-existing tests already check (AC-017) — this should require no new
     code, only confirm no existing `recentUsage` assertion was altered or deleted.

## Acceptance check

- [ ] AC-001 (data half): `buildKpiViewModels()` returns exactly 4 entries in the fixed order
      `active-agents, queue, success-rate, agent-time`.
- [ ] AC-005: every one of the 4 series in `mockCatalog.kpis.series` has `8 <= length <= 12`;
      values are literal arrays (no `Math.random`/`Date.now` anywhere in `mock-catalog.ts`).
- [ ] AC-007 (three branches — one assertion per existing-data source):
      active-agents value recomputed from `sessions.filter(status === 'Running').length`;
      queue value recomputed from `issueQueue.length`; agent-time value recomputed from the
      `recentUsage` label lookup — each compared against the selector's actual output, never a
      bare literal.
- [ ] AC-008: success-rate value is `` `${mockCatalog.kpis.successRate}%` ``, sourced from the
      new `successRate` field (not derived from `sessions`/`issueQueue`/`recentUsage`).
- [ ] AC-010: `view.kpis` under `loading` scenario matches the exact copy above.
- [ ] AC-011: `view.kpis` under `empty` scenario matches the exact copy above, with no `action`.
- [ ] AC-012: `view.kpis` under `error` scenario matches the exact copy above, including the
      shared `recover-scenario` recovery action.
- [ ] AC-017: `mockCatalog.recentUsage` is byte-for-byte unchanged; `OverviewViewModel` still
      exposes a working `recentUsage` field; no existing `recentUsage`-related assertion was
      weakened or removed.

## Validation criteria (optional)

`npm run typecheck` and `npm run test` green for `selectors.ts`/`mock-catalog.ts`/
`selectors.test.ts` in isolation (this task has no dependency on Task 002 or Task 003 — it is
the most upstream of the three and fully self-verifiable).

## Context

- Formulas and rationale are ADR-0001 — do not re-derive or second-guess them here; in
  particular "active agents" is deliberately `status === 'Running'` (not total session count),
  matching the existing `mapSessionStatusToTone` semantic (`Running` → `success`) already used
  in `Shell.tsx`.
- Pattern to follow: `selectScenarioSlice(state, data, copy)` (already defined in
  `selectors.ts`, used by every existing Overview field) — do not write bespoke
  loading/empty/error branching for `kpis`; reuse the same function so AC-010/011/012 are
  satisfied by construction, identically to the other 4 groups.
- `freezeItems` (existing) freezes arrays of *objects*; `freezeArray` (new, this task) freezes
  arrays of *primitives* — they are deliberately separate one-liners, not a shared generic,
  matching this file's existing style of small named helpers over parameterized abstractions.
- Downstream consumer heads-up (informational, not a blocker): Task 002 ("Componente")
  implements `tests/renderer/ui/metric-tile.test.tsx`, which imports `mockCatalog` directly and
  reads `mockCatalog.kpis.series` to size its own fixture-driven assertions. That test file is
  **not** in this task's file scope and this task does not need to coordinate with it — but if
  this task's `npm run test`/`npm run typecheck` is ever run standalone in a tree that does not
  yet contain Task 002's files, that is expected and fine (Task 002 depends on this task's data,
  not the reverse). See Task 002's own Context section for the mirrored note.
- Do not add any Shell-level (rendered-DOM) test for KPI scenario states — the codebase's
  existing precedent (the other 4 Overview fields) covers loading/empty/error exclusively at
  the `selectors.test.ts` level; there is no existing per-field scenario test at
  `tests/renderer/integration/app-integration.test.tsx` either (that file exercises one
  representative field per surface across the full concept×scenario matrix — `currentProject`
  for "overview" — and is out of this feature's scope; do not add `kpis` to it).
