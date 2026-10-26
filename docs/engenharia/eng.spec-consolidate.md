# `/eng.spec-consolidate` — registrar o que foi implementado

Workflow: `workflows/engineering/eng.spec-consolidate.md` · Agente: `agents/engineering/eng.docs-consolidator.agent.md`

## Em uma frase

Depois do merge do PR (o `/eng.pr` pergunta no fim e oferece chamá-lo), transforma tudo o que a entrega envolveu num registro completo para o **Central docs**: o documento da funcionalidade (estado atual) e o registro da entrega.

## O que é

O Central docs guarda **só o que foi implementado**. Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC, épicos…) ficam em `docs/jarvis/`, fora do versionamento, e podem estar desatualizados ou nunca ter sido implementados. Este comando cruza essas fontes com o que aconteceu de verdade:
- as decisões do `architecture.md` e as mudanças de direção do `plan.md`;
- o diff e os commits (quem fez o quê, quando);
- o PR/MR e o card.

Com isso, escreve dois documentos **autossuficientes**: se os originais se perderem, o Central docs basta.

| Documento | Onde fica no Central docs | O que tem |
|---|---|---|
| Funcionalidade | `{SQUAD}/product/{produto}/feature-{slug}.md` | Estado atual completo: comportamento, decisões, onde está no código, o que mudou em relação ao especificado, limitações, histórico de entregas |
| Entrega | `{SQUAD}/engineering/{produto}/delivery-{data}-{card}.md` | O que o PR fez, decisões, commits com autor, arquivos, follow-ups, testes |

## Quando usar

- Logo depois do [`/eng.pr`](./eng.pr.md), com a sessão da tarefa ainda presente
- `--inicial`: para montar o Central docs a partir dos documentos que já existem (o [`/jarvis-init`](../../skills/jarvis-init/SKILL.md) oferece)

## Quando **não** usar

- O Central docs está desligado (`CENTRAL_DOCS_STORAGE` vazio): ligue no `/jarvis-init`
- A entrega ainda não tem PR: rode o `/eng.pr` antes

## Como funciona

1. Confere o Central docs e a sessão.
2. Lê todas as fontes: `architecture.md`, `plan.md`, documentos de trabalho, `git log`/`diff` desde a branch base, PR/MR e card.
3. Lista as funcionalidades do produto e pergunta qual atualizar (ou cria uma nova, sugerindo o nome).
4. Escreve os dois documentos na sessão (`consolidation/`).
5. Mostra para revisão: `[Aprovar]` ou `[Ajustar]`.
6. Pergunta **Sim / Não** para publicar (`jarvis docs publish --tipo delivery` e `--tipo feature`).

## Regras que importam

- Nada é publicado sem o seu **Sim**
- Só `feature` e `delivery` vão para o Central docs
- Sem e-mails, tokens ou valores de variáveis
- A sessão não é apagada: remova à mão quando quiser
- **Links no Central docs:** o Central docs pode ser lido fora do workspace, então o código vira URL absoluta (`blob/{sha}` do merge), e a sessão e o `docs/jarvis/` ficam em texto (`rules-on-demand/doc-links-rules.md`, regra 6)

## Próximo passo típico

Merge do PR. A próxima entrega da mesma funcionalidade atualiza o mesmo `feature-*.md`.
