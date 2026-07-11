# Learnings — night-harbor-p2-inline-actions

**Registro de learnings técnicos e de processo duráveis desta run (P2.4 — ações inline nos
cards de sessão).** Escrito na fase consolidate (2026-07-11) a partir de
`memory/handoff-004.md`, `memory/state.md` (fases 0–17), `reviews-001/` e `plan.md`.

## Learnings Herdados do Atlas (reaplicados nesta run)

Resumo do brain recall (`state.md` §Brain Recall) e do que cada nota rendeu de fato:

### L-inherited-1: Contrast Math by Script

**Aplicação**: auditoria integral na fase de PLAN (33 pares, 0 falhas —
`memory/contrast-audit.md`), reconfirmada pelo controller por script
(`contrast-recheck-p24.mjs`). Zero findings de contraste chegaram ao review — 3ª run
consecutiva confirmando que rodar o script no plan elimina o loop de retrabalho.

### L-inherited-2: CSS Module Class Asserts + Counts de Fixture

**Aplicação**: regra respeitada nos counts/classes, mas a run produziu uma **variante nova da
mesma família** — ver N4 (adjacência/ordem não derivada, finding 201). A família "assumir algo
sobre o fixture sem derivar" agora tem 3 categorias: classe hasheada, count hardcoded,
adjacência/ordem acidental.

### L-inherited-3: Recharts × jsdom (matchMedia)

**Aplicação com correção**: a premissa "stub completo de MediaQueryList obrigatório quando o
Shell monta Recharts" foi **empiricamente superada** nesta run — ver N3 (errata promovida ao
atlas) e a seção "Correção para o template de constitution" abaixo.

### L-inherited-4: Parallel Tasks Symbol Coupling

**Aplicação**: n/a nesta run — as 3 tasks foram sequenciais por dependência real
(001 dados → 002 ui/SessionCard → 003 shell), não paralelas. O gate combinado rodou por
construção.

### L-inherited-5: IconButton (astryx, generalização)

**Aplicação**: confirmada — a primitive `IconButton` existente foi reusada sem mudança
(variant `quiet`), `aria-label` obrigatório resolvido pela camada de selectors. Nenhum botão
icon-only novo criado fora da primitive.

### L-inherited-6: Design-system context-menu auto-close

**Aplicação**: n/a — G4 fechou por icon buttons diretos sempre visíveis (sem kebab/overflow
menu); a categoria "menu de ação" nunca entrou em cena.

---

## Descobertas Desta Run

### N1: Barrel bare `app/` colide com `App.tsx` em filesystem case-insensitive (TS1149)

**Contexto**: implement task 001 — testes importando o barrel `src/renderer/src/app` bare.
**Descrição**: a resolução de módulos do TypeScript tenta `<pai>/app.tsx` (arquivo) antes de
`<pai>/app/index.ts` (barrel); em filesystem case-insensitive (Windows NTFS, macOS APFS), o
probe `app.tsx` CASA com `App.tsx`. O import resolve para o componente e, quando outro módulo
inclui o mesmo arquivo com a caixa real, tsc emite TS1149 ("differs only in casing").
**Fix aplicado**: testes importam submodules explícitos (`../app/selectors`,
`../app/experience-model`) — nunca o barrel bare enquanto existir `App.tsx` irmão.
**Promoção**: nota atlas NOVA (cross-projeto — qualquer repo TS com `app/` + `App.tsx` no
mesmo pai; só reproduz em filesystem case-insensitive, CI Linux fica verde enquanto a máquina
Windows/macOS quebra).

### N2: Assert "called with no arguments" é incompatível com `onClick={handler}`

**Contexto**: task 002 — `SessionCard` declara `onTogglePause: () => void` e liga direto
(`onClick={onTogglePause}`); handoff-003 já havia flagado o risco.
**Descrição**: React SEMPRE invoca o handler com o SyntheticEvent —
`expect(spy).toHaveBeenCalledWith()` é insatisfazível; e o "conserto" instintivo (enfraquecer
para `toHaveBeenCalled()`) descarta a intenção real do assert: provar que nenhum argumento de
DOMÍNIO (ex. `sessionId`) vaza para o contrato do callback.
**Fix aplicado**: assert reformulado preservando a intenção (inspecionar o argumento recebido
e confirmar que não é o id da sessão).
**Promoção**: nota atlas NOVA (cross-projeto), com regra de REDAÇÃO de task file: nunca
prescrever o assert literal "with no arguments" para handler passado direto a prop de evento
DOM.

### N3: Premissa "Recharts exige stub global de MediaQueryList" superada (errata de learning)

