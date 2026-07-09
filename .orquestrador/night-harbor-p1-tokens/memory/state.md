# Estado do Pipeline — P1 (Fundação de Tokens)

## Status Atual

**Fase**: `implement`  
**Data**: 2026-07-09  
**Entrada**: spec.md aprovada pelo usuário (P1 completo, 12 ACs)  
**Atividade**: Aguardando implement-agent

---

## Checklist de Implementação

### Motion (AC-001-004)
- [ ] `global.css` `:root` → inserir `--motion-duration: 280ms`, `--motion-duration-exit: 182ms`, `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)`
- [ ] `motion-tokens.ts` (novo) → exportar `motionTokens` com `duration: 0.28`, `durationExit: 0.182`, `ease: [0.22,1,0.36,1]`
- [ ] `ConceptScaffold.tsx` → importar `motionTokens`, aplicar em exit transition (override duration)
- [ ] `NightHarborLayout.tsx` → remover hardcoding, usar `motionTokens`
- [ ] `app-integration.test.tsx` ou novo `concept-transitions.test.tsx` → assert AC-012 (exit < enter)

### Status (AC-005-006)
- [ ] `concepts.module.css` `[data-concept='night-harbor']` → inserir `--success`, `--on-success`, `--warning`, `--on-warning`
- [ ] Comentários CSS documentando WCAG ratios (9.7:1 verde, 12.4:1 âmbar)

### Tipografia (AC-007-008)
- [ ] `global.css` `:root` → inserir `--type-metric`, `--weight-body`, `--weight-label`, `--weight-heading`
- [ ] `primitives.module.css` → criar `.data` com MONO + tabular-nums

### Ícones (AC-009)
- [ ] `global.css` `:root` → inserir `--icon-sm`, `--icon-md`, `--icon-lg`
- [ ] `concepts.module.css` `.signatureIcon svg` → usar `var(--icon-md)` em vez de hardcoded 1.2rem

### Cleanup (AC-010)
- [ ] `global.css` `:root` → mapear `--ease-standard` e `--duration-fast` como aliases (não deletar)
- [ ] Comentário TODO com remoção futura (semana que vem)

### Verify (AC-011)
- [ ] `npm run lint` → zero erros
- [ ] `npm run typecheck` → zero erros TypeScript
- [ ] `npm run test` → todas as suites passam
- [ ] Nenhuma regressão em testes existentes

---

## Armadilhas Rastreadas

| # | Armadilha | Localização | Mitigação |
|---|-----------|-------------|-----------|
| A1 | `--duration-fast` muda 160ms → 280ms, testes podem falhar | tests/renderer/** | Revisar assertions sobre duração; atualizar se necessário |
| A2 | motion/react espera `duration: 0.28` (number), não `'280ms'` | NightHarborLayout.tsx, motionTokens.ts | Exportar como numérico; testar npm run typecheck |
| A3 | Clamp `--type-metric` em 1024px pode não respeitar min 1.6rem | DevTools | Confirmar visualmente que resultado ≥ 1.6rem |
| A4 | Existing testes usam hardcoded transition values | app-integration.test.tsx, design-lab.test.tsx | Grep e atualizar assertions antes de commit |
| A5 | Ambient layer compatibilidade com `prefers-reduced-motion` | skill harbor-night-harbor-ui | Confirmar em tests que ambient logic não quebra |

---

## Fases Anteriores

### Spec (Concluída)
- Data: 2026-07-XX
- Saída: spec.md com 12 ACs (aprovada pelo usuário)
- Controle: controller (spec-agent ou orquestrador)

---

## Próximas Fases

### Verify (Próximo)
- **Input**: código implementado em repo
- **Atividade**: `npm run lint && npm run typecheck && npm run test`
- **Saída**: Verde (todos os ACs passam) ou lista de erros
- **Agente**: verify-agent (skill `/verify`)

### Review (Após verify)
- **Input**: código + testes verdes
- **Atividade**: code-review de qualidade (simplification, efficiency, bugs)
- **Saída**: findings ou aprovação
- **Agente**: code-reviewer (skill `sdd-review`)

### PR (Após review)
- **Input**: revisão aprovada
- **Atividade**: criar PR para feat/scaffold-inicial
- **Saída**: PR URL (aguardando merge)
- **Agente**: dispatcher/controller

### P2 — Vocabulário de Componentes
- **Bloqueador**: P1 ✓
- **Escopo**: StatusChip, nav, KPI strip, ações inline, filter chips, micro-interações
- **Esforço**: M-L (maior ganho visível)
- **Sequência**: P2.1 (StatusChip) + P2.2 (nav) → P2.3 (KPI) → P2.4-6

---

## Dependências Externas

- [ ] git repo (`feat/scaffold-inicial` branch) acessível
- [ ] npm ci / install funciona
- [ ] vitest, eslint, typescript configurados
- [ ] motion/react v19+ instalado
- [ ] Chrome DevTools disponível para testes manuais (opcional)

---

## Comunicação com Implement-Agent

Handoff: `handoff-001.md` (lido pelo implement-agent)

**Resumo crítico em 3 linhas**:
1. Criar `motion-tokens.ts` com valores numéricos (0.28, 0.182, ease array) e aplica em ConceptScaffold/NightHarborLayout; adicionar tokens CSS em global.css `:root` e night-harbor status block.
2. Mapear `--ease-standard` / `--duration-fast` como aliases (não deletar); criar `.data` em primitives com MONO + tabular-nums.
3. Verify gate: `npm run lint && npm run typecheck && npm run test` devem passar; nenhuma regressão em testes existentes.

---

## Histórico

| Data | Evento | Agente | Status |
|------|--------|--------|--------|
| 2026-07-09 | Criação de spec.md e aprovação | controller/spec-agent | ✓ |
| 2026-07-09 | Criação de handoff-001.md | dispatcher/handoff-agent | ✓ (este documento) |
| — | Implementação | implement-agent | ⏳ (aguardando) |

---

**Última atualização**: 2026-07-09  
**Responsável**: handoff-agent (dispatcher)
