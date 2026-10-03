# `/eng.debug` — investigar bug ou incidente

Workflow: `workflows/engineering/eng.debug.md` · Agente: `eng.bug-hunter`

## Em uma frase

Investiga um bug ou incidente com método: lê o código, formula hipóteses, junta evidências e propõe uma correção segura, antes de mexer em qualquer coisa.

## O que é

O comando assume a postura investigativa do agente `eng.bug-hunter`. Ele não sai chutando correção: primeiro **entende o problema e lê o código**, depois levanta hipóteses de causa raiz e só então propõe passos.

## Quando usar

- Bug em produção, comportamento inesperado ou incidente
- Quando a causa raiz não é óbvia
- Quando a correção precisa de teste de regressão e aprendizado registrado

## Quando **não** usar

- Você já sabe a mudança e quer implementar → [`eng.work`](./eng.work.md)
- O bug atravessa vários serviços e você quer só rastreá-lo → o skill `eng-backend-microservices-trace` (o `eng.debug` o aciona sozinho quando suspeita disso)
- Auditoria geral de bugs e lacunas de qualidade → [`eng.bug-audit`](./eng.bug-audit.md)

## Como funciona

| Passo | O que acontece |
|---|---|
| 0 | Detecta o contexto e calibra o rigor pela **urgência** e pelo seu cargo |
| 1 | Coleta sintomas e contexto; se você passar a chave do card, busca os detalhes dele |
| 1.5 | **Lê o código antes de formular hipóteses** (obrigatório) |
| 2 | Levanta hipóteses iniciais, ainda sem mudar nada |
| 2.5 | Se o bug suspeita de cruzar serviços, faz o rastreamento multi-serviço |
| 3 | Monta o plano de investigação |
| 4 | Analisa as evidências |
| 5 | Propõe correções com segurança |
| 5.5 | **Decide o caminho:** bug complexo exige [`eng.plan`](./eng.plan.md) antes do work; bug simples pode ir direto ao [`eng.work`](./eng.work.md) |
| 6 | Valida a correção e cria o **teste de regressão** |
| 7 | Registra aprendizados e cria cards de débito técnico para melhorias estruturais |

No fim, atualiza o card com o resultado da investigação.

## Regras que importam

- Em sistemas com vários serviços, todo fluxo entre eles deve propagar um **Correlation ID**; a ausência é sinalizada como débito técnico
- Hotfix pede rigor mínimo e foco cirúrgico; sem pressa, o fluxo completo
- Sugestões de mudança vêm com riscos, impacto e testes mínimos

## Próximo passo típico

[`eng.plan`](./eng.plan.md) ou [`eng.work`](./eng.work.md), conforme o passo 5.5
