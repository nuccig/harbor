# Handoff: tasks → implement

**Data**: 2026-07-09 (pós-analyze, ready for implementation)  
**Orquestrador**: sdd-tasks → sdd-implement  
**Artefatos**: tasks/001-003, analyze report (PASS), handoff-002.md (spec←plan bridge)

---

## Sumário Executivo

**3 tasks disjuntas, cadeia serial obrigatória: 001 → 002 → 003**

| Task | Objetivo | Arquivos Primários | Pontos | Serial Blocker |
|------|----------|-------------------|--------|---|
| 001 | StatusChip component + CSS + export | StatusChip.tsx (novo), primitives.module.css (+70 linhas), ui/index.ts | 5 | Nenhum (independent) |
| 002 | Shell integration (mappers, StatusChip render, nav ícone+label) | Shell.tsx (~60 linhas), shell.module.css (~10 linhas), testes shell-settings.test.tsx | 8 | 001 (StatusChip must exist) |
| 003 | Settings integration (mappers, StatusChip render) | Settings.tsx (~30 linhas), testes shell-settings.test.tsx (compartilhado) | 5 | 001 (StatusChip), 002 (shared test file) |

**Serial Lock (002↔003)**: `tests/renderer/shell-settings/shell-settings.test.tsx` é usado em ambas. Implementar 001 completo, depois 002 com seus testes, depois 003 (adiciona testes ao arquivo compartilhado).

---

## Contexto para Implement

### Garantias Já Validadas (Analyze Report)

1. **Ícones Phosphor confirmados**: 9 ícones (CheckCircle, Clock, Warning, Minus, Compass, FolderOpen, Boat, Tray, GearSix) existem em `@phosphor-icons/react@2.1.10` + exportam com `weight="regular"`
2. **Tokens CSS existem**: night-harbor block em concepts.module.css (~135–174) define:
   - `--success: #5ad8a6`, `--warning: #ffd166`, `--danger: #ff8d9d`, `--border: #41597a`, `--ink-muted: #aabbd1`, `--surface-raised: #152642`, `--surface-active: #19385a`, `--accent: #63a9ff`
3. **Imports resolvem**: SemanticIcon.tsx, Button.tsx, conceitos.module.css importam sem erro
4. **Testes existentes não regridem**: grep 0 matches para "success", "warning", "danger", "neutral" em shell-settings.test.tsx (zero colisão de status string)
5. **Contraste auditado**: WCAG 2.1 AA ratios finais em contrast-audit.md rev. 2 (tintado 6.08–8.48:1, fallback 6.88–10.49:1, pill 11.15:1 ink + 4.93:1 borda)
6. **Zero mudança legado**: concepts.module.css blocos command-deck, signal-poster intocados; zero hex cru necessário

### Mapeamentos Confirmados (Gate HITL)

**Shell.tsx**:
- Sessions: `Running→success`, `Ready→warning`, `Complete→neutral`
- Issues: `High→danger`, `Medium→warning`, `Low→neutral`
- Project: `Active→success`
- Nav: ícones Compass/FolderOpen/Boat/Tray/GearSix em pill ativa aria-current

**Settings.tsx**:
- Agents: `Available→success`, else→neutral
- Integrations: `Not configured→warning`, `Simulated→neutral`, else→neutral

---

## Regras Duras (Não Violável)

1. **Zero hex cru no código novo** — usar `var(--chipTone)`, `var(--chipText)`, `var(--success)`, etc. sempre. Comentários podem conter hex para documentação (ex: `// #152642 = --surface-raised`)
2. **Nunca color-mix no fallback** — fallback é `background: var(--surface-raised)` (sólido). `@supports (color: color-mix(...))` renderiza color-mix **dentro** do bloco, não no fallback
3. **Icon weight="regular" explícito** — todos os ícones Phosphor devem ter `weight="regular"` no JSX (ADR-0004 define Phosphor Regular como set único Night Harbor)
4. **Decorativo aria-hidden** — dot + icon em StatusChip sempre `aria-hidden="true"`. Nav icon em SemanticIcon sempre `decorative={true}`
5. **Sem motion** — StatusChip é informativo (zero transitions próprias). Nav button reusa transições existentes (`.button` apenas). Nenhuma `useReducedMotion()` nova necessária em P2.1+P2.2
6. **Label sempre visível** — nav buttons nunca icon-only; label em `<span>` separado dentro do button
7. **Aria-current="page" mantido** — nav pill ativa conserva atributo no Button (já existe)

