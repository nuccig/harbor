# Handoff: fix → consolidate

**Feature**: night-harbor-p2-kpi-strip
**Data**: 2026-07-10
**De**: sdd-fix-review (fix PASS + re-check independente CLEAN)
**Para**: consolidate-agent (step 18)
**Controlador**: handoff-agent

---

## Sumário Executivo

**Fix PASS, re-check CLEAN, feature liberada para consolidar.** Commit de fix `2eb649b` resolveu
os 5/5 achados do round `reviews-001` (2 Medium, 3 Low); re-check independente
(`reviews-001/000-recheck-clean.md`) reverificou cada um contra o working tree atual (não contra a
narrativa do próprio issue file) e não abriu achado novo. Gate: lint 0, typecheck 0, test
185/185 (15 arquivos), working tree limpo em `2eb649b` (depois consolidado em docs commits
`ab0cdcf`/`81e22d8`). Decisão HITL registrada: sem screenshot, seguindo precedente da run P2
anterior — gap documentado no round summary, não um débito oculto.

Esta run não tem nenhum achado bloqueante nem decisão pendente de HITL. O trabalho do
consolidate-agent aqui é 100% de destilação/promoção (learnings → atlas, skill update, ADR
promotion), não remediação.

---

## Learnings duráveis candidatas a atlas (technical)

### Recharts 3 × jsdom/teste — 3 gotchas empíricos (N12, N13, N14)

Todas descobertas pelo implement-agent da task 002 ao escrever
`tests/renderer/ui/metric-tile.test.tsx`; já formalizadas em `memory/learnings.md` N12-N14.
Nenhuma é específica desta feature — são propriedades da lib Recharts 3.x em qualquer contexto
jsdom, reaproveitáveis em qualquer chart futuro do projeto.

1. **N12 — `className` de `<Bar>` aparece no `<g>` wrapper E em cada `<path>`.** Um selector
   ingênuo `querySelectorAll('[class*="metricSparkBar"]')` conta `<g>` + N `<path>`s, não N.
   Fix: filtrar por `tagName === 'path'` (ou `.recharts-rectangle`) antes de comparar com
   `series.length`.
2. **N13 — `JavascriptAnimate` interno do `<Bar>` lê `window.matchMedia('(prefers-reduced-motion)')`
   e chama `.addEventListener` incondicionalmente no mount**, mesmo com `isAnimationActive={false}`.
   Um mock de `matchMedia` que só retorna `{ matches }` (sem `addEventListener`/
   `removeEventListener`) quebra o mount. Fix: stub completo de `MediaQueryList`
   (`matches`, `addEventListener`, `removeEventListener`, idealmente `addListener`/
   `removeListener` para compat legada) — o padrão mínimo usado para `@media` CSS não basta.
3. **N14 — IDs voláteis (`recharts<N>-clip`, `useId` do React 18: `:r<N>:`) quebram comparação
   direta de `innerHTML`** entre dois mounts do mesmo componente. Fix: normalizar por regex antes
   de comparar — comparação crua é falso-negativo garantido, não proteção real contra regressão.

**Cross-link explícito pedido no dispatch**: nenhum atlas learning existente cobre Recharts hoje —
estes 3 seriam entradas novas (`recharts-bar-classname-wrapper-and-path`,
`recharts-animate-matchmedia-full-stub`, `recharts-volatile-ids-normalize-before-diff`, ou
agrupados em um único `recharts-jsdom-testing-gotchas`). Ficam para o consolidate-agent decidir
granularidade.

### Processo — paralelismo com acoplamento de símbolo (N9)

Tasks 001 (Dados) e 002 (Componente) rodaram em paralelo (`depends_on: []` em ambas, confirmando a
previsão N7 de handoff anterior), mas `tests/renderer/ui/metric-tile.test.tsx` (task 002) importa
`mockCatalog.kpis.series` — campo que só existe depois que a task 001 adiciona o bloco `kpis`.
Scopes de **arquivo** eram disjuntos, mas havia acoplamento de **dado/símbolo**. O padrão aplicado
(e que funcionou): não assinar PASS por task isoladamente — rodar o verify gate uma vez contra a
árvore combinada antes de qualquer uma ser dada como concluída. Reaproveitável como heurística
geral de particionamento paralelo de tasks nesta arquitetura de camadas (`ui/` type-isolado vs.
`app/` data layer).

