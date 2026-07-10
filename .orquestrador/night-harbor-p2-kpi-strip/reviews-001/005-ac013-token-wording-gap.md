---
id: 005
severity: low
status: resolved
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

**Decision: took the "opção recomendada"** — annotated `spec.md`, not doc-only-in-issue-file.
Rationale: the gap this issue names is specifically that a future reader of *only* `spec.md`
(without cross-referencing the review issue files, which are workflow-scoped and not part of the
feature's durable documentation) would have no way to know the wording was deliberately read as a
pool. A note confined to this issue file would not reach that reader; the annotation has to live in
`spec.md` itself to close the gap for good. Cost was one line, no risk (parenthetical addition,
no wording removed).

`spec.md` AC-013 (line ~151) now reads:

> **AC-013** — **WHERE** o conceito visual ativo é night-harbor **WHEN** os tiles de KPI renderizam
> **THEN** as cores do numeral e da sparkline resolvem para os tokens da paleta Night Harbor já
> existentes (sucesso/atenção/accent — pool de tokens aceitáveis, satisfeito ao resolver para
> qualquer membro do pool; não é mandato de usar os três. Ver ADR-0003 "Alternatives considered"
> para a leitura aprovada no gate HITL do plan).

No changes to `MetricTile.tsx` or `primitives.module.css`, per the handoff's explicit instruction —
the implementation was already correct and approved.

Verified: `npm run lint && npm run typecheck && npm run test` all pass, 185/185 tests (doc-only
change, no test impact expected or observed).
