# `/eng.ta.atendimento` — atendimento técnico do Tech Analyst

Workflow: `workflows/engineering/ta/eng.ta.atendimento.md` · Skill: `eng-tech-analyst` · Agente: `eng.tech-analyst.agent`

## Em uma frase

Conduz o Tech Analyst por um chamado técnico, da chegada do ticket do suporte N2 até resolver ou escalar de forma qualificada.

## O que é

O fluxo do perfil `TECH ANALYST`. Em vez de implementar features, ele faz o **diagnóstico e a triagem** dos chamados: entende o problema, vê se já existe, classifica a área e o impacto e decide se resolve ou escala.

## Quando usar

- Você é `TECH ANALYST` e recebeu um chamado do suporte
- Quando é preciso triar, diagnosticar ou escalar um problema técnico

## Quando **não** usar

- Você vai desenvolver uma feature → [`eng.start`](./eng.start.md), que aliás redireciona o `TECH ANALYST` para este comando
- Você quer investigar a fundo a causa raiz de um bug → [`eng.debug`](./eng.debug.md)

## Como funciona

Aceita o ID ou a descrição do chamado (e pergunta se você não informar).

| Fase | O que acontece |
|---|---|
| 0. Contexto | Lê do `ENV.md` o `SQUAD`, o `USER` e o `SLACK_ID` e registra a hora de início |
| 1. Triagem | Aciona a skill `eng-tech-analyst`, que: verifica se a descrição está completa, busca se o problema já existe no board, classifica a área e avalia o impacto, e decide entre resolver e escalar |
| 2. Confirmação | Resume o atendimento: ticket, diagnóstico, área, impacto e desfecho |

**Áreas:** front, back, banco de dados e processo. **Impacto:** alto ou baixo.

**Desfechos possíveis:** resolvido pelo Tech Analyst, escalado para PM, enviado para o backlog, ou bug já existente com a frequência atualizada. Quando cria um ticket, mostra o link; quando comunica PM ou QA, avisa pelo Slack.

## Regras que importam

- **Não avança** sem uma descrição mínima do problema
- **Não escala** sem antes classificar a área e avaliar o impacto
- **Não escreve no banco de dados**: acesso somente leitura
- Registra sempre o desfecho do atendimento

## Próximo passo típico

Se virou bug: [`eng.debug`](./eng.debug.md) pelo squad dono. Se virou demanda: fluxo de produto em [`/prod.spec`](../produto/prod.spec.md).
