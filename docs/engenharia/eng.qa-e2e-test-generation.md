# `/eng.qa-e2e-test-generation` — gerar testes E2E em Cypress

Workflow: `workflows/engineering/qa/eng.qa-e2e-test-generation.md` · Skill: `eng-qa-cypress-e2e` · Regras: `rules/engineering/qa/eng.qa.cypress-standards-rules.md`

## Em uma frase

Gera os testes E2E de uma feature em Cypress + TypeScript, seguindo os padrões do projeto (Page Objects, `data-testid`, `cy.intercept` e fixtures).

## O que é

O QA descreve o fluxo (ou aponta uma task ou spec) e o comando produz os arquivos de teste prontos, depois de **confirmar os cenários com você**.

## Quando usar

- Automatizar o E2E de uma feature nova
- Cobrir um fluxo crítico de usuário

## Quando **não** usar

- Você quer orientar um dev a escrever o próprio teste → [`eng.qa-dev-quality-guide`](./eng.qa-dev-quality-guide.md)
- Você quer só a documentação da spec E2E, sem código → skill `eng-qa-e2e-spec-writer`
- Você quer a estratégia antes do código → [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md)

## Como funciona

Aceita um caminho de spec ou task, o ID de uma task ou uma descrição do fluxo em linguagem natural (e pergunta qual feature cobrir, se faltar). A skill:

1. **Mapeia** a estrutura de testes que já existe no projeto
2. **Analisa o fluxo** e identifica cenários: caminho feliz, casos limite e testes negativos
3. **Confirma os cenários com o QA** antes de gerar
4. **Gera:** Page Object, fixtures, custom commands (se necessário) e a spec `.cy.ts`
5. **Lista os `data-testid`** que precisam ser adicionados ao código da aplicação

## O que sai

- `{TEST_FOLDER}/e2e/{dominio}/{feature}.cy.ts`: a spec
- `{TEST_FOLDER}/support/pages/{Dominio}Page.ts`: o Page Object
- `{TEST_FOLDER}/fixtures/{dominio}/*.json`: fixtures dos intercepts
- Checklist de `data-testid` pendentes no código

`TEST_FOLDER` vem do `ENV.md`; se não estiver definido, é inferido do `cypress.config.ts`.

## Regras que importam

- Seletor sempre por `data-testid`, nunca por classe ou id
- Sem `cy.wait(3000)`: aguarda o intercept ou o elemento
- Cada teste é independente dos outros
- Nada de dados sensíveis em fixtures

## Próximo passo típico

Adicionar os `data-testid` pendentes ao código, rodar a suíte e [`eng.qa-release-signoff`](./eng.qa-release-signoff.md) antes do deploy
