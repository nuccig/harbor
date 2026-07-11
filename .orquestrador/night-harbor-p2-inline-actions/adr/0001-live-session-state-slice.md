---
id: 0001
title: Live session state — sparse paused-ids set + seed-agnostic reducer + single merge selector
status: accepted
date: 2026-07-10
---

# ADR-0001 — Live session state: sparse paused-ids set + seed-agnostic reducer + single merge selector

## Context

O `ExperienceState` não tem hoje nenhum campo de status de sessão (handoff-001.md Descobertas
#1): os 3 consumidores — painel "Active agent sessions" do Overview (`selectors.ts:202`),
board Sessions (`Shell.tsx:297`) e KPI "Active agents" (`buildKpiViewModels`,
`selectors.ts:101`) — leem `mockCatalog.sessions` congelado diretamente. G3/D-005 exigem
estado vivo no `ExperienceState` via ação do reducer, com o catálogo permanecendo seed
imutável (AC-019), fonte única para as 3 superfícies (AC-010/AC-011) e reset no reload
(AC-013). A única transição viva que existe é Running⇄Paused (matriz G3: Ready/Complete nunca
transicionam).

Restrições estruturais: `mock-catalog.ts` importa tipos de `experience-model.ts` (import
type); um reducer que consultasse o seed criaria dependência de módulo na direção inversa.

## Decision

1. **Shape do slice**: `pausedSessionIds: readonly string[]` em `ExperienceState`, semeado
   como `[]` em `createInitialExperienceState()` (reset on reload por construção — AC-013).
   Representação mínima da única transição existente: uma sessão está Paused sse seu id está
   no set E seu status de seed é pausável.
2. **Ação**: `{ type: 'toggleSessionPaused'; sessionId: string }` — o case do reducer apenas
   alterna a pertinência do id no array (add/remove). Função pura, **seed-agnóstica**: o
   reducer não importa `mockCatalog` (sem ciclo de módulo, sem conhecimento de domínio de
   status no reducer).
3. **Merge em um único selector**: `selectSessionViews(state): readonly SessionViewModel[]`
   em `selectors.ts` compõe seed + set:
   `status = pausedSessionIds.includes(id) && isSessionActive(seed.status) ? 'Paused' : seed.status`.
   O guard `isSessionActive` (fonte única de "ativo", `selectors.ts:90`) garante que um id
   espúrio no set nunca pinta Ready/Complete como Paused.
4. **Os 3 consumidores derivam do selector, nunca do catálogo cru**: o slice `sessions` do
   Overview embrulha `selectSessionViews(state)` em `selectScenarioSlice`; o board Sessions
   chama `selectSessionViews(state)` direto (ganha estado, continua sem cenários — paridade
   com o comportamento atual do board); `buildKpiViewModels` muda de assinatura para receber
   `sessions: readonly SessionViewModel[]` (a lista já mesclada) — a contagem "Active agents"
   passa a refletir pausas (AC-011/D-007a) sem duplicar merge. A série da sparkline permanece
   o fixture estático (D-007a).

## Alternatives considered

- **Overrides esparsos `Record<string, 'Running' | 'Paused'>`** — carrega um estado
  redundante (`'Running'` override ≡ ausência de override) e abre espaço para um Record
  inconsistente; o set de ids pausados é o mesmo poder expressivo com metade dos estados
  representáveis inválidos a menos.
- **Snapshot completo da lista de sessões no estado** — duplica campos imutáveis
  (agent/task) no estado vivo, viola "catálogo é seed, nunca copiado mutável" (AC-019) e cria
  duas fontes de verdade para os campos que não mudam.
- **Reducer consulta o seed para validar a transição** — exigiria importar `mockCatalog` em
  `experience-model.ts` (ciclo de módulo com o import type existente na direção oposta) e
  moveria semântica de domínio para dentro do reducer; o guard no selector obtém a mesma
  segurança sem o acoplamento.
- **Ação `setSessionStatus(sessionId, status)`** — mais genérica do que o domínio atual
  permite (só existe toggle Running⇄Paused); um payload de status arbitrário permitiria
  estados sem significado (ex.: setar Complete→Running) que o toggle torna inexpressáveis.

## Consequences

- AC-010 por construção: as duas superfícies e o KPI leem a MESMA função de merge — não há
  derivação duplicada para divergir (precedente `isSessionActive`, review 003 do P2.3).
- AC-013/AC-019 por construção: seed intocado (`Object.freeze` já garante), estado vivo só em
  memória, `[]` inicial.
- `buildKpiViewModels` parametrizada fica testável sem singleton e os testes existentes de
  selectors continuam derivando do fixture (estado default ⇒ merge ≡ seed).
- O tipo do slice `sessions` do `OverviewViewModel` muda de
  `ScenarioSlice<typeof mockCatalog.sessions>` para
  `ScenarioSlice<readonly SessionViewModel[]>` — mudança aditiva (campos do seed preservados
  + status estreitado para união + campos de apresentação resolvidos que o gate HITL moveu
  para o selector: tone/flags/labels/logLines, ver ADR-0004), consumidores existentes seguem
  compilando.
- Transições futuras (ex.: cancelar) exigirão evoluir o shape (o set só expressa pausa) — se
  isso acontecer, novo ADR supersede este.
