# Handoff: tasks + analyze → implement

**Feature**: night-harbor-p2-inline-actions
**Data**: 2026-07-10
**De**: tasks (3 task files, sequenciais) + analyze (PASS, 0 BLOCKER)
**Para**: implement (sdd-implement) — execução SEQUENCIAL 001→002→003, **um implement-agent por
task**
**Controlador**: handoff-agent

Handoff anterior (`memory/handoff-002.md`, plan→tasks) **não repetido aqui** — referenciado onde
relevante. Este handoff assume que o leitor já tem esse contexto (partição T1→T2→T3, D-008..D-012,
riscos R6/eslint-boundary/`.itemList`→`.sessionList`/key=time).

---

## Decisões tomadas

Nenhuma decisão nova de design nesta fase — handoff é roteamento, não gate. O que esta fase FIXA
(operacional, não design) é a leitura do resultado do analyze como aprovação para prosseguir:

- **Resultado do analyze incorporado como fato de entrada**: PASS, 20/20 ACs cobertos de fato,
  0 BLOCKER. 2 WARN de rastreabilidade (AC-016/AC-020 faltando no `covers:` da task 003) já
  corrigidos pelo controller **antes** deste handoff — conferido por leitura direta do
  frontmatter de `tasks/003-shell-inline-actions-integration.md`: `covers:` já contém
  `AC-016` e `AC-020`. Não há ação pendente aqui, é confirmação de fato.
- **Execução SEQUENCIAL 001→002→003 confirmada como a única rota**, não uma recomendação em
  aberto: os 3 arquivos de task já têm `parallel_ok: false` e `depends_on` fechados no
  frontmatter (001: `[]`; 002: `[001]`; 003: `[001, 002]`) — o "escape hatch" de paralelizar
  T1∥T2 mencionado em handoff-002.md (fixture local no teste de 002) **não foi exercido** pelo
  tasks-agent. Isso não é uma decisão desta fase, é a leitura literal do que as task files já
  fixaram — repito aqui porque é o dado mais importante para quem vai orquestrar os
  implement-agents: não há ambiguidade de ordem a resolver.
- **INFO-3 do analyze incorporado como restrição de escopo para o implement-agent da 003**:
  `useEffectiveReducedMotion` (novo em `app/use-reduced-motion.ts`) **não** ganha um teste
  unitário isolado — é aceitável por precedente do próprio repo (o hook irmão
  `useReducedMotionPreference` também só tem cobertura via integração, nunca um
  `use-reduced-motion.test.ts` dedicado). O implement-agent da 003 **não deve criar** esse
  arquivo de teste — não é uma omissão a corrigir, é o padrão observado sendo seguido. A
  cobertura real do hook novo é via `tests/renderer/shell/inline-actions.test.tsx` (AC-015,
  caminhos setting e sistema) + os 48 testes de integração existentes de `App.tsx` (inalterados,
  fora do escopo da 003).
