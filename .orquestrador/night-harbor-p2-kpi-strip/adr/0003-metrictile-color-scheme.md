---
id: 0003
title: MetricTile color scheme — numeral, sparkline fill-opacity, and legacy-concept fallback
status: accepted
date: 2026-07-10
---

# ADR-0003 — MetricTile color scheme

## Context

AC-009 requires any new color pair to clear WCAG 2.1 exactly (4.5:1 text, 3:1 non-text),
computed against the **effective composited background**, by script — never by estimate
(learning `contrast-math-by-script`, hard-earned in the previous run: ADR-0014's rev. 1 audit
had a wrong luminance and an inverted ratio formula). AC-013 requires night-harbor's tile
colors to resolve to "already-existing" tokens (success/warning/accent — read as the pool of
acceptable tokens, not a mandate to use all three; see "Alternatives"). AC-014 requires
command-deck/signal-poster to "degrade to a neutral appearance" with zero edits to those
concepts' CSS. D-004/G4 mandates the same `var(--token, fallback)` technique used by
`StatusChip` (ADR-0014).

Unlike `StatusChip`'s tones (`--success`/`--warning`/`--danger` are night-harbor-exclusive —
command-deck/signal-poster don't define them, so the `var()` fallback chain actively
*triggers* under legacy concepts, landing on `--ink-muted`/`--border`), `MetricTile`'s
candidate tokens (`--accent`, `--surface-raised`, `--border`, `--ink`) are **defined in all
three concepts already** (confirmed by reading `concepts.module.css` directly). This changes
what "neutral fallback" can mean here: the fallback chain is real defensive engineering
(guards a hypothetical future concept that omits one of these tokens) but, for today's three
concepts, it never actually triggers — legacy concepts render using their own pre-existing
`--accent`/`--ink` hue, not gray.

## Decision

**Tile background**: `var(--surface-raised)` — a small "raised" card nested inside the
Overview group's own `var(--surface)` background, consistent with existing nested-panel
precedent (`.toast`, `.statePanel` both use `--surface-raised` the same way). This is the
*effective background* for both audits below — it is fully opaque, so no further compositing
with `--surface`/`--canvas` underneath is required (unlike `StatusChip`'s translucent
`color-mix` tint, which did need that deeper composite).

**Numeral**: plain `var(--ink)` — universal, uncolored text ink. No per-KPI success/warning
tinting. Rationale: none of the four KPIs has a threshold or business rule in scope (no
"queue > N is bad," no "success rate < X is a warning" — those are explicitly P3/non-goal
territory, "Annotation callouts... interpretar"). Introducing tone-per-tile without a defined
threshold would be inventing meaning the spec doesn't ask for. `--ink` is also the one token
guaranteed to look *identical in kind* (plain foreground text) across all three concepts,
which is the most literal reading of "neutral."

**Sparkline bar fill**: `var(--accent, var(--border))` with `fill-opacity: 0.75`, applied via
a CSS module class passed to `<Bar className>` (verified empirically that `Bar`'s
`className` prop lands on every individual `<path class="recharts-rectangle ...">` node, and
that the SVG `fill` attribute accepts a literal `var(...)` string — presentation attributes
participate in the normal CSS cascade). `--accent` is the single token G3 names for the
sparkline ("accent com opacidade"); `--border` is the defensive fallback for a hypothetical
future concept lacking `--accent`.

**Why 0.75, not the spec's precedent 85%**: this is a different kind of pair than
`StatusChip`'s background tint. A background tint is meant to be *subtle* (mostly the
surface showing through, per ADR-0014's 85%-transparent choice); a sparkline bar is a
*foreground graphical mark* that itself must clear the WCAG 1.4.11 non-text 3:1 floor against
what's behind it. Script-computed contrast (WCAG 2.1 exact sRGB linearization, exponent 2.4;
full table in `memory/contrast-audit.md`) for `blend(accent, surface-raised, alpha)` vs.
`surface-raised`, across all three concepts:

| alpha (fill-opacity) | night-harbor | command-deck | signal-poster |
| --- | --- | --- | --- |
| 0.60 | 3.20:1 ✓ | 2.71:1 ✗ | 2.82:1 ✗ |
| 0.65 | 3.49:1 ✓ | 2.99:1 ✗ (0.01 short) | 3.11:1 ✓ |
| 0.70 | 3.83:1 ✓ | 3.29:1 ✓ | 3.43:1 ✓ |
| **0.75** | **4.16:1 ✓** | **3.64:1 ✓** | **3.80:1 ✓** |

