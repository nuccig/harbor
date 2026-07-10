# Handoff — Spec→Plan (night-harbor-p2-statuschip-nav)

**Data**: 2026-07-09
**De**: spec (aprovada HITL)
**Para**: plan (sdd-plan)
**Controlador**: handoff-agent

---

## Decisões Tomadas

1. **Mapeamento Settings** (ponto aberto em spec §7) **→ CONFIRMADO no gate**
   - Agents `Available` → `success` (agente pronto)
   - Integrations `Simulated` → `neutral` (mock, sem ação)
   - Integrations `Not configured` → `warning` (requer setup)
   - **Referência**: spec.md §4.2; state.md G2

2. **StatusChip Superfícies Confirmadas**
   - Shell: sessions (Running/Ready/Complete) + issueQueue (High/Medium/Low) + currentProject (Active)
   - Settings: agents (Available) + integrations (Simulated/Not configured)
   - Sem expandir para outras áreas; zero mudança em legacy concepts (command-deck, signal-poster)
   - **Referência**: spec.md §3.1, §4

3. **Nav Ícone+Label + Pill Ativa**
   - Ícones Phosphor Regular: Compass, FolderOpen, Boat, Tray, GearSix
   - Labels sempre visíveis (nunca icon-only)
   - Pill ativa: `var(--surface-active)` bg + `var(--accent)` border
   - `aria-current="page"` mantido
   - **Referência**: spec.md §3.1 (3.1b), §6.3

4. **Técnica Fundo Tintado**
   - `color-mix(in srgb, var(--chipToken), transparent 85%)` + fallback sólido em `@supports`
   - Fallback pré-@supports: background sólido + borda token
   - Tokens existentes consumidos via `var()`; sem token novo
   - **Referência**: spec.md §5.2 (atlas recall: navbar-contrast-color-mix-over-ambient validado em prod)

---

## Alternativas Descartadas

- **Expandir StatusChip para P2.3+ (KPI strip, ações inline, filter chips)** → Escopo P2.1+P2.2 apenas (out-of-scope §3.2)
- **Icon-only nav** → Descartado em favor de ícone+label (design.md §6, scanabilidade)
- **Tokens de motion novos** → Assumem-se P1.1+P1.2 como pré-requisito (out-of-scope)

---

## Suposições Validadas

1. **color-mix suportado em @supports** (atlas recall navrou-contrast-color-mix-over-ambient aprovado em prod)
2. **Boat ícone para sessions** (metáfora porto; validado no grill G3)
3. **Fallback neutro + consumo var() sem mudança em legacy** (validado grill G4; constitution.md boundary)
4. **WCAG 2.1 AA contraste numérico ≥4.5:1 em auditoria obrigatória** (spec §6.1, AC-10, constitution.md test_expectations)
5. **Tokens existentes suficientes** (--success, --on-success, --warning, --on-warning, --danger, --on-danger, --border; seção 5.1 spec.md)

---

## Suposições Invalidadas

(Nenhuma. Spec aprovado sem mudanças; ponto aberto §7 confirmado no gate.)

---

## Descobertas Inesperadas

(Nenhuma. Spec seguiu direção esperada do dispatch; brain recall aplicado normalmente.)

---

## Raciocínio Comprimido

Spec aprovado HITL 2026-07-09 sem edições. 11 seções, 10 ACs EARS. StatusChip + nav ícone+label — cumprindo design.md §6 e ADR-0004. Mapeamento Settings ponto aberto → resolvido no gate (Available→success, Simulated→neutral, Not configured→warning). Riscos numéricos (contraste color-mix, --on-danger ~5.2:1, --surface-active token) transferem para plan.

---

## Contexto que a Próxima Fase (Plan) PRECISA

### Tarefas de Verificação Antes do Plano Técnico

1. **Verificar token `--surface-active`**
   - Mencionar em spec.md §3.1 ("pill ativa: `background: var(--surface-active)`")
   - Token existe em concepts.module.css? Se não, planejar criar ou usar alternativa (ex: `var(--surface-container)`)
   - **Ação plan**: confirmação numérica + decidir criar token vs reuso

