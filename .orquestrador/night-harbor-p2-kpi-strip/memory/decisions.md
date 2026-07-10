# Decisões — night-harbor-p2-kpi-strip

**Registry de decisões de design e arquitetura aprovadas.**

## Decisões Aprovadas (spec HITL 2026-07-10)

### D-001: 4 KPIs Fixos, Ordem Fixa

**Data**: 2026-07-10 (grill G1, formalizado na spec sem mudanças)
**Status**: APROVADO
**Descrição**: KPI strip no Overview com exatamente 4 tiles, ordem semântica fixa: agentes ativos,
fila (issue queue), taxa de sucesso, tempo de agente ("agent time").

**Derivação de valor**:
- Agentes ativos, fila, agent time → derivados de dado já existente no `mockCatalog`
  (`sessions`, `issueQueue`, `recentUsage`), nunca duplicados como número à parte.
- Taxa de sucesso → dado novo no fixture (não existe hoje nenhuma representação).
- Fórmula exata de "agentes ativos" (total de sessões vs. filtro por status) **fica em aberto
  para o plan** — gap intencional da spec, não ambiguidade acidental.

**Referência**: spec.md Scope "In", AC-001, AC-007, AC-008; state.md G1.

---

### D-002: KPI Strip Substitui "Recent Usage"

**Data**: 2026-07-10 (grill G2, formalizado na spec)
**Status**: APROVADO
**Descrição**: A KPI strip ocupa o slot hoje usado pelo painel "Recent usage" no Overview
(`slot="utility"` em `Shell.tsx`). O painel de texto corrido deixa de aparecer nessa tela.

**Compatibilidade**: o slice `recentUsage` permanece definido no `mockCatalog` e no
`OverviewViewModel` (não é removido), para não quebrar outros consumidores — apenas para de ser
renderizado no slot `utility`.

**Referência**: spec.md AC-002, AC-017; state.md G2; `src/renderer/src/shell/Shell.tsx` linhas
244–250; `src/renderer/src/app/selectors.ts` linha 125/144.

---

### D-003: Recharts como Dependência Nova (Sparkline)

**Data**: 2026-07-10 (grill G3, revisado a pedido do usuário, formalizado na spec)
**Status**: APROVADO
**Descrição**: A sparkline-maré usa Recharts (biblioteca de gráficos SVG), aprovada via HITL do
grill — já é um dado da spec, não uma escolha introduzida por ela.

**Constraints vinculantes**:
- 8–12 pontos de dado (barras) por sparkline.
- Tokens de accent com opacidade.
- Marcada como decorativa (`aria-hidden`) para leitores de tela — o numeral + rótulo comunicam o
  valor real.
- Renderização testável em ambiente headless (jsdom) — critério de escolha da lib.
- Estática por construção: sem animação, sem loop, sem hover — dispensa lógica de
  `useReducedMotion()`.

**Confirmado nesta fase (handoff)**: `recharts` está ausente de `package.json` — dependência
genuinamente nova, sem resquício de uso parcial no repo. Versão exata, superfície de import
(BarChart/Bar vs. primitivas), e uso ou não de `ResponsiveContainer` ficam para o plan (ver
handoff-001.md R1, R5).

**Referência**: spec.md Constraints; AC-005, AC-006, AC-016; state.md G3.

---

### D-004: Fallback Neutro em Conceitos Legados (MetricTile)

**Data**: 2026-07-10 (grill G4, mesmo padrão do P2 anterior)
**Status**: APROVADO
**Descrição**: O componente reutilizável de tile (`MetricTile`) segue o mesmo padrão de
organização `ui/` já estabelecido pelo `StatusChip` da run anterior — consumindo tokens de cor via
`var()` com fallback neutro, de forma que os conceitos legados (command-deck, signal-poster)
degradem sem exigir edição própria.

**Precedente direto**: D-011 do P2 anterior (cadeia `var(--token, fallback)` +
`--surface-raised`) — espelhar a mesma técnica, mas confirmar antes quais tokens os conceitos
legados de fato definem (risco R4 em handoff-001.md).

**Referência**: spec.md Constraints, AC-014; state.md G4;
`.orquestrador/night-harbor-p2-statuschip-nav/memory/decisions.md` D-011.

---

## Decisões Aguardando Confirmação

Nenhuma no nível da spec. Pontos deliberadamente abertos para o plan (não são decisões pendentes
de HITL, são detalhes técnicos delegados pela spec):

