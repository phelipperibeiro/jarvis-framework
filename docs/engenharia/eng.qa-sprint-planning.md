# `/eng.qa-sprint-planning` — capacidade de QA da sprint

Workflow: `workflows/engineering/qa/eng.qa-sprint-planning.md` · Agente: `eng.qa.quality-strategist` · Template: `templates/engineering/qa/qa.sprint-plan-template.md`

## Em uma frase

Avalia o risco de cada task da sprint e distribui o trabalho de QA entre QAs e Quality Champions, apontando o que não vai caber.

## O que é

Um plano de alocação baseado em risco. Em vez de "o QA olha tudo", ele decide onde o QA é indispensável, onde um Quality Champion basta e o que dá para delegar ao próprio dev.

## Quando usar

- No início da sprint, para planejar a cobertura de QA
- Quando a demanda parece maior que a capacidade

## Quando **não** usar

- Você quer a estratégia de testes de uma feature → [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md)
- Você quer o relatório do que já aconteceu → [`eng.qa-quality-report`](./eng.qa-quality-report.md)

## Como funciona

Aceita a sprint (ID, nome ou número, como `Sprint 42`) e pergunta se você não informar.

| Fase | O que acontece |
|---|---|
| 0. Capacidade | Lê os QAs e Quality Champions de `members.md`. A capacidade dos Champions vem de `QA_CHAMPION_CAPACITY` do `ENV.md` (padrão 30%). Se `members.md` não tiver seção QA, pergunta antes de seguir |
| 1. Tasks | Busca as tasks da sprint no board. Sem board configurado, pede que você cole a lista |
| 2. Risco | O agente `eng.qa.quality-strategist` avalia cada task: risco (alto, médio ou baixo), cobertura ideal (E2E, exploratório, quality gate ou delegar ao dev) e justificativa |
| 3. Alocação | Distribui conforme o risco (tabela abaixo) e detecta sobrecarga |
| 4. Plano | Gera o plano, mostra a você e pergunta se há ajustes antes de salvar |

### Regras de alocação

| Risco | Quem cobre |
|---|---|
| Alto | QA obrigatório, não se delega a Champion |
| Médio | QA preferencialmente; Champion se o QA estiver sobrecarregado |
| Baixo | Champion, ou delegar ao dev com [`eng.qa-dev-quality-guide`](./eng.qa-dev-quality-guide.md) |

Se a demanda passar da capacidade, o plano sinaliza quais tasks ficam sem cobertura designada e sugere reduzir o escopo dos itens de menor risco.

## O que sai

`docs/engineering/qa/sprints/sprint-plan-{sprint-slug}.md`, pronto para compartilhar com o time ou colar no board.

## Próximo passo típico

Executar o plano: [`eng.qa-exploratory-session`](./eng.qa-exploratory-session.md), [`eng.qa-e2e-test-generation`](./eng.qa-e2e-test-generation.md) e [`eng.qa-dev-quality-guide`](./eng.qa-dev-quality-guide.md)
