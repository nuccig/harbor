---
id: 003
title: Fluxo de onboarding compartilhado
status: pending
depends_on: [001, 002]
covers: [AC-001, AC-002, AC-003, AC-004, AC-014, AC-029, AC-030, AC-036]
ears_pattern: WHEN/THEN
created: 2026-07-09
---

# Task 003 — Fluxo de onboarding compartilhado

## Goal

Implementar a jornada de quatro etapas com drafts preservados, caminhos de adiamento,
conclusão preenchida/vazia e foco previsível, independente do conceito visual.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/onboarding/**`
- `tests/renderer/onboarding/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` — carregar ambas para hierarquia, navegação,
formulários, estados e acessibilidade da jornada.

## Steps

1. Criar a superfície e os componentes das etapas, consumindo somente provider, view
   model, ações e primitives compartilhadas.
2. Exibir em inglês `Welcome`, `Installed agents`, `Issue integrations` e
   `First project`, posição `N of 4`, e ações explícitas `Back`, `Continue` e `Skip`
   quando aplicáveis.
3. Preservar drafts ao avançar, voltar e trocar conceito. Skip de agents e integrations
   marca apenas o item correspondente, informa que pode ser concluído depois e mantém
   `Continue`.
4. Tratar separadamente First project preenchido e adiado: o primeiro prepara os dados
   default; o segundo conclui para o shell com o sinal de vazio útil.
5. Após mudança de etapa, focar o novo heading com `tabIndex=-1`, mantendo ordem DOM
   coerente e todas as ações alcançáveis por teclado.
6. Testar a sequência completa em ida/volta, cada branch de skip e a ausência de perda
   das escolhas simuladas.

## Acceptance check

- [ ] Sessão nova mostra `Welcome`, `1 of 4` e ação de avanço (AC-001).
- [ ] Ida e volta percorrem exatamente Welcome → Installed agents → Issue integrations
      → First project e preservam cada valor alterado (AC-002/014).
- [ ] Skip em Installed agents informa adiamento e permite continuar; Skip em Issue
      integrations faz o mesmo sem alterar a escolha de agents (AC-003: duas branches).
- [ ] First project preenchido conclui com dados default; First project adiado conclui
      com estado vazio útil e orientação para adicionar projeto (AC-004: duas branches).
- [ ] Back, Continue, os três skips e controles de draft funcionam por teclado em ordem
      coerente, sem trap (AC-030).
- [ ] Cada mudança entre as quatro etapas encaminha foco ao heading correspondente
      (AC-036: forward e backward).
- [ ] Todo texto renderizado pelos componentes possuídos está em inglês (AC-029).
- [ ] `npm run lint && npm run typecheck && npm run test` passa após a task.

## Context

Não criar estado local que replique o reducer. A conclusão dispara a ação compartilhada;
a montagem efetiva de Overview será integrada na task 006. Os componentes devem expor
slots semânticos para os layouts, sem importar qualquer concept presenter ou família de
ícones diretamente.

