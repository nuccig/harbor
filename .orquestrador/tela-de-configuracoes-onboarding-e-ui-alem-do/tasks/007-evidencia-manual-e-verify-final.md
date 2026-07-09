---
id: 007
title: Evidência manual rastreável e verify final
status: done
depends_on: [006]
covers: [AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030, AC-031, AC-032, AC-033, AC-034, AC-035, AC-036, AC-037, AC-038]
ears_pattern: AFTER/THEN
created: 2026-07-09
---

# Task 007 — Evidência manual rastreável e verify final

## Goal

Executar a demonstração em Electron real, registrar evidência manual individual dos 38
ACs e fechar o verify gate sem atribuir a Vitest provas visuais que ela não fornece.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `.orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/evidence/issue-29-manual-verification.md`
- `.orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/evidence/screenshots/issue-29/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` para a avaliação visual; `sdd-verify` para exigir
evidência fresca antes do PASS. Esta task não possui source code e não corrige falhas:
qualquer reprovação deve ser registrada e devolvida para remediation no arquivo owner.

## Steps

1. Criar o relatório com uma linha explícita para cada `AC-001` até `AC-038`, contendo
   status PASS/FAIL, data/hora, viewport/preferência, procedimento, resultado observado
   e link para captura ou nota. Não agrupar ACs de modo que algum fique sem resultado.
2. Rodar Electron em 1440×900 e capturar onboarding, Overview e Settings nos três
   conceitos com exatamente o mesmo estado Default.
3. Rodar 1024×700 para 3 conceitos × 3 superfícies × 4 cenários, com Lab aberto e
   recolhido onde aplicável; verificar clipping, sobreposição, ações alcançáveis e
   ausência de scroll horizontal. Registrar todas as branches `Default`, `Loading`,
   `Empty`, `Error`, não apenas uma amostra.
4. Percorrer apenas por teclado Back/Skip/Continue; cinco destinos; cinco categorias;
   conceito/cenário; quatro sliders; favorita; recovery; Escape e retorno de foco.
5. Inspecionar árvore acessível/leitor disponível: nomes, papéis, current, selected,
   expanded, disabled, alert, status/toast e headings focalizados.
6. Repetir com reduced motion: confirmar ausência de NightAmbient, transições
   simplificadas e conteúdo/causalidade preservados.
7. Medir contraste dos pares tokenizados, foco visível e caixas reais das ações primárias
   (>=44×44 px) em cada conceito. Registrar ferramenta e valores, não impressão visual.
8. Testar Night Harbor com WebGPU e fallback WebGL2 quando disponíveis; forçar backend
   indisponível para verificar fallback CSS, canvas único, ausência de cursor trail,
   pointer interception e desmontagem ao trocar de conceito.
9. Alterar drafts/ratings/favorita, recarregar e comprovar reset sem alegação de
   persistência. Validar o toast sem deslocamento de foco.
10. Executar evidência fresca de `npm run lint`, `npm run typecheck`, `npm run test` e
    `npm run build`; registrar comandos, timestamps e resultados no relatório.

## Acceptance check

- [ ] O relatório contém exatamente 38 linhas rastreáveis, AC-001…AC-038, sem órfãos e
      sem status inferido apenas de teste automatizado.
- [ ] AC-001–AC-018 têm observação manual de fluxo/estado; AC-019–AC-021 têm comparação
      nas três superfícies; AC-022–AC-025 registram separadamente onboarding, shell e
      settings para Default/Loading/Empty/Error.
- [ ] AC-026–AC-035 registram reduced motion, 1024×700, 1440×900, inglês, teclado, foco,
      semântica, 44×44, shader e separação do Lab com evidência adequada.
- [ ] AC-036 registra foco após etapa, cada destino e cada categoria; AC-037 registra a
      matriz de montagem sem tela branca; AC-038 registra favorita, conceito ativo e
      reset após reload.
- [ ] As 36 combinações de conceito × superfície × cenário foram checadas em 1024×700,
      e as nove comparações Default em 1440×900 possuem captura rastreável.
- [ ] Lab aberto e recolhido foram checados em 1024×700; quatro sliders cobrem Setas,
      Home/End e anúncio de valor.
- [ ] O relatório distingue claramente evidência automatizada de inspeção humana e não
      afirma que jsdom/Vitest provou layout, contraste, motion, GPU ou hit target.
- [ ] Gate fresco `npm run lint && npm run typecheck && npm run test` e `npm run build`
      está PASS, ou a task termina FAIL com logs e ACs afetados identificados.

## Context

Todos os 38 ACs têm `requires-manual-verify: true`; portanto teste verde não autoriza
marcá-los como aprovados. Use o roteiro de `plan.md`, **Manual verification**, e a matriz
da spec. Screenshots devem usar nomes estáveis contendo AC, conceito, superfície,
cenário e viewport. Não editar source para “ajustar durante a inspeção”; isso violaria
file ownership e exige uma rodada de correção própria.
