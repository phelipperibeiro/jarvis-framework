---
description: Analisa spec/PRD/FRD de uma feature e gera estratégia de testes com critérios de aceite e mapeamento de cenários de risco
auto_execution_mode: 2
agent: "$IDE/agents/engineering/qa/eng.qa.test-planner.md"
model_tier: high
model_justification: Análise de requisitos e geração de estratégia de testes exige raciocínio profundo
---

# qa.refinement-entry

Analisa uma spec de feature e gera o documento de estratégia de testes: critérios de aceite,
mapeamento de cenários de risco e checklist de cobertura necessária.

> 🤖 **Agent**: `eng.qa.test-planner`

---

## Contexto de Execução

Este comando opera em **modo pré-código**: é executado após a tech spec ser escrita e
antes da codificação começar. A entrada é sempre a especificação do card — não o código.

**Regra obrigatória para o agente**: não executar `git diff` neste contexto.
A fonte de verdade é o conteúdo do card no $TASK_MANAGER, lido via integração disponível (ex: Jira MCP).

---

## Entrada

```
#$ARGUMENTS
```

Aceita: ID de task no $TASK_MANAGER, caminho de spec (PRD/FRD/tech spec), ou descrição da feature.

**Se não receber argumentos**, perguntar:
- Qual card ou spec você quer mapear para testes?

---

## Execução

O agente `eng.qa.test-planner` irá operar em **Modo A — Estratégia a partir da Tech Spec**:

1. **Buscar o card no $TASK_MANAGER** via integração disponível (Jira MCP) usando o ID fornecido
2. **Ler a spec** — identificar o fluxo principal, regras de negócio, integrações e restrições
3. **Mapear riscos** — o que pode falhar? onde está a complexidade? quais dependências?
4. **Definir critérios de aceite** — mensuráveis e testáveis (não apenas "funciona")
5. **Gerar estratégia de testes**:
   - Cenários E2E obrigatórios (happy path + cenários de risco alto)
   - Cenários de teste exploratório recomendados
   - O que NÃO precisa de teste automatizado (e por quê)
6. **Gerar checklist de cobertura** para validação antes do deploy

Não executar `git diff`, `git log` ou qualquer comando que dependa de código implementado.
O código ainda não existe neste momento do fluxo.

---

## Output

Documento de estratégia de testes salvo em:
`$DOCS_FOLDER/engineering/qa/strategies/{task-id}-test-strategy.md`

Estrutura do documento:
```
# Estratégia de Testes — {feature}

## Critérios de Aceite
(por cenário, mensuráveis)

## Mapeamento de Risco
(área × probabilidade × impacto)

## Cenários E2E Obrigatórios
(lista priorizada)

## Recomendações de Exploratório
(foco e time-box sugerido)

## Checklist de Deploy
(o que deve passar antes de ir para produção)
```