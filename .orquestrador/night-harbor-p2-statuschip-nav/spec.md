# Spec — Night Harbor P2: StatusChip + Nav ícone+label (P2.1 + P2.2)

**Data**: 2026-07-09
**Origem**: proposta-melhorias-001.md §4 (P2.1, P2.2)
**Autores de decisão**: usuário (grill-me HITL 2026-07-09)
**Status**: aprovada (HITL 2026-07-09; mapeamento Settings confirmado: Available→success, Simulated→neutral, Not configured→warning)

---

## 1. Problema

A interface é "read-only" em relação ao status. Sessões, issues e projetos exibem estados em **texto puro** (strings), sem ícone, sem cor semântica, sem feedback visual. A nav lateral é **text-only**, contrariando a decisão ADR-0004 (Phosphor Regular como set único). Falta o "vocabulário de componentes" que torna visível a metáfora "luzes de sinalização do porto".

**Impacto**: scanning lento (nenhuma affordance visual); semanticidade perdida (status precisa ser lido como texto); design.md §6 exige "ícone + label" para status e está **não cumprido**.

---

## 2. Solução

Introduzir **StatusChip** — component composto (dot + ícone Phosphor + label, fundo tintado com color-mix) — que substitui strings de status em três contextos:
1. **Shell** — sessões (sessions), issues (issueQueue), projeto (currentProject.status)
2. **Settings** — agents (status: Available), integrations (status: Simulated, Not configured)

Complementar com **nav lateral ícone+label** (Phosphor Regular icons com labels sempre visíveis, pill ativa de alto contraste) — cumpre design.md §6 (icon + label para scanabilidade) e ADR-0004 (Phosphor único).

---

## 3. Escopo

### 3.1 In Scope
- **StatusChip** component novo em `src/renderer/src/ui/StatusChip.tsx`
  - Props: `status` (string enum), `label` (string), `tone` (success/warning/danger/neutral)
  - Render: `<dot> <icon> <label>` com fundo tintado `color-mix(in srgb, var(--tone-token), transparent 85%)`
  - Fallback pré-`@supports`: background sólido + borda token, texto legível
  - Contraste WCAG 2.1 AA auditado (4.5:1 texto)
- **Shell.tsx** — substituir strings de status por StatusChip
  - `sessions[].status` (Running → success, Ready → warning, Complete → neutral)
  - `issueQueue[].priority` (High → danger, Medium → warning, Low → neutral)
  - `currentProject.status` (Active → success)
- **Settings.tsx** — substituir strings de status em agents/integrations
  - `agents[].status` (Available → success)
  - `integrations[].status` (Simulated → neutral, Not configured → warning)
  - **Nota**: mapeamento de Settings é ponto aberto (vide §7 Decisões)
- **Nav lateral** (Shell.tsx, shell.module.css)
  - Ícones Phosphor Regular: Compass (overview), FolderOpen (projects), Boat (sessions), Tray (issues), GearSix (settings)
  - Labels **sempre visíveis** (nunca icon-only)
  - Pill ativa: `background: var(--surface-active)` + `border-color: var(--accent)` + alto contraste
  - `aria-current="page"` preservado no elemento ativo
- Nenhuma mudança em CSS dos concepts legados (command-deck, signal-poster)
- StatusChip consome tokens via `var()` com fallback para portabilidade

### 3.2 Out of Scope
- P2.3 (KPI strip com sparkline-maré)
- P2.4 (ações inline em cards de sessão)
- P2.5 (filter chips no activity)
- P2.6 (stagger + press scale)
- Tokens de motion (P1.1 + P1.2) — assumem status no gate
- Repurpose do Design Lab ou remocao de conceitos legados

---

## 4. Mapeamento Status → Tone

### 4.1 Shell (Sessions, Issues, Project)
| Domínio | Status | Tone | Token | Observação |
|---------|--------|------|-------|-----------|
| Sessions | Running | success | `--success:#5ad8a6` | ativo (précisa de olho) |
| Sessions | Ready | warning | `--warning:#ffd166` | idle, atenção |
| Sessions | Complete | neutral | `--border:#41597a` | terminal |
| Issues | High | danger | `--danger:#ff8d9d` | crítico |
| Issues | Medium | warning | `--warning:#ffd166` | atenção |
| Issues | Low | neutral | `--border:#41597a` | baixa prioridade |
| Project | Active | success | `--success:#5ad8a6` | em curso |

