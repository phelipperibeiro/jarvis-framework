---
name: jarvis-docs-central
description: Integração com o Central docs, o registro do que foi implementado (um documento completo por funcionalidade e um registro por entrega, gerados pelo /eng.spec-consolidate), guardado por um adaptador de armazenamento (hoje uma pasta do disco, com git opcional). Busca, publica e indexa pelo CLI jarvis docs.
argument-hint: "[contexto da tarefa]"
allowed-tools: Bash Read Write
disable-model-invocation: false
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "5.0"
  area: global
---

# jarvis-docs-central

## Objetivo

Integrar os comandos do framework com o **Central docs**: o registro do que **de fato foi implementado** em cada produto do squad, com um índice (`{SQUAD}/index.md`) que os outros comandos consultam.

**Duas camadas de documentação:**

| Camada | O que é | Onde fica |
|---|---|---|
| Documentos de trabalho | PRD, FRD, épicos, histórias, ARD, RFC, SPEC, QA, swagger, robôs, C4: o que se pretende e se discute | `docs/jarvis/` (`$PROD_DOCS`, `$ENG_DOCS`), fora do versionamento |
| **Central docs** | O que foi implementado: um documento **completo e autossuficiente** por funcionalidade (estado atual) e um **registro por entrega** (PR, commits, autores) | Pasta do Central docs (adaptador) |

Quem escreve no Central docs é o **`/eng.spec-consolidate`** (agente `eng.docs-consolidator`), depois do merge do PR. Os documentos de trabalho nunca são publicados lá.

**Modos deste skill:**
- buscar o que já foi implementado (Modo 1);
- publicar a consolidação (Modo 2);
- reparar o índice (Modo 3).

## Adaptadores de armazenamento

`CENTRAL_DOCS_STORAGE` escolhe o adaptador e `CENTRAL_DOCS_LOCATION` diz onde ele guarda. Os comandos são sempre os mesmos (`jarvis docs fetch | sync | publish`).

