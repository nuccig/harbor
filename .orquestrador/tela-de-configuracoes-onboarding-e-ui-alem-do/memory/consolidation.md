# Consolidation — issue 29

## Resultado consolidado

Issue #29 produziu uma demonstração comparável de três propostas visuais para o mesmo
fluxo `onboarding → app shell → settings`, com dados simulados, Design Lab temporário,
quatro cenários e evidência manual rastreável para AC-001..AC-038.

## O que ficou durável no repo

- Modelo de experiência e fixtures simuladas.
- Primitives e presenters compartilhados.
- Onboarding em quatro etapas.
- Shell principal e Settings com categorias aprovadas.
- Design Lab transversal com notas locais e favorita de avaliação.
- Três conceitos navegáveis: Command Deck, Night Harbor e Signal Poster.
- Evidência manual, screenshots e review files resolvidos sob `.orquestrador/`.

## O que continua explicitamente fora

- Integrações reais de agentes, issues, credenciais, storage e keychain.
- Persistência de preferências, avaliações ou favorita.
- Escolha da direção canônica do Harbor.
- Promoção do Design Lab para produto permanente.
- Suporte mobile abaixo de 1024×700.

## Learnings promovidos ao atlas

- `learnings/visual-contrast-against-canvas.md`
- `learnings/gpu-fallback-detect-values-not-keys.md`
- `learnings/electron-builder-windows-sign-edit-unsigned.md`
- Atualização de `learnings/electron-vite-esm-preload-mjs.md`

## Próximo consumidor

O PR deve permanecer draft se o GitHub não reportar checks remotos. O branch está localmente
verificado e pode ser revisado visualmente pelo usuário antes de escolher uma proposta
canônica em outra issue.