0.70 is the exact minimum that clears 3:1 in all three concepts, but command-deck sits at
2.99:1 just one step below it (0.01 off the floor at 0.65) — too close to a rounding/rendering
edge to be the shipped value. **0.75** was chosen for a real margin above the floor in every
concept, while remaining visibly translucent (not full-opacity `--accent`, which the numeral
audit below shows is unnecessary anyway).

**Numeral contrast** (`--ink` vs `--surface-raised`, exact WCAG 2.1):

| Concept | ink | surface-raised | Ratio |
| --- | --- | --- | --- |
| night-harbor | #f3f7ff | #152642 | 14.09:1 ✓ |
| command-deck | #111827 | #f8fafc | 16.96:1 ✓ |
| signal-poster | #111111 | #efe7ff | 15.78:1 ✓ |

All comfortably clear 4.5:1 with wide margin (these are plain-ink-on-panel pairs, not tinted
pairs, so the margins are large by construction).

Full computation, script, and every intermediate value are recorded in
`memory/contrast-audit.md` — this ADR states the conclusion, that file is the audit trail.

## Alternatives considered

- **Tone-per-KPI** (e.g., success-rate tile in `--success`, queue tile in `--warning`) —
  rejected: would require defining a threshold/business rule not in scope (when is a queue
  "bad"? when is a success rate "low"?), which the non-goals explicitly defer to P3
  ("annotation callouts... interpretar pelo usuário"). Also would only render color under
  night-harbor (the only concept defining `--success`/`--warning`), making the KPI strip's
  *look* inconsistent in kind across tiles (some accent, some tone) for no functional gain in
  the current scope. `--accent` uniformly satisfies AC-013's literal wording ("resolvem para
  os tokens... (sucesso/atenção/accent)" — a pool of acceptable tokens, satisfied by using one
  member of that set) without inventing unrequested semantics.
- **85% fill-opacity (StatusChip's number, reused for consistency)** — rejected: computed
  ratio at 85% is comfortably high (well above 3:1 in all concepts, see the table's trend), but
  reusing 85% *because* it's StatusChip's number is exactly the kind of unverified
  pattern-matching the previous run's contrast bug taught against — the two components have
  different transparency-vs-legibility goals (background tint vs. foreground mark) and the
  number needed independent verification either way. 0.75 was chosen from the actual
  script output, not by analogy.
- **A `--metric-accent` token defined only in night-harbor** (deliberately mirroring
  `--success`/`--warning`'s exclusivity, so legacy concepts genuinely fall back to
  `--ink-muted`/`--border` gray) — considered as the "literal gray degradation" reading of
  AC-014, and flagged to the user as an open point in the plan's HITL gate rather than decided
  unilaterally, since it's a genuine two-way fork in how "neutral" should be read (see
  `plan.md` "Proposta para aprovação").
- **`--on-accent` for the numeral** — rejected outright without needing a fresh audit: the
  learning `on-token-semantics` (this run's inherited learning, ADR-0014's precedent) reserves
  `--on-*` tokens for text over the *solid* token fill; the numeral sits on `--surface-raised`,
  not on a solid `--accent` fill, so `--on-accent` is the wrong semantic token regardless of
  whether it happens to pass a ratio check.

## Consequences

- `fill-opacity: 0.75` is a CSS-module constant, not a runtime-computed value; if `--accent` or
  `--surface-raised` hex values ever change in any concept, this ADR's table must be
  recomputed by script before merge (same standing rule as ADR-0014).
- Because none of MetricTile's tokens are night-harbor-exclusive, legacy concepts render a
  fully colored (not grayscale) sparkline and a plain-ink numeral — this is the resolved
  reading of "neutral degradation" for this feature (no special/bespoke color logic injected
  for legacy concepts, each concept's own pre-existing `--accent` is reused as-is). If the
  HITL gate prefers the literal-gray reading instead, the change is additive (a new
  night-harbor-only custom property + fallback swap in `.metricSparkBar`) and does not
  invalidate the rest of this ADR.
- `fill-opacity` requires no `@supports` fallback (unlike `StatusChip`'s `color-mix`) — it has
  been part of SVG/CSS since SVG 1.1 with no meaningful browser-support gap in Harbor's
  Electron/Chromium target.
