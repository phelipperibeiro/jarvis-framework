# jarvis-docs-central

Integração com repositório centralizado de documentação canônica (PRDs, FRDs, ARDs, RFCs) — GitLab, GitHub ou Bitbucket.

## Visão Geral

Esta skill permite:
- **Buscar** documentação do central-docs via API do vendor (GitLab / GitHub / Bitbucket)
- **Publicar** documentos aprovados via MR/PR (git flow seguro)
- **Sincronizar** automaticamente em /warm-up

## Pré-requisitos

1. **Token VCS** (GitLab `.npmrc`, GitHub `gh auth` / `GITHUB_TOKEN`, Bitbucket `BITBUCKET_TOKEN`)
2. **ENV.md** com variáveis do central-docs

> ℹ️ Cache local via `redis-cli` é opcional. Sem Redis, a busca vai direto na API.

> ⚠️ Token **nunca** vai no chat. GitLab: `.npmrc`. GitHub: `gh auth` ou `GITHUB_TOKEN`. Bitbucket: `BITBUCKET_TOKEN`.

### Configuração Mínima

```ini
# .windsurf/ENV.md
CENTRAL_DOCS_REPO=https://gitlab.com/org/group/central-docs.git
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=dev
SQUAD=core
WORKSPACE=meu-workspace
```

```ini
# .npmrc (projeto ou ~/.npmrc)
//gitlab.com/api/v4/packages/npm/:_authToken=glpat-seu-token-aqui
```

## Comandos Disponíveis

### Sincronizar Docs

```bash
# Sincronizar docs do squad
jarvis docs sync

# Modo silencioso (sem output)
jarvis docs sync --silent

# Modo verbose (mostra conteúdo)
jarvis docs sync --verbose
```

### Publicar Documento

```bash
# Publicar ARD
jarvis docs publish \
  --file ./docs/engineering/ard-api-wallet.md \
  --tipo ard \
  --feature api-wallet-auth-jwt

# Publicar PRD
jarvis docs publish \
  --file ./docs/product/prd-gestao-carteiras.md \
  --tipo prd \
  --feature gestao-carteiras

# Publicar Swagger/OpenAPI (YAML)
jarvis docs publish \
  --file ./docs/engineering/swagger/api-wallet.yaml \
  --tipo swagger \
  --feature wallet

# Com override de squad/workspace:
jarvis docs publish \
  --file ./docs/engineering/ard-api-wallet.md \
  --tipo ard \
  --feature api-wallet-auth-jwt \
  --squad core \
  --workspace meu-workspace
```

**Tipos válidos:** `prd`, `frd`, `ard`, `rfc`, `swagger`

## Estrutura do Repositório Central

```
central-docs/
└── {squad}/
    ├── index.md                      # Lista todos os docs do squad
    ├── product/
    │   └── {workspace}/
    │       ├── prd-{feature}.md
    │       └── frd-{feature}.md
    └── engineering/
        └── {workspace}/
            ├── ard-{feature}.md
            ├── rfc-{feature}.md
            └── swagger-{feature}.md  (ou api-{service}.yaml / api-{service}.json)
```

**Exemplos reais:**

```
central-docs/
└── core/
    ├── index.md
    ├── product/
    │   └── gestao-de-carteiras/
    │       ├── prd-gestao-carteiras.md
    │       └── frd-gestao-carteiras-onboarding.md
    └── engineering/
        └── api-wallet/
            ├── ard-api-wallet.md
            └── rfc-api-wallet-idempotencia.md
```

## Formato do index.md

O `index.md` fica na raiz do squad (`{squad}/index.md`) e lista todos os documentos organizados por área e produto:

```markdown
# core

## product

### gestao-de-carteiras
- [prd-gestao-carteiras.md](product/gestao-de-carteiras/prd-gestao-carteiras.md) | v1.2.0 | in_progress | jira: WAL-001 | tags: carteiras,onboarding
- [frd-gestao-carteiras-onboarding.md](product/gestao-de-carteiras/frd-gestao-carteiras-onboarding.md) | v1.0.0 | in_review | jira: WAL-123 | tags: onboarding,cadastro

## engineering

### api-wallet
- [ard-api-wallet.md](engineering/api-wallet/ard-api-wallet.md) | v2.1 | Finalizada | tags: arquitetura,rest,api
- [rfc-api-wallet-idempotencia.md](engineering/api-wallet/rfc-api-wallet-idempotencia.md) | Accepted | tags: idempotencia,redis
```

## Frontmatter Obrigatório

