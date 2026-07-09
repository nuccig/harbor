## Handoff: fix → consolidate

### Decisões tomadas
- Os quatro findings de `reviews-001/` foram resolvidos e marcados como
  `status: resolved`.
- A re-review terminou CLEAN e não criou `reviews-002/`.
- O branch foi atualizado com dois commits pós-evidência:
  - `0c779ab fix(ui): pass final issue 29 evidence`
  - `5226bea fix(ui): resolve review evidence gaps`

### Evidência fresca
- `git diff --check` exit 0.
- `npm run lint` exit 0.
- `npm run typecheck` exit 0.
- `npm run test` exit 0, 12 arquivos e 148 testes passados.
- `npm run build` exit 0, incluindo `out/preload/index.mjs`.
- `npm run build:app -- --dir --config.asar=false` exit 0; `dist/win-unpacked`
  gerado e limpo depois.

### Aprendizados para consolidar
- Contraste visual deve ser medido também contra o canvas/background real, não só contra
  a surface do card.
- Em Electron + Vite + sandbox, o preload pode precisar manter nome `.mjs` para lookup,
  mas emitir CJS para não quebrar em runtime.
- Fallback de WebGPU/WebGL2 precisa testar valor real (`typeof`) e não apenas presença da
  propriedade.
- Build local unsigned no Windows pode exigir `win.signAndEditExecutable=false` enquanto
  não existe pipeline de assinatura.

### Contexto que a próxima fase PRECISA
- Atualizar memória/state para refletir que review está clean.
- Promover apenas aprendizados técnicos generalizáveis para o atlas.
- Auditar o fluxo SDD porque esta run usou `--audit`.
