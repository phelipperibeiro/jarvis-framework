---
name: jarvis-docs-central
description: Integração com repositório centralizado de documentação (GitLab, GitHub ou Bitbucket). Busca e publica PRDs, FRDs, ARDs e RFCs via API do vendor.
argument-hint: "[contexto da tarefa]"
allowed-tools: Bash Read Write
disable-model-invocation: false
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "3.0"
  area: global
---

# jarvis-docs-central

## Objetivo

Integrar o framework com o repositório `central-docs` (`CENTRAL_DOCS_REPO`), permitindo:
- Buscar docs relevantes automaticamente durante workflows
- Publicar docs aprovados via MR com git flow seguro
- Sincronização automática em /warm-up

## Fonte de Verdade

> **Antes de qualquer operação**, leia `$CENTRAL_DOCS_REPO/AGENTS.md`.
> Ele define o contrato completo do repositório: estrutura, naming, frontmatter e regras de índice.
> Este skill implementa esse contrato — não o duplica.

## Pré-condição

Ler do `$IDE/ENV.md`:
- `CENTRAL_DOCS_REPO` — URL do repo (GitLab, GitHub ou Bitbucket; se vazio: encerrar silenciosamente)
- `CENTRAL_DOCS_REF` — branch para leitura (padrão: `main`)
- `VERSION_CONTROL` — fallback se o hostname da URL não identificar o vendor
- `SQUAD` — squad do usuário (formato: ALL-CAPS-COM-HIFEN)
- `WORKSPACE` — nome do workspace em kebab-case
- `AREA` — define quais tipos de doc buscar

**Token VCS** (resolvido pelo adapter `bin/lib/utils/npmrc-parser.js` → `getVcsToken`):
- GitLab: `.npmrc` `:_authToken=` ou `GITLAB_TOKEN`
- GitHub: `gh auth token`, `GITHUB_TOKEN` ou `.npmrc` npm.pkg.github.com
- Bitbucket: `BITBUCKET_TOKEN`

❌ **NUNCA** colar o token no chat.

Se `CENTRAL_DOCS_REPO` não estiver definido, encerrar silenciosamente sem erro.

---

## Convenções do central-docs (resumo operacional)

### Estrutura de pastas

```
{SQUAD}/
├── index.md                          # GERADO — não editar à mão
├── product/
│   └── {produto-em-kebab}/
│       ├── prd-{id}-{nome}.md
│       ├── frd-{id}-{nome}.md
│       ├── feat-{id}-{nome}.md
│       ├── epic-{id}-{nome}.md
│       ├── story-{id}-{nome}.md
│       └── task-{id}-{nome}.md
├── engineering/
│   └── {produto-em-kebab}/
│       ├── ard-{id}-{nome}.md
│       └── rfc-{id}-{nome}.md
└── context/                          # opcional — só nasce com conteúdo
    ├── CLAUDE.md
    └── (pesquisas, dados, assets — formato livre)
```

**Squads válidos** (pastas raiz ALL-CAPS): detectados dinamicamente pelo script.
Fonte de verdade: `taxonomy.md` na raiz do repo.

### Naming de arquivos

```
{tipo}-{id}-{nome-em-kebab}.md
```

Exemplos: `prd-001-minha-feature.md`, `ard-001-minha-api.md`, `story-TASK-4-meu-exemplo.md`

- Tipo sempre **lowercase**: `prd-`, `frd-`, `feat-`, `epic-`, `story-`, `task-`, `ard-`, `rfc-` , `swagger-`
- Pasta de produto: `kebab-case`, um produto = uma pasta

### Frontmatter obrigatório

| Campo | PRD | FRD/FEAT/STORY | EPIC | TASK | ARD/RFC |
|-------|-----|----------------|------|------|---------|
| `id` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `name` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `version` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `status` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `created` / `updated` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `created_by` / `last_editor` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `related_prd` | – | ✓ | ✓ | – | – |
| `related_epic` | – | – | – | ✓ | – |

**Status válidos:** `draft`, `in_review`, `planejado`, `in_progress`, `in_production`, `icebox`, `deprecated`

**Campos `related_*`:** sempre apenas o **basename** do arquivo, sem path nem `./`.
```yaml
# ✅ Certo
related_prd: prd-001-minha-feature.md

# ❌ Errado
related_prd: ./prd-001-minha-feature.md
related_prd: ../minha-feature/prd-001-minha-feature.md
```

### Índices — regra crítica

O arquivo `{SQUAD}/index.md` é **gerado pelo script** `scripts/build-index.sh`. **Nunca editar à mão.**

```bash
# Sempre rodar após qualquer add/move/remove de spec
bash scripts/build-index.sh
```

