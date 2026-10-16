---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador único, em sequência (ex.: STORY-001, TASK-001, BUG-001). Vai no nome do arquivo e nos campos related_* de outros documentos.
id: {issue_type-001}

# Nome curto do documento. Vai no título e, em kebab-case, no nome do arquivo.
name: {nome dessa issue}

# Tipo da issue.
# Opções: Story | Task | Bug
# Story = história de usuário (valor para quem usa) | Task = tarefa técnica | Bug = defeito a corrigir
type: {Story, Task, Bug}

# PRD relacionado (Product Requirements Document: o problema e o que vamos construir).
related_prd: {path PRD relacionado, exemplo /master-docs/product/prd-001.md}

# Épico ao qual esta issue pertence (o agrupador de histórias e tarefas). Remova a linha se não houver.
related_epic: {nome do Epico relacionado, exemplo /master-docs/product/epics/epic-001.md. Se não existir, ignore essa linha}

# FRD relacionado (Functional Requirements Document: o comportamento detalhado de uma funcionalidade).
related_frd: {path FRD relacionado, exemplo /master-docs/product/frds/frd-001.md}

# Discovery de origem (o rascunho da ideia, anterior ao PRD). Remova a linha se não houver.
related_discovery: {path do discovery de origem, exemplo $DISCOVERIES_DOCS/discovery-001-nome.md. Se não existir, ignore essa linha}

# Data de criação (YYYY-MM-DD).
created_at: {YYYY-MM-DD}

# Data da última alteração (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}

# Link do card no task manager do projeto (TASK_MANAGER no ENV.md). Remova a linha se não houver.
task_link: {URL referêncial no $TASK_MANAGER - se existir. Se não, ignore essa linha}

# Em que ponto este documento está no ciclo de vida (lista em rules/product/prod-rules.md).
# Opções: icebox | in_review | backlog | in_progress | in_production | cancelled | deprecated
# icebox = ideia aguardando priorização | in_review = sendo estudado ou revisado | backlog = definido, aguardando implementação
# in_progress = em desenvolvimento | in_production = em produção
# cancelled = cancelado antes de ser entregue | deprecated = esteve em produção e foi descontinuado
status: {um dos valores acima}

# Quem criou o documento.
created_by: {nome de quem criou esse doc}

# Quem editou o documento por último.
last_editor: {nome de quem editou por último}
---

# {id}: {name}

## Contexto
{Antecedentes: por que esta história é importante, como ela se encaixa no épico, qual é o problema e como isso o resolve, recursos relacionados}

**Como** {tipo de usuário}
**Eu quero** {capacidade}  
**Então isso** {benefício/valor entregue}

## Critérios de aceitação
{Lembre-se da diferença de nível dos critérios de aceitação de um PRD/Epic e Stories/Tasks citados em `SKILL.md`. Abaixo segue o exemplo.}

```
#### Fluxo de autenticação
- Quando o usuário clica no botão "Login" na página inicial, o sistema exibe o modal de login
- Quando o usuário insere o email no campo email, o sistema valida o formato em tempo real
- Quando o usuário insere um formato de e-mail inválido, o sistema exibe o erro "Insira um e-mail válido" abaixo do campo
- Quando o usuário insere a senha e clica em "Enviar", o sistema tenta a autenticação
- Quando a autenticação é bem-sucedida, o sistema fecha o modal e redireciona para o painel
- Quando a autenticação falha, o sistema exibe o erro "Credenciais inválidas" acima do formulário
- Quando o usuário clica no link "Esqueci minha senha", o sistema exibe o modo de redefinição de senha

#### Fluxo de redefinição de senha
- Quando o usuário insere o e-mail no formulário de redefinição e clica em "Enviar link de redefinição", o sistema envia o e-mail de redefinição
- Quando o sistema envia um e-mail, o sistema exibe a confirmação "Verifique seu e-mail para obter o link de redefinição"
- Quando o usuário não recebe o e-mail em 1 minuto, o sistema mostra o botão "Reenviar e-mail"
```

## Requisitos técnicos

- **Orientação de implementação**: {Sugestões, não requisitos}
- **Requisitos de desempenho**: {Se aplicável}
- **Considerações de segurança**: {Se aplicável}
- **Requisitos de dados**: {Se aplicável}


## Casos extremos e tratamento de erros

1. **{Caso extremo 1}**: {Como o sistema deve lidar}
2. **{Caso extremo 2}**: {Como o sistema deve lidar}
3. **{Cenário de erro}**: {Mensagem de erro e recuperação fáceis de usar}

## Fora do escopo

- {O que esta história NÃO inclui explicitamente}
- {Recursos adiados para histórias futuras}


### Ativos de design

- {Link para modelos/wireframes}
- {Link para protótipos}
- {Link para especificações de design}