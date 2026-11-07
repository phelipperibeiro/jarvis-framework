import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { isEntryList } from "../lib/docs/finish-delivery.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Passo 2 da consolidação (#220): arquiva os originais dos documentos de trabalho publicados
 * em `decisions/` — copia para `archive/` da mesma funcionalidade, sem apagar nada. Lê e
 * **reescreve** o mesmo manifesto do `jarvis docs publish --manifest`, acrescentando
 * `archiveDestPath`/`archivedHash` em cada entrada arquivada, para o `--finalize` ler depois.
 *
 * @param {Object} flags
 * @param {string} flags.manifest - O mesmo manifesto usado no publish
 * @param {string} [flags.squad] - Override do SQUAD do ENV.md
 * @param {string} [flags.produto] - Override do WORKSPACE do ENV.md
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsArchive(flags = {}) {
  configureFromFlags(flags);

  if (!flags.manifest) {
    logger.error("❌ --manifest <path> é obrigatório (o mesmo manifesto do jarvis docs publish).");
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
  if (!isEntryList(entries)) {
    logger.error(`❌ Manifesto no formato errado (${flags.manifest}): esperada uma lista de entradas (objetos).`);
    process.exit(1);
  }

  let env;
  let storage;
  try {
    ({ env, storage } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }
  if (!storage) {
    logger.error("❌ Central docs desligado (CENTRAL_DOCS_STORAGE vazio no ENV.md).");
    process.exit(1);
  }
  if (storage.kind !== "filesystem") {
    logger.error(`❌ jarvis docs archive só funciona com CENTRAL_DOCS_STORAGE=filesystem.`);
    process.exit(1);
  }

  const squad = flags.squad || env.SQUAD;
  const produto = flags.produto || flags.workspace || env.WORKSPACE;
  if (!squad || !produto) {
    logger.error("❌ SQUAD ou WORKSPACE não definidos");
    process.exit(1);
  }

  if (!storage.isGit) {
    logger.info(
      "⚠️  Central docs sem .git: o arquivo em archive/ é a única cópia do original, além dele mesmo (Q14, #220)."
    );
  }

  const { archived, skipped, errors, branch, mr } = await storage.archiveBatch({
    squad,
    produto,
    entries,
  });

  writeFileSync(flags.manifest, JSON.stringify(entries, null, 2));

  logger.info(`📦 Arquivamento — ${archived.length} documento(s) copiado(s) para archive/`);
  for (const a of archived) logger.info(`   - ${a.originalPath} → ${a.archiveDestPath}`);
  for (const s of skipped) logger.info(`   ⚠️  Pulado (${s.reason}): ${s.originalPath}`);
  if (branch) logger.info(`🌿 Branch: ${branch}`);
  if (mr) logger.info(`🔀 Pull/Merge Request: ${mr.url}`);
  if (errors.length > 0) {
    logger.error(`⚠️  ${errors.length} erro(s):`);
    for (const e of errors) logger.error(`   - ${e}`);
    process.exit(1);
  }
  logger.info("\nOs originais continuam onde estavam. Nada foi apagado.");
}