### 4.2 Settings (Agents, Integrations)
| Domínio | Status | Tone | Token | Observação |
|---------|--------|------|-------|-----------|
| Agents | Available | success | `--success:#5ad8a6` | pronto |
| Integrations | Simulated | neutral | `--border:#41597a` | mock (não real) |
| Integrations | Not configured | warning | `--warning:#ffd166` | ação necessária |

**Nota §7**: Mapeamento Settings ainda aberto — sugestão acima, confirmar no gate.

---

## 5. Tecnologia

### 5.1 Tokens (existentes, sem mudança)
```css
/* night-harbor block em concepts.module.css, linhas ~135–174 */
--success: #5ad8a6;
--on-success: #07111f;
--warning: #ffd166;
--on-warning: #0e1b2f;
--danger: #ff8d9d;
--on-danger: #21040a;
--border: #41597a;  /* fallback neutral */
```

### 5.2 Técnica de Fundo Tintado
```css
/* StatusChip background com color-mix + fallback */
.statusChip {
  background: var(--chipBackground);  /* fallback sólido + opacidade */
  /* @supports (color: color-mix(...)) */
  @supports (color: color-mix(in srgb, black, transparent)) {
    background: color-mix(in srgb, var(--chipToken), transparent 85%);
  }
}
```
Fundamentos: atlas recall `navbar-contrast-color-mix-over-ambient`, validado em prod.

### 5.3 Ícones Phosphor
Usar `@phosphor-icons/react@^2.1.10` (já instalado). Icons para nav: `Compass`, `FolderOpen`, `Boat`, `Tray`, `GearSix` — weight `regular` (padrão da lib).

### 5.4 Primitives Reutilizáveis
- `SemanticIcon` (existente) — wrapping de ícone Phosphor com `label` prop (labelled mode)
- `Button` (existente) — reuso para nav buttons (variant secondary, com Icon slot)
- `StatusMessage` (existente) — para feedback a11y se necessário

---

## 6. Acessibilidade (CRITICAL)

### 6.1 Contraste Numérico (WCAG 2.1 AA)
**Audit obrigatória**: StatusChip deve passar contraste 4.5:1 para todo par (texto sobre fundo tintado + fallback).

Pares auditados (existentes no design.md):
- `--on-success (#07111f) on --success (#5ad8a6)` → 10.65:1 ✓
- `--on-warning (#0e1b2f) on --warning (#ffd166)` → 11.97:1 ✓
- `--on-danger (#21040a) on --danger (#ff8d9d)` → ~5.2:1 (verificar)

Novo (color-mix): Auditar `--success com transparent 85%` sobre `--surface (#0e1b2f)` — esperado >4.5:1 (transparência reduz contraste; usar 80% se necessário).

**Ação**: Review numérico no gate (ACs AC-6, AC-7).

### 6.2 Color-not-only
✓ Implementado: dot (cor) + ícone (forma) + label (texto) juntos comunicam status.

### 6.3 Keyboard Navigation
✓ Nav pills: manter `<button>` com `aria-current="page"` no elemento ativo.
✓ Focus ring: aplicar foco visível existente (primitives.css `.button:focus-visible`).

### 6.4 Icon Labeling
✓ Nav ícones: labels sempre visíveis (nunca icon-only).
✓ StatusChip ícone: parte da composition, comunicado via label (aria não necessária).

---

## 7. Decisões Abertas → Gate

### Ponto de Confirmação: Mapeamento Settings

Sugestão do dispatch:
- Agents `Available` → `success` (agente pronto para usar)
- Integrations `Simulated` → `neutral` (estado mock, sem ação)
- Integrations `Not configured` → `warning` (requer setup)

**Validação necessária**: Usuário confirma mapeamento no gate (HITL). Se mudança, atualizar tabela §4.2.

---

## 8. Critérios de Aceitação (EARS)

### AC-1: StatusChip Render (Sessions Status)
**GIVEN** sessão com status `'Running'`
**WHEN** aplicação renderiza overview.sessions
**THEN** StatusChip exibe dot verde + ícone Phosphor + label "Running" + fundo tintado verde-claro
**AND** contraste texto sobre fundo ≥4.5:1 (auditado numericamente)

### AC-2: StatusChip Render (Issue Priority)
**GIVEN** issue com priority `'High'`
**WHEN** aplicação renderiza overview.issueQueue
**THEN** StatusChip exibe dot vermelho + ícone Phosphor + label "High" + fundo tintado vermelho-claro
**AND** texto legível (mínimo 4.5:1)

