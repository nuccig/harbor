# Handoff: tasks+analyze → implement

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: tasks (sdd-tasks) + analyze (consolidado pelo controller)
**Para**: implement (sdd-implement)
**Controlador**: handoff-agent

---

## Sumário Executivo

**3 tasks, scopes disjuntos confirmados. Execução: 001 ∥ 002 (paralelo) → 003 (serial).**

| Task | Objetivo | Arquivos primários (scope) | depends_on | Cobre (ACs) |
|------|----------|------------------------------|------------|-------------|
| 001 — KPI data model | `mockCatalog.kpis` fixture (`freezeArray`, 4 séries de 10 pontos, `successRate: 92`) + `buildKpiViewModels()`/`KpiViewModel`/slice `kpis` em `selectors.ts` | `mock-catalog.ts`, `selectors.ts`, `tests/renderer/model/selectors.test.ts` | — | AC-001(dados), 005, 007, 008, 010, 011, 012, 017 |
| 002 — MetricTile component | `npm install recharts@^3.9.2` + `ui/MetricTile.tsx` (Bar/BarChart) + bloco `.metricTile*` em `primitives.module.css` + export + testes | `package.json`, `package-lock.json`, `ui/MetricTile.tsx`, `ui/index.ts`, `ui/primitives.module.css`, `tests/renderer/ui/metric-tile.test.tsx` | — | AC-003, 004, 005, 006, 009, 013, 014, 015, 016 |
| 003 — Shell integration | Slot `utility` troca `DataList`/`recentUsage` por `<ul className={styles.kpiStrip}>` de 4 `MetricTile`; remove `DataList` (helper JS órfão) + seletores `.dataList` órfãos do CSS | `Shell.tsx`, `shell.module.css`, `tests/renderer/shell-settings/shell-settings.test.tsx` | **[001, 002]** | AC-001(DOM), 002, 014, 018 |

**Execução obrigatória**:
1. Despachar **001 e 002 em paralelo** (mesma working tree, scopes de arquivo disjuntos — confirmado pelo controller tanto na fase tasks quanto na fase analyze). Nenhuma das duas depende da outra no nível de arquivo.
2. **Verify gate conjunto** (`npm run lint && npm run typecheck && npm run test`) roda **uma vez**, depois que **ambas** 001 e 002 tiverem terminado — não rodar o gate isolado por task aqui, porque `tests/renderer/ui/metric-tile.test.tsx` (002) só type-checka/passa com `mockCatalog.kpis` (001) presente na árvore (acoplamento de dado, não de arquivo — documentado nas duas tasks, seção "Context"/"Known cross-task data coupling").
3. Só então despachar **003** (que também depende compilando de `overview.kpis` de 001 e do export `MetricTile` de 002).
4. **Verify gate final** roda de novo depois de 003 — é o primeiro ponto em que as 3 tasks coexistem e o gate é "meaningfully green end-to-end" (linguagem da própria task 003).

---

## Contexto que o implement PRECISA (não redigido nas tasks, mas amarrado ao dispatch)

### Quem roda o `npm install` e por quê

Task 002 é a **única** dona de `package.json`/`package-lock.json` nesta feature. `recharts@^3.9.2`
é dependência nova pré-aprovada (HITL gate G3, decisions.md D-003) — o implement-agent da task 002
**não** precisa (re-)pedir aprovação, mas deve deixar a adição visível/rastreável (mencionar
explicitamente no que reportar de volta ao controller, para constar depois no commit/PR).
Implement-agents em geral **não rodam git** nesta pipeline — quem commita é a fase de review/merge
seguinte, não o implement-agent.

Depois do `npm install`, confirmar que `dependencies` ganhou exatamente **uma** entrada nova
(`"recharts": "^3.9.2"`) e que nenhuma outra versão de dependência existente mudou como efeito
colateral — se `npm install` tocar entradas não relacionadas do lockfile, isso é motivo de
verificação extra, não para aceitar silenciosamente (task 002, Step 1, já traz essa instrução —
reforçando aqui porque é a única mutação de `package.json`/lock permitida em toda a feature).

### Valores fixos que NÃO podem ser recalculados pelo implement (só copiados literalmente)

