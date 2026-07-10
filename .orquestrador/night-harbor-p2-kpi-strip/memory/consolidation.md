# Consolidation Report — night-harbor-p2-kpi-strip

**Data**: 2026-07-10
**Agente**: consolidate-agent (SDD pipeline, step 18)
**Status**: PROPOSTAS PRONTAS — aguardando gate HITL (nada aplicado fora deste diretório)

Fontes: `memory/handoff-006.md` (candidatos organizados), `memory/{decisions,learnings,state}.md`,
`reviews-001/`, `adr/0001..0003`, `.agents/skills/harbor-night-harbor-ui/SKILL.md` (estado atual),
`docs/adr/` (numeração verificada), `C:\Users\gustavo\projetos\atlas\learnings\` (inventário verificado),
`.orquestrador/night-harbor-p2-statuschip-nav/memory/consolidation.md` (precedente de formato e path).

---

## 1. Lessons duráveis (falha observada → causa → regra reutilizável)

### LD-1: Recharts 3 × jsdom — contagem de barras superestima +1 (N12)

- **Falha**: teste de contagem de barras via `querySelectorAll('[class*="metricSparkBar"]')`
  retornava `series.length + 1`.
- **Causa**: Recharts aplica a prop `className` de `<Bar>` no `<g>` wrapper da série **e** em cada
  `<path class="recharts-rectangle">` individual.
- **Regra**: ao contar marcas de um `<Bar>`, filtrar por `tagName === 'path'` (ou selector
  `.recharts-rectangle`) antes de comparar com `series.length`. Nunca contar por classe crua.

### LD-2: Recharts 3 × jsdom — mock mínimo de `matchMedia` quebra o mount (N13)

- **Falha**: mount de `<Bar>` quebrava com erro de função ausente, mesmo com
  `isAnimationActive={false}`.
- **Causa**: o `JavascriptAnimate` interno do `<Bar>` consulta
  `window.matchMedia('(prefers-reduced-motion)')` e chama `.addEventListener` **incondicionalmente
  no mount** — independe do valor de `isAnimationActive`. O mock mínimo `{ matches }` (suficiente
  para testar `@media` CSS) não tem os métodos.
- **Regra**: qualquer teste que monte componente Recharts em jsdom precisa de stub completo de
  `MediaQueryList` (`matches`, `addEventListener`, `removeEventListener`; `addListener`/
  `removeListener` para compat com libs de terceiros). Nota: isso **não contradiz** o atlas
  `matchmedia-legacy-fallback-dead-code` — aquela nota é sobre código de app; aqui é stub de teste
  satisfazendo internals de lib de terceiros.

### LD-3: Recharts/React — IDs voláteis invalidam comparação crua de `innerHTML` (N14)

- **Falha**: teste de equivalência reduced-motion on/off (AC-015) comparando `innerHTML` de dois
  mounts falhava com dados idênticos.
- **Causa**: Recharts gera `recharts<N>-clip` não-determinístico por render; React 18 gera `:r<N>:`
  via `useId`. Dois mounts idênticos diferem só nesses IDs.
- **Regra**: teste de "renderização idêntica em dois cenários" com componente Recharts (ou qualquer
  componente com `useId`) deve normalizar IDs voláteis por regex → placeholder fixo antes de
  comparar. Comparação crua é falso-negativo garantido.

### LD-4: Scopes de arquivo disjuntos ≠ tasks independentes (N9)

- **Falha (potencial, evitada)**: tasks 001 (Dados) e 002 (Componente) paralelas com file scopes
  100% disjuntos; mas o teste da 002 importa `mockCatalog.kpis.series` — símbolo que só existe
  depois da 001. Um PASS assinado por task isolada seria evidência falsa.
- **Causa**: particionamento por **arquivo** não captura acoplamento por **dado/símbolo**
  (teste da task de componente lê fixture cujo dono é a task de dados).
- **Regra**: quando tasks paralelas compartilham acoplamento de símbolo, (a) declarar o acoplamento
  no corpo das tasks (feito aqui em "Known cross-task data coupling"), e (b) o verify gate roda
  **uma vez contra a árvore combinada** antes de qualquer task ser assinada PASS. Reaproveitável em
  qualquer arquitetura em camadas (`ui/` type-isolado × data layer).

### LD-5: Audit de contraste por script na fase PLAN elimina o retrabalho (2º data point)

- **Falha (run anterior)**: erro de luminância ~14× + fórmula invertida chegaram à rev. 1 do audit;
  correção só no review (retrabalho documentado).
- **Causa**: aritmética LLM em vez de script; audit tardio (pós-implementação).
- **Regra (reforçada 2×)**: WCAG por script node, nunca aritmética LLM — **e executado na fase
  PLAN**, não só no review. Nesta run o audit rodou no plan (ADR local 0003, reconfirmado 2× por
  script) e **zero** achado de cor/contraste chegou ao review (0 dos 5 findings). Candidato a regra
  dura em `sdd-plan`/constitution (ver Proposta item 8, opcional).

### LD-6: Regra escrita na spec não impede a recorrência — literal hardcoded voltou (finding 001)

- **Falha**: `toHaveLength(4)` hardcoded no teste de integração, apesar de a spec desta run citar
  "número de tiles" como exemplo explícito do que nunca pode ser literal (e de o atlas
  `css-module-class-asserts-substring-and-fixture-derived` existir desde a run anterior, finding 101
  — mesma classe de issue).
- **Causa**: regra registrada ≠ regra aplicada; o implement-agent segue o caminho de menor
  resistência sob pressão de contexto.
- **Regra**: counts fixture-derived é item de **checklist de review permanente** sobre qualquer diff
  de teste, não fix pontual. Cross-link proposto no atlas (item 7).

### LD-7: Dead code órfão remove-se na task que o orfana (N11/D-011)

- **Falha (potencial, evitada)**: `DataList` + seletores `.dataList` ficariam órfãos após a task 003
  trocar o único call site.
- **Causa**: troca de consumidor único transforma helper compartilhado em dead code no mesmo commit.
- **Regra**: quando uma task de integração troca o único consumidor de um helper/seletor, a remoção
  do dead code pertence à mesma task — desde que busca confirme 0 outros consumidores (aqui: 1 call
  site antes, 0 depois, verificado). **Não promovido ao atlas** (heurística de 1 data point, valor
  marginal fora do pipeline; fica registrada aqui e em learnings.md N11).

### Learnings herdados reaplicados sem alteração

L-inherited-1..5 (contrast-by-script, contraste vs. canvas, css-module asserts, on-token semantics,
motion override) — reaplicados sem descoberta nova além dos reforços LD-5/LD-6 acima. N1–N8, N10:
absorvidos pelos ADRs locais e pelas regras acima; nada a promover além do listado.

---

## 2. Skill gaps

**Skill**: `.agents/skills/harbor-night-harbor-ui/SKILL.md` (path confirmado por leitura direta —
**não** `.claude/skills/`; erro de suposição já corrigido na run anterior).

Arquivos tocados nesta run × cobertura atual da skill:

| Arquivo | Coberto hoje? |
| --- | --- |
| `src/renderer/src/ui/MetricTile.tsx` (novo) | ✗ — nenhum bloco MetricTile/Sparkline |
| `src/renderer/src/ui/primitives.module.css` (`.metricTile*`/`.metricSparkBar*`) | ✗ — técnica className+CSS module p/ Recharts ausente |
| `tests/renderer/ui/metric-tile.test.tsx` | ✗ — 3 gotchas Recharts×jsdom ausentes da seção Testing |
| `src/renderer/src/app/{mock-catalog,selectors}.ts` | n/a — skill é de UI; padrão type-isolado citado no bloco novo |
| `src/renderer/src/shell/Shell.tsx` + `shell.module.css` | ✓ — padrões existentes bastam |
| References "ADRs 0001–0014" | ✗ — desatualiza com as promoções 0015/0016 |

Gap de processo (fora da skill de UI): LD-4 (verify gate conjunto) e LD-5 (audit no plan) são gaps
de `sdd-plan`/`sdd-tasks`/constitution, não desta skill — endereçados via atlas (itens 5–6) e
proposta opcional (item 8).

---

## 3. PROPOSTA 1 — Update da skill `harbor-night-harbor-ui` (DIFF, não aplicado)

### 3a. Rules — inserir novo bullet após o bloco "Nav ícone+label (P2)"

```diff
   Active pill on `[aria-current='page']`: `--surface-active` background + `--accent` border.
