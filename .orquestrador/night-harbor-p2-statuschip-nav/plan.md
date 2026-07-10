# Plan — Night Harbor P2: StatusChip + Nav ícone+label

**Data**: 2026-07-09 (rev. 2 — pós-gate HITL; decisões resolvidas pelo usuário, auditoria numérica do controller)
**Fase**: SDD Stage 2 (sdd-plan)
**Entrada**: spec.md aprovado, handoff-001.md (riscos R1–R4), gate HITL do plan
**Saída**: technical design + ADRs + task breakdown
**Idioma**: pt-BR (código/commits: English)

---

## 1. Resumo Executivo

Implementar **StatusChip** — componente composto de dot + ícone Phosphor + label com fundo tintado via color-mix — em Shell (sessions, issues, project) e Settings (agents, integrations). Complementar com **nav lateral ícone+label** (Phosphor Regular) com pill ativa de alto contraste.

**Esquema de cor resolvido no gate HITL (vinculante)**:
- Fundo: `color-mix(in srgb, var(--tone), transparent 85%)` — **85% mantido, como a spec**
- Texto/ícone/dot: **cor do próprio token** (`--success`/`--warning`/`--danger`), **não** `--on-*`
- Neutral: texto/ícone em `--ink-muted` (tone text com `--border` falha 2.18:1)
- Fallback sem color-mix: background **sólido** `var(--surface-raised)` (#152642) — nunca color-mix no fallback
- Tokens `--on-*` **não são usados no chip** (reservados a fills sólidos futuros — ADR-0001)

**Artefatos principais**:
- `src/renderer/src/ui/StatusChip.tsx` (novo componente)
- Atualizar `Shell.tsx`, `Settings.tsx` para usar StatusChip
- Atualizar `shell.module.css` para nav ícone+label
- Atualizar `primitives.module.css` com estilos do StatusChip
- Testes: render/a11y do StatusChip, testes existentes não regridem

**Escopo**: P2.1 (StatusChip) + P2.2 (nav ícone+label). Sem mudanças em concepts legados.

---

## 2. Decisões Técnicas

### 2.1 StatusChip API e Design

**Componente**: `src/renderer/src/ui/StatusChip.tsx`

```typescript
export interface StatusChipProps {
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export function StatusChip({ tone, label, icon: Icon }: StatusChipProps) {
  const ResolvedIcon = Icon ?? defaultIconsByTone[tone]
  return (
    <span className={`${styles.statusChip} ${styles[`statusChip_${tone}`]}`}>
      <span aria-hidden="true" className={styles.statusDot} />
      <ResolvedIcon aria-hidden="true" className={styles.statusIcon} weight="regular" />
      <span className={styles.statusLabel}>{label}</span>
    </span>
  )
}
```

**Render**: dot (decorativo, aria-hidden) + ícone (decorativo, aria-hidden) + label (texto, comunicação primária).

**Props**:
- `tone`: 'success' | 'warning' | 'danger' | 'neutral' — determina cor de texto/dot/ícone e fundo tintado
- `label`: string — texto visível, comunicação primária
- `icon`: React.ComponentType (opcional) — override; default por tone (§2.3)

**Não é um `<button>`**: StatusChip é informativo, não interativo.

---

### 2.2 Mapeamento Status → Tone

**Decisão aprovada no gate**: mapeamento inline em Shell/Settings (não centralizado).

#### Cenário 1: Shell (sessions, issues, project) — em Shell.tsx

```typescript
const mapSessionStatusToTone = (status: string): StatusChipProps['tone'] => {
  switch (status) {
    case 'Running': return 'success'
    case 'Ready': return 'warning'
    case 'Complete': return 'neutral'
    default: return 'neutral'
  }
}

const mapIssuePriorityToTone = (priority: string): StatusChipProps['tone'] => {
  switch (priority) {
    case 'High': return 'danger'
    case 'Medium': return 'warning'
    case 'Low': return 'neutral'
    default: return 'neutral'
  }
}

// currentProject.status 'Active' → 'success'
```

#### Cenário 2: Settings (agents, integrations) — em Settings.tsx

```typescript
const mapAgentStatusToTone = (status: string): StatusChipProps['tone'] =>
  status === 'Available' ? 'success' : 'neutral'

const mapIntegrationStatusToTone = (status: string): StatusChipProps['tone'] => {
  switch (status) {
    case 'Not configured': return 'warning'
    case 'Simulated': return 'neutral'
    default: return 'neutral'
  }
}
```

**Rationale**: mapeamento é semântica de domínio; vive onde é usado. Refatorar para utilitário só se um terceiro consumidor surgir.

---

### 2.3 Ícones Phosphor por Tone — CONFIRMADOS no gate

| Tone | Ícone Phosphor | Peso | Observação |
|------|---|---|---|
| success | CheckCircle | Regular | validação, pronto |
| warning | Clock | Regular | atenção, em progresso |
| danger | Warning | Regular | crítico, ação necessária |
| neutral | Minus | Regular | terminal, neutro |

```typescript
import { CheckCircle, Clock, Warning, Minus } from '@phosphor-icons/react'

const defaultIconsByTone = {
  success: CheckCircle,
  warning: Clock,
  danger: Warning,
  neutral: Minus
} as const
```

Prop `icon` permite override por domínio; default garante color-not-only sempre.

---

### 2.4 Pill Ativa da Nav

**Token confirmado**: `--surface-active: #19385a` existe em concepts.module.css (R1 fechado).

**Ratios auditados pelo controller** (WCAG 2.1, linearização sRGB expoente 2.4):
- `--ink` (#f3f7ff) sobre `--surface-active` (#19385a): **11.15:1** ✓ (texto ≥4.5:1)
- Borda `--accent` (#63a9ff) sobre `--surface-active`: **4.93:1** ✓ (não-texto ≥3:1)

```css
.destinationButton[aria-current='page'] {
  background: var(--surface-active);
  border-color: var(--accent);
  font-weight: 700;
}
```

**Sem mudança de token**: já implementado em shell.module.css; nav ganha apenas ícone+layout (§2.6).

---

### 2.5 Técnica de Fundo Tintado (Color-mix) — RESOLVIDO no gate

**Esquema final (decisão vinculante do usuário)**:
1. Fundo: `color-mix(in srgb, var(--tone), transparent 85%)` — 85% conforme spec
2. Texto/ícone/dot: **cor do token** (`--success`/`--warning`/`--danger`); neutral usa `--ink-muted`
3. Fallback sem color-mix: background **sólido** `var(--surface-raised)` — NUNCA color-mix no fallback
4. `--on-*` não aparecem no chip (reservados a fills sólidos futuros — ADR-0001)
5. Portabilidade legada via cadeia `var()` (§2.10)

**Implementação em primitives.module.css**:

```css
.statusChip {
  align-items: center;
  /* Fallback sólido (navegadores sem color-mix). Existe nos 3 conceitos. */
  background: var(--surface-raised);
  border: 1px solid var(--chipTone, var(--border));
  border-radius: var(--radius-control);
  color: var(--chipText, var(--ink-muted));
  display: inline-flex;
  font-size: var(--type-small);
  font-weight: var(--weight-label);
  gap: var(--space-2);
  padding-block: var(--space-1);
  padding-inline: var(--space-3);
}

@supports (color: color-mix(in srgb, black, transparent)) {
  .statusChip {
    background: color-mix(in srgb, var(--chipTone, var(--border)), transparent 85%);
  }
}

.statusChip_success {
  --chipTone: var(--success, var(--border));
  --chipText: var(--success, var(--ink-muted));
}

.statusChip_warning {
  --chipTone: var(--warning, var(--border));
  --chipText: var(--warning, var(--ink-muted));
}

.statusChip_danger {
  --chipTone: var(--danger, var(--border));
  --chipText: var(--danger, var(--ink-muted));
}

.statusChip_neutral {
  --chipTone: var(--border);
  --chipText: var(--ink-muted);
}

.statusDot {
  background: currentColor; /* dot = mesma cor do texto (cor do token) */
  block-size: 0.5rem;
  border-radius: 50%;
  flex: none;
  inline-size: 0.5rem;
}

.statusIcon {
  block-size: 1em;
  flex: none;
  inline-size: 1em;
}

.statusLabel {
  white-space: nowrap;
}
```

**Por que tone text e não on-\***: a auditoria exata do controller mostrou que texto `--on-*` sobre fundo tintado color-mix **falha em qualquer transparência** — 1.50:1 @85% e 1.71:1 @80% para success (os dois lados do trade-off A original reprovam). Texto na cor do token sobre o mesmo fundo passa com folga (§2.7).

---

### 2.6 Nav Ícone+Label (Phosphor Regular)

**Atualização Shell.tsx**:

```typescript
import { Boat, Compass, FolderOpen, GearSix, Tray } from '@phosphor-icons/react'
import { SemanticIcon } from '../ui'

const navIcons: Record<ShellDestination, React.ComponentType<IconProps>> = {
  overview: Compass,
  projects: FolderOpen,
  sessions: Boat,
  issues: Tray,
  settings: GearSix
}

// render
<nav aria-label="Primary navigation" className={styles.primaryNavigation}>
  {destinations.map(([destination, label]) => {
    const Icon = navIcons[destination]
    return (
      <Button
        aria-current={view.destination === destination ? 'page' : undefined}
        className={styles.destinationButton}
        key={destination}
        onClick={() => dispatch({ type: 'goToDestination', destination })}
        variant="quiet"
      >
        <SemanticIcon decorative>
          <Icon weight="regular" />
        </SemanticIcon>
        <span>{label}</span>
      </Button>
    )
  })}
</nav>
```

**CSS (shell.module.css)** — layout flex, labels sempre visíveis (nunca icon-only):

```css
.destinationButton {
  gap: var(--space-2);
  inline-size: 100%;
  justify-content: flex-start;
  text-align: start;
}
```

(Button primitivo já é inline-flex com gap; ajuste mínimo.)

---

### 2.7 Auditoria Numérica de Contraste (WCAG 2.1 AA) — NÚMEROS DO CONTROLLER

Fórmula: contraste = (L1 + 0.05) / (L2 + 0.05); luminância relativa com linearização sRGB (expoente 2.4). Referência: L(#0e1b2f) ≈ 0.011.

**Esquema aprovado — texto na cor do token sobre fundo color-mix 85% (sobre `--surface` #0e1b2f)**:

| Tone | Texto | Fundo efetivo (mix 85%) | Ratio | AA (≥4.5:1) |
|------|-------|--------------------------|-------|-------------|
| success | #5ad8a6 | #193741 | **7.10:1** | ✓ |
| warning | #ffd166 | #323637 | **8.48:1** | ✓ |
| danger | #ff8d9d | #322c40 | **6.08:1** | ✓ |
| neutral | #aabbd1 (`--ink-muted`) | #16243a | **7.97:1** | ✓ |

**Fallback sólido `--surface-raised` (#152642) — tone text sobre ele**:

| Tone | Texto | Ratio | AA |
|------|-------|-------|----|
| success | #5ad8a6 | **8.51:1** | ✓ |
| warning | #ffd166 | **10.49:1** | ✓ |
| danger | #ff8d9d | **6.88:1** | ✓ |
| neutral | #aabbd1 | **7.74:1** | ✓ |

**Esquema rejeitado (on-\* sobre fundo tintado)** — motivo da mudança:
- `--on-success` (#07111f) sobre mix 85%: **1.50:1** ✗
- `--on-success` sobre mix 80%: **1.71:1** ✗
- Falha em qualquer transparência; on-* só funciona sobre fill sólido do token (ex.: 10.65:1 sobre `--success` puro)

**Pill ativa da nav**: `--ink` sobre `--surface-active` = **11.15:1** ✓; borda `--accent` = **4.93:1** ✓ (não-texto ≥3:1).

**Neutral com tone text `--border`**: 2.18:1 ✗ — por isso neutral usa `--ink-muted` como texto/ícone.

Todos os pares do design final passam AA. R2 e R3 fechados (§3).

---

### 2.8 Estrutura de Arquivos

```
src/renderer/src/
  ui/
    StatusChip.tsx (novo)
    index.ts (atualizar: export * from './StatusChip')
    primitives.module.css (atualizar: .statusChip, .statusDot, .statusIcon, .statusLabel)
  shell/
    Shell.tsx (atualizar: mappers, navIcons, render)
    shell.module.css (atualizar: .destinationButton gap)
  settings/
    Settings.tsx (atualizar: mappers, render em AgentSettings/IntegrationSettings)
    settings.module.css (sem mudança; .statusList já acomoda)

tests/renderer/ui/
  status-chip.test.tsx (novo)
```

Nenhuma mudança em `concepts.module.css` (blocos legados intocados — boundary).

---

### 2.9 Motion/Transitions (Risco R4)

**Decisão**: StatusChip não adiciona transições; componente informativo estático. Nav reusa transitions existentes do Button (já cobertas por `prefers-reduced-motion` em primitives.module.css). Se motion for adicionada no futuro, ternário `useReducedMotion()` obrigatório (constitution.md L4).

---

### 2.10 Portabilidade em Conceitos Legados (grill G4 — registrado no gate)

Chip renderizado sob command-deck/signal-poster (que não definem `--success`/`--warning`) degrada para **comportamento neutro legível sem editar blocos legados**, via cadeia de fallback `var()`:

- Texto: `var(--success, var(--ink-muted))` → sob legado resolve para `--ink-muted`
- Tone (borda/mix): `var(--success, var(--border))` → sob legado resolve para `--border`
- Fundo fallback: `var(--surface-raised)` → existe nos 3 conceitos

Zero edição em blocos legados de concepts.module.css.

---

## 3. Arquitetura de Riscos

| # | Risco | Severidade | Resolução no Plan | Status |
|----|-------|-----------|---|---|
| R1 | Token `--surface-active` pode não existir | MÉDIO | Token existe em concepts.module.css (#19385a) | ✓ **FECHADO** |
| R2 | Color-mix 85% degrada contraste <4.5:1 | ALTO | **FECHADO via mudança de esquema**: texto/dot/ícone na cor do token (não on-*); ratios auditados 6.08–8.48:1 ✓; fallback sólido `--surface-raised` 6.88–10.49:1 ✓ | ✓ **FECHADO** |
| R3 | --on-danger sobre --danger ~5.2:1 (borderline) | MÉDIO | on-* não é usado no chip (reservado a fills sólidos futuros); par sai do escopo do componente | ✓ **FECHADO** |
| R4 | Motion transitions bypass reduced-motion | MÉDIO | Nenhuma motion nova em P2.1+P2.2; futuro coberto por constitution.md L4 | ✓ **MITIGADO** |

---

## 4. Critérios de Aceitação (Referência: spec.md §8)

1. **AC-1 a AC-5**: StatusChip render + mappers (testing-library)
2. **AC-6**: Fallback sem color-mix — background sólido `--surface-raised` (verificação de CSS + teste de render)
3. **AC-7**: Nav ícone+label (render + aria-current)
4. **AC-8**: Focus ring (padrão existente `.button:focus-visible`)
5. **AC-9**: Icon labeling (aria-hidden em modo decorativo)
6. **AC-10**: WCAG audit — **CONCLUÍDA no gate** (ratios §2.7); re-auditar apenas se algum hex mudar em implement

---

## 5. Trade-offs — RESOLVIDOS no gate HITL (vinculantes)

#### A. Esquema de cor do chip — RESOLVIDO
~~80% vs 85% transparent com texto on-*~~ — **ambos os lados reprovaram na auditoria exata** (1.50:1 @85%, 1.71:1 @80%).
**Decisão do usuário**: fundo `color-mix(in srgb, var(--tone), transparent 85%)` (85% mantido, como a spec) + **texto/ícone/dot na cor do token**; neutral usa `--ink-muted`. Ratios: 7.10 / 8.48 / 6.08 / 7.97 ✓. Fallback sólido `var(--surface-raised)`: 8.51 / 10.49 / 6.88 / 7.74 ✓.

#### B. Dot Color — RESOLVIDO
**Decisão**: dot = cor do token (mesma cor do texto; `currentColor`). Alta visibilidade, comunica tone diretamente.

#### C. Mapeamento Status→Tone — RESOLVIDO
**Decisão**: inline em Shell/Settings. Transparência onde é usado; refatorar para utilitário só com terceiro consumidor.

#### D. Icon Optional vs Required — RESOLVIDO
**Decisão**: `icon` prop opcional **com default por tone** (CheckCircle/Clock/Warning/Minus Regular). Color-not-only garantido pelo default; override permitido.

**Nenhum trade-off aberto restante.** Decisões registradas em ADR-0001/0002/0003.

---

## 6. ADRs Locais da Run

- **ADR-0001-contraste-color-mix-transparencia.md**: esquema final 85% + tone text + fallback surface-raised; on-* reservados a fills sólidos; ratios auditados
- **ADR-0002-statuschip-api-design.md**: API do StatusChip, CSS corrigido, testes
- **ADR-0003-nav-icone-label-phosphor.md**: nav lateral ícone+label, Phosphor Regular, sem icon-only

---

## 7. Task Breakdown (Sumarizado)

*Detalhe completo em sdd-tasks.*

1. **StatusChip.tsx** (novo componente + defaultIconsByTone; ~50 linhas)
2. **primitives.module.css** (seção .statusChip: fallback sólido + @supports color-mix; ~60 linhas)
3. **ui/index.ts** (export StatusChip)
4. **Shell.tsx** (mappers, navIcons, render StatusChip + nav ícone+label; ~50 linhas)
5. **shell.module.css** (gap/layout no .destinationButton; ~3 linhas)
6. **Settings.tsx** (mappers, render StatusChip em AgentSettings/IntegrationSettings; ~30 linhas)
7. **tests/renderer/ui/status-chip.test.tsx** (render, tone class, a11y, default icon, override; ~120 linhas)
8. **Verify gate** (npm run lint/typecheck/test; testes existentes não regridem)
9. **Contraste**: auditoria já concluída no gate (§2.7); re-auditar somente se algum hex mudar em implement

---

## Referências

- spec.md (aprovado HITL 2026-07-09)
- handoff-001.md (riscos R1–R4)
- constitution.md (verify_gate, review numérico de contraste)
- Gate HITL do plan 2026-07-09 (auditoria do controller + 6 decisões vinculantes) — memory/state.md
- .orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/adr/0002 (motion, useReducedMotion) e 0004 (Phosphor Regular)
- concepts.module.css (night-harbor block), primitives.module.css, shell.module.css, settings.module.css
- atlas recalls: navbar-contrast-color-mix-over-ambient, color-not-only, motion-override-bypasses-reduced-motion, on-token-semantics
