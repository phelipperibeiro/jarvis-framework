# `/prod.spec.ard` — ARD a partir do produto

Workflow: `workflows/product/prod.spec.ard.md`

## Em uma frase

Abre o **ARD** (*Architecture Requirements Document*, Documento de Requisitos de Arquitetura) a partir de uma especificação de produto: você responde, em linguagem de produto, o que a arquitetura precisa atender, e o comando conduz o ARD pelo fluxo de engenharia.

## O que é (universo de produto)

O ARD descreve **como a solução será construída** e por quê (componentes, integrações, segurança, escalabilidade, riscos). É um documento de **engenharia**: quem decide a arquitetura é a engenharia.

O que o produto traz para esse documento são os **requisitos**: quantos usuários, que picos, que prazos legais, que sistemas externos, o que já é obrigatório na organização. É isso que este comando levanta com você, antes de passar a vez para a engenharia.

## Quando usar

- Depois de um Documento de Requisitos de Produto ([`prd`](./prod.spec.prd.md)) ou Funcional ([`frd`](./prod.spec.frd.md)) aprovado
- Quando você precisa deixar claro para a engenharia o que a arquitetura tem de atender
- Para iniciar um ARD novo a partir de uma especificação que já existe

## Quando **não** usar

- Para editar um ARD que já existe → [`/eng.create-ard`](../engenharia/eng.create-ard.md) (modo `edit`)
- Para extrair o ARD do código existente → [`/eng.create-ard-from-code`](../engenharia/eng.create-ard-from-code.md)
- Para escolher tecnologia ou desenhar componentes → isso é da engenharia, dentro do ARD
- Quando ainda é só uma ideia → [`discovery`](./prod.spec.discovery.md) ou [`prd`](./prod.spec.prd.md)

## O que você fornece

- O **PRD ou FRD de origem** (o comando procura em `$PROD_DOCS` e pergunta qual é)
- Um **nome** para o ARD (título e slug)
- Respostas, uma pergunta por vez, sobre volume e uso, requisitos não funcionais, integrações, regras de negócio com impacto técnico, restrições e riscos

## O que sai

- Um **resumo dos requisitos arquiteturais**, que você confirma antes de seguir
- O **ARD**, gerado pelo `eng.create-ard`, em `docs/engineering/ARD/ARD-###-{slug}.md`, com versão `1.0.0`
- O que você não soube responder fica marcado como **"a validar pela engenharia"**, e não como fato

## Exemplo

> “Checkout com pagamento por Pix: o PRD está pronto e a engenharia precisa do ARD.”

1. `/prod.spec.ard checkout-pix`
2. O comando lê o PRD, avisa que o ARD é um documento de engenharia e confirma a origem
3. Pergunta, uma por vez: volume no pico, tempo de resposta aceitável, integração com o banco parceiro, regras de LGPD, prazo
4. Mostra o resumo dos requisitos; você confirma
5. Abre o `/eng.create-ard` com esse resumo e o PRD como insumo; a engenharia segue dali

## Como o framework te favorece

- Reaproveita numeração, template e publicação do ARD de engenharia, sem um segundo fluxo para manter
- Não deixa você decidir tecnologia por engano: o comando só pergunta pelo que a solução precisa atender
- Mantém a rastreabilidade: o ARD aponta para o PRD ou FRD de origem

## Dica de Product Manager

Seja específico nos números (“2 mil pedidos por hora no pico da Black Friday”, em vez de “muito tráfego”). Um requisito vago vira uma decisão de arquitetura no escuro.

## Com um discovery como insumo (opcional)

O [`discovery`](./prod.spec.discovery.md) é opcional: você pode rodar este comando direto.

- `/prod.spec.ard já sei o que quero` → segue o fluxo de sempre.
- `/prod.spec.ard discovery-002` → o comando carrega esse discovery, lê como contexto e **repassa tudo com você** antes de usar. O discovery nunca é alterado.

## Próximo passo típico

Revisão do ARD pela engenharia → [`/eng.start`](../engenharia/eng.start.md) para planejar a implementação
