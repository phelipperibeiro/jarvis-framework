/**
 * @fileoverview Publica no Central docs, pelo adaptador configurado (`CENTRAL_DOCS_STORAGE`),
 * na estrutura por funcionalidade (`{squad}/{produto}/{funcionalidade}/…`, seção 7 do
 * `architecture.md` da #220):
 * - `feature`: a página da funcionalidade (`{funcionalidade}/{funcionalidade}.md`);
 * - `delivery`: o registro de uma entrega (`{funcionalidade}/deliveries/delivery-*.md`);
 * - `product`: a página do produto, o conteúdo transversal a várias funcionalidades (`{produto}.md`);
 * - `history`: rodadas, comentários e diário de uma entrega, e os demais arquivos da sessão
 *   (`history/{task_key}/…`, com subpastas quando a entrada traz `relPath`; a página-índice da
 *   sessão é `history/{task_key}/{task_key}.md`, #229);
 * - `home`: a página inicial do squad (`{squad}/home.md`), editável — o adaptador cria uma vez
 *   e nunca sobrescreve (Q16 da #220);
 * - os tipos de `DECISION_DOC_TYPES` (prd, frd, feat, epic, story, task, ard, rfc, spec, swagger,
 *   qa-report, discovery e, desde a #229, architecture, plan e light-arch da sessão): os
 *   documentos de trabalho **ligados a uma entrega consolidada**
 *   (`{funcionalidade}/decisions/…`) — quem decide o vínculo é o `/eng.spec-consolidate`, não
 *   este módulo.
 * O índice do squad é regenerado a cada publicação.
 * @module docs/publish-file
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { validateFrontmatter } from "./validate-frontmatter.js";
import { findUnresolvableLinks } from "./check-links.js";
import { commitBaseFor, makeRepoResolver, rewriteLinksForCentral } from "./rewrite-links.js";
import { logger } from "../utils/logger.js";

/**
 * Documentos de trabalho (decisões de origem: PRD, FRD, épico, história, tarefa, ARD, RFC,
 * SPEC, swagger, relatório de QA, discovery e, da sessão, architecture, plan e light-arch —
 * #229: o porquê das decisões). Antes da v4.0.0 todos entravam no Central docs;
 * de 4.0.0 até aqui, nenhum entrava. Agora voltam a entrar, mas só em `decisions/`, e só o que
 * já está ligado a uma entrega consolidada (Q1 da #220) — o que não está ligado fica em
 * `docs/jarvis/`, sem passar por aqui.
 * @constant {ReadonlyArray<string>}
 */
export const DECISION_DOC_TYPES = Object.freeze([
  "prd",
  "frd",
  "feat",
  "epic",
  "story",
  "task",
  "ard",
  "rfc",
  "spec",
  "swagger",
  "qa-report",
  "discovery",
  "architecture",
  "plan",
  "light-arch",
]);

/** @constant {ReadonlyArray<string>} Tipos aceitos pelo `jarvis docs publish` */
export const VALID_TYPES = Object.freeze([
  "feature",
  "delivery",
  "product",
  "history",
  "home",
  ...DECISION_DOC_TYPES,
]);

/** @constant {RegExp} Formato aceito por squad, produto, feature, slug e task key (exportado para `docs-migrate.js`, #220) */
export const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/**
 * Valida um segmento de caminho (squad, produto, feature…) contra `SEGMENT`.
 * Exportado para outros comandos (`docs-migrate.js`) validarem antes de montar caminhos.
 * @param {string} label - Nome do campo, para a mensagem de erro
 * @param {string} value
 * @throws {Error} valor vazio ou fora do formato
 */
export function assertSegment(label, value) {
  if (!value || !SEGMENT.test(value)) {
    throw new Error(
      `${label} inválido: "${value ?? ""}" (use letras, números, "-" ou "_", sem "/" nem "..")`
    );
  }
}

/** @constant {RegExp} Segmento de um caminho relativo dentro de `history/{task_key}/` (aceita ponto, nunca no começo) */
export const REL_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** @constant {number} Níveis máximos de um `relPath` */
export const REL_MAX_DEPTH = 8;

/**
 * Valida o caminho relativo de um arquivo da sessão (`fontes/x/y.md`): sem barra no começo, sem
 * segmento vazio, sem `..` nem nome oculto, no máximo `REL_MAX_DEPTH` níveis.
 * @param {string} label - Nome do campo, para a mensagem de erro
 * @param {string} value
 * @throws {Error} valor vazio ou fora do formato
 */
