# `/prod.spec.issue` — história, tarefa e bug

Workflow: `workflows/product/prod.spec.issue.md`

## Em uma frase

Cria a **menor unidade de trabalho** rastreável: história de usuário, tarefa técnica ou bug — o que normalmente entra no board da sprint.

## O que é (universo de produto)

| Tipo | Pergunta que responde |
|------|------------------------|
| **História de usuário** | Que resultado a persona consegue? (“Como …, quero …, para …”) |
| **Tarefa** | Que trabalho técnico habilita uma entrega (migração, telemetria, refactor pontual)? |
| **Bug** | Qual comportamento errado vs esperado, com repro steps? |

Product Owner prioriza e aceita; desenvolvedor implementa. No Jarvis **você pode escrever a issue** — desde que critérios de aceite sejam testáveis.

Uma boa issue:

- Entrega valor perceptível **sozinha** (ou desbloqueia de forma explícita)
- Cabe em uma sprint
- Tem definição de pronto / aceite
- Não esconde um épico disfarçado

## Quando usar

- Decompor um épico
- Capturar trabalho sem precisar de documento macro novo
- Registrar bug com contexto
- Requisitos não funcionais acionáveis (“p95 &lt; 300ms na rota X”)

## Quando **não** usar

- Escopo ainda é um tema enorme → [`epic`](./prod.spec.epic.md) ou [`breakdown`](./prod.spec.breakdown.md)
- Falta visão do produto → Documento de Requisitos de Produto
- Spec existe mas está ambígua → [`clarify`](./prod.spec.clarify.md) no documento pai ou na própria issue

## Exemplo (história)

> “Como membro convidado, quero aceitar o convite pelo link do e-mail para entrar no workspace.”

1. `/prod.spec.issue` (tipo história)
2. Arquivo: `…/issues/story-{id}-aceitar-convite-email.md`
3. Critérios de aceite em checklist
4. Se freelance: use `TASK_MANAGER_KEY` próprio; se tem board: depois espelhe no Jira/Linear/GitHub
5. `/eng.start` com essa chave

## Exemplo (tarefa)

> “Adicionar índice na tabela de convites para busca por token.”

Issue do tipo tarefa, ligada à história de aceitar convite — não invente tarefa órfã sem história/épico quando o valor for de usuário.

## Como o framework te favorece

- Template `$PROD_TEMPLATES/prod-issue-template.md`
- Nomenclatura `story-|task-|bug-{id}-{slug}.md`
- Empurra leitura do documento macro / épico / commits recentes antes de inventar escopo
- Encaixa no fluxo eng com `TASK_MANAGER_KEY`

## Dica de Product Owner (INVEST, resumido)

Histórias melhores tendem a ser: Independentes, Negociáveis, Valiosas, Estimáveis, Small (cabem na sprint), Testáveis.

## Com um discovery como insumo (opcional)

O [`discovery`](./prod.spec.discovery.md) é opcional: você pode rodar este comando direto, quando já sabe o que quer.

- `/prod.spec.issue já sei o que quero` → segue o fluxo de sempre. Ter arquivos na pasta `discoveries/` não muda nada.
- `/prod.spec.issue discovery-002` → o comando carrega esse discovery, lê como contexto e **repassa tudo com você** antes de escrever. O discovery é um rascunho de suposições, então nada vira fato sem você ter visto.

O documento oficial é a fonte da verdade: o discovery nunca é alterado. Se algo divergir, o agente avisa você e o documento novo ganha uma seção **"Divergências"** com o que mudou e por quê.

## Próximo passo típico

`/eng.start` → `/eng.plan` → `/eng.work` → `/eng.pr`  
Se a issue nascer torta no meio do caminho: volte ao [`clarify`](./prod.spec.clarify.md).
