---
title: KPI strip no Overview (Night Harbor P2.3) — technical plan
status: approved     # gate HITL 2026-07-10: trade-off AC-014 resolvido = A (accent nativo do concept); copy "Key metrics" mantida
spec: ../spec.md
created: 2026-07-10
---

# Plan — KPI strip no Overview (Night Harbor P2.3)

## Approach

A KPI strip é um novo render do slot `utility` do Overview: o `ScenarioGroup` que hoje mostra
"Recent usage" passa a consumir um novo slice `overview.kpis` e a renderizar 4 `MetricTile`s
(componente novo em `ui/`, espelhando o padrão do `StatusChip`: TSX fino + CSS module com
tokens via `var()` e fallback). Cada tile = rótulo acessível + numeral no papel `--type-metric`
(MONO tabular, via utilitária `.data` já existente em `primitives.module.css`) + sparkline-maré
estática de 10 barras via Recharts (`BarChart`/`Bar`, dimensão fixa 48×16, `aria-hidden`,
`isAnimationActive={false}`, `accessibilityLayer={false}`).

Os dados vêm de um novo bloco `mockCatalog.kpis` (série determinística por métrica +
`successRate` novo) combinado com derivações das fontes existentes (`sessions` filtrado por
`Running`, `issueQueue.length`, lookup do "Agent time" em `recentUsage`) — a derivação vive em
`selectors.ts` (`buildKpiViewModels`), nunca no Shell, e o slice de cenário reusa
`selectScenarioSlice` (loading/empty/error idênticos em mecânica aos demais painéis). O slice
`recentUsage` permanece intacto no catálogo e no view-model (AC-017); só o render do slot muda.

