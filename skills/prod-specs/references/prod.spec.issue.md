---
name: prod.spec.issue
description: Criar um especificação de issues como Histórias de Usuário, Tarefas técnicas e bugs, seguindo as melhores práticas de gestão de produto e projeto.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: gpt-4o
model_tier: medium
model_justification: Criação de issues é estruturada e segue templates, requer boa compreensão mas não raciocínio extremamente complexo
---

# Fluxo de Criação de Issues

Antes de iniciar, revise o arquivo de regras invioláveis em `$PROD_RULES/prod-spec-rules.md`.

Este fluxo orienta você na criação de issues (histórias de usuários, tarefas, bugs etc) bem definidas usando o template `$PROD_TEMPLATES/prod-issue-template.md`. Cada issue deve ser uma unidade de trabalho autocontida que pode ser completada dentro de uma única sprint.

Uma issue é a menor unidade de trabalho que pode ser feita. Ela deve entregar valor sozinha. Ela precisa ser o menor tamanho possível para entregar rápido e com qualidade, mas não pode ser tão pequena que não entrega valor percebido para o usuário ou para o produto.

Um grupo de histórias de um mesmo assunto podem formar um épico.

## Quando Usar
- Ao decompor épicos em histórias de usuário implementáveis
- Criar tarefas técnicas
- Criar requisitos não funcionais
- Documentar e rastrear bugs
- Quando você precisa capturar trabalho que não requer documentação completa de PRD
- Para qualquer item de trabalho que precisa ser rastreado em uma sprint ou que necessita ser feita no projeto
- Para criar ou modificar novas funcionalidades, jornadas, ações de usuário e outras modificações dentro do projeto

## Pré-requisitos
- Entendimento claro do trabalho a ser feito. Leia a PRD, épicos, histórias criadas anteriormente para entender o contexto a ser feito.
- Entenda também últimos commits do projeto e outras alterações que possam ter sido feitas em sessões anteriores
- Se não houver uma PRD ou épico relacionado, sugira para o usuário a criação do épico ou da PRD, mas é totalmente opcional
- Referências de design (para histórias de usuário)
- Quaisquer restrições técnicas ou requisitos relevantes

## Resultado Final
- Siga a estrutura exata do template `$PROD_TEMPLATES/prod-issue-template.md`
- Convenção de nomenclatura: `{issue_type}-{id}-{issue_name}.md` (ex: story-123-fluxo-lembrar-senha.md)
- O idioma do arquivo deve corresponder ao idioma de interação do usuário
- Se o usuário não tiver um título claro, crie um título baseado no conteúdo do arquivo e no contexto do épico
- Uma História ou Task pode ou não ter subtasks. Sugira as subtasks que são as menores partes da issue para guiar o PM ou o Dev na criação dessas histórias ou tasks.
- Se o usuário pedir para salvar no `$TASK_MANAGER`, leia `TASK_MANAGER`, `TOKEN_TASK_MANAGER` e `TASK_MANAGER_URL_BASE` no ENV.md e use `eng-task-comment` / adapter do vendor (jira | linear | github | asana).
  - Se `TASK_MANAGER` estiver vazio (freelance) ou faltar token/URL, **não invente board** — pergunte as informações necessárias ou salve só o markdown local.

## Estrutura da Issue

### 1. Título e Metadados
- **Título**: Título claro e orientado à ação (ex: "Implementar Formulário de Login do Usuário")
- **PRD Relacionada**: Link para a PRD pai, se aplicável
- **Épico Relacionado**: Link para o épico pai, se aplicável
- **Tipo**: História/Tarefa/Bug
- **Prioridade**: Alta/Média/Baixa

### 2. Contexto

Deve descrever o contexto do problema ou funcionalidade a ser implementada:
- Informações de contexto
- Valor de negócio
- Como se encaixa no panorama maior
- Qualquer pesquisa de usuário ou dados relevantes

