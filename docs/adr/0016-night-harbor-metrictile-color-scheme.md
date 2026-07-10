# ADR 0016 — Night Harbor MetricTile color scheme: plain-ink numeral on surface-raised + accent sparkline at 0.75 fill-opacity

## Status

accepted

## Context

Night Harbor P2.3's `MetricTile` needs a numeral (text, ≥4.5:1) and a sparkline (non-text
graphical mark, ≥3:1 per WCAG 1.4.11) over a tile background, audited by script against the
effective composited background (per ADR 0014's precedent and the
`contrast-math-by-script-not-llm-arithmetic` learning — the audit ran at PLAN time, before any
implementation). Unlike StatusChip's night-harbor-exclusive status tokens, all of MetricTile's
candidate tokens (`--accent`, `--surface-raised`, `--ink`, `--border`) are defined in all three
concepts — so the `var()` fallback chain is defensive only and never triggers today.

## Decision

- **Tile background**: `var(--surface-raised)` (opaque — no deeper compositing needed),
  consistent with `.toast`/`.statePanel` nested-panel precedent.
- **Numeral**: plain `var(--ink)`. No tone-per-KPI — none of the four KPIs has a threshold or
  business rule in scope; tone without a threshold invents unrequested semantics.
- **Sparkline bars**: `fill: var(--accent, var(--border))` + `fill-opacity: 0.75`, applied via
  CSS module class on `<Bar className>` (the SVG `fill` presentation attribute loses to the
  cascade — this is how `var()` resolves per active concept). `--border` is the defensive
  fallback for a hypothetical future concept lacking `--accent`.
- **Why 0.75**: a sparkline bar is a foreground mark (must clear 3:1), not a background tint —
  StatusChip's 85% number does not transfer by analogy. Script-computed
  `blend(accent, surface-raised, alpha)` vs `surface-raised`: 0.70 is the exact minimum
  clearing 3:1 in all three concepts, but command-deck sits at 2.99:1 one step below (0.65) —
  too close to the floor. 0.75 gives real margin while remaining visibly translucent.

Audited ratios (exact WCAG 2.1 luminance, script-run; full tables in the run's
`memory/contrast-audit.md`):

| Pair | night-harbor | command-deck | signal-poster |
| --- | --- | --- | --- |
| sparkline @ 0.75 vs surface-raised | 4.16:1 | 3.64:1 | 3.80:1 |
| numeral `--ink` vs `--surface-raised` | 14.09:1 | 16.96:1 | 15.78:1 |

- **Legacy degradation (AC-014, HITL-resolved)**: command-deck/signal-poster render the tiles
  with their **native** accent (green/purple) — zero per-concept code, zero edits to
  `concepts.module.css`. The literal-gray reading (a night-harbor-only `--metric-accent`
  token) was rejected at the plan gate; reversible additively if ever preferred.

## Alternatives

- **Tone-per-KPI** (success-rate in `--success`, etc.) — rejected: requires thresholds not in
  scope (P3 territory) and would only color under night-harbor, making tiles inconsistent in
  kind across concepts.
- **85% fill-opacity by analogy with StatusChip** — rejected: passes the ratio but reuses a
  number whose goal (subtle background tint) differs from a foreground mark's; the value must
  come from the script output, not pattern-matching.
- **`--metric-accent` night-harbor-only token** (literal gray degradation) — flagged as a
  genuine fork and resolved at the HITL plan gate in favor of native accent.
- **`--on-accent` for the numeral** — rejected without a fresh audit: `on-*` presumes the
  solid token as background (ADR 0014 / on-token semantics); the numeral sits on
  `--surface-raised`.

## Consequences

- `fill-opacity: 0.75` is a CSS-module constant; if any concept's `--accent` or
  `--surface-raised` hex changes, this ADR's table must be recomputed by script before merge
  (same standing rule as ADR 0014).
- Legacy concepts render a fully colored sparkline and plain-ink numeral — this is the
  resolved meaning of "neutral degradation" for metric tiles.
- `fill-opacity` needs no `@supports` fallback (SVG 1.1-era, no support gap in Electron/
  Chromium) — unlike StatusChip's `color-mix`.

## References

- `.orquestrador/night-harbor-p2-kpi-strip/adr/0003-metrictile-color-scheme.md` (run-local,
  full audit trail) and `memory/contrast-audit.md`
- `src/renderer/src/ui/MetricTile.tsx`, `src/renderer/src/ui/primitives.module.css`
- ADR 0014 (StatusChip — the tinted-background counterpart of this decision)
- Atlas: `contrast-math-by-script-not-llm-arithmetic`, `on-token-semantics-text-over-token-bg`
