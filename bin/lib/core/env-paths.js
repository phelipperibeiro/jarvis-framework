/**
 * @fileoverview Expansão de `$VAR` nos caminhos do `ENV.md` (#228): uma função única para todo ponto
 * do CLI que lê um caminho, em vez de cada comando expandir (ou esquecer de expandir) do seu jeito.
 *
 * O `loadEnv` devolve os valores crus e continua assim: expandir tudo mudaria tokens e textos com
 * `$` e variáveis que o CLI não resolve de propósito (`RULES_FOLDER=.$IDE/rules`). A expansão vale
 * para as chaves de caminho (`PATH_KEYS`), e só nelas um `$` que sobra é erro.
 * @module core/env-paths
 */

import { isAbsolute, relative, resolve } from "node:path";

/**
 * Resolve `$NOME` com as outras chaves, **em qualquer ordem**: upgrades antigos acrescentaram
 * `JARVIS_DOCS` no fim do arquivo, depois do `PROD_DOCS` que a usa. A variável pode estar no
 * meio do valor (`.jarvis/$DOCS_FOLDER/jarvis`). Desconhecida (ex.: `$IDE`) ou ciclo fica literal;
 * `${NOME}` (com chaves) não é suportada.
 * @param {Map<string, string>} entries
 * @returns {Map<string, string>}
 */
export function expandEnv(entries) {
  const out = new Map();
  const resolving = new Set();
  const resolveKey = (key) => {
    if (out.has(key)) return out.get(key);
    if (!entries.has(key) || resolving.has(key)) return null;
    resolving.add(key);
    const value = entries
      .get(key)
      .replace(/\$([A-Z][A-Z0-9_]*)/g, (m, name) => resolveKey(name) ?? m);
    resolving.delete(key);
    out.set(key, value);
    return value;
  };
  for (const key of entries.keys()) resolveKey(key);
  return out;
}

/**
 * Chaves do `ENV.md` que o CLI lê como caminho. Um `$` que sobra em uma delas é erro de
 * configuração: sem o erro, o comando criaria (ou procuraria) uma pasta chamada `$NOME`.
 * @constant {ReadonlyArray<string>}
 */
export const PATH_KEYS = Object.freeze([
  "CENTRAL_DOCS_LOCATION",
  "SESSIONS_DIR",
  "DOCS_FOLDER",
  "JARVIS_DOCS",
  "ENG_DOCS",
  "PROD_DOCS",
  "DISCOVERIES_DOCS",
]);

/**
 * Valores do template do `ENV.md`, aplicados quando a chave falta ou está vazia.
 * @constant {Readonly<Record<string, string>>}
 */
export const ENV_PATH_DEFAULTS = Object.freeze({
  DOCS_FOLDER: "docs",
  JARVIS_DOCS: "$DOCS_FOLDER/jarvis",
  ENG_DOCS: "$JARVIS_DOCS/engineering",
  PROD_FOLDER_NAME: "product",
  PROD_DOCS: "$JARVIS_DOCS/$PROD_FOLDER_NAME",
  DISCOVERIES_FOLDER_NAME: "discoveries",
  DISCOVERIES_DOCS: "$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME",
  SESSIONS_DIR: ".jarvis/sessions",
});

/** Caminho do `ENV.md` com variável sem valor (ver `expandEnvPath`). */
export class EnvPathError extends Error {
  /**
   * @param {string} key
   * @param {string} value - Valor original da chave, antes da expansão
   * @param {string[]} leftover - O que ficou sem expandir (`$NOME`)
   * @param {string} [expanded] - Valor depois da expansão parcial (omitido quando igual ao original)
   */
  constructor(key, value, leftover, expanded = value) {
    super(
      `Caminho "${key}" do ENV.md com variável sem valor: "${value}"` +
        `${expanded !== value ? ` (expande para "${expanded}")` : ""} (sobrou: ${leftover.join(", ")}). ` +
        `Defina a variável no ENV.md ou corrija o caminho.`
    );
    this.name = "EnvPathError";
    this.key = key;
    this.value = value;
    this.leftover = leftover;
  }
}

/** O que sobra de uma variável não expandida: `$NOME` (letra ou `_` primeiro) ou `${...}`; `$` isolado ou no fim é texto. */
const LEFTOVER_RE = /\$[A-Za-z_][A-Za-z0-9_]*|\$\{[^}]*\}/g;

const toEntries = (env) => (env instanceof Map ? env : new Map(Object.entries(env || {})));

/** Padrões do template + as chaves do ENV (que vencem os padrões, exceto vazias). */
export function envWithDefaults(env) {
  const entries = new Map(Object.entries(ENV_PATH_DEFAULTS));
  for (const [key, value] of toEntries(env)) {
    if (value !== undefined && value !== null && String(value) !== "") entries.set(key, String(value));
  }
  return entries;
}

