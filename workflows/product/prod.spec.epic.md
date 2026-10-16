---
name: prod.spec.epic
description: Fluxo de trabalho para criação de épicos que agrupam histórias de usuários e tarefas relacionadas seguindo as diretrizes do Product Spec Kit.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: opus
model_tier: medium
model_justification: Criação de épicos segue templates estruturados e requer compreensão de contexto de produto
---

# Crie um fluxo de trabalho épico

> 🎓 **Modo de condução**: leia `PROD_MODE` no `$IDE/ENV.md`. Se for `developer-guided`, **antes de começar leia `$IDE/rules-on-demand/product/prod.guided-rules.md` e siga-o** em toda a conversa. Vazio ou `product-led`: siga este fluxo como está.
>
> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se o documento for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/**/*`. Se você não estiver familiarizado com essa variável, leia as regras diretamente na pasta `.$IDE/rules/product/**/*.*`.

Este fluxo de trabalho orienta você na criação de um épico usando `$PROD_TEMPLATES/prod-epic-template.md`. épicos agrupam histórias de usuários relacionadas que oferecem uma funcionalidade significativa.

Utilize o `$ARGUMENTS` que o usuário passar como ponto de partida e para entender o contexto do que foi pedido.
<requirement>
#$ARGUMENTS
</requirement>

> 🔥 **Warm-up**: se `$SESSIONS_DIR/warm-ups/` tiver aquecimentos, leia `$IDE/rules-on-demand/warm-up-consume-rules.md` e siga-o antes de começar (grava em `$SESSIONS_DIR/prod/{id do documento}/context.md`).

## Quando usar
- Ao dividir grandes recursos ou PRDs em partes gerenciáveis
- Quando o trabalho abrange vários sprints ou iterações
- Ao coordenar o trabalho entre várias equipes
- Se precisar agrupar várias histórias ou tasks de um mesmo tema ou entrega
- Para recursos ou componentes principais que precisam de rastreamento em um nível superior
- Quando o usuári quiser criar um épico independente de especificações anteriores ou para projetos que já estão em andamento

## Pré-requisitos e opcionais
- **Discovery (opcional).** Se o usuário apontar um discovery (por exemplo `discovery-002`), siga o princípio "Discovery como insumo" de `$PROD_RULES/prod.spec-rules.md`: leia-o como contexto e repasse tudo com o usuário antes de escrever o épico. Sem discovery apontado, siga este fluxo normalmente, sem procurar na pasta `discoveries/`.
- Ter uma PRD existente ou requisitos de produto é importante, mas opcional. Questione o usuário se ele deseja criar um PRD ou se ele deseja criar um épico independente de especificações anteriores ou para projetos que já estão em andamento
- Ter um breakdown existente é importante, mas opcional. Questione o usuário se ele deseja criar um breakdown (siga o fluxo de trabalho `prod.spec.breakdown.md`) ou se ele deseja criar um épico independente de especificações anteriores ou para projetos que já estão em andamento
- Compreensão de alto nível da abordagem técnica

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Busca no Central Docs (condicional) | `/jarvis-docs-central` (via `jarvis docs sync --silent`) | Se `CENTRAL_DOCS_STORAGE` estiver definido no ENV.md, antes de criar o épico |
| Próximas etapas | `/prod.spec.issue` | Depois de criar o épico, se o usuário quiser escrever as histórias ou tarefas relacionadas |

## Resultado final
- Por padrão, use o modelo `$PROD_TEMPLATES/prod-epic-template.md` integralmente
- Siga a estrutura do modelo exatamente como definida, não pule passos, a não ser que o usuário solicite explicitamente
- Nomeie o arquivo usando a convenção: `$PROD_DOCS/{epic-ID}-{epic-name}.md` (se não existir uma PRD para pegar o nome, ignore esse prefixo)
- O arquivo final deverá estar no mesmo idioma da interação do usuário

## Diretrizes do épico
- Concentre-se no “o que” e não no “como”
- Cada épico deve agregar valor independente
- Mantenha os épicos em um tamanho gerenciável (normalmente de 2 a 4 semanas de trabalho)
- Garantir critérios de aceitação claros, não levando para o micro interações de usuário (isso fica em histórias e tasks), mas sim na solução de alto nível, possibilitando que as histórias e tasks sejam criadas com base nessas informações
- Link para PRD relacionado ou iniciativa dos pais

## Etapas de execução

### 1. Validar pré-requisitos
Verifique se existe um PRD ou plano de detalhamento. Caso contrário, oriente o usuário a criar um primeiro usando o fluxo de trabalho apropriado.

### 2. Defina detalhes épicos
1. **Nome épico**: título claro e voltado para a ação
2. **Lançamento**: Lançamento associado (se aplicável)
3. **Contexto**: Antecedentes e importância
4. **Declaração do problema**: qual problema do usuário ou da empresa isso resolve
5. **Solução**: abordagem de alto nível para resolver o problema

### 3. Definir critérios de aceitação
- Definir 3-5 critérios de aceitação de alto nível
- Concentre-se nos resultados e não nos detalhes da implementação
- Garantir que os critérios sejam testáveis e mensuráveis
- Baseie-se nas necessidades do usuário, não em detalhes técnicos

### 4. Identifique histórias relacionadas
- Liste histórias de usuários conhecidas que pertencem a este épico
- Cada história deve ser valiosa de forma independente
- Incluir IDs de histórias e breves descrições
- Defina prioridades sempre que possível

### 5. Considerações técnicas do documento
- Principais decisões de arquitetura
- Dependências principais
- Considerações de desempenho
- Requisitos de segurança

## Melhores práticas

### Do
- Mantenha os épicos focados em um único objetivo
- Garantir que cada épico ofereça valor tangível
- Torne os critérios de aceitação claros e testáveis
- Alinhar com estratégia de produto e PRD
- Incluir as partes interessadas relevantes na revisão

### Don't
- Faça épicos muito grandes ou muito pequenos
- Incluir detalhes de implementação nos critérios de aceitação
- Esquecer de vincular a PRDs relacionados ou iniciativas dos pais
- Ignorar dependências técnicas
- Ignore o processo de revisão

## Integração com outros fluxos de trabalho
- **PRD**: os épicos devem estar alinhados aos requisitos do produto. Se não existir um PRD, oriente o usuário a criar um usando o fluxo em `prod.spec.prd.md` ou a fornecer mais informações para que o épico seja construído
- **Histórias**: eventualmente os épicos serão divididos em diversas histórias de usuários ou tasks, então, mantenha as informações de forma que isso seja possível
- **Sprints**: os épicos normalmente abrangem vários sprints ou semanas, abrangendo várias entregas menores em formatos de histórias e tasks
- **Problemas**: pode gerar tarefas ou bugs relacionados

## Próximas etapas
Depois de criar um épico, pergunte para o usuário:
1. Se o ele quer explorar ou modificar algum tópico do épico ou se aprova o conteúdo final
1. Escrever as histórias de usuário ou tasks relacionadas ao épico que forma planejadas e/ou que o usuário sugeriu. Utilize o fluxo de trabalho `prod.spec.issue.md`

## Atualize os docs
Após a aprovação do usuário:
1. Atualize a PRD com as alterações relacionadas ao épico
2. Atualize o arquivo de breakdown (plan) com as alterações relacionadas ao épico

## Busca no Central Docs (condicional)

Se `CENTRAL_DOCS_STORAGE` definido no ENV.md, antes de criar o épico:

- Consultar no Central docs as funcionalidades já implementadas relacionadas (o que existe hoje):
  ```bash
  jarvis docs sync --silent
  ```
- Buscar PRD e épicos existentes em `$PROD_DOCS` e, no Central docs, as funcionalidades já implementadas relacionadas
- Se encontrar: carregar como contexto e informar o usuário
- Se não encontrado: continuar com fluxo normal

## Central docs

Este documento é um **documento de trabalho**: fica em `$PROD_DOCS`/`$ENG_DOCS` (`docs/jarvis/`) e **não** é publicado no Central docs. O Central docs registra só o que foi implementado, e quem o atualiza é o `/eng.spec-consolidate`, depois do PR da entrega.