Vindos do gate de contraste (`memory/contrast-audit.md`, ADR-0003) e dos ADRs 0001/0002 — já
embutidos nas 3 tasks, repetidos aqui só como checklist de "não reabrir":

- `.metricSparkBar { fill: var(--accent, var(--border)); fill-opacity: 0.75; }` — 0.75 vem do
  script de contraste, não é analogia com o 85% do StatusChip (objetivos de transparência
  diferentes: tint de fundo vs. marca gráfica em primeiro plano).
- Numeral `var(--ink)` sobre `.metricTile { background: var(--surface-raised); }`.
- Recharts: `width={48} height={16}`, `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`,
  `accessibilityLayer={false}`, `isAnimationActive={false}`, wrapper `aria-hidden="true"` — cada
  um proven empiricamente (ver task 002 §Context), não estilo.
- Import surface Recharts: **exatamente** `{ Bar, BarChart }` — sem `ResponsiveContainer`, sem
  `import * as Recharts`.
- Copy: grupo "Key metrics"; tiles "Active agents" / "Issue queue" / "Success rate" / "Agent
  time" — ordem fixa nessa sequência (contrato AC-001).
- Séries de 10 pontos hand-authored do ADR-0001 (copiar literal, nunca `Math.random`/gerar de
  novo) — task 001 Step 2 traz os 4 arrays exatos.
- `tests/renderer/setup.ts`: **zero edição** em toda a feature (provado: jsdom renderiza o
  `<BarChart>` de dimensão fixa sem mock de `ResizeObserver`).
- `src/renderer/src/concepts/concepts.module.css`: **zero edição** em toda a feature (AC-014,
  decisão D-007 — legados degradam via accent nativo deles, não via token novo).

### Acoplamento 002→001 (dado, não arquivo) — como o implement deve tratar

`MetricTile.tsx` (002) não importa nada de `selectors.ts`/`mock-catalog.ts` — pode ser
implementado e exercitado isoladamente. Mas `tests/renderer/ui/metric-tile.test.tsx` (também
002) importa `mockCatalog` diretamente só para ler `mockCatalog.kpis.series` (tamanhos de série
reais, nunca literal `10`) — esse campo só existe depois que 001 landar. Por isso o verify gate
de 002 não deve ser declarado PASS isoladamente antes de 001 também estar na árvore; ver "Sumário
Executivo" item 2 acima.

### Colisão de texto "Issue queue" (gotcha concreto, não hipotético)

O heading `<h2>Issue queue</h2>` do grupo pré-existente (`slot="queue"`, intocado por esta
feature) e o label do tile novo "Issue queue" (um dos 4 `MetricTile`) são o mesmo texto. Task 003
já instrui usar `within(...)` escopado por seção/role em vez de `getByText` cru — implement deve
seguir isso à risca nos novos testes de `shell-settings.test.tsx`, não simplificar para uma query
mais direta que reintroduza a ambiguidade.

### `DataList` — remoção segura confirmada (achado do analyze, já aplicado à task 003)

Antes da troca do slot `utility`, `DataList` (helper definido perto do topo de `Shell.tsx`,
~linha 83) tem exatamente **1** call site — o mesmo `renderReady` que a task 003 substitui. Depois
da troca, zero call sites: remover é limpeza de dead code, não risco (nenhum dos outros 4 grupos
usa `DataList`). Task 003 também instrui remover os fragmentos de seletor `.dataList` (combinados
via vírgula com `.projectSummary` em ~4 blocos de `shell.module.css`, linhas ~120–146),
preservando a estilização de `.projectSummary` idêntica — achado #2 do analyze, já incorporado ao
texto da task 003 (não é uma decisão nova a tomar no implement, só executar como escrito).

### Verify gate e boundaries (constitution.md)

- `npm run lint && npm run typecheck && npm run test` — cobre AC-001..008, 010..012, 015..018.
  **Cego a contraste**: AC-009 e AC-013/014 (cor) já estão fechados por script
  (`memory/contrast-audit.md`) — não reabrir via tentativa de asserção de cor em jsdom.
- Boundary `always` (auditoria de contraste para par de cor novo/alterado): já cumprido nesta
  feature. Só reabre se algum hex/opacity mudar durante o implement — se isso acontecer, rodar o
  script de contraste de novo antes de reportar PASS, não estimar.
