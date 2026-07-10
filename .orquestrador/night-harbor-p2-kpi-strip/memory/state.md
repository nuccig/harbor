# Estado do Pipeline — P2.3 (KPI strip + sparkline-maré)

## Status Atual

**Fase**: spec aprovada → handoff spec→plan
**Data**: 2026-07-10
**Branch**: feat/night-harbor-p2-kpi-strip (stacked sobre feat/night-harbor-p2-statuschip-nav / PR #5; cadeia #2 ← #4 ← #5 ← #6)
**Modo**: pipeline normal (sem --audit)
**Origem**: proposta-melhorias-001.md §4 — P2.3 (KPI strip no Overview)

## Decisões do triage/grill (HITL, 2026-07-10)

| # | Decisão | Escolha |
|---|---------|---------|
| G0a | Modo pipeline | Normal (sem audit) |
| G0b | Branch base | Stack em feat/night-harbor-p2-statuschip-nav (PR #6 → PR #5) |
| G1 | KPIs e dados | 4 KPIs (agentes ativos, fila, taxa de sucesso, agent time); mock estendido com bloco kpis (valores + séries determinísticas); derivação onde possível, dado novo só p/ taxa de sucesso |
| G2 | Recent usage | KPI strip SUBSTITUI o painel no Overview; slice recentUsage permanece no mock p/ compat |
| G3 | Sparkline lib | **Recharts** (dep nova aprovada HITL) — SVG, jsdom-testável; estática, aria-hidden, 8–12 barras, accent c/ opacidade |
| G4 | Legados | Fallback var() neutro (precedente G4 do P2 anterior); MetricTile em ui/; zero edição em command-deck/signal-poster |

## Brain Recall (atlas, 2026-07-10)

- L contrast-math-by-script: WCAG por script node, nunca aritmética LLM; compor cor efetiva de tints antes de medir
- L visual-contrast-against-canvas: medir contra canvas real, não só surface do card
- L css-module-class-asserts: asserts por substring; counts derivados de fixture
- L verify-gate-blind-to-contrast + on-token-semantics + motion-override (já na constitution)
- Skill dataviz disponível — referenciar no handoff p/ plan (sparkline)

## Fases

| Fase | Status |
|------|--------|
| 0 Triage | ✓ (normal, stack sobre PR #5) |
| 0.5 Brain recall | ✓ |
| 1 Constitution | ✓ aprovada (reuso P2 c/ ajustes) |
| 2 Grill-me | ✓ (4 perguntas; G3 revisada p/ Recharts a pedido do usuário) |
| 3 Spec | ✓ aprovada HITL (18 ACs EARS) |
| 4 Handoff spec→plan | em andamento |

**Última atualização**: 2026-07-10 — controller (spec aprovada)
