# ADR 0017 — Live state over a frozen seed: sparse id-set slice + seed-agnostic reducer + single merge selector

## Status

accepted

## Context

Night Harbor P2.4 (inline session actions) introduced the first **live status transition** in
the renderer: Running⇄Paused on agent sessions, with `mockCatalog` remaining a frozen,
immutable seed (never mutated, reset on reload). Three surfaces consume session status — the
Overview "Active agent sessions" list, the Sessions board, and the KPI "Active agents" count —
and any duplication of the seed+state merge across them is the divergence vector the feature's
ACs prohibit. Structural constraint: `mock-catalog.ts` imports types from
`experience-model.ts`; a reducer that consulted the seed would create a module cycle in the
opposite direction.

This ADR promotes the run-local decision to a repository pattern: it is the shape **any**
future live transition over frozen seed data should follow, not a session-specific choice.

## Decision

- **Sparse id-set slice**: the live state is the minimal representation of the transition —
  `pausedSessionIds: readonly string[]` on `ExperienceState`, seeded `[]` in
  `createInitialExperienceState()` (reset-on-reload by construction). No status copies, no
  seed fields duplicated into state.
- **Seed-agnostic reducer action**: `{ type: 'toggleSessionPaused'; sessionId: string }` only
  toggles id membership in the array. The reducer never imports `mockCatalog` — no module
  cycle, no domain semantics inside the reducer.
- **Single merge selector**: `selectSessionViews(state)` in `selectors.ts` composes seed +
  slice exactly once (`status = pausedSessionIds.includes(id) && isSessionActive(seed.status)
  ? 'Paused' : seed.status`). The `isSessionActive` guard keeps spurious ids from painting
  non-active sessions as Paused.
- **All consumers derive from the selector, never the raw catalog**: Overview slice wraps it,
  the Sessions board calls it directly, and `buildKpiViewModels(sessions)` was parameterized
  to receive the already-merged list — the KPI count reflects pauses without duplicating the
  merge.
- **Generalization**: future live transitions follow the same shape — sparse id set (or the
  minimal equivalent), seed-agnostic reducer, one merge selector consumed by every surface.

## Alternatives

- **Sparse overrides `Record<string, 'Running' | 'Paused'>`** — rejected: a `'Running'`
  override is redundant state (≡ absence) and the Record admits inconsistent entries; the id
  set expresses the same transitions with fewer invalid representable states.
- **Full session snapshot in live state** — rejected: duplicates immutable seed fields,
  creates two sources of truth, violates "catalog is a frozen seed".
- **Reducer consults the seed to validate transitions** — rejected: module cycle
  (`experience-model` ⇄ `mock-catalog`) and domain semantics inside the reducer; the selector
  guard achieves the same safety without the coupling.
- **Generic `setSessionStatus(sessionId, status)` action** — rejected: more expressive than
  the domain allows; arbitrary status payloads permit meaningless transitions the toggle makes
  unrepresentable.

## Consequences

- Cross-surface consistency is structural: one merge function means there is no duplicated
  derivation to diverge.
- Seed immutability and reset-on-reload hold by construction (`Object.freeze` seed + `[]`
  initial state).
- `buildKpiViewModels` is testable without a singleton; selector tests derive from the fixture
  (default state ⇒ merge ≡ seed).
- The set only expresses pause — a future transition (e.g. cancel) requires evolving the
  shape; if that happens, a new ADR supersedes this one.
- The pattern is recorded operationally in `.agents/skills/harbor-night-harbor-ui/SKILL.md`
  ("Live session state (P2.4)").

## References

- `.orquestrador/night-harbor-p2-inline-actions/adr/0001-live-session-state-slice.md`
  (run-local, full context) and `memory/decisions.md` D-008
- `src/renderer/src/app/experience-model.ts` (slice + reducer),
  `src/renderer/src/app/selectors.ts` (`selectSessionViews`, `isSessionActive`,
  `buildKpiViewModels`)
- ADR 0018 (the component-layer counterpart consuming the merged view models)
- Atlas: `css-module-class-asserts-substring-and-fixture-derived` (fixture-derived testing of
  the merged views)
