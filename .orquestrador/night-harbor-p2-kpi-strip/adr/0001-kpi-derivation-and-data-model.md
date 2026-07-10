---
id: 0001
title: KPI derivation formulas and mock-catalog data model
status: accepted
date: 2026-07-10
---

# ADR-0001 — KPI derivation formulas and mock-catalog data model

## Context

The spec locks G1 (exactly 4 KPIs, fixed order: active agents, queue, success rate, agent
time) and requires three of the four values to be **derived** from data that already exists
in `mockCatalog` (never duplicated as a standalone number), while the fourth (success rate)
is genuinely new fixture data (AC-007, AC-008). The spec deliberately left one formula open:
"agentes ativos" could mean total session count or a status-filtered count — this is the one
open question `sdd-plan` was explicitly asked to close (spec.md "Open questions";
handoff-001.md R2).

`mock-catalog.ts` today has no `kpis` block and no per-metric time series. Something has to
own (a) the two genuinely-new fixture values (success-rate value, and 8–12-point series for
all four metrics), and (b) the derivation logic that turns existing arrays into KPI values.
Existing precedent (`selectors.ts`) already separates raw fixture data (`mock-catalog.ts`)
from view-model derivation (`selectors.ts`); `Shell.tsx` never talks to `mockCatalog` directly
except through `selectShellView`.

## Decision

**Active-agents formula**: `mockCatalog.sessions.filter((s) => s.status === 'Running').length`.

Rationale: the job-to-be-done text is literally "quantos agentes **estão ativos**" (how many
agents *are* active right now), not "how many sessions exist." The codebase already has a
precedent mapping for this exact meaning — `mapSessionStatusToTone` in `Shell.tsx` maps
`Running → success` (the "good/active" tone), while `Ready`/`Complete` map to
`warning`/`neutral`. Reusing "Running" as the definition of "active" is consistent with that
existing semantic, not a new interpretation invented for this feature. With the current
fixture (`session-104` Running, `session-103` Ready, `session-102` Complete), this yields
`1`.

**Queue formula**: `mockCatalog.issueQueue.length` — direct count, no filtering (the metric is
literally "how full is the queue," not "how many high-priority issues"). Yields `3` today.

**Agent-time formula**: `mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value`
— looked up by label, not by array index, so a reordering of `recentUsage` cannot silently
break the KPI. Yields `'3h 42m'` today.

**Success-rate**: new field, `mockCatalog.kpis.successRate: number` (a whole-number
percentage, e.g. `92`), formatted at the view-model layer as `` `${value}%` ``.

**Data model** — `mock-catalog.ts` gets one new top-level block:

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

(`freezeArray` is a one-line sibling of the existing `freezeItems` helper —
`Object.freeze([...items])` — since these are number arrays, not object arrays.) Ten points
per series, within the 8–12 range mandated by G3; values are hand-picked literals, not random,
per the spec's "nunca gerada aleatoriamente" constraint.

`selectors.ts` gets a `buildKpiViewModels()` function producing the 4-entry, order-locked
array by combining the formulas above with `mockCatalog.kpis.series`, and a `kpis` field is
added to `OverviewViewModel` via the existing `selectScenarioSlice` pattern (new
`overviewCopy.kpis` copy block, mirroring `overviewCopy.usage`). `mockCatalog.recentUsage` and
`OverviewViewModel.recentUsage` are **not removed** — AC-017 requires the block to remain
available to any other consumer; only the Overview `utility` slot stops rendering it.

## Alternatives considered

- **Total session count for "active agents"** — rejected: doesn't match the job-to-be-done
  wording ("estão ativos") and would make the KPI redundant with a plain session count already
  visible in the "Active agent sessions" panel one slot over.
- **Storing all four KPI values as flat literals in `mock-catalog.ts`** (e.g. hardcoding
  `value: '1'` for active agents) — rejected: violates AC-007 ("não um número duplicado à
  parte") and the spec's explicit test-authoring rule (counts must be read from the fixture,
  never hardcoded); a literal value can silently drift from `sessions`/`issueQueue`.
- **Deriving KPI values inside `Shell.tsx`** (co-located with `mapSessionStatusToTone`-style
  helpers) — rejected: `OverviewViewModel` is the established seam for "data + scenario state
  → what the view needs," and keeping the formula in `selectors.ts` makes it unit-testable via
  `selectOverviewView` the same way every other slice already is (`tests/renderer/model/selectors.test.ts`).

## Consequences

- `selectors.test.ts` can assert the active-agents/queue values by re-computing the same
  filter/length expressions against `mockCatalog` at test time — no hardcoded counts, so a
  fixture edit can never silently desync the test from reality.
- Adding a 5th KPI later means adding one entry to the `buildKpiViewModels()` array and one
  series to `mockCatalog.kpis.series` — no shape change elsewhere.
- If `sessions`/`issueQueue`/`recentUsage` are ever restructured, only `buildKpiViewModels()`
  needs updating; the `kpis` slice and `MetricTile` are insulated from that churn.