Para resumir a ação final que deve ser feita, use o formato abaixo:
```
**Como** [papel do usuário]  
**Eu quero** [objetivo]  
**Para que** [benefício/valor]
```

#### Assets de Design
- Links para mockups/wireframes
- Referências do design system
- Links de protótipos

Se usuário não tiver fornecido os links ou os assets de design, questione se podemos avançar sem eles. Se ele aprover, continue. Se ele entregar os assets, liste-os no template. Se ele enviar imagens, utilize-as como referência, entendendo os principais pontos e fluxos descritos no design.

### 3. Critérios de Aceitação
- Siga o formato do template
- Agrupe critérios relacionados sob subtítulos claros
- Inclua todos os cenários possíveis e casos extremos
- Seja específico sobre elementos de UI e comportamento
- Inclua estados de erro e validações

Exemplo:
```
#### Fluxo de Autenticação
- Quando o usuário clicar no botão "Login" na página inicial, o sistema exibe modal de login
- Quando o usuário inserir formato de email inválido, o sistema exibe mensagem de erro abaixo do campo
- Quando a autenticação falhar, o sistema mostra mensagem de erro específica
- Após login bem-sucedido, o sistema redireciona para o dashboard do usuário
```

### 4. Requisitos Técnicos
Nesse bloco, você deve ser explicito sobre como serão organizados os requisitos técnicos e defuncionamento. Utilize FRD para descrever os requisitos técnicos.
- Orientações de implementação (sugestões, não requisitos)
- Considerações de performance
- Requisitos de segurança
- Requisitos de dados
- Dependências

### 5. Casos Extremos e Tratamento de Erros
- Liste potenciais casos extremos
- Defina como o sistema deve lidar com cada caso
- Inclua mensagens de erro amigáveis ao usuário

### 6. Fora do Escopo
- Declare claramente o que não está incluído
- Referencie melhorias futuras se necessário

## Melhores Práticas

### Para Histórias de Usuário
- Foque nas necessidades do usuário, não na implementação
- Deixe as histórias descritivas para que agentes de IA possam construir as features corretas
- Torne-as independentes e negociáveis. As histórias devem entregar valor para o usuário ou para o produto en suas entregas.
- Elas devem ser o menor tamanho possível para entregar rápido e com qualidade, mas não pode ser tão pequena que não entrega valor percebido para o usuário ou para o produto.
- Garanta que sejam valiosas para os usuários

### Para Tarefas
- Seja específico sobre o que precisa ser feito
- Inclua critérios de sucesso
- Anote quaisquer dependências
- Estime o esforço se possível
- Torne-as independentes e negociáveis
- Elas devem ser o menor tamanho possível para entregar rápido e com qualidade, mas não pode ser tão pequena que não entrega valor percebido para o usuário ou para o produto.

### Para Bugs
- Inclua passos para reproduzir
- Peça para o usuário se ele tem evidências como vídeos ou imagens para adicionar na história. Se ele enviar, coloque o link no arquivo final, e salve os arquivos em `<project-path>/docs/master-docs/assets/`
- Documente comportamento esperado vs. real
- Pergunte detalhes do ambiente, erros no console, mensagens de erro do próprio produto
- Solicite informações de identificação do cliente, o fluxo que ele seguiu para reproduzir o erro, e quaisquer outros detalhes que possam ajudar a reproduzir o erro

## Armadilhas Comuns
- Critérios de aceitação vagos ou incompletos
- Casos extremos faltando
- Descrições excessivamente técnicas
- Falta de critérios claros de sucesso
- Não vincular ao trabalho relacionado

## Pontos de Integração
- **PRDs**: Devemos atualizar a PRD com as modificações feitas nas FRDs, sem abordar o micro, mas alterações de alto nível.
- **FRDs**: Devemos atualizar a FRD com as modificações feitas nas issues, sem abordar o micro, mas alterações de alto nível.
- **Épicos**: Issues como Histórias ou Tasks devem se encaixar no escopo do épico
- **Código**: Devem referenciar ID da issue nos commits