# Handoff: fix → consolidate

**Feature**: night-harbor-p2-inline-actions
**Data**: 2026-07-11
**De**: sdd-fix-review (2/2 issues resolvidos, 220/220 verde) + controller (fases 16–17: verify
PASS, re-review round 2 SKIP por decisão HITL)
**Para**: consolidate-agent (step 18)
**Controlador**: handoff-agent

Handoffs anteriores (`memory/handoff-001.md` spec→plan, `002.md` plan→tasks, `003.md`
tasks→implement) **não repetidos aqui** — cobriam roteamento operacional já fechado. Este
handoff cobre a run INTEIRA (fases 10–17: implement, verify, review, fix, re-verify) com foco em
**lições e padrões emergentes candidatos a promoção** — matéria-prima para o consolidate-agent,
não uma nova rodada de decisões de design.

---

## Decisões tomadas

Nenhuma decisão nova de design nesta fase — handoff fix→consolidate é destilação, não gate
(mesma convenção operacional de `handoff-003.md`). O que esta fase FIXA como fato de entrada:

- **Fix loop 2/2 resolvido**, verificado por leitura direta dos issue files: `201-tab-order-
  adjacency-not-derived.md` (medium) e `202-missing-live-pause-resume-pause-cycle.md` (low),
  ambos `status: resolved`, texto de resolução conferido linha a linha contra a sugestão
  original. Gate: `npm run test` 220/220 verde (`reviews-001/000-round-summary.md`).
- **Re-review round 2 SKIP por decisão HITL explícita do usuário** (2026-07-11, `state.md`
  linha 71: "apenas 1 round de review nesta run") — não é uma omissão do pipeline, é decisão do
  usuário incorporada como fato de entrada. Validação pós-fix foi do controller (escopo + gate +
  issue files), não de um segundo round-agent.
- **6 candidatos a LEARNING avaliados** nesta fase quanto a durabilidade/cross-projeto (ver
  "Descobertas inesperadas") — nenhum aplicado; aplicação (edição fora de
  `.orquestrador/night-harbor-p2-inline-actions/`) é do consolidate-agent após gate HITL, mesmo
  precedente de `.orquestrador/night-harbor-p2-kpi-strip/memory/consolidation.md`.
- **2 candidatos a ADR de repo avaliados** (D-008 estado vivo, D-011 primitive domain-blind em
  `ui/`) — recomendação preparada (ver "Contexto que a próxima fase PRECISA"), decisão final é
  do consolidate+HITL, não desta fase.
- **Skill `harbor-night-harbor-ui` confirmada como candidata a update**, path re-verificado por
  `Glob` direto nesta fase: `.agents/skills/harbor-night-harbor-ui/SKILL.md` (não
  `.claude/skills/` — mesmo erro de suposição já corrigido em runs anteriores, ver
  `consolidation.md` do P2.3 linha 102-103).

---

## Alternativas descartadas

- **Repetir o formato ad-hoc de `handoff-006.md` do P2.3** (seções "Sumário Executivo"/
  "Learnings duráveis"/"Skill update"/"ADR promotion" próprias) — descartado por instrução
  explícita desta run: "formato padrão 8 seções". O conteúdo equivalente (candidatos a
  learning/ADR/skill) foi encaixado nas 8 seções padrão abaixo, não num formato próprio novo.
