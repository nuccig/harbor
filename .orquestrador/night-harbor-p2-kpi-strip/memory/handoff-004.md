# Handoff: implement → review

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: sdd-implement (3 tasks: 001, 002, 003)
**Para**: sdd-review (5 dimensões em paralelo)
**Controlador**: handoff-agent

---

## Sumário Executivo

**3 commits, 18/18 ACs cobertos por implementação, verify gate final verde. Nenhum risco aberto.**

| Commit | Task | Arquivos | ACs cobertos |
|---|---|---|---|
| `5eb61e2` | 001 — KPI data model | `mock-catalog.ts` (+15), `selectors.ts` (+51), `tests/renderer/model/selectors.test.ts` (+82, novo) | 001(dados), 005, 007, 008, 010, 011, 012, 017 |
| `57e19ca` | 002 — MetricTile component | `package.json` (+1), `package-lock.json` (+376/-1), `ui/MetricTile.tsx` (novo, 28 linhas), `ui/index.ts` (+1), `ui/primitives.module.css` (+34), `tests/renderer/ui/metric-tile.test.tsx` (novo, 132 linhas) | 003, 004, 005, 006, 009, 013, 014, 015, 016 |
| `3449497` | 003 — Shell integration | `Shell.tsx` (+32/-23), `shell.module.css` (+21/-11), `tests/renderer/shell-settings/shell-settings.test.tsx` (+55) | 001(DOM), 002, 014, 018 |

**Verify gate re-executado de forma independente nesta fase (handoff-agent, não é reprodução do report do controller)**:
- `npm run lint` → 0 issues
- `npm run typecheck` → 0 errors
- `npm run test` → **181/181 passed** (15 test files), incluindo `metric-tile.test.tsx` 10/10 e `selectors.test.ts` 20/20 e `shell-settings.test.tsx` 20/20 isolados
- `git status --short` → limpo (working tree corresponde exatamente aos 3 commits)
- `git diff feat/night-harbor-p2-statuschip-nav..HEAD -- src/renderer/src/concepts/` → **0 linhas** (zero edição confirmada, AC-014)
- `git diff feat/night-harbor-p2-statuschip-nav..HEAD -- tests/renderer/setup.ts` → **0 linhas** (zero edição confirmada, R1)
- `git diff feat/night-harbor-p2-statuschip-nav..HEAD -- package.json` → exatamente 1 linha adicionada (`"recharts": "^3.9.2"`), nenhuma outra entrada tocada

Todos os 6 checks acima batem com o que `report_anterior` do dispatch já afirmava — nada de novo encontrado nesta verificação independente, ela serve como segunda confirmação para o review não precisar re-derivar.

---

## Contexto que o review PRECISA (mapeado às 5 dimensões do formato sdd-review)

### 1. Requirements & DoD (AC-001 a AC-018)

18 ACs em `spec.md`. Mapeamento de evidência por grupo:

- **AC-001, 002, 018** (estrutura/ordem/não-regressão) → `tests/renderer/shell-settings/shell-settings.test.tsx` (heading "Key metrics" substitui "Recent usage"; ordem dos 4 tiles; outros 4 grupos intocados) + `Shell.tsx` linhas do slot `utility`.
- **AC-003, 004** (rótulo acessível + papel tipográfico `--type-metric`) → `MetricTile.tsx` (`metricLabel` texto real antes do numeral; `metricValue` + classe `.data` utilitária).
- **AC-005, 007, 008** (série fixa determinística; derivação vs. dado novo) → `mock-catalog.ts` bloco `kpis` (4 séries de 10 pontos, `freezeArray`) + `selectors.ts` `buildKpiViewModels()` (fórmulas: `active-agents` = sessions `Running`, `queue` = `issueQueue.length`, `agent-time` = lookup por label em `recentUsage`, `success-rate` = `mockCatalog.kpis.successRate` novo).
- **AC-006, 015, 016** (sparkline decorativa, estática, reduced-motion idêntico) → wrapper `aria-hidden="true"` + `accessibilityLayer={false}` + `isAnimationActive={false}` em `MetricTile.tsx`; nenhuma prop de motion condicional (correto — é estática por construção, não por lógica).
- **AC-009** (auditoria de contraste) → **já fechado na fase plan**, não é verificação nova do review (ver seção 4 abaixo).
- **AC-010, 011, 012** (loading/empty/error) → mecânica compartilhada `selectScenarioSlice`/`ScenarioPresenter`, copy nova em `overviewCopy.kpis` (`selectors.ts`).
- **AC-013, 014** (concepts) → ver seção 4 abaixo.
- **AC-017** (recentUsage preservado) → `mock-catalog.ts`/`selectors.ts` diff mostra `recentUsage` sem alteração; `selectors.test.ts` não remove nenhum assert existente do slice `usage`.