+- **MetricTile/Sparkline (P2.3)**: KPI tiles live in `src/renderer/src/ui/MetricTile.tsx`.
+  Props are primitives only (`{ label, value, series: readonly number[] }`) — the component is
+  type-isolated from `selectors.ts`/`mock-catalog.ts` (enables parallel data/component tasks).
+  Tile background `var(--surface-raised)`; numeral plain `var(--ink)` — no tone-per-KPI without
+  a defined business threshold. Sparkline: Recharts `{ Bar, BarChart }` named imports only;
+  fixed `width={48} height={16}` — **no** `ResponsiveContainer` (jsdom has no `ResizeObserver`);
+  `margin` zeroed (Recharts' default margin consumes over half of a 16px canvas); decorative
+  opt-out is mandatory: `accessibilityLayer={false}` (Recharts 3 injects `role="application"` +
+  `tabindex="0"` by default) + `aria-hidden` wrapper + `isAnimationActive={false}` +
+  `pointer-events: none`. Bar color via `className` + CSS module
+  `fill: var(--accent, var(--border))` + `fill-opacity: 0.75` — never the `fill` prop (the
+  presentation attribute loses to the cascade; the CSS-module rule is how `var()` resolves per
+  concept). Audited ratios: sparkline 4.16/3.64/3.80:1 (≥3:1 non-text), numeral
+  14.09/16.96/15.78:1 across the 3 concepts. Legacy concepts render their **native** accent
+  (zero per-concept code) — resolved reading of "neutral degradation" (ADR-0016).
```

### 3b. Testing (renderer components) — acrescentar 3 bullets ao fim da seção

```diff
   (`mockCatalog.agents.filter(...).length`), never hardcoded literals. (atlas learning:
   `css-module-class-asserts-substring-and-fixture-derived`)
+- Recharts `<Bar className>` lands on the `<g>` series wrapper AND on each `<path>` — counting
+  bars by raw class selector over-counts by +1. Filter `tagName === 'path'` (or use
+  `.recharts-rectangle`) before comparing with `series.length`.
+- Recharts 3 `<Bar>` mounts `JavascriptAnimate`, which calls
+  `window.matchMedia('(prefers-reduced-motion)').addEventListener` unconditionally — even with
+  `isAnimationActive={false}`. jsdom tests need a full `MediaQueryList` stub (`matches`,
+  `addEventListener`, `removeEventListener`, plus `addListener`/`removeListener` for lib
+  compat); the minimal `{ matches }` stub breaks the mount.
+- Recharts clip-path ids (`recharts<N>-clip`) and React 18 `useId` output (`:r<N>:`) are
+  volatile per mount — normalize them via regex to a fixed placeholder before comparing
+  `innerHTML` between two renders; raw string comparison is a guaranteed false negative.
+  (atlas learning: `recharts-jsdom-testing-gotchas`)
```

### 3c. Anti-patterns — acrescentar 2 bullets

```diff
 - **Never** assert CSS module classes with literal `toHaveClass` — hashed class names break it;
   use substring matching (`[class*="..."]` + `className.toContain`).
+- **Never** color a Recharts mark via the `fill`/`stroke` props when it must follow the token
+  system — use `className` + CSS module so `var()` resolves in the cascade (the presentation
+  attribute always loses to the CSS rule).
+- **Never** mount a decorative Recharts chart with the library defaults — without
+  `accessibilityLayer={false}` it becomes a keyboard tab-stop (`role="application"` +
+  `tabindex="0"`), and without zeroed `margin` a sparkline-scale chart is mostly invisible.
```

### 3d. References — atualizar teto de ADRs e adicionar ADRs locais da run

```diff
-- ADRs 0001–0014 (`docs/adr/`)
+- ADRs 0001–0016 (`docs/adr/`)
+- `.orquestrador/night-harbor-p2-kpi-strip/adr/` (run-local: 0001 KPI derivation, 0002 Recharts
+  integration → docs 0015, 0003 MetricTile colors → docs 0016)
```

(Linha "ADRs 0001–0016" condicionada à aprovação dos itens 2–3; se apenas um for aprovado, ajustar
o teto correspondente.)

---

## 4. PROPOSTA 2 e 3 — Promoção de ADRs para `docs/adr/` (CONTEÚDO, não criado)

Numeração verificada por listagem direta de `docs/adr/`: existem 0001–0014
(último: `0014-night-harbor-statuschip-color-scheme.md`). **Próximos livres: 0015 e 0016.**

Critério (atlas `orquestrador-adr-promotion-at-consolidate`): promove-se no consolidate o ADR local
aceito e **reaproveitável além da feature**; o run-local permanece como registro da run.

### Item 2 — `docs/adr/0015-recharts-sparkline-integration.md` (de adr/0002 local)

**Justificativa**: permanente e reaproveitável para qualquer chart Recharts futuro (versão pinada,
peer-deps, superfície de import, dimensão fixa vs. ResponsiveContainer, opt-out de acessibilidade/
animação). Mesma classe de permanência do 0014.

Conteúdo proposto (formato dos docs/adr 0010–0014):

```markdown
# ADR 0015 — Recharts sparkline integration: pinned 3.x, minimal imports, fixed dimensions, inert rendering

## Status

accepted

## Context

Night Harbor P2.3 introduces a static, decorative bar sparkline inside `MetricTile`
(`src/renderer/src/ui/MetricTile.tsx`). Recharts was approved as a new dependency (HITL G3).
Open engineering questions — exact version/peer-deps, import surface, whether
`ResponsiveContainer` is required (jsdom has no `ResizeObserver`), and how to make the chart
fully inert — were settled empirically in an isolated probe matching the repo's exact
toolchain (`recharts@3.9.2`, `react@18.3.1`, `vitest@2.1.9`, `jsdom@29.1.1`,
`@testing-library/react@16.3.2`), not inferred from docs.

## Decision

- **Version**: `"recharts": "^3.9.2"` in `dependencies`. Peer deps
  (`react`/`react-dom`/`react-is` `^16.8 || ^17 || ^18 || ^19`) satisfied by the installed
  `react@^18.3.1`; `react-is` already present transitively.
- **Import surface**: `import { Bar, BarChart } from 'recharts'` — nothing else. `BarChart` +
  `Bar` alone render a clean bars-only `<svg>` (no incidental axis/grid/tooltip DOM).
- **Dimensions**: fixed `width={48} height={16}`, **no `ResponsiveContainer`**. Verified to
  render in jsdom even with `ResizeObserver` deleted from `globalThis` — the non-responsive
  path never calls it. `tests/renderer/setup.ts` stays untouched.
- **Margin**: `margin={{ top: 0, right: 0, bottom: 0, left: 0 }}`. The library default
  consumes over half of a 16px canvas (bars topped ~5.5px of 16 vs ~14.7px zeroed) — at
  sparkline scale this is visible-vs-invisible, not styling.
- **Inert/decorative rendering**: `accessibilityLayer={false}` on `<BarChart>` (Recharts 3
  injects `role="application"` + `tabindex="0"` by default — removed entirely by the flag);
  `aria-hidden` wrapper at the component level; `isAnimationActive={false}` on `<Bar>` (static
  by construction, no `useReducedMotion()` ternary needed); no `<Tooltip>` mounted;
  `pointer-events: none` on the chart container.

## Alternatives

- **`ResponsiveContainer` + `ResizeObserver` polyfill in test setup** — rejected: global
  test-environment dependency for a fixed-size design element; fixed dimensions verified to
  need zero jsdom accommodation.
- **`import * as Recharts`** — rejected: spec mandates named imports.
- **Stripping `role`/`tabindex` post-render via ref effect** — rejected:
  `accessibilityLayer={false}` removes them natively; a DOM patch is fragile across versions.
- **Suppressing mount animation via global CSS `animation: none`** — rejected:
  `isAnimationActive={false}` is the library's supported mechanism.

## Consequences

- Recharts 3's internal state is Redux-backed regardless of chart type: `@reduxjs/toolkit`,
  `react-redux`, `immer`, `victory-vendor` etc. ship with `BarChart` itself (~7.3MB unpacked).
  Named imports avoid unused chart types but not this chain — accepted, disclosed cost;
  mitigation if it ever matters is code-splitting via dynamic `import()`, not import style.
- Any future Recharts chart reuses this pattern: pinned 3.x, named imports, fixed dimensions
  (or an audited responsive strategy), `accessibilityLayer` decided explicitly, margin zeroed
  at miniature scale.
- Testing gotchas that follow from this integration (bar counting, `matchMedia` stub, volatile
  ids) are recorded in the `harbor-night-harbor-ui` skill and the atlas
  (`recharts-jsdom-testing-gotchas`).

## References

- `.orquestrador/night-harbor-p2-kpi-strip/adr/0002-recharts-sparkline-integration.md`
  (run-local, full probe evidence)
- `src/renderer/src/ui/MetricTile.tsx`, `src/renderer/src/ui/primitives.module.css`
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (MetricTile/Sparkline rules)
- ADR 0016 (color scheme for the same component)
```

### Item 3 — `docs/adr/0016-night-harbor-metrictile-color-scheme.md` (de adr/0003 local)

**Justificativa**: equivalente direto do 0014 (StatusChip) para tiles/sparkline — regra permanente
de cor para marcas gráficas sobre painel, com trade-off AC-014 documentado.

Conteúdo proposto:

```markdown
# ADR 0016 — Night Harbor MetricTile color scheme: plain-ink numeral on surface-raised + accent sparkline at 0.75 fill-opacity

## Status

accepted

## Context

Night Harbor P2.3's `MetricTile` needs a numeral (text, ≥4.5:1) and a sparkline (non-text
graphical mark, ≥3:1 per WCAG 1.4.11) over a tile background, audited by script against the
effective composited background (per ADR 0014's precedent and the
`contrast-math-by-script-not-llm-arithmetic` learning — the audit ran at PLAN time, before any
implementation). Unlike StatusChip's night-harbor-exclusive status tokens, all of MetricTile's
candidate tokens (`--accent`, `--surface-raised`, `--ink`, `--border`) are defined in all three
concepts — so the `var()` fallback chain is defensive only and never triggers today.

