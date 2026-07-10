# Decisões — night-harbor-p2-statuschip-nav

**Registry de decisões de design e arquitetura aprovadas.**

## Decisões Aprovadas (spec HITL 2026-07-09)

### D-001: Mapeamento Status → Tone (Shell + Settings)

**Data**: 2026-07-09 (grill G2, confirmado no gate)
**Status**: APROVADO
**Descrição**: Semanticidade porto aplicada a SessionChip, IssueChip, ProjectChip, AgentChip, IntegrationChip.

**Mapeamento**:
| Domínio | Status | Tone | Token |
|---------|--------|------|-------|
| Sessions | Running | success | --success:#5ad8a6 |
| Sessions | Ready | warning | --warning:#ffd166 |
| Sessions | Complete | neutral | --border:#41597a |
| Issues | High | danger | --danger:#ff8d9d |
| Issues | Medium | warning | --warning:#ffd166 |
| Issues | Low | neutral | --border:#41597a |
| Project | Active | success | --success:#5ad8a6 |
| Agents | Available | success | --success:#5ad8a6 |
| Integrations | Simulated | neutral | --border:#41597a |
| Integrations | Not configured | warning | --warning:#ffd166 |

**Referência**: spec.md §4, state.md G2

---

### D-002: Componente StatusChip (Novo)

**Data**: 2026-07-09
**Status**: APROVADO
**Descrição**: Component funcional composto (dot + ícone Phosphor + label + fundo tintado color-mix).

**Props**:
- `status`: string enum
- `label`: string
- `tone`: 'success' | 'warning' | 'danger' | 'neutral'
- `icon`?: React.ComponentType (Phosphor icon, optional)

**Render**: `<dot> <icon> <label>` com fundo `color-mix(in srgb, var(--tone-token), transparent 85%)` + fallback sólido pré-@supports.

**Acessibilidade**:
- Color-not-only: dot (cor) + ícone (forma) + label (texto)
- WCAG 2.1 AA contraste ≥4.5:1 obrigatório (AC-10)
- Ícone em StatusChip: aria-hidden="true" (comunicado via label)

**Referência**: spec.md §2, §3.1, §5, §6

---

### D-003: Nav Ícone+Label (Pill Ativa)

**Data**: 2026-07-09 (grill G3)
**Status**: APROVADO
**Descrição**: Nav lateral com ícones Phosphor Regular + labels sempre visíveis, pill ativa em alto contraste.

**Ícones**:
- Compass (Overview)
- FolderOpen (Projects)
- Boat (Sessions) — metáfora porto (grill G3)
- Tray (Issues)
- GearSix (Settings)

**Pill Ativa**:
- `background: var(--surface-active)`
- `border-color: var(--accent)`
- `aria-current="page"` no elemento ativo
- Focus ring padrão (existente, 3px, offset 3px)

**Referência**: spec.md §3.1 (3.1b), state.md G3

---

### D-004: Zero Mudança em Legacy Concepts

**Data**: 2026-07-09 (grill G4)
**Status**: APROVADO
**Descrição**: Fallback neutro + consumo var() — StatusChip não edita command-deck, signal-poster.

**Implications**:
- concepts.module.css: zero mudança
- command-deck, signal-poster CSS: zero mudança
- StatusChip consome tokens via `var()` + fallback sólido
- Compatibilidade regressiva garantida

**Referência**: spec.md §3.1, state.md G4

---

### D-005: Técnica Fundo Tintado (color-mix + Fallback)

**Data**: 2026-07-09
**Status**: APROVADO
**Origem**: atlas recall navbar-contrast-color-mix-over-ambient (prod validado)
**Descrição**: Superfícies tintadas usando color-mix com fallback sólido.

**Implementação**:
```css
.statusChip {
  background: <fallback-sólido>;  /* rgba ou cor alterada, pré-@supports */
  @supports (color: color-mix(in srgb, black, transparent)) {
    background: color-mix(in srgb, var(--chipToken), transparent 85%);
  }
}
```

**Notas**:
- Fallback transparência: AC-6 (Legacy browser deg

radation)
- Contraste exato: AC-10 (auditoria WCAG obrigatória)
- Opacidade 85% sugestão (R2: pode ajustar para 80% se contraste degradar)

**Referência**: spec.md §5.2

---

### D-006: Tokens Existentes (Sem Novo)

**Data**: 2026-07-09
**Status**: APROVADO
**Descrição**: StatusChip consome tokens já definidos em concepts.module.css ~135–174 (night-harbor block).

**Tokens**:
- `--success: #5ad8a6` + `--on-success: #07111f`
- `--warning: #ffd166` + `--on-warning: #0e1b2f`
- `--danger: #ff8d9d` + `--on-danger: #21040a`
- `--border: #41597a` (neutral fallback)

**Novo token em consideração** (risco R1):
- `--surface-active` para pill ativa nav (precisa verificação em plan)

**Referência**: spec.md §5.1

---

## Decisões Aguardando Confirmação

Nenhuma. Todos os pontos abertos em spec §7 foram confirmados no gate HITL 2026-07-09.

---

## Rastreabilidade

- **Aprovação**: spec.md status header (HITL 2026-07-09)
- **Confirmações gate**: mapeamento Settings (Available→success, Simulated→neutral, Not configured→warning)
- **Grill-me decisões**: G1–G4 em state.md
- **Boundary verificação**: constitution.md test_expectations + boundaries

**Próxima atualização**: após sdd-plan (ADRs técnicos, riscos resolvidos R1–R4).
