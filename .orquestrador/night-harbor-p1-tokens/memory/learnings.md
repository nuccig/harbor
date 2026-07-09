# Learnings — P1 Consolidate (night-harbor-p1-tokens)

**Data**: 2026-07-09  
**Fase**: P1 (Fundação de Tokens) — pós-implement, pré-merge  
**Origem**: handoff-002.md §3 + FIX-1/2/3 do controller

---

## L-001: Semântica `on-*` — Texto Sobre Token Como Fundo

**Contexto**: Implement-agent inverteu significado de `on-*` tokens. Assumiu que `on-success` era fundo para o token `success`; resultado foi `--on-success: #f3f7ff` (claro) sobre `--success: #5ad8a6` = 1.66:1 (falha WCAG).

**Lição**: `on-*` tokens são cores de **texto/overlay sobre o token como fundo**, não o contrário. Padrão MDM: `--on-accent` (escuro em night-harbor), `--on-danger` (escuro).

**Aplicar em**: P2.1+ (StatusChip usará `--success` + `--on-success`); toda tarefa de design com novos status tokens; code review de cores status.

---

## L-002: Verify Gate Cego a Erro de Contraste WCAG

**Contexto**: AC-011 (verify gate: lint/typecheck/test) passou com 151/151 testes verdes. FIX-1 (semântica `on-*` invertida, contraste 1.66:1) foi detectado apenas por review humana numérica do controller.

**Lição**: Testes automáticos não detectam erro de contraste WCAG; é necessário review numérico ou ferramenta de linting a11y em pre-commit (ex., eslint-plugin-a11y com regra de contraste).

**Aplicar em**: P2.1+ tokens de cor; setup de linting a11y futura; checklist de code review (contraste sempre validado numericamente, nunca assuma valor em spec).

---

## L-003: Unificar Tokens ≠ Colapsar Tiers; Fast/Base São Papéis Semânticos Distintos

**Contexto**: Implementação inicial mapeou `--duration-fast: var(--motion-duration)` (280ms), mudando silenciosamente o comportamento legado de 160ms → 280ms. Tiers "ação rápida do usuário" e "transição natural" colapsaram em uma única duração, tornando hovers mais lentos (imperceptível em AC-011, mas quebra semântica).

**Lição**: Alias de token **rename** (ex., `--ease-old` → `--ease-new`) preservam semântica. Alias de **tier unification** quebram. Fast e base são papéis distintos; nunca aliasear entre tiers.

**Aplicar em**: P2.1+ quando adicionar novos motion tiers; design de sistema de motion; arquitetura de tokens.

---

## L-004: Exit/Enter Overrides em motion/react Bypassam MotionConfig reducedMotion Central

**Contexto**: `ConceptScaffold.tsx` exit transition (182ms + easing) era static `{ duration: 0.182, ease: [...] }`. Wrapper `MotionConfig reducedMotion='user'` não propaga para nested transitions em `exit={{...}}`; padrão motion/react não herda automaticamente.

**Lição**: Qualquer override de `exit`/`enter`/`animate` transition que toca `motionTokens` precisa de ternário redundante `exitTransition = reduceMotion ? { duration: 0.08 } : { duration: motionTokens.durationExit, ease: motionTokens.ease }` aplicado ANTES de passar a `exit={{...}}`.

**Aplicar em**: Boilerplate em ConceptScaffold, DesignLab, e todo componente que overrida transição de motion; code review de acessibilidade (sempre verificar reduceMotion pairing).

---

## L-005: Fórmula WCAG Exata (Gamma 2.2) vs Aproximada — Ambas Passam AA/AAA

**Contexto**: Spec pressupunha aproximação com expoente 2.2; controller auditou com fórmula WCAG 2.1 exata (sRGB gamma curve). Verde: 9.7:1 (exata) vs 11.97:1 (aproximada); âmbar: 12.4:1 (exata) vs 11.3:1 (aproximada). Divergência ≤20%, ambas PASSAM AA/AAA.

**Lição**: Escolher fórmula de auditoria (exata vs aproximada) pouco impacta resultado para P1 (ambas passam). Documentar qual fórmula foi usada no comentário CSS. Para P2+, usar checker WCAG automático em pre-commit se rigor numérico for critério.

**Aplicar em**: Auditoria de cores futuras (dokumentar método); setup de linting a11y com ferramenta automática.

---

## Referências

- handoff-002.md §3 (candidatos a lesson)
- decisions.md D-010, D-011, D-012, D-013 (FIX-1/2/3 + contexto)
- spec.md AC-005, AC-004, AC-010 (implementação)

**Próxima fase**: P2.1 (StatusChip). Revisar L-001/L-002 antes de iniciar.
