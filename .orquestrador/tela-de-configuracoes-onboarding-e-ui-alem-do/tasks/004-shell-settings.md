---
id: 004
title: Shell operacional e configurações compartilhadas
status: pending
depends_on: [001, 002]
covers: [AC-005, AC-006, AC-007, AC-011, AC-029, AC-030, AC-036]
ears_pattern: WHEN/THEN
created: 2026-07-09
---

# Task 004 — Shell operacional e configurações compartilhadas

## Goal

Entregar navegação, Overview, destinos e as cinco categorias de Settings sobre o mesmo
catálogo e conjunto de ações, incluindo feedback e orientação de foco.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/shell/**`
- `src/renderer/src/settings/**`
- `tests/renderer/shell-settings/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` — carregar ambas para arquitetura de informação,
densidade, navegação, settings e estados interativos.

## Steps

1. Criar shell com skip link, navegação persistente e os destinos `Overview`,
   `Projects`, `Sessions`, `Issues`, `Settings`, usando `aria-current`.
2. Montar Overview a partir do view model comum com cinco grupos nomeados: current
   project, active agent sessions, issue queue, recent usage e activity.
3. Criar conteúdo compartilhado pertinente para Projects, Sessions e Issues sem inventar
   integração real, fetch, polling ou capacidades nativas.
4. Criar Settings e categorias `General`, `Appearance & motion`, `Agents`,
   `Integrations`, `Notifications`, usando seleção semântica e drafts efêmeros.
   `Appearance & motion` deve despachar a ação compartilhada que abre/foca o mesmo Lab,
   sem importar ou duplicar o Design Lab.
5. Demonstrar ao menos uma ação simulada bem-sucedida que gere toast nomeado.
6. Após destino ou categoria mudar, focar o heading do conteúdo; manter navegação
   disponível e sequência de teclado previsível.
7. Testar todos os cinco destinos, todas as cinco categorias, current/selected, skip
   link, toast e foco em cada transição.

## Acceptance check

- [ ] Conclusão padrão do onboarding abre Overview e os cinco grupos operacionais estão
      presentes (AC-005).
- [ ] Overview, Projects, Sessions, Issues e Settings exibem conteúdo correspondente,
      current identificável e navegação persistente (AC-006: cinco branches).
- [ ] General, Appearance & motion, Agents, Integrations e Notifications exibem
      conteúdo correspondente e seleção identificável (AC-007: cinco branches).
- [ ] A ação simulada escolhida mostra toast coerente sem deslocar foco (AC-011).
- [ ] Cada um dos cinco destinos e cada uma das cinco categorias recebe orientação de
      foco após mudança; o skip link alcança o conteúdo principal (AC-030/036).
- [ ] `Appearance & motion` despacha abertura do Lab compartilhado, sem criar store ou
      painel alternativo.
- [ ] Todo texto renderizado pelos componentes possuídos está em inglês (AC-029).
- [ ] `npm run lint && npm run typecheck && npm run test` passa após a task.

## Context

Onboarding (task 003), shell/settings (esta task) e Design Lab (task 005) podem ser
implementados em paralelo após 001/002 porque seus scopes são disjuntos. Não importar
ícones específicos de conceito: slots e ações comuns serão decorados pelos presenters
na integração.

