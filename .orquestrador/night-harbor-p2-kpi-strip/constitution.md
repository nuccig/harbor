# Constitution — Harbor night-harbor-p2-kpi-strip

> Reutilizada da run night-harbor-p2-statuschip-nav (aprovada pelo usuário).
> Mudanças: artifacts_dir, branching (stack sobre P2 statuschip-nav / PR #5),
> componente-alvo em test_expectations (MetricTile + sparkline).

language:
  humanos: pt-BR
  codigo: English
  commits: English
  identificadores: English

stack:
  runtime: TypeScript + Node 20+
  desktop: Electron + node-pty
  frontend: React 18+ + Vite
  storage: SQLite + Drizzle ORM (better-sqlite3)
  credentials: OS keychain (keytar)
  distribution: electron-builder + GitHub Releases + electron-updater
  background: event loop main process; worker_threads for CPU-bound only
  test: vitest
  lint: eslint
  typecheck: tsc

branching: feat/<slug> (esta run: feat/night-harbor-p2-kpi-strip, stacked sobre feat/night-harbor-p2-statuschip-nav / PR #5; cadeia #2 ← #4 ← #5 ← #6)

commits: Conventional Commits

review: mandatory before merge

test_expectations:
  feature: verify gate green (lint + typecheck + test); testes existentes não regridem; componentes novos (MetricTile, sparkline-maré) cobertos por testes de render/acessibilidade; class asserts por substring e counts derivados de fixture (learning css-module-class-asserts); mudanças de cor passam por review numérico de contraste (WCAG 2.1 exato, por script — nunca aritmética LLM) — verify gate não detecta contraste; elementos gráficos (sparkline) medem non-text 3:1 contra o fundo efetivo composto

verify_gate:
  - npm run lint
  - npm run typecheck
  - npm run test

openwiki_gate:
  enabled_when: openwiki/ exists in repo root
  command: openwiki --update --print
  model: z-ai/glm-5.2
  on_fail: warn-only

artifacts_dir: .orquestrador/night-harbor-p2-kpi-strip/

issue_source: nucci-projects

boundaries:
  always:
    - rodar o verify_gate antes de reportar sucesso (nunca reportar PASS sem evidência)
    - commits só via controller (subagente nunca roda git)
    - respeitar o disjoint file scope declarado na task
    - review numérico de contraste para qualquer par de cor novo/alterado (sparkline e numeral de métrica inclusos; compor cor efetiva de tints/opacidades antes de medir)
  ask_first:
    - adicionar uma nova dependência (pacote/lib)
    - migração de schema (banco de dados, formato de dados persistido)
    - qualquer mudança fora do escopo declarado da task
  never:
    - push direto na default branch
    - editar arquivos fora do escopo disjunto da task
    - pular o verify_gate ou reportar sucesso sem rodá-lo
