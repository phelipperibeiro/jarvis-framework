# `/eng.qa-dev-quality-guide` — orientar o dev sobre testes

Workflow: `workflows/engineering/qa/eng.qa-dev-quality-guide.md` · Skill: `eng-qa-dev-guide` · Regras: `rules/engineering/qa/eng.qa.cypress-standards-rules.md`

## Em uma frase

Analisa o código de um desenvolvedor e diz **quais testes Cypress ele deve escrever**, sem escrever o teste por ele.

## O que é

Um jeito de o QA "escalar": em vez de escrever todos os testes, orienta cada dev com os padrões do projeto. O comando guia e valida; quem escreve o teste é o dev.

## Quando usar

- Um dev entregou uma feature ou PR e você quer indicar a cobertura necessária
- Para ensinar o padrão de testes do time em um caso real

## Quando **não** usar

- Você quer que os testes sejam gerados → [`eng.qa-e2e-test-generation`](./eng.qa-e2e-test-generation.md)
- Você quer a estratégia antes do código → [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md)

## Como funciona

Aceita o caminho de um ou mais arquivos, o ID de uma task ou um diff ou PR em texto (e pergunta qual arquivo ou PR analisar, se faltar). A skill:

1. **Lê o código** e mapeia o que foi alterado ou adicionado
2. Verifica **quais specs de teste já existem** para o domínio
3. Gera a **análise de cobertura**: o que está coberto, o que é crítico e o que é recomendado
4. **Orienta** como estruturar cada cenário (preparação, intercept, ação e asserção)
5. Indica os **`data-testid`** que precisam ser adicionados
6. Entrega um **checklist acionável** para o dev

## O que sai

Análise de cobertura (coberto, crítico, recomendado), orientação para cada cenário, checklist de testes a implementar antes do merge e a lista de `data-testid` pendentes.

## Próximo passo típico

O dev escreve os testes e o QA valida antes do merge, com [`eng.pre-pr`](./eng.pre-pr.md) na sequência
