// Arquivos gerados pelo Jarvis que ficam fora do git no modo projeto (#227).
//
// No modo projeto a raiz do workspace é o repositório do time. O `.gitignore` é versionado, então
// escrever nele é alterar o repositório; o `.git/info/exclude` é local e não aparece no PR. Por isso:
//   - `AGENTS.md`, `CLAUDE.md` e `CDD-MIND-MAP.md` vão para o exclude;
//   - `.jarvis/`, `docs/jarvis/` e a pasta da IDE continuam no `.gitignore` (decisão Q1/Q3 da #227);
//   - `AGENTS.md`/`CLAUDE.md` já commitados só saem do índice (`git rm --cached`) com a confirmação da
//     pessoa, dada no Upgrade pelo skill (`jarvis untrack`). Nada aqui faz commit ou push.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { getIDEFolder } from "../config/ide-config.js";
import { ensureGitignore } from "./docs-migrate.js";
import { rootIsRepo } from "./workspace-mode.js";

/** Entradas que o init mantém no `.git/info/exclude` (modo projeto). */
export const LOCAL_EXCLUDE_ENTRIES = Object.freeze(["AGENTS.md", "CLAUDE.md", "CDD-MIND-MAP.md"]);

/** Só estes dois podem sair do índice pelo `jarvis untrack`. */
export const UNTRACKABLE_FILES = Object.freeze(["AGENTS.md", "CLAUDE.md"]);

/** Roda o git em `dir` sem shell; devolve a saída ou lança. */
function git(dir, args) {
  return execFileSync("git", args, { cwd: dir, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
}

/**
 * Caminho do `info/exclude` que o git usa para `dir`. Vem de `git rev-parse --git-path`, então vale
 * também com `.git` em arquivo (worktree, submódulo).
 * @param {string} dir
 * @returns {string | null} `null` se o git falhar (sem git, sem repositório)
 */
export function gitExcludePath(dir) {
  try {
    const out = git(dir, ["rev-parse", "--git-path", "info/exclude"]).trim();
    if (!out) return null;
    return isAbsolute(out) ? out : resolve(dir, out);
  } catch {
    return null;
  }
}

/**
 * Garante `lines` no `.git/info/exclude` de `dir`, sem duplicar (reconhece a linha com e sem `/`
 * inicial), cria a pasta `info/` se faltar e mantém a quebra de linha do arquivo. Só age numa raiz
 * versionada (com `.git`): no modo workspace não cria nem altera nada.
 * @param {string} dir
 * @param {readonly string[]} lines
 * @returns {{ path: string | null, added: string[], existing: string[] }}
 */
export function ensureLocalExclude(dir, lines) {
  const result = { path: null, added: [], existing: [] };
  if (!rootIsRepo(dir)) return result;
  const path = gitExcludePath(dir);
  if (!path) return result;
  result.path = path;

  const text = existsSync(path) ? readFileSync(path, "utf-8") : "";
  const present = new Set(text.split(/\r?\n/).map((l) => l.trim()));
  const missing = [];
  for (const line of lines) {
    const bare = line.replace(/^\//, "");
    if (present.has(bare) || present.has(`/${bare}`)) result.existing.push(line);
    else missing.push(line);
  }
  if (missing.length === 0) return result;

  mkdirSync(dirname(path), { recursive: true });
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const prefix = text && !text.endsWith("\n") ? eol : "";
  appendFileSync(path, `${prefix}${missing.join(eol)}${eol}`);
  result.added = missing;
  return result;
}

/**
 * Quais de `names` estão rastreados (`git ls-files`) em `dir`. Raiz sem `.git` ou erro do git: nenhum.
 * @param {string} dir
 * @param {readonly string[]} [names]
 * @returns {string[]}
 */
export function trackedFiles(dir, names = UNTRACKABLE_FILES) {
  if (!rootIsRepo(dir)) return [];
  return names.filter((name) => {
    try {
      return git(dir, ["ls-files", "--", name]).trim() !== "";
    } catch {
      return false;
    }
  });
}

/**
 * Tira `name` do índice (`git rm --cached`, o arquivo local fica) e o põe no exclude. Nunca faz commit
 * nem push: a remoção fica staged para a pessoa revisar. Recusa nome fora de `UNTRACKABLE_FILES`, raiz
 * sem `.git` e arquivo que não está rastreado.
 * @param {string} dir
 * @param {string} name
 * @returns {{ ok: true, excludeAdded: string[] } | { ok: false, reason: string }}
 */
export function untrackFromIndex(dir, name) {
  if (!UNTRACKABLE_FILES.includes(name)) {
    return { ok: false, reason: `${name} não pode sair do git por este comando (só ${UNTRACKABLE_FILES.join(" e ")})` };
  }
  if (!rootIsRepo(dir)) {
    return { ok: false, reason: "a raiz não é um repositório (modo workspace): não há índice para alterar" };
  }
  if (trackedFiles(dir, [name]).length === 0) {
    return { ok: false, reason: `${name} não está versionado` };
  }
  try {
    git(dir, ["rm", "--cached", "--quiet", "--", name]);
  } catch (error) {
    return { ok: false, reason: `git rm --cached falhou: ${String(error.message).split("\n")[0]}` };
  }
  return { ok: true, excludeAdded: ensureLocalExclude(dir, [name]).added };
}

/** Entrada do `.gitignore` para a pasta da IDE (ex.: `.claude/`, `.windsurf/`). */
export function ideFolderEntry(ide) {
  return `.${getIDEFolder(ide)}/`;
}

/** A pasta da IDE já está rastreada? Ignorar não a tira do git; só avisamos. */
export function isIdeFolderTracked(dir, ide) {
  if (!rootIsRepo(dir)) return false;
  try {
    return git(dir, ["ls-files", "--", `.${getIDEFolder(ide)}`]).trim() !== "";
  } catch {
    return false;
  }
}

/**
 * Tudo o que o modo projeto precisa no git (instalação e Upgrade usam a mesma função): as entradas
 * locais no exclude (menos as geradas que já estão rastreadas, cuja saída é decisão do Upgrade) e a
 * pasta da IDE no `.gitignore`. Raiz sem `.git` (modo workspace): não altera nada.
 * @param {{ dir: string, ide: string }} input
 * @returns {{
 *   isRepo: boolean,
 *   exclude: { path: string | null, added: string[], existing: string[] },
 *   tracked: string[],
 *   ideEntry: string,
 *   ideIgnoreAdded: boolean,
 *   ideFolderTracked: boolean,
 * }}
 */
export function applyProjectGitSetup({ dir, ide }) {
  const ideEntry = ideFolderEntry(ide);
  const empty = {
    isRepo: false,
    exclude: { path: null, added: [], existing: [] },
    tracked: [],
    ideEntry,
    ideIgnoreAdded: false,
    ideFolderTracked: false,
  };
  if (!rootIsRepo(dir)) return empty;

  const tracked = trackedFiles(dir);
  const exclude = ensureLocalExclude(
    dir,
    LOCAL_EXCLUDE_ENTRIES.filter((entry) => !tracked.includes(entry))
  );

  const gitignorePath = join(dir, ".gitignore");
  const before = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf-8") : null;
  ensureGitignore(dir, ideEntry);
  const after = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf-8") : null;

  return {
    isRepo: true,
    exclude,
    tracked,
    ideEntry,
    ideIgnoreAdded: before !== after,
    ideFolderTracked: isIdeFolderTracked(dir, ide),
  };
}