- Fórmula exata de "agentes ativos" (D-001).
- Versão/superfície de import do Recharts, uso de `ResponsiveContainer` (D-003).
- Tokens exatos de fallback nos conceitos legados (D-004).
- Copy exata (rótulos de loading/empty/error, texto do rótulo acessível por tile) — spec.md
  "Open questions" delega ao `sdd-plan`, seguindo o padrão de copy já estabelecido para os demais
  painéis do Overview.

---

## Decisões Aprovadas (gate do plan, 2026-07-10)

### D-005: Fórmula "Agentes Ativos" = Sessões `Running`

**Status**: APROVADO (ADR-0001, fecha o gap D-001/R2)
**Descrição**: `mockCatalog.sessions.filter(s => s.status === 'Running').length` — consistente
com `mapSessionStatusToTone` (Running→success). Fixture atual → 1. Rejeitada a alternativa
"contagem total de sessões" (seria redundante com o painel de sessões ao lado).
**Referência**: ADR-0001; handoff-002.md.

---

### D-006: Esquema de Cor do MetricTile

**Status**: APROVADO (ADR-0003, reconfirmado 2× por script — controller no gate + handoff-agent
lendo `concepts.module.css` diretamente nesta fase)
**Descrição**: Numeral `var(--ink)` sobre `var(--surface-raised)` (14.09/16.96/15.78:1 nos 3
concepts); sparkline `fill: var(--accent, var(--border))` + `fill-opacity: 0.75`
(4.16/3.64/3.80:1). Sem tone-per-KPI (nenhum threshold de negócio em escopo). 0.75 escolhido por
script, não por reuso do 85% do StatusChip (objetivos de transparência diferentes).
**Referência**: ADR-0003; `memory/contrast-audit.md`.

---

### D-007: AC-014 "Degradação Neutra" = Accent Nativo do Concept (Opção A)

**Status**: APROVADO no gate HITL do plan (trade-off resolvido, não era decisão técnica e sim de
aparência)
**Descrição**: Legados (command-deck, signal-poster) renderizam os tiles com o accent NATIVO
deles (verde `#0b6b5b`, roxo `#5a31d6`) — zero código por concept, `concepts.module.css`
zero edição. Rejeitada a leitura "cinza literal" (exigiria token `--metric-accent`
night-harbor-only). Reversível depois de forma aditiva se o usuário preferir a outra leitura.
**Referência**: ADR-0003 "Alternatives considered"/"Consequences"; plan.md "Proposta para
aprovação"; state.md "Decisões do gate do plan" item 1.

---

### D-008: Recharts `^3.9.2`, Import Mínimo, Dimensão Fixa

**Status**: APROVADO (ADR-0002)
**Descrição**: `{ Bar, BarChart }` apenas; `width={48} height={16}` sem `ResponsiveContainer`;
`margin` zerado; `accessibilityLayer={false}` + `aria-hidden` + `isAnimationActive={false}`.
Provado empiricamente que jsdom renderiza sem mock algum (mesmo sem `ResizeObserver`) —
`tests/renderer/setup.ts` fica intocado. Redux interno do Recharts 3 (~7.3MB unpacked) é custo
aceito/divulgado (R5), não mitigado nesta feature.
**Referência**: ADR-0002.

---

### D-009: Copy Final Aprovada no Gate

**Status**: APROVADO
**Descrição**: Grupo "Key metrics"; tiles "Active agents" / "Issue queue" / "Success rate" /
"Agent time". Copy de estados (`overviewCopy.kpis`) em plan.md.
**Referência**: state.md "Decisões do gate do plan" item 2; plan.md §"selectors.ts".

---

## Rastreabilidade

- **Aprovação spec**: spec.md status header (HITL 2026-07-10, sem alterações solicitadas)
- **Aprovação plan**: plan.md status header (gate HITL 2026-07-10, trade-off AC-014 = A)
- **Origem das decisões**: grill HITL G1–G4 (state.md linhas 13–21); gate do plan (state.md
  "Decisões do gate do plan", 4 itens)
- **Boundary de verificação**: constitution.md `test_expectations` + `boundaries.always` (auditoria
  numérica de contraste obrigatória para qualquer par de cor novo, sparkline inclusa)

**Próxima atualização**: sdd-tasks (particionamento em tasks com disjoint file scopes).