### 2. Architecture & Conventions — valores fixos a NÃO recalcular (checklist do review)

Estes vieram de auditoria/probe em fases anteriores; o review deve **conferir que o código implementado usa exatamente estes valores literais**, não re-derivá-los:

- `.metricSparkBar { fill: var(--accent, var(--border)); fill-opacity: 0.75; }` — **confirmado nesta fase**: `git show 57e19ca -- src/renderer/src/ui/primitives.module.css` bate literalmente com `memory/contrast-audit.md` (ratios 4.16/3.64/3.80:1 non-text) e ADR-0003. Nenhum desvio.
- `.metricValue { color: var(--ink); }` sobre `.metricTile { background: var(--surface-raised); }` — confirmado, ratios 14.09–16.96:1 (texto, floor 4.5:1).
- Recharts: `width={48} height={16}`, `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`, `accessibilityLayer={false}`, `isAnimationActive={false}`, wrapper `aria-hidden="true"` — todos presentes em `MetricTile.tsx` linha a linha, batendo com plan.md e ADR-0002.
- Import surface Recharts: **exatamente** `{ Bar, BarChart }` (confirmado, `MetricTile.tsx` linha 1) — sem `ResponsiveContainer`, sem `import * as Recharts`.
- Copy: grupo "Key metrics"; tiles "Active agents" / "Issue queue" / "Success rate" / "Agent time", ordem fixa (contrato AC-001).
- `tests/renderer/setup.ts` e `src/renderer/src/concepts/concepts.module.css`: zero edição confirmada por `git diff` nesta fase (ver Sumário Executivo).

### 3. Test Coverage

- Padrão de asserts: substring de classe CSS module (nunca hash exato), contagens derivadas do fixture (nunca literal solto) — herdado da constitution (`test_expectations`) e dos learnings `css-module-class-asserts`.
- `metric-tile.test.tsx`: 10 testes, incluindo contagem de barras filtrada por `tagName === 'path'` (Recharts também aplica a className do `<Bar>` no `<g>` wrapper — ver Descoberta 1 abaixo) e teste de equivalência reduced-motion com IDs voláteis (`recharts<N>-clip`, `:r<N>:`) normalizados antes de comparar `innerHTML`.
- `selectors.test.ts`: 20 testes no arquivo total (novos: slice `kpis` nos 4 cenários + valores recomputados do fixture, zero hardcode).
- `shell-settings.test.tsx`: 20 testes no arquivo total; usa `within(...)` escopado para evitar colisão textual "Issue queue" (heading pré-existente do grupo `slot="queue"` vs. label do tile novo) — **não simplificado** para `getByText` cru, como instruído pela task 003.

### 4. Regression & Hallucination

- 181/181 testes passam (não-regressão dos outros 4 grupos do Overview, AC-018).
- `DataList` (helper JS órfão) removido — confirmado 1 call site antes da troca, 0 depois (achado do analyze, D-011 em `decisions.md`).
- Fragmentos `.dataList` órfãos removidos de `shell.module.css`, preservando `.projectSummary` idêntico — **estruturalmente**: diff de `shell.module.css` mostra `+21/-11`, review deve confirmar visualmente que `.projectSummary` não perdeu nenhuma regra (checklist, não achado — não verificado por esta fase além do diff bruto).
- `recentUsage` no catálogo/view-model: intocado (AC-017), apenas deixou de ser consumido pelo slot `utility`.

