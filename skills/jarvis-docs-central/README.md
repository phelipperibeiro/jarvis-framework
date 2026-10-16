# jarvis-docs-central

Integração com o **Central docs**: a documentação aprovada (PRD, FRD, épicos, histórias, ARD, RFC) de todos os produtos do squad, com um índice que os outros comandos consultam.

## Visão Geral

- **Buscar** documentos (`jarvis docs sync`, `jarvis docs fetch`)
- **Publicar** documentos aprovados (`jarvis docs publish`)
- **Índice** regenerado a cada publicação (`{SQUAD}/index.md`)

O Central docs funciona por **adaptador de armazenamento**: hoje uma pasta do disco (`filesystem`). Se essa pasta for um clone de um repositório de documentação (tem `.git`), a publicação vira branch + commit + push + Pull/Merge Request. S3 e Google Drive são as issues #144 e #145.

## Configuração

Pelo `/jarvis-init` (pergunta "Onde fica a documentação central?": pasta local, repositório git ou não usar), ou à mão no `ENV.md`:

```ini
CENTRAL_DOCS_STORAGE=filesystem
CENTRAL_DOCS_LOCATION=./central-docs     # relativo à pasta do workspace, ou absoluto
# Só se a pasta tiver .git:
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=main
CENTRAL_DOCS_REVIEWERS=
SQUAD=CORE
WORKSPACE=loja                           # vira a pasta do produto
```

| Modo de trabalho | Pasta padrão | Fora do versionamento por |
|---|---|---|
| Workspace (vários repositórios) | `./central-docs` | `central-docs/` no `.gitignore` do workspace |
| Projeto único | `docs/jarvis/central-docs` | `docs/jarvis/*` no `.gitignore` do projeto |

> Com `.git`, o PR usa o token do vendor (GitLab `.npmrc`, GitHub `gh auth`/`GITHUB_TOKEN`, Bitbucket `BITBUCKET_TOKEN`). O token **nunca** vai no chat nem no `ENV.md`.

**Vindo da versão anterior (Central docs como repositório remoto)?** Rode `/jarvis-init` → Upgrade (C). Ele propõe `CENTRAL_DOCS_STORAGE=filesystem`, a pasta padrão e o `git clone` do repositório antigo.

## Comandos

```bash
jarvis docs sync                                  # resumo do índice do squad
jarvis docs fetch CORE/index.md                   # conteúdo de um arquivo (exit 2 se não existir)
jarvis docs publish --file ./docs/product/prd-001-checkout.md --tipo prd
jarvis docs publish --file ./ard-001-x.md --tipo ard --produto outro-produto
jarvis docs publish --file ./openapi.yaml --tipo swagger --feature api-wallet
```

- **Tipos:** `prd, frd, feat, epic, story, task` (vão para `product/`) e `ard, rfc, swagger, qa-report` (vão para `engineering/`).
- **Nome no Central docs:** o do arquivo local, quando ele segue `{tipo}-{id}-{nome}`. Se não seguir, use `--feature {slug}`.

## Estrutura e índice

```
{SQUAD}/
├── index.md                 # gerado; não editar
├── product/{produto}/       # prd-, frd-, feat-, epic-, story-, task-
├── engineering/{produto}/   # ard-, rfc-, swagger-, qa-report-
└── context/                 # opcional
```

```markdown
# CORE

## product

### loja
- [prd-001-checkout.md](product/loja/prd-001-checkout.md) | v1.0.0 | backlog | Checkout
```

Com `.git` e `scripts/build-index.sh` no repositório de documentação, o índice vem do script dele.

## Integração com Workflows

| Comando | Uso |
|---|---|
| `/warm-up` | `jarvis docs sync` (se `CENTRAL_DOCS_STORAGE` estiver configurado) |
| `/eng.start`, `/eng.create-ard`, `/eng.create-rfc`, `/eng.build-tech-spec` | Buscar PRD, ARD e RFC relacionados |
| `/prod.spec.*` | Buscar specs existentes e publicar a aprovada |
| `/eng.pre-pr` | Oferecer a publicação de um ARD novo ou atualizado |

## Arquitetura

```
bin/
├── commands/
│   ├── docs-sync.js           # jarvis docs sync
│   └── docs-publish.js        # jarvis docs publish
└── lib/docs/
    ├── fetch-file.js          # openStorageFromEnv + fetchFile (jarvis docs fetch)
    ├── publish-file.js        # tipos, destino e publicação
    ├── validate-frontmatter.js
    └── storage/
        ├── index.js           # getStorage(env): escolhe o adaptador pelo CENTRAL_DOCS_STORAGE
        ├── filesystem.js      # pasta + camada git (pull, branch, commit, push, PR)
        └── build-index.js     # gera {SQUAD}/index.md a partir do frontmatter
```

Um adaptador novo (S3, Drive) implementa o mesmo contrato do `filesystem.js` (`fetch`, `list`, `publish`, `buildIndex`) e entra no `storage/index.js`.

## Troubleshooting

Ver a tabela "Troubleshooting" do `SKILL.md`.
