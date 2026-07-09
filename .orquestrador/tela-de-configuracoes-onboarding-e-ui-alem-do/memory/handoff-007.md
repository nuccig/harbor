## Handoff: review → fix

### Decisões tomadas
- A review abriu quatro findings médios em `reviews-001/`.
- Não foi criado `reviews-002/` neste ponto; o próximo passo era corrigir os quatro
  findings e repetir verify + re-review.

### Findings transferidos
- `101-signal-poster-palette-drift.md` — Signal Poster estava acessível após correção de
  contraste, mas havia derivado do critério aprovado preto/lavanda.
- `102-build-app-windows-sign-edit.md` — `npm run build:app -- --dir --config.asar=false`
  falhava no Windows por `winCodeSign`/symlink sem privilégio.
- `201-manual-evidence-runtime-claim.md` — o relatório podia ser lido como se Playwright
  fosse dependência do produto; na prática era harness externo do Codex.
- `202-nightambient-fallback-not-evidenced.md` — AC-034 marcava fallback como PASS sem
  prova de WebGPU/WebGL2 forçados indisponíveis.

### Contexto que a próxima fase PRECISA
- Resolver os quatro findings sem expandir o escopo funcional da issue.
- Atualizar cada issue file com `status: resolved` e uma resolução curta.
- Repetir gate e re-review antes de qualquer claim de clean.
