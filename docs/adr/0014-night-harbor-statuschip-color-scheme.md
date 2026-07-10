# ADR 0014 — Night Harbor StatusChip color scheme: color-mix 85% tint + token-color text + solid fallback

## Status

accepted

## Context

Night Harbor P2 introduces StatusChip (`src/renderer/src/ui/StatusChip.tsx`), a composed status primitive (dot + Phosphor icon + label) with a tinted background over ambient surfaces. The tint technique — `color-mix(in srgb, var(--tone), transparent N%)` with a solid fallback behind `@supports` — is already production-validated (atlas learning `navbar-contrast-color-mix-over-ambient`). The open question was the text color over that tint.

The first plan revision paired the tint with `--on-*` text tokens and passed its own contrast audit — but the audit's arithmetic was wrong. It estimated L(#0e1b2f) at ~0.15 when the exact WCAG 2.1 luminance (piecewise sRGB linearization, exponent 2.4) is ~0.011, and at one point inverted the ratio formula. The controller's exact recalculation showed the scheme fails structurally: `--on-*` tokens are dark (designed as text over the light, solid tone fills), and the tinted background is also dark (85% transparency mixes the tone into `--surface` #0e1b2f). Dark-on-dark cannot reach AA at any transparency: `--on-success` over the 85% tint is 1.50:1; over an 80% tint, 1.71:1. Adjusting opacity does not fix an incompatible pairing.

## Decision

- **Background**: `color-mix(in srgb, var(--tone), transparent 85%)` — 85% as specced.
- **Text, icon, and dot in the tone token's own color** (`--success` / `--warning` / `--danger`), which is light and contrasts with the dark tint. **Neutral** uses `--ink-muted` (#aabbd1) — `--border` (#41597a) as text fails at 2.18:1.
- **Fallback without color-mix**: solid `var(--surface-raised)` (#152642), declared before the `@supports` block. The fallback never uses color-mix (a color-mix fallback is useless exactly in the browsers that need it).
- **`--on-*` tokens do not appear in the chip.** They stay reserved for future solid fills (`background: var(--success)` + `color: var(--on-success)` = 10.65:1), preserving on-token semantics (atlas learning `on-token-semantics-text-over-token-bg`).
- Legacy portability via var() chains: `var(--success, var(--ink-muted))` for text, `var(--success, var(--border))` for tone, so the chip degrades to neutral-legible under concepts that do not define status tokens — zero edits to legacy concept CSS.

Audited ratios (exact WCAG 2.1 luminance, controller-run script):

| Tone | Tinted 85% over `--surface` | Solid fallback `--surface-raised` |
| --- | --- | --- |
| success | 7.10:1 | 8.51:1 |
| warning | 8.48:1 | 10.49:1 |
| danger | 6.08:1 | 6.88:1 |
| neutral | 7.97:1 | 7.74:1 |

All pairs meet AA (≥4.5:1).

## Alternatives

- **`--on-*` text over the 85% tint (spec literal)** — rejected: 1.50:1. Dark text over a dark tint fails at any opacity.
- **`--on-*` text over an 80% tint** — rejected: 1.71:1. Opacity tuning does not correct the structural incompatibility.
- **Hardcoded pre-computed hex for the fallback** — rejected: introduces magic hex outside the token system; `--surface-raised` already exists in all concepts and passes AA with tone-color text.
- **Neutral text in `--border`** — rejected: 2.18:1; replaced by `--ink-muted`.

## Consequences

- Browsers with color-mix get the dynamic 85% tint; browsers without it get a solid `--surface-raised` chip with a tone border — both AA, graceful degradation.
- `--on-*` semantics stay clean in the codebase: text over the solid token only. Any future tinted/translucent surface must use the token color (or another audited pair) for text — never `on-*`.
- Contrast for any new/changed color pair must be verified by running the exact WCAG script (sRGB linearization, exponent 2.4), not by estimation — the rev. 1 audit failure is the precedent (atlas learning `contrast-math-by-script-not-llm-arithmetic`).
- Re-audit is only required if a token hex changes; the chip consumes tokens via var() and introduces no new hex.

## References

- `.orquestrador/night-harbor-p2-statuschip-nav/adr/0001-contraste-color-mix-transparencia.md` (run-local ADR, full audit tables)
- `.orquestrador/night-harbor-p2-statuschip-nav/plan.md` §2.5, §2.7 (rev. 2); `memory/contrast-audit.md` rev. 2 (ERRATA)
- `src/renderer/src/ui/StatusChip.tsx`, `src/renderer/src/ui/primitives.module.css`
- `.agents/skills/harbor-night-harbor-ui/SKILL.md` (StatusChip rules)
- Atlas: `on-token-semantics-text-over-token-bg`, `navbar-contrast-color-mix-over-ambient`, `contrast-math-by-script-not-llm-arithmetic`
