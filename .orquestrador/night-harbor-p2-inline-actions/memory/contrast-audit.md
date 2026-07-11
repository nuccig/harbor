# Contrast Audit — Night Harbor P2.4 Inline Session Actions

**Data**: 2026-07-10 (rev. 1 — computed by script at plan time, before implementation)
**Fase**: plan (sdd-plan)
**Riscos endereçados**: R2, R3 (handoff-001.md), AC-017; constitution `boundaries.always`
**Método**: WCAG 2.1 exact relative luminance (piecewise sRGB linearization, exponent 2.4),
computed by a standalone Node script (no browser, no estimation) — reproduced below in full so
the numbers are re-derivable. Learning `contrast-math-by-script` applied from the first
revision (no arithmetic-by-LLM pass preceded this). Effective colors composed by standard
alpha "over" compositing in gamma-encoded sRGB before measuring (learning
`visual-contrast-against-canvas`): the chip tint is `blend(tone, surface, 0.15)`
(equivalent to `color-mix(in srgb, tone, transparent 85%)` painted over opaque `--surface`),
and the disabled state is the whole button composited at `opacity: 0.46` over `--surface`.

---

## Script (verbatim, run via `node`)

```js
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const bytes = [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((c) => parseInt(c, 16))
  return { r: bytes[0], g: bytes[1], b: bytes[2] }
}
function channelToLinear(c) {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}
function relLuminance({ r, g, b }) {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
}
function contrast(hexA, hexB) {
  const La = relLuminance(hexToRgb(hexA))
  const Lb = relLuminance(hexToRgb(hexB))
  const lighter = Math.max(La, Lb)
  const darker = Math.min(La, Lb)
  return (lighter + 0.05) / (darker + 0.05)
}
// Standard alpha "over" compositing in sRGB (gamma-encoded) space — matches how browsers
// composite color-mix-towards-transparent and CSS opacity against an opaque background.
function blend(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex), bg = hexToRgb(bgHex)
  const mix = (a, b) => Math.round(alpha * a + (1 - alpha) * b)
  const r = mix(fg.r, bg.r), g = mix(fg.g, bg.g), b = mix(fg.b, bg.b)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
```

Pair harness (the full runnable file lives at the plan-agent scratchpad,
`contrast-audit-p24.mjs`; every measured input/output is reproduced in the tables below —
tokens, composites, luminances L1/L2 and ratios — so the run is re-derivable from this
document alone).

## Descoberta 0: Token values used (read directly from `concepts.module.css`)

```
night-harbor:   canvas=#07111f surface=#0e1b2f surface-raised=#152642 surface-active=#19385a
                ink=#f3f7ff ink-muted=#aabbd1 border=#41597a focus-ring=#ffd166 warning=#ffd166
command-deck:   canvas=#f2f4f7 surface=#ffffff surface-raised=#f8fafc surface-active=#dceee9
                ink=#111827 ink-muted=#4b5563 border=#9aa5b1 focus-ring=#005fcc warning=(não definido)
signal-poster:  canvas=#d9ccff surface=#f6f1ff surface-raised=#efe7ff surface-active=#c6b5ff
                ink=#111111 ink-muted=#3b3347 border=#111111 focus-ring=#111111 warning=(não definido)
```

`--warning` só existe no night-harbor — nos conceitos legados a cadeia `var()` do StatusChip
degrada para `--border` (tone) / `--ink-muted` (texto), medidos como pares A3/A4.

## Descoberta 1: Fundos efetivos desta feature são todos opacos após 1 composição

- **Chip Paused**: fundo tintado = `color-mix(warning, transparent 85%)` sobre `--surface`
  (o chip vive dentro do painel `.group`/`.destinationPanel`, ambos `background: var(--surface)`
  opaco) → composto exato antes de medir.
- **Icon buttons (variant `quiet`)**: fundo transparente → o fundo efetivo do glifo em repouso
  é o próprio `--surface` do painel. Pressed troca para `--surface-active` (opaco). Nenhuma
  camada adicional.
- **Painel de log**: `background: var(--canvas)` — token sólido nos 3 concepts; nada a compor.

## Descoberta 2: Chip Paused (rota de reuso do tone `warning` — ADR-0002 desta run)

Paused reusa o par de cor do tone `warning` (hex idênticos aos auditados em ADR-0014 global);
re-medição integral por script nesta run para satisfazer a letra do AC-017:

