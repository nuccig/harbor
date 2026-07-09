---
id: 0001
title: Modelo de sessão efêmero e compartilhado no renderer
status: accepted
date: 2026-07-09
---

# ADR-0001 — Modelo de sessão efêmero e compartilhado no renderer

## Context

A demonstração precisa preservar navegação, escolhas simuladas, conceito, cenário,
avaliações e favorita enquanto a aplicação permanece aberta, mas deve reiniciar tudo
após reload. Os três conceitos precisam executar exatamente as mesmas ações sobre os
mesmos dados. O projeto já dispõe de React, enquanto persistência, roteamento profundo,
IPC e novas capacidades nativas estão fora do escopo.

## Decision

Manter um único modelo de sessão no renderer, inicializado a cada montagem da raiz e
implementado com `useReducer` e Context do React. O reducer será a única autoridade para
transições do fluxo; conteúdo simulado e seletores derivados permanecerão separados do
estado mutável. Conceitos visuais consumirão o mesmo estado, view model e catálogo de
ações.

Não haverá escrita em `localStorage`, `sessionStorage`, URL, SQLite ou preload. A
navegação da demonstração também será estado tipado do React, sem adicionar um roteador,
pois não existem requisitos de deep link ou histórico do navegador nesta issue.

## Alternatives considered

- **Vários `useState` distribuídos pelas telas** — aumenta o risco de perder estado ao
  trocar de conceito ou remontar uma área e torna as transições difíceis de testar.
- **Store externo** — seria válido em uma aplicação maior, mas adicionaria dependência e
  superfície conceitual sem necessidade para um único grafo de sessão.
- **URL ou armazenamento do navegador** — facilitaria restauração, porém violaria o reset
  após reload e aproximaria o protótipo de persistência explicitamente excluída.

## Consequences

As invariantes de equivalência e preservação podem ser testadas diretamente no reducer,
e os apresentadores visuais não precisam conhecer regras de negócio. A raiz poderá
rerenderizar quando o estado global mudar; isso é aceitável para o volume pequeno de
dados simulados, com Contexts de estado e dispatch separados para limitar acoplamento.
Uma futura aplicação persistente deverá substituir ou hidratar este modelo em outra
decisão, sem reutilizar acidentalmente o Design Lab como arquitetura permanente.
