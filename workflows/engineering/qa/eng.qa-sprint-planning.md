---
description: Planejamento de capacidade QA para uma sprint — avalia risco de cada task e distribui entre QAs e Quality Champions
auto_execution_mode: 2
env_file: "@/ENV.md"
rules_file: "$IDE/rules/engineering/qa/eng.qa.cypress-standards-rules.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Análise de risco multi-task e alocação de capacidade requer raciocínio estratégico
---

# qa.sprint-planning

Planejamento de capacidade QA para a sprint: avalia risco de cada task, considera QAs e Quality Champions disponíveis, e produz um plano de alocação baseado em critérios de risco.

## Entrada

```
#$ARGUMENTS
```

Aceita: sprint ID, nome ou número (ex: `Sprint 42`, `42`, `sprint-42`).

**Se não receber argumentos**, perguntar:
- Qual sprint deseja planejar? (ID ou nome conforme o $TASK_MANAGER)

---

## Fase 0 — Reconhecimento de Capacidade

Antes de buscar tasks, mapear a equipe disponível:

```bash
# Ler QAs e Quality Champions do members.md
grep -A 50 "^## QA" members.md
grep "Quality Champion" members.md
```

Extrair:
- **QAs**: membros da seção `## QA` do `members.md`
- **Quality Champions**: membros com `Quality Champion` no campo Posição (em qualquer squad)
- Capacidade Champions: `QA_CHAMPION_CAPACITY` do ENV.md (padrão: 30%)

Se `members.md` não existir ou não tiver seção QA, perguntar ao usuário antes de prosseguir.

---

## Fase 1 — Buscar Tasks da Sprint

```bash
# Via $TASK_MANAGER — adaptar query ao sistema configurado
# Jira (JQL):
# project = $PROJECT AND sprint = "{sprint}" AND type != Epic
# AND status in ("To Do", "In Progress", "In Review")
```

Se $TASK_MANAGER não estiver configurado: pedir ao usuário que cole a lista de tasks.

---

## Fase 2 — Análise de Risco

Invocar agente [eng.qa.quality-strategist]($IDE/agents/engineering/qa/eng.qa.quality-strategist.md) para avaliar cada task:

Para cada task, o agente determina:
- **Risco**: Alto / Médio / Baixo
- **Cobertura ideal**: E2E / exploratório / quality gate / delegar ao dev
- **Justificativa**: área do sistema, complexidade, histórico de bugs do domínio

---

## Fase 3 — Alocação

Com base no risco e na capacidade mapeada na Fase 0:

| Risco | Regra de alocação |
|-------|------------------|
| Alto | QA obrigatório — não delegar a Champion |
| Médio | QA preferencial; Champion se QA sobrecarregado |
| Baixo | Champion ou delegar ao dev via eng-qa-dev-guide |

**Detectar sobrecarga**: se demanda > capacidade total, sinalizar quais tasks ficam sem cobertura designada e sugerir redução de escopo nos itens de menor risco.

---

## Fase 4 — Gerar Plano

Usando o template `$TEMPLATES_FOLDER/engineering/qa/qa.sprint-plan-template.md`, gerar o plano e salvar em:

```
$DOCS_FOLDER/engineering/qa/sprints/sprint-plan-{sprint-slug}.md
```

Exibir o plano ao usuário e perguntar se há ajustes antes de salvar.

---

## Output

- `$DOCS_FOLDER/engineering/qa/sprints/sprint-plan-{sprint-slug}.md` — plano de alocação da sprint
- Pronto para compartilhar com o time ou colar no $TASK_MANAGER
