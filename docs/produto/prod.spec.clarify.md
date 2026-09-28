# `/prod.spec.clarify` — esclarecer especificação

Workflow: `workflows/product/prod.spec.clarify.md`

## Em uma frase

Detecta ambiguidades e faz **poucas perguntas certeiras** (até ~5) para enriquecer a spec **antes** de planejar código.

## O que é (universo de produto)

Em discovery, Product Manager e Product Owner caçam buracos:

- “Admin” — *qual* admin? dono da conta ou suporte interno?
- “Notificar o usuário” — e-mail, push, os dois, em qual evento?
- “Rápido” — qual SLA? o que acontece se falhar?

Esclarecer cedo é barato. Esclarecer no meio do `/eng.work` é retrabalho.

Este comando **grava as respostas de volta no arquivo** da especificação (e pode logar sessão na spec canônica). Rascunhos WIP: `.jarvis/sessions/prod/{TASK_MANAGER_KEY}/`.

## Quando usar

- Depois de criar Documento de Requisitos de Produto ou Documento de Requisitos Funcionais
- Antes de `/eng.plan` / `/eng.work`
- Quando a spec está “bonita” mas cheia de implícitos
- Spike só se você **assumir** o risco — o workflow avisa

## Quando **não** usar

- Ainda não existe arquivo de spec → crie com [`prd`](./prod.spec.prd.md) / [`frd`](./prod.spec.frd.md) / [`issue`](./prod.spec.issue.md)
- Você só quer fatiar tamanho → [`breakdown`](./prod.spec.breakdown.md)
- Decisão já está fechada e registrada → não force perguntas

## Exemplo

> Documento de Requisitos Funcionais de “aceitar convite” não diz o que acontece com convite expirado nem se o usuário já tem conta.

1. `/prod.spec.clarify` + caminho do arquivo (ou contexto da feature ativa)
2. Agente mapeia cobertura (escopo, dados, erros, papéis…) **por dentro**
3. Faz perguntas objetivas, uma de cada vez quando possível
4. Atualiza o Markdown com as decisões
5. Você confirma a lista do que ainda ficou em aberto (consciente)

## Como o framework te favorece

- Taxonomia de buracos (escopo, dados, segurança, UX, não-funcionais…)
- Limita pergunta demais (não vira interrogatório infinito)
- Deixa trilha auditável na spec para o time futuro

## Relação com engenharia

Trate clarify como **quality gate de produto** antes do plano técnico. Se pular, diga isso no `/eng.start` (“assumimos X”).

## Próximo passo típico

[`breakdown`](./prod.spec.breakdown.md) / [`epic`](./prod.spec.epic.md) / [`issue`](./prod.spec.issue.md) → `/eng.start`
