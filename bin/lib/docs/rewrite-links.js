/**
 * @fileoverview Converte os links dos `.md` de uma sessão para a publicação no Central docs
 * (#229, regra 6 de `rules-on-demand/doc-links-rules.md`). Os links do `architecture.md` e do
 * `plan.md` são relativos ao workspace de quem escreveu (`../../../../repo/arquivo.js#L10`):
 * fora dele e no Confluence quebram. Na publicação:
 *
 * - link para **outro arquivo publicado na mesma entrega** → link relativo dentro do Central docs;
 * - link para **código de um repositório** → URL do repositório no commit base
 *   (`{remote}/blob/{sha}/{caminho}#L{n}`; GitLab: `/-/blob/`); sem remote ou sem sha, vira texto;
 * - link para **sessão ou `docs/jarvis/`** não publicados, ou para qualquer outro lugar do disco →
 *   texto, sem link (mantém o rótulo);
 * - URL, âncora pura e `mailto:` ficam como estão; links dentro de código não são tocados.
 *
 * O arquivo original na sessão nunca é alterado: quem chama publica o texto convertido.
 * @module docs/rewrite-links
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, posix, relative, resolve } from "node:path";

/** Esquema de URL (`https:`, `mailto:`…): link absoluto, nunca convertido. */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Normaliza o remote do git para a URL web do repositório, sem credenciais e sem `.git`.
 * `git@host:dono/repo.git` e `ssh://git@host/dono/repo.git` viram `https://host/dono/repo`.
 * @param {string} remote
 * @returns {string|null} `null` se não der para entender
 */
export function normalizeRemote(remote) {
  if (!remote) return null;
  const r = remote.trim();
  let m = r.match(/^[\w.-]+@([^:/]+):(.+?)(?:\.git)?\/?$/); // scp-like: git@host:dono/repo.git
  if (m) return `https://${m[1]}/${m[2]}`;
  m = r.match(/^(?:ssh|git|https?):\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/);
  if (m) return `https://${m[1]}/${m[2]}`;
  return null;
}

/**
 * `true` se a URL do repositório é de um GitLab (o caminho do blob e o trecho de linhas mudam).
 * @param {string} webUrl
 */
export function isGitlab(webUrl) {
  return /^https:\/\/[^/]*gitlab/i.test(webUrl);
}

/**
 * Lê a linha `Commit base:` do cabeçalho de um documento de sessão. Aceita `{sha}` (vale para
 * qualquer repositório, chave `*`) e `{repo}@{sha}` (um por repositório, modo workspace).
 * @param {string} text
 * @returns {Map<string, string>} repositório (ou `*`) → sha
 */
export function parseCommitBase(text) {
  const bases = new Map();
  const line = text.match(/Commit base:\*{0,2}\s*(.+)/);
  if (!line) return bases;
  for (const m of line[1].matchAll(/(?:([A-Za-z0-9._-]+)@)?\b([0-9a-f]{7,40})\b/g)) {
    bases.set(m[1] || "*", m[2]);
  }
  return bases;
}

/**
 * Sha do commit base de um documento: do próprio texto ou, sem ele (ex.: `plan.md`), do
 * `architecture.md` da mesma pasta.
 * @param {string} text
 * @param {string} dir - Pasta do documento na sessão
 * @returns {Map<string, string>}
 */
export function commitBaseFor(text, dir) {
  const own = parseCommitBase(text);
  if (own.size > 0) return own;
  const arch = join(dir, "architecture.md");
  if (!existsSync(arch)) return own;
  try {
    return parseCommitBase(readFileSync(arch, "utf-8"));
  } catch {
    return own;
  }
}

/**
 * Cria o resolvedor de repositório de um caminho absoluto: a raiz git que o contém, o remote web
 * e o caminho dentro do repositório. Usa `git` sem shell; resultados em cache por raiz.
 * @param {Object} [deps]
 * @param {(args: string[], cwd: string) => string} [deps.runGit] - Injetável (testes)
 * @returns {(abs: string) => ({ repo: string, remote: string, relPath: string } | null)}
 */
export function makeRepoResolver({ runGit } = {}) {
  const git =
    runGit ??
    ((args, cwd) =>
      execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim());
  const cache = new Map(); // dir → { top, remote } | null

  const probe = (dir) => {
    if (cache.has(dir)) return cache.get(dir);
    let info = null;
    try {
      const top = git(["rev-parse", "--show-toplevel"], dir);
      const remote = normalizeRemote(git(["remote", "get-url", "origin"], dir));
      info = { top, remote };
    } catch {
      info = null;
    }
    cache.set(dir, info);
    return info;
  };

  return (abs) => {
    // o arquivo pode ter sido removido: sobe até a primeira pasta que existe
    let dir = dirname(abs);
    while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
    const info = probe(dir);
    if (!info || !info.remote) return null;
    const relPath = relative(info.top, abs).split("\\").join("/");
    if (!relPath || relPath.startsWith("..")) return null;
    return { repo: posix.basename(info.top.split("\\").join("/")), remote: info.remote, relPath };
  };
}

