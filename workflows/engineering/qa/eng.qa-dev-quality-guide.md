---
description: Orienta desenvolvedores sobre cobertura de testes para uma feature ou PR
auto_execution_mode: 2
rules_file: "$IDE/rules/engineering/qa/eng.qa.cypress-standards-rules.md"
model_tier: medium
model_justification: Análise de código e geração de orientação estruturada
---

# qa.dev-quality-guide

Analisa o código de um desenvolvedor e orienta sobre quais testes Cypress escrever,
usando os padrões do projeto. Não escreve o teste — guia e valida.

> 📋 **Rules**: `$IDE/rules/engineering/qa/eng.qa.cypress-standards-rules.md`
> 🔧 **Skill**: `eng-qa-dev-guide`

---

## Entrada

```
#$ARGUMENTS
```

Aceita: caminho de arquivo(s), ID de task no $TASK_MANAGER, ou diff/PR em texto.

**Se não receber argumentos**, perguntar:
- Qual arquivo ou PR do dev você quer analisar?

---

## Execução

Invocar Skill tool: `eng-qa-dev-guide`

A skill irá:
1. Ler o código fornecido e mapear o que foi alterado/adicionado
2. Verificar quais specs de teste já existem para o domínio
3. Gerar análise de cobertura: o que está coberto vs. o que precisa de teste
4. Orientar sobre como estruturar cada cenário (setup, intercept, ação, asserção)
5. Indicar quais `data-testid` precisam ser adicionados
6. Entregar checklist acionável para o dev

---

## Output

- Análise de cobertura: coberto vs. crítico vs. recomendado
- Orientação de implementação para cada cenário necessário
- Checklist de testes a implementar antes do merge
- Lista de `data-testid` pendentes no código