---

## Task 001: StatusChip Component + Primitives + Export

**Entregáveis exatos** (referenciar tasks/001-statuschip-component.md §Passos e §Entregáveis):

1. **Criar `src/renderer/src/ui/StatusChip.tsx`** (~55 linhas)
   - Props: `tone: 'success'|'warning'|'danger'|'neutral'`, `label: string`, `icon?: React.ComponentType` (optional)
   - Render: `<span>` com classes `.statusChip .statusChip_${tone}`, conter dot/icon/label
   - Defaults: success→CheckCircle, warning→Clock, danger→Warning, neutral→Minus
   - **Código completo em task §1**

2. **Atualizar `src/renderer/src/ui/primitives.module.css`** (adicionar nova seção, ~70 linhas)
   - `.statusChip`: fallback `background: var(--surface-raised)` (sólido)
   - `@supports (color: color-mix(...))`: color-mix 85% tintado apenas aqui
   - `.statusChip_success`, `.statusChip_warning`, `.statusChip_danger`, `.statusChip_neutral`: custom properties `--chipTone`, `--chipText`
   - `.statusDot`, `.statusIcon`, `.statusLabel`: sub-elementos
   - **CSS completo em task §2**

3. **Atualizar `src/renderer/src/ui/index.ts`** (1 linha)
   - Adicionar `export * from './StatusChip'`

4. **Criar `tests/renderer/ui/status-chip.test.tsx`** (~130 linhas)
   - 8 testes: render label, tone class, default icons (success/danger/neutral), custom icon, aria-hidden, color-not-only, regressão (todos os tones)
   - **Código completo em task §4**

**Verify Gate**:
```bash
npm run lint          # TypeScript + ESLint
npm run typecheck     # StatusChip props, icon type
npm run test          # 8 testes novos + regressão
```

Expected: Sem erros, 8 testes novos passam, testes existentes não regridem.

---

## Task 002: Shell Integration — StatusChip + Nav Ícone+Label

**Entregáveis exatos** (referenciar tasks/002-shell-integration.md §Passos e §Entregáveis):

1. **Atualizar `src/renderer/src/shell/Shell.tsx`** (~60 linhas de mudanças)
   - Adicionar 3 mappers antes da função `Overview()`:
     - `mapSessionStatusToTone()`: Running→success, Ready→warning, Complete→neutral, else→neutral
     - `mapIssuePriorityToTone()`: High→danger, Medium→warning, Low→neutral, else→neutral
     - `mapProjectStatusToTone()`: Active→success, else→neutral
   - Adicionar `navIcons: Record<ShellDestination, React.ComponentType>` com 5 ícones (Compass/FolderOpen/Boat/Tray/GearSix)
   - Importar: `{ Boat, Compass, FolderOpen, GearSix, Tray }` + `{ StatusChip, SemanticIcon }`
   - Substituir 3 locais renderiza `<span>{status}</span>` por `<StatusChip tone={mapper(...)} label={...} />`
   - Atualizar nav map: envolver Icon em `<SemanticIcon decorative>` + label em `<span>` separado
   - **Código completo em task §1–4**

2. **Atualizar `src/renderer/src/shell/shell.module.css`** (~10 linhas)
   - Modificar `.destinationButton`: add `display: inline-flex`, `gap: var(--space-2)`, `align-items: center`
   - Adicionar `.destinationButton span`: truncate (overflow ellipsis)
   - **CSS completo em task §5**

3. **Testes em `tests/renderer/shell-settings/shell-settings.test.tsx`** (compartilhado com 003)
   - Adicionar ~20 linhas: verificar StatusChip render em sessions, nav labels sempre visíveis
   - **Código sugerido em task §6**

