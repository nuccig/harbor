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

## Rastreabilidade

- **Aprovação spec**: spec.md status header (HITL 2026-07-10, sem alterações solicitadas)
- **Origem das decisões**: grill HITL G1–G4 (state.md linhas 13–21)
- **Boundary de verificação**: constitution.md `test_expectations` + `boundaries.always` (auditoria
  numérica de contraste obrigatória para qualquer par de cor novo, sparkline inclusa)

**Próxima atualização**: sdd-plan (technical design, ADRs, fechamento dos riscos R1–R5 de
handoff-001.md).
