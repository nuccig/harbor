---
id: 006
title: Conceitos visuais, integração da raiz e matriz de estados
status: done
depends_on: [003, 004, 005]
covers: [AC-008, AC-009, AC-012, AC-013, AC-017, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030, AC-031, AC-032, AC-033, AC-034, AC-035, AC-037]
ears_pattern: WHERE/WHEN/THEN
created: 2026-07-09
---

# Task 006 — Conceitos visuais, integração da raiz e matriz de estados

## Goal

Integrar o fluxo completo em três layouts finos e distintos, aplicar tokens/motion/shader
degradável e provar por smoke comportamental a paridade de superfícies e cenários.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `src/renderer/src/App.tsx`
- `src/renderer/src/main.tsx`
- `src/renderer/src/concepts/**`
- `src/renderer/src/styles/**`
- `tests/renderer/integration/**`

## Governing skill

`ui-ux-pro-max` e `frontend-design` — carregar ambas antes de desenhar tokens, layouts,
tipografia, motion e responsividade. `harbor-electron-build` não se aplica porque
`electron.vite.config.ts` permanece intocado; não carregar `harbor-electron-ipc`.

## Steps

1. Criar registry e três `ConceptLayout` finos que recebem os mesmos slots nomeados,
   ordem DOM, view model e catálogo de ações; presenters não possuem estado nem ações.
2. Implementar Command Deck claro/denso com Iconoir, Night Harbor escuro/modular com
   Phosphor Regular e Signal Poster preto/lavanda/editorial com Phosphor Bold. Proibir
   mistura de famílias dentro da mesma camada.
3. Criar reset, `@font-face` local com `font-display: swap`, tokens semânticos, temas,
   motion e regras de capacidade para 1024×700 e 1440×900. Componentes continuam sem
   hex/radius/shadow hardcoded. Foco deve ser visível além de cor; ações primárias usam
   mínimo 44×44 px.
4. Modificar `main.tsx` somente para importar estilos globais e manter StrictMode.
   Modificar `App.tsx` como owner única para montar provider, `MotionConfig
   reducedMotion="user"`, Design Lab, superfície corrente, toast e root
   `data-testid="harbor-root"`.
5. Implementar `NightAmbient` lazy com um único generator/canvas de `shaders/react`,
   `aria-hidden`, `pointer-events:none`, atrás do conteúdo, sem dados/cursor trail.
   Não montar sob reduced motion; desmontar fora do conceito; manter fallback CSS
   estático se WebGPU/WebGL2 falhar.
6. Implementar transições nos limites do plano usando transform/opacity, no máximo dois
   elementos concorrentes, sem bloquear input; aplicar media query reduce como segunda
   barreira.
7. Criar teste parametrizado de montagem para 3 conceitos × 3 superfícies (onboarding,
   Overview, Settings) × 4 cenários. Em cada célula verificar root, conteúdo esperado,
   navegação/saída segura, Lab e ausência de erro não tratado.
8. Testar recuperação de Error separadamente em onboarding, shell e settings; cada uma
   volta a Default preservando conceito/navegação. Testar Loading separadamente nas três
   superfícies com progresso, ação incompatível disabled e Lab/saída segura acessível.
9. Testar paridade de slots, conteúdo, controles, ações, disabled e resultados entre os
   três conceitos no mesmo ponto. Testar troca visual via Lab sem perda do contexto.
10. Executar build e inspecionar bundle: shader em chunk lazy; fonte local; ausência de
    fetch de fonte, `lucide-react` e package Framer separado.

## Acceptance check

- [ ] A matriz 3 conceitos × onboarding/Overview/Settings ×
      Default/Loading/Empty/Error monta 36 células com root, conteúdo e Lab (AC-037).
- [ ] Em cada uma das três superfícies, Default mostra conteúdo preenchido e ações;
      Loading nomeia espera sem parecer vazio/erro; Empty explica ausência e próxima
      ação/adiamento; Error nomeia falha e recuperação/saída (AC-022–025: 12 branches).
- [ ] Recuperar Error em onboarding, shell e settings retorna a estado utilizável e
      mantém navegação disponível (AC-012: três branches).
- [ ] Loading em onboarding, shell e settings mostra progresso, desabilita ações
      incompatíveis e mantém Lab/saída segura (AC-017: três branches).
- [ ] No mesmo estado, Command Deck, Night Harbor e Signal Poster expõem exatamente os
      mesmos slots, conteúdo, controles, ações, disabled e resultados (AC-013).
- [ ] Onboarding, Overview e Settings exibem a assinatura própria de Command Deck;
      as mesmas três superfícies exibem a de Night Harbor; e as mesmas três exibem a de
      Signal Poster (AC-019/020/021: nove branches, com inspeção manual pendente).
- [ ] Reduced motion impede montagem do NightAmbient e simplifica transições sem remover
      conteúdo; preferência normal permite somente o ambiente Night Harbor (AC-026).
- [ ] CSS contém regras explícitas para 1024×700 sem horizontal overflow e 1440×900 com
      cinco grupos legíveis; não alegar que jsdom comprova layout (AC-027/028).
- [ ] Foco, semântica, idioma, 44×44, separação do Lab e ambiente não informacional estão
      implementados em todos os temas; sua prova visual fica reservada à task 007
      (AC-029–035).
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` passa; o
      smoke native original permanece verde.

## Context

Serial Lock: esta integração importa arquivos ainda inexistentes das tasks 003–005 e só
pode iniciar após todas pousarem. Seguir ADR 0002/0004 e a seção **Presentation system**.
Não editar package/config/assets (owner 001), nem qualquer arquivo main/preload/IPC.
Vitest não prova layout, contraste, GPU, hit targets ou qualidade de motion.
