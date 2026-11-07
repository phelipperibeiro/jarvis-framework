// Arquivos gerados pelo Jarvis que ficam fora do git no modo projeto (#227).
//
// No modo projeto a raiz do workspace é o repositório do time. O `.gitignore` é versionado, então
// escrever nele é alterar o repositório; o `.git/info/exclude` é local e não aparece no PR. Por isso:
//   - `AGENTS.md`, `CLAUDE.md` e `CDD-MIND-MAP.md` vão para o exclude;
//   - `.jarvis/`, `docs/jarvis/` e a pasta da IDE continuam no `.gitignore` (decisão Q1/Q3 da #227);
//   - `AGENTS.md`/`CLAUDE.md` já commitados só saem do índice (`git rm --cached`) com a confirmação da
//     pessoa, dada no Upgrade pelo skill (`jarvis untrack`). Nada aqui faz commit ou push.
// Falha do git ou da gravação nunca é silenciosa: vira `error`/`errors` no resultado, para o init avisar.
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

/** Variáveis que desviam o git para outro repositório (hooks, scripts): nunca herdadas do ambiente. */
const GIT_REDIRECT_VARS = Object.freeze(["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]);

function gitEnv() {
  const env = { ...process.env };
  for (const name of GIT_REDIRECT_VARS) delete env[name];
  return env;
}

/** Roda o git em `dir` sem shell, com o ambiente isolado e o stderr capturado; devolve a saída ou lança. */
function git(dir, args) {
  return execFileSync("git", args, {
    cwd: dir,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    env: gitEnv(),
  });
}

/** Primeira linha útil do stderr do git (senão, a da mensagem do erro). Nunca inclui a saída normal. */
function gitError(error) {
  const fromStderr = String(error?.stderr ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return fromStderr || String(error?.message ?? error).split("\n")[0];
}

/** Caminho do exclude e, se o git falhar, o motivo. */
function resolveExclude(dir) {
  try {
    const out = git(dir, ["rev-parse", "--git-path", "info/exclude"]).trim();
    if (!out) return { path: null, error: "o git não devolveu o caminho do exclude" };
    return { path: isAbsolute(out) ? out : resolve(dir, out), error: null };
  } catch (error) {
    return { path: null, error: gitError(error) };
  }
}

/**
 * Caminho do `info/exclude` que o git usa para `dir`. Vem de `git rev-parse --git-path`, então vale
 * também com `.git` em arquivo (worktree, submódulo).
 * @param {string} dir
 * @returns {string | null} `null` se o git falhar (sem git, sem repositório)
 */
export function gitExcludePath(dir) {
  return resolveExclude(dir).path;
}

/**
 * Garante `lines` no `.git/info/exclude` de `dir`, sem duplicar (reconhece a linha com e sem `/`
 * inicial; espaço no início é outro padrão para o git), cria a pasta `info/` se faltar e mantém a
 * quebra de linha do arquivo. Só age numa raiz versionada (com `.git`): no modo workspace não cria nem
 * altera nada. Falha do git ou da gravação não lança: vem em `error` (e `gitUnavailable` quando foi o git que
 * não respondeu, diferente de uma falha ao gravar o arquivo).
 * @param {string} dir
 * @param {readonly string[]} lines
 * @returns {{ path: string | null, added: string[], existing: string[], error: string | null, gitUnavailable: boolean }}
 */
export function ensureLocalExclude(dir, lines) {
  const result = { path: null, added: [], existing: [], error: null, gitUnavailable: false };
  if (!rootIsRepo(dir)) return result;
  const resolved = resolveExclude(dir);
  if (!resolved.path) {
    result.error = `o git não respondeu (${resolved.error})`;
    result.gitUnavailable = true;
    return result;
  }
  const path = resolved.path;
  result.path = path;

  try {
    const text = existsSync(path) ? readFileSync(path, "utf-8") : "";
    const present = new Set(text.split(/\r?\n/).map((l) => l.trimEnd()));
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
  } catch (error) {
    result.existing = [];
    result.error = `não foi possível gravar ${path}: ${error.code || String(error.message).split("\n")[0]}`;
  }
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
 * sem `.git` e arquivo que não está rastreado. Se o git recusar, o `reason` traz o motivo dele.
 * @param {string} dir
 * @param {string} name
 * @returns {{ ok: true, excludeAdded: string[], excludeError: string | null } | { ok: false, reason: string }}
 */
export function untrackFromIndex(dir, name) {
  if (!UNTRACKABLE_FILES.includes(name)) {
    return { ok: false, reason: `${name} não pode sair do git por este comando (só ${UNTRACKABLE_FILES.join(" e ")})` };
  }
  if (!rootIsRepo(dir)) {
    return { ok: false, reason: "a raiz não é um repositório (modo workspace): não há índice para alterar" };
  }
  let listed;
  try {
    listed = git(dir, ["ls-files", "--", name]).trim();
  } catch (error) {
    return { ok: false, reason: `git não respondeu (${gitError(error)})` };
  }
  if (listed === "") {
    return { ok: false, reason: `${name} não está versionado` };
  }
  try {
    git(dir, ["rm", "--cached", "--quiet", "--", name]);
  } catch (error) {
    return { ok: false, reason: `git rm --cached falhou: ${gitError(error)}` };
  }
  const exclude = ensureLocalExclude(dir, [name]);
  return { ok: true, excludeAdded: exclude.added, excludeError: exclude.error };
}

/** Entrada do `.gitignore` para a pasta da IDE (ex.: `.claude/`, `.windsurf/`). */
export function ideFolderEntry(ide) {
  return `.${getIDEFolder(ide)}/`;
}

/** Há arquivo rastreado sob `pathspec`? Raiz sem `.git` ou erro do git: não. */
function hasTrackedUnder(dir, pathspec) {
  if (!rootIsRepo(dir)) return false;
  try {
    return git(dir, ["ls-files", "--", pathspec]).trim() !== "";
  } catch {
    return false;
  }
}

/** A pasta da IDE já está rastreada? Ignorar não a tira do git; só avisamos. */
export function isIdeFolderTracked(dir, ide) {
  return hasTrackedUnder(dir, `.${getIDEFolder(ide)}`);
}

/** Grava `line` no `.gitignore` e diz se o arquivo mudou. Lança se o arquivo não puder ser lido/gravado. */
function addGitignoreLine(dir, line) {
  const path = join(dir, ".gitignore");
  const before = existsSync(path) ? readFileSync(path, "utf-8") : null;
  ensureGitignore(dir, line);
  const after = existsSync(path) ? readFileSync(path, "utf-8") : null;
  return before !== after;
}

/**
 * Tudo o que o modo projeto precisa no git (instalação e Upgrade usam a mesma função): as entradas
 * locais no exclude (menos as já rastreadas: `AGENTS.md`/`CLAUDE.md` são decisão do Upgrade e o mapa só
 * recebe aviso), a pasta da IDE e as `gitignoreLines` no `.gitignore`. Raiz sem `.git` (modo workspace):
 * não altera nada. Nunca lança por falha do git ou de gravação: git que não responde vira `warnings` (ambiente;
 * o init segue com saída 0) e falha ao gravar vira `errors` (setup incompleto; saída 1).
 * @param {{ dir: string, ide: string, gitignoreLines?: readonly string[] }} input
 * @returns {{
 *   isRepo: boolean,
 *   exclude: { path: string | null, added: string[], existing: string[], error: string | null, gitUnavailable: boolean },
 *   tracked: string[],
 *   trackedMap: boolean,
 *   ideEntry: string,
 *   ignoreAdded: string[],
 *   ideIgnoreAdded: boolean,
 *   ideFolderTracked: boolean,
 *   ignoredButTracked: string[],
 *   warnings: string[],
 *   errors: string[],
 * }}
 */
export function applyProjectGitSetup({ dir, ide, gitignoreLines = [] }) {
  const ideEntry = ideFolderEntry(ide);
  const base = {
    isRepo: false,
    exclude: { path: null, added: [], existing: [], error: null, gitUnavailable: false },
    tracked: [],
    trackedMap: false,
    ideEntry,
    ignoreAdded: [],
    ideIgnoreAdded: false,
    ideFolderTracked: false,
    ignoredButTracked: [],
    warnings: [],
    errors: [],
  };
  if (!rootIsRepo(dir)) return base;

  const trackedLocal = trackedFiles(dir, LOCAL_EXCLUDE_ENTRIES);
  const exclude = ensureLocalExclude(
    dir,
    LOCAL_EXCLUDE_ENTRIES.filter((entry) => !trackedLocal.includes(entry))
  );
  const warnings = exclude.gitUnavailable ? [exclude.error] : [];
  const errors = exclude.error && !exclude.gitUnavailable ? [exclude.error] : [];

  const ignoreAdded = [];
  for (const line of [ideEntry, ...gitignoreLines]) {
    try {
      if (addGitignoreLine(dir, line)) ignoreAdded.push(line);
    } catch (error) {
      errors.push(
        `não foi possível gravar ${join(dir, ".gitignore")}: ${error.code || String(error.message).split("\n")[0]}`
      );
      break;
    }
  }

  return {
    ...base,
    isRepo: true,
    exclude,
    tracked: trackedLocal.filter((name) => UNTRACKABLE_FILES.includes(name)),
    trackedMap: trackedLocal.includes("CDD-MIND-MAP.md"),
    ignoreAdded,
    ideIgnoreAdded: ignoreAdded.includes(ideEntry),
    ideFolderTracked: isIdeFolderTracked(dir, ide),
    ignoredButTracked: gitignoreLines.filter((line) => hasTrackedUnder(dir, line)),
    warnings,
    errors,
  };
}