## Decision

- **Tile background**: `var(--surface-raised)` (opaque — no deeper compositing needed),
  consistent with `.toast`/`.statePanel` nested-panel precedent.
- **Numeral**: plain `var(--ink)`. No tone-per-KPI — none of the four KPIs has a threshold or
  business rule in scope; tone without a threshold invents unrequested semantics.
- **Sparkline bars**: `fill: var(--accent, var(--border))` + `fill-opacity: 0.75`, applied via
  CSS module class on `<Bar className>` (the SVG `fill` presentation attribute loses to the
  cascade — this is how `var()` resolves per active concept). `--border` is the defensive
  fallback for a hypothetical future concept lacking `--accent`.
- **Why 0.75**: a sparkline bar is a foreground mark (must clear 3:1), not a background tint —
  StatusChip's 85% number does not transfer by analogy. Script-computed
  `blend(accent, surface-raised, alpha)` vs `surface-raised`: 0.70 is the exact minimum
  clearing 3:1 in all three concepts, but command-deck sits at 2.99:1 one step below (0.65) —
  too close to the floor. 0.75 gives real margin while remaining visibly translucent.

Audited ratios (exact WCAG 2.1 luminance, script-run; full tables in the run's
`memory/contrast-audit.md`):

| Pair | night-harbor | command-deck | signal-poster |
| --- | --- | --- | --- |
| sparkline @ 0.75 vs surface-raised | 4.16:1 | 3.64:1 | 3.80:1 |
| numeral `--ink` vs `--surface-raised` | 14.09:1 | 16.96:1 | 15.78:1 |

