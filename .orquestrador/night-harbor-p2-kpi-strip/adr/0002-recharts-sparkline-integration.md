---
id: 0002
title: Recharts sparkline integration strategy (version, import surface, jsdom rendering)
status: accepted
date: 2026-07-10
---

# ADR-0002 — Recharts sparkline integration strategy

## Context

G3 (locked, not reopened) approved Recharts as a new dependency for a static bar sparkline,
8–12 points, `aria-hidden`, testable headless. `recharts` is confirmed absent from
`package.json` (handoff-001.md N1). Three concrete things were left for the plan
(handoff-001.md, "Recharts — decisões que o plan deve fechar"):

1. Exact version to pin, and peer-dep compatibility with the installed
   `react@^18.3.1`/`react-dom@^18.3.1`.
2. Minimal import surface (which components), and whether `ResponsiveContainer` is needed —
   flagged ALTO risk (R1) because `ResponsiveContainer` depends on `ResizeObserver`, which
   jsdom does not implement, and the project's test environment
   (`jsdom@^29.1.1`) has no existing polyfill for it.
3. How to fully disable Recharts' interactive/keyboard layer so the sparkline is inert and
   decorative, matching the "Out: nenhuma interatividade" non-goal and AC-006/AC-016.

These are engineering facts, not taste calls, so they were verified empirically (isolated
scratchpad probe: `recharts@3.9.2` + `react@18.3.1` + `vitest@2.1.8` + `jsdom@29.1.1` +
`@testing-library/react@16.3.2`, matching this repo's exact toolchain versions) rather than
inferred from documentation alone.

## Decision

**Version**: pin `"recharts": "^3.9.2"` in `package.json` `dependencies` (confirmed current npm
`latest` for the 3.x line at plan time via `npm view recharts version`). Peer deps
(`npm view recharts@3.9.2 peerDependencies`) are `react`/`react-dom`
`^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0` — the installed `^18.3.1` for both satisfies this
directly, no upgrade needed. Recharts also peer-depends on `react-is` in the same version
range; `react-is@17.0.2` is already present in the tree transitively (satisfies the peer
range), so no explicit `react-is` dependency entry is required.

**Import surface**: `import { Bar, BarChart } from 'recharts'` — nothing else. No
`ResponsiveContainer`, `CartesianGrid`, `XAxis`/`YAxis`, `Tooltip`, `Legend`, or `Cell` (single
uniform series color, no per-bar distinction needed). Verified empirically that `BarChart` +
`Bar` alone render a clean bars-only `<svg>` with no incidental axis/grid/tooltip DOM.

**Dimensions**: fixed `width={48} height={16}` on `<BarChart>`, no `ResponsiveContainer`.
Verified empirically in the isolated probe that this renders correctly in jsdom **even with
`ResizeObserver` deleted from `globalThis` entirely** — Recharts' non-responsive path never
calls it. This closes R1 outright: `tests/renderer/setup.ts` needs **no** `ResizeObserver`
polyfill/mock for this feature.

**Margin**: `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}` on `<BarChart>`. Verified
empirically that Recharts' default margin (non-zero on all sides) consumes over half of a
16px-tall canvas — measured bar heights topped out around 5.5px of 16 with default margin,
vs. up to ~14.7px of 16 with margin zeroed. At sparkline scale this default is not a
stylistic nicety, it is the difference between a visible and an invisible chart.

**Decorative/inert rendering** (AC-006, "Out: nenhuma interatividade"):
- `accessibilityLayer={false}` on `<BarChart>`. Verified empirically that Recharts 3.x injects
  `role="application"` and `tabindex="0"` onto the rendered `<svg>` by default (its own
  keyboard-navigable chart layer) — inappropriate for a purely decorative mark whose value is
  already communicated by the numeral and label. `accessibilityLayer={false}` removes both
  attributes entirely (confirmed: neither attribute is present on the resulting `<svg>`).
- The chart is additionally wrapped in `<div aria-hidden="true">` at the `MetricTile` level —
  belt-and-suspenders; `aria-hidden` on an ancestor removes the whole subtree from the
  accessibility tree regardless of any role Recharts assigns internally.
- `isAnimationActive={false}` on `<Bar>`. Disables Recharts' default mount animation
  unconditionally — the sparkline is static by construction (AC-015/AC-016), so no
  `useReducedMotion()` ternary is needed (this is a build-time constant, not a
  reduced-motion-conditional behavior).
- No `<Tooltip>` is mounted, so hover produces no visible change even though Recharts'
  internal store still tracks pointer state; `.metricSpark { pointer-events: none; }` is added
  defensively so no mouse interaction reaches the chart at all.

## Alternatives considered

- **`ResponsiveContainer` + a `ResizeObserver` polyfill/mock in `tests/renderer/setup.ts`** —
  rejected: adds a global test-environment dependency for a chart whose real-world size is a
  fixed design token (a sparkline inside a fixed-size tile), not something that needs to
  respond to container resize. Fixed dimensions are simpler, match the actual visual design,
  and were verified to work without any jsdom accommodation.
- **`import * as Recharts from 'recharts'`** — rejected per the spec's explicit "não
  `import * as Recharts`" instruction (handoff-001.md); named imports are used throughout.
- **Manually stripping `role`/`tabindex` post-render via a `ref` effect** — rejected once
  `accessibilityLayer={false}` was confirmed to remove them natively; a manual DOM patch would
  be redundant and more fragile across Recharts versions.
- **Suppressing Recharts' default animation via a global CSS `animation: none` override** —
  rejected: `isAnimationActive={false}` is the library's own supported mechanism and avoids
  fighting Recharts' internal transition logic with CSS.

## Consequences

- No changes to `tests/renderer/setup.ts` are needed for this feature.
- Recharts 3.x's own (non-peer) dependencies are heavier than the sparkline's visual
  complexity would suggest — `npm view recharts@3.9.2 dependencies` lists
  `@reduxjs/toolkit`, `react-redux`, `immer`, `victory-vendor`, `es-toolkit`,
  `decimal.js-light`, `reselect`, `eventemitter3`, `clsx`, `tiny-invariant`,
  `use-sync-external-store` as hard dependencies (unpacked size ≈7.3MB per `npm view
  recharts@3.9.2 dist.unpackedSize`), because Recharts 3's internal chart state is Redux-backed
  regardless of which chart type is imported. Named imports (`{ Bar, BarChart }`) avoid pulling
  in *unused chart types* (line/area/pie/radar/etc. and their extra code), but do **not** avoid
  this transitive dependency chain — it ships with `BarChart` itself. This was flagged as R5
  (bundle size) in handoff-001.md and is accepted as a known, disclosed cost of the
  already-approved G3 decision, not re-opened here. If bundle size becomes a concrete problem
  later, the mitigation is code-splitting `MetricTile`'s sparkline via dynamic `import()`, not
  a different import style — noted as a residual/future risk in `plan.md`.
- Any future addition of a 2nd chart type (e.g., a real line chart in P3) can reuse the same
  fixed-dimension, `accessibilityLayer`-aware pattern established here.