| # | Concept | fg | bg efetivo | L1 | L2 | Ratio | Floor | Pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | night-harbor | warning #ffd166 | tint 15% s/ surface = #323637 | 0.678202 | 0.035923 | **8.48:1** | 4.5 (texto) | ✓ |
| A2 | night-harbor | warning #ffd166 | fallback sólido #152642 | 0.678202 | 0.019390 | **10.49:1** | 4.5 | ✓ |
| A3 | command-deck | ink-muted #4b5563 | tint(border) = #f0f2f3 | 0.885006 | 0.088937 | **6.73:1** | 4.5 | ✓ |
| A3 | signal-poster | ink-muted #3b3347 | tint(border) = #d4cfdb | 0.637372 | 0.037524 | **7.85:1** | 4.5 | ✓ |
| A4 | command-deck | ink-muted #4b5563 | surface-raised #f8fafc | 0.953559 | 0.088937 | **7.22:1** | 4.5 | ✓ |
| A4 | signal-poster | ink-muted #3b3347 | surface-raised #efe7ff | 0.827226 | 0.037524 | **10.02:1** | 4.5 | ✓ |

O ícone do chip (Phosphor `Pause`, `currentColor`) compartilha o par A1/A2 — floor non-text
3:1 coberto com folga pelo floor de texto já atendido. Valores idênticos aos de ADR-0014
(warning 8.48/10.49) — confirma que o reuso não altera nenhum hex.

## Descoberta 3: Icon buttons (IconButton variant `quiet`) — estados

Glifo Phosphor = elemento non-text, floor 3:1 (WCAG 1.4.11), medido contra o fundo efetivo:

| # | Estado | Concept | fg | bg efetivo | L1 | L2 | Ratio | Floor | Pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | repouso | night-harbor | ink #f3f7ff | surface #0e1b2f | 0.927962 | 0.010825 | **16.08:1** | 3 | ✓ |
| B1 | repouso | command-deck | ink #111827 | surface #ffffff | 1.000000 | 0.009189 | **17.74:1** | 3 | ✓ |
| B1 | repouso | signal-poster | ink #111111 | surface #f6f1ff | 0.897234 | 0.005605 | **17.03:1** | 3 | ✓ |
| C1 | pressed | night-harbor | ink #f3f7ff | surface-active #19385a | 0.927962 | 0.037732 | **11.15:1** | 3 | ✓ |
| C1 | pressed | command-deck | ink #111827 | surface-active #dceee9 | 0.822479 | 0.009189 | **14.74:1** | 3 | ✓ |
| C1 | pressed | signal-poster | ink #111111 | surface-active #c6b5ff | 0.522735 | 0.005605 | **10.30:1** | 3 | ✓ |
| E1 | focus ring | night-harbor | focus-ring #ffd166 | surface #0e1b2f | 0.678202 | 0.010825 | **11.97:1** | 3 | ✓ |
| E1 | focus ring | command-deck | focus-ring #005fcc | surface #ffffff | 1.000000 | 0.125441 | **5.98:1** | 3 | ✓ |
| E1 | focus ring | signal-poster | focus-ring #111111 | surface #f6f1ff | 0.897234 | 0.005605 | **17.03:1** | 3 | ✓ |

- **Hover**: NENHUM par novo — decisão ADR-0003 desta run: os icon buttons herdam o padrão
  do `.button` do app, que não define `:hover` para nenhuma variante. Sem mudança de cor no
  hover ⇒ nada a medir (o par de hover ≡ par de repouso B1). Registrado aqui para fechar a
  exigência literal da Constraints ("repouso/hover/pressed/disabled/focus").
- **Disabled** (informativo): nenhum estado disabled é usado em P2.4 (a matriz status→ações
  remove o botão em vez de desabilitá-lo) e WCAG 1.4.3/1.4.11 isentam controles inativos.
  Medido mesmo assim: composto `blend(ink, surface, 0.46)` sobre `--surface` →
  night-harbor #77808f = 4.33:1 ✓ · command-deck #92959c = 3.00:1 (limiar exato) ·
  signal-poster #8d8a92 = 3.06:1 ✓. Não bloqueia (estado não embarcado + isenção), mas fica
  registrado que command-deck está no limiar caso um futuro run introduza disabled real.

## Descoberta 4: Painel de log — texto sobre `--canvas` (floor texto 4.5:1)

O painel usa `background: var(--canvas)` (recesso "terminal" dentro do card): linha de log em
`--ink`, timestamp em `--ink-muted` (ambos `--type-small` → floor 4.5:1, nunca o floor de
large text):

