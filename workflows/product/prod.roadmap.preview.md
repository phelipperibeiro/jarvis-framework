---
name: prod.roadmap.preview
description: Conhecer e ter visibilidade do roadmap de entregas planejadas do produto, como períodos de entrega, nome dos projetos e responsáveis.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: opus
model_tier: high
model_justification: Gestores e time precisam entender quais as próximas prioridades de entrega que serão feitas pelos times baseados nas informações disponíveis no projeto e também no task manager utilizado pela empresa.
---

# Roadmap Preview

> 🎓 **Modo de condução**: leia `PROD_MODE` no `$IDE/ENV.md`. Se for `developer-guided`, **antes de começar leia `$IDE/rules-on-demand/product/prod.guided-rules.md` e siga-o** em toda a conversa. Vazio ou `product-led`: siga este fluxo como está.

Este comando tem como objetivo de buscar e trazer informações sobre o roadmap de entregas planejadas do produto, como períodos de entrega, nome dos projetos e responsáveis.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

## Regras

- Sempre identifique o quadrimestre atual e o próximo com base na data de hoje.
- Leia o board pela CLI oficial do `$TASK_MANAGER` (`acli` no Jira, `gh` no GitHub, `glab` no GitLab), com o login dela (`eng.integrations-rules.md`: board sem REST nem MCP). Só leitura: este comando não comenta nem cria nada no board.
- Antes de qualquer coisa, procure por informações sobre o projeto ou produto que o usuário está solicitando dentro da pasta de trabalho utilizado. Confirme com o usuário o que foi encontrado. Utilize também informações que o usuário já compartilhou.
- As documentações de projeto podem ser encontradas na pasta do projeto (`$PROD_DOCS`). Rascunhos WIP: `$SESSIONS_DIR/prod/`. Caso não estejam disponíveis localmente, utilize via Skill tool a `jarvis-docs-central` para buscar as informações no Central docs (se `CENTRAL_DOCS_STORAGE` estiver configurado).
- Para trazer as informações, utilize via Skill tool a skill `product-roadmap-report`

### Status Reports por Squad

Ler os squads em `taxonomy.md` (seção Squads). Não hardcodar times.

Se o projeto tiver wiki de status report, usar URLs informadas pelo usuário ou variáveis do `ENV.md` — nunca uma tabela fixa de squads.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Regras | `/jarvis-docs-central` | Se as documentações do projeto não estiverem disponíveis localmente (via Skill tool) |
| Regras | `/product-roadmap-report` | Sempre — via Skill tool, para trazer as informações do roadmap |
| Regras / Dicas de Ferramenta | `acli jira workitem search` (CLI do vendor; `gh issue list` / `glab issue list` fora do Jira) | Para ler os dados do roadmap no board, com o JQL ou o filtro informado pelo usuário, se a CLI estiver logada |

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

Leia os dados do roadmap pela `acli`, com o login dela. Sem a `acli` logada (ou com `TASK_MANAGER_ACCESS=manual`), peça ao usuário para exportar ou colar os dados.
Não precisa trazer informações embedadas do jira, apenas o output definido aqui nessa skill.

```
acli jira workitem search --jql "{JQL}"   # ou --filter {ID} para o filtro salvo; confira os flags (campos, limite, formato) no --help
JQL: (filtro informado pelo usuário ou montado a partir de board_code + labels)
Campos a buscar: key, summary, status, priority, duedate, resolutiondate, assignee, labels, customfield (team, quadrimestre)
```


### Spaces no Jira

Montar URLs com `{TASK_MANAGER_URL_BASE}` + `board_code` do `taxonomy.md`. Se `board_code` estiver vazio, perguntar o projeto ao usuário.

### Complemento com Jira (opcional)
Você **pode** complementar com informações do Jira (lidas pela `acli`, como acima) apenas se tiver informações suficientes para fazer a query corretamente (ex: o squad tem um board ou label bem definidos no Jira e você tem certeza do filtro).

⚠️ **Se tiver dúvida sobre como filtrar no Jira, NÃO inclua dados do Jira**. Evite trazer informações erradas ou de outros squads.


## Status report via Wiki

Use a URL de status report que o usuário informar (ou a wiki configurada no projeto). Não há tabela fixa de squads.

Use `web_fetch` para acessar a URL do time selecionado (ou peça o texto colado); sem MCP de wiki.

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
1. Use `acli jira workitem search` com o JQL adequado (flags no `--help`)
2. Para o roadmap, use o JQL/filtro informado pelo usuário
3. Para campos customizados (team, quadrimestre), peça ao usuário os IDs dos campos se a CLI não os mostrar
4. Links para issues do Jira devem ser no formato: `{TASK_MANAGER_URL_BASE}/browse/KEY-123`

### Para dados da Wiki
- Use `web_fetch` diretamente nas URLs dos reports
- Se a página não carregar, informe o usuário que o conteúdo não está disponível no momento
- Busque os **dois últimos status reports** listados na página.
