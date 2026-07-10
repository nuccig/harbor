# Handoff: plan → tasks

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: plan (sdd-plan, aprovado HITL)
**Para**: tasks (sdd-tasks)
**Controlador**: handoff-agent

---

## Decisões tomadas

- **Approach**: KPI strip é um novo render do slot `utility` do Overview (`Shell.tsx` linhas
  244–250, confirmado nesta fase — números batem com o plan); consome novo slice
  `overview.kpis`, renderiza 4 `MetricTile`s. `recentUsage` permanece intocado no catálogo e
  no view-model (AC-017) — só o render do slot muda.
- **MetricTile** (`ui/MetricTile.tsx`, novo): props `{ label: string; value: string; series:
  readonly number[] }` — não importa `KpiViewModel` nem nada de `selectors.ts`/`mock-catalog.ts`;
  dados chegam prontos por props (ver "Contexto — paralelização" abaixo, é o fato que destrava
  isso). API completa e DOM em plan.md §"MetricTile — API".
- **Derivação dos KPIs** (ADR-0001): active-agents = `sessions.filter(s => s.status ===
  'Running').length` (R2 fechado); queue = `issueQueue.length`; agent-time = lookup por
  `label === 'Agent time'` em `recentUsage` (não por índice); success-rate = campo novo
  `mockCatalog.kpis.successRate` (92). Reconfirmei os 3 primeiros lendo `mock-catalog.ts`
  diretamente: `sessions` tem 1 `Running` (session-104), `issueQueue` tem 3 itens,
  `recentUsage` tem `{ label: 'Agent time', value: '3h 42m' }` — batem exatamente com os
  valores que o ADR-0001 declara ("Yields 1/3/'3h 42m' hoje").
- **Dados novos** (ADR-0001): bloco `mockCatalog.kpis` com `successRate` + `series` (10 pontos
  fixos/métrica, helper `freezeArray` novo, irmão de `freezeItems`). Shape exato em
  plan.md §"mock-catalog.ts — bloco novo".
- **Recharts `^3.9.2`** (ADR-0002): só `{ Bar, BarChart }`; `width={48} height={16}` fixo, sem
  `ResponsiveContainer`; `margin` zerado nos 4 lados; `accessibilityLayer={false}` +
  wrapper `aria-hidden="true"` + `isAnimationActive={false}`. `tests/renderer/setup.ts` fica
  intocado (jsdom renderiza sem mock, provado mesmo com `ResizeObserver` deletado do global).
- **Cor** (ADR-0003, gate HITL): numeral `var(--ink)` sobre `var(--surface-raised)`
  (14.09/16.96/15.78:1 night-harbor/command-deck/signal-poster); sparkline
  `fill: var(--accent, var(--border))` com `fill-opacity: 0.75` (4.16/3.64/3.80:1). Sem
  tone-per-KPI. Re-verifiquei eu mesmo nesta fase, lendo `concepts.module.css` diretamente: os
  5 tokens consumidos (`--surface-raised`, `--border`, `--ink`, `--ink-muted`, `--accent`)
  **existem nos 3 blocos de concept** (linhas 115–190) — confirma independentemente o R4 do
  plan (já reconfirmado 1× pelo controller por script; esta é uma 2ª confirmação, de shape/
  presença dos tokens, não dos ratios).
- **Trade-off AC-014 resolvido no gate = opção A**: legados renderizam com o accent NATIVO
  deles (verde command-deck `#0b6b5b`, roxo signal-poster `#5a31d6`) — zero código por
  concept, `concepts.module.css` com **zero edição**. Não é a leitura "cinza literal"
  (alternativa descartada, ver abaixo).
- **Copy aprovada no gate**: grupo "Key metrics"; tiles "Active agents" / "Issue queue" /
  "Success rate" / "Agent time". Copy de estados (`overviewCopy.kpis`) em plan.md
  §"selectors.ts — derivação + slice".
- **Layout**: `.kpiStrip` em `shell.module.css` — grid 2×2 (`repeat(2, minmax(0,1fr))`) DENTRO
  do slot utility, `<ul>`/`<li>` (lista nomeada, contagem exposta a AT de graça). Sem caso novo
  de media query.
