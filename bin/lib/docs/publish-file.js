/**
 * @fileoverview Publica no Central docs, pelo adaptador configurado (`CENTRAL_DOCS_STORAGE`),
 * na estrutura por funcionalidade (`{squad}/{produto}/{funcionalidade}/…`, seção 7 do
 * `architecture.md` da #220):
 * - `feature`: a página da funcionalidade (`{funcionalidade}/{funcionalidade}.md`);
 * - `delivery`: o registro de uma entrega (`{funcionalidade}/deliveries/delivery-*.md`);
 * - `product`: a página do produto, o conteúdo transversal a várias funcionalidades (`{produto}.md`);
 * - `history`: rodadas, comentários e diário de uma entrega (`history/{task_key}/…`);
 * - os tipos de `DECISION_DOC_TYPES` (prd, frd, feat, epic, story, task, ard, rfc, spec, swagger,
 *   qa-report, discovery): os documentos de trabalho **ligados a uma entrega consolidada**
 *   (`{funcionalidade}/decisions/…`) — quem decide o vínculo é o `/eng.spec-consolidate`, não
 *   este módulo.
 * O índice do squad é regenerado a cada publicação.
 * @module docs/publish-file
 */

import { basename, extname } from "node:path";
import { validateFrontmatter } from "./validate-frontmatter.js";
import { logger } from "../utils/logger.js";

/**
 * Documentos de trabalho (decisões de origem: PRD, FRD, épico, história, tarefa, ARD, RFC,
 * SPEC, swagger, relatório de QA, discovery). Antes da v4.0.0 todos entravam no Central docs;
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
]);

/** @constant {ReadonlyArray<string>} Tipos aceitos pelo `jarvis docs publish` */
export const VALID_TYPES = Object.freeze([
  "feature",
  "delivery",
  "product",
  "history",
  ...DECISION_DOC_TYPES,
]);

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function assertSegment(label, value) {
  if (!value || !SEGMENT.test(value)) {
    throw new Error(
      `${label} inválido: "${value ?? ""}" (use letras, números, "-" ou "_", sem "/" nem "..")`
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
 * @returns {{ destPath: string, area: string, fileName: string }}
 */
export function resolveDestPath({ tipo, squad, produto, localFile, feature, taskKey }) {
  if (!VALID_TYPES.includes(tipo)) {
    throw new Error(`Tipo inválido: ${tipo}\nTipos válidos: ${VALID_TYPES.join(", ")}`);
  }
  assertSegment("Squad", squad);
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
    return {
      destPath: `${squad}/${produto}/history/${taskKey}/${local}`,
      area: "history",
      fileName: local,
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

  logger.info(`✅ Publicado em ${destPath}`);
  logger.info(`🗂️  Índice regenerado: ${result.indexPath}`);
  if (result.mr) {
    logger.info(`🔀 Pull/Merge Request: ${result.mr.url}`);
  }

  return result;
}