| `CENTRAL_DOCS_STORAGE` | `CENTRAL_DOCS_LOCATION` | Situação |
|---|---|---|
| `filesystem` (**padrão**) | Pasta (relativa à pasta do workspace ou absoluta) | Disponível |
| *(vazio)* | — | Desligado: os comandos pulam em silêncio; o `/eng.spec-consolidate` orienta ligar |
| `s3`, `gdrive` | — | Ainda não suportados (#144, #145) |

**Camada git do `filesystem`:** se a pasta tiver `.git` (clone de um repositório de documentação):
- antes de ler: `git pull --ff-only` em `CENTRAL_DOCS_REF` (se falhar, avisa e lê a cópia local);
- ao publicar: branch → cópia → índice → commit → push → PR para `CENTRAL_DOCS_TARGET_BRANCH`.

Sem `.git`, grava direto na pasta.

**Onde fica a pasta** (o `/jarvis-init` configura no Passo 5.2): no modo workspace, `./central-docs` (no `.gitignore` do workspace); no projeto único, `docs/jarvis/central-docs` (coberto por `docs/jarvis/` no `.gitignore`). Nunca no versionamento de um repositório de código.

## Pré-condição

Ler do `$IDE/ENV.md`:
- `CENTRAL_DOCS_STORAGE` e `CENTRAL_DOCS_LOCATION` (vazio: encerrar em silêncio)
- `CENTRAL_DOCS_REF`, `CENTRAL_DOCS_TARGET_BRANCH`, `CENTRAL_DOCS_REVIEWERS` (só com `.git`)
- `SQUAD` (ALL-CAPS-COM-HIFEN) e `WORKSPACE` (vira a pasta do produto)

Com `.git`, o PR usa o token do vendor pelo adaptador de VCS (GitLab `.npmrc`; GitHub `gh auth`/`GITHUB_TOKEN`; Bitbucket `BITBUCKET_TOKEN`). ❌ **Nunca** colar token no chat.

---

## Estrutura do Central docs

```
{SQUAD}/
├── index.md                                   # GERADO a cada publicação — não editar à mão
├── product/
│   └── {produto}/                             # WORKSPACE do ENV.md (ou --produto)
│       └── feature-{slug}.md                  # funcionalidade: estado atual, completo
└── engineering/
    └── {produto}/
        └── delivery-{AAAA-MM-DD}-{task_key}.md   # registro de uma entrega (PR)
```

- Templates: `templates/engineering/central-feature-template.md` (11 seções) e `central-delivery-template.md` (7 seções).
- `related_docs`/`feature` citam só o **basename**.

### Frontmatter obrigatório (validado no `publish`)

| Tipo | Campos |
|------|--------|
| `feature` | `id`, `name`, `status`, `product`, `updated_at` |
| `delivery` | `id`, `feature`, `task_key`, `pr`, `date` |

Status da funcionalidade: a lista de produto (`icebox`, `in_review`, `backlog`, `in_progress`, `in_production`, `cancelled`, `deprecated`).

### Índice

O `{SQUAD}/index.md` é **regenerado** a cada publicação, a partir do frontmatter:
- **`## product`:** as funcionalidades de cada produto (status, nome, data da última atualização);
- **`## engineering`:** as **10 entregas mais recentes** de cada produto.

Arquivos que não são `feature-*`/`delivery-*` ficam **fora** do índice. Exemplo: PRD e ARD publicados inteiros na versão 4.0.0, que podem ser apagados à mão ou transformados em funcionalidades pela carga inicial (`/eng.spec-consolidate --inicial`).

Com `.git` e um `scripts/build-index.sh` no repositório de documentação, o adaptador usa o script dele.

```markdown
# CORE

## product

> Funcionalidades (estado atual)

### loja
- [feature-checkout.md](product/loja/feature-checkout.md) | in_production | Checkout | 2026-10-15

## engineering

> Entregas recentes

### loja
- [delivery-2026-10-15-task-123.md](engineering/loja/delivery-2026-10-15-task-123.md) | TASK-123 | 2026-10-15
```

---

## Quando Usar

- `/warm-up`, `/eng.start`, `/prod.spec.*`, `/eng.create-ard*`, `/eng.create-rfc`, `/eng.build-tech-spec`: conhecer o que **já foi implementado** (Modo 1)
- `/eng.spec-consolidate`: publicar a consolidação de uma entrega ou a carga inicial (Modo 2)
- Índice ausente ou divergente (Modo 3)

---

## Fluxo de Trabalho

### Modo 1: Buscar o que foi implementado

```bash
jarvis docs sync                                           # resumo: funcionalidades e entregas recentes
jarvis docs fetch {SQUAD}/index.md
jarvis docs fetch {SQUAD}/product/{produto}/feature-checkout.md
```

1. Buscar o índice do squad.
2. Identificar as funcionalidades relacionadas à tarefa (nome, produto, card citado no histórico).
3. Buscar cada `feature-*` com `jarvis docs fetch` (e um `delivery-*`, se o detalhe de uma entrega importar).
4. Devolver o resumo: funcionalidades, status e o que cada uma faz hoje.

Os documentos de trabalho da tarefa (PRD, FRD, ARD, RFC, SPEC) **não** estão aqui: leia-os em `$PROD_DOCS`/`$ENG_DOCS`.

### Modo 2: Publicar a consolidação

Feito pelo `/eng.spec-consolidate`, depois do **Sim** do usuário:

```bash
jarvis docs publish --file .../consolidation/delivery-2026-10-15-task-123.md --tipo delivery
jarvis docs publish --file .../consolidation/feature-checkout.md --tipo feature
```

- Tipos aceitos: **`feature`** e **`delivery`**.
- `prd`, `frd`, `ard`, `rfc` e os outros documentos de trabalho são recusados com a explicação.
- `--produto` troca o `WORKSPACE`.

**Fluxo:**
1. Validar o frontmatter.
2. Calcular o destino.
3. Sem `.git`: copiar e regenerar o índice.
4. Com `.git`: branch, cópia, índice, commit, push e PR.

### Modo 3: Reparar o índice

- **Sem `.git`:** a próxima publicação regenera o índice.
- **Com `.git`:** no clone, rodar `bash scripts/build-index.sh` (se existir) e abrir um PR `repair/index-{SQUAD}-{data}`.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca

- Publicar documento de trabalho (PRD, FRD, ARD, RFC, SPEC…) no Central docs
- Publicar sem o Sim do usuário (Modo 2 é sempre pelo `/eng.spec-consolidate`)
- Editar `{SQUAD}/index.md` à mão
- Push direto para a branch base quando a pasta tem `.git` (sempre por PR)
- Inventar metadados; incluir e-mails, tokens ou valores de variáveis
- Colocar o Central docs no versionamento de um repositório de código

### Sempre

- Ler e publicar só pelo CLI (`jarvis docs fetch | sync | publish`)
- Se o Central docs tiver `AGENTS.md` na raiz, lê-lo antes de operar
- Usar `SQUAD` em ALL-CAPS-COM-HIFEN

---

## Troubleshooting

| Mensagem | Causa | O que fazer |
|---|---|---|
| `Central docs desligado (CENTRAL_DOCS_STORAGE vazio)` | Desligado no ENV | `/jarvis-init` → Passo 5.2 |
| `… não é mais usado. Rode o /jarvis-init e escolha Upgrade (C)` | `ENV.md` da versão anterior | `/jarvis-init` → Upgrade (C) |
| `Armazenamento "s3" ainda não suportado` | Valor de `STORAGE` sem adaptador | Use `filesystem` |
| `Pasta do Central docs não encontrada` | `LOCATION` errado ou pasta não criada | Criar a pasta ou ajustar `LOCATION` |
| `Arquivo não encontrado no Central docs: {SQUAD}/index.md` | Squad sem consolidação ainda | `/eng.spec-consolidate --inicial` ou consolidar a próxima entrega |
| `O Central docs guarda só o que foi implementado` | Tentativa de publicar PRD/ARD/… | Gere a consolidação com `/eng.spec-consolidate` |
| `Campos obrigatórios ausentes` | Frontmatter incompleto | Completar conforme a tabela |
| `git pull`/`push` falhou (com `.git`) | Rede, permissão ou pasta suja | `git status` na pasta; o commit local fica para repetir |
