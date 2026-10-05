import { loadEnv, resolveEnvPath } from "../lib/env-loader.js";
import { fetchFile } from "../lib/docs/fetch-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Sincroniza documentação do central-docs
 * Executado automaticamente em /warm-up
 *
 * @param {Object} flags - Flags do comando
 * @param {boolean} flags.silent - Modo silencioso (nem erros aparecem)
 * @param {boolean} flags.quiet - Só erros aparecem
 * @param {boolean} flags.verbose - Mostra o conteúdo completo retornado
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsSync(flags = {}) {
  configureFromFlags(flags);

  const cwd = process.cwd();

  // Resolver path do ENV.md (suporta --ide e --env-file)
  let envPath;
  try {
    const resolved = resolveEnvPath(cwd, flags);
    envPath = resolved.path;
  } catch (error) {
    logger.error("❌ Erro ao resolver ENV.md:", error.message);
    process.exit(1);
  }

  // Carregar ENV.md
  let env;
  try {
    env = loadEnv(cwd, envPath);
  } catch (error) {
    logger.error("❌ Erro ao carregar ENV.md:", error.message);
    process.exit(1);
  }

  // Verificar se central-docs está configurado
  if (!env.CENTRAL_DOCS_REPO) {
    logger.info("ℹ️  Central docs não configurado (CENTRAL_DOCS_REPO vazio)");
    return;
  }

  const { SQUAD, WORKSPACE, CENTRAL_DOCS_REF = "main" } = env;

  if (!SQUAD || !WORKSPACE) {
    logger.error("❌ SQUAD ou WORKSPACE não definidos no ENV.md");
    process.exit(1);
  }

  logger.info(`🔄 Sincronizando docs do squad ${SQUAD}...`);

  // Buscar index.md do squad
  const indexPath = `${SQUAD}/index.md`;

  try {
    const content = await fetchFile(indexPath, CENTRAL_DOCS_REF, {
      repo: env.CENTRAL_DOCS_REPO,
      cacheTtl: env.CENTRAL_DOCS_CACHE_TTL || "3600",
    });

    logger.info("✅ Docs sincronizados");

    if (content) {
      logger.debug("\n📄 Conteúdo do index.md:\n");
      logger.debug(content);
    }

    // Parsear index.md para contar documentos
    if (content) {
      const prdCount = (content.match(/\[prd-.*\.md\]/g) || []).length;
      const frdCount = (content.match(/\[frd-.*\.md\]/g) || []).length;
      const ardCount = (content.match(/\[ard-.*\.md\]/g) || []).length;
      const rfcCount = (content.match(/\[rfc-.*\.md\]/g) || []).length;

      const total = prdCount + frdCount + ardCount + rfcCount;

      if (total > 0) {
        logger.info(`📊 ${total} documentos disponíveis:`);
        if (prdCount > 0) logger.info(`   - ${prdCount} PRD(s)`);
        if (frdCount > 0) logger.info(`   - ${frdCount} FRD(s)`);
        if (ardCount > 0) logger.info(`   - ${ardCount} ARD(s)`);
        if (rfcCount > 0) logger.info(`   - ${rfcCount} RFC(s)`);
      }
    }
  } catch (error) {
    logger.error("❌ Erro ao sincronizar docs:", error.message);

    // Dicas de troubleshooting
    if (error.message.includes("Token GitLab")) {
      logger.error("\n💡 Configure o token GitLab no .npmrc:");
      logger.error("   //gitlab.com/api/v4/packages/npm/:_authToken=seu-token");
    } else if (error.message.includes("não encontrado")) {
      logger.error("\n💡 Verifique se o squad existe no central-docs:");
      logger.error(`   ${SQUAD}/index.md`);
    }

    process.exit(1);
  }
}
