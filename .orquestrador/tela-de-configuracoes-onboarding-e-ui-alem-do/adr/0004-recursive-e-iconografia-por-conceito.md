---
id: 0004
title: Recursive offline e iconografia atribuída por conceito
status: accepted
date: 2026-07-09
---

# ADR-0004 — Recursive offline e iconografia atribuída por conceito

## Context

A comparação precisa ser consistente offline e ainda permitir personalidades
tipográficas distintas. Iconografia estrutural deve ser vetorial e coerente, mas o
usuário aprovou duas famílias para ampliar a exploração. Misturar famílias dentro da
mesma camada reduziria coesão.

## Decision

Vendorizar Recursive Variable em WOFF2 com sua licença OFL, carregar localmente com
`font-display: swap` e variar eixos `CASL`, `MONO` e `wght` por conceito. Não haverá
fetch de fontes em runtime.

Adicionar `@phosphor-icons/react` e `iconoir-react`, com atribuição fixa:

- Command Deck usa Iconoir;
- Night Harbor usa Phosphor Regular;
- Signal Poster usa Phosphor Bold;
- o chrome separado do Design Lab usa Iconoir.

Uma camada não importa as duas famílias. A metáfora da ação permanece igual entre
conceitos; variam somente desenho e peso visual.

## Alternatives considered

- **Stacks do sistema** — menor bundle, mas aparência dependente do OS e menor controle
  dos três conceitos.
- **Uma única família de ícones** — máxima consistência, mas reduz a amplitude visual
  explicitamente solicitada.
- **Mistura livre por componente** — amplia opções localmente, mas destrói a linguagem
  coerente de cada proposta.

## Consequences

O bundle recebe um asset de fonte e duas dependências de ícones, mitigados por WOFF2 e
tree shaking. Licença OFL passa a acompanhar o asset. Review deve rejeitar imports da
família errada dentro de cada presenter e verificar nomes acessíveis de controles
icon-only.
