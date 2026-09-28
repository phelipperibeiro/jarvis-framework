---
description: Gera testes E2E Cypress a partir de uma feature, task ou spec
auto_execution_mode: 2
rules_file: "$IDE/rules/engineering/qa/eng.qa.cypress-standards-rules.md"
template_file: "$IDE/templates/engineering/qa/qa.cypress-test-template.md"
model_tier: high
model_justification: Requer análise de codebase, geração de Page Objects e specs completas
---

# qa.e2e-test-generation

Gera testes E2E Cypress + TypeScript para uma feature a partir de spec, task ou descrição.

> 📋 **Rules**: `$IDE/rules/engineering/qa/eng.qa.cypress-standards-rules.md`
> 📤 **Template**: `$IDE/templates/engineering/qa/qa.cypress-test-template.md`
> 🔧 **Skill**: `eng-qa-cypress-e2e`

---

## Entrada

```
#$ARGUMENTS
```

Aceita: caminho de spec/task, ID de task no $TASK_MANAGER, ou descrição do fluxo em linguagem natural.

**Se não receber argumentos**, perguntar:
- Qual feature ou fluxo deseja cobrir com testes E2E?

---

## Execução

Invocar Skill tool: `eng-qa-cypress-e2e`

A skill irá:
1. Mapear a estrutura de testes existente no projeto
2. Analisar o fluxo e identificar cenários (happy path, edge cases, negative tests)
3. Confirmar cenários com o QA antes de gerar
4. Gerar: Page Object + fixtures + custom commands (se necessário) + spec `.cy.ts`
5. Exibir checklist de `data-testid` que precisam ser adicionados ao código da aplicação

---

## Output

- `{TEST_FOLDER}/e2e/{dominio}/{feature}.cy.ts` — spec gerada
- `{TEST_FOLDER}/support/pages/{Dominio}Page.ts` — Page Object (novo ou atualizado)
- `{TEST_FOLDER}/fixtures/{dominio}/*.json` — fixtures de intercept
- Checklist de `data-testid` pendentes no código da aplicação
