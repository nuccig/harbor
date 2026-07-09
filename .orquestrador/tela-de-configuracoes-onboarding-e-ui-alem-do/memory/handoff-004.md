## Handoff: plan → tasks

### Decisões tomadas
- O plano foi aprovado sem trade-offs abertos. A decomposição deve seguir o boundary
  renderer-only e a lista de componentes/arquivos prevista em `plan.md`, **Limites** e
  **Components & changes**; main, preload, IPC, storage e addons nativos ficam intocados.
- Estado e navegação formam um único modelo efêmero em reducer + Context, com fixtures e
  seletores separados; as invariantes que cada task precisa preservar estão fechadas em
  `plan.md`, **Data & contracts**, e ratificadas em `adr/0001-modelo-de-sessao-efemero-compartilhado.md`.
- Os três conceitos usam comportamento, view model, ações, ordem semântica e slots
  compartilhados. Somente layouts, tokens, iconografia e motion variam (ver `plan.md`,
  **Presentation system**, e `adr/0002-layouts-por-slots-e-motion-ambiental.md`).
- O Design Lab é um módulo removível em coluna própria: rail de 88 px, painel de 320 px,
  avaliações inteiras 0–10 por conceito e retorno de foco ao recolher (ver `plan.md`,
  **Design Lab**, e `adr/0003-design-lab-dock-e-escala.md`).
- Assets e dependências estão fechados: Recursive local/OFL, Iconoir para Command
  Deck/Lab, Phosphor para Night Harbor/Signal Poster, Motion, shader lazy e Base UI; os
  pacotes exatos constam em `plan.md`, **Assets** e **Dependências aprovadas**, e nos ADRs
  0002/0004.
- O harness React usa Testing Library + jsdom seletivo, sem mudar o ambiente Node do
  smoke Electron existente e sem Playwright (ver `plan.md`, **Testing**, e
  `adr/0005-harness-react-jsdom.md`).

### Alternativas descartadas
- Não decompor em três implementações funcionais completas nem em uma única árvore
  diferenciada apenas por CSS; layouts finos por slots equilibram liberdade visual e
  paridade funcional (ver ADR 0002).
- Não adicionar store externo, router, persistência web ou timers/rede para cenários;
  reducer/Context e estados determinísticos bastam para o grafo aprovado (ver ADR 0001 e
  `plan.md`, **Conteúdo e cenários**).
- Não sobrepor o dock, usar rail superior ou reduzir ratings a 1–5; a decisão aprovada é
  reflow em coluna própria e sliders 0–10 (ver ADR 0003).
- Não misturar famílias de ícones por presenter, buscar fontes em runtime, instalar
  Framer Motion separadamente ou introduzir E2E nesta issue (ver ADRs 0004/0005 e
  `plan.md`, **Dependências aprovadas**).

### Suposições validadas
- O modelo compartilhado suporta preservação de contexto, avaliações por conceito,
  favorita independente e reset por remontagem sem persistência (ver `plan.md`,
  **Sessão** e **Ações e invariantes**).
- A matriz visual pode ser construída a partir de fixtures base e `ScenarioSlice<T>`,
  evitando dados e lógica duplicados entre conceitos e cenários.
- Verificação automatizada e inspeção manual precisam permanecer separadas: jsdom cobre
  comportamento/semântica, mas não prova layout, GPU, contraste, hit targets ou motion
  (ver `plan.md`, **Cobertura automatizada** e **Manual verification**).

### Suposições invalidadas
- Uma dependência única de ícones não atende à exploração aprovada; duas famílias entram
  com atribuição rígida por conceito/camada.
- Um dock sobreposto não é aceitável em 1024×700; abrir o Lab exige reflow e layout
  compacto, com scroll vertical quando necessário.
- Somente CSS não cobre a continuidade espacial e o ambiente autoral desejados; Motion e
  shader degradável foram aprovados dentro dos limites do ADR 0002.

### Descobertas inesperadas
- Nenhuma. O Report da fase registra plano aprovado, zero gaps e nenhum trade-off aberto.

### Raciocínio comprimido (dead ends)
- Não criar tasks que entreguem um conceito inteiro antes da fundação compartilhada:
  isso favorece drift. Primeiro estabilizar modelo, catálogo, seletores, primitives e
  contratos de slots; depois implementar presenters e matriz comparável.
- Não tratar o shader como requisito de conteúdo: ele é um enhancement exclusivo de
  Night Harbor, lazy, removível sob reduced motion e coberto por fallback estático.
- Não usar testes DOM como evidência visual. Viewports, contraste, foco visível, motion,
  GPU/fallback e clipping devem virar uma task explícita de roteiro/evidências manuais.

### Contexto que a próxima fase PRECISA
- Decompor em incrementos com dependências explícitas: harness/dependências/assets;
  modelo + catálogo + seletores; primitives/foco/cenários; onboarding; shell/settings;
  Design Lab; layouts/conceitos/motion/shader; cobertura automatizada; roteiro manual e
  verify final.
- Cada task deve citar os ACs cobertos e incluir critérios verificáveis. O mapa inicial
  está em `plan.md`, **Cobertura automatizada**; os 38 critérios e a exigência de
  evidência manual permanecem em `spec.md`, **Acceptance criteria** e **Verification**.
- Preservar a sequência de implementação necessária para evitar retrabalho: contratos
  compartilhados antes dos conceitos, Design Lab sobre o mesmo store, e smoke matrix
  somente depois das três superfícies e dos quatro cenários existirem.
- Incluir uma task específica para a fonte Recursive WOFF2 + licença OFL e outra
  verificação de bundle que confirme shader em chunk lazy, ausência de fetch runtime e
  ausência de `lucide-react` (ver `plan.md`, **Verification approach**).
- O encerramento exige `npm run lint && npm run typecheck && npm run test`, mais
  `npm run build`, smoke native preservado, smoke matrix verde e roteiro manual completo.

### Riscos transferidos
- Drift funcional/semântico entre conceitos se presenters ganharem estado, ações ou
  ordem DOM próprios.
- Explosão combinatória da matriz 3 conceitos × 3 superfícies × 4 cenários se fixtures e
  testes não forem parametrizados desde a decomposição.
- Regressões de viewport e acessibilidade no dock aberto, Signal Poster e foco
  pós-navegação; tasks precisam reservar validação em 1024×700, zoom/texto ampliado,
  teclado e árvore acessível.
- Shader, motion e fonte podem afetar bundle, GPU, reduced motion e offline; manter
  lazy-loading, canvas único, fallback e checks de build definidos no plano.
- Configuração jsdom pode contaminar o smoke native; a task do harness deve preservar a
  seleção de ambiente por arquivo/pasta antes de adicionar testes React.
