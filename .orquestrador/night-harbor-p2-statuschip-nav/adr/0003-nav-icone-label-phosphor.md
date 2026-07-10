---
id: 0003
title: Nav ícone+label Phosphor Regular, sem icon-only
status: proposed
date: 2026-07-09
---

# ADR-0003 — Nav ícone+label Phosphor Regular, sem icon-only

## Context

Spec.md §3.1 exige nav lateral com ícones Phosphor Regular + labels sempre visíveis (nunca icon-only). Design.md §6 exige icon+label para scanabilidade. ADR-0004 (tela-de-configuracoes-onboarding-e-ui-alem-do) define Phosphor Regular como set único para Night Harbor.

Nav atual em Shell.tsx usa Button variant="quiet" com aria-current="page", mas sem ícones.

## Decision

1. **Adicionar ícones Phosphor Regular** aos botões de nav (Shell.primaryNavigation)
2. **Mapa de destinos → ícones**:
   - overview → Compass
   - projects → FolderOpen
   - sessions → Boat
   - issues → Tray
   - settings → GearSix

3. **Labels sempre visíveis** (flex layout com gap)
4. **Pill ativa**: Reusa --surface-active + --accent (existentes)

### Implementação

**Shell.tsx**:

```typescript
import {
  Compass,
  FolderOpen,
  Boat,
  Tray,
  GearSix
} from '@phosphor-icons/react'
import { SemanticIcon } from '../ui'

const navIcons: Record<ShellDestination, React.ComponentType> = {
  overview: Compass,
  projects: FolderOpen,
  sessions: Boat,
  issues: Tray,
  settings: GearSix
}

export function Shell() {
  // ...
  return (
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
  )
}
```

**shell.module.css**:

```css
.primaryNavigation {
  display: grid;
  gap: var(--space-1);
}

.destinationButton {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-2);
  inline-size: 100%;
  text-align: start;
  padding-block: var(--space-2);
  padding-inline: var(--space-3);
  /* icon + label sempre visíveis; sem wrap por padrão */
}

.destinationButton span {
  /* label é <span> dentro de <Button> */
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.destinationButton[aria-current='page'] {
  background: var(--surface-active);  /* #19385a night-harbor */
  border-color: var(--accent);        /* #63a9ff night-harbor */
  font-weight: 700;
}
```

**SemanticIcon uso**: decorative=true (ícone é parte visual da label; aria-hidden=true automático)

---

## Icons Rationale

| Destino | Ícone | Metáfora | Phosphor ID |
|---------|-------|----------|---|
| overview | Compass | orientação, navegação | Compass |
| projects | FolderOpen | espaço, projeto | FolderOpen |
| sessions | Boat | porto (Night Harbor), sessões | Boat |
| issues | Tray | fila, bandeja | Tray |
| settings | GearSix | configuração | GearSix |

**Rationale**: Metáforas coerentes com domínio (Harbor, porto) e padrões de UX (folder, gear, tray).

**Phosphor weight**: Regular (padrão, conforme ADR-0004). Especificado explicitamente em prop `weight="regular"`.

---

## Acessibilidade

### Keyboard Navigation
- Button primitivo já suporta Tab, Enter, Space
- aria-current="page" indica destino ativo
- Focus ring aplicado via primitives.css `.button:focus-visible`

### Screen Readers
- Label (texto <span>) é lido como conteúdo do <Button>
- Ícone é aria-hidden="true" (decorativo)
- aria-current="page" anunciado por leitores modernos

### Color-not-only
- ✓ Ícone (visual)
- ✓ Cor de fundo da pill ativa (visual)
- ✓ Label (texto)
- ✓ aria-current="page" (semantic)

---

## CSS Layout Details

**Flex layout**: icon + label em linha única (horizontal)

```
[Compass]  Overview
[FolderOpen]  Projects
[Boat]  Sessions
[Tray]  Issues
[GearSix]  Settings
```

**Responsivo**: Em telas pequenas, label pode ser truncado (text-overflow: ellipsis), mas não ocultado (design.md §6 nunca icon-only).

---

## Alternatives Considered

1. **Icon-only nav com tooltip**
   - Pro: Design compacto
   - Con: Viola design.md §6 (color-not-only, scanabilidade)

2. **Icon + abbreviation label (ex: Comp, Proj)**
   - Pro: Reduz espaço
   - Con: Menos clara; reduz acessibilidade

3. **Usar Iconoir em Night Harbor** (spec aberto)
   - Pro: Diferença visual vs Command Deck (que usa Iconoir)
   - Con: ADR-0004 fixa Phosphor Regular; muda decision já aprovada

4. **Ícone dinâmico sem mapa (refletir tipo de dado)**
   - Pro: Flexível
   - Con: Acoplamento; difícil de testar

## Consequences

- **Scaneabilidade melhorada**: ícone + label = scanning rápido
- **Acessibilidade WCAG 2.1 AA**: color-not-only atendido
- **Bundle size**: Adiciona ~5 ícones Phosphor (~8KB gzipped no pior caso; tree-shaking reduz)
- **Teste**: Verificar que label nunca é ocultado (responsividade)

---

## Related Decisions

- ADR-0004 (tela-de-configuracoes-onboarding-e-ui-alem-do) — Phosphor Regular para Night Harbor
- design.md §6 — exigência icon+label, color-not-only
- plan.md §2.6 — implementação detalhada
- spec.md §3.1 (3.1b) — nav ícone+label + pill ativa
