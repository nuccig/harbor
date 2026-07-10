---
id: 0002
title: StatusChip API e estrutura de componente
status: accepted
date: 2026-07-09
---

# ADR-0002 — StatusChip API e estrutura de componente

> Rev. 2 — CSS corrigido conforme decisão final do gate HITL (ver ADR-0001):
> texto/ícone/dot na cor do token, fallback sólido `--surface-raised`, on-* fora do chip.

## Context

StatusChip é novo componente composto de dot + ícone Phosphor + label com fundo tintado (color-mix ou fallback). Necessário definir:

1. Props API (como receber tone, label, ícone?)
2. Render structure (ordem, classes CSS, acessibilidade)
3. Fallback para navegadores sem color-mix
4. Teste de render/a11y/fallback

Design.md §6 e spec.md exigem color-not-only (cor + shape + text comunicam status).

## Decision

### 1. Props API

```typescript
export interface StatusChipProps {
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}
```

**Rationale**:
- `tone`: enum semântico (não aceita string genérica; força semântica)
- `label`: string comunicação primária (acessível, exibida sempre)
- `icon`: optional React component com **default por tone** (decisão do gate; permite override por domínio sem perder color-not-only)

---

### 2. Render Structure

```tsx
import { CheckCircle, Clock, Minus, Warning } from '@phosphor-icons/react'
import styles from './primitives.module.css'

const defaultIconsByTone = {
  success: CheckCircle,
  warning: Clock,
  danger: Warning,
  neutral: Minus
} as const

export function StatusChip({ tone, label, icon }: StatusChipProps) {
  const Icon = icon ?? defaultIconsByTone[tone]
  return (
    <span className={`${styles.statusChip} ${styles[`statusChip_${tone}`]}`}>
      <span aria-hidden="true" className={styles.statusDot} />
      <Icon aria-hidden="true" className={styles.statusIcon} weight="regular" />
      <span className={styles.statusLabel}>{label}</span>
    </span>
  )
}
```

**Ordem**: dot → ícone → label (visual scan pattern).
**Acessibilidade**:
- Dot: decorativo (aria-hidden="true"; comunicado via label)
- Ícone: decorativo (aria-hidden="true"; parte da composition, não standalone)
- Label: único texto (comunica status primariamente)

**Sem role/aria-label**: StatusChip é informativo (não interativo); o label texto comunica tudo.
**weight="regular"**: explícito, conforme ADR-0004 (Phosphor Regular para Night Harbor).
**Ícones confirmados no gate**: CheckCircle / Clock / Warning / Minus (Regular).

---

### 3. CSS Structure (corrigido — esquema do gate)

Arquivo: `src/renderer/src/ui/primitives.module.css`

```css
/* Base — texto/dot/ícone na COR DO TOKEN (não on-*); ver ADR-0001 */
.statusChip {
  align-items: center;
  /* Fallback sólido para navegadores sem color-mix — NUNCA color-mix aqui.
     --surface-raised existe nos 3 conceitos (portabilidade legada). */
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

/* Fundo tintado dinâmico — 85% transparent, conforme spec e gate */
@supports (color: color-mix(in srgb, black, transparent)) {
  .statusChip {
    background: color-mix(in srgb, var(--chipTone, var(--border)), transparent 85%);
  }
}

/* Tone variants — chipText = var(--tone, var(--ink-muted)); dot = mesma cor */
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

/* Sub-elementos */
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
  /* SVG Phosphor usa currentColor — herda chipText */
}

.statusLabel {
  white-space: nowrap;
}
```

**Notas**:
- Custom properties (`--chipTone`, `--chipText`) definem tema por tone; cadeia `var()` degrada para neutro legível sob conceitos legados (grill G4) sem editar blocos legados.
- Fallback sólido `var(--surface-raised)`: tone text sobre ele passa AA em todos os tones (8.51 / 10.49 / 6.88 / 7.74 — ADR-0001).
- Sem transitions próprias (componente estático; risco R4 fora de cena).
- `--on-*` não aparecem no chip (reservados a fills sólidos futuros — ADR-0001).

---

### 4. Teste de Render/A11y

Arquivo: `tests/renderer/ui/status-chip.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusChip } from '../../../src/renderer/src/ui'

describe('StatusChip', () => {
  it('renders label as primary communication', () => {
    render(<StatusChip tone="success" label="Running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('applies tone class for styling', () => {
    const { container } = render(<StatusChip tone="warning" label="Pending" />)
    expect(container.querySelector('[class*="statusChip_warning"]')).toBeInTheDocument()
  })

  it('renders a default icon for the tone', () => {
    const { container } = render(<StatusChip tone="success" label="Ready" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('supports custom icon override', () => {
    const CustomIcon = () => <svg data-testid="custom-icon" />
    render(<StatusChip tone="success" label="Approved" icon={CustomIcon} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('hides decorative elements (dot and icon) from screen readers', () => {
    const { container } = render(<StatusChip tone="success" label="Running" />)
    const hidden = container.querySelectorAll('[aria-hidden="true"]')
    expect(hidden.length).toBeGreaterThanOrEqual(2)
  })

  it('maintains color-not-only principle (dot + icon + label)', () => {
    const { container } = render(<StatusChip tone="danger" label="Critical" />)
    expect(container.querySelector('[class*="statusDot"]')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })
})
```

---

### 5. Integração com Shell/Settings

Mapeadores inline (aprovado no gate) — ver plan.md §2.2:

```typescript
// Shell.tsx
<StatusChip tone={mapSessionStatusToTone(session.status)} label={session.status} />

// Settings.tsx
<StatusChip tone={mapAgentStatusToTone(agent.status)} label={agent.status} />
<StatusChip tone={mapIntegrationStatusToTone(integration.status)} label={integration.status} />
```

---

## Alternatives Considered

1. **StatusChip recebe `status` string, mapeia internamente**
   - Pro: chamador mais simples
   - Con: componente conhece domínio; difícil reusar em novos contextos

2. **API com `dotColor`, `textColor` props separadas**
   - Pro: máxima flexibilidade
   - Con: complexidade; risco de pares sem auditoria de contraste

3. **Icon obrigatório (não optional)**
   - Pro: força color-not-only na API
   - Con: inflexível; default por tone já garante color-not-only sem obrigar

4. **Texto `--on-*` sobre fundo tintado (rev. 1)**
   - Reprovado na auditoria exata (1.50:1 @85%) — ver ADR-0001

## Consequences

- **Render simplificado**: label comunica tudo; dot/icon decorativos (aria-hidden)
- **Reusável**: múltiplos domínios (Shell, Settings, futuro), portável entre conceitos via cadeia var()
- **Testável**: props simples, render previsível, sem estado
- **Acessível**: WCAG 2.1 AA — todos os pares texto/fundo auditados (ADR-0001); color-not-only via dot + ícone + label
- **Fallback correto**: navegadores sem color-mix recebem fundo sólido `--surface-raised` legível (bug da rev. 1 — fallback usando color-mix — corrigido)

## Related Decisions

- ADR-0001 (esquema de cor: 85% + tone text + fallback surface-raised, ratios)
- ADR-0003 (nav ícone+label, usa SemanticIcon não StatusChip)
- plan.md §2.1–2.3, §2.5, §2.10
