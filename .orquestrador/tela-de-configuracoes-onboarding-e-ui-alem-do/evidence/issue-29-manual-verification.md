# Issue 29 — verificação manual final

**Status:** PASS  
**Data:** 2026-07-09  
**Runtime:** app Harbor buildado (`electron .`) em Electron real, controlado por harness externo do Codex via Playwright `_electron` no Node REPL. Playwright não foi adicionado ao produto nem ao `package.json`.
**Relatório anterior substituído:** a primeira tentativa falhou por Browser interno indisponível e crash de main; ambos foram reexecutados após as correções de build.

## Sumário da evidência

| Item | Resultado |
| --- | --- |
| Matriz 1024×700 | 36/36 combinações `conceito × superfície × cenário`, com Design Lab aberto e recolhido. |
| Capturas 1440×900 | 9/9 capturas comparáveis em Default para onboarding, Overview e Settings nos três conceitos. |
| Capturas adversas 1024×700 | 9/9 capturas: Loading no onboarding, Empty no Overview e Error em Settings para os três conceitos. |
| Teclado | Etapas, cinco destinos, cinco categorias, quatro sliders, favorita, toast, recovery, disabled e Escape percorridos por teclado. |
| Acessibilidade | Árvore AX com 172 nós; roles incluem `button`, `navigation`, `main`, `complementary`, `heading`, `status`, `region`, `link`. |
| Contraste Signal Poster pós-correção | `inkCanvas` 12.62:1, `mutedCanvas` 8.02:1, `focusCanvas` 12.62:1, `borderCanvas` 12.62:1. |
| Layout 1024×700 | `htmlOverflowX/bodyOverflowX = 0` em todas as células; alvos primários mínimos = 44×44 px; sobreposição Lab/produto = 0. |
| Motion | Reduced motion remove NightAmbient/canvas; normal motion mantém canvas único atrás do conteúdo e `pointer-events: none`; backend forçado indisponível renderiza fallback CSS com `canvasCount=0`. |
| Reload/reset | Antes: Signal Poster + Error + favorita Signal Poster; depois: Command Deck + Default + Welcome + “No evaluation favorite yet.” |
| Verify gate pós-fix | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` e `npm run build:app -- --dir --config.asar=false` passaram com exit 0. |
| Smoke preload pós-fix | `window.harbor.ping()` retornou `pong`; 0 erros de preload após gerar `out/preload/index.mjs` em CJS. |

## Capturas persistidas

| Conceito | Onboarding / Default | Overview / Default | Settings / Default |
| --- | --- | --- | --- |
| Command Deck | [AC-019-command-deck-onboarding-default-1440x900.png](screenshots/issue-29/AC-019-command-deck-onboarding-default-1440x900.png) | [AC-019-command-deck-overview-default-1440x900.png](screenshots/issue-29/AC-019-command-deck-overview-default-1440x900.png) | [AC-019-command-deck-settings-default-1440x900.png](screenshots/issue-29/AC-019-command-deck-settings-default-1440x900.png) |
| Night Harbor | [AC-020-night-harbor-onboarding-default-1440x900.png](screenshots/issue-29/AC-020-night-harbor-onboarding-default-1440x900.png) | [AC-020-night-harbor-overview-default-1440x900.png](screenshots/issue-29/AC-020-night-harbor-overview-default-1440x900.png) | [AC-020-night-harbor-settings-default-1440x900.png](screenshots/issue-29/AC-020-night-harbor-settings-default-1440x900.png) |
| Signal Poster | [AC-021-signal-poster-onboarding-default-1440x900.png](screenshots/issue-29/AC-021-signal-poster-onboarding-default-1440x900.png) | [AC-021-signal-poster-overview-default-1440x900.png](screenshots/issue-29/AC-021-signal-poster-overview-default-1440x900.png) | [AC-021-signal-poster-settings-default-1440x900.png](screenshots/issue-29/AC-021-signal-poster-settings-default-1440x900.png) |

| Conceito | 1024×700 adverso |
| --- | --- |
| Command Deck | [Loading onboarding](screenshots/issue-29/AC-027-command-deck-onboarding-loading-1024x700.png), [Empty overview](screenshots/issue-29/AC-027-command-deck-overview-empty-1024x700.png), [Error settings](screenshots/issue-29/AC-027-command-deck-settings-error-1024x700.png) |
| Night Harbor | [Loading onboarding](screenshots/issue-29/AC-027-night-harbor-onboarding-loading-1024x700.png), [Empty overview](screenshots/issue-29/AC-027-night-harbor-overview-empty-1024x700.png), [Error settings](screenshots/issue-29/AC-027-night-harbor-settings-error-1024x700.png) |
| Signal Poster | [Loading onboarding](screenshots/issue-29/AC-027-signal-poster-onboarding-loading-1024x700.png), [Empty overview](screenshots/issue-29/AC-027-signal-poster-overview-empty-1024x700.png), [Error settings](screenshots/issue-29/AC-027-signal-poster-settings-error-1024x700.png) |

## Matriz 1024×700

| Conceito | Superfície | Default | Loading | Empty | Error |
| --- | --- | --- | --- | --- | --- |
| Command Deck | Onboarding | PASS | PASS | PASS | PASS |
| Command Deck | Overview | PASS | PASS | PASS | PASS |
| Command Deck | Settings | PASS | PASS | PASS | PASS |
| Night Harbor | Onboarding | PASS | PASS | PASS | PASS |
| Night Harbor | Overview | PASS | PASS | PASS | PASS |
| Night Harbor | Settings | PASS | PASS | PASS | PASS |
| Signal Poster | Onboarding | PASS | PASS | PASS | PASS |
| Signal Poster | Overview | PASS | PASS | PASS | PASS |
| Signal Poster | Settings | PASS | PASS | PASS | PASS |

Observação: a medição automática registrou oito clips subpixel/offscreen durante Lab aberto, todos sem overflow horizontal. Sete eram o skip link fora da viewport quando não focado; um era o botão Continue de Night Harbor em `x ≈ -1.9px`, ainda visível e acionável. As células recolhidas ficaram sem clips e sem overflow.

## Evidência por critério

| AC | Status | Procedimento | Resultado observado | Evidência |
| --- | --- | --- | --- | --- |
| AC-001 | PASS | Abrir sessão nova em Electron real. | Welcome exibido como etapa 1/4 com ações explícitas. | Screenshot AC-019 onboarding; foco inicial em `Welcome`. |
| AC-002 | PASS | Avançar e voltar nas quatro etapas por teclado. | Ordem observada: Welcome → Installed agents → Issue integrations → First project → Back para Issue integrations; escolhas preservadas. | `keyboard.stepFocus` com 5 amostras e outline 3px. |
| AC-003 | PASS | Acionar Skip em Installed agents e Issue integrations. | Mensagens “Agent setup was skipped” e “Issue integration setup was skipped” apareceram e o fluxo continuou. | `installedSkipText=true`, `integrationSkipText=true`. |
| AC-004 | PASS | Adiar configuração e concluir onboarding. | Shell abriu com estado vazio útil quando aplicável e navegação segura disponível. | Matriz 1024×700 em `Empty` nas três superfícies. |
| AC-005 | PASS | Concluir onboarding padrão. | Overview exibiu projeto atual, sessões, fila de issues, consumo recente e atividade. | 3 screenshots Overview 1440×900 + textos da matriz. |
| AC-006 | PASS | Selecionar Overview, Projects, Sessions, Issues e Settings. | Conteúdo correspondente exibido, localização atual identificável e nav principal persistente. | `keyboard.destinationFocus` com 6 amostras. |
| AC-007 | PASS | Abrir Settings e percorrer cinco categorias. | General, Appearance & motion, Agents, Integrations e Notifications acessíveis com categoria atual. | `keyboard.categoryFocus` com 6 amostras. |
| AC-008 | PASS | Trocar Command Deck, Night Harbor e Signal Poster no Lab. | Conceito mudou sem alterar superfície/cenário correntes; troca por setas também funcionou. | Matriz 36/36 e `conceptAfterArrow=night-harbor`. |
| AC-009 | PASS | Trocar Default, Loading, Empty e Error. | A área corrente renderizou o cenário escolhido e preservou conceito. | Matriz 36/36; `scenarioAfterArrow=loading`. |
| AC-010 | PASS | Alterar quatro ratings e marcar favorita. | Sliders alcançaram Home=0, ArrowRight=1, End=10; favorita refletida imediatamente. | 4 `sliderResults`; `Preference: Night Harbor.` |
| AC-011 | PASS | Simular conexão Linear. | Toast coerente apareceu com `aria-live=polite`; foco permaneceu no botão. | Toast “Linear connection simulated”; foco antes/depois igual. |
| AC-012 | PASS | Acionar recovery em Error. | Cenário voltou para `default` sem bloquear navegação. | `keyboard.recovery=default`. |
| AC-013 | PASS | Comparar mesmos dados nas três propostas. | Conteúdos, controles, estados e resultados encontrados nas três propostas. | Matriz 36/36 e 9 capturas comparáveis. |
| AC-014 | PASS | Retornar no onboarding e trocar conceito. | Escolhas simuladas continuaram presentes até alteração explícita. | Fluxo Back + troca de conceito na mesma sessão. |
| AC-015 | PASS | Preencher avaliações e alternar áreas. | Avaliações e favorita permaneceram durante a sessão corrente. | Design Lab preservou favorita e sliders durante navegação. |
| AC-016 | PASS | Alterar estado, recarregar e reabrir Lab. | Reset retornou para Command Deck/Default/Welcome e favorita voltou para “No evaluation favorite yet.” | `reload.before` vs `reload.after`. |
| AC-017 | PASS | Inspecionar Loading. | Progresso perceptível; ação incompatível desabilitada; Lab e saídas seguras mantidos. | 9 branches Loading + disabled probe. |
| AC-018 | PASS | Acionar controle disabled por clique, Enter e Espaço. | Nenhuma ação executada; cenário permaneceu Loading; sem toast indevido. | `disabled.afterScenario=loading`, `toastCreated=false`. |
| AC-019 | PASS | Comparar Command Deck nas três superfícies. | Superfície clara, densidade operacional e ações próximas aos indicadores. | 3 screenshots AC-019. |
| AC-020 | PASS | Comparar Night Harbor nas três superfícies. | Superfície escura, módulos distintos, acentos azul/lilás e continuidade espacial. | 3 screenshots AC-020; motion normal com canvas único. |
| AC-021 | PASS | Comparar Signal Poster nas três superfícies após correção. | Preto/lavanda preservado com brutalismo/zero-radius, grid retangular e contraste legível. | 3 screenshots AC-021; `focusCanvas=12.62:1`. |
| AC-022 | PASS | Visitar Default nas três áreas e conceitos. | Conteúdo simulado preenchido e ações do fluxo principal disponíveis. | 9 branches Default. |
| AC-023 | PASS | Visitar Loading nas três áreas e conceitos. | Carregamento comunicado sem parecer vazio ou erro. | 9 branches Loading. |
| AC-024 | PASS | Visitar Empty nas três áreas e conceitos. | Ausência de conteúdo explicada com próxima ação ou instrução. | 9 branches Empty. |
| AC-025 | PASS | Visitar Error nas três áreas e conceitos. | Falha identificada com rota clara de recuperação/saída. | 9 branches Error + recovery default. |
| AC-026 | PASS | Emular `prefers-reduced-motion: reduce`. | NightAmbient/canvas ausentes; transições reduzidas para 0.001s; conteúdo preservado. | `motion.reduced.mediaMatches=true`, `ambient=false`, `canvas=0`. |
| AC-027 | PASS | Medir 1024×700 em 36 células, Lab aberto/recolhido. | Sem overflow horizontal; ações essenciais legíveis/alcançáveis; Lab não sobrepôs produto. | `matrix=36`, overflow 0, overlap 0, screenshots AC-027. |
| AC-028 | PASS | Inspecionar Overview em 1440×900. | Cinco grupos distinguíveis por leitura evidente, sem vazios dominantes. | 3 screenshots Overview 1440×900. |
| AC-029 | PASS | Revisar texto visível em fluxo, estados, Lab e toast. | Produto permaneceu em inglês; documentação segue pt-BR. | `lang=en`; body text e toast em inglês. |
| AC-030 | PASS | Operar apenas com teclado. | Onboarding, shell, Settings e Lab alcançáveis; sem armadilha de foco. | Tab/Enter/Setas/Home/End/Escape completados. |
| AC-031 | PASS | Verificar foco em conceitos e controles. | Foco visível com outline; Signal Poster corrigido para foco/canvas 12.62:1. | `outlineWidth=3px` em headings/botões; contraste de foco. |
| AC-032 | PASS | Inspecionar árvore acessível e DOM semântico. | Nomes, papéis, current, expanded, disabled, status/toast e headings identificáveis; cor não é único sinal. | AX 172 nós; roles e DOM state registrados. |
| AC-033 | PASS | Medir alvos primários em 1024×700/1440×900. | Alvo primário mínimo observado = 44 px; função principal não depende de hover. | `minPrimary=44.0`. |
| AC-034 | PASS | Inspecionar NightAmbient. | Ambiente atrás do conteúdo, não informacional, sem cursor trail e sem interceptar ponteiro; desmonta ao trocar conceito; fallback CSS aparece quando WebGPU/WebGL2 são forçados indisponíveis. | Normal: `canvasCount=1`, `pointer-events:none`; forced fallback: `canvasCount=0`, `cssFallbackLayer=true`. |
| AC-035 | PASS | Abrir/recolher Design Lab e usar Escape. | Lab alcançável, separado da navegação permanente e indica conceito/cenário atuais; Escape recolhe e devolve acesso ao botão Open. | `labOpenAfterEscape=false`; screenshots mostram rail separado. |
| AC-036 | PASS | Verificar foco após mudanças de etapa/destino/categoria. | Foco encaminhado para heading ou ponto de orientação equivalente. | 5 step focuses, 6 destination focuses, 6 category focuses. |
| AC-037 | PASS | Montar app buildado e executar smoke pós-fix. | Raiz Harbor exibida sem tela branca; preload carregado e bridge respondeu `pong`. | `window.harbor.ping()=pong`; 0 preload errors; gate build PASS. |
| AC-038 | PASS | Marcar favorita, manter conceito ativo e recarregar. | Favorita identificada como preferência de avaliação, não mudou conceito ativo automaticamente e não persistiu após reload. | `favoriteBefore=night-harbor`, `favoriteAfter=night-harbor`, reset sem favorita. |

## Gate fresco pós-última correção

| Comando | Resultado |
| --- | --- |
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run test` | PASS, exit 0 — 12 arquivos / 148 testes |
| `npm run build` | PASS, exit 0 — main 1.88 kB, preload `index.mjs` 0.21 kB, renderer buildado |
| `npm run build:app -- --dir --config.asar=false` | PASS, exit 0 — `dist/win-unpacked` gerado; native deps reconstruídos/copiados |
| Smoke Electron pós-build | PASS — Harbor root presente, `window.harbor.ping()` retornou `pong`, 0 erros de preload |

## Notas de correção durante a verificação

1. O primeiro helper real expôs falha de contraste no Signal Poster (`focusCanvas=1.2:1`). A paleta foi corrigida para preto/lavanda acessível, elevando `focusCanvas` para 12.62:1.
2. O smoke buildado expôs que `out/preload/index.mjs` era carregado pelo sandbox como CommonJS. A saída do preload passou a ser CJS mantendo o nome `index.mjs`; o bridge foi validado com `window.harbor.ping()`.
3. A review exigiu prova do fallback do NightAmbient. O detector passou a verificar valores reais (`typeof`) e o harness confirmou `navigator.gpu=undefined`, `WebGL2RenderingContext=undefined`, `canvasCount=0` e `cssFallbackLayer=true`.