### AC-3: StatusChip Render (Project Status)
**GIVEN** projeto com status `'Active'`
**WHEN** aplicação renderiza overview.currentProject
**THEN** StatusChip exibe dot verde + ícone + label "Active"

### AC-4: Settings Agents Status
**GIVEN** agente com status `'Available'`
**WHEN** Settings → Agents é renderizado
**THEN** StatusChip exibe tone success (dot verde + label)

### AC-5: Settings Integrations Status
**GIVEN** integração com status `'Not configured'`
**WHEN** Settings → Integrations é renderizado
**THEN** StatusChip exibe tone warning (dot âmbar + label)

### AC-6: Color-mix Fallback (Legacy Browser)
**GIVEN** browser sem suporte a `color-mix()`
**WHEN** StatusChip renderiza
**THEN** fallback sólido + opacidade exibe (background com rgba ou cor ligeiramente alterada)
**AND** sem quebra visual (degrada gracefully)

### AC-7: Nav Ícone+Label (Phosphor)
**GIVEN** nav sidebar renderizada
**WHEN** usuário visualiza menu
**THEN** cada destino (Overview, Projects, Sessions, Issues, Settings) exibe Phosphor icon (Regular weight) + label sempre visível
**AND** elemento com `aria-current="page"` tem pill ativa (surface-active bg + accent border)

### AC-8: Nav Focus Ring
**GIVEN** usuário navega via Tab
**WHEN** nav pill recebe foco
**THEN** focus ring visível (#ffd166 outline, 3px, offset 3px) — padrão existente mantido

### AC-9: Semantic Icon Labeling (Decorative Mode)
**GIVEN** ícone em StatusChip (parte da composição, não standalone)
**WHEN** SemanticIcon renderiza com decorative=true
**THEN** `aria-hidden="true"` presente (ícone comunicado via label text)

### AC-10: WCAG Audit Pass
**GIVEN** StatusChip renderizado com color-mix + fallback
**WHEN** contraste é auditado (ferramentas: WCAG contrast checker, medida exata via luminância relativa)
**THEN** todo par (texto sobre fundo tintado, texto sobre fallback) passa ≥4.5:1 ou justificativa documentada

---

## 9. Notas de Implementação (sem detalhe)

- **Arquivo novo**: `StatusChip.tsx` em `src/renderer/src/ui/` — component funcional, props tone/label/status
- **Atualização**: `Shell.tsx` — mapear mock-catalog.sessions/issueQueue/currentProject.status via StatusChip
- **Atualização**: `Settings.tsx` — mapear mock-catalog.agents/integrations.status via StatusChip
- **Atualização**: `shell.module.css` — navegar pill ativa, adicionar layout ícone+label (display: flex, gap, etc.)
- **Estilo StatusChip**: `primitives.module.css` (nova seção `.statusChip`) — color-mix, fallback, tipografia
- **Nenhuma mudança**: concepts.module.css (tokens já existem; não editar command-deck/signal-poster)
- **Ícones**: importar via `@phosphor-icons/react` (dependência já présente)
- **Testing**: render/a11y tests do StatusChip (novo component); testes existentes não regridem

---

## 10. Referências

- design.md §6 (a11y, color-not-only)
- proposta-melhorias-001.md §3.1 (ícones), §4 (P2.1, P2.2)
- ADR-0004 (Phosphor como set único)
- constitution.md (verify_gate, review numérico contraste obrigatório)
- atlas recall: navbar-contrast-color-mix-over-ambient, color-not-only
- memory/state.md (decisões G1–G4, learnings L1–L4)

---

## 11. Sumário Executivo

**P2.1 StatusChip** substitui strings de status em Shell (sessions, issues, project) e Settings (agents, integrations) com dot + ícone Phosphor + label + fundo tintado (color-mix). Cumpre design.md §6 (color-not-only + ícone). Tokens já existem; zero dependência nova.

**P2.2 Nav ícone+label** adiciona ícones Phosphor Regular (Compass, FolderOpen, Boat, Tray, GearSix) à nav lateral com labels sempre visíveis (nunca icon-only). Pill ativa em alto contraste. Cumpre ADR-0004 e design.md §6.

**Auditoria WCAG** obrigatória no gate (color-mix contraste). Mapeamento Settings (agents/integrations) aberto para confirmação HITL.

Sem mudanças em legacy concepts. Componente novo, 2 superfícies atualizadas.
