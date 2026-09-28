---
name: prod-specs
description: Ações e fluxos de trabalho para criar, modificar, analisar e atualizar especificações de produto como PRDs, FRDs, Storys, e tarefas de gerenciamento de produtos e projetos.
argument-hint: "Peça para criar, atualizar ou modificar uma especificação de PRD, FRD ou Story."
allowed-tools: conversation_search, google_drive_search, google_drive_fetch, slack, figma
disable-model-invocation: false
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
---

# Product Specs

Antes de iniciar:
- Leia o arquivo de regras invioláveis em `rules/prod-spec-rules.md`.

## Diretórios e Variáveis dessa Skill

Utilize essas variáveis para interpretar corretamente o contexto as instruções dessa skill. Os endereços são relativos ao diretório raiz desse plugin:

**Diretório da skill:** `${CLAUDE_SKILL_DIR}`

- `$SKILL_TEMPLATE_FOLDER`: `${CLAUDE_SKILL_DIR}/templates/`
- `$SKILL_REFERENCES_FOLDER`: `${CLAUDE_SKILL_DIR}/references/`


## Objetivo

Esta é uma habilidade para ajudar gestores e líderes de produto a executarem suas tarefas e entregarem um trabalho de gestão de alta qualidade, facilitando decisões e análises.

## Quando usar
- Analisar mercado, concorrentes, outros produtos
- Analisar o próprio produto para fornecer mais insights e identificar lacunas e oportunidades
- Criar apresentações estratégicas e táticas 
- Quando o usuário precisar analisar dados, indicadores e métricas de qualquer tipo
- quando o usuário precisa criar especificações como:
    - PRD: Documento de Requisitos do Produto
    - FRD: Documento de requisitos de recursos
    - Escreva épicos, histórias e tarefas técnicas
- Planeje, analise e escreva itens como épicos, histórias, tarefas
- Priorizar roadmaps, backlogs e planejamento de curto, médio e longo prazo
- Escrever relatórios de status sobre projetos, obras em andamento
- Compilar, organizar e escrever informações em documentos bem formatados e estruturados que serão compartilhados
- apoiar e auxiliar o PM ou líder de produto em qualquer outra tarefa que possa ser necessária em sua função como gerente

## Quando invocar

Essa habilidade deve ser invocada quando o usuário pede para **fazer trabalho real com o produto**, como:

- “Criar/aperfeiçoar um PRD/especificação/caso de negócios/1 página”
- “Transforme esta ideia em um roteiro” / “Roteiro de resultados para X”
- “Desenhar um plano de descoberta/roteiro de entrevista/plano de experiência”
- “Definir métricas de sucesso/OKRs/árvore de métricas”
- “Posicione este produto em relação aos concorrentes”
- “Projetar um recurso alimentado por IA / agente GenAI / ciclo de vida AI PM”
- “Executar uma conversa / feedback / 1:1 / negociação difícil”
- “Planejar uma estratégia de produto/visão/avaliação de oportunidade”

## Instruções e Referências

SEMPRE utilize as instruções na íntegra contidas nessas referências de acordo com o contexto e pedido:

- Crie, modifique ou esclareça um PRD seguindo as instruções em `references/prod.spec.prd.md`
- Crie, modifique ou esclareça um FRD seguindo as instruções em `references/prod.spec.frd.md`
- Avalie, clarifique, detalhe e identifique gaps e possíveis melhorias na especificação seguindo as instruções em `references/prod.spec.clarify.md`

Para outras necessidades não especificadas ou que não possuam instruções ou templates, aplique as boas práticas comumente utilizadas pelos Gerentes de Produto no mercado.

Se o usuário solicitar para ver o que pode ser feito com essa habilidade, cite todas as referências disponíveis com uma descrição concisa.

Cenário A: "Criar um PRD para um aplicativo de tarefas" → Fluxo de trabalho completo de perguntas
Cenário B: "Crie um PRD com base neste documento: [...]" → Fluxo de trabalho de validação  
Cenário C: "Editar este PRD: [...]" → Fluxo de trabalho de melhoria focado

Esteja atento quando o usuário conversar em linguagem natural, para acionar comandos usando instruções corretas:

## Templates Disponíveis

Os templates ficam na pasta `templates` dessa skill. Elas devem ser usadas para gerar o output final para o usuário. Suas perguntas devem ser baseadas nesses templates para que eles fiquem completos, detalhados e com qualidade.

- [Template para PRD](templates/prod-prd-template.md)
- [Template para FRD](templates/prod-frd-template.md) 
- [Template para épicos](templates/prod-epic-template.md) 
- [Template para itens (história/tarefa/bug)](templates/prod-issue-template.md) 

**Para PRDs:**
- "criar um PRD sobre..."
- "novo PRD para..."
- "editar o PRD..."

**Para problemas (histórias/tarefas/bugs):**
- "criar uma história sobre..."
- "nova tarefa para..."
- "criar um bug..."

**Para épicos:**
- "crie um épico sobre..."
- "novo épico para..."

**Para FRDs:**
- "criar um FRD sobre..."
- "novo FRD para..."

**Para esclarecimentos:**
- "esclarecer a especificação..."
- "esclarecer o PRD..."

