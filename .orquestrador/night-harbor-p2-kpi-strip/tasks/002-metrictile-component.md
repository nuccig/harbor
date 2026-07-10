---
id: 002
title: MetricTile component — numeral + static sparkline (Recharts)
status: pending
depends_on: []
covers: [AC-003, AC-004, AC-005, AC-006, AC-009, AC-013, AC-014, AC-015, AC-016]
ears_pattern: WHEN/THEN, WHERE/WHEN/THEN, WHILE/THEN
created: 2026-07-10
---

# Task 002 — MetricTile component (numeral + static sparkline)

## Goal

Install `recharts`, create the `MetricTile` component (`ui/` folder, StatusChip-style: thin TSX
+ CSS module tokens), and cover it with render/accessibility tests — a self-contained,
data-agnostic presentational component that takes `{ label, value, series }` as props.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `package.json` (this task is the **owner** of the `npm install` — see Steps)
- `package-lock.json` (side effect of the same install; same task, cannot be split)
- `src/renderer/src/ui/MetricTile.tsx` (new)
- `src/renderer/src/ui/index.ts`
- `src/renderer/src/ui/primitives.module.css`
- `tests/renderer/ui/metric-tile.test.tsx` (new)

Do **not** touch: `src/renderer/src/app/mock-catalog.ts`, `src/renderer/src/app/selectors.ts`,
`src/renderer/src/shell/*`, `src/renderer/src/concepts/concepts.module.css`,
`tests/renderer/model/selectors.test.ts`, `tests/renderer/shell-settings/shell-settings.test.tsx`,
`tests/renderer/setup.ts`.

## Governing skill

None. There is no dedicated skill for this repo's `ui/` component convention — mirror
`src/renderer/src/ui/StatusChip.tsx` directly (thin function component + CSS module, tokens via
`var()` with defensive fallback, no default export). The `dataviz` skill governs chart/sparkline
*design* choices in general, but it was already consulted at plan time (see plan.md
"Approach" — "forma... segue a skill `dataviz`... stat tile com micro-viz decorativa") and its
conclusions are already baked into the exact API/DOM below; there is no need to re-invoke it for
this task.

## Steps

1. Run `npm install recharts@^3.9.2`. This is a pre-approved dependency (HITL gate G3,
   documented in ADR-0002 and `plan.md`) — do not ask for re-approval, but do mention the
   addition explicitly in the commit/PR description so it stays traceable (constitution
   boundary `ask_first`, already satisfied, just needs to stay visible). Confirm after install
   that `package.json`'s `dependencies` gained exactly one new entry
   (`"recharts": "^3.9.2"`) and that no other dependency versions were bumped as a side effect
   (if `npm install` touches unrelated lockfile entries, that is worth a second look, not
   something to silently accept).

2. Create `src/renderer/src/ui/MetricTile.tsx`:

   ```tsx
   import { Bar, BarChart } from 'recharts'
   import styles from './primitives.module.css'

   export interface MetricTileProps {
     label: string
     value: string
     series: readonly number[]
   }

   export function MetricTile({ label, value, series }: MetricTileProps) {
     return (
       <div className={styles.metricTile}>
         <span className={styles.metricLabel}>{label}</span>
         <span className={`${styles.metricValue} ${styles.data}`}>{value}</span>
         <div aria-hidden="true" className={styles.metricSpark}>
           <BarChart
             accessibilityLayer={false}
             data={series.map((v, i) => ({ i, v }))}
             height={16}
             margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
             width={48}
           >
             <Bar className={styles.metricSparkBar} dataKey="v" isAnimationActive={false} />
           </BarChart>
         </div>
       </div>
     )
   }
   ```

   Import surface is **exactly** `{ Bar, BarChart }` — no `ResponsiveContainer`, no
   `CartesianGrid`/`XAxis`/`YAxis`/`Tooltip`/`Legend`/`Cell`, no `import * as Recharts`
   (spec explicitly forbids the namespace-import style). `MetricTile` must **not** import
   anything from `../app/selectors` or `../app/mock-catalog` — props arrive fully formed
   (testable in isolation, same discipline as `StatusChip`).

3. Add a new block to `primitives.module.css` (copy verbatim — see "Context" for why these
   exact values are not negotiable):

   ```css
   .metricTile {
     background: var(--surface-raised);
     border: 1px solid var(--border);
     border-radius: var(--radius-control);
     display: grid;
     gap: var(--space-1);
     padding: var(--space-3);
   }
   .metricLabel {
     color: var(--ink-muted);
     font-size: var(--type-small);
     font-weight: var(--weight-label);
   }
   .metricValue {
     color: var(--ink);
     font-size: var(--type-metric);
     font-weight: var(--weight-heading);
     line-height: 1.1;
   }
   .metricSpark {
     pointer-events: none; /* inert by construction — AC-016 */
   }
   .metricSparkBar {
     fill: var(--accent, var(--border));
     fill-opacity: 0.75; /* audited: 4.16 / 3.64 / 3.80 :1 — memory/contrast-audit.md */
   }
   ```

