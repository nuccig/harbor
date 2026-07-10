---
title: KPI strip no Overview — Night Harbor P2.3
status: draft
created: 2026-07-10
---

# Spec — KPI strip no Overview (Night Harbor P2.3)

## Problem

O Overview do Harbor hoje resume "uso recente" como uma lista de texto corrido (rótulo + valor),
sem nenhuma hierarquia visual que comunique o estado operacional dos agentes num relance. Para
saber quantos agentes estão ativos, quão cheia está a fila de issues, ou como andam os resultados
recentes, o operador precisa ler frases — não há um "olhar rápido" possível. A decisão de design
Night Harbor promete numerais grandes de destaque (papel tipográfico de métrica) e a metáfora
"luzes/ondulação do porto" como textura de dado, mas isso ainda não existe na tela: o gap não é de
direção de design, é de execução (vocabulário de componentes ausente).

## Users & job to be done

Operador do Harbor (desenvolvedor rodando múltiplos agentes de codificação) que abre o Overview
querendo, num único olhar, avaliar a saúde operacional do workspace: quantos agentes estão ativos,
quão cheia está a fila de trabalho, quão bem-sucedidas as execuções recentes têm sido, e quanto
tempo os agentes têm consumido — sem precisar interpretar texto corrido para chegar a essas
respostas.

## Scope

**In:**
- Uma KPI strip no Overview com exatamente 4 tiles, nesta ordem semântica: agentes ativos, fila
  (issue queue), taxa de sucesso, tempo de agente ("agent time").
- Cada tile mostra um numeral de destaque (papel tipográfico de métrica já definido no design
  system) e uma micro-visualização estática do tipo "maré" (sparkline) que dá textura de dado sem
  acrescentar informação textual nova — puramente decorativa-informativa, com o valor real sempre
  comunicado pelo numeral e por um rótulo acessível.
- A KPI strip substitui o painel "Recent usage" na mesma tela (essa lista de texto corrido deixa
  de aparecer no Overview).
- Extensão dos dados mock com um bloco de KPIs: valor de cada métrica e uma série curta e fixa
  (determinística) por métrica, usada para desenhar a sparkline — sem números aleatórios, para
  permitir testes reprodutíveis.
- Onde a métrica já existe implicitamente nos dados atuais do Overview (contagem de sessões de
  agente, contagem de issues na fila, o valor hoje exibido como "Agent time"), o tile exibe um
  valor derivado dessa fonte existente — nunca um número duplicado à parte.
- Onde a métrica não tem hoje nenhuma representação (taxa de sucesso), o valor vem de dado novo
  incluído no fixture para esse fim.
- O bloco de dados hoje usado pelo painel "Recent usage" permanece disponível no catálogo mock
  (não é removido), para não quebrar quem ainda referencia esses dados.
- Comportamento da KPI strip nos estados de carregamento, vazio e erro do Overview, de forma
  consistente com o padrão já usado pelos demais painéis dessa tela.
- Contraste e legibilidade da sparkline como elemento não-textual, e do numeral como texto,
  auditados numericamente (WCAG 2.1 exato) antes do merge.
- Rótulo textual acessível por tile, identificando a métrica (o significado do número não pode
  depender só de posição ou cor).
- Sparkline estática (sem animação, sem loop) — segura para reduced-motion por construção, sem
  precisar de lógica dedicada de "desligar motion".
- Degradação neutra da aparência dos tiles nos conceitos legados (command-deck, signal-poster),
  sem exigir edição desses conceitos.

**Out (explicit non-goals):**
- Ações inline ou interatividade nos tiles (drill-down, filtro, clique) — inline actions nos cards
  de sessão é P2.4, tema separado.
- Dados reais ou telemetria — tudo permanece mock/fixture determinístico; integração com dado real
  é assunto de escopo futuro, fora desta feature.
- Séries de tempo reais, gráficos históricos completos, ou segmented control temporal
  (Daily/Weekly/Monthly) — isso é P3.
- Annotation callouts sobre o gráfico (ex.: "+24% pico de atividade") — também P3.
- Qualquer animação da sparkline (transição de dado, loop) — decisão fechada: estática.
- Mudanças no vocabulário/mapeamento de tone e ícone do StatusChip, ou no vocabulário da nav — já
  entregues em P2.1/P2.2, não reabertos aqui.
- Novo layout de grid do Overview além de tomar o lugar do painel "Recent usage" — a estrutura de
  slots/grid do Overview permanece intacta.
- Estender a KPI strip a outras superfícies (Settings, Projects, Sessions, Issues) — esta run é
  Overview apenas.
- Alterar command-deck/signal-poster para ganharem a mesma feature — eles apenas degradam para
  aparência neutra via fallback, sem receber implementação própria.

## Constraints

Decisões já fechadas por gates anteriores (grill HITL desta run e da run precedente) — dadas como
contexto para esta spec, não reabertas aqui:

- Exatamente 4 KPIs, na ordem: agentes ativos, fila, taxa de sucesso, tempo de agente.
- A sparkline usa Recharts (biblioteca de gráficos SVG) — dependência nova já aprovada via HITL
  para este propósito (renderização testável em ambiente de teste headless); é um dado desta spec,
  não uma escolha introduzida por ela.
