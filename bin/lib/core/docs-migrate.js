// Documentos de trabalho nos caminhos antigos → docs/jarvis/… (`jarvis init --upgrade`).
// Mesmas regras do item 8 do Upgrade (C) do skill jarvis-init: conflito no destino pula,
// pasta antiga removida só se ficar vazia, `git mv` quando versionado, `related_discovery`
// reescrito pelo nome do arquivo e, na recusa, só chaves novas recebem o caminho antigo.
import {
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  renameSync,
  rmdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { join, resolve, relative, dirname, basename, isAbsolute, sep } from "node:path";
import { execFileSync } from "node:child_process";

const ENG_SUBDIRS = ["ARD", "RFC", "qa", "swagger", "openapi", "robots", "c4"];
const LEGACY_ENG_SUBDIRS = ["robots", "swagger", "openapi", "c4"];

/**
 * Resolve `$NOME` com as outras chaves do ENV, **em qualquer ordem**: upgrades antigos
 * acrescentaram `JARVIS_DOCS` no fim do arquivo, depois do `PROD_DOCS` que a usa.
 * Desconhecida (ex.: `$IDE`) ou ciclo fica literal.
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

const clean = (p) => p.replace(/^\.\//, "").replace(/\/+$/, "");

/** Pastas de documentos resolvidas, com os padrões do template quando faltam. */
export function docsFolders(env) {
  const docs = clean(env.get("DOCS_FOLDER") || "docs");
  const jarvis = clean(env.get("JARVIS_DOCS") || `${docs}/jarvis`);
  const prod = clean(env.get("PROD_DOCS") || `${jarvis}/product`);
  const eng = clean(env.get("ENG_DOCS") || `${jarvis}/engineering`);
  const discoveries = clean(env.get("DISCOVERIES_DOCS") || `${jarvis}/discoveries`);
  return { docs, jarvis, prod, eng, discoveries };
}

function inside(workspaceDir, rel) {
  if (isAbsolute(rel)) return false;
  const r = relative(workspaceDir, resolve(workspaceDir, rel));
  return r !== "" && !r.startsWith("..") && !isAbsolute(r);
}

function listFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(p));
    else if (entry.isFile()) files.push(p);
  }
  return files;
}

/** Pares pasta antiga → pasta nova, na ordem do item 8 + discoveries. */
function sourcePairs(f) {
  const pairs = [
    { from: `${f.docs}/product`, to: f.prod, discoveriesSub: true },
    ...ENG_SUBDIRS.map((s) => ({ from: `${f.docs}/engineering/${s}`, to: `${f.eng}/${s}` })),
    ...LEGACY_ENG_SUBDIRS.map((s) => ({ from: `docs/engineering/${s}`, to: `${f.eng}/${s}` })),
    { from: `${f.prod}/discoveries`, to: f.discoveries, discovery: true },
  ];
  const seen = new Set();
  return pairs.filter((p) => {
    if (p.from === p.to || seen.has(p.from)) return false;
    seen.add(p.from);
    return true;
  });
}

/**
 * Planeja a mudança de pasta (sem mexer em nada).
 * @param {string} workspaceDir — pasta que contém `.{ide}/`
 * @param {Map<string, string>} env — ENV já expandido (`expandEnv`)
 * @returns {{ moves: {from: string, to: string, discovery: boolean}[],
 *   skipped: {from: string, to: string, reason: string}[], sources: string[] }}
 *   Caminhos relativos ao workspace.
 */
export function planDocsMigration(workspaceDir, env) {
  const f = docsFolders(env);
  const moves = [];
  const skipped = [];
  const sources = [];

  for (const pair of sourcePairs(f)) {
    if (!inside(workspaceDir, pair.from) || !inside(workspaceDir, pair.to)) {
      skipped.push({ from: pair.from, to: pair.to, reason: "fora do workspace" });
      continue;
    }
    const fromAbs = join(workspaceDir, pair.from);
    if (!existsSync(fromAbs) || !statSync(fromAbs).isDirectory()) continue;

    let added = false;
    for (const fileAbs of listFiles(fromAbs)) {
      const rel = relative(fromAbs, fileAbs).split(sep).join("/");
      // docs/product/discoveries/* (layout antigo) vai direto para a pasta dos discoveries
      const toDiscoveries =
        pair.discovery || (pair.discoveriesSub && rel.startsWith("discoveries/"));
      const to = toDiscoveries
        ? `${f.discoveries}/${pair.discovery ? rel : rel.slice("discoveries/".length)}`
        : `${pair.to}/${rel}`;
      const from = `${pair.from}/${rel}`;
      if (from === to) continue;
      if (existsSync(join(workspaceDir, to)) || moves.some((m) => m.to === to)) {
        skipped.push({ from, to, reason: "conflito" });
        continue;
      }
      moves.push({ from, to, discovery: toDiscoveries });
      added = true;
    }
    if (added) sources.push(pair.from);
  }
  return { moves, skipped, sources };
}

