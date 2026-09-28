---
name: eng-jira-comment
description: >
  Alias de eng-task-comment. Adiciona comentário no card do TASK_MANAGER
  (Jira, Linear, GitHub Issues ou Asana).
argument-hint: "{TASK_MANAGER_KEY} {mensagem}"
disable-model-invocation: false
allowed-tools: Read Bash MCP
---

# eng-jira-comment (alias)

Este skill foi unificado em **`eng-task-comment`**.

Execute o playbook de `$IDE/skills/eng-task-comment/SKILL.md` com os mesmos argumentos `{TASK_MANAGER_KEY} {mensagem}`.

`{TASK_MANAGER_KEY}` — identificador do card no `TASK_MANAGER` do ENV.md.
