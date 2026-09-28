---
description: Conduz sessão de teste exploratório estruturada com charter, roteiro de risco e registro de achados
auto_execution_mode: 2
rules_file: "$IDE/rules/engineering/qa/eng.qa.exploratory-session-rules.md"
template_file: "$IDE/templates/engineering/qa/qa.exploratory-session-template.md"
model_tier: medium
model_justification: Análise de risco e estruturação de sessão — raciocínio moderado
---

# qa.exploratory-session

Conduz ou documenta uma sessão de teste exploratório, gerando o doc de sessão estruturado
e criando cards de bug via `eng-qa-bug-report` ao final.

> 📋 **Rules**: `$IDE/rules/engineering/qa/eng.qa.exploratory-session-rules.md`
> 📤 **Template**: `$IDE/templates/engineering/qa/qa.exploratory-session-template.md`
> 🔧 **Skill**: `eng-qa-exploratory`

---

## Entrada

```
#$ARGUMENTS
```

Aceita: nome da feature/módulo a explorar, ou caminho de doc de sessão já realizada.

**Se não receber argumentos**, a skill perguntará o modo desejado:
- `plan` — planejar sessão antes de executar
- `document` — registrar achados de sessão já realizada
- `report` — processar doc e criar bug cards

---

## Execução

Invocar Skill tool: `eng-qa-exploratory`

A skill irá (modo `plan`):
1. Coletar escopo, contexto, tempo disponível e ambiente
2. Analisar riscos e gerar hipóteses priorizadas
3. Criar doc de sessão em `$SESSIONS_DIR/qa/EXP-{YYYYMMDD}-{N}.md`

A skill irá (modo `document`):
1. Carregar doc de sessão existente
2. Coletar achados em linguagem natural do QA
3. Classificar severidade e preencher o documento
4. Acionar `eng-qa-bug-report` para bugs S1–S4

A skill irá (modo `report`):
1. Processar doc de sessão
2. Criar todos os cards de bug em batch via `eng-qa-bug-report`

---

## Output

- `$SESSIONS_DIR/qa/EXP-{ID}.md` — documento de sessão estruturado
- Cards criados no $TASK_MANAGER para cada bug S1–S4
