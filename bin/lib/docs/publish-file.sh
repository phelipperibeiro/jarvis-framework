#!/bin/bash
# Publica documento no central-docs (GitLab / GitHub / Bitbucket) via branch + MR/PR

set -e

LOCAL_FILE="$1"      # Ex: ./docs/engineering/ard-api-wallet.md
TIPO="$2"            # prd|frd|ard|rfc
FEATURE="$3"         # Ex: api-wallet-auth-jwt

# Resolver path absoluto do script (independente de cwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$LOCAL_FILE" ] || [ -z "$TIPO" ] || [ -z "$FEATURE" ]; then
  echo "Uso: publish-file.sh <local-file> <tipo> <feature>" >&2
  echo "Tipos válidos: prd, frd, ard, rfc, swagger, qa-report" >&2
  exit 1
fi

if [ ! -f "$LOCAL_FILE" ]; then
  echo "Erro: Arquivo não encontrado: $LOCAL_FILE" >&2
  exit 1
fi

# Detectar IDE directory
if [ -d ".windsurf" ]; then
  IDE=".windsurf"
elif [ -d ".claude" ]; then
  IDE=".claude"
elif [ -d ".cursor" ]; then
  IDE=".cursor"
elif [ -d ".vscode" ]; then
  IDE=".vscode"
else
  echo "Erro: IDE directory não encontrado (.windsurf, .claude, .cursor, .vscode)" >&2
  exit 1
fi

# 1. Ler ENV.md (se não houver override)
if [ -n "$SQUAD_OVERRIDE" ] && [ -n "$WORKSPACE_OVERRIDE" ]; then
  # Usar override das variáveis de ambiente
  SQUAD="$SQUAD_OVERRIDE"
  WORKSPACE="$WORKSPACE_OVERRIDE"
else
  # Ler do ENV.md
  if [ ! -f "$IDE/ENV.md" ]; then
    echo "Erro: ENV.md não encontrado em $IDE/" >&2
    echo "Ou passe --squad e --workspace via CLI" >&2
    exit 1
  fi

  SQUAD=$(grep '^SQUAD=' "$IDE/ENV.md" | cut -d'=' -f2 | tr -d ' ')
  WORKSPACE=$(grep '^WORKSPACE=' "$IDE/ENV.md" | cut -d'=' -f2 | tr -d ' ')
  
  if [ -z "$SQUAD" ] || [ -z "$WORKSPACE" ]; then
    echo "Erro: SQUAD ou WORKSPACE não definidos no ENV.md" >&2
    echo "Ou passe --squad e --workspace via CLI" >&2
    exit 1
  fi
fi

TARGET_BRANCH="${CENTRAL_DOCS_TARGET_BRANCH:-dev}"

if [ -z "$CENTRAL_DOCS_REPO" ]; then
  echo "Erro: CENTRAL_DOCS_REPO não definido no ENV.md" >&2
  exit 1
fi

