---
id: 005
severity: low
status: open
location: spec.md:151-153 (AC-013 wording) vs src/renderer/src/ui/MetricTile.tsx and primitives.module.css
created: 2026-07-10
---

# AC-013's literal wording lists success/warning/accent tokens; implementation only ever uses `--ink`/`--accent`

## Problem

AC-013 (spec.md:151-153) reads: "as cores do numeral e da sparkline resolvem para os tokens da
paleta Night Harbor já existentes (sucesso/atenção/accent)." Read in isolation, this could be
parsed as a mandate to use all three token categories. The shipped `MetricTile` only ever
resolves to `--ink` (numeral) and `--accent` (sparkline) — `--success`/`--warning` are never
referenced, because none of the four KPIs carries a defined threshold/business rule that would
justify tone-per-tile (ADR-0003 "Alternatives considered" argues this explicitly and the reading
was approved at the plan's HITL gate: "sucesso/atenção/accent" as a pool of acceptable tokens,
satisfied by using one member, not a mandate to use every member).

This is not a functional defect — it's a resolved, documented, approved interpretation — but a
reviewer or future reader who reads only spec.md's literal text without cross-referencing
ADR-0003 could reasonably flag it as underimplemented, since the spec text itself was never
amended to reflect the resolution.

## Suggested fix

Optional documentation cleanup: add a one-line annotation to spec.md's AC-013 (or a footnote)
clarifying that it is satisfied by resolving to any member of the Night Harbor token pool
(accent alone is sufficient), pointing to ADR-0003 for the rationale — so future readers don't
need to cross-reference the ADR to confirm this was intentional. Not blocking; purely closes a
documentation gap between the spec's literal wording and its resolved interpretation.

## Resolution

<Filled by sdd-fix-review: what changed, or the rationale for `wontfix`.>
