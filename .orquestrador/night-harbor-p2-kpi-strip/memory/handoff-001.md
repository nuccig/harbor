# Handoff: spec → plan

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: spec (aprovada HITL sem alterações)
**Para**: plan (sdd-plan)
**Controlador**: handoff-agent

---

## Decisões tomadas

Nenhuma decisão nova nesta fase — a spec formaliza G1–G4 do grill (state.md linhas 13–21) em
18 ACs EARS. Registradas em `memory/decisions.md` como D-001..D-004:

1. **4 KPIs fixos, ordem fixa** — agentes ativos, fila, taxa de sucesso, agent time (spec.md
   Scope "In", AC-001).
2. **KPI strip substitui "Recent usage"** — o painel de texto corrido some do Overview; o slice
   `recentUsage` permanece no `mockCatalog` (AC-002, AC-017).
3. **Recharts aprovado como dependência nova** — via HITL do grill (não introduzido pela spec);
   sparkline com 8–12 pontos, tokens de accent com opacidade, `aria-hidden` (Constraints, AC-005,
   AC-006).
4. **Fallback neutro em conceitos legados** — mesmo padrão G4 do P2 anterior: MetricTile em
   `ui/`, consumo de tokens via `var()`, zero edição em command-deck/signal-poster (AC-014).

Leitura interpretativa herdada do report do spec-agent (não é decisão nova, é esclarecimento):
"métrica implícita" (AC-007) cobre contagem de sessões, contagem de issues na fila, e o valor
hoje exibido como "Agent time" em `recentUsage`. A fórmula exata de derivação (ex.: contagem total
de sessões vs. filtrada por status) fica em aberto — ver "Riscos transferidos" R2.

---

## Alternativas descartadas

Ver spec.md seção "Out (explicit non-goals)" — não reabrir no plan:

- Ações inline/drill-down/clique nos tiles (P2.4, tema separado).
- Dado real/telemetria (permanece mock/fixture determinístico).
- Séries de tempo reais, gráficos históricos completos, segmented control temporal (P3).
- Annotation callouts sobre o gráfico (P3).
- Qualquer animação da sparkline — decisão fechada: estática, sem loop, sem transição.
- Reabrir vocabulário/mapeamento tone-ícone do StatusChip ou da nav (já entregue em P2.1/P2.2).
- Novo layout de grid do Overview além de tomar o slot de "Recent usage".
- Estender a KPI strip a outras superfícies (Settings, Projects, Sessions, Issues) — Overview
  apenas.
- Editar command-deck/signal-poster para ganharem a feature própria (apenas fallback neutro).

---

## Suposições validadas

- G1–G4 do grill HITL (state.md linhas 13–21) seguem válidas sem revisão — spec aprovada sem
  alterações.
