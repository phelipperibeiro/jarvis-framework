---
name: prod.spec.epic
description: Fluxo de trabalho para criação de épicos que agrupam histórias de usuários e tarefas relacionadas seguindo as diretrizes do Product Spec Kit.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: gpt-4o
model_tier: medium
model_justification: Criação de épicos segue templates estruturados e requer compreensão de contexto de produto
---

# Crie um fluxo de trabalho épico

Este fluxo de trabalho orienta você na criação de um épico usando `$PROD_TEMPLATES/prod-epic-template.md`. épicos agrupam histórias de usuários relacionadas que oferecem uma funcionalidade significativa.


## Quando usar
- Ao dividir grandes recursos ou PRDs em partes gerenciáveis
- Quando o trabalho abrange vários sprints ou iterações
- Ao coordenar o trabalho entre várias equipes
- Se precisar agrupar várias histórias ou tasks de um mesmo tema ou entrega
- Para recursos ou componentes principais que precisam de rastreamento em um nível superior
- Quando o usuári quiser criar um épico independente de especificações anteriores ou para projetos que já estão em andamento

## Pré-requisitos e opcionais
- Ter uma PRD existente ou requisitos de produto é importante, mas opcional. Questione o usuário se ele deseja criar um PRD ou se ele deseja criar um épico independente de especificações anteriores ou para projetos que já estão em andamento
- Ter um breakdown existente é importante, mas opcional. Questione o usuário se ele deseja criar um breakdown (siga o fluxo de trabalho `prod.spec.breakdown.md`) ou se ele deseja criar um épico independente de especificações anteriores ou para projetos que já estão em andamento
- Compreensão de alto nível da abordagem técnica

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

Utilize o que o usuário fornecer analisar em:
<requirement>
#$ARGUMENTS
</requirement>