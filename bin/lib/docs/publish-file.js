/**
 * @fileoverview Publica um documento no Central docs pelo adaptador configurado
 * (`CENTRAL_DOCS_STORAGE`). O destino segue a estrutura única
 * `{SQUAD}/{product|engineering}/{produto}/{arquivo}` e o índice do squad é
 * regenerado a cada publicação (ver `storage/build-index.js`).
 * @module docs/publish-file
 */

import { basename, extname } from "node:path";
import { validateFrontmatter } from "./validate-frontmatter.js";
import { logger } from "../utils/logger.js";

/** @constant {Readonly<Record<string, "product"|"engineering">>} Área de cada tipo */
export const AREA_BY_TYPE = Object.freeze({
  prd: "product",
  frd: "product",
  feat: "product",
  epic: "product",
  story: "product",
  task: "product",
  ard: "engineering",
  rfc: "engineering",
  swagger: "engineering",
  "qa-report": "engineering",
});

/** @constant {ReadonlyArray<string>} Tipos aceitos pelo `jarvis docs publish` */
export const VALID_TYPES = Object.freeze(Object.keys(AREA_BY_TYPE));

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function assertSegment(label, value) {
  if (!value || !SEGMENT.test(value)) {
    throw new Error(
      `${label} inválido: "${value ?? ""}" (use letras, números, "-" ou "_", sem "/" nem "..")`
    );
  }
}

/**
 * Calcula o destino do documento no Central docs.
 * O nome é o do arquivo local quando ele já segue `{tipo}-…` (ex: `prd-001-checkout.md`);
 * senão vem de `--feature` (`{tipo}-{feature}.{ext}`).
 *
 * @param {Object} p
 * @param {string} p.tipo
 * @param {string} p.squad
 * @param {string} p.produto - Padrão: WORKSPACE (o caller resolve)
 * @param {string} p.localFile
 * @param {string} [p.feature]
 * @returns {{ destPath: string, area: "product"|"engineering", fileName: string }}
 */
export function resolveDestPath({ tipo, squad, produto, localFile, feature }) {
  const area = AREA_BY_TYPE[tipo];
  if (!area) {
    throw new Error(`Tipo inválido: ${tipo}\nTipos válidos: ${VALID_TYPES.join(", ")}`);
  }
  assertSegment("Squad", squad);
  assertSegment("Produto", produto);

  const local = basename(localFile);
  const ext = extname(local).toLowerCase() || ".md";
  const followsPattern = local.toLowerCase().startsWith(`${tipo}-`) && /\.(md|ya?ml|json)$/.test(ext);

  let fileName;
  if (followsPattern) {
    fileName = local;
  } else if (feature) {
    assertSegment("Feature", feature);
    fileName = `${tipo}-${feature}${ext}`;
  } else {
    throw new Error(
      `O arquivo "${local}" não segue o padrão {tipo}-{id}-{nome}${ext}.\n` +
        `Renomeie o arquivo ou informe --feature <slug>.`
    );
  }

  return { destPath: `${squad}/${area}/${produto}/${fileName}`, area, fileName };
}

/**
 * @param {Object} opts
 * @param {Object} opts.storage - Adaptador (`getStorage`)
 * @param {string} opts.localFile
 * @param {string} opts.tipo
 * @param {string} opts.squad
 * @param {string} opts.produto
 * @param {string} [opts.feature]
 * @returns {Promise<{ destPath: string, indexPath: string, sha?: string, branch?: string, mr?: Object }>}
 */
export async function publishFile({ storage, localFile, tipo, squad, produto, feature }) {
  if (!storage) {
    throw new Error(
      "Central docs desligado (CENTRAL_DOCS_STORAGE vazio). Configure-o no /jarvis-init."
    );
  }

  const { destPath } = resolveDestPath({ tipo, squad, produto, localFile, feature });

  const isStructuredSwagger = tipo === "swagger" && !localFile.toLowerCase().endsWith(".md");
  if (!isStructuredSwagger) {
    logger.info("Validando frontmatter...");
    validateFrontmatter(localFile, tipo);
    logger.info("✅ Frontmatter válido");
  }

  logger.info("");
  logger.info("📋 Resumo da Publicação:");
  logger.info(`  Armazenamento: ${storage.kind}${storage.isGit ? " (git)" : ""}`);
  logger.info(`  Destino: ${destPath}`);
  logger.info("");

  const result = await storage.publish({ localFile, destPath, squad, tipo });

  logger.info(`✅ Publicado em ${destPath}`);
  logger.info(`🗂️  Índice regenerado: ${result.indexPath}`);
  if (result.mr) {
    logger.info(`🔀 Pull/Merge Request: ${result.mr.url}`);
  }

  return result;
}