### Precedente confirmado 2× — audit de contraste por script na fase PLAN elimina retrabalho

Run anterior (`night-harbor-p2-statuschip-nav`): erro grave de luminância chegou à rev. 1 do
`contrast-audit.md`, só corrigido na rev. 2 pelo controller — retrabalho documentado em
`learnings.md` L-inherited-1. Nesta run: o mesmo tipo de audit (numeral sobre tile, sparkline
sobre tile) foi feito por script já na fase PLAN (ADR-0003, reconfirmado 2× — controller no gate
+ handoff-agent lendo `concepts.module.css` diretamente), **antes** de qualquer implementação.
Resultado: zero erro de contraste chegou ao review desta vez — nenhum dos 5 achados do round
`reviews-001` é sobre cor/contraste. É a segunda vez consecutiva que o padrão "script node, nunca
aritmética LLM, executado no PLAN e não só no review" se paga; candidato forte para virar regra
dura (não só recomendação) em `sdd-plan`/constitution, e para reforçar (não recriar) o atlas
learning `contrast-math-by-script` já existente com esse segundo data point.

### Dead-code cleanup na task que troca o slot (N11)

`DataList` (helper) e seletores `.dataList` em `shell.module.css` só viraram dead code depois que
a task 003 substituiu `renderReady` do slot `utility` — remoção feita na mesma task que trocou o
slot (não em task de limpeza separada), confirmada por busca (1 call site antes, 0 depois).
Heurística já registrada em D-011/N11, reaproveitável: "quando uma task de integração troca o
único consumidor de um helper/seletor compartilhado, a remoção do dead code pertence à mesma task,
desde que a busca confirme ausência de outro consumidor."

**Cross-links pedidos no dispatch, já existentes no atlas** (não recriar, só referenciar/reforçar):
`contrast-math-by-script` (reforçado pelo segundo data point acima), `css-module-class-asserts`
(reaplicado sem alteração nesta run — nenhum achado novo sobre esse padrão específico).

---

## Skill update — candidato `harbor-night-harbor-ui`

Arquivo: `.agents/skills/harbor-night-harbor-ui/SKILL.md` (não `.claude/skills/` — confirmar esse
detalhe de novo, já causou uma correção de gate na run anterior por suposição errada de path).

Precedente direto: a run anterior fez UPDATE cirúrgico (não criação) nesse mesmo arquivo,
adicionando blocos "StatusChip (P2)" e "Nav ícone+label (P2)" em **Rules**, mais uma seção
"Testing (renderer components)". Padrão a seguir aqui:

1. **Rules — novo bloco "Sparkline/MetricTile (P2.3)"**, no mesmo formato dos blocos P2
   existentes: API (`{ label, value, series }`, type-isolado de dados — N7), técnica de cor
   (`fill: var(--accent, var(--border))` + `fill-opacity: 0.75`, D-006/ADR-0003), dimensão fixa
   `48×16` sem `ResponsiveContainer` (D-008/ADR-0002), `accessibilityLayer={false}` +
   `aria-hidden` + `isAnimationActive={false}` como opt-out obrigatório (N4), `margin` sempre
   zerado em charts miniatura (N5), fallback neutro por concept legado (D-004/D-007 = accent
   nativo do concept, zero código por concept).
2. **Testing (renderer components) — extensão** com os 3 gotchas Recharts (N12-N14) resumidos
   acima, no mesmo estilo terse dos 2 pontos já existentes (substring assert / fixture-derived
   counts).
3. **References** — ADRs locais desta run (`0001-kpi-derivation-and-data-model`,
   `0002-recharts-sparkline-integration`, `0003-metrictile-color-scheme`) mais os ADRs de repo que
   forem promovidos (ver seção seguinte); atualizar a linha "ADRs 0001–0014" para o novo teto.

---

## ADR promotion — candidatos a `docs/adr/` (próximo número: 0015)

Repo tem ADRs 0001–0014 hoje (`0014-night-harbor-statuschip-color-scheme.md` foi a última
promoção, run anterior). Dois candidatos fortes desta run, ambos já formalizados como ADR local em
`.orquestrador/night-harbor-p2-kpi-strip/adr/`:

