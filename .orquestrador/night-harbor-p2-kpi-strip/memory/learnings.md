# Learnings — night-harbor-p2-kpi-strip

**Registro de learnings técnicos e de processo duráveis desta run.**

## Learnings Herdados do Atlas / P2 Anterior (reaplicados nesta run)

Ver detalhamento completo em
`.orquestrador/night-harbor-p2-statuschip-nav/memory/learnings.md`. Resumo do que se aplica
diretamente a esta feature:

### L-inherited-1: Contrast Math by Script

**Descrição**: Auditoria de contraste WCAG **nunca** por estimativa/aritmética de LLM — sempre por
script, com linearização sRGB exata (expoente 2.4). A run anterior teve erro grave de luminância
na rev. 1 do `contrast-audit.md`, só corrigido na rev. 2 pelo controller.

**Aplicação nesta run**: par numeral/tile (texto, mínimo 4,5:1) e sparkline/fundo efetivo
(não-textual, mínimo 3:1) — AC-009. Compor a cor efetiva de tints/opacidades sobrepostas antes de
medir (não medir contra a superfície base isolada).

---

### L-inherited-2: Visual Contrast Against Canvas (não Surface)

**Descrição**: Medir contraste sempre contra o fundo **efetivo** — se há tints/opacidades
sobrepostas (ex.: tile sobre canvas, barra de sparkline com opacidade sobre o tile), compor a cor
final antes de medir. Medir contra a superfície base isolada esconde falhas reais.

**Aplicação nesta run**: sparkline com accent + opacidade sobre o fundo do tile é exatamente esse
caso — AC-009 exige essa composição antes da medição.

---

### L-inherited-3: CSS Module Class Asserts (Substring + Counts do Fixture)

**Descrição**: Testes de classe CSS Module devem usar substring match (nunca nome exato/hash), e
contagens (tiles, itens de fila, pontos de série) devem ser lidas do fixture em tempo de teste,
nunca hardcoded como literal solto.

**Aplicação nesta run**: spec.md Constraints e Verification já codificam essa regra
explicitamente para esta feature (tiles, itens de fila, tamanho da série da sparkline).

---

### L-inherited-4: On-Token Semantics (Fill Sólido Apenas)

**Descrição**: Tokens `--on-*` são semântica de texto sobre fundo **sólido**, nunca sobre fundo
tintado/transparente. Qualquer componente com fundo tintado (color-mix, opacidade) deve usar cor
própria auditada, não `--on-*`.

**Aplicação nesta run**: a sparkline usa barras com opacidade sobre o tile — se qualquer texto
(numeral) for colocado sobre um fundo tintado similar, não usar `--on-*` diretamente sem nova
auditoria.

---

### L-inherited-5: Motion Override Bypasses Reduced-Motion

**Descrição**: Qualquer transition/animation em componente novo precisa de ternário
`useReducedMotion()` explícito, ou viola WCAG 2.1 SC 2.3.3.

**Aplicação nesta run**: a sparkline-maré é estática por construção (AC-015, AC-016) — dispensa
essa lógica por design, não por omissão. Se o plan introduzir qualquer motion no MetricTile (ex.:
hover, ainda que fora do escopo hoje), o ternário volta a ser obrigatório.

---

## Descobertas Desta Run (handoff spec→plan, 2026-07-10)

### N1: Recharts Confirmado Ausente do Projeto

**Contexto**: Verificação de dependência antes do handoff para o plan.
**Descrição**: `grep -n "recharts" package.json` não retornou nenhuma ocorrência — nem em
`dependencies` nem em `devDependencies`. Confirma que é dependência 100% nova, sem uso parcial ou
experimental prévio no repo.

**Implicação**: o plan precisa tratar isso como instalação greenfield — fixar versão exata (major
atual = 3.x), validar peer deps contra `react@^18.3.1`/`react-dom@^18.3.1` já instalados, e
declarar import mínimo (não `import * as Recharts`).

**Referência**: handoff-001.md descobertas inesperadas + R1/R5.

---

### N2: StatusChip Fallback Var() Vive no CSS Module, Não no TSX

**Contexto**: Verificação do padrão de componente `ui/` a espelhar para `MetricTile`.
**Descrição**: `src/renderer/src/ui/StatusChip.tsx` só define props + composição JSX; a técnica de
fallback `var(--token, neutro)` fica inteiramente no CSS module consumido (classes
`statusChip_${tone}`), que este agente não leu neste passo (fora do escopo do handoff, delegado ao
plan).

**Implicação**: o plan não pode planejar o fallback do MetricTile olhando só o TSX do StatusChip —
precisa abrir o CSS module correspondente para replicar a técnica exata (provavelmente
`primitives.module.css`, a confirmar).

**Referência**: handoff-001.md "Suposições validadas".

---

### N3: Slot "Recent Usage" é Substituição Isolada, Não Refactor de Layout

