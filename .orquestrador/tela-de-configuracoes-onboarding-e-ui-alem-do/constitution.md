# Constitution — Harbor tela-de-configuracoes-onboarding-e-ui-alem-do

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

branching: feat/<slug>

commits: Conventional Commits

review: mandatory before merge

test_expectations:
  feature: verify gate green (lint + typecheck + test); automated coverage for settings and onboarding behaviors defined by the approved spec; smoke check that the affected renderer screens mount

verify_gate:
  - npm run lint
  - npm run typecheck
  - npm run test

# openwiki_gate — opt-in por repo. Harbor não tem openwiki/ → no-op.
openwiki_gate:
  enabled_when: openwiki/ exists in repo root
  command: openwiki --update --print
  model: z-ai/glm-5.2
  on_fail: warn-only

artifacts_dir: .orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/

issue_source: nucci-projects

boundaries:
  always:
    - rodar o verify_gate antes de reportar sucesso (nunca reportar PASS sem evidência)
    - commits só via controller (subagente nunca roda git)
    - respeitar o disjoint file scope declarado na task
  ask_first:
    - adicionar uma nova dependência (pacote/lib)
    - migração de schema (banco de dados, formato de dados persistido)
    - qualquer mudança fora do escopo declarado da task
  never:
    - push direto na default branch
    - editar arquivos fora do escopo disjunto da task
    - pular o verify_gate ou reportar sucesso sem rodá-lo
