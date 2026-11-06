/**
 * @fileoverview Arquivar e finalizar uma entrega consolidada no Central docs (#220, Q3/Q5/Q13/
 * Q14/Q15). Depois de publicar (`jarvis docs publish --manifest`), dois passos, cada um numa
 * execução própria do `/eng.spec-consolidate` (`--archive`, `--finalize`):
 *
 * - **Arquivar** (`archiveEntries`): copia o original de cada documento de trabalho publicado
 *   em `decisions/` para `archive/` da mesma funcionalidade, sem apagar nada; grava o hash do
 *   original no momento do arquivamento (Q13).
 * - **Finalizar** (`finalizeEntries`): confere se o original mudou desde o `--archive` (hash);
 *   se mudou, avisa e **não** apaga aquele item (Q13). Reescreve, nos documentos de trabalho
 *   restantes, os `related_*` que apontavam para o original (best effort — o que não resolver
 *   entra no relatório, Q14) e só então apaga o original.
 *
 * Só os documentos de trabalho (PRD, FRD, épico, história, tarefa, ARD, RFC, SPEC, discovery…)
 * têm "original" fora do Central docs. `feature`, `delivery`, `product`, `home` e `history` não
 * passam por aqui: não existe outro lugar de onde arquivá-los ou apagá-los.
 * @module docs/finish-delivery
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, isAbsolute } from "node:path";
import { resolveDestPath } from "./publish-file.js";
import { expandEnv } from "../core/docs-migrate.js";
import { parseFrontmatter } from "../utils/frontmatter.js";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Caminho do arquivo tal como foi publicado: `e.localFile` (entradas pós-`readManifest`, usadas
 * por `forceFinalize`, chamado no mesmo processo do `publish --manifest`) ou `e.file` (entradas
 * cruas do manifesto em disco, lidas de novo por `archiveEntries`/`finalizeEntries`). Nunca o
 * `e.originalPath`: o nome publicado pode diferir do nome local (#220 item 2 — documento
 * quebrado por funcionalidade, Q9).
 */
function publishedFileRef(e) {
  return e.localFile ?? e.file ?? e.originalPath;
}

/** Nome do arquivo a usar no destino: o publicado, não o do original (#220 item 2). */
function publishedBasename(e) {
  return basename(publishedFileRef(e));
}

function destFor({ tipo, squad, produto, feature, taskKey, e }) {
  return resolveDestPath({
    tipo,
    squad,
    produto,
    feature,
    taskKey,
    localFile: publishedFileRef(e),
  }).destPath;
}

