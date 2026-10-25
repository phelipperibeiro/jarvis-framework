# jarvis-docs-central

Integração com o **Central docs**: o registro do que **foi implementado** em cada produto do squad (um documento completo por funcionalidade e um registro por entrega), com um índice que os outros comandos consultam. Os documentos de trabalho (PRD, FRD, ARD, RFC, SPEC) ficam em `docs/jarvis/` e não vão para lá.

## Visão Geral

- **Buscar** o que já foi implementado (`jarvis docs sync`, `jarvis docs fetch`)
- **Publicar** a consolidação de cada entrega (`jarvis docs publish`, pelo `/eng.spec-consolidate`)
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
CENTRAL_DOCS_REVIEWERS=
SQUAD=CORE
WORKSPACE=loja                           # vira a pasta do produto
```

A pasta padrão é `docs/jarvis/central-docs` nos dois modos de trabalho, junto dos documentos de trabalho. No projeto único, `docs/jarvis/` no `.gitignore` a deixa fora do versionamento; no workspace (vários repositórios) a raiz não é versionada. Quem já usa `./central-docs` continua funcionando, e o Upgrade do `/jarvis-init` oferece mover a pasta.

> Com `.git`, o PR é aberto pela CLI do host (`gh pr create` / `glab mr create`), com o login dela (`gh auth login`, `glab auth login`). Sem a CLI, ou com `VERSION_CONTROL_ACCESS` `manual`/inválido no `ENV.md` do projeto, a branch fica no remote e a publicação mostra o link para abrir o MR à mão. Nenhum token vai no chat nem no `ENV.md`.

**Vindo da versão anterior (Central docs como repositório remoto)?** Rode `/jarvis-init` → Upgrade (C). Ele propõe `CENTRAL_DOCS_STORAGE=filesystem`, a pasta padrão e o `git clone` do repositório antigo.

## Comandos

```bash
jarvis docs sync                                  # resumo: funcionalidades e entregas recentes
jarvis docs fetch CORE/index.md                   # conteúdo de um arquivo (exit 2 se não existir)
jarvis docs publish --file .../consolidation/feature-checkout.md --tipo feature            # pelo /eng.spec-consolidate
jarvis docs publish --file .../consolidation/delivery-2026-10-15-task-123.md --tipo delivery
```

- **Tipos:** só `feature` (vai para `product/`) e `delivery` (vai para `engineering/`). PRD, ARD, SPEC e os outros documentos de trabalho são recusados, com a explicação de que ficam em `docs/jarvis/`.
- Quem gera e publica é o [`/eng.spec-consolidate`](../../workflows/engineering/eng.spec-consolidate.md), depois do PR e do seu Sim.

## Estrutura e índice

```
{SQUAD}/
├── index.md                                     # gerado; não editar
├── product/{produto}/feature-{slug}.md          # funcionalidade: estado atual, completo
└── engineering/{produto}/delivery-{data}-{key}.md   # registro de uma entrega
```

O índice lista as funcionalidades e as 10 entregas mais recentes de cada produto. Com `.git` e `scripts/build-index.sh` no repositório de documentação, o índice vem do script dele.

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
│   └── docs-publish.js        # jarvis docs publish
└── lib/docs/
    ├── fetch-file.js          # openStorageFromEnv + fetchFile (jarvis docs fetch)
    ├── publish-file.js        # tipos (feature, delivery), destino e publicação
    ├── validate-frontmatter.js
    └── storage/
        ├── index.js           # getStorage(env): escolhe o adaptador pelo CENTRAL_DOCS_STORAGE
        ├── filesystem.js      # pasta + camada git (pull, branch, commit, push, PR)
        └── build-index.js     # gera {SQUAD}/index.md a partir do frontmatter
```

Um adaptador novo (S3, Drive) implementa o mesmo contrato do `filesystem.js` (`fetch`, `list`, `publish`, `buildIndex`) e entra no `storage/index.js`.

## Troubleshooting

Ver a tabela "Troubleshooting" do `SKILL.md`.
