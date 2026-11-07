# `/eng.spec-consolidate` — registrar o que foi implementado

Workflow: `workflows/engineering/eng.spec-consolidate.md` · Agente: `agents/engineering/eng.docs-consolidator.agent.md`

## Em uma frase

Depois do merge do PR (o `/eng.pr` pergunta no fim e oferece chamá-lo), transforma tudo o que a entrega envolveu num registro completo para o **Central docs**, por funcionalidade: a página de cada funcionalidade tocada, o registro da entrega e, se houver, a página do produto. **Guarda também todos os arquivos da sessão**, com uma página-índice, para você poder apagar `$SESSIONS_DIR/eng/{card}/` sem perder nada.

## O que é

O Central docs registra o que foi implementado. Um documento de trabalho (PRD, FRD, ARD, RFC, SPEC, épico…) **ligado a esta entrega** é publicado junto, na pasta da funcionalidade (`decisions/`) — o que não está ligado continua em `$JARVIS_DOCS`, sem ser tocado. Este comando cruza as fontes com o que aconteceu de verdade:
- as decisões do `architecture.md` e as mudanças de direção do `plan.md`;
- o diff e os commits (quem fez o quê, quando);
- o PR/MR e o card;
- o vínculo de cada documento de trabalho com esta entrega (pela chave da sessão, por `related_*`, ou por indicação sua).

Com isso, escreve documentos **autossuficientes**: se os originais se perderem, o Central docs basta.

O Central docs é, portanto, um **snapshot de cada funcionalidade implementada, seguido das sessões e dos artefatos dela**: uma pessoa ou uma IA consulta sem abrir a sessão, e a estrutura (uma página por documento, pastas como páginas-pai, links relativos que resolvem dentro dele) migra para o Confluence. Uma sessão **incompleta** (por exemplo só com o `architecture.md`) também é documentada: o comando usa o que existir, marca o que faltou e nunca inventa.

| Documento | Onde fica no Central docs | O que tem |
|---|---|---|
| Funcionalidade | `{SQUAD}/{produto}/{funcionalidade}/{funcionalidade}.md` | Estado atual completo: comportamento, decisões, onde está no código, operação do dia a dia, o que mudou em relação ao especificado, limitações, histórico de entregas |
| Entrega | `{SQUAD}/{produto}/{funcionalidade}/deliveries/delivery-{data}-{card}.md` | O que o PR fez, decisões, commits com autor, arquivos, follow-ups, testes |
| Produto (se houver conteúdo transversal) | `{SQUAD}/{produto}/{produto}.md` | O que não é de uma funcionalidade só |
| Documento de trabalho ligado | `{SQUAD}/{produto}/{funcionalidade}/decisions/` | Cópia do original (ou, se cobrir mais de uma funcionalidade, uma parte por funcionalidade) |
| `architecture.md`, `plan.md` e `light-arch.md` da sessão | `{SQUAD}/{produto}/{funcionalidade}/decisions/` | O porquê das decisões; o nome leva o card (`architecture-{card}.md`); se a sessão mudou depois de publicada, a nova versão entra como `-v1`, `-v2`… e a anterior permanece |
| Demais arquivos da sessão (`context.md`, checklist, comentários, diário, scripts e saídas, subpastas) | `{SQUAD}/{produto}/history/{task_key}/` | Cópia de cada arquivo, com o caminho relativo preservado; o que não é Markdown vira anexo no Confluence |
| Página-índice da sessão | `{SQUAD}/{produto}/history/{task_key}/{task_key}.md` | O que a tarefa fez, as funcionalidades tocadas (com links), a tabela de artefatos e o que faltou, com as fontes |
| Página inicial do squad (automática, criada uma vez) | `{SQUAD}/home.md` | Ponto de entrada do squad no Central docs; o adaptador nunca sobrescreve depois de criada |

> ⚠️ Três execuções separadas, cada uma com o seu Sim: **publicar** (copia), **`--archive`** (guarda o original em `archive/`, sem apagar) e **`--finalize`** (apaga o original, só o que não mudou desde o `--archive`; irreversível).

## Quando usar

- Logo depois do [`/eng.pr`](./eng.pr.md), com a sessão da tarefa ainda presente
- `--inicial`: para montar o Central docs a partir dos documentos que já existem (o [`/jarvis-init`](../../skills/jarvis-init/SKILL.md) oferece na instalação e, no Upgrade, só quando documentos foram movidos para as pastas novas nesta atualização); no fim, avisa quantas sessões antigas ainda estão pendentes
- `--sessao {card}` e `--proxima`: para as **sessões antigas** que nunca foram consolidadas, **uma por vez, no seu ritmo** (ver abaixo)

## Quando **não** usar

- O Central docs está desligado (`CENTRAL_DOCS_STORAGE` vazio): ligue no `/jarvis-init`
- A entrega ainda não tem PR: rode o `/eng.pr` antes

## Como funciona

