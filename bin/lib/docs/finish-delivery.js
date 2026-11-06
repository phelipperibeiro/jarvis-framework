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
  copyFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { resolveDestPath } from "./publish-file.js";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function archiveDestFor({ tipo, squad, produto, feature, localFile }) {
  const { destPath } = resolveDestPath({ tipo, squad, produto, localFile, feature });
  return destPath.replace(/\/decisions\//, "/archive/");
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
        localFile: e.originalPath,
      });
      const dest = join(root, archiveDestPath);
      if (existsSync(dest)) {
        skipped.push({ originalPath: e.originalPath, reason: "já arquivado" });
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(e.originalPath, dest);
      e.archiveDestPath = archiveDestPath;
      e.archivedHash = sha256(e.originalPath);
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

/**
 * Nos documentos de trabalho restantes (`$PROD_DOCS`/`$ENG_DOCS`/`$DISCOVERIES_DOCS`, pelo
 * `env` plano do `loadEnv`), troca todo `related_*:` cujo valor seja o **basename** do arquivo
 * removido pelo caminho dele no Central docs (texto, como já é a convenção de `related_docs` —
 * não é um link clicável: os dois lados podem estar fora do workspace um do outro). Best effort
 * (Q14): não tenta resolver citação em prosa, só o campo de frontmatter.
 *
 * @param {Record<string, string>} env - `loadEnv` (objeto plano)
 * @param {string} removedBasename
 * @param {string} centralDocsDestPath
 * @returns {string[]} arquivos alterados (absolutos)
 */
export function rewriteRelatedRefs(env, removedBasename, centralDocsDestPath) {
  const docsFolder = env.DOCS_FOLDER || "docs";
  const jarvisDocs = env.JARVIS_DOCS || `${docsFolder}/jarvis`;
  const folders = [
    env.PROD_DOCS || `${jarvisDocs}/product`,
    env.ENG_DOCS || `${jarvisDocs}/engineering`,
    env.DISCOVERIES_DOCS || `${jarvisDocs}/discoveries`,
  ];

  const changed = [];
  for (const folder of folders) {
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const fileAbs of listMarkdown(folder)) {
      const text = readFileSync(fileAbs, "utf-8");
      const next = text.replace(/^(related_\w+:[ \t]*)(\S+)[ \t]*$/gm, (line, prefix, value) =>
        basename(value) === removedBasename ? `${prefix}${centralDocsDestPath}` : line
      );
      if (next !== text) {
        writeFileSync(fileAbs, next);
        changed.push(fileAbs);
      }
    }
  }
  return changed;
}

/**
 * Passo `--finalize`: para cada entrada já arquivada (`archiveDestPath` presente), confere se
 * o original mudou desde o `--archive` (hash); se mudou, **não apaga** (Q13). Reescreve as
 * referências e apaga o original.
 *
 * @param {Object} p
 * @param {Array<Object>} p.entries - Entradas do manifesto (já com `archiveDestPath`/`archivedHash`)
 * @param {Record<string, string>} [p.env] - Para reescrever `related_*` (omitir = não reescreve)
 * @returns {{ finalized: Array, changed: Array<{originalPath: string}>, rewritten: string[], errors: string[] }}
 */
export function finalizeEntries({ entries, env }) {
  const finalized = [];
  const changed = [];
  const rewritten = [];
  const errors = [];

  for (const e of entries) {
    if (!e.originalPath || !e.archiveDestPath) continue;
    if (!existsSync(e.originalPath)) continue; // já finalizado antes; idempotente

    try {
      const currentHash = sha256(e.originalPath);
      if (e.archivedHash && currentHash !== e.archivedHash) {
        changed.push({ originalPath: e.originalPath });
        continue;
      }
      if (env) {
        rewritten.push(...rewriteRelatedRefs(env, basename(e.originalPath), e.archiveDestPath));
      }
      unlinkSync(e.originalPath);
      finalized.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { finalized, changed, rewritten, errors };
}
