---
title: Configurações, onboarding e Design Lab
status: approved
created: 2026-07-09
---

# Spec — Configurações, onboarding e Design Lab

## Problem

O Harbor ainda apresenta apenas um placeholder e, por isso, não permite avaliar como uma pessoa conhece o produto, entra no centro operacional e ajusta suas preferências. A issue nucci-projects #29 deve produzir uma demonstração comparável de três direções visuais sobre a mesma experiência, antes de eleger uma direção canônica ou conectar o fluxo a capacidades nativas.

## Users & job to be done

O público é uma pessoa desenvolvedora que usa coding agents e precisa entender rapidamente o estado de seus projetos, sessões e issues em um aplicativo desktop.

Seu trabalho nesta entrega é percorrer o primeiro uso, reconhecer a estrutura operacional do Harbor, explorar configurações e comparar três direções de interface sob o mesmo conteúdo, estado e sequência de ações.

## Outcomes

- Permitir comparar estrutura, estética e motion sem confundir diferenças de conceito com diferenças funcionais.
- Demonstrar a jornada completa `onboarding → shell principal → settings` com dados simulados.
- Tornar estados normais e adversos comparáveis e recuperáveis.
- Produzir uma avaliação local e estruturada que apoie a escolha posterior de uma direção canônica.
- Estabelecer um patamar verificável de navegação por teclado, foco e preferência por movimento reduzido.

## Scope

**In:**

- Três conceitos navegáveis — **Command Deck**, **Night Harbor** e **Signal Poster** — aplicados ao mesmo conteúdo e fluxo.
- Onboarding com as etapas `Welcome`, `Installed agents`, `Issue integrations` e `First project`.
- Possibilidade de adiar configurações não essenciais e entrar no shell com um estado vazio útil.
- Shell com navegação para `Overview`, `Projects`, `Sessions`, `Issues` e `Settings`.
- Overview com projeto atual, sessões de agentes ativas, fila de issues, consumo recente e atividade.
- Settings com `General`, `Appearance & motion`, `Agents`, `Integrations` e `Notifications`.
- Design Lab transversal para trocar conceito e cenário, além de registrar avaliações locais de `Clarity`, `Personality`, `Density` e `Motion` e uma proposta favorita.
- Cenários `Default`, `Loading`, `Empty` e `Error` para onboarding, shell principal e settings.
- Demonstrações de sucesso, controle desabilitado, foco de teclado e toast.
- Dados simulados e estado local somente durante a sessão em execução.
- Interface do produto em inglês; documentação da feature em pt-BR.
- Desktop responsivo a partir de 1024×700, com 1440×900 como viewport de avaliação principal.

**Out (explicit non-goals):**

- Detectar, instalar, executar ou validar CLIs de coding agents.
- Autenticar serviços, validar tokens, manipular credenciais ou acessar o keychain.
- Selecionar pastas pelo sistema operacional ou acessar arquivos locais.
- Sincronizar projetos, sessões, issues, consumo ou atividade com fontes reais.
- Persistir preferências, dados simulados, avaliações ou favorita após encerrar/recarregar a sessão.
- Alterar banco de dados, schema, IPC, preload ou APIs privilegiadas do Electron.
- Entregar temas claro e escuro para cada conceito; cada proposta possui uma única paleta autoral principal.
- Eleger ou transformar uma proposta na direção canônica do produto nesta issue.
- Incorporar o Design Lab como funcionalidade permanente do Harbor.
- Suportar layouts mobile ou viewports menores que 1024×700.
- Definir a arquitetura, bibliotecas, rotas, schemas ou estratégia técnica de implementação.

## Constraints

- Os três conceitos devem permanecer funcionalmente equivalentes; diferenças são de apresentação, hierarquia visual e comportamento de motion.
- O Design Lab é uma ferramenta temporária de comparação e deve permanecer distinguível da navegação do produto.
- Toda informação exibida é simulada, não sensível e local à sessão em execução.
- Motion ambiental é não informacional, permanece atrás do conteúdo, não intercepta o ponteiro e deixa de se mover quando a pessoa solicita movimento reduzido.
- Nenhuma informação, relação de hierarquia ou confirmação pode depender apenas de cor ou movimento.
- A experiência segue o baseline desktop e de segurança já aceito pelo projeto, sem acesso privilegiado pelo renderer.

## Prior decisions

