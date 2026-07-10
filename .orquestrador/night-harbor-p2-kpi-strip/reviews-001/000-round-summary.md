# Review Round Summary — night-harbor-p2-kpi-strip

**Date**: 2026-07-10
**Feature**: night-harbor-p2-kpi-strip (Night Harbor P2.3 — KPI strip on Overview)
**Round**: reviews-001
**Mode**: 5 parallel dimension agents (S1 Security, S2 Requirements & DoD, S3 Test Coverage,
S4 Architecture & Conventions, S5 Regression & Hallucination), consolidated and independently
spot-checked by the review-agent before filing.

## Status: PASS — 0 Critical, 0 High, 2 Medium, 3 Low

| Dimension | Result | Findings |
| --- | --- | --- |
| S1 Security | Clean | 0 |
| S2 Requirements & DoD (AC-001..AC-018) | Clean (18/18 Implemented) | 1 Low (doc-wording note, see 005) |
| S3 Test Coverage | 2 gaps | 2 Medium (001, 002) |
| S4 Architecture & Conventions | Clean | 0 |
| S5 Regression & Hallucination | Clean | 1 Low (see 003) + informational (see 004) |

## Findings filed

- **001 (medium)** — `tests/renderer/shell-settings/shell-settings.test.tsx:132` hardcodes the
  KPI tile count (`toHaveLength(4)`) instead of deriving it from `mockCatalog`, violating the
  spec's own explicit "número de tiles" example of what must never be a bare literal. Calibrated
  against this pipeline's own precedent (statuschip-nav round's finding 101, same issue class,
  medium/non-blocking).
- **002 (medium)** — No render-level test asserts the "Key metrics" group's own loading/empty/
  error copy (AC-010/011/012); only the data-level `selectors.test.ts` covers those copy strings,
  and the integration matrix's error-scenario check is satisfied by the other 4 Overview groups
  regardless of whether the `kpis` slot itself renders correctly. Plan.md's own "Verification
  approach" anticipated new copy asserts that were not added.
- **003 (low)** — `'Running'` as the definition of "active agent" is duplicated (no shared
  helper) between `selectors.ts`'s `buildKpiViewModels()` and `Shell.tsx`'s
  `mapSessionStatusToTone`. Accepted/discussed in ADR-0001; flagged only as a minor
  maintainability note.
- **004 (low)** — The `agent-time` lookup's `'—'` fallback branch (`selectors.ts:90-91`) is never
  exercised by a test.
- **005 (low)** — AC-013's literal spec wording ("sucesso/atenção/accent") could be misread as a
  mandate to use all three token categories; the shipped, ADR-0003-approved implementation only
  ever uses `--ink`/`--accent`. Documentation-only gap, not a code defect.

## What was verified and found clean (no issue filed)

- **Security**: no XSS path (fixture-only data flow through typed props, no
  `dangerouslySetInnerHTML`), no new IPC/filesystem/network surface, no known CVEs in
  `recharts@3.9.2` or its resolved transitive tree (`@reduxjs/toolkit@2.12.0`,
  `react-redux@9.3.0`, `immer@11.1.11`, etc. — checked via `npm audit` and web search), dependency
  addition properly HITL-gated (ADR-0002, `ask_first` boundary honored).
- **Requirements & DoD**: all 18 ACs (AC-001..AC-018) independently traced from spec.md line
  numbers to actual current source/test lines — all Implemented. AC-009's specific ask (confirm
  the shipped CSS uses **exactly** `fill-opacity: 0.75`, `var(--accent, var(--border))`,
  `var(--ink)`, `var(--surface-raised)`) was checked byte-for-byte against
  `memory/contrast-audit.md`/ADR-0003 — zero deviation. AC-014's zero-edit requirement on
  `concepts.module.css` and AC-017's `recentUsage` preservation both independently re-confirmed
  via `git diff`.
- **Architecture & Conventions**: `MetricTile.tsx` mirrors `StatusChip.tsx`'s organizational
  pattern; all new CSS values consume design tokens via `var()`; zero edits to
  `concepts.module.css`/`tests/renderer/setup.ts` (confirmed via `git diff`, both empty); the
  3 commits' touched files match the tasks' declared disjoint scopes exactly (the one apparent
  deviation — removing the dead `DataList` helper and its orphaned CSS, which plan.md's table
  said would stay "INTOCADO" — is explicitly authorized in `tasks/003-shell-kpi-strip-
  integration.md` as a documented, in-scope deviation); `package.json` diff is exactly the one
  `recharts` line.
- **Regression & Hallucination**: all Recharts props/imports (`Bar`, `BarChart`, `width`,
  `height`, `margin`, `accessibilityLayer`, `isAnimationActive`, `dataKey`, `className`) verified
  against the installed package's actual `.d.ts` files — no invented/hallucinated API. `DataList`
  fully removed (zero references anywhere in `src/`/`tests/`). `.dataList` CSS cleanly removed
  from `shell.module.css` with `.projectSummary`'s own rules confirmed byte-identical before/
  after. No leftover `TODO`/`FIXME`/`console.log`/`debugger`. Full regression: 181/181 tests
  pass (independently re-run, not just trusted from the handoff), other 4 Overview panels'
  assertions unchanged/unweakened.
- **Verify gate**: `npm run lint` (0 issues), `npm run typecheck` (0 errors), `npm run test`
  (181/181, 15 files) — all independently re-run by multiple review agents, not just copied from
  `memory/handoff-004.md`.

## Gap noted, not covered by this round

`plan.md`'s "Verification approach" step 4 (visual screenshot check at 1024×700 and 1440×900
across all 3 concepts, confirming the sparkline is legible and the 2×2 grid holds) was flagged
`PENDENTE` in `memory/handoff-004.md` and assigned to review — but it is not one of the 5
dimensions this round's dispatch defines (S1 Security, S2 Requirements & DoD, S3 Test Coverage,
S4 Architecture & Conventions, S5 Regression & Hallucination), and none of the 5 parallel agents
performed it. Noting it here as an open item for whoever runs that check next, not as a filed
issue (no code-level finding to attach it to).

## Blocking assessment

Round does **not** block merge: 0 Critical, 0 High. The 2 Medium findings are test-quality/
coverage gaps with concrete, small fixes (both confined to test files, no source changes
implied) — consistent with this pipeline's own precedent for how this severity class is
calibrated (see night-harbor-p2-statuschip-nav's reviews-001, findings 101/201, same treatment).
