# `/prod.spec.epic` — épico

Workflow: `workflows/product/prod.spec.epic.md`

## Em uma frase

Cria um **épico**: agrupador de histórias/tarefas que entrega um bloco significativo de valor (em geral **mais de uma sprint**).

## O que é (universo de produto)

Épico (do inglês *epic*) é a unidade intermediária do backlog:

- Maior que uma história de usuário
- Menor (e mais acionável) que o Documento de Requisitos de Produto inteiro
- Serve para Product Owner priorizar temas e para o time ver progresso (“épico de onboarding: 60%”)

Foco no **o quê** e no valor — não no desenho de classes.

## Quando usar

- Feature grande que atravessa várias iterações
- Coordenar trabalho entre pessoas/squads no mesmo tema
- Depois de um [`breakdown`](./prod.spec.breakdown.md)
- Projeto em andamento sem documento macro (épico “solto” é permitido, com consciência)

## Quando **não** usar

- Cabe numa sprint com aceite claro → [`issue`](./prod.spec.issue.md) (história)
- Ainda é só visão de produto → Documento de Requisitos de Produto
- Você está listando bugs soltos sem tema comum → issues individuais

## Exemplo

> “Épico: onboarding do primeiro workspace (criar conta → convidar → primeira ação de valor).”

1. Idealmente já existe Documento de Requisitos de Produto ou funcional
2. `/prod.spec.epic onboarding do primeiro workspace`
3. Arquivo em `$PROD_DOCS/.../issues/epic-{id}-onboarding-primeiro-workspace.md`
4. Lista hipóteses, valor, fora de escopo do épico, critérios de “épico pronto”
5. Decomponha com [`/prod.spec.issue`](./prod.spec.issue.md)

## Como o framework te favorece

- Template de épico em `$PROD_TEMPLATES`
- Convenção de pastas sob o documento macro (rastreio Product Manager ↔ eng)
- Pergunta se você quer criar o documento macro antes (opcional, não bloqueia)

## Dica de Product Owner

Épico sem histórias é só título. Épico com 30 histórias sem prioridade é cemitério. Mantenha o épico **vivo**: status, o que já foi entregue, o que cortou.

## Com um discovery como insumo (opcional)

O [`discovery`](./prod.spec.discovery.md) é opcional: você pode rodar este comando direto, quando já sabe o que quer.

- `/prod.spec.epic já sei o que quero` → segue o fluxo de sempre. Ter arquivos na pasta `discoveries/` não muda nada.
- `/prod.spec.epic discovery-002` → o comando carrega esse discovery, lê como contexto e **repassa tudo com você** antes de escrever. O discovery é um rascunho de suposições, então nada vira fato sem você ter visto.

O documento oficial é a fonte da verdade: o discovery nunca é alterado. Se algo divergir, o agente avisa você e o documento novo ganha uma seção **"Divergências"** com o que mudou e por quê.

## Próximo passo típico

Várias [`issues`](./prod.spec.issue.md) → puxe a primeira com `/eng.start`