- **Legacy degradation (AC-014, HITL-resolved)**: command-deck/signal-poster render the tiles
  with their **native** accent (green/purple) — zero per-concept code, zero edits to
  `concepts.module.css`. The literal-gray reading (a night-harbor-only `--metric-accent`
  token) was rejected at the plan gate; reversible additively if ever preferred.

## Alternatives

- **Tone-per-KPI** (success-rate in `--success`, etc.) — rejected: requires thresholds not in
  scope (P3 territory) and would only color under night-harbor, making tiles inconsistent in
  kind across concepts.
- **85% fill-opacity by analogy with StatusChip** — rejected: passes the ratio but reuses a
  number whose goal (subtle background tint) differs from a foreground mark's; the value must
  come from the script output, not pattern-matching.
- **`--metric-accent` night-harbor-only token** (literal gray degradation) — flagged as a
  genuine fork and resolved at the HITL plan gate in favor of native accent.
- **`--on-accent` for the numeral** — rejected without a fresh audit: `on-*` presumes the
  solid token as background (ADR 0014 / on-token semantics); the numeral sits on
  `--surface-raised`.

## Consequences

- `fill-opacity: 0.75` is a CSS-module constant; if any concept's `--accent` or
  `--surface-raised` hex changes, this ADR's table must be recomputed by script before merge
  (same standing rule as ADR 0014).
