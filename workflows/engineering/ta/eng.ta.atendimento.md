---
description: Fluxo principal do Tech Analyst — diagnóstico, triagem e resolução/escalonamento de chamados técnicos
version: "1.0"
auto_execution_mode: 2
agent: "$IDE/agents/engineering/eng.tech-analyst.agent.md"
model_tier: medium
model_justification: Diagnóstico técnico, classificação de bugs e geração de tickets Jira — requer raciocínio estruturado mas não análise arquitetural profunda
---

# eng.ta.atendimento — Atendimento Técnico

## Objetivo

Conduzir o Tech Analyst pelo fluxo completo de atendimento de chamados:
desde a recepção do ticket do suporte N2 até resolução ou escalonamento qualificado.

---

## Entrada

<ticket>
#$ARGUMENTS
</ticket>

**Se não receber argumentos**, perguntar ao usuário:
- Qual o ID ou descrição do chamado que precisa ser atendido?

---

## Fase 0 — Carregar Contexto

Ler do ENV.md:
- `SQUAD` — squad do Tech Analyst
- `USER` — email do Tech Analyst
- `SLACK_ID` — ID Slack para comunicações

Registrar timestamp de início do atendimento.

---

## Fase 1 — Triagem Inicial

Invocar o skill `eng-tech-analyst` para conduzir o fluxo:

```
Skill tool: eng-tech-analyst
Contexto: {descrição do chamado ou ID do ticket}
```

O skill conduzirá:
1. Verificação de completude da descrição
2. Busca de existência no Jira
3. Classificação da área e avaliação de impacto
4. Decisão: resolver ou escalar

---

## Fase 2 — Confirmação

Informar ao usuário:

```
✅ Atendimento encerrado

📋 Ticket: {ID}
🔍 Diagnóstico: {resumo}
📁 Área: {FRONT|BACK|BD|PROCESSO}
📊 Impacto: {alto|baixo}
🎯 Desfecho: {Resolvido pelo Tech Analyst | Escalado para PM | Enviado para backlog | Bug existente — frequência atualizada}

{se criou Jira}
🐛 Jira: {URL do ticket criado}

{se comunicou PM ou QA}
💬 Comunicação enviada para {PM|QA} via Slack
```

---

## Regras do Workflow

- **Não avançar** sem descrição mínima do problema (Passo 1 do skill)
- **Não escalar** sem ter classificado área e avaliado impacto
- **Não escrever** no banco de dados — somente leitura
- **Sempre** registrar no HS o desfecho do atendimento

---

## Skills Utilizados

| Skill | Quando |
|-------|--------|
| `eng-tech-analyst` | Fluxo principal de triagem e decisão |
