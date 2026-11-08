# Modo `repos` do /jarvis-init — atualizar os documentos depois de clonar repositórios

> Lido pelo `SKILL.md` quando `$ARGUMENTS` é `repos` (sem diferenciar maiúsculas). Rode depois de clonar um ou mais repositórios no workspace: ele deixa o mapa de tecnologias, o `AGENTS.md` e as especializações em dia **só com o que ainda não está nos documentos**. Pode ser repetido a cada repositório liberado: um por vez dá o mesmo resultado que todos juntos, e as linhas já validadas não mudam. Termina aqui, sem continuar o onboarding, salvo o Passo 7 quando o `AGENTS.md` não existe e o modo o cria. **Chamado pelo Upgrade** (item 9.2 do [upgrade.md](upgrade.md)), faça os itens 1 a 5 e volte ao item 10 do `upgrade.md`: o resumo e o fim são os do Upgrade.

A parte comum do mapa (inferir, validar, acrescentar só o que falta) está em [mapa-de-tecnologias.md](mapa-de-tecnologias.md); a detecção de stack, em [sinais-de-stack.md](sinais-de-stack.md); o registro e a criação de especializações, em [passo-adicionar-stacks.md](passo-adicionar-stacks.md).

## Pré-condições

1. **`$IDE/ENV.md` existe.** Sem ele, avise "O framework não foi inicializado: rode `/jarvis-init`" e termine.
2. **Modo de trabalho:** use o `WORKSPACE_MODE` do ENV (ou o detectado: raiz com `.git` = `project`; raiz sem `.git` e 1+ subpastas com `.git` = `workspace`).
   - **`project`:** responda "Não se aplica ao modo projeto: o mapa tem só a raiz. Para revisá-la, rode `/warm-up`." Se o valor gravado de `WORKSPACE_MODE` divergir do detectado ou estiver ausente, repita o aviso do `/warm-up` (sugira `jarvis init --upgrade`, sem alterar o ENV). **Termine sem escrever arquivo.**
   - **`workspace`:** siga o fluxo.

## Fluxo (modo workspace)

1. **Comparar.** Liste **todas** as subpastas com `.git` (pasta ou arquivo, como num worktree) da raiz do workspace, **sem filtrar por `WORKSPACE_REPOS`** (um clone novo fora da lista precisa aparecer). Compare com as linhas do `CDD-MIND-MAP.md`:
   - **novos:** têm `.git` e não estão no mapa;
   - **ausentes:** linha do mapa cuja pasta não existe.
   - Nada novo, nada ausente e o `AGENTS.md` existe: responda "Nada a atualizar." e **termine sem escrever nenhum arquivo**. Sem o `AGENTS.md`, siga o fluxo: ele é criado no item 3.
