---
name: prod-roadmap-preview
description: >
  Use esta habilidade sempre que alguém perguntar sobre roadmap de produto, status de entrega, status de sprint, atualizações de equipe ou relatórios de status.
  Aciona quando os usuários perguntam coisas como: "qual o roadmap?", "quais são as entregas do trimestre?", "status do time X", "o que está sendo feito?", "quando vai sair feature Y?", "me mostra o roadmap", "status report do time", "próximas entregas", "roadmap do produto", "o que está planejado?", "report do time", "andamento dos projetos".
  Essa habilidade se conecta ao Jira (Atlassian) e às páginas wiki internas para buscar dados ao vivo sobre o roteiro do produto e relatórios de status da equipe.
---

# Status Roadmap Preview

Este skill responde perguntas sobre roadmap de produto e status reports dos times, buscando dados ao vivo no `$TASK_MANAGER` definido e outras fontes de dados fornecidas pelo usuário

## Quando usar essa skill?

Use este fluxo sempre que alguém perguntar sobre:
- Roadmap de produto
- Status de entrega
- Status de sprint
- Relatórios de status de produto e desenvolvimento
- times de produtos
- Entrega de projetos e priorização

---

## Regras

- Se não tiver informações suficientes sobre o `$TASK_MANAGER` utilizado pelo usuário, pergunte qual é o `$TASK_MANAGER` e adapte a resposta de acordo.
- Sempre utilize MCPs configurados especificos do `$TASK_MANAGER` utilizado para buscar informações atualizadas
- Procure na pasta de trabalho para entender mais sobre o projeto.
- Caso não tiver informações sobre o projeto, fontes de dados ou `$TASK_MANAGER`, informe ao usuário que não tem informações suficientes e peça para ele fornecer mais detalhes.

### Formato de Resposta padrão - Tabela por Mês

A resposta padrão quando usuário pedir roadmap, deve exibir **mês atual** e os **próximos três meses**.
Se o usuário pedir outro mês específico, mostre apenas aquele mês específico.

Formato deve ser:
```
## {Mês atual}

| Key                                                        | Summary           | Status           | Priority   | Due Date   | Resolvido |
| ---------------------------------------------------------- | ----------------- | ---------------- | ---------- | ---------- | --------- |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | 31/03/2026 | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | 31/03/2026 | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | 31/03/2026 | —         |

## {nome próximo mês}

| Key                                                        | Summary           | Status           | Priority   | Due Date   | Resolvido |
| ---------------------------------------------------------- | ----------------- | ---------------- | ---------- | ---------- | --------- |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |


## {nome próximo mês 2}

| Key                                                        | Summary           | Status           | Priority   | Due Date   | Resolvido |
| ---------------------------------------------------------- | ----------------- | ---------------- | ---------- | ---------- | --------- |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |

## {nome próximo mês 3}

| Key                                                        | Summary           | Status           | Priority   | Due Date   | Resolvido |
| ---------------------------------------------------------- | ----------------- | ---------------- | ---------- | ---------- | --------- |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |
| [key-XXXX](https://url.of.task.manager.task/) | Summary | Status | Prioridade | DD/MM/YYYY | —         |

...
```

---

## Fluxo 2: Status dos projetos de times

### Quando usar
Sempre que o usuário pedir: status report, atualização do time, o que o time está fazendo, últimas atualizações, etc.

### Passo 1 — Perguntar qual time
Se o usuário não especificou o time, pergunte:

> "Qual time você quer ter visibilidade?"


## Comportamento Geral

- Sempre responda em **português**
- Seja objetivo e use formatação em tabela quando possível
- Se não encontrar dados, informe claramente qual fonte não retornou resultados
- Datas devem ser exibidas no formato **DD/MM/AAAA**
- Quando não houver data de resolução, exiba **—**