1. **`0002-recharts-sparkline-integration.md`** (local) → candidato a `docs/adr/0015-...`.
   Escopo: versão exata pinada (`recharts@^3.9.2`), peer-deps verificados contra
   `react@^18.3.1`, superfície de import mínima (`{ Bar, BarChart }`), decisão de não usar
   `ResponsiveContainer` (jsdom sem `ResizeObserver`), `accessibilityLayer={false}` como
   descoberta empírica (Recharts 3.x liga `role="application"`+`tabindex` por default). Permanente
   e reaproveitável para **qualquer** chart Recharts futuro no projeto, não só o MetricTile —
   forte candidato a promoção.
2. **`0003-metrictile-color-scheme.md`** (local) → candidato a `docs/adr/0016-...`. Escopo:
   numeral `var(--ink)` sobre `--surface-raised`, sparkline `var(--accent, var(--border))` +
   `fill-opacity: 0.75`, ratios auditados nos 3 concepts, trade-off AC-014 (accent nativo do
   concept legado, não cinza literal) com alternativas rejeitadas documentadas. Mesmo padrão de
   permanência do ADR-0014 anterior (StatusChip) — esse aqui é o equivalente para tiles/sparkline.

**Não promovido (avaliar se vale)**: `0001-kpi-derivation-and-data-model.md` (local) — fórmula
"agentes ativos" = sessões `Running` é mais lógica de negócio desta feature específica do que
padrão de arquitetura reaproveitável; provavelmente fica só como ADR local, sem promoção a
`docs/adr/`, mas a decisão final é do consolidate-agent.

---

## Decisões/learnings novos nesta fase

**Nenhum.** Toda a matéria-prima já está registrada em `memory/decisions.md` (D-001 a D-011,
todas fechadas/aprovadas, nenhuma pendência) e `memory/learnings.md` (L-inherited-1..5, N1..N14).
Este handoff é destilação/reorganização para o consolidate-agent, não descoberta nova — nenhum
append foi feito em `decisions.md`/`learnings.md`.

---

## Arquivos tocados nesta run (para skill-gap analysis do consolidate)

- `src/renderer/src/app/mock-catalog.ts` — bloco `kpis` novo (task 001)
- `src/renderer/src/app/selectors.ts` — `buildKpiViewModels`, `overviewCopy.kpis`,
  `isSessionActive`, `resolveAgentTime` extraídos no fix (tasks 001 + fix)
- `src/renderer/src/ui/MetricTile.tsx` — componente novo (task 002)
- `src/renderer/src/ui/index.ts` — export novo (task 002)
- `src/renderer/src/ui/primitives.module.css` — regras `.metricTile*`/`.metricSparkBar*` novas
  (task 002)
- `src/renderer/src/shell/Shell.tsx` — integração do slot `utility` (task 003), import de
  `isSessionActive` (fix)
- `src/renderer/src/shell/shell.module.css` — remoção de `.dataList`/`.projectSummary` combinado,
  D-011 (task 003)
- `package.json` / `package-lock.json` — `recharts@^3.9.2` novo, dono único = task 002 (D-010)
- Testes: `tests/renderer/model/selectors.test.ts`, `tests/renderer/ui/metric-tile.test.tsx`,
  `tests/renderer/shell-settings/shell-settings.test.tsx` — cobertura nova + extensões do fix

---

## Rastreabilidade

- **Fontes**: `memory/learnings.md` (N1-N14, L-inherited-1..5), `memory/decisions.md`
  (D-001-D-011), `memory/state.md` (histórico completo), `reviews-001/000-recheck-clean.md`,
  `.orquestrador/night-harbor-p2-kpi-strip/adr/0001..0003-*.md`,
  `.agents/skills/harbor-night-harbor-ui/SKILL.md` (estado atual, pré-update),
  `.orquestrador/night-harbor-p2-statuschip-nav/memory/consolidation.md` (precedente de formato
  e de path correto da skill).
- **Decisões/learnings novos**: nenhum (ver seção acima).
- **state.md**: não tocado (fora do escopo do handoff-agent).
- **Git**: nenhuma operação realizada por este handoff.
- **Próxima fase**: consolidate-agent decide granularidade dos atlas learnings (Recharts
  agrupado vs. separado), aplica update na skill `harbor-night-harbor-ui`, decide promoção dos
  ADRs 0002/0003 locais para `docs/adr/0015`/`0016`, e prepara candidatos para brain-sync (step
  19.5) — escrita fora do diretório da feature requer autorização explícita do controller, mesmo
  precedente da run anterior.
