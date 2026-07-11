# Handoff: spec → plan

**Feature**: night-harbor-p2-inline-actions
**Data**: 2026-07-10
**De**: spec (aprovada HITL sem alterações, 20 ACs)
**Para**: plan (sdd-plan)
**Controlador**: handoff-agent

---

## Decisões tomadas

Nenhuma decisão nova nesta fase — a spec formaliza G1–G4 do grill (state.md linhas 31–37) em 20
ACs EARS, mais 3 decisões derivadas fechadas no gate pós-spec (HITL, VINCULANTES, registradas em
`memory/decisions.md` como D-001..D-007):

1. **G1 — dois pontos de render, componente único**: painel "Active agent sessions" do Overview +
   board do destino Sessions, mesmo componente de ações reusável (spec.md Scope "In", AC-001..004).
2. **G2 — log inline determinístico**: painel/drawer que expande no próprio card, 6–10 linhas fake
   fixas (timestamp + texto) do catálogo mock, sem streaming (AC-007..009, AC-018).
3. **G3 — matriz status→ações + estado vivo**: Running→pausar+log, Paused→retomar+log,
   Ready/Complete→só log; Paused é status novo, tom âmbar; transição via reducer no estado da
   experiência; `mockCatalog` continua congelado como seed (AC-001..006, AC-019).
4. **G4 — apresentação**: icon buttons sempre visíveis (máx. 2), Phosphor, `aria-label`
   obrigatório, sem hover-reveal/kebab (AC-004).
5. **Gate (a) CONFIRMADO pelo usuário**: KPI "Active agents" acompanha o estado vivo — pausar a
   única sessão Running decrementa o tile; a sparkline histórica permanece estática (AC-011).
6. **Gate (b) aprovado com a spec**: painéis de log são independentes por card, conteúdo estático
   enquanto abertos (AC-018).
7. **Gate (c) aprovado com a spec**: o estado aberto/fechado do painel de log é disclosure local de
   UI — não é estado de domínio compartilhado, não precisa persistir ao navegar entre destinos
   (spec.md "Open questions").

---

## Alternativas descartadas

Ver spec.md seção "Out (explicit non-goals)" — não reabrir no plan:

- Overflow/kebab menu, hover-reveal, tooltip como único rótulo (fechado em G4, contra).
- Outras ações de sessão (cancelar, reiniciar, abrir no editor, SSH).
- Outros statuses novos além de Paused; mudança no mapeamento tone/ícone de Running/Ready/Complete
  além do necessário para acomodar Paused.
- Toast ou entrada no Activity feed a cada pausar/retomar — feedback é só o chip/botão mudando.
- Logs reais ou streaming simulado (tail -f fake, auto-scroll).
- Backend real (node-pty, processos) e persistência em disco — tudo em memória, reset on reload.
- Filter chips no Activity feed (P2.5) e micro-interações de lista/press-scale (P2.6) — temas
  separados, não desta run.
- Editar command-deck/signal-poster para ganharem implementação própria — só fallback neutro.
- Mudança de grid/layout do Overview/Sessions além do que o próprio card acomoda.

---

## Suposições validadas

- G1–G4 do grill HITL (state.md linhas 31–37) seguem válidas sem revisão — spec aprovada sem
  alterações.
- Arquitetura "Shell único, conceitos são wrappers sem cards próprios" (base do AC-016): confirmada
  lendo `src/renderer/src/App.tsx` (linha 44 `product`, linha 70 `slot product` dentro de
  `<Layout slots={{...}}>`) e `src/renderer/src/concepts/registry.ts` (3 concepts, cada um só
  contribui um `Layout`, nenhum implementa cards). Zero edição nos diretórios
  `concepts/command-deck/` e `concepts/signal-poster/` é factível sem workaround.
- `isSessionActive` (`selectors.ts` linha 90) já é a fonte única de "ativo" compartilhada entre KPI
  (`buildKpiViewModels`, linha 101) e `mapSessionStatusToTone` (`Shell.tsx` linha 34) — precedente
  direto para não duplicar a derivação de Paused.