1. Confere o Central docs e a sessão.
2. Lê todas as fontes: `architecture.md`, `plan.md`, documentos de trabalho, `git log`/`diff` desde a branch base, PR/MR, card e **todos os arquivos da sessão** (`context.md`, `gate-checklist.md`, `task-comment-*.md`, `daily.md`, scripts, saídas e subpastas). Ficam de fora só os arquivos ocultos (`.timestamp_start`…), a pasta `consolidation/` e os `*.public.md`.
3. Identifica as funcionalidades tocadas (pode ser mais de uma) e pergunta qual atualizar ou criar, uma por vez.
4. Monta a **listagem**: para cada documento de trabalho e arquivo da sessão, mostra o vínculo com a entrega, o destino, o `status` e se ele será publicado, é **novo**, **igual** (já publicado, nada a fazer) ou uma **nova versão** (pela simulação `--dry-run` do `publish`), ou se vai continuar onde está. Um documento ligado a mais de uma funcionalidade é quebrado em partes, uma por funcionalidade, e o mapa "trecho → funcionalidade" aparece aí. **Pergunta antes de publicar** sobre arquivos que não são `.md` (por grupo de pasta e extensão), binários, arquivos acima de 1 MB e possível segredo.
5. Escreve os documentos na sessão (`consolidation/`), inclusive a página-índice da sessão e um manifesto (`manifest.json`) com tudo que será publicado.
6. Mostra para revisão: `[Aprovar]` ou `[Ajustar]`.
7. Pergunta **Sim / Não** para publicar (`jarvis docs publish --manifest consolidation/manifest.json`) — uma chamada só, para todos os arquivos. O CLI converte os links dos `.md` da sessão para resolverem dentro do Central docs (o original não muda) e avisa dos que ainda não resolvem.
8. (`--archive`, outra chamada) Pergunta **Sim / Não** para arquivar: copia cada original publicado (documentos de trabalho e arquivos da sessão) para `archive/`, sem apagar nada, e grava no manifesto o hash de cada um.
9. (`--finalize`, outra chamada) Pergunta **Sim / Não** para finalizar: confere o hash de cada original contra o do `--archive` — se mudou, não apaga e avisa; se não mudou, reescreve as referências (`related_*`) de outros documentos e apaga o original. Para os arquivos da sessão, só apaga dentro da pasta da sessão **do próprio card**.
10. Se tudo da sessão foi finalizado, **oferece apagar a pasta da sessão** (pergunta própria, **Sim / Não**), mostrando o que sobrou (`.timestamp_start`, `consolidation/`…).

## Sessões antigas, uma por vez

Quem já tem dezenas de pastas em `$SESSIONS_DIR/eng/` não precisa fazer tudo de uma vez nem às pressas:

- `jarvis docs sessions` lista as sessões, os arquivos de cada uma, o que falta e quais ainda estão **pendentes** (sem a página-índice no Central docs). `--proxima` imprime só o card da próxima.
- `/eng.spec-consolidate --proxima` (ou `--sessao {card}`) trata **uma** sessão, do começo ao fim, com os mesmos Sim de sempre, e diz quantas faltam. Pode parar quando quiser; a execução seguinte continua da próxima pendente. O ponto onde você parou é o próprio Central docs (a página-índice publicada), sem arquivo de controle.
- **Sessão sem entrega:** o comando consulta a issue e o PR no GitHub (só leitura) e documenta com o que existir: arquivos da sessão, issue, PR e commits. Sem PR, escreve "PR não localizado"; sem issue e sem PR, documenta só com os arquivos, marcando a ausência; nunca inventa.
- **Sessão que já tem entrega no Central docs:** publica só os arquivos e a página-índice, sem regerar a página da funcionalidade nem o registro da entrega.
- **Épico:** cards do mesmo épico entram no mesmo registro da funcionalidade (com o `task_key` do épico e uma tabela de cards e PRs), que cresce a cada sessão processada.

## Regras que importam

- Nada é publicado, arquivado ou finalizado sem o **Sim** daquele passo — cada um tem a pergunta dele
- Um documento de trabalho só é publicado se estiver **ligado** a esta entrega; sem vínculo, continua em `$JARVIS_DOCS`
- Documento de uma funcionalidade só nunca é quebrado em partes
- Finalizar sem ter arquivado antes é recusado; documento que mudou desde o `--archive` nunca é apagado
- Sem e-mails, tokens ou valores de variáveis
- Com `.git` no Central docs, cada chamada (`publish`, `--archive`) vira **o seu próprio branch e PR** — a entrega inteira dentro de uma chamada é uma branch e um PR só (não um por arquivo), mas `publish` e `--archive` não compartilham o mesmo PR entre si
- Sem `.git`, o `archive/` é a única cópia do original além dele mesmo
- A pasta da sessão só é apagada com o seu **Sim** (passo 10), depois de tudo finalizado, e nunca se algum arquivo ficou pendente ou foi recusado
- Com `--force`, os arquivos da sessão também são apagados, mas só depois de conferir que a cópia publicada existe e bate o hash
- **Links no Central docs:** o Central docs pode ser lido fora do workspace, então o código vira URL absoluta (`blob/{sha}` do commit base), e a sessão e o `$JARVIS_DOCS` ficam em texto (`rules-on-demand/doc-links-rules.md`, regra 6); um link para outro arquivo da mesma entrega vira link dentro do Central docs

## Próximo passo típico

Merge do PR. A próxima entrega da mesma funcionalidade atualiza a mesma página.
