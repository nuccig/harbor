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
| 3 Spec | em andamento |
| 4+ | pendente |

**Última atualização**: 2026-07-09 — controller
