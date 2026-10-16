import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

const COUNTED_TYPES = ["prd", "frd", "feat", "epic", "story", "task", "ard", "rfc"];

/**
 * Sincroniza a documentação do Central docs (lê `{SQUAD}/index.md` pelo adaptador).
 * Executado automaticamente em /warm-up.
 *
 * @param {Object} flags - Flags do comando
 * @param {boolean} flags.silent - Modo silencioso (nem erros aparecem)
 * @param {boolean} flags.quiet - Só erros aparecem
 * @param {boolean} flags.verbose - Mostra o conteúdo completo retornado
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsSync(flags = {}) {
  configureFromFlags(flags);

  let env;
  let storage;
  try {
    ({ env, storage } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }

  if (!storage) {
    logger.info("ℹ️  Central docs desligado (CENTRAL_DOCS_STORAGE vazio)");
    return;
  }

  const { SQUAD } = env;
  if (!SQUAD) {
    logger.error("❌ SQUAD não definido no ENV.md");
    process.exit(1);
  }

  logger.info(
    `🔄 Sincronizando docs do squad ${SQUAD} (${storage.kind}${storage.isGit ? " + git" : ""})...`
  );

  try {
    const content = await storage.fetch(`${SQUAD}/index.md`);
    logger.info("✅ Docs sincronizados");

    logger.debug("\n📄 Conteúdo do index.md:\n");
    logger.debug(content);

    const counts = COUNTED_TYPES.map((tipo) => [
      tipo,
      (content.match(new RegExp(`\\[${tipo}-[^\\]]*\\]`, "g")) || []).length,
    ]).filter(([, n]) => n > 0);
    const total = counts.reduce((sum, [, n]) => sum + n, 0);

    if (total > 0) {
      logger.info(`📊 ${total} documentos disponíveis:`);
      for (const [tipo, n] of counts) logger.info(`   - ${n} ${tipo.toUpperCase()}(s)`);
    }
  } catch (error) {
    logger.error("❌ Erro ao sincronizar docs:", error.message);
    if (error.code === 404) {
      logger.error("\n💡 O squad ainda não tem índice no Central docs:");
      logger.error(`   ${SQUAD}/index.md (é criado na primeira publicação: jarvis docs publish)`);
    }
    process.exit(1);
  }
}
