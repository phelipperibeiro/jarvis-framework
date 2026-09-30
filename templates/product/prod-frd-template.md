---
id: {FRD-001}
name: {nome desse frd}
version: {X.Y.Z - atualizar sempre que houver alteração}
status: {$ITEM_STATUS}
last_editor: {nome de quem editou por último}
updated_at: {YYYY-MM-DD}
related_prd: {Lista de PRDs que são relacionadas a esse PRD, se forem vários, utilize sintaxe compatível com YAML}
created_at: {YYYY-MM-DD}
created_by: {nome de quem criou esse doc}
---

# {id}: {name}

## TL;DR

- **O que** resolver: 
  - {Declaração do problema 1: Qual é a questão central?}
  - {Declaração do problema 2: Quais são as dores existentes?}
  - {Declaração do problema 3: Qual oportunidade estamos abordando?}
- **Por que** resolver: 
  - {Impacto no negócio 1: Como isso beneficia o negócio?}
  - {Benefício do usuário 1: Como isso ajuda os usuários?}
  - {Valor estratégico: Por que isso é importante agora?}
- **Como** resolver: 
  - {Abordagem da solução 1: Conceito de alto nível da solução}
  - {Abordagem da solução 2: Principais funcionalidades/componentes}
  - {Diferencial: O que torna esta solução única?}

## Introdução e contexto
{Este FRD descreve as especificações de requisitos de funcionamento para a funcionalidade {Nome da Funcionalidade}. Tem como objetivo orientar as equipes de desenvolvimento no processo de criação de um recurso que atenda aos padrões planejados para a entrega e às expectativas dos usuários.}

{Forneça 2-3 parágrafos (máx. 350 palavras) cobrindo:
1. Situação atual e pontos de dor
2. Perspectiva e necessidades do usuário
3. Impacto esperado e métricas de sucesso relacionado a essa funcionalidade

Lembre-se de que esse FRD será utilizada tanto por humanos quanto para formação de contexto de agentes de IA que irão programar ou auxiliar na criação do código.}

## Jornada do Usuário

{Usuário interage com o sistema através de uma sequência de ações que levam à conclusão da tarefa principal. Descreva aqui os passos principais da jornada do usuário, incluindo pontos de entrada, interações e pontos de decisão. Faça isso se baseando no fluxo desenhado aos artefatos do design, utilizando os arquivos necessários, ou pelos inputs do usuário. Se ele não fornecer, não assuma, pergunte ao usuário para que possamos criar uma jornada completa e precisa.}

## Features dessa FRD

{Liste no padrão da tabela abaixo, as features que compõem essa FRD. Cada feature deve ser uma funcionalidade específica que será implementada.}

| ID | Status | Título | Descrição |
|----|--------|--------|-----------|
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |
| [feat-{id}](<path/to/feat/file.md>) | {$ITEM_STATUS} | {Nome da feature} | {Descrição da feature} |

## Requisitos e critérios

{Lembre-se que os critérios e requisitos escritos em um FRD e PRD são diferentes. Na FRD devemos ter decrições muito mais detalhadas levando em consideração o comportamento do usuário, com detalhes do fluxo e ações. Na PRD, devemos ter requisitos mais gerais e abstratos. 

Os requisitos, critérios de aceite e ações em um FRD são compostos pelo resultado que teremos a partir do uso das suas features do ponto de vista do usuário e também o comportamento esperado do sistema. Eles servem como base para validar se a implementação está alinhada com as expectativas do negócio e do usuário final, além de servir como contexto para criação de épicos, histórias e tasks:

- Agrupe critérios em blocos claros, relacionados com títulos e subtítulos
- Inclua todos os cenários possíveis e casos extremos
- Seja específico sobre elementos de UI e comportamento, trazendo detalhes do fluxo e ações
- Inclua estados de erro e validações
- Inclua os critérios técnicos junto dos requisitos, como tecnologias, endpoints, tabelas, etc. Se você não tiver essa informação, pergunte para o usuário:
  - Você quer colocar informações de critérios técnicos agora, ou prefere fazer posteriormente?
  - Se a resposta do usuário for fazer depois, continue inserindo apenas informações de requisitos e critérios de aceite, comportamentos do usuário e fluxos de produto.
  - Se o usuário inserir informações de critérios técnicos, utilize-as, colocando-os junto ao bullet point do requisito.

Siga a estrutura abaixo para descrever os requisitos e critérios de aceite na estrutura abaixo:}

### RQT-1: Fluxo de autenticação
- Quando o usuário clica no botão "Login" na página inicial, o sistema exibe o modal de login
- Quando o usuário insere o email no campo email, o sistema valida o formato em tempo real
  - Quando o usuário insere um formato de e-mail inválido, o sistema exibe o erro "Insira um e-mail válido" abaixo do campo
- Quando o usuário insere a senha e clica em "Entrar", o sistema tenta a autenticação
  - As informações devem ser verificadas utilizando o endpoint XYZ, que busca na tabela ABC do banco de dados Nome do Banco