O script detecta squads dinamicamente (pastas raiz ALL-CAPS) e gera um único `index.md` por squad lendo o frontmatter de todos os specs em `product/` e `engineering/`, e listando o conteúdo de `context/`.

O CI (`.gitlab-ci.yml`) **falha** se o `index.md` commitado divergir do que o script geraria.

---

## Quando Usar

- `/warm-up` — carregar contexto do produto (Modo 1; aciona Modo 3 se índice ausente)
- `/eng.start` — buscar PRD/ARD antes de iniciar feature (Modo 1)
- `/eng.create-ard` — buscar PRD relacionado (Modo 1)
- `/eng.pre-pr` — detectar docs desatualizados (Modo 1)
- Publicação de doc aprovado (Modo 2)
- Reparo de índices inconsistentes ou ausentes (Modo 3)

---

## Fluxo de Trabalho

### Modo 1: Buscar Docs (usado em warm-up, eng.start)

**Passo 1 — Buscar índice do squad**

```bash
jarvis docs sync

# Internamente executa:
bash bin/lib/docs/fetch-file.sh "${SQUAD}/index.md" "${CENTRAL_DOCS_REF}"
```

**Passo 1.b — Fallback: navegar árvore (quando index.md não existe)**

Se `jarvis docs sync` retornar exit code 2 (arquivo não encontrado):

```bash
# Fallback: clonar o CENTRAL_DOCS_REPO e listar arquivos locais
# (funciona igual em GitLab, GitHub e Bitbucket)
git ls-tree -r --name-only "${CENTRAL_DOCS_REF}" -- "${SQUAD}/product/${WORKSPACE}" "${SQUAD}/engineering/${WORKSPACE}"
```

**Identificar docs por caminho (naming padrão):**
- `engineering/{produto}/ard-*.md` → ARD
- `engineering/{produto}/rfc-*.md` → RFC
- `product/{produto}/prd-*.md` → PRD
- `product/{produto}/frd-*.md` → FRD
- `product/{produto}/feat-*.md` → FEAT
- `product/{produto}/story-*.md` → STORY
- `context/` → artefatos de contexto (pesquisas, dados, assets)

**Passo 2 — Identificar docs relevantes**

Com base no contexto da tarefa (`TASK_MANAGER_KEY`, tags, descrição):
- Buscar no `index.md` por `TASK_MANAGER_KEY` matching
- Se não encontrar, buscar por tags semânticas
- Filtrar por AREA:
  - `PRODUCT` → PRDs e FRDs
  - `ENGINEERING` → PRD (contexto) + ARDs + RFCs

**Passo 3 — Buscar arquivos identificados**

```bash
bash bin/lib/docs/fetch-file.sh "${SQUAD}/product/${WORKSPACE}/prd-feature.md" "main"
bash bin/lib/docs/fetch-file.sh "${SQUAD}/engineering/${WORKSPACE}/ard-feature.md" "main"
```

**Passo 4 — Retornar resultado**

```markdown
# Contexto Carregado do Central Docs

## Squad: MEU-SQUAD / Produto: meu-produto

### PRD-001: Minha Feature (v1.2.0)
[conteúdo do PRD]

### ARD-001: Arquitetura da Minha Feature (v1.5)
[conteúdo do ARD]
```

---

### Modo 2: Publicar Doc

**Uso:**

```bash
jarvis docs publish \
  --file ./docs/engineering/ard-001-minha-feature.md \
  --squad MEU-SQUAD \
  --produto meu-produto \
  --tipo ard
```

**Fluxo interno:**

1. Validar frontmatter YAML (campos obrigatórios conforme tabela acima)
2. Validar naming do arquivo (`{tipo}-{id}-{nome-em-kebab}.md`)
3. Validar que `related_*` usam apenas basename
4. Determinar destino: `{SQUAD}/engineering/{produto}/` ou `{SQUAD}/product/{produto}/`
5. Criar branch `docs/{SQUAD}/{area}/{produto}/{tipo}-{id}-{nome}`
6. Commit via API do vendor (GitLab / GitHub / Bitbucket) com o doc
7. Rodar `bash scripts/build-index.sh` localmente no clone e incluir o `{SQUAD}/index.md` atualizado no mesmo commit atômico
8. Criar MR → main
9. Retornar URL do MR

**Commit atômico (doc + index):**

```
actions:
  - { action: "create_or_update", file_path: "{SQUAD}/engineering/{produto}/ard-001-feature.md", content: "..." }
  - { action: "create_or_update", file_path: "{SQUAD}/index.md", content: "..." }
```

> Usar `POST /repository/commits` com array `actions`.
> O `index.md` é o output de `build-index.sh` — nunca construído manualmente.

**Output:**

