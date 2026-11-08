# Mapa de tecnologias (`CDD-MIND-MAP.md`) — parte comum

> Lido por três fluxos: o Passo 2 do `workflows/warm-up.md`, o sub-passo 9.8 do [passo-adicionar-stacks.md](passo-adicionar-stacks.md) e o modo `/jarvis-init repos` ([repos.md](repos.md)). Cada um escolhe **quais repositórios** processar e passa a lista; este arquivo diz **como** montar ou completar o mapa. Formato e instruções de preenchimento: `$IDE/templates/cdd-mind-map-template.md`.

O mapa é o mapa de tecnologias do projeto: stack e papel de cada repositório. Ele **existe sempre**, nos dois modos: a instalação (Passo 7 do `SKILL.md`) e o Upgrade (9.2) o criam quando falta. Fica na raiz do workspace, ao lado do `AGENTS.md`. Guarda dados estruturados (linguagem, framework, área, ferramentas); prosa e comandos (setup, estilo, testes) ficam no `AGENTS.md`.

## Entrada

- A **lista de repositórios a processar**, definida por quem chama (o `warm-up` e as stacks usam `WORKSPACE_REPOS` ou, se vazia, as subpastas com `.git`; o `/jarvis-init repos` usa todas as subpastas com `.git`, pasta ou arquivo). No modo projeto, a raiz, uma linha.

## Fluxo

1. **Mapa não existe:** infira cada repositório da lista pela tabela [sinais-de-stack.md](sinais-de-stack.md) e pela estrutura (papel), mostre a tabela e pergunte com `AskUserQuestion`: **Confirmar** | **Corrigir** | **Incluir informação**. Repita até confirmar. Então grave `CDD-MIND-MAP.md` na raiz do workspace.
2. **Mapa existe:** leia-o. Repositório da lista que não está no mapa → infira, valide com a pessoa (as mesmas três respostas) e acrescente **só ele**. **Não reprocesse as linhas existentes**: o que já foi validado não muda.

## Regras

### Nunca

- Apagar uma linha do mapa sem perguntar: uma pasta que não existe pode ser só um repositório ainda não clonado ou removido de propósito.
- Ler `.env*`, chaves, certificados ou credenciais: só manifestos e a estrutura de pastas.
- Gravar uma linha que a pessoa não confirmou: inferência é sempre hipótese até a validação.

### Sempre

- Mostrar a tabela antes de gravar.
- Usar a coluna Área do mapa para escolher as especializações (o `/warm-up` e o `/jarvis-init repos` leem dela).