- A sparkline tem entre 8 e 12 pontos de dado (barras), tokens de accent com opacidade, e é
  marcada como decorativa para leitores de tela.
- O componente reutilizável de tile segue o mesmo padrão de organização (pasta `ui/`) já
  estabelecido pelo componente de status da run anterior — consumindo tokens de cor via `var()`
  com fallback neutro, de forma que os conceitos legados degradem sem precisar de edição própria.
- Qualquer par de cor novo (numeral sobre fundo do tile; marcas da sparkline sobre o fundo efetivo
  composto) precisa de auditoria numérica de contraste WCAG 2.1 exata, feita por script — nunca
  por estimativa. Sparkline é elemento não-textual: mínimo 3:1 contra o fundo efetivo (a cor
  composta de tints/opacidades sobrepostas, não apenas a superfície base).
- Os papéis tipográficos e tokens de ícone/peso/estado (numeral de métrica, pesos, tamanhos de
  ícone, cores de sucesso/atenção, tokens de motion) já existem no design system — esta feature os
  reutiliza, não os redefine.
- Testes que envolvem contagens (ex.: número de tiles, número de itens na fila) devem ler a
  contagem a partir do fixture, nunca hardcode um número solto — para não quebrar silenciosamente
  quando o fixture mudar.

## Acceptance criteria

Testable statements using EARS patterns — each one should map to a check later.

### Event-driven (WHEN/THEN)

- [ ] **AC-001** — **WHEN** o Overview renderiza no estado "pronto" (dados disponíveis) **THEN**
  a KPI strip exibe exatamente 4 tiles, nesta ordem: agentes ativos, fila, taxa de sucesso, tempo
  de agente.
- [ ] **AC-002** — **WHEN** a KPI strip renderiza **THEN** ela ocupa o lugar do painel "Recent
  usage" no Overview (esse painel de texto corrido deixa de aparecer nessa tela).
- [ ] **AC-003** — **WHEN** um tile de KPI renderiza **THEN** ele expõe um rótulo textual que
  identifica a métrica (por exemplo, "agentes ativos"), associado ao numeral, de forma que o
  significado do número não dependa apenas de posição ou cor.
- [ ] **AC-004** — **WHEN** um tile de KPI renderiza **THEN** seu numeral de destaque usa o papel
  tipográfico de métrica do design system (dígitos monoespaçados/tabulares), de forma que o
  número não desloque o layout ao mudar de valor.
- [ ] **AC-005** — **WHEN** um tile de KPI renderiza **THEN** ele exibe, junto ao numeral, uma
  sparkline-maré estática construída a partir de uma série fixa e determinística de dados do
  próprio fixture (nunca gerada aleatoriamente em tempo de execução).
- [ ] **AC-006** — **WHEN** a sparkline-maré renderiza **THEN** ela é marcada como decorativa para
  tecnologia assistiva, já que o valor real da métrica é comunicado pelo numeral e pelo rótulo
  acessível do tile, não pela sparkline em si.
- [ ] **AC-007** — **WHEN** o valor de uma métrica já existe implicitamente nos dados do Overview
  hoje (contagem de sessões de agente, contagem de issues na fila, o valor atualmente exibido como
  "Agent time") **THEN** o tile correspondente exibe um valor derivado dessa fonte existente, e
  não um número duplicado à parte.
- [ ] **AC-008** — **WHEN** uma métrica não tem hoje nenhuma representação no catálogo de dados
  (taxa de sucesso) **THEN** seu valor vem de dado novo incluído no fixture para esse fim.
- [ ] **AC-009** — **WHEN** um par de cor novo é usado num tile (numeral sobre o fundo do tile,
  marcas da sparkline sobre o fundo efetivo composto) **THEN** esse par passa por auditoria
  numérica de contraste WCAG 2.1 exata antes do merge — mínimo 4,5:1 para o numeral (texto),
  mínimo 3:1 para a sparkline (elemento não-textual), medidos contra o fundo efetivo e não apenas
  contra a superfície base.

### Stateful (GIVEN/WHEN/THEN)

- [ ] **AC-010** — **GIVEN** o Overview está no cenário de carregamento **WHEN** a seção de KPIs é
  solicitada **THEN** ela exibe um estado de carregamento consistente com o padrão já usado pelos
  demais painéis do Overview (sem numeral ou sparkline calculados a partir de dado incompleto).
- [ ] **AC-011** — **GIVEN** o Overview está no cenário vazio **WHEN** não há dado de KPI
  disponível **THEN** a seção exibe um estado vazio consistente com o padrão já usado pelos demais
  painéis do Overview.
- [ ] **AC-012** — **GIVEN** o Overview está no cenário de erro **WHEN** os dados de KPI falham ao
  carregar **THEN** a seção exibe um estado de erro com ação de recuperação, consistente com o
  padrão já usado pelos demais painéis do Overview.

### Conditional (WHERE/WHEN/THEN)

