---
title: scaffold-inicial
status: draft
created: 2026-07-08
---

# Spec — scaffold-inicial

## Problem

Harbor tem ADRs e um agent contract definidos, mas nenhum código executável. Sem um scaffold funcional (deps instaladas, configs wired, app mínimo que sobe), nenhum trabalho de feature pode começar — o verify gate (`npm run lint && npm run typecheck && npm run test`) não tem nada para rodar sobre.

## Users & job to be done

- **Desenvolvedor (owner do projeto)**: quer clonar o repo, rodar `npm install` + `npm run dev` e ver o Electron abrir com o renderer React montado, o SQLite aberto e o keychain acessível — tudo verde no verify gate — para então começar a construir features de domínio sobre essa base.

## Scope

**In:**
- `package.json` com todas as deps declaradas nos ADRs (Electron, node-pty, React, Vite, better-sqlite3, drizzle-orm, keytar, electron-builder, electron-updater) + dev deps (TypeScript, ESLint, Vitest, electron-rebuild, @types/*).
- Configs: `tsconfig.json` (com refs para main/renderer), ESLint config, Vitest config, Vite config, electron-builder config.
- Estrutura de diretórios mínima para separar main process / renderer / shared / drizzle.
- Electron main process que abre uma janela e carrega o renderer (dev: Vite HMR; prod: bundle buildado).
- Renderer React que monta um placeholder mínimo (prova que o pipeline Vite→React→Electron funciona ponta a ponta).
- Módulo de conexão SQLite + Drizzle que abre `harbor.db` e aplica `PRAGMA journal_mode=WAL` (precedent nucci-projects; preemptivo pois worker_threads podem abrir conexões próprias).
- Módulo wrapper do keytar (get/set/delete por service+account) — sem credenciais hardcoded, apenas a interface estável.
- Wiring do `electron-rebuild` para os três native addons (node-pty, better-sqlite3, keytar).
- npm scripts do TASKS.md tornados funcionais: `lint`, `typecheck`, `test`, `build`, `build:app`, `dev`, `app`.
- Smoke check automatizado (vitest): main process carrega, renderer monta, SQLite abre em WAL, keytar lê sem erro quando não há credencial.

**Out (explicit non-goals):**
- Qualquer feature de domínio: PTY terminals interativos, sync de issues (Linear/GitHub/nucci-projects), kanban, tracking de consumo de tokens, notificações.
- Schemas de domínio / tabelas de negócio (apenas a infraestrutura de migrations do Drizzle; nenhuma tabela de produto).
- Pipeline de CI (GitHub Actions) — adiando para quando houver algo para buildar e publicar.
- Builds assinados/notarizados (ADR 0007: futuro ADR quando houver Apple Dev cert).
- Playwright/E2E (ADR 0009: YAGNI até haver UI estável).
- Multi-perfil / RBAC (ADR 0006: não é v1).
- Worker threads com lógica real (ADR 0008: opt-in só quando houver UI freeze mensurável).
- Tela de configurações, onboarding, ou qualquer UI além do placeholder mínimo.

## Acceptance criteria

Cada critério recebe um ID único e sequencial `AC-NNN` (numeração contínua entre todas as seções).

### Event-driven (WHEN/THEN)

- [ ] **AC-001** — **WHEN** o desenvolvedor executa `npm install` no repo clonado **THEN** todas as deps são instaladas e os três native addons (node-pty, better-sqlite3, keytar) são reconstruídos contra a versão do Electron via `electron-rebuild` (sem erro de ABI mismatch).
- [ ] **AC-002** — **WHEN** o desenvolvedor executa `npm run lint` **THEN** o ESLint roda sobre o codebase e finaliza com exit code 0.
- [ ] **AC-003** — **WHEN** o desenvolvedor executa `npm run typecheck` **THEN** `tsc --noEmit` finaliza com exit code 0.
- [ ] **AC-004** — **WHEN** o desenvolvedor executa `npm run test` **THEN** `vitest run` finaliza com exit code 0 e o smoke check passa.
- [ ] **AC-005** — **WHEN** o desenvolvedor executa `npm run dev` **THEN** o Electron main process inicia e abre uma janela carregando o renderer React em modo HMR do Vite.
- [ ] **AC-006** — **WHEN** o renderer monta na janela do Electron **THEN** o root React renderiza um elemento placeholder visível.
- [ ] **AC-007** — **WHEN** o desenvolvedor executa `npm run build` **THEN** o Vite produz o bundle do renderer sem erros.
- [ ] **AC-008** — **WHEN** o main process do Electron inicializa **THEN** ele registra um canal IPC stub (presente e tipado, ainda que sem lógica de domínio).

### Stateful (GIVEN/WHEN/THEN)

- [ ] **AC-009** — **GIVEN** um ambiente sem `harbor.db` existente **WHEN** o main process inicializa **THEN** o SQLite cria o arquivo, abre a conexão via better-sqlite3 e aplica `PRAGMA journal_mode=WAL`.
- [ ] **AC-010** — **GIVEN** nenhuma credencial armazenada para um dado service+account **WHEN** o wrapper do keytar executar `get` **THEN** retorna `null` sem lançar erro.
- [ ] **AC-011** — **GIVEN** uma credencial gravada via `set` **WHEN** o wrapper executar `get` para o mesmo service+account **THEN** retorna o valor gravado.

### Post-condition (AFTER/THEN)

- [ ] **AC-012** — **AFTER** o scaffold estar completo **THEN** o verify gate completo (`npm run lint && npm run typecheck && npm run test`) finaliza verde em uma única execução encadeada.
- [ ] **AC-013** — **AFTER** `npm run build` concluir **THEN** o Electron main process em modo produção (`npm run app`) abre a janela carregando o bundle buildado (não o Vite dev server).

## Open questions

- Onde `harbor.db` deve residir em dev vs prod? (caminho do `app.getPath('userData')` em prod é padrão Electron; em dev, dentro do repo ou em userData? — decisão de plan, não de spec.)
- `contextIsolation: true` + preload script é mandatório desde o scaffold, ou pode começar com `nodeIntegration` em dev e migrar depois? (Segurança: o lazy path é começar certo; mas a decisão de arquitetura de IPC pertence ao plan stage.)
- Integração Vite+Electron: usar um plugin consolidado (ex. `electron-vite`) ou orquestrar manualmente Vite dev server + `electron .`? — decisão de plan.

## References

- ADR 0002 — TypeScript + Node 20+ (runtime/linguagem)
- ADR 0003 — Electron + node-pty (desktop framework)
- ADR 0004 — React 18+ + Vite (frontend)
- ADR 0005 — SQLite + Drizzle ORM + better-sqlite3 (storage)
- ADR 0006 — keytar no OS keychain, sem app auth (credentials)
- ADR 0007 — electron-builder + GitHub Releases + electron-updater (distribution)
- ADR 0008 — event loop main process + worker_threads opt-in (background)
- ADR 0009 — verify gate: `eslint .` / `tsc --noEmit` / `vitest run` (commands)
- `AGENTS.md` — stack e verify gate canônicos
- `TASKS.md` — tabela de comandos que devem tornar-se funcionais
- `constitution.md` — boundaries (ask_first antes de adicionar deps; never pular verify gate)
- Atlas (brain recall): precedent nucci-projects aplica `PRAGMA journal_mode=WAL` + `PRAGMA busy_timeout=5000` no módulo de conexão — adotado preemptivamente aqui.