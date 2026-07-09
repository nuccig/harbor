# Decisions — scaffold-inicial

Decision log durável. Decisões da spec phase persistidas; implement-agent append das open questions resolvidas.

## Spec phase (persistido do Report spec)

- **D-S1**: Spec trata ADRs 0002-0009 como constraints dadas, não como escolhas a introduzir (evita leak de implementação no spec).
- **D-S2**: Adotado `PRAGMA journal_mode=WAL` no módulo de conexão SQLite como precedent do atlas (nucci-projects) — preemptivo para worker_threads. `PRAGMA busy_timeout=5000` também aplicado (atlas). Forma exata fica na implementação.
- **D-S3**: 3 decisões de arquitetura remanescentes (caminho do db em dev/prod, contextIsolation vs nodeIntegration, plugin electron-vite vs manual) delegadas ao plan stage como open questions. **--quick mode**: implement-agent resolve (ver handoff-001 OQ-1/OQ-2/OQ-3).

## Implement phase (append pelo implement-agent)

- **D-IMPL-1**: `harbor.db` dev = `process.cwd()/harbor.db` (repo-local, gitignored); prod = `app.getPath('userData')/harbor.db` (padrão Electron). Switch via `NODE_ENV === 'production'`. Rationale: dev quer debug fácil (db no repo, apagar e recriar); prod quer isolamento por usuário/SO. Uma linha de ternary, sem config externa.
- **D-IMPL-2**: `contextIsolation: true` + `nodeIntegration: false` + `sandbox: true` + preload via `contextBridge` desde o scaffold (dev e prod idênticos). Preload expõe API mínima (`harbor.ping`). Rationale: fazer certo uma vez; migrar depois é mais trabalho + risco de security debt. Security best practice não é negotiável (ponytail: never simplify away security).
- **D-IMPL-3**: `electron-vite` (Opção A). Um comando `dev`/`build` cobre main+preload+renderer com config mínima (`electron.vite.config.ts`). Mapeia para TASKS.md: `dev`=`electron-vite dev` (HMR main+renderer), `build`=`electron-vite build` (3 bundles), `app`=`electron .` (carrega `out/main/index.js` que carga `out/renderer/index.html`). Mantém scripts canônicos funcionais. Rationale: menos boilerplate que orquestração manual; plugin maduro (Context7 docs confirmam convenção `src/main`, `src/preload`, `src/renderer`).
- **D-IMPL-4**: `package.json` com `"type": "module"` — Electron 33 suporta ESM no main process. Preload outputa `.mjs` (ESM sandbox-compatible). Main referencia `../preload/index.mjs`.
- **D-IMPL-5**: `npm install --ignore-scripts` + `electron-rebuild` manual ao invés de `postinstall` puro. Motivo: `better-sqlite3` install script tenta buildar contra Node headers (Node 24 tem `clang: 1` → MSB8020 ClangCL not installed). `--ignore-scripts` pula sub-package build scripts; `electron-rebuild` builda contra Electron ABI (que não tem clang flag). Postinstall hook = `node scripts/patch-node-pty.cjs && electron-rebuild`.
- **D-IMPL-6**: Patch `node-pty` binding.gyp + winpty.gyp para `SpectreMitigation: 'false'` (era `'Spectre'`). MSB8040: Spectre-mitigated VS libs não instaladas. Scaffold não precisa de Spectre hardening. Script `scripts/patch-node-pty.cjs` roda antes de `electron-rebuild`. Ceiling: sem Spectre mitigation no node-pty nativo; upgrade path = instalar VS Spectre libs + remover patch.