**Contexto**: plan (pré-implementação) + pós-fix (implementação completa).
**Descrição**: o consumidor real de `matchMedia` no mount é `useReducedMotionPreference`
(motion-dom), exercitado por QUALQUER mount de `App`/`Shell` — com ou sem Recharts na árvore.
O matchMedia NATIVO do jsdom 29 o satisfaz: suite completa verde SEM stub algum em
`tests/renderer/setup.ts`, provado 2× nesta run (185/185 no plan; 220/220 pós-fix, setup.ts
intocado). O trap original do P2.3 era real naquele teste, mas a causa era o stub mínimo
`{ matches }` presente ali — não uma exigência incondicional do Recharts.
**Regra corrigida**: default = NENHUM stub global; testes que forcem `matches: true` usam stub
LOCAL completo (`matches`, `addEventListener`, `removeEventListener`, `addListener`/
`removeListener`).
**Promoção**: ERRATA na nota atlas `recharts-jsdom-testing-gotchas` (trap #2 reescrito +
parágrafo de errata preservando a atribuição original como histórico) + correção no texto do
template de constitution (seção abaixo) + bullet de Testing da skill atualizado.

### N4: Adjacência/ordem de fixture não derivada — variante nova da família fixture-derived

**Contexto**: review finding 201 (medium) — teste de tab-order do AC-014.
**Descrição**: o teste assertava que tabbing do log button do card Running aterrissa no log
button do card de `oneButtonSession` — um fato de ADJACÊNCIA no DOM que valia só por acidente
da ordenação atual do fixture (Running, Ready, Complete), nunca derivado dele. Uma edição de
fixture quebraria o teste como falsa "regressão de tab-order".
**Fix aplicado**: sequência esperada COMPLETA derivada programaticamente
(`seedViews.flatMap(...)` → `expectedStops`), caminhando cada card na ordem do fixture.
**Promoção**: extensão de escopo na nota atlas `css-module-class-asserts-substring-and-
fixture-derived` (3ª categoria da família: ordem/adjacência) + bullet de Testing da skill.

### N5: SendMessage resume — recontagem de ocorrências (não copiar ordinal de state.md)

**Contexto**: plan-agent desta run caiu 1× por session limit no meio da revisão pós-gate e foi
retomado via SendMessage com contexto intacto; o consolidate-agent desta run TAMBÉM caiu 1×
(session limit, logo após as leituras iniciais) e foi retomado via SendMessage, concluindo a
consolidação na mesma sessão.
**Recontagem pelas fontes primárias** (o rótulo "3ª ocorrência" em `state.md` linha 54 contava
só Harbor): (1) nucci-projects ideas-ui-fix, implement agent 10a, retomado 2×;
(2) P2.3 plan-agent (kpi-strip `state.md:42`); (3) P2.3 consolidate-agent (`state.md:67`);
(4) P2.4 plan-agent (`state.md:54` desta run); (5) P2.4 consolidate-agent (esta fase).
Total: **5 agentes retomados, 4 runs, 2 projetos** — resume-first segue estritamente mais
barato que redespachar, sem perda de contexto observada em nenhuma ocorrência.
**Meta-lição**: ordinais em `state.md` contam universos locais — recontar pelas fontes
primárias antes de escrever qualquer número em nota durável.
**Promoção**: reforço na nota atlas `orquestrador-sendmessage-resume-preserves-context`.

### N6: Variação de processo — 1 round de review por decisão HITL (condicionada, não regra)

**Contexto**: fase 17 — re-review round 2 SKIP por decisão explícita do usuário (2026-07-11).
**Condições observadas que tornaram a variação segura NESTA run**: diff pequeno (fix tocou 1
arquivo de teste), 4/5 dimensões limpas no round 1 (requirements 20/20 PASS, architecture/
regression/security sem findings — só test-coverage teve achados, ambos medium/low), validação
pós-fix do controller (escopo + gate 220/220 + issue files conferidos linha a linha).
**NÃO generalizar** como "1 round basta": se algum registro formal for criado no futuro, deve
carregar as condições (tamanho de diff + limiar de dimensões limpas + validação do controller),
não a conclusão isolada. Nenhuma promoção ao atlas nesta run — fica registrado aqui.

### N7: Padrão nomeado — primitive domain-blind em `ui/` com props totalmente resolvidas (3º data point)

