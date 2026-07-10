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

## Learnings da Run Plan (sdd-plan 2026-07-09)

### L6: Audit de Contraste Deve Incluir Luminâncias Exatas (Criticidade CRÍTICA)

**Contexto**: Plan rev. 1 vs rev. 2
**Descrição**: Primeira iteração do plan cometeu erros graves em auditoria de contraste:
- L(#0e1b2f) estimado ~0.095/0.15; valor exato ≈ 0.011 (diferença massiva)
- Descoberta 8 inverteu fórmula WCAG: `contraste = (L1 + 0.05) / (L2 + 0.05)` foi colocada cor clara no denominador → reportou 0.189:1 para `--ink` sobre fundo tintado success, quando correto é 11.75:1
- Ratios finais alteraram drasticamente: tintado 80% on-success passou de "borderline 1.71:1" para "desaprovado" após linearização correta

**Implicação**:
1. Auditoria de contraste **NUNCA** deve usar aproximações visuais ou ferramentas caixa-preta
2. Cálculo deve incluir linearização sRGB com expoente 2.4 (WCAG 2.1 exato)
3. Verificar fórmula: `contraste = max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)`; cor mais clara sempre no numerador
4. Usar ferramentas que expliquem luminâncias (não só "pass/fail" binário)

**Ação próxima run**: Se audit de contraste for necessária, incluir luminâncias calculadas (sRGB linear, expoente 2.4) ou usar ferramenta auditada (ex: WCAG contrast checker com debug info)

**Aplicação nesta run**: Plan rev. 2 incorporou auditoria numérica exata do controller (linearização correta); todos os ratios cumprindo AA ✓

**Referência**: contrast-audit.md rev. 2 (ERRATA), plan.md §2.7, ADR-0001

---

### L7: Plan-Agent Session Limit — Protocolo de Retry (Processo)

**Contexto**: Plan execution
**Descrição**: Subagent sdd-plan falhou 1× por session limit durante correção de contraste rev. 1 → rev. 2. Retry único (conforme contract.md) completou com sucesso.

**Implicação**:
1. Session limits são raros mas ocorrem em correções iterativas
2. Retry protocolo (max 1 retry per phase) é eficaz
3. Handoff intermediário foi preservado; nenhuma trabalho perdido

**Ação próxima run**: Monitorar se fases com "correção numérica" (contrast, etc) recorrem mais frequentemente a session limit; considerar aumento de tempo limite ou divisão em sub-tasks.

**Aplicação nesta run**: Plan rev. 2 convergiu com sucesso após retry

**Referência**: state.md ("Nota de processo: plan-agent caiu 1× por session limit...")

---

### L8: On-Token Semantics — Restrição a Fill Sólido (Validada + Reforçada)

**Contexto**: Plan approving decision D-007
**Descrição**: L1 teorizava que `--on-*` = "texto sobre o token como fundo"; plan validou e reforçou:
- `--on-success` (#07111f) sobre `--success` (#5ad8a6) sólido = 10.65:1 ✓
- `--on-success` sobre `color-mix(--success, transparent 85%)` tintado = 1.50:1 ✗

**Implicação**:
1. `--on-*` é semântica de **fill sólido**, não fundo tintado
2. Qualquer componente com fundo tintado/transparente deve evitar on-tokens; usar cor do token ou alternativa auditada
3. On-* é par acoplado: só use `--on-X` quando fundo for `--X` sólido puro (não modificado)

**Consequência nesta run**: ADR-0001 reservou on-* para futuros fills sólidos; StatusChip não os usa

**Aplicação futura**: Qualquer badge/button/etc com `background: var(--X)` sólido pode usar `color: var(--on-X)` com confiança (auditado)

**Referência**: L1 anterior, ADR-0001, contrast-audit.md Descoberta 3

---

## Rastreabilidade

- **L1–L4 origem**: state.md Brain Recall (spec, 2026-07-09)
- **L5 origem**: Análise spec.md §6.1 (handoff-spec, 2026-07-09)
- **P1–P2 origem**: Análise dispatch + spec flow (handoff-spec, 2026-07-09)
- **L6–L8 origem**: Plan gate analysis + ADR-0001 + contrast-audit.md (plan, 2026-07-09)
- **Próxima atualização**: sdd-tasks (task breakdown), sdd-implement (CSS conformance), sdd-verify (audit re-validate se cores mudarem)

### L9: Icon Sizing Default Behavior (Phosphor Regular)

**Contexto**: Implement execution
**Descrição**: Nav ícones implementados usando tamanho default 1em Phosphor; spec sugeria customização via `var(--icon-md)`.

**Implementação**: StatusChip defaults (CheckCircle/Clock/Warning/Minus), nav icons (Compass/FolderOpen/Boat/Tray/GearSix) todos com `weight="regular"` explícito, size default 1em.

**Implicação**:
1. Ícones funcionalmente acessíveis (aria-hidden OK, labels visíveis)
2. Tamanho visual pode variar conforme contexto (1em = relativo ao font-size do container)
3. Se customização for necessária (AC-7 falhar visualmente), adicionar `size="var(--icon-md)"` em future iteration (não bloqueia atual)

**Aprendizado**: Phosphor defaults são seguros e portáveis; customização de tamanho é nice-to-have, não deve-ter.

**Referência**: report_anterior (desvio menor: ícone nav 1em), handoff-004.md R1

---

### L10: CSS Module Substring Assertions (Vite Hashing)

**Contexto**: Review + fix phase (finding 201, test refactoring)
**Descrição**: Vite hasha CSS Module class names em runtime (ex: `.statusChip_success` → `.statusChip_success__abc123` pós-compilação). Assertions diretas com `.toHaveClass('statusChip_success')` falham em output hashado.

**Técnica correta**:
```typescript
// ❌ ERRADO
expect(element).toHaveClass('statusChip_success')

// ✓ CORRETO — substring match
const chip = screen.getByText('label').closest('[class*="statusChip"]')
expect(chip?.className).toContain('statusChip_success')
```

**Implicação**:
1. Qualquer componente com CSS Modules em testes deve usar substring matching
2. Padrão é agnóstico a bundler (Webpack, Vite, etc)
3. Helper reutilizável: `expectStatusChip(label, expectedTone)` em shell-settings.test.tsx linha 88–106

**Reusabilidade**: ALTA — padrão imediatamente aplicável a todos os component tests com CSS Modules

**Candidato Atlas**: SIM — "Testing Patterns" / "CSS Module Test Assertions"

**Referência**: handoff-005.md Finding 201, shell-settings.test.tsx (helper `expectStatusChip`), 000-clean.md (confirmado PASS)

---

### L11: Parameterize Mock-Dependent Assertions

**Contexto**: Review + fix phase (finding 101, brittleness refactoring)
**Descrição**: Assertions atadas a valores hardcoded derivados de fixtures (ex: `expect(...).toHaveLength(3)` amarrado a `mockCatalog.agents.length`) falham ambiguamente se dados mock mudarem — impossível distinguir bug de código vs. mudança intencional de mock.

**Solução**:
```typescript
// ❌ FRÁGIL
const availableAgentsCount = 3
expect(...).toHaveLength(availableAgentsCount)

// ✓ MANTÍVEL
const availableAgentsCount = mockCatalog.agents
  .filter(agent => agent.status === 'Available').length
expect(...).toHaveLength(availableAgentsCount)
```

**Implicação**:
1. Qualquer assertion derivando de fixture data deve parameterizar counts/IDs/valores da fonte, nunca hardcoded
2. Refatoração de mock não quebra testes ambiguamente
3. Documentação clara: variável parametrizada comunica intenção

**Reusabilidade**: ALTA — aplicável a todos os testes com mocked catalogs/lookup tables

**Candidato Atlas**: SIM — "Testing Best Practices" / "Fixture-Dependent Assertions"

**Referência**: handoff-005.md Finding 101, shell-settings.test.tsx line 362, 000-clean.md (confirmado PASS após fix a2d888a)

---

## Status das Learnings na Run P2 — Consolidado

| # | Learning | Criticidade | Adotado Spec? | Status Plan | Status Tasks | Status Implement | Status Review+Fix |
|---|----------|-------------|---------------|-------------|-----------|-------------|-------------|
| L1 | On-token semantics | ALTA | Sim (AC-10) | Validado + reforçado (L8) | Confiar em ADR-0001; testable | Implementado conforme | Validado ✓ |
| L2 | Gate blind to contrast | CRÍTICA | Sim (AC-10, boundary) | Cumprido: auditoria manual exata | Re-validate se hex mudar | Hex confirmado var(), nenhuma mudança | Confirmado (ac-10) |
| L3 | Navbar color-mix technique | ALTA | Sim (§5.2) | Implementado: fallback @supports | Verificar CSS corretude | CSS auditado ✓ (fallback + @supports) | Validado ✓ |
| L4 | Motion reduced-motion ternário | ALTA | Parcial | N/A (P2.1+P2.2 sem motion) | Re-aplicar em P3+ se motion | Nenhuma motion nova (OK) | N/A |
| L5 | Color-mix contraste cego | CRÍTICA | Sim (§6.1) | Resolvido: ratios exatos (7.10–8.48) | Confiar em contrast-audit.md | Ratios do plan não mudaram | Ratios mantidos ✓ |
| L6 | Audit luminâncias exatas | CRÍTICA | N/A | Aplicado: rev. 2 corrigiu rev. 1 | N/A (audit já feita) | N/A (audit no plan) | Candidato Atlas (AC-010a) |
| L7 | Retry session limit | MÉDIA | N/A | Ocorreu + resolvido | Monitora | N/A | N/A |
| L8 | On-token fill sólido | ALTA | Novo | Validado: reservados para D-007 | Documentado em ADR-0001 | Implementado: on-* zero em StatusChip | Validado ✓ |
| L9 | Icon sizing default 1em | MÉDIA | Novo | N/A | N/A | Implementado; customização future OK | Confirmado ✓ |
| L10 | CSS Module substring assertions | MÉDIA | N/A | N/A | N/A | N/A | Novo (fix 201): candidato atlas (AC-020b) |
| L11 | Parameterize mock-dependent assertions | MÉDIA | N/A | N/A | N/A | N/A | Novo (fix 101): candidato atlas (AC-030c) |
| P1 | Gate confirmation aberto | MÉDIA | Sim | Aplicado: 6 decisões do gate | Continuar pattern | N/A | Resolvido ✓ |
| P2 | Brain recall alignment | ALTA | Sim | Cumprido | Continuar antes de plan | N/A | Validado ✓ |
