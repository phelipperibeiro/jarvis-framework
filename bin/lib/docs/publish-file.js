/**
 * @fileoverview Publica um documento no central-docs (branch + commit + MR/PR).
 * Substitui `publish-file.sh` (removido) — chama os adapters de `vcs/api.js`
 * direto, sem subprocess, sem arquivo temporário para passar JSON/body.
 * @module docs/publish-file
 */

import { readFileSync } from "node:fs";
import { validateFrontmatter, extractMetadata } from "./validate-frontmatter.js";
import { commitFiles, createMergeRequest } from "../vcs/api.js";
import { fetchFile } from "./fetch-file.js";
import { redisDel } from "./redis-cache.js";
import { logger } from "../utils/logger.js";

const VALID_TYPES = ["prd", "frd", "ard", "rfc", "swagger", "qa-report"];

/**
 * @param {{ tipo: string, squad: string, workspace: string, feature: string, localFile: string }} p
 * @returns {{ destPath: string, area: "product"|"engineering" }}
 */
export function resolveDestPath({ tipo, squad, workspace, feature, localFile }) {
  const base = `${squad}/${workspace}`;

  if (tipo === "prd" || tipo === "frd") {
    return { destPath: `${base}/product/${tipo}-${feature}.md`, area: "product" };
  }
  if (tipo === "ard") {
    return { destPath: `${base}/engineering/ARD/${tipo}-${feature}.md`, area: "engineering" };
  }
  if (tipo === "rfc") {
    return { destPath: `${base}/engineering/RFC/${tipo}-${feature}.md`, area: "engineering" };
  }
  if (tipo === "swagger") {
    const ext = localFile.split(".").pop().toLowerCase();
    const swaggerExt = ext === "yaml" || ext === "yml" ? ext : ext === "json" ? "json" : null;
    const destPath = swaggerExt
      ? `${base}/engineering/swagger/api-${feature}.${swaggerExt}`
      : `${base}/engineering/swagger/swagger-${feature}.md`; // default: .md (wrapper com metadados)
    return { destPath, area: "engineering" };
  }
  if (tipo === "qa-report") {
    return { destPath: `${base}/engineering/qa/qa-report-${feature}.md`, area: "engineering" };
  }

  throw new Error(`Tipo inválido: ${tipo}\nTipos válidos: ${VALID_TYPES.join(", ")}`);
}

/**
 * Insere `newLine` logo após o header `## {area}` — sem nunca descartar uma
 * linha existente. O `publish-file.sh` original usava `getline` do AWK para
 * "pular" a linha seguinte ao header antes de imprimir a nova entrada; essa
 * linha pulada nunca era reimpressa, o que apagava silenciosamente a entrada
 * anterior do índice na segunda publicação numa mesma seção (reproduzido e
 * documentado em `architecture.md` desta sessão, seção 3.4).
 * @param {string} content
 * @param {"product"|"engineering"} area
 * @param {string} newLine
 * @returns {{ content: string, found: boolean }}
 */
export function insertIndexLine(content, area, newLine) {
  const lines = content.split("\n");
  const headerPattern = /^## (product|engineering)\b/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headerPattern);
    if (match && match[1] === area) {
      lines.splice(i + 1, 0, newLine);
      return { content: lines.join("\n"), found: true };
    }
  }

  const trimmed = content.replace(/\n+$/, "");
  return { content: `${trimmed}\n\n## ${area}\n${newLine}\n`, found: false };
}

/**
 * @param {Object} opts
 * @param {string} opts.localFile - Caminho do arquivo local (ex: `./docs/engineering/ard-x.md`)
 * @param {string} opts.tipo - prd|frd|ard|rfc|swagger|qa-report
 * @param {string} opts.feature - Slug da feature (kebab-case)
 * @param {string} opts.squad - Squad (já resolvido pelo caller: override ou ENV.md)
 * @param {string} opts.workspace - Workspace (já resolvido pelo caller: override ou ENV.md)
 * @param {string} opts.repo - CENTRAL_DOCS_REPO
 * @param {string} [opts.targetBranch] - Branch base do MR/PR (padrão: "dev")
 * @param {string|number} [opts.cacheTtl] - TTL do cache do index.md em segundos (padrão: 3600)
 * @returns {Promise<{ sha: string, mr: { vendor: string, iid: number|string, url: string } }>}
 */
