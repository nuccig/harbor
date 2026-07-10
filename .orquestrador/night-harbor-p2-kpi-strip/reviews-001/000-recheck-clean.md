# Review Round Re-check — night-harbor-p2-kpi-strip

**Date**: 2026-07-10
**Round**: reviews-001 (re-check after fix commit)
**Fix commit**: `2eb649b` — "test(ui): resolve P2.3 review round 001 findings"

## Status: CLEAN — all 5 issues independently re-verified resolved in current source, no new problems introduced

Each issue below was re-checked directly against the current working tree (not just read from the
issue file's own narrative), plus `2eb649b`'s diff was read in full for scope/quality regressions.

### 001 (medium) — hardcoded tile count → fixture-derived

`tests/renderer/shell-settings/shell-settings.test.tsx:152-153` now reads:

```ts
const expectedTileCount = Object.keys(mockCatalog.kpis.series).length
expect(tiles).toHaveLength(expectedTileCount)
```

Confirmed: no bare `4` literal remains at that assertion. `mockCatalog` was already imported in the
file (used two lines below), so no new import needed. Matches the suggested fix exactly.

### 002 (medium) — Key metrics loading/empty/error render coverage

Added `ScenarioOnboardingHarness` (dispatches `{ type: 'selectScenario', scenario }` via
`useLayoutEffect` before onboarding completes — mirrors the `SeedExperience` pattern already used in
`tests/renderer/integration/app-integration.test.tsx:49`) and a new `it.each` block covering
`loading`/`empty`/`error`, scoped via `within(keyMetricsGroup)` using the same
`closest('[data-surface-slot]')` pattern as the existing ready-state test.

Traced the full render path to confirm the assertions are real, not just self-consistent with the
issue's own narrative:
- `src/renderer/src/app/selectors.ts:171-177` (`overviewCopy.kpis`) defines the exact four copy
  strings (`'Loading key metrics…'`, `'No metrics yet'`, `'Metrics appear after simulated agent
  sessions run.'`, `'Key metrics could not be loaded'`) — byte-identical to what the new test
  asserts.
- `src/renderer/src/shell/Shell.tsx:229-243` wires `slice={overview.kpis}` into a `ScenarioGroup`
  with `data-surface-slot="utility"` on its wrapping `<section>` (line 103) — the same DOM anchor
  the test scopes into via `closest('[data-surface-slot]')`.
- The "Try again" button text traces to `selectors.ts:45` (`recovery: { id: 'recover-scenario',
  label: 'Try again' }`), rendered by `ScenarioPresenter` inside the same section, so
  `within(group).getByRole('button', { name: 'Try again' })` for the `error` case is scoped
  correctly and would fail if the `kpis` slot's error rendering broke independently of the other
  4 Overview groups — closing exactly the gap the issue described.

### 003 (low) — duplicated `'Running'` literal → shared `isSessionActive`

`src/renderer/src/app/selectors.ts` now exports `isSessionActive(status)`; `buildKpiViewModels()`
calls it. `src/renderer/src/shell/Shell.tsx:17` imports `isSessionActive` alongside
`selectShellView` from `../app/selectors`, and `mapSessionStatusToTone` (lines 33-36) checks it
first. Confirmed via `grep -rn "'Running'" src`: the only remaining literal comparison is inside
`isSessionActive` itself (selectors.ts:91); the other hit is fixture data in `mock-catalog.ts`
(not logic). Import direction is correctly `shell/ → app/` (the allowed direction per ADR-0001);
`app/selectors.ts`'s diff adds only a `type MockCatalog` import from its own sibling
`mock-catalog.ts`, no import from `shell/` — the "app/ must not import shell/" constraint holds.

### 004 (low) — unexercised `'—'` fallback branch

`resolveAgentTime(recentUsage)` extracted and exported from `selectors.ts`; `buildKpiViewModels()`
calls it with `mockCatalog.recentUsage`. New test in `tests/renderer/model/selectors.test.ts`
(after line 195) filters the fixture's `recentUsage` down to an array without the `'Agent time'`
label (derived from the fixture via `.filter`, not hand-built) and asserts `resolveAgentTime(...)`
returns `'—'`, plus a second assertion for the happy path. Both branches of the `??` are now
directly exercised.

### 005 (low) — AC-013 wording annotated

`spec.md` AC-013 (now ~line 150-152) has the parenthetical added exactly as the resolution states:
"pool de tokens aceitáveis, satisfeito ao resolver para qualquer membro do pool; não é mandato de
usar os três. Ver ADR-0003...". Confirmed no source files (`MetricTile.tsx`,
`primitives.module.css`) were touched by this commit — doc-only change as promised.

## Regression check on the fix commit itself (`2eb649b`)

- No ghost/unused imports: `useLayoutEffect` and `ScenarioId` (test file), `type MockCatalog`
  (selectors.ts) are all used at their respective call sites; `npm run lint` independently
  re-run — 0 issues (would catch unused imports).
- No weakened assertions: diffed `shell-settings.test.tsx` and `selectors.test.ts` in full — every
  change is additive (new test, new derived-count line replacing a literal); no existing
  `expect(...)` was loosened, removed, or had its target changed.
- Scope: touched files are exactly the 5 issue files (status updates), `spec.md` (005's doc
  annotation), `selectors.ts` + `Shell.tsx` (003/004's extraction), and the two test files
  (001/002/004's new assertions) — no unrelated files touched, no scope creep.
- Full regression independently re-run (not trusted from the resolution narratives):
  `npm run lint` → 0 issues; `npm run typecheck` → 0 errors; `npm run test` → **185/185 passed,
  15 files** (matches every resolution's stated count exactly). Working tree clean at `2eb649b`
  (HEAD), nothing uncommitted.

## Blocking assessment

No new issues filed. All 5 original findings (2 medium, 3 low) are resolved as claimed, verified
against current source rather than taken on the resolution text's word alone. Round is clean;
feature is clear to proceed past this review round.
