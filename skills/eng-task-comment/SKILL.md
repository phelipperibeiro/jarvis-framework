---
name: eng-task-comment
description: >
  Adiciona um comentário no card do TASK_MANAGER (Jira, Linear, GitHub Issues ou Asana).
  Trigger: registrar progresso, início ou fim de etapa em um card.
argument-hint: "{TASK_MANAGER_KEY} {mensagem}"
disable-model-invocation: false
allowed-tools: Read Bash MCP
---

# eng-task-comment

Comenta no card do gerenciador de tarefas configurado em `TASK_MANAGER` no ENV.md.

`{TASK_MANAGER_KEY}` = id do card (Jira `TASK-123`, Linear UUID/identifier, GitHub `#42`, Asana GID).

## Entrada

`$ARGUMENTS` — `{TASK_MANAGER_KEY} {mensagem}`

## Execução

Ler `TASK_MANAGER`, `TASK_MANAGER_URL_BASE`, `TOKEN_TASK_MANAGER` e `USER` do `$IDE/ENV.md`.

Se `TASK_MANAGER` estiver vazio, ausente ou ainda for a lista `[jira, linear, github, asana]` → **encerrar em silêncio** (freelance, sem board). Não pedir token. Não falhar o workflow.

### 1. MCP (só Jira)

Se `TASK_MANAGER=jira` e o MCP Atlassian estiver disponível:

```
mcp__claude_ai_Atlassian__addCommentToJiraIssue({ issueKey: "{TASK_MANAGER_KEY}", body: "{mensagem}" })
```

Sucesso → encerrar.

### 2. Adapter CLI (todos os vendors)

```bash
# Exportar do ENV.md para o processo
set -a
# shellcheck disable=SC1091
eval "$(grep -E '^(TASK_MANAGER|TASK_MANAGER_URL_BASE|TOKEN_TASK_MANAGER|USER)=' $IDE/ENV.md)"
set +a

node "$JARVIS_ROOT/bin/lib/tasks/comment.js" "{TASK_MANAGER_KEY}" "{mensagem}"
```

`$JARVIS_ROOT` = raiz do framework (ou `$(git rev-parse --show-toplevel)` se o Jarvis estiver no repo). Se o script não existir no projeto, usar o path do clone do framework.

Exit 0 → comentário ok. Exit 2 → avisar e **não bloquear** o workflow.

### 3. Falha

```
⚠️ Não foi possível comentar no card {TASK_MANAGER_KEY} ({TASK_MANAGER}).
   Confira TOKEN_TASK_MANAGER e TASK_MANAGER_URL_BASE no ENV.md.
```

Nunca pedir credenciais no chat. Nunca parar o fluxo principal por falha de comentário.
