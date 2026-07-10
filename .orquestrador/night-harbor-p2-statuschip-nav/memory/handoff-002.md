# Handoff: plan → tasks

**Data**: 2026-07-09 (pós-gate HITL do plan, rev. 2 corrigida)
**Orquestrador**: sdd-plan → sdd-tasks
**Artefatos**: plan.md rev. 2, ADR-0001/0002/0003 (accepted), contrast-audit.md rev. 2

---

## Decisões tomadas

- **Fundo tintado**: `color-mix(in srgb, var(--tone), transparent 85%)` + fallback sólido `var(--surface-raised)` (#152642) — NUNCA color-mix no fallback
- **Texto/ícone/dot**: cor do token (`--success`/`--warning`/`--danger`), nunca `--on-*`; neutral usa `--ink-muted` (#aabbd1)
- **Ícones StatusChip**: CheckCircle/Clock/Warning/Minus (Phosphor Regular, por tone default)
- **Ícones Nav**: Compass/FolderOpen/Boat/Tray/GearSix (Phosphor Regular, mapa destino→ícone)
- **Mapeamento status→tone**: inline em Shell.tsx e Settings.tsx; refatorar para utilitário só se terceiro consumidor surgir
- **Icon prop opcional**: default por tone garante color-not-only; permite override por domínio
- **Dot renderização**: `background: currentColor` (herda cor do token via --chipText)
- **Pill ativa**: `--surface-active` (#19385a, existe) + `--accent` (#63a9ff, borda); ink 11.15:1 ✓, accent borda 4.93:1 ✓
- **Cadeia var() legados**: `var(--success, var(--ink-muted))` (texto), `var(--success, var(--border))` (tone), `var(--surface-raised)` (bg) — degrada gracefully em conceitos legados

---

## Alternativas descartadas

- **Texto `--on-*` sobre fundo tintado color-mix**: falhado auditoria numérica (1.50:1 @85%, 1.71:1 @80% — ambos lados reprovam; incompatibilidade estrutural texto escuro sobre fundo escuro)
- **Fallback com color-mix**: bug da rev. 1 — renderizava color-mix em `@supports` negado, tornando fallback inútil em navegadores sem suporte
- **Mapeamento centralizado em utilitário**: descartado no gate; semântica vive onde é usada; refatorar só com reutilização prova
- **Icon obrigatório em StatusChip**: desnecessário; default por tone + override preserva color-not-only sem inflexibilidade
- **Neutral com `--border` como texto**: falhado (2.18:1); substituído por `--ink-muted`

---

## Suposições validadas

- **`--surface-active` existe**: confirmado em concepts.module.css, bloco night-harbor (#19385a) — risco R1 fechado
- **Color-mix suportado em navegadores modernos**: @supports (color: color-mix(...)) garante fallback para compatibilidade regressiva
- **Phosphor Regular é set único Night Harbor**: confirmado por ADR-0004 (tela-de-configuracoes-onboarding-e-ui-alem-do), não duplicar Iconoir
- **On-token semantics**: `--on-*` = texto sobre fill SÓLIDO do token (ex: `--on-success` sobre `--success` puro = 10.65:1 ✓); não aplica a fundos tintados
- **Conceitos legados não regridem**: cadeia var() com fallback resolve tokens inexistentes para neutro legível sem editar blocos legados

---

## Suposições invalidadas

Nenhuma. Todas as hipóteses do plan foram confirmadas no gate HITL.

---

## Descobertas inesperadas

- **Plan rev. 1 continha erros matemáticos graves**: luminâncias computadas sem linearização sRGB correta (L(#0e1b2f) estimado ~0.095/0.15, valor exato ≈ 0.011); Descoberta 8 inverteu fórmula contraste (cor clara no denominador, reportou 0.189:1 quando é na verdade 11.75:1 para `--ink` sobre tintado success)
- **Auditoria numérica do controller pegou e corrigiu**: rev. 2 incorporou ratios exatos (WCAG 2.1, linearização sRGB expoente 2.4) — todos os pares tintados passam AA (6.08–8.48:1), fallback também (6.88–10.49:1)
- **On-* sobre fundo tintado falha em qualquer transparência**: não é questão de ajustar 80% vs 85%; a incompatibilidade é estrutural (mistura do tone com `--surface` #0e1b2f escuro resulta fundo escuro; texto on-* também escuro → contraste <4.5:1 inevitável)
- **Plan-agent falhou 1× por session limit durante correção**: retry único (protocolo contract.md) completou; pipeline resiliente

---

## Raciocínio comprimido (dead ends)

- **Fallback color-mix (rev. 1)**: renderizava color-mix no @supports negado, quebrando navegadores sem suporte — corrigido para fallback sólido `--surface-raised`
- **Texto `--on-*` + transparência 80%**: tentativa de "ajustar" trade-off A original; auditoria numérica confirmou que ambos os lados (80% e 85%) reprovam com on-* (1.71:1 vs 1.50:1) — resolução foi mudar texto para cor do token
- **On-token em fundo tintado**: esperativa teórica de que tokens on-* fossem portáveis a qualquer contexto; auditoria revelou que são semântica de fill sólido, não fundo tintado

---

## Contexto que a próxima fase PRECISA

### Arquivos a tocar
1. `src/renderer/src/ui/StatusChip.tsx` (novo) — ~55 linhas
2. `src/renderer/src/ui/primitives.module.css` (atualizar) — .statusChip, .statusDot, .statusIcon, .statusLabel (~70 linhas)
3. `src/renderer/src/ui/index.ts` (atualizar) — export StatusChip
4. `src/renderer/src/shell/Shell.tsx` (atualizar) — mappers, navIcons, render StatusChip + nav ícone+label (~60 linhas)
5. `src/renderer/src/shell/shell.module.css` (atualizar) — .destinationButton gap/flex layout (~5 linhas)
6. `src/renderer/src/settings/Settings.tsx` (atualizar) — mappers, render StatusChip em AgentSettings/IntegrationSettings (~30 linhas)
7. `tests/renderer/ui/status-chip.test.tsx` (novo) — render/tone/a11y/default-icon/override (~130 linhas)
8. Conceitos legados: ZERO mudança (concepts.module.css blocos command-deck/signal-poster intocados)

### CSS Final do StatusChip (plan §2.5)
```css
.statusChip {
  align-items: center;
  background: var(--surface-raised);  /* Fallback sólido */
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

.statusChip_success { --chipTone: var(--success, var(--border)); --chipText: var(--success, var(--ink-muted)); }
.statusChip_warning { --chipTone: var(--warning, var(--border)); --chipText: var(--warning, var(--ink-muted)); }
.statusChip_danger { --chipTone: var(--danger, var(--border)); --chipText: var(--danger, var(--ink-muted)); }
.statusChip_neutral { --chipTone: var(--border); --chipText: var(--ink-muted); }

.statusDot { background: currentColor; block-size: 0.5rem; border-radius: 50%; flex: none; inline-size: 0.5rem; }
.statusIcon { block-size: 1em; flex: none; inline-size: 1em; }
.statusLabel { white-space: nowrap; }
```

### Mapeamentos Inline (plan §2.2)
**Shell.tsx**:
- `mapSessionStatusToTone()`: Running→success, Ready→warning, Complete→neutral
- `mapIssuePriorityToTone()`: High→danger, Medium→warning, Low→neutral
- `mapProjectStatusToTone()`: Active→success (implicit)

**Settings.tsx**:
- `mapAgentStatusToTone()`: Available→success, else→neutral
- `mapIntegrationStatusToTone()`: Not configured→warning, Simulated→neutral, else→neutral

### Ícones Confirmados
- **StatusChip**: CheckCircle (success), Clock (warning), Warning (danger), Minus (neutral)
- **Nav**: Compass (overview), FolderOpen (projects), Boat (sessions), Tray (issues), GearSix (settings)
- Todos Phosphor Regular (`weight="regular"`)

### Ratios WCAG Finais (Autoridade: contrast-audit.md rev. 2)
**Tintado (color-mix 85% sobre `--surface` #0e1b2f)**:
| Tone | Ratio | AA |
|------|-------|-----|
| success | 7.10:1 | ✓ |
| warning | 8.48:1 | ✓ |
| danger | 6.08:1 | ✓ |
| neutral | 7.97:1 | ✓ |

**Fallback sólido (`--surface-raised` #152642)**:
| Tone | Ratio | AA |
|------|-------|-----|
| success | 8.51:1 | ✓ |
| warning | 10.49:1 | ✓ |
| danger | 6.88:1 | ✓ |
| neutral | 7.74:1 | ✓ |

**Pill ativa nav**:
- `--ink` (#f3f7ff) sobre `--surface-active` (#19385a): 11.15:1 ✓
- Borda `--accent` (#63a9ff): 4.93:1 ✓

### Critérios de Aceitação (spec §8)
- AC-1 a AC-5: StatusChip render + mappers (testing-library)
- AC-6: Fallback sólido (verificação CSS + teste render)
- AC-7: Nav ícone+label + aria-current (render)
- AC-8: Focus ring (padrão `.button:focus-visible` existente)
- AC-9: Icon labeling (aria-hidden decorativo)
- AC-10: WCAG audit **CONCLUÍDA no gate** (ratios acima); re-auditar apenas se hex mudar

### Verificação Obrigatória (constitution.md boundary)
- **Auditoria de contraste numérica**: JÁ REALIZADA no gate (ratios acima são definitivos)
- **Se algum hex mudar em implement**: re-executar auditoria antes de merge
- **Verificar git lint/typecheck/test**: não detectam violações de contraste (L2); gate é cego a cores

---

## Riscos transferidos

**Nenhum aberto.** Todos os riscos do handoff-001.md foram fechados/mitigados:

| Risco | Status | Nota |
|-------|--------|------|
| R1: `--surface-active` inexistente | ✓ Fechado | Token confirmado (#19385a) |
| R2: color-mix 85% degrada <4.5:1 | ✓ Fechado | Esquema corrigido: texto/dot/ícone na cor do token (não on-*) |
| R3: `--on-danger` borderline | ✓ Fechado | Par não é usado no chip; on-* reservados a fills sólidos |
| R4: Motion bypass reduced-motion | ✓ Mitigado | Nenhuma motion nova em P2.1+P2.2; futuro cobre constitution.md L4 |

**Dependências externas**:
- @phosphor-icons/react: 5 ícones StatusChip + 5 ícones nav (tree-shake minimiza bundle)
- concepts.module.css: tokens já existem; zero mudança necessária

---

## Rastreabilidade

- **Fontes**: plan.md (rev. 2), ADR-0001/0002/0003, contrast-audit.md (rev. 2), memory/state.md
- **Gate decisions**: state.md Decisões do gate do plan (6 pontos vinculantes)
- **Learning crítico**: L2 (verify gate blind to contrast) + L5 (color-mix contraste cego) — não confiar em lint/test; auditoria obrigatória
- **Próxima fase**: sdd-tasks (task breakdown + implementação)
