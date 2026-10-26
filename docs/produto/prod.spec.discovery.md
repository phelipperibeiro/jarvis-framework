# `/prod.spec.discovery` — investigação inicial de uma ideia

Workflow: `workflows/product/prod.spec.discovery.md` · Agente: `prod.discovery-interviewer` · Template: `templates/product/prod-discovery-template.md`

## Em uma frase

Entrevista você sobre uma ideia ainda crua e produz um **rascunho estruturado** dela: o problema, o que precisaria ser verdade, se parece viável e qual é o próximo passo.

## O que é (universo de produto)

Antes de escrever um Documento de Requisitos de Produto, alguém precisa responder: **isso é um problema real? Para quem? Vale a pena? Dá para fazer?** Essa etapa se chama *discovery* (descoberta).

Sem ela, o que costuma acontecer é começar pelo PRD com o problema e os requisitos **presumidos**, e descobrir tarde que a ideia não resolvia nada. O discovery é barato e pode terminar em "não vale a pena", que também é um bom resultado.

Este comando faz de entrevistador, mas economiza o seu tempo: primeiro mostra o que entendeu, depois faz **poucas perguntas**, só as que mudam a decisão, cada uma com o motivo e uma resposta recomendada. E **nunca chuta**: o que ele não sabe vira pergunta, lacuna ou suposição registrada, não um fato inventado.

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
2. O agente lê em silêncio o que já existe (documentos de produto, código, Central docs) e mostra **"O que entendi"**: o que você disse, o que ele supõe e o que falta (as lacunas críticas são as que mudam a decisão)
3. Junto, propõe o **tamanho** da ideia e o nome do arquivo. Você confirma **uma vez** e o arquivo é criado
4. Ele faz só as perguntas de maior impacto, uma por vez, mostrando **"pergunta N de até M"**, **por que importa** e a opção **recomendada**. Um padrão razoável não vira pergunta: vira suposição registrada
5. Propõe 2 ou 3 **abordagens** (sempre com "a menor coisa que funciona" e "não fazer") e recomenda uma
6. Fecha com o **scorecard**, o **veredito** e o **próximo passo sugerido**

### Tamanho e número de perguntas

| Tamanho (`size`) | Quando | Perguntas | Próximo passo típico |
|---|---|---|---|
| `small` | Trabalho pequeno e já claro | 0 a 2 | [`issue`](./prod.spec.issue.md) |
| `bounded` | Funcionalidade dentro de um produto existente | até 5 | [`frd`](./prod.spec.frd.md) |
| `broad` | Ideia ampla, com várias entregas | até 8 | [`prd`](./prod.spec.prd.md) e depois [`breakdown`](./prod.spec.breakdown.md) |

Ao chegar no teto, ele pergunta se encerra ou se você quer mais perguntas. No modo guiado (`PROD_MODE=developer-guided`), pedir explicação (`[Explicar melhor]`, `[Dúvida]`) não conta no teto.

## O que sai

Um arquivo em `$DISCOVERIES_DOCS/discovery-{id}-{nome}.md` (`$DISCOVERIES_DOCS` é `docs/jarvis/discoveries`, fora do versionamento do código), feito pelo template, com estas seções: Entendimento, Problema, Abordagens, Scorecard (valor, usabilidade, técnica e negócio: forte, adequado, fraco ou desconhecido), Veredito, Próximo passo sugerido e Histórico.

Cada requisito, documento, código, card ou PR citado no discovery vira um **link clicável**, relativo ao arquivo, que abre o ponto exato no VS Code (regra em `rules-on-demand/doc-links-rules.md`).

Ao retomar um discovery no formato antigo (com as seções Hipóteses e Perguntas em aberto), o comando o converte para o formato novo no mesmo arquivo e avisa.

O cabeçalho do arquivo traz:

