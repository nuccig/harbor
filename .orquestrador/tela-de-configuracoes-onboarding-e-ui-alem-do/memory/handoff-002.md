## Handoff: grill-me → spec

### Decisões tomadas
- Especificar três propostas visuais comparáveis sobre o mesmo fluxo completo: onboarding → shell principal → settings. Os conceitos aprovados são **Command Deck** (claro, operacional), **Night Harbor** (escuro, modular) e **Signal Poster** (editorial, neo-brutalista e de alto contraste).
- Limitar a entrega a uma demonstração interativa com dados simulados e estado local não persistido. Detecção/instalação de CLIs, autenticação, credenciais, seleção nativa de pastas, sincronização e persistência ficam fora desta issue.
- Cobrir no onboarding `welcome`, `installed agents`, `issue integrations` e `first project`; etapas não essenciais podem ser puladas e devem desembocar em um estado vazio útil.
- Cobrir no shell `Overview`, `Projects`, `Sessions`, `Issues` e `Settings`; o overview demonstra projeto atual, sessões ativas, fila de issues, consumo recente e atividade.
- Organizar settings em `General`, `Appearance & motion`, `Agents`, `Integrations` e `Notifications`.
- Incluir um **Design Lab** transversal, exclusivo da avaliação, que troca conceito sem perder etapa ou dados simulados, alterna cenários `default/loading/empty/error` e registra localmente notas de clarity/personality/density/motion e favorita.
- Demonstrar success, disabled, keyboard focus e toast; tratar acessibilidade e reduced motion como constraints obrigatórias, em continuidade com `memory/handoff-001.md`.
- Escrever a UI em inglês e a spec/documentação em pt-BR. Suportar desktop responsivo a partir de 1024×700, com alvo 1440×900; mobile fica fora.

### Alternativas descartadas
- Três propostas cobrindo telas ou fluxos diferentes, porque impediria comparação controlada.
- Implementar integrações nativas, credenciais ou persistência nesta issue, porque o objetivo aprovado é avaliar experiência e direção visual com simulação.
- Exigir light e dark completos para cada conceito, porque transformaria três propostas em seis; cada conceito terá uma paleta autoral principal.
- Avaliação apenas por navegação informal, porque o Design Lab deve permitir comparação estruturada sem enviar ou persistir resultados.

### Suposições validadas
- O fluxo comum onboarding → app principal → settings é suficiente para comparar estrutura, estética e motion nas três propostas.
- Estados vazios são parte da jornada válida: agentes, integrações e primeiro projeto podem ser adiados sem bloquear entrada no app.
- O Design Lab é ferramenta temporária de experimento e não funcionalidade do produto final.

### Suposições invalidadas
- A necessidade transferida em `memory/handoff-001.md` de definir persistência e separação entre preferência comum e credencial não se aplica à implementação desta issue: todo o estado será simulado, local à sessão e não sensível.
- A entrega não busca uma direção visual única nesta fase; a escolha canônica ocorrerá depois da comparação das três propostas.

### Descobertas inesperadas
- Nenhuma; o grill fechou o espaço de decisão de produto/UX sem gaps adicionais.

### Raciocínio comprimido (dead ends)
- Não expandir o protótipo para integrações reais nem para uma matriz tema claro/escuro por conceito; ambas diluem o experimento comparativo aprovado.
- Não incorporar o Design Lab à arquitetura permanente do produto: ele existe somente para preservar contexto, simular estados e registrar avaliação durante a comparação.

### Contexto que a próxima fase PRECISA
- Converter as decisões acima em requisitos e critérios observáveis comuns às três propostas, mantendo os gates e a exigência de verificação manual visual/motion definidos em `constitution.md` e `memory/handoff-001.md`.
- Explicitar na seção de escopo que dados, avaliações e favorita vivem apenas no estado local da sessão e que nenhuma ação privilegiada do Electron faz parte da entrega.
- Tornar verificável que a troca de conceito preserva etapa/dados, que os quatro cenários são acessíveis em todas as propostas e que reduced motion não remove informação.

### Riscos transferidos
- A matriz de três conceitos × três áreas × quatro cenários pode inflar o escopo; a spec deve exigir componentes/fluxos equivalentes, não três produtos independentes.
- Alterações no shell global continuam com alto raio de regressão; critérios devem cobrir navegação, foco, estados ativos e montagem das telas conforme a constitution.
- Diferenças visuais fortes podem romper equivalência funcional ou acessibilidade; cada conceito precisa satisfazer os mesmos critérios, incluindo teclado, foco visível e reduced motion.