- ADR 0002 fixa TypeScript e Node 20+ como linguagem e runtime.
- ADR 0003 fixa Electron como plataforma desktop.
- ADR 0004 fixa React 18+ e Vite para o renderer.
- ADR 0009 fixa o verify gate e mantém E2E opcional até existir uma superfície estável.
- ADR 0011 fixa isolamento de contexto, sandbox e ausência de acesso Node direto pelo renderer.
- `constitution.md` exige cobertura automatizada dos comportamentos aprovados, smoke check de montagem e o verify gate verde.
- `memory/handoff-001.md` fixa segurança do renderer, acessibilidade, limite do motion ambiental e verificação manual de critérios visuais.
- `memory/handoff-002.md` registra como aprovadas todas as decisões de fluxo, escopo, conceitos, cenários, avaliação, idioma e viewport desta spec.

## Acceptance criteria

Todo critério marcado com `requires-manual-verify: true` exige uma verificação humana explícita além de qualquer cobertura automatizada aplicável.

### Event-driven (WHEN/THEN)

- [ ] **AC-001** — **WHEN** a demonstração é aberta em uma sessão nova **THEN** a etapa `Welcome` do onboarding é exibida com indicação da posição atual em uma sequência de quatro etapas e ações explícitas para avançar. `requires-manual-verify: true`
- [ ] **AC-002** — **WHEN** a pessoa avança e retorna no onboarding **THEN** ela percorre, na ordem, `Welcome`, `Installed agents`, `Issue integrations` e `First project`, sem perder as escolhas simuladas já feitas. `requires-manual-verify: true`
- [ ] **AC-003** — **WHEN** a pessoa adia `Installed agents` ou `Issue integrations` **THEN** o onboarding informa que a configuração pode ser concluída depois e permite continuar. `requires-manual-verify: true`
- [ ] **AC-004** — **WHEN** a pessoa adia `First project` **THEN** ela consegue concluir o onboarding e entrar no shell em um estado vazio que explica como adicionar um projeto futuramente. `requires-manual-verify: true`
- [ ] **AC-005** — **WHEN** a pessoa conclui o onboarding com os dados simulados padrão **THEN** o shell abre em `Overview` e mostra projeto atual, sessões ativas, fila de issues, consumo recente e atividade. `requires-manual-verify: true`
- [ ] **AC-006** — **WHEN** a pessoa escolhe `Overview`, `Projects`, `Sessions`, `Issues` ou `Settings` **THEN** o conteúdo correspondente é exibido, a localização atual fica identificável e a navegação principal permanece disponível. `requires-manual-verify: true`
- [ ] **AC-007** — **WHEN** a pessoa abre `Settings` e escolhe uma categoria **THEN** pode acessar `General`, `Appearance & motion`, `Agents`, `Integrations` e `Notifications`, com a categoria atual identificável. `requires-manual-verify: true`
- [ ] **AC-008** — **WHEN** a pessoa troca entre Command Deck, Night Harbor e Signal Poster no Design Lab, inclusive a partir de `Appearance & motion` **THEN** a tela atual muda para o conceito escolhido sem alterar a etapa do onboarding, destino do shell, categoria de settings, cenário ou dados simulados correntes. `requires-manual-verify: true`
- [ ] **AC-009** — **WHEN** a pessoa seleciona `Default`, `Loading`, `Empty` ou `Error` no Design Lab **THEN** a área atual apresenta a versão correspondente do mesmo conteúdo e mantém o conceito selecionado. `requires-manual-verify: true`
- [ ] **AC-010** — **WHEN** a pessoa registra valores para `Clarity`, `Personality`, `Density` e `Motion` ou escolhe uma favorita **THEN** o Design Lab reflete a avaliação imediatamente e a mantém durante a navegação e troca de conceitos na sessão corrente. `requires-manual-verify: true`
- [ ] **AC-011** — **WHEN** uma ação simulada é concluída com sucesso **THEN** a interface mostra confirmação coerente com o nome da ação, incluindo ao menos uma demonstração por toast que não desloca o foco atual. `requires-manual-verify: true`
- [ ] **AC-012** — **WHEN** a pessoa aciona a recuperação oferecida no cenário `Error` **THEN** a área atual retorna a um estado utilizável ou repete claramente a simulação, sem bloquear a navegação para outras áreas. `requires-manual-verify: true`

### Stateful (GIVEN/WHEN/THEN)

