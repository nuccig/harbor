# Handoff: review → fix

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: sdd-review (reviews-001, 5 dimensões paralelas + spot-check do review-agent)
**Para**: sdd-fix-review
**Controlador**: handoff-agent

---

## Sumário Executivo

**Round PASS — 0 Critical, 0 High, 2 Medium, 3 Low. 18/18 ACs Implemented. Nada bloqueia merge.**
Todos os 5 achados têm fix concreto e pequeno, confinado a arquivos de teste (001, 002, 004) ou a
uma decisão de escopo mínimo em código de produção (003) / documentação (005). Nenhum achado é
defeito funcional confirmado — ver `reviews-001/000-round-summary.md` para o veredito completo por
dimensão.

| # | Severidade | Local | Classe |
|---|---|---|---|
| 001 | Medium | `tests/renderer/shell-settings/shell-settings.test.tsx:132` | count hardcoded, não derivado do fixture |
| 002 | Medium | `tests/renderer/shell-settings/shell-settings.test.tsx` (cobertura ausente) | gap de teste — cenário loading/empty/error do grupo Key metrics não exercitado no render |
| 003 | Low | `src/renderer/src/app/selectors.ts:88` + `src/renderer/src/shell/Shell.tsx` (`mapSessionStatusToTone`) | duplicação de literal `'Running'` sem fonte única |
| 004 | Low | `src/renderer/src/app/selectors.ts:90-91` | branch de fallback `'—'` não exercitado |
| 005 | Low | `spec.md:151-153` (AC-013) vs. implementação | wording da spec ambíguo vs. leitura já aprovada (ADR-0003) |

**Verify gate obrigatório após os fixes** (todos, não apenas um subconjunto):
`npm run lint && npm run typecheck && npm run test` — deve manter 0/0/181+ (o total de testes deve
subir com 002 e 004, que adicionam casos novos; não deve cair).

---

## Achado 001 (Medium) — tile count hardcoded

**Arquivo**: `tests/renderer/shell-settings/shell-settings.test.tsx:132`
**Issue file**: `reviews-001/001-hardcoded-tile-count.md`

```ts
const tiles = group.getAllByRole('listitem')
expect(tiles).toHaveLength(4)   // ← bare literal
```

Toda contagem vizinha nesse mesmo teste (linhas 134-141: `activeAgentsCount`, `issueQueueCount`,
`successRate`, `agentTime`) já deriva de `mockCatalog` — só o count de tiles ficou como literal
solto. `mockCatalog` já está importado neste arquivo (linha 14, usado 2 linhas abaixo).

**Fix esperado** (já sugerido no issue file, aplicar como está):
```ts
const expectedTileCount = Object.keys(mockCatalog.kpis.series).length
expect(tiles).toHaveLength(expectedTileCount)
```
Confirmado: `mockCatalog.kpis.series` tem exatamente as 4 chaves
(`active-agents`, `queue`, `success-rate`, `agent-time`) em
`src/renderer/src/app/mock-catalog.ts:139-144`.

**Precedente direto**: mesma classe de achado que o finding **101** do round anterior
(`night-harbor-p2-statuschip-nav/reviews-001`, "brittle hardcoded agent count") — resolvido lá
exatamente derivando do fixture (`Option A` do handoff-005 daquela feature). Aplicar o mesmo
padrão aqui, não uma variante.

---

## Achado 002 (Medium) — sem render-test do loading/empty/error do grupo Key metrics

**Arquivo**: `tests/renderer/shell-settings/shell-settings.test.tsx` (cobertura ausente)
**Issue file**: `reviews-001/002-missing-kpi-scenario-render-test.md`

Hoje só `tests/renderer/model/selectors.test.ts:109-135` cobre as strings de copy do slice `kpis`
(nível view-model, não renderiza nada). `shell-settings.test.tsx` só tem o teste do cenário
`default`/ready (linha 112-160). O matrix de `app-integration.test.tsx` (linhas 25-47, 153-155)
não isola o grupo "Key metrics" — o assert de erro ali (`getAllByRole('button', {name: 'Try
again'}).length > 0`) passaria mesmo se o slot `kpis` estivesse quebrado, porque os outros 4
grupos do Overview já satisfazem esse assert independentemente.