- `IconButton` (learning astryx-iconbutton) **já existe** como primitive em `ui/Button.tsx` (linhas
  23–35): `IconButtonProps` força `'aria-label': string` no tipo (Omit + re-adiciona obrigatório) —
  exatamente o padrão que a constraint da spec pede. `.iconButton` já tem classe própria em
  `primitives.module.css` (linha 63, hoje só `padding: var(--space-2)`).
- Seed de sessões (`mock-catalog.ts` linhas 108–112): 3 sessões — `session-104` (Codex, Running),
  `session-103` (Claude Code, Ready), `session-102` (Gemini CLI, Complete). Nenhuma Paused no seed
  — confirma que a spec.md "Verification" está certa: Paused só é alcançado por interação
  (user-event no botão pausar), nunca por fixture direto.
- `@phosphor-icons/react` já é dependência (`package.json` linha 19, `^2.1.10`) — nenhuma
  dependência nova necessária para os ícones de ação (Pause/Play/log padrão da lib).

---

## Suposições invalidadas

Nenhuma. Spec aprovada HITL sem edições.

---

## Descobertas inesperadas

1. **KPI "Active agents" hoje lê o catálogo congelado, não estado vivo nenhum** — achado crítico
   para fechar o gate (a)/AC-011. `buildKpiViewModels()` (`selectors.ts` linha 101) faz
   `mockCatalog.sessions.filter((s) => isSessionActive(s.status))` **direto no seed congelado**.
   `ExperienceState` (`experience-model.ts` linhas 63–77) **não tem nenhum campo de status de
   sessão hoje** — não é um caso de "trocar a fonte", é adicionar do zero: novo slice de estado
   (ex.: overrides de status por id de sessão), nova `ExperienceAction`, novo case no
   `experienceReducer`. Os dois pontos de render também leem o catálogo direto hoje:
   `selectOverviewView` (`selectors.ts` linha 202, via `selectScenarioSlice(state,
   mockCatalog.sessions, ...)`) e o board Sessions (`Shell.tsx` linha 297,
   `mockCatalog.sessions.map(...)` sem selector nenhum). G3 ("estado vivo no ExperienceState")
   exige que os três pontos (2 renders + KPI) passem a derivar da mesma fonte nova — não é uma
   migração pequena, é a peça central do design técnico.
2. **Ambiguidade âmbar Ready×Paused pode não exigir novo par de cor** — `StatusChip`
   (`ui/StatusChip.tsx`) só tem 4 tones (`success | warning | danger | neutral`, linha 5); Ready já
   usa `warning` com ícone default `Clock` (linha 12). Mas `StatusChip` já aceita um `icon` prop de
   override por instância (linha 7) — então Paused pode reusar o tone `warning` (par de cor já
   auditado em ADR-0014, sem re-auditoria de cor) e diferenciar só pelo ícone (ex.: `Pause` em vez
   de `Clock`) + label. Isso é uma leitura possível, não uma decisão — o plan precisa decidir se
   "reusar tone" conta como "nenhum par novo" (então AC-017 não exige nova medição do chip) ou se a
   spec quer um tom logicamente distinto mesmo que visualmente idêntico ao warning (nesse caso
   seria preciso um 5º tone). Ver Risco R2.
3. **`IconButton` existe mas está morto (0 call sites)** — grep por `<IconButton` fora de
   `Button.tsx` não retornou nada. É uma primitive pronta, nunca consumida. O plan é o primeiro
   lugar que a usa de verdade — validar que o contrato atual (`Omit<ButtonProps, 'aria-label' |
   'children'> & { 'aria-label': string; children: ReactNode }`) já serve para os 2 ícones de ação
   (Pause/Play + log) sem precisar mudar a assinatura.
