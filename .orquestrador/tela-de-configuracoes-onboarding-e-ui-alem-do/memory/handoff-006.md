## Handoff: implement → review

### Decisões tomadas
- As tasks 001–007 foram implementadas e integradas no branch
  `codex/issue-29-configuracoes-onboarding-ui`.
- O escopo permaneceu renderer/UI e evidência, exceto pelos ajustes de build Electron
  necessários para manter preload seguro e empacotamento local verificável.
- A evidência manual final cobre os 38 ACs em
  `evidence/issue-29-manual-verification.md`, com 18 screenshots sob
  `evidence/screenshots/issue-29/`.

### Evidência transferida
- Verify gate final da implementação: `npm run lint`, `npm run typecheck`,
  `npm run test` e `npm run build` com exit 0.
- Smoke runtime Electron: `window.harbor.ping()` respondeu `pong`.
- Matriz visual: três conceitos × três superfícies default em 1440×900, mais
  loading/empty/error em 1024×700.

### Riscos transferidos
- A review deve tratar evidência manual como parte do produto desta entrega, não como
  documentação opcional: runtime claim, screenshots, AC rows e comandos de verify precisam
  concordar com o código e com `package.json`.
- Como o Design Lab é protótipo temporário, a review deve distinguir problemas que
  bloqueiam comparação dos conceitos de escolhas canônicas para uma direção futura.

### Contexto que a próxima fase PRECISA
- Revisar source, testes, build config, relatório manual e screenshots.
- Conferir explicitamente as obrigações que testes unitários não provam: contraste,
  viewport 1024×700, reduced motion, fallback do shader e foco/teclado.
- Abrir issues em `reviews-001/` usando severidade e status consumíveis pelo fix loop.
