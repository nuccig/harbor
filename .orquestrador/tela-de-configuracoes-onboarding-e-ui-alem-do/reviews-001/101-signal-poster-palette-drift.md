---
id: 101
severity: medium
status: resolved
location: src/renderer/src/concepts/concepts.module.css:161
created: 2026-07-09
---

# Signal Poster drifted away from the approved black/lavender direction

## Problem

The final Signal Poster palette is accessible, but it no longer matches AC-021 or the plan. AC-021 requires a black/lavender contrast, and `plan.md` specifies Signal Poster as a rectangular black/lavender grid with starting tokens `canvas #D9CCFF`, `surface #F6F1FF`, `ink #111111`, `muted #3B3347`, and `accent #5A31D6`, subject to contrast adjustment.

The current implementation changed the concept to a dark violet/yellow poster palette:

- `--canvas: #28124f`
- `--accent: #ffe75a`
- `--border: #ffe75a`

This makes the PASS note in `issue-29-manual-verification.md` accept a visual direction that differs from the approved acceptance criterion. The concept remains functional and legible, but the comparison is no longer faithful to the specified Signal Poster proposal.

## Suggested fix

Restore the black/lavender Signal Poster language while preserving the contrast remediation. One safe path is:

- keep a lavender canvas/light poster field;
- use dark ink/muted text on canvas-level copy;
- keep black or near-black high-contrast panels where needed;
- explicitly scope panel/surface text back to light ink only on black surfaces;
- re-measure `inkCanvas`, `mutedCanvas`, `focusCanvas`, `onAccentAccent`, and surface text pairs after the change.

For example, prefer a corrected lavanda system such as dark text on `#D9CCFF` plus black surface overrides, rather than replacing the concept with dark violet/yellow globally.

## Resolution

Signal Poster voltou para a linguagem preto/lavanda aprovada: `--canvas: #d9ccff`,
superfícies lavanda claras, texto/bordas/foco pretos e acento roxo. A evidência foi
recapturada para as seis screenshots de Signal Poster e o contraste final medido foi:
`inkCanvas=12.62:1`, `mutedCanvas=8.02:1`, `focusCanvas=12.62:1`.
