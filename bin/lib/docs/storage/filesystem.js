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
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createMergeRequest as defaultCreateMergeRequest, newMergeRequestUrl } from "../../vcs/api.js";
import { logger } from "../../utils/logger.js";
import { buildIndex, walkFiles } from "./build-index.js";
import { archiveEntries } from "../finish-delivery.js";
import { planCentralMigration, applyCentralMigration } from "../migrate-central.js";

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

/** @param {Buffer} buffer @returns {string} sha256 em hex */
function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Nome da versão `n` de um destino: `-v{n}` antes da extensão (`architecture.md` →
 * `architecture-v1.md`; sem extensão, no fim). A subpasta é preservada.
 * @param {string} destPath
 * @param {number} n - 1, 2…
 * @returns {string}
 */
export function versionedName(destPath, n) {
  const ext = extname(destPath);
  return `${destPath.slice(0, destPath.length - ext.length)}-v${n}${ext}`;
}

/**
 * Versionamento por hash dos arquivos que vêm de uma sessão (Q6 e Q10 da #229). Compara o
 * conteúdo de `localFile` com o destino e com as versões já publicadas:
 * - destino inexistente: grava no nome original;
 * - algum candidato (original, `-v1`, `-v2`…) com o mesmo hash: não grava (`skipped`);
 * - todos os candidatos existentes diferem: grava no primeiro `-v{n}` livre.
 * Nunca apaga nem mescla: a versão anterior permanece (decisão da Q6).
 * @param {string} location - Pasta do Central docs
 * @param {string} destPath - Destino pedido (relativo à pasta)
 * @param {string} localFile
 * @returns {{ destPath: string, skipped: boolean, hash: string }} destino efetivo
 */
export function pickVersionedDest(location, destPath, localFile) {
  const hash = sha256(readFileSync(localFile));
  for (let n = 0; n < 10000; n++) {
    const candidate = n === 0 ? destPath : versionedName(destPath, n);
    const full = safePath(location, candidate);
    if (!existsSync(full)) return { destPath: candidate, skipped: false, hash };
    if (sha256(readFileSync(full)) === hash) return { destPath: candidate, skipped: true, hash };
  }
  throw new Error(`Versões demais de "${destPath}" no Central docs (mais de 10000).`);
}

/**
 * `true` se não há nada staged para commitar (#220, rodada 2 item 2, N6): rodar de novo a
 * publicação/arquivamento/migração de um conteúdo já idêntico ao que está em `targetBranch`
 * (ex.: depois do PR anterior já ter sido mergeado) copiava os mesmos bytes, `git add` não
 * marcava nada como alterado, e o `git commit` seguinte quebrava com "nothing to commit" em
 * vez de ser um no-op.
 * @param {(args: string[], cwd: string) => string} git
 * @param {string} cwd
 * @returns {boolean}
 */
