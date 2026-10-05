# `/eng.qa-refinement-entry` — estratégia de testes antes do código

Workflow: `workflows/engineering/qa/eng.qa-refinement-entry.md` · Agente: `eng.qa.test-planner`

## Em uma frase

Lê a especificação de uma feature **antes** de existir código e gera a estratégia de testes: critérios de aceite, riscos, cenários obrigatórios e checklist de deploy.

## O que é

É o QA entrando cedo, no refinamento. O comando opera em **modo pré-código**: a fonte é sempre a spec do card (PRD, FRD, tech spec ou descrição), nunca o código. Por isso ele **não roda `git diff` nem `git log`**.

## Quando usar

- Depois de a tech spec estar escrita e antes de começar a codar
- Para acordar o que precisa ser testado, e como, antes da implementação

## Quando **não** usar

- O código já existe e você quer ver lacunas de cobertura → [`eng.pre-pr`](./eng.pre-pr.md)

## Como funciona

Aceita o ID de uma task, o caminho de uma spec ou uma descrição da feature (e pergunta qual card ou spec mapear, se você não informar). O agente:

1. Busca o card no board e lê a spec (fluxo principal, regras de negócio, integrações, restrições)
2. **Mapeia riscos:** o que pode falhar, onde está a complexidade e as dependências
3. **Define critérios de aceite** mensuráveis e testáveis (não só "funciona")
4. **Gera a estratégia:** cenários E2E obrigatórios (caminho feliz e riscos altos), exploratórios recomendados, e o que **não** precisa de teste automatizado, com o motivo
5. **Gera o checklist de cobertura** para validar antes do deploy

## O que sai

`docs/engineering/qa/strategies/{task-id}-test-strategy.md`, com: critérios de aceite, mapeamento de risco (área × probabilidade × impacto), cenários E2E obrigatórios, recomendações de exploratório e checklist de deploy.

## Próximo passo típico

Implementar os cenários E2E e os exploratórios com a base [`eng-qa`](../../skills/eng-qa/SKILL.md) e a especialização registrada em `QA_SPECIALIZATIONS`, se houver uma.
