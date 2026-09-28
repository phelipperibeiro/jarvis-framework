#!/bin/bash
# Busca arquivo do central-docs (GitLab / GitHub / Bitbucket) + cache Redis

FILE_PATH="$1"
REF="${2:-main}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$FILE_PATH" ]; then
  echo "Uso: fetch-file.sh <file-path> [ref]" >&2
  exit 1
fi

if [ -z "$CENTRAL_DOCS_REPO" ]; then
  echo "Erro: CENTRAL_DOCS_REPO não definido no ENV.md" >&2
  exit 1
fi

CACHE_KEY="docs:${FILE_PATH}:${REF}"
CACHED=$(redis-cli GET "$CACHE_KEY" 2>/dev/null || echo "")

if [ -n "$CACHED" ]; then
  echo "$CACHED"
  exit 0
fi

ERR_FILE=$(mktemp)
RESPONSE=$(node "${SCRIPT_DIR}/../vcs/fetch-raw.js" "$FILE_PATH" "$REF" 2>"$ERR_FILE")
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  TTL="${CENTRAL_DOCS_CACHE_TTL:-3600}"
  echo "$RESPONSE" | redis-cli -x SETEX "$CACHE_KEY" "$TTL" >/dev/null 2>&1 || true
  rm -f "$ERR_FILE"
  echo "$RESPONSE"
  exit 0
fi

cat "$ERR_FILE" >&2
rm -f "$ERR_FILE"
exit $EXIT_CODE
