# Task 001: StatusChip Component + Primitives + Export

**Status**: Ready for implementation  
**Dependencies**: None (independent task)  
**Sprint**: P2.1  
**Points**: 5  

---

## Objetivo

Implementar o componente **StatusChip** — composição visual de dot + ícone Phosphor + label com fundo tintado via `color-mix` — conforme ADR-0002 e plan.md §2.1, §2.5. Este é o bloco fundamental que Shell e Settings reutilizarão.

---

## Descrição

StatusChip é um componente informativo (não interativo) que comunica estado semântico em contextos como sessões, issues, projetos, agentes e integrações. A composição usa dot decorativo (cor do token), ícone Phosphor Regular (CheckCircle/Clock/Warning/Minus), e label texto.

Fundo tintado via `color-mix(in srgb, var(--chipTone), transparent 85%)` com fallback sólido `var(--surface-raised)` para navegadores legados.

---

## Contexto de Codebase

### Arquivos Relacionados
- `src/renderer/src/ui/Button.tsx` — padrão de props (ButtonHTMLAttributes, className merging)
- `src/renderer/src/ui/SemanticIcon.tsx` — wrapping de ícones Phosphor com aria-hidden decorative
- `src/renderer/src/ui/index.ts` — export point para todos os componentes ui
- `src/renderer/src/ui/primitives.module.css` — estilos globais (.button, .icon, .field, etc.)
- `src/renderer/src/concepts/concepts.module.css` (linhas 135–174) — night-harbor block com tokens `--success`, `--warning`, `--danger`, `--ink-muted`, `--border`, `--surface-raised`
- `tests/renderer/ui/button.test.tsx` — padrão de testes (render, testing-library, vitest)

### Tokens Confirmados (night-harbor block)
```css
--success: #5ad8a6
--warning: #ffd166
--danger: #ff8d9d
--border: #41597a
--ink-muted: #aabbd1
--surface-raised: #152642
```

### Imports Necessários
- `@phosphor-icons/react`: CheckCircle, Clock, Warning, Minus (weight="regular")
- `react`: ReactNode, ComponentType, SVGProps
- `vitest`: describe, expect, it
- `@testing-library/react`: render, screen

---

## Passos

### 1. Criar `src/renderer/src/ui/StatusChip.tsx`

Arquivo novo com estrutura:

```typescript
import type { ReactNode } from 'react'
import { CheckCircle, Clock, Minus, Warning } from '@phosphor-icons/react'
import styles from './primitives.module.css'

export interface StatusChipProps {
  tone: 'success' | 'warning' | 'danger' | 'neutral'
  label: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

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

**Notas**:
- `tone` é enum semântico (força semântica, recusa string genérica)
- `label` é string comunicação primária (sempre visível, não aria-label)
- `icon` opcional com default por tone (permite override; color-not-only garantido)
- Dot, ícone com `aria-hidden="true"` (decorativos; label comunica)
- Sem `role`, `aria-label`, ou `aria-pressed` — é informativo, não interativo

### 2. Atualizar `src/renderer/src/ui/primitives.module.css`

Adicionar seção nova (antes ou após seções existentes, mantendo organização):

```css
/* StatusChip — novo componente, P2.1 */

