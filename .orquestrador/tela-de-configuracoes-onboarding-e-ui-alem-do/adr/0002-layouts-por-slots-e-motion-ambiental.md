---
id: 0002
title: Layouts por slots e motion ambiental limitado
status: accepted
date: 2026-07-09
---

# ADR-0002 — Layouts por slots e motion ambiental limitado

## Context

Os três conceitos precisam compartilhar conteúdo, controles e resultados, mas devem
diferir de forma perceptível em composição, hierarquia e motion. Uma árvore idêntica
limitada a recoloração seria pouco expressiva; três telas completas repetiriam JSX e
abririam espaço para drift funcional. Night Harbor também pede continuidade espacial e
um ambiente autoral, sem transformar efeito visual em informação ou custo permanente.

## Decision

Usar componentes funcionais compartilhados e três layouts finos que recebem slots
nomeados. O view model, as ações e a ordem semântica são únicos; cada layout posiciona
slots sem reimplementar comportamento.

CSS Modules e custom properties formam o sistema de estilos. `@base-ui/react` fornece
somente primitives complexas sem estilo. CSS cobre estados simples; o pacote `motion`,
via `motion/react`, cobre presença e layout. A raiz usa
`MotionConfig reducedMotion="user"` e componentes consultam `useReducedMotion`.

Night Harbor pode montar um único generator barato de `shaders/react` em uma camada lazy,
atrás do conteúdo, `aria-hidden` e `pointer-events: none`. Não haverá cursor trail nem
dados codificados no shader. A camada não monta sob reduced motion, fica invisível e é
desmontada fora do conceito, usa WebGPU com fallback WebGL2 oferecido pela biblioteca e
mantém fallback CSS estático.

## Alternatives considered

- **Uma árvore variada apenas por CSS** — maximiza paridade, mas limita a hierarquia dos
  conceitos e tende a produzir três skins do mesmo dashboard.
- **Três apresentadores completos** — amplia liberdade, mas duplica markup e facilita
  divergência de controles, estados e foco.
- **Somente CSS para toda animação** — suficiente para microinterações, menos adequado
  para presença/layout coordenados entre contextos.
- **Shader global ou interativo** — desperdiça GPU e bundle, compete com conteúdo e cria
  comportamento sem relação com o objetivo comparativo.

## Consequences

Os layouts podem ser visualmente distintos sem possuir estado ou ações próprios. Testes
devem garantir os mesmos slots e controles em cada conceito. Motion e shader adicionam
dependências runtime e exigem verificação real de GPU, reduced motion, lazy loading e
fallback. O ambiente Night Harbor é degradável e removível; conteúdo e navegação não
dependem dele.
