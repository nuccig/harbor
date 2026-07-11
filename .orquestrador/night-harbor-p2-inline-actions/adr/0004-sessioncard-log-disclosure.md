---
id: 0004
title: SessionCard em ui/ com props totalmente resolvidas, disclosure de log local, painel canvas e animação gated por reduced motion
status: accepted
date: 2026-07-10
amended: 2026-07-10 (gate HITL do plan — override do usuário na localização: ui/ com props resolvidas em vez de shell/; mitigação da duplicação de mapping movida para selectSessionViews. Demais itens da decisão mantidos)
---

# ADR-0004 — `SessionCard` em `ui/` com props totalmente resolvidas, disclosure de log local, painel `--canvas` e animação gated por reduced motion

## Context

D-003 exige o MESMO componente reusável de ações nos dois pontos de render; D-004 fixa o log
como painel inline expandindo no card (6–10 linhas determinísticas); D-007b/c fixam
disclosure independente por card, estado local de UI. O markup de card de sessão hoje está
duplicado verbatim entre Overview (`Shell.tsx:183–198`) e board Sessions (`Shell.tsx:296–311`)
— com ações + painel, essa duplicação viraria o vetor de deriva que AC-010 proíbe. Fica
aberto: onde o componente vive (`ui/` vs `shell/`), como o painel se associa ao controle
(AC-008/009), e como a animação de expansão respeita reduced motion de sistema E de setting
do app (AC-015) — sabendo que `useReducedMotionPreference` (motion/react) é o consumidor real
de `matchMedia` (handoff Descobertas #5).

O plan recomendou `shell/` (para não criar dependência `ui/`→`app/`). No gate HITL
(2026-07-10) **o usuário fez override**: o card vai para `ui/` seguindo a letra da constraint
"padrão de organização ui/", com a condição de que o componente receba **props totalmente
resolvidas** (zero imports de `app/`) e que a objeção de "mapping espalhado pelos call sites"
seja mitigada **no selector**, não no card.

## Decision

1. **Um componente único `SessionCard` em `src/renderer/src/ui/SessionCard.tsx`** (gate HITL,
   override) — o card inteiro (meta + StatusChip + ações + painel de log), renderizado pelos
   dois pontos como `<li><SessionCard …/></li>`, exportado via `ui/index.ts`. É uma primitive
   de `ui/`: **zero imports de `app/`** (nem `SessionViewModel`, nem `isSessionActive`, nem
   `mockCatalog`) — define os próprios tipos de props (`SessionCardProps`,
   `SessionCardLogLine`, estruturalmente compatíveis com o view model do selector) e consome
   apenas primitives irmãs (IconButton, StatusChip, SemanticIcon) + tokens via `var()` (todos
   universais nos 3 concepts — nenhuma cadeia de fallback nova). CSS do card em
   `ui/primitives.module.css` (timestamp compõe a utilitária `.data` do mesmo module);
   apenas o layout da LISTA (`.sessionList`) fica em `shell.module.css` — espelho exato do
   split MetricTile/`.kpiStrip` do P2.3.
2. **Todo o mapping de domínio é resolvido UMA vez em `selectSessionViews`** (mitigação
   exigida pelo gate; ver ADR-0001): matriz status→ações (`canTogglePause`), mapping
   status→tone (`statusTone`, ex-`mapSessionStatusToTone` do Shell, + case Paused),
   aria-labels resolvidos (`togglePauseLabel`/`logLabel` via `sessionActionLabels`) e lookup
   das linhas de log (`logLines` de `mockCatalog.sessionLogs`). Os 2 call sites do Shell
   ficam idênticos e burros — espalham campos do view model + a cola local (dispatch do
   toggle, `reduceMotion`). A única lógica interna do card é apresentacional, dirigida pelo
   flag `paused`: ícone do chip (`Pause`) e do toggle (`Play`/`Pause`) — mesmo gênero de
   decisão que o `defaultIconsByTone` do StatusChip.
3. **Associação e foco**: id do painel via `useId()`; botão de log com `aria-expanded={open}`
   e `aria-controls={panelId}` (sempre presentes); painel renderizado condicionalmente logo
   APÓS o cluster de ações na ordem do DOM (AC-009). Fechar não move foco: o botão permanece
   montado e focado (AC-008 por construção; assert explícito nos testes). Disclosure
   `useState` local por instância, independente por card (AC-018) e descartado no unmount
   (D-007c).
4. **Painel**: `background: var(--canvas)` (recesso "terminal" — tese control-room), borda
   `--border`, linhas em `<ol>` com timestamp `--ink-muted` + classe `.data` (mono/tabular) e
   texto `--ink` — pares auditados (contrast-audit.md F1/F2; 6.86–17.64:1).
5. **Animação de expansão**: keyframes de entrada (opacity 0→1 + translateY(-4px)→0,
   `var(--duration-fast) var(--ease-standard)`) aplicados por classe CONDICIONAL — o prop
   `reduceMotion` (true ⇒ classe animada omitida). O valor vem de
   `useEffectiveReducedMotion()` — hook novo em `app/use-reduced-motion.ts` que compõe
   `useReducedMotionPreference() || settingsDraft.reduceMotion` (sistema OU setting do app,
   AC-015) — consumido pelas duas superfícies do Shell e adotado por `App.tsx` (que hoje
   duplica essa composição inline). O card NÃO chama o hook (é de `app/`); recebe o boolean.
   Defesa em profundidade: `@media (prefers-reduced-motion: reduce)` também zera a animação
   no CSS.

## Alternatives considered

- **`SessionCard` em `shell/`, controlado mas domain-aware (recomendação original do plan)**
  — rejeitado pelo gate HITL (override do usuário): a constraint da spec direciona novos
  componentes reusáveis ao padrão `ui/`; a objeção do plan (dependência `ui/`→`app/`) é
  eliminada pela variante adotada — props totalmente resolvidas, sem import algum de `app/` —
  e a objeção de mapping duplicado nos call sites é eliminada centralizando o mapping no
  selector (item 2).
- **`SessionActions` menor em `ui/` (só botões+painel), card duplicado nas superfícies** —
  rejeitado: o painel precisa expandir na largura do card, fora do cluster de ações — exigiria
  `display: contents` ou coordenação de layout entre componente e dois call sites duplicados;
  e manteria o markup do card duplicado (vetor de deriva do AC-010).
- **`ui/SessionCard` importando tipos/helpers de `app/`** — rejeitado: quebraria a direção de
  dependência da camada (`ui/` hoje não importa `app/`); a compatibilidade estrutural do TS
  torna o import desnecessário.
- **Estado do disclosure no `ExperienceState`** — rejeitado: D-007c fixa disclosure como
  estado local de UI; global adicionaria ação/reducer sem requisito (não precisa persistir
  entre destinos).
- **Painel sempre montado com `hidden`** — rejeitado: mantém 6–10 nós × N cards no DOM sem
  benefício (conteúdo estático, sem custo de remount) e quebra a animação de entrada por
  keyframes; `aria-controls` apontando para id ausente quando fechado é o padrão aceito do
  disclosure APG.
- **Animação via motion/react (`<motion.div>`)** — rejeitado: para um fade/slide de 1 nível,
  keyframes CSS + classe condicional são determinísticos em jsdom (assert por classe) e não
  adicionam árvore de animação; motion/react continua sendo usado onde já está (App-level).
- **Animar `height` (slide real)** — rejeitado: height auto→N exige medição de layout
  (inviável de assertar em jsdom, custo de reflow); o idioma fade+rise curto é o suficiente
  como affordance e degrada para instantâneo com reduced motion.

## Consequences

- AC-010 ganha garantia estrutural TRIPLA: dados de UMA função de merge, mapping de UMA
  função de apresentação (ambos em `selectSessionViews`, ADR-0001) + render de UM componente.
- `ui/` ganha sua terceira primitive composta (StatusChip, MetricTile, SessionCard), todas
  domain-blind com props resolvidas — a direção de dependência `ui/` ⊬ `app/` permanece
  intacta e vira critério de review desta run (import de `app/` dentro de `ui/SessionCard.tsx`
  é finding automático).
- `Shell.tsx` emagrece (mapper de sessão migra para `selectors.ts`; dois blocos de markup
  viram o MESMO map de `SessionCard`); board Sessions passa a ler estado (hoje é função
  estática).
- O view model de sessão carrega campos de apresentação (tone/labels/flags) — testáveis em
  nível de selector, sem React, com counts/nomes derivados do fixture.
- Todo teste que monte o Shell passa a exercitar `useReducedMotionPreference` via as
  superfícies (antes só via App) — o suite atual (185 testes) já prova que jsdom 29 +
  motion/react funcionam SEM stub; testes que forcem `matches: true` precisam de stub de
  matchMedia com `addEventListener` (contrato documentado no plan §Test strategy).
- O hook `useEffectiveReducedMotion` vira a fonte única da preferência efetiva (App + 2
  superfícies) — remoção de uma duplicação pré-existente, coberta pelos 48 testes de
  integração existentes.