```
✅ MR criado: docs/MEU-SQUAD/engineering/meu-produto/ard-001-minha-feature → main
URL: {url do MR/PR retornada pelo adapter}
```

---

### Modo 3: Reparar Índices

> Detecta `{SQUAD}/index.md` ausente ou divergente e abre MR de reparo.

**Quando ativar:**

- Durante Modo 1, se o fallback de árvore encontrar docs que não aparecem no `index.md`
- Durante warm-up, se `index.md` não existir
- Quando o usuário pedir explicitamente

**Fluxo:**

```
1. Clonar ou usar clone local de central-docs
2. Rodar: bash scripts/build-index.sh
3. Comparar output com os index.md commitados (git diff)
4. Se há divergência:
   a. Criar branch: repair/index-{SQUAD}-{timestamp}
   b. Commitar os index.md atualizados
   c. Abrir MR → main
5. Reportar ao usuário
```

> O `build-index.sh` detecta squads dinamicamente — não é necessário listar squads manualmente.

**Output ao usuário:**

```
🔍 Verificando índices do central-docs (MEU-SQUAD)...

⚠️  MEU-SQUAD/index.md divergente — 3 docs ausentes no índice

📋 Abrindo MR de reparo...
   Branch: repair/index-MEU-SQUAD-20260510
   Arquivo: MEU-SQUAD/index.md

✅ MR aberto:
   URL: {CENTRAL_DOCS_REPO}/-/merge_requests/44
```

---

## Regras

### Nunca

- Publicar doc sem validar frontmatter
- Push direto para main (sempre via MR)
- Buscar docs se `CENTRAL_DOCS_REPO` vazio (encerrar silenciosamente)
- Inventar metadados (version, status, id)
- Editar `{SQUAD}/index.md` manualmente — sempre via `build-index.sh`
- Usar path em campos `related_*` — sempre basename apenas
- Usar formato `squad-driver` — sempre ALL-CAPS-COM-HIFEN: `MEU-SQUAD`
- Criar subpastas `engineering/index.md` ou `product/index.md` (não existem neste repo)

### Sempre

- Ler `$CENTRAL_DOCS_REPO/AGENTS.md` antes de operar
- Usar GitLab API (não `git archive` ou `git clone` desnecessário)
- Invalidar cache local (`redis-cli`) ao publicar, se o comando existir
- Seguir git flow (branch → MR → main)
- Extrair token do `.npmrc` automaticamente
- Validar naming do arquivo antes de publicar
- Incluir `{SQUAD}/index.md` (gerado por `build-index.sh`) em todo commit de publicação

---

## Troubleshooting

### Erro: Token VCS não encontrado

GitLab: `.npmrc` `:_authToken=` ou `GITLAB_TOKEN`.
GitHub: `gh auth login` ou `GITHUB_TOKEN`.
Bitbucket: `BITBUCKET_TOKEN`.

### Erro: index.md não encontrado (Modo 1)

```
❌ Arquivo não encontrado: MEU-SQUAD/index.md
```

**Causa:** Squad ainda sem docs publicados. Índice só existe após o primeiro `publish`.

**Solução:** Publicar ao menos um doc via `jarvis docs publish`. O MR já incluirá o `index.md`.

### Erro: Frontmatter inválido

```
❌ Campos obrigatórios ausentes: name, version, created_by
```

**Solução:** Adicionar campos conforme tabela de frontmatter obrigatório acima.

### Erro: Naming inválido

```
❌ Nome do arquivo não segue o padrão: {tipo}-{id}-{nome-em-kebab}.md
   Recebido: ARD-001-MinhaFeature.md
   Esperado: ard-001-minha-feature.md
```

**Solução:** Renomear o arquivo seguindo o padrão lowercase com hífens.

### CI falha com "Índices stale"

```
❌ Índices stale. Rode 'bash scripts/build-index.sh' localmente,
   commita o resultado e empurre de novo.
```

**Solução:** O `{SQUAD}/index.md` no commit diverge do que o script geraria. Sempre incluir o output de `build-index.sh` no mesmo commit do doc.

---

## Integração com Workflows

### /warm-up

```markdown
Se CENTRAL_DOCS_REPO configurado:
1. jarvis docs sync
2. Exibir resumo de docs disponíveis do squad/produto
```

### /eng.start

```markdown
Se CENTRAL_DOCS_REPO definido:
- Buscar docs relacionados ao `TASK_MANAGER_KEY` no index.md do squad
- Carregar PRD + ARDs relevantes antes de criar architecture.md
```

### /eng.pre-pr

```markdown
1. Detectar mudanças arquiteturais no diff
2. Verificar se ARD local existe e está atualizado vs central-docs
3. Se desatualizado ou novo: perguntar "Publicar no central-docs?"
4. Se sim: jarvis docs publish
```
