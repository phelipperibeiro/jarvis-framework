---
name: eng-global-jira-comment
description: >
  Alias de eng-global-task-comment. Adiciona comentário no card do TASK_MANAGER
  (Jira, Linear, GitHub Issues ou Asana).
argument-hint: "{TASK_MANAGER_KEY} {mensagem}"
disable-model-invocation: false
allowed-tools: Read Bash MCP
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# eng-global-jira-comment (alias)

Este skill foi unificado em **`eng-global-task-comment`**.

Execute o playbook de `$IDE/skills/eng-global-task-comment/SKILL.md` com os mesmos argumentos `{TASK_MANAGER_KEY} {mensagem}`.

`{TASK_MANAGER_KEY}` — identificador do card no `TASK_MANAGER` do ENV.md.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Único passo (alias) | `/eng-global-task-comment` | Sempre — o alias executa o playbook da skill alvo com os mesmos argumentos `{TASK_MANAGER_KEY} {mensagem}` |
