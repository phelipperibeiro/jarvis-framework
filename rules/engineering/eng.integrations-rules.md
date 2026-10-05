> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Integrações — vendors via ENV

O Jarvis não assume Jira, GitLab ou Slack. Leia `$IDE/ENV.md` e despache pelo adapter.

## Variáveis

| Variável | Vendors | Adapter |
|----------|---------|---------|
| `TASK_MANAGER` | jira, linear, github, asana | `jarvis tasks comment` |
| `VERSION_CONTROL` | gitlab, github, bitbucket | `jarvis vcs create-merge` / `create-issue` / `fetch-raw` |
| `MESSAGE_COMUNICATOR` | slack, discord, teams | runtime `communicator/` |

`{TASK_MANAGER_KEY}` = id da tarefa. Com board, é o id do card. Sem board, é o número de controle do usuário.

## Freelance (TASK_MANAGER vazio)

`TASK_MANAGER` vazio, ausente ou ainda com a lista `[jira, linear, github, asana]` = **sem board** (freelance).

1. **Perguntar** o `TASK_MANAGER_KEY` se não veio em `$ARGUMENTS`. Não inventar. Não exigir padrão `XXX-000`.
2. Prompt:

```
Não há TASK_MANAGER no ENV — modo freelance.
Qual o seu número de controle para esta tarefa?
(ex: F-042, CLIENTE-agosto, 2026-08-13)
```

3. Usar a resposta (lowercase) como pasta `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` e no prefixo da branch.
4. **Não** chamar `/eng-global-task-comment`, **não** mover card, **não** buscar issue no board.

Com board definido, se o key não veio nos argumentos, perguntar o id do card naquele vendor (ex: Jira `TASK-123`).

## Comentário no card

Só se `TASK_MANAGER` estiver preenchido com um vendor. Freelance → pular.

```
/eng-global-task-comment {TASK_MANAGER_KEY} {mensagem}
```

## MR / PR

```
jarvis vcs create-merge --source BRANCH --target BRANCH --title "..." --body-file path
```

Vendor pelo hostname de `git remote get-url origin` (ou `VERSION_CONTROL`).

## Alertas (runtime)

`MESSAGE_COMUNICATOR=slack` → Socket Mode (três tokens).
`discord` → Bot token + channel ID em `ALERTS_CHANNEL`.
`teams` → Incoming Webhook em `MESSAGE_COMUNICATOR_BOT_TOKEN`.

## URL do card

| TASK_MANAGER | Padrão |
|--------------|--------|
| jira | `{TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}` |
| linear | `{TASK_MANAGER_URL_BASE}/issue/{TASK_MANAGER_KEY}` |
| github | `{TASK_MANAGER_URL_BASE}/issues/{TASK_MANAGER_KEY}` |
| asana | `{TASK_MANAGER_URL_BASE}/0/0/{TASK_MANAGER_KEY}` |

## Proibido

- Hardcodar `gitlab.com`, `/browse/` ou Slack Bolt fora dos adapters.
- Pedir token no chat.