/**
 * Expande o valor de uma chave do `ENV.md` com as outras chaves e os padrões do template.
 * Se a chave é de caminho (`PATH_KEYS`) e ainda sobra `$NOME`, lança `EnvPathError`.
 * @param {Record<string, string> | Map<string, string>} env - ENV cru (`loadEnv`) ou `Map`
 * @param {string} key
 * @returns {string | undefined} valor expandido; `undefined` se a chave não existe nem tem padrão
 * @throws {EnvPathError}
 */
export function expandEnvPath(env, key) {
  const entries = envWithDefaults(env);
  const value = expandEnv(entries).get(key);
  if (value === undefined) return undefined;
  if (PATH_KEYS.includes(key)) {
    const leftover = value.match(LEFTOVER_RE);
    if (leftover) throw new EnvPathError(key, entries.get(key), [...new Set(leftover)], value);
  }
  return value;
}

/**
 * Expande `$VAR` em um texto avulso com o ENV e os padrões do template. Variável desconhecida
 * fica literal, sem erro.
 * @param {string} value
 * @param {Record<string, string> | Map<string, string>} env
 * @returns {string}
 */
export function expandEnvValue(value, env) {
  const entries = envWithDefaults(env);
  entries.set("\0VALUE", String(value));
  return expandEnv(entries).get("\0VALUE");
}

/**
 * Confere um ENV **já expandido** (`expandEnv`): nenhuma das chaves de caminho pedidas pode ter
 * `$` sobrando. Para quem recebe o `Map` expandido em vez do ENV cru (ex.: `docsFolders`).
 * @param {Map<string, string>} expanded
 * @param {ReadonlyArray<string>} [keys]
 * @throws {EnvPathError}
 */
export function assertPathsResolved(expanded, keys = PATH_KEYS) {
  for (const key of keys) {
    const value = expanded.get(key);
    if (value == null) continue;
    const leftover = value.match(LEFTOVER_RE);
    if (leftover) throw new EnvPathError(key, value, [...new Set(leftover)]);
  }
}

/** Subpasta de cada área dentro do `SESSIONS_DIR`. */
export const SESSION_AREAS = Object.freeze(["eng", "prod", "qa"]);

/**
 * O que o `jarvis init` cria para as sessões (#228): a pasta (de `SESSIONS_DIR`, com o padrão
 * `.jarvis/sessions`), as subpastas por área e as linhas do `.gitignore`. Sem efeito colateral.
 * `.jarvis/` fica sempre no `.gitignore` (estado local do framework); o caminho de sessões entra
 * também quando é relativo, dentro da raiz e fora de `.jarvis/`.
 * @param {Object} p
 * @param {string} p.workspaceDir - Pasta do workspace (a que contém `$IDE/`)
 * @param {Record<string, string> | Map<string, string>} [p.env] - ENV cru; ausente = só os padrões
 * @param {boolean} p.isRepo - A raiz tem `.git`
 * @returns {{ sessionsDir: string, areaDirs: string[], gitignore: string[], warnings: string[] }}
 * @throws {EnvPathError}
 */
export function planSessionsSetup({ workspaceDir, env = {}, isRepo }) {
  const value = expandEnvPath(env, "SESSIONS_DIR");
  const sessionsDir = resolve(workspaceDir, value); // absoluto vale como está; a barra final some
  const rel = relative(workspaceDir, sessionsDir);
  const isRoot = rel === "";
  const inside = !isRoot && !rel.startsWith("..") && !isAbsolute(rel);
  const gitignore = [];
  const warnings = [];
  if (isRepo) {
    gitignore.push(".jarvis/");
    const underJarvis = inside && (rel === ".jarvis" || rel.startsWith(".jarvis/") || rel.startsWith(".jarvis\\"));
    if (inside && !underJarvis) gitignore.push(`${rel.split("\\").join("/")}/`);
    else if (isRoot) {
      warnings.push(`SESSIONS_DIR (${value}) é a própria raiz do workspace: eng/, prod/ e qa/ ficam soltas nela e o .gitignore não as cobre.`);
    } else if (!inside) {
      warnings.push(`SESSIONS_DIR (${value}) fora da raiz do repositório: sem entrada no .gitignore para ele.`);
    }
  }
  return { sessionsDir, areaDirs: SESSION_AREAS.map((area) => resolve(sessionsDir, area)), gitignore, warnings };
}

/**
 * Confere de uma vez as chaves de caminho do ENV (cru): nenhuma pode ter `$` sem valor. Para o
 * comando validar antes de mexer em qualquer coisa (ex.: `jarvis init --upgrade`, `docs finalize`).
 * @param {Record<string, string> | Map<string, string>} env
 * @param {ReadonlyArray<string>} [keys]
 * @throws {EnvPathError}
 */
export function checkEnvPaths(env, keys = PATH_KEYS) {
  for (const key of keys) expandEnvPath(env, key);
}