function archiveDestFor(p) {
  return destFor(p).replace(/\/decisions\//, "/archive/");
}

/**
 * Insere campos no bloco de frontmatter de um arquivo já copiado (depois do `---` de abertura).
 * Só usado em campos reconhecidos, mas não exigidos (`origin`, `original_status`, Q14 da #220):
 * não falha se o arquivo não tiver frontmatter (fica como está).
 * @param {string} path
 * @param {Record<string, string>} fields - Omite a chave cujo valor for vazio/undefined
 */
function injectFrontmatterFields(path, fields) {
  const content = readFileSync(path, "utf-8");
  const lines = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  if (lines.length === 0 || !content.startsWith("---")) return;
  const next = content.replace(/^---\s*\n/, (opening) => `${opening}${lines.join("\n")}\n`);
  writeFileSync(path, next);
}

/**
 * Resolve, com `$VAR` expandido (#220 item 2), as três pastas onde um documento de trabalho
 * "original" pode estar.
 * @param {Record<string, string>} env
 * @returns {string[]} caminhos (relativos ou absolutos, como vierem do ENV.md)
 */
function resolveDocsFolders(env) {
  const expanded = expandEnv(new Map(Object.entries(env || {})));
  const docsFolder = expanded.get("DOCS_FOLDER") || "docs";
  const jarvisDocs = expanded.get("JARVIS_DOCS") || `${docsFolder}/jarvis`;
  return [
    expanded.get("PROD_DOCS") || `${jarvisDocs}/product`,
    expanded.get("ENG_DOCS") || `${jarvisDocs}/engineering`,
    expanded.get("DISCOVERIES_DOCS") || `${jarvisDocs}/discoveries`,
  ];
}

/**
 * Confere se `absPath` está dentro de uma das pastas de documentos de trabalho (#220 item 2,
 * gate de código): trava o `unlinkSync` de `finalizeEntries`/`forceFinalize` para não apagar
 * um caminho qualquer que um manifesto editado ou gerado com erro tenha colocado em `originalPath`.
 * @param {string} absPath
 * @param {string[]} folders - De `resolveDocsFolders`; relativas são resolvidas a partir de `workspaceRoot`
 * @param {string} [workspaceRoot] - A pasta do workspace (`openStorageFromEnv(...).root`), não o
 *   cwd do processo: o comando pode ser chamado de uma subpasta do workspace
 * @returns {boolean}
 */
function isWithinDocsFolders(absPath, folders, workspaceRoot = process.cwd()) {
  return folders.some((folder) => {
    const folderAbs = isAbsolute(folder) ? folder : resolve(workspaceRoot, folder);
    const rel = relative(folderAbs, absPath);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  });
}

/**
 * Passo `--archive`: copia o original de cada entrada com `originalPath` para `archive/` da
 * funcionalidade (não move, não apaga). Preenche `entry.archiveDestPath` e `entry.archivedHash`
 * nas entradas arquivadas — quem chama grava essas duas no manifesto, para o `--finalize` ler.
 *
 * @param {Object} p
 * @param {string} p.root - Pasta do Central docs
 * @param {string} p.squad
 * @param {string} p.produto
 * @param {Array<Object>} p.entries - Entradas do manifesto (mutadas com `archiveDestPath`/`archivedHash`)
 * @returns {{ archived: Array, skipped: Array<{originalPath: string, reason: string}>, errors: string[] }}
 */
export function archiveEntries({ root, squad, produto, entries }) {
  const archived = [];
  const skipped = [];
  const errors = [];

  for (const e of entries) {
    if (!e.originalPath) continue; // feature/delivery/product/home/history: nada a arquivar

    if (!existsSync(e.originalPath)) {
      errors.push(`${e.originalPath}: não encontrado`);
      continue;
    }
    try {
      const archiveDestPath = archiveDestFor({
        tipo: e.tipo,
        squad,
        produto,
        feature: e.feature,
        taskKey: e.taskKey,
        e,
      });
      const dest = join(root, archiveDestPath);
      // Lido uma vez só: o hash é sempre o do conteúdo de fato copiado (#220 item 13), não de
      // uma releitura separada do original (que poderia já ter mudado entre as duas leituras).
      const buffer = readFileSync(e.originalPath);
      const currentHash = createHash("sha256").update(buffer).digest("hex");
      if (existsSync(dest)) {
        // Sem `archivedHash` registrado nesta entrada, não dá para saber se o arquivo em
        // `dest` é desta mesma entrada ou de outra origem: pula, por segurança (como sempre).
        // **Com** `archivedHash` e ele bater o hash atual, nada mudou: também pula. Só quando
        // `archivedHash` existe e o original mudou desde então é que sobrescreve e atualiza o
        // hash — rodar `--archive` de novo é como se atualiza, em vez de ficar pulado para
        // sempre e o `--finalize` nunca aceitar o item (#220 item 2).
        if (!e.archivedHash || e.archivedHash === currentHash) {
          skipped.push({ originalPath: e.originalPath, reason: "já arquivado" });
          continue;
        }
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buffer);
      const originalMeta = parseFrontmatter(buffer.toString("utf-8"));
      injectFrontmatterFields(dest, {
        origin: e.originalPath,
        original_status: originalMeta.status,
      });
      e.archiveDestPath = archiveDestPath;
      e.archivedHash = currentHash;
      archived.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { archived, skipped, errors };
}

/**
 * Lista `.md` recursivamente (igual a `docs-migrate.js`, cópia local para não acoplar os dois
 * módulos a um helper comum por um detalhe tão pequeno).
 */
function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(p));
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const SCALAR_RE = /^(related_\w+:[ \t]*)(\S+)[ \t]*$/;
const INLINE_LIST_RE = /^(related_\w+:[ \t]*)([{[])([^\]}]*)([}\]])[ \t]*$/;
const BLOCK_KEY_RE = /^(related_\w+:)[ \t]*$/;
const BLOCK_ITEM_RE = /^([ \t]*-[ \t]*)(\S+)[ \t]*$/;

/**
 * Troca, no texto de um documento, todo `related_*:` cujo valor seja o **basename** do arquivo
 * removido pelo caminho novo — nos três formatos que os templates de produto orientam para
 * múltiplos relacionados ("se forem vários, utilize sintaxe compatível com YAML", #220 item 3):
 * valor único na mesma linha, lista inline (`related_docs: {a.md, b.md}` ou `[a.md, b.md]`) e
 * lista em bloco (`related_docs:` seguido de linhas `  - a.md`).
 *
 * @param {string} text
 * @param {string} removedBasename
 * @param {string} newRef
 * @returns {{ text: string, changed: boolean }}
 */