**Contexto**: Leitura de `Shell.tsx` para confirmar AC-002/AC-017/AC-018.
**Descrição**: O painel "Recent usage" é um `ScenarioGroup` único e isolado (`slot="utility"`,
linhas 244–250 de `Shell.tsx`), sem acoplamento estrutural com os outros 4 grupos do Overview
(primary/metrics/queue/activity). A substituição pela KPI strip é uma troca pontual de
`renderReady` + `slice`, não uma reestruturação de grid.

**Implicação**: baixo risco de regressão nos demais painéis (AC-018) se o plan mantiver o mesmo
padrão `ScenarioGroup`/`ScenarioSlice` para a KPI strip.

**Referência**: handoff-001.md "Suposições validadas"; `src/renderer/src/shell/Shell.tsx` linhas
133–269; `src/renderer/src/app/selectors.ts` linhas 80–159.

---

## Descobertas Desta Run (handoff plan→tasks, 2026-07-10)

### N4: `accessibilityLayer` do Recharts 3.x é `true` por Default

**Contexto**: Probe empírico isolado durante o plan (ADR-0002).
**Descrição**: Recharts 3.x injeta `role="application"` + `tabindex="0"` no `<svg>` renderizado
por default — sem desligar, uma sparkline "decorativa" vira tab-stop navegável (violaria
AC-006). `accessibilityLayer={false}` remove os dois atributos, confirmado por probe.

**Implicação**: qualquer componente futuro que use Recharts (não só `MetricTile`) precisa
lembrar de desligar essa prop explicitamente — não é opt-in por padrão sensato da lib, é
opt-out obrigatório.

**Referência**: ADR-0002; plan.md §"Recharts".

---

### N5: `margin` Default do Recharts Consome Metade de um Canvas de 16px

**Contexto**: Mesmo probe (ADR-0002).
**Descrição**: Com `margin` default (não-zero em todos os lados), barras de uma sparkline de
16px de altura topavam em ~5.5px medidos; com `margin={{0,0,0,0}}`, chegavam a ~14.7px. Em
escala de sparkline (poucos px de altura), isso não é ajuste estético — é a diferença entre
gráfico visível e invisível.

**Implicação**: qualquer chart Recharts em miniatura (não só este) precisa zerar `margin`
explicitamente; o default da lib assume um chart de tamanho normal, não um sparkline.

**Referência**: ADR-0002.

---

### N6: `Bar className` Aplica em Cada `<path>` Individual, Presentation Attribute Perde

**Contexto**: Mesmo probe (ADR-0002/0003).
**Descrição**: A prop `className` de `<Bar>` chega em cada `<path class="recharts-rectangle">`
renderizado (não só no `<svg>` raiz). O atributo de apresentação `fill` que o Recharts também
seta perde para a regra do CSS module na cascata — é assim que `var(--accent, ...)` do CSS
module vence e resolve no contexto do concept ativo, não via prop `fill` direta.

**Implicação**: para qualquer chart Recharts que precise de cor via token/tema (não hardcoded),
o padrão é `className` + CSS module, não a prop `fill`/`stroke` direta do componente.

**Referência**: ADR-0002; ADR-0003.

---

### N7: Componente `ui/` Pode Ser Type-Isolado dos Dados (Habilita Paralelização)

**Contexto**: Leitura do `MetricTileProps` do plan durante o handoff plan→tasks.
**Descrição**: `MetricTileProps` é `{ label: string; value: string; series: readonly number[]
}` — tipos primitivos puros, sem import de `KpiViewModel` nem de qualquer tipo de
`selectors.ts`/`mock-catalog.ts`. Isso não é acidental: é o mesmo padrão do `StatusChip`
(componente `ui/` não conhece a fonte de dados, só recebe props prontas).

**Implicação**: tasks de componente `ui/` e tasks de camada de dados podem, em geral, ser
paralelizadas nesta arquitetura — o componente não precisa que o tipo de view-model exista
primeiro para ser implementado e testado; só a task de integração (Shell) precisa dos dois
prontos. Vale para features futuras com o mesmo padrão, não só esta.

**Referência**: plan.md §"MetricTile — API"; handoff-002.md "Contexto que a próxima fase
PRECISA".

---

## Descobertas Desta Run (handoff tasks+analyze→implement, 2026-07-10)

### N8: Paralelização Dados×Componente (N7) Foi Confirmada no Particionamento Real

**Contexto**: sdd-tasks efetivamente particionou 001 (Dados) e 002 (Componente) com
`depends_on: []` em ambas — a previsão de N7 (componente `ui/` type-isolado dos dados habilita
paralelização) virou execução real, não só uma possibilidade teórica. `003` (Integração Shell) é
a única com `depends_on: [001, 002]`, serial genuína (dependência de compilação, não estilo).

