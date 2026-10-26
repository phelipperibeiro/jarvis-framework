# `/eng.debug` — investigar um bug ou varrer um escopo

Workflow: `workflows/engineering/eng.debug.md` · Agente: `eng.bug-hunter` · Skill: `eng-global-investigation`

## Em uma frase

Um comando só para bugs: investiga um problema que você viu ou varre um pedaço do código atrás de riscos, sempre só lendo, e deixa o resultado num relatório na sessão.

## O que é

Você passa o que tem e o comando decide sozinho qual dos dois casos é:

| Você passa | O comando faz | Resultado |
|---|---|---|
| Um **sintoma**: chave ou URL do card, mensagem de erro, stack trace, "X acontece quando Y" | **Investiga**: lê o código, levanta hipóteses, junta evidências e propõe a correção | `debug-report.md` |
| Um **escopo**: pasta, módulo ou `--all` | **Varre**: procura bugs latentes, falhas de segurança, problemas de performance e débito técnico, e os prioriza de P0 a P3 | `bug-audit-report.md` com um card pronto por suspeito |
| Algo **ambíguo** ("o módulo de pagamentos está estranho") | Faz **uma** pergunta: investigar ou varrer? | — |

Antes de começar, ele diz em uma linha o que entendeu ("Vou investigar o bug do card X" / "Vou varrer `src/payments`"), para você corrigir se errou. Um suspeito da varredura pode ser investigado ali mesmo.

> **Investigar × varrer:** investigar parte de um problema que já apareceu e pergunta "por que isso acontece?"; varrer parte de um pedaço do código sem bug conhecido e pergunta "o que pode dar errado aqui?". A varredura acha suspeitos; a investigação confirma cada um.

## Quando usar

- Bug em produção, comportamento inesperado, incidente ou teste que falha
- A causa não é óbvia
- Entrar num projeto legado, revisar depois de um incidente, check-up periódico ou antes de um refactor grande (varredura)

## Quando **não** usar

- Você já sabe a mudança e quer implementar → [`eng.work`](./eng.work.md)
- É um bug do próprio Jarvis → `/jarvis-report-issue`
- O bug ainda não está descrito como trabalho de produto → `/prod.spec.issue` (tipo Bug)

## Qual comando usar

```
Tenho um problema
├── É bug do próprio Jarvis? ──────────────► /jarvis-report-issue
├── O bug ainda não está descrito (produto)? ► /prod.spec.issue (tipo Bug)
├── Bug, sintoma ou quero varrer código? ───► /eng.debug {card | erro | escopo}
├── Teste flaky do Cypress? ────────────────► agente eng.qa.testing-engineer
├── Robô RPA quebrou? ──────────────────────► /eng.rpa.robot (manutenção)
└── Decidir release com bugs abertos? ──────► /eng.qa-release-signoff
```

## Como funciona

| Passo | O que acontece |
|---|---|
| 1 | Detecta o contexto (a **urgência** define quanto ele investiga sozinho: 5, 10 ou 15 etapas) e carrega a skill da área do bug |
| 2 | Decide o caso pela entrada e confirma em uma linha |
| 3 | Segue o método da skill `eng-global-investigation`, lendo só o detalhe do caso escolhido |
| 4 | Grava o relatório e indica o próximo passo |

**Na investigação:** lê o código **antes** de levantar hipóteses; se o bug cruza serviços e a especialização `eng-backend-microservices-trace` está registrada em `BACKEND_SPECIALIZATIONS`, faz o rastreamento entre serviços; antes de concluir, tenta derrubar a própria hipótese; fecha com um veredito (`confirmado` só com reprodução, `provável` ou `inconclusivo`). O relatório traz a correção proposta, o **teste de regressão descrito** (escrito depois, no `eng.work`), o plano de validação, o critério de "resolvido" e os débitos como **cards prontos**.

**Na varredura:** com `--all` ou mais de 200 arquivos, pergunta se varre em sequência ou em paralelo (mais rápido, custo maior). Roda o lint e os testes que o projeto já tem, classifica cada suspeito e escreve o card pronto de cada um.

## Regras que importam

- **Somente leitura por padrão.** No ambiente local, pode alterar recursos (banco, fila, cache, arquivo) só depois de backup. **Produção é sempre só leitura**: com acesso que você fornecer, só consultas (SELECT, GET, logs, métricas); sem acesso, ele prepara a consulta para você pedir a quem tem. Ele nunca pede credencial.
- **Nada no card.** O comando não comenta nem abre card; tudo fica no relatório, com o card pronto para você abrir. O card de entrada é lido pela CLI do vendor (`gh issue view`, `glab issue view` ou `acli jira workitem view`); sem acesso, cole o texto.
- **Três tentativas.** Se três correções já falharam, ele para e discute a arquitetura com você antes da quarta.
- Em sistemas com vários serviços, todo fluxo entre eles deve propagar um **Correlation ID**; a ausência entra como débito técnico.
- **Links clicáveis:** o relatório cita arquivos, linhas, card e PR como links relativos ao arquivo (`rules-on-demand/doc-links-rules.md`)

## Próximo passo típico

- Correção trivial (um arquivo, sem alternativa) → [`eng.work`](./eng.work.md)
- Correção com alternativas ou risco → [`eng.plan`](./eng.plan.md) (o comando já grava o `architecture.md` curto que ele exige)
- Varredura → investigar um suspeito com o próprio `/eng.debug` ou abrir os cards P0 e P1 no board
