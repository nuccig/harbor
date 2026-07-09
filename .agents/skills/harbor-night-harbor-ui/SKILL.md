---
name: harbor-night-harbor-ui
description: >
  Governs the Night Harbor visual direction for Harbor — the consolidated dark-mode immersive
  UI. Auto-triggers when src/renderer/concepts/, concepts.module.css, design-lab/,
  styles/global.css, or any renderer file defining color/animation/layout tokens is touched.
  Do not trigger for main-process or preload code, or for non-visual renderer logic.
---

# Harbor — Night Harbor UI direction

Night Harbor is the consolidated visual concept — dark-mode immersive, "harbor at night"
metaphor. This skill encodes the token system, animation rules, ambient constraints, and
desktop-only filters that govern all UI work. Decision source:
`.orquestrador/night-harbor-ui-design/design.md`.

## Mandatory pipeline (on touching UI code)

1. Night Harbor is the **only** active concept. `command-deck` and `signal-poster` are not in
   the active registry.
2. All colors come from the token system in `concepts.module.css` under
   `[data-concept='night-harbor']`. No raw hex in components.
3. Dark-mode only. No light-mode variants. If `global.css` light fallback is touched, move
   toward dark-only assertive, not back to light.
4. `prefers-reduced-motion` is respected: ambient layer disabled, CSS animations nuked,
   `MotionConfig reducedMotion='user'`.
5. Animations use transform/opacity only — never width/height/top/left.
6. Ambient layer (NightAmbient) is decorative, fixed, `pointer-events:none`, GPU-detected by
   **value** (`typeof navigator.gpu !== 'undefined'`), CSS fallback always rendered. Governed
   by atlas decision `nucci-0016-ambient-layer`.

## Rules (from recorded decisions + design.md)

- **Token system**: Use the 37+ tokens defined in `[data-concept='night-harbor']`. Full list:
  `--canvas`, `--surface`, `--surface-raised`, `--surface-active`, `--ink`, `--ink-muted`,
  `--accent`, `--on-accent`, `--danger`, `--on-danger`, `--border`, `--focus-ring`,
  `--selection`, `--selection-ink`, `--radius-small`/`control`/`panel`, `--shadow-raised`,
  `--font-casl`, `--page-gutter`; **Status tokens** (P1):
  `--success`, `--on-success`, `--warning`, `--on-warning`; **Motion tokens** (P1):
  `--motion-duration: 280ms`, `--motion-duration-exit: 182ms`, `--motion-duration-fast: 160ms`,
  `--motion-ease: cubic-bezier(0.22, 1, 0.36, 1)`; **Typography tokens** (P1):
  `--type-metric: clamp(1.6rem, 2.2vw, 2.4rem)`, `--weight-body: 400`, `--weight-label: 520`,
  `--weight-heading: 650`; **Icon tokens** (P1): `--icon-sm: 1rem`, `--icon-md: 1.2rem`,
  `--icon-lg: 1.5rem`. **CRITICAL: Semantic meaning of `on-*` tokens** (L-001): `on-*` is text/overlay
  color OVER the token as background (not vice versa); e.g., `--on-success: #07111f` (dark text) over
  `--success: #5ad8a6` (green background) = 10.65:1 contrast.
- **Animation**: 280ms base duration, easing `[0.22,1,0.36,1]`, exit = `0.65 × enter`.
  150–300ms range for micro-interactions, never >500ms. **Motion values** (P1) imported from
  `src/renderer/src/app/motion-tokens.ts` (TS: `duration: 0.28`, `durationExit: 0.182`,
  `ease: [0.22,1,0.36,1]`); CSS custom properties in `global.css`. **CRITICAL: exit/enter overrides**
  (L-004): `motion/react` transition overrides (exit, enter, whileHover, whileTap) do NOT automatically
  inherit `MotionConfig reducedMotion='user'`. Use explicit ternary before applying transition:
  `exitTransition = reduceMotion ? { duration: 0.08 } : { duration: motionTokens.durationExit, ease: motionTokens.ease }`.
  This pattern is boilerplate in ConceptScaffold, DesignLab, and any component overriding motion.
- **Accessibility CRITICAL**: focus rings visible (2–4px, `--focus-ring`), contrast 4.5:1
  text / 3:1 UI glyphs, color not-only for status (icon+label), `aria-label` on icon-only
  buttons, `aria-live=polite` on toasts, SkipLink preserved, heading hierarchy h1→h6 no skip.
- **Desktop-only filters**: Harbor is Electron, **NOT** mobile. IGNORE mobile-only rules:
  touch targets 44px, safe-area, bottom nav ≤5, viewport meta mobile-first. Breakpoints are
  density-based: 1024×700 baseline, 1440×900 expansion.
- **Glassmorphism**: `backdrop-filter:blur(14px)` + bg `rgb(7 17 31/78%)` for
  signature/modals/overlays. Consistent with existing signature header.
- **Typography**: Recursive variable font (CASL 0.46 Night Harbor). Not monospace — Harbor is
  dev tool + experience, not CLI-only.
- **z-index**: ambient=-1, content=0, sticky nav=10, dialogs above. `--layer-skip-link`,
  `--layer-toast` in `global.css`.
- **Navbar over ambient**: prefer `color-mix(in srgb, var, transparent 12%)` + sticky over
  `backdrop-filter:blur` (GPU cost). `@supports` gate. (atlas learning:
  `navbar-contrast-color-mix-over-ambient`)
- **Dual-gate viewport behavior**: gate viewport-conditional behavior in **BOTH** CSS
  `@media` **AND** JS `matchMedia` at the same breakpoint, JS short-circuits. (atlas learning:
  `css-js-dual-gate-provable-non-regression`)

## Anti-patterns (never)

- **Never** add a new concept to the active registry — Night Harbor is the only one.
- **Never** use raw hex colors in components — always tokens.
- **Never** add a light-mode variant — dark-only.
- **Never** animate width/height/top/left — transform/opacity only.
- **Never** remove focus rings or SkipLink.
- **Never** rely on color alone for agent status (running/idle/error) — always icon + label.
- **Never** detect GPU by key (`'gpu' in navigator`) — detect by value
  (`typeof navigator.gpu !== 'undefined'`).
- **Never** block the ambient layer behind pointer-events or make it interactive — it's
  decorative.
- **Never** apply mobile touch/safe-area/bottom-nav rules — Harbor is desktop.
- **Never** hardcode motion values in TSX — import `motionTokens` from `src/renderer/src/app/motion-tokens.ts`
  (avoids divergence between TS and CSS, ensures reduceMotion ternary pattern applies; e.g., no
  `duration: 0.28` inline, use `motionTokens.duration`).
- **Never** pair `on-*` tokens as text over non-token surfaces — `on-*` is text color OVER the token-color
  as background, not over arbitrary surfaces. Use text tokens (`--ink`, `--ink-muted`) for non-status
  surfaces (L-001).

## References

- `.orquestrador/night-harbor-ui-design/design.md` (full decision)
- `concepts/registry.ts`, `concepts.module.css`,
  `concepts/night-harbor/NightHarborLayout.tsx`, `NightAmbient.tsx`
- `styles/global.css`, `design-lab/DesignLab.tsx`
- Atlas: `nucci-0016-ambient-layer`, `gpu-fallback-detect-values-not-keys`,
  `navbar-contrast-color-mix-over-ambient`, `css-js-dual-gate-provable-non-regression`
- ADRs 0001–0013 (`docs/adr/`)
- ui-ux-pro-max skill (design system search baseline)