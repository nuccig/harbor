# Consolidation Report — night-harbor-p2-statuschip-nav

**Date**: 2026-07-09  
**Agent**: consolidate-agent (SDD pipeline)  
**Phase**: consolidate (step 18)  
**Status**: COMPLETE — PASS

---

## Learnings Consolidation

### L10: CSS Module Substring Assertions (Vite Hashing)

**Status**: Appended to learnings.md ✓

**Specification**:
- **Context**: Fix phase, test refactoring for brittleness
- **Description**: Vite hashes CSS Module class names at runtime (e.g., `.statusChip_success` → `.statusChip_success__abc123` post-compilation). Direct `.toHaveClass('statusChip_success')` fails on hashed output.
- **Technique**:
  ```typescript
  // ✗ WRONG: fails on hashed classes
  expect(element).toHaveClass('statusChip_success')
  
  // ✓ CORRECT: substring match handles hashing
  const chip = screen.getByText('label').closest('[class*="statusChip"]')
  expect(chip?.className).toContain('statusChip_success')
  ```
- **Implication**: Any React component with CSS Modules in test suite must follow this pattern. Not Vite-specific; applies to Webpack/other bundlers that hash modules.
- **Reusability**: HIGH — immediately applicable to all Harbor component tests with CSS Modules
- **Helper extracted**: `expectStatusChip(label, expectedTone)` in shell-settings.test.tsx lines 88–106
- **Reference**: handoff-005.md Finding 201, shell-settings.test.tsx
- **Atlas Candidate**: YES — "Testing Patterns" / "CSS Module Test Assertions"

---

### L11: Parameterize Mock-Dependent Assertions

**Status**: Appended to learnings.md ✓

**Specification**:
- **Context**: Fix phase, test brittleness (Finding 101)
- **Description**: Test assertions tied to hardcoded values derived from fixtures (e.g., `expect(...).toHaveLength(3)` tied to mockCatalog.agents.count) fail ambiguously when mock data changes — impossible to distinguish mock-change from code bug.
- **Solution**:
  ```typescript
  // ✗ BRITTLE: hardcoded value decoupled from fixture
  const availableAgentsCount = 3
  expect(...).toHaveLength(availableAgentsCount)
  
  // ✓ MAINTAINABLE: value derived from fixture source
  const availableAgentsCount = mockCatalog.agents
    .filter(agent => agent.status === 'Available').length
  expect(...).toHaveLength(availableAgentsCount)
  ```
- **Implication**: Any test assertion deriving from fixture data must parameterize counts/IDs/values from fixture source, never hardcoded literals.
- **Reusability**: HIGH — applies to Settings tests, Catalog tests, any component with dynamic mock data
- **Reference**: handoff-005.md Finding 101, shell-settings.test.tsx line 362
- **Atlas Candidate**: YES — "Testing Best Practices" / "Fixture-Dependent Assertions"

---

### Existing Learnings Status (L1–L9, P1–P2)

**Consolidated**: L1–L9 + P1–P2 are complete, validated by spec → plan → tasks → implement → review → fix phases. No corrections needed; all remain as documented in learnings.md.

**Summary**:
- **L1–L4**: Technical design patterns (on-token, contrast audit, color-mix, motion)
- **L5**: Color-mix contrast degradation (re-validated in plan)
- **L6**: Audit luminâncias exatas — WCAG 2.1 methodology **[ATLAS PROMOTION L6 → AC-010a]**
- **L7**: Retry protocol for session limits (process pattern, not tech)
- **L8**: On-token fill sólido restriction (validated, reusable **[ATLAS PROMOTION L8 → AC-030c logic]**)
- **L9**: Icon sizing defaults (implementation detail)
- **P1, P2**: Process patterns (gate confirmation, brain recall)

---

## Skill Gaps Analysis

### Files Touched in This Run

**Core implementation files**:
- `src/renderer/src/ui/StatusChip.tsx` — new component
- `src/renderer/src/ui/primitives.module.css` — new .statusChip* rules + color-mix
- `src/renderer/src/shell/Shell.tsx` — StatusChip integration + nav icons
- `src/renderer/src/shell/shell.module.css` — nav icon+label layout
- `src/renderer/src/settings/Settings.tsx` — StatusChip integration (agents/integrations)
- `tests/renderer/shell-settings/shell-settings.test.tsx` — StatusChip tests + helpers

