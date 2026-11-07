# Upgrade (C) do /jarvis-init

Lido pelo passo 2 do `SKILL.md` quando o `ENV.md` existe e a opção é C (ou o argumento é `upgrade`).

> No terminal, rode antes `jarvis init --upgrade --ide {ide}`: ele atualiza os arquivos do framework, acrescenta as variáveis novas, move os documentos para as pastas novas (itens 1–7, 9 a 11) e, com HUB, POSITION, AREA e SQUAD preenchidos, filtra as rules pelo perfil (com eixo vazio, lista a pendência). Aqui ficam o Central docs antigo (item 8), as pendências que ele listar e o passo das stacks.
> **O upgrade só acrescenta chaves novas:** nenhuma chave já existente, preenchida ou não, é alterada, salvo as exceções declaradas nos itens 4 e 8 (`CENTRAL_DOCS_LOCATION` e `TOKEN_TASK_MANAGER`, com confirmação; `JARVIS_PROJECT` vazio e as chaves removidas do template, automáticos). Depois, a validação final (passo 9.5) pode reorganizar o arquivo, mover chaves para o assunto delas e corrigir valores fora das opções, sempre perguntando: nenhum valor muda sem a resposta da pessoa.
> Trocou o `ARTIFACT_STYLE` (ou HUB, POSITION, AREA, SQUAD) à mão? O Passo 8 copia ou remove as rules desse perfil.

