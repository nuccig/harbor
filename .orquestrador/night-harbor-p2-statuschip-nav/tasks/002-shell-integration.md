# Task 002: Shell Integration — StatusChip + Nav Ícone+Label

**Status**: Ready for implementation  
**Dependencies**: 001 (StatusChip component must exist)  
**Sprint**: P2.1 + P2.2  
**Points**: 8  

---

## Objetivo

Integrar StatusChip em Shell.tsx para exibir status em sessões, issues e projeto. Complementar com nav lateral ícone+label Phosphor Regular (Compass/FolderOpen/Boat/Tray/GearSix), conforme ADR-0003 e plan.md §2.2, §2.6.

Mapear estados semânticos (Running→success, Ready→warning, etc.) inline em Shell.tsx, mantendo transparência onde é usado (sem utilitário centralizado, conforme gate HITL).

---

## Descrição

Shell renderiza atualmente strings de status em plain text:
- Sessions: `<span>{session.status}</span>` (e.g., "Running", "Ready", "Complete")
- Issues: `<span>{issue.priority}</span>` (e.g., "High", "Medium", "Low")
- Project: `<span>{project.status}</span>` (e.g., "Active")
- Nav: text-only (Compass, FolderOpen, etc., faltam ícones)

**Mudanças**:
1. Adicionar funções mappers inline: `mapSessionStatusToTone()`, `mapIssuePriorityToTone()`, `mapProjectStatusToTone()`
2. Renderizar StatusChip em lugar de `<span>{status}</span>`
3. Adicionar mapa navIcons (Record<ShellDestination, ícone Phosphor>)
4. Atualizar nav para exibir ícone + label via SemanticIcon
5. Ajustar CSS layout em shell.module.css (.destinationButton gap)
6. Manter aria-current="page" no elemento ativo (já existe)

---

## Contexto de Codebase

### Arquivos Modificados
- `src/renderer/src/shell/Shell.tsx` (atual ~200+ linhas) — adicionar mappers, navIcons, render StatusChip
- `src/renderer/src/shell/shell.module.css` (atual ~100+ linhas) — ajustar .destinationButton layout (gap/flex)
- `src/renderer/src/ui/index.ts` (já exporta StatusChip desde task 001)

### Estrutura Shell.tsx (estado atual)
```tsx
// Overview() renderiza:
//   - currentProject: project.name, project.branch, project.status (string)
//   - sessions (lista): session.agent, session.task, session.status (string)
//   - issues (lista): issue.id, issue.title, issue.priority (string)

// Nav: destinations array com [destination, label]
// .destinationButton com Button variant="quiet" + aria-current="page"
```

### Mock Data (mock-catalog.ts)
```typescript
currentProject: { status: 'Active' }
sessions: [
  { id: 'session-104', agent: 'Codex', task: 'Settings shell', status: 'Running' },
  { id: 'session-103', agent: 'Claude Code', task: 'Onboarding copy', status: 'Ready' },
  { id: 'session-102', agent: 'Gemini CLI', task: 'UI references', status: 'Complete' }
]
issueQueue: [
  { id: '#29', title: '...', priority: 'High' },
  { id: '#31', title: '...', priority: 'Medium' },
  { id: '#34', title: '...', priority: 'Low' }
]

destinations: { overview, projects, sessions, issues, settings }
```

### Imports que Adicionar
- `StatusChip` (from '../ui')
- `Compass, FolderOpen, Boat, Tray, GearSix` (from '@phosphor-icons/react')
- `SemanticIcon` (from '../ui') — já importado

---

## Passos

### 1. Adicionar Mappers em Shell.tsx (antes da função Overview)

Inserir após imports e antes de `const destinations = ...`:

