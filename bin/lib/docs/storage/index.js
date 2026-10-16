/**
 * @fileoverview Fábrica dos adaptadores de armazenamento do Central docs.
 * O valor de `CENTRAL_DOCS_STORAGE` escolhe o adaptador; `CENTRAL_DOCS_LOCATION`
 * diz onde ele guarda. Hoje só existe o `filesystem` (com camada git opcional);
 * S3 e Google Drive são as issues #144 e #145.
 * @module docs/storage
 */

import { isAbsolute, resolve } from "node:path";
import { createFilesystemStorage } from "./filesystem.js";

/** @constant {ReadonlyArray<string>} Adaptadores disponíveis */
export const SUPPORTED_STORAGES = Object.freeze(["filesystem"]);

/**
 * Erro de configuração do Central docs (variável ausente, valor não suportado).
 */
export class StorageConfigError extends Error {}

/**
 * Resolve `CENTRAL_DOCS_LOCATION` a partir da pasta do workspace (a que contém `$IDE/`).
 * @param {string} location
 * @param {string} root - Pasta do workspace
 * @returns {string} caminho absoluto
 */
export function resolveLocation(location, root) {
  return isAbsolute(location) ? location : resolve(root, location);
}

/**
 * Devolve o adaptador configurado no ENV.md, ou `null` se o Central docs estiver desligado.
 *
 * @param {Record<string, string>} env - Variáveis do ENV.md (`loadEnv`)
 * @param {Object} opts
 * @param {string} opts.root - Pasta do workspace (`resolveEnvPath(...).root`)
 * @param {Object} [opts.deps] - Dependências injetáveis (testes): `runGit`, `createMergeRequest`
 * @returns {ReturnType<typeof createFilesystemStorage> | null}
 * @throws {StorageConfigError} valor de STORAGE não suportado, LOCATION ausente ou variável antiga
 */
export function getStorage(env, { root, deps } = {}) {
  const storage = (env.CENTRAL_DOCS_STORAGE || "").trim().toLowerCase();

  if (!storage) {
    if (env.CENTRAL_DOCS_REPO) {
      throw new StorageConfigError(
        "CENTRAL_DOCS_REPO não é mais usado. Rode o /jarvis-init e escolha Upgrade (C) para migrar " +
          "para CENTRAL_DOCS_STORAGE + CENTRAL_DOCS_LOCATION."
      );
    }
    return null;
  }

  if (!SUPPORTED_STORAGES.includes(storage)) {
    throw new StorageConfigError(
      `Armazenamento "${storage}" ainda não suportado. Use: ${SUPPORTED_STORAGES.join(", ")}.`
    );
  }

  if (!env.CENTRAL_DOCS_LOCATION) {
    throw new StorageConfigError(
      "CENTRAL_DOCS_LOCATION não definido no ENV.md (pasta do Central docs)."
    );
  }
  if (!root) {
    throw new StorageConfigError("getStorage: pasta do workspace (root) não informada.");
  }

  return createFilesystemStorage({
    location: resolveLocation(env.CENTRAL_DOCS_LOCATION, root),
    ref: env.CENTRAL_DOCS_REF || "main",
    targetBranch: env.CENTRAL_DOCS_TARGET_BRANCH || "main",
    reviewers: env.CENTRAL_DOCS_REVIEWERS || "",
    deps,
  });
}