- [ ] **AC-013** — **GIVEN** o mesmo ponto do fluxo, cenário e conjunto de dados simulados **WHEN** cada conceito é selecionado **THEN** os mesmos conteúdos, controles, ações disponíveis, estados e resultados são encontrados nas três propostas. `requires-manual-verify: true`
- [ ] **AC-014** — **GIVEN** escolhas simuladas realizadas no onboarding **WHEN** a pessoa retorna a uma etapa anterior ou troca de conceito **THEN** os valores escolhidos continuam presentes até serem alterados pela própria pessoa. `requires-manual-verify: true`
- [ ] **AC-015** — **GIVEN** avaliações preenchidas no Design Lab **WHEN** a pessoa alterna entre onboarding, shell e settings **THEN** as avaliações e a favorita continuam disponíveis durante a sessão corrente. `requires-manual-verify: true`
- [ ] **AC-016** — **GIVEN** qualquer estado alterado na demonstração **WHEN** uma nova sessão é iniciada ou a aplicação é recarregada **THEN** dados simulados, avaliações e favorita voltam aos valores iniciais, sem alegar salvamento permanente. `requires-manual-verify: true`
- [ ] **AC-017** — **GIVEN** o cenário `Loading` **WHEN** uma ação dependente do carregamento é apresentada **THEN** seu progresso é perceptível, ações incompatíveis ficam indisponíveis e a navegação para o Design Lab e para saídas seguras não fica bloqueada. `requires-manual-verify: true`
- [ ] **AC-018** — **GIVEN** um controle demonstrado como desabilitado **WHEN** ele recebe clique, Enter ou Espaço **THEN** nenhuma ação é executada e seu estado indisponível é perceptível visualmente e por tecnologia assistiva. `requires-manual-verify: true`

### Conditional (WHERE/WHEN/THEN)

- [ ] **AC-019** — **WHERE** Command Deck está selecionado **WHEN** onboarding, Overview ou Settings é exibido **THEN** a proposta usa uma superfície predominantemente clara, prioriza alta densidade de informação operacional e mantém ações próximas aos indicadores que elas afetam. `requires-manual-verify: true`
- [ ] **AC-020** — **WHERE** Night Harbor está selecionado **WHEN** onboarding, Overview ou Settings é exibido **THEN** a proposta usa uma superfície predominantemente escura, separa os módulos em agrupamentos visualmente distintos com acentos azul/lilás e emprega continuidade espacial nas mudanças de contexto. `requires-manual-verify: true`
- [ ] **AC-021** — **WHERE** Signal Poster está selecionado **WHEN** onboarding, Overview ou Settings é exibido **THEN** a proposta usa contraste preto/lavanda, hierarquia editorial com títulos de escala claramente superior ao corpo, alinhamento por grid retangular e transições diretas, sem depender de profundidade para organizar conteúdo. `requires-manual-verify: true`
- [ ] **AC-022** — **WHERE** o cenário `Default` está selecionado **WHEN** qualquer uma das três áreas do fluxo é visitada **THEN** ela apresenta conteúdo simulado preenchido e ações suficientes para percorrer o fluxo principal. `requires-manual-verify: true`
- [ ] **AC-023** — **WHERE** o cenário `Loading` está selecionado **WHEN** onboarding, shell principal ou settings é visitado **THEN** cada área comunica quais conteúdos aguardam carregamento sem se parecer com um estado vazio ou de erro. `requires-manual-verify: true`
- [ ] **AC-024** — **WHERE** o cenário `Empty` está selecionado **WHEN** onboarding, shell principal ou settings é visitado **THEN** cada área explica a ausência de conteúdo e oferece uma próxima ação pertinente ou informa que a configuração pode ser feita depois. `requires-manual-verify: true`
- [ ] **AC-025** — **WHERE** o cenário `Error` está selecionado **WHEN** onboarding, shell principal ou settings é visitado **THEN** cada área identifica o que falhou e apresenta uma rota clara de recuperação ou saída. `requires-manual-verify: true`
- [ ] **AC-026** — **WHERE** movimento reduzido está ativo no sistema **WHEN** qualquer conceito ou transição é exibido **THEN** motion ambiental para, transições não essenciais são removidas ou simplificadas e todo conteúdo, estado e relação causal continuam compreensíveis. `requires-manual-verify: true`
- [ ] **AC-027** — **WHERE** a viewport mede 1024×700 **WHEN** qualquer etapa, área, categoria ou painel do Design Lab é exibido **THEN** conteúdo e ações essenciais permanecem legíveis e alcançáveis sem sobreposição, corte ou rolagem horizontal da janela. `requires-manual-verify: true`
- [ ] **AC-028** — **WHERE** a viewport mede 1440×900 **WHEN** `Overview` é exibido **THEN** os cinco grupos de informação operacional são distinguíveis em uma única visão inicial ou por uma sequência de leitura evidente, sem áreas vazias dominantes que prejudiquem a comparação de densidade. `requires-manual-verify: true`

### Continuous (WHILE/THEN)

