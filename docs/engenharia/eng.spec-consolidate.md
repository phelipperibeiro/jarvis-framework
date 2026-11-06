# `/eng.spec-consolidate` — registrar o que foi implementado

Workflow: `workflows/engineering/eng.spec-consolidate.md` · Agente: `agents/engineering/eng.docs-consolidator.agent.md`

## Em uma frase

Depois do merge do PR (o `/eng.pr` pergunta no fim e oferece chamá-lo), transforma tudo o que a entrega envolveu num registro completo para o **Central docs**, por funcionalidade: a página de cada funcionalidade tocada, o registro da entrega e, se houver, a página do produto.

## O que é

O Central docs registra o que foi implementado. Um documento de trabalho (PRD, FRD, ARD, RFC, SPEC, épico…) **ligado a esta entrega** é publicado junto, na pasta da funcionalidade (`decisions/`) — o que não está ligado continua em `docs/jarvis/`, sem ser tocado. Este comando cruza as fontes com o que aconteceu de verdade:
- as decisões do `architecture.md` e as mudanças de direção do `plan.md`;
- o diff e os commits (quem fez o quê, quando);
- o PR/MR e o card;
- o vínculo de cada documento de trabalho com esta entrega (pela chave da sessão, por `related_*`, ou por indicação sua).

Com isso, escreve documentos **autossuficientes**: se os originais se perderem, o Central docs basta.

| Documento | Onde fica no Central docs | O que tem |
|---|---|---|
| Funcionalidade | `{SQUAD}/{produto}/{funcionalidade}/{funcionalidade}.md` | Estado atual completo: comportamento, decisões, onde está no código, operação do dia a dia, o que mudou em relação ao especificado, limitações, histórico de entregas |
| Entrega | `{SQUAD}/{produto}/{funcionalidade}/deliveries/delivery-{data}-{card}.md` | O que o PR fez, decisões, commits com autor, arquivos, follow-ups, testes |
| Produto (se houver conteúdo transversal) | `{SQUAD}/{produto}/{produto}.md` | O que não é de uma funcionalidade só |
| Documento de trabalho ligado | `{SQUAD}/{produto}/{funcionalidade}/decisions/` | Cópia do original (ou, se cobrir mais de uma funcionalidade, uma parte por funcionalidade) |
| Artefatos da sessão (checklist, comentários, diário) | `{SQUAD}/{produto}/history/{task_key}/` | Rodadas do `gate-checklist.md`, `task-comment-*.md`, `daily.md` |
| Página inicial do squad (automática, criada uma vez) | `{SQUAD}/home.md` | Ponto de entrada do squad no Central docs; o adaptador nunca sobrescreve depois de criada |

> ⚠️ Três execuções separadas, cada uma com o seu Sim: **publicar** (copia), **`--archive`** (guarda o original em `archive/`, sem apagar) e **`--finalize`** (apaga o original, só o que não mudou desde o `--archive`; irreversível).

## Quando usar

- Logo depois do [`/eng.pr`](./eng.pr.md), com a sessão da tarefa ainda presente
- `--inicial`: para montar o Central docs a partir dos documentos que já existem (o [`/jarvis-init`](../../skills/jarvis-init/SKILL.md) oferece)

## Quando **não** usar

- O Central docs está desligado (`CENTRAL_DOCS_STORAGE` vazio): ligue no `/jarvis-init`
- A entrega ainda não tem PR: rode o `/eng.pr` antes

## Como funciona

1. Confere o Central docs e a sessão.
2. Lê todas as fontes: `architecture.md`, `plan.md`, documentos de trabalho, `git log`/`diff` desde a branch base, PR/MR, card e os artefatos da sessão (`gate-checklist.md`, `task-comment-*.md`, `daily.md`).
3. Identifica as funcionalidades tocadas (pode ser mais de uma) e pergunta qual atualizar ou criar, uma por vez.
4. Monta a **listagem**: para cada documento de trabalho e artefato da sessão, mostra o vínculo com a entrega, o `status` e se ele será publicado ou vai continuar em `docs/jarvis/`. Um documento ligado a mais de uma funcionalidade é quebrado em partes, uma por funcionalidade.
5. Escreve os documentos na sessão (`consolidation/`), inclusive um manifesto (`manifest.json`) com tudo que será publicado.
6. Mostra para revisão: `[Aprovar]` ou `[Ajustar]`.
7. Pergunta **Sim / Não** para publicar (`jarvis docs publish --manifest consolidation/manifest.json`) — uma chamada só, para todos os arquivos.
8. (`--archive`, outra chamada) Pergunta **Sim / Não** para arquivar: copia cada documento de trabalho publicado para `archive/`, sem apagar nada, e grava no manifesto o hash de cada original.
9. (`--finalize`, outra chamada) Pergunta **Sim / Não** para finalizar: confere o hash de cada original contra o do `--archive` — se mudou, não apaga e avisa; se não mudou, reescreve as referências (`related_*`) de outros documentos e apaga o original.

## Regras que importam

- Nada é publicado, arquivado ou finalizado sem o **Sim** daquele passo — cada um tem a pergunta dele
- Um documento de trabalho só é publicado se estiver **ligado** a esta entrega; sem vínculo, continua em `docs/jarvis/`
- Documento de uma funcionalidade só nunca é quebrado em partes
- Finalizar sem ter arquivado antes é recusado; documento que mudou desde o `--archive` nunca é apagado
- Sem e-mails, tokens ou valores de variáveis
- Com `.git` no Central docs, a entrega inteira vira **uma branch e um PR só** (não um por arquivo)
- Sem `.git`, o `archive/` é a única cópia do original além dele mesmo
- A sessão não é apagada: remova à mão quando quiser
- **Links no Central docs:** o Central docs pode ser lido fora do workspace, então o código vira URL absoluta (`blob/{sha}` do merge), e a sessão e o `docs/jarvis/` ficam em texto (`rules-on-demand/doc-links-rules.md`, regra 6)

## Próximo passo típico

Merge do PR. A próxima entrega da mesma funcionalidade atualiza a mesma página.
