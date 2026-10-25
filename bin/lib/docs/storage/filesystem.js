/**
 * @fileoverview Adaptador `filesystem` do Central docs: uma pasta do disco
 * (dentro do workspace ou em qualquer caminho). Se a pasta tiver `.git` (clone
 * de um repositório de documentação), liga a camada git: `pull` antes de ler e
 * branch + commit + push + PR ao publicar.
 *
 * Todo comando externo usa `execFileSync` com argumentos (sem shell), e todo
 * caminho recebido é resolvido dentro da pasta (sem `..`).
 * @module docs/storage/filesystem
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createMergeRequest as defaultCreateMergeRequest, newMergeRequestUrl } from "../../vcs/api.js";
import { logger } from "../../utils/logger.js";
import { buildIndex, walkFiles } from "./build-index.js";

/**
 * Executa `git` na pasta informada, sem shell.
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string} stdout sem espaços nas pontas
 */
export function runGit(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Resolve um caminho relativo dentro de `root`, rejeitando o que sair dela.
 * @param {string} root
 * @param {string} rel
 * @returns {string} caminho absoluto
 * @throws {Error} caminho absoluto, com `..` que escape da pasta, ou vazio
 */
export function safePath(root, rel) {
  if (!rel || isAbsolute(rel)) {
    throw new Error(`Caminho inválido para o Central docs: "${rel}"`);
  }
  const full = resolve(root, rel);
  const fromRoot = relative(root, full);
  if (fromRoot === "" || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error(`Caminho fora da pasta do Central docs: "${rel}"`);
  }
  return full;
}

/**
 * @param {Object} cfg
 * @param {string} cfg.location - Pasta do Central docs (absoluta)
 * @param {string} [cfg.ref] - Branch lida no `pull` (CENTRAL_DOCS_REF)
 * @param {string} [cfg.targetBranch] - Branch base do PR (CENTRAL_DOCS_TARGET_BRANCH)
 * @param {string} [cfg.reviewers] - Revisores (vão na descrição do PR)
 * @param {Object} [cfg.deps] - `runGit` e `createMergeRequest` injetáveis (testes)
 */
export function createFilesystemStorage({
  location,
  ref = "main",
  targetBranch = "main",
  reviewers = "",
  deps = {},
}) {
  const git = deps.runGit ?? runGit;
  const createMergeRequest = deps.createMergeRequest ?? defaultCreateMergeRequest;
  const isGit = existsSync(join(location, ".git"));
  let pulled = false;

  /** `git pull --ff-only` uma vez por instância; falha vira aviso e a leitura segue local. */
  function pullOnce() {
    if (!isGit || pulled) return;
    pulled = true;
    try {
      git(["pull", "--ff-only", "origin", ref], location);
    } catch (error) {
      logger.warn(`⚠️  Não foi possível atualizar o Central docs (git pull): ${error.message.split("\n")[0]}`);
      logger.warn("   Usando a cópia local.");
    }
  }

  function ensureLocation() {
    if (!existsSync(location)) {
      throw new Error(
        `Pasta do Central docs não encontrada: ${location}\nCrie a pasta ou ajuste CENTRAL_DOCS_LOCATION no ENV.md (/jarvis-init).`
      );
    }
  }

  return {
    kind: "filesystem",
    location,
    isGit,

    /**
     * Lê um documento.
     * @param {string} path - Caminho dentro do Central docs (ex: `CORE/index.md`)
     * @returns {Promise<string>}
     * @throws {Error} com `code = 404` se o arquivo não existir
     */
    async fetch(path) {
      ensureLocation();
      pullOnce();
      const full = safePath(location, path);
      if (!existsSync(full)) {
        const err = new Error(`Arquivo não encontrado no Central docs: ${path}`);
        err.code = 404;
        throw err;
      }
      return readFileSync(full, "utf-8");
    },

    /**
     * Lista os `.md` sob um prefixo.
     * @param {string} prefix
     * @returns {Promise<string[]>} caminhos relativos à pasta, com `/`
     */
    async list(prefix) {
      ensureLocation();
      pullOnce();
      return walkFiles(safePath(location, prefix))
        .filter((f) => f.endsWith(".md"))
        .map((f) => relative(location, f).split(sep).join("/"));
    },

    /**
     * Regenera `{squad}/index.md`. Com `.git` e `scripts/build-index.sh` no repositório,
     * usa o script dele (o CI do repositório confere o índice com ele).
     * @param {string} squad
     * @returns {string} caminho relativo do índice
     */
    buildIndex(squad) {
      const script = join(location, "scripts", "build-index.sh");
      if (isGit && existsSync(script)) {
        execFileSync("bash", [script], { cwd: location, stdio: ["ignore", "pipe", "pipe"] });
      } else {
        buildIndex(location, squad);
      }
      return `${squad}/index.md`;
    },

    /**
     * Grava um documento e regenera o índice do squad.
     * Sem `.git`: copia e pronto. Com `.git`: branch → cópia → índice → commit → push → PR.
     * @param {Object} p
     * @param {string} p.localFile - Arquivo de origem
     * @param {string} p.destPath - Destino dentro do Central docs (`{SQUAD}/{área}/{produto}/{arquivo}`)
     * @param {string} p.squad
     * @param {string} p.tipo
     * @returns {Promise<{ destPath: string, indexPath: string, sha?: string, branch?: string, mr?: Object }>}
     */
    async publish({ localFile, destPath, squad, tipo }) {
      ensureLocation();
      const dest = safePath(location, destPath);

      if (!isGit) {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(localFile, dest);
        const indexPath = this.buildIndex(squad);
        return { destPath, indexPath };
      }

      const branch = `docs/${destPath.replace(extname(destPath), "")}`;
      git(["checkout", targetBranch], location);
      try {
        git(["pull", "--ff-only", "origin", targetBranch], location);
      } catch (error) {
        logger.warn(`⚠️  git pull falhou (${error.message.split("\n")[0]}); seguindo com a cópia local.`);
      }
      git(["checkout", "-b", branch], location);

      try {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(localFile, dest);
        const indexPath = this.buildIndex(squad);
        git(["add", "--", destPath, indexPath], location);
        git(["commit", "-m", `docs(${squad}): add ${tipo} ${basename(destPath)}`], location);
        const sha = git(["rev-parse", "HEAD"], location);

        git(["push", "-u", "origin", branch], location);
        const remoteUrl = git(["remote", "get-url", "origin"], location);
        let description = `## Documento\n\n- **Tipo**: ${tipo}\n- **Arquivo**: \`${destPath}\``;
        if (reviewers) description += `\n- **Revisores**: ${reviewers}`;
        let mr = null;
        try {
          mr = await createMergeRequest(remoteUrl, {
            source: branch,
            target: targetBranch,
            title: `docs(${squad}): ${tipo} ${basename(destPath)}`,
            description,
          });
        } catch (error) {
          // Indisponível (sem CLI ou sem login): o push já foi feito, o MR fica para abrir à mão.
          // Enviado com erro continua subindo: o MR pode ter sido criado.
          if (error.sent) throw error;
          let link = "";
          try {
            link = newMergeRequestUrl(remoteUrl, branch, targetBranch);
          } catch {
            // remote fora de github/gitlab: sem link
          }
          logger.warn(
            `⚠️  MR não aberto (${error.message.split("\n")[0]}). A branch ${branch} já está no remote` +
              (link ? `; abra o MR à mão: ${link}` : "; abra o MR à mão no host.")
          );
        }

        return { destPath, indexPath, sha, branch, mr };
      } finally {
        try {
          git(["checkout", targetBranch], location);
        } catch {
          // a branch de trabalho fica; o erro original (se houver) é o que importa
        }
      }
    },
  };
}