### 5. Security

Sem superfície nova relevante: `MetricTile` recebe só props tipadas (`label: string`, `value: string`, `series: readonly number[]`), sem dados de usuário/HTML dinâmico, sem novo IPC/filesystem/rede. Recharts é dependência nova (ver Riscos R5) mas usada só client-side, import mínimo. Nenhum novo vetor de XSS/injection identificado por esta fase — revisor deve confirmar independentemente, não é uma dimensão coberta pelo verify gate.

---

## AC-009 / AC-013 / AC-014 — o que o review confere vs. o que já está fechado

- **AC-009 (auditoria de contraste)** — **já cumprido na fase plan**, por script (`memory/contrast-audit.md`, método WCAG 2.1 exato, linearização sRGB expoente 2.4, nunca aritmética LLM — learning `contrast-math-by-script`). O review **não re-audita numericamente**; a tarefa do review é conferir que o CSS implementado usa **exatamente** os valores já auditados (0.75 fill-opacity, tokens `--accent`/`--border`/`--ink`/`--surface-raised`) — confirmado por esta fase (seção 2 acima), então o review pode tratar isso como checklist rápido, não trabalho de derivação.
- **AC-013 (night-harbor resolve tokens)** / **AC-014 (legados degradam neutro)** — verificação é **estrutural + visual**, não jsdom (CSS custom properties não computam em jsdom):
  - Estrutural: `git diff ... -- src/renderer/src/concepts/` = zero linhas (confirmado nesta fase) — nenhuma edição em `concepts.module.css` ou qualquer arquivo de concept.
  - Leitura de "degradação neutra" (D-007, gate HITL do plan): legados renderizam com o **accent nativo** deles (verde `#0b6b5b` command-deck, roxo `#5a31d6` signal-poster), não cinza — zero código especial por concept. Isso é decisão já aprovada, não um ponto a reabrir no review.
  - Visual: screenshot 1024×700 e 1440×900 sob os 3 concepts (precedente P1/P2) — pendente do review, não feito nesta fase de handoff.

---

## Descobertas da task 002 — candidatas fortes a learnings duráveis (promovidas nesta fase)

Três descobertas empíricas do implement-agent da task 002, formalizadas em `memory/learnings.md` como N12–N14 (ver arquivo — não duplicado aqui além do resumo):

1. **Recharts aplica a `className` do `<Bar>` tanto no `<g>` wrapper quanto em cada `<path>` renderizado** — contagem de barras em teste deve filtrar por `tagName === 'path'`, não contar todos os elementos com a classe.
2. **`JavascriptAnimate` interno do Recharts 3 lê `window.matchMedia('(prefers-reduced-motion)')` e chama `.addEventListener` mesmo com `isAnimationActive={false}`** — um mock simples `{ matches }` de `matchMedia` quebra o mount; o teste precisa de um stub completo de `MediaQueryList` (com `addEventListener`/`removeEventListener`).
3. **IDs voláteis do Recharts (`recharts<N>-clip`, `:r<N>:` do React 18) precisam ser normalizados antes de comparar `innerHTML`** em testes de equivalência (ex.: reduced-motion on/off deveriam renderizar idêntico) — comparação direta de `innerHTML` falha por causa desses IDs gerados, não por diferença real de markup.

Essas três são reaproveitáveis para qualquer componente futuro que use Recharts neste projeto (não específicas do `MetricTile`) — por isso promovidas a learnings, não deixadas só no report do implement.

---

## Riscos transferidos ao review

