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
| 3 Spec | ✓ aprovada HITL (20 ACs EARS; derivadas a/b/c validadas — KPI Active agents acompanha estado vivo) |
| 4 Handoff spec→plan | ✓ handoff-001.md (+ decisions.md D-001..D-007) |
| 5 Plan | ✓ aprovado HITL (4 ADRs; contrast-audit 33 pares reconfirmado pelo controller por script — 0 falhas; scratchpad/contrast-recheck-p24.mjs) |

## Decisões do gate do plan (vinculantes)

1. Estado vivo: set esparso `pausedSessionIds` + action `toggleSessionPaused` + selector único `selectSessionViews` consumido pelas 3 superfícies (Overview, board Sessions, KPI Active agents). Sparkline permanece estática.
2. Paused = tone `warning` reusado + ícone Phosphor `Pause` — 0 hex novos; pares re-medidos (8.48/10.49 nh; 6.73–10.02 legados).
3. **OVERRIDE do usuário**: SessionCard em `ui/` com props totalmente resolvidas (não shell/); mapping de domínio centralizado no selector p/ não duplicar nos call sites. Revisão concluída: plan.md uniformizado, ADR-0004 amended, ADR-0001 consequência atualizada, D-008..D-012 promovidos. Nota de processo: plan-agent caiu 1× por session limit no meio da revisão; retomado via SendMessage (protocolo contract.md, 3ª ocorrência do padrão — plan P2.3, consolidate P2.3) e concluiu.
4. Sem `:hover` novo (hover ≡ repouso; hover app-wide fica p/ P2.6).
5. Painel de log: fundo `--canvas`, fade/rise 4px gated por `useEffectiveReducedMotion`; texto `--ink`, timestamp `--ink-muted` (6.86–17.64:1).
6. Copy: "Pause/Resume session {agent}: {task}", "Session log for {agent}: {task}", timestamp HH:MM:SS, 8/7/9 linhas fake.

Nota (p/ consolidate): plan verificou empiricamente que o stub de MediaQueryList NÃO é exigido pelo Recharts hoje (185/185 verdes sem stub; gatilho real é useReducedMotionPreference/motion-dom) — nota da constitution empiricamente superada; candidata a correção de learning.

**Última atualização**: 2026-07-10 — controller (plan aprovado c/ override de localização; revisão em andamento)
