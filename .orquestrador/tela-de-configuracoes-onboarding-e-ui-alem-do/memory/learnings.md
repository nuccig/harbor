# Learnings — tela-de-configuracoes-onboarding-e-ui-alem-do

- Não há decisões prévias específicas para onboarding, settings ou UX desktop de coding agents; a spec precisa decidir esses comportamentos para evitar preencher lacunas por suposição.
- A spec deve tornar explícitos fluxo de primeiro uso, taxonomia/persistência de preferências, estados empty/error/loading, teclado/foco e limites de motion, porque esses pontos afetam segurança, acessibilidade e critérios verificáveis.
- Verificação visual precisa medir texto/foco contra o canvas, não apenas `ink` contra `surface`: Signal Poster passou nos cards escuros, mas falhou inicialmente no canvas claro até a paleta ser corrigida.
- Em Electron sandbox, o preload final pode precisar preservar o caminho `index.mjs` mas emitir código CJS; smoke runtime deve validar o bridge (`window.harbor.ping()`) além de confiar no build.