- **INFO-4 do analyze incorporado como não-ação**: rebase-check da base stacked (`feat/
  night-harbor-p2-kpi-strip` / PR #6) é responsabilidade do controller no momento do merge, não
  dos implement-agents — branch recém-criada, sem drift hoje. Nenhuma task precisa mencionar
  rebase.

---

## Alternativas descartadas

Não reabrir durante o implement (já fechadas em gate HITL ou nas próprias task files):

- **Paralelizar T1∥T2 com fixture local no teste de 002** — tecnicamente viável (handoff-002.md
  Descoberta #2), mas as task files JÁ decidiram não usar essa rota (`parallel_ok: false`,
  `depends_on: [001]` em 002 com o teste importando `selectSessionViews`/`sessionActionLabels`
  de `app/`). Um implement-agent não deve "otimizar" reintroduzindo paralelismo nem duplicando a
  fixture — isso divergiria do arquivo de task que está executando.
- **Reescrever o teste de 002 com fixture hand-rolled** para reduzir a dependência de 001 —
  explicitamente proibido pela própria task 002 (Contexto: "Do not... remove the test's
  derivation in favor of literal strings/counts to avoid the Task 001 dependency").
- **Corrigir `SessionCard` para importar de `app/`** para "simplificar" o mapping — é o override
  D-011 (ADR-0004), vinculante; zero imports de `app/` no componente é acceptance criterion
  explícito da task 002, não um detalhe de estilo.
- **Adicionar `:hover` novo** em qualquer botão/card desta feature — D-010/ADR-0003, fechado.
- **5º tone `attention`** para Paused, ou qualquer outra cor nova — D-009/ADR-0002, fechado; o
  `contrast-audit.md` já mede os pares exatos que as tasks devem usar, byte a byte.
- **Stub global de `matchMedia` em `tests/renderer/setup.ts`** — provado desnecessário
  empiricamente no plan (185/185 verde sem stub); a task 003 já embute o stub LOCAL exato a
  usar. Reintroduzir stub global em `setup.ts` é desvio de escopo (`setup.ts` está na lista
  "Do not touch" de TODAS as 3 tasks).
- **Criar teste unitário isolado para `useEffectiveReducedMotion`** — descartado por precedente
  (INFO-3 acima); não é uma lacuna a preencher durante o implement.
- Tudo em `spec.md §"Out"` (kebab/overflow menu, toast/activity feed por ação, logs
  reais/streaming, backend real, novos statuses além de Paused, mudança de layout além do
  necessário) — segue fora de escopo; nenhuma das 3 tasks pede isso e um implement-agent não
  deve adicionar por iniciativa própria.

---

## Suposições validadas

- **Analyze validou linha a linha**: todo `file:line`/símbolo/assinatura citado nas 3 task files
  bate com o código atual no momento do analyze (confirmado pelo resultado repassado pelo
  controller). Isso inclui os números de linha específicos citados (ex.: `experience-model.ts`
  63–77/95–118/149–165/171–251; `mock-catalog.ts` linha 137–146; `selectors.ts` 90–92/100–130/
  180–208; `Shell.tsx` 1–29/33–45/179–203/292–314; `App.tsx` 1–7/33–37).
- **Os 3 file scopes são disjuntos par a par** (já confirmado em handoff-002.md e reconfirmado
  por leitura direta das 3 task files nesta fase: `File scope` + `Do not touch` de cada uma não
  colidem). Consequência prática para o implement: como nenhuma task edita um arquivo que outra
  task também referencia como "leitura antes de editar", os números de linha citados numa task
  para SEUS PRÓPRIOS arquivos continuam válidos quando essa task começa a executar — mesmo que
  001 e 002 já tenham sido mergeados antes de 003 começar, porque nem 001 nem 002 tocam
  `Shell.tsx`/`App.tsx`/`shell.module.css`/`use-reduced-motion.ts` (escopo da 003). Ainda assim,
  cada implement-agent deve reler o arquivo antes de editar (defensivo/padrão), não confiar cegamente
  no número de linha citado sem confirmar.
- **`covers:` de todas as 3 tasks já reflete o AC mapping correto pós-analyze** — conferido por
  leitura direta: 001 `[AC-001,002,003,013,017,019]`, 002
  `[AC-001,002,003,004,007,008,009,018]`, 003
  `[AC-005,006,010,011,012,014,015,016,018,020]`. Union cobre AC-001..AC-020 (20 ACs), com
  sobreposição intencional em AC-001/002/003/018 (camada dados vs. componente vs. integração,
  não duplicação de trabalho).
- **Baseline atual confirmado por `state.md`/`decisions.md`**: suite completa **185/185 verde**,
  sem stub de `matchMedia` em `setup.ts`. Esse é o estado da árvore ANTES de qualquer uma das 3
  tasks começar a implementar. Cada task adiciona testes (001: extends 2 arquivos existentes;
  002: +1 arquivo novo; 003: +1 arquivo novo) — o número final esperado após as 3 tasks é
  185 + (testes novos de 001+002+003), não uma re-basagem do baseline.

---

## Suposições invalidadas

Nenhuma suposição de fato caiu nesta fase. Os 2 WARN do analyze foram de **rastreabilidade
documental** (campo `covers:` incompleto na 003), não de erro factual de código ou design — e já
estavam corrigidos antes deste handoff começar (verificado por leitura direta do frontmatter,
ver "Suposições validadas"). Não há reversal de decisão técnica nem de design nesta fase.

---

## Descobertas inesperadas

1. **As 3 task files já são auto-suficientes quase ao ponto de dispensar handoff-002.md para
   implementação linha a linha** — cada uma cita a seção exata de `plan.md` como fonte de
   verdade para qualquer trecho de código condensado, e os pontos de risco mais frágeis (zero
   import de `app/` na 002; stub de `matchMedia` local na 003; `Record<string, …>` explícito na
   001) já viraram itens de "Acceptance check" ou passo numerado dentro da própria task, não
   ficaram só em memória/handoff. Valor prático: o implement-agent de cada task deve tratar a
   PRÓPRIA task file como fonte primária, e só subir a `plan.md`/ADR quando a task file disser
   explicitamente "condensed, if diverges plan.md wins".
2. **O callback de toggle é sem argumento por design, e isso é um ponto fácil de errar em
   ambos os lados (002 e 003)**: `SessionCard` recebe `onTogglePause` como callback SEM
   parâmetro (`onClick={onTogglePause}`, task 002 passo 1); quem fecha sobre o `sessionId` é o
   call site em `Shell.tsx` (`onTogglePause={() => dispatch({ type: 'toggleSessionPaused',
   sessionId: session.id })}`, task 003 passo 4). O teste da 002 deve assertar que o spy foi
   chamado "exactly once, with no arguments" — se um implement-agent "corrigir" para
   `onTogglePause(sessionId)` em qualquer um dos dois lados (por instinto de passar o id), quebra
   o contrato entre as duas tasks sem que typecheck acuse (ambos compilariam isoladamente,
   assinatura de função permite chamar sem argumentos mesmo se declarada `(id: string) => void`
   só se o parâmetro for opcional — mas aqui não é, então na verdade DIVERGIR quebraria
   typecheck da 003 contra a prop declarada na 002; o risco real é o teste da 002 aceitar
   silenciosamente uma assinatura errada se a assertiva de "no arguments" for enfraquecida).
3. **`Shell.tsx` tem hoje uma função `mapSessionStatusToTone` local (linhas 33–45) que a task 001
   duplica intencionalmente dentro de `selectors.ts` (com o caso `Paused` a mais) e a task 003
   depois DELETA do `Shell.tsx`** — durante a janela entre a 001 estar mergeada e a 003 ainda não
   ter rodado, existem DUAS funções com o mesmo nome no repo (uma em `selectors.ts`, exportada
   futuramente só como helper interno — na verdade é module-private, não exportada — e a
   antiga local em `Shell.tsx`, ainda em uso por `Shell.tsx` até a 003 rodar). Isso é esperado e
   inofensivo (arquivos diferentes, sem conflito de compilação), mas um implement-agent da 002
   que por engano abrir `Shell.tsx` "para conferir" não deve estranhar ou tentar consolidar as
   duas — a consolidação é EXATAMENTE o trabalho da 003, passo 4, não antes.
4. **A task 003 é a única das 3 com uma seção "Regression note" dedicada**, exigindo
   explicitamente `npm run test` na suíte COMPLETA (não só o arquivo novo) antes de reportar
   PASS — isso já está no "Validation criteria" da 003 e é reforçado no "Acceptance check" como
   item de checklist próprio. Não é um risco novo desta fase, é a task já tendo internalizado o
   risco "Novo — migração .itemList→.sessionList" do plan (ver handoff-002.md) como requisito
   executável, não como nota de rodapé.

---

## Raciocínio comprimido (dead ends)

Nenhuma exploração nova de codebase foi necessária nesta fase — as 3 task files, `state.md`,
`decisions.md` e `contrast-audit.md` já continham tudo o que esta fase precisava confirmar. Único
ponto descartado deliberadamente: reler `memory/handoff-001.md` na íntegra — seu conteúdo já foi
sintetizado e citado seletivamente dentro de `handoff-002.md` (que este handoff também não
repete), e reler a fonte original de novo não mudaria nenhuma instrução para o implement; teria
sido trabalho de verificação redundante sem valor incremental para quem vai executar as tasks.

---

## Contexto que a próxima fase PRECISA

### Protocolo de execução (constitution `boundaries.always`)

- **Um implement-agent por task, sequencial 001→002→003** — não instanciar os 3 de uma vez.
  Cada implement-agent só deve começar quando a task anterior tiver reportado PASS com verify
  gate verde E o controller tiver commitado essas mudanças (**subagente nunca roda git** —
  `boundaries.always`; commit é sempre do controller, entre uma task e a próxima).
- **Verify gate por task, árvore completa** (`npm run lint && npm run typecheck && npm run
  test`), não só os arquivos tocados pela task — isso vale para as 3, mas é criticamente
  explícito na 003 (única que migra uma classe CSS consumida por testes fora do escopo da
  feature).
- **Baseline a validar antes de instanciar o implement-agent da 001**: suite 185/185 verde (sem
  nenhuma mudança de código desta feature ainda aplicada). Se o baseline não bater 185/185 no
  início — por exemplo, se algo mudou na base stacked (`feat/night-harbor-p2-kpi-strip` / PR #6)
  entre o plan e agora — isso é uma anomalia do controller para investigar antes de começar
  (rebase/drift, ver R7 abaixo), não algo para o implement-agent da 001 tentar "consertar" ou
  ignorar silenciosamente.

### Task 001 — o que não pode esquecer

Arquivo: `tasks/001-session-state-and-log-fixture.md`. Escopo: `app/experience-model.ts`,
`app/mock-catalog.ts`, `app/selectors.ts` + 2 arquivos de teste em `tests/renderer/model/`.

- **`mockCatalog.sessions` (seed) intocado, byte a byte** — nenhuma entrada de sessão existente
  pode ser adicionada, removida ou reordenada (AC-019). Só se adiciona o bloco NOVO
  `sessionLogs`.
- **`time` como `key` do React exige unicidade DENTRO de cada bloco de sessão** — é o valor que
  vira `key={line.time}` no `<li>` renderizado pela 002/003; a task 001 já inclui o teste dessa
  invariante (`selectors.test.ts`, "Log fixture invariant": `new Set(lines.map(l => l.time)).size
  === lines.length`) — não pular esse teste, é o único lugar que pega uma colisão de timestamp
  antes de virar bug silencioso de React em produção.
- **Tipagem `Record<string, readonly SessionLogLine[]>` EXPLÍCITA em `sessionLogs`** —
  omitir a anotação faz TS inferir uma união fechada das 3 chaves literais usadas, e
  `mockCatalog.sessionLogs[session.id]` (onde `session.id: string`) falha o typecheck. É erro de
  `npm run typecheck`, não de teste — fácil de passar despercebido se só rodar `npm run test`
  isoladamente durante o desenvolvimento.
- **Reducer seed-agnóstico**: `case 'toggleSessionPaused'` não importa `mock-catalog.ts` —
  grep por `mock-catalog` dentro de `experience-model.ts` deve retornar vazio (ADR-0001).
- **Cópia exata das 24 linhas de log (8/7/9 por sessão)** de `plan.md §"mock-catalog.ts"` —
  D-012, não parafrasear nem reordenar.
- Self-verificável isoladamente: `npm run lint/typecheck/test` devem passar com SÓ os arquivos
  da 001 alterados (002/003 ainda não existem na árvore nesse ponto).

### Task 002 — o que não pode esquecer

Arquivo: `tasks/002-session-card-component.md`. Escopo: `ui/SessionCard.tsx` (novo),
`ui/primitives.module.css` (append), `ui/index.ts` (1 linha), + 1 teste novo. Depende da 001 já
mergeada (o TESTE importa `selectSessionViews`/`sessionActionLabels`/fixture de log da 001; o
COMPONENTE em si tem zero import de `app/`).

- **Zero imports de `app/` em `SessionCard.tsx` — checklist MANUAL, não pega por tooling**:
  `eslint.config.mjs` não tem regra de import boundary (confirmado na fase de plan/handoff-002).
  A própria task 002 já instrui: "Before reporting this task PASS, manually search this file for
  the substring `../app`... and confirm zero matches." Este é um passo de autorrevisão
  obrigatório antes de reportar PASS, não algo que `npm run typecheck` verde já cobre.
- **CSS é cópia verbatim já auditada** (`contrast-audit.md` F1/F2, tokens `--canvas`/`--ink`/
  `--ink-muted`) — não ajustar cor, opacidade ou introduzir novo token; o bloco exato já está na
  própria task file (passo 2).
- **`aria-expanded`/`aria-controls` wiring**: `panelId` via `useId()`, botão de log sempre tem
  `aria-controls={panelId}` e `aria-expanded={open}`; o painel só existe no DOM quando `open`
  (renderização condicional, não `hidden`-gated — ADR-0004 rejeita explicitamente a alternativa
  "always-mounted-hidden").
- **Padrão de teste**: seguir `tests/renderer/ui/metric-tile.test.tsx` (render-only, sem
  provider) + `@testing-library/user-event` no estilo já usado em `shell-settings.test.tsx`/
  `onboarding-flow.test.tsx` — não inventar um harness novo.
- Nenhum `:hover` novo em `primitives.module.css` para as regras `.sessionCard*`/`.sessionLog*`
  (ADR-0003) — grep no diff antes de reportar PASS.
- Callback `onTogglePause` é chamado **sem argumentos** (ver Descoberta #2 acima) — o teste deve
  assertar isso explicitamente, não só "foi chamado".

### Task 003 — o que não pode esquecer

Arquivo: `tasks/003-shell-inline-actions-integration.md`. Escopo: `shell/Shell.tsx`,
`shell/shell.module.css`, `app/use-reduced-motion.ts`, `App.tsx`, + 1 teste novo. Depende de
001 + 002 mergeadas. Última task, única que verifica integração fim a fim.

- **Stub de `matchMedia` LOCAL ao arquivo de teste, `tests/renderer/setup.ts` intocado** — a
  task já embute o shape exato do stub (função `stubMatchMedia(matches)`, com
  `addEventListener`/`removeEventListener`/`addListener`/`removeListener`/`dispatchEvent`)
  necessário para o caminho "sistema" do AC-015; instalar ANTES do render, restaurar no
  `afterEach`/`finally`. Nunca adicionar esse stub a `setup.ts` — é boundary explícito, repetido
  em duas fases (plan, handoff-002, e agora a própria task file).
- **Migração `.itemList` → `.sessionList` com verify FULL**: `shell.module.css` ganha
  `.sessionList` como classe NOVA (não renomeia `.itemList`, que continua servindo issues/
  activity); `Shell.tsx` troca a classe só nos 2 render points de sessões. A task exige
  explicitamente rodar a suíte COMPLETA (não só o arquivo novo) antes de PASS — é o item mais
  arriscado de regressão silenciosa (testes fora do escopo desta feature, ex.
  `shell-settings.test.tsx`, que hoje não fazem assert direto em `.itemList` para sessões, mas
  precisam continuar passando).
- **Zero diff em `concepts/**`** — confirmar via `git status`/`git diff --stat` escopado a
  `src/renderer/src/concepts/command-deck/` e `.../signal-poster/` antes de reportar PASS
  (AC-016, agora explicitamente no `covers:` desta task pós-correção do analyze).
- **Covers AC-016 e AC-020 explicitamente** — já no frontmatter (correção do controller na fase
  de analyze); AC-020 é o próprio "full verify gate + não-regressão" como critério de aceite
  formal, não apenas prática recomendada.
- **Deletar `mapSessionStatusToTone` local (linhas 33–45) e remover `isSessionActive` do import
  de `'../app/selectors'`** — ambos ficam órfãos assim que os 2 render points passam a ler
  `statusTone` pré-resolvido do view model; deixar `isSessionActive` importado-mas-não-usado é
  risco de lint dependendo do ruleset exato do `tseslint`.
- **`useEffectiveReducedMotion` sem teste unitário isolado é intencional** (INFO-3 do analyze,
  ver "Decisões tomadas") — não criar `tests/renderer/app/use-reduced-motion.test.ts` ou
  equivalente; a cobertura é via `inline-actions.test.tsx` (AC-015) + os 48 testes de integração
  existentes de `App.tsx` (fora do escopo desta task, não tocar).

---

## Riscos transferidos

| # | Risco | Severidade | Ação do implement-agent | Origem |
| --- | --- | --- | --- | --- |
| R6 (residual) | Acoplamento de símbolo 001↔002 (via teste) e 003↔(001,002) (via integração) — já estruturalmente contido por `depends_on`/`parallel_ok: false` no frontmatter das 3 tasks, mas só se o controller de fato executar sequencial e commitar entre tasks | BAIXO (era MÉDIO no handoff-002; rebaixado porque as task files já fecharam a decisão, não é mais uma escolha em aberto) | Não paralelizar por conta própria; se o controller instanciar 002 antes de 001 estar commitado, o implement-agent da 002 deve falhar cedo (import de `selectSessionViews` não existirá) em vez de tentar contornar | handoff-002.md R6; tasks 001/002 frontmatter |
| — | Restrição "zero imports de `app/`" em `SessionCard.tsx` não é pega por lint/typecheck | MÉDIO | Checklist manual já embutido no Acceptance check da própria task 002 (grep `../app`) — implement-agent da 002 deve executar esse grep antes de reportar PASS, não assumir que typecheck verde cobre | handoff-002.md; task 002 Acceptance check |
| — | Migração `.itemList`→`.sessionList` pode quebrar asserts de sessão em suites fora do escopo desta feature | BAIXO (plan já endereça; é o tipo de regressão que só aparece no verify gate) | Implement-agent da 003 roda a suíte COMPLETA (não só o arquivo novo) antes de PASS — já é "Validation criteria" e item do "Acceptance check" da própria task 003 | handoff-002.md; task 003 "Regression note" |
| — | Chave `time` duplicada em `sessionLogs` quebraria `key` do React silenciosamente | BAIXO | Coberto pelo teste de invariante da 001 (`selectors.test.ts`) — implement-agent da 001 não deve pular esse teste específico | handoff-002.md; task 001 passo 5 |
| R7 | Branch stacked sobre `feat/night-harbor-p2-kpi-strip` (PR #7→#6) — mudanças na base exigem rebase da cadeia antes do merge final | BAIXO | Não é ação de nenhum implement-agent — fica com o controller no momento do merge. Analyze (INFO-4) confirmou: sem drift hoje, branch recém-criada | handoff-001.md R7; state.md fase 8 |
| Novo | Baseline pré-implementação precisa estar em 185/185 verde antes de instanciar o implement-agent da 001 — se não estiver, é sinal de drift na base ou de algo já quebrado, não algo para a 001 absorver silenciosamente | BAIXO | Controller confirma verify gate verde na árvore atual (sem mudanças desta feature) antes do primeiro implement-agent começar | decisions.md; state.md (185/185 registrado 2× — plan e analyze) |

### O que está PROIBIDO reabrir

- **D-008..D-012** (`memory/decisions.md`), todas vinculantes, sem exceção:
  - D-008 — shape do estado: `pausedSessionIds: readonly string[]` (set esparso), nunca
    `Record<string, status>` nem snapshot completo.
  - D-009 — Paused = tone `warning` + ícone `Pause`, sem 5º tone.
  - D-010 — sem `:hover` novo em nenhum icon button desta feature.
  - D-011 — **override do usuário**: `SessionCard` em `ui/`, props totalmente resolvidas, zero
    import de `app/`; mapping de domínio 100% centralizado em `selectSessionViews`.
  - D-012 — copy exata (`Pause session {agent}: {task}` / `Resume session {agent}: {task}` /
    `Session log for {agent}: {task}`; timestamp `HH:MM:SS`; 8/7/9 linhas por sessão).
- Recomendação SEQUENCIAL 001→002→003 (R6) já foi convertida em fato estrutural pelas task
  files (`depends_on`/`parallel_ok: false`) — não é mais uma decisão em aberto a reconsiderar
  durante o implement.
- Tudo em `spec.md §"Out"` (kebab menu, toast/activity feed por ação, streaming, novos statuses,
  mudança de layout além do necessário).
- Contraste de cor: `contrast-audit.md` já é a evidência FINAL (33 pares, 0 falhas) — nenhum
  implement-agent deve re-julgar contraste por olho ou recalcular; só implementar exatamente os
  tokens especificados.

---

## Entrega para implement

**Artefatos de entrada para sdd-implement**:
- `tasks/001-session-state-and-log-fixture.md`, `tasks/002-session-card-component.md`,
  `tasks/003-shell-inline-actions-integration.md` (as 3 fontes primárias de execução)
- `plan.md` (fonte de verdade quando uma task file disser "condensed, plan.md wins")
- `adr/0001..0004` (accepted; 0004 amended com o override D-011)
- `memory/decisions.md` (D-001..D-012, vinculantes)
- `memory/contrast-audit.md` (evidência de AC-017, não recalcular)
- `memory/handoff-001.md`, `memory/handoff-002.md` (contexto herdado, não repetido aqui)
- `memory/handoff-003.md` (este arquivo)
- `constitution.md` (`boundaries.always`, `test_expectations` — verify gate, commits só via
  controller, escopo disjunto)

**Próximo passo**: sdd-implement instancia o implement-agent da task 001, aguarda PASS com
verify gate verde, controller commita; repete para 002 (na árvore com 001 já mergeada); repete
para 003 (na árvore com 001+002 já mergeadas, verify gate FULL antes de PASS). Nenhuma task
precisa de re-derivação de escopo — os 3 arquivos de task já são executáveis como estão.