- **Promover os 6 candidatos como 6 notas atlas novas** — descartado: 2 dos 6 (#3 errata
  recharts, #6 sendmessage resume) já são reforço/correção de notas **existentes**
  (`recharts-jsdom-testing-gotchas.md`, `orquestrador-sendmessage-resume-preserves-context.md`);
  tratá-los como nota nova duplicaria conteúdo já indexado em `atlas/index.md` (linhas ~106,
  ~130).
- **Decidir aqui se D-008/D-011 viram ADR de repo** — descartado: é decisão do consolidate+HITL
  por dispatch explícito ("recomende, decisão é do consolidate+HITL"); esta fase só prepara a
  avaliação de permanência/reaproveitamento (ver seção 7).
- **Re-auditar contraste ou re-rodar o script WCAG nesta fase** — descartado:
  `memory/contrast-audit.md` já é evidência final (33 pares, 0 falhas), nenhum hex mudou desde o
  plan; recomputar seria trabalho redundante sem valor incremental.
- **Editar arquivos do atlas** (`C:\Users\gustavo\projetos\atlas\learnings\`) nesta fase —
  descartado por instrução explícita ("NUNCA edite código", escopo restrito a este arquivo);
  leitura feita só para confirmar existência/conteúdo exato das notas candidatas a reforço, não
  para aplicar mudança.
- **Aceitar o rótulo "3ª ocorrência" de `state.md` linha 54 sem checagem** — descartado:
  conferido contra a seção "Source" do learning existente (que cita só a run `nucci-projects
  ideas-ui-fix` como origem) — o rótulo pode estar contando ocorrências dentro do próprio Harbor
  apenas, não é uma contradição a resolver aqui, mas fica sinalizado para o consolidate não
  copiar o número sem re-contar (ver Riscos).

---

## Suposições validadas

- **Os 3 arquivos de `reviews-001/` confirmam PASS**: 0 critical/high, 1 medium (201) + 1 low
  (202), ambos `status: resolved`, texto de resolução verificável linha a linha (201:
  `expectedStops` derivado de `seedViews.flatMap(...)`, substitui a adjacência hand-picked; 202:
  terceiro clique de pause reaproveitando a MESMA instância montada, sem remount/navegação).
  Dimensões `requirements`/`architecture`/`regression`/`security` limpas (`000-round-summary.md`
  linhas 25-28).
- **Candidatos #1 e #2 são genuinamente novos no atlas** — confirmado por `grep` direto em
  `C:\Users\gustavo\projetos\atlas\learnings\`: nenhum arquivo cobre TS1149/colisão de barrel
  bare em filesystem case-insensitive, nenhum cobre o padrão "assert 'called with no arguments'
  incompatível com `onClick={handler}`". Sem risco de duplicar nota existente.
- **Candidato #3 (errata recharts) é reproduzível 2× dentro desta run**: `plan.md` linhas
  587–591 registra a checagem empírica ANTES de qualquer implementação (185/185 verde sem stub
  global); o round de review + fix confirma de novo DEPOIS da implementação completa (220/220
  verde, `tests/renderer/setup.ts` intocado — task 003 usa só stub LOCAL para forçar
  `matches:true` no caminho "sistema" do AC-015, teste ortogonal ao que motivou o trap original).
  A `constitution.md` desta run (linha 33) repete a premissa antiga do learning quase verbatim:
  *"testes que renderizam o Shell montam Recharts (KPI strip do Overview) — stub completo de
  MediaQueryList obrigatório (learning recharts-jsdom-testing-gotchas)"* — ou seja, a premissa
  superada não é só uma nota de plan isolada, é texto que corresponde literalmente à redação
  atual do trap #2 do atlas.
- **Candidato #4 é variante nova, não recorrência**: `css-module-class-asserts-substring-and-
  fixture-derived.md` (lido na íntegra) cobre "substring de classe hasheada" + "counts derivados
  de fixture" — nenhuma menção a ADJACÊNCIA/ordem relativa de itens no fixture. O finding 201 é
  uma categoria de fragilidade irmã (posição no DOM inferida sem derivação), não uma repetição
  do mesmo trap já coberto.
- **Candidato #6 já é nota existente** — `orquestrador-sendmessage-resume-preserves-context.md`
  (lido na íntegra) cobre exatamente o padrão (resume via SendMessage preserva sessão/contexto,
  mais barato que redespacho); a seção "Related"/final do arquivo ainda não tem o data point
  desta run.
- **Skill `harbor-night-harbor-ui` NÃO cobre nenhum padrão desta feature hoje** — confirmado por
  leitura integral do `SKILL.md` (159 linhas): há blocos "StatusChip (P2)", "Nav ícone+label
  (P2)", "MetricTile/Sparkline (P2.3)" em Rules, mas nenhum menciona `SessionCard`, o slice de
  estado vivo (`pausedSessionIds`/`selectSessionViews`), a primitive `IconButton`, ou o padrão de
  painel-disclosure com animação gated por prop (não por hook interno).

---

## Suposições invalidadas

- **A premissa "Recharts com `isAnimationActive={false}` + dimensões fixas exige stub completo
  de `MediaQueryList`" está invalidada como afirmação geral** neste codebase — o gatilho real é
  `useReducedMotionPreference`/motion-dom (consumido a qualquer mount de `App`/`Shell`, com ou
  sem Recharts em cena), satisfeito pelo matchMedia NATIVO do jsdom 29 sempre que nenhum teste
  força `matches:true`. Isso **não** significa que o trap #2 original (P2.3,
  `metric-tile.test.tsx`) fosse falso naquele teste específico — significa que a atribuição
  causal ("Recharts exige isso incondicionalmente no mount") generalizou incorretamente um caso
  em que o teste também forçava reduced-motion por outro caminho. Candidato a **ERRATA por
  append** (mesmo padrão usado em `contrast-math-by-script-not-llm-arithmetic.md`, que tem um
  parágrafo "Reinforced" ao final), não a reescrita/exclusão do trap.
- Nenhuma outra suposição de fato caiu nesta fase — os 2 findings do review eram de
  rastreabilidade de teste (adjacência não derivada, ciclo de clique faltando), não de erro de
  design, arquitetura ou contraste.

---

## Descobertas inesperadas

Os 6 candidatos do dispatch, avaliados quanto a durabilidade/cross-projeto/status (nota nova vs.
reforço de nota existente):

1. **Colisão de barrel bare `src/renderer/src/app` × `App.tsx` em filesystem case-insensitive
   (TS1149, Windows/macOS)** — testes precisam importar submodules explícitos
   (`../app/selectors`, não `../app`). **Nota NOVA candidata**: cross-projeto (qualquer repo
   TypeScript com um diretório `app/` e um arquivo `App.tsx` no mesmo nível pai, em qualquer
   filesystem case-insensitive), empírico (hit real nesta run, não teórico), sem cobertura atlas
   hoje (confirmado por grep). Granularidade sugerida: nota própria, tag `typescript`/
   `filesystem`/`windows`/`macos` — não é específica de React nem de Harbor.
2. **Assert "called with no arguments" é incompatível com `onClick={handler}`** — React SEMPRE
   passa um `SyntheticEvent` ao handler de `onClick`; task files não devem prescrever esse assert
   literal. A intenção real (nenhum argumento de DOMÍNIO — ex. `sessionId` — vazando para o
   callback) precisa de um assert diferente (ex. inspecionar o(s) argumento(s) recebido(s) e
   confirmar que não é o id esperado, ou verificar a assinatura declarada do prop, não "zero
   args"). Handoff-003 linhas 129-140 já registrava esse ponto como risco de implementação;
   agora é confirmado como PADRÃO a evitar em **redação de task file**, não só um detalhe de
   implementação de uma run. **Nota NOVA candidata**: cross-projeto (qualquer teste React que
   afirme sobre a assinatura de um callback de evento DOM), tag `react`/`testing`/`vitest`.
3. **Errata do learning `recharts-jsdom-testing-gotchas`** (ver "Suposições invalidadas" acima)
   — **reforço/correção de nota EXISTENTE**, não nota nova. Prova dupla (plan + pós-implement,
   ambas 220/220 ou 185/185 sem stub global) mais o fato de a constitution desta run ter herdado
   a premissa superada e nenhum teste ter precisado do stub global mesmo assim.
4. **Finding 201 é variante nova do padrão fixture-derived**: "adjacência/ordem no DOM inferida
   sem derivação do fixture" — hoje `css-module-class-asserts-substring-and-fixture-derived.md`
   cobre só "classe hasheada" e "contagem hardcoded"; não cobre ordem/posição relativa. **Reforço
   por extensão de escopo em nota EXISTENTE** (não nota nova) — mesma família de fragilidade
   (assumir algo sobre o fixture sem derivar), categoria adicional a listar explicitamente em
   "The trap".
5. **Processo: "1 round de review" por decisão HITL mid-run** — registrar como variação de
   pipeline ACEITÁVEL para diffs pequenos com ≥3/5 dimensões de review limpas
   (`architecture`/`regression`/`security` limpas nesta run; só `test-coverage` teve achados,
   `requirements` PASS 20/20). **Não generalizar sem critério explícito** — dispatch é claro
   nisso. Se promovido, deve ser registrado como observação condicionada (tamanho de diff +
   limiar de dimensões limpas), não como regra "1 round basta" — decisão de formalizar ou não é
   do consolidate/usuário, não desta fase.
6. **SendMessage resume preservou contexto do plan-agent através de session limit** (state.md
   linha 54) — **reforço/contador de nota EXISTENTE**
   (`orquestrador-sendmessage-resume-preserves-context.md`), não nota nova. Nuance encontrada: o
   rótulo "3ª ocorrência" em `state.md` cita "plan P2.3, consolidate P2.3" como as 2 anteriores,
   mas a seção "Source" do learning existente cita apenas a run `nucci-projects ideas-ui-fix`
   como origem — o consolidate deve **re-contar pelas fontes primárias** (não copiar o ordinal
   de `state.md` verbatim) antes de decidir a frase exata a acrescentar (ver Riscos).

---

## Raciocínio comprimido (dead ends)

- Não foi necessária exploração nova de código-fonte da feature — as fontes de entrada
  (`state.md` fases 10–17, `reviews-001/`, `handoff-003.md`, `decisions.md`) já continham a
  matéria-prima; o trabalho desta fase foi confirmar existência/redação exata de cada learning
  candidato contra o atlas real, não descobrir código novo.
- Descartado deliberadamente: re-ler `handoff-001.md`/`handoff-002.md` na íntegra de novo — já
  sintetizados em `handoff-003.md` (que este handoff também não repete); reler a fonte original
  não mudaria nenhuma instrução para o consolidate.
- Descartado: tentar listar TODOS os arquivos do atlas (`Glob` retornou vazio de forma
  inconsistente para `learnings/*.md` neste ambiente — provável limitação do tooling com esse
  path específico; `Grep` com `path` funcionou de forma confiável). Usado `Grep` para localizar
  e ler cada arquivo candidato por nome exato em vez de enumerar o diretório inteiro — suficiente
  para os 4 arquivos que importavam a esta fase
  (`recharts-jsdom-testing-gotchas.md`, `css-module-class-asserts-substring-and-fixture-
  derived.md`, `orquestrador-sendmessage-resume-preserves-context.md`,
  `contrast-math-by-script-not-llm-arithmetic.md`).
- Não investigado: se há OUTRAS notas atlas sobre React/TypeScript/barrel exports que poderiam
  ser candidatas a cross-link para o item #1 — grep teve escopo nos termos exatos do candidato
  (TS1149/case-insensitive/barrel), não uma varredura completa do vault; fica para o
  consolidate-agent decidir se um cross-link mais amplo vale a pena.

---

## Contexto que a próxima fase PRECISA

### Atlas — paths e conteúdo atual confirmados por leitura direta

- `C:\Users\gustavo\projetos\atlas\learnings\recharts-jsdom-testing-gotchas.md` (52 linhas) —
  trap #2 (linhas 26-29) é o alvo da errata do candidato #3. Padrão de append já estabelecido em
  `contrast-math-by-script-not-llm-arithmetic.md` (parágrafo "Reinforced (2nd consecutive run)"
  ao final da seção Source) — seguir o MESMO padrão: acrescentar parágrafo, não reescrever o
  trap original.
- `C:\Users\gustavo\projetos\atlas\learnings\css-module-class-asserts-substring-and-fixture-
  derived.md` (58 linhas) — já tem 1 parágrafo "Recurred" ao final (P2.3, finding 001); o
  candidato #4 seria um segundo parágrafo/bullet nessa mesma nota, cobrindo a variante
  "adjacência não derivada" como categoria irmã de "counts hardcoded".
- `C:\Users\gustavo\projetos\atlas\learnings\orquestrador-sendmessage-resume-preserves-context.md`
  (40 linhas) — seção "Related" (linhas 36-39) é onde um novo bullet/reforço se encaixaria; a
  seção "Source"/"Context" (linhas 19-21) só cita `nucci-projects`. Consolidate precisa decidir a
  contagem correta antes de escrever o ordinal.
- `C:\Users\gustavo\projetos\atlas\index.md` — linha ~106 (`orquestrador-sendmessage-resume-
  preserves-context`), linha ~130 (`recharts-jsdom-testing-gotchas`) — entradas existentes, não
  precisam de nova linha se os candidatos #3/#4/#6 forem tratados como reforço (só o conteúdo do
  arquivo muda, não o índice). Notas NOVAS (#1, #2) precisariam de entrada nova no índice — mesmo
  precedente de "Desvio autorizado" registrado no `consolidation.md` do P2.3 (linha 591-593):
  update do índice só com autorização explícita do controller.
- `Glob` tem comportamento inconsistente contra `C:\Users\gustavo\projetos\atlas\learnings\` neste
  ambiente (retornou vazio para padrões que `Grep` localizou sem problema) — usar `Grep`/leitura
  direta por nome de arquivo, não confiar em enumeração via `Glob` sozinho.

### Skill `harbor-night-harbor-ui` — gap analysis (arquivos tocados × cobertura atual)

| Arquivo tocado nesta run | Coberto hoje pela skill? |
| --- | --- |
| `ui/SessionCard.tsx` (novo) | ✗ — nenhum bloco SessionCard/estado-vivo em Rules |
| `app/experience-model.ts` (`pausedSessionIds` + `toggleSessionPaused`) | ✗ — padrão "slice esparso + reducer seed-agnóstico + selector único" não documentado |
| `app/selectors.ts` (`selectSessionViews`, mapping centralizado) | ✗ — princípio "mapping de domínio 100% no selector, zero duplicação nos call sites" não documentado (só implícito no bullet MetricTile "type-isolated") |
| `ui/primitives.module.css` (`.sessionCard*`/`.sessionLog*`) | ✗ — painel `--canvas` "recesso terminal" + fade/rise gated ausente |
| Primitive `IconButton` (reuso, variant `quiet`) | ✗ — só citada genericamente em "Accessibility CRITICAL" (aria-label icon-only); sem bloco próprio como StatusChip/MetricTile têm |
| `app/use-reduced-motion.ts` (`useEffectiveReducedMotion` = sistema OU setting) | ✗ — hook novo, fonte única de reduced-motion efetivo para App + 2 superfícies; não citado |
| StatusChip default icons (Paused → tone `warning` + ícone `Pause`) | ✗ — bloco StatusChip existente lista só `CheckCircle/Clock/Warning/Minus`; falta o par Paused/Pause (reuso de tone, não tone novo) |

Padrão emergente a nomear explicitamente (3ª ocorrência): **primitive domain-blind em `ui/` com
props totalmente resolvidas** — StatusChip → MetricTile (P2.3) → SessionCard (esta run), todas
sem import de `app/`, mapping de domínio centralizado na camada de selectors. Candidato a virar
um bullet de "Rules" próprio (não só implícito em cada bloco por componente), já que agora há 3
data points confirmando o mesmo formato.

### ADR promotion — candidatos avaliados (numeração: `docs/adr/` tem 0001–0016, próximos livres
0017/0018 — confirmar por listagem direta no momento da promoção, não copiar este número sem
reverificar)

- **D-008 / `adr/0001-live-session-state-slice.md`** (run-local, lido na íntegra) — shape
  `pausedSessionIds: readonly string[]` + ação seed-agnóstica + selector único de merge
  consumido por 3 superfícies. Recomendação: **candidato forte a ADR de repo** — é o padrão de
  "estado vivo sobre seed congelado" que qualquer feature futura com transição de status vai
  precisar (o ADR já documenta alternativas rejeitadas: `Record<string,status>`, snapshot
  completo, reducer domain-aware — raciocínio reaproveitável, não específico de sessões).
- **D-011 / `adr/0004-sessioncard-log-disclosure.md`** (run-local, lido na íntegra, amended com
  override HITL) — combina 2 decisões: (a) localização/forma da primitive (`ui/`, props
  resolvidas, zero import `app/`) — ESSA parte é o padrão de camadas reaproveitável (mesma
  classe do D-008 acima, 3º data point); (b) detalhes específicos do disclosure de log
  (`useId`, `aria-controls`, animação fade/rise, painel `--canvas`) — mais específico desta
  feature, mas o PADRÃO de disclosure (não sempre montado, `aria-expanded`/`aria-controls`
  sempre presentes, foco não se move ao fechar) também é reaproveitável para qualquer painel
  expansível futuro. Recomendação: **candidato a ADR de repo**, mas considerar se vale separar
  em dois ADRs de repo (camada + disclosure) ou manter um só cobrindo ambos — decisão de
  granularidade do consolidate. Nuance: a decisão (a) carrega um **override explícito do
  usuário** sobre a recomendação original do plan (que sugeria `shell/`) — se promovido, o ADR
  de repo deve registrar isso como convenção de projeto daqui para frente ("primitives novas
  vão para `ui/` com props resolvidas"), não só como log do que aconteceu nesta run.

### Notas gerais de rastreabilidade

- Estado da árvore no fim desta run: `state.md` linha 66-70 — commits `eab19d0`/`4a4361d`/
  `d24f5da` (tasks 001-003), fix aplicado só em `inline-actions.test.tsx` (issue files
  self-contidos, sem handoff review→fix separado por design do `sdd-review`). 220/220 testes,
  lint 0, tsc 0.
- `spec.md` tem 20 ACs, todos PASS confirmados por 2 fontes independentes: `requirements`
  dimension do review (`000-round-summary.md` linha 25) e o `analyze` da fase 8 (`state.md`
  linha 63).
- Branch stacked: `feat/night-harbor-p2-inline-actions` sobre `feat/night-harbor-p2-kpi-strip`
  (PR #7 → #6, cadeia #2←#4←#5←#6←#7) — rebase/merge é responsabilidade do controller, não desta
  fase nem do consolidate-agent (mesmo R7 já fechado em handoff-003).

---

## Riscos transferidos

| # | Risco | Severidade | Ação recomendada para o consolidate | Origem |
| --- | --- | --- | --- | --- |
| — | Escrever fora de `.orquestrador/night-harbor-p2-inline-actions/` (atlas, `docs/adr/`, skill) sem autorização explícita do controller | MÉDIO | Preparar propostas (diff/conteúdo) primeiro, aplicar só após gate HITL — mesmo precedente de `consolidation.md` do P2.3 (propostas §1-8, depois "Addendum — Gate HITL aprovado") | consolidation.md P2.3; dispatch desta fase |
| — | Numeração `docs/adr/` (0017/0018) pode ter mudado desde esta leitura se outra run promoveu ADR em paralelo | BAIXO | Reverificar por listagem direta (`Glob docs/adr/*.md`) imediatamente antes de criar qualquer arquivo novo, não confiar no número citado neste handoff | precedente consolidation.md P2.3 linha 193 |
| — | Ordinal "3ª ocorrência" do candidato #6 (SendMessage resume) pode estar contando universo diferente do que a nota atlas registra hoje | BAIXO | Re-contar pelas fontes primárias (state.md desta run + Source/Related do learning existente) antes de escrever o número exato na nota | Descobertas #6 acima |
| — | Errata do candidato #3 pode ser lida como "o trap #2 nunca existiu" se aplicada como reescrita em vez de append | MÉDIO | Seguir o padrão de append já usado em `contrast-math-by-script-not-llm-arithmetic.md` — acrescentar parágrafo com o novo entendimento, preservar o trap original como registro histórico do que motivou a nota | Suposições invalidadas acima |
| — | Granularidade de D-011 como ADR de repo (1 ADR combinando camada+disclosure vs. 2 ADRs separados) não decidida aqui | BAIXO | Decisão de forma, não de mérito — qualquer uma das duas granularidades preserva o conteúdo; escolher pelo precedente mais recente do próprio repo (ADR-0015/0016 do P2.3 foram separados por preocupação: integração da lib vs. cor) | Contexto acima |
| — | Candidato #5 (1 round de review) generalizado sem os critérios explícitos (tamanho de diff + limiar de dimensões limpas) viraria regra frouxa | MÉDIO | Se promovido a qualquer registro formal (atlas ou skill de processo), registrar as CONDIÇÕES observadas nesta run (diff pequeno, 4/5 dimensões limpas na primeira passada — só test-coverage teve achados), não a conclusão "1 round basta" isolada | Dispatch explícito: "não generalizar sem critério" |

### O que está PROIBIDO reabrir

- **Fix 201/202** — já resolvidos e verificados (220/220); não re-litigar a solução escolhida.
- **Decisão HITL de pular o round 2 de review** — fato de entrada fechado, não uma lacuna a
  preencher retroativamente pelo consolidate.
- **D-008..D-012** (`memory/decisions.md`) — todas vinculantes, já implementadas; a avaliação
  desta fase é só sobre PROMOÇÃO a ADR de repo (documentação), não sobre reabrir o mérito da
  decisão em si.
- **Tudo em `spec.md §"Out"`** (kebab/overflow menu, streaming, backend real, novos statuses) —
  segue fora de escopo também para a fase de consolidação (não é hora de propor feature nova).
- **Contraste de cor** — `contrast-audit.md` é evidência final; consolidate não deve re-julgar
  nem re-executar o script.

---

## Entrega para consolidate

**Artefatos de entrada**:
- `memory/state.md` (fases 0–17 completas, "Notas de implement" linhas 73-78 — matéria-prima
  primária desta run)
- `memory/decisions.md` (D-001..D-012, todas vinculantes/fechadas)
- `memory/contrast-audit.md` (33 pares, 0 falhas — evidência final, não recomputar)
- `reviews-001/000-round-summary.md`, `201-*.md`, `202-*.md` (round único, 2/2 resolvidos)
- `adr/0001..0004` (run-local, accepted; 0004 amended com override HITL)
- `memory/handoff-001.md`, `002.md`, `003.md` (contexto herdado, não repetido)
- `memory/handoff-004.md` (este arquivo)
- `constitution.md` (linha 33 — texto exato da premissa recharts a corrigir na fonte)
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (estado atual, pré-update — 159 linhas, path
  reconfirmado)
- Referência de formato/precedente: `.orquestrador/night-harbor-p2-kpi-strip/memory/
  consolidation.md` (estrutura de propostas + addendum de aplicação pós-gate)

**Próximo passo**: consolidate-agent (a) decide granularidade e redige as 2 notas atlas novas
(#1 barrel/TS1149, #2 assert-no-arguments) e os 3 reforços/erratas (#3 recharts, #4 fixture-
adjacency, #6 sendmessage-resume-count); (b) prepara diff da skill `harbor-night-harbor-ui`
cobrindo os 7 gaps da tabela acima; (c) avalia e recomenda a promoção de D-008/D-011 a ADR de
repo (numeração 0017/0018, reverificada); (d) submete tudo a gate HITL antes de aplicar qualquer
escrita fora de `.orquestrador/night-harbor-p2-inline-actions/`, seguindo o precedente já
estabelecido pela run P2.3.
