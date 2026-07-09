---
id: 002
title: Primitives acessíveis e presenters de cenário compartilhados
status: pending
depends_on: [001]
covers: [AC-011, AC-018, AC-032]
ears_pattern: WHEN/THEN
created: 2026-07-09
---

# Task 002 — Primitives acessíveis e presenters de cenário compartilhados

## Goal

Entregar os controles e estados semânticos compartilhados, sem conhecimento de conceito,
para que onboarding, shell, settings e Design Lab usem o mesmo comportamento.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/ui/**`
- `src/renderer/src/scenarios/**`
- `tests/renderer/ui/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` — carregar ambas antes de implementar qualquer
primitive, feedback ou estado visual.

## Steps

1. Criar primitives nativas para botão, campo, status, skeleton, painel vazio/erro,
   heading focalizável, skip target, ícone semântico e toast; usar Base UI somente onde
   a semântica complexa realmente exigir.
2. Expor estado por texto e semântica: `disabled`, `role="status"`,
   `aria-live="polite"`, `role="alert"` e nomes acessíveis para icon-only. Ícones
   decorativos ficam `aria-hidden`.
3. Implementar presenters compartilhados para as quatro branches discriminadas:
   `ready/default` renderiza dados e ação; `loading` nomeia o conteúdo aguardado e
   desabilita somente ações incompatíveis; `empty` explica ausência e próxima ação ou
   adiamento; `error` nomeia causa e recuperação.
4. Implementar toast de sucesso coerente com o nome da ação, duração de quatro segundos
   controlável por fake timers, sem receber ou deslocar foco.
5. Garantir caixa mínima de 44×44 px para ações primárias via CSS Module local, estados
   de foco perceptíveis por mais que cor e ausência de controles revelados apenas por
   hover.
6. Testar por papel/nome/comportamento, inclusive clique, Enter e Espaço em controle
   desabilitado, anúncio de erro/status e preservação do elemento focado ao exibir toast.

## Acceptance check

- [ ] Uma ação de sucesso mostra texto correspondente em região `status`, o foco
      permanece no acionador e o toast some após quatro segundos (AC-011).
- [ ] Um controle `disabled` não executa callback por clique, Enter nem Espaço, e expõe
      indisponibilidade no DOM acessível (AC-018: três branches de input).
- [ ] `ready`, `loading`, `empty` e `error` possuem markup e mensagens distintas; loading
      não se anuncia como vazio/erro, e error possui ação de recuperação.
- [ ] Nomes, papéis, expansão/seleção/indisponibilidade aplicáveis e mensagens dinâmicas
      são consultáveis semanticamente, sem depender de cor (AC-032).
- [ ] `npm run lint && npm run typecheck && npm run test` passa após a task.

## Context

Consumir tipos e catálogo de `src/renderer/src/app/`; não duplicar fixtures nem ações.
Os CSS Modules desta task só podem consumir tokens semânticos, mesmo que os valores
globais sejam integrados mais tarde pela task 006. jsdom comprova comportamento e
semântica estrutural, não tamanho real, contraste ou foco visual.

