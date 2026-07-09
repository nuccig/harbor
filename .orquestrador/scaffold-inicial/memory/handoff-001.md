# Handoff-001 — spec → implement (quick pipeline)

**Feature**: scaffold-inicial
**Mission**: spec->implement
**Mode**: --quick (no plan/tasks phase — implement-agent resolves open questions)
**Source spec**: `.orquestrador/scaffold-inicial/spec.md`

## What to build

Scaffold funcional Harbor: Electron main + renderer React (Vite) + SQLite (better-sqlite3/Drizzle) + keytar wrapper. Objetivo final: verify gate verde (`npm run lint && npm run typecheck && npm run test`) e app mínimo que sobe.

13 ACs em padrão EARS — ver `spec.md` seção "Acceptance criteria" (AC-001 a AC-013). Implement-agent deve satisfazer todos.

## Scope — referência, não duplicação

- **In**: ver `spec.md` "Scope → In" (13 itens: package.json, configs, dirs, Electron main, renderer React, SQLite WAL, keytar wrapper, electron-rebuild, npm scripts, smoke check).
- **Out (não-metas explícitas)**: ver `spec.md` "Scope → Out" (8 itens). Não construir: features de domínio, schemas de produto, CI, signing/notarização, Playwright, multi-perfil, worker threads reais, UI além do placeholder.

## Stack constraints (ADRs 0002-0009 — dadas, não redecidir)

| ADR | Constraint |
|-----|-----------|
| 0002 | TypeScript + Node 20+ (runtime único front+back) |
| 0003 | Electron + node-pty (PTYs via native addon, rebuild per Electron version) |
| 0004 | React 18+ + Vite (renderer; xterm.js-friendly) |
| 0005 | SQLite single-file `harbor.db` + Drizzle ORM + better-sqlite3 (native addon) |
| 0006 | keytar no OS keychain; sem app auth; sem RBAC; sem creds em plaintext |
| 0007 | electron-builder + GitHub Releases + electron-updater (sem signing no scaffold) |
| 0008 | Event loop main process; worker_threads opt-in (não usar no scaffold) |
| 0009 | Verify gate: `eslint .` / `tsc --noEmit` / `vitest run`; build: `vite build` (+ electron-builder p/ installers) |

**3 native addons** precisam `electron-rebuild`: node-pty, better-sqlite3, keytar (todos precisam rebuild contra ABI do Electron).

## npm scripts a tornar funcionais (TASKS.md + spec ACs)

| Script | Command | Notas |
|--------|---------|------|
| lint | `eslint .` | |
| typecheck | `tsc --noEmit` | tsconfig com refs main/renderer |
| test | `vitest run` | smoke check: main carrega, renderer monta, SQLite WAL, keytar get sem erro |
| build | `vite build` | bundle do renderer |
| build:app | `electron-builder` | installers (não obrigatório no scaffold smoke, mas script presente) |
| dev | `vite` (renderer HMR) + Electron main | ver open question #3 |
| app | `electron .` | dev mode; prod carrega bundle buildado |

## OPEN QUESTIONS — implement-agent DEVE resolver (--quick, sem plan stage)

Estas 3 decisões de arquitetura ficaram abertas no spec. Implement-agent decide e registra em `decisions.md`:

### OQ-1: Caminho do `harbor.db` (dev vs prod)
- **Prod**: `app.getPath('userData')` (padrão Electron — isolado por usuário/SO).
- **Dev**: repo-local (ex. `./harbor.db` ou `.orquestrador/`) OU `userData`. Recomendação lazy: repo-local p/ debug fácil + gitignore; switch via env (`NODE_ENV` ou `process.env.HARBOR_DEV_DB`).
- **Decisão a registrar**: path em dev, path em prod, mecanismo de switch.

### OQ-2: `contextIsolation` + preload vs `nodeIntegration`
- **Recomendação de segurança**: começar com `contextIsolation: true` + preload script desde o scaffold (lazy = fazer certo uma vez; migrar depois é mais trabalho + risco).
- `nodeIntegration: false` em ambos dev e prod. Preload expõe API mínima via `contextBridge`.
- **Decisão a registrar**: confirmar contextIsolation:true desde o scaffold; shape do preload.

### OQ-3: `electron-vite` plugin vs orquestração manual
- **Opção A**: `electron-vite` (plugin consolidado — um comando `dev`/`build` cobre main+preload+renderer; menos config boilerplate).
- **Opção B**: manual — Vite dev server p/ renderer + `electron .` separado; dois processos p/ dev.
- **Recomendação lazy**: `electron-vite` se cobrir main+preload+renderer com config mínima e mantiver os scripts do TASKS.md funcionais. Se adicionar fricção aos scripts canônicos (`dev`=`vite`, `app`=`electron .`), reconsiderar.
- **Decisão a registrar**: escolha + justificativa + como mapeia para scripts TASKS.md.
- **Risco**: sem precedent Electron no atlas — pesquisar wiring electron-rebuild + integração Vite↔Electron do zero. Ver learnings.md.

## Atlas findings (brain recall) — aplicar

- **WAL precedent (nucci-projects)**: módulo de conexão SQLite aplica `PRAGMA journal_mode=WAL` + `PRAGMA busy_timeout=5000` — preemptivo p/ worker_threads (cada thread pode abrir conexão própria). Já está como AC-009 no spec.
- **Convenções cross-projeto**: AGENTS.md como contract; tasks-by-role no package.json; verify gate pre-commit; Conventional Commits; pt-BR humano / EN código.
- **Gap**: sem precedent Electron+node-pty no Atlas — electron-rebuild wiring e Vite↔Electron integration researchados do zero.

## Constitution — boundaries (não negociar)

- **always**: rodar verify_gate antes de reportar PASS (com evidência); respeitar disjoint file scope.
- **ask_first**: adicionar nova dep; migração de schema; mudança fora do escopo declarado.
- **never**: push direto na default branch; editar fora do escopo disjunto; pular verify_gate.
- **linguagem**: pt-BR humano, EN código/commits/identificadores.
- **branching**: `feat/<slug>`.
- **commits**: Conventional Commits.

## Checklist para implement-agent

1. Resolver OQ-1, OQ-2, OQ-3 → registrar em `decisions.md`.
2. Criar estrutura de dirs (main/renderer/shared/drizzle).
3. package.json com todas as deps (production + dev) — ver spec "In".
4. Configs: tsconfig (refs), eslint, vitest, vite (ou electron-vite), electron-builder.
5. Electron main: abre janela, carrega renderer (dev HMR / prod bundle), IPC stub tipado (AC-008), SQLite init + WAL (AC-009), keytar wrapper (AC-010/011).
6. Renderer React: placeholder mínimo visível (AC-006).
7. Preload script (se OQ-2 = contextIsolation:true) com contextBridge.
8. electron-rebuild wiring (postinstall) p/ 3 native addons (AC-001).
9. Smoke check (vitest) cobrindo AC-005/006/009/010.
10. Rodar verify gate → deve estar verde (AC-012). Registrar evidência.