export async function publishFile(opts) {
  const {
    localFile,
    tipo,
    feature,
    squad,
    workspace,
    repo,
    targetBranch = "dev",
    cacheTtl = "3600",
  } = opts;

  if (!repo) {
    throw new Error(
      "CENTRAL_DOCS_REPO não configurado no ENV.md\n\nConfigure a URL do repositório central:\n  CENTRAL_DOCS_REPO=https://gitlab.com/org/central-docs.git"
    );
  }

  logger.info("Validando frontmatter...");
  validateFrontmatter(localFile, tipo);
  logger.info("✅ Frontmatter válido");

  const metadata = extractMetadata(localFile);
  const version = metadata.version || "1.0.0";
  const status = metadata.status || "draft";
  const jira = metadata.jira || "";
  const docName = metadata.name || "";

  const { destPath, area } = resolveDestPath({ tipo, squad, workspace, feature, localFile });
  const indexPath = `${squad}/${workspace}/index.md`;
  const branchName = `docs/${squad}/${workspace}/${tipo}-${feature}`;

  logger.info("");
  logger.info("📋 Resumo da Publicação:");
  logger.info(`  Squad: ${squad}`);
  logger.info(`  Workspace: ${workspace}`);
  logger.info(`  Tipo: ${tipo}`);
  logger.info(`  Feature: ${feature}`);
  logger.info(`  Destino: ${destPath}`);
  logger.info(`  Branch: ${branchName} → ${targetBranch}`);
  logger.info("");

  const fileContentBase64 = readFileSync(localFile).toString("base64");

  logger.info("Buscando index.md do workspace...");
  let indexContent = "";
  try {
    indexContent = await fetchFile(indexPath, targetBranch, { repo, cacheTtl });
  } catch {
    indexContent = "";
  }

  let indexAction;
  if (!indexContent) {
    logger.info("⚠️  index.md não encontrado, será criado");
    indexAction = "create";
    indexContent = `# ${workspace}\n\n**Squad:** ${squad}\n\n## ${area}\n\n`;
  } else {
    indexAction = "update";
  }

  let newLine = `- [${tipo}-${feature}.md](${area}/${tipo}-${feature}.md) | v${version} | ${status}`;
  if (jira) newLine += ` | jira: ${jira}`;
  if (docName) newLine += ` | ${docName}`;

  const { content: updatedIndex } = insertIndexLine(indexContent, area, newLine);
  const updatedIndexBase64 = Buffer.from(updatedIndex, "utf-8").toString("base64");

  logger.info("Criando branch e commit...");
  const commitResult = await commitFiles(repo, {
    branch: branchName,
    startBranch: targetBranch,
    message: `docs(${squad}): add ${tipo} ${feature}`,
    files: [
      { path: destPath, contentBase64: fileContentBase64, action: "create" },
      { path: indexPath, contentBase64: updatedIndexBase64, action: indexAction },
    ],
  });
  logger.info(`✅ Commit criado: ${commitResult.sha}`);

  logger.info("Criando Merge/Pull Request...");
  let mrDescription = `## Documento\n\n- **Tipo**: ${tipo}\n- **Workspace**: ${workspace}\n- **Feature**: ${feature}`;
  if (jira) mrDescription += `\n- **Card**: ${jira}`;
  if (docName) mrDescription += `\n- **Nome**: ${docName}`;

  const mr = await createMergeRequest(repo, {
    source: branchName,
    target: targetBranch,
    title: `docs(${squad}): ${tipo} ${feature}`,
    description: mrDescription,
  });

  logger.info("");
  logger.info("✅ Merge/Pull Request criado com sucesso!");
  logger.info("");
  logger.info(`  #${mr.iid}: ${branchName} → ${targetBranch}`);
  logger.info(`  URL: ${mr.url}`);
  logger.info("");

  redisDel(`docs:${indexPath}:${targetBranch}`);
  redisDel(`docs:${indexPath}:main`);
  logger.info("🔄 Cache Redis invalidado");
  logger.info("");
  logger.info("✅ Publicação concluída!");

  return { sha: commitResult.sha, mr };
}
