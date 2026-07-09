---
id: 005
title: Dock lateral do Design Lab
status: done
depends_on: [001, 002]
covers: [AC-008, AC-009, AC-010, AC-015, AC-030, AC-032, AC-035, AC-038]
ears_pattern: WHEN/THEN
created: 2026-07-09
---

# Task 005 — Dock lateral do Design Lab

## Goal

Implementar o Lab removível em rail/painel lateral, com conceito, cenário, avaliações e
favorita operáveis e preservados no modelo compartilhado.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/design-lab/**`
- `tests/renderer/design-lab/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` — carregar ambas para dock responsivo, sliders,
hierarquia de ferramenta experimental, foco e feedback.

## Steps

1. Implementar rail de 88 px e painel de 320 px em coluna própria. O rail recolhido
   mostra `Lab`, nome curto (`Deck`, `Night`, `Signal`) e cenário atual em texto.
2. Expor trigger com `aria-expanded`/`aria-controls`; Escape recolhe o painel e devolve
   foco ao trigger. A ação externa de Appearance & motion abre e foca este mesmo painel.
3. Implementar controles dos três conceitos e das quatro branches de cenário, sempre
   despachando ações do provider sem alterar navegação/drafts.
4. Implementar sliders Base UI para `Clarity`, `Personality`, `Density`, `Motion`, com
   inteiro 0–10, step 1, label/valor/extremos visíveis e ARIA completo. Setas mudam um;
   Home/End selecionam 0/10.
5. Implementar favorita associada à avaliação sem trocar o conceito ativo e sem texto
   que sugira escolha canônica ou persistência.
6. Usar Iconoir exclusivamente no chrome do Lab e nunca importar Phosphor neste módulo.
7. Testar abertura externa, expand/collapse, Escape/foco, teclado dos quatro sliders,
   preservação por conceito e favorita independente.

## Acceptance check

- [ ] Cada troca Command Deck/Night Harbor/Signal Poster preserva passo, destino,
      categoria, cenário e drafts; a abertura por Appearance & motion usa o mesmo painel
      (AC-008: quatro entry branches).
- [ ] Cada troca Default/Loading/Empty/Error mantém o conceito e apresenta o valor
      corrente no rail (AC-009: quatro branches).
- [ ] Cada um dos quatro sliders responde a ArrowDown/ArrowUp por 1 e Home/End por 0/10,
      anuncia label/valor e mantém nota ao navegar/trocar conceito (AC-010/015/030/032).
- [ ] O rail aberto e recolhido continua identificável como ferramenta separada e mostra
      conceito/cenário em texto (AC-035: duas branches).
- [ ] Escape recolhe e devolve foco ao gatilho; não há trap de foco (AC-030).
- [ ] Favoritar cada proposta a identifica sem mudar conceito, persistir ou declarar
      direção canônica (AC-038: três branches).
- [ ] Nenhum arquivo possuído importa `@phosphor-icons/react`.
- [ ] `npm run lint && npm run typecheck && npm run test` passa após a task.

## Context

Seguir ADR 0003. O reflow e a ausência de sobreposição em pixels serão implementados e
inspecionados com os estilos globais na task 006 e comprovados manualmente na task 007;
jsdom só deve provar estado, teclado, foco e semântica.
