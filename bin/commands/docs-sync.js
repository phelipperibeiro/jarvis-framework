import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

// Contagem pelo link que renderIndex gera (build-index.js): a página da funcionalidade
// termina em `/{slug}/{slug}.md`; a entrega mora em `/{slug}/deliveries/delivery-*.md`.
const COUNTED = [
  ["feature", "funcionalidade(s)", /\]\(([a-z0-9_-]+)\/\1\/\1\.md\)/gi],
  ["delivery", "entrega(s) recente(s)", /\]\([a-z0-9_-]+\/[a-z0-9_-]+\/deliveries\/delivery-[^)]*\.md\)/gi],
];

/**
 * Sincroniza a documentação do Central docs (lê `{SQUAD}/index.md` pelo adaptador).
 * Executado automaticamente em /warm-up.
 *
 * @param {Object} flags - Flags do comando
 * @param {boolean} flags.silent - Modo silencioso (nem erros aparecem)
 * @param {boolean} flags.quiet - Só erros aparecem
 * @param {boolean} flags.verbose - Mostra o conteúdo completo retornado
 * @param {string} [flags.env] - Path explícito do ENV.md (`--env`; a alternativa `--env-file` chega em `flags["env-file"]`)
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

    const counts = COUNTED.map(([tipo, label, re]) => [
      tipo,
      label,
      (content.match(re) || []).length,
    ]).filter(([, , n]) => n > 0);
    const total = counts.reduce((sum, [, , n]) => sum + n, 0);

    if (total > 0) {
      logger.info(`📊 ${total} documentos disponíveis:`);
      for (const [, label, n] of counts) logger.info(`   - ${n} ${label}`);
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