```typescript
// Mappers — semântica de domínio vive onde é usada (decision HITL)

const mapSessionStatusToTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Running': return 'success'
    case 'Ready': return 'warning'
    case 'Complete': return 'neutral'
    default: return 'neutral'
  }
}

const mapIssuePriorityToTone = (priority: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (priority) {
    case 'High': return 'danger'
    case 'Medium': return 'warning'
    case 'Low': return 'neutral'
    default: return 'neutral'
  }
}

const mapProjectStatusToTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Active': return 'success'
    default: return 'neutral'
  }
}

const navIcons: Record<ShellDestination, React.ComponentType> = {
  overview: Compass,
  projects: FolderOpen,
  sessions: Boat,
  issues: Tray,
  settings: GearSix
}
```

### 2. Adicionar Import para Ícones e StatusChip

No topo de Shell.tsx, nos imports da `'@phosphor-icons/react'`, adicionar:

```typescript
import {
  Boat,
  Compass,
  FolderOpen,
  GearSix,
  Tray
} from '@phosphor-icons/react'
import { StatusChip, SemanticIcon } from '../ui'
```

Verificar que `SemanticIcon` já está em `'../ui'` (desde task 001).

### 3. Substituir Render de Status na Função Overview()

**Projeto status** (linha ~118 em Overview):
```typescript
// ANTES:
<dd>{project.status}</dd>

// DEPOIS:
<dd>
  <StatusChip
    tone={mapProjectStatusToTone(project.status)}
    label={project.status}
  />
</dd>
```

**Session status** (linha ~137 em sessions renderReady):
```typescript
// ANTES:
<span>{session.status}</span>

// DEPOIS:
<span>
  <StatusChip
    tone={mapSessionStatusToTone(session.status)}
    label={session.status}
  />
</span>
```

**Issue priority** (line ~150 em issues renderReady, aproximadamente):
```typescript
// ANTES:
<span>{issue.priority}</span>

// DEPOIS:
<span>
  <StatusChip
    tone={mapIssuePriorityToTone(issue.priority)}
    label={issue.priority}
  />
</span>
```

**Nota**: Verificar o índice exato destas linhas no Shell.tsx real; o objetivo é substituir `<span>{status/priority}</span>` por `<StatusChip tone={...} label={...} />`.

### 4. Atualizar Nav em Shell.tsx para Ícone+Label

Localizar o map de `destinations` na nav (aprox. linhas 165–185):

```typescript
// ANTES:
<nav aria-label="Primary navigation" className={styles.primaryNavigation}>
  {destinations.map(([destination, label]) => (
    <Button
      aria-current={view.destination === destination ? 'page' : undefined}
      className={styles.destinationButton}
      key={destination}
      onClick={() => dispatch({ type: 'goToDestination', destination })}
      variant="quiet"
    >
      {label}
    </Button>
  ))}
</nav>

// DEPOIS:
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

**Validação**:
- `Icon` resolvido de `navIcons[destination]`
- `SemanticIcon` com `decorative=true` (ícone é parte visual, aria-hidden automático)
- `weight="regular"` explícito em Icon (conforme ADR-0004)
- Label em `<span>` separado (sempre visível, nunca icon-only)
- aria-current mantido no Button ativo

### 5. Atualizar `shell.module.css` para Layout Ícone+Label

No `.destinationButton`:

```css
/* ANTES: */
.destinationButton {
  inline-size: 100%;
  justify-content: flex-start;
  text-align: start;
}

/* DEPOIS: */
.destinationButton {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-2);
  inline-size: 100%;
  text-align: start;
  padding-block: var(--space-2);
  padding-inline: var(--space-3);
}