export function assertRelPath(label, value) {
  const parts = typeof value === "string" ? value.split("/") : [];
  if (
    parts.length === 0 ||
    parts.length > REL_MAX_DEPTH ||
    parts.some((part) => !REL_SEGMENT.test(part) || part.includes(".."))
  ) {
    throw new Error(
      `${label} inválido: "${value ?? ""}" (use segmentos com letras, números, ".", "-" ou "_", ` +
        `sem "..", sem barra no começo, sem nome oculto e até ${REL_MAX_DEPTH} níveis)`
    );
  }
}

/**
 * Calcula o destino do documento no Central docs, pela estrutura por funcionalidade.
 *
 * @param {Object} p
 * @param {string} p.tipo
 * @param {string} p.squad
 * @param {string} p.produto - Padrão: WORKSPACE (o caller resolve)
 * @param {string} p.localFile
 * @param {string} [p.feature] - Slug da funcionalidade. Para `feature`, só é preciso quando o
 *   nome do arquivo não segue `feature-{slug}.md`. Para `delivery` e para os tipos de
 *   `DECISION_DOC_TYPES`, é sempre obrigatório: é a funcionalidade dona da pasta.
 * @param {string} [p.taskKey] - Obrigatório para o tipo `history` (chave da entrega/sessão).
 * @param {string} [p.relPath] - Só para `history`: caminho relativo sob `history/{taskKey}/`
 *   (preserva subpastas da sessão e permite renomear, como a página-índice `{taskKey}.md`, #229).
 *   Sem ele, vale o nome do arquivo local.
 * @returns {{ destPath: string, area: string, fileName: string }}
 */
export function resolveDestPath({ tipo, squad, produto, localFile, feature, taskKey, relPath }) {
  if (!VALID_TYPES.includes(tipo)) {
    throw new Error(`Tipo inválido: ${tipo}\nTipos válidos: ${VALID_TYPES.join(", ")}`);
  }
  assertSegment("Squad", squad);

  if (tipo === "home") {
    return { destPath: `${squad}/home.md`, area: "home", fileName: "home.md" };
  }

  assertSegment("Produto", produto);

  const local = basename(localFile);
  const ext = extname(local).toLowerCase() || ".md";

  if (tipo === "product") {
    const fileName = `${produto}.md`;
    return { destPath: `${squad}/${produto}/${fileName}`, area: "product", fileName };
  }

  if (tipo === "history") {
    if (!taskKey) {
      throw new Error(
        'O tipo "history" precisa de --task-key <chave> (rodadas, comentários e diário da entrega).'
      );
    }
    assertSegment("Task key", taskKey);
    if (relPath) assertRelPath("Caminho relativo", relPath);
    const rel = relPath || local;
    return {
      destPath: `${squad}/${produto}/history/${taskKey}/${rel}`,
      area: "history",
      fileName: basename(rel),
    };
  }

  if (tipo === "feature") {
    const prefix = "feature-";
    const slug =
      feature ||
      (local.toLowerCase().startsWith(prefix) ? local.slice(prefix.length, local.length - extname(local).length) : null);
    if (!slug) {
      throw new Error(
        `O arquivo "${local}" não segue o padrão feature-{slug}.md.\n` +
          "Renomeie o arquivo ou informe --feature <slug>."
      );
    }
    assertSegment("Feature", slug);
    const fileName = `${slug}${ext}`;
    return { destPath: `${squad}/${produto}/${slug}/${fileName}`, area: "feature", fileName };
  }

  // delivery e os tipos de decisão (DECISION_DOC_TYPES) vivem dentro da funcionalidade dona
  if (!feature) {
    throw new Error(
      tipo === "delivery"
        ? 'O tipo "delivery" precisa de --feature <slug> (a funcionalidade da entrega).'
        : `O tipo "${tipo}" precisa de --feature <slug> (a funcionalidade a que este documento está ligado).`
    );
  }
  assertSegment("Feature", feature);

  if (tipo === "delivery") {
    return {
      destPath: `${squad}/${produto}/${feature}/deliveries/${local}`,
      area: "delivery",
      fileName: local,
    };
  }

  return {
    destPath: `${squad}/${produto}/${feature}/decisions/${local}`,
    area: "decision",
    fileName: local,
  };
}

/**
 * @param {Object} opts
 * @param {Object} opts.storage - Adaptador (`getStorage`)
 * @param {string} opts.localFile
 * @param {string} opts.tipo
 * @param {string} opts.squad
 * @param {string} opts.produto
 * @param {string} [opts.feature]
 * @param {string} [opts.taskKey]
 * @returns {Promise<{ destPath: string, indexPath: string, sha?: string, branch?: string, mr?: Object }>}
 */