- **`package.json`**: `"recharts": "^3.9.2"` em `dependencies` — dependência nova, aprovação
  HITL G3 já registrada e rastreável (boundary `ask_first` cumprido). Reconfirmado nesta fase:
  `recharts` **ainda ausente** de `package.json`/`package-lock.json` — instalação é greenfield.

---

## Alternativas descartadas

Não reabrir no tasks/implement — decisões fechadas com raciocínio já registrado nos ADRs
(referenciar, não repetir):

- **Contagem total de sessões** para "agentes ativos" — rejeitada (ADR-0001; não bate com
  "estão ativos" do job-to-be-done; seria redundante com o painel de sessões um slot ao lado).
- **Valores de KPI como literais soltos em `mock-catalog.ts`** — rejeitada (ADR-0001; viola
  AC-007 e a regra de teste "nunca hardcode contagem").
- **Derivação dos KPIs dentro de `Shell.tsx`** — rejeitada (ADR-0001; quebra o seam
  `selectors.ts`/`OverviewViewModel` que todo o resto do app usa).
- **`ResponsiveContainer` + polyfill de `ResizeObserver` em `setup.ts`** — rejeitada (ADR-0002;
  dimensão fixa já é a forma real do design e funciona em jsdom sem acomodação nenhuma).
- **`import * as Recharts`** — rejeitada (instrução explícita da spec; imports nomeados).
- **Remover `role`/`tabindex` do svg via `ref` manual pós-render** — rejeitada (ADR-0002;
  `accessibilityLayer={false}` já resolve nativamente).
- **`animation: none` global via CSS** — rejeitada (ADR-0002; `isAnimationActive={false}` é o
  mecanismo próprio da lib).
- **Tone por KPI** (ex.: success-rate em `--success`, queue em `--warning`) — rejeitada
  (ADR-0003; exigiria threshold/regra de negócio fora de escopo — "annotation callouts" é P3).
- **Fill-opacity 85%** (reuso do número do StatusChip) — rejeitada (ADR-0003; StatusChip é tint
  de fundo, sparkline é marca gráfica em primeiro plano — objetivos de transparência
  diferentes; 0.75 veio do script, não de analogia).
- **Token `--metric-accent` exclusivo de night-harbor** (leitura "cinza literal" de AC-014) —
  levantada como trade-off genuíno no gate, **perdeu** para a opção A (accent nativo); se o
  usuário reverter essa escolha depois, ADR-0003 já registra que a mudança é aditiva.
- **`--on-accent` para o numeral** — rejeitada sem precisar de nova auditoria (ADR-0003;
  `--on-*` é semântica de texto sobre fill SÓLIDO; numeral senta em `--surface-raised`, não em
  `--accent` sólido).

---

## Suposições validadas

Re-verificadas diretamente por mim nesta fase (não apenas herdadas do plan):

- `Shell.tsx` linhas 244–250 ainda são o slot `utility` exato descrito no plan (`ScenarioGroup`,
  `slice={overview.recentUsage}` linha 247, `slot="utility"` linha 248) — nenhum drift desde a
  fase de plan.
- `mock-catalog.ts`: `sessions` (1 `Running`), `issueQueue` (length 3), `recentUsage` (`Agent
  time` = `'3h 42m'`) batem exatamente com os valores que ADR-0001 declara — a fórmula de
  derivação vai produzir os mesmos números que o ADR já documentou.
- `selectors.ts` linhas 80–147: `overviewCopy` + `OverviewViewModel` + `selectOverviewView`
  seguem exatamente o padrão que o plan descreve (`selectScenarioSlice(state, mockCatalog.X,
  overviewCopy.X)` por campo) — adicionar `kpis` é aditivo, mesmo formato dos 4 campos
  existentes.
- `concepts.module.css`: os 5 tokens (`--surface-raised`, `--border`, `--ink`, `--ink-muted`,
  `--accent`) existem nos 3 blocos de concept (command-deck linha ~115–123, night-harbor
  ~141–149, signal-poster ~182–190) — confirma R4/ADR-0003 independentemente.
- `package.json`/`package-lock.json`: `recharts` continua ausente — instalação é greenfield,
  como o handoff-001.md já havia confirmado (N1); nenhuma mudança entre as fases.