**Contexto**: D-011/ADR-0004 (override HITL do usuário: `ui/`, não `shell/`).
**Descrição**: StatusChip (P2) → MetricTile (P2.3) → SessionCard (P2.4) — as 3 primitives
compostas de `ui/` têm o MESMO formato: zero imports de `app/`, tipos de props próprios
(estruturalmente compatíveis com o view model), TODO o mapping de domínio resolvido uma vez na
camada de selectors (`selectSessionViews`), call sites idênticos e burros. Com 3 data points e
um override explícito do usuário, deixou de ser acidente por componente e virou convenção de
projeto.
**Promoção**: bullet de Rules próprio na skill `harbor-night-harbor-ui` + candidato a ADR de
repo (recomendação D-011 → docs/adr, granularidade a decidir no gate).

### N8: Padrão — estado vivo sobre seed congelado (slice esparso + reducer seed-agnóstico + selector único)

**Contexto**: D-008/ADR-0001.
**Descrição**: `pausedSessionIds: readonly string[]` + ação `toggleSessionPaused` que só
alterna pertinência (reducer não importa `mockCatalog` — sem ciclo de módulo, sem semântica de
domínio no reducer) + merge em UM selector (`selectSessionViews`) consumido pelas 3 superfícies,
com guard `isSessionActive` contra ids espúrios. AC-010/013/019 saem por construção. Formato
reaproveitável para qualquer transição de status futura sobre seed imutável.
**Promoção**: bullet de Rules na skill + candidato forte a ADR de repo (recomendação D-008 →
docs/adr/0017).

### N9: `useEffectiveReducedMotion` — fonte única da preferência efetiva; `ui/` recebe boolean

**Contexto**: ADR-0004 item 5; `app/use-reduced-motion.ts`.
**Descrição**: hook novo compõe sistema (motion-dom) OU setting do app — adotado por `App.tsx`
(remove duplicação inline pré-existente) e pelas 2 superfícies do Shell. Componentes de `ui/`
NUNCA chamam o hook (é de `app/`): recebem o prop `reduceMotion` e gateiam a classe animada
condicionalmente, com `@media (prefers-reduced-motion: reduce)` como defesa em profundidade no
CSS.
**Promoção**: bullet de Rules na skill.

---

## Correção para o template de constitution (runs FUTURAS)

A `constitution.md` desta run é imutável pós-aprovação; a linha 33 herda a premissa superada
(N3). Texto atual (trecho final de `test_expectations.feature`):

> "testes que renderizam o Shell montam Recharts (KPI strip do Overview) — stub completo de
> MediaQueryList obrigatório (learning recharts-jsdom-testing-gotchas)"

Texto corrigido proposto para o template das próximas runs:

> "testes que renderizam App/Shell exercitam `useReducedMotionPreference` (motion-dom) no
> mount — NÃO adicionar stub global de matchMedia (o matchMedia nativo do jsdom satisfaz
> motion-dom e o Recharts de dimensões fixas; provado em 2 runs: 185/185 e 220/220 sem stub em
> setup.ts); testes que forcem reduced-motion (`matches: true`) usam stub LOCAL completo de
> MediaQueryList — `matches`, `addEventListener`, `removeEventListener`,
> `addListener`/`removeListener` (learning recharts-jsdom-testing-gotchas, errata 2026-07-11)"

---

## Rastreabilidade

- **L-inherited-1..6**: brain recall em `state.md` §Brain Recall; aplicação verificada contra
  `memory/contrast-audit.md`, `reviews-001/`, tasks 001–003.
- **N1, N2**: `state.md` "Notas de implement" (linhas 74–75); handoff-003 item 2 (risco
  antecipado do N2); handoff-004 Descobertas #1/#2 (novidade no atlas confirmada por grep).
- **N3**: `plan.md` §Test strategy (pré-condições empíricas, 185/185); `decisions.md` nota
  pós-D-012; pós-fix 220/220 com `setup.ts` intocado; handoff-004 Suposições invalidadas.
- **N4**: `reviews-001/201-tab-order-adjacency-not-derived.md` (problema + resolução);
  handoff-004 Descobertas #4.
- **N5**: `state.md:54` desta run; kpi-strip `state.md:42`/`state.md:67`; nota atlas Source
  (nucci-projects); resume do consolidate-agent registrado nesta fase (2026-07-11).
- **N6**: `state.md:71` (SKIP HITL); `reviews-001/000-round-summary.md` (dimensões);
  handoff-004 Descobertas #5 + Riscos.
- **N7, N8, N9**: `adr/0001` e `adr/0004` (run-local, accepted; 0004 amended com override);
  `decisions.md` D-008/D-011; handoff-004 "Contexto que a próxima fase PRECISA".
- **Promoções**: aplicadas pelo consolidate como PROPOSTA sob gate HITL (2 notas novas,
  3 erratas/reforços, index, skill) — ver Report do consolidate e, após o gate, o estado final
  dos arquivos no atlas/skill.