4. Add `export * from './MetricTile'` to `src/renderer/src/ui/index.ts`, inserted alphabetically
   (the file is mostly alphabetical already): after `export * from './FocusHeading'` and before
   `export * from './SemanticIcon'`.

5. Create `tests/renderer/ui/metric-tile.test.tsx`, mirroring the structure of
   `tests/renderer/ui/status-chip.test.tsx` (render + substring class asserts, no snapshot
   tests). Import `mockCatalog` from `../../../src/renderer/src/app/mock-catalog` **only** to
   read real series arrays for fixture-driven counts (never to compute a KPI value — that stays
   Task 001's job). Cover, at minimum:
   - label text is present in the DOM and precedes the value text (AC-003 — query order, e.g.
     via `container.textContent.indexOf(label) < container.textContent.indexOf(value)` for a
     case where label/value don't overlap as substrings).
   - the value element has a `metricValue`-substring class (`[class*="metricValue"]`) and its
     text content equals the passed `value` prop unchanged (AC-004).
   - bar count equals `series.length` for a series read from
     `mockCatalog.kpis.series['active-agents']` (real 10-point fixture, not a hardcoded `10`):
     `container.querySelectorAll('.recharts-rectangle, [class*="metricSparkBar"]')` filtered to
     actual bar shapes, `.length === series.length` (AC-005).
   - loop over all 4 keys of `mockCatalog.kpis.series` and assert
     `length >= 8 && length <= 12` for each (AC-005, whole-fixture check, not just the one
     series used above).
   - the sparkline wrapper has `aria-hidden="true"`, and the rendered `<svg>` has neither a
     `role="application"` attribute nor a `tabindex` attribute (AC-006).
   - no `<animate>` element anywhere in the rendered SVG, and no inline `style` attribute
     containing `transition` on any bar path (AC-016 — static/inert proxy check, since
     `isAnimationActive`/`accessibilityLayer` themselves are not directly queryable from the
     DOM, only their *effects* are).
   - reduced-motion equivalence (AC-015, both branches collapsed into one equality check):
     mock `window.matchMedia` via `Object.defineProperty` (same pattern as
     `tests/renderer/model/use-reduced-motion.test.ts`) to return `{ matches: true }`, render
     `MetricTile`, capture `container.innerHTML`; repeat with `{ matches: false }`; assert the
     two captured HTML strings are identical. This is the concrete proof that "no dedicated
     motion logic is needed" (the component has no `useReducedMotion()` call and no conditional
     branch at all) rather than an assumption.
   - structural class-presence check for `metricSparkBar`/`metricValue` (AC-013/AC-014 proxy —
     see "Context": jsdom cannot resolve `var()`, so class presence is the practical check; the
     same single render proves both branches because the component has no per-concept
     conditional).

## Acceptance check

- [ ] AC-003: label renders as visible text, positioned before the numeral in DOM order.
- [ ] AC-004: numeral carries a `metricValue`-substring class and displays the `value` prop text
      unchanged (no re-formatting inside the component).
- [ ] AC-005: bar count equals the fixture series length used in the render (not a literal);
      every one of the 4 fixture series independently asserted `8 <= length <= 12`.
- [ ] AC-006: sparkline wrapper `aria-hidden="true"`; rendered `<svg>` has no `role="application"`
      and no `tabindex` attribute.
- [ ] AC-009 (review-level, not a jsdom color computation — verify gate is blind to contrast):
      `.metricSparkBar` in `primitives.module.css` reads exactly
      `fill: var(--accent, var(--border)); fill-opacity: 0.75;`; `.metricValue`/`.metricTile`
      use `var(--ink)` over `var(--surface-raised)` with no per-KPI tone override — confirmed by
      direct comparison against `memory/contrast-audit.md`'s "Decisão Final", not recomputed.
- [ ] AC-013 branch (night-harbor): no `data-concept`-conditional code path exists in
      `MetricTile.tsx` — the same markup/classes render regardless of active concept, so the
      night-harbor tokens resolve through the same `var()` chain as every other concept.
- [ ] AC-014 branch (legacy concepts): zero edits introduced to
      `src/renderer/src/concepts/concepts.module.css` by this task; the `var(--accent,
      var(--border))`/`var(--ink)` fallback chains are present in the new CSS as written (the
      structural proof that legacy concepts degrade via existing tokens, not bespoke code).
- [ ] AC-015 (both reduced-motion states, one equality assertion): rendered HTML identical with
      `matchMedia` mocked `matches: true` and `matches: false`.
- [ ] AC-016: `<Bar isAnimationActive={false}>` is unconditional in source; rendered SVG has no
      `<animate>` element and no inline `transition` style; `.metricSpark` has
      `pointer-events: none`.

## Validation criteria (optional)

Zero new ESLint/TypeScript warnings. `npm run test` for this task's own test file is green
**once Task 001 has also landed** `mockCatalog.kpis` (see "Context" — this is a documented
cross-task data dependency, not a file-scope conflict). Bundle-size increase from Recharts
(~7.3MB unpacked, Redux-backed internals per ADR-0002) is a known/accepted cost of the
already-approved G3 decision — do not re-flag it in review.

## Context

- Copy the DOM structure, prop names, and every Recharts prop (`width={48} height={16}`,
  `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`, `accessibilityLayer={false}`,
  `isAnimationActive={false}`, `aria-hidden="true"` on the wrapper) **verbatim** from plan.md /
  ADR-0002 — every one of these is an empirically-proven fact from an isolated probe (recharts
  3.9.2 + react 18.3.1 + vitest 2.1.8 + jsdom 29.1.1 + RTL 16.3.2), not a style preference:
  - `margin` zeroed: Recharts' default margin eats over half of a 16px canvas (~5.5px of 16 vs
    ~14.7px of 16 with margin zeroed) — at sparkline scale this is visibility, not aesthetics.
  - `accessibilityLayer={false}`: Recharts 3.x injects `role="application"` + `tabindex="0"` on
    the `<svg>` by default, which would make a "decorative" sparkline a keyboard tab-stop —
    this prop is what removes both attributes; `aria-hidden` on the wrapper is
    belt-and-suspenders on top of it, not a substitute for it.
  - Fixed `width`/`height` (no `ResponsiveContainer`): proven to render correctly in jsdom even
    with `ResizeObserver` deleted from `globalThis` entirely. Do **not** add a
    `ResizeObserver` polyfill/mock to `tests/renderer/setup.ts` — it is out of this task's file
    scope and genuinely unnecessary; if a test fails for a `ResizeObserver`-shaped reason,
    investigate rather than reach for a polyfill (that would mean something drifted from the
    proven, fixed-dimension approach).
  - `fill: var(--accent, var(--border))` on `.metricSparkBar`, applied via `Bar`'s `className`
    prop: Recharts renders each bar as `<path class="recharts-rectangle ...">`, and the CSS
    module rule's `fill` wins over any presentation attribute Recharts sets directly — this is
    how a CSS custom property reaches an SVG `fill`, not via a `fill` prop passed to `<Bar>`.
