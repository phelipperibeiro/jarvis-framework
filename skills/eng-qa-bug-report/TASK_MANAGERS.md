# Task Managers - Guia de Configuração

Configuração dos vendors alinhados ao `templates/ENV-template.md` para o skill `eng-qa-bug-report`.

Valores de `TASK_MANAGER` são **minúsculos**: `jira` | `linear` | `github` | `asana` | *(vazio = freelance/local)*.

---

## Arquitetura

```
┌─────────────────────────────────────┐
│      eng-qa-bug-report              │
│  (lógica agnóstica do board)        │
└──────────────┬──────────────────────┘
               │
         [Adapter Layer]
               │
┌──────────────┴───────────────────────┐
│  jira │ linear │ github │ asana │ local │
└──────────────────────────────────────┘
```

- Trocar board = só mudar `TASK_MANAGER` no ENV.md
- Vazio / local → cards em `$SESSIONS_DIR/qa/bug-reports/`
- Não documentar ClickUp/Trello/Notion aqui — fora do ENV-template

---

## Vendors suportados

| `TASK_MANAGER` | Método | Requer |
|----------------|--------|--------|
| `jira` | MCP Atlassian e/ou token | MCP ou `TOKEN_TASK_MANAGER` + `PROJECT_KEY` |
| `linear` | CLI / API | `linear` CLI ou `TOKEN_TASK_MANAGER` + `LINEAR_TEAM_ID` |
| `github` | `gh` CLI | `gh auth` / `GITHUB_TOKEN` |
| `asana` | API | `TOKEN_TASK_MANAGER` (+ workspace/project conforme API) |
| *(vazio)* / `local` | Arquivo markdown | Nenhum |

Opcional: `TASK_MANAGER_URL_BASE` para links nos relatórios.

---

## Configuração por vendor

### 1. Jira — `TASK_MANAGER=jira`

**MCP (preferido):**
```bash
TASK_MANAGER=jira
PROJECT_KEY=PROJ
TASK_MANAGER_URL_BASE=https://sua-org.atlassian.net
```

**Token:**
```bash
TASK_MANAGER=jira
TOKEN_TASK_MANAGER=seu_api_token
TASK_MANAGER_URL_BASE=https://sua-org.atlassian.net
PROJECT_KEY=PROJ
```

Token: https://id.atlassian.com/manage-profile/security/api-tokens

---

### 2. Linear — `TASK_MANAGER=linear`

```bash
TASK_MANAGER=linear
TOKEN_TASK_MANAGER=lin_api_...   # ou auth via `linear` CLI
LINEAR_TEAM_ID=team-id
TASK_MANAGER_URL_BASE=https://linear.app/sua-org
```

---

### 3. GitHub Issues — `TASK_MANAGER=github`

```bash
TASK_MANAGER=github
TASK_MANAGER_URL_BASE=https://github.com/org/repo
# Token: gh auth login  ou  GITHUB_TOKEN
```

```bash
gh auth status
gh issue create --title "teste" --body "ok"
```

---

### 4. Asana — `TASK_MANAGER=asana`

```bash
TASK_MANAGER=asana
TOKEN_TASK_MANAGER=seu_pat
TASK_MANAGER_URL_BASE=https://app.asana.com/...
```

Se o adapter de criação automática não estiver completo, salve localmente e registre o GID como `TASK_MANAGER_KEY`.

---

### 5. Freelance / local — `TASK_MANAGER=` (vazio)

```bash
TASK_MANAGER=
# Cards em:
# $SESSIONS_DIR/qa/bug-reports/bug-{timestamp}.md
```

Workflows pedem `TASK_MANAGER_KEY` como controle próprio (número/slug).

---

## Detecção no skill

O skill normaliza para minúsculas. Se vazio ou placeholder `[jira, linear, github, asana]` → modo `local`.

---

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| Cards só locais | Confira `TASK_MANAGER=` minúsculo e token/MCP |
| `jira` não cria | MCP Atlassian ou `TOKEN_TASK_MANAGER` + `PROJECT_KEY` |
| `github` falha | `gh auth status` |
| Freelance | Deixe `TASK_MANAGER=` vazio — esperado |

---

## Ver também

- `templates/ENV-template.md` — fonte de verdade das chaves
- `skills/eng-task-comment/SKILL.md` — comentar no card
- `bin/lib/tasks/comment.js` — adapter CLI
