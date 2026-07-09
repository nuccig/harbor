---
id: 0003
title: Design Lab em dock lateral com escala de zero a dez
status: accepted
date: 2026-07-09
---

# ADR-0003 — Design Lab em dock lateral com escala de zero a dez

## Context

O Design Lab precisa permanecer alcançável e separado da navegação do Harbor em todas as
telas. Mesmo recolhido, deve indicar conceito e cenário. Ao abrir em 1024×700, não pode
cobrir ações. As quatro avaliações precisam ser persistidas apenas durante a sessão e
operáveis por teclado e tecnologia assistiva.

## Decision

Usar um dock lateral que ocupa uma coluna própria: rail de 88 px recolhido e painel de
320 px aberto. O produto reflowa para um layout compacto em vez de ser sobreposto. O
rail mostra `Lab`, nome curto do conceito e cenário corrente em texto.

Cada avaliação usa Slider de Base UI com valores inteiros de 0 a 10, passo 1, label e
valor visíveis, rótulos de extremos e semântica ARIA completa. Setas mudam um ponto;
Home/End selecionam 0/10. Escape recolhe o dock e devolve o foco ao gatilho.
`Appearance & motion` abre o mesmo painel.

## Alternatives considered

- **Utility rail superior** — comunica bem o estado, mas consome altura em todas as
  telas e foi rejeitado em favor do dock.
- **Dock sobreposto** — preserva a largura do produto, mas cobriria conteúdo ou exigiria
  modalidade desnecessária.
- **Radio group 1–5** — mais simples, porém oferece menos granularidade que a escala
  escolhida.

## Consequences

O viewport útil fica mais estreito com o painel aberto; os módulos devem empilhar e usar
scroll vertical sem esconder ações. O rail consome 88 px permanentemente. Testes cobrem
teclado, foco, valor anunciado, preservação por conceito e os dois estados do dock em
1024×700.
