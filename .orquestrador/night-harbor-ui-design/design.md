# design.md — Night Harbor UI Consolidation

> Decisão consolidada de UI-UX para Harbor. Night Harbor é o conceito visual escolhido.
> Este documento consolida a direção decidida + próximos passos. Não é um spec de implementação.

## 1. Direção escolhida

Night Harbor — dark mode imersivo, metáfora "porto à noite": navio (agent) atracado, água escura, luzes de sinalização. Único conceito visual consolidado. `command-deck` e `signal-poster` deixam o registro ativo; o Design Lab deixa de ser comparador de 3 conceitos e vira instrumento de feedback/iteração do Night Harbor único.

**Justificativa**: Harbor é uma ferramenta para desenvolvedores COM uma experiência narrativa (não só um IDE). Night Harbor conta uma história — porto à noite, agentes atracados, sinais luminosos — que os outros dois conceitos não sustentam com a mesma coerência. A paleta navy existente (`--canvas:#07111f`) é mais narrativa que o slate genérico (#0F172A) recomendado por design systems padrão para dev tools.

## 2. Sistema de tokens

Os tokens abaixo são os **existentes** em `src/renderer/concepts/concepts.module.css` sob `[data-concept='night-harbor']`. Mantidos como-is nesta consolidação. Refinamentos ficam como itens de auditoria (próxima seção), não como mudanças neste PR.

| Token | Valor | Papel |
|-------|-------|-------|
| `color-scheme` | `dark` | Declaração do modo escuro ao UA |
| `font-variation-settings` (`CASL`) | `0.46` | Casualness do Recursive — personalidade Night Harbor |
| `--canvas` | `#07111f` | Fundo base (água escura do porto) |
| `--surface` | `#0e1b2f` | Painel base |
| `--surface-raised` | `#152642` | Painel elevado (cards) |
| `--surface-active` | `#19385a` | Estado ativo/press |
| `--ink` | `#f3f7ff` | Texto primário |
| `--ink-muted` | `#aabbd1` | Texto secundário/muted |
| `--accent` | `#63a9ff` | Sinalização/luz de ação |
| `--on-accent` | `#07111f` | Texto sobre accent |
| `--danger` | `#ff8d9d` | Erro/destrutivo |
| `--on-danger` | `#21040a` | Texto sobre danger |
| `--border` | `#41597a` | Bordas e divisores |
| `--focus-ring` | `#ffd166` | Anel de foco (amarelo sinalização) |
| `--selection` | `#385f9c` | Seleção de texto |
| `--selection-ink` | `#fff` | Texto sobre seleção |
| `--radius-small` | `8px` | Chips/tags |
| `--radius-control` | `10px` | Botões/inputs |
| `--radius-panel` | `16px` | Painéis/modais |
| `--shadow-raised` | `0 18px 54px rgb(0 0 0/32%)` | Único shadow token |
| `--font-casl` | `0.46` | Alias para CASL em componentes |
| `--page-gutter` | `clamp(1rem, 2.6vw, 2.25rem)` | Margem responsiva de página |

### Auditoria de contraste (pendentes)

Itens de auditoria — não bloqueiam esta consolidação, viram próximas tarefas:

- Auditar `--ink-muted` vs `--surface-raised` (hoje ~7:1 sobre surface, verificar sobre surface-raised).
- Auditar `--border` vs `--canvas` para 3:1 mínimo (UI glyphs / non-text).
- **Dark-only**: sem light mode. `global.css` ainda tem `color-scheme:light` fallback — remover/neutralizar.
- **Glow**: `text-shadow: 0 0 10px var(--accent)` com parcimônia em elementos de signal/status, nunca em body text.

## 3. Tipografia

Manter **Recursive** (variable font, woff2, weight 300–1000, CASL 0.46 Night Harbor). Superior a JetBrains Mono para Harbor: uma fonte que muda personalidade por conceito, suportando a narrativa. ui-ux-pro-max recomenda monospace para dev tools, mas Harbor é dev tool **+** experiência. Tokens globais: `--type-small`, `--type-body`, `--type-large`, `--type-title`.

## 4. Efeitos

- **Glassmorphism** (`backdrop-filter:blur`) — já usado no signature header (`blur(14px)` + `bg rgb(7 17 31/78%)`). Estender para modais/overlays com o mesmo padrão.
- **Ambient layer** — manter NightAmbient (shader LinearGradient colorA=`#07111f` colorB=`#37256f` opacity=`0.72` + CSS fallback radial gradients). Regido por decisão atlas `nucci-0016-ambient-layer.md`: decorativo, fixed, `pointer-events:none`, static sob reduced-motion. GPU detection por **valor** (`typeof navigator.gpu !== 'undefined'`), não por chave.
- **Shadow**: `--shadow-raised` é o único shadow token. Não inventar outros.

## 5. Animação

- **Duração base**: 280ms (já usado no NightHarbor transition) — dentro da faixa 150–300ms.
- **Easing**: `[0.22,1,0.36,1]` (ease-out expo) — manter.
- **Exit < enter**: exit duration = `0.65 × enter duration` (regra nova, de ui-ux-pro-max).
- **Reduced-motion**: respeitado via `MotionConfig reducedMotion='user'`, ambient desligada, CSS nuke de animations.
- **Transform/opacity only**: novos componentes nunca animam `width`/`height`/`top`/`left`.

## 6. Acessibilidade (prioridade 1, CRITICAL)

- **Contraste 4.5:1** mínimo para texto (4.5:1 normal, 3:1 large). `--ink`/`--surface` passa AAA. Auditar pares muted/border.
- **Focus rings**: `--focus-ring:#ffd166` visível (2–4px). Nunca remover. Todo elemento interativo tem focus visível.
- **Keyboard nav**: SkipLink existe. Tab order = visual order. FocusHeading no Shell garante hierarchy h1→h6 sem skip.
- **Color not-only**: status de agent (running/idle/error) não depende só de cor — sempre com ícone + label.
- **`aria-label`** em botões icon-only. `aria-live="polite"` em toasts.

## 7. Layout

- **Desktop-only**: Harbor é Electron, não mobile. Breakpoints são de **densidade**: 1024×700 baseline, 1440×900 expansão. Regras mobile do ui-ux-pro-max (touch targets 44px, safe-area, bottom nav ≤5) **NÃO aplicam** — filtrar.
- **Grid overview**: 12-col (primary span 8, metrics/queue/utility/activity span 4).
- **Page gutter**: `clamp(1rem, 2.6vw, 2.25rem)`.
- **z-index management**: `--layer-skip-link`, `--layer-toast` definidos em `global.css`. Ambient = -1, content = 0, sticky nav = 10, dialogs/modals = acima.

## 8. Próximos passos (não neste PR)

Estes são próximos passos de implementação, **não** parte deste PR (que é só consolidação de decisão):

1. Promover Night Harbor de conceito experimental → default (`experience-model.ts`: `defaultConcept = 'night-harbor'`).
2. Remover `command-deck` e `signal-poster` do registro ativo (ou arquivar em `concepts/legacy/`).
3. Repurposing do DesignLab: comparador de 3 conceitos → painel de feedback/iteração do Night Harbor único.
4. Surface `workspace` (PTY terminal) ainda sem layout Night Harbor dedicado — criar.
5. Light mode fallback do `global.css` → remover ou converter para dark-only assertivo.
6. Icon set: confirmar Phosphor (já dep) como único set, definir stroke consistente.
7. Auditoria de contraste dos pares muted/border (seção 2).

## 9. Origem

Decisão derivada de:

- Análise do sistema de conceitos existente (`concepts/registry.ts`, `concepts.module.css`, `NightHarborLayout.tsx`, `NightAmbient.tsx`).
- Skill **ui-ux-pro-max** (design system search: "developer tool dark mode immersive terminal coding agent" + domains style/color/ux).
- Atlas recall: `nucci-0016-ambient-layer`, `gpu-fallback-detect-values-not-keys`, `navbar-contrast-color-mix-over-ambient`, `css-js-dual-gate-provable-non-regression`.
- ADRs 0001–0013 do projeto.