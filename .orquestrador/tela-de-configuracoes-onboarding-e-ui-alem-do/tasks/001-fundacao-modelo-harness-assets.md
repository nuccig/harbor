---
id: 001
title: Fundação de dependências, modelo efêmero, harness e assets
status: pending
depends_on: []
covers: [AC-008, AC-009, AC-010, AC-014, AC-015, AC-016, AC-038]
ears_pattern: GIVEN/WHEN/THEN
created: 2026-07-09
---

# Task 001 — Fundação de dependências, modelo efêmero, harness e assets

## Goal

Instalar a fundação renderer-only e entregar o modelo de sessão, catálogo, seletores,
harness jsdom seletivo e fonte local sobre os quais todas as superfícies serão montadas.

## File scope (disjoint)

Files this task owns — must not overlap with a parallel task:

- `package.json`
- `package-lock.json`
- `vitest.config.ts`
- `src/renderer/src/app/**`
- `src/renderer/src/assets/fonts/RecursiveVariable.woff2`
- `src/renderer/src/assets/fonts/OFL.txt`
- `tests/renderer/setup.ts`
- `tests/renderer/model/**`

## Governing skill

none — configuração React/TypeScript e modelo puro; não há decisão visual nesta task.
Não carregar `harbor-electron-build`: `electron.vite.config.ts` não pertence ao escopo.

## Steps

1. Adicionar exatamente as dependências runtime aprovadas (`motion`, `shaders`,
   `@base-ui/react`, `@phosphor-icons/react`, `iconoir-react`) e as quatro
   devDependencies de Testing Library/jsdom; gerar o lockfile com o gerenciador do
   projeto. Não adicionar `framer-motion`, `lucide-react`, router ou store externo.
2. Configurar Vitest para que apenas `tests/renderer/**/*.test.ts(x)` use jsdom e
   `tests/renderer/setup.ts`; preservar `tests/smoke.test.ts` no ambiente Node e em seu
   caminho atual, sem editar o smoke native.
3. Vendorizar um WOFF2 oficial de Recursive Variable e a licença OFL correspondente,
   sem fetch de fonte em runtime. Registrar origem e versão em comentário curto no
   arquivo de licença se isso não alterar o texto da licença.
4. Implementar em `src/renderer/src/app/` os identificadores fechados, estado inicial,
   reducer discriminado, Contexts separados, hooks, catálogo inglês imutável,
   `ScenarioSlice<T>`, seletores e o helper seguro de movimento reduzido descritos no
   plano e ADRs 0001/0002.
5. Modelar explicitamente a abertura do Design Lab e os drafts necessários, mantendo o
   Lab removível e sem persistência. Rejeitar ratings fracionários ou fora de 0–10.
6. Cobrir reducer/seletores com testes puros: troca entre os três conceitos; troca entre
   `default`, `loading`, `empty`, `error`; ratings independentes para os quatro metrics;
   favorita sem alterar conceito; preservação de onboarding/destino/categoria/dados; e
   reset ao criar uma nova instância/provider.
7. Buscar estaticamente e garantir ausência de `localStorage`, `sessionStorage`,
   cookies, query string, fetch, IPC ou APIs Node nos arquivos possuídos.

## Acceptance check

- [ ] `npm install` resolve somente os nove pacotes aprovados e `package-lock.json`
      registra a mesma resolução.
- [ ] `tests/smoke.test.ts` continua incluído em Node e não foi movido nem editado.
- [ ] Selecionar cada um de `command-deck`, `night-harbor` e `signal-poster` preserva,
      separadamente, passo, destino, categoria, cenário, drafts e dados (AC-008/014).
- [ ] Selecionar cada branch `default`, `loading`, `empty` e `error` preserva conceito e
      navegação (AC-009).
- [ ] Atualizar `clarity`, `personality`, `density` e `motion` em cada conceito aceita
      apenas inteiros 0–10 e mantém os valores ao navegar/trocar conceito (AC-010/015).
- [ ] Escolher cada proposta como favorita não troca o conceito ativo nem cria estado
      canônico/persistente (AC-038).
- [ ] Remontar uma nova sessão restaura `welcome`, `command-deck`, `default`, drafts
      iniciais, assessments vazios e favorita nula (AC-016).
- [ ] `npm run lint && npm run typecheck && npm run test` passa neste ponto, incluindo o
      smoke native existente.

## Context

Seguir `plan.md` em **Data & contracts** e ADRs 0001, 0004 e 0005. Os ids internos são
literais fechados e não sofrem transformação externa. A configuração seletiva pode usar
file directives ou projects do Vitest, mas não pode transformar o ambiente global em
jsdom. Esta task é a owner única de package/config/lockfile e dos assets/licenças.

