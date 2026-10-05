/**
 * @fileoverview Busca um arquivo do central-docs (GitLab/GitHub/Bitbucket), com
 * cache Redis best-effort. Substitui `fetch-file.sh` (removido) — mesmo
 * comportamento, sem subprocess: chama `fetchRawFile` de `vcs/api.js` direto.
 * @module docs/fetch-file
 */

import { fetchRawFile } from "../vcs/api.js";
import { redisGet, redisSetex } from "./redis-cache.js";

/**
 * @param {string} filePath - Path do arquivo dentro do repo central-docs
 * @param {string} [ref] - Branch/ref (padrão: "main")
 * @param {Object} [opts]
 * @param {string} [opts.repo] - CENTRAL_DOCS_REPO (padrão: `process.env.CENTRAL_DOCS_REPO`)
 * @param {string|number} [opts.cacheTtl] - TTL do cache em segundos (padrão: `process.env.CENTRAL_DOCS_CACHE_TTL` ou 3600)
 * @returns {Promise<string>} conteúdo do arquivo
 * @throws {Error} sem `filePath`, sem `repo`, ou erro do adapter (404/401/403 — ver `fetchRawFile`)
 */
export async function fetchFile(filePath, ref = "main", opts = {}) {
  if (!filePath) {
    throw new Error("fetchFile: file-path é obrigatório");
  }

  const repo = opts.repo ?? process.env.CENTRAL_DOCS_REPO;
  if (!repo) {
    throw new Error("CENTRAL_DOCS_REPO não definido no ENV.md");
  }

  const cacheKey = `docs:${filePath}:${ref}`;
  const cached = redisGet(cacheKey);
  if (cached) return cached;

  const content = await fetchRawFile(repo, filePath, ref);

  redisSetex(cacheKey, opts.cacheTtl ?? process.env.CENTRAL_DOCS_CACHE_TTL ?? "3600", content);

  return content;
}