- Boundary `ask_first` (dependência nova): já satisfeito via HITL G3 — a task 002 só precisa
  manter a adição rastreável, não re-pedir aprovação.
- `openwiki_gate` da constitution é condicional a `openwiki/` existir no repo root — fora do
  escopo desta feature, não verificado, não precisa de ação.

---

## Riscos transferidos ao implement

| # | Risco | Status | Ação |
|---|-------|--------|------|
| R1 | Recharts × jsdom/ResizeObserver | FECHADO | Nenhuma — dimensão fixa já provada. Se um upgrade futuro do Recharts mudar o default de `accessibilityLayer`, o teste AC-006 (svg sem tabindex) pega automaticamente. |
| R2 | Fórmula "agentes ativos" | FECHADO (Running) | Nenhuma — reconfirmado 2× (plan gate + handoff plan→tasks) contra `mock-catalog.ts` real. |
| R3 | Contraste sparkline/numeral | FECHADO por script | Copiar valores exatos (0.75 opacity, tokens listados acima) literalmente. Só reauditar se hex/opacity mudarem. |
| R4 | Tokens dos legados ausentes | FECHADO | Reconfirmado 3× (plan gate, handoff plan→tasks, tasks-agent) — os 5 tokens existem nos 3 concepts. |
| R5 | Bundle Recharts (Redux interno, ~7.3MB) | ACEITO/DIVULGADO | Não reabrir no review — custo já aprovado no G3 (D-008). |
| Novo | Ownership `package.json`+`package-lock.json` | FECHADO (tasks-agent) | Task 002 é dona única — resolve o item "ABERTO" que handoff-002.md havia deixado pendente. |
| Novo | `DataList`/`.dataList` órfãos pós-troca do slot | FECHADO (analyze) | Já incorporado ao texto da task 003 — remover ambos, preservando `.projectSummary`. |
| Novo | Colisão textual "Issue queue" nos testes | FECHADO (analyze) | Task 003 já instrui `within(...)` escopado — seguir à risca, não simplificar. |

Nenhum risco aberto restante rumo ao implement.

---

## Artefatos de referência (não duplicar)

- `tasks/001-kpi-data-model.md` — código exato do fixture (Steps 1–2), do `buildKpiViewModels`
  (Step 3), do bloco `overviewCopy.kpis` (Step 4) e dos testes (Step 6).
- `tasks/002-metrictile-component.md` — comando de install (Step 1), código exato de
  `MetricTile.tsx` (Step 2), CSS exato (Step 3), export (Step 4), testes (Step 5).
- `tasks/003-shell-kpi-strip-integration.md` — JSX exato do `ScenarioGroup` novo (Step 2),
  remoção de `DataList`/`.dataList` (Step 3), CSS `.kpiStrip` (Step 4), testes (Step 5).
- `memory/handoff-002.md` — ponte plan→tasks completa (fórmulas, ADRs, tokens, riscos herdados).
- ADR-0001/0002/0003 (`adr/`) — fundamentam, respectivamente, o modelo de dados, a integração
  Recharts, e o esquema de cor.
- `memory/contrast-audit.md` — auditoria WCAG final (script), referência para AC-009/013/014.

---

## Rastreabilidade

- **Fontes**: `tasks/001-003.md` (status: pending, sdd-tasks 2026-07-10), analyze report
  (consolidado no dispatch do controller: 18/18 ACs cobertos, zero contradições bloqueantes, 3
  gaps menores já corrigidos nos artefatos), `memory/handoff-002.md`, `memory/state.md` (fase 7/8).
- **Verificações independentes feitas nesta fase** (handoff-agent): árvore de trabalho limpa
  (`git status` clean); `vitest@^2.1.8` confirmado em `package.json` raiz (nota: ADR-0002 cita
  `vitest@2.1.9` como versão do probe pontual do plan-agent — discrepância de patch-version em
  texto de documentação de probe, não afeta o gate real, que usa a versão instalada via lockfile;
  não é uma ação necessária, só uma nota de rastreabilidade).
- **Próxima fase**: `sdd-implement` executa 001 ∥ 002 → verify gate conjunto → 003 → verify gate
  final → `sdd-review`.