| # | Risco | Status | Ação do review |
|---|---|---|---|
| R1 | Recharts × jsdom/ResizeObserver | FECHADO | Nenhuma — `setup.ts` intocado, confirmado nesta fase. |
| R3 | Contraste sparkline/numeral | FECHADO por script | Checklist rápido (seção 2 acima), não re-auditar. |
| R4 | Tokens dos legados ausentes | FECHADO | Nenhuma — reconfirmado 3× em fases anteriores + zero diff em concepts nesta fase. |
| R5 | Bundle Recharts (Redux interno, ~7.3MB) | ACEITO/DIVULGADO | Não reabrir — custo já aprovado no G3 (D-008). Confirmar apenas que `package.json` ganhou 1 entrada (feito nesta fase). |
| Novo | Visual screenshot (2×2 grid, 3 concepts, 2 viewports) | **PENDENTE** | Único item de verificação que nenhuma fase anterior cobriu ainda — cabe ao review (plan.md "Verification approach" item 4). |
| Novo | `.projectSummary` preservado após remoção de `.dataList` | **PENDENTE (checklist visual)** | Diff bruto confirma remoção; revisor deve confirmar visualmente/por leitura de CSS que nenhuma regra de `.projectSummary` foi perdida. |

Nenhum risco bloqueante aberto. Os dois itens "PENDENTE" são verificação normal de review, não achados de problema.

---

## Artefatos de referência (não duplicar)

- `spec.md` — 18 ACs EARS (fonte de verdade para a dimensão Requirements & DoD).
- `plan.md` — approach, API do `MetricTile`, CSS exato, "Verification approach" (4 itens, incluindo o screenshot pendente).
- `adr/0001-kpi-derivation-and-data-model.md`, `adr/0002-recharts-sparkline-integration.md`, `adr/0003-metrictile-color-scheme.md` — fundamentam dados, integração Recharts, e esquema de cor respectivamente.
- `memory/contrast-audit.md` — auditoria WCAG final por script (AC-009/013/014), valores literais a conferir no CSS.
- `memory/decisions.md` — D-001 a D-011 (todas aprovadas, nenhuma reaberta).
- `memory/learnings.md` — L-inherited-1..5, N1–N11, e N12–N14 novos desta fase (descobertas Recharts).
- `memory/handoff-003.md` — ponte tasks+analyze→implement completa (riscos herdados, acoplamento de dado 002→001, colisão "Issue queue").
- `git diff feat/night-harbor-p2-statuschip-nav..HEAD -- src/ tests/ package.json` — diff total da feature (base do stack), referência única para o review não precisar montar o range manualmente.

---

## Rastreabilidade

- **Fontes**: `memory/handoff-003.md`, `memory/state.md` (fases 10/12, ambas ✓), `spec.md`, `plan.md`, commits `5eb61e2`/`57e19ca`/`3449497`.
- **Verificações independentes feitas nesta fase** (handoff-agent): lint 0, typecheck 0, test 181/181 (+ isolamento dos 3 arquivos novos/modificados: 10+20+20); `git status` limpo; zero diff em `concepts/` e `setup.ts`; `package.json` com exatamente 1 entrada nova; CSS de `primitives.module.css` conferido linha a linha contra `contrast-audit.md`/ADR-0003 — nenhum desvio encontrado em nenhum desses 6 checks.
- **Decisões/learnings atualizados**: `memory/learnings.md` ganhou N12–N14 (as 3 descobertas Recharts da task 002, promovidas a learnings reaproveitáveis). `memory/decisions.md` não recebeu entrada nova — nenhuma decisão nova de arquitetura/design surgiu nesta fase de handoff (só confirmação de decisões já aprovadas). `state.md` não tocado (fora do escopo do handoff-agent).
- **Próxima fase**: `sdd-review` roda as 5 dimensões em paralelo (formato `sdd-review`, issue files em `reviews-001/`), usando este handoff para não re-derivar o que já está fechado (AC-009, tokens, contagens de teste) e focar em: screenshot visual pendente, achados novos de correctness/regressão/segurança, e a checklist estrutural de `.projectSummary`.