- [ ] **AC-013** — **WHERE** o conceito visual ativo é night-harbor **WHEN** os tiles de KPI
  renderizam **THEN** as cores do numeral e da sparkline resolvem para os tokens da paleta Night
  Harbor já existentes (sucesso/atenção/accent).
- [ ] **AC-014** — **WHERE** o conceito visual ativo é um conceito legado (command-deck ou
  signal-poster) **WHEN** os tiles de KPI renderizam **THEN** eles degradam para uma aparência
  neutra por fallback, sem exigir nenhuma edição nesses conceitos.
- [ ] **AC-015** — **WHERE** o usuário está com preferência de "movimento reduzido" ativa ou
  inativa **WHEN** a KPI strip renderiza **THEN** o comportamento visual da sparkline é idêntico
  em ambos os casos, por já ser estática por construção (nenhuma lógica dedicada de motion é
  necessária).

### Continuous (WHILE/THEN)

- [ ] **AC-016** — **WHILE** a KPI strip está visível **THEN** a sparkline-maré permanece estática
  — sem transição, loop, ou qualquer mutação dependente de tempo ou de hover — durante toda a
  sessão de uso.

### Post-condition (AFTER/THEN)

- [ ] **AC-017** — **AFTER** a KPI strip substituir o painel "Recent usage" no Overview **THEN**
  o bloco de dados hoje usado por esse painel permanece definido no catálogo mock, inalterado,
  preservando compatibilidade com qualquer outro consumidor existente.
- [ ] **AC-018** — **AFTER** esta feature ser implementada **THEN** os demais painéis do Overview
  não afetados por esta mudança (projeto atual, sessões de agente, fila de issues, atividade)
  continuam se comportando exatamente como antes, sem regressão de conteúdo ou de estrutura de
  cenário (carregamento/vazio/erro).

## Verification

- Cada AC acima mapeia para um teste de render (padrão já usado no projeto: assert de classe por
  substring, nunca por nome de classe exato/hash de CSS module).
- Contagens usadas em asserts de teste (número de tiles, número de itens de fila, tamanho da série
  da sparkline) devem ser lidas do fixture (mock-catalog) em tempo de teste, nunca hardcoded como
  literal solto — para não mascarar uma quebra silenciosa se o fixture mudar.
- O verify gate (lint + typecheck + test) cobre estrutura, comportamento e não-regressão, mas é
  cego para contraste de cor — a auditoria numérica WCAG (AC-009) é uma verificação adicional,
  feita por script, obrigatória antes do merge e não substituída pelo verify gate.
- Os estados de cenário (AC-010 a AC-012) são verificados exercitando cada cenário do Overview já
  suportado pela aplicação (carregamento/vazio/erro/pronto), replicando o padrão de teste já usado
  para os demais painéis dessa tela.
- A degradação em conceitos legados (AC-014) é verificada renderizando os tiles sob cada conceito
  ativo e confirmando ausência de edição nos arquivos desses conceitos.

## Open questions

Nenhuma pendência bloqueante — as decisões G1–G4 do grill HITL desta run resolvem os pontos de
design necessários para avançar ao plan (quais 4 KPIs, substituição do painel, dependência de
gráfico aprovada, padrão de fallback nos conceitos legados). Detalhes de copy exata (rótulos de
carregamento/vazio/erro, texto do rótulo acessível de cada tile) ficam a critério do `sdd-plan`,
seguindo o padrão de copy já estabelecido para os demais painéis do Overview.

## References

- `proposta-melhorias-001.md` §3 (padrões transferíveis da Botrix — KPI strip com numeral +
  micro-viz "waveform", "data texture without added complexity"), §4 linha P2.3, §5 riscos
  (sparkline decorativa-informativa, estática, reduced-motion-safe por construção).
- `design.md` §3 (tipografia — papel de numeral de métrica, eixo MONO), §5 (animação — duração,
  easing, exit<enter, reduced-motion em três camadas), §6 (acessibilidade, color-not-only), §7
  (layout/grid do Overview).
- `.orquestrador/night-harbor-p2-statuschip-nav/memory/state.md` — precedentes do P2 anterior:
  decisão G4 (fallback neutro em conceitos legados via `var()`, sem editar concepts legados),
  padrão de teste (class asserts por substring, counts do fixture), metodologia de auditoria
  numérica de contraste (aprendida após erro de aritmética estimada na run anterior).
- `docs/adr/0014-night-harbor-statuschip-color-scheme.md` — metodologia de auditoria de contraste
  (WCAG exato por script) reaplicada nesta feature para o par numeral/tile e sparkline/fundo.
- `src/renderer/src/ui/StatusChip.tsx` — padrão de componente `ui/` a seguir (consumo de tokens
  via `var()`, fallback para conceitos legados).
- `src/renderer/src/app/mock-catalog.ts`, `src/renderer/src/app/selectors.ts` — fixture atual do
  Overview (sessions, issueQueue, recentUsage) e o padrão de estados de cenário
  (pronto/carregamento/vazio/erro) que a KPI strip precisa seguir.
- Referência externa: Botrix — AI Command Center Dashboard (Orbix Studio, Dribbble), citada em
  `proposta-melhorias-001.md` como origem do padrão "KPI strip com waveform".