- Quando a autenticação é bem-sucedida, o sistema fecha o modal e redireciona para o painel
- Quando a autenticação falha, o sistema exibe o erro "Credenciais inválidas" acima do formulário
- Devemos gravar no banco XYZ de auditoria, as informações de falha ou sucesso de login
- Quando o usuário clica no link "Esqueci minha senha", o sistema exibe o modo de redefinição de senha

### RQT-2: Fluxo de redefinição de senha
- Quando o usuário insere o e-mail no formulário de redefinição e clica em "Enviar link de redefinição", o sistema envia o e-mail de redefinição
- Quando o sistema envia um e-mail, o sistema exibe a confirmação "Verifique seu e-mail para obter o link de redefinição"
- Quando o usuário não recebe o e-mail em 1 minuto, o sistema mostra o botão "Reenviar e-mail"

## Dependências

{Descreva as dependências que essa FRD tem para funcionar corretamente. Divida em blocos cobrindo:
- Dependências de outras features do sistema
- Dados
- Serviços de API
- Ferramentas, bibliotecas ou sistemas externos.

Exemplos:
- Integração com API de pagamento do {NOME DO GATEWAY} para processamento de pagamentos
- [FRD-001 - Nome do Arquivo da FRD](<link>)
- Biblioteca de gráficos (versão 3.0+)
- Serviço de email (endpoint /api/email/send)
- Feature de autenticação (requer login ativo)
}

## Requisitos técnicos

{Esse bloco é dedicado a listar as decisões técnicas e arquiteturas que foram tomadas para a construção da funcionalidade. Liste todas as ARDs relacionadas a esse FRD. Se não souber, pergunte ao usuário.

Se não houverem ou o usuário não fornecer, esse bloco não deve ser incluído.}

```
- {[ARD-001](<path/to/file.md>): Descreva claramente a decisão técnica}
- {[ARD-002](<path/to/file.md>): Descreva uma segunda decisão técnica}
- {[ARD-003](<path/to/file.md>): Descreva uma terceira decisão técnica}
```

## O que essa solução não é

{Descreva em no máximo 150 palavras, o que essa iniciativa não é, o que nós não resolvemos por que isso faz parte de outro escopo de segmentos ou serviços que não nos propomos a trabalhar. Essa declaração é importante para evitar mal-entendidos e delimitar claramente o escopo. Valide com o usuário.

Exemplo:
Ele é um sistema de gestão de dados pessoais de saúde, que agrega informações de diferentes fontes e permite o usuário gerenciar e visualizar seus dados de saúde de forma centralizada.

- Essa solução não é um sistema de adição de informação de saúde como Apple Health, Google Fit, Fitbit, Garmin e outros. 
- Não é um sistema de diagnóstico médico
- Não é um sistema de prescrição médica
- Não é um sistema de tratamento médico
- Não controla medicamentos ou tratamentos
}

#### Fora do escopo do conceito dessa solução
{Faça essa lista baseada no bloco de O QUE ESSA SOLUÇÃO NÃO É}

- {Exclusão específica}  
- {Outra exclusão}  
- {Exclusão adicional}

## Especificações relacionadas
{liste todos os PRDs, FRDs ou outros documentos relacionados a este FRD fazendo uma análise prévia do projeto e das especificações existentes no `$CENTRAL_DOCS_REPO`. Pergunte para o usuário se existe outras relações que ele conheça. Antes de adicionar as sugestões, confirme com o usuário se elas estão corretas.}

**PRDs relacionadas**:
| ID | Título | Descrição |
|----|--------|--------|-----------|
| [PRD-{id}](<path/to/feat/file.md>) | {Nome da PRD} | {Por que é relacionado} |
| [PRD-{id}](<path/to/feat/file.md>) | {Nome da PRD} | {Por que é relacionado} |

**FRDs relacionadas**:
| ID | Título | Descrição |
| [FRD-{id}](<path/to/feat/file.md>) | {Nome da FRD} | {Por que é relacionado} |
| [FRD-{id}](<path/to/feat/file.md>) | {Nome da FRD} | {Por que é relacionado} |

**ARDs relacionadas**:
| ID | Título | Descrição |
| [ARD-{id}](<path/to/feat/file.md>) | {Nome da ARD} | {Por que é relacionado} |
| [ARD-{id}](<path/to/feat/file.md>) | {Nome da ARD} | {Por que é relacionado} |


### Histórias, tasks, Issues relacionadas
{liste todos os épicos ou issues relacionados a este FRD}

- [EPIC-001 - Nome do Épico](<link>)
- [ISSUE-001 - Nome da Issue](<link>)


## Histórico e Versionamento

| Versão | Data       | Descrição                    | Autor         | 
|--------|------------|------------------------------|---------------|
| 1.0.0  | 2025-12-23 | Versão inicial do documento  | Health Team   |


