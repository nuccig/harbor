---
id: 001
severity: medium
status: open
location: tests/renderer/shell-settings/shell-settings.test.tsx:132
created: 2026-07-10
---

# KPI tile count asserted as a bare hardcoded literal, not derived from the fixture

## Problem

`tests/renderer/shell-settings/shell-settings.test.tsx:132` reads:

```ts
const tiles = group.getAllByRole('listitem')
expect(tiles).toHaveLength(4)
```

`4` is a bare literal, not derived from `mockCatalog`. This is an explicit, named violation of a
rule stated in three places that this feature is bound by:

- `spec.md` "## Verification": "Contagens usadas em asserts de teste (número de tiles, número de
  itens de fila, tamanho da série da sparkline) devem ser lidas do fixture (mock-catalog) em
  tempo de teste, nunca hardcoded como literal solto" — "número de tiles" is named explicitly as
  an example of what must never be hardcoded.
- `constitution.md` `test_expectations`: "class asserts por substring e counts derivados de
  fixture (learning css-module-class-asserts)".
- The review dispatch for this exact round called this class of issue out by name as a
  violation to check for.

Every other count in this same test (lines 134-141: `activeAgentsCount`, `issueQueueCount`,
`successRate`, `agentTime`) is correctly derived from `mockCatalog` at test time — only the tile
count itself was left as a literal. If a 5th KPI series were ever added to
`mockCatalog.kpis.series` without a matching change to `buildKpiViewModels()` (or vice versa),
this specific assertion would not reflect that drift the way the rule intends — the whole point
of deriving counts from the fixture is that the test's expectation moves with the fixture instead
of needing a human to remember to update a literal.

Not a functional defect (the tile count itself is currently correct, and `4` is also a
spec-locked design constant per G1, so it is less likely to drift silently than, say, a queue
count) — same class of issue as the previous review round's finding 101 (brittle hardcoded agent
count), which was calibrated as `medium`, non-blocking, test-quality-only. Calibrated the same
way here for consistency.

## Suggested fix

Derive the expected tile count from the fixture, e.g.:

```ts
const expectedTileCount = Object.keys(mockCatalog.kpis.series).length
expect(tiles).toHaveLength(expectedTileCount)
```

(`mockCatalog` is already imported in this file, confirmed by its use two lines below at
line 134.)

## Resolution

<Filled by sdd-fix-review: what changed, or the rationale for `wontfix`.>
