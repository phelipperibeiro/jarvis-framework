# Integração com Task Managers (Adapter Pattern)

> Parte do skill `eng-qa-bug-report`. Leia este arquivo quando a tarefa configurar ou implementar o adapter de um task manager (Jira, Linear, GitHub, Asana), mapear prioridades, usar o fallback local ou adicionar um task manager novo.

## Integração com Task Managers (Adapter Pattern)

### Arquitetura de Adapters

O skill usa **Adapter Pattern** para suportar múltiplos task managers de forma desacoplada.

```
bug-report skill
    ↓
[Adapter Layer]
    ↓
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│  JIRA   │ ClickUp │ Linear  │ Trello  │ GitHub  │ GitLab  │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Task Managers alinhados ao ENV-template

| Task Manager | Método | Requer |
|--------------|--------|--------|
| **jira** | MCP Atlassian | MCP ou `TOKEN_TASK_MANAGER` + `PROJECT_KEY` |
| **linear** | CLI | `linear` CLI + `LINEAR_TEAM_ID` |
| **github** | gh CLI | `gh` autenticado |
| **asana** | token | `TOKEN_TASK_MANAGER` (criação manual se adapter incompleto) |
| **(vazio) / local** | Arquivo local | Freelance — `$SESSIONS_DIR/qa/bug-reports/` |

Valores no ENV.md são **minúsculos** (`jira`, não `JIRA`).

### Configuração no ENV.md

#### Jira
```bash
TASK_MANAGER=jira
TOKEN_TASK_MANAGER=your_jira_token  # Opcional se usar MCP
PROJECT_KEY=PROJ
```

#### Linear
```bash
TASK_MANAGER=linear
TOKEN_TASK_MANAGER=lin_api_your_token
LINEAR_TEAM_ID=team-id
```

#### GitHub
```bash
TASK_MANAGER=github
# Token via gh auth / GITHUB_TOKEN
```

#### Freelance / local
```bash
TASK_MANAGER=
# Cards em $SESSIONS_DIR/qa/bug-reports/
```

#### GitLab
```bash
TASK_MANAGER=GITLAB
GITLAB_REPO=group/project
# Token via glab CLI (glab auth login)
```

### Implementação de Adapter

Cada adapter implementa a interface:

```bash
create_task_card() {
  # Input:
  #   $1 - title (string)
  #   $2 - description (markdown/text)
  #   $3 - priority (P0/P1/P2/P3)
  #   $4 - category (string)
  #   $5 - labels (comma-separated)

  # Output:
  #   Card ID/Key (string) ou caminho do arquivo local

  # Return:
  #   0 - Sucesso
  #   1 - Falha
}
```

### Mapeamento de Prioridades

Diferentes task managers usam sistemas de prioridade diferentes:

| Framework | P0 | P1 | P2 | P3 |
|-----------|----|----|----|----|
| **Jira** | Highest | High | Medium | Low |
| **ClickUp** | 1 | 2 | 3 | 4 |
| **Linear** | 1 | 2 | 3 | 4 |
| **Trello** | Label:P0 | Label:P1 | Label:P2 | Label:P3 |
| **GitHub** | Label:priority-critical | Label:priority-high | Label:priority-medium | Label:priority-low |
| **GitLab** | Label:priority::1 | Label:priority::2 | Label:priority::3 | Label:priority::4 |

### Fallback Local

Se task manager indisponível ou não configurado:
1. Card salvo em `$SESSIONS_DIR/qa/bug-reports/bug-{timestamp}.md`
2. Arquivo contém todas as informações necessárias
3. Usuário pode criar card manualmente ou configurar integração

### Como Adicionar Novo Task Manager

Para adicionar suporte a um novo task manager:

1. **Adicionar detecção** na seção de pré-requisitos:
```bash
NOTION)
  if [ -n "$TOKEN_TASK_MANAGER" ]; then
    TASK_MANAGER_ENABLED=true
    echo "✅ Integração Notion disponível"
  fi
  ;;
```

2. **Implementar adapter** na função `create_task_card()`:
```bash
NOTION)
  CARD_ID=$(curl -s -X POST "https://api.notion.com/v1/pages" \
    -H "Authorization: Bearer $TOKEN_TASK_MANAGER" \
    -H "Content-Type: application/json" \
    -d '{
      "parent": {"database_id": "'$(grep '^NOTION_DATABASE_ID=' "$IDE/ENV.md" | cut -d= -f2)'"},
      "properties": {
        "Name": {"title": [{"text": {"content": "'"$title"'"}}]},
        "Priority": {"select": {"name": "'"$priority"'"}},
        "Category": {"select": {"name": "'"$category"'"}}
      }
    }' | jq -r '.id')

  echo "✅ Card criado no Notion: $CARD_ID"
  echo "$CARD_ID"
  ;;
```

3. **Documentar configuração** na seção acima

4. **Adicionar teste** para validar funcionamento

---