**Existing skill coverage**:
- No dedicated "harbor-night-harbor-ui" skill exists currently

**Required skill creation/update**:
- **Skill name**: `harbor-night-harbor-ui` (or `.claude/skills/harbor-night-harbor-ui/SKILL.md`)
- **Scope**: Night Harbor UI component patterns, design system decisions, CSS technique reference
- **Sections to include** (proposed):
  1. **Overview**: Night Harbor visual language (Phosphor Regular icons, color-mix + fallback, on-token semantics)
  2. **StatusChip Pattern**: API (tone/label/icon), schema (tone-colored text, 85% transparent fundo), accessibility
  3. **Color Scheme**: Tone mapping (success/warning/danger/neutral), WCAG ratios, fallback strategy
  4. **Testing**: CSS Module substring assertions, CSS class handling in Vite
  5. **Navigation**: Icon+label pattern (Phosphor Regular), SemanticIcon wrapper, pill active state
  6. **Related ADRs**: 0001 (contraste), 0002 (API), 0003 (nav icons)
  7. **Reusable Patterns**: color-mix + fallback @supports, on-token pair semantics, Phosphor default icons by tone

---

## Architecture Decision Record (ADR) Promotion

### ADR-0001 to Repository (docs/adr/)

**Candidate Decision**: "Fundo tintado color-mix 85% com texto na cor do token e fallback surface-raised"

**Assessment**: 
- **Scope**: Night Harbor component design, specifically StatusChip but applicable to future tinted-background components
- **Permanence**: PERMANENT — resolves foundational debate (on-token semantics, text-over-tinted-fundo contrast)
- **Project-wide impact**: YES — establishes rule for all future tinted backgrounds (badges, alerts, etc.) in Night Harbor
- **Recommendation**: Promote to `docs/adr/0014-night-harbor-statuschip-color-scheme.md` (or renumber based on current count)

**Proposed repo ADR content** (condensed version of .orquestrador/.../adr/0001-...):
- Context: StatusChip needs tinted background color-mix with WCAG AA contrast
- Decision: 85% transparent mix, text in token color (not on-*), fallback to solid --surface-raised
- Ratios: WCAG 2.1 exact luminance (sRGB linear, exponent 2.4) — all AA+ (6.08:1 to 10.49:1)
- Alternatives considered: on-* over tinted (rejected 1.50:1), 80% transparency (same fail 1.71:1)
- Consequences: on-* reserved for future solid fills, StatusChip portability via var() chaining

**Files to create**: `docs/adr/0014-night-harbor-statuschip-color-scheme.md` (or next sequential number)

---

## Brain-Sync Preparation (Atlas Promotion)

### Ready for Atlas (Step 19.5 — Handoff only, no write yet)

#### AC-010a: Audit Luminâncias Exatas (from L6)

**Atlas location**: Under "WCAG Methodology" or "Color Accessibility Audit"

**Note to promote** (ready text for atlas entry):