**Gap concreto a fechar**: nenhum harness em `shell-settings.test.tsx` hoje dispara a action
`selectScenario`. O padrão de dispatch existe só em `app-integration.test.tsx`
(`SeedExperience`, linhas 49-59, despacha `{ type: 'selectScenario', scenario }` via
`useExperienceDispatch` antes do mount). `shell-settings.test.tsx` só tem
`OnboardingCompletionHarness` (linhas 39-52), que despacha `completeOnboarding` mas não
`selectScenario`.

**Fix esperado**: adicionar teste(s) em `shell-settings.test.tsx` que:
1. Disparem `selectScenario` para `'loading'`, `'empty'` e `'error'` (precisa de um harness novo
   ou extensão do existente, análogo a `SeedExperience`, já que nenhum componente atual do arquivo
   despacha essa action).
2. Completem onboarding e cheguem no Overview como o teste da linha 112 já faz.
3. Usem o padrão já estabelecido `within(keyMetricsGroup)` (linhas 123-129) para escopar os
   asserts ao grupo "Key metrics" especificamente, e verificar:
   - `loading` → `'Loading key metrics…'`
   - `empty` → `'No metrics yet'` + `'Metrics appear after simulated agent sessions run.'`
   - `error` → `'Key metrics could not be loaded'` + botão "Try again" escopado com
     `within(group)`

Copy exata das 4 strings vem de `overviewCopy.kpis` em
`src/renderer/src/app/selectors.ts:159-165` — não inventar, usar essas strings literalmente.

---

## Achado 003 (Low) — `'Running'` duplicado sem fonte única

**Arquivos**: `src/renderer/src/app/selectors.ts:88` (`buildKpiViewModels`) e
`src/renderer/src/shell/Shell.tsx:33-40` (`mapSessionStatusToTone`)
**Issue file**: `reviews-001/003-duplicated-active-status-literal.md`

Decisão a tomar pelo fix-agent (dispatch pede avaliar explicitamente, não aplicar cegamente):
constante/predicado compartilhado vs. aceitar a duplicação documentada (ADR-0001 R2 já discute e
aceita esse acoplamento como "FECHADO", e há um teste derivado do fixture que protege o valor
atual — não é um defeito, é um smell de manutenibilidade opcional).

**Se optar por extrair**: nota de direção de dependência — `Shell.tsx` já importa de
`../app/selectors` e `../app/mock-catalog` (linhas 15-17), nunca o inverso. Um predicado
compartilhado (`isSessionActive(status: string): boolean`) deveria, portanto, ser definido e
exportado em `src/renderer/src/app/selectors.ts` (camada `app/`) e importado por `Shell.tsx` —
não o contrário, o que inverteria a direção de dependência já estabelecida (shell → app).

**Se optar por não extrair**: resolução no issue file deve justificar com base no ADR-0001 R2 já
citado (aceito) e registrar a decisão como `wontfix` documentado, não deixar em aberto.

---

## Achado 004 (Low) — fallback `'—'` de `agent-time` não exercitado

**Arquivo**: `src/renderer/src/app/selectors.ts:90-91`
**Issue file**: `reviews-001/004-unexercised-agent-time-fallback.md`

```ts
const agentTime =
  mockCatalog.recentUsage.find((u) => u.label === 'Agent time')?.value ?? '—'
```

`buildKpiViewModels()` não é exportada e lê `mockCatalog` como singleton de módulo — não dá para
injetar um `recentUsage` alternativo sem mudança de código. O próprio issue file sugere "uma
extração testável da lógica de lookup". Duas rotas possíveis para o fix-agent decidir:
- Extrair o lookup (`resolveAgentTime(recentUsage): string`) como função pura exportada de
  `selectors.ts`, testável diretamente com um array sem o label `'Agent time'`.
- Ou `vi.mock` do módulo `mock-catalog` no teste, substituindo `recentUsage` por uma versão sem
  esse label.

Adicionar o teste em `tests/renderer/model/selectors.test.ts` (mesmo arquivo que já cobre os
outros 3 cenários do slice `kpis`, linhas 105-137).

---

## Achado 005 (Low) — wording de AC-013 vs. leitura já aprovada

