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
| 5 Plan | ✓ aprovado HITL + correção de contraste aplicada (rev. 2) |
| 6 Handoff plan→tasks | ✓ handoff-002.md |
| 7 Tasks | ✓ 3 tasks serial 001→002→003 (commit a33e641) |
| 8 Analyze | ✓ PASS 10/10 ACs, zero contradições |
| 9 Handoff →implement | ✓ handoff-003.md |
| 10 Implement | em andamento (serial: 001 → 002 → 003) |
| 11+ | pendente |

## Decisões do gate do plan (vinculantes, incorporadas na rev. 2)

1. Chip: fundo `color-mix(in srgb, var(--tone), transparent 85%)` + texto/ícone/dot na COR DO TOKEN (não on-*); neutral usa `--ink-muted`. Ratios (WCAG exato): success 7.10:1, warning 8.48:1, danger 6.08:1, neutral 7.97:1 ✓.
2. Fallback sem color-mix: bg sólido `var(--surface-raised)` (#152642) — 8.51/10.49/6.88/7.74 ✓.
3. on-* NÃO usados no chip (reservados a fills sólidos futuros).
4. Ícones por tone: CheckCircle/Clock/Warning/Minus (Regular).
5. Mapeamento inline Shell/Settings; icon prop opcional default por tone; dot = cor token; pill ativa reusa --surface-active (ink 11.15:1, borda accent 4.93:1 ✓).
6. Legados: cadeia var() fallback — texto `var(--success, var(--ink-muted))`, bg `var(--surface-raised)` (existe nos 3 conceitos).

Nota de processo: plan-agent caiu 1× por session limit da conta durante a correção; retry único (protocolo contract.md) concluiu. Auditoria numérica do controller pegou erro grave do plan rev. 1 (texto on-* sobre tintado = 1.4–1.7:1; luminâncias erradas na contrast-audit rev. 1).

**Última atualização**: 2026-07-09 — controller (plan fechado)