- `MetricTileProps` (plan.md) não referencia nenhum tipo de `selectors.ts` — é uma prova
  concreta (não só uma expectativa) de que o componente é isolado dos dados (ver "Contexto que
  a próxima fase PRECISA" abaixo).

---

## Suposições invalidadas

Nenhuma. O plan foi aprovado no gate HITL sem correções de fundo — o único ponto realmente em
aberto (trade-off de leitura de AC-014) foi resolvido por escolha entre duas alternativas
válidas, não por invalidação de uma suposição técnica (ambas as leituras — accent nativo vs.
cinza — eram tecnicamente corretas; era uma decisão de produto/aparência, não um erro).

---

## Descobertas inesperadas

Herdadas do plan (ADR-0002/0003, empíricas — reafirmo aqui porque mudam como o tasks-agent deve
descrever a task do componente, não são só cor/fórmula):

- jsdom renderiza o `<BarChart>` de dimensão fixa **sem nenhum mock**, mesmo com
  `ResizeObserver` deletado do `globalThis` inteiro — o caminho não-responsivo do Recharts
  nunca chama isso. `tests/renderer/setup.ts` fica fora do escopo de qualquer task desta
  feature.
- `accessibilityLayer` é `true` por default no Recharts 3.x e injeta `role="application"` +
  `tabindex="0"` no `<svg>` — sem desligar explicitamente, a sparkline "decorativa" seria um
  tab-stop navegável (violaria AC-006). Isso é uma prop obrigatória, não opcional.
- `margin` default do Recharts consome >50% dos 16px de altura do canvas (barras ~5.5px de 16
  vs. ~14.7px com margin zerado) — a 16px de escala isso não é estética, é a diferença entre
  chart visível e invisível. A task que implementa `MetricTile` precisa copiar o `margin={{0,
  0,0,0}}` literalmente, não como detalhe opcional.
- `Bar className` chega em cada `<path class="recharts-rectangle">` individualmente; o `fill`
  via presentation attribute perde para a regra CSS module — é assim que o token `var(--accent,
  ...)` entra no fill (não via prop `fill` direta do Recharts).
- Recharts 3 traz Redux interno (`@reduxjs/toolkit`, `react-redux`, `immer` etc., ~7.3MB
  unpacked) mesmo com import seletivo — não é evitável com imports nomeados; aceito/divulgado
  como custo do G3 já aprovado (R5). Não é uma surpresa para reabrir na fase de tasks, é
  contexto para não questionar de novo o bundle size no review.
- Desvio de processo (não técnico): plan-agent caiu 1× por session limit durante a execução,
  foi retomado via SendMessage (protocolo do contract.md) e concluiu — mesmo padrão de
  resiliência já visto no P2 anterior; não afeta o conteúdo do plan entregue.

---

## Raciocínio comprimido (dead ends)

Nenhum dead end de tentativa-e-erro nesta fase além do que já está capturado em
"Alternativas descartadas" acima — o plan foi majoritariamente dirigido por probes empíricos
isolados (Recharts em jsdom, script de contraste) que já chegaram à resposta certa na primeira
rodada de cada probe, não por implementação-e-reversão. O único ponto que passou por
ida-e-volta foi o trade-off de AC-014 (accent nativo vs. cinza literal), que não é um dead end
técnico — é uma decisão de produto genuína, resolvida no gate a favor da opção A (ver
"Alternativas descartadas").

---

## Contexto que a próxima fase PRECISA

### Arquivos a tocar (base: plan.md §"Components & changes")

| Arquivo | Ação | Grupo natural |
| --- | --- | --- |
| `package.json` | modify (+ `recharts@^3.9.2`) | ver "Instalação do Recharts" abaixo |
| `package-lock.json` | modify (efeito colateral do `npm install`) | mesmo task que instala |
| `src/renderer/src/ui/MetricTile.tsx` | create | Componente |
| `src/renderer/src/ui/primitives.module.css` | modify (+ bloco `.metricTile*`) | Componente |
| `src/renderer/src/ui/index.ts` | modify (+ export) | Componente |
| `src/renderer/src/app/mock-catalog.ts` | modify (+ `freezeArray` + bloco `kpis`) | Dados |
| `src/renderer/src/app/selectors.ts` | modify (+ `KpiViewModel`/`buildKpiViewModels`/slice) | Dados |
| `src/renderer/src/shell/Shell.tsx` | modify (slot utility, linhas 244–250) | Integração Shell |
| `src/renderer/src/shell/shell.module.css` | modify (+ `.kpiStrip`) | Integração Shell |
| `tests/renderer/ui/metric-tile.test.tsx` | create | Componente |
| `tests/renderer/model/selectors.test.ts` | modify | Dados |
| `tests/renderer/shell-settings/shell-settings.test.tsx` | modify | Integração Shell |
| `src/renderer/src/concepts/concepts.module.css` | **zero edição** (AC-014/G4) | — |
| `tests/renderer/setup.ts` | **zero edição** (provado, ADR-0002) | — |

Isso dá 3 grupos naturais de disjoint scope (Dados / Componente / Integração Shell), que batem
com a ordem serial sugerida no dispatch.

### Instalação do Recharts — qual task instala (pergunta explícita do dispatch)

Fato concreto que resolve isso: só `MetricTile.tsx` importa `recharts` — nem `Shell.tsx` nem
`selectors.ts`/`mock-catalog.ts` tocam a lib diretamente (eles só passam `series: number[]` por
props). Recomendação: a task do grupo **Componente** é quem roda `npm install recharts@^3.9.2`
e por isso é dona de `package.json`+`package-lock.json` no seu scope disjunto — não a task de
Dados. Isso mantém a task de Dados livre de qualquer efeito colateral de instalação e alinha
"quem introduz a dependência" com "quem a importa de fato". (Decisão final de particionamento
ainda é do tasks-agent — isto é a evidência que faltava para decidir, não uma decisão já
tomada por mim.)

### Paralelização Dados × Componente (refina o "avalie" do dispatch)

`MetricTileProps` (plan.md §"MetricTile — API") é `{ label: string; value: string; series:
readonly number[] }` — tipos primitivos puros, sem import de `KpiViewModel` nem de nada em
`selectors.ts`/`mock-catalog.ts`. Isso é uma prova, não só uma hipótese: o componente pode ser
implementado e testado (`metric-tile.test.tsx` passa props literais, lendo só
`mockCatalog.kpis.series` para tamanhos de série — ver plan.md §"Estratégia de teste") sem
esperar `buildKpiViewModels()` existir. **Dados** e **Componente** podem rodar em paralelo;
**Integração Shell** é estritamente serial depois dos dois (precisa de `overview.kpis` E do
export `MetricTile` de `ui/index.ts`).

### Mapeamento teste ↔ task

- `tests/renderer/ui/metric-tile.test.tsx` (novo) → task Componente. Lê contagem de série de
  `mockCatalog.kpis.series` (import direto do fixture, não da task de Dados — plan.md deixa
  isso explícito: "count do fixture, nunca literal", sem depender de `buildKpiViewModels`).
- `tests/renderer/model/selectors.test.ts` (estende) → task Dados. Valores recomputados
  inline no teste (`mockCatalog.sessions.filter(...)`, etc.) — zero hardcode.
- `tests/renderer/shell-settings/shell-settings.test.tsx` (estende) → task Integração Shell.
  Heading "Recent usage"→"Key metrics"; assert de ausência do heading antigo.

### Valores que NÃO podem ser re-derivados pela task de implementação (só copiados)

O gate de contraste está FECHADO contingente aos valores exatos abaixo não mudarem
(ver risco R3 abaixo). A task do CSS deve copiar estes literais do plan/ADR-0003, não
recalculá-los:
- `.metricSparkBar { fill: var(--accent, var(--border)); fill-opacity: 0.75; }`
- `.metricValue` usa `var(--ink)` (via `.data` de `primitives.module.css`, já existente do P1)
  sobre `.metricTile { background: var(--surface-raised); }`
- CSS completo (structure) em plan.md §"CSS novo (primitives.module.css)" e §"`.kpiStrip`".

### Verify gate e constitution

- `npm run lint && npm run typecheck && npm run test` (constitution.md `verify_gate`) — cobre
  AC-001..008, 010..012, 015..018. É CEGO a contraste (AC-009 já fechado por script em
  `memory/contrast-audit.md`, não repetir no verify gate).
- Boundary `always`: review numérico de contraste para qualquer par de cor novo/alterado — já
  cumprido nesta feature; só reabre se algum hex/opacity mudar durante implement.
- Boundary `ask_first`: nova dependência — já satisfeito (HITL G3), mas a task que roda
  `npm install` deve deixar isso rastreável no commit/PR (não assumir implícito).
- `constitution.md` também menciona `openwiki_gate` condicional a `openwiki/` existir no repo
  root — fora do escopo desta feature (não verificado nesta fase; tasks-agent não precisa agir
  salvo se esse diretório existir).

---

## Riscos transferidos

| # | Risco | Status | Ação p/ tasks/implement |
| --- | --- | --- | --- |
| R1 | Recharts × jsdom/ResizeObserver | FECHADO | Nenhuma ação — dimensão fixa já provada. Residual: upgrade futuro do Recharts pode mudar o default de `accessibilityLayer`; o teste de AC-006 (svg sem tabindex) pega isso automaticamente no verify gate, sem ação extra necessária agora. |
| R2 | Fórmula "agentes ativos" | FECHADO (Running) | Nenhuma ação — ADR-0001 + valores reconfirmados nesta fase. Residual: se o fixture de `sessions` mudar todos os status, o KPI pode exibir 0; o teste derivado do fixture (recomputa o filter no teste) acompanha automaticamente, sem quebra silenciosa. |
| R3 | Contraste sparkline/numeral | FECHADO por script (contrast-audit.md) | Task de CSS deve copiar os valores exatos (0.75 opacity, tokens listados acima) literalmente. Só re-auditar se hex de token ou opacity mudarem — qualquer PR que altere esses dois pontos precisa rodar o script de novo antes do merge. |
| R4 | Tokens dos legados ausentes | FECHADO | Reconfirmado 2× (controller no gate + eu nesta fase, lendo `concepts.module.css` diretamente) — os 5 tokens existem nos 3 concepts. Nenhuma ação. |
| R5 | Bundle Recharts (Redux interno, ~7.3MB) | ACEITO/DIVULGADO | Não reabrir no review — custo já aprovado no G3. Mitigação futura (code-split via `import()` dinâmico) é fora do escopo desta feature; não criar task para isso agora. |
| Novo | `package.json`+`package-lock.json` são um par atômico (`npm install` toca os dois) | ABERTO p/ tasks-agent | Escopo disjunto: os dois arquivos têm que pertencer à MESMA task (não dá pra dividir a instalação entre duas tasks). Ver recomendação em "Instalação do Recharts" acima (task Componente, não Dados). |
| Novo | Cópia "neutro" em AC-014 = accent nativo, não cinza | FECHADO (gate) | Nenhuma ação de código — é justamente a ausência de código por concept que a decisão pede. Se o review/QA visual estranhar tiles coloridos nos legados, não é bug — é o comportamento decidido (ADR-0003 "Consequences", plan.md "Proposta para aprovação"). |

---

## Rastreabilidade

- **Fontes**: `plan.md` (status: approved, gate HITL 2026-07-10), ADR-0001/0002/0003 (accepted),
  `memory/contrast-audit.md`, `memory/state.md` §"Decisões do gate do plan", `spec.md` (18 ACs).
- **Verificações independentes feitas nesta fase** (handoff-agent, não apenas herdadas):
  linhas do slot utility em `Shell.tsx`; valores de `sessions`/`issueQueue`/`recentUsage` em
  `mock-catalog.ts`; presença dos 5 tokens de cor nos 3 blocos de `concepts.module.css`;
  ausência de `recharts` em `package.json`/`package-lock.json`; estrutura de
  `overviewCopy`/`OverviewViewModel`/`selectScenarioSlice` em `selectors.ts`.
- **Próxima fase**: `sdd-tasks` deve produzir task files com disjoint file scopes (validados
  pelo controller) nos 3 grupos descritos acima (Dados, Componente, Integração Shell), decidir
  formalmente onde `npm install recharts` acontece (recomendação: task Componente), e mapear
  cada um dos 3 arquivos de teste (novo + 2 estendidos) à task correspondente.
