---
name: prod.roadmap.preview
description: Conhecer e ter visibilidade do roadmap de entregas planejadas do produto, como períodos de entrega, nome dos projetos e responsáveis.
auto_execution_mode: 3
env_file: "@/ENV.md"
model_tier: high
model_justification: Gestores e time precisam entender quais as próximas prioridades de entrega que serão feitas pelos times baseados nas informações disponíveis no projeto e também no task manager utilizado pela empresa.
---

# Roadmap Preview

Este comando tem como objetivo de buscar e trazer informações sobre o roadmap de entregas planejadas do produto, como períodos de entrega, nome dos projetos e responsáveis.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Regras

- Sempre identifique o quadrimestre atual e o próximo com base na data de hoje.
- Utilize o MCP disponível relacionado ao $TASK_MANAGER utilizado pelo usuário.
- Antes de qualquer coisa, procure por informações sobre o projeto ou produto que o usuário está solicitando dentro da pasta de trabalho utilizado. Confirme com o usuário o que foi encontrado. Utilize também informações que o usuário já compartilhou.
- As documentações de projeto podem ser encontradas na pasta do projeto (`$PROD_DOCS`). Rascunhos WIP: `$SESSIONS_DIR/prod/`. Caso não estejam disponíveis localmente, utilize via Skill tool a `docs-central` para buscar as informações do repositório `$CENTRAL_DOCS_REPO`.
- Para trazer as informações, utilize via Skill tool a skill `prod-roadmap-report`

### Status Reports por Squad

Ler os squads em `taxonomy.md` (seção Squads). Não hardcodar times.

Se o projeto tiver wiki de status report, usar URLs informadas pelo usuário ou variáveis do `ENV.md` — nunca uma tabela fixa de squads.

## Formato de Períodos de Referência

Nós usamos Quadrimestres como período de Referência. Então, quando o usuário falar quarter, entenda que é referente a quatro meses no ano, e não apenas 3. Como o padrão abaixo:

- **Q1**: Janeiro – Abril
- **Q2**: Maio – Agosto
- **Q3**: Setembro – Dezembro

Sempre identifique o quadrimestre atual e o próximo com base na data de hoje.

### Sobre o Jira

Confirme `$TASK_MANAGER` e `$TASK_MANAGER_URL_BASE` em `@/ENV.md`.

Boards: usar o `board_code` de cada squad em `taxonomy.md` (se preenchido). Não hardcodar projetos.

Filtro de roadmap: pedir ao usuário o JQL ou o ID do filtro salvo no `$TASK_MANAGER`. Não usar filtro fixo.

Utilize o MCP da Atlassian para buscar os dados do roadmap.
Não precisa trazer informações embedadas do jira, apenas o output definido aqui nessa skill.

```
Atlassian:searchJiraIssuesUsingJql
JQL: (filtro informado pelo usuário ou montado a partir de board_code + labels)
Campos a buscar: key, summary, status, priority, duedate, resolutiondate, assignee, labels, customfield (team, quadrimestre)
```

**Importante**: Use `Atlassian:getAccessibleAtlassianResources` para obter o `cloudId` antes de fazer queries.


### Spaces no Jira

Montar URLs com `{TASK_MANAGER_URL_BASE}` + `board_code` do `taxonomy.md`. Se `board_code` estiver vazio, perguntar o projeto ao usuário.

### Complemento com Jira (opcional)
Você **pode** complementar com informações do Jira apenas se tiver informações suficientes para fazer a query corretamente (ex: o squad tem um board ou label bem definidos no Jira e você tem certeza do filtro).

⚠️ **Se tiver dúvida sobre como filtrar no Jira, NÃO inclua dados do Jira**. Evite trazer informações erradas ou de outros squads.


## Status report via Wiki

Use a URL de status report que o usuário informar (ou a wiki configurada no projeto). Não há tabela fixa de squads.

Use `web_fetch` para acessar a URL do time selecionado.

Busque os **dois últimos status reports** listados na página.
Apresente os dois últimos reports no seguinte formato:

```
## 📋 Status Report — [Nome do time]

### 📅 Último Report — [Data]
[Conteúdo do report]

---

### 📅 Report Anterior — [Data]
[Conteúdo do report]
```

---

## Dicas de Ferramenta

### Para dados do Jira
1. Sempre chame `Atlassian:getAccessibleAtlassianResources` primeiro para obter o `cloudId`
2. Use `Atlassian:searchJiraIssuesUsingJql` com o JQL adequado
3. Para o roadmap, use o JQL/filtro informado pelo usuário
4. Para campos customizados (team, quadrimestre), pode ser necessário chamar `Atlassian:getJiraIssueTypeMetaWithFields` para descobrir os IDs dos campos
5. Links para issues do Jira devem ser no formato: `{TASK_MANAGER_URL_BASE}/browse/KEY-123`

### Para dados da Wiki
- Use `web_fetch` diretamente nas URLs dos reports
- Se a página não carregar, informe o usuário que o conteúdo não está disponível no momento
- Busque os **dois últimos status reports** listados na página.