> **Learning: WCAG Contrast Audit via Exact Luminance (Not Black-Box Tools)**
> 
> When auditing color contrast, never rely on visual estimation or tools without luminance breakdown. Use sRGB linearization (exponent 2.4, per WCAG 2.1 spec) to calculate luminance per formula:
> 
> ```
> L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
> where R/G/B are linearized via: (c/255)^2.4
> contrast_ratio = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
> ```
> 
> Include luminance breakdown in audit reports (include L1, L2, ratio). Example error: estimating L(#0e1b2f) as ~0.095 when exact is ~0.011 (10× difference). This error cascaded through contrast math and reported false-positive ratios.
> 
> **When applicable**: Color-mix designs, new color palettes, WCAG compliance audits, fallback strategy evaluation.
> 
> **Reference**: Night Harbor P2.1 plan.md §2.7 (contrast-audit.md rev. 2, ERRATA), ADR-0001.
> 
> **Cross-project value**: Applicable to any project using color-mix, tinted backgrounds, or accessibility audits.

---

#### AC-020b: CSS Module Test Assertions (from L10)

**Atlas location**: Under "Testing Patterns" or "Component Test Helpers"

**Note to promote** (ready text for atlas entry):

> **Pattern: CSS Module Substring Assertions in Tests (Vite + Webpack)**
> 
> When testing components with CSS Modules, bundler hashing makes direct class assertions brittle:
> 
> ```typescript
> // ✗ Fails: .statusChip_success becomes .statusChip_success__abc123 at runtime
> expect(element).toHaveClass('statusChip_success')
> 
> // ✓ Works: substring match survives hashing
> const chip = screen.getByText('label').closest('[class*="statusChip"]')
> expect(chip?.className).toContain('statusChip_success')
> ```
> 
> **Alternative helper approach** (extractable to shared test utils):
> ```typescript
> function expectStatusChip(labelText: string, expectedTone: 'success' | 'warning' | 'danger' | 'neutral') {
>   const chip = screen.getByText(labelText).closest('[class*="statusChip"]')
>   expect(chip?.className).toContain(`statusChip_${expectedTone}`)
> }
> ```
> 
> **Bundler-agnostic**: Pattern works with Vite, Webpack, and any bundler that hashes module class names.
> 
> **When applicable**: React component tests with CSS Modules, any bundler, any project.
> 
> **Reference**: Night Harbor P2 fix phase, shell-settings.test.tsx (finding 201), Learning L10.

---

#### AC-030c: Parameterize Fixture-Dependent Assertions (from L11)

**Atlas location**: Under "Testing Best Practices" or "Test Design Patterns"

**Note to promote** (ready text for atlas entry):

> **Pattern: Derive Test Assertions from Fixture Source (Not Hardcoded)**
> 
> When tests assert counts, IDs, or values derived from mock fixtures, parameterize from the fixture source rather than hardcoding:
> 
> ```typescript
> // ✗ Brittle: hardcoded value decoupled from mock data definition
> const mockAgents = [{ status: 'Available' }, { status: 'Busy' }, { status: 'Available' }]
> const tests = () => expect(...).toHaveLength(3)  // What does 3 mean?
> 
> // ✓ Maintainable: value derived from actual fixture
> const mockAgents = [{ status: 'Available' }, { status: 'Busy' }, { status: 'Available' }]
> const availableAgents = mockAgents.filter(a => a.status === 'Available').length
> const tests = () => expect(...).toHaveLength(availableAgents)  // Self-documenting
> ```
> 
> **Benefit**: Mock refactoring no longer produces ambiguous test failures. Code change intent is clear (intentional mock update vs. accidental breakage).
> 
> **When applicable**: Any test using mocked catalogs, fixture data, lookup tables, or dynamic mock structures.
> 
> **Reference**: Night Harbor P2 fix phase (finding 101), shell-settings.test.tsx line 362, Learning L11.

---

### Cross-Project Learning Links

**L6 (exact luminance audit) → AC-010a**:
- Links to existing atlas recalls (if any): `verify-gate-blind-to-contrast` (L2 origin)
- Precedent: color accessibility workflows in atlas

**L10 (CSS Module assertions) → AC-020b**:
- New pattern, no existing cross-project precedent documented
- Immediately applicable to entire Harbor codebase (uses Vite + CSS Modules throughout)

**L11 (fixture parameterization) → AC-030c**:
- Generalizable pattern; applies to any project with mocked data
- Could be incorporated as lint rule or test-helper library function

**Existing atlas links to preserve**:
- `on-token-semantics` (L1 origin) — now reinforced by L8 and ADR-0001
- `navbar-contrast-color-mix-over-ambient` (L3 origin) — technique revalidated for StatusChip

---

## Decisions Finalized

**All decisions D-001 to D-011 locked** — no pending approvals or contingencies.

**Decision tracking**:
- D-001 to D-006: Spec gate (HITL 2026-07-09) ✓
- D-007 to D-011: Plan gate rev. 2 (HITL 2026-07-09) ✓ — incorporated ADRs 0001–0003
- Zero open points in decisions.md

---

## Consolidation Checklist

| Phase | Item | Status | Notes |
|-------|------|--------|-------|
| Learnings | L1–L9 + P1–P2 complete | ✓ | No updates needed |
| Learnings | L10 appended | ✓ | CSS Module substring assertions |
| Learnings | L11 appended | ✓ | Fixture-dependent assertions |
| Learnings | Dedup/conflicts | ✓ | Zero conflicts; learnings consolidate cleanly |
| Learnings | 3 key events registered | ✓ | (a) contrast math by script, (b) CSS module hashing, (c) session limit retry |
| Skills | harbor-night-harbor-ui coverage | ⚠ | Skill does NOT exist; propose creation with StatusChip/nav sections |
| Skills | Skill gaps identified | ✓ | Files: StatusChip.tsx, primitives.module.css, Shell.tsx, shell.module.css, Settings.tsx, tests/renderer/ |
| ADR | Promotion to docs/adr/ | ⚠ | ADR-0001 (contraste/color-mix) ready; propose 0014-night-harbor-statuschip-color-scheme.md |
| Atlas | AC-010a (luminance audit) | ✓ | Text ready for promotion |
| Atlas | AC-020b (CSS Module assertions) | ✓ | Text ready for promotion |
| Atlas | AC-030c (fixture parameterization) | ✓ | Text ready for promotion |
| Decisions | Zero blocking findings | ✓ | Review clean, 2 Medium resolved |
| Test coverage | 164/164 passing | ✓ | Verify gate re-check post-fix |

---

## Summary

**Consolidation status**: PASS — all learnings captured, artifacts identified, recommendations prepared for controller approval.

**Deliverables ready for next phase** (controller):
1. Append L10 + L11 to learnings.md ✓ (already in file, marked for append)
2. Create skill harbor-night-harbor-ui with StatusChip + nav sections (proposal in this report)
3. Create docs/adr/0014-night-harbor-statuschip-color-scheme.md (proposal in this report)
4. Promote AC-010a, AC-020b, AC-030c to atlas (texts ready in this report)

**Next steps**: Controller reviews consolidation.md, approves proposals, applies edits to skill / ADR / atlas, and finalizes PR.

---

**Authored by**: consolidate-agent (step 18, SDD pipeline)  
**Date**: 2026-07-09  
**Approval pending**: ADR creation, skill definition, atlas updates (controller decision)

---

## Addendum — Gate HITL aprovado, propostas APLICADAS (2026-07-10)

Controller autorizou explicitamente a escrita fora do diretório nos 4 alvos. Correção do gate:
a skill existe em `.agents/skills/harbor-night-harbor-ui/SKILL.md` (não `.claude/skills/`) —
foi feito UPDATE cirúrgico, não criação.

**Arquivos editados**:
1. `.agents/skills/harbor-night-harbor-ui/SKILL.md` — Rules: blocos StatusChip (P2) e Nav
   ícone+label (P2); nova seção "Testing (renderer components)" (substring asserts +
   fixture-derived counts); 2 anti-patterns novos (on-* sobre tintado; toHaveClass literal);
   References: ADRs 0001–0013 → 0001–0014.
2. `C:\Users\gustavo\projetos\atlas\learnings\verify-gate-blind-to-contrast-numeric-review-required.md`
   — 1 linha "See also" → contrast-math-by-script-not-llm-arithmetic.
3. `C:\Users\gustavo\projetos\atlas\learnings\on-token-semantics-text-over-token-bg.md`
   — 1 linha "See also" → contrast-math-by-script-not-llm-arithmetic.

**Arquivos criados**:
4. `docs/adr/0014-night-harbor-statuschip-color-scheme.md` — formato dos ADRs 0010–0013
   (Status/Context/Decision/Alternatives/Consequences/References); registra erro de matemática
   rev. 1 (1.50:1@85% / 1.71:1@80%), decisão (85% + tone text + neutral ink-muted + fallback
   surface-raised + on-* reservado), ratios auditados, alternativas rejeitadas.
5. `C:\Users\gustavo\projetos\atlas\learnings\contrast-math-by-script-not-llm-arithmetic.md`
   — formato atlas (frontmatter + For future Claude / The trap / Fix / Source); drift ~14×
   (L(#0e1b2f) 0.15 estimado vs 0.011 real) + inversão de fórmula; script node obrigatório.
6. `C:\Users\gustavo\projetos\atlas\learnings\css-module-class-asserts-substring-and-fixture-derived.md`
   — substring asserts + fixture-derived counts; source findings 101/201.

**index.md/log.md do atlas**: NÃO tocados — precedente do brain-sync P1 (notas de 2026-07-09
não constam do index; reconcile é o caminho canônico de atualização do index).

**Git**: nenhuma operação (boundary respeitado; controller commita).
