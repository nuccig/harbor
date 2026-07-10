# Handoff 006 — Consolidate Gate

**Phase**: fix (complete) → consolidate  
**Date**: 2026-07-09  
**Feature**: night-harbor-p2-statuschip-nav  
**Status**: READY FOR CONSOLIDATION

---

## Dispatch Summary

Run phase 15 (fix) completed successfully. Findings 101 + 201 resolved via commit a2d888a. Verify gate re-checked: 164/164 tests pass, zero lint/typecheck errors. Review clean: **PASS — zero blocking findings, zero open issues**.

**Outcome**: All decisions (D-001 to D-011) implemented ✓, all ACs met ✓, all hard rules verified ✓, security audit ✓, regression gate ✓. Ready to consolidate learnings and append durables to atlas.

---

## Learnings to Consolidate

### New Learnings from Review + Fix Phases

#### **L10: CSS Module Substring Assertions (Durável, MÉDIA criticidade)**

**Context**: Fix phase, test refactoring for brittleness

**Description**: Vite hashes CSS Module class names at runtime (e.g., `statusChip_success` becomes `statusChip_success__abc123` post-compilation). Direct `.toHaveClass('statusChip_success')` fails on hashed output.

**Technique**:
```typescript
// ❌ WRONG
expect(element).toHaveClass('statusChip_success')

// ✓ CORRECT
const chip = screen.getByText('label').closest('[class*="statusChip"]')
expect(chip?.className).toContain('statusChip_success')
```

**Reusability**: High — any React component with CSS Modules in test suite must follow this pattern. Not Vite-specific; applies to Webpack/other bundlers that hash modules.

**Atlas Candidate**: YES — cross-project testing pattern for CSS Modules assertion.

**Reference**: handoff-005.md Finding 201, shell-settings.test.tsx lines 88–106 (helper `expectStatusChip`)

**Status in learnings.md**: Append as L10 (NEW)

---

#### **L11: Parameterize Mock-Dependent Assertions (Durável, MÉDIA criticidade)**

**Context**: Fix phase, test brittleness (Finding 101)

**Description**: Test assertions tied to hardcoded values derived from fixtures (e.g., `expect(...).toHaveLength(3)` tied to mockCatalog.agents count) fail ambiguously when mock data changes. Cannot distinguish mock-change from code bug.

**Solution**:
```typescript
// ❌ BRITTLE
const availableAgentsCount = 3
expect(...).toHaveLength(availableAgentsCount)

// ✓ MAINTAINABLE
const availableAgentsCount = mockCatalog.agents
  .filter(agent => agent.status === 'Available').length
expect(...).toHaveLength(availableAgentsCount)
```

**Implication**: Any test assertion deriving from fixture data must parameterize counts/IDs/values from fixture source, not hardcoded literals.

**Reusability**: High — applies to all component tests using mocked catalogs, catalogs, or lookup tables.

**Atlas Candidate**: YES — testing best practice for fixture-dependent assertions.

**Reference**: handoff-005.md Finding 101, shell-settings.test.tsx line 362

**Status in learnings.md**: Append as L11 (NEW)

---

### Existing Learnings — No Changes

Learnings L1–L9, P1–P2 are complete, validated by implement + review phases, and documented in learnings.md. No corrections needed; these remain durables.

**Summary**:
- L1–L4: Technical design patterns (on-token, contrast audit, color-mix, motion)
- L5: Color-mix contrast degradation (already captured, re-validated in plan)
- L6: Audit luminâncias exatas — WCAG 2.1 methodology (critical for atlas promotion)
- L7: Retry protocol for session limits (process, not pattern)
- L8: On-token fill sólido restriction (validated, reusable)
- L9: Icon sizing defaults (implementação detail)
- P1, P2: Process patterns (gate confirmation, brain recall)

---

## Atlas Candidates for Promotion

### Tier 1 — Promote (High Reuse Across Projects)

#### **AC-010a: Audit Luminâncias Exatas (from L6, Criticality CRÍTICA)**

**Scope**: Any color-mix-based design, tinted backgrounds, WCAG compliance checks  
**Pattern**: Use sRGB linearization with exponent 2.4; calculate luminance per WCAG 2.1 formula; verify `contraste = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05) >= 4.5` (AA) or 7 (AAA)

**Lesson Learned**: Estimations and black-box tools fail silently. Always include luminance breakdown in audit reports (did plan rev. 1).

**Cross-Project Value**: High — design systems (Night Harbor, future palettes) + any color accessibility work

**Recommendation**: Add to atlas under "WCAG Methodology" or "Color Accessibility Audit". Reference: contrast-audit.md (rev. 2), plan.md §2.7, ADR-0001.

---

#### **AC-020b: CSS Module Test Assertions (from L10, Criticality MÉDIA)**

**Scope**: React component tests with CSS Modules, any bundler (Vite, Webpack, etc)  
**Pattern**: Use substring matching via `closest('[class*="..."]')` + `className.toContain()` to handle post-compilation hashing

**Cross-Project Value**: High — Harbor codebase uses Vite + CSS Modules throughout; testing pattern is immediately applicable to all component tests

**Recommendation**: Add to atlas under "Testing Patterns" or "Component Test Helpers". Helper function `expectStatusChip()` / generic `expectClass()` could be extracted to shared test utils.

