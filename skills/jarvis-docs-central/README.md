# jarvis-docs-central

Integração com o **Central docs**: o registro do que **foi implementado** em cada produto do squad, por funcionalidade (um documento completo por funcionalidade, um registro por entrega, a página do produto e o histórico), com um índice que os outros comandos consultam. Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC) ficam em `docs/jarvis/` e só vão para lá quando ligados a uma entrega consolidada.

## Visão Geral

- **Buscar** o que já foi implementado (`jarvis docs sync`, `jarvis docs fetch`)
- **Publicar** a consolidação de cada entrega (`jarvis docs publish`, pelo `/eng.spec-consolidate`, depois da pergunta)
- **Índice** regenerado a cada publicação (`{SQUAD}/index.md`)

O Central docs funciona por **adaptador de armazenamento**: hoje uma pasta do disco (`filesystem`). Se essa pasta for um clone de um repositório de documentação (tem `.git`), a publicação vira branch + commit + push + Pull/Merge Request. S3 e Google Drive são as issues #144 e #145.

## Configuração

Ligado por padrão. O `/jarvis-init` (Passo 5.2) pergunta "Onde fica o Central docs?" (pasta local, repositório git ou desligar). À mão, no `ENV.md`:

```ini
CENTRAL_DOCS_STORAGE=filesystem
CENTRAL_DOCS_LOCATION=docs/jarvis/central-docs   # relativo à pasta do workspace, ou absoluto
# Só se a pasta tiver .git:
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=main
SQUAD=CORE
WORKSPACE=loja                           # vira a pasta do produto
```

A pasta padrão é `docs/jarvis/central-docs` nos dois modos de trabalho, junto dos documentos de trabalho. No projeto único, `docs/jarvis/` no `.gitignore` a deixa fora do versionamento; no workspace (vários repositórios) a raiz não é versionada. Quem já usa `./central-docs` continua funcionando, e o Upgrade do `/jarvis-init` oferece mover a pasta.

> Com `.git` (e só depois da pergunta do `/eng.spec-consolidate`, regra de ouro), o PR é aberto pela CLI do host (`gh pr create` / `glab mr create`), com o login dela (`gh auth login`, `glab auth login`). Sem a CLI, ou com `VERSION_CONTROL_ACCESS` `manual`/inválido no `ENV.md` do projeto, a branch fica no remote e a publicação mostra o link para abrir o MR à mão. Nenhum token vai no chat nem no `ENV.md`.

**Vindo da versão anterior (Central docs como repositório remoto)?** Rode `/jarvis-init` → Upgrade (C). Ele propõe `CENTRAL_DOCS_STORAGE=filesystem`, a pasta padrão e o `git clone` do repositório antigo.

## Comandos

```bash
jarvis docs sync                                  # resumo: funcionalidades e entregas recentes
jarvis docs fetch CORE/index.md                   # conteúdo de um arquivo (exit 2 se não existir)
jarvis docs publish --file .../consolidation/feature-checkout.md --tipo feature            # pelo /eng.spec-consolidate, depois do Sim (regra de ouro)
jarvis docs publish --file .../consolidation/delivery-2026-10-15-task-123.md --tipo delivery  # idem
jarvis docs publish --manifest .../consolidation/manifest.json --slug task-123  # a entrega inteira, numa branch/PR só
jarvis docs archive --manifest .../consolidation/manifest.json    # guarda os originais em archive/, sem apagar
jarvis docs finalize --manifest .../consolidation/manifest.json   # apaga os originais já arquivados (irreversível)
jarvis docs migrate [--apply]                     # layout antigo -> por funcionalidade; dry-run por padrão
```

- **Tipos:** `feature`, `delivery`, `product`, `history`, `home`, e os documentos de trabalho (PRD, FRD, épico, história, tarefa, ARD, RFC, SPEC, swagger, relatório de QA, discovery) — estes últimos, só quando ligados a uma entrega consolidada; sem vínculo, ficam em `docs/jarvis/`.
- Quem gera e publica é o [`/eng.spec-consolidate`](../../workflows/engineering/eng.spec-consolidate.md), depois do PR e do seu Sim, em três passos: publicar, arquivar (`--archive`) e finalizar (`--finalize`), ou `--force` para os três de uma vez sem perguntar.

## Estrutura e índice

```
{SQUAD}/
├── index.md                              # gerado; não editar
├── home.md                               # página inicial do squad; criada uma vez, nunca sobrescrita
└── {produto}/
    ├── {produto}.md                      # o que é transversal a mais de uma funcionalidade
    ├── history/{task_key}/               # rodadas, comentários, diário da entrega
    └── {funcionalidade}/
        ├── {funcionalidade}.md           # funcionalidade: estado atual, completo
        ├── deliveries/delivery-{data}-{key}[-{funcionalidade}].md
        ├── decisions/                    # documentos de trabalho ligados a uma entrega
        └── archive/                      # originais, fora do índice
```

O índice lista a página do produto, as funcionalidades e as 10 entregas mais recentes de cada produto (deduplicadas por `task_key`). Com `.git` e `scripts/build-index.sh` no repositório de documentação, o índice vem do script dele.

## Integração com Workflows

| Comando | Uso |
|---|---|
| `/eng.spec-consolidate` | Gera e publica a funcionalidade e a entrega (e a carga inicial, `--inicial`) |
| `/jarvis-init` | Liga o Central docs (Passo 5.2) e oferece a carga inicial |
| `/warm-up`, `/eng.start`, `/prod.spec.*`, `/eng.create-ard`, `/eng.create-rfc`, `/eng.build-tech-spec` | Consultam as funcionalidades já implementadas |

## Arquitetura

```
bin/
├── commands/
│   ├── docs-sync.js           # jarvis docs sync
│   ├── docs-publish.js        # jarvis docs publish
│   └── docs-migrate.js        # jarvis docs migrate
└── lib/docs/
    ├── fetch-file.js          # openStorageFromEnv + fetchFile (jarvis docs fetch)
    ├── publish-file.js        # tipos, destino por funcionalidade e publicação
    ├── migrate-central.js     # plano e aplicação do jarvis docs migrate
    ├── validate-frontmatter.js
    └── storage/
        ├── index.js           # getStorage(env): escolhe o adaptador pelo CENTRAL_DOCS_STORAGE
        ├── filesystem.js      # pasta + camada git (pull, branch, commit, push, PR)
        └── build-index.js     # gera {SQUAD}/index.md a partir do frontmatter
```

Um adaptador novo (S3, Drive) implementa o mesmo contrato do `filesystem.js` (`fetch`, `list`, `publish`, `buildIndex`) e entra no `storage/index.js`.

## Troubleshooting

Ver a tabela "Troubleshooting" do `SKILL.md`.
