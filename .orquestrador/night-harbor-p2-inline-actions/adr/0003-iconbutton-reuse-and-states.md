---
id: 0003
title: Ações inline reusam a primitive IconButton (variant quiet) sem estados de cor novos
status: accepted
date: 2026-07-10
---

# ADR-0003 — Ações inline reusam a primitive `IconButton` (variant `quiet`) sem estados de cor novos

## Context

G4/D-006 fixam a apresentação: máx. 2 icon buttons sempre visíveis por card (toggle
Pause/Play + log), Phosphor, `aria-label` obrigatório. A primitive `IconButton` existe em
`ui/Button.tsx:23–35` com o contrato exato do learning astryx-iconbutton
(`Omit<ButtonProps, 'aria-label' | 'children'> & { 'aria-label': string; children }`) — mas
tem **0 call sites** (R5): P2.4 é seu primeiro consumo real. Além disso `.button` não define
`:hover` para NENHUMA variante do app (R3, `primitives.module.css:1–61`): só
`:active:not(:disabled)` (→ `--surface-active`), `:disabled` (opacity 0.46) e
`:focus-visible` (ring `--focus-ring`). A Constraints da spec exige auditoria de
"repouso/hover/pressed/disabled/focus" dos icon buttons.

## Decision

1. **Reusar `IconButton` como está — nenhuma mudança de assinatura.** Validação do contrato
   contra os 2 casos de uso reais:
   - toggle Pause/Play: precisa de `aria-label` (obrigatório no tipo ✓), `onClick` ✓
     (herdado de `ButtonHTMLAttributes`), troca de ícone/rótulo por re-render ✓;
   - toggle de log: precisa adicionalmente de `aria-expanded` e `aria-controls` ✓ — ambos
     passam pelo spread de `ButtonHTMLAttributes` já suportado.
   Nenhum prop novo é necessário; `title`/tooltip não entram (G4 rejeitou tooltip como
   rótulo; o nome acessível vem do `aria-label`).
2. **`variant="quiet"`** (fundo/borda transparentes) — os botões vivem dentro de cards densos;
   quiet é o precedente do app para ações de navegação em série (`.destinationButton`).
   Fundo efetivo do glifo em repouso = `--surface` do painel.
3. **Nenhum estado de cor novo**: sem regra `:hover` nova (herda o padrão app-wide "sem hover
   distinto"); pressed/disabled/focus são os estados globais existentes do `.button`,
   inalterados. Feedback de interação = cursor pointer + pressed (`--surface-active`) +
   focus ring + a própria mudança de chip/ícone (feedback primário da spec).
4. **Auditoria por medição mesmo sem par novo** (mesma leitura do ADR-0002): repouso
   16.08–17.74:1, pressed 10.30–14.74:1, focus 5.98–17.03:1 nos 3 concepts
   (memory/contrast-audit.md B1/C1/E1). Hover ≡ repouso (nenhuma mudança de cor ⇒ nada a
   medir — resolução do R3). Disabled não embarca em P2.4 (a matriz status→ações REMOVE o
   botão em vez de desabilitá-lo) e é isento por WCAG 1.4.3/1.4.11; medido informativamente
   (4.33/3.00/3.06:1).

## Alternatives considered

- **Introduzir `:hover` com cor própria só nos icon buttons** — rejeitado: forka a gramática
  de interação do app (nenhum botão tem hover distinto), cria pares novos de auditoria sem
  ganho de affordance (os botões já são sempre visíveis por G4 — hover-reveal foi
  explicitamente rejeitado no grill).
- **Introduzir `:hover` app-wide em `.button`** — rejeitado nesta run: mudança fora do escopo
  declarado (toca todas as variantes × 3 concepts, auditoria e review próprios); se desejado,
  é run separada — P2.6 (micro-interações) é o slot natural.
- **`variant="secondary"` (fundo raised + borda)** — rejeitado: 2 caixas com borda por card
  adicionam ruído visual em listas densas e competem com o StatusChip; quiet mantém a
  hierarquia (chip = estado, ícones = ação).
- **Criar um componente de botão novo em vez da primitive morta** — rejeitado: o contrato da
  `IconButton` é exatamente o exigido (aria-label no tipo); duplicar seria dead code ao
  quadrado.

## Consequences

- R5 fechado no design: primeiro consumo real da `IconButton` sem mudança na primitive;
  qualquer gap residual apareceria no typecheck/testes da task, não em runtime.
- `.iconButton` (CSS) permanece como está (`padding: var(--space-2)`); os 44px mínimos do
  `.button` garantem alvo de toque/clique e altura consistente nos cards.
- Zero pares de cor novos no app inteiro para os botões — o gate de contraste desta feature
  fica limitado ao painel de log (ADR-0004) e à re-medição dos pares reusados.
- Se P2.6 introduzir hover/press-scale, a auditoria correspondente acontece lá (novo ADR),
  sem retrabalho aqui.
