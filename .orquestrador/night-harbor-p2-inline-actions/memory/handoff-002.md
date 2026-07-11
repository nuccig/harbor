# Handoff: plan → tasks

**Feature**: night-harbor-p2-inline-actions
**Data**: 2026-07-10
**De**: plan (aprovado HITL, 4 ADRs, override #4)
**Para**: tasks (sdd-tasks)
**Controlador**: handoff-agent

---

## Decisões tomadas

Nenhuma decisão nova nesta fase — handoff é roteamento/transferência de contexto, não fase de
design. Verifiquei `memory/decisions.md`: já contém D-008..D-012 (decisões do gate do plan,
VINCULANTES) integralmente registradas, com override #4/D-011 explícito e referência aos 4
ADRs. **Nenhuma atualização em `decisions.md` nesta fase** — nada do gate ficou sem registrar.

---

## Alternativas descartadas

Não reabrir no tasks (já fechadas em ADR + gate HITL, ver plan.md "Alternativas considered" de
cada ADR):

- **`SessionCard` em `shell/`** — era a recomendação ORIGINAL do próprio plan (evitar
  dependência `ui/`→`app/`); revertida por override do usuário no gate (D-011/ADR-0004). Um
  tasks-agent ou implement-agent que não tenha lido o ADR pode instintivamente "corrigir" para
  a recomendação original — **não fazer isso**, é o override vinculante.
- **`SessionCard` importando tipos/helpers de `app/`** (ADR-0004, alternativa rejeitada) —
  mesmo raciocínio: tentação natural de reduzir a duplicação estrutural de tipos entre
  `SessionCardLogLine` e `SessionLogLine` importando um do outro. Rejeitado deliberadamente —
  compatibilidade é ESTRUTURAL (TS), não por import.
- **5º tone `attention`** para Paused (ADR-0002) — Paused é `warning` + ícone `Pause`.
- **`:hover` novo** nos icon buttons, app-wide ou só nesta feature (ADR-0003) — hover ≡ repouso.
- **Overrides esparsos `Record<string,status>`** ou **snapshot completo de sessões no estado**
  (ADR-0001) — shape do estado vivo é o set esparso `pausedSessionIds`, fechado.
- **Ação de reducer genérica `setSessionStatus`** (ADR-0001) — só existe `toggleSessionPaused`.
- **Painel sempre montado com `hidden`** e **animação via `motion/react`** (ADR-0004) — painel é
  condicional no DOM, animação é keyframes CSS + classe condicional.
- Todo o `spec.md` §"Out (explicit non-goals)" segue vigente (kebab/overflow menu, toast/
  activity feed a cada ação, logs reais/streaming, backend real, novos statuses além de Paused)
  — não é escopo desta feature, tasks não deve criar tasks para nada disso.

---

## Suposições validadas

- `memory/decisions.md` está completo e coerente com plan.md/state.md — D-008 a D-012 cobrem
  todas as 6 resoluções do gate ("Proposta para aprovação — RESOLVIDA" no plan.md), sem gap.
- Os 4 ADRs (`adr/0001..0004`) estão todos `status: accepted` (0004 com `amended` registrando o
  override) — nenhum ADR ficou em rascunho ou pendente.
- `plan.md §Task decomposition preview` existe e está completo: partição T1→T2→T3, file scopes,
  coluna "Depende de", coluna de símbolos expostos, e a nota de recomendação sequencial com
  justificativa (R6) — é a base literal desta seção do handoff, não precisei inferir a partição.
- **Confirmado por leitura de `eslint.config.mjs`** (raiz do repo): a config é só
  `tseslint.configs.recommended`, sem nenhuma regra de import boundary (`import/no-restricted-
  paths`, `eslint-plugin-boundaries` ou equivalente). Isso significa que a restrição "zero
  imports de `app/` em `ui/SessionCard.tsx`" (D-011/ADR-0004) **não é pega automaticamente pelo
  verify gate** — é checagem manual de review, como o próprio ADR-0004 já nomeia ("finding
  automático" ali quer dizer "achado óbvio de revisor", não "bloqueado por tooling"). Ver
  "Riscos transferidos" abaixo — isso muda a ação recomendada para o tasks-agent.
- File scopes das 3 tasks são disjuntos par a par (conferido linha a linha na tabela do plan) —
  nenhum arquivo aparece em duas tasks.
- Nenhuma das 3 tasks toca `concepts/**` ou `tests/renderer/setup.ts` — confirmado pela tabela e
  pelo texto logo abaixo dela no plan.md.

---

## Suposições invalidadas

Nenhuma suposição factual quebrou nesta fase. O único reversal foi de **recomendação de
design**, não de suposição: o plan recomendou `shell/` para o componente; o gate HITL fez
override para `ui/` (D-011). Isso já está registrado como decisão vinculante — não é uma
suposição que se provou errada, é uma escolha que o usuário tomou deliberadamente contra a
recomendação técnica (a objeção que motivou a recomendação — mapping duplicado — foi mitigada
por outro meio, ver ADR-0004 Consequences).

---

## Descobertas inesperadas

1. **O acoplamento T1↔T2 é assimétrico e vale a pena nomear explicitamente**: o COMPONENTE de
   T2 (`ui/SessionCard.tsx`) tem zero dependência declarada de T1 (tipos próprios,
   estruturalmente compatíveis) — mas o TESTE de T2 (`tests/renderer/ui/session-card.test.tsx`)
   importa `selectSessionViews`/`sessionActionLabels` de `app/selectors` (símbolos de T1) para
   derivar props e nomes acessíveis sem hardcode (regra `css-module-class-asserts`). Isso quer
   dizer que **o acoplamento não é do produto, é do arnês de teste** — uma distinção que o
   tasks-agent precisa preservar ao escrever os arquivos de task (não implica que o componente
   dependa de T1 em runtime).
2. **O plan já deixou uma saída para paralelizar T1∥T2, mas com uma condição explícita**: "se o
   unit test de T2 usar fixture local em vez do de T1" (plan.md, nota abaixo da tabela de
   decomposição). Ou seja, a decomposição em tasks TEM um grau de liberdade real aqui — não é
   sequencial por impossibilidade técnica, é sequencial por RECOMENDAÇÃO (evitar reescrever o
   teste de T2 com fixture duplicada). O tasks-agent decide; se optar por paralelizar, precisa
   também decidir explicitamente entre (a) fixture local duplicada no teste de T2, ou (b) manter
   o import de T1 e aceitar o verify gate combinado antes de qualquer PASS.
3. **A composição single-pass em `selectOverviewView`** (`const sessions = selectSessionViews
   (state); …sessions: selectScenarioSlice(state, sessions, …), kpis:
   selectScenarioSlice(state, buildKpiViewModels(sessions), …)`) vive inteira dentro de
   `selectors.ts`, ou seja, dentro do file scope único de T1 — não há acoplamento entre tasks
   nesse ponto específico, apesar de ele costurar 3 símbolos (`selectSessionViews`,
   `buildKpiViewModels`, `selectScenarioSlice`) que poderiam parecer três preocupações
   separadas. Vale como nota de clareza para quem escrever a task file de T1: é uma única
   mudança coesa num único arquivo, não 3 sub-mudanças a dividir.
4. **Contagem de log lines (8/7/9) é testada em DOIS arquivos por DOIS motivos diferentes**: em
   `selectors.test.ts` (T1) como invariante do fixture (todo id tem bloco 6–10, timestamps
   únicos) — teste de dados; em `session-card.test.tsx` (T2) como contagem de itens renderizados
   no painel aberto (`logLines.length`) — teste de render. Mesma constante de fixture, dois
   testes com propósitos distintos; útil para o tasks-agent não colapsar isso numa task só
   achando que é redundante.

---

## Raciocínio comprimido (dead ends)

Nenhum dead end de exploração de código nesta fase — não fiz pesquisa nova no codebase além de
uma checagem pontual (`eslint.config.mjs`, ver Suposições validadas). Um ponto considerado e
descartado na escrita deste próprio handoff: reproduzir os blocos de código dos contratos
(interfaces TS, corpo dos selectors, bloco CSS completo) aqui dentro — descartado a favor de
apontar as seções do `plan.md` (evita uma segunda fonte de verdade que pode divergir do plan.md
se este for ajustado num fix-loop posterior; ver "Copy exata e contratos" abaixo).

---

## Contexto que a próxima fase PRECISA

### Partição T1→T2→T3 (plan.md §"Task decomposition preview")

| Task | Escopo de arquivos (disjunto) | Depende de | Símbolos/fixtures expostos |
| --- | --- | --- | --- |
| **T1 — estado vivo + fixture de log + view model resolvido** | `app/experience-model.ts`, `app/mock-catalog.ts`, `app/selectors.ts`, `tests/renderer/model/experience-model.test.ts`, `tests/renderer/model/selectors.test.ts` | — | `toggleSessionPaused`, `pausedSessionIds`, `SessionLogLine`, `mockCatalog.sessionLogs`, `SessionRuntimeStatus`, `StatusTone`, `SessionViewModel` (enriquecido), `selectSessionViews`, `sessionActionLabels`, `buildKpiViewModels(sessions)` |
| **T2 — SessionCard (ui/) + CSS + unit tests** | `ui/SessionCard.tsx` (create), `ui/primitives.module.css`, `ui/index.ts`, `tests/renderer/ui/session-card.test.tsx` | Componente: **ninguém** (tipos próprios, zero imports de `app/`). Teste unit: **T1** (`selectSessionViews`/`sessionActionLabels`/fixture de log) | `SessionCard`, `SessionCardProps`, `SessionCardLogLine`, classes `.sessionCard`/`.sessionLog*` |
| **T3 — integração das superfícies + hook + testes de integração** | `shell/Shell.tsx`, `shell/shell.module.css` (`.sessionList`), `app/use-reduced-motion.ts`, `App.tsx`, `tests/renderer/shell/inline-actions.test.tsx` | **T1 + T2** | `useEffectiveReducedMotion`, classe `.sessionList` |

**Por que SEQUENCIAL T1→T2→T3 é a recomendação do plan (R6)**: o override #4 desacoplou o
COMPONENTE de T2 do runtime de `app/` (props resolvidas, zero import), mas o UNIT TEST de T2
deriva props/labels de `selectSessionViews`/`sessionActionLabels`/`mockCatalog.sessionLogs`
(símbolos de T1), e T3 importa de T1 e de T2 diretamente. O acoplamento de símbolo persiste via
testes/integração mesmo com o componente desacoplado. Se o tasks-agent decidir paralelizar
T1∥T2 (viável só se o teste de T2 usar fixture LOCAL em vez do fixture de T1 — ver Descoberta
#2), **o verify gate roda na árvore COMBINADA antes de qualquer PASS** — não é opcional, é
`boundaries.always` da constitution (ver próxima seção). T3 depende estritamente dos dois, então
não há discussão de paralelizar T3 com T1 ou T2.

### Regras da constitution que viram requisitos de task (não sugestões)

Ler `constitution.md §boundaries.always` e `§test_expectations` na íntegra ao escrever cada task
file; os pontos com maior probabilidade de virar acceptance criteria explícitos:

- **Joint verify gate para acoplamento de símbolo entre tasks paralelas** (`boundaries.always`,
  linha "tasks paralelas com acoplamento de símbolo/fixture…", learning
  `parallel-tasks-symbol-coupling`) — se QUALQUER par de tasks for marcado para execução
  paralela (não só T1/T2), a task file precisa declarar explicitamente o passo de verify gate
  na árvore combinada como pré-requisito de PASS, não como nice-to-have.
- **Class asserts por substring, nunca hash/nome exato de CSS module** (`test_expectations`,
  learning `css-module-class-asserts`) — aplica-se concretamente a: `statusChip_warning`
  (Ready e Paused, ADR-0002 Consequences), `sessionLogAnimated` presente/ausente conforme
  `reduceMotion` (plan §Test strategy, session-card.test.tsx). Item fixo de checklist de review
  em todo diff de teste desta run — vale repetir isso na task file de T2 e T3, não só confiar no
  review posterior.
- **Counts sempre derivados do fixture, nunca literais soltos** (mesmo learning) — contagem de
  botões por card (`canTogglePause ? 2 : 1`), contagem de linhas de log (`logLines.length`),
  contagem do KPI "Active agents" antes/depois de pausar (`running.length` /
  `running.length - 1`, `running` filtrado por `isSessionActive` do fixture). Nenhuma task deve
  hardcodar esses números nos testes.
- **Zero edição em `concepts/**`** (AC-016, constitution boundary "editar arquivos fora do
  escopo disjunto da task" e `never`) — nenhuma das 3 tasks toca esse diretório; se alguma
  precisar tocar, é desvio de escopo que exige `ask_first`, não uma correção silenciosa.
- **`tests/renderer/setup.ts` intocado** — o plan provou empiricamente (185/185 verde sem stub
  de matchMedia nesta fase) que a nota da constitution sobre "stub completo de MediaQueryList
  obrigatório" (recharts-jsdom-testing-gotchas) está superada para o caminho default; o único
  stub necessário é LOCAL a testes que forcem `matches: true` (AC-015 caminho sistema), com o
  shape documentado em plan.md §Test strategy. Nenhuma task deve reintroduzir stub global em
  `setup.ts` — se um teste falhar por matchMedia, o stub vai no próprio arquivo de teste, não em
  `setup.ts`.
- **Review numérico de contraste já FEITO na fase de plan**, não é responsabilidade das tasks —
  `memory/contrast-audit.md` (33 pares, 0 falhas, reconfirmado pelo controller) é o artefato de
  evidência; as tasks devem implementar EXATAMENTE os tokens especificados no plan (`--canvas`,
  `--ink`, `--ink-muted`, tone `warning`, sem `:hover` novo) — não introduzir cor nova nem
  re-julgar contraste por olho. Se uma task file sentir necessidade de mudar um token de cor, é
  desvio que precisa voltar ao gate, não uma decisão de implementação.

### Copy exata e contratos já fixados no plan (referenciar, não repetir os blocos)

Os contratos completos (interfaces TypeScript, corpo dos selectors, DOM do SessionCard, bloco
CSS) estão em `plan.md §"Data & contracts"` — a task file de cada task deve referenciar essas
subsecões (`### experience-model.ts…`, `### mock-catalog.ts…`, `### selectors.ts…`,
`### ui/SessionCard.tsx…`, `### CSS novo…`) em vez de copiá-las de novo, para não criar uma
terceira cópia que possa divergir se o plan for corrigido num fix-loop.

Exceção deliberada — os 3 templates de `aria-label` e o formato de timestamp (D-012) são curtos
e altamente sensíveis a erro de transcrição, por isso reproduzo aqui como referência rápida (a
fonte de verdade continua sendo `plan.md §"selectors.ts"` função `sessionActionLabels`):

- `Pause session {agent}: {task}`
- `Resume session {agent}: {task}`
- `Session log for {agent}: {task}`
- Timestamp: `HH:MM:SS`, 24h, fixo (nunca relógio real), único por sessão (é a `key` do React)
- Contagem de linhas por sessão no fixture: 8 (`session-104`), 7 (`session-103`), 9
  (`session-102`) — variadas de propósito, dentro do intervalo 6–10

Essas strings/números só têm uma fonte de verdade (`plan.md`); se a task file de T1 precisar do
texto completo das 24 linhas de log, deve copiar de `plan.md §"mock-catalog.ts"`, não inventar
nem parafrasear.

### Arquivos de teste — mapeamento rápido (plan.md §"Test strategy")

4 arquivos: 2 novos (`tests/renderer/ui/session-card.test.tsx` em T2,
`tests/renderer/shell/inline-actions.test.tsx` em T3) + 2 estendidos
(`tests/renderer/model/experience-model.test.ts` e `tests/renderer/model/selectors.test.ts`,
ambos em T1). O mapeamento AC→teste está todo enumerado em plan.md §Test strategy — a task file
de cada task deve linkar os ACs cobertos por ela (T1 cobre AC-001..003/013/017 parcial/019
parcial; T2 cobre AC-001..004/007..009/018 no nível de componente; T3 cobre AC-005/006/010..012/
014/015/018 no nível de integração) em vez de repetir a lista completa de bullets do plan.

### O que NÃO pode ser reaberto nesta fase

- **D-008..D-012** (todas em `memory/decisions.md`, gate HITL 2026-07-10) — vinculantes, sem
  exceção. Em particular **D-011 (override do usuário)**: localização `ui/`, zero imports de
  `app/` no componente, mapping de domínio 100% centralizado em `selectSessionViews`. Qualquer
  task file que reintroduza import de `app/` em `ui/SessionCard.tsx`, ou que mova parte do
  mapping (matriz status→ações, tone, labels, lookup de log) para dentro do componente ou para
  os call sites do Shell, contraria D-011 diretamente — não é um detalhe de implementação em
  aberto.
- **D-008** (shape do estado: set esparso `pausedSessionIds`, não Record nem snapshot).
- **D-009** (Paused = `warning` + ícone `Pause`, sem 5º tone).
- **D-010** (sem `:hover` novo nos icon buttons).
- **D-012** (copy exata — ver seção acima).
- Por extensão, tudo em `spec.md §"Out"` continua fora de escopo (kebab menu, toast/activity
  feed, streaming, novos statuses, mudança de layout além do necessário).
- **Distinção importante**: a recomendação SEQUENCIAL T1→T2→T3 (R6) **não é do mesmo tipo** que
  D-008..D-012 — é recomendação técnica do plan, não decisão de gate HITL. O tasks-agent PODE
  paralelizar T1∥T2 se compensar com joint verify gate (constitution `boundaries.always`) e
  resolver a coupling do teste de T2 (fixture local ou aceitar o gate combinado); só não pode
  paralelizar sem essa compensação.

---

## Riscos transferidos

| # | Risco | Severidade | Ação tasks-agent | Origem |
| --- | --- | --- | --- | --- |
| R6 | Acoplamento de símbolo T1↔T2 via teste (não via componente) e T3↔(T1,T2) via integração; se paralelizado sem compensação, PASS prematuro de uma task quebra a outra na integração | MÉDIO (mitigado por recomendação, não eliminado) | Adotar sequencial T1→T2→T3 (default do plan) OU, se paralelizar T1∥T2, decidir explicitamente fixture local para o teste de T2 e declarar joint verify gate na árvore combinada como pré-requisito de PASS na task file | plan.md §"Task decomposition preview"; ADR-0001; constitution boundaries.always; Descoberta #1/#2 |
| Novo | Restrição "zero imports de `app/` em `ui/SessionCard.tsx`" (D-011/ADR-0004) **não é enforced por lint/typecheck** — confirmado lendo `eslint.config.mjs` (só `tseslint.configs.recommended`, sem regra de import boundary). Um import indevido compilaria e passaria no verify gate normalmente | MÉDIO | A task file de T2 deve incluir esse ponto como acceptance criterion EXPLÍCITO (checklist de auto-revisão antes de reportar PASS), já que não há grade automática que pegue — não assumir que "typecheck verde" cobre essa regra | Suposições validadas (eslint.config.mjs); ADR-0004 Consequences ("finding automático" = achado de revisor, não de tooling) |
| Novo | Migração `.itemList`→`.sessionList` (T3, `shell.module.css`) pode quebrar asserts existentes de sessão em suites não tocadas por esta feature (ex.: testes de shell-settings que já fazem assert de chip/heading de sessão) se o markup interno divergir do que o plan descreve | BAIXO (plan já endereça, mas é o tipo de regressão que só aparece no verify gate) | T3 deve rodar o verify gate completo (não só os arquivos novos/estendidos) antes de PASS — já é regra geral, mas vale reforçar na task file de T3 dado que é a task que efetivamente troca a classe CSS consumida pelos testes existentes | plan.md §Risks "Novo — migração .itemList→.sessionList" |
| Novo | Chave (`key`) das linhas de log = `time` exige unicidade por sessão — se uma task file futura editar `mockCatalog.sessionLogs` sem preservar a invariante, React quebra silenciosamente (chaves duplicadas) sem erro de teste óbvio a menos que o teste de invariante (T1, selectors.test.ts) exista | BAIXO | T1 deve incluir o teste de invariante (timestamps únicos por sessão, 6–10 linhas) como parte do escopo — já está listado em plan.md §Test strategy, apontar explicitamente na task file de T1, não deixar implícito | plan.md §Risks "Novo — key das linhas de log = time" |
| R7 | Branch stacked sobre `feat/night-harbor-p2-kpi-strip` (PR #7→#6) — mudanças no PR base exigem rebase da cadeia antes do merge | BAIXO | Não é ação de tasks-agent; fica com o controller no momento do merge, mencionar apenas se alguma task file tocar arquivo que também mudou no PR base | handoff-001.md R7; inalterado |

---

## Entrega para tasks

**Artefatos de entrada para sdd-tasks**:
- `plan.md` (aprovado HITL, 4 ADRs, §Task decomposition preview com T1→T2→T3)
- `adr/0001..0004` (todos accepted, 0004 amended com override)
- `memory/decisions.md` (D-001..D-012, vinculantes, sem gap novo desta fase)
- `memory/contrast-audit.md` (33 pares, 0 falhas — evidência de AC-017, não responsabilidade das tasks)
- `memory/handoff-001.md` (spec→plan, contexto herdado, não repetido aqui)
- `memory/handoff-002.md` (este arquivo)
- `constitution.md` (boundaries.always, test_expectations — regras que viram acceptance criteria)

**Próximo passo**: sdd-tasks decompõe em até 3 arquivos de task (T1/T2/T3) usando os file scopes
e símbolos expostos desta seção como ponto de partida literal — não precisa re-derivar a
partição do zero, ela já está fechada no plan; o trabalho de tasks é enriquecer cada task file
com contexto de codebase (trechos exatos a editar, padrões de teste vizinhos) e decidir
sequencial vs. paralelo com compensação conforme R6.