export function rewriteRelatedInText(text, removedBasename, newRef) {
  const lines = text.split("\n");
  const out = [];
  let changed = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const scalar = line.match(SCALAR_RE);
    if (scalar) {
      if (basename(scalar[2]) === removedBasename) {
        out.push(`${scalar[1]}${newRef}`);
        changed = true;
      } else {
        out.push(line);
      }
      i++;
      continue;
    }

    const inlineList = line.match(INLINE_LIST_RE);
    if (inlineList) {
      const [, prefix, opener, body, closer] = inlineList;
      let lineChanged = false;
      const items = body
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          if (basename(item) === removedBasename) {
            lineChanged = true;
            return newRef;
          }
          return item;
        });
      if (lineChanged) {
        out.push(`${prefix}${opener}${items.join(", ")}${closer}`);
        changed = true;
      } else {
        out.push(line);
      }
      i++;
      continue;
    }

    const blockKey = line.match(BLOCK_KEY_RE);
    if (blockKey) {
      out.push(line);
      i++;
      while (i < lines.length && BLOCK_ITEM_RE.test(lines[i])) {
        const [, prefix, value] = lines[i].match(BLOCK_ITEM_RE);
        if (basename(value) === removedBasename) {
          out.push(`${prefix}${newRef}`);
          changed = true;
        } else {
          out.push(lines[i]);
        }
        i++;
      }
      continue;
    }

    out.push(line);
    i++;
  }

  return { text: out.join("\n"), changed };
}

/**
 * Nos documentos de trabalho restantes (`$PROD_DOCS`/`$ENG_DOCS`/`$DISCOVERIES_DOCS`), troca
 * todo `related_*:` que citava o arquivo removido pelo caminho dele no Central docs (texto,
 * como já é a convenção de `related_docs` — não é um link clicável: os dois lados podem estar
 * fora do workspace um do outro). Best effort (Q14): não tenta resolver citação em prosa, só o
 * campo de frontmatter.
 *
 * As três variáveis vêm do `env` **sem expandir** `$VAR` (`loadEnv` não expande, #220 item 2):
 * `expandEnv` resolve `$DOCS_FOLDER`, `$JARVIS_DOCS`, `$PROD_FOLDER_NAME`… antes de montar o
 * caminho, senão `existsSync("$JARVIS_DOCS/...")` dá falso e esta função nunca encontra nada
 * para reescrever, em silêncio.
 *
 * @param {Record<string, string>} env - `loadEnv` (objeto plano, variáveis cruas)
 * @param {string} removedBasename
 * @param {string} centralDocsDestPath
 * @param {string} [workspaceRoot] - A pasta do workspace (`openStorageFromEnv(...).root`), para
 *   resolver as três pastas quando vierem relativas; sem ele, usa o cwd do processo
 * @returns {string[]} arquivos alterados (absolutos)
 */
export function rewriteRelatedRefs(env, removedBasename, centralDocsDestPath, workspaceRoot) {
  const folders = resolveDocsFolders(env);

  const changed = [];
  for (const rawFolder of folders) {
    const folder = isAbsolute(rawFolder) ? rawFolder : resolve(workspaceRoot || process.cwd(), rawFolder);
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const fileAbs of listMarkdown(folder)) {
      const text = readFileSync(fileAbs, "utf-8");
      const next = rewriteRelatedInText(text, removedBasename, centralDocsDestPath);
      if (next.changed) {
        writeFileSync(fileAbs, next.text);
        changed.push(fileAbs);
      }
    }
  }
  return changed;
}

/**
 * `--force` (#220, Q15): publica e já apaga os originais, numa execução só, **sem** o passo
 * `--archive` — zero reversão. Mesmas travas que não dependem de pergunta (documento sem
 * vínculo não chega a ter `originalPath`; falha ao publicar nunca chama esta função); a única
 * coisa que falta, de propósito, é a cópia de segurança do `archive/`.
 *
 * @param {Object} p
 * @param {Array<Object>} p.entries - As mesmas do manifesto, já publicadas
 * @param {string} p.squad
 * @param {string} p.produto
 * @param {Record<string, string>} [p.env] - Para reescrever `related_*` (omitir = não reescreve); também usado para travar o `unlinkSync` dentro das pastas de documentos de trabalho (#220 item 2)
 * @returns {{ finalized: Array, rewritten: string[], errors: string[] }}
 */