- `fill-opacity: 0.75` and the token chains above are **fixed constants** from
  `memory/contrast-audit.md` (ADR-0003) — do not recompute, do not swap to StatusChip's 85%
  "for consistency" (ADR-0003 explicitly rejects that: StatusChip tints a *background*,
  MetricTile's sparkline is a *foreground graphical mark*, different transparency-vs-legibility
  goals, 0.75 came from the script, not from analogy). If any hex token or this opacity ever
  changes, the contrast script must be re-run before merge — flag that to review, don't
  eyeball it.
- Do not touch `src/renderer/src/concepts/concepts.module.css` — AC-014/G4 boundary; all 5
  tokens this component consumes (`--surface-raised`, `--border`, `--ink`, `--ink-muted`,
  `--accent`) already exist in all 3 concepts (confirmed by direct read), so the `var()`
  fallback chains are defensive engineering for a hypothetical future concept, not an active
  legacy-degradation path today — legacy concepts will render this tile in their own native
  accent hue (green command-deck, purple signal-poster), which is the resolved reading of
  "neutral degradation" for this feature (ADR-0003), not literal gray.
- **Known cross-task data coupling (not a file-scope conflict)**: this task's test file imports
  `mockCatalog` to read `mockCatalog.kpis.series` for real, fixture-driven bar-count and
  length-bound assertions (per plan's approved test strategy: "count do fixture, nunca
  literal"). That `kpis` field is added to `mock-catalog.ts` by Task 001 ("Dados"), which is a
  different file (no scope overlap) but a data/symbol dependency: `MetricTile.tsx` itself has
  zero import from `selectors.ts`/`mock-catalog.ts` and can be fully implemented, and manually
  exercised, independent of Task 001 — but this specific test file will only type-check and
  pass once Task 001's `mockCatalog.kpis` block exists in the working tree. Recommendation:
  implement Task 001 and this task in parallel (both are genuinely independent at the
  file/code level), but do not report this task's own `npm run test`/`npm run typecheck` as
  fully green until Task 001 has also merged — merge Task 001 first, or merge both and run the
  verify gate once against the combined tree, before either task is signed off as PASS in
  isolation.
