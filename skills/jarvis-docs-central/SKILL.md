---
name: jarvis-docs-central
description: Integração com o Central docs, a documentação aprovada (PRD, FRD, épicos, histórias, ARD, RFC) guardada por um adaptador de armazenamento (hoje uma pasta do disco, com git opcional). Busca, publica e indexa pelo CLI jarvis docs.
argument-hint: "[contexto da tarefa]"
allowed-tools: Bash Read Write
disable-model-invocation: false
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "4.0"
  area: global
---

# jarvis-docs-central

## Objetivo

Integrar os comandos do framework com o **Central docs**: o lugar onde fica a documentação aprovada de todos os produtos do squad, com um índice (`{SQUAD}/index.md`) que os outros comandos consultam.

- Buscar documentos relevantes durante os workflows (Modo 1)
- Publicar documentos aprovados (Modo 2)
- Reparar o índice (Modo 3)

## Adaptadores de armazenamento

O Central docs não depende de um serviço: `CENTRAL_DOCS_STORAGE` escolhe o adaptador e `CENTRAL_DOCS_LOCATION` diz onde ele guarda. Os comandos são sempre os mesmos (`jarvis docs fetch | sync | publish`), venha o conteúdo de onde vier.

| `CENTRAL_DOCS_STORAGE` | `CENTRAL_DOCS_LOCATION` | Situação |
|---|---|---|
| *(vazio)* | — | Desligado: os comandos pulam em silêncio |
| `filesystem` | Pasta (relativa à pasta do workspace ou absoluta) | Disponível |
| `s3`, `gdrive` | — | Ainda não suportados (o comando para com a mensagem de "não suportado") |

**Camada git do `filesystem`:** se a pasta tiver `.git` (clone de um repositório de documentação), o adaptador:
- faz `git pull --ff-only` em `CENTRAL_DOCS_REF` antes de ler (se falhar, avisa e lê a cópia local);
- ao publicar: branch `docs/{caminho}` → cópia → índice → commit → push → Pull/Merge Request para `CENTRAL_DOCS_TARGET_BRANCH`, com `CENTRAL_DOCS_REVIEWERS` na descrição.

Sem `.git`, grava direto na pasta.

**Onde fica a pasta** (o `/jarvis-init` sugere): no modo workspace, `./central-docs` (no `.gitignore` do workspace); no projeto único, `docs/jarvis/central-docs` (com `docs/jarvis/*` no `.gitignore`). Nunca no versionamento de um repositório de código.

## Pré-condição

Ler do `$IDE/ENV.md`:
- `CENTRAL_DOCS_STORAGE` e `CENTRAL_DOCS_LOCATION` (vazio: encerrar em silêncio)
- `CENTRAL_DOCS_REF`, `CENTRAL_DOCS_TARGET_BRANCH`, `CENTRAL_DOCS_REVIEWERS` (só com `.git`)
- `SQUAD` (ALL-CAPS-COM-HIFEN), `WORKSPACE` (vira a pasta do produto) e `AREA` (que tipos buscar)

`ENV.md` da versão anterior (com a variável do repositório remoto e sem `CENTRAL_DOCS_STORAGE`): os comandos pedem o Upgrade do `/jarvis-init`, que faz a migração.

Com `.git`, o PR usa o token do vendor pelo adaptador de VCS (GitLab `.npmrc`; GitHub `gh auth`/`GITHUB_TOKEN`; Bitbucket `BITBUCKET_TOKEN`). ❌ **Nunca** colar token no chat.

---

## Estrutura do Central docs

```
{SQUAD}/
├── index.md                          # GERADO a cada publicação — não editar à mão
├── product/
│   └── {produto}/                    # WORKSPACE do ENV.md (ou --produto)
│       ├── prd-{id}-{nome}.md
│       ├── frd-{id}-{nome}.md
│       ├── feat-{id}-{nome}.md
│       ├── epic-{id}-{nome}.md
│       ├── story-{id}-{nome}.md
│       └── task-{id}-{nome}.md
├── engineering/
│   └── {produto}/
│       ├── ard-{id}-{nome}.md
│       ├── rfc-{id}-{nome}.md
│       ├── swagger-{nome}.{md|yaml|json}
│       └── qa-report-{nome}.md
└── context/                          # opcional — formato livre
```

- **Nome do arquivo:** o do arquivo local, que já segue `{tipo}-{id}-{nome}.md` (`prod-rules.md`). Só quando o nome foge do padrão, `--feature {slug}` gera `{tipo}-{slug}.{ext}`.
- **`{produto}`:** `WORKSPACE` (a pasta que contém o `$IDE/`), ou `--produto`.

### Frontmatter obrigatório (validado no `publish`)

| Tipo | Campos |
|------|--------|
| `prd` | `id`, `name`, `version`, `status` |
| `frd`, `feat`, `epic` | `id`, `name`, `version`, `status`, `related_prd` |
| `story` | `id`, `name`, `status`, `related_prd` |
| `task` | `id`, `name`, `status` |
| `ard` | `id`, `name`, `version`, `status` |
| `rfc` | `Status`, `Criado em`, `Proponente` |
| `qa-report` | `period`, `squad`, `version` |

**Status reconhecidos:**
- produto: `icebox`, `in_review`, `backlog`, `in_progress`, `in_production`, `cancelled`, `deprecated`;
- ARD: `proposed`, `in_progress`, `in_review`, `approved`;
- RFC: `Draft`, `In Review`, `Ready for Decision`, `Accepted`, `Rejected`, `Superseded`.

Status fora da lista só gera aviso.

**Campos `related_*`:** só o **basename** do arquivo (sem path nem `./`).

### Índice