export function forceFinalize({ entries, squad, produto, env, workspaceRoot }) {
  const finalized = [];
  const rewritten = [];
  const errors = [];
  const folders = env ? resolveDocsFolders(env) : null;

  for (const e of entries) {
    if (!e.originalPath) continue; // feature/delivery/product/home/history: nada a apagar
    if (!existsSync(e.originalPath)) continue;
    if (folders && !isWithinDocsFolders(resolve(e.originalPath), folders, workspaceRoot)) {
      errors.push(`${e.originalPath}: fora das pastas de documentos de trabalho, não apagado`);
      continue;
    }

    try {
      // O nome vem do arquivo publicado (`e.file`), não do original: #220 item 2 — no
      // `--force`, o destino em `decisions/` segue o que de fato foi copiado, não o nome
      // local, que pode diferir (ex.: documento quebrado por funcionalidade, Q9).
      const destPath = destFor({ tipo: e.tipo, squad, produto, feature: e.feature, taskKey: e.taskKey, e });
      if (env) {
        rewritten.push(...rewriteRelatedRefs(env, publishedBasename(e), destPath, workspaceRoot));
      }
      unlinkSync(e.originalPath);
      finalized.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { finalized, rewritten, errors };
}

/**
 * Passo `--finalize`: para cada entrada já arquivada (`archiveDestPath` presente), confere se
 * o original mudou desde o `--archive` (hash) e se a cópia em `archive/` de fato existe e bate
 * o hash gravado (#220 item 2 — sem isso, um manifesto editado à mão ou um `archive/` limpo por
 * fora levava a apagar a única cópia sem nenhuma checagem); se qualquer uma falhar, **não apaga**
 * (Q13). Reescreve as referências para `decisions/` (o mesmo destino do `--force`, não mais
 * `archive/` — #220 item 2, "finalize e --force reescreviam para destinos diferentes") e apaga
 * o original.
 *
 * @param {Object} p
 * @param {Array<Object>} p.entries - Entradas do manifesto (já com `archiveDestPath`/`archivedHash`)
 * @param {Record<string, string>} [p.env] - Para reescrever `related_*` (omitir = não reescreve); também trava o `unlinkSync` dentro das pastas de documentos de trabalho
 * @param {string} [p.root] - Pasta do Central docs, para conferir a cópia em `archive/` (omitir = pula a conferência de existência, mas o hash ainda é conferido)
 * @param {string} [p.squad]
 * @param {string} [p.produto]
 * @returns {{ finalized: Array, changed: Array<{originalPath: string, reason: string}>, rewritten: string[], errors: string[] }}
 */
export function finalizeEntries({ entries, env, root, squad, produto, workspaceRoot }) {
  const finalized = [];
  const changed = [];
  const rewritten = [];
  const errors = [];
  const folders = env ? resolveDocsFolders(env) : null;

  for (const e of entries) {
    if (!e.originalPath || !e.archiveDestPath) continue;
    if (!existsSync(e.originalPath)) continue; // já finalizado antes; idempotente
    if (folders && !isWithinDocsFolders(resolve(e.originalPath), folders, workspaceRoot)) {
      errors.push(`${e.originalPath}: fora das pastas de documentos de trabalho, não apagado`);
      continue;
    }

    try {
      if (!e.archivedHash) {
        changed.push({ originalPath: e.originalPath, reason: "sem hash do arquivamento" });
        continue;
      }
      if (root) {
        // Só a existência: o conteúdo da cópia não é mais idêntico ao buffer hasheado no
        // --archive (a cópia ganhou origin/original_status no frontmatter, Q14) — comparar o
        // hash dos dois daria sempre diferente. O hash serve para comparar o ORIGINAL (abaixo),
        // não a cópia.
        const archivedAbs = join(root, e.archiveDestPath);
        if (!existsSync(archivedAbs)) {
          changed.push({ originalPath: e.originalPath, reason: "cópia em archive/ não encontrada" });
          continue;
        }
      }
      const currentHash = sha256(e.originalPath);
      if (currentHash !== e.archivedHash) {
        changed.push({ originalPath: e.originalPath, reason: "original mudou desde o --archive" });
        continue;
      }
      if (env) {
        const destPath = destFor({ tipo: e.tipo, squad, produto, feature: e.feature, taskKey: e.taskKey, e });
        rewritten.push(...rewriteRelatedRefs(env, publishedBasename(e), destPath, workspaceRoot));
      }
      unlinkSync(e.originalPath);
      finalized.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { finalized, changed, rewritten, errors };
}
