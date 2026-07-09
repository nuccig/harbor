# Handoff-002 — implement → consolidate

**Feature**: scaffold-inicial
**Mission**: implement->consolidate
**Source**: `.orquestrador/scaffold-inicial/` (spec + handoff-001 + decisions + learnings + constitution)
**Previous phase**: implement PASS (ver controller evidence: lint 0, typecheck 0, test 5/5, build 3 bundles)

## Decisões tomadas

D-IMPL-1..6 já persistidos em `decisions.md:13-18`. Resumo comprimido:
- **D-IMPL-1**: harbor.db dev=repo-local (gitignored), prod=userData, switch por `NODE_ENV`.
- **D-IMPL-2**: contextIsolation:true + nodeIntegration:false + sandbox:true + preload via contextBridge (dev=prod).
- **D-IMPL-3**: electron-vite plugin (1 cmd cobre main+preload+renderer).
- **D-IMPL-4**: type:module; preload outputs .mjs; main refs `../preload/index.mjs`.
- **D-IMPL-5**: `npm install --ignore-scripts` + electron-rebuild manual (bypass better-sqlite3 install script vs Node 24 clang).
- **D-IMPL-6**: Patch node-pty binding.gyp + winpty.gyp (SpectreMitigation 'Spectre'→'false') — MSB8040 workaround.

## Alternativas descartadas

- **OQ-1 dev-db em userData**: rejeitado — debug mais difícil, não dá pra apagar/recriar trivial. Repo-local + gitignore ganha.
- **OQ-2 nodeIntegration:true em dev**: rejeitado — security debt migrar depois > custo de fazer certo 1x. contextBridge desde o scaffold.
- **OQ-3 orquestração manual Vite+electron**: rejeitado — 2 processos p/ dev, mais boilerplate que electron-vite. Plugin maduro cobre tudo.
- **postinstall puro (sem --ignore-scripts)**: rejeitado — better-sqlite3 install script builda contra Node headers (clang:1 no Node 24) → MSB8020 ClangCL. --ignore-scripts + electron-rebuild evita.
- **Instalar VS Spectre-mitigated libs**: rejeitado p/ scaffold — overhead de setup; patch .gyp é menor diff. Upgrade path documentado.

## Suposições validadas

- Atlas WAL precedent (nucci-projects) aplica direto — `db.pragma('journal_mode = WAL')` funciona; `busy_timeout=5000` também (L-1).
- electron-vite convenção `src/main`, `src/preload`, `src/renderer` confirmada via Context7 docs.
- `@electron/rebuild` binário = `electron-rebuild` (sem args recria todos os native addons contra Electron instalado) — L-10.
- Verify gate verde encadeado: lint→typecheck→test→build todos exit 0 (controller-verified).

## Suposições invalidadas

- "postinstall hook `electron-rebuild` basta" — FALSO. better-sqlite3 install script roda ANTES do postinstall e falha (clang:1 Node 24). Solução: `--ignore-scripts` na instalação + postinstall separado (`patch-node-pty.cjs && electron-rebuild`).
- "node-pty rebuilda limpo" — FALSO. binding.gyp + winpty.gyp hardcode `SpectreMitigation: 'Spectre'` → MSB8040. Patch obrigatório.
- "preload outputa .js" — FALSO com type:module. Outputa `.mjs`. Main precisa ref `../preload/index.mjs` (L-8).
- "testes tocam native addons sob Node puro" — FALSO. Addons rebuilt contra Electron ABI; ABI mismatch sob Node. Smoke test spawna Electron binary (L-9).

## Descobertas inesperadas

- **Node 24 + MSVC + clang:1**: Node 24 headers default Clang toolset; MSVC gera projeto com ClangCL → MSB8020 se não instalado. Electron headers NÃO têm clang flag (MSVC v143 nativo). Daí --ignore-scripts + electron-rebuild funcionar.
- **MSB8040 Spectre**: VS não instala Spectre-mitigated libs por padrão. node-pty 1.1.0 hardcodeia `SpectreMitigation: 'Spectre'`. Patch é workaround documentado (D-IMPL-6 ceiling).
- **Electron binary download**: electron-rebuild precisa do Electron binary p/ rebuildar; download ocorre no install. Sem proxy/repo cache pode falhar — risco transferido.
- **Smoke test pattern**: spawna Electron binary rodando self-check script, outputa JSON marcado `__SMOKE_RESULT__`, vitest parseia. Padrão reutilizável p/ qualquer teste que toque native addons (L-9).

## Raciocínio comprimido (dead ends)

- **Tentativa 1**: postinstall `electron-rebuild` apenas → better-sqlite3 install script falha ANTES do postinstall (MSB8020 clang). Dead end.
- **Tentativa 2**: instalar ClangCL → resolve MSB8020 mas adiciona dep de toolchain desnecessária; electron-rebuild já usa MSVC v143 nativo. Desnecessário.
- **Tentativa 3**: rebuild node-pty sem patch → MSB8040 Spectre. Patch .gyp é menor diferença que instalar VS Spectre libs.
- **Conclusão**: --ignore-scripts (bypass install scripts) + patch-node-pty + electron-rebuild (rebuild contra Electron ABI) = caminho mínimo. 3 passos, sem toolchain extra.

