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
- **StatusChip (P2)**: status chips live in `src/renderer/src/ui/StatusChip.tsx`. Tinted
  background `color-mix(in srgb, var(--tone), transparent 85%)`; text/icon/dot in the **token
  color itself** (`--success`/`--warning`/`--danger`; neutral → `--ink-muted`) — never `on-*`
  over tinted fills (reinforces L-001: `on-*` presumes the solid token as background). Solid
  fallback `var(--surface-raised)` outside the `@supports` block — never color-mix in the
  fallback. Default icons by tone: CheckCircle/Clock/Warning/Minus (Phosphor Regular). Audited
  ratios: 6.08–8.48:1 tinted, 6.88–10.49:1 fallback (ADR-0014). **Paused status (P2.4)**: reuses
  tone `warning` with an explicit `Pause` icon override via the `icon` prop (no 5th tone; Ready
  keeps `Clock`) — differentiation is icon+label, pair audited 8.48/10.49:1 (night-harbor).
- **Nav ícone+label (P2)**: primary nav uses Phosphor Regular via `SemanticIcon decorative` +
  label **always visible** (truncate with ellipsis, never hide). navIcons: Compass (overview),
  FolderOpen (projects), Boat (sessions — harbor metaphor), Tray (issues), GearSix (settings).
  Active pill on `[aria-current='page']`: `--surface-active` background + `--accent` border.