---

#### **AC-030c: Parameterize Fixture-Dependent Assertions (from L11, Criticality MÉDIA)**

**Scope**: Any test using mocked catalogs, fixture data, or lookup tables  
**Pattern**: Derive counts/IDs/values from fixture source, not hardcoded literals; enables mock refactoring without ambiguous failures

**Cross-Project Value**: Medium-High — applies to Settings tests, Catalog tests, any component with dynamic mock data

**Recommendation**: Add to atlas under "Testing Best Practices". Could be incorporated as lint rule or test-helper pattern.

---

### Tier 2 — ADR (Repo Local, Already Documented)

The following ADRs are complete, validated, and require NO further promotion:

- **ADR-0001**: Contraste + color-mix + fallback (locked; L6/L8 reference)
- **ADR-0002**: StatusChip API + CSS (locked; D-007, D-008)
- **ADR-0003**: Nav ícone+label Phosphor (locked; D-009, D-003)

These are project-specific architectural decisions. If a future project (P3, P4) needs similar patterns, reference these ADRs from atlas candidates above (AC-010a, AC-020b, AC-030c) rather than duplicating ADRs.

---

## Non-Durable Items (Ephemeral)

**DO NOT promote** the following:

1. **Hardcoded agent count `3` in shell-settings.test.tsx** — Specific to mock data; once parameterized (L11 applied), count is implementation detail, not learning.
2. **Icon sizing customization via `var(--icon-md)`** — Future consideration for P2.3+; not implemented in P2.1/P2.2. Nice-to-have, not durable pattern.
3. **Session limit retry incident (L7 context)** — Process workaround, not reusable pattern. Keep as process note only if retry logic needs documentation.
4. **Ícone Boat selection for Sessions (G3)** — Project-specific metaphor choice; not generalizable as atlas learning.

---

## Decisions Finalized

All decisions D-001 to D-011 are LOCKED. No pending approvals, no contingencies. decisions.md is complete and requires NO edits.

---

## Next Steps for Consolidate Agent

### Required Actions

1. **Append L10 + L11 to learnings.md**
   - Format: `### L10: CSS Module Substring Assertions`, `### L11: Parameterize Mock-Dependent Assertions`
   - Include Context, Implication, Reusability, Reference sections (match existing L1–L9 format)
   - Update status table (§Status das Learnings na Run P2) to reflect new learnings

2. **Promote Atlas Candidates**
   - **AC-010a**: Audit Luminâncias Exatas → atlas ref "WCAG Methodology" or "Color Accessibility Audit"
   - **AC-020b**: CSS Module Test Assertions → atlas ref "Testing Patterns"
   - **AC-030c**: Parameterize Fixture-Dependent Assertions → atlas ref "Testing Best Practices"
   - Link each to source ADR or learning (ADR-0001, L10, L11)

3. **Verify No Open Issues**
   - Review decisions.md: zero pending approvals? ✓ (confirmed)
   - Review learnings.md: all learnings documented? (will be after L10/L11 append)
   - Confirm: zero findings in review-001/000-clean.md open? ✓ (confirmed)

### Optional Actions

- Update constitution.md test_expectations to include "CSS Module substring assertion pattern mandatory" (if making this a hard rule for future tests)
- Consider extracting `expectStatusChip()` helper to `/tests/shared/helpers/expect-status-chip.ts` for reuse (nice-to-have; not blocking consolidate)

---

## Consolidation Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| Spec complete & approved | ✓ | 41f0183 (HITL 2026-07-09) |
| Plan complete & approved | ✓ | rev. 2 (HITL 2026-07-09, contrast audit) |
| Tasks complete & analyzed | ✓ | a33e641, 10/10 ACs |
| Implementation complete | ✓ | 70d77ce → 58cbcd0, gate 164/164 |
| Review complete (round 001) | ✓ | 000-clean.md PASS, 2 Medium (resolved) |
| Fix complete & re-verified | ✓ | a2d888a, 164/164 re-pass |
| Learnings captured | ✓ | L1–L9 + L10/L11 ready to append |
| Atlas candidates identified | ✓ | AC-010a/AC-020b/AC-030c |
| ADRs locked | ✓ | 0001–0003 complete |
| Zero open decisions | ✓ | D-001 to D-011 locked |
| Zero blocking findings | ✓ | Review clean pass |

**Overall**: READY FOR CONSOLIDATION

---

## Handoff Artifacts

This handoff provides:
1. **handoff-006.md** — this file, consolidation brief for consolidate-agent
2. **learnings.md** — updated with L10/L11 (to be appended by consolidate-agent)
3. **decisions.md** — no changes needed (complete)
4. **Review gate**: reviews-001/000-clean.md + finding files (101–201 resolved)
5. **Verify gate**: 164/164 tests pass, zero lint/typecheck errors (proof attached via state.md phase 16)

---

**Authored by**: handoff-agent (sdd pipeline)  
**Review Completion**: 2026-07-09 ~14:30 UTC  
**Fix Completion**: 2026-07-09 ~15:45 UTC (a2d888a)  
**Next**: consolidate-agent (append learnings, promote atlas candidates, finalize PR)
