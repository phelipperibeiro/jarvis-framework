/**
 * @fileoverview Leitura do Central docs pelo adaptador configurado
 * (`CENTRAL_DOCS_STORAGE`), venha o conteúdo de onde vier.
 * @module docs/fetch-file
 */

import { loadEnv, resolveEnvPath } from "../env-loader.js";
import { getStorage } from "./storage/index.js";

/**
 * Carrega o ENV.md e devolve o adaptador do Central docs.
 * @param {Object} [flags] - `envFile`/`ide` (mesmas opções dos outros comandos)
 * @param {Object} [opts]
 * @param {string} [opts.cwd]
 * @param {Object} [opts.deps] - Dependências injetáveis do adaptador (testes)
 * @returns {{ env: Record<string, string>, root: string, storage: Object|null }}
 */
export function openStorageFromEnv(flags = {}, { cwd = process.cwd(), deps } = {}) {
  const { path, root } = resolveEnvPath(cwd, flags);
  const env = loadEnv(cwd, path);
  // O ENV.md lido aqui (com --ide/--env-file) segue até o gate do acesso no MR do Central docs.
  const storageDeps = { fileEnvResult: { vars: env, error: null }, ...deps };
  return { env, root, storage: getStorage(env, { root, deps: storageDeps }) };
}

/**
 * Lê um arquivo do Central docs.
 * @param {string} filePath - Caminho dentro do Central docs (ex: `CORE/index.md`)
 * @param {Object} [opts]
 * @param {Object} [opts.storage] - Adaptador já aberto; sem ele, abre pelo ENV.md
 * @param {Object} [opts.flags]
 * @returns {Promise<string>}
 * @throws {Error} sem `filePath`, Central docs desligado, ou `code = 404`
 */
export async function fetchFile(filePath, opts = {}) {
  if (!filePath) {
    throw new Error("fetchFile: file-path é obrigatório");
  }
  const storage = opts.storage ?? openStorageFromEnv(opts.flags).storage;
  if (!storage) {
    throw new Error("Central docs desligado (CENTRAL_DOCS_STORAGE vazio no ENV.md).");
  }
  return storage.fetch(filePath);
}
