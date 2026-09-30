# `/eng.create-ard-from-code` — ARD a partir do código

Workflow: `workflows/engineering/eng.create-ard-from-code.md` · Template: `templates/engineering/ARD-template.md`

## Em uma frase

Cria ou atualiza um ARD partindo da **arquitetura que o código realmente tem hoje**, e não de uma proposta.

## O que é

Muitos projetos têm código rodando e nenhuma documentação de arquitetura. Este comando lê o repositório, monta um retrato fiel do que existe e preenche o mesmo `ARD-template.md` do [`eng.create-ard`](./eng.create-ard.md), agora com "arquitetura atual (observada)" no centro.

Atalhos:

- `eng.create-ard-from-code new <nome> [--prd <caminho-do-prd>]`
- `eng.create-ard-from-code edit <nome-ou-caminho>`

## Quando usar

- Projeto existente sem ARD
- ARD desatualizado em relação ao código
- Antes de propor uma mudança grande, para ter a base do estado atual

## Quando **não** usar

- Você quer desenhar uma solução nova → [`eng.create-ard`](./eng.create-ard.md)
- Você só quer um desenho rápido para uma feature → [`eng.light-arch`](./eng.light-arch.md)

## Como funciona

| Passo | O que acontece |
|---|---|
| 0 | Define se é novo ARD ou iteração |
| 1 | Verifica o PRD, quando existir (central docs ou manualmente) |
| 2 | **Coleta contexto do repositório:** `README.md`, `ENV.md` e docs existentes; stack e arquivos de build e infra; estrutura de diretórios; entrypoints e o que roda em produção; integrações e dependências externas observáveis |
| 3 | Preenche o `ARD-template.md` com base no código |
| 4 | Impactos, riscos e estratégia de testes |
| 5 | Checagem final com os guard rails e lista de perguntas abertas |
| 6 | Entrega: ARD preenchido e resumo executivo (problema, arquitetura atual, proposta, riscos e próximos passos) |
| 7 | Publica no central docs, se configurado |

## Regras que importam

- O que está no ARD deve ser **observável no código**; o que for suposição fica marcado como suposição
- Não inventa nada que o repositório não mostre
- Decisões que exigem validação do usuário ou de Produto entram nas perguntas abertas

## Próximo passo típico

Revisar o ARD com o time e, se houver mudança a propor, [`eng.create-ard`](./eng.create-ard.md) ou [`eng.create-rfc`](./eng.create-rfc.md)
