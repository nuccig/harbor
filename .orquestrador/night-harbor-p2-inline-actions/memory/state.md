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

| 6 Handoff plan→tasks | ✓ handoff-002.md (+2 riscos novos: boundary ui/↛app/ sem lint enforcement; regressão .itemList→.sessionList) |
| 7 Tasks | ✓ 3 tasks sequenciais (001 dados → 002 ui/SessionCard → 003 shell); scopes disjuntos validados pelo controller; use-reduced-motion/App.tsx realocados T1→T3 (símbolo só consumido lá) |
| 8 Analyze | ✓ PASS 20/20 ACs cobertos de fato, 0 BLOCKER; 2 WARN de rastreabilidade corrigidos pelo controller (AC-016/AC-020 no covers: da 003); INFO: useEffectiveReducedMotion sem unit isolado (precedente do repo aceita); R7 rebase-check é do controller (base recém-criada, sem drift) |

| 9 Handoff →implement | ✓ handoff-003.md |
| 10 Implement | ✓ sequencial 001 (eab19d0, 194/194) → 002 (4a4361d, 209/209) → 003 (d24f5da, 220/220); scopes validados pelo controller a cada task |
| 12 Verify | ✓ controller: lint 0, tsc 0, 220/220; openwiki n/a |
| 13 Review | ✓ round 001, 5 dimensões paralelas: 0 Critical/High, 1 Medium (201 adjacência não derivada no AC-014), 1 Low (202 sem ciclo 3-cliques); requirements 20/20 PASS, architecture/regression/security limpas |
| 14–15 Fix | ✓ 2/2 resolvidos (só inline-actions.test.tsx; issue files resolved). Handoff review→fix inline (issue files self-contained por design do sdd-review) |
| 16 Verify | ✓ controller: lint 0, tsc 0, 220/220 |
| 17 Re-review | **SKIP por decisão HITL do usuário (2026-07-11): apenas 1 round de review nesta run**; validação pós-fix feita pelo controller (escopo + gate + issue files conferidos) |

Notas de implement (p/ consolidate):
- Barrel bare `.../src/renderer/src/app` colide com `App.tsx` em filesystem case-insensitive (TS1149, Windows) — testes importam submodules explícitos (candidato a learning atlas).
- Assert "called with no arguments" incompatível com `onClick={handler}` (React passa SyntheticEvent) — assert reformulado preservando intenção (nenhum sessionId vazando).
- Task 001: implement-agent rodou 1× `git diff --stat` read-only (violação de letra da regra no-git; sem efeito; confessado no Report).
- Regression observação não-bloqueante: useReducedMotionPreference chamado 3×/árvore — dedupe possível em run futura (eficiência).
- Sem screenshot/evidência visual manual (precedente P2/P2.3 mantido; gap documentado no round summary).

| 18 Handoff →consolidate | ✓ handoff-004.md (2 learnings novos genuínos, 3 erratas, gap-analysis da skill — candidatos auditados contra o atlas real) |
| 19 Consolidate | ✓ HITL: itens 1–7 aprovados integrais (atlas: 2 notas novas + 3 erratas + index 27→29; skill harbor-night-harbor-ui: 7 gaps + anti-patterns); ADRs 0017 (live state over frozen seed) e 0018 (ui primitives domain-blind, override→convenção) escritos em docs/adr/; template de constitution corrigido na fonte opencode (matchMedia: regra corrigida + aviso de supersessão — o vetor era reuso de constitution entre runs, não o template) + sync-harness rodado (18 skills × 2 harnesses) |
| 19.5 Brain-sync | ✓ (dobrado no consolidate — atlas atualizado) |
| 21 Audit | SKIP (run sem --audit) |
| 23 PR | em andamento |

Notas de processo: consolidate-agent caiu 1× por session limit (leituras iniciais); retomado via SendMessage e concluiu — 4ª/5ª ocorrências do padrão contadas e corrigidas no próprio learning (recontagem: 5 agentes, 4 runs, 2 projetos). sdd-plan/SKILL.md deliberadamente não tocado (regra matchMedia é de test_expectations, sem contraparte no plan gate).

**Última atualização**: 2026-07-11 — controller (consolidação completa; abrindo PR)
