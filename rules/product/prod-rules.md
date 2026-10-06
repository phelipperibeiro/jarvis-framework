> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

## Principais Regras
- O idioma padrão é o português do Brasil. Mas mude caso o usuário solicite outro idioma.
- Leia o `./$IDE/ENV.md` para entender as variáveis de ambiente do framework. Ele é importante para você saber caminhos de pastas e outras informações sobre projeto e usuário.
  - Se não existir, use o skill `jarvis-init` para criar o `ENV.md`.
- Procure `CLAUDE.md` ou `AGENTS.md` para entender informações sobre o contexto e objetivo do projeto.
  - Se não existirem, use o skill `jarvis-init` para criar o `AGENTS.md` e após essa criação, copie o conteúdo do `AGENTS.md` para o `CLAUDE.md` (se não existir o CLAUDE.md, crie-o).
- Nunca invente ou presuma dados ou informações. Se não souber, pergunte, valide e confirme com o usuário.
- Entenda se o projeto é novo ou existente, para criar ou modificar especificações de produto ou técnicas.

## Variáveis de ambiente

Pré-requisitos de ENV.md e `$IDE`: ver `rules/engineering/eng-rules.md` (sempre carregada).

Além das variáveis genéricas validadas pela `eng-rules.md`, os comandos `prod.spec.*` também precisam das variáveis de produto abaixo preenchidas (não vazias) no `$IDE/ENV.md`: `RULES_FOLDER`, `PROD_FOLDER_NAME`, `PROD_RULES`, `PROD_FLOWS`, `PROD_TEMPLATES`, `PROD_DOCS` e `CENTRAL_DOCS_REPO`. Se o `ENV.md` não as tiver, siga o fluxo de `jarvis-init` descrito na `eng-rules.md`.

Abaixo, segue uma descrição de algumas das variáveis mais importantes para as rotinas de produto:

- $DOCS_FOLDER é o nome da pasta principal de documentações do projeto. Ela fica localizada na raiz do projeto.
- $PROD_DOCS é o nome da pasta principal de documentações de produto do projeto.
- $PROD_FOLDER_NAME é o nome padrão da pasta de produto que será usada em diversos contextos do projeto.
- $TEMPLATES_FOLDER é o nome da pasta principal de templates do projeto.
- $PROD_TEMPLATES é o caminho completo para os templates de produto.
- $FLOWS_FOLDER é o nome da pasta de workflows e comandos utilizados pelos IDEs. (tenha em mente que o nome da pasta pode variar de acordo com a IDE utilizada)
- $RULES_FOLDER é o nome da pasta principal de regras invioláveis que os agentes devem seguir.
- $PROD_RULES é o caminho para a pasta que contém as regras de produto. Leia todos os arquivos dentro dessa pasta para entender as regras de produto.
- $CENTRAL_DOCS_REPO é o caminho para a pasta local que contém as especificações de produto centralizadas. Essa pasta é usada para manter um índice global de todas as especificações de produto.


## Arquivos de instruções e comandos

Sempre siga as instruções de acordo com as relações abaixo.  
**Guia para humanos (desenvolvedores aprendendo produto):** `docs/produto/` — uma página por comando, termos por extenso.

- `$PROD_FLOWS/prod.spec.discovery.md` — Investigação inicial de uma ideia (rascunho estruturado; não define tarefas) → [docs/produto/prod.spec.discovery.md](../../docs/produto/prod.spec.discovery.md)
- `$PROD_FLOWS/prod.spec.prd.md` — Documento de Requisitos de Produto (*Product Requirements Document*) → [docs/produto/prod.spec.prd.md](../../docs/produto/prod.spec.prd.md)
- `$PROD_FLOWS/prod.spec.frd.md` — Documento de Requisitos Funcionais (*Functional Requirements Document*) → [docs/produto/prod.spec.frd.md](../../docs/produto/prod.spec.frd.md)
- `$PROD_FLOWS/prod.spec.ard.md` — ARD a partir do produto (requisitos arquiteturais com o PM; conduz o `eng.create-ard`) → [docs/produto/prod.spec.ard.md](../../docs/produto/prod.spec.ard.md)
- `$PROD_FLOWS/prod.spec.breakdown.md` — Quebra de especificação grande em fatias → [docs/produto/prod.spec.breakdown.md](../../docs/produto/prod.spec.breakdown.md)
- `$PROD_FLOWS/prod.spec.clarify.md` — Esclarecimento de ambiguidades na spec → [docs/produto/prod.spec.clarify.md](../../docs/produto/prod.spec.clarify.md)
- `$PROD_FLOWS/prod.spec.epic.md` — Épico (agrupador de histórias/tarefas) → [docs/produto/prod.spec.epic.md](../../docs/produto/prod.spec.epic.md)
- `$PROD_FLOWS/prod.spec.issue.md` — Histórias de usuário, tarefas e bugs → [docs/produto/prod.spec.issue.md](../../docs/produto/prod.spec.issue.md)

