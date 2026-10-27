import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGE = "jarvis-ai-framework";

/**
 * Compara duas versões `x.y.z` (aceita `v` na frente e ignora o sufixo, como `-beta.1`).
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1 | null} `null` se uma das duas não for uma versão legível
 */
export function compareVersions(a, b) {
  const parse = (v) => {
    const m = String(v ?? "")
      .trim()
      .match(/^v?(\d+)\.(\d+)\.(\d+)/);
    return m ? m.slice(1).map(Number) : null;
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  }
  return 0;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Cópia local do Jarvis no projeto, que é ignorada (o Jarvis é instalado só global).
 * @param {string} workspaceDir
 * @returns {{ version: string, source: string } | null} a versão instalada em `node_modules`,
 *   ou a faixa declarada no `package.json`; `null` sem nenhuma das duas
 */
export function localInstall(workspaceDir) {
  const installed = join(workspaceDir, "node_modules", PACKAGE, "package.json");
  if (existsSync(installed)) {
    const version = readJson(installed)?.version;
    if (version) return { version, source: `node_modules/${PACKAGE}` };
  }
  const pkg = readJson(join(workspaceDir, "package.json"));
  for (const field of ["dependencies", "devDependencies"]) {
    const range = pkg?.[field]?.[PACKAGE];
    if (range) return { version: range, source: `package.json (${field})` };
  }
  return null;
}