- Legacy concepts render a fully colored sparkline and plain-ink numeral — this is the
  resolved meaning of "neutral degradation" for metric tiles.
- `fill-opacity` needs no `@supports` fallback (SVG 1.1-era, no support gap in Electron/
  Chromium) — unlike StatusChip's `color-mix`.

## References

- `.orquestrador/night-harbor-p2-kpi-strip/adr/0003-metrictile-color-scheme.md` (run-local,
  full audit trail) and `memory/contrast-audit.md`
- `src/renderer/src/ui/MetricTile.tsx`, `src/renderer/src/ui/primitives.module.css`
- ADR 0014 (StatusChip — the tinted-background counterpart of this decision)
- Atlas: `contrast-math-by-script-not-llm-arithmetic`, `on-token-semantics-text-over-token-bg`
```

### NÃO promovido — adr/0001 local (KPI derivation and data model)

Fórmulas de derivação ("agentes ativos" = sessões `Running`, queue = `issueQueue.length`, etc.) e o
shape do bloco `kpis` do mock são **lógica de negócio desta feature**, não padrão de arquitetura
reaproveitável — critério do atlas `orquestrador-adr-promotion-at-consolidate` (feature-specific
fica run-local como histórico). Confirmo a avaliação do handoff-006.

---

## 5. PROPOSTA — Brain-sync atlas (step 19.5 — aplicar SÓ após aprovação)

Inventário verificado: **nenhuma** nota Recharts existe no atlas hoje (há `echarts-*`, lib
diferente). `contrast-math-by-script-not-llm-arithmetic.md` e
`css-module-class-asserts-substring-and-fixture-derived.md` existem (criadas na run anterior).
`index.md`/`log.md` do atlas **não** serão tocados (precedente das 2 runs anteriores — reconcile é
o caminho canônico).

### Item 4 — Nota nova: `learnings/recharts-jsdom-testing-gotchas.md` (N12+N13+N14 condensados)

**Granularidade — decisão**: 1 nota única, não 3. As três traps compartilham o mesmo trigger
("montar/testar componente Recharts em jsdom"), a mesma fonte (task 002 desta run) e seriam sempre
recuperadas juntas; 3 fragmentos de ~1 trap cada pulverizariam o recall.

Conteúdo proposto:

```markdown
---
date: 2026-07-10
type: learning
tags:
  - learning
  - recharts
  - testing
  - vitest
  - jsdom
  - harbor