Ponto de entrada quando o tipo ainda é incerto: `$PROD_FLOWS/prod.spec.md` → [docs/produto/prod.spec.md](../../docs/produto/prod.spec.md)  
**Guia de decisão (qual spec usar):** [docs/produto/prod.spec.guide.md](../../docs/produto/prod.spec.guide.md) · índice: [docs/produto/README.md](../../docs/produto/README.md)

Sempre atualize a documentação existente do projeto com as mudanças que forem feitas no projeto, ou seja, em cada atualização de feature, criação de novas features, novas especificações de produto ou técnicas, atualize as documentações existentes — principalmente os **Documentos de Requisitos de Produto** e os **Documentos de Requisitos Funcionais** — de forma a manter o projeto atualizado.

Siga sempre o formato markdown para fazer os arquivos finais.

## Descrição dos Status

Em itens e especificações, utilizamos status para identificar quais etapas do desenvolvimento cada item está. Isso é representado pela variável `$ITEM_STATUS`. 

- icebox: Lista de ideias, necessidades e desejos. Item que está aguardando priorização ou definição de escopo.
- in_review: Item que está sendo estudado, descoberto, revisado ou analisado.
- backlog: Item já foi estudado, sabemos o que fazer e está aguardando priorização de implementação.
- in_progress: Item que está em desenvolvimento.
- in_production: Item que está em produção.
- cancelled: Item que foi descontinuado ou cancelado.


## Padrão de nomes e pastas

Dentro das pastas do projeto, os caminhos de pastas e o nome dos arquivos finais devem ser criados seguindo esse padrão:

- Documento de Requisitos de Produto: `$PROD_DOCS/prd-{id}-{nome}/prd-{id}-{nome}.md`
- Documento de Requisitos Funcionais: `$PROD_DOCS/prd-{id}-{nome-do-pai}/frd-{id}-{nome}.md`
- Épico: `$PROD_DOCS/prd-{id}-{nome-do-pai}/issues/epic-{id}-{nome}.md`
- História / tarefa: `$PROD_DOCS/prd-{id}-{nome-do-pai}/issues/{story|task}-{id}-{nome}.md`
- Discovery (rascunho de uma ideia, anterior ao PRD): `$PROD_DOCS/discoveries/discovery-{id}-{nome}.md`. Usa `status` (`in_review` enquanto o rascunho existe; `cancelled` se o veredito for não seguir) e `verdict` (vazio durante a entrevista, `proceed`, `investigate_more` ou `do_not_proceed`). O veredito é uma recomendação; um PRD, FRD, épico ou issue criado depois prevalece como fonte da verdade.

O ID deve ser iterado nos novos arquivos seguindo a sequência existente.

## Perguntas para guiar o usuário

Para fazer perguntas ao usuário:
1. Tente usar o tool `AskUserQuestion` se ele estiver disponível no seu ambiente (ex: Claude Desktop, Claude Cowork, Claude Code CLI).
2. Se não estiver disponível, use **obrigatoriamente** (se possível) o formato de tabela abaixo. Caso não possível no formato de tabela, faça perguntas em texto corrido.
3. Nunca avance sem coletar as respostas necessárias.

```
|     | {Aqui fica a pergunta que você deve fazer para o usuário. Seja objetivo e direto ao ponto:} |
| --- | ----------------------------------------------------------------------------------------- |
| A   | {Resposta 1}                                                                                |
| B   | {Resposta 2}                                                                                |
| C   | {Resposta 3}                                                                                |
| D   | {Resposta 4}                                                                                |
```

**NUNCA** pergunte tudo de uma vez, sempre faça perguntas separadas e aguarde a resposta antes de prosseguir.
