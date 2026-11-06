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

Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC, discovery…) continuam em `docs/jarvis/`. Um documento **ligado a uma entrega consolidada** (chave da sessão, `related_*`, ou indicação sua) é **também publicado** em `decisions/`, na pasta da funcionalidade — o Central docs passa a ser, além do registro do implementado, o registro técnico oficial (#220). O que não está ligado **não é tocado**.

> ⚠️ **Três execuções separadas** (Q3/Q15 da #220), cada uma com o seu Sim: publicar (copia; os originais continuam onde estão), `--archive` (guarda os originais em `archive/`, ainda sem apagar nada) e `--finalize` (apaga os originais de `docs/jarvis/`, só os que não mudaram desde o `--archive`; irreversível). Rodar só `/eng.spec-consolidate {chave}` cobre o primeiro Sim; os outros dois são chamadas separadas, de propósito.

> 🤖 **Modelo**: se a IDE informar o modelo desta sessão e ele for de outra família que o `recommended_model` do documento (ou do template, se for novo), avise em uma linha e siga, sem bloquear e sem repetir. Sem essa informação, não avise.
> 📤 **Templates**: `$IDE/templates/engineering/central-feature-template.md`, `central-delivery-template.md` e `central-product-template.md`
>
> 🔗 **Links**: antes de escrever a consolidação, leia `$IDE/rules-on-demand/doc-links-rules.md` e siga-a: toda citação com lugar exato (requisito, documento, código, card, PR) vira link. O Central docs pode ser lido fora do workspace: siga a regra 6 (URL absoluta, com o sha do merge; sessão e `docs/jarvis/` em texto).

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.docs-consolidator.agent` (agente) | Sempre: escreve a consolidação na sessão |
| Passo 3 (funcionalidades) e Passo 7 (publicação) | `/jarvis-docs-central` (via `jarvis docs fetch` / `jarvis docs publish --manifest`) | Sempre: lê o índice e o documento atual e publica depois do Sim |
| Passo 8 (`--archive`) e Passo 9 (`--finalize`) | `/jarvis-docs-central` (via `jarvis docs archive` / `jarvis docs finalize`) | Só quando chamado com `--archive` ou `--finalize`, depois do Sim de cada passo |

---

## Entrada

<arguments>
#$ARGUMENTS
</arguments>

- `{TASK_MANAGER_KEY}` (obrigatório no modo normal): a mesma chave do `eng.start`/`eng.pr`. Sem ela, pergunte e aguarde (`eng.integrations-rules.md`; no modo freelance, o número de controle).
- `{slug}` (opcional): slug de uma funcionalidade, se você já souber qual atualizar. Com mais de uma funcionalidade tocada, o Passo 3 pergunta pelas demais.
- `--inicial`: carga inicial a partir dos documentos de trabalho que já existem (chamado pelo `/jarvis-init`). Não precisa de chave nem de PR.
- `--archive`: pula os Passos 1–7 (a consolidação já foi publicada numa execução anterior) e vai direto ao Passo 8, com o `manifest.json` já gravado em `consolidation/` nesta sessão.
- `--finalize`: pula os Passos 1–8 e vai direto ao Passo 9, com o mesmo `manifest.json` já arquivado (`--archive` antes).
- `--force`: faz os Passos 1–7 e 9 numa execução só, **sem perguntar** e **sem o Passo 8** (zero reversão, Q15 da #220) — a própria flag vale como o Sim dos passos (exceção explícita à regra de ouro, `eng.integrations-rules.md`). Decide a listagem (Passo 4), a quebra (Q9) e o `status` (Q23) por conta própria, mas **sem pular** a trava de segredo da revisão (Passo 6): se algo parecer um segredo, para antes de publicar, mesmo com `--force`. Documento sem vínculo com a entrega continua intocado. Ao fim, `jarvis docs publish --manifest ... --force` publica e já apaga os originais (sem `archive/`); mostre o relatório do que foi feito, do que ficou e por quê.

---

## Passo 0: Pré-condições

1. **Central docs ligado:** `CENTRAL_DOCS_STORAGE` preenchido no `$IDE/ENV.md`. Se estiver vazio, pare: "O Central docs está desligado. Ligue-o no `/jarvis-init` (Passo 5.2) para registrar o que foi implementado."
2. **Modo normal:** a sessão `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` existe com o `architecture.md`. Sem ela, avise que a consolidação perde as decisões e pergunte se segue só com o diff e os documentos de trabalho.
3. **Branch base:** o `Branch base:` do `architecture.md`. Sem ele, pergunte com `AskUserQuestion` (`main`, `dev` ou Outro).

## Passo 1: Coleta (modo normal)

O agente `eng.docs-consolidator.agent` lê **todas** as fontes, na ordem do agente:
1. `architecture.md` e `plan.md` da sessão.
2. Documentos de trabalho ligados à tarefa em `$PROD_DOCS` e `$ENG_DOCS` (PRD, FRD, épicos, histórias, ARD, RFC, SPEC, swagger, QA, discovery).
3. Commits e arquivos:
   ```bash
   git log {base}..HEAD --format='%h|%an|%ad|%s' --date=short
   git diff --stat {base}...HEAD
   ```
4. **PR/MR:** número e URL (`pull-request.md` da sessão, `gh pr view`/equivalente do vendor, ou pergunte).
5. **Card:** URL no padrão do `TASK_MANAGER` (`eng.integrations-rules.md`); no modo freelance, só o número de controle.
6. `gate-checklist.md` (a rodada mais recente do `eng.pre-pr`; as anteriores, `gate-checklist-rodada-{N}.md`, são histórico), `pull-request.md`, `daily.md` e os `task-comment-*.md` da sessão, se existirem — são candidatos a `history/` no Passo 4.

## Passo 2: Coleta (modo `--inicial`)

1. Liste os PRD, FRD, ARD, RFC e SPEC em `$PROD_DOCS` e `$ENG_DOCS/{ARD,RFC,SPEC}` (e nos caminhos antigos, se o `/jarvis-init` não os moveu).
2. Sugira o agrupamento por funcionalidade (um PRD/FRD e os ARD/RFC/SPEC ligados a ele) e confirme com `AskUserQuestion` (aceitar / ajustar).
3. Para cada grupo, o agente lê os documentos e o código relacionado (só leitura), para descrever o que **está implementado**. O que estiver só especificado vai para "Fora do escopo", e o status reflete isso.

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

## Passo 4: Listagem — o que é publicado e o que fica (Q1, Q10, Q11, Q23)

Antes de escrever qualquer arquivo, monte a lista de candidatos e mostre ao usuário. Ela cobre os documentos de trabalho lidos no Passo 1/2 e os artefatos da sessão (`gate-checklist*.md`, `task-comment-*.md`, `daily.md`, `pull-request.md`).

Para cada candidato, determine:

1. **Vínculo com esta entrega** (Q10), na ordem:
   - **Pela chave:** artefatos da própria sessão (`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`) — vínculo automático.
   - **Por `related_*`:** o documento de trabalho tem `related_prd`/`related_frd`/`related_epic`/`related_discovery` apontando para algo já ligado à entrega.
   - **Sem vínculo automático:** pergunte se você quer ligar aquele documento a esta entrega. Se sim, **grave o `related_*`** nele (é a única escrita fora de `consolidation/` que este comando faz, e só com a sua indicação) e ele entra na lista; se não, ele **fica** em `docs/jarvis/`, sem ser tocado.
2. **Com vínculo, confira o `status`** (Q11): só é elegível para publicar com `status` em `in_production`, `cancelled` ou `deprecated`. Em qualquer outro `status` (ex.: `in_progress`, `backlog`), ofereça: **"Marcar `{documento}` como `in_production` e publicar?"** (Q23) — um Sim por item da lista, nunca em lote. Sem o Sim, o documento **fica** onde está, mesmo tendo vínculo.
3. **Quebra por funcionalidade (Q9):** um documento ligado e elegível que cobrir mais de uma das funcionalidades do Passo 3 é marcado para ser **quebrado em partes** no Passo 5 (uma por funcionalidade, cabeçalho comum com a issue e o PR/MR — ver "Regra de separação por funcionalidade" em `skills/jarvis-docs-central/SKILL.md`). Documento de uma funcionalidade só não é quebrado.

Mostre a lista final, uma linha por item: `{documento} — {origem do vínculo} — {status} — publica em {destino} | fica (motivo)`. Só prossiga para o Passo 5 depois de o usuário conferir essa lista (ela não precisa de uma pergunta própria se não houve nenhum item incerto nos passos 1–2 acima; senão, aguarde as respostas pendentes).

## Passo 5: Escrever na sessão

O agente gera em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/consolidation/` (no `--inicial`, em `$SESSIONS_DIR/eng/inicial-{AAAA-MM-DD}/consolidation/`):
- **`feature-{slug}.md`**, por funcionalidade do Passo 3: as 12 seções do template, com o estado atual e a linha nova no Histórico de entregas;
- **`delivery-{AAAA-MM-DD}-{task_key}[-{slug}].md`**, por funcionalidade (o sufixo `-{slug}` só quando a entrega tocar mais de uma): as 7 seções (não existe no `--inicial`);
- **`product-{produto}.md`**, só se o Passo 3.5 identificou conteúdo transversal, no template `central-product-template.md`;
- **as cópias e as partes** dos documentos marcados "publica" no Passo 4: cópia literal (documento de uma funcionalidade só) ou uma parte por funcionalidade, nomeada `{tipo}-{slug}.md` (documento quebrado, Q9) — nunca inventando nem perdendo conteúdo;
- **`manifest.json`**: a lista de tudo o que será publicado, no formato `[{"file": "{nome na pasta consolidation/}", "tipo": "...", "feature": "{slug}" (quando a fizer falta), "taskKey": "{chave}" (só para `history`), "originalPath": "{caminho absoluto em docs/jarvis/}" (só para um documento de trabalho marcado "publica" no Passo 4 — é o que o `--archive`/`--finalize` vão arquivar e, depois, apagar)}, …]`.

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
- [ ] se houve quebra (Q9), cada parte tem o cabeçalho comum (issue, PR/MR, partes irmãs) e nada ficou de fora.

## Passo 7: Publicar

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Publicar no Central docs?"** (regra de ouro, `eng.integrations-rules.md`; a pergunta cobre todos os arquivos do `manifest.json` que o Passo 6 já mostrou e você aprovou)

- **Sim:**
  ```bash
  jarvis docs publish --manifest .../consolidation/manifest.json --slug {task_key}
  ```
  Uma chamada só, para todos os arquivos. Com o Central docs num repositório git, publica numa **única branch e um único PR** para a entrega inteira (não um por arquivo): informe a URL.
- **Não:** os arquivos ficam na sessão. Para publicar depois, use o mesmo comando.

Com `ARTIFACT_STYLE=human-generated`, a versão humanizada (`{nome}.public.md`) fica ao lado da consolidação, na sessão, e **não** entra no manifesto.

Os originais em `docs/jarvis/` e na sessão (inclusive os que acabaram de ser publicados aqui) **continuam onde estão** depois deste passo: só o Passo 9 os apaga.

Informe que o próximo passo, **arquivar**, pode ser feito agora ou mais tarde (nova chamada: `/eng.spec-consolidate {TASK_MANAGER_KEY} --archive`), e não é obrigatório — quem não quiser mover os originais da entrega para o Central docs pode parar aqui.

## Passo 8: Arquivar (`--archive`)

Só os documentos de trabalho marcados "publica" no Passo 4 (os que têm `originalPath` no manifesto) são arquivados; `feature`, `delivery`, `product`, `home` e `history` não têm "original" fora do Central docs e não passam por aqui.

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Arquivar os originais (sem apagar nada)?"**, mostrando a lista de `originalPath` que serão copiados.

- **Sim:**
  ```bash
  jarvis docs archive --manifest .../consolidation/manifest.json
  ```
  Copia cada original para `archive/` da sua funcionalidade e **reescreve o próprio `manifest.json`**, acrescentando `archiveDestPath` e `archivedHash` em cada entrada arquivada (o `--finalize` precisa dos dois). Sem `.git` no Central docs, o comando avisa que `archive/` é a única cópia além do próprio original (Q14). **Com `.git`**, o arquivamento vai para o seu próprio PR (separado do PR do Passo 7) — espere esse PR ser aceito antes do Passo 9: até lá, a cópia local não vê a pasta `archive/` e o `--finalize` recusa por não achá-la.
- **Não:** nada muda; os originais continuam só em `docs/jarvis/`.

## Passo 9: Finalizar (`--finalize`)

**Irreversível.** Exige que o Passo 8 já tenha rodado (o manifesto precisa ter `archiveDestPath` em toda entrada com `originalPath`); sem isso, o comando recusa e diz o que falta.

Pergunte com `AskUserQuestion` (**Sim / Não**): **"Apagar os originais já arquivados? Esta ação não pode ser desfeita."**, mostrando a lista.

- **Sim:**
  ```bash
  jarvis docs finalize --manifest .../consolidation/manifest.json
  ```
  Para cada original: confere se o conteúdo mudou desde o `--archive` (hash); se mudou, **avisa e não apaga** aquele item (Q13) — ele continua em `docs/jarvis/` e em `archive/`, e você decide depois (rodar `--archive` de novo para atualizar o hash, ou apagar à mão). Se não mudou, reescreve os `related_*` de outros documentos de trabalho que apontavam para ele (best effort: o que não resolver, relate) e **apaga o original**.
- **Não:** nada muda.

## Passo 10: Mensagem final

```
✅ Consolidação {publicada | salva na sessão} {· arquivada} {· finalizada}

📄 Arquivos da sessão (consolidado acumulado, regra 5 de `eng.transitions-rules.md`): links de `context.md`, `architecture.md`, `plan.md`, das rodadas anteriores `gate-checklist-rodada-{N}.md`, `gate-checklist.md`, `pull-request.md`, `daily.md` e dos arquivos de `consolidation/` (novos), só os que existem

📄 Funcionalidade(s): {SQUAD}/{produto}/{slug}/{slug}.md (uma linha por funcionalidade)
🧾 Entrega(s):        {SQUAD}/{produto}/{slug}/deliveries/delivery-{AAAA-MM-DD}-{task_key}[-{slug}].md
🔗 PR/MR: {URL} · Card: {URL ou número}

{se publicou sem --archive/--finalize:} ℹ️ Os originais em docs/jarvis/ continuam lá. Para arquivar: `/eng.spec-consolidate {TASK_MANAGER_KEY} --archive`
{se arquivou sem --finalize:} ℹ️ Os originais estão arquivados em archive/, mas ainda não foram apagados. Para finalizar: `/eng.spec-consolidate {TASK_MANAGER_KEY} --finalize`
{se houve documento que mudou no --finalize:} ⚠️ {N} documento(s) mudaram desde o --archive e não foram apagados: {lista}
🧹 A sessão $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ não é apagada automaticamente: remova à mão quando quiser.
```

---

## Regras

### ⛔ Nunca
- Publicar sem o **Sim** do Passo 7, arquivar sem o do Passo 8, ou finalizar sem o do Passo 9 — cada passo tem a sua pergunta, nunca uma cobre a seguinte
- Publicar um documento de trabalho **sem vínculo** com esta entrega (Q1) — sem o vínculo (chave, `related_*` ou a sua indicação no Passo 4), ele fica em `docs/jarvis/`, sem exceção
- Quebrar (Q9) um documento de uma funcionalidade só, ou perder/inventar conteúdo ao separar as partes de um documento quebrado
- Finalizar (apagar o original) sem ter arquivado antes, ou apagar um original cujo conteúdo mudou desde o `--archive` (Q13)
- Incluir e-mails, tokens, senhas, valores de variáveis ou dados pessoais de clientes
- Inventar informação: sem fonte, pergunte ou registre "não informado"
- Alterar o código ou os documentos de trabalho, fora da gravação de `related_*` do Passo 4 (com a sua indicação), da reescrita de `related_*` do Passo 9 e dos arquivos em `consolidation/`

### ✅ Sempre
- Ler todas as fontes antes de escrever
- Mostrar a listagem do Passo 4 antes de escrever qualquer arquivo
- Citar o card e o PR/MR com URL (ou o número de controle no freelance)
- Descrever o implementado, não o pretendido
- Avisar, no `--archive` sem `.git` no Central docs, que não há segunda cópia além do próprio arquivo (Q14)
- Português do Brasil