# 2. Validar frontmatter
echo "Validando frontmatter..."
node --input-type=module -e "
  import { validateFrontmatter } from 'file://${SCRIPT_DIR}/validate-frontmatter.js';
  try {
    validateFrontmatter('$LOCAL_FILE', '$TIPO');
    console.log('✅ Frontmatter válido');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
"

if [ $? -ne 0 ]; then
  exit 1
fi

# 3. Extrair metadados
METADATA=$(node --input-type=module -e "
  import { extractMetadata } from 'file://${SCRIPT_DIR}/validate-frontmatter.js';
  const metadata = extractMetadata('$LOCAL_FILE');
  console.log(JSON.stringify(metadata));
")

VERSION=$(echo "$METADATA" | jq -r '.version // "1.0.0"')
STATUS=$(echo "$METADATA" | jq -r '.status // "draft"')
JIRA=$(echo "$METADATA" | jq -r '.jira // ""')
DOC_NAME=$(echo "$METADATA" | jq -r '.name // ""')

# 4. Definir paths
if [ "$TIPO" = "prd" ] || [ "$TIPO" = "frd" ]; then
  DEST_PATH="${SQUAD}/${WORKSPACE}/product/${TIPO}-${FEATURE}.md"
  AREA="product"
elif [ "$TIPO" = "ard" ]; then
  DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/ARD/${TIPO}-${FEATURE}.md"
  AREA="engineering"
elif [ "$TIPO" = "rfc" ]; then
  DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/RFC/${TIPO}-${FEATURE}.md"
  AREA="engineering"
elif [ "$TIPO" = "swagger" ]; then
  # Detectar extensão do arquivo (yaml, json ou md)
  FILE_EXT="${LOCAL_FILE##*.}"
  if [ "$FILE_EXT" = "yaml" ] || [ "$FILE_EXT" = "yml" ]; then
    DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/swagger/api-${FEATURE}.yaml"
  elif [ "$FILE_EXT" = "json" ]; then
    DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/swagger/api-${FEATURE}.json"
  else
    # Default para .md (wrapper com metadados)
    DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/swagger/swagger-${FEATURE}.md"
  fi
  AREA="engineering"
elif [ "$TIPO" = "qa-report" ]; then
  DEST_PATH="${SQUAD}/${WORKSPACE}/engineering/qa/qa-report-${FEATURE}.md"
  AREA="engineering"
else
  echo "Erro: Tipo inválido: $TIPO" >&2
  echo "Tipos válidos: prd, frd, ard, rfc, swagger, qa-report" >&2
  exit 1
fi

INDEX_PATH="${SQUAD}/${WORKSPACE}/index.md"
BRANCH_NAME="docs/${SQUAD}/${WORKSPACE}/${TIPO}-${FEATURE}"

echo ""
echo "📋 Resumo da Publicação:"
echo "  Squad: $SQUAD"
echo "  Workspace: $WORKSPACE"
echo "  Tipo: $TIPO"
echo "  Feature: $FEATURE"
echo "  Destino: $DEST_PATH"
echo "  Branch: $BRANCH_NAME → $TARGET_BRANCH"
echo ""

# 5–6. Token e parse do repo ficam no adapter VCS (api.js)

# 7. Ler conteúdo do arquivo local e encodar em base64
FILE_CONTENT=$(cat "$LOCAL_FILE" | base64)

# 8. Buscar index.md atual
echo "Buscando index.md do workspace..."
INDEX_CONTENT=$(bash "${SCRIPT_DIR}/fetch-file.sh" "$INDEX_PATH" "$TARGET_BRANCH" 2>/dev/null || echo "")

if [ -z "$INDEX_CONTENT" ]; then
  echo "⚠️  index.md não encontrado, será criado"
  INDEX_ACTION="create"
  INDEX_CONTENT="# $WORKSPACE

**Squad:** $SQUAD

## $AREA

"
else
  INDEX_ACTION="update"
fi

# 9. Adicionar nova linha ao index.md
NEW_LINE="- [${TIPO}-${FEATURE}.md](${AREA}/${TIPO}-${FEATURE}.md) | v${VERSION} | ${STATUS}"
[ -n "$JIRA" ] && NEW_LINE="${NEW_LINE} | jira: ${JIRA}"
[ -n "$DOC_NAME" ] && NEW_LINE="${NEW_LINE} | ${DOC_NAME}"

# Adicionar linha na seção correta
UPDATED_INDEX=$(echo "$INDEX_CONTENT" | awk -v line="$NEW_LINE" -v area="$AREA" '
  /^## (product|engineering)/ {
    print
    if ($2 == area) {
      found = 1
      getline
      print line
    }
    next
  }
  { print }
  END {
    if (!found) {
      print ""
      print "## " area
      print line
    }
  }
')

UPDATED_INDEX_B64=$(echo "$UPDATED_INDEX" | base64)

# 10. Criar commit via adapter VCS
echo "Criando branch e commit..."

COMMIT_JSON=$(mktemp)
cat > "$COMMIT_JSON" <<EOF
{
  "branch": $(printf '%s' "$BRANCH_NAME" | jq -Rs .),
  "startBranch": $(printf '%s' "$TARGET_BRANCH" | jq -Rs .),
  "message": $(printf '%s' "docs(${SQUAD}): add ${TIPO} ${FEATURE}" | jq -Rs .),
  "files": [
    {
      "path": $(printf '%s' "$DEST_PATH" | jq -Rs .),
      "contentBase64": $(printf '%s' "$FILE_CONTENT" | jq -Rs .),
      "action": "create"
    },
    {
      "path": $(printf '%s' "$INDEX_PATH" | jq -Rs .),
      "contentBase64": $(printf '%s' "$UPDATED_INDEX_B64" | jq -Rs .),
      "action": $(printf '%s' "$INDEX_ACTION" | jq -Rs .)
    }
  ]
}
EOF

COMMIT_RESULT=$(node --input-type=module -e "
  import { readFileSync } from 'node:fs';
  import { commitFiles } from 'file://${SCRIPT_DIR}/../vcs/api.js';
  const opts = JSON.parse(readFileSync('$COMMIT_JSON', 'utf-8'));
  const result = await commitFiles(process.env.CENTRAL_DOCS_REPO, opts);
  console.log(JSON.stringify(result));
" 2>&1)
COMMIT_EXIT=$?
rm -f "$COMMIT_JSON"

if [ $COMMIT_EXIT -ne 0 ]; then
  echo "❌ Erro ao criar commit:" >&2
  echo "$COMMIT_RESULT" >&2
  exit 1
fi

COMMIT_SHA=$(echo "$COMMIT_RESULT" | jq -r '.sha')
echo "✅ Commit criado: $COMMIT_SHA"

# 11. Criar MR/PR
echo "Criando Merge/Pull Request..."

MR_DESCRIPTION="## Documento

- **Tipo**: ${TIPO}
- **Workspace**: ${WORKSPACE}
- **Feature**: ${FEATURE}"

[ -n "$JIRA" ] && MR_DESCRIPTION="${MR_DESCRIPTION}
- **Card**: ${JIRA}"

[ -n "$DOC_NAME" ] && MR_DESCRIPTION="${MR_DESCRIPTION}
- **Nome**: ${DOC_NAME}"

BODY_FILE=$(mktemp)
printf '%s' "$MR_DESCRIPTION" > "$BODY_FILE"

MR_RESULT=$(node "${SCRIPT_DIR}/../vcs/create-merge.js" \
  --repo "$CENTRAL_DOCS_REPO" \
  --source "$BRANCH_NAME" \
  --target "$TARGET_BRANCH" \
  --title "docs(${SQUAD}): ${TIPO} ${FEATURE}" \
  --body-file "$BODY_FILE" 2>&1)
MR_EXIT=$?
rm -f "$BODY_FILE"

if [ $MR_EXIT -ne 0 ]; then
  echo "❌ Erro ao criar MR/PR:" >&2
  echo "$MR_RESULT" >&2
  exit 1
fi

MR_URL=$(echo "$MR_RESULT" | tail -1 | jq -r '.url // empty')
MR_IID=$(echo "$MR_RESULT" | tail -1 | jq -r '.iid // empty')

echo ""
echo "✅ Merge/Pull Request criado com sucesso!"
echo ""
echo "  #${MR_IID}: ${BRANCH_NAME} → ${TARGET_BRANCH}"
echo "  URL: ${MR_URL}"
echo ""

# 12. Invalidar cache Redis
redis-cli DEL "docs:${INDEX_PATH}:${TARGET_BRANCH}" >/dev/null 2>&1 || true
redis-cli DEL "docs:${INDEX_PATH}:main" >/dev/null 2>&1 || true

echo "🔄 Cache Redis invalidado"
echo ""
echo "✅ Publicação concluída!"