| # | Par | Concept | fg | bg | L1 | L2 | Ratio | Pass |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | texto da linha | night-harbor | ink #f3f7ff | canvas #07111f | 0.927962 | 0.005450 | **17.64:1** | ✓ |
| F1 | texto da linha | command-deck | ink #111827 | canvas #f2f4f7 | 0.902940 | 0.009189 | **16.10:1** | ✓ |
| F1 | texto da linha | signal-poster | ink #111111 | canvas #d9ccff | 0.651574 | 0.005605 | **12.62:1** | ✓ |
| F2 | timestamp | night-harbor | ink-muted #aabbd1 | canvas #07111f | 0.486901 | 0.005450 | **9.68:1** | ✓ |
| F2 | timestamp | command-deck | ink-muted #4b5563 | canvas #f2f4f7 | 0.902940 | 0.088937 | **6.86:1** | ✓ |
| F2 | timestamp | signal-poster | ink-muted #3b3347 | canvas #d9ccff | 0.651574 | 0.037524 | **8.02:1** | ✓ |

## Descoberta 5: Pares informativos (sem floor WCAG aplicável) — para o registro

| # | Par | night-harbor | command-deck | signal-poster |
| --- | --- | --- | --- | --- |
| G1 | borda do painel de log (`--border` vs `--canvas`) | 2.65:1 | 2.27:1 | 12.62:1 |
| G2 | fundo do painel vs surface ao redor | 1.10:1 | 1.10:1 | 1.35:1 |
| G3 | comparação: borda pré-existente app-wide (`--border` vs `--surface`) | 2.41:1 | 2.50:1 | 17.03:1 |

G1 é a borda decorativa de um bloco de TEXTO não-interativo — não é par exigido por WCAG
1.4.11 (o floor 3:1 vale para componentes de UI e gráficos necessários à compreensão; a
identificação do painel vem do conteúdo, da posição sob o controle `aria-expanded` e do
recesso). G3 mostra que TODO painel existente do app (`.group`, `.statePanel`, `.sidebar`)
já desenha `--border` sobre `--surface` em 2.41–2.50:1 nos mesmos dois concepts — o painel de
log não introduz tratamento pior que o padrão vigente, e não altera nenhum hex.

---

## Status dos Riscos — Sumário

| # | Risco | Status | Resolução |
| --- | --- | --- | --- |
| R2 | Paused reusando tone `warning` conta como "par novo" perante AC-017? | ✓ **FECHADO** | Rota de reuso adotada (ADR-0002) E o par re-medido integralmente por script nesta run (A1–A4): 6.73–10.49:1, todos ≥4.5:1. A letra do AC-017 é satisfeita por medição, não por dispensa |
| R3 | `:hover` inexistente no `.button` — introduzir cria par novo | ✓ **FECHADO** | Sem hover distinto (ADR-0003): nenhuma mudança de cor ⇒ nenhum par novo; hover ≡ repouso (B1, 16.08–17.74:1). Pressed/focus (pares pré-existentes reusados) medidos: 5.98–17.03:1 |
| — | Texto do log sobre fundo efetivo do painel | ✓ **FECHADO** | `--canvas` opaco como fundo; texto 12.62–17.64:1, timestamp 6.86–9.68:1 — todos ≥4.5:1 |

## Decisão Final (referenciada por ADR-0002/0003/0004 desta run)

1. Chip Paused: tone `warning` reusado + ícone `Pause` — hex idênticos aos auditados; pares
   re-medidos: 8.48:1 (tint) / 10.49:1 (fallback) no night-harbor; 6.73–10.02:1 nos legados
   via cadeia var() existente. Nenhum token novo, nenhum hex novo.
2. Icon buttons: `IconButton` variant `quiet`; estados existentes do `.button` reusados sem
   alteração (repouso 16.08–17.74:1; pressed 10.30–14.74:1; focus 5.98–17.03:1; sem hover
   distinto; sem disabled embarcado). Nenhum par de cor novo criado.
3. Painel de log: `background: var(--canvas)`, texto `--ink` (12.62–17.64:1), timestamp
   `--ink-muted` (6.86–9.68:1), borda `--border` (informativa, consistente com o padrão
   vigente do app).

**Auditoria CONCLUÍDA** para o plan gate: **33 pares medidos, 0 falhas em pares exigidos.**
Re-auditar por script apenas se algum hex de token mudar em qualquer concept, se o painel de
log trocar de fundo, ou se um estado `:hover`/`:disabled` com cor própria for introduzido.

## Próximas Etapas

- [x] Auditoria numérica exata (plan-agent, antes do gate HITL) — concluída
- [ ] sdd-tasks: tasks consomem os tokens acima como estão (nenhum hex novo, nenhuma
      opacidade nova além da 0.46 pré-existente do `.button:disabled`, não usada em P2.4)
- [ ] sdd-review: revisor confere que o CSS implementado usa exatamente `var(--canvas)` no
      fundo do painel de log, `var(--ink)`/`var(--ink-muted)` nos textos, variant `quiet` nos
      icon buttons sem regra `:hover` nova, e tone `warning` + ícone `Pause` no chip Paused
