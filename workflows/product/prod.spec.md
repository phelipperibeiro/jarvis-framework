---
name: prod.spec
description: Guia o usuário para construir especificações macro ou micro de produto, como PRDs, histórias, tarefas, RFDs e outros.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Especificações de produto requerem compreensão de requisitos e estruturação de documentos
---

# Iniciar uma especificação

Estas instruções ajudam a orientar o usuário que deseja começar a construir uma especificação. Esta especificação pode variar desde um PRD, história de usuário até tarefas. Devemos orientá-lo nessa construção de forma que a especificação, seja ela macro ou micro seja criada de acordo com as instruções e padrões do projeto.

## Quando usar
- Esse comando serve para unificar a criação de todos os tipos de especificações do projeto.
- Ao iniciar uma nova especificação de projeto ou modificar um PRD existente
- Quando não souber qual tipo de especificação criar
- Quando precisar criar novas ou editar FRDs
- Quando precisar criar novos ou editar épicos, issues, tasks, stories e bugs
- Quando precisar de orientação sobre o tipo de documentação a ser gerada

## Instruções

- **Sessões de produto**: rascunhos WIP em `$SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/`. A spec canônica fica em `$PROD_DOCS` (não substituir).
- **Regras do projeto**: Sempre revise os arquivos de regras invioláveis em `$PROD_RULES/**/*.*`.
- **Projeto existente ou novo**: entenda se o projeto é novo ou se já é um projeto em andamento, que tenha uma base de código já construída.
  - Procure no diretório por documentações já existentes, como PRDs, FRDs, ARDs, issues, etc. Procure na pasta toda, mas comece procurando em `$PROD_DOCS`.
  - Verifique se já há código disponível no projeto, analisando também se existe um respositório git disponível. Se existir, analise os últimos 5 pushs feitos para entender as mudanças recentes.
  - Se for um projeto existente, mas sem documentação:
    - Confirme com o usuário que esse é um projeto existente, mas que você não encontrou documentação, e sugira iniciar a criação de uma PRD inicial para o projeto. Se usuário quiser criar PRD, siga as instruções em `$PROD_FLOWS/prod.spec.prd.md`
  - Se for um projeto existente, e já tem documentação, mas está espalhada ou não na estrutura como esperada por esse framework:
    - Confirme com o usuário que você encontrou documentação existente, mas que ela não está na estrutura esperada por esse framework.
    - Então, sugira ao usuário que organize a documentação existente em uma estrutura adequada para esse framework. E que que você pode fazer isso para ele seguindo o modelo e estrutura desse framework.
  - Se for um novo projeto:
    - Avance para iniciar a PRD do projeto com as instruções em `$PROD_FLOWS/prod.spec.prd.md`
  - Se for um projeto existente, que já tem uma estrutura `$PROD_DOCS`:
    - Pergunte para o usuário qual documentação ele deseja criar:
      - PRD
      - FRD
      - ARD
      - Issue (story, task ou bug)
- **Uso adequado dos comandos e instruções**: 
  - Para PRD use as instruções em `$PROD_FLOWS/prod.spec.prd.md`
  - Para FRD use as instruções em `$PROD_FLOWS/prod.spec.frd.md`
  - Para ARD use as instruções em `$PROD_FLOWS/prod.spec.ard.md`
  - Para Issue use as instruções em `$PROD_FLOWS/prod.spec.issue.md`
  - Para clarificar e revisar qualquer tipo de especificação, use as instruções em `$PROD_FLOWS/prod.spec.clarify.md`
  - Para quebrar uma especificação grande em fatias (versões / épicos / histórias), use `$PROD_FLOWS/prod.spec.breakdown.md`
  - Para criar épicos, use as instruções em `$PROD_FLOWS/prod.spec.epic.md`
- **Idioma**: Mantenha o mesmo idioma da interação com o usuário, sendo que o idioma padrão é português brasileiro
- **Faça suposições informadas**: Use o contexto, padrões de mercado e padrões comuns para preencher os gaps que a documentação ou a falta de informação não estiver cobrindo
- **Não seja verboso**: Evite fazer muitas perguntas para o usuário ao criar ou atualizar uma especificação. Seja direto e objetivo. Se perguntar, faça perguntas estratégicas e suficientes para que o usuário dê informações relevantes para a criação ou modificação com eficácia.
- **Perguntas para direcionar o usuário**: Use perguntas estratégicas para entender o escopo, objetivo e contexto da especificação que o usuário deseja criar ou modificar:
- Se o usuário fornecer informações junto com a resposta da questão, utilize-as para enriquecer o seu contexto.
- Sempre faça perguntas em mensagens distintas, para não complicar o fluxo de conversa. 
- Só faça as perguntas necessárias para entender o contexto e o escopo do produto. 
- Evite fazer perguntas redundantes ou que não agreguem valor à especificação. 
- Se o usuário não responder uma pergunta, não repita a mesma pergunta novamente, mas continue com o fluxo com as informações disponíveis. 
- Se o usuário responder com uma resposta que não se encaixa nas opções, pergunte novamente de forma clara e objetiva, mas guarde a informação que ele forneceu.
