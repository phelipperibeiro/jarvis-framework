---
description: Consolida o que a entrega implementou no Central docs, por funcionalidade (publicar, arquivar, finalizar)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.docs-consolidator.agent.md"
template_file: "$IDE/templates/engineering/central-feature-template.md"
recommended_model: opus
---

# Consolidar no Central docs

> 🔀 **Consolidado de links**: na mensagem final (Passo 10), siga a regra 5 de `$IDE/rules-on-demand/engineering/eng.transitions-rules.md`: liste, como links clicáveis, todos os arquivos da sessão que já existem.

Este comando registra no **Central docs** o que a entrega **de fato implementou**, na estrutura por funcionalidade (`{SQUAD}/{produto}/{funcionalidade}/…`). Ele roda **depois do merge do PR** (o `/eng.pr` pergunta no fim se o PR já foi mergeado e oferece chamá-lo) e gera, para cada funcionalidade tocada:
- a **página da funcionalidade** (`{funcionalidade}.md`), com o estado atual, nova ou atualizada;
- o **registro da entrega** (`delivery-{AAAA-MM-DD}-{task_key}[-{funcionalidade}].md`), com o PR, os commits e os autores;
- se houver conteúdo que não é de uma funcionalidade só, a **página do produto** (`{produto}.md`).

Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC, discovery…) continuam em `$JARVIS_DOCS`. Um documento **ligado a uma entrega consolidada** (chave da sessão, `related_*`, ou indicação sua) é **também publicado** em `decisions/`, na pasta da funcionalidade — o Central docs passa a ser, além do registro do implementado, o registro técnico oficial (#220). O que não está ligado **não é tocado**.

**Toda a sessão vai junto (#229).** O Central docs guarda um snapshot de cada funcionalidade seguido das sessões e dos artefatos dela, para uma pessoa ou uma IA consultar sem abrir a sessão, e organizado para migrar ao Confluence. Por isso o comando publica **todos os arquivos da sessão** `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`: `architecture.md`, `plan.md` e `light-arch.md` em `decisions/`; os demais (inclusive subpastas e arquivos que não são Markdown) em `history/{card}/`; e uma **página-índice da sessão** (`history/{card}/{card}.md`), que liga tudo e as funcionalidades tocadas. Depois de publicar, arquivar e finalizar (cada um com o seu Sim), a pasta da sessão pode ser apagada sem perder nada. Uma sessão pode estar **incompleta**: o comando documenta com o que existir, marca o que faltou e nunca inventa.

> ⚠️ **Três execuções separadas** (Q3/Q15 da #220), cada uma com o seu Sim: publicar (copia; os originais continuam onde estão), `--archive` (guarda os originais em `archive/`, ainda sem apagar nada) e `--finalize` (apaga os originais de `$JARVIS_DOCS`, só os que não mudaram desde o `--archive`; irreversível). Rodar só `/eng.spec-consolidate {chave}` cobre o primeiro Sim; os outros dois são chamadas separadas, de propósito.

> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.
> 📤 **Templates**: `$IDE/templates/engineering/central-feature-template.md`, `central-delivery-template.md`, `central-session-template.md` (página-índice da sessão) e `central-product-template.md`
>
> 🔗 **Links**: antes de escrever a consolidação, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link. O Central docs pode ser lido fora do workspace: siga a regra 6 (URL absoluta, com o sha do merge; sessão e `$JARVIS_DOCS` em texto).

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.docs-consolidator.agent` (agente) | Sempre: escreve a consolidação na sessão |
| Passo 3 (funcionalidades) e Passo 7 (publicação) | `/jarvis-docs-central` (via `jarvis docs fetch` / `jarvis docs publish --manifest`) | Sempre: lê o índice e o documento atual e publica depois do Sim |
| Passo 8 (`--archive`) e Passo 9 (`--finalize`) | `/jarvis-docs-central` (via `jarvis docs archive` / `jarvis docs finalize`) | Só quando chamado com `--archive` ou `--finalize`, depois do Sim de cada passo |
| Passo 2B (`--sessao`, `--proxima`) | `/jarvis-docs-central` (via `jarvis docs sessions`) | Só nos modos de sessões antigas: lista as sessões, o que falta e quais estão pendentes (só leitura) |
| Passo 2B (`--sessao`, `--proxima`) | CLI do vendor (`gh`/`glab`: `issue view`, `pr view`, `pr list`) | Só nos modos de sessões antigas, só leitura: acha a issue, o PR e os commits de uma sessão sem entrega |

---

## Entrada

<arguments>
#$ARGUMENTS
</arguments>

- `{TASK_MANAGER_KEY}` (obrigatório no modo normal): a mesma chave do `eng.start`/`eng.pr`. Sem ela, pergunte e aguarde (`eng.integrations-rules.md`; no modo freelance, o número de controle).
- `{slug}` (opcional): slug de uma funcionalidade, se você já souber qual atualizar. Com mais de uma funcionalidade tocada, o Passo 3 pergunta pelas demais.
- `--inicial`: carga inicial a partir dos documentos de trabalho que já existem (chamado pelo `/jarvis-init`). Não precisa de chave nem de PR.
- `--sessao {card}`: consolida **uma sessão antiga** (ou já entregue, sem `feature-*`/`delivery-*` novos), a do card informado, **sem pressa**: processa só ela e diz quantas faltam. Não precisa de PR nem de branch (Passo 2B).
- `--proxima`: igual ao `--sessao`, para a **próxima sessão pendente** (a primeira, em ordem numérica, que ainda não tem a página-índice `history/{card}/{card}.md` no Central docs; vem de `jarvis docs sessions --proxima`). Pode ser repetido no seu ritmo: o ponto onde você parou é o estado do Central docs, sem arquivo de controle.
- `--archive`: pula os Passos 1–7 (a consolidação já foi publicada numa execução anterior) e vai direto ao Passo 8, com o `manifest.json` já gravado em `consolidation/` nesta sessão.
- `--finalize`: pula os Passos 1–8 e vai direto ao Passo 9, com o mesmo `manifest.json` já arquivado (`--archive` antes).
- `--force`: faz os Passos 1–7 e 9 numa execução só, **sem perguntar** e **sem o Passo 8** (zero reversão, Q15 da #220) — a própria flag vale como o Sim dos passos (exceção explícita à regra de ouro, `eng.integrations-rules.md`). Decide a listagem (Passo 4), a quebra (Q9) e o `status` (Q23) por conta própria, mas **sem pular** a trava de segredo da revisão (Passo 6): se algo parecer um segredo, para antes de publicar, mesmo com `--force`. Documento sem vínculo com a entrega continua intocado. Ao fim, `jarvis docs publish --manifest ... --force` publica e já apaga os originais (sem `archive/`); mostre o relatório do que foi feito, do que ficou e por quê. **Vale também para os arquivos da sessão (#229)**, com a trava de sempre: só apaga dentro da pasta da sessão do próprio card e **só depois de conferir que a cópia publicada existe e bate o hash** (se faltar ou diferir, aquele arquivo fica na sessão e entra no relatório; com o Central docs em git, a cópia só passa na conferência depois que o PR da publicação for mesclado e a pasta atualizada). A pergunta do Passo 9.1 (apagar a pasta da sessão) continua valendo, mesmo com `--force`.

---

## Passo 0: Pré-condições

1. **Central docs ligado:** `CENTRAL_DOCS_STORAGE` preenchido no `$IDE/ENV.md`. Se estiver vazio, pare: "O Central docs está desligado. Ligue-o no `/jarvis-init` (Passo 5.2) para registrar o que foi implementado."
2. **Modo normal:** a sessão `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` existe. Ela **pode estar incompleta** (sem `architecture.md`, `plan.md` ou `context.md`): o comando segue com o que existir e registra o que faltou como "ausente" na página-índice, sem perguntar e sem inventar. Sem a pasta da sessão (ou vazia), avise que a consolidação perde as decisões e pergunte se segue só com o diff, os documentos de trabalho e a issue/PR.
3. **Branch base:** o `Branch base:` do `architecture.md`. Sem ele, pergunte com `AskUserQuestion` (`main`, `dev` ou Outro). Nos modos `--sessao`/`--proxima` não há branch atual para comparar: os commits vêm do PR (Passo 2B) e esta pergunta não existe.

## Passo 1: Coleta (modo normal)

O agente `eng.docs-consolidator.agent` lê **todas** as fontes, na ordem do agente:
1. `architecture.md` e `plan.md` da sessão, **se existirem**.
2. Documentos de trabalho ligados à tarefa em `$PROD_DOCS` e `$ENG_DOCS` (PRD, FRD, épicos, histórias, ARD, RFC, SPEC, swagger, QA, discovery).
3. Commits e arquivos:
   ```bash
   git log {base}..HEAD --format='%h|%an|%ad|%s' --date=short
   git diff --stat {base}...HEAD
   ```
4. **PR/MR:** número e URL (`pull-request.md` da sessão, `gh pr view`/equivalente do vendor, ou pergunte).
5. **Card:** URL no padrão do `TASK_MANAGER` (`eng.integrations-rules.md`); no modo freelance, só o número de controle.
6. `gate-checklist.md` (a rodada mais recente do `eng.pre-pr`; as anteriores, `gate-checklist-rodada-{N}.md`, são histórico), `pull-request.md`, `daily.md` e os `task-comment-*.md` da sessão, se existirem — são candidatos a `history/` no Passo 4.
7. **Todos os outros arquivos da sessão**, listados com `jarvis docs sessions --json` (caminho relativo, tamanho e o que falta): `context.md`, `light-arch.md`, `pr-body.md`, `baseline.md`, `roteiro-validacao.md`, `nota-de-release.md`, `checklist-conteudo.md`, `issue-*.md` e as subpastas (`fontes/`, `ferramentas/`, `issues/`…). **Ficam de fora**, por não serem conteúdo: os arquivos que começam com `.` (`.timestamp_start`, `.lead_time_minutes`), a pasta `consolidation/` e os `*.public.md`.

## Passo 2: Coleta (modo `--inicial`)

1. Liste os PRD, FRD, ARD, RFC e SPEC em `$PROD_DOCS` e `$ENG_DOCS/{ARD,RFC,SPEC}` (e nos caminhos antigos, se o `/jarvis-init` não os moveu).
2. Sugira o agrupamento por funcionalidade (um PRD/FRD e os ARD/RFC/SPEC ligados a ele) e confirme com `AskUserQuestion` (aceitar / ajustar).
3. Para cada grupo, o agente lê os documentos e o código relacionado (só leitura), para descrever o que **está implementado**. O que estiver só especificado vai para "Fora do escopo", e o status reflete isso.
4. No fim, rode `jarvis docs sessions --pendentes --json` e diga **quantas sessões ainda estão pendentes** (sem a página-índice no Central docs). Se houver, sugira `/eng.spec-consolidate --proxima`, que as trata uma por vez, no seu ritmo.

## Passo 2B: Coleta (modos `--sessao {card}` e `--proxima`): uma sessão antiga por vez

Para as sessões que nunca foram consolidadas (ou foram, mas não têm os arquivos no Central docs), **sem pressa e uma por vez**. Cada execução trata **uma** sessão, do começo ao fim (Passos 2B a 10), e termina dizendo quantas faltam. Pode parar a qualquer momento: o que já foi publicado fica, e a próxima execução continua da seguinte pendente.

1. **Qual sessão.** `--sessao {card}` usa o card informado. `--proxima` roda `jarvis docs sessions --proxima` e usa o card que ele imprime; sem nenhum, diga "Nenhuma sessão pendente" e encerre. Mostre um resumo da sessão (de `jarvis docs sessions --json`): arquivos e tamanho, o que falta (`architecture.md`, `plan.md`, `context.md`), se há entrega no Central docs e se a página-índice já existe. Se já existe, pergunte (`AskUserQuestion`, **Refazer / Nada a fazer**): refazer só gera uma nova versão (`-vN`) do que mudou, e o padrão é "Nada a fazer".
2. **Já entregue ou não.**
   - **Já entregue** (`delivered`; há `delivery-*` desse card no Central docs): **só os arquivos**. Publica os arquivos da sessão e a página-índice, e **não regera** `feature-*` nem `delivery-*` (Q5 da #229). A funcionalidade principal é a do `delivery-*` existente, e a página-índice liga a ele.
   - **Sem entrega:** documenta a entrega com o que existir, nos passos 3 a 6 abaixo.
3. **Fontes (somente leitura, sem checkout).** Os arquivos da sessão que existirem e, no GitHub (ou GitLab), pelo CLI do vendor:
   - a issue: `gh issue view {card} --json number,title,body,state,closedAt,labels,parent,closedByPullRequestsReferences`;
   - o PR: o que a issue vincula (`closedByPullRequestsReferences`); sem vínculo, `gh pr list --state all --search "{card} in:title,body" --json number,title,state,mergedAt,url`; sem resultado, **"PR não localizado"** (não invente);
   - do PR achado: `gh pr view {n} --json number,title,url,mergedAt,author,headRefName,baseRefName,commits` (commits com o **nome** do autor e a data, nunca o e-mail).
4. **Data e campos da entrega.** A data do `delivery-*` é a do merge do PR; sem PR, a do fechamento da issue; sem as duas, a de `.timestamp_start` da sessão, dizendo isso em "Fontes". O `pr` do frontmatter (campo obrigatório) recebe o PR ou o texto **"PR não localizado"**; o `card_url` fica vazio se não houver issue.
5. **Sessão sem issue e sem PR** (ex.: a 202): documente com os arquivos que existem, marcando "sem issue e sem PR", sem perguntar caso a caso (Q8 da #229). **Sessão sem arquivos** (ex.: a 14): o registro vem só da issue; nenhum arquivo é movido. Em todos os casos a lista do Passo 4 mostra o que será feito antes do seu Sim.
6. **Épicos (Q7 da #229).** Se a issue tem `parent` (ou o título começa por `[Épico n.m]`), os cards do mesmo épico entram **no mesmo `delivery-*` da funcionalidade**, com o `task_key` do épico, o `pr` do PR do épico e uma tabela com cada card e o seu PR. Como as sessões são processadas uma por vez, a cada execução leia o `delivery-*` do épico que já existe (`jarvis docs fetch`) e **acrescente** esta sessão à tabela, mantendo o nome do arquivo; se ainda não existe, crie-o. Sem épico, vale o card.
7. **Funcionalidade.** Sugira a funcionalidade pela issue, pelo PR e pelos arquivos (e, na sessão já entregue, pelo `delivery-*`), e confirme como no Passo 3, uma pergunta por funcionalidade.

Depois: Passo 3 (funcionalidades, já respondido acima), Passo 4 (listagem, com o `--dry-run`), Passo 5 (escrever; no lugar do diff da branch, os commits vêm do PR; a pasta `consolidation/` é a da própria sessão, `$SESSIONS_DIR/eng/{card}/consolidation/`), Passos 6 a 9.1 como sempre, cada um com o seu Sim. No fim, diga quantas sessões ainda estão pendentes e sugira `/eng.spec-consolidate --proxima` de novo.

## Passo 3: Quais funcionalidades

A entrega pode tocar **mais de uma** funcionalidade (Q9 da #220: um documento de trabalho que cobre várias é quebrado em partes, uma por funcionalidade).

1. `jarvis docs fetch {SQUAD}/index.md` e liste as funcionalidades existentes do produto (`WORKSPACE`).
2. Para cada funcionalidade que o diff, o `architecture.md` ou os documentos de trabalho tocarem, sugira pelo PRD/FRD de origem, pelo título do `architecture.md` e pelos arquivos do diff, e um slug novo bem nomeado (kebab-case, pelo nome que o negócio usa).
3. Pergunte com `AskUserQuestion`, uma vez por funcionalidade identificada:
   - "Atualizar `{slug}`" (sugerida, se já existir);
   - "Criar `{slug sugerido}`";
   - Outro (digitar);
   - **Esta entrega não toca em mais nenhuma funcionalidade** (só na primeira pergunta em diante, para encerrar a lista).

   Se o slug veio como argumento, confirme com a mesma pergunta antes das demais.
4. Na atualização, `jarvis docs fetch {SQUAD}/{produto}/{slug}/{slug}.md` é o ponto de partida.
5. **Conteúdo transversal:** se algo do que foi coletado não pertence a nenhuma funcionalidade específica (decisão de arquitetura geral, visão do produto), ele vai para a página do produto (`{produto}.md`) no Passo 5 — não se perde, nem se repete em cada funcionalidade.

## Passo 4: Listagem — o que é publicado e o que fica (Q1, Q10, Q11, Q23 e #229)

Antes de escrever qualquer arquivo, monte a lista de candidatos e mostre ao usuário. Ela cobre os documentos de trabalho lidos no Passo 1/2 e **todos os arquivos da sessão** (Passo 1, itens 6 e 7).

Para cada candidato, determine:

1. **Vínculo com esta entrega** (Q10), na ordem:
   - **Pela chave:** os arquivos da própria sessão (`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`) — vínculo automático.
   - **Por `related_*`:** o documento de trabalho tem `related_prd`/`related_frd`/`related_epic`/`related_discovery` apontando para algo já ligado à entrega.
   - **Sem vínculo automático:** pergunte se você quer ligar aquele documento a esta entrega. Se sim, **grave o `related_*`** nele (é a única escrita fora de `consolidation/` que este comando faz, e só com a sua indicação) e ele entra na lista; se não, ele **fica** em `$JARVIS_DOCS`, sem ser tocado.
2. **Com vínculo, confira o `status`** (Q11) — **só para documentos de `$JARVIS_DOCS`**; os arquivos da sessão não têm `status`: só é elegível para publicar com `status` em `in_production`, `cancelled` ou `deprecated`. Em qualquer outro `status` (ex.: `in_progress`, `backlog`), ofereça: **"Marcar `{documento}` como `in_production` e publicar?"** (Q23) — um Sim por item da lista, nunca em lote. Sem o Sim, o documento **fica** onde está, mesmo tendo vínculo.
3. **Destino** de cada arquivo da sessão:

   | Arquivo da sessão | Destino no Central docs | Tipo |
   |---|---|---|
   | `architecture.md` | `{funcionalidade}/decisions/architecture-{card}.md` | `architecture` |
   | `plan.md` | `{funcionalidade}/decisions/plan-{card}.md` | `plan` |
   | `light-arch.md` | `{funcionalidade}/decisions/light-arch-{card}.md` | `light-arch` |
   | os demais, inclusive subpastas e arquivos que não são `.md` | `history/{card}/{caminho relativo}` | `history` (com `relPath`) |
   | a página-índice (gerada no Passo 5) | `history/{card}/{card}.md` | `history` |

   O nome em `decisions/` leva o **card** (o CLI monta; você não precisa nomear): assim cards diferentes da mesma funcionalidade não colidem. Um documento quebrado em partes vira `architecture-{card}-{funcionalidade}.md`. A **funcionalidade principal** (`feature` do manifesto) é a da entrega (a primeira do Passo 3).
4. **Quebra por funcionalidade (Q9 e Q1 da #229):** `architecture.md`, `plan.md` e `light-arch.md` que cobrirem mais de uma das funcionalidades do Passo 3 são marcados para ser **quebrados em partes** no Passo 5 (uma por funcionalidade, cabeçalho comum com a issue e o PR/MR — ver "Regra de separação por funcionalidade" em `skills/jarvis-docs-central/SKILL.md`), e **o mapa "trecho → funcionalidade" aparece nesta listagem**, antes do Sim. O documento inteiro também vai para `archive/` (Passo 8). Documento de uma funcionalidade só não é quebrado.
5. **Versão (Q6 da #229):** rode `jarvis docs publish --manifest …/manifest.json --dry-run` (só simula, não grava) e mostre ao lado de cada arquivo o que vai acontecer: **novo**, **igual** (já publicado com o mesmo conteúdo: nada a fazer), **nova versão** (`-v1`, `-v2`…; o conteúdo mudou depois da última publicação e a versão anterior permanece, sem mesclar) ou **sobrescreve** (`feature-*`, `delivery-*`, `product`, que são "estado atual").
6. **Casos duvidosos (Q4 e Q15 da #229):** o comando **pergunta** (`AskUserQuestion`: publicar, deixar na sessão ou escolher os arquivos) em vez de decidir por você sobre:
   - **qualquer arquivo que não seja `.md`** (`.txt`, `.json`, `.sh`, `.mjs`, `.estado`, `.md5`, `.sha`…): uma pergunta **por grupo** (mesma pasta e mesma extensão), com a lista dos arquivos e os tamanhos;
   - **binário** (o arquivo contém byte nulo), **acima de 1 MB** e **`.md` com possível segredo** (`api_key`, `token`, `secret`, `password` ou `senha` seguidos de um valor longo, com ou sem prefixo como `GITHUB_TOKEN=`; chave privada PEM; credencial dentro de uma URL; `Bearer …`; tokens de prefixo conhecido como `ghp_`, `glpat-`, `AKIA…` e `sk-`; pode ser só um placeholder): uma pergunta **por arquivo**, mostrando a linha (sem o valor).
   O que você aprovar ganha `"confirmed": true` no manifesto (Passo 5); o CLI **não publica** o arquivo sinalizado sem essa marca, e o `--dry-run` lista os que ainda precisam dela. O que você mandar deixar na sessão **fica** lá, sai do manifesto, e a pasta da sessão não será apagada por completo (Passo 9.1).

Mostre a lista final, uma linha por item: `{arquivo} — {origem do vínculo} — {destino} — {novo | igual | nova versão | sobrescreve} | fica (motivo)`. Só prossiga para o Passo 5 depois de o usuário conferir essa lista (ela não precisa de uma pergunta própria se não houve nenhum item incerto nos passos 1–2 acima; senão, aguarde as respostas pendentes).

## Passo 5: Escrever na sessão

O agente gera em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/consolidation/` (no `--inicial`, em `$SESSIONS_DIR/eng/inicial-{AAAA-MM-DD}/consolidation/`):
- **`feature-{slug}.md`**, por funcionalidade do Passo 3: as 12 seções do template, com o estado atual e a linha nova no Histórico de entregas, que linka o `delivery-*` e (na seção 4) os documentos de `decisions/`;
- **`delivery-{AAAA-MM-DD}-{task_key}[-{slug}].md`**, por funcionalidade (o sufixo `-{slug}` só quando a entrega tocar mais de uma): as 7 seções (não existe no `--inicial`); a seção 7 (Referências) linka a página-índice da sessão e os documentos de `decisions/`;
- **`product-{produto}.md`**, só se o Passo 3.5 identificou conteúdo transversal, no template `central-product-template.md`;
- **`session-{card}.md`**, a **página-índice da sessão**, no template `$IDE/templates/engineering/central-session-template.md`: resumo do que foi feito, funcionalidades tocadas (links), tabela de artefatos (arquivo, tipo, onde está, versão, fonte), anexos que não são Markdown e **artefatos ausentes com as fontes consultadas**. Só fontes reais; o que faltou vira "não informado" e entra em `absent` no frontmatter. Os links dela são **relativos ao Central docs** (`../../{slug}/…`), nunca ao workspace;
- **as partes** dos documentos quebrados (Q1): uma por funcionalidade, cada uma só com o que é dela, com o cabeçalho comum e o campo `sibling_parts`, nunca inventando nem perdendo conteúdo. **Documento inteiro e arquivos de `history/` não são copiados para cá:** o manifesto aponta direto para o arquivo da sessão (campo `file` com o caminho relativo a partir de `consolidation/`, como `../architecture.md`);
- **`manifest.json`**: a lista de tudo o que será publicado. Campos de cada entrada: `file` (arquivo, relativo a `consolidation/`), `tipo`, `feature`, `taskKey`, `relPath` (só `history`: caminho sob `history/{card}/`, preservando subpastas), `fromSession: true` (marca o arquivo vindo da sessão: o CLI versiona por hash, **converte os links** do `.md` para o Central docs e libera a remoção só dentro da pasta do card), `confirmed: true` (**só** nos arquivos que você aprovou no Passo 4 item 6: o CLI recusa publicar um arquivo de sessão que não seja `.md`, seja binário, passe de 1 MB ou tenha possível segredo sem essa marca; o `--dry-run` mostra "PRECISA DE CONFIRMAÇÃO" em cada um) e `originalPath` (o arquivo na sessão, caminho absoluto; é o que o `--archive`/`--finalize` vão arquivar e apagar, e a base para resolver os links). Exemplo:

```json
[
  {"file": "../architecture.md", "tipo": "architecture", "feature": "checkout", "taskKey": "229", "fromSession": true, "originalPath": "/ws/.jarvis/sessions/eng/229/architecture.md"},
  {"file": "../ferramentas/saidas/E8.txt", "tipo": "history", "feature": "checkout", "taskKey": "229", "relPath": "ferramentas/saidas/E8.txt", "fromSession": true, "confirmed": true, "originalPath": "/ws/.jarvis/sessions/eng/229/ferramentas/saidas/E8.txt"},
  {"file": "session-229.md", "tipo": "history", "feature": "checkout", "taskKey": "229", "relPath": "229.md", "fromSession": true},
  {"file": "feature-checkout.md", "tipo": "feature", "feature": "checkout"},
  {"file": "delivery-2026-11-06-229.md", "tipo": "delivery", "feature": "checkout", "taskKey": "229"}
]
```

A página-índice **não tem `originalPath`** (é gerada, não existe na sessão) e `feature-*`/`delivery-*` também não. Para documentos de `$JARVIS_DOCS` (PRD, FRD, ARD…), o manifesto continua como na #220 (`originalPath` do documento, sem `fromSession`).

O frontmatter segue o template, com os comentários `#`. `product` = `WORKSPACE` (ou o produto confirmado).

## Passo 6: Revisão

Mostre o resumo de cada arquivo (seções, tamanho, referências) e o caminho deles, para você abrir e ler o texto completo antes de aprovar. Pergunte com `AskUserQuestion`:
- `[Aprovar]`
- `[Ajustar]`: diga o que mudar; o agente ajusta e você revisa de novo.

Confira antes de aprovar:
- [ ] card e PR/MR com URL;
- [ ] commits com autor (sem e-mail);
- [ ] nenhum segredo, e-mail nem valor de variável — inclusive no que vier de `gate-checklist.md`/`task-comment-*.md`;
- [ ] nenhuma frase depende de um documento de origem;
- [ ] se houve quebra (Q9), cada parte tem o cabeçalho comum (issue, PR/MR, partes irmãs) e nada ficou de fora;
- [ ] a página-índice da sessão só tem links relativos ao Central docs (`../../{slug}/…`), lista os artefatos ausentes e as fontes, e cada afirmação tem fonte (o que faltou está como "não informado");
- [ ] o `--dry-run` do Passo 4 não mostra link que aponte para fora do Central docs (o CLI avisa dos que não resolvem).

## Passo 7: Publicar

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Publicar no Central docs?"** (regra de ouro, `eng.integrations-rules.md`; a pergunta cobre todos os arquivos do `manifest.json` que o Passo 6 já mostrou e você aprovou)

- **Sim:**
  ```bash
  jarvis docs publish --manifest .../consolidation/manifest.json --slug {task_key}
  ```
  Uma chamada só, para todos os arquivos. Com o Central docs num repositório git, publica numa **única branch e um único PR** para a entrega inteira (não um por arquivo): informe a URL. O CLI converte os links dos `.md` da sessão para resolverem dentro do Central docs (o original na sessão não muda), grava no manifesto o destino de cada arquivo (`publishedAs`, que pode ser um `-v1`/`-v2` se o conteúdo mudou desde a última publicação) e o hash publicado (`publishedHash`), e **avisa** dos links que ainda não resolvem. Mostre ao usuário o relatório: quantos links foram convertidos e quantos viraram texto, as novas versões e os avisos.
- **Não:** os arquivos ficam na sessão. Para publicar depois, use o mesmo comando.

Com `ARTIFACT_STYLE=human-generated`, a versão humanizada (`{nome}.public.md`) fica ao lado da consolidação, na sessão, e **não** entra no manifesto.

Os originais em `$JARVIS_DOCS` e na sessão (inclusive os que acabaram de ser publicados aqui) **continuam onde estão** depois deste passo: só o Passo 9 os apaga.

Informe que o próximo passo, **arquivar**, pode ser feito agora ou mais tarde (nova chamada: `/eng.spec-consolidate {TASK_MANAGER_KEY} --archive`), e não é obrigatório — quem não quiser mover os originais da entrega para o Central docs pode parar aqui. Para poder **apagar a sessão** sem perder nada, são necessários os Passos 8 e 9.

## Passo 8: Arquivar (`--archive`)

São arquivadas todas as entradas do manifesto com `originalPath`: os documentos de trabalho de `$JARVIS_DOCS` marcados "publica" no Passo 4 **e os arquivos da sessão** (`decisions/` e `history/`). `feature`, `delivery`, `product` e `home`, e a página-índice da sessão, não têm "original" fora do Central docs e não passam por aqui.

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Arquivar os originais (sem apagar nada)?"**, mostrando a lista de `originalPath` que serão copiados.

- **Sim:**
  ```bash
  jarvis docs archive --manifest .../consolidation/manifest.json
  ```
  Copia cada original para `archive/` da sua funcionalidade e **reescreve o próprio `manifest.json`**, acrescentando `archiveDestPath` e `archivedHash` em cada entrada arquivada (o `--finalize` precisa dos dois). Os documentos de decisão da sessão vão para `{funcionalidade}/archive/{nome publicado}` e os arquivos de `history/` para `{funcionalidade}/archive/{card}/{caminho relativo}`. A cópia arquivada é o **original, byte a byte** (os links ainda são os da sessão). Sem `.git` no Central docs, o comando avisa que `archive/` é a única cópia além do próprio original (Q14). **Com `.git`**, o arquivamento vai para o seu próprio PR (separado do PR do Passo 7) — espere esse PR ser aceito antes do Passo 9: até lá, a cópia local não vê a pasta `archive/` e o `--finalize` recusa por não achá-la.
- **Não:** nada muda; os originais continuam onde estão.

## Passo 9: Finalizar (`--finalize`)

**Irreversível.** Exige que o Passo 8 já tenha rodado (o manifesto precisa ter `archiveDestPath` em toda entrada com `originalPath`); sem isso, o comando recusa e diz o que falta.

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Apagar os originais já arquivados? Esta ação não pode ser desfeita."**, mostrando a lista.

- **Sim:**
  ```bash
  jarvis docs finalize --manifest .../consolidation/manifest.json
  ```
  Para cada original: confere se o conteúdo mudou desde o `--archive` (hash); se mudou, **avisa e não apaga** aquele item (Q13) — ele continua onde estava e em `archive/`, e você decide depois (rodar `--archive` de novo para atualizar o hash, ou apagar à mão). Se não mudou, reescreve os `related_*` de outros documentos de trabalho que apontavam para ele (best effort: o que não resolver, relate; arquivos da sessão não têm `related_*`) e **apaga o original**. A trava recusa qualquer caminho fora das pastas de documentos de trabalho e, para os arquivos da sessão, fora da pasta `$SESSIONS_DIR/eng/{card}/` **do próprio card** (um caminho com `..` ou da sessão de outro card é recusado e relatado).
- **Não:** nada muda.

### Passo 9.1: Apagar a pasta da sessão (oferta, com pergunta própria)

Só depois do Passo 9 (ou do `--force`) e só se **todas** as entradas da sessão foram finalizadas: nenhuma em "mudou desde o `--archive`" nem recusada pela trava, e nada ficou na sessão por escolha sua no Passo 4 (item 6). Caso contrário, **não ofereça**: diga o que impede e deixe a pasta como está.

Liste o que sobrou na pasta `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` (`ls -A`, que inclui `.timestamp_start`, `.lead_time_minutes` e `consolidation/` com o `manifest.json`: nada disso é publicado) e pergunte com `AskUserQuestion` (**Sim / Não**): **"Apagar a pasta da sessão {card}? Esta ação não pode ser desfeita; tudo o que importa está no Central docs."**

- **Sim:** apague a pasta (confirme antes que o caminho resolvido é exatamente `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}` dentro do workspace). Faça isso por último: o `manifest.json` de `consolidation/` precisa existir até aqui para o `--archive`/`--finalize` de execuções separadas.
- **Não:** a pasta fica; a pessoa remove à mão quando quiser.

## Passo 10: Mensagem final

```
✅ Consolidação {publicada | salva na sessão} {· arquivada} {· finalizada} {· sessão apagada}

📄 Sessão: página-índice {SQUAD}/{produto}/history/{TASK_MANAGER_KEY}/{TASK_MANAGER_KEY}.md; cópias em {SQUAD}/{produto}/{slug}/decisions/ (architecture-{card}.md, plan-{card}.md…) e em history/{TASK_MANAGER_KEY}/
📄 Arquivos da sessão (consolidado acumulado, regra 5 de `eng.transitions-rules.md`): links de `context.md`, `architecture.md`, `plan.md`, das rodadas anteriores `gate-checklist-rodada-{N}.md`, `gate-checklist.md`, `pull-request.md`, `daily.md` e dos arquivos de `consolidation/` (novos), só os que ainda existem (depois do Passo 9.1, nenhum)

📄 Funcionalidade(s): {SQUAD}/{produto}/{slug}/{slug}.md (uma linha por funcionalidade)
🧾 Entrega(s):        {SQUAD}/{produto}/{slug}/deliveries/delivery-{AAAA-MM-DD}-{task_key}[-{slug}].md
🔗 PR/MR: {URL} · Card: {URL ou número}
🔗 Links: {N} convertido(s), {M} viraram texto, {K} aviso(s) de link que não resolve
🆕 Versões: {lista dos arquivos que ganharam -v1, -v2…, ou "nenhuma"}

{se publicou sem --archive/--finalize:} ℹ️ Os originais continuam onde estão. Para arquivar: `/eng.spec-consolidate {TASK_MANAGER_KEY} --archive`
{se arquivou sem --finalize:} ℹ️ Os originais estão arquivados em archive/, mas ainda não foram apagados. Para finalizar: `/eng.spec-consolidate {TASK_MANAGER_KEY} --finalize`
{se houve documento que mudou no --finalize:} ⚠️ {N} documento(s) mudaram desde o --archive e não foram apagados: {lista}
{se a pasta da sessão foi apagada:} 🧹 A sessão $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ foi apagada com o seu Sim; tudo está no Central docs.
{se não:} 🧹 A sessão $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ continua no disco ({motivo: ainda não finalizada | você escolheu manter | há arquivo pendente}).
{nos modos --sessao/--proxima:} ➡️ Faltam {N} sessão(ões) pendente(s). Quando quiser continuar: `/eng.spec-consolidate --proxima`
```

---

## Regras

### ⛔ Nunca
- Publicar sem o **Sim** do Passo 7, arquivar sem o do Passo 8, finalizar sem o do Passo 9, ou apagar a pasta da sessão sem o do Passo 9.1 — cada passo tem a sua pergunta, nunca uma cobre a seguinte
- Publicar um documento de trabalho **sem vínculo** com esta entrega (Q1) — sem o vínculo (chave, `related_*` ou a sua indicação no Passo 4), ele fica em `$JARVIS_DOCS`, sem exceção
- Quebrar (Q9) um documento de uma funcionalidade só, ou perder/inventar conteúdo ao separar as partes de um documento quebrado
- Finalizar (apagar o original) sem ter arquivado antes, ou apagar um original cujo conteúdo mudou desde o `--archive` (Q13)
- Incluir e-mails, tokens, senhas, valores de variáveis ou dados pessoais de clientes
- Inventar informação: sem fonte, pergunte ou registre "não informado"
- Alterar o código ou os documentos de trabalho, fora da gravação de `related_*` do Passo 4 (com a sua indicação), da reescrita de `related_*` do Passo 9 e dos arquivos em `consolidation/`
- Apagar um arquivo de sessão fora da pasta do card, ou apagar a pasta da sessão com arquivo recusado, pendente ou deixado na sessão por escolha sua
- Escrever, na página-índice ou nos registros, algo que não tenha fonte: sessão incompleta é documentada com o que existe e o que falta vira "não informado"

### ✅ Sempre
- Ler todas as fontes antes de escrever
- Mostrar a listagem do Passo 4 antes de escrever qualquer arquivo
- Citar o card e o PR/MR com URL (ou o número de controle no freelance)
- Descrever o implementado, não o pretendido
- Avisar, no `--archive` sem `.git` no Central docs, que não há segunda cópia além do próprio arquivo (Q14)
- Português do Brasil