4. **`.button` não tem `:hover` definido** — `primitives.module.css` linhas 1–65 só define
   `:active:not(:disabled)` (usa `--surface-active`), `:disabled` (opacity 0.46) e
   `:focus-visible` (outline ring); não há regra `:hover` para nenhuma variante de botão hoje. A
   Constraints da spec pede auditoria de contraste para "repouso/hover/pressed/disabled/focus" dos
   icon buttons — o plan precisa decidir se introduz um `:hover` novo (par de cor novo, precisa
   auditoria) ou se hover fica sem tratamento distinto (herda o padrão atual do resto do app, sem
   par novo a auditar).
5. **Learning "recharts-jsdom-testing-gotchas" está parcialmente desatualizado pelo próprio
   D-008 do P2 anterior** — `tests/renderer/setup.ts` (lido nesta fase) **não tem nenhum stub de
   `matchMedia`/`MediaQueryList`** hoje. O `decisions.md` do P2 anterior (D-008) registra que a
   sparkline Recharts foi resolvida com `width`/`height` fixos (sem `ResponsiveContainer`) e que
   isso **dispensou** qualquer stub — "provado empiricamente que jsdom renderiza sem mock algum". O
   gatilho real de `matchMedia` no código é outro: `useReducedMotionPreference`
   (`src/renderer/src/app/use-reduced-motion.ts` linha 10, `window.matchMedia(...)`, usado em
   `App.tsx` linha 35) — chamado em **todo** teste que monta o Shell/App, já hoje, independente
   desta feature. AC-015 desta spec (log panel + reduced motion) reusa esse mesmo hook. Ou seja: o
   risco de setup de teste é real, mas está mal atribuído ao Recharts na constitution/state.md —
   é do hook de motion, que já é exercitado por qualquer teste que monte o Shell inteiro. `useMotionReducedMotion` (de `motion/react`) tem sua própria dependência interna de `matchMedia`
   que pode exigir mock de `addEventListener`/`addListener` no objeto retornado — o plan deve
   confirmar empiricamente (rodar um teste real), não assumir nem a favor nem contra.

---

## Raciocínio comprimido (dead ends)

Nenhum dead end nesta fase — handoff é spec→plan direto, sem iteração de correção. O único ponto
deixado deliberadamente em aberto pela spec ("Open questions") é copy exata (aria-labels, texto das
linhas de log, formato do timestamp) — gap intencional empurrado para o plan, não ambiguidade
acidental (ver spec.md seção "Open questions").

---

## Contexto que a próxima fase PRECISA

### Estado vivo de sessão — o design técnico central desta feature

- `ExperienceState` (`experience-model.ts` linhas 63–77) precisa de um novo slice para status de
  sessão em runtime (o `mockCatalog.sessions` permanece seed imutável, D-019/AC-019). Desenho
  sugerido a avaliar no plan: overrides esparsos por id (`Record<string, 'Running' | 'Paused'>` ou
  equivalente) versus snapshot completo da lista de sessões no estado — o primeiro evita duplicar
  campos que não mudam (agent/task); o segundo é mais simples de ler nos 3 consumidores. Decisão do
  plan, registrar como ADR.
- Nova `ExperienceAction` (ex.: `{ type: 'toggleSessionStatus'; sessionId: string }`) + case no
  `experienceReducer` (`experience-model.ts` linhas 171–251, seguir o padrão dos cases existentes,
  função pura, sem side effect).
- 3 pontos precisam passar a derivar dessa fonte nova, nunca duplicar a leitura:
  - `selectOverviewView` → campo `sessions` (`selectors.ts` linha 202) hoje lê
    `mockCatalog.sessions` direto — trocar para compor seed + overrides do estado.
  - Board Sessions (`Shell.tsx` linha 297) hoje é `mockCatalog.sessions.map(...)` **sem selector
    nenhum** — precisa ganhar um selector (ou reusar o mesmo view model do Overview) para não
    duplicar a lógica de merge seed+overrides.
  - `buildKpiViewModels` (`selectors.ts` linha 101) precisa passar a receber a lista de sessões já
    mesclada (não `mockCatalog.sessions` cru) — provavelmente exige mudar a assinatura da função
    para receber `sessions` como parâmetro, já que hoje ela não recebe `state`.