- Recharts é dependência genuinamente nova: confirmado por grep em `package.json` — **nenhuma
  ocorrência de `recharts`** nas dependencies atuais. Isso valida a premissa da spec ("dependência
  nova já aprovada via HITL") e implica que o plan precisa fixar versão exata e escopo de import.
- O padrão de componente `ui/` (StatusChip.tsx) é reaproveitável como esqueleto para MetricTile —
  confirmado lendo `src/renderer/src/ui/StatusChip.tsx`: props tipadas + classes de `primitives.module.css`
  por tone. Nota: o fallback `var()` com valor neutro vive no CSS (module), não no TSX — o plan
  precisa localizar o bloco CSS equivalente (StatusChip usa `styles[...]` gerado por
  `primitives.module.css`; MetricTile deve seguir o mesmo split TSX/CSS module).
- O slot "Recent usage" no Overview é um alvo de substituição direto e isolado: confirmado em
  `src/renderer/src/shell/Shell.tsx` linhas 244–250 — `ScenarioGroup` com `slot="utility"`,
  `slice={overview.recentUsage}`, `renderReady={(usage) => <DataList items={usage} />}`. Trocar
  esse bloco por um `ScenarioGroup`/render próprio para KPIs não exige tocar nos outros 4 grupos
  (primary/metrics/queue/activity), confirmando AC-018 (sem regressão nos demais painéis).
- `overview.recentUsage` na `OverviewViewModel` (`src/renderer/src/app/selectors.ts` linha 125,
  slice construído linha 144) continua existindo mesmo que o slot pare de renderizá-lo — satisfaz
  AC-017 sem exigir mudança em `selectors.ts` além de adicionar o novo campo `kpis`.

---

## Suposições invalidadas

Nenhuma. Spec aprovada HITL sem edições (igual ao precedente P2.1/P2.2 nesse ponto do pipeline).

---

## Descobertas inesperadas

- `recharts` está **ausente** de `package.json` (dependencies e devDependencies) — a spec já
  tratava isso como esperado ("dependência nova"), mas vale registrar que não há nenhum resquício
  de instalação parcial ou uso experimental em outro lugar do repo; é greenfield para essa lib
  neste projeto.
- Stack atual relevante para compatibilidade Recharts: `react@^18.3.1`, `react-dom@^18.3.1`,
  `vitest@^2.1.8`, `jsdom@^29.1.1`, `@testing-library/react@^16.3.2` (package.json linhas 27–48).
  Recharts 3.x declara peer deps de React — o plan deve confirmar compatibilidade exata com
  18.3.1 (não apenas assumir "major 3.x funciona").
- `StatusChip.tsx` não expõe diretamente a técnica `var()`+fallback no componente — ela mora no
  CSS module consumido (`primitives.module.css`, classes `statusChip_${tone}`). O plan precisa ler
  esse CSS (não só o TSX) para replicar a técnica de fallback no MetricTile/sparkline.

---

## Raciocínio comprimido (dead ends)

Nenhum dead end nesta fase — handoff é spec→plan direto, sem iteração de correção. O único ponto
deixado deliberadamente em aberto pela spec ("Open questions") é a fórmula exata de "agentes
ativos" (contagem total de sessões vs. filtro por status), decisão que a spec explicitamente
empurra para o plan — não é uma ambiguidade acidental, é um gap intencional (ver spec.md seção
"Open questions").

---

## Contexto que a próxima fase PRECISA

### Recharts — decisões que o plan deve fechar

- Versão exata a fixar (major atual = 3.x) e confirmação de peer-dep compatível com
  `react@^18.3.1`/`react-dom@^18.3.1` já instalados.
- Superfície de import: `BarChart`/`Bar` (mais provável para sparkline-maré tipo barras) vs.
  primitivas menores; decidir se `ResponsiveContainer` é necessário ou se um SVG de tamanho fixo
  (~48×16px, 8–12 barras) é mais simples e mais previsível em jsdom (ResponsiveContainer depende
  de `ResizeObserver`/layout que jsdom não calcula de verdade — risco de teste, ver R1 abaixo).
  Referenciar Constraints da spec: 8–12 pontos, tokens de accent com opacidade, `aria-hidden`.
  Custo de bundle aceito (dependência nova aprovada via HITL, mas o plan deve declarar a
  estratégia de import mínimo — não `import * as Recharts`).
- Como desligar eixos/grid/tooltip/legend para a sparkline ficar puramente decorativa (sem
  overhead de interação que a spec explicitamente exclui — "Out": nenhuma interatividade).

**Carregar a skill `dataviz` antes de decidir forma e cores da sparkline** — disponível no
harness, ainda não consultada nesta fase (handoff). Ela deve informar o formulário/heurística de
forma e a fórmula de cor antes de qualquer código.

### Pontos de integração no código (paths + linhas confirmadas nesta fase)

- `src/renderer/src/shell/Shell.tsx`: função `Overview()` (linha 133), usa
  `selectShellView(state)` (linha 136) e `ScenarioGroup` por slice (`ScenarioSlice<T>`, ver
  `mock-catalog.ts`). O slot `utility` (linhas 244–250) é o alvo direto de substituição —
  trocar `renderReady={(usage) => <DataList items={usage} />}` por render de KPI strip,
  mantendo `slice={overview.recentUsage}` → precisa virar `slice={overview.kpis}` (novo campo)
  sem remover `recentUsage` do catálogo (AC-017).
- `src/renderer/src/app/selectors.ts`: `overviewCopy` (linha 80), `OverviewViewModel` (linha
  125 tem `recentUsage: ScenarioSlice<typeof mockCatalog.recentUsage>`), `selectOverviewView`
  (~130–146, cada campo via `selectScenarioSlice(state, mockCatalog.X, overviewCopy.X...)`) — o
  plan precisa adicionar um campo `kpis` seguindo exatamente esse padrão (nunca duplicar lógica
  de cenário).
- `src/renderer/src/app/mock-catalog.ts`: `recentUsage` (linhas 114–118) permanece intocado;
  adicionar um bloco novo `kpis` (ex.: `{ id, label, value, series: number[] }[]`, série
  determinística de 8–12 pontos por métrica) seguindo o padrão `freezeItems(...)` já usado por
  `sessions`/`issueQueue`/`recentUsage`.
- `src/renderer/src/ui/StatusChip.tsx`: esqueleto de componente `ui/` a espelhar para
  `MetricTile` — props tipadas, ícone opcional com default por tone/estado, classes via CSS
  module. Localizar e ler `primitives.module.css` (ou equivalente) para replicar a técnica de
  fallback `var()` usada por `statusChip_${tone}`.
- Tokens P1 disponíveis (a confirmar location exata pelo plan, não assumir): `--type-metric`,
  `--weight-*`, `--icon-*`, `--success`/`--warning`/`--danger`, tokens de motion unificados
  (`motion-tokens.ts` + `global.css`).

### Precedentes de processo a repetir

- `contrast-audit.md` como artefato **separado** em `memory/` (não misturado no handoff) —
  formato visto em
  `.orquestrador/night-harbor-p2-statuschip-nav/memory/contrast-audit.md`: cabeçalho com data/fase/
  riscos endereçados, seção de "Descoberta N" por token/par, valores hex + ratio exato, e uma
  seção de ERRATA se uma revisão anterior tiver luminância errada. Repetir esse formato para o par
  numeral/tile e sparkline/fundo efetivo desta feature.
- Auditoria de contraste **sempre por script**, nunca por estimativa/aritmética de LLM (learning
  `contrast-math-by-script` — a run anterior teve um erro grave de linearização sRGB na rev. 1 do
  contrast-audit, corrigido só na rev. 2 pelo controller).
- Medir contraste da sparkline contra o **fundo efetivo composto** (tile + tints/opacidades
  sobrepostas), nunca contra a superfície base isolada (learning `visual-contrast-against-canvas`).
- Testes de contagem (tiles, itens de fila, pontos da série) sempre lidos do fixture em tempo de
  teste (learning `css-module-class-asserts` + regra explícita da Constraints da spec) — nunca
  hardcode solto.
- Tokens `--on-*` são semântica de fill **sólido**; qualquer fundo tintado/transparente (como o
  tile ou a barra da sparkline com opacidade) não deve usar `--on-*` diretamente — precisa de cor
  própria auditada (learning `on-token-semantics`, ver decisions.md do P2 anterior D-007).
- Sparkline estática por construção dispensa lógica de `useReducedMotion()` — mas qualquer outra
  motion eventualmente introduzida no MetricTile (ex. hover/estado) precisaria do ternário
  (learning `motion-override-bypasses-reduced-motion`).

### Contexto estático (não muda)

- Branching: `feat/night-harbor-p2-kpi-strip`, stacked sobre `feat/night-harbor-p2-statuschip-nav`
  / PR #5 (cadeia #2 ← #4 ← #5 ← #6).
- Verify gate: `npm run lint` + `npm run typecheck` + `npm run test` (constitution.md) — cego a
  contraste; auditoria numérica é adicional e obrigatória antes do merge (AC-009).
- Boundary crítico: qualquer par de cor novo passa por review numérico de contraste
  (constitution.md `boundaries.always`).
- `ask_first` boundary cobre "adicionar nova dependência" — já endereçado pela aprovação HITL do
  grill G3 (Recharts), mas o plan deve deixar essa aprovação explícita/rastreável (não assumir
  implícito).

---

## Riscos transferidos

| # | Risco | Severidade | Ação plan | Origem |
|---|-------|-----------|-----------|--------|
| R1 | `ResponsiveContainer` do Recharts depende de medição de layout (ResizeObserver) que jsdom não calcula de verdade — sparkline pode renderizar com dimensão 0 em teste headless | ALTO | Decidir entre SVG de tamanho fixo (~48×16px) sem `ResponsiveContainer`, ou confirmar workaround de mock de dimensão para jsdom, antes de escrever testes de render | Constraints spec.md ("renderização testável em ambiente de teste headless"), stack `jsdom@^29.1.1` |
| R2 | Fórmula de "agentes ativos" ambígua (contagem total de sessões vs. filtro por status, ex. só `Running`) — gap intencional deixado pela spec | MÉDIO | Decidir e documentar a fórmula exata como ADR ou decisão de plan, referenciando `mock-catalog.ts` `sessions` | spec.md "Open questions", AC-007 |
| R3 | Contraste da sparkline (barras com opacidade/accent) sobre o fundo efetivo do tile pode não fechar 3:1 já na primeira tentativa — mesma classe de erro da run anterior (linearização sRGB incorreta na rev. 1) | ALTO | Auditoria por script desde a primeira revisão (não estimar); produzir `contrast-audit.md` seguindo formato do precedente | AC-009, learning `contrast-math-by-script`, ADR 0014 |
| R4 | Fallback neutro do MetricTile em command-deck/signal-poster pode não ter os tokens equivalentes definidos (mesmo padrão do risco R1 do P2 anterior sobre `--surface-active`) | MÉDIO | Verificar quais tokens os conceitos legados definem antes de escrever a cadeia `var(--token, fallback)`; espelhar D-011 do P2 anterior (cadeia var() + `--surface-raised`) | AC-014, precedente D-011 (decisions.md P2 anterior) |
| R5 | Bundle de Recharts pode ser maior que o esperado se o import não for seletivo (`import * as Recharts` vs. `import { BarChart, Bar } from 'recharts'`) | BAIXO | Declarar estratégia de import mínimo explicitamente no plan; medir bundle se possível | Constraints spec.md ("custo de bundle aceito" — dispatch) |

---

## Entrega para plan

**Artefatos de entrada para sdd-plan**:
- `spec.md` (aprovada HITL, 18 ACs EARS, 0 mudanças solicitadas)
- `memory/state.md` (decisões G0–G4, brain recall)
- `memory/handoff-001.md` (este arquivo)
- `memory/decisions.md` (D-001..D-004, durável)
- `memory/learnings.md` (learnings herdados + descobertas desta fase)
- `constitution.md` (reuso do P2 anterior com ajustes de artifacts_dir/branching/test_expectations)

**Próximo passo**: sdd-plan deve produzir o technical design (MetricTile + sparkline-maré via
Recharts, extensão de `mock-catalog.ts`/`selectors.ts`, integração no slot `utility` do Overview),
carregando a skill `dataviz` antes de decidir forma/cor, fechando R1–R5 acima e produzindo
`contrast-audit.md` como artefato separado antes do merge.
