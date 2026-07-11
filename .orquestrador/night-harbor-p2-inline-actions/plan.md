---
title: Ações inline nos cards de sessão (Night Harbor P2.4) — technical plan
status: approved     # gate HITL 2026-07-10: trade-offs #1/#2/#3/#5/#6 aprovados como recomendados; #4 OVERRIDE do usuário — SessionCard em ui/ com props totalmente resolvidas (mapping centralizado no selector)
spec: ../spec.md
created: 2026-07-10
---

# Plan — Ações inline nos cards de sessão (Night Harbor P2.4)

## Approach

A peça central é um **slice de estado vivo de sessão** que hoje não existe (R1):
`ExperienceState` ganha `pausedSessionIds: readonly string[]` (set esparso de ids pausados,
seed `[]`), uma ação `{ type: 'toggleSessionPaused'; sessionId }` com case puro e
seed-agnóstico no `experienceReducer`, e **um único selector de merge**
`selectSessionViews(state)` em `selectors.ts` que compõe o `mockCatalog.sessions` congelado
com o set — com guard `isSessionActive` para que só sessões Running do seed possam aparecer
Paused. As **três superfícies derivam desse selector**: o slice `sessions` do Overview o
embrulha em `selectScenarioSlice`, o board Sessions o chama direto (ganhando estado; segue
sem cenários, paridade com hoje), e `buildKpiViewModels` muda de assinatura para receber a
lista mesclada — o tile "Active agents" acompanha pausas (AC-011/D-007a) e a sparkline
permanece o fixture estático ([ADR-0001](adr/0001-live-session-state-slice.md)).

O render converge num **componente único `ui/SessionCard.tsx`** usado pelos dois pontos
(`<li><SessionCard/></li>`) — decisão do gate HITL (override do usuário sobre a recomendação
`shell/`): o card é uma primitive de `ui/` com **props totalmente resolvidas**, sem NENHUM
import de `app/` (nem tipos, nem `isSessionActive`). Todo o mapping de domínio — matriz
status→ações (Running: Pause+log · Paused: Play+log · Ready/Complete: só log), mapping
status→tone, aria-labels e lookup das linhas de log — é resolvido **uma única vez no
selector** (`selectSessionViews` devolve o view model enriquecido), de modo que os 2 call
sites ficam idênticos e burros — a objeção "mapping espalhado" é mitigada no selector, não no
card ([ADR-0004](adr/0004-sessioncard-log-disclosure.md)). Paused reusa o tone `warning` com
ícone Phosphor `Pause` (vs. `Clock` do Ready), sem 5º tone
([ADR-0002](adr/0002-paused-status-warning-tone-reuse.md)). As ações consomem a primitive
`IconButton` existente (primeiro call site real, R5) com `variant="quiet"` e **nenhum estado
de cor novo** — sem `:hover` (padrão do app), pressed/focus globais reusados
([ADR-0003](adr/0003-iconbutton-reuse-and-states.md)). O log é disclosure local por card
(`useState` + `useId`, `aria-expanded`/`aria-controls`), painel recesso em `var(--canvas)`
com 6–10 linhas determinísticas de um novo bloco `mockCatalog.sessionLogs`, e animação de
entrada (fade + rise 4px) desligada pelo prop `reduceMotion` — alimentado por
`useEffectiveReducedMotion()`, hook novo que compõe sistema (motion/react) OU setting do app
([ADR-0004](adr/0004-sessioncard-log-disclosure.md)).

Contraste: **nenhum hex novo entra no app**. Ainda assim, TODOS os pares tocados pela feature
foram medidos por script WCAG 2.1 exato nesta fase — 33 pares, 0 falhas em pares exigidos
([memory/contrast-audit.md](memory/contrast-audit.md)) — fechando R2/R3 por medição, não por
dispensa.

Spec (o "porquê"): [spec.md](../spec.md) — 20 ACs EARS.

## Components & changes

