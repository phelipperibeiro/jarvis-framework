---
id: {issue_type-001}
name: {nome dessa issue}
type: {Story, Task, Bug}
related_prd: {path PRD relacionado, exemplo /master-docs/product/prd-001.md}
related_epic: {nome do Epico relacionado, exemplo /master-docs/product/epics/epic-001.md. Se não existir, ignore essa linha}
related_frd: {path FRD relacionado, exemplo /master-docs/product/frds/frd-001.md}
created_at: {YYYY-MM-DD}
updated_at: {YYYY-MM-DD}
task_link: {URL referêncial no $TASK_MANAGER - se existir. Se não, ignore essa linha}
status: {icebox|in_review|in_progress|in_production|deprecated}
created_by: {nome de quem criou esse doc}
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