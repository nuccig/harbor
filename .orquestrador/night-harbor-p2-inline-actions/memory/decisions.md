# Decisões — night-harbor-p2-inline-actions

**Registry de decisões de design e arquitetura aprovadas.**

## Decisões do Triage (HITL, 2026-07-10)

| # | Decisão | Escolha | Referência |
|---|---------|---------|------------|
| D-001 (G0a) | Modo do pipeline | Normal (sem `--audit`) | state.md linha 15 |
| D-002 (G0b) | Branch/stack | `feat/night-harbor-p2-inline-actions`, stacked sobre `feat/night-harbor-p2-kpi-strip` (PR #7 → #6, cadeia #2 ← #4 ← #5 ← #6 ← #7) | state.md linha 16 |

---

## Decisões do Grill (HITL, 2026-07-10)

| # | Decisão | Escolha | Referência |
|---|---------|---------|------------|
| D-003 (G1) | Superfície das ações | Ambos os pontos de render — Overview "Active agent sessions" + board do destino Sessions — via o **mesmo componente reusável** de ações | state.md linha 33; spec.md Scope "In", AC-001..004, AC-010 |
| D-004 (G2) | Apresentação do log | Painel/drawer **inline** que expande no próprio card; 6–10 linhas fake **determinísticas** do mock-catalog (timestamp + texto), sem streaming | state.md linha 34; spec.md AC-007..009, AC-018 |
| D-005 (G3) | Matriz status→ações + estado | Running: pausar+log · Paused: retomar+log · Ready/Complete: só log. Novo status **Paused** (tone âmbar/attention no StatusChip, par auditado no plan). Estado vivo no `ExperienceState` via ação do reducer; `mockCatalog` permanece seed congelado, nunca mutado | state.md linha 35; spec.md Scope "In", AC-001..006, AC-019 |
| D-006 (G4) | Apresentação dos controles | Icon buttons **sempre visíveis** (máx. 2 por card: toggle Pause/Play + log), ícones Phosphor, `aria-label` obrigatório; sem hover-reveal, sem overflow/kebab menu | state.md linha 36; spec.md Scope "In", AC-004 |

---

## Decisões do Gate pós-spec (HITL, 2026-07-10) — VINCULANTES

| # | Decisão | Escolha | Referência |
|---|---------|---------|------------|
| D-007a | KPI "Active agents" e estado vivo | **CONFIRMADO pelo usuário**: o tile acompanha o estado vivo das sessões — pausar a única sessão Running decrementa a contagem. A sparkline histórica do KPI permanece estática (não recalcula série a cada transição) | spec.md AC-011, "Open questions" item (a); handoff-001.md Descobertas #1 |
| D-007b | Independência dos painéis de log | Aprovado junto com a spec: cada painel de log é independente por card (abrir um não fecha/altera outro), conteúdo estático enquanto aberto | spec.md AC-018, "Open questions" item (b) |
| D-007c | Estado do painel de log é local de UI | Aprovado junto com a spec: o disclosure aberto/fechado do painel de log **não** é estado de domínio compartilhado — não precisa persistir ao navegar entre destinos/pontos de render; só o status da sessão (Running/Paused) é estado vivo compartilhado | spec.md AC-018, "Open questions" item (c); handoff-001.md "Contexto que a próxima fase PRECISA" |

Spec aprovada **sem mudanças** (20 ACs) — D-007a/b/c são derivações diretas das decisões G1–G4,
destacadas e confirmadas no gate de aprovação, não decisões novas de design.

---

## Decisões do Plan (HITL, 2026-07-10) — VINCULANTES

Gate HITL do plan concluído em 2026-07-10: D-008/D-009/D-010/D-012 aprovados como
recomendados; **D-011 com OVERRIDE do usuário na localização do componente** (ui/ com props
resolvidas, não shell/). Cada decisão está registrada como ADR local (`adr/000N-*.md`,
status accepted; ADR-0004 amended para refletir o override):

| # | Decisão | Escolha | ADR / Referência |
|---|---------|---------|------------|
| D-008 | Shape do estado vivo de sessão | `pausedSessionIds: readonly string[]` (set esparso) + ação `toggleSessionPaused` seed-agnóstica + merge único `selectSessionViews` consumido pelas 3 superfícies; `buildKpiViewModels(sessions)` parametrizada | adr/0001; fecha R1 |
| D-009 | Diferenciação Ready×Paused | Paused reusa tone `warning` + ícone Phosphor `Pause` (Ready mantém `Clock`); sem 5º tone; AC-017 satisfeito por re-medição do par por script (8.48/10.49:1 nh; 6.73–10.02:1 legados) | adr/0002; fecha R2; memory/contrast-audit.md A1–A4 |
| D-010 | Estados dos icon buttons | Reuso da primitive `IconButton` (0 mudanças), variant `quiet`; SEM `:hover` novo (nenhum par de cor novo); pressed/focus globais reusados e medidos (5.98–17.74:1); disabled não embarca | adr/0003; fecha R3/R5; contrast-audit B1/C1/E1 |
| D-011 | Componente e painel de log | **OVERRIDE do usuário**: `SessionCard` único em **`ui/`** com props TOTALMENTE resolvidas (zero imports de `app/`; tipos próprios estruturalmente compatíveis); TODO o mapping de domínio (matriz status→ações, tone, aria-labels, logLines) centralizado em `selectSessionViews` — call sites idênticos, sem mapping duplicado; CSS do card em `ui/primitives.module.css`, só `.sessionList` em shell; disclosure local `useId` + `aria-expanded`/`aria-controls`; painel `--canvas` (texto 12.62–17.64:1, timestamp 6.86–9.68:1); animação fade/rise gated pelo prop `reduceMotion` ← `useEffectiveReducedMotion()` (hook novo, sistema OU setting) | adr/0004 (amended 2026-07-10); contrast-audit F1/F2 |
| D-012 | Copy exata | `Pause session {agent}: {task}` / `Resume session {agent}: {task}` / `Session log for {agent}: {task}`; timestamp `HH:MM:SS` 24h fixo; 24 linhas de log determinísticas (8/7/9 por sessão) em `mockCatalog.sessionLogs` | plan.md §Data & contracts |

Evidência empírica registrada pelo plan (não é decisão, é fato verificado): suite completa
verde (185/185) SEM stub de matchMedia — a nota da constitution sobre MediaQueryList/Recharts
está superada; o consumidor real é `useReducedMotionPreference` (motion-dom exige
`addEventListener` no retorno de matchMedia apenas em stubs `matches: true`). Ver plan.md
§Test strategy e Risks R4.

---

## Decisões Aguardando Confirmação

Nenhuma — plan aprovado (gate HITL 2026-07-10), trade-offs #1–#6 resolvidos no corpo do
plan.md ("Proposta para aprovação — RESOLVIDA").

---

## Rastreabilidade

- **Aprovação spec**: spec.md status header (HITL 2026-07-10, sem alterações solicitadas, 20 ACs).
- **Origem das decisões**: triage G0a/G0b (state.md linhas 15–16); grill HITL G1–G4 (state.md
  linhas 31–37); gate pós-spec (a)/(b)/(c) confirmados junto com a aprovação da spec.
- **Boundary de verificação**: constitution.md `test_expectations` + `boundaries.always`
  (auditoria numérica de contraste WCAG 2.1 exata, por script, obrigatória para qualquer par de
  cor novo/alterado — chip Paused, estados dos icon buttons, texto do log — antes do merge, nunca
  substituída pelo verify gate).
- **Brain recall herdado**: learnings `contrast-math-by-script`, `css-module-class-asserts`,
  `recharts-jsdom-testing-gotchas` (reframeado em handoff-001.md Descobertas #5 —
  gatilho real é `useReducedMotionPreference`, não o Recharts em si),
  `parallel-tasks-symbol-coupling`, `astryx-iconbutton` (primitive `IconButton` já existe, ver
  handoff-001.md Descobertas #3), `design-system-context-menu-auto-close` (não se aplica a esta
  run — G4 fechou por botões diretos, sem menu nenhum; ver handoff-001.md "Precedentes de processo
  a repetir").

- **Aprovação plan**: plan.md status header (`approved`, gate HITL 2026-07-10 — #1/#2/#3/#5/#6
  como recomendados; #4 override do usuário → ui/ com props resolvidas); ADRs 0001–0004
  accepted (0004 amended com o override); D-008..D-012 promovidos acima.

**Próxima atualização**: sdd-tasks decompõe o plan aprovado (preview T1→T2→T3 em plan.md
§Task decomposition, com acoplamentos declarados); registrar aqui qualquer decisão nova que
surgir na decomposição ou na implementação.