- `isSessionActive` (`selectors.ts` linha 90) continua sendo a única fonte de "o que conta como
  ativo" — não duplicar essa checagem ao decidir o tone/contagem de Paused.

### Diferenciação âmbar Ready vs. Paused (gap explícito da spec, delegado ao plan)

- `StatusChip` só tem 4 tones (`ui/StatusChip.tsx` linha 5); Ready já usa `warning`/`Clock`. Duas
  rotas possíveis, o plan decide e documenta em ADR:
  (i) Paused reusa tone `warning` + ícone diferente via prop `icon` já existente (sem par de cor
  novo, sem re-auditoria do chip em si — mas precisa confirmar que "reuso de par já auditado" é
  aceitável perante AC-017, que lista "chip Paused" explicitamente como par a auditar);
  (ii) introduzir um 5º tone (ex. `attention`) com cor própria — exige par novo e auditoria
  completa (bg + texto + ícone) via script, seguindo a metodologia de ADR-0014.
- Qualquer que seja a rota, ícones distintos são obrigatórios (regra color-not-only, já reconhecida
  na spec.md Constraints) — não é opcional mesmo na rota (i).
- Auditoria numérica de contraste (WCAG 2.1 exato, por script) é **regra dura da constitution**
  (`boundaries.always`) — deve rodar nesta fase de plan, nunca estimada, incluindo os estados de
  icon button (repouso/hover/pressed/disabled/focus) e o texto do log sobre o fundo efetivo
  composto do painel.

### Icon buttons — reusar a primitive existente

- `IconButton` (`ui/Button.tsx` linhas 23–35) já implementa o contrato G4 (`aria-label` obrigatório
  no tipo) mas tem **zero call sites hoje** — o plan é quem valida na prática se a assinatura serve
  para os 2 botões de ação (toggle Pause/Play, toggle log) sem mudança.
- `.iconButton` (CSS) só tem `padding` hoje — states (`:hover`/`:active`/`:disabled`/`:focus-visible`)
  vêm todos de `.button` genérico (linhas 44–61), que **não define `:hover` para nenhuma
  variante**. Decidir se introduz `:hover` distinto (par de cor novo → auditoria obrigatória) ou
  deixa sem tratamento (herda o padrão do resto do app).
- Phosphor `^2.1.10` já instalado — confirmar que `Pause`/`Play` (ou equivalentes) existem nessa
  versão antes de codificar (não assumir da v3 mais recente).

### Painel de log inline — copy e fixture

- Extensão do `mock-catalog.ts` (padrão `freezeItems`, linhas 27 e 108–136) com bloco de log por
  sessão — 6–10 linhas fixas, timestamp + texto, congelado junto do seed (G2, AC-007, AC-019).
- Copy exata (texto dos `aria-label` — precisa nomear ação **e** sessão-alvo por AC-004 — conteúdo
  das linhas de log, formato do timestamp) fica a critério do plan, seguindo o padrão de copy em
  inglês já estabelecido em `overviewCopy` (`selectors.ts` linhas 132–178).
- Painel é **disclosure local de UI** (gate (c)) — não entra no `ExperienceState` compartilhado;
  estado aberto/fechado de cada card pode viver em estado local de componente (`useState` por
  card), desde que cada painel seja independente (AC-018) e a associação `aria-expanded` +
  `aria-controls`/`id` (AC-009) seja respeitada.

### Precedentes de processo a repetir

- `contrast-audit.md` como artefato **separado** em `memory/` (formato visto em
  `.orquestrador/night-harbor-p2-statuschip-nav/memory/contrast-audit.md` e reusado no P2 anterior)
  — repetir para o(s) par(es) novo(s) desta feature (chip Paused se rota (ii); estados do icon
  button se novos; texto do log sobre fundo do painel).