Forma e cor da sparkline seguem a skill `dataviz` onde não conflita com os tokens Night Harbor
(que vencem, por dispatch): a "forma" correta para um KPI é stat tile com micro-viz decorativa
(dataviz: "sometimes the answer is not a chart — a stat tile"), série única sem legenda, sem
eixos/grid/tooltip, marcas finas; a cor é 1 hue (accent) com opacidade — validada por script
WCAG exato (não pelo validador da skill dataviz, que audita paletas categóricas; aqui há 1 cor
e o requisito é o de AC-009, non-text 3:1 contra fundo efetivo composto). Interatividade
(hover/tooltip, regra default da dataviz) é deliberadamente omitida — a spec exclui qualquer
interatividade (Out + AC-016), e a exceção da própria skill ("the only form that skips it is a
bare stat tile") é exatamente este caso.

Spec (o "porquê"): [spec.md](../spec.md) — 18 ACs EARS.

## Components & changes

| Component | Change | Notes |
| --- | --- | --- |
| `package.json` | modify | + `"recharts": "^3.9.2"` em `dependencies` (ADR-0002; aprovação HITL G3 registrada — boundary `ask_first` cumprido no grill) |
| `src/renderer/src/ui/MetricTile.tsx` | create | Componente novo: props tipadas, numeral + label + sparkline; espelho organizacional do `StatusChip.tsx` |
| `src/renderer/src/ui/primitives.module.css` | modify | + bloco `.metricTile`/`.metricLabel`/`.metricValue`/`.metricSpark`/`.metricSparkBar` (tokens via `var()`, ADR-0003) |
| `src/renderer/src/ui/index.ts` | modify | + `export * from './MetricTile'` |
| `src/renderer/src/app/mock-catalog.ts` | modify | + helper `freezeArray` + bloco `kpis` (`successRate` + `series` 10 pontos/métrica); `recentUsage` INTOCADO (AC-017) |
| `src/renderer/src/app/selectors.ts` | modify | + `KpiViewModel`/`buildKpiViewModels()` (fórmulas ADR-0001), + `overviewCopy.kpis`, + campo `kpis: ScenarioSlice<readonly KpiViewModel[]>` no `OverviewViewModel` |
| `src/renderer/src/shell/Shell.tsx` | modify | Slot `utility` (linhas 244–250): `slice={overview.kpis}`, `title="Key metrics"`, `renderReady` → `<ul>` de `MetricTile`; `DataList` e demais 4 grupos INTOCADOS (AC-018) |
| `src/renderer/src/shell/shell.module.css` | modify | + `.kpiStrip` (layout do strip DENTRO do slot: grid 4→2→1 colunas por container width) |
| `tests/renderer/ui/metric-tile.test.tsx` | create | Testes unit do componente (padrão `status-chip.test.tsx`) |
| `tests/renderer/model/selectors.test.ts` | modify | + asserts do slice `kpis` (valores derivados recomputados do fixture) |
| `tests/renderer/shell-settings/shell-settings.test.tsx` | modify | Heading "Recent usage" → "Key metrics"; + asserts de contagem/ordem de tiles derivadas do fixture |
| `src/renderer/src/concepts/concepts.module.css` | **zero edição** | AC-014/G4 — degradação puramente via tokens que os 3 concepts já definem |
| `tests/renderer/setup.ts` | **zero edição** | Provado empiricamente: Recharts com dimensão fixa não precisa de ResizeObserver em jsdom (ADR-0002) |

### MetricTile — API (fecha ponto 4 do dispatch)

```tsx
export interface MetricTileProps {
  /** Rótulo textual acessível da métrica (AC-003), ex.: "Active agents" */
  label: string
  /** Valor já formatado para exibição, ex.: "1", "92%", "3h 42m" (AC-004) */
  value: string
  /** Série determinística 8–12 pontos vinda do fixture (AC-005) */
  series: readonly number[]
}

export function MetricTile({ label, value, series }: MetricTileProps)
```

DOM (decisões de acessibilidade embutidas):

```tsx
<div className={styles.metricTile}>
  <span className={styles.metricLabel}>{label}</span>
  <span className={`${styles.metricValue} ${styles.data}`}>{value}</span>
  <div aria-hidden="true" className={styles.metricSpark}>
    <BarChart width={48} height={16} data={series.map((v, i) => ({ i, v }))}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
      <Bar className={styles.metricSparkBar} dataKey="v" isAnimationActive={false} />
    </BarChart>
  </div>
</div>
```

- Rótulo é texto real visível ANTES do numeral no DOM (leitor de tela lê "Active agents, 1" —
  significado não depende de posição/cor, AC-003). Sem `<h3>`: tile não é landmark/section.
- Numeral usa `--type-metric` + utilitária `.data` (`'MONO' 1` + `tabular-nums`) — AC-004;
  primeira consumidora real da classe `.data` criada no P1.
- Wrapper `aria-hidden="true"` na sparkline + `accessibilityLayer={false}` (remove
  `role="application"`/`tabindex="0"` que o Recharts 3 injeta por default — provado no probe;
  sem isso a sparkline "decorativa" seria um tab-stop navegável, violando AC-006).
- Sem ícone: diferente do StatusChip, o tile não comunica estado semântico — não há mapping
  tone→ícone a defaultar.
- `MetricTile` NÃO conhece `mockCatalog` nem Recharts config além do render — dados chegam
  prontos por props (testável isolado, padrão StatusChip).

### CSS novo (primitives.module.css — estrutura, fecha ponto 4/6 do dispatch)

```css
.metricTile {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
}
.metricLabel {
  color: var(--ink-muted);
  font-size: var(--type-small);
  font-weight: var(--weight-label);
}
.metricValue {
  color: var(--ink);
  font-size: var(--type-metric);
  font-weight: var(--weight-heading);
  line-height: 1.1;
}
.metricSpark {
  pointer-events: none; /* inerte por construção — AC-016 */
}
.metricSparkBar {
  fill: var(--accent, var(--border));
  fill-opacity: 0.75; /* auditado: 4.16 / 3.64 / 3.80 :1 — memory/contrast-audit.md */
}
```

Cadeia de fallback (ponto 6): os 4 tokens consumidos (`--surface-raised`, `--border`, `--ink`,
`--ink-muted`, `--accent`) **existem nos 3 concepts** (confirmado em `concepts.module.css`) —
diferente do StatusChip, cujos tokens de tone eram night-harbor-only. A cadeia
`var(--accent, var(--border))` é defensiva (concept futuro), não ativa hoje. Consequência: nos
legados o tile renderiza com o accent DELES (verde command-deck / roxo signal-poster), não
cinza — leitura de "degradação neutra" = "nenhum código especial por concept, aparência nativa
do concept" (ADR-0003; alternativa gray-only levantada no gate, ver Proposta).

`.kpiStrip` em `shell.module.css` (layout do strip dentro do slot utility):

```css
.kpiStrip {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}
```

2×2 por default (o slot utility tem span 4/12 no night-harbor e span 5/12 no command-deck —
4 tiles lado a lado não cabem com numeral `--type-metric`); em signal-poster o utility é
full-width (span 12) e o mesmo 2×2 segue legível. Markup como `<ul>`/`<li>` (lista de 4 itens
nomeados — contagem exposta a AT de graça). Média query existente de 70rem não precisa de caso
novo: 2×2 funciona em 1024×700 (baseline) e 1440×900 (expansão).

## Data & contracts

### mock-catalog.ts — bloco novo (ADR-0001)

```ts
function freezeArray<T>(items: T[]): readonly T[] {
  return Object.freeze([...items])
}

// dentro de mockCatalog:
kpis: Object.freeze({
  successRate: 92,
  series: Object.freeze({
    'active-agents': freezeArray([1, 2, 2, 1, 2, 3, 2, 1, 2, 1]),
    queue: freezeArray([2, 3, 4, 3, 2, 3, 4, 3, 2, 3]),
    'success-rate': freezeArray([88, 90, 89, 91, 93, 90, 94, 92, 95, 92]),
    'agent-time': freezeArray([2.6, 2.8, 3.0, 3.1, 2.9, 3.3, 3.5, 3.4, 3.6, 3.42])
  })
})
```

10 pontos por série (dentro do 8–12 de G3), literais fixos (AC-005: nunca aleatório). Séries
com amplitude visível na hierarquia "maré" (barras min/max distinguíveis a 16px).

### selectors.ts — derivação + slice (ADR-0001; fecha pontos 1 e 4 do dispatch)

```ts
export interface KpiViewModel {
  id: 'active-agents' | 'queue' | 'success-rate' | 'agent-time'
  label: string
  value: string
  series: readonly number[]
}

function buildKpiViewModels(): readonly KpiViewModel[] {
  const activeAgents = mockCatalog.sessions.filter((s) => s.status === 'Running').length
  const queued = mockCatalog.issueQueue.length
  const agentTime =
    mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value ?? '—'
  return [
    { id: 'active-agents', label: 'Active agents', value: String(activeAgents),
      series: mockCatalog.kpis.series['active-agents'] },
    { id: 'queue', label: 'Issue queue', value: String(queued),
      series: mockCatalog.kpis.series.queue },
    { id: 'success-rate', label: 'Success rate', value: `${mockCatalog.kpis.successRate}%`,
      series: mockCatalog.kpis.series['success-rate'] },
    { id: 'agent-time', label: 'Agent time', value: agentTime,
      series: mockCatalog.kpis.series['agent-time'] }
  ]
}
```

- **Fórmula "agentes ativos" (ponto 1, R2 FECHADO)**: `status === 'Running'` — consistente com
  o mapping semântico existente (`mapSessionStatusToTone`: Running→success). Fixture atual → 1.
- Ordem do array = ordem semântica fixa de G1/AC-001; testes leem a ordem deste contrato.
- `agent-time` por **lookup de label**, não índice — reordenar `recentUsage` não quebra.
- Copy do slice (delegada pela spec ao plan, seguindo padrão `overviewCopy`):

```ts
kpis: {
  loadingLabel: 'Loading key metrics…',
  emptyTitle: 'No metrics yet',
  emptyGuidance: 'Metrics appear after simulated agent sessions run.',
  errorTitle: 'Key metrics could not be loaded',
  errorCause: 'The simulated metrics source is unavailable.'
}
```

(Sem `emptyAction`, como o slice `usage` que substitui; error ganha o recovery compartilhado
`recover-scenario` automaticamente via `selectScenarioSlice` — AC-010/011/012 por construção.)

- `OverviewViewModel` ganha `kpis: ScenarioSlice<readonly KpiViewModel[]>`, construído com
  `selectScenarioSlice(state, buildKpiViewModels(), overviewCopy.kpis)`. `recentUsage`
  permanece no view-model (AC-017).

### Shell.tsx — integração (slot utility)

```tsx
<ScenarioGroup
  onAction={handleAction}
  renderReady={(kpis) => (
    <ul className={styles.kpiStrip}>
      {kpis.map((kpi) => (
        <li key={kpi.id}>
          <MetricTile label={kpi.label} value={kpi.value} series={kpi.series} />
        </li>
      ))}
    </ul>
  )}
  slice={overview.kpis}
  slot="utility"
  title="Key metrics"
/>
```

Único bloco tocado no Overview (AC-002/AC-018); `slot="utility"` preservado → grids por
concept em `concepts.module.css` continuam aplicando sem edição.

### Recharts (ADR-0002; fecha ponto 2 do dispatch — tudo provado em probe isolado com as versões exatas do repo)

- **Versão**: `recharts@^3.9.2` (latest 3.x confirmado via `npm view`); peer deps
  `react`/`react-dom` `^16.8||^17||^18||^19` — satisfeitas por `18.3.1`; peer `react-is`
  satisfeita transitivamente (17.0.2 já na árvore).
- **Imports**: só `{ Bar, BarChart }`. Sem eixos/grid/tooltip/legend/Cell/ResponsiveContainer.
- **Dimensões fixas 48×16** (sem ResponsiveContainer) → **renderiza em jsdom sem nenhum mock**;
  provado inclusive com `ResizeObserver` deletado do global. R1 FECHADO; `setup.ts` intocado.
- **`margin={{0,0,0,0}}`**: default do Recharts consome >50% dos 16px de altura (provado:
  barras máx ~5.5px de 16 com default vs ~14.7px zerado).
- **`accessibilityLayer={false}`**: remove `role="application"` + `tabindex="0"` do `<svg>`
  (provado; sem isso o chart é focável por teclado).
- **`fill` via CSS module** (`.metricSparkBar` com `fill: var(--accent, ...)`): provado que
  `Bar className` aplica a classe em cada `<path class="recharts-rectangle">`; presentation
  attribute perde de CSS rule, então a regra do module vence e o token resolve no contexto do
  concept ativo (ponto 2: "como CSS var entra no fill").

### Estratégia de teste (fecha ponto 5 do dispatch)

Provado no probe: recharts 3.9.2 renderiza SVG completo em jsdom 29 + vitest 2.1.9 + RTL
16.3.2 **sem mock algum** — 10 `path.recharts-rectangle` para 10 pontos, `width="48"
height="16"` no `<svg>`.

- `tests/renderer/ui/metric-tile.test.tsx` (novo, padrão `status-chip.test.tsx`):
  - label + value renderizados como texto (AC-003/AC-004);
  - classe `metricValue` presente por substring (`[class*="metricValue"]`) — nunca hash exato;
  - contagem de barras: `container.querySelectorAll('.recharts-rectangle, [class*="metricSparkBar"]')`
    filtrada a shapes, comparada a `series.length` passada no teste, com a série do teste lida
    de `mockCatalog.kpis.series` (count do fixture, nunca literal);
  - sparkline dentro de wrapper `aria-hidden="true"`; `<svg>` sem `tabindex`/`role` de
    application (AC-006/AC-016);
  - série 8–12: assert `length >= 8 && length <= 12` sobre CADA série do fixture.
- `tests/renderer/model/selectors.test.ts` (estende): slice `kpis` segue os 4 cenários (mesma
  tabela `it.each` já existente); valores derivados: `value` de active-agents ===
  `String(mockCatalog.sessions.filter(...).length)` recomputado no teste; queue ===
  `String(mockCatalog.issueQueue.length)`; agent-time === valor do lookup em `recentUsage`;
  success-rate === `` `${mockCatalog.kpis.successRate}%` `` — tudo derivado, zero hardcode.
- `tests/renderer/shell-settings/shell-settings.test.tsx` (ajusta): heading nível 2 "Key
  metrics" substitui "Recent usage" no assert dos 5 grupos; tiles na ordem G1 (labels na ordem
  do contrato); ausência do painel antigo (`queryByRole('heading', { name: 'Recent usage' })`
  → null) — AC-001/002.
