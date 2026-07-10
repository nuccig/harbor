# Estado do Pipeline — P2.1+P2.2 (StatusChip + Nav ícone+label)

## Status Atual

**Fase**: spec (em andamento)
**Data**: 2026-07-09
**Branch**: feat/night-harbor-p2-statuschip-nav (stacked sobre feat/night-harbor-p1-tokens / PR #4)
**Modo**: pipeline normal (sem --audit)
**Origem**: proposta-melhorias-001.md §4 — P2.1 (StatusChip) + P2.2 (nav ícone+label)

## Decisões do triage/grill (HITL, 2026-07-09)

| # | Decisão | Escolha |
|---|---------|---------|
| G0a | Modo pipeline | Normal (sem audit) |
| G0b | Branch base | Stack em feat/night-harbor-p1-tokens (PR #5 → PR #4) |
| G1 | Mapeamento status→cor | Semântico porto: Running→success, Ready→warning, Complete→neutro, Active→success, High→danger, Medium→warning, Low→neutro |
| G2 | Escopo StatusChip | Shell + Settings (agents/integrations também) |
| G3 | Ícone Sessions | Boat (metáfora porto) |
| G4 | Conceitos legados | Fallback neutro — chip consome var() com fallback; sem mudança em command-deck/signal-poster |

## Brain Recall (atlas, 2026-07-09)

- L on-token-semantics: `on-*` = texto SOBRE o token como fundo (nunca inverso); auditar WCAG exato
- L verify-gate-blind-to-contrast: gate lint/type/test NÃO pega contraste; review numérico obrigatório (está na constitution)
- L navbar-contrast-color-mix: `color-mix(in srgb, token, transparent N%)` + fallback sólido antes de `@supports` — técnica aprovada p/ fundos tintados
- L motion-override-bypasses-reduced-motion: qualquer transition override em motion/react precisa ternário explícito com useReducedMotion()
- D nucci-0022 (contexto): nav ícone+label inline, active state, touch-target — padrão análogo

## Fases

| Fase | Status |
|------|--------|
| 0 Triage | ✓ (normal, stack) |
| 0.5 Brain recall | ✓ (4 learnings + 1 decisão) |
| 1 Constitution | ✓ aprovada (reuso P1 + regra contraste) |
| 2 Grill-me | ✓ (4 perguntas) |
| 3 Spec | ✓ aprovada HITL, commit 41f0183 |
| 4 Handoff spec→plan | ✓ handoff-001.md |
| 5 Plan | ⚠ BLOCKED — gate HITL resolvido, correção dos docs pendente |
| 6+ | pendente |

## BLOQUEIO ATIVO (2026-07-09)

**Causa**: session limit da conta Claude — reseta 21:40 America/Sao_Paulo. Plan-agent (id a20df45bf55b8b4ea) morreu ao aplicar correções pós-gate.

**Gate do plan JÁ RESOLVIDO pelo usuário** (decisões vinculantes):
1. Chip: fundo `color-mix(in srgb, var(--tone), transparent 85%)` + texto/ícone/dot na COR DO TOKEN (não on-*); neutral usa `--ink-muted`. Ratios auditados (controller, WCAG exato): success 7.10:1, warning 8.48:1, danger 6.08:1, neutral 7.97:1 ✓.
2. Fallback sem color-mix: bg sólido `var(--surface-raised)` (#152642) — 8.51/10.49/6.88/7.74 ✓.
3. on-* NÃO usados no chip (reservados a fills sólidos).
4. Ícones por tone: CheckCircle/Clock/Warning/Minus (Regular).
5. Mapeamento inline Shell/Settings; icon prop opcional default por tone; dot = cor token; pill ativa reusa --surface-active.
6. Legados: cadeia var() fallback — texto `var(--success, var(--ink-muted))`, bg `var(--surface-raised)`.

**ERRO CONHECIDO nos docs do plan (NÃO commitados)**: plan.md/adr-0001/adr-0002/contrast-audit.md ainda propõem texto on-* sobre tintado (1.4–1.7:1 FALHA) e luminâncias erradas (ex. L de #0e1b2f é ~0.011, não 0.15; Descoberta 8 inverteu fórmula). Trade-off 80% vs 85% é escolha falsa — ambos falham com on-*.

**Retomada**: re-despachar plan-agent (SendMessage para a20df45bf55b8b4ea ou novo spawn) com as 6 decisões acima para corrigir plan.md §2.5/§2.7/§5, adr/0001, adr/0002, memory/contrast-audit.md. Depois: commit plan → handoff plan→tasks → tasks-agent.

**Última atualização**: 2026-07-09 — controller (bloqueio session limit)
