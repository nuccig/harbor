# ADR 0015 — Recharts sparkline integration: pinned 3.x, minimal imports, fixed dimensions, inert rendering

## Status

accepted

## Context

Night Harbor P2.3 introduces a static, decorative bar sparkline inside `MetricTile`
(`src/renderer/src/ui/MetricTile.tsx`). Recharts was approved as a new dependency (HITL G3).
Open engineering questions — exact version/peer-deps, import surface, whether
`ResponsiveContainer` is required (jsdom has no `ResizeObserver`), and how to make the chart
fully inert — were settled empirically in an isolated probe matching the repo's exact
toolchain (`recharts@3.9.2`, `react@18.3.1`, `vitest@2.1.9`, `jsdom@29.1.1`,
`@testing-library/react@16.3.2`), not inferred from docs.

## Decision

- **Version**: `"recharts": "^3.9.2"` in `dependencies`. Peer deps
  (`react`/`react-dom`/`react-is` `^16.8 || ^17 || ^18 || ^19`) satisfied by the installed
  `react@^18.3.1`; `react-is` already present transitively.
- **Import surface**: `import { Bar, BarChart } from 'recharts'` — nothing else. `BarChart` +
  `Bar` alone render a clean bars-only `<svg>` (no incidental axis/grid/tooltip DOM).
- **Dimensions**: fixed `width={48} height={16}`, **no `ResponsiveContainer`**. Verified to
  render in jsdom even with `ResizeObserver` deleted from `globalThis` — the non-responsive
  path never calls it. `tests/renderer/setup.ts` stays untouched.
- **Margin**: `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`. The library default
  consumes over half of a 16px canvas (bars topped ~5.5px of 16 vs ~14.7px zeroed) — at
  sparkline scale this is visible-vs-invisible, not styling.
- **Inert/decorative rendering**: `accessibilityLayer={false}` on `<BarChart>` (Recharts 3
  injects `role="application"` + `tabindex="0"` by default — removed entirely by the flag);
  `aria-hidden` wrapper at the component level; `isAnimationActive={false}` on `<Bar>` (static
  by construction, no `useReducedMotion()` ternary needed); no `<Tooltip>` mounted;
  `pointer-events: none` on the chart container.

## Alternatives

- **`ResponsiveContainer` + `ResizeObserver` polyfill in test setup** — rejected: global
  test-environment dependency for a fixed-size design element; fixed dimensions verified to
  need zero jsdom accommodation.
- **`import * as Recharts`** — rejected: spec mandates named imports.
- **Stripping `role`/`tabindex` post-render via ref effect** — rejected:
  `accessibilityLayer={false}` removes them natively; a DOM patch is fragile across versions.
- **Suppressing mount animation via global CSS `animation: none`** — rejected:
  `isAnimationActive={false}` is the library's supported mechanism.

## Consequences

- Recharts 3's internal state is Redux-backed regardless of chart type: `@reduxjs/toolkit`,
  `react-redux`, `immer`, `victory-vendor` etc. ship with `BarChart` itself (~7.3MB unpacked).
  Named imports avoid unused chart types but not this chain — accepted, disclosed cost;
  mitigation if it ever matters is code-splitting via dynamic `import()`, not import style.
- Any future Recharts chart reuses this pattern: pinned 3.x, named imports, fixed dimensions
  (or an audited responsive strategy), `accessibilityLayer` decided explicitly, margin zeroed
  at miniature scale.
- Testing gotchas that follow from this integration (bar counting, `matchMedia` stub, volatile
  ids) are recorded in the `harbor-night-harbor-ui` skill and the atlas
  (`recharts-jsdom-testing-gotchas`).

## References

- `.orquestrador/night-harbor-p2-kpi-strip/adr/0002-recharts-sparkline-integration.md`
  (run-local, full probe evidence)
- `src/renderer/src/ui/MetricTile.tsx`, `src/renderer/src/ui/primitives.module.css`
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (MetricTile/Sparkline rules)
- ADR 0016 (color scheme for the same component)