- Cenários loading/empty/error do slot utility já são exercitados pelo padrão existente de
  `selectScenarioSlice` + `ScenarioPresenter` (mecânica compartilhada); asserts novos apenas
  nos textos de copy novos.

## Decisions (ADRs)

- [ADR-0001](adr/0001-kpi-derivation-and-data-model.md) — Fórmulas de derivação dos KPIs
  (active = sessions Running; queue = length; agent-time = lookup por label; success-rate =
  fixture novo) e shape do bloco `mockCatalog.kpis`.
- [ADR-0002](adr/0002-recharts-sparkline-integration.md) — Recharts `^3.9.2`, imports
  `{ Bar, BarChart }`, dimensão fixa 48×16 sem ResponsiveContainer (jsdom sem mock, provado),
  `margin` zerado, `accessibilityLayer={false}` + `aria-hidden` + `isAnimationActive={false}`.
- [ADR-0003](adr/0003-metrictile-color-scheme.md) — Numeral `var(--ink)` sobre
  `var(--surface-raised)` (14.09–16.96:1); sparkline `var(--accent, var(--border))` com
  `fill-opacity: 0.75` (3.64–4.16:1 non-text, todos os concepts); sem tone por KPI; cadeia
  `var()` defensiva. Auditoria: [memory/contrast-audit.md](memory/contrast-audit.md).

