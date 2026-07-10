# Contrast Audit — Night Harbor P2.3 KPI Strip (MetricTile)

**Data**: 2026-07-10 (rev. 1 — computed by script at plan time, before implementation)
**Fase**: plan (sdd-plan)
**Riscos endereçados**: R3 (handoff-001.md), AC-009, AC-013, AC-014
**Método**: WCAG 2.1 exact relative luminance (piecewise sRGB linearization, exponent 2.4),
computed by a standalone Node script (no browser, no estimation) — reproduced below in full so
the numbers are re-derivable. Learning `contrast-math-by-script` applied from the first
revision (no arithmetic-by-LLM pass preceded this).

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
// composite CSS/SVG fill-opacity against an opaque background (not a linear-light blend).
function blend(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex), bg = hexToRgb(bgHex)
  const mix = (a, b) => Math.round(alpha * a + (1 - alpha) * b)
  const r = mix(fg.r, bg.r), g = mix(fg.g, bg.g), b = mix(fg.b, bg.b)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}
```

---

## Descoberta 1: MetricTile background is opaque — no deeper compositing needed

`MetricTile` sits inside the Overview group's `var(--surface)` panel and gets its own
`background: var(--surface-raised)`. `--surface-raised` is a **solid** token in all three
concepts (no alpha channel, no `color-mix`), so it is already the final effective background
for anything painted on the tile — unlike `StatusChip`'s tinted `color-mix` background (which
needed compositing against `--surface` underneath, per learning
`visual-contrast-against-canvas`), there is no further layer to compose here. This audit
therefore treats `--surface-raised` as the effective background for both pairs below.

## Descoberta 2: Token values used (read directly from `concepts.module.css`)

```
night-harbor:   ink=#f3f7ff  surface=#0e1b2f  surface-raised=#152642  accent=#63a9ff  border=#41597a
command-deck:   ink=#111827  surface=#ffffff  surface-raised=#f8fafc  accent=#0b6b5b  border=#9aa5b1
signal-poster:  ink=#111111  surface=#f6f1ff  surface-raised=#efe7ff  accent=#5a31d6  border=#111111
```

## Descoberta 3: Numeral — `--ink` on `--surface-raised` (text, AA floor 4.5:1)

Luminâncias exatas por script (L1 = mais clara, L2 = mais escura; ratio = (L1+0.05)/(L2+0.05)):

| Concept | ink | L(ink) | surface-raised | L(surface-raised) | L1 | L2 | Ratio | AA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| night-harbor | #f3f7ff | 0.927962 | #152642 | 0.019390 | 0.927962 | 0.019390 | **14.09:1** | ✓ |
| command-deck | #111827 | 0.009189 | #f8fafc | 0.953559 | 0.953559 | 0.009189 | **16.96:1** | ✓ |
| signal-poster | #111111 | 0.005605 | #efe7ff | 0.827226 | 0.827226 | 0.005605 | **15.78:1** | ✓ |

All three pass with wide margin — expected, since `--ink`/`--surface-raised` are each
concept's own plain foreground/panel pair, not a tinted or composited pair.

## Descoberta 4: Sparkline bar — `blend(accent, surface-raised, alpha)` vs. `surface-raised` (non-text, floor 3:1)

Candidate `fill-opacity` values swept from 0.45 to 0.85 in 0.05 steps, across all three
concepts (full sweep; only the decision-relevant rows shown, remainder in the raw log below):

| alpha | night-harbor composite | ratio | command-deck composite | ratio | signal-poster composite | ratio |
| --- | --- | --- | --- | --- | --- | --- |
| 0.60 | #4475b3 | 3.20:1 ✓ | #6aa49b | 2.71:1 ✗ | #967ae6 | 2.82:1 ✗ |
| 0.65 | #487bbd | 3.49:1 ✓ | #5e9d93 | 2.99:1 ✗ | #8e71e4 | 3.11:1 ✓ |
| 0.70 | #4c82c6 | 3.83:1 ✓ | #52968b | 3.29:1 ✓ | #8768e2 | 3.43:1 ✓ |
| **0.75** | **#5088d0** | **4.16:1 ✓** | **#468f83** | **3.64:1 ✓** | **#7f5fe0** | **3.80:1 ✓** |
| 0.80 | #538fd9 | 4.54:1 ✓ | #3a887b | 4.02:1 ✓ | #7855de | 4.22:1 ✓ |

**0.70 is the exact minimum that clears 3:1 in all three concepts**, but command-deck sits at
2.99:1 at 0.65 — one step below the floor by a margin too thin to ship without risk of a
rendering/rounding regression. **0.75 was selected**: comfortable margin above 3:1 in every
concept (command-deck 3.64:1, the tightest of the three, still +0.64 over the floor).

Luminâncias exatas do valor escolhido (fill-opacity **0.75**), por script:

| Concept | composite (accent @0.75 sobre surface-raised) | L(composite) | L(surface-raised) | L1 | L2 | Ratio | ≥3:1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| night-harbor | #5088d0 | 0.238679 | 0.019390 | 0.238679 | 0.019390 | **4.16:1** | ✓ |
| command-deck | #468f83 | 0.225857 | 0.953559 | 0.953559 | 0.225857 | **3.64:1** | ✓ |
| signal-poster | #7f5fe0 | 0.180783 | 0.827226 | 0.827226 | 0.180783 | **3.80:1** | ✓ |

Full raw sweep (all 9 alphas × 3 concepts), for the record:

```
night-harbor (accent #63a9ff over surface-raised #152642):
  0.45 -> #386197 -> 2.40:1   0.50 -> #3c68a1 -> 2.66:1   0.55 -> #406eaa -> 2.90:1
  0.60 -> #4475b3 -> 3.20:1   0.65 -> #487bbd -> 3.49:1   0.70 -> #4c82c6 -> 3.83:1
  0.75 -> #5088d0 -> 4.16:1   0.80 -> #538fd9 -> 4.54:1   0.85 -> #5795e3 -> 4.91:1

command-deck (accent #0b6b5b over surface-raised #f8fafc):
  0.45 -> #8dbab4 -> 2.04:1   0.50 -> #82b3ac -> 2.23:1   0.55 -> #76aba3 -> 2.47:1
  0.60 -> #6aa49b -> 2.71:1   0.65 -> #5e9d93 -> 2.99:1   0.70 -> #52968b -> 3.29:1
  0.75 -> #468f83 -> 3.64:1   0.80 -> #3a887b -> 4.02:1   0.85 -> #2f8073 -> 4.50:1

signal-poster (accent #5a31d6 over surface-raised #efe7ff):
  0.45 -> #ac95ed -> 2.12:1   0.50 -> #a58ceb -> 2.32:1   0.55 -> #9d83e8 -> 2.56:1
  0.60 -> #967ae6 -> 2.82:1   0.65 -> #8e71e4 -> 3.11:1   0.70 -> #8768e2 -> 3.43:1
  0.75 -> #7f5fe0 -> 3.80:1   0.80 -> #7855de -> 4.22:1   0.85 -> #704cdc -> 4.67:1
```

## Descoberta 5: Sanity check — pure `--accent` (fill-opacity 1.0, for reference only)

| Concept | accent | surface-raised | Ratio |
| --- | --- | --- | --- |
| night-harbor | #63a9ff | #152642 | 6.23:1 |
| command-deck | #0b6b5b | #f8fafc | 6.14:1 |
| signal-poster | #5a31d6 | #efe7ff | 6.17:1 |

Confirms the token pair itself has headroom; the constraint is entirely a function of the
chosen opacity, not the underlying hues.

## Descoberta 6: `var()` fallback chain does not actually trigger for today's three concepts

`--accent`, `--surface-raised`, `--border`, and `--ink` are defined in **all three** concept
blocks in `concepts.module.css` (confirmed by direct read, not inferred) — unlike
`--success`/`--warning`, which only night-harbor defines. This means
`fill: var(--accent, var(--border))` and `color: var(--ink)` never fall through to their
second argument under command-deck or signal-poster today; the fallback is defensive
engineering for a hypothetical future concept, not an active legacy-degradation path. See
ADR-0003 "Alternatives" for the discussion of what "neutral degradation" (AC-014) means given
this fact, and the open point carried to the plan's HITL gate.

---

## Status dos Riscos — Sumário

| # | Risco | Status | Resolução |
| --- | --- | --- | --- |
| R3 | Sparkline contrast might not clear 3:1 on first try (same error class as the previous run's rev.1 sRGB bug) | ✓ **FECHADO** | Script-computed from the start (no arithmetic-by-LLM pass); `fill-opacity: 0.75` clears 3:1 in all three concepts with margin (3.64–4.16:1) |
| — | Numeral contrast | ✓ **FECHADO** | `--ink` on `--surface-raised`: 14.09–16.96:1 in all three concepts, far above the 4.5:1 floor |

## Decisão Final (referenciada por ADR-0003)

1. Tile background: solid `var(--surface-raised)` — no `color-mix`, no further compositing
   needed for this audit.
2. Numeral: `var(--ink)`, no per-KPI tone. 14.09–16.96:1 across all three concepts.
3. Sparkline bar: `var(--accent, var(--border))` fill, `fill-opacity: 0.75`. 3.64–4.16:1 across
   all three concepts (non-text floor 3:1).
4. `var()` fallback chains are present for defensive consistency with the `StatusChip`
   precedent (D-004/G4) but do not currently activate for any of the three shipped concepts,
   since all four referenced tokens are already defined everywhere.

**Auditoria CONCLUÍDA** para o plan gate. Re-auditar por script apenas se algum hex de
`--accent`/`--surface-raised`/`--ink`/`--border` mudar em qualquer concept, ou se o
`fill-opacity` for alterado.

## Próximas Etapas

- [x] Auditoria numérica exata (plan-agent, antes do gate HITL) — concluída
- [ ] sdd-tasks: tasks consomem os valores `0.75` (fill-opacity) e os tokens acima como
      constantes fixas; nenhuma tarefa de auditoria adicional pendente, salvo mudança de hex
- [ ] sdd-review: revisor confere que o CSS implementado usa exatamente
      `var(--accent, var(--border))` + `fill-opacity: 0.75` no `.metricSparkBar`, e
      `var(--ink)` (sem tonalização por KPI) no `.metricValue`
