# Learnings — night-harbor-p2-kpi-strip

**Registro de learnings técnicos e de processo duráveis desta run.**

## Learnings Herdados do Atlas / P2 Anterior (reaplicados nesta run)

Ver detalhamento completo em
`.orquestrador/night-harbor-p2-statuschip-nav/memory/learnings.md`. Resumo do que se aplica
diretamente a esta feature:

### L-inherited-1: Contrast Math by Script

**Descrição**: Auditoria de contraste WCAG **nunca** por estimativa/aritmética de LLM — sempre por
script, com linearização sRGB exata (expoente 2.4). A run anterior teve erro grave de luminância
na rev. 1 do `contrast-audit.md`, só corrigido na rev. 2 pelo controller.

**Aplicação nesta run**: par numeral/tile (texto, mínimo 4,5:1) e sparkline/fundo efetivo
(não-textual, mínimo 3:1) — AC-009. Compor a cor efetiva de tints/opacidades sobrepostas antes de
medir (não medir contra a superfície base isolada).

---

### L-inherited-2: Visual Contrast Against Canvas (não Surface)

**Descrição**: Medir contraste sempre contra o fundo **efetivo** — se há tints/opacidades
sobrepostas (ex.: tile sobre canvas, barra de sparkline com opacidade sobre o tile), compor a cor
final antes de medir. Medir contra a superfície base isolada esconde falhas reais.

**Aplicação nesta run**: sparkline com accent + opacidade sobre o fundo do tile é exatamente esse
caso — AC-009 exige essa composição antes da medição.

---

### L-inherited-3: CSS Module Class Asserts (Substring + Counts do Fixture)

**Descrição**: Testes de classe CSS Module devem usar substring match (nunca nome exato/hash), e
contagens (tiles, itens de fila, pontos de série) devem ser lidas do fixture em tempo de teste,
nunca hardcoded como literal solto.

**Aplicação nesta run**: spec.md Constraints e Verification já codificam essa regra
explicitamente para esta feature (tiles, itens de fila, tamanho da série da sparkline).

---

### L-inherited-4: On-Token Semantics (Fill Sólido Apenas)

**Descrição**: Tokens `--on-*` são semântica de texto sobre fundo **sólido**, nunca sobre fundo
tintado/transparente. Qualquer componente com fundo tintado (color-mix, opacidade) deve usar cor
própria auditada, não `--on-*`.

**Aplicação nesta run**: a sparkline usa barras com opacidade sobre o tile — se qualquer texto
(numeral) for colocado sobre um fundo tintado similar, não usar `--on-*` diretamente sem nova
auditoria.

---

### L-inherited-5: Motion Override Bypasses Reduced-Motion

**Descrição**: Qualquer transition/animation em componente novo precisa de ternário
`useReducedMotion()` explícito, ou viola WCAG 2.1 SC 2.3.3.

**Aplicação nesta run**: a sparkline-maré é estática por construção (AC-015, AC-016) — dispensa
essa lógica por design, não por omissão. Se o plan introduzir qualquer motion no MetricTile (ex.:
hover, ainda que fora do escopo hoje), o ternário volta a ser obrigatório.

---

## Descobertas Desta Run (handoff spec→plan, 2026-07-10)

### N1: Recharts Confirmado Ausente do Projeto

**Contexto**: Verificação de dependência antes do handoff para o plan.
**Descrição**: `grep -n "recharts" package.json` não retornou nenhuma ocorrência — nem em
`dependencies` nem em `devDependencies`. Confirma que é dependência 100% nova, sem uso parcial ou
experimental prévio no repo.

**Implicação**: o plan precisa tratar isso como instalação greenfield — fixar versão exata (major
atual = 3.x), validar peer deps contra `react@^18.3.1`/`react-dom@^18.3.1` já instalados, e
declarar import mínimo (não `import * as Recharts`).

**Referência**: handoff-001.md descobertas inesperadas + R1/R5.

---

### N2: StatusChip Fallback Var() Vive no CSS Module, Não no TSX

**Contexto**: Verificação do padrão de componente `ui/` a espelhar para `MetricTile`.
**Descrição**: `src/renderer/src/ui/StatusChip.tsx` só define props + composição JSX; a técnica de
fallback `var(--token, neutro)` fica inteiramente no CSS module consumido (classes
`statusChip_${tone}`), que este agente não leu neste passo (fora do escopo do handoff, delegado ao
plan).

**Implicação**: o plan não pode planejar o fallback do MetricTile olhando só o TSX do StatusChip —
precisa abrir o CSS module correspondente para replicar a técnica exata (provavelmente
`primitives.module.css`, a confirmar).

**Referência**: handoff-001.md "Suposições validadas".

---

### N3: Slot "Recent Usage" é Substituição Isolada, Não Refactor de Layout

**Contexto**: Leitura de `Shell.tsx` para confirmar AC-002/AC-017/AC-018.
**Descrição**: O painel "Recent usage" é um `ScenarioGroup` único e isolado (`slot="utility"`,
linhas 244–250 de `Shell.tsx`), sem acoplamento estrutural com os outros 4 grupos do Overview
(primary/metrics/queue/activity). A substituição pela KPI strip é uma troca pontual de
`renderReady` + `slice`, não uma reestruturação de grid.

**Implicação**: baixo risco de regressão nos demais painéis (AC-018) se o plan mantiver o mesmo
padrão `ScenarioGroup`/`ScenarioSlice` para a KPI strip.

**Referência**: handoff-001.md "Suposições validadas"; `src/renderer/src/shell/Shell.tsx` linhas
133–269; `src/renderer/src/app/selectors.ts` linhas 80–159.

---

## Rastreabilidade

- **Learnings herdados**: atlas + `.orquestrador/night-harbor-p2-statuschip-nav/memory/learnings.md`
  (L1–L11), trazidos via brain recall registrado em `memory/state.md` desta feature.
- **N1–N3**: descobertas do handoff-agent nesta fase (spec→plan), 2026-07-10.
- **Próxima atualização**: sdd-plan (technical design) deve adicionar learnings sobre a integração
  Recharts+jsdom, a fórmula final de "agentes ativos", e o resultado da auditoria de contraste
  (`contrast-audit.md` separado).