| Component | Change | Notes |
| --- | --- | --- |
| `src/renderer/src/app/experience-model.ts` | modify | + `pausedSessionIds: readonly string[]` no state (seed `[]`), + ação `toggleSessionPaused`, + case puro no reducer (toggle de pertinência; sem import de mockCatalog — ADR-0001) |
| `src/renderer/src/app/mock-catalog.ts` | modify | + `SessionLogLine` + bloco `sessionLogs` (8/7/9 linhas fixas por sessão, `freezeItems`); entradas de `sessions` INTOCADAS (AC-019) |
| `src/renderer/src/app/selectors.ts` | modify | + `SessionRuntimeStatus`, `SessionViewModel` ENRIQUECIDO (status+tone+flags+labels+logLines), `selectSessionViews()`, `sessionActionLabels()`, mapping status→tone (migrado de Shell.tsx, + case Paused); `buildKpiViewModels(sessions)` parametrizada; `OverviewViewModel.sessions` → `ScenarioSlice<readonly SessionViewModel[]>` |
| `src/renderer/src/app/use-reduced-motion.ts` | modify | + `useEffectiveReducedMotion()` = `useReducedMotionPreference() \|\| settingsDraft.reduceMotion` (fonte única sistema+setting, AC-015) |
| `src/renderer/src/App.tsx` | modify | 2 linhas: adota `useEffectiveReducedMotion()` (remove a composição inline duplicada; comportamento idêntico, coberto pelos 48 testes de integração) |
| `src/renderer/src/ui/SessionCard.tsx` | create | Primitive do card (meta + chip + ações + painel de log) com props TOTALMENTE resolvidas — zero imports de `app/` (gate HITL, override #4); define o próprio `SessionCardLogLine` (compatibilidade estrutural com o fixture) |
| `src/renderer/src/ui/primitives.module.css` | modify | + bloco `.sessionCard`/`.sessionCardRow`/`.sessionMeta`/`.sessionCardControls`/`.sessionLog*` + keyframes (timestamp reusa a utilitária `.data` do próprio module) |
| `src/renderer/src/ui/index.ts` | modify | + `export * from './SessionCard'` |
| `src/renderer/src/shell/shell.module.css` | modify | + `.sessionList` (layout da LISTA nas 2 superfícies — espelho do split MetricTile/kpiStrip do P2.3); `.itemList` INTOCADA (issues/activity — AC-020) |
| `src/renderer/src/shell/Shell.tsx` | modify | Overview sessions `renderReady` → map de `SessionCard` (props do view model); board `Sessions()` → `useExperienceState` + `selectSessionViews` + `SessionCard`; remove `mapSessionStatusToTone` local (migra p/ selectors) |
| `src/renderer/src/ui/Button.tsx` | **zero edição** | `IconButton` reusada como está — contrato validado contra os 2 casos de uso (ADR-0003) |
| `src/renderer/src/ui/StatusChip.tsx` | **zero edição** | prop `icon` existente cobre o override `Pause` |
| `src/renderer/src/concepts/**` | **zero edição** | AC-016 — tokens consumidos são universais nos 3 concepts (ver §Tokens) |
| `tests/renderer/model/experience-model.test.ts` | modify | + cases `toggleSessionPaused` (add/remove/estado inicial `[]` — AC-013) |
| `tests/renderer/model/selectors.test.ts` | modify | + `selectSessionViews` (merge, guard, default≡seed, matriz status→tone/flags/labels/logLines), KPI pós-pausa derivado, seed congelado (AC-019) |
| `tests/renderer/ui/session-card.test.tsx` | create | Unit do SessionCard (padrão `metric-tile.test.tsx`): flags→botões, aria, disclosure, foco, reduce-motion (classe) |
| `tests/renderer/shell/inline-actions.test.tsx` | create | Integração no Shell: AC-005/006/010/011/012/014/015/018 (ver §Test strategy) |
| `tests/renderer/setup.ts` | **zero edição** | Provado empiricamente HOJE: suite 185/185 verde sem stub de matchMedia (ver §Test strategy) |

## Data & contracts

### experience-model.ts — slice + ação (ADR-0001)

```ts
export interface ExperienceState {
  // …campos existentes inalterados…
  pausedSessionIds: readonly string[]
}

export type ExperienceAction =
  | // …ações existentes…
  | { type: 'toggleSessionPaused'; sessionId: string }

// createInitialExperienceState(): …, pausedSessionIds: []   ← AC-013 por construção

// experienceReducer:
case 'toggleSessionPaused': {
  const isPaused = state.pausedSessionIds.includes(action.sessionId)
  return {
    ...state,
    pausedSessionIds: isPaused
      ? state.pausedSessionIds.filter((id) => id !== action.sessionId)
      : [...state.pausedSessionIds, action.sessionId]
  }
}
```

Puro, sem side effects, sem conhecimento do seed (guard de domínio fica no selector).

### mock-catalog.ts — bloco novo `sessionLogs` (G2/AC-007; conteúdo exato, congelado)

```ts
export interface SessionLogLine {
  time: string // HH:MM:SS, 24h, fixo, monotônico e ÚNICO dentro da sessão (usado como key)
  text: string
}

// dentro de mockCatalog (sessions/issueQueue/etc. INTOCADOS).
// Tipar explicitamente como Record<string, …>: sem a anotação o TS infere união de chaves
// literais e rejeita a indexação por `session.id: string` no Shell.
sessionLogs: Object.freeze<Readonly<Record<string, readonly SessionLogLine[]>>>({
  'session-104': freezeItems([
    { time: '09:41:02', text: 'Session started · task "Settings shell" assigned to Codex' },
    { time: '09:41:05', text: 'Reading src/renderer/src/settings/Settings.tsx' },
    { time: '09:41:11', text: 'Planning edit: extract settings category list' },
    { time: '09:42:03', text: 'Applied patch to Settings.tsx (+42 −11)' },
    { time: '09:42:27', text: 'Running lint · 0 errors' },
    { time: '09:43:14', text: 'Running typecheck · 0 errors' },
    { time: '09:44:39', text: 'Running test suite · 42 passed' },
    { time: '09:45:20', text: 'Awaiting next instruction' }
  ]),
  'session-103': freezeItems([
    { time: '09:12:44', text: 'Session started · task "Onboarding copy" assigned to Claude Code' },
    { time: '09:12:50', text: 'Reading src/renderer/src/onboarding/OnboardingFlow.tsx' },
    { time: '09:13:31', text: 'Drafting revised welcome step copy' },
    { time: '09:15:08', text: 'Applied patch to onboarding copy strings (+9 −9)' },
    { time: '09:15:41', text: 'Running verify gate · all checks green' },
    { time: '09:16:22', text: 'Draft ready for operator review' },
    { time: '09:16:23', text: 'Session idle · waiting for review' }
  ]),
  'session-102': freezeItems([
    { time: '08:03:17', text: 'Session started · task "UI references" assigned to Gemini CLI' },
    { time: '08:03:29', text: 'Collecting UI reference material' },
    { time: '08:05:02', text: 'Summarizing 6 reference layouts' },
    { time: '08:07:46', text: 'Writing notes to docs/ui-references.md' },
    { time: '08:09:12', text: 'Cross-checking references against concept tokens' },
    { time: '08:11:05', text: 'Applied patch to docs/ui-references.md (+120 −0)' },
    { time: '08:12:33', text: 'Running verify gate · all checks green' },
    { time: '08:13:00', text: 'Summary posted to activity feed' },
    { time: '08:13:01', text: 'Session complete' }
  ])
})
```

- Contagens **8/7/9** — variadas dentro do 6–10 (counts de teste derivados do fixture ficam
  significativos, não uniformes). Última linha de cada bloco coerente com o status do seed
  (Running: awaiting · Ready: waiting for review · Complete: session complete).
- Copy em inglês, separador `·` (precedente "Simulated data · resets on reload").
- Timestamp `HH:MM:SS` 24h — fixo (AC-007: nunca relógio real), único por sessão (React key).

### selectors.ts — merge único + view model RESOLVIDO + KPI vivo (ADR-0001; ADR-0004 rev. gate)

Com o override #4 do gate, o selector é onde TODO o mapping de domínio→apresentação acontece
(uma vez, para os 2 call sites — mitigação da duplicação exigida pelo gate):

```ts
export type SessionRuntimeStatus = 'Running' | 'Paused' | 'Ready' | 'Complete'
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

// migrado de Shell.tsx (era mapSessionStatusToTone), + case Paused (ADR-0002)
function mapSessionStatusToTone(status: SessionRuntimeStatus): StatusTone {
  if (isSessionActive(status)) return 'success'
  switch (status) {
    case 'Ready':
    case 'Paused':
      return 'warning'
    default:
      return 'neutral'
  }
}

// Copy EXATA dos nomes acessíveis (AC-004: ação + sessão-alvo) — exportada p/ os testes
// derivarem nomes do fixture, nunca hardcode:
export function sessionActionLabels(session: { agent: string; task: string }) {
  return {
    pause: `Pause session ${session.agent}: ${session.task}`,
    resume: `Resume session ${session.agent}: ${session.task}`,
    log: `Session log for ${session.agent}: ${session.task}`
  }
}

// View model TOTALMENTE resolvido — o card de ui/ não mapeia domínio nenhum
export interface SessionViewModel {
  id: string
  agent: string
  task: string
  status: SessionRuntimeStatus            // p/ testes/derivações (KPI usa isSessionActive)
  statusTone: StatusTone
  paused: boolean                         // dirige ícone do chip (Pause) e do toggle (Play)
  canTogglePause: boolean                 // matriz: Running || Paused
  togglePauseLabel: string                // pause OU resume, conforme o estado
  logLabel: string
  logLines: readonly SessionLogLine[]     // lookup de mockCatalog.sessionLogs centralizado
}

// ÚNICA função de merge seed+estado vivo — as 3 superfícies derivam daqui (AC-010/011)
export function selectSessionViews(state: ExperienceState): readonly SessionViewModel[] {
  return mockCatalog.sessions.map((session) => {
    const status: SessionRuntimeStatus =
      state.pausedSessionIds.includes(session.id) && isSessionActive(session.status)
        ? 'Paused'
        : (session.status as SessionRuntimeStatus)
    const paused = status === 'Paused'
    const labels = sessionActionLabels(session)
    return {
      ...session,
      status,
      statusTone: mapSessionStatusToTone(status),
      paused,
      canTogglePause: isSessionActive(status) || paused,
      togglePauseLabel: paused ? labels.resume : labels.pause,
      logLabel: labels.log,
      logLines: mockCatalog.sessionLogs[session.id] ?? []
    }
  })
}

// assinatura muda: recebe a lista JÁ mesclada (não lê mais mockCatalog.sessions cru)
function buildKpiViewModels(sessions: readonly SessionViewModel[]): readonly KpiViewModel[] {
  const activeAgents = sessions.filter((s) => isSessionActive(s.status)).length
  // …resto inalterado; series continuam de mockCatalog.kpis (sparkline estática, D-007a)
}

// selectOverviewView: computa UMA vez e alimenta os dois slices
const sessions = selectSessionViews(state)
return {
  // …
  sessions: selectScenarioSlice(state, sessions, overviewCopy.sessions),
  kpis: selectScenarioSlice(state, buildKpiViewModels(sessions), overviewCopy.kpis)
}
```

- `isSessionActive` (`selectors.ts:90`) segue a ÚNICA fonte de "ativo": Paused ≠ Running ⇒
  sai da contagem do KPI e do tone success — sem checagem duplicada.
- Guard no merge: id espúrio em `pausedSessionIds` nunca pinta Ready/Complete como Paused.
- Estado default (`[]`) ⇒ merge ≡ seed ⇒ testes existentes de selectors seguem derivando do
  fixture sem mudança de valor (campos novos são aditivos).
- `?? []` no lookup é defensivo (ids do seed sempre têm bloco; invariante 6–10 assertada em
  teste de selectors).
- A matriz status→ações vira DADO do view model (`canTogglePause`/`togglePauseLabel`) —
  testável no nível de selector, derivada do fixture, sem React.

### ui/SessionCard.tsx — primitive com props resolvidas (ADR-0004 rev. gate; fecha ponto 2 do dispatch)

Contrato do gate HITL (override #4): **zero imports de `app/`** — nem `SessionViewModel`, nem
`isSessionActive`, nem `mockCatalog`. O card define os próprios tipos (compatibilidade
ESTRUTURAL com o view model do selector) e recebe tudo já mapeado:

```tsx
// tipo próprio de ui/ — estruturalmente idêntico ao SessionLogLine do mock-catalog;
// nenhum import cruzado necessário (TS structural typing faz a ponte)
export interface SessionCardLogLine {
  time: string
  text: string
}

export interface SessionCardProps {
  /** Linha 1 do meta, ex.: "Codex" */
  agent: string
  /** Linha 2 do meta, ex.: "Settings shell" */
  task: string
  /** Rótulo do StatusChip já resolvido, ex.: "Running" | "Paused" */
  statusLabel: string
  /** Tone já mapeado pela camada de domínio (selectSessionViews) */
  statusTone: 'success' | 'warning' | 'danger' | 'neutral'
  /** true ⇒ chip com ícone Pause e toggle exibe Play (apresentação, não domínio) */
  paused: boolean
  /** presença do botão pause/resume — matriz status→ações resolvida FORA (AC-001..003) */
  canTogglePause: boolean
  /** aria-label já resolvido do toggle (pause OU resume conforme o estado) — AC-004 */
  togglePauseLabel: string
  /** aria-label já resolvido do botão de log — AC-004 */
  logLabel: string
  logLines: readonly SessionCardLogLine[]
  onTogglePause: () => void
  reduceMotion: boolean
}

export function SessionCard(props: SessionCardProps)
```

DOM (decisões de acessibilidade embutidas):

```tsx
<div className={styles.sessionCard}>
  <div className={styles.sessionCardRow}>
    <span className={styles.sessionMeta}>
      <strong>{agent}</strong>
      <span>{task}</span>
    </span>
    <StatusChip
      icon={paused ? Pause : undefined}
      label={statusLabel}
      tone={statusTone}
    />
    <span className={styles.sessionCardControls}>
      {canTogglePause && (
        <IconButton aria-label={togglePauseLabel} onClick={onTogglePause} variant="quiet">
          <SemanticIcon decorative>{paused ? <Play /> : <Pause />}</SemanticIcon>
        </IconButton>
      )}
      <IconButton
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={logLabel}
        onClick={() => setOpen((value) => !value)}
        variant="quiet"
      >
        <SemanticIcon decorative>
          <TerminalWindow />
        </SemanticIcon>
      </IconButton>
    </span>
  </div>
  {open && (
    <ol className={logPanelClasses} id={panelId}>
      {logLines.map((line) => (
        <li key={line.time}>
          <span className={`${styles.sessionLogTime} ${styles.data}`}>{line.time}</span>
          <span className={styles.sessionLogText}>{line.text}</span>
        </li>
      ))}
    </ol>
  )}
</div>
```

- Nenhum mapping de domínio no card: matriz e labels chegam por `canTogglePause`/
  `togglePauseLabel`/`logLabel` (resolvidos no selector). A ÚNICA lógica interna é
  apresentacional e dirigida pelo flag `paused`: ícone do chip (`Pause`) e do toggle
  (`Play`/`Pause`) — mesmo gênero de decisão que o `defaultIconsByTone` do StatusChip.
- Matriz AC-001..003 por construção via `canTogglePause`; nunca >2 botões.
- Botão pause/resume é o MESMO elemento (mesma posição/keyless) — troca ícone+label por
  re-render, foco preservado na transição (AC-005/006).
- `panelId` via `useId()`; `aria-expanded` reflete `open`; painel renderizado imediatamente
  após o cluster no DOM (AC-009); fechar não move o foco — o botão permanece montado (AC-008).
- Disclosure `useState` local por instância — independente por card (AC-018), descartado no
  unmount (D-007c: não persiste entre destinos).
- Ícones Phosphor confirmados na v2.1.10 instalada: `Pause`, `Play`, `TerminalWindow`
  (aliases estáveis; a lib marca-os deprecated em favor de `PauseIcon`/… — manter os nomes
  curtos por consistência com os imports existentes do repo, ex.: `CheckCircle` no StatusChip).
- Timestamp compõe com a utilitária `.data` (`'MONO' 1` + tabular-nums) do PRÓPRIO
  `primitives.module.css` — mesmo padrão do `metricValue` (bônus do override: sem duplicar
  declarações mono em shell.module.css).
- `logPanelClasses = reduceMotion ? styles.sessionLog : `${styles.sessionLog} ${styles.sessionLogAnimated}``.

### CSS novo (tokens universais, nenhum par novo) — split ui/primitives × shell

Espelho exato do split do P2.3 (MetricTile em `primitives.module.css`, `.kpiStrip` em
`shell.module.css`): o interior do card vive em `ui/primitives.module.css` junto do
componente; só o layout da LISTA fica em `shell.module.css`.

```css
/* shell.module.css — layout da lista nas 2 superfícies */
.sessionList {
  display: grid;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.sessionList > li {
  border-block-end: 1px solid var(--border);
  padding-block: var(--space-2);
}

.sessionList > li:last-child {
  border-block-end: 0;
}

/* ui/primitives.module.css — interior do card (SessionCard, P2.4) */
.sessionCard {
  display: grid;
  gap: var(--space-2);
}

.sessionCardRow {
  align-items: center;
  display: flex;
  gap: var(--space-3);
  justify-content: space-between;
  min-block-size: 44px;
}

.sessionMeta {
  display: grid;
  gap: var(--space-1);
  min-inline-size: 0;
}

.sessionCardControls {
  align-items: center;
  display: inline-flex;
  flex: none;
  gap: var(--space-1);
}

.sessionLog {
  background: var(--canvas);
  border: 1px solid var(--border);
  border-radius: var(--radius-small);
  display: grid;
  gap: var(--space-1);
  list-style: none;
  margin: 0;
  padding: var(--space-3);
}

.sessionLog > li {
  display: flex;
  font-size: var(--type-small);
  gap: var(--space-3);
}

.sessionLogTime {
  color: var(--ink-muted); /* auditado: 6.86–9.68:1 — memory/contrast-audit.md F2 */
  flex: none;
  /* mono/tabular via composição com a utilitária .data no TSX (mesmo module) */
}

.sessionLogText {
  color: var(--ink); /* auditado: 12.62–17.64:1 — memory/contrast-audit.md F1 */
  overflow-wrap: anywhere;
}

.sessionLogAnimated {
  animation: session-log-expand var(--duration-fast) var(--ease-standard);
}

@keyframes session-log-expand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sessionLogAnimated {
    animation: none; /* defesa em profundidade; o gate primário é a classe condicional */
  }
}
```

- **`.itemList` INTOCADA** — issues (Overview + board) e activity continuam nela (AC-020).
  Sessões migram para `.sessionList` (li vira container de card, sem o flex row do itemList).
- Mono do timestamp via utilitária `.data` do PRÓPRIO `primitives.module.css` (composição no
  TSX, padrão `metricValue` do MetricTile) — nenhuma declaração duplicada, nenhum import
  cruzado entre modules.
- **Tokens consumidos** (`--canvas`, `--border`, `--ink`, `--ink-muted`, `--surface-active`
  via `.button`, `--radius-small`, `--space-*`, `--type-small`, `--duration-fast`,
  `--ease-standard`): todos definidos nos 3 concepts / root — como no MetricTile (ADR-0003 do
  P2.3), a degradação legada é a aparência NATIVA do concept, sem cadeia de fallback nova e
  com **zero edição** em `concepts/command-deck/`/`concepts/signal-poster/` (AC-016).

### Shell.tsx — integração das duas superfícies

Com o view model resolvido, os 2 call sites são IDÊNTICOS e burros — só espalham campos do
`SessionViewModel` + a cola local (dispatch do toggle e `reduceMotion`); zero mapping:

```tsx
// Overview (dentro do componente; dispatch já existe):
const reduceMotion = useEffectiveReducedMotion()
// …
renderReady={(sessions) => (
  <ul className={styles.sessionList}>
    {sessions.map((session) => (
      <li key={session.id}>
        <SessionCard
          agent={session.agent}
          canTogglePause={session.canTogglePause}
          logLabel={session.logLabel}
          logLines={session.logLines}
          onTogglePause={() => dispatch({ type: 'toggleSessionPaused', sessionId: session.id })}
          paused={session.paused}
          reduceMotion={reduceMotion}
          statusLabel={session.status}
          statusTone={session.statusTone}
          task={session.task}
          togglePauseLabel={session.togglePauseLabel}
        />
      </li>
    ))}
  </ul>
)}

// Board Sessions (hoje estático — passa a ler estado):
function Sessions() {
  const state = useExperienceState()
  const dispatch = useExperienceDispatch()
  const reduceMotion = useEffectiveReducedMotion()
  const sessions = selectSessionViews(state)
  // …mesmo <ul className={styles.sessionList}> + o MESMO map de SessionCard acima
}
```

O lookup de log (`mockCatalog.sessionLogs[id] ?? []`) vive no selector, não nos call sites.
Cenários do Overview: em loading/empty/error o `renderReady` não roda ⇒ nenhuma ação/painel
renderiza (AC-012 por construção, mesma mecânica dos demais grupos).

## Decisions (ADRs)

- [ADR-0001](adr/0001-live-session-state-slice.md) — Estado vivo: set esparso
  `pausedSessionIds` + ação toggle seed-agnóstica + merge em selector único consumido pelas 3
  superfícies (fecha R1).
- [ADR-0002](adr/0002-paused-status-warning-tone-reuse.md) — Paused reusa tone `warning` +
  ícone `Pause` (sem 5º tone); AC-017 satisfeito por re-medição do par, não por dispensa
  (fecha R2).
- [ADR-0003](adr/0003-iconbutton-reuse-and-states.md) — `IconButton` existente, variant
  `quiet`, nenhum estado de cor novo (sem `:hover`); estados reusados medidos (fecha R3/R5).
- [ADR-0004](adr/0004-sessioncard-log-disclosure.md) — `SessionCard` único em `ui/` com
  props TOTALMENTE resolvidas (gate HITL, override #4: zero imports de `app/`; mapping
  centralizado em `selectSessionViews`); disclosure local
  `useId`+`aria-expanded`/`aria-controls`; painel `--canvas`; animação gated pelo prop
  `reduceMotion` alimentado por `useEffectiveReducedMotion()` (fecha o design de
  AC-007..009/014/015/018).

## Risks

- **R1 (estado vivo inexistente) — FECHADO** por ADR-0001. Residual: a mudança de tipo do
  slice `sessions` do `OverviewViewModel` repercute em quem tipa contra ele — o typecheck do
  verify gate pega qualquer consumidor esquecido.
- **R2 (âmbar Ready×Paused / leitura do AC-017) — FECHADO** por ADR-0002 + auditoria (pares
  A1–A4 re-medidos: 6.73–10.49:1).
- **R3 (hover inexistente) — FECHADO** por ADR-0003: sem par novo (hover ≡ repouso); estados
  reusados medidos (B1/C1/E1: 5.98–17.74:1); disabled não embarca (matriz remove o botão) e é
  WCAG-isento — medido informativamente.
- **R4 (matchMedia/motion em jsdom) — FECHADO para o caminho default, contrato especificado
  para o resto**: suite atual (185 testes, 15 arquivos) roda verde HOJE sem stub nenhum —
  `app-integration.test.tsx` monta `App` → `useReducedMotionPreference` →
  `initPrefersReducedMotion` do motion-dom sob o matchMedia nativo do jsdom 29 (verificado
  nesta fase rodando `npm run test`: 185/185). Fonte lida (node_modules/motion-dom): o init
  exige `window.matchMedia` cujo retorno tenha `.matches` e
  `.addEventListener('change', cb)`, query `'(prefers-reduced-motion)'`, inicializado UMA vez
  por registry de módulos (por arquivo de teste sob o isolate do vitest). Consequência: o
  stub para forçar `matches: true` (AC-015, caminho sistema) DEVE incluir
  `addEventListener`/`removeEventListener` (e `addListener`/`removeListener` legados) — shape
  completo no §Test strategy. Residual: primeiro teste de AC-015 valida na prática (T3).
- **R5 (IconButton 0 call sites) — FECHADO no design**: contrato validado contra os 2 casos
  (`aria-expanded`/`aria-controls` fluem via `ButtonHTMLAttributes`); nenhum prop novo.
- **R6 (acoplamento de símbolo entre tasks) — MITIGADO por sequenciamento**: decomposição
  recomendada é sequencial T1→T2→T3 (ver §Task decomposition); se o tasks-agent paralelizar
  T2/T3, verify gate na árvore COMBINADA é obrigatório (constitution `boundaries.always`).
- **R7 (branch stacked #7→#6)** — inalterado; preocupação do controller no merge, não do plan.
- **Novo — migração `.itemList`→`.sessionList`**: risco de regressão visual/estrutural nos
  asserts existentes de sessão (shell-settings tem asserts de chip/heading). Mitigação: o
  markup interno preserva `<strong>{agent}</strong>`, task e StatusChip com os mesmos
  rótulos; asserts atuais são por role/name e substring de `statusChip_*` — mantidos válidos
  por construção; o verify gate confirma.
- **Novo — `key` das linhas de log = `time`**: exige unicidade por sessão (garantida no
  fixture; invariante assertada em teste para blindar edições futuras do catálogo).

## Verification approach

1. **Verify gate** (`npm run lint` + `npm run typecheck` + `npm run test`) — cobre
   AC-001..015, 018..020 via os 4 arquivos de teste (2 novos + 2 estendidos) e a suíte
   existente (não-regressão AC-020; scenarios AC-012 já exercitados pelo padrão existente).
2. **AC-017 (contraste)** — já cumprido NA FASE DE PLAN por script
   ([memory/contrast-audit.md](memory/contrast-audit.md): 33 pares, L1/L2 + ratios exatos, 0
   falhas exigidas); review confere que o CSS implementado usa exatamente os tokens auditados
   (`--canvas`/`--ink`/`--ink-muted` no painel; variant quiet sem `:hover` novo; tone
   `warning` no chip Paused). O verify gate é cego a contraste — o artefato é a evidência.
3. **AC-016 (concepts legados)** — (a) zero diff em `concepts/command-deck/` e
   `concepts/signal-poster/` (review + git diff do controller); (b) tokens universais
   confirmados por leitura direta de `concepts.module.css` (auditoria Descoberta 0); (c) os
   testes de paridade de concept existentes (`app-integration`) continuam montando as 3
   variantes.
4. **AC-019 (seed congelado)** — teste: após sequência de `toggleSessionPaused`,
   `mockCatalog.sessions` permanece deep-equal ao snapshot e `Object.isFrozen` — e o merge
   default ≡ seed.
5. **Visual** — screenshots 1024×700 e 1440×900 no gate de review (precedente P1/P2/P2.3):
   cards com ações nos 2 pontos, painel aberto, chip Paused vs Ready lado a lado.

### Test strategy (fecha ponto 6 do dispatch)

Pré-condições empíricas (verificadas nesta fase, não assumidas):

- `tests/renderer/setup.ts` NÃO tem stub de matchMedia/MediaQueryList — e a suíte completa
  passa (185/185, rodada 2026-07-10 nesta fase). A nota da constitution sobre "stub completo
  de MediaQueryList (Recharts)" está empiricamente superada — D-008 do P2.3 removeu a
  necessidade (dimensão fixa, sem ResponsiveContainer) e o consumidor real de matchMedia é
  `useReducedMotionPreference` (motion/react), satisfeito pelo matchMedia NATIVO do jsdom 29.
  **Nenhuma edição em setup.ts.**
- Stub necessário APENAS em testes que forcem `matches: true` (AC-015 via sistema) — shape
  mínimo obrigatório (motion-dom chama `addEventListener('change')` no retorno):

```ts
function stubMatchMedia(matches: boolean) {
  const original = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
    })
  })
  return () => Object.defineProperty(window, 'matchMedia', { configurable: true, value: original })
}
```

  Nota de determinismo: o singleton do motion-dom inicializa por arquivo de teste (isolate do
  vitest); `useReducedMotionPreference` OR-eia com `getSystemPrefersReducedMotion()`, que lê
  matchMedia FRESCO a cada render — stub instalado antes do render garante `true`
  independentemente do singleton. O caminho por SETTING do app
  (`updateSetting reduceMotion=true` via harness) não precisa de stub nenhum — preferir esse
  caminho como caso principal do AC-015 e cobrir o caminho sistema em 1 teste com o stub.

Arquivos:

- **`tests/renderer/ui/session-card.test.tsx`** (novo — unit da primitive controlada, padrão
  `metric-tile.test.tsx`; o teste PODE importar de `app/` — a restrição de import é do
  componente, não do teste):
  - props derivadas de `selectSessionViews` sobre o estado default (todos os statuses do
    seed) + um view Paused real (estado com o id Running pausado): contagem de botões =
    `canTogglePause ? 2 : 1` por card — counts derivados do view model/fixture, nunca
    literais (AC-001..003, matriz também coberta no nível de selector);
  - nomes acessíveis via `getByRole('button', { name })` com `sessionActionLabels(session)`
    importado de `app/selectors` (AC-004 — ação+sessão, derivado do fixture);
  - toggle de log com user-event: abre → painel com `logLines.length` linhas (fixture),
    `aria-expanded=true`, `aria-controls` === id do painel; fecha → painel ausente E
    `document.activeElement` === botão de log (AC-007/008/009);
  - conteúdo do painel === linhas exatas do fixture (timestamp+texto), sem timers (AC-018:
    render estático — nenhum `vi.useFakeTimers` necessário porque nada agenda nada);
  - `reduceMotion=false` ⇒ classe contém `sessionLogAnimated`; `true` ⇒ não contém
    (substring, nunca hash — learning css-module-class-asserts);
  - clique em pause/resume chama `onTogglePause` (spy).
- **`tests/renderer/shell/inline-actions.test.tsx`** (novo — integração, Shell montado no
  provider com harness de onboarding do padrão shell-settings):
  - AC-005/006: pausar a sessão Running (nome derivado do fixture) → chip vira "Paused" com
    `statusChip_warning` (substring) e o botão vira "Resume session …"; retomar inverte;
  - AC-010: pausar no Overview → navegar ao board Sessions (mesma árvore) → mesma sessão
    Paused + Resume; e o caminho inverso;
  - AC-011: tile "Active agents" ANTES = `String(running.length)` e DEPOIS de pausar =
    `String(running.length - 1)`, com `running` filtrado do seed por `isSessionActive`
    (derivado, nunca literal); sparkline inalterada;
  - AC-012: cenários loading/empty/error → `queryByRole('button', { name: /Pause session|Session log/ })`
    → null; presença dos estados de cenário como hoje;
  - AC-014: navegação real por teclado (user-event `tab()`): dentro do card Running a ordem é
    conteúdo → pausar → log; consistente entre cards;
  - AC-015: caminho setting (dispatch `updateSetting reduceMotion=true`) → abrir log → sem
    classe `sessionLogAnimated`; caminho sistema (stub acima, matches=true) idem;
  - AC-018: abrir log de 2 cards → ambos abertos e independentes (fechar um não fecha o outro);
  - AC-013: coberto por teste de reducer (estado inicial `[]`) + remount do provider mostra
    statuses do seed.
- **`tests/renderer/model/experience-model.test.ts`** (estende): toggle add/remove/idempotência
  do par (toggle 2× ≡ estado inicial), `createInitialExperienceState().pausedSessionIds`
  deep-equal `[]`.
- **`tests/renderer/model/selectors.test.ts`** (estende): `selectSessionViews` default ≡ seed
  (por id/status derivados do fixture); com id Running pausado → `'Paused'`; guard: id
  Ready/Complete no set NÃO vira Paused; matriz resolvida no view model (`canTogglePause`/
  `statusTone`/`togglePauseLabel`/`logLabel`/`logLines` coerentes com o status, derivados do
  fixture — cobre o mapping centralizado do override #4 sem React); KPI `active-agents`
  recomputado do estado pós-transição; invariante do fixture: todo id de
  `mockCatalog.sessions` tem bloco em `sessionLogs` com `6 <= length <= 10` e timestamps
  únicos; AC-019 (frozen/inalterado).
- **Zero edição** em testes de command-deck/signal-poster (não existem específicos) e nos
  demais suites — não-regressão via verify gate.

## Task decomposition preview (para o tasks-agent — fecha ponto 7 do dispatch)

Partição com file scopes DISJUNTOS e acoplamentos declarados (constitution: joint verify):

| Task | Files (disjoint) | Depende de | Símbolos/fixtures expostos |
| --- | --- | --- | --- |
| **T1 — estado vivo + fixture de log + view model resolvido** | `app/experience-model.ts`, `app/mock-catalog.ts`, `app/selectors.ts`, `tests/renderer/model/experience-model.test.ts`, `tests/renderer/model/selectors.test.ts` | — | `toggleSessionPaused`, `pausedSessionIds`, `SessionLogLine`, `mockCatalog.sessionLogs`, `SessionRuntimeStatus`, `StatusTone`, `SessionViewModel` (enriquecido), `selectSessionViews`, `sessionActionLabels`, `buildKpiViewModels(sessions)` |
| **T2 — SessionCard (ui/) + CSS + unit tests** | `ui/SessionCard.tsx` (create), `ui/primitives.module.css`, `ui/index.ts`, `tests/renderer/ui/session-card.test.tsx` | componente: NINGUÉM (tipos próprios, zero imports de app/); teste unit: T1 (`selectSessionViews`/`sessionActionLabels`/fixture) | `SessionCard`, `SessionCardProps`, `SessionCardLogLine`, classes `.sessionCard`/`.sessionLog*` |
| **T3 — integração das superfícies + hook + testes de integração** | `shell/Shell.tsx`, `shell/shell.module.css` (`.sessionList`), `app/use-reduced-motion.ts`, `App.tsx`, `tests/renderer/shell/inline-actions.test.tsx` | T1 + T2 | `useEffectiveReducedMotion`, classe `.sessionList` |

- **Recomendação: SEQUENCIAL T1 → T2 → T3** (R6). O override #4 desacoplou o COMPONENTE de
  T2 (props resolvidas, sem imports de app/), mas o unit test de T2 deriva props de
  `selectSessionViews` e do fixture `sessionLogs` (símbolos de T1) e T3 importa de T1 e T2 —
  o acoplamento de símbolo persiste via testes/integração. Se o tasks-agent paralelizar
  T1∥T2 (viável se o unit test de T2 usar fixture local em vez do de T1), o verify gate RODA
  NA ÁRVORE COMBINADA antes de qualquer PASS (boundary `always`;
  learning parallel-tasks-symbol-coupling).
- File scopes 100% disjuntos entre as 3 tasks (nenhum arquivo aparece em duas).
- Nenhuma task edita `concepts/**` ou `tests/renderer/setup.ts`; em `ui/`, T2 toca APENAS
  `SessionCard.tsx`/`primitives.module.css`/`index.ts` — `Button.tsx` e `StatusChip.tsx`
  permanecem com zero edição (ADR-0002/0003).

## Proposta para aprovação — RESOLVIDA (gate HITL 2026-07-10)

Todos os trade-offs foram fechados no gate; o corpo deste plan já reflete as resoluções:

1. **Resolvido (recomendado, D-008)** — shape do estado vivo (ADR-0001): set
   `pausedSessionIds` + ação toggle seed-agnóstica + merge único no selector.
2. **Resolvido (recomendado, D-009)** — Paused âmbar (ADR-0002): tone `warning` reusado +
   ícone `Pause`; sem 5º tone; par re-medido por script.
3. **Resolvido (recomendado, D-010)** — hover (ADR-0003): sem `:hover` novo; estados globais
   do `.button` reusados; nenhum par de cor novo.
4. **Resolvido (OVERRIDE do usuário, D-011)** — localização: `ui/SessionCard.tsx` com props
   TOTALMENTE resolvidas (zero imports de `app/`), e NÃO `shell/` como recomendado. A objeção
   de duplicação de mapping foi mitigada conforme direção do gate: TODO o mapping de domínio
   (matriz, tone, labels, logLines) centralizado em `selectSessionViews` — os 2 call sites
   ficam idênticos e burros. Recomendação original registrada como alternativa rejeitada no
   ADR-0004.
5. **Resolvido (recomendado, D-011)** — painel de log: fundo `--canvas` (recesso terminal) +
   fade/rise 4px gated por reduced motion (sistema OU setting).
6. **Resolvido (recomendado, D-012)** — copy exata aprovada: templates de `aria-label`
   (`Pause session {agent}: {task}` / `Resume session {agent}: {task}` /
   `Session log for {agent}: {task}`), timestamp `HH:MM:SS`, 24 linhas de log do fixture
   (§Data & contracts).