## Risks

- **R1 (jsdom × ResponsiveContainer) — FECHADO**: dimensões fixas; provado sem ResizeObserver
  (ADR-0002). Residual: upgrade futuro de Recharts pode mudar o default de
  `accessibilityLayer`; o teste de AC-006 (svg sem tabindex) pega isso no gate.
- **R2 (fórmula active agents) — FECHADO**: ADR-0001 (`Running`). Residual: se o fixture de
  `sessions` mudar todos os status, o KPI pode exibir 0 — teste derivado do fixture acompanha.
- **R3 (contraste sparkline) — FECHADO**: script desde a rev. 1, fill-opacity 0.75 com margem
  (contrast-audit.md). Re-auditar apenas se hex de token ou a opacidade mudarem.
- **R4 (tokens dos legados) — FECHADO**: todos os tokens consumidos existem nos 3 concepts
  (verificado em `concepts.module.css`); cadeia `var()` cobre concept futuro. Nota: leitura de
  "neutro" = accent nativo do concept, não cinza — aberto no gate (Proposta) por ser decisão
  de aparência que o usuário pode querer inverter.
- **R5 (bundle Recharts) — ACEITO/DIVULGADO**: recharts 3 traz Redux interno
  (~7.3MB unpacked, `@reduxjs/toolkit` + `react-redux` + `immer` etc.) mesmo com import
  seletivo — custo do G3 já aprovado, documentado em ADR-0002. Mitigação futura (se doer):
  code-split do MetricTile via `import()` dinâmico, não mudança de import style.