function isTracked(fileAbs) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", basename(fileAbs)], {
      cwd: dirname(fileAbs),
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function removeEmptyDirs(dirAbs, stopAbs) {
  let dir = dirAbs;
  while (dir.startsWith(stopAbs) && dir !== stopAbs && existsSync(dir)) {
    if (readdirSync(dir).length > 0) break;
    rmdirSync(dir);
    dir = dirname(dir);
  }
}

function emptyDirsUnder(dirAbs) {
  if (!existsSync(dirAbs)) return;
  for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
    if (entry.isDirectory()) emptyDirsUnder(join(dirAbs, entry.name));
  }
  if (readdirSync(dirAbs).length === 0) rmdirSync(dirAbs);
}

/**
 * Aplica o plano: `git mv` se o arquivo é versionado, senão `rename`. Remove as pastas
 * antigas só se ficarem vazias e garante `{JARVIS_DOCS}/` no `.gitignore` do workspace.
 * @returns {{ moved: {from: string, to: string, discovery: boolean}[], errors: string[] }}
 */
export function applyDocsMigration(workspaceDir, plan, env) {
  const moved = [];
  const errors = [];
  for (const m of plan.moves) {
    const fromAbs = join(workspaceDir, m.from);
    const toAbs = join(workspaceDir, m.to);
    try {
      mkdirSync(dirname(toAbs), { recursive: true });
      if (isTracked(fromAbs)) {
        execFileSync("git", ["mv", fromAbs, toAbs], { cwd: dirname(fromAbs), stdio: "ignore" });
      } else {
        renameSync(fromAbs, toAbs);
      }
      moved.push(m);
    } catch (err) {
      errors.push(`${m.from}: ${err.message.split("\n")[0]}`);
    }
  }

  // Pastas antigas vazias saem; a pasta raiz dos documentos ($DOCS_FOLDER) sempre fica.
  const docsAbs = join(workspaceDir, docsFolders(env).docs);
  for (const src of plan.sources) {
    const srcAbs = join(workspaceDir, src);
    emptyDirsUnder(srcAbs);
    removeEmptyDirs(dirname(srcAbs), docsAbs);
  }

  if (moved.length > 0) ensureGitignore(workspaceDir, `${docsFolders(env).jarvis}/`);
  return { moved, errors };
}

function ensureGitignore(workspaceDir, line) {
  const p = join(workspaceDir, ".gitignore");
  const text = existsSync(p) ? readFileSync(p, "utf-8") : "";
  const bare = line.replace(/\/$/, "");
  if (text.split("\n").some((l) => [line, bare, `/${line}`, `/${bare}`].includes(l.trim()))) return;
  appendFileSync(p, `${text && !text.endsWith("\n") ? "\n" : ""}${line}\n`);
}

/**
 * Nos `.md` de `PROD_DOCS`, todo `related_discovery:` cujo nome de arquivo seja o de um
 * discovery movido passa ao caminho novo — inclusive valores que já estavam quebrados.
 * @returns {string[]} arquivos alterados (relativos ao workspace)
 */
export function rewriteRelatedDiscovery(workspaceDir, env, moved) {
  const byName = new Map(moved.filter((m) => m.discovery).map((m) => [basename(m.to), m.to]));
  if (byName.size === 0) return [];
  const prodAbs = join(workspaceDir, docsFolders(env).prod);
  if (!existsSync(prodAbs)) return [];

  const changed = [];
  for (const fileAbs of listFiles(prodAbs).filter((p) => p.endsWith(".md"))) {
    const text = readFileSync(fileAbs, "utf-8");
    const next = text.replace(
      /^(related_discovery:[ \t]*)(\S+)[ \t]*$/gm,
      (line, prefix, value) => {
        const to = byName.get(basename(value));
        return to && value !== to ? `${prefix}${to}` : line;
      }
    );
    if (next !== text) {
      writeFileSync(fileAbs, next);
      changed.push(relative(workspaceDir, fileAbs).split(sep).join("/"));
    }
  }
  return changed;
}

/**
 * Recusa em mover: o valor que as chaves **novas** recebem para continuar no caminho antigo.
 * Chave que já existe no ENV não muda (o upgrade só acrescenta).
 * @param {{moves: {from: string, discovery: boolean}[]}} plan
 * @param {string[]} addedKeys — chaves que o upgrade vai acrescentar
 * @returns {Record<string, string>}
 */
export function declineEnvValues(plan, addedKeys, env) {
  const added = new Set(addedKeys);
  const f = docsFolders(env);
  const out = {};
  if (added.has("DISCOVERIES_DOCS") && plan.moves.some((m) => m.discovery)) {
    out.DISCOVERIES_DOCS = "$PROD_DOCS/discoveries";
  }
  if (added.has("PROD_DOCS") && plan.moves.some((m) => m.from.startsWith(`${f.docs}/product/`))) {
    out.PROD_DOCS = "$DOCS_FOLDER/product";
  }
  if (added.has("ENG_DOCS") && plan.moves.some((m) => m.from.includes("/engineering/"))) {
    out.ENG_DOCS = "$DOCS_FOLDER/engineering";
  }
  return out;
}
