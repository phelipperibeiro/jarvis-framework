import { existsSync, readFileSync } from "node:fs";
import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { finalizeEntries } from "../lib/docs/finish-delivery.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Passo 3 da consolidação (#220): apaga os originais já arquivados (`--archive` antes), só os
 * que não mudaram desde então (Q13; o que mudou **não é apagado** e entra no relatório),
 * depois de reescrever as referências (`related_*`) que apontavam para eles. Irreversível —
 * o original só existe mais em `archive/` (ou em nenhum lugar, se também apagado de lá).
 *
 * @param {Object} flags
 * @param {string} flags.manifest - O manifesto já passado por `--archive` (tem `archiveDestPath`)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsFinalize(flags = {}) {
  configureFromFlags(flags);

  if (!flags.manifest) {
    logger.error("❌ --manifest <path> é obrigatório (o manifesto já arquivado com --archive).");
    process.exit(1);
  }
  if (!existsSync(flags.manifest)) {
    logger.error(`❌ Manifesto não encontrado: ${flags.manifest}`);
    process.exit(1);
  }

  let entries;
  try {
    entries = JSON.parse(readFileSync(flags.manifest, "utf-8"));
  } catch (error) {
    logger.error(`❌ Manifesto inválido (${flags.manifest}): ${error.message}`);
    process.exit(1);
  }

  const pendentes = entries.filter((e) => e.originalPath && !e.archiveDestPath);
  if (pendentes.length > 0) {
    logger.error(
      `❌ ${pendentes.length} documento(s) sem arquivar ainda. Rode "jarvis docs archive --manifest ${flags.manifest}" antes.`
    );
    for (const p of pendentes) logger.error(`   - ${p.originalPath}`);
    process.exit(1);
  }

  let env;
  let storage;
  let workspaceRoot;
  try {
    ({ env, storage, root: workspaceRoot } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }

  const squad = flags.squad || env.SQUAD;
  const produto = flags.produto || flags.workspace || env.WORKSPACE;

  const { finalized, changed, rewritten, errors } = finalizeEntries({
    entries,
    env,
    root: storage?.location,
    squad,
    produto,
    workspaceRoot,
  });

  logger.info(`🧹 Finalização — ${finalized.length} original(is) removido(s)`);
  for (const f of finalized) logger.info(`   - ${f.originalPath}`);
  if (rewritten.length > 0) {
    logger.info(`🔗 ${rewritten.length} referência(s) (related_*) reescrita(s):`);
    for (const r of rewritten) logger.info(`   - ${r}`);
  }
  if (changed.length > 0) {
    logger.info(`⚠️  ${changed.length} documento(s) NÃO foram removidos:`);
    for (const c of changed) logger.info(`   - ${c.originalPath} (${c.reason})`);
  }
  if (errors.length > 0) {
    logger.error(`⚠️  ${errors.length} erro(s):`);
    for (const e of errors) logger.error(`   - ${e}`);
    process.exit(1);
  }
}
