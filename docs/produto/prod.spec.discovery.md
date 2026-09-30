# `/prod.spec.discovery` — investigação inicial de uma ideia

Workflow: `workflows/product/prod.spec.discovery.md` · Agente: `prod.discovery-interviewer` · Template: `templates/product/prod-discovery-template.md`

## Em uma frase

Entrevista você sobre uma ideia ainda crua e produz um **rascunho estruturado** dela: o problema, o que precisaria ser verdade, se parece viável e qual é o próximo passo.

## O que é (universo de produto)

Antes de escrever um Documento de Requisitos de Produto, alguém precisa responder: **isso é um problema real? Para quem? Vale a pena? Dá para fazer?** Essa etapa se chama *discovery* (descoberta).

Sem ela, o que costuma acontecer é começar pelo PRD com o problema e os requisitos **presumidos**, e descobrir tarde que a ideia não resolvia nada. O discovery é barato e pode terminar em "não vale a pena", que também é um bom resultado.

Este comando faz de entrevistador. Ele pergunta uma coisa de cada vez, aprofunda respostas vagas, pede evidência, aponta contradições e levanta o que você não considerou. E **nunca chuta**: o que ele não sabe vira pergunta ou lacuna registrada, não um fato inventado.

## O que ele não é

O discovery é um **rascunho**. Ele não cria tarefas, histórias, épicos, critérios de aceitação nem estimativas, e nada nele é verdade absoluta. Quando você for escrever o PRD ou o FRD e descobrir algo diferente, **o documento novo é a fonte da verdade**: o discovery continua como o registro do momento da investigação.

## Quando usar

- Você tem uma ideia ("e se o Jarvis fizesse X?") e não sabe se o problema é real
- Você ainda não sabe os requisitos nem se é viável
- Você quer decidir com evidência se a ideia merece virar PRD ou FRD
- Você não sabe por onde começar (o [`/prod.spec`](./prod.spec.md) também aponta para cá quando só existe uma ideia)

## Quando **não** usar

- A spec já existe e tem buracos → [`clarify`](./prod.spec.clarify.md)
- O escopo já está claro e você quer documentá-lo → [`prd`](./prod.spec.prd.md), [`frd`](./prod.spec.frd.md) ou [`issue`](./prod.spec.issue.md)
- A spec existe mas está grande demais → [`breakdown`](./prod.spec.breakdown.md)
- Você quer a decisão de arquitetura → fluxo de engenharia ([`eng.light-arch`](../engenharia/eng.light-arch.md), [`eng.create-ard`](../engenharia/eng.create-ard.md) ou [`eng.create-rfc`](../engenharia/eng.create-rfc.md))

## Como funciona

1. Você roda `/prod.spec.discovery` com a ideia (ou apontando um discovery existente para **retomar**)
2. O agente explica a entrevista, consulta os documentos e o código do projeto e começa a perguntar, **uma pergunta por vez**
3. O arquivo é criado logo no início e atualizado a cada tema, então uma conversa interrompida não se perde
4. Ao cobrir um tema, o agente resume o que entendeu e pede sua confirmação
5. Quando tem informação suficiente, propõe encerrar e pergunta se você quer acrescentar algo
6. Fecha o documento com **veredito** e **próximo passo sugerido**

### Os quatro eixos da investigação

| Eixo | O que responde |
|---|---|
| **Ideia** | O que é e para quem |
| **Problema** | Qual a dor, que evidência existe, quem sofre, como se resolve hoje |
| **Requisitos iniciais** | O que precisaria ser verdade, em alto nível, como hipóteses |
| **Viabilidade** | Um sinal (alto, médio ou baixo) de valor, usabilidade, técnica e negócio |

## O que sai

Um arquivo em `$PROD_DOCS/discoveries/discovery-{id}-{nome}.md` (nos projetos que usam o Jarvis, `$PROD_DOCS` é normalmente `docs/product`), feito pelo template, com estas seções: Ideia, Problema, Hipóteses, Viabilidade, Alternativas e riscos, Perguntas em aberto, Veredito, Próximo passo sugerido e Histórico das sessões.

O cabeçalho do arquivo traz:

| Campo | Valores |
|---|---|
| `status` | `in_review` enquanto o rascunho existe; `cancelled` se o veredito for não seguir |
| `verdict` | vazio durante a entrevista; `proceed` (seguir), `investigate_more` (investigar mais) ou `do_not_proceed` (não seguir) |

O `status` só diz se o rascunho está vivo. A conclusão fica no `verdict`, e é uma **recomendação**, não uma aprovação: quem decide é você.

## O próximo passo sugerido

Todo discovery termina sugerindo um caminho, com o **comando pronto e o id do discovery** (por exemplo `/prod.spec.prd discovery-002`). É só uma sugestão: o agente nunca executa o comando sozinho, e você pode escolher outro caminho ou parar ali. Para usar o discovery, aponte-o no comando: [`prd`](./prod.spec.prd.md), [`frd`](./prod.spec.frd.md), [`epic`](./prod.spec.epic.md) ou [`issue`](./prod.spec.issue.md) aceitam um discovery como insumo (opcional).

| O que o discovery revelou | Próximo passo sugerido |
|---|---|
| Ideia ampla, com várias entregas | [`prd`](./prod.spec.prd.md) e depois [`breakdown`](./prod.spec.breakdown.md) |
| Funcionalidade delimitada dentro de um produto existente | [`frd`](./prod.spec.frd.md) |
| Trabalho pequeno e já claro | [`issue`](./prod.spec.issue.md) |
| Lacunas críticas ou veredito "investigar mais" | Retomar o próprio discovery, com as perguntas em aberto |
| Veredito "não seguir" | Arquivar a ideia, mantendo o registro |

## Exemplo

> "Quero que o Jarvis gere relatórios de uso."

1. `/prod.spec.discovery quero que o Jarvis gere relatórios de uso`
2. O agente pergunta quem vai ler esses relatórios e o que essa pessoa faz hoje sem eles
3. Você responde que é o líder do time, que hoje monta tudo à mão; o agente pede um exemplo real e quanto tempo isso leva
4. Ele registra como **suposição** o que você só acha ("todo líder quer isso") e pergunta como confirmar
5. No fim, o veredito sai como `investigate_more`: falta saber se mais de um líder tem a mesma dor. O próximo passo sugerido é **retomar** o discovery depois de conversar com dois líderes
6. Dias depois, você roda `/prod.spec.discovery` apontando o arquivo: o agente resume onde parou e continua pelas perguntas em aberto

## Como o framework te favorece

- **Não inventa dados:** o que não sabe vira pergunta ou lacuna, com a origem de cada fato (dado, observação ou suposição)
- **Retomável:** o arquivo é versionado e cada sessão fica no histórico
- **Não invade outras etapas:** se você pedir tarefas, critérios de aceitação ou código, ele recusa e indica o comando certo
- **Não grava dados sensíveis:** credenciais e dados pessoais de clientes não entram no arquivo

## Relação com engenharia

O discovery dá só um **sinal** de viabilidade técnica, sem desenho. Se a dúvida técnica for a lacuna crítica, o próximo passo sugerido aponta para o fluxo de engenharia ([`eng.light-arch`](../engenharia/eng.light-arch.md) ou [`eng.create-rfc`](../engenharia/eng.create-rfc.md)), e você decide se vai para lá.

## Próximo passo típico

[`prd`](./prod.spec.prd.md) / [`frd`](./prod.spec.frd.md) / [`issue`](./prod.spec.issue.md), conforme o que o discovery indicar, e depois `/eng.start`
