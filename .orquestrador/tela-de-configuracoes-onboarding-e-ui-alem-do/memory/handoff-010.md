## Handoff: audit → PR

### Decisões tomadas
- A auditoria está registrada em `audit.md`.
- Os findings de auditoria são melhorias de processo, não blockers do produto.
- O PR deve ser atualizado com checklist real da pipeline e links dos artifacts.

### Contexto que a próxima fase PRECISA
- Atualizar o body do PR #2.
- Rodar `gh pr checks 2` após push.
- Não marcar ready se o GitHub continuar sem checks reportados.
- Informar ao usuário que a evidência local está verde e que o próximo passo humano é
  revisar visualmente/decidir a proposta canônica em outra issue.