2. **Confirmar numa tabela.** Para os novos, infira papel, linguagem, framework e área ([mapa-de-tecnologias.md](mapa-de-tecnologias.md), nunca lendo `.env*`, chaves ou credenciais) e mostre **uma tabela** com a coluna **O que será gravado** por repositório: linha do mapa, linha do bloco do `AGENTS.md` (e do `CLAUDE.md` cópia, se houver) e, com `WORKSPACE_REPOS` preenchida, "acrescentar à `WORKSPACE_REPOS`". Se o `AGENTS.md` não existe, a tabela avisa que ele será criado e que o `CLAUDE.md` recebe o mesmo conteúdo (**regra de sincronia** do `SKILL.md`); um `CLAUDE.md` existente com outro conteúdo aparece na tabela, e a confirmação vale para sobrescrevê-lo. Pergunte com `AskUserQuestion`: **Confirmar** | **Corrigir** | **Incluir informação**; repita até confirmar. **Tirar a linha** de um repositório o deixa fora de todos os documentos (por exemplo, o que ficou fora da `WORKSPACE_REPOS` de propósito): nada é gravado dele, e ele volta a ser oferecido na próxima execução e na pendência do `jarvis init --upgrade`.
3. **Gravar só o que foi confirmado.**
   - **Mapa:** acrescente só as linhas novas, sem reprocessar as existentes.
   - **Bloco do `AGENTS.md`:** uma linha por repositório, entre `<!-- jarvis:repos:start -->` e `<!-- jarvis:repos:end -->`, no formato `- **{repo}** — {papel}; {linguagem}/{framework} ({área})`. O mapa é a fonte; o texto **fora do bloco permanece idêntico**.
     - **`AGENTS.md` não existe:** **crie-o pelo Passo 7 do `SKILL.md`** (a partir do template, com o bloco preenchido por todos os repositórios do mapa já confirmado); o `CLAUDE.md` nasce igual, pela regra de sincronia; o aviso de que ele será criado está na tabela do item 2.
     - **Existe com os marcadores:** só acrescente as linhas novas entre eles; as linhas existentes não mudam.
     - **Existe sem os marcadores:** insira o bloco, com uma linha por repositório do mapa (já confirmado), logo depois da linha `> Mapa de tecnologias do projeto:`; sem essa linha, no fim do arquivo. A posição aparece **na mesma confirmação da tabela** do item 2 (não é uma pergunta a mais) e nada mais no arquivo muda.
     - **`CLAUDE.md`:** depois de gravar o `AGENTS.md`, escreva o mesmo conteúdo no `CLAUDE.md` (**regra de sincronia** do `SKILL.md`): os dois ficam sempre iguais.
   - **`WORKSPACE_REPOS`:** só se estiver preenchida, acrescente os nomes confirmados na tabela (a confirmação da tabela vale); nenhuma outra chave do `ENV.md` muda. Vazia: não mexa.
4. **Especializações, só dos repositórios novos**, depois da confirmação da tabela (reuso dos sub-passos 9.3 a 9.6 do [passo-adicionar-stacks.md](passo-adicionar-stacks.md), limitados aos novos): pela coluna Área do mapa, para cada stack: **registrada** em `{ÁREA}_SPECIALIZATIONS`: nada; **instalada e não registrada**: ofereça registrar; **inexistente**: ofereça `/jarvis-create-specialization {área} {stack}` (a criação vale só para backend e frontend). O que a pessoa não aceita não muda.
5. **Repositórios ausentes.** Para cada um, avise e pergunte **um por vez** com `AskUserQuestion`: **Remover** | **Manter**. **Remover** apaga a linha do mapa, a linha do bloco do `AGENTS.md` (e o mesmo no `CLAUDE.md`, pela regra de sincronia) e o nome da `WORKSPACE_REPOS`, se estiver lá. **Manter**, ou sem resposta: nada muda. Uma pasta que não existe pode ser só um repositório ainda não clonado: **nunca apague sem o Sim**.
6. **Resumo.** Mostre o que foi gravado (nomes, sem valores do `ENV.md`), o que ficou de fora (linhas tiradas na tabela, ausentes mantidos) e lembre que o comando pode ser repetido a cada novo repositório liberado.

## Regras

### Nunca

- Tocar no texto do `AGENTS.md` fora do bloco (o `AGENTS.md` só é criado quando não existe).
- Gravar o `AGENTS.md` sem gravar o mesmo no `CLAUDE.md` (regra de sincronia).
- Apagar linha do mapa, do bloco ou da `WORKSPACE_REPOS` sem a confirmação da pessoa.
- Ler `.env*`, chaves, certificados ou credenciais.
- Alterar outra chave do `ENV.md` além da `WORKSPACE_REPOS` (e só acrescentando os nomes confirmados).
- Reprocessar as linhas já validadas do mapa.
- Fazer commit ou push: o que muda são arquivos locais.

### Sempre

- Uma pergunta por decisão, com `AskUserQuestion` (a tabela de confirmação é uma decisão só).
- Terminar sem escrever arquivo quando não há nada a atualizar.