- Auditoria de contraste **sempre por script**, nunca estimativa de LLM (learning
  `contrast-math-by-script` — erro grave de linearização sRGB já ocorreu numa rev. 1 anterior,
  corrigido só na rev. 2).
- Medir contraste contra o **fundo efetivo composto** (tints/opacidades sobrepostos), nunca contra
  a superfície base isolada (learning `visual-contrast-against-canvas`, citado no P2 anterior).
- Testes de contagem (ações por card, cards com ações, linhas de log, contagem do KPI pós-transição)
  sempre derivados do fixture em tempo de teste — nunca hardcoded solto (learning
  `css-module-class-asserts`, item fixo de checklist de review, recorreu no P2.3).
- Class asserts sempre por substring, nunca nome exato/hash de CSS module (mesmo learning).
- **Learning `design-system-context-menu-auto-close` NÃO se aplica a esta run** — registrar
  explicitamente o motivo: esse learning é sobre a diferença entre menu de AÇÃO e menu de
  navegação (comportamento de auto-close). G4 fechou a decisão de apresentação como **botões
  diretos sempre visíveis, sem overflow/kebab menu nenhum** — não existe nenhum menu (de ação ou de
  navegação) nesta feature, então a categoria inteira do learning é moot. Mantido no brain recall
  como contexto histórico, não como constraint ativa desta run.
- Learning `parallel-tasks-symbol-coupling`: se o plan/tasks dividir trabalho em tasks paralelas
  que tocam `experience-model.ts`/`selectors.ts`/`Shell.tsx` ao mesmo tempo (alto acoplamento pelo
  novo slice de estado vivo), o verify gate deve rodar na árvore combinada antes de qualquer PASS —
  risco concreto aqui porque o estado vivo é consumido pelos 3 pontos ao mesmo tempo.

### Contexto estático (não muda)

- Branching: `feat/night-harbor-p2-inline-actions`, stacked sobre `feat/night-harbor-p2-kpi-strip`
  / PR #6 (cadeia #2 ← #4 ← #5 ← #6 ← #7).
- Verify gate: `npm run lint` + `npm run typecheck` + `npm run test` (constitution.md) — cego a
  contraste; auditoria numérica é adicional e obrigatória antes do merge.
- Boundary crítico: qualquer par de cor novo/alterado passa por review numérico de contraste
  (constitution.md `boundaries.always`), incluindo hover/pressed/disabled dos botões de ação.
- `ask_first` boundary cobre "adicionar nova dependência" — nenhuma prevista (Phosphor e
  motion/react já existem); se o plan concluir que precisa de pacote novo, precisa de aprovação
  explícita, igual ao precedente do Recharts.
- Idioma: UI/identificadores em inglês; documentos humanos em pt-BR (constitution).

---

## Riscos transferidos