### PRD/FRD

```yaml
---
id: PRD-001
name: Gestão de Carteiras
version: 1.2.0
status: in_progress
task_link: https://jira.com/WAL-001
related_repo: api-wallet,wallet-worker
---
```

### ARD/RFC

```yaml
---
Status: Proposta
Data: 2026-03-10
Autor: João Silva
Versão: 1.0
---
```

## Integração com Workflows

### /warm-up

Carrega contexto do produto:

```markdown
✅ Docs sincronizados do central-docs
📊 5 documentos disponíveis:
   - 1 PRD(s)
   - 1 FRD(s)
   - 2 ARD(s)
   - 1 RFC(s)
```

### /eng.start

Busca docs relacionados ao Jira ID antes de iniciar feature.

### /eng.pre-pr

Detecta docs desatualizados e oferece publicação.

## Troubleshooting

### Token não encontrado

```
❌ Token GitLab não encontrado no .npmrc
```

**Solução:** Adicionar ao `.npmrc`:
```
//gitlab.com/api/v4/packages/npm/:_authToken=glpat-seu-token
```

### Arquivo não encontrado

```
❌ Arquivo não encontrado no central-docs: core/index.md
```

**Solução:** Verificar se o squad existe no central-docs ou criar o `index.md` do squad.

### Frontmatter inválido

```
❌ Campos obrigatórios ausentes no frontmatter de ARD:
  - Status
  - Data
```

**Solução:** Adicionar campos obrigatórios ao YAML.

## Arquitetura

### Componentes

```
bin/
├── commands/
│   ├── docs-sync.js           # CLI: jarvis docs sync
│   └── docs-publish.js        # CLI: jarvis docs publish
└── lib/
    ├── utils/
    │   ├── npmrc-parser.js    # Extrai token do .npmrc
    │   └── git-parser.js      # Parseia URL GitLab
    └── docs/
        ├── validate-frontmatter.js  # Valida YAML
        ├── fetch-file.sh      # Busca via API (cache redis-cli opcional)
        └── publish-file.sh    # Publica via API + MR
```

### Fluxo de Publicação

```
1. Validar frontmatter YAML
2. Extrair metadados (version, status, jira)
3. Criar branch: docs/{squad}/{area}/{produto}/{tipo}-{feature}
4. Commit via GitLab API:
   - Adicionar arquivo em {squad}/{area}/{produto}/{tipo}-{feature}.md
   - Atualizar {squad}/index.md
5. Criar MR → dev
6. Retornar URL do MR
```

## Variáveis de Ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `CENTRAL_DOCS_REPO` | Sim | - | URL do repo GitLab |
| `CENTRAL_DOCS_REF` | Não | `main` | Branch para leitura |
| `CENTRAL_DOCS_TARGET_BRANCH` | Não | `dev` | Branch para MRs |
| `CENTRAL_DOCS_CACHE_TTL` | Não | `3600` | TTL do cache (segundos) |
| `SQUAD` | Sim | - | Squad do usuário |
| `WORKSPACE` | Sim | - | Nome do workspace |

## Exemplos Completos

### Exemplo 1: Setup Inicial

```bash
# 1. Configurar token
echo '//gitlab.com/api/v4/packages/npm/:_authToken=glpat-xxx' >> .npmrc

# 2. Configurar ENV.md
cat >> .windsurf/ENV.md << EOF
CENTRAL_DOCS_REPO=https://gitlab.com/org/group/central-docs.git
CENTRAL_DOCS_REF=main
CENTRAL_DOCS_TARGET_BRANCH=dev
EOF

# 3. Sincronizar
jarvis docs sync
```

### Exemplo 2: Publicar ARD

```bash
# 1. Criar ARD localmente
cat > docs/engineering/ard-api-wallet-auth.md << EOF
---
Status: Proposta
Data: 2026-03-10
Autor: João Silva
Versão: 1.0
---

# ARD-CORE-API-AUTH — Autenticação JWT

...
EOF

# 2. Publicar
jarvis docs publish \
  --file docs/engineering/ard-api-wallet-auth.md \
  --tipo ard \
  --feature api-wallet-auth

# 3. Resultado
# ✅ MR criado: docs/core/engineering/api-wallet/ard-api-wallet-auth → dev
# URL: https://gitlab.com/.../merge_requests/42
```

## Referências

- [SKILL.md](SKILL.md) - Documentação completa da skill
- [GitLab API Docs](https://docs.gitlab.com/ee/api/) - API do GitLab
