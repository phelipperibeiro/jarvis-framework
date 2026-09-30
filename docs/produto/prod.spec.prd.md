# `/prod.spec.prd` — Documento de Requisitos de Produto

Workflow: `workflows/product/prod.spec.prd.md`  
Template: `templates/product/prod-prd-template.md`

## Em uma frase

Cria ou atualiza o **Documento de Requisitos de Produto** (*Product Requirements Document*) — a visão macro do *quê* e *por quê*.

## O que é (universo de produto)

O Documento de Requisitos de Produto responde:

- Qual problema de usuário/negócio existe?
- Para quais personas?
- Qual valor entregamos?
- Quais objetivos e métricas de sucesso?
- O que está **fora** de escopo?
- Quais restrições (prazo, compliance, integrações)?

Ele **não** é lista de tickets da sprint. Também **não** é desenho de API. É o norte para Product Manager, Product Owner e engenharia alinharem expectativa.

Sem esse documento (ou equivalente), épicos e histórias tendem a virar “pedidos soltos”.

## Quando usar

- Projeto novo (primeira especificação séria)
- Iniciativa grande (novo módulo, novo público, mudança de modelo de negócio)
- Reescrever/atualizar a visão depois de pivot ou descoberta importante
- Onboarding: “não existe nada escrito sobre o produto”

## Quando **não** usar

- Ajuste pequeno e local (copie um botão, corrija copy) → história/tarefa
- Só falta detalhar comportamento de **uma** feature já coberta no macro → Documento de Requisitos Funcionais
- Spec existe mas está ambígua → esclarecimento primeiro

## Exemplo

> “Vamos lançar um módulo de convites para times no nosso app.”

1. `/prod.spec.prd módulo de convites para times`
2. O comando conduz os gates pelo template `prod-prd-template.md`, perguntando só o necessário
3. Gera algo como:  
   `$PROD_DOCS/prd-001-convites-times/prd-001-convites-times.md`
4. Você revisa objetivos, fora de escopo e métricas
5. Em seguida: [`/prod.spec.clarify`](./prod.spec.clarify.md) se houver buracos  
   depois [`/prod.spec.frd`](./prod.spec.frd.md) por feature

## Como o framework te favorece

- Padroniza pasta e nome (`prd-{id}-{slug}/…`)
- Pode sincronizar com docs centrais se `CENTRAL_DOCS_REPO` estiver no `ENV.md`
- Mantém o documento legível por humanos **e** por agentes na hora do `/eng.start`

## Relação com engenharia

Documento de Requisitos de Produto bom → menos retrabalho no `/eng.plan`.  
Documento vago → o esclarecimento é barato; descobrir na code review é caro.

## Com um discovery como insumo (opcional)

O [`discovery`](./prod.spec.discovery.md) é opcional: você pode rodar este comando direto, quando já sabe o que quer.

- `/prod.spec.prd já sei o que quero` → segue o fluxo de sempre. Ter arquivos na pasta `discoveries/` não muda nada.
- `/prod.spec.prd discovery-002` → o comando carrega esse discovery, lê como contexto e **repassa tudo com você** antes de escrever. O discovery é um rascunho de suposições, então nada vira fato sem você ter visto.

O documento oficial é a fonte da verdade: o discovery nunca é alterado. Se algo divergir, o agente avisa você e o documento novo ganha uma seção **"Divergências"** com o que mudou e por quê.

## Próximo passo típico

[`clarify`](./prod.spec.clarify.md) → [`frd`](./prod.spec.frd.md) e/ou [`epic`](./prod.spec.epic.md) → [`issue`](./prod.spec.issue.md) → `/eng.start`
