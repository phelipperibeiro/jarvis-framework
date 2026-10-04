# Bug-to-Test (pós-criação)

> Parte do skill `eng-qa-bug-report`. Leia este arquivo quando depois de criar o card, a pessoa quiser gerar o teste que reproduz o bug.

## Bug-to-Test (pós-criação)

Após criar o card no $TASK_MANAGER, sempre perguntar:

```
Bug registrado: {TASK-ID} — {título}

Deseja gerar um teste de regressão Cypress para este bug?
Recomendado: previne que o bug retorne após o fix.

[S] Gerar agora
[N] Registrar no backlog de cobertura
[P] Pular
```

### Se "Gerar agora"

Invocar Skill tool: `eng-qa-cypress-e2e` passando como entrada:
- Título do bug como nome do fluxo
- Passos de reprodução como sequência de ações
- Comportamento esperado vs. atual como asserções

Nomear o spec: `{dominio}/{TASK-ID}-regression.cy.ts`

Após gerar o teste, adicionar comentário no card do bug com o caminho do arquivo criado.

### Se "Registrar no backlog"

Append em `$DOCS_FOLDER/engineering/qa/test-backlog.md` (criar se não existir):

```markdown
| {TASK-ID} | {título} | {domínio} | {dominio}/{TASK-ID}-regression.cy.ts |
```

Cabeçalho da tabela (inserir apenas se o arquivo for novo):
```markdown
# Test Backlog — Testes de Regressão Pendentes

| Bug ID | Título | Domínio | Spec sugerida |
|--------|--------|---------|---------------|
```