.statusChip {
  align-items: center;
  /* Fallback sólido para navegadores sem color-mix.
     Nunca color-mix no fallback — bug da rev. 1. */
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

/* Fundo tintado dinâmico — color-mix 85% conforme spec e gate HITL.
   Texto/dot/ícone na cor do token (não on-*); ratios auditados 6.08–8.48:1. */
@supports (color: color-mix(in srgb, black, transparent)) {
  .statusChip {
    background: color-mix(in srgb, var(--chipTone, var(--border)), transparent 85%);
  }
}

/* Tone variants — custom properties definem tema por tone.
   Cadeia var() degrada para neutro legível sob conceitos legados. */
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

/* Sub-elementos decorativos */
.statusDot {
  background: currentColor;  /* dot herda cor do texto (cor do token) */
  block-size: 0.5rem;
  border-radius: 50%;
  flex: none;
  inline-size: 0.5rem;
}

.statusIcon {
  block-size: 1em;
  flex: none;
  inline-size: 1em;
  /* SVG Phosphor herda currentColor do parent */
}

.statusLabel {
  white-space: nowrap;
}
```

**Validação CSS**:
- Fallback sólido `--surface-raised` (token confirmado #152642)
- `@supports` cobre color-mix (navegadores modernos)
- Custom properties `--chipTone`, `--chipText` suportam cadeia var() para legado
- Nenhuma transição (componente estático; risco R4)
- Nenhuma mudança em concepts.module.css (boundary)

### 3. Atualizar `src/renderer/src/ui/index.ts`

Adicionar export novo:

```typescript
export * from './StatusChip'
```

Após a linha existente, em ordem alfabética ou no final.

### 4. Criar `tests/renderer/ui/status-chip.test.tsx`

Arquivo novo com testes:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusChip } from '../../../src/renderer/src/ui'
import { CheckCircle, Clock, Minus, Warning } from '@phosphor-icons/react'

describe('StatusChip', () => {
  it('renders label as primary communication', () => {
    render(<StatusChip tone="success" label="Running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('applies tone class for styling', () => {
    const { container } = render(<StatusChip tone="warning" label="Pending" />)
    expect(container.querySelector('[class*="statusChip_warning"]')).toBeInTheDocument()
  })

  it('renders a default icon for the tone (success → CheckCircle)', () => {
    const { container } = render(<StatusChip tone="success" label="Ready" />)
    // Phosphor icon é SVG; verificar presença
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders default icon danger → Warning', () => {
    const { container } = render(<StatusChip tone="danger" label="Critical" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders default icon neutral → Minus', () => {
    const { container } = render(<StatusChip tone="neutral" label="Terminal" />)
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
    expect(hidden.length).toBeGreaterThanOrEqual(2)  // dot + icon
  })

  it('maintains color-not-only principle (dot + icon + label)', () => {
    const { container } = render(<StatusChip tone="danger" label="Critical" />)
    expect(container.querySelector('[class*="statusDot"]')).toBeInTheDocument()  // dot
    expect(container.querySelector('svg')).toBeInTheDocument()  // icon
    expect(screen.getByText('Critical')).toBeInTheDocument()  // label
  })

  it('renders all tone variants without crashing', () => {
    const tones = ['success', 'warning', 'danger', 'neutral'] as const
    tones.forEach((tone) => {
      const { unmount } = render(
        <StatusChip tone={tone} label={tone.charAt(0).toUpperCase() + tone.slice(1)} />
      )
      unmount()
    })
  })
})
```

**Validação de testes**:
- Render + label (comunicação primária)
- Tone class application (CSS selector)
- Default icons por tone (verificar SVG)
- Override customizado (prop icon)
- aria-hidden decorativos
- Color-not-only (dot + icon + label)
- Testes de regressão (todos os tones)

---

## Critérios de Aceitação (spec.md §8)

- **AC-1 a AC-5**: StatusChip render + tone/label — ✓ testados
- **AC-6**: Fallback sólido `--surface-raised` — ✓ CSS fallback sem color-mix
- **AC-9**: Icon labeling decorativo (aria-hidden) — ✓ dot + icon hidden
- **AC-10**: WCAG audit — ✓ ratios auditados no gate (6.08–8.48:1 tintado; 6.88–10.49:1 fallback)

---

## Verify Gate

```bash
npm run lint         # TypeScript + ESLint (StatusChip, primitives.module.css)
npm run typecheck    # StatusChip props, icon prop type
npm run test         # 8 testes novos, testes existentes não regridem
npm run test -- --coverage=false  # Se preciso medir cobertura
```

**Expected**:
- Arquivo StatusChip.tsx compila sem erros
- Arquivo primitives.module.css válido (sem @supports erro)
- 8 testes novos passam
- Testes existentes não regridem
- Exports em ui/index.ts resolvem sem erro

---

## Notas Técnicas

### Regra Dura: Nunca Hex Raw no Código Novo
- Hardcoded hex proibido; usar `var(--chipTone)`, `var(--chipText)` sempre
- Comentários podem conter hex se necessário para documentação (ex: "// #152642 = --surface-raised")

### Fallback Color-mix (Bug Histórico)
- Rev. 1 deste projeto usava color-mix no fallback, tornando-o inútil em navegadores sem suporte
- **Solução**: fallback é `background: var(--surface-raised)` (sólido, não color-mix)
- `@supports` renderiza color-mix dinâmico somente onde suportado

### Motion (Risco R4)
- StatusChip é componente estático; zero transitions novas
- Transitions existentes (ex: Button:active) são reutilizadas quando usado em Shell/Settings
- Se motion for adicionada após, constitution.md exige `useReducedMotion()` ternário

### On-Token Semantics (ADR-0001)
- `--on-*` tokens (ex: `--on-success`) são **reservados a fills sólidos futuros** (ex: badge com background solid)
- StatusChip **não usa** `--on-*` (texto/ícone/dot na cor do token)
- Essa distinção evita incompatibilidade com fundo tintado color-mix (on-* sobre tintado falha <4.5:1)

---

## Referências

- spec.md §3.1, §8 (StatusChip AC-1 a AC-10)
- plan.md §2.1, §2.3, §2.5, §2.7 (API, ícones, CSS, ratios)
- ADR-0001 (fundo tintado 85% + tone text + fallback)
- ADR-0002 (StatusChip API e CSS)
- concepts.module.css (night-harbor tokens)
- handoff-002.md §contexto (testes padrão, imports)

---

## Entregáveis

1. ✅ `src/renderer/src/ui/StatusChip.tsx` (novo, ~55 linhas)
2. ✅ `src/renderer/src/ui/primitives.module.css` (atualizar com .statusChip* e sub-elementos, ~70 linhas novas)
3. ✅ `src/renderer/src/ui/index.ts` (atualizar export, 1 linha)
4. ✅ `tests/renderer/ui/status-chip.test.tsx` (novo, ~130 linhas)
5. ✅ Nenhuma mudança em concepts.module.css (boundary respeitada)