ai-first: true
---

# Recharts 3 × jsdom testing gotchas: bar counting, matchMedia stub, volatile ids

## For future Claude

Pull this whenever writing or debugging tests that mount a Recharts 3.x chart in jsdom
(vitest/jest + testing-library). Three empirically-hit traps, none obvious from the docs.

## The traps

1. **Bar counting over-counts by +1**: `<Bar className>` lands on the `<g>` series wrapper AND
   on each `<path class="recharts-rectangle">`. `querySelectorAll('[class*="myBarClass"]')`
   returns N+1 elements for N bars.
2. **Minimal matchMedia mock breaks the mount**: Recharts 3's internal `JavascriptAnimate`
   calls `window.matchMedia('(prefers-reduced-motion)').addEventListener` unconditionally on
   mount — even with `isAnimationActive={false}`. The minimal `{ matches }` stub (fine for CSS
   `@media` tests) throws a missing-function error.
3. **Volatile ids break innerHTML/snapshot comparison**: Recharts generates
   non-deterministic `recharts<N>-clip` ids and React 18's `useId` emits `:r<N>:` — two mounts
   of the same component with identical data produce different markup strings. A raw
   "renders identically in scenario A and B" string comparison is a guaranteed false negative.

## Fix

1. Count bars filtering `tagName === 'path'` (or select `.recharts-rectangle`) before
   comparing with `series.length`.