1. Ler todas as chaves do `templates/ENV-template.md`
2. Ler todas as chaves do `$IDE/ENV.md` existente
3. Calcular diff: chaves no template que **não existem** no ENV.md atual
4. **Exceção — chaves removidas do template (#209):** apague, sem perguntar, as linhas das chaves de mensageria, banco, observabilidade, SMTP, code quality e Data Engineering (`MESSAGE_BROKER*`, `DATABASE`, `*_DATABASE`, `OBSERVABILITY*`, `TOKEN_OBSERVABILITY`, `SMTP`, `CODE_QUALITY_*` e as `DATA_*`, **menos** `DATA_SPECIALIZATIONS`; lista em `REMOVED_KEYS`, `bin/lib/core/env-upgrade.js`) e a moldura de comentário do bloco que ficar vazio. Nunca leia, mostre ou copie o valor; avise só com os nomes (`ENV.md: removidas (não são mais usadas): …`). O `jarvis init --upgrade` já faz isso no terminal
5. Se não houver diff:
   ```
   ✅ ENV.md já está atualizado. Nenhuma variável nova encontrada.
   ```
   Não há variável nova: pule os itens 6, 10 e 11 e siga para o item 7. A oferta do **passo 9 (adicionar as stacks)** e o **passo 9.5 (validar o ENV.md)** ficam no item 12, que é o único fim do Upgrade.
6. Se houver diff, exibir prévia:
   ```
   🔍 Variáveis novas encontradas no template:
     + NOVA_VAR_1=
     + NOVA_VAR_2=valor-padrão

   Serão adicionadas no assunto de cada uma, na posição do template, sem alterar os valores existentes.
   ```
7. **Exceção — documentos nos caminhos antigos:** procure documentos de trabalho em `$DOCS_FOLDER/product`, `$DOCS_FOLDER/engineering/{ARD,RFC,qa,swagger,openapi,robots,c4}`, `docs/engineering/{robots,swagger,openapi,c4}` e os discoveries em `$PROD_DOCS/discoveries/`.
   - Se houver, liste o que encontrou e pergunte com `AskUserQuestion` (uma pergunta para todos) se move para `$JARVIS_DOCS/…` (`$PROD_DOCS`, `$ENG_DOCS/…` e, para os discoveries, `$DISCOVERIES_DOCS`). Use `git mv` quando o arquivo for versionado e `mv` quando não for e, só se a raiz do workspace tiver `.git`, garanta `$JARVIS_DOCS/` no `.gitignore`.
   - **Conflito** (arquivo com o mesmo nome no destino): não sobrescreva; liste e pule esse arquivo. A pasta antiga só é removida se ficar vazia.
   - **`related_discovery`:** depois de mover discoveries, nos `.md` de `$PROD_DOCS`, troque todo `related_discovery:` cujo **nome de arquivo** seja o de um discovery movido pelo caminho novo (relativo ao workspace). Isso também conserta valores que já estavam quebrados.
   - **Sem confirmação, não mova nada:** as chaves **novas** recebem o caminho antigo (`DISCOVERIES_DOCS=$PROD_DOCS/discoveries`; `PROD_DOCS`/`ENG_DOCS` só se também forem novas). Chave que já existe não muda: avise que os documentos ficaram no caminho antigo.
   - Depois, ofereça a carga inicial do Central docs (Passo 5.3).
8. **Exceção — Central docs antigo:** se o `ENV.md` tiver `CENTRAL_DOCS_REPO` preenchido e não tiver `CENTRAL_DOCS_STORAGE`, propor a migração (só com confirmação): `CENTRAL_DOCS_STORAGE=filesystem`, `CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs` (Passo 5.2) e `git clone {CENTRAL_DOCS_REPO} {LOCATION}`. Depois, comentar a linha antiga (`# CENTRAL_DOCS_REPO=… (migrado em YYYY-MM-DD)`) e `CENTRAL_DOCS_CACHE_TTL`. Sem confirmação, não mexe e avisa que os comandos de docs vão pedir o Upgrade.
   - **Central docs no padrão antigo do modo workspace:** se `CENTRAL_DOCS_LOCATION` for `./central-docs` (ou `central-docs`) e essa pasta existir, ofereça com `AskUserQuestion` (**Mover** | **Manter**) mover para `$JARVIS_DOCS/central-docs`, o padrão atual (`docs/jarvis/central-docs` com os valores padrão). O valor escrito por extenso em um `ENV.md` existente continua válido. Com **Mover**: se o destino já existir, não sobrescreva (avise e mantenha); senão, `mv ./central-docs "$JARVIS_DOCS/central-docs"` (com `$JARVIS_DOCS` expandido) e troque o valor de `CENTRAL_DOCS_LOCATION` no `ENV.md` por `$JARVIS_DOCS/central-docs`. Esta é a única alteração de uma chave existente no Upgrade e só acontece com a confirmação. Com **Manter**, nada muda.
8.1. **Exceção — `TOKEN_TASK_MANAGER` com valor:** o token não é mais usado (o board passa pela CLI do vendor). Nunca leia, mostre ou copie o valor: confira só se a linha tem algo depois do `=`. Explique e oriente o login da CLI do `TASK_MANAGER` (ex.: `acli jira auth login`). Pergunte com `AskUserQuestion` (**Esvaziar a linha** | **Manter**). Com **Esvaziar**, troque a linha por `TOKEN_TASK_MANAGER=`; com **Manter**, nada muda e avise que o valor fica sem uso no ENV. É a segunda exceção declarada à regra "o upgrade só acrescenta" (a primeira é a `CENTRAL_DOCS_LOCATION`).
8.2. **Exceção — `JARVIS_PROJECT` vazio:** grave `https://github.com/phelipperibeiro/jarvis-framework` sem perguntar e avise ("estava vazio; preenchido com o repositório oficial do Jarvis"). Preenchido com qualquer valor, não muda. O `jarvis init --upgrade` já faz isso no terminal.
8.3. **Eixos sem forma de acesso:** se `TASK_MANAGER` ou `VERSION_CONTROL` estiver preenchido com um vendor do catálogo e o `*_ACCESS` correspondente estiver ausente, vazio ou inválido (fora de `cli`/`manual`; avise o valor errado), faça para aquele eixo o Passo 4 (descoberta da CLI, forma de acesso e variáveis), com a gravação única do fim. Vendor fora do catálogo (Linear, Asana, Bitbucket): avise que não é suportado e que o eixo fica em freelance; não mude a chave.
8.4. **Exceção — Central docs no layout antigo (#220):** com `CENTRAL_DOCS_STORAGE=filesystem`, confira se `{CENTRAL_DOCS_LOCATION}/{SQUAD}/product/` ou `{CENTRAL_DOCS_LOCATION}/{SQUAD}/engineering/` existe (o layout por tipo, anterior à estrutura por funcionalidade). Se existir:
   - Avise e rode `jarvis docs migrate` (dry-run) para mostrar o plano: quantos arquivos movem, e a lista dos que exigem quebra (entrega citada por mais de uma funcionalidade).
   - Pergunte com `AskUserQuestion` (**Aplicar a migração** | **Deixar para depois**). Com **Aplicar**, rode `jarvis docs migrate --apply` (guarda uma cópia dos originais antes de mover; nunca sobrescreve). Com **Deixar para depois**, não mexe em nada.
   - **Entregas que exigem quebra não são movidas pelo comando.** Pergunte, uma por vez, se quer acionar o agente `eng.docs-consolidator.agent` para separá-la em partes (uma por funcionalidade, com o mesmo card e PR/MR citados em cada parte — ver "Regra de separação por funcionalidade" em `skills/jarvis-docs-central/SKILL.md`); mostre o resultado e só grave com o Sim (regra de ouro). Nunca use `--force`: cada quebra é revisada.
   - Sem `.git` no Central docs, avise que não há segunda cópia além do backup local (`jarvis docs migrate` já cria um, mas não é um histórico de versões).
9. **Exceção — `PROD_MODE`:** se `PROD_MODE` estiver entre as chaves novas, grave pelo `AREA`: `ENGINEERING` → `developer-guided`, `PRODUCT` → `product-led`. Com outra `AREA` (ou vazia), faça a mesma pergunta do Passo 3 (Pergunta 8 — modo de condução) e grave a resposta. `PROD_MODE` que já existe, mesmo vazia, não muda. As demais chaves continuam sem pergunta.
    - **`WORKSPACE_MODE`:** o `jarvis init --upgrade` já grava o modo detectado (raiz sem `.git` e 1+ subpastas com `.git/` = `workspace`; raiz com `.git` = `project`). Se a chave existir vazia, detecte do mesmo jeito e grave; se existir preenchida, não muda.
    - **`.gitignore` numa raiz sem `.git` (ex.: `WORKSPACE_MODE=workspace`):** a raiz não é versionada, então esse arquivo não tem efeito. Não o apague; só avise: `ℹ️ O .gitignore da raiz do workspace não tem efeito (a raiz não é um repositório). Pode removê-lo se quiser.`
10. Acrescentar as novas variáveis no assunto de cada uma, na posição do template, junto das chaves do mesmo assunto (ex.: uma `*_SPECIALIZATIONS` nova vai para o bloco de especializações, ao lado das irmãs), com o comentário do template. Sem bloco datado no fim. O `jarvis init --upgrade` (terminal) acrescenta no fim, num bloco `# --- Upgrade ... ---`, por ser determinístico; o passo 9.5 põe essas chaves no lugar.
11. Confirmar:
   ```
   ✅ ENV.md atualizado! N variável(is) nova(s) adicionada(s).
   ⚠️ Preencha os valores em branco antes de usar os novos recursos.
   ```
12. Oferecer o **passo 9 (adicionar as stacks)**, que a pessoa pode pular, rodar o **passo 9.5 (validar o ENV.md)** e então mostrar o resumo. Pular uma etapa é permitido; o Upgrade **nunca encerra** antes do passo 9.5 e do resumo, em nenhum caminho. Não continua para o fluxo de onboarding completo.
