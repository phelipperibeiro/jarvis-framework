import { readFileSync, existsSync } from "node:fs";

import { join, isAbsolute, dirname, basename } from "node:path";

import { getIDEFolder, getIDEValues, isIDESupported } from "./config/ide-config.js";

function* walkAncestors(start) {
  let dir = start;
  while (true) {
    yield dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

function envsAt(dir, ideFilter = null) {
  const ides = ideFilter ? [ideFilter] : getIDEValues();
  const found = [];
  for (const ide of ides) {
    if (!isIDESupported(ide)) continue;
    const p = join(dir, `.${getIDEFolder(ide)}`, "ENV.md");
    if (existsSync(p)) found.push({ ide, path: p, root: dir });
  }
  return found;
}

/** Nome do workspace: pasta que contém $IDE/ (não o repo aberto). */
export function deriveWorkspaceName(envPath) {
  const parent = dirname(envPath);
  const name = basename(parent);
  if (name.startsWith(".")) return basename(dirname(parent));
  return name;
}

/**
 * Resolve o path do ENV.md com a seguinte precedência:
 *   1. --env-file (path explícito)
 *   2. --ide (ex: windsurf → .windsurf/ENV.md) — sobe pastas se estiver num repo filho
 *   3. JARVIS_ENV_FILE (variável de ambiente)
 *   4. IDE (variável de ambiente → .{ide}/ENV.md)
 *   5. Auto-detect (sobe até achar $IDE/ENV.md no workspace)
 *
 * Retorna { path, source, warnings, root }
 */
export function resolveEnvPath(cwd, flags = {}) {
  // 1. --env-file
  if (flags["env-file"]) {
    const p = isAbsolute(flags["env-file"]) ? flags["env-file"] : join(cwd, flags["env-file"]);
    if (!existsSync(p)) {
      throw new Error(
        `ENV.md não encontrado: ${p}\n` + `Dica: verifique o path passado em --env-file`
      );
    }
    return { path: p, source: "--env-file", warnings: [], root: dirname(dirname(p)) };
  }

  // 2. --ide (cwd e ancestrais — abre um repo filho e ainda acha o workspace)
  if (flags.ide) {
    if (!isIDESupported(flags.ide)) {
      throw new Error(
        `IDE não suportada: "${flags.ide}"\n` + `IDEs válidas: ${getIDEValues().join(", ")}`
      );
    }
    for (const dir of walkAncestors(cwd)) {
      const found = envsAt(dir, flags.ide);
      if (found.length === 1) {
        return {
          path: found[0].path,
          source: `--ide ${flags.ide}`,
          warnings: [],
          root: found[0].root,
        };
      }
    }
    throw new Error(
      `ENV.md não encontrado para --ide ${flags.ide} a partir de ${cwd}\n` +
        `Dica: rode jarvis init --ide ${flags.ide} na pasta do workspace`
    );
  }

  // 3. JARVIS_ENV_FILE
  if (process.env.JARVIS_ENV_FILE) {
    const p = isAbsolute(process.env.JARVIS_ENV_FILE)
      ? process.env.JARVIS_ENV_FILE
      : join(cwd, process.env.JARVIS_ENV_FILE);
    if (!existsSync(p)) {
      throw new Error(`ENV.md não encontrado (JARVIS_ENV_FILE): ${p}`);
    }
    return { path: p, source: "JARVIS_ENV_FILE", warnings: [], root: dirname(dirname(p)) };
  }

  // 4. IDE env var
  if (process.env.IDE && isIDESupported(process.env.IDE)) {
    for (const dir of walkAncestors(cwd)) {
      const found = envsAt(dir, process.env.IDE);
      if (found.length === 1) {
        return {
          path: found[0].path,
          source: `IDE=${process.env.IDE}`,
          warnings: [],
          root: found[0].root,
        };
      }
    }
  }

  // 5. Auto-detect (ancestral mais próximo com exatamente um ENV.md)
  for (const dir of walkAncestors(cwd)) {
    const found = envsAt(dir);
    if (found.length > 1) {
      const ides = found.map((f) => f.ide).join(" | ");
      throw new Error(
        `Múltiplos ENV.md encontrados em ${dir} (${ides}).\n` +
          `Especifique a IDE ativa. Exemplo: --ide claude`
      );
    }
    if (found.length === 1) {
      return {
        path: found[0].path,
        source: `auto-detect (${found[0].ide})`,
        warnings: [],
        root: found[0].root,
      };
    }
  }

  // Fallback: ENV.md na raiz (comportamento legado)
  return {
    path: join(cwd, "ENV.md"),
    source: "auto-detect (root)",
    warnings: [],
    root: cwd,
  };
}

/**
 * Lê e parseia o ENV.md do projeto.
 * @param {string} cwd - Diretório raiz do projeto
 * @param {string|null} envPath - Path explícito do ENV.md (opcional)
 * Retorna um objeto com todas as variáveis key=value encontradas.
 */
export function loadEnv(cwd, envPath = null) {
  const p = envPath ?? join(cwd, "ENV.md");
  if (!existsSync(p)) return {};

  const lines = readFileSync(p, "utf-8").split("\n");
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && value) env[key] = value;
  }

  if (!env.WORKSPACE) {
    env.WORKSPACE = deriveWorkspaceName(p);
  }

  return env;
}

/** `{workspace}/.jarvis` — sobe ancestrais até achar `$IDE/ENV.md`. */
export function getJarvisDir(cwd = process.cwd(), flags = {}) {
  try {
    const { root } = resolveEnvPath(cwd, flags);
    return join(root || cwd, ".jarvis");
  } catch {
    return join(cwd, ".jarvis");
  }
}