2. **Auditoria contraste numérico (WCAG 2.1 AA, 4.5:1)**
   - AC-6, AC-7, AC-10 exigem review específico
   - Pares a auditar:
     - `--success (#5ad8a6) com transparent 85%` sobre `--surface (#0e1b2f)` → esperado >4.5:1 (spec §6.1)
     - `--warning (#ffd166) com transparent 85%` sobre `--surface` → similar
     - `--danger (#ff8d9d) com transparent 85%` sobre `--surface` → critical (base ~5.2:1, transparência reduz)
     - Fallback sólido (rgba/cor alterada) → contrastando com texto `--on-*`
   - **Ação plan**: cálcul

o exato de luminância relativa + ferramenta WCAG checker

3. **Motion Transitions (Condicionais)**
   - Spec omite transição de chip/nav; mas se plano adicionar, constitution.md learning L4 aplica: ternário `useReducedMotion()` obrigatório
   - **Ação plan**: decidir se motion/transition + coordenar com P1.1+P1.2 tokens

4. **Componente `StatusChip.tsx` — Design Técnico**
   - Props: `status` (enum string), `label` (string), `tone` (success/warning/danger/neutral), `icon` (React.ComponentType, opcional)
   - Render interna: dot (círculo em cor tone) + ícone (se presente) + label
   - Estilo: fallback sólido, @supports color-mix, acessibilidade aria
   - **Ação plan**: estrutura detalhada do componente

5. **Mapeamento Mock-Data → StatusChip**
   - spec.md §9 (mock-catalog.sessions, mock-catalog.issueQueue, currentProject.status, agents.status, integrations.status)
   - Plan deve confirmar estrutura de dados existente (tipos, enums de status)
   - **Ação plan**: estrutura mock-catalog, enums de status

### Contexto Estático (Não Muda)

- **Branching**: feat/night-harbor-p2-statuschip-nav (stack sobre feat/night-harbor-p1-tokens)
- **Artefatos**: .orquestrador/night-harbor-p2-statuschip-nav/
- **Verify gate**: npm run lint/typecheck/test (constitution.md test_expectations)
- **Boundary crítico**: "review numérico de contraste para qualquer par de cor novo/alterado"
- **Design.md § existentes**: 6 (a11y, color-not-only)
- **ADR-0004**: Phosphor Regular como set único
- **atlas recalls**: navbar-contrast-color-mix-over-ambient, color-not-only, motion-override-bypasses-reduced-motion, on-token-semantics

---

## Riscos Transferidos

| # | Risco | Severidade | Ação Plan | Origem |
|----|-------|-----------|-----------|--------|
| R1 | Token `--surface-active` pode não existir como token definido | MÉDIO | Verificar em concepts.module.css; se não existe, criar ou decidir alternativa (surface-container, surface) | spec.md §3.1 (pill ativa background) |
| R2 | Contraste color-mix 85% transparent sobre --surface pode degradar <4.5:1 | ALTO | Cálculo exato via luminância relativa; se falhar, ajustar opacidade (80% vs 85%) ou alternativa fallback | spec.md §6.1, AC-10, constitution.md boundary |
| R3 | Par --on-danger (#21040a) sobre --danger (#ff8d9d) é ~5.2:1 (borderline WCAG AA) | MÉDIO | Review numérico exato; se <4.5:1 em color-mix, justificar ou ajustar tons | spec.md §6.1 (~5.2:1 verificar) |
| R4 | Motion transitions (chip/nav) podem bypassear reduced-motion sem ternário useReducedMotion() | MÉDIO | Se plan adicionar motion, ternário obrigatório (constitution.md L4, state.md L4) | constitution.md learnings (motion-override-bypasses-reduced-motion) |

---

## Entrega para Plan

**Artefatos de entrada para sdd-plan**:
- spec.md (aprovado, 10 ACs EARS, 0 mudanças solicitadas)
- memory/state.md (decisões G1–G4, brain recalls L1–L4)
- memory/handoff-001.md (este arquivo)
- memory/decisions.md (decisões duráveis)
- memory/learnings.md (learnings duráveis + novos R1–R4)
- constitution.md (reuso P1)

**Próximo passo**: sdd-plan deve produzir technical design + ADRs + task breakdown, endereçando riscos R1–R4 antes de tasks.