.destinationButton span {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Validação**:
- `display: inline-flex` + `gap: var(--space-2)` (ícone + label em linha)
- `align-items: center` (vertical centering)
- `justify-content: flex-start` (alinhamento esquerdo)
- `.destinationButton span` para truncar label em telas pequenas (design.md §6 nunca icon-only; label pode truncar)
- Pill ativa (`.destinationButton[aria-current='page']`) já existe com `var(--surface-active)` + `var(--accent)`

### 6. Testar Integração (opcional, mas recomendado)

Se houver testes Shell em `tests/renderer/shell-settings/shell-settings.test.tsx`, adicionar:

```typescript
it('renders StatusChip in sessions list', () => {
  render(<ExperienceTestRoot><Shell /></ExperienceTestRoot>)
  const sessionItems = screen.getAllByText(/Running|Ready|Complete/)
  expect(sessionItems.length).toBeGreaterThan(0)
  // Verificar que StatusChip renderiza (pode testar classe, SVG, etc.)
})

it('renders nav icons with labels', () => {
  render(<ExperienceTestRoot><Shell /></ExperienceTestRoot>)
  expect(screen.getByText('Overview')).toBeInTheDocument()
  expect(screen.getByText('Projects')).toBeInTheDocument()
  expect(screen.getByText('Sessions')).toBeInTheDocument()
  expect(screen.getByText('Issues')).toBeInTheDocument()
  expect(screen.getByText('Settings')).toBeInTheDocument()
  // Labels sempre presentes (nunca icon-only)
})
```

---

## Critérios de Aceitação (spec.md §8)

- **AC-1**: StatusChip render em sessions (Running → success) — ✓ verificável no Overview
- **AC-2**: StatusChip render em issues (High → danger) — ✓ verificável no Overview
- **AC-3**: StatusChip render em project (Active → success) — ✓ verificável em currentProject
- **AC-7**: Nav ícone+label Phosphor Regular — ✓ Compass/FolderOpen/Boat/Tray/GearSix com labels visíveis
- **AC-8**: Nav focus ring — ✓ padrão existente .button:focus-visible mantido
- **AC-9**: Icon labeling (aria-hidden) — ✓ SemanticIcon decorative

---

## Verify Gate

```bash
npm run lint         # Shell.tsx + shell.module.css (imports, syntax)
npm run typecheck    # mappers, navIcons type, StatusChip integration
npm run test         # shell-settings.test.tsx passa; sem regressão
```

**Expected**:
- Shell.tsx compila sem erros (mappers, navIcons, JSX)
- shell.module.css válido
- Testes de shell-settings não regridem
- Visual: sessions/issues exibem chips coloridos; nav mostra ícones + labels

---

## Notas Técnicas

### Mapeadores Inline (Decisão HITL)
- Mappers vivem em Shell.tsx (não centralizados) — transparência onde é usado
- Refatorar para utilitário só com terceiro consumidor (atual: only Shell uses)
- Cada mapper é switch case simples, sem lógica complexa

### Nav Icons Phosphor
- Compass: orientação (Overview)
- FolderOpen: espaço (Projects)
- Boat: porto/marítimo (Sessions) — metáfora Night Harbor
- Tray: fila/bandeja (Issues)
- GearSix: configuração (Settings)
- Todos weight="regular" (ADR-0004)

### Pill Ativa Nav
- Já existe `.destinationButton[aria-current='page']` com `--surface-active` + `--accent`
- Task apenas adiciona ícone layout (gap/flex)
- Ratios validados no gate: ink 11.15:1 ✓, accent 4.93:1 ✓

### Motion (Risco R4)
- Nav button reusa transições existentes (.button transition)
- StatusChip é estático (sem transitions novas)
- Nenhum bypass de reduced-motion necessário (transições já respeitam preferência)

---

## Referências

- spec.md §3.1, §4.1, §8 (StatusChip render, nav ícone+label, ACs)
- plan.md §2.2, §2.6, §2.7 (mapeadores, nav layout, ratios)
- ADR-0003 (nav ícone+label Phosphor)
- handoff-002.md §contexto (nav ícones confirmados)
- shell.module.css (lint, gap/padding)
- SemanticIcon.tsx (decorative mode)

---

## Entregáveis

1. ✅ `src/renderer/src/shell/Shell.tsx` (modificar; mappers ~30 linhas, navIcons ~5 linhas, render ~25 linhas alteradas)
2. ✅ `src/renderer/src/shell/shell.module.css` (modificar .destinationButton; ~10 linhas)
3. ✅ Testes de shell em shell-settings.test.tsx (adicionar ~20 linhas se necessário)
4. ✅ Sem mudanças em outros arquivos (concepts.module.css, primitives.module.css intocados)
