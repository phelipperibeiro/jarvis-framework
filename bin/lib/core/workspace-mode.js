// Modo de trabalho do workspace (WORKSPACE_MODE): decide se a pasta que contém o `$IDE/` é
// um projeto único ou um workspace. O que define o modo é a RAIZ ser ou não um repositório,
// e não quantos repositórios existem dentro dela:
//   - raiz com `.git`                                  → "project" (o git já delimita o código)
//   - raiz sem `.git` e 1+ subpastas com `.git`        → "workspace"
//   - raiz sem `.git` e nenhuma subpasta com `.git`    → "project" (padrão)
// Caso ambíguo (raiz com `.git` e subpastas também com `.git`, como submódulos): "project" + aviso.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const WORKSPACE_MODES = ["workspace", "project"];

/** Subpastas diretas com `.git` (arquivo ou pasta). Ignora ocultas e `node_modules`. */
function listGitSubdirs(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules")
    .filter((e) => existsSync(join(dir, e.name, ".git")))
    .map((e) => e.name)
    .sort();
}

/**
 * A raiz é um repositório (tem `.git`, pasta ou arquivo)? É o critério do `.gitignore`:
 * só se cria ou altera o `.gitignore` de uma raiz versionada. Uma pasta sem nenhum `.git`
 * é `project` para o modo, mas não é versionada.
 * @param {string} dir
 * @returns {boolean}
 */
export function rootIsRepo(dir) {
  return existsSync(join(dir, ".git"));
}

/**
 * @param {string} workspaceDir - pasta que contém o `$IDE/`
 * @param {{ repos?: string[] }} [options] - `repos`: allowlist (WORKSPACE_REPOS); vazia = todas
 * @returns {{ mode: "workspace"|"project", repos: string[], warning: string|null }}
 */
export function detectWorkspaceMode(workspaceDir, { repos = [] } = {}) {
  const isRepo = rootIsRepo(workspaceDir);
  const allow = new Set(repos);
  const found = listGitSubdirs(workspaceDir).filter((n) => allow.size === 0 || allow.has(n));

  if (isRepo) {
    return {
      mode: "project",
      repos: [],
      warning: found.length
        ? "a raiz é um repositório e há subpastas com .git (submódulos ou repositórios aninhados): tratada como projeto único"
        : null,
    };
  }
  if (found.length >= 1) return { mode: "workspace", repos: found, warning: null };
  return { mode: "project", repos: [], warning: null };
}

/** Lê o valor do ENV: só `workspace` ou `project` (sem diferenciar maiúsculas); outro valor = null. */
export function normalizeWorkspaceMode(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return WORKSPACE_MODES.includes(v) ? v : null;
}