export async function publishFile({ storage, localFile, tipo, squad, produto, feature, taskKey }) {
  if (!storage) {
    throw new Error(
      "Central docs desligado (CENTRAL_DOCS_STORAGE vazio). Configure-o no /jarvis-init."
    );
  }

  const { destPath } = resolveDestPath({ tipo, squad, produto, localFile, feature, taskKey });

  logger.info("Validando frontmatter...");
  validateFrontmatter(localFile, tipo);
  logger.info("✅ Frontmatter válido");

  logger.info("");
  logger.info("📋 Resumo da Publicação:");
  logger.info(`  Armazenamento: ${storage.kind}${storage.isGit ? " (git)" : ""}`);
  logger.info(`  Destino: ${destPath}`);
  logger.info("");

  const result = await storage.publish({ localFile, destPath, squad, tipo });

  if (result.skipped) {
    logger.info(`ℹ️  ${destPath} já existe e não foi sobrescrito.`);
  } else {
    logger.info(`✅ Publicado em ${destPath}`);
  }
  logger.info(`🗂️  Índice regenerado: ${result.indexPath}`);
  if (result.mr) {
    logger.info(`🔀 Pull/Merge Request: ${result.mr.url}`);
  }

  return result;
}

/**
 * Publica vários arquivos de uma entrega numa operação só (a listagem "move / fica" do
 * `/eng.spec-consolidate`, #220): uma cópia cada, um índice regenerado no fim e, com `.git`,
 * uma branch e um PR para a entrega inteira — não um por arquivo.
 *
 * @param {Object} opts
 * @param {Object} opts.storage - Adaptador (`getStorage`)
 * @param {string} opts.squad
 * @param {string} opts.produto
 * @param {string} [opts.slug] - Nome da branch/commit (ex.: a chave da entrega)
 * @param {Array<{localFile: string, tipo: string, feature?: string, taskKey?: string, relPath?: string, fromSession?: boolean, originalPath?: string}>} opts.files
 *   `relPath` só vale para `history`; `fromSession` marca o arquivo vindo de uma sessão (#229):
 *   versiona por hash, converte os links do `.md` e libera a remoção só para essas entradas.
 *   `originalPath` é o arquivo na sessão: a base para resolver os links do texto (a cópia em
 *   `consolidation/` fica em outra pasta).
 * @param {string[]} [opts.localOnlyDirs] - Pastas que só existem no disco local (sessão,
 *   `docs/jarvis/`): link para elas vira texto na conversão
 * @param {Object} [opts.deps] - `repoOf` injetável (testes), de `makeRepoResolver`
 * @returns {Promise<{ published: Array<{destPath: string, skipped?: boolean, hash?: string}>, indexPath: string, sha?: string, branch?: string, mr?: Object, linkWarnings: Array<{destPath: string, link: string, reason: string}> }>}
 *   `published` segue a ordem de `files`; `destPath` é o destino efetivo (com `-vN` quando a
 *   entrada é de sessão e o conteúdo mudou) e `hash` o sha256 do que foi publicado.
 *   `linkRewrites` lista, por arquivo, os links convertidos e os que viraram texto.
 */
