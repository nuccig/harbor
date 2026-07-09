# proposta-melhorias-001.md — Avaliação Night Harbor + melhorias propostas

> Avaliação do conceito consolidado (design.md) nas dimensões **motion, ícones e tipografia**,
> validada contra a skill ui-ux-pro-max (design-system engine + 99 UX guidelines) e contra a
> referência principal indicada pelo usuário:
> [Botrix — AI Command Center Dashboard](https://dribbble.com/shots/27308451-Botrix-AI-Command-Center-Dashboard-Design)
> (Orbix Studio). **Somente proposta — nada foi implementado.** Execução aguarda comando.

## 0. Método

1. Leitura das decisões: `design.md`, ADR-0002 (layouts/motion), ADR-0004 (Recursive/ícones),
   skill `harbor-night-harbor-ui`, ADRs 0001–0013.
2. Leitura da implementação: `concepts.module.css`, `ConceptScaffold.tsx`, `NightAmbient.tsx`,
   `global.css`, `Shell.tsx`, `SemanticIcon.tsx`, `primitives.module.css`.
3. Engine ui-ux-pro-max: `--design-system "AI agent command center dashboard dark immersive
   developer tool desktop" --motion 6 --density 7` → confirma Dark Mode (OLED) como estilo,
   glow mínimo, foco visível, anti-pattern "light mode default".
4. Referência Botrix inspecionada no Chrome (still 6400×4800 + descrição completa + paleta
   `#C6C7B9 #D7DCD8 #1A1B1A #9B4458`). O vídeo do shot não carregou (CDN throttle) — motion da
   referência avaliado pela descrição do autor + still.

## 1. Veredito geral

A direção Night Harbor **se sustenta** contra a referência e as tendências 2026: dark OLED
imersivo, glassmorphism pontual, ambient layer degradável, fonte variável com personalidade,
a11y como prioridade 1. Nenhuma decisão estrutural precisa mudar.

O gap não é de direção — é de **execução da própria decisão** e de **vocabulário de
componentes**. A tese da Botrix ("control room, não reporting tool: a distância entre ver o
problema e agir deve ser mínima") é exatamente a tese certa para Harbor, e hoje o Shell é
read-only: status são texto puro, sem ações inline, sem sinalização visual. A metáfora "luzes
de sinalização do porto" está declarada no design.md e **não existe na tela**.

## 2. Avaliação por dimensão

### 2.1 Motion — nota 7/10

**Forte**: 280ms + ease-out expo dentro da faixa; reduced-motion em 3 camadas (MotionConfig,
CSS nuke, ambient off); transform/opacity only; AnimatePresence com continuidade espacial.

**Gaps encontrados:**

| # | Gap | Evidência | Regra violada |
|---|-----|-----------|---------------|
| M1 | Regra `exit = 0.65 × enter` está **documentada mas não implementada** — exit usa a mesma transition do enter | `ConceptScaffold.tsx:59` (exit sem duration própria) | design.md §5; `exit-faster-than-enter` (MD) |
| M2 | **Dois sistemas de motion desconexos**: CSS tem `--duration-fast:160ms` + `--ease-standard: cubic-bezier(0.2,0.8,0.2,1)`; motion/react usa `0.28` + `[0.22,1,0.36,1]` hardcoded no TSX | `global.css:27-29` vs `NightHarborLayout.tsx:12` | `motion-consistency` (tokens únicos de duração/easing) |
| M3 | Sem **stagger** na entrada de listas (sessões, issues, activity) — tudo aparece de uma vez | `Shell.tsx` itemList/activityList | `stagger-sequence` (30–50ms/item, MD) |
| M4 | Sem **press feedback** (scale 0.95–0.97) em botões/cards | `primitives.module.css` (só transition de cor) | `scale-feedback` (HIG/MD) |
| M5 | Sem transição definida para estados expandido/colapsado futuros (lab rail tem, produto não) | — | `state-transition` |

### 2.2 Ícones — nota 4/10 (maior gap)

**Forte**: ADR-0004 correto (Phosphor Regular p/ Night Harbor, uma família por camada);
`SemanticIcon` já resolve decorative vs labelled; zero emoji estrutural.

**Gaps encontrados:**

| # | Gap | Evidência | Regra violada |
|---|-----|-----------|---------------|
| I1 | O app **quase não usa a decisão**: 1 ícone Phosphor em toda a superfície ativa (Anchor no signature). Nav lateral é texto puro | `Shell.tsx:289-301` | `nav-label-icon` (ícone+label; icon-only e text-only prejudicam scanning) |
| I2 | **Status sem ícone**: `session.status`, `issue.priority`, status de projeto são strings puras — design.md §6 exige "ícone + label" para status e não está cumprido | `Shell.tsx:137,157` | `color-not-only` (CRITICAL); design.md §6 |
| I3 | Sem **tokens de tamanho de ícone** (`--icon-sm/md/lg`); único sizing é 1.2rem hardcoded no signature | `concepts.module.css:44-47` | Consistent Icon Sizing |
| I4 | Iconoir permanece no bundle para o Design Lab; design.md next-step 6 pede Phosphor como set único após repurpose do lab | `DesignLabRail.tsx:1`, `DesignLab.tsx:1` | `icon-style-consistent` |

### 2.3 Tipografia — nota 6.5/10

**Forte**: Recursive variable vendorizada (OFL, offline, `font-display:swap`), CASL 0.46 como
assinatura — decisão superior ao Inter genérico que a própria engine recomenda; identidade real.

**Gaps encontrados:**

| # | Gap | Evidência | Regra violada |
|---|-----|-----------|---------------|
| T1 | Sem **figuras tabulares** para dados (tempos, contagens, IDs, custos) — números proporcionais deslocam layout em updates | nenhum `font-variant-numeric`/`tnum` no repo | `number-tabular` |
| T2 | Eixo **MONO subutilizado**: só no signature header. Dados técnicos (branch, IDs de issue, logs, terminal futuro) renderizam proporcionais | `concepts.module.css:28` único uso | design.md §3 (fonte que muda personalidade) |
| T3 | Sem papel tipográfico para **numeral de métrica** (KPI display). `--type-title` é clamp de landing (até 4.5rem), não papel de dashboard | `global.css:26` | `text-styles-system` (roles display/headline/body/label) |
| T4 | **Weight hierarchy não tokenizada** (650 hardcoded no signature; sem `--weight-*`) | `concepts.module.css:29` | `weight-hierarchy` |
| T5 | `:root` ainda declara `color-scheme: light` como base (pendência já registrada no design.md §8.5 — reforço de prioridade) | `global.css:10` | dark-only assertivo |

### 2.4 Gap de sistema descoberto (fora das 3 dimensões, mas bloqueia I2)

**Não existem tokens de status** além de `--danger`. A Botrix comunica Running/Stopped com
chips tintados verde/vermelho; o design.md promete "luzes de sinalização" e o sistema não tem
verde nem âmbar. Sem `--success`/`--warning`, qualquer chip de status vai nascer com hex cru
(anti-pattern da skill do projeto).

## 3. O que a Botrix ensina (padrões transferíveis, adaptados ao dark)

A Botrix é **light sage** — a paleta não se transfere (dark-only é decisão fechada). O que se
transfere é estrutura:

1. **KPI strip com numerais grandes + micro-viz "waveform"** sob cada métrica ("data texture
   without added complexity"). Tradução Night Harbor: sparkline-maré estática (barras
   verticais tipo ondulação de água) sob cada KPI — reforça a metáfora do porto e é
   reduced-motion-safe por ser estática.
2. **Chips de status dot+ícone+label com fundo tintado** (Running verde / Stopped vermelho).
   Tradução: luzes de sinalização do porto — verde (running), âmbar `#ffd166`-família (idle/
   attention, já é a cor do focus ring), vermelho-rosado `--danger` (error). `color-mix` do
   token com transparência para o fundo do chip (mesma técnica já aprovada no atlas para
   navbar).
3. **Ações inline nos cards** (Restart/SSH/Scale no próprio card de servidor). Tradução:
   card de sessão de agente com ações contextuais (pausar/retomar/abrir log) sem trocar de
   tela — é o "collapse the distance between noticing and doing" aplicado ao Harbor.
4. **Filter chips no activity feed** (All/Success/Failed/Paused) — trivial de adaptar.
5. **Annotation callout em chart** ("+24,11% peak activity") — interpretar pelo usuário em vez
   de exibir dado cru. Guardar para quando houver charts (usar skill dataviz na hora).
6. **Nav com ícone+label e estado ativo de alto contraste** — manter sidebar (desktop ≥1024
   prefere sidebar; pill top-nav da Botrix não substitui), mas adotar ícone+label e pill ativa.
7. **Segmented control** para ranges temporais (Daily/Weekly/Monthly) — vocabulário a ter no
   design system quando métricas históricas existirem.

**Não adotar da Botrix:** paleta light (decisão fechada); flags emoji (anti-pattern
no-emoji-icons); avatar de usuário no chrome (Harbor não tem auth — ADR-0006); gauges radiais
vermelho/laranja/violeta como estão (se gauges vierem, cores saem dos tokens); top pill nav
substituindo sidebar.

## 4. Propostas priorizadas

### P1 — Fundação de tokens (barato, desbloqueia todo o resto)

| ID | Proposta | Toca | Esforço |
|----|----------|------|---------|
| P1.1 | **Tokens de motion unificados**: `--motion-duration: 280ms`, `--motion-duration-exit: 182ms` (0.65×), `--motion-ease: cubic-bezier(0.22,1,0.36,1)` em global.css; TSX lê os mesmos valores de uma constante compartilhada (`motion-tokens.ts`); aposentar `--ease-standard`/`--duration-fast` divergentes | global.css, ConceptScaffold, NightHarborLayout | S |
| P1.2 | **Fix exit < enter** no ConceptScaffold (exit com duration 0.65×) — cumprir regra já decidida | ConceptScaffold.tsx | S |
| P1.3 | **Tokens de status**: `--success`/`--on-success`, `--warning`/`--on-warning` no bloco night-harbor (candidatos na família da paleta: verde-água de sinalização ~`#5ad8a6`-ajustado p/ 4.5:1 sobre surface, âmbar da família do focus-ring `#ffd166`); auditar contraste antes de fixar | concepts.module.css | S |
| P1.4 | **Tokens tipográficos**: `--type-metric` (numeral KPI, ~clamp(1.6rem, 2.2vw, 2.4rem)), `--weight-body:400 / --weight-label:520 / --weight-heading:650`, e utilitária `.data` com `font-variation-settings:'MONO' 1` + `font-variant-numeric: tabular-nums` p/ dados técnicos | global.css, primitives | S |
| P1.5 | **Tokens de ícone**: `--icon-sm:1rem / --icon-md:1.2rem / --icon-lg:1.5rem` | global.css | S |

### P2 — Vocabulário de componentes (o salto visível)

| ID | Proposta | Toca | Esforço |
|----|----------|------|---------|
| P2.1 | **StatusChip** (dot + ícone Phosphor + label, fundo `color-mix(token, transparent)`) substituindo strings puras de status/priority — cumpre design.md §6 e I2 | novo ui/StatusChip + Shell | M |
| P2.2 | **Nav lateral com ícone+label** (Phosphor Regular: Compass/overview, FolderOpen/projects, Robot ou Boat/sessions, Tray/issues, GearSix/settings) + pill ativa de alto contraste (`--surface-active` + borda accent) | Shell, shell.module.css | M |
| P2.3 | **KPI strip no Overview**: 3–4 tiles (agentes ativos, fila, taxa de sucesso, uso recente) com numeral `--type-metric` MONO tabular + **sparkline-maré estática** (SVG de barras, tokens accent com opacidade) | Shell/Overview, novo ui/MetricTile | M/L |
| P2.4 | **Ações inline nos cards de sessão** (pausar/retomar/log) — padrão control-room | Shell, mock-catalog (ações simuladas) | M |
| P2.5 | **Filter chips** no Activity (All/Success/Failed/Paused) | Shell | S/M |
| P2.6 | **Micro-interações**: stagger 40ms na entrada de itens de lista (motion/react, respeitando reduceMotion) + press scale 0.97 em botões | primitives, listas do Shell | M |

### P3 — Estrutural / quando chegar a hora

| ID | Proposta | Gate |
|----|----------|------|
| P3.1 | Chart de atividade com **annotation callout** (padrão Botrix #5) — invocar skill dataviz na implementação | quando houver dados históricos reais |
| P3.2 | Segmented control temporal (Daily/Weekly/Monthly) | junto com P3.1 |
| P3.3 | Migrar chrome do Design Lab p/ Phosphor e **remover iconoir-react** do bundle | após repurpose do lab (design.md §8.3) |
| P3.4 | Gauges/medidores de recurso por agente (CPU/tokens/custo) com cores de token | quando telemetria real existir |
| P3.5 | `color-scheme` dark-only no `:root` | já listado design.md §8.5 — só reforça prioridade |

## 5. Riscos e salvaguardas

- **Waveform/sparkline**: decorativa-informativa; estática (sem loop animado) → sem custo de
  GPU, sem conflito com nucci-0016 (ambient é a única camada decorativa animada permitida).
- **Chips tintados**: validar 4.5:1 do texto do chip sobre o fundo tintado (auditoria já
  pendente no design.md §2 cobre junto).
- **Stagger**: máx 5–7 itens visíveis por lista → total < 300ms; zerar sob reduced-motion.
- **Ícones na nav**: manter label sempre visível (nunca icon-only — regra a11y do projeto).
- Tudo em P1/P2 é aditivo e não muda arquitetura de slots/layout (ADR-0002 intacto).

## 6. Sequência sugerida de execução (aguardando comando)

1. P1 inteiro (1 sessão — tokens + fix exit; verify: lint/typecheck/test + screenshot 1024×700).
2. P2.1 + P2.2 (StatusChip + nav) — maior ganho visível por esforço.
3. P2.3 (KPI strip) — o "hero" do overview, melhor feito depois dos tokens de status/metric.
4. P2.4–P2.6.
5. P3 conforme gates.

Cada lote passa pelo pipeline SDD normal (spec curta → tasks → implement → review) ou
`--quick` para P1, que é config/token-only.
