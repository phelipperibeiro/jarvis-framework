# `/eng.docs` — criar ou atualizar documentação

Workflow: `workflows/engineering/eng.docs.md` · Agente: `eng.docs-writer`

## Em uma frase

Ajuda a escrever ou atualizar a documentação de engenharia, propondo mudanças objetivas e apontando riscos como links quebrados ou inconsistência com PRD/ADR.

## O que é

É o atalho para pedir documentação com o contexto certo carregado: regras de engenharia, o `ENV.md` e o agente de documentação. Para escrita, usa o skill `eng-docs-write` como referência; para organização e índice, o skill `docs-index`.

## Quando usar

- Depois de uma implementação, para deixar a documentação em dia
- Para criar ou reorganizar documentação técnica de um projeto
- Quando é preciso referenciar PRD, FRD, ARD ou RFC nos documentos

## Quando **não** usar

- Você quer criar uma especificação de produto (PRD, FRD, épico, issue) → comandos [`/prod.spec.*`](../produto/README.md)
- Você quer uma decisão arquitetural registrada → [`eng.create-ard`](./eng.create-ard.md) ou [`eng.create-rfc`](./eng.create-rfc.md)

## Como funciona

1. Ativa o contexto de engenharia e o agente de documentação
2. **Coleta o contexto mínimo** antes de escrever:
   - Qual o objetivo da mudança?
   - Quais arquivos precisam ser atualizados ou criados?
   - Há links obrigatórios (PRD, FRD, ARD, RFC) para referenciar?
   - Existe um padrão de pasta e nomenclatura no repositório?
3. **Produz a saída:** propõe mudanças objetivas nos arquivos alvo, destaca riscos e sugere uma validação mínima (leitura rápida, conferir se os links funcionam)

## Regras que importam

- Toda documentação `.md` gerada é em português do Brasil
- Não inventa informação: se não souber, pergunta
- O fluxo de versionamento segue `eng.bump-rules.md` quando envolve versão

## Próximo passo típico

Nenhum fixo. Costuma rodar dentro do [`eng.pre-pr`](./eng.pre-pr.md), que já aciona a atualização de documentação.
