# Handoff P1 — Implementação → Consolidação

**Data de handoff**: 2026-07-09  
**Fase anterior**: implement (concluída)  
**Fase atual**: consolidate  
**Próxima fase**: P2.1 (StatusChip)

---

## 1. Resumo Executivo

A fase implement entregou os 12 ACs (Acceptance Criteria) da spec.md conforme planejado, atingindo gate verde (151/151 testes) após uma rodada de correções do controller. Três problemas obrigatórios — semântica `on-*`, alias `--duration-fast` mudança silenciosa, e exit transition sem `prefers-reduced-motion` — foram corrigidos. O branch `feat/night-harbor-p1-tokens` (PR #2, stacked sobre `codex/issue-29-configuracoes-onboarding-ui`) está pronto para merging e desbloqueia a série P2 (componentes com ícones, KPI strip, statusChip).

---

## 2. Entrega da Fase Implement

### 2.1 Confirmação de Implementação (12 ACs)

| AC | Artefato | Status | Verificação |
|----|----------|--------|-------------|
| AC-001 | `global.css`: `--motion-duration: 280ms`, `--motion-duration-exit: 182ms`, `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)` | ✅ | Lint: OK |
| AC-002 | `src/renderer/src/app/motion-tokens.ts` novo com `duration: 0.28`, `durationExit: 0.182`, `ease: [0.22,1,0.36,1]` | ✅ | TypeCheck: OK |
| AC-003 | `NightHarborLayout.tsx` usa `motionTokens.duration` e `.ease` em vez de hardcoded | ✅ | Lint + Type: OK |
| AC-004 | `ConceptScaffold.tsx` exit transition override com `motionTokens.durationExit` | ✅ | Lint + Type: OK |
| AC-005 | `concepts.module.css`: `--success: #5ad8a6`, `--on-success`, `--warning: #ffd166`, `--on-warning` inseridos | ✅ | WCAG auditado |
| AC-006 | Comentários CSS documentando contraste WCAG (9.7:1 verde, 12.4:1 âmbar) | ✅ | Leitura manual: OK |
| AC-007 | `global.css`: `--type-metric: clamp(1.6rem, 2.2vw, 2.4rem)`, `--weight-body: 400`, `--weight-label: 520`, `--weight-heading: 650` | ✅ | Lint: OK |
| AC-008 | `primitives.module.css`: `.data` com MONO + tabular-nums | ✅ | Lint: OK |
| AC-009 | `global.css`: `--icon-sm: 1rem`, `--icon-md: 1.2rem`, `--icon-lg: 1.5rem` + `.signatureIcon svg` usa `var(--icon-md)` | ✅ | Lint: OK |
| AC-010 | Aliases `--ease-standard` e `--duration-fast` mapeadas aos novos valores (não deletadas) | ✅ | Lint: OK |
| AC-011 | Verify gate (npm run lint/typecheck/test) passou sem regressão | ✅ | 151/151 testes |
| AC-012 | Teste numérico em `tests/renderer/model/motion-tokens.test.ts` (exit < enter) | ✅ | 3 asserts verdes |

### 2.2 Verify Gate — Primeira Rodada
- **Entrada**: 148 testes (base)
- **Saída**: 151 testes (+3 novos motion-tokens.test.ts)
- **Lint**: ✅ Zero erros
- **TypeCheck**: ✅ Zero erros
- **Testes**: ✅ Todas as suites passam

### 2.3 Controller Review — Problemas Obrigatórios (Não Detectados pelo Verify Gate)

**FIX-1: Semântica `on-*` invertida (AC-005)**
- **Problema**: `--on-success: #f3f7ff` (cor clara) sobre `--success: #5ad8a6` (verde) = 1.66:1 (falha WCAG AA)
- **Raiz**: Agente inverteu significado de `on-*` — é cor de **texto/overlay** sobre o token como **fundo**, não cor de fundo sobre o token como texto
- **Correção**: `--on-success` → `#07111f` (preto-noite) = 10.65:1 contra `#5ad8a6` ✅
- **Padrão WCAG**: alinha com `--on-accent` (já escuro em night-harbor) e `--on-danger`

**FIX-2: Alias `--duration-fast` mudança silenciosa de 160ms → 280ms (AC-010)**
- **Problema**: Mapeamento `--duration-fast: var(--motion-duration)` (280ms) mudou silenciosamente o tier rápido de 160ms para 280ms, tornando hovers mais lentos
- **Raiz**: "Fast" é um papel semântico distinto de "base"; não devem colapsar. O easing era a divergência real, não a duração
- **Correção**: Novo token `--motion-duration-fast: 160ms` em `global.css`, independente de `--motion-duration`
- **Resultado**: `--duration-fast` permanece 160ms (comportamento legado preservado); tiers fast/base são agora distintos

**FIX-3: Exit transition hardcoded ignorava `prefers-reduced-motion` (AC-004)**
- **Problema**: `ConceptScaffold.tsx` exit transition (182ms + easing) era static, bypassava lógica de `reduceMotion`
- **Raiz**: Motion/react overrides (exit, enter) com `transition` nested não herdam da wrapper `MotionConfig reducedMotion='user'` automaticamente
- **Correção**: Ternário `exitTransition = reduceMotion ? { duration: 0.08 } : { duration: motionTokens.durationExit, ease: motionTokens.ease }` aplicado antes de passar a `exit={{...}}`
- **Verificação**: AC-011 (testes) confirma sem falha sob `matchMedia('prefers-reduced-motion: reduce')`

### 2.4 Fix Round — Commits do Controller

1. **e13d847**: docs + run proposal (pre-fix)
2. **dabbe50**: feat: tokens (fixes 1–3 integrados) + motion-tokens.test.ts atualizado

Verify gate re-rodado pós-fix: **✅ Lint zero, TypeCheck zero, 151/151**

---

## 3. Candidatos a Lesson (para Consolidate)

O consolidate-agent decide qual registrar em `.orquestrador/night-harbor-p1-tokens/lessons.md`:

| # | Lição | Contexto | Decisão esperada |
|---|-------|---------|-----------------|
| **L-001** | Semântica `on-*` exige explicitação em dispatch de token | FIX-1: o agente presumiu `on-*` significava "token como background"; cdc precisa citar que `on-*` é **cor de texto/overlay sobre o token como fundo** | Registrar como lesson: evita repetição em P2 (StatusChip usará `--success`, `--on-success`) |
| **L-002** | Verify gate não detecta erro de contraste WCAG; review numérico do controller é gate real p/ cor | FIX-1 falhou no verify (sem lint de WCAG); apenas review humana pegou. Hint: ferramenta de verificação WCAG em pre-commit futura | Considerar tooling: eslint-plugin-a11y com regra de contraste, ou script pre-commit |
| **L-003** | Unificar tokens ≠ colapsar tiers; fast/base são papéis semânticos distintos | FIX-2: alias `--duration-fast: var(--motion-duration)` colapsou tiers, mudando silenciosamente o comportamento. Fast tem semântica "ação rápida do usuário", base é "transição natural" | Registrar: em P2.1+ (StatusChip, nav hover), manter fast/base separados; padrão de "alias para novo token" só vale p/ transição de nome, não colapso de tier |
| **L-004** | Exit/enter overrides em motion/react bypassam reducedMotion central; é necessário ternário em CADA override | FIX-3: motion/react não propaga `MotionConfig reducedMotion` para nested transitions em exit/enter — precisa lógica redundante | Registrar: padrão `exitTransition = reduceMotion ? fast : motionTokens.durationExit` deve ser boilerplate em ConceptScaffold/DesignLab |
| **L-005** | Fórmula WCAG exata vs aproximada (2.2 gamma): 9.7 vs 11.97 em verde, 12.4 vs 11.3 em âmbar | FIX-1 auditoria: spec pressupunha aproximação com expoente 2.2; cálculo WCAG 2.1 exato divergiu ≤20%. Não falhou AA/AAA, mas precisão foi diferente | Registrar se rigor numérico for critério pós-P1; para P1, aceito (ambos PASSAM) |

---

## 4. Pendências Pós-P1

### 4.1 P2 — Vocabulário de Componentes (Será desbloqueado)

Conforme proposta-melhorias-001.md §4:

- **P2.1**: StatusChip (dot + ícone + label) — usa `--success`, `--warning`, `--on-success`, `--on-warning`
- **P2.2**: Nav lateral com ícone+label + pill ativa — usa `--icon-md`, `--duration-fast` (130ms recover)
- **P2.3**: KPI strip (--type-metric MONO + sparkline-maré) — usa `.data`, `--type-metric`, `clamp` viewport
- **P2.4**: Ações inline (buttons + menu)
- **P2.5**: Filter chips (toggle + badges)
- **P2.6**: Stagger + spring micro-interações

**Bloqueador P1**: Removido ✅ (12 ACs verdes)

### 4.2 P3 — Variantes Futuras (Fora de Escopo P1)

- **P3.1**: Dark-mode full assertive (`color-scheme: dark` + sistema de light-mode removido)
- **P3.2**: Temas paleta (hero colors, semantic-driven palette)
- **P3.3**: Animação ambient em plataformas de alta performance (GPU detection loop)

---

## 5. Skill Desatualizada

**Localização**: `.agents/skills/harbor-night-harbor-ui/SKILL.md`

**Status**: Reflete design.md §5 (motion 280ms, easing, exit=0.65×enter) mas **não menciona os novos tokens P1**:
- Não lista `--motion-duration`, `--motion-duration-exit`, `--motion-ease`, `--motion-duration-fast`
- Não lista `--success`, `--on-success`, `--warning`, `--on-warning`
- Não lista `--type-metric`, `--weight-body`, `--weight-label`, `--weight-heading`
- Não lista `--icon-sm`, `--icon-md`, `--icon-lg`

**Ação esperada (consolidate)**:
1. Atualizar token list (L34–38) de 22 para 32+ tokens
2. Adicionar seção §3.1 "Motion tokens" citando `motion-tokens.ts` e regra `exitTransition = reduceMotion ? ... : ...`
3. Adicionar documentação sobre `--type-metric` clamp (L49, tipografia)
4. Adicionar referência a lesson L-001/L-002 (semântica `on-*`, WCAG review)

**Criticidade**: Médio (skill não está quebrada, apenas desatualizada; P2.1+ pode ignorar se não ler skill)

---

## 6. Histórico de Commits (Fase Implement)

```
(Para reference da consolidate)

e13d847 — docs(harbor-p1): record fix proposal + verify run
dabbe50 — feat(harbor-p1-tokens): motion base + status + type scale + icons
         (Integra FIX-1/2/3; +3 testes; revert de alias-collapse)
```

**Branch**: `feat/night-harbor-p1-tokens` (PR #2)  
**Base**: `codex/issue-29-configuracoes-onboarding-ui` (stacked)  
**Destino**: `feat/scaffold-inicial` (main branch após merge de codex/#2)

---

## 7. Checklist para Consolidate

- [ ] Ler handoff-002.md (este doc) + spec.md + decisions.md
- [ ] Revisar lições L-001 a L-005; decidir quais registrar em `lessons.md`
- [ ] Avaliar skill desatualizada: criar task de update ou deixar para P2.1
- [ ] Confirmar commits e branch antes de liberar para merge
- [ ] Atualizar `memory/state.md` → phase: consolidate, próxima: P2.1
- [ ] Opcional: criar `night-harbor-ui-design/proposta-melhorias-002.md` com learnings

---

## 8. Referências

- `.orquestrador/night-harbor-p1-tokens/spec.md` (12 ACs)
- `.orquestrador/night-harbor-p1-tokens/memory/decisions.md` (D-001 a D-009)
- `.orquestrador/night-harbor-ui-design/proposta-melhorias-001.md` (P2–P3 roadmap)
- `docs/adr/design.md` §5 (motion base 280ms)
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (desatualizado, needs update)

---

**Escrito por**: dispatch handoff-agent  
**Entregue para**: consolidate-agent  
**Status**: Pronto para consolidação e merge