| # | Risco | Severidade | Ação plan | Origem |
|---|-------|-----------|-----------|--------|
| R1 | Estado vivo de sessão não existe hoje em `ExperienceState` — é design novo, não troca de fonte; os 3 consumidores (Overview sessions, board Sessions, KPI) leem `mockCatalog.sessions` direto hoje e precisam convergir sem duplicar a lógica de merge seed+overrides | ALTO | Desenhar o slice de estado (overrides esparsos vs. snapshot completo) e o selector/derivação única antes de tocar nos 3 pontos de render; registrar como ADR | Descobertas #1; `experience-model.ts` linhas 63–77; `selectors.ts` linhas 101/202; `Shell.tsx` linha 297; AC-010, AC-011 |
| R2 | Ambiguidade se Paused reusando tone `warning` (com ícone diferente) conta como "nenhum par de cor novo" perante AC-017, que lista "chip Paused" explicitamente como par a auditar | MÉDIO | Decidir a rota (reusar `warning` + ícone vs. novo 5º tone) e documentar a leitura de AC-017 adotada; se reusar, justificar por que dispensa nova medição; se novo tone, seguir metodologia ADR-0014 | Descobertas #2; `StatusChip.tsx` linhas 5/12; spec.md AC-017, Riscos "Ambiguidade âmbar" |
| R3 | `.button` não define `:hover` hoje — introduzir um novo cria par de cor a auditar; não introduzir pode não cobrir a exigência literal da Constraints ("repouso/hover/pressed/disabled/focus") | MÉDIO | Decidir explicitamente se hover ganha tratamento próprio; se sim, produzir `contrast-audit.md` cobrindo o par; se não, justificar por que "sem hover distinto" satisfaz a constraint (nenhuma mudança de cor = nada a medir) | Descobertas #4; `primitives.module.css` linhas 44–65; spec.md Constraints |
| R4 | `matchMedia`/`useReducedMotionPreference` é exercitado por qualquer teste que monte o Shell/App hoje (não é exclusivo desta feature), mas o setup atual (`tests/renderer/setup.ts`) não tem stub nenhum — comportamento em jsdom real (com `motion/react`) não foi confirmado empiricamente nesta fase | MÉDIO | Rodar um teste real que monte o Shell com o novo painel de log (AC-015) cedo no plan/tasks, antes de assumir que dispensa stub (D-008 provou isso só para Recharts/ResponsiveContainer, não para `motion/react`) | Descobertas #5; `use-reduced-motion.ts`; `tests/renderer/setup.ts`; AC-015 |
| R5 | `IconButton` nunca foi consumido em produção (0 call sites) — contrato pode ter gap não descoberto (ex.: falta de suporte a `title`/tooltip nativo, comportamento de `data-variant` para tone de ação) ao ser usado pela primeira vez | BAIXO | Validar o contrato de `IconButtonProps` contra os 2 casos de uso reais (Pause/Play, log) antes de estender; se precisar de prop nova, é mudança aditiva na primitive, não reescrita | Descobertas #3; `ui/Button.tsx` linhas 23–35 |
| R6 | Acoplamento de símbolo entre tasks paralelas que tocarem `experience-model.ts`/`selectors.ts`/`Shell.tsx` ao mesmo tempo (estado vivo consumido nos 3 pontos) | MÉDIO | Se o plan/tasks dividir em paralelo, verify gate roda na árvore combinada antes de qualquer PASS (learning `parallel-tasks-symbol-coupling`) — considerar sequenciar em vez de paralelizar essa parte específica | Constitution `boundaries.always`; brain recall state.md linha 25 |
| R7 | Branch stacked sobre `feat/night-harbor-p2-kpi-strip` (PR #7 → #6, cadeia #2 ← #4 ← #5 ← #6 ← #7) — mudanças no PR base exigem rebase da cadeia antes do merge | BAIXO | Confirmar estado do PR base antes do merge final; não é bloqueante para o plan em si | spec.md "Riscos / Dependências" |

---

## Entrega para plan

**Artefatos de entrada para sdd-plan**:
- `spec.md` (aprovada HITL, 20 ACs EARS, 0 mudanças solicitadas)
- `memory/state.md` (decisões G0–G4, brain recall)
- `memory/handoff-001.md` (este arquivo)
- `memory/decisions.md` (D-001..D-007, durável)
- `constitution.md` (reuso de P2.3-kpi-strip com ajustes de artifacts_dir/branching/componente-alvo)

**Próximo passo**: sdd-plan deve produzir o technical design — novo slice de estado vivo de sessão
+ reducer action (R1), componente de ações reusável consumindo `IconButton` existente (R5),
resolução da diferenciação Ready×Paused com ADR (R2), decisão sobre `:hover` dos icon buttons (R3),
confirmação empírica do setup de teste sob `motion/react` (R4), extensão do `mock-catalog.ts` com
log determinístico por sessão, e `contrast-audit.md` como artefato separado antes do merge.