/** `true` se `abs` está em `dir` ou dentro dele. */
function isInside(abs, dir) {
  const rel = relative(dir, abs);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/**
 * Passa `fn(linha, estáEmCódigo)` por cada linha que não está num bloco cercado (``` ou ~~~),
 * preservando o restante byte a byte. `estáEmCódigo(posição)` diz se uma posição da linha cai
 * dentro de um trecho entre crases: um link cujo **texto** tem código (`[`x` (`a.js:5`)](...)`)
 * começa fora do trecho e é válido; um link escrito **dentro** do código é só um exemplo.
 * @param {string} text
 * @param {(line: string, inCode: (pos: number) => boolean) => string} fn
 * @returns {string}
 */
function mapOutsideFences(text, fn) {
  let fence = null;
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (fence) {
        if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
        return line;
      }
      if (m) {
        fence = m[1];
        return line;
      }
      const spans = [...line.matchAll(/`[^`\n]*`/g)].map((s) => [s.index, s.index + s[0].length]);
      return fn(line, (pos) => spans.some(([a, b]) => pos >= a && pos < b));
    })
    .join("\n");
}

/**
 * Converte os links relativos do texto de um documento de sessão (regra 6 de `doc-links-rules.md`).
 *
 * @param {string} text - Conteúdo do documento
 * @param {Object} ctx
 * @param {string} ctx.fileDir - Pasta (absoluta) onde o documento **foi escrito**, base dos links
 * @param {string} ctx.destPath - Destino do documento no Central docs (relativo à pasta, com `/`)
 * @param {Map<string, string>} ctx.published - Arquivo (absoluto) → destino no Central docs, dos
 *   arquivos publicados na mesma entrega
 * @param {(abs: string) => ({ repo: string, remote: string, relPath: string } | null)} ctx.repoOf
 * @param {Map<string, string>} ctx.commitBase - De `parseCommitBase`/`commitBaseFor`
 * @param {string[]} [ctx.localOnlyDirs] - Pastas que só existem no disco local (sessão,
 *   `docs/jarvis/`): link para elas nunca vira URL
 * @returns {{ text: string, converted: number, dropped: number, changed: boolean }}
 */
export function rewriteLinksForCentral(text, ctx) {
  const stats = { converted: 0, dropped: 0 };
  const localOnly = ctx.localOnlyDirs ?? [];
  const re = /(!?)\[([^\]]*)\]\(\s*(?:<([^>\n]+)>|([^)\s]+))(\s+"[^"]*")?\s*\)/g;

  const rewriteLine = (line, inCode) =>
    line.replace(re, (whole, bang, label, angled, plain, title, offset) => {
      if (inCode(offset)) return whole; // exemplo de sintaxe dentro de código
      const raw = angled ?? plain;
      if (SCHEME.test(raw) || raw.startsWith("#")) return whole;
      const hashAt = raw.indexOf("#");
      const rawPath = hashAt === -1 ? raw : raw.slice(0, hashAt);
      const fragment = hashAt === -1 ? "" : raw.slice(hashAt);
      if (!rawPath) return whole;

      let decoded = rawPath;
      try {
        decoded = decodeURIComponent(rawPath);
      } catch {
        // %-sequência inválida: usa o texto como está
      }
      const abs = resolve(ctx.fileDir, decoded);
      const drop = () => {
        stats.dropped++;
        return label || (bang ? "" : rawPath);
      };

      // 1) outro arquivo publicado na mesma entrega
      const target = ctx.published.get(abs);
      if (target) {
        stats.converted++;
        const rel = posix.relative(posix.dirname(ctx.destPath), target) || posix.basename(target);
        return `${bang}[${label}](${rel}${fragment}${title ?? ""})`;
      }

      // 2) só existe no disco local (sessão, docs/jarvis): texto
      if (localOnly.some((dir) => abs === dir || isInside(abs, dir))) return drop();

      // 3) código de um repositório: URL do blob no commit base
      const repo = ctx.repoOf(abs);
      const sha = repo ? (ctx.commitBase.get(repo.repo) ?? ctx.commitBase.get("*")) : null;
      if (repo && sha) {
        stats.converted++;
        const gitlab = isGitlab(repo.remote);
        const base = `${repo.remote}${gitlab ? "/-" : ""}/blob/${sha}/${repo.relPath}`;
        let frag = fragment;
        if (gitlab) frag = frag.replace(/^#L(\d+)-L(\d+)$/, "#L$1-$2");
        return `${bang}[${label}](${base}${frag})`;
      }

      // 4) qualquer outro lugar do disco, ou sem remote/sha: texto
      return drop();
    });

  const out = mapOutsideFences(text, rewriteLine);
  return { text: out, converted: stats.converted, dropped: stats.dropped, changed: out !== text };
}
