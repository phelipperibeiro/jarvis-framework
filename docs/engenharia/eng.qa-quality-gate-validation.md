# `/eng.qa-quality-gate-validation` — quality gate da tech spec

Workflow: `workflows/engineering/qa/eng.qa-quality-gate-validation.md` · Skill: `eng-qa-gate` · Agente: `eng.qa.quality-champion-task-agent`

## Em uma frase

Confere se uma tech spec (task, spike ou bug) tem qualidade suficiente para virar subtarefas, dá uma nota de 0 a 100 e bloqueia o que não está pronto.

## O que é

Um portão de qualidade entre a tech spec e o [`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md). O agente atua como um "Quality Champion" digital: valida a estrutura, aplica os critérios de bloqueio, sugere correções e registra o resultado no card.

## Quando usar

- Depois de escrever a tech spec e antes de quebrar em subtarefas
- Quando você quer saber se a spec está clara o bastante para alguém executar

## Quando **não** usar

- Você quer a estratégia de testes de uma feature → [`eng.qa-refinement-entry`](./eng.qa-refinement-entry.md)
- Você quer revisar código → [`eng.review`](./eng.review.md)

## O que ele valida, por tipo de card

| Tipo | Critérios obrigatórios |
|---|---|
| **Task** | Descrição, critérios de aceitação, cenários de teste, análise técnica e dependências |
| **Spike** | Objetivo, **referências de discovery** (crítico), critérios de conclusão e contexto |
| **Bug** | Descrição, passos para reproduzir, análise técnica e severidade |

Os critérios completos ficam em `rules/engineering/qa/eng.qa.tech-spec-validation-criteria-rules.md`.

## O resultado

| Nota | Status | Label no card | Pode seguir? |
|---|---|---|---|
| 100% | ✅ Conforme | `QualityGate::Conforme` | Sim, para o breakdown |
| 50 a 99% | ⚠️ Parcial | `QualityGate::Parcial` | Com ressalvas |
| Abaixo de 50% | 🚫 Bloqueado | `QualityGate::Bloqueado` | Não |

**Só cards `QualityGate::Conforme` seguem para o breakdown de subtarefas.**

Algumas condições bloqueiam mesmo com nota acima de 50%: spike sem referências de discovery; bug sem passos para reproduzir ou sem análise técnica; task sem critérios de aceitação, com descrição vazia ou com subtarefas propostas em **fatias horizontais** (só enum, só repository, só DTO).

A análise vai como comentário no card, com status, pontos positivos, problemas (bloqueantes primeiro) e recomendações acionáveis.

## Regras que importam

- Direto e objetivo; foco nos gaps e nas ações necessárias
- Quem corrigiu pede nova análise e a nota é recalculada
- Em urgência crítica, dá para pedir aprovação manual justificada, com a label `QualityGate::Exceção`

## Próximo passo típico

[`eng.breakdown-subtasks`](./eng.breakdown-subtasks.md) (se conforme) ou refinar a spec e repetir
