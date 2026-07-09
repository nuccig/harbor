## Handoff: spec → plan

### Decisões tomadas
- A spec foi aprovada sem open questions e com 38 critérios; o plano deve tratar `spec.md` como baseline fechado, em especial **Scope**, **Constraints**, **Acceptance criteria** e **Verification**.
- As três direções visuais precisam compartilhar fluxo, conteúdo, controles e resultados; diferenças técnicas devem se limitar à apresentação, hierarquia e motion (ver `spec.md`, AC-008 e AC-013, além de AC-019–AC-021).
- A entrega é renderer-only, com dados simulados e estado efêmero da sessão; banco, IPC, preload, keychain e APIs privilegiadas estão explicitamente fora do escopo (ver `spec.md`, **Out** e AC-016).
- O Design Lab é infraestrutura temporária do experimento, transversal às telas, e precisa preservar contexto, avaliações e favorita sem se confundir com a navegação permanente (ver `spec.md`, AC-008–AC-010, AC-015, AC-035 e AC-038).
- O plano deve mapear cobertura automatizada de comportamento/montagem e evidência manual para todos os ACs visuais/interativos, além do verify gate da `constitution.md`.

### Alternativas descartadas
- Implementar três fluxos ou árvores de componentes funcionalmente independentes, pois isso comprometeria a equivalência comparável exigida pela spec.
- Introduzir integrações reais, persistência, mudanças no processo main ou uma matriz light/dark por conceito; todos são non-goals explícitos em `spec.md`.
- Eleger uma direção canônica ou tornar o Design Lab parte permanente do produto nesta fase.

### Suposições validadas
- O espaço de produto está fechado: onboarding, shell, settings, quatro cenários, avaliação, idioma, viewports e requisitos de acessibilidade/motion foram aprovados sem gaps.
- Estado local no renderer é suficiente para demonstrar preservação durante a sessão e reset após reload, sem arquitetura de persistência.
- Critérios visuais e de motion exigem inspeção humana mesmo quando houver testes automatizados relacionados.

### Suposições invalidadas
- Não há necessidade de planejar taxonomia de persistência ou separação entre preferências e credenciais nesta issue; a spec exclui dados sensíveis e persistência.
- O plano não deve convergir prematuramente para uma proposta visual única: as três permanecem entregáveis equivalentes.

### Descobertas inesperadas
- Nenhuma; a fase de spec terminou com `Open questions` vazio e o Report anterior registrou zero gaps.

### Raciocínio comprimido (dead ends)
- Não decompor a matriz de três conceitos × três áreas × quatro cenários como produtos separados; o plano deve procurar um modelo compartilhado de estado/conteúdo com variações visuais controladas.
- Não usar capacidades nativas do Electron para dar realismo ao protótipo; isso viola o limite aprovado sem melhorar o objetivo comparativo.

### Contexto que a próxima fase PRECISA
- Definir uma arquitetura renderer-only que preserve simultaneamente etapa/destino/categoria, conceito, cenário, dados simulados e avaliações, cobrindo os invariantes de AC-008–AC-018.
- Planejar componentes e contratos compartilhados para impedir divergência funcional entre conceitos, deixando tokens, composição e motion como pontos explícitos de variação.
- Incluir estratégia de foco pós-navegação, teclado, semântica assistiva, reduced motion, alvos de 44 px e responsividade em 1024×700 e 1440×900 (ver AC-026–AC-036).
- Produzir matriz de verificação que conecte cada grupo de ACs aos testes automatizados, smoke check e roteiro manual definidos em `spec.md`, **Verification**.
- Respeitar o boundary da `constitution.md`: dependência nova, migração ou expansão de escopo exige aprovação prévia.

### Riscos transferidos
- A combinação de conceitos, áreas e cenários pode gerar duplicação e drift funcional se o plano não centralizar estado, dados e ações.
- Alterações no shell global têm alto raio de regressão; a arquitetura e os testes precisam preservar montagem, navegação, localização atual e acesso ao Design Lab.
- Motion, densidade e contraste autorais podem degradar foco, legibilidade ou reduced motion; o plano precisa prever tokens/variantes auditáveis e verificação manual por conceito.
- O volume de critérios `requires-manual-verify` exige um roteiro de evidências executável, não apenas uma lista genérica de QA.
