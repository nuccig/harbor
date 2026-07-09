# Estado do Pipeline — P1 (Fundação de Tokens)

## Status Atual

**Fase**: `done` (run encerrada)  
**Data**: 2026-07-09  
**Saída**: PR #4 (ready) `feat/night-harbor-p1-tokens` → `codex/issue-29-configuracoes-onboarding-ui` (stacked sobre PR #2)  
**Consolidação**: learnings.md L-001..L-005 aprovados; SKILL.md atualizado (commit 0a34d89); brain-sync: 3 learnings promovidos ao atlas  
**Próximo lote**: P2.1+P2.2 da proposta (`.orquestrador/night-harbor-ui-design/proposta-melhorias-001.md` §4) — invocar orquestrador referenciando os IDs P2.x

---

## Checklist de Implementação

### Motion (AC-001-004)
- [x] `global.css` `:root` → inserir `--motion-duration: 280ms`, `--motion-duration-exit: 182ms`, `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)` ✅ (dabbe50)
- [x] `motion-tokens.ts` (novo) → exportar `motionTokens` com `duration: 0.28`, `durationExit: 0.182`, `ease: [0.22,1,0.36,1]` ✅ (dabbe50)
- [x] `ConceptScaffold.tsx` → importar `motionTokens`, aplicar em exit transition (override duration) ✅ (dabbe50, FIX-3)
- [x] `NightHarborLayout.tsx` → remover hardcoding, usar `motionTokens` ✅ (dabbe50)
- [x] novo `motion-tokens.test.ts` → assert AC-012 (exit < enter) ✅ (dabbe50, 3 asserts)

### Status (AC-005-006)
- [x] `concepts.module.css` `[data-concept='night-harbor']` → inserir `--success`, `--on-success`, `--warning`, `--on-warning` ✅ (dabbe50, FIX-1 semântica)
- [x] Comentários CSS documentando WCAG ratios (9.7:1 verde, 12.4:1 âmbar) ✅ (dabbe50)

### Tipografia (AC-007-008)
- [x] `global.css` `:root` → inserir `--type-metric`, `--weight-body`, `--weight-label`, `--weight-heading` ✅ (dabbe50)
- [x] `primitives.module.css` → criar `.data` com MONO + tabular-nums ✅ (dabbe50)

### Ícones (AC-009)
- [x] `global.css` `:root` → inserir `--icon-sm`, `--icon-md`, `--icon-lg` ✅ (dabbe50)
- [x] `concepts.module.css` `.signatureIcon svg` → usar `var(--icon-md)` em vez de hardcoded 1.2rem ✅ (dabbe50)

### Cleanup (AC-010)
- [x] `global.css` `:root` → mapear `--ease-standard` e `--duration-fast` como aliases + novo `--motion-duration-fast: 160ms` ✅ (dabbe50, FIX-2)
- [x] Comentário TODO com remoção futura ✅ (dabbe50)

### Verify (AC-011)
- [x] `npm run lint` → zero erros ✅ (dabbe50 gate)
- [x] `npm run typecheck` → zero erros TypeScript ✅ (dabbe50 gate)
- [x] `npm run test` → todas as suites passam (151/151, +3 motion-tokens.test.ts) ✅ (dabbe50 gate)
- [x] Nenhuma regressão em testes existentes ✅ (dabbe50 gate, no regressions)

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

### Consolidate (Próximo)
- **Input**: implementação verde (151/151 testes) + 3 fixes do controller
- **Atividade**: registrar lessons, atualizar skill, preparar merge
- **Saída**: handoff-002.md, lessons.md opcional, PR #2 pronto
- **Agente**: consolidate-agent (dispatcher role)

### Merge (Após consolidate)
- **Input**: consolidation aprovada
- **Atividade**: merge de PR #2 para feat/scaffold-inicial
- **Saída**: branch feat/night-harbor-p1-tokens merged
- **Agente**: controller/dispatcher

### P2.1 — StatusChip (Após P1 merge)
- **Input**: tokens P1 disponíveis em main
- **Bloqueador**: P1 ✓
- **Escopo**: StatusChip (dot + ícone + label), usa `--success`, `--warning`, `--on-*`
- **Esforço**: M

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
| 2026-07-09 | Criação de handoff-001.md | dispatcher/handoff-agent | ✓ |
| 2026-07-09 | Implementação: 12 ACs, 148→151 testes | implement-agent | ✓ |
| 2026-07-09 | Controller review: FIX-1/2/3, gate verde | controller/review-agent | ✓ |
| 2026-07-09 | Commits e13d847 + dabbe50 em feat/night-harbor-p1-tokens | controller | ✓ |
| 2026-07-09 | Criação de handoff-002.md | dispatcher/handoff-agent | ✓ |
| 2026-07-09 | Consolidation: learnings.md + SKILL.md (commit 0a34d89), HITL aprovado | consolidate-agent | ✓ |
| 2026-07-09 | Brain-sync: 3 learnings → atlas/learnings/ (HITL aprovado) | consolidate-agent | ✓ |
| 2026-07-09 | Push + PR #4 draft → ready (sem CI no repo; gate local verde) | controller | ✓ |

---

**Última atualização**: 2026-07-09  
**Responsável**: handoff-agent (dispatcher)
