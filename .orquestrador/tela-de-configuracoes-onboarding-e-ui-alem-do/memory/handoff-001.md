## Handoff: brain-recall → spec

### Decisões tomadas
- Tratar settings como uma capacidade Electron nativa: renderer isolado, IPC tipado via preload/contextBridge e credenciais exclusivamente no keychain.
- Exigir direção visual explícita, tokenizada e coerente; motion ambiental deve ser não informacional, permanecer atrás do conteúdo, ignorar ponteiro e congelar com `prefers-reduced-motion`.
- Tornar acessibilidade parte dos critérios funcionais: nomes acessíveis, estado `aria-expanded`, teclado/foco e alvos de interação de pelo menos 44 px.
- Marcar critérios visuais e de motion como `requires-manual-verify`, além da cobertura automatizada exigida pela constitution.

### Alternativas descartadas
- Cursor customizado, por degradar convenções e acessibilidade de desktop.
- Ornamento que substitua navegação ou faça o produto parecer uma landing page, por conflitar com a função operacional do Harbor.
- Acesso direto do renderer a APIs privilegiadas ou credenciais, por violar isolamento e o boundary de segurança.

### Suposições validadas
- Settings, onboarding e UI além do placeholder formam uma feature separada do scaffold; o limite já foi explicitado em `.orquestrador/scaffold-inicial/spec.md` na seção **Out**.

### Suposições invalidadas
- Nenhuma decisão anterior específica pode ser reutilizada para definir o fluxo de primeiro uso ou a UX desktop de coding agents; essas escolhas ainda precisam ser especificadas.

### Descobertas inesperadas
- Não há precedentes específicos no projeto para taxonomia de settings, persistência de preferências, onboarding ou UX de coding agents; somente constraints arquiteturais e de qualidade são transferíveis.

### Raciocínio comprimido (dead ends)
- Não transformar referências visuais genéricas em requisitos presumidos: sem decisão anterior de produto, a spec precisa obter respostas explícitas para fluxo, estados e limites de motion.

### Contexto que a próxima fase PRECISA
- Decidir o fluxo de primeiro uso, incluindo conclusão, abandono e eventual reentrada no onboarding.
- Definir taxonomia e persistência das preferências, distinguindo configuração sensível (keychain) de preferência comum.
- Cobrir estados empty, loading e error, além de navegação por teclado, gestão de foco e comportamento com reduced motion.
- Manter os critérios alinhados ao verify gate e smoke check definidos em `constitution.md`; critérios estéticos/motion exigem verificação manual explícita.

### Riscos transferidos
- Alterações no shell/chrome global podem regredir todas as telas; a futura verificação deve cobrir onboarding, settings, app principal, modais, active state e escopo de tema.
- Motion em primeiro plano ou informacional pode competir com conteúdo e falhar em acessibilidade; limites observáveis devem constar na spec.
- Uma taxonomia de preferências mal definida pode misturar dados sensíveis e configuração comum, criando risco de persistência insegura.
