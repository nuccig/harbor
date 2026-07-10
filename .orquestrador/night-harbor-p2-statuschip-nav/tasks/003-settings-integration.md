# Task 003: Settings Integration — StatusChip em Agents e Integrations

**Status**: Ready for implementation  
**Dependencies**: 001 (StatusChip exists), 002 (Shell tests updated; shares shell-settings.test.tsx)  
**Sprint**: P2.1  
**Points**: 5  

---

## Objetivo

Integrar StatusChip em Settings.tsx para exibir status em agentes (Available) e integrações (Simulated, Not configured). Mapear estados semânticos inline em Settings.tsx conforme plan.md §2.2.

Mapeamento confirmado no gate HITL:
- Agents: `Available` → `success`
- Integrations: `Simulated` → `neutral`, `Not configured` → `warning`

---

## Descrição

Settings renderiza atualmente strings de status em plain text:
- AgentSettings: `<span>{agent.status}</span>` (e.g., "Available")
- IntegrationSettings: `<span>{integration.status}</span>` (e.g., "Simulated", "Not configured")

**Mudanças**:
1. Adicionar funções mappers inline: `mapAgentStatusToTone()`, `mapIntegrationStatusToTone()`
2. Renderizar StatusChip em lugar de `<span>{status}</span>` em AgentSettings e IntegrationSettings
3. Manter estrutura existente de lista (.statusList)
4. Sem mudanças em CSS (settings.module.css .statusList já acomoda componentes)

---

## Contexto de Codebase

### Arquivos Modificados
- `src/renderer/src/settings/Settings.tsx` (atual ~200+ linhas) — adicionar mappers, render StatusChip
- `src/renderer/src/ui/index.ts` (já exporta StatusChip desde task 001)

### Estrutura Settings.tsx (estado atual)
```tsx
// AgentSettings() renderiza:
//   <ul className={styles.statusList}>
//     {mockCatalog.agents.map((agent) => (
//       <li>
//         <span>{agent.label}</span>
//         <span>{agent.status}</span>  // <- substituir por StatusChip
//       </li>
//     ))}
//   </ul>

// IntegrationSettings() renderiza:
//   <ul className={styles.statusList}>
//     {mockCatalog.integrations.map((integration) => (
//       <li>
//         <span>{integration.label}</span>
//         <span>{integration.status}</span>  // <- substituir por StatusChip
//       </li>
//     ))}
//   </ul>
```

### Mock Data (mock-catalog.ts)
```typescript
agents: [
  { id: 'codex', label: 'Codex', status: 'Available' },
  { id: 'claude-code', label: 'Claude Code', status: 'Available' },
  { id: 'gemini-cli', label: 'Gemini CLI', status: 'Available' }
]

integrations: [
  { id: 'github', label: 'GitHub Issues', status: 'Simulated' },
  { id: 'linear', label: 'Linear', status: 'Not configured' }
]
```

### Settings CSS (settings.module.css)
```css
.statusList {
  display: grid;
  gap: var(--space-2);
  list-style: none;
}

/* cada <li> já é grid com 2 colunas (label + status) */
```

---

## Passos

### 1. Adicionar Mappers em Settings.tsx (antes da função AgentSettings)

Inserir após imports, antes de `function GeneralSettings`:

```typescript
// Mappers — semântica de domínio vive onde é usada (decision HITL)

const mapAgentStatusToTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Available': return 'success'
    default: return 'neutral'
  }
}

const mapIntegrationStatusToTone = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'Not configured': return 'warning'
    case 'Simulated': return 'neutral'
    default: return 'neutral'
  }
}
```

### 2. Adicionar Import para StatusChip

No topo de Settings.tsx, nos imports de '../ui':

```typescript
import { StatusChip, Button, FocusHeading } from '../ui'
```

Ou, se Button e FocusHeading já estão importados, apenas adicionar StatusChip:

```typescript
import { StatusChip } from '../ui'
```

### 3. Substituir Render de Status em AgentSettings()

Localizar função `function AgentSettings()` e seu `<ul className={styles.statusList}>`:

```typescript
// ANTES:
<ul className={styles.statusList} aria-label="Available agents">
  {mockCatalog.agents.map((agent) => (
    <li key={agent.id}>
      <span>{agent.label}</span>
      <span>{agent.status}</span>
    </li>
  ))}
</ul>

// DEPOIS:
<ul className={styles.statusList} aria-label="Available agents">
  {mockCatalog.agents.map((agent) => (
    <li key={agent.id}>
      <span>{agent.label}</span>
      <StatusChip
        tone={mapAgentStatusToTone(agent.status)}
        label={agent.status}
      />
    </li>
  ))}
</ul>
```

**Validação**:
- `StatusChip` renderiza inline (inline-flex, não quebra layout da `<li>`)
- aria-label "Available agents" já comunica contexto; StatusChip label redundante mas explícito (reforça acessibilidade)
- Key `agent.id` mantido em `<li>`

