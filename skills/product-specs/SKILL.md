---
name: product-specs
description: Ações e fluxos de trabalho para criar, modificar, analisar e atualizar especificações de produto como PRDs, FRDs, Storys, e tarefas de gerenciamento de produtos e projetos.
argument-hint: "Peça para criar, atualizar ou modificar uma especificação de PRD, FRD ou Story."
allowed-tools: conversation_search, google_drive_search, google_drive_fetch, slack, figma
disable-model-invocation: false
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: product
---

# Product Specs

Esta skill é só a **porta de entrada** das especificações de produto: ela **não guarda conteúdo próprio**. Quando o pedido for um dos abaixo, siga o workflow indicado (os arquivos ficam em `$IDE/$FLOWS_FOLDER/`, e os templates em `$PROD_TEMPLATES`).

| Pedido | Comando | Workflow |
|---|---|---|
| Não sei qual documento criar | `/prod.spec` | `$IDE/$FLOWS_FOLDER/prod.spec.md` |
| Investigar uma ideia inicial | `/prod.spec.discovery` | `$IDE/$FLOWS_FOLDER/prod.spec.discovery.md` |
| PRD (Documento de Requisitos de Produto) | `/prod.spec.prd` | `$IDE/$FLOWS_FOLDER/prod.spec.prd.md` |
| FRD (Documento de Requisitos Funcionais) | `/prod.spec.frd` | `$IDE/$FLOWS_FOLDER/prod.spec.frd.md` |
| Épico | `/prod.spec.epic` | `$IDE/$FLOWS_FOLDER/prod.spec.epic.md` |
| História, tarefa ou bug | `/prod.spec.issue` | `$IDE/$FLOWS_FOLDER/prod.spec.issue.md` |
| Esclarecer uma especificação | `/prod.spec.clarify` | `$IDE/$FLOWS_FOLDER/prod.spec.clarify.md` |
| Quebrar uma especificação grande | `/prod.spec.breakdown` | `$IDE/$FLOWS_FOLDER/prod.spec.breakdown.md` |

Antes de executar, leia as regras de produto em `$PROD_RULES` (`prod-rules.md` e `prod.spec-rules.md`).

Para outras necessidades de produto sem workflow próprio, aplique as boas práticas comumente utilizadas por gerentes de produto.

## Frases que acionam esta skill

**PRD:** "criar um PRD sobre..." · "novo PRD para..." · "editar o PRD..."

**FRD:** "criar um FRD sobre..." · "novo FRD para..."

**Épico:** "crie um épico sobre..." · "novo épico para..."

**História, tarefa ou bug:** "criar uma história sobre..." · "nova tarefa para..." · "criar um bug..."

**Discovery:** "investigar uma ideia..." · "fazer discovery de..." · "tenho uma ideia, vale a pena?"

**Esclarecimento:** "esclarecer a especificação..." · "esclarecer o PRD..."
