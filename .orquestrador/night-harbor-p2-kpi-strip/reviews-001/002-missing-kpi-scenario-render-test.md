---
id: 002
severity: medium
status: open
location: tests/renderer/shell-settings/shell-settings.test.tsx (missing coverage); tests/renderer/integration/app-integration.test.tsx:25-47,153-155
created: 2026-07-10
---

# No render-level test asserts the "Key metrics" group's own loading/empty/error copy

## Problem

AC-010, AC-011, and AC-012 (spec.md lines 139-147) require the KPI section specifically to show
a loading/empty/error state "consistente com o padrão já usado pelos demais painéis do Overview,"
and spec.md's "## Verification" section says these are "verificados exercitando cada cenário do
Overview já suportado pela aplicação... replicando o padrão de teste já usado para os demais
painéis dessa tela." `plan.md`'s own "Verification approach" step 1 says explicitly: "Cenários
loading/empty/error do slot utility já são exercitados pelo padrão existente de
`selectScenarioSlice` + `ScenarioPresenter` (mecânica compartilhada); **asserts novos apenas nos
textos de copy novos**" — i.e. the plan itself anticipated that new assertions on the new copy
text would be added. They were not.

Concretely, the only place the new `kpis` copy strings (`'Loading key metrics…'`,
`'No metrics yet'`, `'Key metrics could not be loaded'`, `'Metrics appear after simulated agent
sessions run.'`) appear anywhere in the test suite is at the data/view-model level:
`tests/renderer/model/selectors.test.ts:109-135`, which asserts the shape of `view.kpis` returned
by `selectOverviewView()` — it never renders anything.

`tests/renderer/integration/app-integration.test.tsx`'s scenario matrix (`expectedCopy.overview`,
lines 35-40) only ever checks a single fixed string per scenario for the whole `overview`
surface — the "Current project" panel's copy (e.g. `/Current project could not be loaded/`) — not
the "Key metrics" group's copy. Its error-scenario check (line 154:
`expect(screen.getAllByRole('button', { name: 'Try again' }).length).toBeGreaterThan(0)`) is a
"some group somewhere shows a Try again button" assertion: it would still pass even if the
`kpis` slot's error rendering were entirely broken (wrong copy key, slice never wired, wrong
`ScenarioGroup` props), because the other 4 Overview groups (`currentProject`, `sessions`,
`issueQueue`, `activity`) already satisfy it independently under the same scenario.

`shell-settings.test.tsx`'s only KPI-specific test (`'renders the Key metrics KPI strip with
exactly 4 tiles...'`, line 112) runs under the default/ready scenario only — no test in that file
dispatches `selectScenario` to `loading`/`empty`/`error` and then scopes into the "Key metrics"
group (`within(keyMetricsGroup)`, the pattern already established at line 129 of that same file)
to assert its scenario-specific text.

Net effect: a real regression isolated to the `kpis` slot's Shell.tsx wiring (e.g. the wrong copy
object passed to `selectScenarioSlice`, or `slice={overview.kpis}` silently pointing at the wrong
data) would not be caught by any render-level test in the suite today.

Not classified as a functional defect today — the shared `ScenarioPresenter`/`selectScenarioSlice`
mechanics are already proven correct via the other 4 Overview groups' render tests, the exact
copy values are proven correct at the data level (`selectors.test.ts`), and the Shell.tsx wiring
itself is a single, visually-obvious `slice`/`title` prop pair identical in shape to the other
4 groups' wiring. The residual gap is narrow (a mis-wired prop specifically on this one slot)
and would also very likely surface in the visual screenshot check plan.md's own "Verification
approach" step 4 calls for (still pending per `memory/handoff-004.md`, not part of this round's
5 dimensions). Calibrated `medium`: a real, fixable, AC-adjacent test-coverage gap, not a proven
functional break.

## Suggested fix

Add a render-level test in `tests/renderer/shell-settings/shell-settings.test.tsx`, following the
existing `within(keyMetricsGroup)` scoping pattern from the ready-state test at line 112-159, that
dispatches `selectScenario` to `'loading'`, `'empty'`, and `'error'` in turn and asserts, scoped to
the Key metrics group specifically:

- `loading` → group shows `'Loading key metrics…'`
- `empty` → group shows `'No metrics yet'` and `'Metrics appear after simulated agent sessions
  run.'`
- `error` → group shows `'Key metrics could not be loaded'` and a `within(group)`-scoped "Try
  again" button

This mirrors the level of scenario-specific render coverage the other Overview panels already
have, closing the gap between the plan's stated intent and what was actually delivered.

## Resolution

<Filled by sdd-fix-review: what changed, or the rationale for `wontfix`.>
