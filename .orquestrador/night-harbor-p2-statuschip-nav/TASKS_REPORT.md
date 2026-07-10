# Report: tasks — Status

**Agent**: sdd-tasks (tasks-agent do orquestrador SDD)  
**Data**: 2026-07-09  
**Feature**: night-harbor-p2-statuschip-nav (P2.1 + P2.2)  
**Sprint**: Implementação  

---

## Sumário Executivo

Fatiar de especificação e plano em **3 tasks independentes**, com escopo de arquivos **estritamente disjunto**, prontas para implementação paralela (001 independente; 002→001; 003→002).

**Total**: 18 pontos estimados (5 + 8 + 5)  
**Duração**: ~2–3 dias de work (para um dev senior)  
**Bloqueadores**: Nenhum aberto

---

## Tasks Produzidas

### 001: StatusChip Component + Primitives + Export
**Status**: ✅ Ready  
**Arquivo**: `.orquestrador/night-harbor-p2-statuschip-nav/tasks/001-statuschip-component.md`  
**Pontos**: 5  
**Dependências**: None (independent)  

**Escopo de Arquivos (DISJUNTO)**:
- ✨ NEW: `src/renderer/src/ui/StatusChip.tsx` (~55 linhas)
- ✨ NEW: `tests/renderer/ui/status-chip.test.tsx` (~130 linhas)
- 📝 MODIFY: `src/renderer/src/ui/primitives.module.css` (+~70 linhas)
- 📝 MODIFY: `src/renderer/src/ui/index.ts` (+1 line export)

**Nenhuma mudança em**:
- concepts.module.css (boundary respeitada)
- shell.module.css, Shell.tsx (task 002)
- settings.module.css, Settings.tsx (task 003)
- shell-settings.test.tsx (task 002/003)

**Entregáveis**:
- Componente StatusChip com props tone/label/icon
- CSS com fallback color-mix 85% + @supports
- 8 testes (render, tone, default icons, override, aria-hidden, color-not-only)
- Export em ui/index.ts

**Verify**:
```bash
npm run lint && npm run typecheck && npm run test
# Expected: 8 tests pass, no regressions
```

---

### 002: Shell Integration — StatusChip + Nav Ícone+Label
**Status**: ✅ Ready  
**Arquivo**: `.orquestrador/night-harbor-p2-statuschip-nav/tasks/002-shell-integration.md`  
**Pontos**: 8  
**Dependências**: 001 (StatusChip must exist)  

**Escopo de Arquivos (DISJUNTO)**:
- 📝 MODIFY: `src/renderer/src/shell/Shell.tsx` (~60 linhas alteradas: mappers + navIcons + render StatusChip + nav icon+label)
- 📝 MODIFY: `src/renderer/src/shell/shell.module.css` (~10 linhas: .destinationButton layout)
- 📝 MODIFY: `tests/renderer/shell-settings/shell-settings.test.tsx` (+~20 linhas testes opcionais)

**Nenhuma mudança em**:
- primitives.module.css, ui/StatusChip.tsx (task 001)
- concepts.module.css
- Settings.tsx, settings.module.css (task 003)

**Entregáveis**:
- Mappers inline: `mapSessionStatusToTone()`, `mapIssuePriorityToTone()`, `mapProjectStatusToTone()`
- NavIcons map (Compass/FolderOpen/Boat/Tray/GearSix → destinations)
- StatusChip render em sessions, issues, project (Overview)
- Nav layout flex com ícone + label Phosphor Regular
- Testes de integração (optional)

**Verify**:
```bash
npm run lint && npm run typecheck && npm run test
# Expected: Shell compiles, nav icons render, StatusChip in Overview, no regressions
```

---

### 003: Settings Integration — StatusChip em Agents e Integrations
**Status**: ✅ Ready  
**Arquivo**: `.orquestrador/night-harbor-p2-statuschip-nav/tasks/003-settings-integration.md`  
**Pontos**: 5  
**Dependências**: 001 (StatusChip exists), 002 (shell-settings.test.tsx shared)  

**Escopo de Arquivos (DISJUNTO)**:
- 📝 MODIFY: `src/renderer/src/settings/Settings.tsx` (~30 linhas alteradas: mappers + render StatusChip em AgentSettings e IntegrationSettings)
- 📝 MODIFY: `tests/renderer/shell-settings/shell-settings.test.tsx` (+~15 linhas testes opcionais)

**Nenhuma mudança em**:
- primitives.module.css, ui/StatusChip.tsx (task 001)
- Shell.tsx, shell.module.css (task 002)
- concepts.module.css
- settings.module.css (statusList já acomoda)

**Entregáveis**:
- Mappers inline: `mapAgentStatusToTone()`, `mapIntegrationStatusToTone()`
- StatusChip render em agents (Available → success)
- StatusChip render em integrations (Simulated → neutral, Not configured → warning)
- Testes de integração (optional)

**Verify**:
```bash
npm run lint && npm run typecheck && npm run test
# Expected: Settings compiles, StatusChip render, agents/integrations show colors, no regressions
```

---

## Matriz de Arquivos (Validação Disjunção)

