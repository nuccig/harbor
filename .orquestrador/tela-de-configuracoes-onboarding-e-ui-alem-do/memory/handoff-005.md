## Handoff: tasks + analyze → implement

### Decisões tomadas
- A decomposição foi aprovada com 38 ACs cobertos, zero órfãos, zero referências
  inválidas e sem warning remanescente. Executar as tasks na ordem
  `001 → 002 → (003 || 004 || 005) → 006 → 007`; `006` possui serial lock até as três
  tasks paralelas terminarem, e `007` só começa após `006` (ver `tasks/*.md`).
- Ownership é estrito e disjunto: cada implementador escreve somente nos paths listados
  em **File scope (disjoint)** de sua task. Não corrigir, formatar nem criar arquivos fora
  desse scope, mesmo que uma falha adjacente seja descoberta; reportar o gap ao
  controller para remediation pelo owner correto.
- A task 001 é owner exclusiva de `package.json`, lockfile, configuração Vitest, modelo,
  catálogo, fonte e licença. Somente ela pode adicionar as nove dependências diretas
  aprovadas: runtime `motion`, `shaders`, `@base-ui/react`,
  `@phosphor-icons/react`, `iconoir-react`; dev `jsdom`,
  `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`. Não adicionar `framer-motion`, `lucide-react`, router,
  store externo ou dependência E2E (ver task 001 e `plan.md`, **Dependências aprovadas**).
- A task 002 estabiliza primitives e presenters de cenário antes das superfícies. Depois,
  003/004/005 podem executar em paralelo porque seus scopes são disjuntos:
  onboarding; shell/settings; Design Lab. A task 006 é a única owner da integração da
  raiz, conceitos, tokens, responsividade, Motion/shader e smoke matrix.
- A task 007 possui somente scope de evidência. Ela não pode editar source nem “ajustar
  durante a inspeção”; qualquer reprovação termina em FAIL com ACs/logs afetados e volta
  ao owner correspondente.
- Implementadores não executam nenhum comando git. O controller valida, integra,
  reverte tentativas falhas e commita task a task. Mudanças existentes ou de outra onda
  devem ser preservadas e não podem ser incorporadas ao Report da task corrente.

### Alternativas descartadas
- Não antecipar 006 enquanto 003–005 estiverem incompletas, nem fundir seus scopes para
  contornar imports ausentes. A onda intermediária existe para manter comportamento
  compartilhado e presenters sem estado.
- Não distribuir package/config/assets entre tasks posteriores nem instalar variantes
  “equivalentes” das dependências aprovadas. A lista e o owner estão fechados.
- Não usar teste jsdom como prova de layout, contraste, motion, GPU ou hit target. Essas
  propriedades exigem a matriz manual da task 007.
- Não corrigir source na task 007 e não declarar PASS com verify antigo ou somente
  automatizado; os 38 ACs requerem evidência manual.

### Suposições validadas
- A análise confirmou a DAG e a independência real dos scopes paralelos
  003/004/005; não há conflito de ownership entre essas tasks.
- A matriz de 36 células e a paridade entre conceitos podem ser verificadas na task 006
  depois que modelo, primitives e três superfícies estiverem completos.
- O boundary renderer-only permanece suficiente: nenhuma task autoriza alterações em
  main process, preload, IPC, storage, credenciais, addons nativos ou
  `electron.vite.config.ts`.

### Suposições invalidadas
- Nenhuma nova na análise. Os warnings editoriais de plan/task 001 foram corrigidos
  antes deste handoff e não geram trabalho de implementação.

### Descobertas inesperadas
- Nenhuma. O Report de análise terminou PASS, sem blocker, warning ou gap durável; por
  isso `memory/learnings.md` não recebe nova entrada nesta transição.

### Raciocínio comprimido (dead ends)
- Não paralelizar 001/002: modelo, harness e assets precedem primitives/cenários.
- Não mover a smoke matrix para tasks de superfície: ela depende das três superfícies,
  quatro cenários e três conceitos integrados.
- Não executar “melhorias oportunistas” fora da task. O ganho aparente quebra o
  ownership necessário para validação, retry e commit isolado pelo controller.

### Contexto que a próxima fase PRECISA
- Cada task deve começar lendo `spec.md`, `plan.md`, este handoff e seu arquivo
  `tasks/NNN-*.md`; carregar somente os governing skills declarados na própria task.
- Ondas e owners:
  - `001`: package/lock/Vitest, `app/**`, Recursive/OFL e testes de modelo.
  - `002`: `ui/**`, `scenarios/**` e testes de primitives/cenários.
  - `003 || 004 || 005`: respectivamente onboarding; shell/settings; Design Lab.
  - `006`: `App.tsx`, `main.tsx`, `concepts/**`, `styles/**` e integração/smoke matrix.
  - `007`: exclusivamente relatório e screenshots em `evidence/**`.
- Ao fim de cada task, retornar o Report formal de
  `references/contract.md`: header exato `## Report: implement — <STATUS>`,
  `**STATUS**: PASS | FAIL | BLOCKED`, artefatos produzidos, decisões, sumário de 2–4
  linhas, desvios e gaps. Incluir os comandos de verify executados e resultados frescos
  no sumário ou nas decisões; não omitir falhas.
- PASS de 001–005 exige o gate indicado na própria task. PASS de 006 exige
  `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`, preservando o
  smoke native. PASS de 007 exige novamente gate/build frescos e exatamente 38 linhas
  rastreáveis de evidência manual.
- Se a implementação encontrar necessidade de tocar fora do **File scope (disjoint)**,
  parar essa mudança e reportar o arquivo, motivo e owner provável como gap. Não assumir
  autorização, não editar e não usar git.

### Riscos transferidos
- Drift funcional ou semântico se concepts, Design Lab ou superfícies criarem estado,
  ações, fixtures ou ordem interativa próprios em vez de consumir a fundação comum.
- Contaminação do smoke native se jsdom virar ambiente global; task 001 deve preservar
  seleção por arquivo/pasta.
- Mistura de famílias de ícones, shader eager, fonte remota ou pacote Motion incorreto
  pode violar decisões aprovadas e os checks de bundle da task 006.
- A task 006 concentra o maior risco de integração: 1024×700 com dock aberto,
  tipografia Signal Poster, reduced motion, fallback do shader e paridade da matriz.
- A task 007 pode encontrar reprovações visuais após código tecnicamente verde; isso é
  FAIL rastreável para remediation, não permissão para atravessar ownership.