| Campo | Valores |
|---|---|
| `status` | `in_review` enquanto o rascunho existe; `cancelled` se o veredito for não seguir |
| `size` | `small`, `bounded` ou `broad` (define quantas perguntas) |
| `verdict` | vazio durante a entrevista; `proceed` (seguir), `investigate_more` (investigar mais) ou `do_not_proceed` (não seguir) |

O `status` só diz se o rascunho está vivo. A conclusão fica no `verdict`, e é uma **recomendação**, não uma aprovação: quem decide é você.

## O próximo passo sugerido

Todo discovery termina sugerindo um caminho, com o **comando pronto e o id do discovery** (por exemplo `/prod.spec.prd discovery-002`). É só uma sugestão: o agente nunca executa o comando sozinho, e você pode escolher outro caminho ou parar ali. Para usar o discovery, aponte-o no comando: [`prd`](./prod.spec.prd.md), [`frd`](./prod.spec.frd.md), [`epic`](./prod.spec.epic.md) ou [`issue`](./prod.spec.issue.md) aceitam um discovery como insumo (opcional).

| O que o discovery revelou | Próximo passo sugerido |
|---|---|
| Ideia ampla, com várias entregas | [`prd`](./prod.spec.prd.md) e depois [`breakdown`](./prod.spec.breakdown.md) |
| Funcionalidade delimitada dentro de um produto existente | [`frd`](./prod.spec.frd.md) |
| Trabalho pequeno e já claro | [`issue`](./prod.spec.issue.md) |
| Lacunas críticas ou veredito "investigar mais" | Retomar o próprio discovery, pelas lacunas |
| Veredito "não seguir" | Arquivar a ideia, mantendo o registro |

## Exemplo

> "Quero que o Jarvis gere relatórios de uso."

1. `/prod.spec.discovery quero que o Jarvis gere relatórios de uso`
2. O agente mostra o que entendeu: "relatórios de uso" (dito por você); "o leitor é o líder do time" (suposição); "que decisão o relatório apoia" (lacuna crítica). Tamanho: `bounded`, até 5 perguntas. Você confirma
3. "Pergunta 1 de até 5 — Quem decide algo com esse relatório? Por que importa: sem um leitor com uma decisão, não há problema a resolver." Recomendada: "o líder do time, para redistribuir trabalho"
4. Ele registra como **suposição** o que você só acha ("todo líder quer isso"), sem gastar pergunta
5. No fim, o veredito sai como `investigate_more`: falta saber se mais de um líder tem a mesma dor. O próximo passo sugerido é **retomar** o discovery depois de conversar com dois líderes
6. Dias depois, você roda `/prod.spec.discovery` apontando o arquivo: o agente resume onde parou e continua pelas lacunas, com as perguntas que restam

## Como o framework te favorece

- **Poucas perguntas:** o tamanho da ideia define o teto, e cada pergunta vem com o motivo e uma recomendação
- **Não inventa dados:** o que não sabe vira pergunta ou lacuna, com a origem de cada fato (dado, observação ou suposição)
- **Retomável:** o arquivo fica em `docs/jarvis/discoveries/` e cada sessão fica no histórico
- **Não invade outras etapas:** se você pedir tarefas, critérios de aceitação ou código, ele recusa e indica o comando certo
- **Não grava dados sensíveis:** credenciais e dados pessoais de clientes não entram no arquivo

## Relação com engenharia

O discovery dá só um **sinal** de viabilidade técnica, sem desenho. Se a dúvida técnica for a lacuna crítica, o próximo passo sugerido aponta para o fluxo de engenharia ([`eng.light-arch`](../engenharia/eng.light-arch.md) ou [`eng.create-rfc`](../engenharia/eng.create-rfc.md)), e você decide se vai para lá.

## Próximo passo típico

[`prd`](./prod.spec.prd.md) / [`frd`](./prod.spec.frd.md) / [`issue`](./prod.spec.issue.md), conforme o que o discovery indicar, e depois `/eng.start`
