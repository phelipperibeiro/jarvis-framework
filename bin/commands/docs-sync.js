import { loadEnv, resolveEnvPath } from "../lib/env-loader.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // Verificar se script fetch-file.sh existe
  // Usar path relativo ao módulo, não ao cwd do usuário
  const fetchScript = join(__dirname, "../lib/docs/fetch-file.sh");
  if (!existsSync(fetchScript)) {
    logger.error("❌ Script não encontrado:", fetchScript);
    process.exit(1);
  }

  // Buscar index.md do squad
  const indexPath = `${SQUAD}/index.md`;

  try {
    // Exportar variáveis de ambiente para o script bash
    const envVars = {
      ...process.env,
      CENTRAL_DOCS_REPO: env.CENTRAL_DOCS_REPO,
      CENTRAL_DOCS_CACHE_TTL: env.CENTRAL_DOCS_CACHE_TTL || "3600",
    };

    const { stdout, stderr } = await execAsync(
      `bash "${fetchScript}" "${indexPath}" "${CENTRAL_DOCS_REF}"`,
      { env: envVars }
    );

    logger.info("✅ Docs sincronizados");

    if (stdout) {
      logger.debug("\n📄 Conteúdo do index.md:\n");
      logger.debug(stdout);
    }

    // Parsear index.md para contar documentos
    if (stdout) {
      const prdCount = (stdout.match(/\[prd-.*\.md\]/g) || []).length;
      const frdCount = (stdout.match(/\[frd-.*\.md\]/g) || []).length;
      const ardCount = (stdout.match(/\[ard-.*\.md\]/g) || []).length;
      const rfcCount = (stdout.match(/\[rfc-.*\.md\]/g) || []).length;

      const total = prdCount + frdCount + ardCount + rfcCount;

      if (total > 0) {
        logger.info(`📊 ${total} documentos disponíveis:`);
        if (prdCount > 0) logger.info(`   - ${prdCount} PRD(s)`);
        if (frdCount > 0) logger.info(`   - ${frdCount} FRD(s)`);
        if (ardCount > 0) logger.info(`   - ${ardCount} ARD(s)`);
        if (rfcCount > 0) logger.info(`   - ${rfcCount} RFC(s)`);
      }
    }

    if (stderr) {
      logger.warn("⚠️  Avisos:", stderr);
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