function nothingStaged(git, cwd) {
  try {
    git(["diff", "--cached", "--quiet"], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * O caminho está no commit atual (`HEAD`) da branch aberta? Staged ou untracked **não** contam:
 * só o que já foi commitado é conteúdo publicado (`git cat-file -e HEAD:<path>`).
 * @param {(args: string[], cwd: string) => string} git
 * @param {string} cwd
 * @param {string} path - Relativo a `cwd`
 * @returns {boolean}
 */
function inHead(git, cwd, path) {
  try {
    git(["cat-file", "-e", `HEAD:${path}`], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * O que já estava na pasta antes do lote e não é do `HEAD`: arquivos untracked e arquivos
 * staged por outro motivo. A limpeza de um lote que falhou não pode tocar neles (#229).
 * @param {(args: string[], cwd: string) => string} git
 * @param {string} cwd
 * @returns {Set<string>} caminhos relativos a `cwd`
 */
function snapshotLocalState(git, cwd) {
  const lines = (args) => {
    try {
      return git(args, cwd).split("\n").map((l) => l.trim()).filter(Boolean);
    } catch {
      return [];
    }
  };
  return new Set([
    ...lines(["ls-files", "--others", "--exclude-standard"]),
    ...lines(["diff", "--cached", "--name-only"]),
  ]);
}

/**
 * Limpeza best-effort de uma branch de trabalho (#220, rodada 2 item 3): quando a cópia de um
 * lote falha antes do primeiro commit (ex.: `localFile` que não existe mais no meio do lote),
 * o arquivo já copiado fica untracked na working tree, e a branch criada por `checkout -B`
 * nunca mais é referenciada — lixo que se acumula a cada falha, numa cópia persistente do
 * Central docs. Só age quando a branch está **sem nenhum commit** além de `targetBranch` (0
 * ahead): com commit, pode não ter sido empurrado ainda, e apagar a branch local perderia o
 * único lugar onde ele existe — nesse caso, mantém o comportamento de sempre (branch fica).
 * @param {(args: string[], cwd: string) => string} git
 * @param {string} cwd
 * @param {string} targetBranch
 * @param {string} branch
 * @param {string[]} candidatePaths - Destinos que o lote tentou copiar (caminhos relativos a `cwd`)
 * @param {Set<string>} [preExisting] - O que já estava na pasta antes do lote (`snapshotLocalState`)
 *
 * Para cada candidato:
 * - **no `HEAD`** (já commitado na branch alvo, como a sessão republicada igual ou o `home.md`): é
 *   conteúdo publicado, nunca é apagado nem revertido (#229);
 * - **fora do `HEAD`** e que o lote criou: se um `git add` ficou no índice (o commit falhou, por
 *   hook, identidade ou assinatura), o `git reset` o tira de lá, e o arquivo é removido, para a
 *   próxima publicação regravar e commitar de verdade. Sem isso, a cópia ficava só no índice local,
 *   a republicação a via como "igual" e o `--force` apagava a sessão sem nada ter ido ao remote;
 * - que **já estava na pasta antes do lote** (untracked ou staged por outro motivo): não é tocado.
 */
function cleanupOrphanBranch(git, cwd, targetBranch, branch, candidatePaths, preExisting = new Set()) {
  try {
    const ahead = git(["rev-list", "--count", `${targetBranch}..${branch}`], cwd).trim();
    if (ahead !== "0") return; // pode ter commit não empurrado: não apaga
    git(["branch", "-D", branch], cwd);
    for (const p of candidatePaths) {
      try {
        if (preExisting.has(p) || inHead(git, cwd, p)) continue;
        try {
          git(["reset", "-q", "--", p], cwd);
        } catch {
          // sem entrada no índice: nada a desfazer
        }
        if (existsSync(join(cwd, p))) unlinkSync(join(cwd, p));
      } catch {
        // melhor esforço; não é o erro original
      }
    }
  } catch {
    // melhor esforço; nunca sobrepõe o erro original
  }
}

/**
 * @param {Object} cfg
 * @param {string} cfg.location - Pasta do Central docs (absoluta)
 * @param {string} [cfg.ref] - Branch lida no `pull` (CENTRAL_DOCS_REF)
 * @param {string} [cfg.targetBranch] - Branch base do PR (CENTRAL_DOCS_TARGET_BRANCH)
 * @param {Object} [cfg.deps] - `runGit` e `createMergeRequest` injetáveis (testes); `fileEnvResult`:
 *   o ENV.md já lido pelo comando, repassado ao gate do `VERSION_CONTROL_ACCESS` no MR
 */
export function createFilesystemStorage({
  location,
  ref = "main",
  targetBranch = "main",
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

      // home.md é editado por pessoas: o adaptador cria uma vez e nunca sobrescreve (Q16, #220).
      if (tipo === "home" && existsSync(dest)) {
        logger.info(`ℹ️  ${destPath} já existe; a página inicial não é sobrescrita.`);
        return { destPath, indexPath: `${squad}/index.md`, skipped: true };
      }

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
      git(["checkout", "-B", branch, targetBranch], location);

      try {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(localFile, dest);
        const indexPath = this.buildIndex(squad);
        git(["add", "--", destPath, indexPath], location);
        git(["commit", "-m", `docs(${squad}): add ${tipo} ${basename(destPath)}`], location);
        const sha = git(["rev-parse", "HEAD"], location);

        git(["push", "-u", "origin", branch], location);
        const remoteUrl = git(["remote", "get-url", "origin"], location);
        const description = `## Documento\n\n- **Tipo**: ${tipo}\n- **Arquivo**: \`${destPath}\``;
        let mr = null;
        try {
          // O ENV.md que o comando já leu (com --ide/--env-file) vai junto para o gate do acesso.
          mr = await createMergeRequest(
            remoteUrl,
            {
              source: branch,
              target: targetBranch,
              title: `docs(${squad}): ${tipo} ${basename(destPath)}`,
              description,
            },
            deps.fileEnvResult ? { fileEnvResult: deps.fileEnvResult } : {}
          );
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

    /**
     * Simula o `publishBatch` sem gravar nada (`--dry-run`, #229): para cada arquivo, o destino
     * efetivo e o que aconteceria. A mesma regra do `publishBatch`, inclusive o versionamento por hash.
     * @param {Object} p
     * @param {Array<{localFile: string, destPath: string, tipo: string, fromSession?: boolean}>} p.files
     * @returns {Array<{ destPath: string, status: "novo"|"igual"|"nova versão"|"sobrescreve"|"mantido" }>}
     *   `igual` = já publicado com o mesmo conteúdo (nada a fazer); `mantido` = página inicial já existente
     */
    previewBatch({ files }) {
      return files.map((f) => {
        const dest = safePath(location, f.destPath);
        if (f.tipo === "home" && existsSync(dest)) return { destPath: f.destPath, status: "mantido" };
        if (f.fromSession) {
          const picked = pickVersionedDest(location, f.destPath, f.localFile);
          const status = picked.skipped ? "igual" : picked.destPath === f.destPath ? "novo" : "nova versão";
          return { destPath: picked.destPath, status };
        }
        return { destPath: f.destPath, status: existsSync(dest) ? "sobrescreve" : "novo" };
      });
    },

    /**
     * Publica vários arquivos de uma vez (a consolidação de uma entrega, #220): cada um é
     * copiado, o índice é regenerado **uma vez** no fim e, com `.git`, tudo entra numa **branch
     * e um PR só** para a entrega inteira — não um por arquivo.
     * @param {Object} p
     * @param {Array<{localFile: string, destPath: string, tipo: string, fromSession?: boolean}>} p.files
     *   `fromSession` liga o versionamento por hash (`-v1`, `-v2`…, #229); sem ele, sobrescreve.
     * @param {string} p.squad
     * @param {string} [p.slug] - Nome da branch/commit (ex.: a chave da entrega); padrão: a hora
     * @returns {Promise<{ published: Array<{destPath: string, skipped?: boolean, hash?: string}>, indexPath: string, sha?: string, branch?: string, mr?: Object }>}
     *   Na ordem de `files`; `destPath` é o **efetivo** (com `-vN` quando versionado) e `hash` é o
     *   sha256 do conteúdo publicado.
     */
    async publishBatch({ files, squad, slug }) {
      ensureLocation();

      const written = []; // destinos efetivamente gravados (inclui `-vN`), para a limpeza em caso de falha
      const copyAll = () => {
        const published = [];
        for (const f of files) {
          const dest = safePath(location, f.destPath);
          // home.md é editado por pessoas: criado uma vez, nunca sobrescrito (Q16, #220).
          if (f.tipo === "home" && existsSync(dest)) {
            published.push({ destPath: f.destPath, skipped: true });
            continue;
          }
          if (f.fromSession) {
            const picked = pickVersionedDest(location, f.destPath, f.localFile);
            if (!picked.skipped) {
              const target = safePath(location, picked.destPath);
              mkdirSync(dirname(target), { recursive: true });
              copyFileSync(f.localFile, target);
              written.push(picked.destPath);
            }
            published.push(picked);
            continue;
          }
          mkdirSync(dirname(dest), { recursive: true });
          copyFileSync(f.localFile, dest);
          published.push({
            destPath: f.destPath,
            skipped: false,
            hash: sha256(readFileSync(f.localFile)),
          });
        }
        return published;
      };

      if (!isGit) {
        const published = copyAll();
        const indexPath = this.buildIndex(squad);
        return { published, indexPath };
      }

      const branch = `docs/${squad.toLowerCase()}-${slug || Date.now()}`;
      git(["checkout", targetBranch], location);
      try {
        git(["pull", "--ff-only", "origin", targetBranch], location);
      } catch (error) {
        logger.warn(`⚠️  git pull falhou (${error.message.split("\n")[0]}); seguindo com a cópia local.`);
      }
      // `-B` (não `-b`): idempotente — uma segunda tentativa com o mesmo slug (depois de falha
      // no push/PR) reusa a branch, em vez de falhar com "branch já existe" (#220, item 12).
      git(["checkout", "-B", branch, targetBranch], location);
      const before = snapshotLocalState(git, location);

      try {
        const published = copyAll();
        const indexPath = this.buildIndex(squad);
        const changed = published.filter((p) => !p.skipped).map((p) => p.destPath);
        if (changed.length === 0) {
          // Lote todo `skipped` (ex.: só home.md já existente): nada para commitar/publicar.
          return { published, indexPath };
        }
        git(["add", "--", ...changed, indexPath], location);
        if (nothingStaged(git, location)) {
          // Conteúdo idêntico ao que já está em targetBranch (#220, N6): sem isso, o commit
          // seguinte quebrava com "nothing to commit" em vez de ser um no-op.
          return { published, indexPath };
        }
        git(["commit", "-m", `docs(${squad}): consolidação ${slug || ""}`.trim()], location);
        const sha = git(["rev-parse", "HEAD"], location);

        git(["push", "-u", "origin", branch], location);
        const remoteUrl = git(["remote", "get-url", "origin"], location);
        const description = `## Documentos\n\n${changed.map((d) => `- \`${d}\``).join("\n")}`;
        let mr = null;
        try {
          mr = await createMergeRequest(
            remoteUrl,
            {
              source: branch,
              target: targetBranch,
              title: `docs(${squad}): consolidação ${slug || ""}`.trim(),
              description,
            },
            deps.fileEnvResult ? { fileEnvResult: deps.fileEnvResult } : {}
          );
        } catch (error) {
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

        return { published, indexPath, sha, branch, mr };
      } finally {
        try {
          git(["checkout", targetBranch], location);
          cleanupOrphanBranch(
            git,
            location,
            targetBranch,
            branch,
            [...files.map((f) => f.destPath), ...written, `${squad}/index.md`],
            before
          );
        } catch {
          // a branch de trabalho fica; o erro original (se houver) é o que importa
        }
      }
    },

    /**
     * Passo `--archive` (#220, Q3/Q14): copia os originais ligados a uma entrega para
     * `archive/`, sem apagar nada. Sem `.git`, é a mesma cópia local de sempre — a pessoa
     * já é avisada (no comando) de que `archive/` é a única proteção. **Com** `.git`, a
     * cópia entra numa branch e PR próprios, como o `publishBatch`: sem isso, a promessa
     * de "arquivar antes de apagar" das Q3/Q14 não valia — o arquivo ficava solto na cópia
     * local de quem rodou o comando, nunca chegava ao remote (item 2, gate de código).
     * @param {Object} p
     * @param {string} p.squad
     * @param {string} p.produto
     * @param {Array<Object>} p.entries - Entradas do manifesto (mutadas com `archiveDestPath`/`archivedHash`)
     * @returns {Promise<{archived: Array, skipped: Array, errors: string[], sha?: string, branch?: string, mr?: Object}>}
     */
    async archiveBatch({ squad, produto, entries }) {
      ensureLocation();

      if (!isGit) {
        return archiveEntries({ root: location, squad, produto, entries });
      }

      const branch = `docs/${squad.toLowerCase()}-archive-${Date.now()}`;
      git(["checkout", targetBranch], location);
      try {
        git(["pull", "--ff-only", "origin", targetBranch], location);
      } catch (error) {
        logger.warn(`⚠️  git pull falhou (${error.message.split("\n")[0]}); seguindo com a cópia local.`);
      }
      git(["checkout", "-B", branch, targetBranch], location);
      const before = snapshotLocalState(git, location);

      let archivedPaths = [];
      try {
        const result = archiveEntries({ root: location, squad, produto, entries });
        const changed = result.archived.map((a) => a.archiveDestPath);
        archivedPaths = changed;
        if (changed.length === 0) {
          return result;
        }
        git(["add", "--", ...changed], location);
        if (nothingStaged(git, location)) {
          return result; // conteúdo idêntico ao que já está em targetBranch (#220, N6)
        }
        git(["commit", "-m", `docs(${squad}): arquiva ${changed.length} documento(s) de trabalho`], location);
        const sha = git(["rev-parse", "HEAD"], location);

        git(["push", "-u", "origin", branch], location);
        const remoteUrl = git(["remote", "get-url", "origin"], location);
        const description = `## Arquivamento\n\n${changed.map((d) => `- \`${d}\``).join("\n")}`;
        let mr = null;
        try {
          mr = await createMergeRequest(
            remoteUrl,
            {
              source: branch,
              target: targetBranch,
              title: `docs(${squad}): arquivamento de ${changed.length} documento(s)`,
              description,
            },
            deps.fileEnvResult ? { fileEnvResult: deps.fileEnvResult } : {}
          );
        } catch (error) {
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

        return { ...result, sha, branch, mr };
      } finally {
        try {
          git(["checkout", targetBranch], location);
          cleanupOrphanBranch(git, location, targetBranch, branch, archivedPaths, before);
        } catch {
          // a branch de trabalho fica; o erro original (se houver) é o que importa
        }
      }
    },

    /**
     * `jarvis docs migrate --apply` (#220, Q2/Q6): move o layout antigo para a estrutura por
     * funcionalidade. Sem `.git`, aplica direto na cópia local (como sempre, com o `plan` já
     * calculado pelo chamador, para o dry-run mostrar o mesmo plano). **Com** `.git`, entra numa
     * branch e PR próprios — sem isso, a migração mexia na cópia local, na branch em que ela
     * estivesse, sem `pull` antes, podendo misturar a migração com a branch de outro PR (#220
     * item 2, gate de código). Nesse caso, o plano é **recalculado depois do `pull`** (não usa
     * o `plan` recebido): a árvore pode ter mudado desde o dry-run, e um plano desatualizado
     * levaria a mover arquivo que não existe mais ou a não detectar um conflito novo (rodada 2,
     * N4). O índice entra no mesmo commit da migração, não fica de fora.
     * @param {Object} p
     * @param {{moves: Array<{from: string, to: string}>}} p.plan - De `planCentralMigration` (usado só sem `.git`)
     * @param {string} p.squad - Para recalcular o plano depois do `pull` (só com `.git`)
     * @param {string} [p.timestamp] - Para o nome da pasta de backup (testável)
     * @returns {Promise<{moved: Array, backupDir: string, errors: string[], sha?: string, branch?: string, mr?: Object}>}
     */
    async migrateApply({ plan, squad, timestamp }) {
      ensureLocation();

      if (!isGit) {
        return applyCentralMigration(location, plan, timestamp);
      }

      const branch = `docs/migracao-${timestamp || Date.now()}`;
      git(["checkout", targetBranch], location);
      try {
        git(["pull", "--ff-only", "origin", targetBranch], location);
      } catch (error) {
        logger.warn(`⚠️  git pull falhou (${error.message.split("\n")[0]}); seguindo com a cópia local.`);
      }
      git(["checkout", "-B", branch, targetBranch], location);

      try {
        const freshPlan = planCentralMigration(location, squad);
        const result = applyCentralMigration(location, freshPlan, timestamp);
        if (result.moved.length === 0) {
          return result;
        }
        const indexPath = this.buildIndex(squad);
        const paths = [...result.moved.flatMap((m) => [m.from, m.to]), indexPath];
        if (existsSync(join(location, ".gitignore"))) paths.push(".gitignore");
        // `-A` com pathspec: cobre a remoção do `from` (já movido pelo `rename`) e a adição do
        // `to`/índice, limitado só a esses caminhos — não é um `git add -A` geral.
        git(["add", "-A", "--", ...paths], location);
        if (nothingStaged(git, location)) {
          return result; // conteúdo idêntico ao que já está em targetBranch (#220, N6)
        }
        git(["commit", "-m", `docs: migra Central docs para a estrutura por funcionalidade (${result.moved.length} documento(s))`], location);
        const sha = git(["rev-parse", "HEAD"], location);

        git(["push", "-u", "origin", branch], location);
        const remoteUrl = git(["remote", "get-url", "origin"], location);
        const description = `## Migração\n\n${result.moved.length} documento(s) movido(s) para a estrutura por funcionalidade.\nCópia de segurança: \`${result.backupDir}\`.`;
        let mr = null;
        try {
          mr = await createMergeRequest(
            remoteUrl,
            {
              source: branch,
              target: targetBranch,
              title: `docs: migração do Central docs (#220)`,
              description,
            },
            deps.fileEnvResult ? { fileEnvResult: deps.fileEnvResult } : {}
          );
        } catch (error) {
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

        return { ...result, sha, branch, mr };
      } finally {
        try {
          git(["checkout", targetBranch], location);
          // Só apaga a branch órfã, sem remover arquivo nenhum: aqui são `rename`s, não cópias
          // novas — tentar "limpar" um arquivo movido arriscaria apagar conteúdo de verdade.
          cleanupOrphanBranch(git, location, targetBranch, branch, []);
        } catch {
          // a branch de trabalho fica; o erro original (se houver) é o que importa
        }
      }
    },
  };
}