- **MetricTile/Sparkline (P2.3)**: KPI tiles live in `src/renderer/src/ui/MetricTile.tsx`.
  Props are primitives only (`{ label, value, series: readonly number[] }`) — the component is
  type-isolated from `selectors.ts`/`mock-catalog.ts` (enables parallel data/component tasks).
  Tile background `var(--surface-raised)`; numeral plain `var(--ink)` — no tone-per-KPI without
  a defined business threshold. Sparkline: Recharts `{ Bar, BarChart }` named imports only;
  fixed `width={48} height={16}` — **no** `ResponsiveContainer` (jsdom has no `ResizeObserver`);
  `margin` zeroed (Recharts' default margin consumes over half of a 16px canvas); decorative
  opt-out is mandatory: `accessibilityLayer={false}` (Recharts 3 injects `role="application"` +
  `tabindex="0"` by default) + `aria-hidden` wrapper + `isAnimationActive={false}` +
  `pointer-events: none`. Bar color via `className` + CSS module
  `fill: var(--accent, var(--border))` + `fill-opacity: 0.75` — never the `fill` prop (the
  presentation attribute loses to the cascade; the CSS-module rule is how `var()` resolves per
  concept). Audited ratios: sparkline 4.16/3.64/3.80:1 (≥3:1 non-text), numeral
  14.09/16.96/15.78:1 across the 3 concepts. Legacy concepts render their **native** accent
  (zero per-concept code) — resolved reading of "neutral degradation" (ADR-0016).
- **`ui/` primitives are domain-blind with fully resolved props (P2.4 — standing convention)**:
  3 data points (StatusChip → MetricTile → SessionCard) plus an explicit user override (HITL,
  P2.4 run ADR-0004) make this a project convention, not a per-component accident. New reusable
  primitives go in `src/renderer/src/ui/` with **zero imports of `app/`** — they define their
  own structural prop types (TS structural typing bridges to the view model), and ALL domain
  mapping (status→tone, action matrix, resolved aria-labels, data lookups) is resolved ONCE in
  the selectors layer, never in the component or duplicated across call sites. An `app/` import
  inside a `ui/` file is an automatic review finding.
- **SessionCard (P2.4)**: session cards live in `src/renderer/src/ui/SessionCard.tsx` — the
  whole card (meta + StatusChip + action cluster + log panel), rendered identically by the
  Overview list and the Sessions board as `<li><SessionCard …/></li>`. Props arrive fully
  resolved from `selectSessionViews`: `statusLabel`/`statusTone`/`paused`/`canTogglePause`/
  `togglePauseLabel`/`logLabel`/`logLines`. `onTogglePause` is a **zero-arg** callback — the
  call site closes over `sessionId`; the card never sees domain ids. The only internal logic is
  presentational, driven by the `paused` flag (chip icon `Pause`, toggle icon `Play`/`Pause`) —
  same genre as StatusChip's `defaultIconsByTone`. Card CSS in `ui/primitives.module.css`; only
  the list layout (`.sessionList`) lives in `shell.module.css` — exact mirror of the
  MetricTile/`.kpiStrip` split.
- **Live session state (P2.4)**: the live slice is `pausedSessionIds: readonly string[]` on
  `ExperienceState` (seeded `[]` — reset on reload by construction) + seed-agnostic action
  `toggleSessionPaused` (the reducer only toggles id membership; it never imports
  `mockCatalog`). `mockCatalog` stays a frozen seed — never mutated, never copied into state.
  ALL surfaces (Overview sessions list, Sessions board, KPI "Active agents") read the merged
  view through the SINGLE selector `selectSessionViews` — never the raw catalog; the
  `isSessionActive` guard keeps spurious ids from painting Ready/Complete as Paused. Future
  live transitions follow the same shape: sparse id set + seed-agnostic reducer + one merge
  selector consumed by every surface.
- **IconButton idiom (P2.4)**: icon-only actions use the existing `IconButton` primitive
  (`variant="quiet"`) with an explicit `aria-label` (resolved by the selectors layer when it
  carries domain copy, e.g. `Pause session {agent}: {task}`) + Phosphor icon wrapped in
  `SemanticIcon decorative`. Max 2 actions per card, **always visible** — no hover-reveal, no
  kebab/overflow menu.
- **Panel disclosure (P2.4)**: expandable panel behind a trigger button: panel id via
  `useId()`; trigger ALWAYS carries `aria-expanded={open}` + `aria-controls={panelId}` (present
  even when closed — `aria-controls` pointing at an absent id is the accepted APG disclosure
  pattern); panel **conditionally mounted** (not always-mounted `hidden`), placed right after
  the action cluster in DOM order; closing must NOT move focus (the trigger stays mounted and
  focused). Disclosure open/closed is local UI state (`useState` per instance) — never
  `ExperienceState`. Log panel styling: `background: var(--canvas)` (terminal recess), border
  `--border`, text `--ink`, timestamp `--ink-muted` + `.data` (mono/tabular) — audited
  6.86–17.64:1.
- **Effective reduced motion (P2.4)**: `useEffectiveReducedMotion()` in
  `src/renderer/src/app/use-reduced-motion.ts` composes system preference (motion-dom) OR the
  app setting — the single source for App and all surfaces; never re-compose it inline. `ui/`
  components never call the hook (it's `app/`): they take a `reduceMotion` boolean prop and
  gate the animated class conditionally (fade/rise 4px, opacity+transform only), with
  `@media (prefers-reduced-motion: reduce)` zeroing the animation in CSS as defense in depth.
- **No new `:hover` until P2.6**: hover ≡ rest state app-wide; interactive affordance comes
  from the audited global focus/pressed states. Any new `:hover` pair is out of scope until the
  dedicated P2.6 hover pass (introducing one requires a new contrast audit).
- **sessionLogs fixture (P2.4)**: `mockCatalog.sessionLogs` is a frozen
  `Record<sessionId, readonly SessionLogLine[]>` of deterministic lines
  (`{ time: 'HH:MM:SS', text }`; 8/7/9 lines per seeded session). The selector resolves
  `logLines` (`?? []`); log-panel tests derive line counts/content from the fixture, never
  hardcode.

## Testing (renderer components)

- CSS module class names are hashed at build time — assert by substring, never literal:
  `element.closest('[class*="statusChip"]')` + `expect(el?.className).toContain('statusChip_<tone>')`.
- Counts/values asserted in tests must be derived from the fixture source
  (`mockCatalog.agents.filter(...).length`), never hardcoded literals. Same rule for DOM
  **order/adjacency**: derive the full expected sequence from the fixture (e.g. tab stops via
  `seedViews.flatMap(...)`), never hand-pick two items assumed adjacent — adjacency that holds
  only by accident of today's fixture ordering fails as a fake regression on any fixture edit
  (P2.4 finding 201). (atlas learning:
  `css-module-class-asserts-substring-and-fixture-derived`)
- Never assert an event handler was "called with no arguments" — React always passes a
  SyntheticEvent to `onClick={handler}`. Assert the intent instead: the received argument is
  NOT the domain value (`expect(spy.mock.calls[0][0]).not.toBe(session.id)`). (atlas learning:
  `react-onclick-syntheticevent-no-args-assert`)
- Recharts `<Bar className>` lands on the `<g>` series wrapper AND on each `<path>` — counting
  bars by raw class selector over-counts by +1. Filter `tagName === 'path'` (or use
  `.recharts-rectangle`) before comparing with `series.length`.
- **No global matchMedia stub** (errata P2.4, supersedes the P2.3 rule): the mount-time
  `matchMedia` consumer is `useReducedMotionPreference` (motion-dom) — exercised by any
  `App`/`Shell` mount, with or without Recharts — and jsdom 29's **native** matchMedia
  satisfies it (proven twice: 185/185 and 220/220 with `tests/renderer/setup.ts` untouched).
  Only tests that force `matches: true` stub matchMedia **locally**, and then with the FULL
  `MediaQueryList` surface (`matches`, `addEventListener`, `removeEventListener`, plus
  `addListener`/`removeListener` for lib compat) — the minimal `{ matches }` stub is what
  breaks the mount (motion-dom and Recharts' `JavascriptAnimate` both call
  `addEventListener`).
- Recharts clip-path ids (`recharts<N>-clip`) and React 18 `useId` output (`:r<N>:`) are
  volatile per mount — normalize them via regex to a fixed placeholder before comparing
  `innerHTML` between two renders; raw string comparison is a guaranteed false negative.
  (atlas learning: `recharts-jsdom-testing-gotchas`)

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
- **Never** use `on-*` as text over a tinted/translucent background — `on-*` presupposes the
  **solid** token as background; over color-mix tints, use the token color itself
  (`on-success` over 85% tint = 1.50:1, fails AA — ADR-0014).
- **Never** assert CSS module classes with literal `toHaveClass` — hashed class names break it;
  use substring matching (`[class*="..."]` + `className.toContain`).
- **Never** color a Recharts mark via the `fill`/`stroke` props when it must follow the token
  system — use `className` + CSS module so `var()` resolves in the cascade (the presentation
  attribute always loses to the CSS rule).
- **Never** mount a decorative Recharts chart with the library defaults — without
  `accessibilityLayer={false}` it becomes a keyboard tab-stop (`role="application"` +
  `tabindex="0"`), and without zeroed `margin` a sparkline-scale chart is mostly invisible.
- **Never** import `app/` (selectors, mock-catalog, hooks, view-model types) from a `ui/`
  primitive — props arrive fully resolved from the selectors layer; the dependency direction
  `ui/` ⊬ `app/` is a review criterion (P2.4 convention).
- **Never** add a `:hover` style before the P2.6 hover pass — hover ≡ rest; new hover pairs
  require their own contrast audit.
- **Never** mutate `mockCatalog` or copy seed fields into live state — live state is sparse
  (ids only); the merge happens in the selector.

## References

- `.orquestrador/night-harbor-ui-design/design.md` (full decision)
- `concepts/registry.ts`, `concepts.module.css`,
  `concepts/night-harbor/NightHarborLayout.tsx`, `NightAmbient.tsx`
- `styles/global.css`, `design-lab/DesignLab.tsx`
- Atlas: `nucci-0016-ambient-layer`, `gpu-fallback-detect-values-not-keys`,
  `navbar-contrast-color-mix-over-ambient`, `css-js-dual-gate-provable-non-regression`
- ADRs 0001–0016 (`docs/adr/`)
- `.orquestrador/night-harbor-p2-kpi-strip/adr/` (run-local: 0001 KPI derivation, 0002 Recharts
  integration → docs 0015, 0003 MetricTile colors → docs 0016)
- `.orquestrador/night-harbor-p2-inline-actions/adr/` (run-local: 0001 live session state
  slice, 0002 Paused chip, 0003 IconButton states, 0004 SessionCard + log disclosure — 0004
  amended with the HITL override that set the `ui/` resolved-props convention)
- ui-ux-pro-max skill (design system search baseline)