| Arquivo | Task 001 | Task 002 | Task 003 | Status |
|---------|----------|----------|----------|--------|
| `src/renderer/src/ui/StatusChip.tsx` | ✨ NEW | — | — | ✅ DISJUNTO |
| `src/renderer/src/ui/primitives.module.css` | 📝 MODIFY | — | — | ✅ DISJUNTO |
| `src/renderer/src/ui/index.ts` | 📝 MODIFY | — | — | ✅ DISJUNTO |
| `tests/renderer/ui/status-chip.test.tsx` | ✨ NEW | — | — | ✅ DISJUNTO |
| `src/renderer/src/shell/Shell.tsx` | — | 📝 MODIFY | — | ✅ DISJUNTO |
| `src/renderer/src/shell/shell.module.css` | — | 📝 MODIFY | — | ✅ DISJUNTO |
| `src/renderer/src/settings/Settings.tsx` | — | — | 📝 MODIFY | ✅ DISJUNTO |
| `tests/renderer/shell-settings/shell-settings.test.tsx` | — | 📝 MODIFY | 📝 MODIFY | ⚠️ COMPARTILHADO (serial 002→003) |
| `src/renderer/src/concepts/concepts.module.css` | — | — | — | ✅ INTOCADO (boundary) |
| `src/renderer/src/settings/settings.module.css` | — | — | — | ✅ INTOCADO (statusList acomoda) |

**Validação**: 
- Tasks 001, 002, 003 têm escopo de arquivos **estritamente disjunto** (nenhum arquivo em 2 tasks)
- Exceção: `shell-settings.test.tsx` é compartilhado entre 002 e 003 → **serial lock** (003 depends_on 002)
- Boundary respeitada: concepts.module.css **não é tocado**

---

## Grafo de Dependências

```
001 (StatusChip)
 ├→ 002 (Shell — depends_on: 001)
      ├→ 003 (Settings — depends_on: 002)
```

**Serial Lock Explícito**:
- Task 002 **must complete before** task 003 (compartilham `shell-settings.test.tsx`)
- Task 001 é **prerequisite** para 002 e 003
- **Parallelização possível**: 001 ∥ (fila de 002→003)

---

## Checklist Controlador

### Validação de Especificação
- ✅ Todas as ACs (spec.md §8) mapeadas para tasks
- ✅ Mapeamentos status→tone (plan.md §2.2) cobertos (Shell e Settings)
- ✅ Ícones Phosphor Regular (ADR-0003) em nav (task 002)
- ✅ CSS color-mix 85% + fallback (ADR-0001, ADR-0002) em task 001
- ✅ Ratios WCAG auditados (6.08–8.48:1 tintado; 6.88–10.49:1 fallback) — re-auditar se hex mudar

### Validação de Risco
- ✅ R1 (`--surface-active` existe): Confirmado em concepts.module.css
- ✅ R2 (color-mix 85% contraste): Resolvido no gate HITL (tone text, ratios verificados)
- ✅ R3 (on-danger borderline): Out of scope (on-* não usados no chip)
- ✅ R4 (motion bypass): Sem motion nova em P2.1+P2.2 (covered by constitution.md L4)

### Validação de Codebase
- ✅ Padrões de componente (Button, SemanticIcon) replicados em StatusChip
- ✅ Padrões de teste (button.test.tsx, toast.test.tsx) replicados em status-chip.test.tsx
- ✅ CSS primitives.module.css, shell.module.css existentes; estrutura mantida
- ✅ Mock data (mock-catalog.ts) alinhada com mappers
- ✅ Imports (@phosphor-icons/react, @testing-library/react) já presentes no projeto

### Validação de Arquitetura
- ✅ StatusChip é component puro, sem estado
- ✅ Mappers são funções simples switch, sem side effects
- ✅ NavIcons é Record tipado, sem mutação
- ✅ SemanticIcon reutilizado (não duplicado)
- ✅ Sem mudança em conceitos legados (boundary respeitada)

---

## Próximas Fases

1. **Implementação** (implement agent) — realizar tasks 001 → 002 → 003
2. **Review** (review agent) — code review + WCAG contrast re-audit se hex mudar
3. **Verify** (verify agent) — npm run lint/typecheck/test + visual test
4. **PR** (create pull request) — merge para feat/scaffold-inicial

---

## Artefatos Produzidos

```
.orquestrador/night-harbor-p2-statuschip-nav/
├── tasks/
│   ├── 001-statuschip-component.md ✅
│   ├── 002-shell-integration.md ✅
│   └── 003-settings-integration.md ✅
└── TASKS_REPORT.md ✅
```

---

## Notas para Controller/Implementor

- **Ordem de implementação**: 001 → 002 → 003 (dependências respeitadas)
- **Parallelização**: Após 001 completar, 002 e 003 podem começar, mas 003 espera 002 por testes
- **Re-auditoria**: Antes de merge, se qualquer hex mudar em StatusChip/Shell/Settings, re-executar WCAG audit (constitution.md boundary)
- **Testes**: Tasks incluem testes mínimos; opcional adicionar snapshot tests ou E2E
- **Git**: Commits sugeridos: um por task (`feat(ui): add StatusChip component`, `feat(shell): integrate StatusChip in overview and nav`, `feat(settings): integrate StatusChip in agents/integrations`)

---

## Status Final

**Produção de Tasks**: ✅ COMPLETO  
**Validação de Escopo**: ✅ COMPLETO (arquivos disjuntos, boundary respeitada)  
**Pronto para Implementação**: ✅ SIM  

**Próximo passo**: Executar sdd-implement com tasks 001 → 002 → 003.
