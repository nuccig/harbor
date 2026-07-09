# Learnings — scaffold-inicial

Riscos, gaps e findings duráveis跨 fases.

## Atlas / cross-project

- **L-1**: better-sqlite3 + Drizzle — aplicar `PRAGMA journal_mode=WAL` + `PRAGMA busy_timeout=5000` no módulo de conexão (precedent nucci-projects). Preemptivo p/ worker_threads: cada thread abre conexão própria; WAL evita lock contention.
- **L-2**: Convenções cross-projeto (atlas): AGENTS.md como contract; tasks-by-role no package.json; verify gate pre-commit; Conventional Commits; pt-BR humano / EN código.
- **L-3**: **Gap** — sem precedent Electron+node-pty no Atlas. electron-rebuild wiring + integração Vite↔Electron devem ser researchados do zero. Risco para implement phase: ABI mismatch, config Vite p/ renderer Electron, preload bundling.

## Spec phase

- **L-4**: Spec solution-agnostic conseguiu não vazar implementação — ADRs ficaram como constraints. Open questions de arquitetura permaneceram abertas corretamente (não é gap do spec; é decisão delegada).

## Implement phase (append pelo implement-agent)

- **L-5**: **Node 24 + better-sqlite3 install** — Node 24 headers têm `clang: 1` (Clang toolset default). `better-sqlite3`'s own install script (`prebuild-install || node-gyp rebuild`) builda contra Node headers → MSVC gera projeto com `ClangCL` toolset → MSB8020 se ClangCL não instalado. **Fix**: `npm install --ignore-scripts` (pula sub-package scripts) + `electron-rebuild` (builda contra Electron headers, que não têm clang flag). Electron headers usam MSVC v143 nativo. Postinstall hook deve ser `electron-rebuild`, não confiar no install script do addon.
- **L-6**: **node-pty Spectre mitigation** — `node-pty` 1.1.0 `binding.gyp` + `deps/winpty/src/winpty.gyp` hardcoded `SpectreMitigation: 'Spectre'` → MSB8040 (Spectre-mitigated VS libs required, não instaladas por padrão). **Fix**: postinstall patch script (`scripts/patch-node-pty.cjs`) substitui `'Spectre'` → `'false'` em ambos os .gyp antes do rebuild. Ceiling: sem Spectre hardening no PTY nativo; upgrade = instalar VS "Spectre-mitigated libs" (Individual components no VS Installer) + remover patch.
- **L-7**: **better-sqlite3 pragma return** — `db.pragma('journal_mode = WAL')` (string com `=`) retorna `[{ journal_mode: 'wal' }]` (array de objects). Para ler valor como string, usar `db.pragma('journal_mode', { simple: true })` que retorna `'wal'` diretamente. O `db.ts` de produção só seta (não lê return), então ok; o teste precisa ler com `{ simple: true }`.
- **L-8**: **electron-vite ESM output** — com `"type": "module"` no package.json, electron-vite outputa preload como `.mjs` (não `.js`). Main process precisa referenciar `../preload/index.mjs`. Main outputa como `.js` (ESM com `"type": "module"`).
- **L-9**: **Smoke test strategy** — native addons (better-sqlite3, keytar) são rebuilt contra Electron ABI, então falham sob Node puro (ABI mismatch). Solução: vitest spawna Electron binary para rodar self-check script que exercita SQLite + keytar + IPC + window mount em um processo. Script escrito no repo root (para achar `node_modules`), outputa JSON marcado (`__SMOKE_RESULT__`), vitest parseia e assertiona. Padrão reutilizável para qualquer teste que toque native addons.
- **L-10**: **electron-rebuild binário** — `@electron/rebuild` expõe binário `electron-rebuild` (não `@electron/rebuild`). Roda sem args para rebuildar todos os native addons contra a versão instalada de Electron (lê de `node_modules/electron/package.json`).

## Consolidate phase (append pelo consolidate-agent)

- **L-11**: **GUI AC deferral pattern** — 3 de 13 ACs (AC-005 dev HMR, AC-011 keytar set→get roundtrip, AC-013 app loads built bundle) não puderam ser auto-verificadas pois exigem GUI interativa. **Causa**: spec não flagou ACs que requerem verificação interativa; implement-agent deferiu silenciosamente sem risk register explícito até o handoff. **Regra reutilizável**: spec-agent deve marcar ACs que exigem GUI/interatividade como `requires-manual-verify: true` no spec; implement-agent deve enumerar explicitamente ACs auto-verificadas vs deferidas-para-manual no Report, para o controller rastrear o conjunto deferido. Em --quick mode (sem review/fix loop), essa enumeração é o único controle contra ACs silenciosamente aceitas sem evidência.