export async function publishFiles({ storage, squad, produto, slug, files, localOnlyDirs = [], deps = {} }) {
  if (!storage) {
    throw new Error(
      "Central docs desligado (CENTRAL_DOCS_STORAGE vazio). Configure-o no /jarvis-init."
    );
  }
  if (!files || files.length === 0) {
    throw new Error("Nenhum arquivo para publicar (manifesto vazio).");
  }
  if (slug) assertSegment("Slug", slug);

  const resolved = files.map((f) => {
    logger.info(`Validando frontmatter de ${f.localFile}...`);
    validateFrontmatter(f.localFile, f.tipo);
    const { destPath } = resolveDestPath({
      tipo: f.tipo,
      squad,
      produto,
      localFile: f.localFile,
      feature: f.feature,
      taskKey: f.taskKey,
      relPath: f.relPath,
    });
    return { localFile: f.localFile, destPath, tipo: f.tipo, fromSession: Boolean(f.fromSession) };
  });
  logger.info("✅ Frontmatter válido em todos os arquivos");

  // Os .md da sessão saem com os links convertidos (o original na sessão não muda).
  const tmpDir = mkdtempSync(join(tmpdir(), "jarvis-publish-"));
  try {
    const linkRewrites = rewriteSessionLinks({ files, resolved, tmpDir, localOnlyDirs, deps });

    // Links que não resolvem dentro do Central docs (leitura fora do workspace, Confluence): só avisa.
    const linkWarnings = warnUnresolvableLinks(storage, resolved);

    logger.info("");
    logger.info("📋 Resumo da Publicação (lote):");
    logger.info(`  Armazenamento: ${storage.kind}${storage.isGit ? " (git)" : ""}`);
    for (const r of resolved) logger.info(`  - ${r.destPath}`);
    logger.info("");

    const result = await storage.publishBatch({ files: resolved, squad, slug });

    for (const p of result.published) {
      if (!p.skipped) {
        const versioned = resolved.every((r) => r.destPath !== p.destPath);
        logger.info(`✅ Publicado em ${p.destPath}${versioned ? " (nova versão: o conteúdo mudou)" : ""}`);
      } else if (p.hash) {
        logger.info(`ℹ️  ${p.destPath} já está publicado com o mesmo conteúdo; nada a fazer.`);
      } else {
        logger.info(`ℹ️  ${p.destPath} já existe e não foi sobrescrito.`);
      }
    }
    logger.info(`🗂️  Índice regenerado: ${result.indexPath}`);
    if (result.mr) {
      logger.info(`🔀 Pull/Merge Request: ${result.mr.url}`);
    }

    return { ...result, linkWarnings, linkRewrites };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Para cada entrada `.md` de sessão com `originalPath`, converte os links (regra 6 de
 * `doc-links-rules.md`) e troca o `localFile` publicado por uma cópia convertida em `tmpDir`.
 * O arquivo original e a cópia de `consolidation/` ficam intactos. Entradas sem `originalPath`
 * (página-índice gerada, que já nasce com links do Central docs) e arquivos que não são `.md`
 * seguem como estão.
 * @param {Object} p
 * @param {Array<Object>} p.files - Entradas do manifesto
 * @param {Array<Object>} p.resolved - Destinos calculados (mutado: `localFile`)
 * @param {string} p.tmpDir
 * @param {string[]} p.localOnlyDirs
 * @param {Object} p.deps
 * @returns {Array<{ destPath: string, converted: number, dropped: number }>}
 */
function rewriteSessionLinks({ files, resolved, tmpDir, localOnlyDirs, deps }) {
  const published = new Map();
  files.forEach((f, i) => {
    if (f.fromSession && f.originalPath) {
      const abs = resolve(f.originalPath);
      if (!published.has(abs)) published.set(abs, resolved[i].destPath);
    }
  });
  if (published.size === 0) return [];

  const repoOf = deps.repoOf ?? makeRepoResolver();
  const rewrites = [];
  files.forEach((f, i) => {
    const r = resolved[i];
    if (!f.fromSession || !f.originalPath || !r.destPath.toLowerCase().endsWith(".md")) return;
    const fileDir = resolve(f.originalPath, "..");
    const text = readFileSync(r.localFile, "utf-8");
    const out = rewriteLinksForCentral(text, {
      fileDir,
      destPath: r.destPath,
      published,
      repoOf,
      commitBase: commitBaseFor(text, fileDir),
      localOnlyDirs: localOnlyDirs.map((d) => resolve(d)),
    });
    if (!out.changed) return;
    const tmpFile = join(tmpDir, `${i}-${basename(r.localFile)}`);
    writeFileSync(tmpFile, out.text);
    r.localFile = tmpFile;
    rewrites.push({ destPath: r.destPath, converted: out.converted, dropped: out.dropped });
    logger.info(
      `🔗 ${r.destPath}: ${out.converted} link(s) convertido(s), ${out.dropped} virou(aram) texto`
    );
  });
  return rewrites;
}

/**
 * Avisa (sem bloquear) dos links relativos dos `.md` do lote que não resolvem dentro do Central
 * docs: a página fica quebrada fora do workspace e na migração para o Confluence (#229).
 * @param {Object} storage - Adaptador; sem `location` (adaptador sem pasta local), não confere
 * @param {Array<{localFile: string, destPath: string}>} resolved
 * @returns {Array<{ destPath: string, link: string, reason: string }>}
 */
function warnUnresolvableLinks(storage, resolved) {
  const warnings = [];
  const publishedSet = new Set(resolved.map((r) => r.destPath));
  const exists = (rel) => (storage.location ? existsSync(join(storage.location, rel)) : true);
  for (const r of resolved) {
    if (!r.destPath.toLowerCase().endsWith(".md")) continue;
    let content;
    try {
      content = readFileSync(r.localFile, "utf-8");
    } catch {
      continue; // o erro de leitura aparece na publicação
    }
    for (const p of findUnresolvableLinks({ destPath: r.destPath, content, publishedSet, exists })) {
      warnings.push({ destPath: r.destPath, link: p.link, reason: p.reason });
    }
  }
  if (warnings.length > 0) {
    logger.warn(`⚠️  ${warnings.length} link(s) relativo(s) não resolvem dentro do Central docs:`);
    for (const w of warnings) logger.warn(`   - ${w.destPath}: ${w.link} (${w.reason})`);
  }
  return warnings;
}
