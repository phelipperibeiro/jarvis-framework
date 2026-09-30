# `/prod.spec` — ponto de entrada das especificações

Workflow: `workflows/product/prod.spec.md`

## Em uma frase

Use quando **não souber qual documento criar** — o Jarvis te ajuda a escolher o tipo certo de especificação.

## O que é (universo de produto)

Especificação é qualquer artefato que responde, em algum nível:

- *Que problema estamos resolvendo?*
- *Para quem?*
- *O que entra / o que fica de fora?*
- *Como saberemos que está pronto?*

Existem níveis (macro → micro). Este comando é o **roteador**: ele não substitui o Documento de Requisitos de Produto nem a história de usuário; ele te leva ao comando adequado.

## Quando usar

- Projeto novo e você não sabe se começa pelo documento macro ou por uma história
- Projeto legado sem pasta `$PROD_DOCS` organizada
- Pedido vago: “preciso documentar essa feature”
- Quiser criar ou editar Documento de Requisitos Funcionais, épico ou issue e ainda não escolheu o caminho
- Tem só uma **ideia** e ainda não sabe se vale especificar → o `/prod.spec` orienta para [`/prod.spec.discovery`](./prod.spec.discovery.md)

## Quando **não** usar

- Já sabe que precisa do documento macro → vá em [`/prod.spec.prd`](./prod.spec.prd.md)
- Só tem uma ideia e quer investigar o problema, os requisitos e a viabilidade → [`/prod.spec.discovery`](./prod.spec.discovery.md)
- Já tem spec e só quer tirar ambiguidades → [`/prod.spec.clarify`](./prod.spec.clarify.md)
- Já tem épico e quer histórias → [`/prod.spec.issue`](./prod.spec.issue.md)

## Exemplo (dev solo)

> “Tenho um SaaS de assinaturas sem documentação. Quero começar a organizar.”

1. Rode `/prod.spec`
2. O agente verifica se existe `$PROD_DOCS`, código, git recente
3. Provavelmente sugere criar o **Documento de Requisitos de Produto** inicial
4. Você confirma e segue o fluxo de [`prod.spec.prd`](./prod.spec.prd.md)

## Exemplo (feature em projeto que já tem docs)

> “Preciso da tela de esqueci senha.”

1. `/prod.spec`
2. Agente encontra documentação existente
3. Pergunta o tipo: documento funcional, épico, história…
4. Você escolhe **história** → [`prod.spec.issue`](./prod.spec.issue.md)  
   ou **Documento de Requisitos Funcionais** se o comportamento for rico → [`prod.spec.frd`](./prod.spec.frd.md)

## Como o framework te favorece

- Lê `rules/product/` antes de inventar estrutura
- Usa sessões em `.jarvis/sessions/prod/…` para rascunho sem sujar a pasta canônica cedo demais
- Encaminha para o workflow certo em `$PROD_FLOWS`

## Próximo passo típico

Depois de escolher o tipo → um dos comandos da [tabela do índice](./README.md#comandos-uma-página-cada).  
Quando a spec estiver clara → `/eng.start`.