- [ ] **AC-029** — **WHILE** a demonstração estiver em uso **THEN** todo texto visível do produto, incluindo navegação, rótulos, ajuda, estados, erros, avaliações e confirmações, permanece em inglês. `requires-manual-verify: true`
- [ ] **AC-030** — **WHILE** a pessoa usa apenas o teclado **THEN** todas as ações do onboarding, shell, settings e Design Lab são alcançáveis e acionáveis em uma ordem coerente, sem armadilha de foco. `requires-manual-verify: true`
- [ ] **AC-031** — **WHILE** um elemento interativo possui foco de teclado **THEN** o foco permanece claramente visível em cada conceito e não é indicado apenas por uma mudança sutil de cor. `requires-manual-verify: true`
- [ ] **AC-032** — **WHILE** controles, estados dinâmicos, erros e toasts são apresentados **THEN** nomes, papéis, seleção, expansão, indisponibilidade e mensagens relevantes podem ser identificados por tecnologia assistiva; cor nunca é o único sinal. `requires-manual-verify: true`
- [ ] **AC-033** — **WHILE** a interface é operada em 1024×700 ou 1440×900 **THEN** os alvos primários de interação mantêm área acionável mínima de 44×44 px e não dependem de hover para revelar sua função principal. `requires-manual-verify: true`
- [ ] **AC-034** — **WHILE** motion ambiental estiver ativo **THEN** ele permanece visualmente atrás do conteúdo, não comunica dados ou estado, não intercepta o ponteiro e não prejudica legibilidade ou acionamento. `requires-manual-verify: true`
- [ ] **AC-035** — **WHILE** a pessoa percorre qualquer conceito **THEN** o Design Lab continua alcançável, visualmente separado da navegação permanente do Harbor e capaz de indicar conceito e cenário atuais. `requires-manual-verify: true`

### Post-condition (AFTER/THEN)

- [ ] **AC-036** — **AFTER** uma mudança de etapa, destino principal ou categoria de settings **THEN** o foco é encaminhado para o novo conteúdo ou para um ponto de orientação equivalente, preservando uma sequência de leitura previsível. `requires-manual-verify: true`
- [ ] **AC-037** — **AFTER** qualquer uma das telas afetadas é montada **THEN** a raiz do Harbor e o conteúdo esperado são exibidos sem tela em branco, erro não tratado ou perda da navegação necessária ao fluxo. `requires-manual-verify: true`
- [ ] **AC-038** — **AFTER** uma proposta favorita é escolhida **THEN** ela fica identificada no Design Lab como preferência de avaliação, sem alterar automaticamente o conceito ativo, persistir a escolha ou apresentá-la como decisão canônica do produto. `requires-manual-verify: true`

## Verification

| Grupo | ACs | Evidência esperada |
|---|---|---|
| Fluxo e navegação | AC-001–AC-008, AC-036–AC-037 | Testes automatizados de comportamento e montagem; roteiro manual nos três conceitos |
| Design Lab e estado local | AC-008–AC-010, AC-013–AC-016, AC-035, AC-038 | Testes automatizados de preservação/reset; inspeção manual da equivalência |
| Cenários e feedback | AC-011–AC-012, AC-017–AC-018, AC-022–AC-025 | Testes automatizados de estados e ações; inspeção manual de clareza e recuperação |
| Diferenças observáveis | AC-019–AC-021, AC-028 | Comparação visual manual nas mesmas telas, dados e viewport |
| Acessibilidade e motion | AC-026–AC-027, AC-029–AC-034, AC-036 | Navegação manual por teclado, inspeção com tecnologia assistiva e teste do sistema com movimento reduzido |
| Qualidade global | Todos | `npm run lint && npm run typecheck && npm run test`, além do smoke check exigido pela constitution |

## Open questions

Nenhuma.

## References

- Issue source: nucci-projects #29.
- [Botrix — AI Command Center Dashboard Design](https://dribbble.com/shots/27308451-Botrix-AI-Command-Center-Dashboard-Design), referência aprovada para Command Deck.
- [Education SaaS App](https://dribbble.com/shots/23042176-Education-SAAS-App), referência aprovada para Night Harbor.
- [AI SaaS UI/UX Design for Rizzle](https://dribbble.com/shots/24681174--Case-Study-AI-SaaS-UI-UX-Design-for-Rizzle), referência aprovada para Signal Poster.
- [Communication SaaS Dashboard Design](https://dribbble.com/shots/27538742-Communication-SaaS-Dashboard-Design), referência aprovada para hierarquia de Signal Poster.
- `docs/adr/0002-typescript-node-runtime.md`
- `docs/adr/0003-electron-desktop-framework.md`
- `docs/adr/0004-react-vite-frontend.md`
- `docs/adr/0009-verify-gate-commands.md`
- `docs/adr/0011-electron-security-baseline.md`
- `.orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/constitution.md`
- `.orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/memory/handoff-001.md`
- `.orquestrador/tela-de-configuracoes-onboarding-e-ui-alem-do/memory/handoff-002.md`
