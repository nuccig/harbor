# ADR 0018 — UI primitives are domain-blind with fully resolved props; domain mapping centralized in selectors

## Status

accepted

## Context

Across three P2 features, every composed primitive in `src/renderer/src/ui/` converged on the
same form: StatusChip (P2), MetricTile (P2.3), SessionCard (P2.4) — zero imports of `app/`,
own structural prop types, all domain knowledge resolved before the props reach the component.
In P2.4 this stopped being an accident: the plan recommended placing `SessionCard` in `shell/`
(to avoid a `ui/`→`app/` dependency for its richer props), and the user **overrode at the HITL
gate** — the card goes to `ui/` on the condition that props arrive fully resolved and that the
"mapping duplicated across call sites" objection is mitigated in the selector layer, not in
the component. This ADR promotes that override to a standing project convention.

## Decision

- **New reusable primitives live in `src/renderer/src/ui/`** and are **domain-blind**: zero
  imports of `app/` (no view-model types, no selectors, no catalog, no `app/` hooks). They
  define their own prop types, structurally compatible with the view models (TS structural
  typing bridges the layers — no shared import needed).
- **Props arrive fully resolved.** All domain mapping — status→tone, action matrices
  (`canTogglePause`), resolved aria-labels with domain copy, data lookups (`logLines`) — is
  computed **once** in the selectors layer (e.g. `selectSessionViews`), never inside the
  component and never duplicated across call sites. Call sites stay identical and dumb: they
  spread view-model fields plus local glue (dispatch closures, `reduceMotion`).
- **Component-internal logic is presentational only**, driven by resolved flags (e.g.
  `paused` ⇒ which icon) — the same genre as StatusChip's `defaultIconsByTone`.
- **CSS split**: the primitive's styles live in `ui/primitives.module.css`; only the
  surrounding list/layout glue (e.g. `.sessionList`, `.kpiStrip`) lives in
  `shell.module.css`.
- **Review criterion**: an `app/` import inside a `ui/` file is an automatic review finding.
  The dependency direction `ui/` ⊬ `app/` has no lint enforcement today — it is enforced at
  review (known, accepted gap).

## Alternatives

- **Domain-aware component in `shell/`** (the P2.4 plan's original recommendation) — rejected
  by the HITL override: the spec's constraint directs reusable components to the `ui/`
  pattern; both of the plan's objections dissolve under the adopted variant (resolved props
  eliminate the layer dependency; selector centralization eliminates call-site duplication).
- **`ui/` component importing types/helpers from `app/`** — rejected: breaks the layer
  direction for no gain; structural typing makes the import unnecessary.
- **Mapping duplicated per call site** — rejected: with two render points per surface it is
  exactly the drift vector the single-component decision exists to remove.

## Consequences

- Data/component tasks parallelize: a `ui/` primitive can be built and tested before its data
  layer exists (proven in P2.3 — tasks 001/002 ran with `depends_on: []`).
- View models carry presentation fields (tone/labels/flags) — testable at selector level,
  without React, with fixture-derived asserts.
- Callback contracts stay domain-free at the primitive boundary (e.g. `onTogglePause:
  () => void`; the call site closes over `sessionId`) — see atlas
  `react-onclick-syntheticevent-no-args-assert` for the testing implication.
- Three data points and one explicit user decision make this the default for every future
  primitive; deviating (a domain-aware component) requires its own ADR.
- The convention is recorded operationally in `.agents/skills/harbor-night-harbor-ui/SKILL.md`
  ("`ui/` primitives are domain-blind with fully resolved props").

## References

- `.orquestrador/night-harbor-p2-inline-actions/adr/0004-sessioncard-log-disclosure.md`
  (run-local, amended 2026-07-10 with the HITL override) and `memory/decisions.md` D-011
- `src/renderer/src/ui/SessionCard.tsx`, `src/renderer/src/ui/MetricTile.tsx`,
  `src/renderer/src/ui/StatusChip.tsx`; `src/renderer/src/app/selectors.ts`
  (`selectSessionViews`)
- ADR 0017 (the state/selector counterpart producing the resolved view models)
- `.orquestrador/night-harbor-p2-kpi-strip/memory/learnings.md` N7/N8 (parallelization
  evidence)
