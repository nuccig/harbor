---
title: Ações inline nos cards de sessão — Night Harbor P2.4
status: approved   # gate HITL 2026-07-10 — aprovada sem alterações; derivadas (a)/(b)/(c) confirmadas (KPI Active agents acompanha estado vivo)
created: 2026-07-10
---

# Spec — Ações inline nos cards de sessão (Night Harbor P2.4)

## Problem

Os cards de sessão de agente do Harbor são hoje read-only: mostram agente, tarefa e status, mas
não oferecem nenhuma ação no próprio card. Para o operador, a distância entre *perceber* um estado
(um agente rodando, um resultado pronto) e *agir* sobre ele é infinita — não há como pausar,
retomar ou inspecionar o log de uma sessão sem sair da tela (e, hoje, nem saindo). A tese
control-room adotada como direção de design ("a distância entre ver o problema e agir deve ser
mínima") está declarada e não existe na superfície: este é o gap de execução apontado como P2.4 na
avaliação de design.

## Users & job to be done

Operador do Harbor (desenvolvedor rodando múltiplos agentes de codificação) que, ao ver o estado
de uma sessão num card — no Overview ou no board de Sessions — quer agir imediatamente sobre ela:
pausar um agente que está rodando, retomar um que pausou, ou espiar as últimas linhas de log para
entender o que a sessão fez, sem trocar de tela nem abrir outra superfície. Nesta fase o produto é
uma simulação (mock): as ações manipulam estado simulado, mas o vocabulário de interação — botões,
transições de status, painel de log — precisa nascer com o comportamento e a acessibilidade
definitivos.

## Scope

**In:**
- Ações inline nos cards de sessão nos **dois** pontos de render existentes: o painel "Active
  agent sessions" do Overview e o board do destino Sessions — via o **mesmo componente reusável**
  de ações (decisão G1).
- Matriz status→ações (decisão G3): sessão **Running** oferece *pausar* + *abrir log*; sessão
  **Paused** oferece *retomar* + *abrir log*; sessões **Ready** e **Complete** oferecem apenas
  *abrir log*. Nunca mais que 2 ações por card.
- Novo status de sessão **Paused** no vocabulário de status, exibido no StatusChip com tom de
  atenção (família âmbar), visualmente distinto do tom de sessão ativa (decisão G3).
- Transição pausar⇄retomar como **estado vivo da experiência** (fonte única de estado da
  aplicação, via ação do reducer), refletida de forma consistente nos dois pontos de render e nas
  métricas derivadas de sessão; o catálogo mock permanece congelado como **seed** — nunca é mutado
  em tempo de execução (decisão G3).
- "Abrir log" = painel/drawer **inline** que expande dentro do próprio card, exibindo ~6–10 linhas
  de log fake **determinísticas** por sessão (timestamp fixo + texto da linha), vindas do catálogo
  mock (decisão G2). O painel abre e fecha pelo mesmo controle; conteúdo estático enquanto aberto
  (sem streaming simulado).
- Extensão do catálogo mock com o bloco de linhas de log por sessão (dados fixos, congelados junto
  do restante do seed); as entradas de sessão existentes (ids, agentes, tarefas, statuses do seed)
  permanecem inalteradas.
- Apresentação das ações (decisão G4): icon buttons **sempre visíveis** (sem hover-reveal, sem
  overflow/kebab menu), máximo 2 por card — toggle pausar/retomar + abrir log —, ícones Phosphor,
  `aria-label` obrigatório em cada botão.
- Acessibilidade completa da interação: nome acessível que identifique ação **e** sessão, foco
  visível, operação por teclado, ordem de tab previsível, `aria-expanded` no controle do painel de
  log e associação programática entre controle e painel.
- Respeito à preferência de movimento reduzido (sistema ou setting do app) se a expansão do painel
  de log for animada.
- Não-regressão dos cenários do Overview (carregamento/vazio/erro) e dos demais painéis/destinos.
- Degradação neutra da aparência dos novos controles nos conceitos legados (command-deck,
  signal-poster), por fallback de token, **sem editar nenhum arquivo desses conceitos** — mesmo
  padrão já estabelecido em P2.1/P2.3. (Nota arquitetural, confirmada no código: o Shell é a
  superfície única de produto, renderizada dentro do Layout do conceito ativo via slot — os
  conceitos são wrappers e não têm implementação própria de cards; "não ganham ações" significa
  zero edição nos diretórios deles, com os novos controles degradando visualmente via fallback.)
- Auditoria numérica de contraste (WCAG 2.1 exata, por script) para todo par de cor novo ou
  alterado: chip Paused, estados dos icon buttons (repouso/hover/pressed/disabled/focus), texto do
  painel de log sobre seu fundo efetivo composto.

**Out (explicit non-goals):**
- Backend real: nenhuma integração com processos reais, node-pty, terminal, ou controle real de
  agentes — as ações operam exclusivamente sobre estado simulado.
- Persistência em disco: as transições vivem em memória e se perdem no reload (a nota "Simulated
  data · resets on reload" permanece verdadeira).
- Logs reais ou streaming simulado (linhas chegando com o tempo, tail -f fake, auto-scroll) — o
  log é um bloco fixo e determinístico.
- Filter chips no Activity feed — é P2.5, tema separado.
- Micro-interações de lista (stagger de entrada, press scale em botões) — é P2.6.
- Ações inline em outros cards (issues, projeto, integrações) — esta run é só sessões.
- Outras ações de sessão além de pausar/retomar/abrir log (cancelar, reiniciar, abrir no editor,
  SSH etc.).
- Outros statuses novos além de Paused; mudanças no mapeamento de tone/ícone dos statuses já
  existentes (Running/Ready/Complete) além do necessário para acomodar Paused.
- Overflow/kebab menu, hover-reveal, tooltips como única forma de rotular — decisões fechadas em
  G4 (contra).
- Toast ou entrada no Activity feed a cada pausar/retomar — o feedback é a própria mudança do chip
  e do botão; o Activity feed permanece o fixture estático atual.
- Alterar command-deck/signal-poster para ganharem implementação própria — eles apenas degradam
  para aparência neutra via fallback, sem edição.
- Mudanças no grid/layout do Overview ou do board Sessions além do que o próprio card acomoda
  (ações + painel expandido).

## Constraints

Decisões já fechadas por gates anteriores (grill HITL desta run G1–G4, constitution e precedentes
P2.1–P2.3) — dadas como contexto para esta spec, não reabertas aqui:

- **G1**: ações nos dois pontos de render (Overview + board Sessions), mesmo componente reusável.
- **G2**: "abrir log" é painel/drawer inline expandindo no card; ~6–10 linhas fake determinísticas
  do catálogo mock, cada uma com timestamp + texto.
- **G3**: matriz Running→pausar+log, Paused→retomar+log, Ready/Complete→só log; status novo
  Paused com tom de atenção (âmbar) no StatusChip (par de cor auditado no plan); estado vivo no
  estado da experiência via ação do reducer; catálogo mock permanece congelado como seed.
- **G4**: icon buttons sempre visíveis (máx 2 por card: toggle Pause/Play + log), ícones Phosphor,
  `aria-label` obrigatório; sem hover-reveal, sem overflow menu.
- Botão icon-only exige `aria-label` explícito (learning astryx-iconbutton — precedente do atlas).
- Componentes reusáveis novos seguem o padrão de organização `ui/` já estabelecido (StatusChip,
  MetricTile): consumo de tokens via `var()` com fallback neutro, de forma que os conceitos
  legados degradem sem edição própria.
- Qualquer par de cor novo/alterado passa por auditoria numérica de contraste WCAG 2.1 exata, por
  script, na fase de plan — incluindo estados hover/pressed/disabled dos botões, compondo a cor
  efetiva de tints/opacidades antes de medir (constitution, boundary `always`).
- Testes: asserts de classe por substring (nunca nome exato/hash de CSS module); contagens
  derivadas do fixture, nunca literais soltos (learning css-module-class-asserts — item fixo de
  checklist de review).
- Testes que renderizam o Shell montam Recharts (KPI strip do Overview) — stub completo de
  MediaQueryList obrigatório no setup (learning recharts-jsdom-testing-gotchas).
- Idioma: UI e identificadores em inglês; documentos humanos em pt-BR (constitution).

## Acceptance criteria

Testable statements using EARS patterns — each one should map to a check later.

### Event-driven (WHEN/THEN)

- [ ] **AC-001** — **WHEN** um card de sessão com status Running renderiza (em qualquer dos dois
  pontos de render) **THEN** ele exibe exatamente 2 ações inline sempre visíveis: *pausar* e
  *abrir log*.
- [ ] **AC-002** — **WHEN** um card de sessão com status Paused renderiza **THEN** ele exibe
  exatamente 2 ações inline sempre visíveis: *retomar* e *abrir log*.
- [ ] **AC-003** — **WHEN** um card de sessão com status Ready ou Complete renderiza **THEN** ele
  exibe exatamente 1 ação inline sempre visível: *abrir log* (sem pausar/retomar).
- [ ] **AC-004** — **WHEN** qualquer ação inline renderiza **THEN** ela é um icon button (ícone
  Phosphor) com `aria-label` explícito cujo nome acessível identifica a ação **e** a sessão-alvo
  (distinguível dos botões dos demais cards), sempre visível — sem hover-reveal e sem
  overflow/kebab menu.
- [ ] **AC-005** — **WHEN** o usuário aciona *pausar* numa sessão Running **THEN** o status dessa
  sessão passa a Paused, o StatusChip do card atualiza para o tom de atenção (âmbar) com o rótulo
  Paused, e a ação *pausar* dá lugar a *retomar* no mesmo card.
- [ ] **AC-006** — **WHEN** o usuário aciona *retomar* numa sessão Paused **THEN** o status dessa
  sessão volta a Running, o StatusChip retorna ao tom de sessão ativa, e a ação *retomar* dá lugar
  a *pausar*.
- [ ] **AC-007** — **WHEN** o usuário aciona *abrir log* num card **THEN** um painel inline
  expande dentro do próprio card exibindo o log fake daquela sessão: entre 6 e 10 linhas
  determinísticas vindas do fixture, cada uma com timestamp fixo + texto (nunca geradas em tempo
  de execução, nunca dependentes do relógio real).
- [ ] **AC-008** — **WHEN** o usuário aciona o mesmo controle com o painel de log aberto **THEN**
  o painel fecha e o foco do teclado permanece no controle (não é perdido nem enviado para outro
  lugar).
- [ ] **AC-009** — **WHEN** o controle de log renderiza **THEN** ele expõe `aria-expanded`
  refletindo o estado real do painel (false fechado, true aberto), e o painel é associado
  programaticamente ao controle, com seu conteúdo posicionado após o controle na ordem de leitura.

### Stateful (GIVEN/WHEN/THEN)

- [ ] **AC-010** — **GIVEN** uma sessão foi pausada (ou retomada) num dos pontos de render
  **WHEN** o outro ponto de render exibe a mesma sessão **THEN** ele mostra o mesmo status e a
  mesma ação correspondente (retomar/pausar) — os dois pontos leem a mesma fonte única de estado
  vivo, sem cópias divergentes.
- [ ] **AC-011** — **GIVEN** a única sessão Running foi pausada **WHEN** o tile "Active agents" da
  KPI strip do Overview renderiza **THEN** sua contagem deriva da mesma fonte de estado vivo das
  sessões (refletindo a pausa) — nunca dois números contraditórios sobre as mesmas sessões na
  mesma tela.
- [ ] **AC-012** — **GIVEN** o Overview está no cenário de carregamento, vazio ou erro **WHEN** o
  painel de sessões renderiza **THEN** nenhuma ação inline ou painel de log renderiza, e a
  apresentação desses cenários se comporta exatamente como antes desta feature (sem regressão de
  conteúdo ou estrutura).
- [ ] **AC-013** — **GIVEN** o usuário realizou transições pausar/retomar e abriu painéis de log
  **WHEN** a aplicação recarrega **THEN** todas as sessões voltam ao status do seed do catálogo
  mock — o estado vivo é somente em memória e a nota "resets on reload" permanece verdadeira.

### Conditional (WHERE/WHEN/THEN)

- [ ] **AC-014** — **WHERE** o usuário navega apenas por teclado **WHEN** percorre um card de
  sessão **THEN** cada ação inline é alcançável por Tab numa ordem previsível e consistente entre
  cards (conteúdo do card → pausar/retomar quando presente → abrir log), acionável por teclado, e
  com indicador de foco visível.
- [ ] **AC-015** — **WHERE** a preferência de movimento reduzido está ativa (via sistema ou via
  setting do app) **WHEN** o painel de log abre ou fecha **THEN** nenhuma animação de
  expansão/colapso ocorre (transição instantânea), com conteúdo e funcionalidade idênticos aos do
  modo com movimento.
- [ ] **AC-016** — **WHERE** o conceito visual ativo é um conceito legado (command-deck ou
  signal-poster) **WHEN** os cards de sessão renderizam com as novas ações **THEN** os controles e
  o painel de log degradam para aparência neutra por fallback de token, sem exigir nenhuma edição
  nos arquivos desses conceitos (zero mudanças nos diretórios command-deck/ e signal-poster/).
- [ ] **AC-017** — **WHERE** um par de cor novo ou alterado é introduzido (chip Paused sobre seu
  fundo tintado; icon buttons em repouso/hover/pressed/disabled/focus; texto do log sobre o fundo
  do painel) **WHEN** a feature avança para o plan **THEN** cada par passa por auditoria numérica
  de contraste WCAG 2.1 exata por script antes do merge — mínimo 4,5:1 para texto, mínimo 3:1 para
  elementos não-textuais (ícones dos botões, indicador de foco), medidos contra o fundo efetivo
  composto.

### Continuous (WHILE/THEN)

- [ ] **AC-018** — **WHILE** um painel de log está aberto **THEN** seu conteúdo permanece estático
  — sem linhas novas chegando, sem polling, sem timers, sem qualquer mutação dependente de tempo —
  até o usuário fechá-lo; e o painel de cada card é independente (abrir o log de um card não fecha
  nem altera o de outro).

### Post-condition (AFTER/THEN)

- [ ] **AC-019** — **AFTER** qualquer sequência de transições pausar/retomar **THEN** o catálogo
  mock permanece congelado e inalterado como seed (as entradas de sessão existentes conservam ids,
  agentes, tarefas e statuses originais), e consumidores existentes do catálogo continuam
  funcionando sem mudança.
- [ ] **AC-020** — **AFTER** esta feature ser implementada **THEN** os demais painéis e destinos
  não afetados (projeto atual, fila de issues, KPI strip em sua estrutura, atividade, boards de
  Projects/Issues, navegação, onboarding) continuam se comportando exatamente como antes, com o
  verify gate (lint + typecheck + test) verde e sem regressão dos testes existentes.

## Verification

- Cada AC acima mapeia para verificação automatizada no padrão já usado no projeto: testes de
  render e de interação (user-event: clique/teclado → transição de estado mock), asserts de classe
  por substring, nunca por nome exato/hash de CSS module.
- Contagens usadas em asserts (número de ações por card, número de cards com ações, número de
  linhas do log, contagem do KPI "Active agents" após transição) devem ser **derivadas do
  fixture** em tempo de teste — por exemplo, filtrando as sessões do seed por status para saber
  quantos cards exibem 2 ações — nunca hardcoded como literal solto (constitution + learning
  css-module-class-asserts).
- A matriz status→ações (AC-001..003) é verificada para cada status presente no seed; o estado
  Paused (não presente no seed) é alcançado por interação (user-event no botão pausar), exercitando
  AC-005/006 no mesmo fluxo.
- A consistência entre superfícies (AC-010) é verificada pausando numa superfície, navegando para
  a outra e assertando status + ação — no mesmo teste, sobre a mesma árvore montada.
- Acessibilidade (AC-004, AC-008, AC-009, AC-014) é verificada por queries de papel/nome acessível
  (`getByRole` com name), asserts de `aria-expanded`/associação, e navegação real por teclado com
  user-event — não apenas por presença de atributos.
- Testes que renderizam o Shell montam o Recharts da KPI strip: o setup precisa do stub completo
  de MediaQueryList (learning recharts-jsdom-testing-gotchas) — pré-condição de todo teste novo
  desta feature que monte o Shell inteiro.
- O verify gate (lint + typecheck + test) cobre estrutura, comportamento e não-regressão, mas é
  cego para contraste — a auditoria numérica WCAG (AC-017) é verificação adicional por script,
  obrigatória na fase de plan/antes do merge, nunca substituída pelo verify gate e nunca feita por
  aritmética estimada.
- A não-regressão dos conceitos legados (AC-016) é verificada renderizando os cards sob cada
  conceito ativo e confirmando ausência de qualquer edição nos arquivos desses conceitos no diff.
- Cenários do Overview (AC-012) são verificados exercitando cada cenário já suportado
  (default/loading/empty/error), replicando o padrão de teste existente dos painéis dessa tela.

## Open questions

Nenhuma pendência bloqueante — G1–G4 resolvem as decisões de design necessárias para o plan. Três
comportamentos foram fixados por esta spec por derivação direta das decisões vinculantes e ficam
destacados para o gate de aprovação (ver Proposta): (a) o KPI "Active agents" reflete o estado
vivo (AC-011), consequência de "fonte única de estado" (G3) + "valor derivado, nunca duplicado"
(P2.3 AC-007); (b) painéis de log independentes por card, com conteúdo estático enquanto abertos
(AC-018); (c) o estado aberto/fechado do painel de log é disclosure local de UI — apenas o status
da sessão é estado de domínio compartilhado; a spec não exige que um painel aberto persista ao
navegar entre destinos. Detalhes de copy exata (texto dos `aria-label`, conteúdo das linhas de
log, formato do timestamp) ficam a critério do `sdd-plan`, seguindo o padrão de copy em inglês já
estabelecido.

## References

- `.orquestrador/night-harbor-ui-design/proposta-melhorias-001.md` §1 (tese control-room — "a
  distância entre ver o problema e agir deve ser mínima"; Shell read-only como gap), §3 item 3
  (padrão Botrix de ações inline nos cards, adaptado), §4 linha P2.4 (origem desta feature).
- `.orquestrador/night-harbor-p2-inline-actions/memory/state.md` — decisões vinculantes G1–G4 do
  grill HITL (2026-07-10) e brain recall (learnings astryx-iconbutton, css-module-class-asserts,
  recharts-jsdom-testing-gotchas, contrast-math-by-script).
- `.orquestrador/night-harbor-p2-kpi-strip/spec.md` — precedente de formato e dos padrões de
  cenário/fallback/verificação reutilizados aqui (AC-010..012 de cenários; AC-014 de degradação
  legada; counts de fixture).
- `src/renderer/src/shell/Shell.tsx` — os dois pontos de render de sessão: painel "Active agent
  sessions" do Overview (slice via selector, com cenários) e board do destino Sessions (leitura
  direta do catálogo — ponto que passará a ler a fonte de estado vivo).
- `src/renderer/src/app/mock-catalog.ts` — seed congelado (3 sessões: Running/Ready/Complete) a
  estender com o bloco de log determinístico por sessão.
- `src/renderer/src/app/experience-model.ts` — estado da experiência + reducer onde o estado vivo
  de sessão passa a morar (G3).
- `src/renderer/src/app/selectors.ts` — `isSessionActive` (fonte única de "ativo", já compartilhada
  entre KPI e tone mapping — base do AC-011) e o padrão de cenários do Overview.
- `src/renderer/src/App.tsx` + `src/renderer/src/concepts/registry.ts` — arquitetura confirmada:
  Shell único renderizado no slot `product` do Layout do conceito ativo; conceitos são wrappers
  sem implementação de cards (base do AC-016).
- `src/renderer/src/ui/StatusChip.tsx` e `src/renderer/src/ui/index.ts` — primitives existentes
  (StatusChip com tones success/warning/danger/neutral; Button; SemanticIcon) e o padrão `ui/` que
  o componente de ações seguirá.
- `docs/adr/0014-night-harbor-statuschip-color-scheme.md` — metodologia de auditoria numérica de
  contraste reaplicada ao tom Paused e aos estados dos icon buttons.

## Riscos / Dependências

- **Recharts em testes do Shell**: qualquer teste novo que monte o Shell inteiro monta a KPI strip
  (Recharts) — sem o stub completo de MediaQueryList o teste quebra de forma opaca. Pré-condição
  de setup herdada do P2.3 (learning registrado; já citado na constitution).
- **Pares de cor novos**: tom Paused (âmbar de atenção) sobre fundo tintado do chip, estados dos
  icon buttons (incl. hover/pressed/disabled/focus) e texto do log sobre o fundo do painel exigem
  auditoria numérica WCAG por script no plan — o verify gate não detecta contraste.
- **Ambiguidade âmbar Ready × Paused**: o status Ready já usa hoje o tom warning (família âmbar).
  Com Paused também âmbar (G3), dois statuses vizinhos compartilham família de cor — a regra
  color-not-only é atendida por rótulo + ícone, mas o plan deve garantir diferenciação clara (no
  mínimo ícones distintos) e validar os dois pares de contraste.
- **Convergência das duas superfícies**: hoje o board Sessions lê o catálogo mock diretamente e o
  Overview lê via selector com cenários — ambas precisam passar a derivar da mesma fonte de estado
  vivo (AC-010), com risco de deriva se a derivação for duplicada (precedente: `isSessionActive`
  foi centralizado exatamente para evitar isso).
- **Acoplamento com a KPI strip**: pausar a única sessão Running muda a contagem de "Active
  agents" (AC-011) — testes existentes do KPI que derivem contagem do fixture continuam válidos,
  mas novos testes de interação precisam derivar a contagem do estado pós-transição, não do seed.
- **Branch stacked**: esta run empilha sobre feat/night-harbor-p2-kpi-strip (PR #7 → #6, cadeia
  #2 ← #4 ← #5 ← #6 ← #7) — mudanças no PR base podem exigir rebase da cadeia antes do merge.
- **Dependências**: nenhuma dependência nova prevista — Phosphor (ícones), motion/react
  (reduced-motion em 3 camadas) e o padrão `ui/` já existem. Se o plan concluir precisar de
  pacote novo, é `ask_first` pela constitution.