**Verify Gate**:
```bash
npm run lint          # Shell.tsx, shell.module.css
npm run typecheck     # mappers, navIcons, StatusChip integration
npm run test          # shell-settings.test.tsx: novo + regressão
```

Expected: Sem erros, visual confirms: status chips coloridos em sessions/issues/project, nav ícones + labels.

---

## Task 003: Settings Integration — StatusChip em Agents/Integrations

**Entregáveis exatos** (referenciar tasks/003-settings-integration.md §Passos e §Entregáveis):

1. **Atualizar `src/renderer/src/settings/Settings.tsx`** (~30 linhas de mudanças)
   - Adicionar 2 mappers antes da função `GeneralSettings()`:
     - `mapAgentStatusToTone()`: Available→success, else→neutral
     - `mapIntegrationStatusToTone()`: Not configured→warning, Simulated→neutral, else→neutral
   - Importar `{ StatusChip }`
   - Substituir 2 locais renderiza `<span>{status}</span>` em AgentSettings e IntegrationSettings por `<StatusChip tone={mapper(...)} label={...} />`
   - **Código completo em task §1–4**

2. **Testes em `tests/renderer/shell-settings/shell-settings.test.tsx`** (compartilhado com 002)
   - Adicionar ~15 linhas: verificar StatusChip render em agentes/integrações
   - **Código sugerido em task §5**

**Verify Gate**:
```bash
npm run lint          # Settings.tsx
npm run typecheck     # mappers, StatusChip integration
npm run test          # shell-settings.test.tsx: novo + regressão
```

Expected: Sem erros, visual confirms: agents=verde (Available), integrations amarelo (Not configured) + cinza (Simulated).

---

## Ordem de Execução Obrigatória

1. ✅ **Implement task 001** completo (StatusChip.tsx, primitives.module.css, ui/index.ts, testes). Verify gate passa.
2. ✅ **Implement task 002** (Shell.tsx, shell.module.css, testes em shell-settings.test.tsx **novo arquivo ou primeira adição**). Verify gate passa. Testes existentes não regridem.
3. ✅ **Implement task 003** (Settings.tsx, testes em shell-settings.test.tsx **append ao arquivo**). Verify gate passa. Testes existentes não regridem.

**Critical**: 002 e 003 compartilham `tests/renderer/shell-settings/shell-settings.test.tsx`. Implementar 002 completo primeiro (cria arquivo + adiciona testes para Shell), depois 003 (append testes para Settings ao mesmo arquivo).

---

## Artefatos de Referência (Não Duplicar)

- **tasks/001-statuschip-component.md**: StatusChip.tsx código exato (§1), primitives.module.css CSS exato (§2), testes código exato (§4)
- **tasks/002-shell-integration.md**: Shell.tsx mappers/JSX exato (§1–4), shell.module.css exato (§5), testes sugestão (§6)
- **tasks/003-settings-integration.md**: Settings.tsx mappers/JSX exato (§1–4), testes sugestão (§5)
- **handoff-002.md §contexto**: Tokens confirmados, ratios WCAG finais, ícones confirmados, mapeamentos confirmados
- **concepts.module.css ~135–174**: Night Harbor token block (não editar, apenas consumir via var())

---

## Riscos Transferidos

Nenhum. Todas as garantias validadas no analyze report:
- ✓ Ícones existem e exportam
- ✓ Tokens existem
- ✓ Imports resolvem
- ✓ Testes existentes não regridem
- ✓ Contraste auditado (AC-10)
- ✓ Zero mudança legado

**Se hex mudar em implement**: re-executar auditoria de contraste antes de merge (L2 learning: gate lint/test cego a cores).

---

## Rastreabilidade

- **Fonte**: tasks/001–003 (sdd-tasks, 2026-07-09), handoff-002.md (plan gate), analyze report (PASS)
- **Decisões**: decisions.md D-001 a D-011 (todas aprovadas, nenhuma nova nesta fase)
- **Learnings**: learnings.md L1–L8, P1–P2 (nenhum novo nesta fase)
- **Próxima fase**: sdd-implement (execute tasks em ordem serial, verify gate por task), sdd-review (PR + merge)
