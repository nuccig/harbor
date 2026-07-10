# Learnings — night-harbor-p2-statuschip-nav

**Registro de learnings técnicos e de processo duráveis desta run.**

## Learnings de Brain Recall (state.md, 2026-07-09)

### L1: On-Token Semantics

**Contexto**: Color palette design
**Descrição**: Token `--on-*` designa cor de **texto SOBRE** o token de fundo (nunca inverso). Exemplo: `--on-success` é a cor de texto legível sobre `--success` como fundo.

**Implicação**: Quando auditar contraste WCAG, ordem importa: `contraste(--on-success, --success)`, não vice-versa.

**Aplicação nesta run**: StatusChip com fundo tintado usa `color-mix(--success, transparent 85%)` + texto em `--on-success` (verificar contraste exato em plan).

**Referência**: concepts.module.css ~135–174 (on-token definições)

---

### L2: Verify Gate Blind to Contrast

**Contexto**: CI/CD pipeline
**Descrição**: `npm run lint`, `npm run typecheck`, `npm run test` não detectam contraste WCAG. Gate lint/type/test é cego a violações de cor.

**Implicação**: Auditoria numérica **obrigatória fora do verify gate** (revisão manual + ferramentas WCAG).

**Aplicação nesta run**: constitution.md test_expectations exige "review numérico de contraste para qualquer par de cor novo/alterado". AC-10 (StatusChip WCAG audit pass) não pode passar apenas em testes; precisa validação externa.

**Referência**: constitution.md test_expectations, verify_gate; spec.md §6.1, AC-10

**Ação para próxima run**: Considerar ferramenta WCAG checker integrada em post-review ou hook linter customizado.

---

### L3: Navbar-Contrast Color-mix over Ambient

**Contexto**: Design sistem technique
**Descrição**: Técnica `color-mix(in srgb, token, transparent N%)` + fallback sólido (pré-@supports) é padrão aprovado em prod para fundos tintados sobre superfícies ambient.

**Referência**: atlas recall "navbar-contrast-color-mix-over-ambient" (validado em prod)

**Implementação**: spec.md §5.2 (StatusChip fundo tintado com 85% transparent).

**Aplicação nesta run**: Fallback + @supports strategy confirmada; opacidade 85% sugestão (R2: pode ajustar se contraste degradar <4.5:1).

---

### L4: Motion Override Bypasses Reduced-Motion

**Contexto**: Acessibilidade (WCAG 2.1, Motion)
**Descrição**: Qualquer transition/animation override em componente de motion/react **DEVE ter ternário `useReducedMotion()` explícito**. Ignorar este padrão viola WCAG 2.1 Success Criterion 2.3.3 (Motion from Interactions).

**Implicação**: Se plan adicionar transições a StatusChip ou nav pill, ternário obrigatório:
```jsx
const prefersReducedMotion = useReducedMotion();
const transition = prefersReducedMotion ? 'none' : 'background 200ms ease-out';
```

**Aplicação nesta run**: spec.md omite motion transitions; mas se plan adicionar, L4 aplica. Risco R4 rastreado em handoff-001.md.

**Referência**: WCAG 2.1 SC 2.3.3, constitution.md boundary

---

### L5: Color-mix Contraste Cego (Nova)

**Contexto**: Learning desta run
**Descrição**: Técnica color-mix com `transparent N%` reduz luminância do token de fundo. Contraste de texto pode ser >4.5:1 sobre token sólido, mas <4.5:1 sobre fundo tintado, especialmente com N% alto (85%).

**Caso concreto**: 
- `--danger (#ff8d9d) on texto --on-danger (#21040a)` → ~5.2:1 (borderline WCAG AA)
- `color-mix(--danger, transparent 85%) on --surface (#0e1b2f) com --on-danger` → pode degradar <4.5:1 (luminância reduzida)

**Implicação**: 
1. Audit contraste é **CRÍTICA** antes de ship
2. Se falhar, ajustar opacidade (80% vs 85%), trocar tons, ou aceitar justificativa documentada
3. Verificação deve incluir fallback sólido também (rgba alternativa)

**Ação plan**: Cálculo exato via luminância relativa (CIE WCAG formula); use ferramentas: WAVE, Axe, manual contrast checker com sRGB precision.

**Referência**: spec.md §6.1 (AC-6, AC-7, AC-10), handoff-001.md R2

**Precedente**: atlas recall L3 (color-mix técnica), mas sem validação numérica contraste naquela run.

---

## Learnings de Processo

### P1: Ponto Aberto → Gate Confirmação

**Contexto**: spec.md §7 ("Mapeamento Settings ainda aberto")
**Descrição**: Spec deixou mapeamento Settings (agents/integrations tone) em aberto para confirmação HITL.

**Resultado**: Usuario aprovou mapeamento no gate sem mudanças (Available→success, Simulated→neutral, Not configured→warning).

**Implicação**: Clareza no spec sobre "pontos abertos" + gate HITL pode resolver ambiguidades antes de plan.

**Aplicação**: future specs devem marcar seções "§ Decisão Aberta" explicitamente e collect gate confirmation estruturado.

---

### P2: Brain Recall + Stack Alignment

**Contexto**: state.md brain recalls L1–L4
**Descrição**: Brain recall (atlas + learnings anteriores) foi consultado antes de spec e infor

mou decisões design (mapeamento semântico, color-mix fallback, motion ternário).

**Resultado**: Spec incorporou learnings (L1, L3, L4 mencionados indiretamente em AC/referências).

**Implicação**: Brain recall é fase crítica pré-spec (ou pré-plan) para evitar re-work contraste, motion, token.

---

## Rastreabilidade

- **L1–L4 origem**: state.md Brain Recall (2026-07-09)
- **L5 origem**: Análise spec.md §6.1 + handoff-agent (2026-07-09)
- **P1–P2 origem**: Análise dispatch + spec flow (2026-07-09)
- **Próxima atualização**: sdd-plan (ADRs técnicos), sdd-verify (audit resultados)

## Status das Learnings na Run P2

| # | Learning | Criticidade | Adotado Spec? | Status Plan |
|---|----------|-------------|---------------|-------------|
| L1 | On-token semantics | ALTA | Sim (AC-10, refs) | Verificar em StatusChip contraste numérico |
| L2 | Gate blind to contrast | CRÍTICA | Sim (AC-10, boundary) | Executar audit externa; não confiar em gate lint |
| L3 | Navbar color-mix technique | ALTA | Sim (§5.2, AC-6) | Implementar fallback @supports exato |
| L4 | Motion reduced-motion ternário | ALTA | Parcial (spec omite motion) | Se motion adicionado, ternário obrigatório (R4) |
| L5 | Color-mix contraste cego | CRÍTICA | Sim (§6.1, AC-10) | Cálculo luminância relativa obrigatório |
| P1 | Gate confirmation ponto aberto | MÉDIA | Sim (mapeamento Settings) | Aplicar a próximas specs |
| P2 | Brain recall stack alignment | ALTA | Sim (incorporado design) | Continuar consulta antes de plan |