**Implicação**: confirma que o padrão "componente `ui/` recebe props prontas, nunca importa
`selectors.ts`/`mock-catalog.ts`" é reaproveitável como heurística de particionamento de tasks em
features futuras com a mesma arquitetura de camadas.

**Referência**: tasks/001-kpi-data-model.md, tasks/002-metrictile-component.md (frontmatter
`depends_on: []` em ambas); tasks/003-shell-kpi-strip-integration.md (`depends_on: [001, 002]`).

---

### N9: Acoplamento de Dado (não de arquivo) Entre Tasks Paralelas Precisa de Verify Gate Conjunto

**Contexto**: `tests/renderer/ui/metric-tile.test.tsx` (task 002) importa `mockCatalog`
diretamente só para ler `mockCatalog.kpis.series` (contagens fixture-driven) — campo que só
existe depois que a task 001 adicionar o bloco `kpis`. Scopes de arquivo são disjuntos (zero
overlap), mas há uma dependência de **dado/símbolo** entre as duas tasks paralelas.

**Implicação**: quando duas tasks paralelas compartilham esse tipo de acoplamento, o verify gate
não deve ser declarado PASS isoladamente por task — precisa rodar uma vez contra a árvore
combinada (ambas as tasks já aplicadas) antes de qualquer uma ser assinada como concluída. Ambas
as tasks já documentam isso explicitamente na própria seção "Context"/"Validation criteria".

**Referência**: tasks/002-metrictile-component.md "Known cross-task data coupling"; tasks/001
"Downstream consumer heads-up"; memory/handoff-003.md "Sumário Executivo" item 2.

---

### N10: Colisão de Texto Entre Heading de Grupo Pré-existente e Label de Tile Novo

**Contexto**: o achado do analyze-agent identificou que o heading `<h2>Issue queue</h2>` (grupo
`slot="queue"`, pré-existente, intocado) e o label do novo `MetricTile` "Issue queue" (um dos 4
KPIs) são o mesmo texto literal — uma query `getByText('Issue queue')` sem escopo casaria os
dois elementos e lançaria erro de múltiplos matches.

**Implicação**: sempre que uma feature reintroduzir um rótulo textual que já existe em outro
elemento estrutural da mesma tela (heading de grupo vs. label de item, por exemplo), os testes
novos devem usar `within(...)` escopado ao container correto (ou `getByRole` com `name` mais
específico) em vez de `getByText` cru — heurística reaproveitável para qualquer feature futura
que adicione KPIs/labels que ecoem nomenclatura de grupos já existentes na tela.

**Referência**: tasks/003-shell-kpi-strip-integration.md "Naming-collision gotcha"; dispatch
report_anterior do controller.

---

### N11: Dead Code Só Fica Órfão Depois da Troca — Remoção Cabe na Mesma Task que Troca o Slot

**Contexto**: `DataList` (helper JS) e os fragmentos de seletor `.dataList` (CSS, combinados via
vírgula com `.projectSummary`) só viram dead code **depois** que a task 003 substitui o
`renderReady` do slot `utility`. Antes da troca, `DataList` tinha exatamente 1 call site (o
próprio `renderReady` sendo substituído) — confirmado por busca, não suposição.

**Implicação**: quando uma task de integração troca o único consumidor de um helper/seletor
compartilhado, a remoção do dead code resultante pertence à mesma task (não a uma task de
limpeza separada), desde que a busca confirme que não há outro consumidor no arquivo — heurística
já aplicada aqui pelo analyze-agent e incorporada ao texto da task 003 pelo controller.

**Referência**: tasks/003-shell-kpi-strip-integration.md Step 3; memory/decisions.md D-011.

---

## Rastreabilidade

- **Learnings herdados**: atlas + `.orquestrador/night-harbor-p2-statuschip-nav/memory/learnings.md`
  (L1–L11), trazidos via brain recall registrado em `memory/state.md` desta feature.
- **N1–N3**: descobertas do handoff-agent na fase spec→plan, 2026-07-10.
- **N4–N7**: descobertas do handoff-agent na fase plan→tasks, 2026-07-10 (N4–N6 herdadas dos
  probes empíricos do plan-agent nos ADRs, formalizadas aqui como learnings reaproveitáveis;
  N7 é descoberta própria desta fase de handoff).
- **N8–N11**: descobertas do handoff-agent na fase tasks+analyze→implement, 2026-07-10 (N8 e N9
  confirmam previsões anteriores contra o particionamento real; N10 e N11 formalizam achados do
  analyze-agent já incorporados às tasks pelo controller, tornando-os reaproveitáveis fora desta
  feature).
- **Próxima atualização**: sdd-implement deve confirmar que o verify gate conjunto (001+002) foi
  de fato executado antes de 003 iniciar, e registrar qualquer learning novo sobre o comportamento
  real do `npm install recharts` (versões instaladas de fato, efeitos colaterais no lockfile).