## Contexto que a próxima fase PRECISA

- **Verify gate está verde** (controller-verified: lint 0, typecheck 0, test 5/5, build 3 bundles). AC-012 satisfeito.
- **3 ACs deferred p/ GUI**: AC-005 (dev HMR), AC-011 (keytar set→get roundtrip individual), AC-013 (app loads built bundle interativo). Requerem GUI/interativo — não bloqueiam consolidate, mas são riscos transferidos (ver abaixo).
- **Branch**: `feat/scaffold-inicial`, commit `b69e042`, PR #1 draft. Consolidate pode revisar diff.
- **20 artefatos** produzidos — ver implement Report (não duplicar aqui). Paths canônicos: `package.json`, `electron.vite.config.ts`, `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/App.tsx`, `src/drizzle/db.ts`, `src/keychain/index.ts`, `scripts/patch-node-pty.cjs`, `tests/smoke.test.ts`.
- **Decisions/learnings atualizados**: D-IMPL-1..6 e L-5..L-10 já persistidos em `decisions.md` e `learnings.md`. Nada a appendar nesta fase.

## Riscos transferidos

- **R-1 (GUI ACs)**: AC-005/011/013 não testados automaticamente. Risco: regressão silenciosa se wiring dev HMR ou bundle loading quebrar. Mitigação: consolidate pode solicitar teste interativo manual ou deferir p/ primeira feature que toque renderer.
- **R-2 (native addon prereqs)**: setup novo dev precisa Node 20+ + npm + (Windows) MSVC build tools + Python (p/ node-gyp). Sem isso, `npm install` falha. Documentar em README/onboarding (não feito no scaffold). Risco: onboarding friction.
- **R-3 (Electron binary download)**: electron-rebuild baixa Electron binary no install. Em rede restrita/CI sem cache, falha. Mitigação: cache npm/`~/.electron` ou mirror env var.
- **R-4 (Spectre patch ceiling)**: node-pty nativo sem Spectre mitigation (D-IMPL-6). Aceitável p/ scaffold; se ameaça virar requisito, instalar VS Spectre libs + remover patch.
- **R-5 (keytar roundtrip)**: AC-011 (set→get) não testado individualmente. Risco: bug em set/get que smoke check não captura. Mitigação: primeira feature de credencial adiciona teste explícito.

## Promoção ao atlas (brain-sync 19.5)

### Durable cross-projeto (promover ao atlas)
- **L-1** (WAL + busy_timeout p/ SQLite/Drizzle — já no atlas via nucci-projects; reconfirmado).
- **L-5** (Node 24 + MSVC clang:1 + better-sqlite3 install script → --ignore-scripts + electron-rebuild; padrão p/ qualquer native addon em Node 24+).
- **L-6** (node-pty Spectre patch p/ MSB8040; padrão p/ node-pty em Windows/VS sem Spectre libs).
- **L-8** (electron-vite + type:module → preload .mjs; main refs .mjs; padrão ESM Electron).
- **L-9** (smoke test spawn Electron binary + JSON marcado; padrão p/ testar native addons rebuilt contra Electron ABI).
- **L-10** (`@electron/rebuild` binário = `electron-rebuild`, sem args recria todos).
- **D-IMPL-2** (contextIsolation:true + sandbox:true + preload contextBridge desde o scaffold; padrão de segurança Electron).
- **D-IMPL-3** (electron-vite plugin cobre main+preload+renderer; convenção `src/{main,preload,renderer}`).
- **D-IMPL-5** (--ignore-scripts + electron-rebuild manual; padrão p/ native addons em Electron).

### Permanente do projeto (ADR no repo `docs/adr/`)
- **ADR candidato: Electron native addon rebuild strategy** — `--ignore-scripts` + `patch-node-pty.cjs` (Spectre) + `electron-rebuild` postinstall. Documenta D-IMPL-5 + D-IMPL-6 + L-5 + L-6. Razão: setup de dev recorrente; onboarding de novo dev precisa saber.
- **ADR candidato: Electron security baseline** — contextIsolation:true + nodeIntegration:false + sandbox:true + preload contextBridge (D-IMPL-2). Razão: decision de arquitetura de segurança; não deve ser revertida implicitamente.
- **ADR candidato: harbor.db path (dev vs prod)** — D-IMPL-1. Razão: decision de storage; futuras features de DB precisam saber onde está.
- **ADR candidato: electron-vite + ESM** — D-IMPL-3 + D-IMPL-4. Razão: decision de tooling/build; futuros scripts dependem.

### Efêmero da run (fica em `.orquestrador/scaffold-inicial/`)
- AC-005/011/13 deferred (específico desta run; resolve na primeira feature de GUI).
- Specific file paths dos 20 artefatos (mudam conforme código evolui).
- Detalhes do patch script (`scripts/patch-node-pty.cjs`) — código vive no repo; decisão/promoção ao ADR basta.
- Branch/commit/PR específicos (b69e042, PR #1) — histórico git.