2. Stub the full `MediaQueryList` surface in the matchMedia mock: `matches`,
   `addEventListener`, `removeEventListener`, plus `addListener`/`removeListener` for
   third-party-lib compat. (This does NOT contradict
   [[learnings/matchmedia-legacy-fallback-dead-code]] — that note bans legacy fallbacks in
   app code; a test stub satisfying a library's internals is a different animal.)
3. Normalize volatile ids by regex to a fixed placeholder (e.g.
   `/recharts\d+-clip/g` → `recharts-clip`, `/:r[0-9a-z]+:/g` → `:rid:`) before comparing
   `innerHTML` between mounts.

## Source

Harbor P2.3 (night-harbor-p2-kpi-strip), task 002, `tests/renderer/ui/metric-tile.test.tsx`;
run learnings N12–N14; docs/adr/0015 (integration decisions that led here). Cross-project:
applies to any React project testing Recharts 3.x in jsdom, regardless of bundler.
```

### Item 5 — Nota nova: `learnings/parallel-tasks-symbol-coupling-joint-verify-gate.md` (N9)

Conteúdo proposto:

```markdown
---
date: 2026-07-10
type: learning
tags:
  - learning
  - orquestrador
  - pipeline
  - testing
  - harbor
ai-first: true
---

# Disjoint file scopes are not independent tasks — symbol coupling needs a joint verify gate

## For future Claude

When partitioning parallel tasks in an SDD run, file-scope disjointness is necessary but NOT
sufficient for independent sign-off. Check for **data/symbol coupling**: one task's tests
importing a symbol/field another parallel task creates. If present, the verify gate must run
once against the COMBINED tree before either task is signed PASS.

## Context

Harbor P2.3: tasks 001 (data layer) and 002 (ui component) ran in parallel with 100% disjoint
file scopes. But 002's test (`tests/renderer/ui/metric-tile.test.tsx`) imports
`mockCatalog.kpis.series` — a field that only exists after 001 adds the `kpis` block. A
per-task PASS would have been false evidence (002's tests cannot even compile without 001).

## Finding

File-based partitioning misses coupling through fixtures, types, and exported symbols —
especially in layered architectures where a type-isolated `ui/` component's TESTS still read
fixtures owned by the data task (fixture-derived assertion counts make this coupling more
common, not less: the better your test hygiene, the more your tests import fixtures).

## Action / Generalization

1. At task authoring: grep each task's test plan for imports owned by sibling parallel tasks;
   declare any hit in both task files ("known cross-task data coupling").
2. At execution: parallel implementation is fine, but run the verify gate once against the
   combined tree before signing ANY coupled task as complete — never per-task in isolation.
3. Applies to any layered repo (ui/ vs data layer), any pipeline with parallel task execution.

## Related

- `learnings/css-module-class-asserts-substring-and-fixture-derived.md` (fixture-derived
  counts are what create this coupling).
- `learnings/orquestrador-multiagent-shared-worktree-git-drift.md` (a different parallel-task
  hazard, same phase).
```

### Item 6 — Cross-link: reforço em `learnings/contrast-math-by-script-not-llm-arithmetic.md`

Append ao fim da seção "## Source" (1 parágrafo):

```markdown
Reinforced (2nd consecutive run): Harbor P2.3 ran the script audit during the PLAN phase
(run-local ADR → docs/adr/0016), before any implementation — zero contrast findings reached
review (0 of 5). Running the script at plan time, not just at review, eliminates the rework
loop entirely; candidate for a hard rule in sdd-plan/constitution.
```

### Item 7 — Cross-link: reforço em `learnings/css-module-class-asserts-substring-and-fixture-derived.md`

Append ao fim da seção "## Source" (1 parágrafo):

```markdown
Recurred (Harbor P2.3, reviews-001 finding 001): a hardcoded KPI tile count
(`toHaveLength(4)`) shipped to review even though this run's spec named "número de tiles" as
the explicit example of what must never be a bare literal. A written rule does not prevent
recurrence — treat fixture-derived counts as a standing review-checklist item on every test
diff, not a one-time fix.
```

### Item 8 (OPCIONAL, flag para o controller) — Regra dura em `sdd-plan`/constitution

LD-5 tem agora 2 data points consecutivos. Proposta mínima (fora do escopo de escrita desta fase e
fora deste repo — decisão do controller/usuário): elevar de recomendação para regra dura no
`sdd-plan` (skill global) e/ou no template de constitution: "qualquer par de cor novo/alterado é
auditado por script node (WCAG 2.1 exato) **durante o plan**, como bloqueador do gate do plan — não
apenas no review". A constitution desta run já contém a versão review-time em `boundaries.always`;
a mudança é antecipar a obrigação para o plan. Sem diff proposto aqui — depende de decisão sobre
onde a regra vive (skill global vs. template), que pertence ao usuário.

---

## 6. Checklist de consolidação

| Item | Status |
| --- | --- |
| Memória completa lida (handoffs 001–006, decisions, learnings, state, reviews-001, ADRs) | ✓ |
| Lessons destiladas (falha→causa→regra) | ✓ — LD-1..LD-7 acima |
| Skill gaps identificados | ✓ — §2 |
| Diff da skill proposto (não aplicado) | ✓ — §3 |
| Numeração docs/adr verificada (0001–0014 → livres 0015/0016) | ✓ |
| Conteúdo ADR 0015/0016 proposto (não criado) | ✓ — §4 |
| adr/0001 local avaliado — fica run-local | ✓ — §4 |
| Atlas: inventário verificado (0 notas Recharts; alvos de cross-link existem) | ✓ |
| Notas atlas propostas com nome + conteúdo (não criadas) | ✓ — §5 itens 4–5 |
| Cross-links propostos (não aplicados) | ✓ — §5 itens 6–7 |
| Escrita restrita a `.orquestrador/night-harbor-p2-kpi-strip/` | ✓ — este arquivo apenas |
| Git | nenhuma operação |
| decisions.md/learnings.md/state.md | não modificados (nenhuma descoberta nova nesta fase) |
| Cleanup pós-merge (sdd-memory) | pendente para pós-PR: arquivar/compactar handoffs, atualizar state.md — fora do escopo deste gate |

---

**Próximo passo**: controller conduz o gate HITL com os itens 1–8; itens aprovados são aplicados
por este agente quando re-despachado (escrita fora do diretório da feature só após autorização
explícita — mesmo precedente da run anterior).

---

## Addendum — Gate HITL aprovado, propostas APLICADAS (2026-07-10)

Controller autorizou explicitamente TODOS os itens (1–7 verbatim; 8 na variante
"sdd-plan + constitution-template", editando a FONTE em `~/.config/opencode/skills/` e rodando
o sync). Aplicação concluída:

**Modificados**:
1. `.agents/skills/harbor-night-harbor-ui/SKILL.md` — 4 edits do §3: bullet Rules
   "MetricTile/Sparkline (P2.3)", +3 bullets Testing (gotchas Recharts×jsdom), +2 anti-patterns,
   References 0001–0014 → 0001–0016 + ADRs locais da run.
6. `C:\Users\gustavo\projetos\atlas\learnings\contrast-math-by-script-not-llm-arithmetic.md` —
   parágrafo "Reinforced (2nd consecutive run)" na seção Source (antes do See also).
7. `C:\Users\gustavo\projetos\atlas\learnings\css-module-class-asserts-substring-and-fixture-derived.md`
   — parágrafo "Recurred (Harbor P2.3, finding 001)" ao fim da seção Source.
8. `C:\Users\gustavo\.config\opencode\skills\sdd\plan\SKILL.md` — "Color-pair hard gate" no
   Process step 2 + bullet no Definition of done (tradução fiel EN, arquivo é inglês);
   `C:\Users\gustavo\.config\opencode\skills\orquestrador\references\constitution-template.md`
   — regra verbatim pt-BR em `boundaries.always`. Sync rodado
   (`pwsh ~/.config/opencode/scripts/sync-harness.ps1`): 18 skills regeneradas em
   `~/.claude/skills` + 18 em `~/.agents/skills` (home; o `.agents/` do projeto harbor não é
   alvo do sync). Regra confirmada por grep nas cópias regeneradas
   (`~/.claude/skills/sdd-plan/SKILL.md:40`; `orquestrador/references/constitution-template.md:65`).

**Criados**:
2. `docs/adr/0015-recharts-sparkline-integration.md` (conteúdo §4 verbatim).
3. `docs/adr/0016-night-harbor-metrictile-color-scheme.md` (conteúdo §4 verbatim).
4. `C:\Users\gustavo\projetos\atlas\learnings\recharts-jsdom-testing-gotchas.md` (§5 verbatim,
   formato frontmatter padrão do atlas).
5. `C:\Users\gustavo\projetos\atlas\learnings\parallel-tasks-symbol-coupling-joint-verify-gate.md`
   (§5 verbatim).

**Desvio autorizado vs. §5 preâmbulo**: `index.md` do atlas FOI atualizado nesta run (instrução
explícita do controller — o index lista learnings): +2 entradas na seção Learnings para as notas
4 e 5, no formato das entradas existentes. `log.md` não tocado.

**Git**: nenhuma operação em nenhum repo (controller commita).
