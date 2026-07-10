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

## Decisões Aprovadas (plan HITL 2026-07-09 — rev. 2 pós-correção)

### D-007: Fundo Tintado — Color-mix 85% + Texto Cor do Token

**Data**: 2026-07-09 (plan gate, decisão do usuário)
**Status**: APROVADO (vinculante)
**Origem**: ADR-0001 (fundo tintado color-mix 85% com texto na cor do token e fallback surface-raised)

**Esquema final**:
- Fundo: `color-mix(in srgb, var(--tone), transparent 85%)` (85% conforme spec)
- Texto/ícone/dot: **cor do token** (`--success`/`--warning`/`--danger`); neutral → `--ink-muted`
- Fallback sem color-mix: background **sólido** `var(--surface-raised)` (#152642) — NUNCA color-mix no fallback
- Tokens `--on-*` **não aparecem no chip** (reservados a fills sólidos futuros — pair `--on-success` sobre `--success` sólido = 10.65:1 ✓)

**Ratios WCAG (controller, linearização sRGB exato)**:
- Tintado 85%: success 7.10:1, warning 8.48:1, danger 6.08:1, neutral 7.97:1 — todos AA ✓
- Fallback sólido: success 8.51:1, warning 10.49:1, danger 6.88:1, neutral 7.74:1 — todos AA ✓

**Motivo da mudança (rev. 1 → rev. 2)**: Auditoria numérica exata do controller (WCAG 2.1, luminância relativa com linearização sRGB expoente 2.4) confirmou que esquema original (on-* sobre tintado) falhava em qualquer transparência (1.50:1 @85%, 1.71:1 @80%). Incompatibilidade estrutural: on-* são escuros, fundo tintado é escuro (mistura com `--surface` #0e1b2f, L ≈ 0.011). Texto escuro sobre fundo escuro falha. Resolução: trocar texto para cor do token (clara).

**Referência**: plan.md §2.5, §2.7; ADR-0001; contrast-audit.md rev. 2

---

### D-008: StatusChip API — Props Tone/Label/Icon (opcional)

**Data**: 2026-07-09 (plan gate)
**Status**: APROVADO (vinculante)
**Origem**: ADR-0002 (StatusChip API e estrutura de componente)

**Props**:
- `tone`: 'success' | 'warning' | 'danger' | 'neutral' (enum semântico)
- `label`: string (comunicação primária, acessível)
- `icon`?: React.ComponentType (optional, override; default por tone garante color-not-only)

**Render**: `<span className={statusChip statusChip_${tone}}><span statusDot /><Icon statusIcon /><span statusLabel>{label}</span></span>`
**Acessibilidade**: dot + icon = aria-hidden="true" (decorativos), label = texto (comunica tudo)
**CSS**: Ver D-007 (esquema de cor); sem transitions próprias (componente informativo)

**Referência**: plan.md §2.1; ADR-0002

---

### D-009: Ícones Phosphor Regular — StatusChip + Nav

**Data**: 2026-07-09 (plan gate, confirmado por ADR-0004)
**Status**: APROVADO (vinculante)
**Origem**: ADR-0003 (Nav ícone+label Phosphor Regular); ADR-0002 (defaultIconsByTone)

**StatusChip defaults**:
- success → CheckCircle
- warning → Clock
- danger → Warning
- neutral → Minus

**Nav lateral**: Compass (overview), FolderOpen (projects), Boat (sessions — metáfora porto, gate G3), Tray (issues), GearSix (settings)

**Peso**: Regular, explícito em `weight="regular"` (ADR-0004 define Phosphor Regular como set único Night Harbor; não duplicar Iconoir)

**Bundle**: Tree-shake minimiza (~5 ícones + 5 nav); acceptable.

**Referência**: plan.md §2.3, §2.6; ADR-0003

---

### D-010: Mapeamento Status→Tone — Inline Shell/Settings

**Data**: 2026-07-09 (plan gate, decisão do usuário no gate)
**Status**: APROVADO (vinculante)
**Origem**: plan.md §2.2; spec.md §4

**Mapeamento aprovado**:
- Sessions: Running→success, Ready→warning, Complete→neutral
- Issues: High→danger, Medium→warning, Low→neutral
- Project: Active→success
- Agents: Available→success, else→neutral
- Integrations: Not configured→warning, Simulated→neutral, else→neutral

**Implementação**: Mapper funções inline em Shell.tsx e Settings.tsx (transparência semântica: mapeamento vive onde é usado)
**Refatoração**: Só se terceiro consumidor surgir (não antecipe; YAGNI)

**Referência**: plan.md §2.2; D-001 anterior (mapeamento já aprovado em spec)

---

### D-011: Fallback Legados — Cadeia Var() + Surface-raised

**Data**: 2026-07-09 (plan gate, grill G4)
**Status**: APROVADO (vinculante)
**Origem**: plan.md §2.10; spec.md §3.1

**Portabilidade**:
- StatusChip renderizado sob command-deck/signal-poster (que não definem `--success`/`--warning`) degrada para comportamento neutro legível via cadeia var()
- Texto: `var(--success, var(--ink-muted))` → sob legado resolve para `--ink-muted`
- Tone (borda/mix): `var(--success, var(--border))` → sob legado resolve para `--border`
- Fundo fallback: `var(--surface-raised)` → existe nos 3 conceitos

**Consequence**: Zero edição em blocos legados de concepts.module.css (command-deck, signal-poster, on-* definitions intocados)

**Referência**: plan.md §2.10; ADR-0001

---

## Decisões Aguardando Confirmação

Nenhuma. Todos os pontos abertos em spec §7 foram resolvidos no gate HITL 2026-07-09. Plan rev. 2 (pós-gate) consolidou decisões D-007 a D-011 e fechou riscos R1–R4.

---

## Rastreabilidade

- **Aprovação spec**: spec.md status header (HITL 2026-07-09)
- **Aprovação plan**: plan.md rev. 2 (HITL 2026-07-09 pós-auditoria numérica do controller)
- **Confirmações gate**: 6 decisões vinculantes (state.md) — decisões de cor (D-007), ícones (D-009), mapeamento (D-010), fallback legados (D-011) consolidadas em ADRs
- **ADRs técnicos**: 0001 (contraste/fallback), 0002 (API/CSS), 0003 (nav ícone+label)
- **Boundary verificação**: constitution.md test_expectations (auditoria numérico de contraste obrigatória — cumprida no gate)

**Próxima atualização**: sdd-tasks (task breakdown); sdd-implement (verificação CSS/render); sdd-verify (tests passam, lint OK)
