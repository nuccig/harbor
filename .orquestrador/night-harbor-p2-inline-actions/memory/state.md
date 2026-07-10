# Estado do Pipeline — P2.4 (ações inline nos cards de sessão)

## Status Atual

**Fase**: `grill-me` (próxima)
**Branch**: feat/night-harbor-p2-inline-actions (stacked sobre feat/night-harbor-p2-kpi-strip / PR #6; cadeia #2 ← #4 ← #5 ← #6 ← #7)
**Modo**: pipeline normal (sem --audit)
**Origem**: proposta-melhorias-001.md §4 — P2.4 (ações inline nos cards de sessão: pausar/retomar/abrir log, mock — sem backend)
**Data**: 2026-07-10

## Decisões do triage (HITL, 2026-07-10)

| # | Decisão | Escolha |
|---|---------|---------|
| G0a | Modo pipeline | Normal (sem audit) |
| G0b | Branch | feat/night-harbor-p2-inline-actions, stack sobre feat/night-harbor-p2-kpi-strip (PR #7 → PR #6) |

Issue Source Resolution: no-op (sem --issue na invocação); issue_source: nucci-projects herdado da constitution anterior; hooks [active]/[done] NÃO disparam nesta run.

## Brain Recall (atlas, 2026-07-10)

- L contrast-math-by-script: WCAG por script na fase de PLAN, controller roda; compor cor efetiva antes de medir
- L css-module-class-asserts: substring + counts de fixture; item FIXO de checklist de review (recorreu no P2.3)
- L recharts-jsdom-testing-gotchas: testes que renderizam Shell montam Recharts (KPI strip) → stub completo MediaQueryList; contagem de barras filtra tagName
- L parallel-tasks-symbol-coupling: acoplamento por fixture/símbolo entre tasks paralelas → verify na árvore combinada antes de PASS
- L design-system-context-menu-auto-close: menu de AÇÃO ≠ menu de navegação; aqui ações são mock/sync — se plan escolher overflow menu, avaliar categoria
- L astryx-iconbutton (generalização): botão icon-only exige aria-label explícito; primitive dedicada > flag

## Decisões do grill (HITL, 2026-07-10)

| # | Decisão | Escolha |
|---|---------|---------|
| G1 | Superfície | AMBOS os pontos (Overview "Active agent sessions" + board do destino Sessions); mesmo componente de ações reusável |
| G2 | "Abrir log" mock | Painel/drawer INLINE que expande no card, ~6–10 linhas de log fake determinísticas do mock-catalog (timestamp + linha) |
| G3 | Matriz status→ações | Running: pausar+log; Paused: retomar+log; Ready/Complete: só log. Status novo 'Paused' (tone attention/âmbar no StatusChip → par de cor auditado no plan). Estado vivo no ExperienceState (reducer action); mockCatalog permanece frozen como seed |
| G4 | Apresentação | Icon buttons sempre visíveis (máx 2: Pause/Play + log, Phosphor), aria-label obrigatório; sem hover-reveal, sem kebab |

## Fases

| Fase | Status |
|------|--------|
| 0 Triage | ✓ (normal, stack sobre PR #6, branch criado) |
| 0.5 Brain recall | ✓ |
| 1 Constitution | ✓ aprovada HITL (reuso P2.3 c/ ajustes) |
| 2 Grill-me | ✓ (4 perguntas G1–G4) |
| 3 Spec | em andamento |

**Última atualização**: 2026-07-10 — controller (grill fechado)