O `{SQUAD}/index.md` é **regenerado** a partir do frontmatter de todos os documentos a cada publicação (nunca editado, para duas publicações não apagarem a entrada uma da outra). Com `.git` e um `scripts/build-index.sh` no repositório de documentação, o adaptador usa o script dele (o CI do repositório confere o índice com ele).

```markdown
# CORE

## product

### loja
- [prd-001-checkout.md](product/loja/prd-001-checkout.md) | v1.0.0 | backlog | Checkout

## engineering

### loja
- [ard-001-pagamentos.md](engineering/loja/ard-001-pagamentos.md) | v1.0.0 | approved | Pagamentos
```

---

## Quando Usar

- `/warm-up`: carregar o contexto do produto (Modo 1)
- `/eng.start`, `/eng.create-ard`, `/eng.create-rfc`, `/eng.build-tech-spec`: buscar PRD/ARD/RFC relacionados (Modo 1)
- `/prod.spec.*`: buscar specs existentes e publicar a aprovada (Modos 1 e 2)
- `/eng.pre-pr`: detectar ARD novo ou desatualizado e oferecer a publicação (Modo 2)
- Índice ausente ou divergente (Modo 3)

---

## Fluxo de Trabalho

### Modo 1: Buscar docs

```bash
jarvis docs sync                         # lê {SQUAD}/index.md e resume o que há
jarvis docs fetch {SQUAD}/index.md       # conteúdo do índice
jarvis docs fetch {SQUAD}/product/{produto}/prd-001-checkout.md
```

- Com `.git`, o primeiro acesso faz `pull`.
- `docs fetch` sai com código **2** quando o arquivo não existe.

1. Buscar o índice do squad.
2. Identificar os documentos pelo `TASK_MANAGER_KEY`, pelo nome ou pelo produto; filtrar por `AREA`:
   - `PRODUCT` → PRD, FRD, épicos e histórias;
   - `ENGINEERING` → PRD (contexto), ARD e RFC.
3. Buscar cada arquivo com `jarvis docs fetch`.
4. Devolver o conteúdo carregado, com um resumo (squad, produto, documentos e versões).

### Modo 2: Publicar doc

```bash
jarvis docs publish --file ./docs/product/prd-001-checkout.md --tipo prd
jarvis docs publish --file ./docs/engineering/ARD/ard-001-pagamentos.md --tipo ard --produto loja
jarvis docs publish --file ./openapi.yaml --tipo swagger --feature api-wallet
```

Tipos: `prd, frd, feat, epic, story, task` (em `product/`) e `ard, rfc, swagger, qa-report` (em `engineering/`).

**Fluxo:**
1. Validar o frontmatter (tabela acima).
2. Calcular o destino `{SQUAD}/{área}/{produto}/{nome}`.
3. Sem `.git`: copiar o arquivo e regenerar `{SQUAD}/index.md`.
4. Com `.git`:
   1. `checkout` + `pull` de `CENTRAL_DOCS_TARGET_BRANCH`;
   2. branch `docs/{SQUAD}/{área}/{produto}/{nome}`;
   3. cópia + índice;
   4. commit e push;
   5. PR para `CENTRAL_DOCS_TARGET_BRANCH`;
   6. voltar para a branch base.
5. Mostrar o destino, o índice e a URL do PR (com `.git`).

Antes de publicar, **confirmar com o usuário**. Sem `.git` não há PR: a confirmação é a única revisão.

### Modo 3: Reparar o índice

Quando o índice não existe ou não lista todos os documentos:
- **Sem `.git`:** publicar de novo qualquer documento do squad regenera o índice. Na prática, o próximo `jarvis docs publish` já corrige.
- **Com `.git`:** no clone, rodar `bash scripts/build-index.sh` (se existir) e abrir um PR `repair/index-{SQUAD}-{data}` com o índice atualizado.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca

- Publicar documento sem validar o frontmatter
- Editar `{SQUAD}/index.md` à mão
- Push direto para a branch base quando a pasta tem `.git` (sempre por PR)
- Buscar docs com `CENTRAL_DOCS_STORAGE` vazio (encerrar em silêncio)
- Inventar metadados (`version`, `status`, `id`)
- Usar path em campos `related_*`
- Colocar o Central docs no versionamento de um repositório de código

### Sempre

- Ler e publicar só pelo CLI (`jarvis docs fetch | sync | publish`), nunca lendo a pasta por fora do adaptador
- Se o Central docs tiver `AGENTS.md` na raiz, lê-lo antes de operar
- Confirmar com o usuário antes de publicar
- Usar `SQUAD` em ALL-CAPS-COM-HIFEN

---

## Troubleshooting

| Mensagem | Causa | O que fazer |
|---|---|---|
| `Central docs desligado (CENTRAL_DOCS_STORAGE vazio)` | Não configurado | `/jarvis-init` → Central docs |
| `… não é mais usado. Rode o /jarvis-init e escolha Upgrade (C)` | `ENV.md` da versão anterior | `/jarvis-init` → Upgrade (C) |
| `Armazenamento "s3" ainda não suportado` | Valor de `STORAGE` sem adaptador | Use `filesystem` |
| `Pasta do Central docs não encontrada` | `LOCATION` errado ou pasta não criada | Criar a pasta ou ajustar `LOCATION` |
| `Arquivo não encontrado no Central docs: {SQUAD}/index.md` | Squad sem publicação ainda | Publicar o primeiro documento |
| `Campos obrigatórios ausentes` | Frontmatter incompleto | Completar conforme a tabela |
| `O arquivo "…" não segue o padrão` | Nome fora de `{tipo}-{id}-{nome}` | Renomear ou usar `--feature` |
| `git pull`/`push` falhou (com `.git`) | Rede, permissão ou pasta suja | `git status` na pasta; o commit local fica para repetir |
