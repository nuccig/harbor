---
id: 0005
title: Harness de testes React com Testing Library e jsdom
status: accepted
date: 2026-07-09
---

# ADR-0005 — Harness de testes React com Testing Library e jsdom

## Context

A constitution exige cobertura automatizada de onboarding/settings e smoke de montagem.
O Vitest atual executa em Node porque o smoke existente lança Electron e addons nativos.
Testes de comportamento React precisam de DOM sem alterar o ambiente do smoke native.

## Decision

Adicionar como devDependencies `jsdom`, `@testing-library/react`,
`@testing-library/user-event` e `@testing-library/jest-dom`. Testes em
`tests/renderer/` usam jsdom e setup de jest-dom; o smoke Electron existente permanece
em Node. Interações são verificadas por papel, nome e comportamento observável.

Não adicionar Playwright nesta issue.

## Alternatives considered

- **jsdom com utilitários de `react-dom`** — menos dependências, porém exigiria helpers
  próprios e incentivaria assertions de implementação.
- **Playwright agora** — cobriria browser real, mas ADR 0009 o mantém opcional até uma
  superfície estável e a inspeção visual desta issue continua humana.
- **Mover todo Vitest para jsdom** — poderia interferir no smoke native e mascarar o
  ambiente real de Electron.

## Consequences

Quatro pacotes entram apenas no ambiente de desenvolvimento. A configuração de ambiente
precisa ser seletiva. jsdom não prova layout, GPU, contraste, hit targets ou motion;
esses itens continuam no roteiro manual em Electron.