**Arquivo**: `spec.md:151-153` (AC-013) vs. `MetricTile.tsx`/`primitives.module.css`
**Issue file**: `reviews-001/005-ac013-token-wording-gap.md`

Não é defeito de código — é gap de documentação. AC-013 lista "sucesso/atenção/accent" como pool
de tokens aceitáveis; a implementação usa só `--ink`/`--accent`, leitura já aprovada no gate HITL
do plan (ADR-0003, "Alternatives considered"). Decisão a tomar pelo fix-agent, com justificativa
registrada no issue file (dispatch pede decidir entre as duas, não default):
- **Opção recomendada**: anotar `spec.md` AC-013 com uma nota de rodapé/parêntese apontando para
  ADR-0003, deixando explícito que "sucesso/atenção/accent" é um pool (satisfeito por qualquer
  membro), não um mandato de usar os três — fecha o gap para qualquer leitor futuro que não
  cruze com o ADR. Custo mínimo, sem risco.
- **Alternativa**: resolver só como nota no issue file (doc-only, sem tocar `spec.md`) — mais
  barato, mas deixa o texto da spec ambíguo para quem ler só `spec.md` sem passar pelos issue
  files do review.

Qualquer que seja a escolha, **não editar** `MetricTile.tsx`/`primitives.module.css` — a
implementação já está correta e aprovada, o gap é só de texto.

---

## Escopo de arquivos esperado (para conferência do fix-agent, não exaustivo)

- `tests/renderer/shell-settings/shell-settings.test.tsx` — 001, 002 (e possivelmente harness
  novo de dispatch de scenario)
- `src/renderer/src/app/selectors.ts` — 003 (se optar por extrair) e 004 (extração do lookup)
- `src/renderer/src/shell/Shell.tsx` — 003 (se optar por extrair, só o import/uso do predicado)
- `tests/renderer/model/selectors.test.ts` — 004 (teste novo do fallback)
- `spec.md` — 005 (se optar por anotar, só a linha do AC-013)
- Todos os 5 arquivos em `reviews-001/*.md` — atualizar front-matter `status: resolved` (ou
  `wontfix` com justificativa, se aplicável a 003/005) + seção `## Resolution` preenchida,
  padrão `sdd-fix-review`.

---

## Verify gate obrigatório

`npm run lint && npm run typecheck && npm run test` — rodar depois de todos os fixes aplicados,
não incrementalmente achado-a-achado. Baseline atual (confirmado 3× em fases anteriores,
`memory/handoff-004.md` e `reviews-001/000-round-summary.md`): lint 0, typecheck 0, test
181/181 (15 arquivos). Esperado após os fixes: mesma contagem de lint/typecheck, test count
**maior que 181** (002 e 004 adicionam casos novos; nenhum caso existente deve ser removido ou
enfraquecido).

---

## Rastreabilidade

- **Fontes**: `reviews-001/000-round-summary.md`, `reviews-001/001..005-*.md`,
  `memory/handoff-004.md`, `src/renderer/src/app/selectors.ts`, `src/renderer/src/app/mock-catalog.ts`,
  `src/renderer/src/shell/Shell.tsx`, `tests/renderer/shell-settings/shell-settings.test.tsx`,
  `tests/renderer/model/selectors.test.ts`, `tests/renderer/integration/app-integration.test.tsx`,
  `spec.md` AC-013, `.orquestrador/night-harbor-p2-statuschip-nav/memory/handoff-005.md`
  (precedente do finding 101, mesma classe do 001 aqui).
- **Decisões/learnings novos**: nenhum. Esta fase é triagem operacional dos 5 achados do review
  para o fix-agent executar — nenhuma decisão de arquitetura/design nova surgiu (as duas
  bifurcações reais, 003 e 005, ficam explicitamente delegadas ao fix-agent para decidir e
  justificar no próprio issue file, não pré-decididas aqui). `memory/decisions.md` e
  `memory/learnings.md` não receberam entrada nova. `state.md` não tocado (fora do escopo do
  handoff-agent).
- **Próxima fase**: `sdd-fix-review` resolve os 5 issues, atualiza os issue files (status +
  resolução), e roda o verify gate completo antes de reportar.