### 4. Substituir Render de Status em IntegrationSettings()

Localizar função `function IntegrationSettings()` (ou buscar em Settings.tsx) e seu `<ul className={styles.statusList}>`:

```typescript
// ANTES:
<ul className={styles.statusList} aria-label="Issue integrations">
  {mockCatalog.integrations.map((integration) => (
    <li key={integration.id}>
      <span>{integration.label}</span>
      <span>{integration.status}</span>
    </li>
  ))}
</ul>

// DEPOIS:
<ul className={styles.statusList} aria-label="Issue integrations">
  {mockCatalog.integrations.map((integration) => (
    <li key={integration.id}>
      <span>{integration.label}</span>
      <StatusChip
        tone={mapIntegrationStatusToTone(integration.status)}
        label={integration.status}
      />
    </li>
  ))}
</ul>
```

**Validação**:
- `StatusChip` renderiza inline
- aria-label "Issue integrations" já comunica contexto
- Mapeamento: "Not configured" → warning (amarelo), "Simulated" → neutral (cinza)

### 5. Testar Integração

Adicionar testes em `tests/renderer/shell-settings/shell-settings.test.tsx`:

```typescript
it('renders StatusChip in agents list (Available → success)', () => {
  render(<ExperienceTestRoot><Settings /></ExperienceTestRoot>)
  // Verificar que StatusChip renderiza com success tone (pode testar classe, SVG, etc.)
  const agentsSection = screen.getByLabelText('Available agents')
  expect(agentsSection).toBeInTheDocument()
  // Se quiser verificar tone específico:
  // expect(within(agentsSection).querySelector('[class*="statusChip_success"]')).toBeInTheDocument()
})

it('renders StatusChip in integrations list (Not configured → warning, Simulated → neutral)', () => {
  render(<ExperienceTestRoot><Settings /></ExperienceTestRoot>)
  const integrationsSection = screen.getByLabelText('Issue integrations')
  expect(integrationsSection).toBeInTheDocument()
})
```

---

## Critérios de Aceitação (spec.md §8)

- **AC-4**: Settings agents status (Available → success) — ✓ verificável em AgentSettings
- **AC-5**: Settings integrations status (Not configured → warning, Simulated → neutral) — ✓ verificável em IntegrationSettings
- **AC-9**: Icon labeling (aria-hidden) — ✓ StatusChip decorativo
- **AC-10**: WCAG audit — ✓ ratios auditados no gate

---

## Verify Gate

```bash
npm run lint         # Settings.tsx (imports, syntax)
npm run typecheck    # mappers, StatusChip integration type
npm run test         # shell-settings.test.tsx passa; sem regressão
```

**Expected**:
- Settings.tsx compila sem erros (mappers, JSX)
- Testes de shell-settings não regridem
- Visual: agents/integrations exibem chips coloridos (Available=verde, Not configured=amarelo, Simulated=cinza)

---

## Notas Técnicas

### Mapeadores Inline
- Mappers vivem em Settings.tsx (não centralizados)
- `mapAgentStatusToTone()` — simples switch (only "Available" → "success"; else → "neutral")
- `mapIntegrationStatusToTone()` — switch com 2 casos ("Not configured", "Simulated") + default

### StatusList Layout
- `.statusList` já é grid; StatusChip é inline-flex
- Layout responsivo: label <span> + StatusChip em linha; sem wrap ou truncate em telas normais

### Cores Finais (validadas no gate)
- **Available** (success #5ad8a6): ✓ 7.10:1 tintado, 8.51:1 fallback
- **Not configured** (warning #ffd166): ✓ 8.48:1 tintado, 10.49:1 fallback
- **Simulated** (neutral #border/#41597a com ink-muted): ✓ 7.97:1 tintado, 7.74:1 fallback

### Sem Mudanças em CSS
- settings.module.css .statusList intocado (já acomoda componentes inline-flex)
- Nenhuma transição nova (StatusChip estático)

---

## Referências

- spec.md §3.2, §4.2, §8 (StatusChip render em Settings, mapeamento, ACs-4-5)
- plan.md §2.2 (mapeadores Settings)
- handoff-002.md §contexto (mapeamento confirmado HITL)
- mock-catalog.ts (agents, integrations data)

---

## Entregáveis

1. ✅ `src/renderer/src/settings/Settings.tsx` (modificar; mappers ~15 linhas, render StatusChip ~15 linhas alteradas em 2 places)
2. ✅ Testes de settings em shell-settings.test.tsx (adicionar ~15 linhas)
3. ✅ Sem mudanças em settings.module.css (statusList já acomoda)
4. ✅ Sem mudanças em conceitos legados (concepts.module.css, primitives.module.css intocados)