- **Novo — copy em inglês**: rótulos ("Active agents", "Key metrics", copy de estados) seguem
  o padrão inglês do catálogo (constitution: código/identificadores English; toda a copy
  existente do mock é inglesa). Se o gate preferir outro título de grupo que "Key metrics",
  é troca de 1 string + 2 asserts.

## Verification approach

1. **Verify gate** (`npm run lint` + `npm run typecheck` + `npm run test`) — cobre AC-001..008,
   010..012, 015..018 via os três arquivos de teste acima (novos + estendidos) e a suíte
   existente (não-regressão AC-018: os asserts atuais dos outros 4 grupos permanecem).
2. **AC-009 (contraste)** — já cumprido NA FASE DE PLAN por script
   ([memory/contrast-audit.md](memory/contrast-audit.md), L1/L2 + ratios exatos); review
   confere que o CSS implementado usa exatamente os valores auditados (0.75 + tokens). O verify
   gate é cego a contraste — o artefato de auditoria é a evidência.
3. **AC-013/AC-014 (concepts)** — teste de render com wrapper `data-concept` não resolve
   `var()` em jsdom (CSS custom properties não computam); a verificação é: (a) asserts de
   classe (`metricSparkBar`/`metricValue`) presentes; (b) zero diff em
   `concepts.module.css`/arquivos de concept (review + `git diff` do controller); (c) auditoria
   numérica cobrindo os 3 concepts (já feita). AC-015/016: sparkline sem animação por
   construção — assert de ausência de `isAnimationActive` true / de transition no CSS novo.
4. **Visual** — screenshot 1024×700 e 1440×900 no gate de review (precedente P1/P2), conferindo
   maré legível, 2×2 no utility e não-regressão do grid.

## Proposta para aprovação

Ver bloco no Report (trade-off aberto: leitura de "degradação neutra" nos legados — accent
nativo do concept [recomendado, zero código especial] vs. cinza literal [token
night-harbor-only + fallback]).
