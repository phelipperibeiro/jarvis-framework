---
id: {PRD-001}
name: {nome desse prd}
version: {X.Y.Z - atualizar sempre que houver alteração}
status: {$ITEM_STATUS}
last_editor: {nome de quem editou por último}
updated_at: {YYYY-MM-DD}
related_repo: {URLs de repositórios relacionados, se forem vários, utilize sintaxe compatível com YAML}
related_prd: {Lista de PRDs que são relacionadas a esse PRD, se forem vários, utilize sintaxe compatível com YAML}
related_frd: {Lista de FRDs que são relacionadas a esse PRD, se forem vários, utilize sintaxe compatível com YAML}
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

## Contexto

{Forneça 2-3 parágrafos (total máximo de 200 palavras) cobrindo:
1. Situação atual e pontos de dor
2. Impacto comercial de não resolver
3. Perspectiva e necessidades do usuário
4. Importância estratégica}

### Declaração do problema ou da oportunidade
{Escreva 2-3 parágrafos resumindo o problema ou a oportunidade que estamos abordando, do ponto de vista de produto. Depois, liste os 3-6 principais problemas específicos que este PRD aborda. Foque nas dores do usuário e no impacto no negócio.}

- {Questão específica e mensurável: Descreva claramente o problema ou oportunidade que impacta diretamente o usuário}
- {Outra questão específica: Descreva um segundo problema ou oportunidade que afeta a experiência do usuário}
- {Terceiro problema chave: Descreva um terceiro problema ou oportunidade que representa um bloqueio significativo}

## Solução
{Escreva uma frase curta, com impacto, mas sem jargões e outros exageros, de no máximo 280 caractéres, que resuma a solução. Ex.: Construíremos uma solução que [descreva a solução principal em uma frase clara e direta] para [descreva o público-alvo].}

{Visão geral de 2-3 parágrafos com no máximo 200 palavras no total, respondendo: O que estamos construindo? Por quê? Para quem? Impacto esperado? Descreva qual é a solução e por que é a melhor solução. Qual é o custo de oportunidade de não fazer isso? A descrição da nossa solução e como ela ajudará o usuário a resolver o problema e a empresa a explorar esta oportunidade.} 

### Listagem das funcionalidades que compõem o escopo da solução
{Utilize as informações do usuário para criar esse bloco. Se você não tiver informações suficientes, sugira para o usuário algumas funcionalidades a partir do que você conheceu até agora e também de benchmarks do mercado. Só coloque essas informações no output final se o usuário CONFIRMAR explicitamente. Alinhe essa tabela por status, colocando in_prodution em primeiro, depois in_progress, depois backlog, depois in_review. Utilize a variável $ITEM_STATUS para representar o status de cada item. Leia `$PROD_RULES` para saber o que significa status e como utilizá-los.}

| ID | Status | Título | Descrição |
|----|--------|--------|-----------|
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | {$ITEM_STATUS} | {Nome da FRD} | {Descrição da FRD} |


#### Evoluções futuras
{Coloque uma lista seguindo o formato abaixo, as evoluções que estiverem com o status ICEBOX. Se o usuário adicionar oportunidades de evoluções futuras, insira. Não assuma ou invente nada. Remova dessa lista os itens que não forem ICEBOX. Se não houver nada para listar coloque: __Nenhuma oportunidade de evolução futura identificada.__}

| ID | Status | Título | Descrição |
|----|--------|--------|-----------|
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | icebox | {Nome da FRD} | {Descrição da FRD} |



{
Evite:
Esses dois pontos poderiam ser unificados, sendo parte de uma funcionalidade única:
- [FRD-001]: O sistema DEVE permitir que usuários façam upload de documentos médicos (PDFs, imagens) de forma simples e segura
- [FRD-002]: O sistema DEVE extrair automaticamente dados estruturados de documentos médicos (nome de exames, valores, datas, laboratórios)

Melhor seria:
- [FRD-001]: Permitir upload de arquivos e documentos médicos, permitindo extração automática de dados estruturados
}

Cancelados ou descontinuados:
| ID | Status | Título | Descrição |
|----|--------|--------|-----------|
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |
| [FRD-{id}](<path/to/frd/file.md>) | cancelled | {Nome da FRD} | {Descrição da FRD} |


### Resumo de solução técnica

{Use a codebase, README e outras documentações técnicas do projeto para entender as principais decisões técnicas e de arquitetura. Se já houver especificações técnicas no projeto, leia e crie um resumo de 2-3 parágrafos, com no máximo 100 palavras no total. E liste as principais decisões técnicas e de arquitetura no formato abaixo. Se não houver, esse bloco não deve ser incluído.}

- **[ARD-{id}](<path/to/file.md>)**: Descreva claramente a decisão técnica
- **[ARD-{id}](<path/to/file.md>)**: Descreva uma segunda decisão técnica
- **[ARD-{id}](<path/to/file.md>)**: Descreva uma terceira decisão técnica

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


## Indicadores de Sucesso
Estes são indicadores que podem ser usados para medir o sucesso dessa solução.

{Se não fornecidos, sugira quais indicadores e métricas de negócio e/ou produto devem ser monitorados para entender o sucesso, e valide com o usuário. Siga o formato abaixo:}

- {Indicador 1: Descreva claramente o indicador de sucesso}
- {Indicador 2: Descreva um segundo indicador de sucesso}
- {Indicador 3: Descreva um terceiro indicador de sucesso}


## Artefatos e Documentação
- {Documento 1: Link ou referência ao documento de suporte}
- {Documento 2: Material de referência adicional}

## Repositórios relacionados
- {Repositório 1: Link ou referência ao repositório}
- {Repositório 2: Link ou referência ao repositório}


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