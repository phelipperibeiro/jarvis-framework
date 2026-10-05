import { loadEnv, resolveEnvPath } from "../lib/env-loader.js";
import { existsSync } from "node:fs";
import { publishFile } from "../lib/docs/publish-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Publica documento no central-docs via GitLab API (branch + MR)
 *
 * @param {Object} flags - Flags do comando
 * @param {string} flags.file - Caminho do arquivo local
 * @param {string} flags.tipo - Tipo do documento (prd|frd|ard|rfc)
 * @param {string} flags.feature - Slug da feature (kebab-case)
 * @param {string} flags.squad - Squad (opcional, override do ENV.md)
 * @param {string} flags.workspace - Workspace (opcional, override do ENV.md)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsPublish(flags = {}) {
  configureFromFlags(flags);

  const { file, tipo, feature, squad: squadOverride, workspace: workspaceOverride } = flags;

  // Validar parâmetros obrigatórios
  if (!file || !tipo || !feature) {
    logger.error("❌ Parâmetros obrigatórios faltando\n");
    logger.error(
      "Uso: jarvis docs publish --file <path> --tipo <prd|frd|ard|rfc|swagger|qa-report> --feature <slug> [--squad <squad>] [--workspace <workspace>]\n"
    );
    logger.error("Exemplo:");
    logger.error("  jarvis docs publish \\");
    logger.error("    --file ./docs/engineering/ard-api-wallet.md \\");
    logger.error("    --tipo ard \\");
    logger.error("    --feature api-wallet-auth-jwt");
    logger.error("");
    logger.error("  # Publicar Swagger/OpenAPI:");
    logger.error("  jarvis docs publish \\");
    logger.error("    --file ./docs/engineering/swagger/api-wallet.yaml \\");
    logger.error("    --tipo swagger \\");
    logger.error("    --feature api-wallet");
    logger.error("");
    logger.error("  # Com override de squad/workspace:");
    logger.error("  jarvis docs publish \\");
    logger.error("    --file ./docs/engineering/ard-api-wallet.md \\");
    logger.error("    --tipo ard \\");
    logger.error("    --feature api-wallet-auth-jwt \\");
    logger.error("    --squad core \\");
    logger.error("    --workspace meu-workspace");
    process.exit(1);
  }

  // Validar tipo
  const validTypes = ["prd", "frd", "ard", "rfc", "swagger", "qa-report"];
  if (!validTypes.includes(tipo)) {
    logger.error(`❌ Tipo inválido: ${tipo}`);
    logger.error(`Tipos válidos: ${validTypes.join(", ")}`);
    process.exit(1);
  }

  // Validar se arquivo existe
  if (!existsSync(file)) {
    logger.error(`❌ Arquivo não encontrado: ${file}`);
    process.exit(1);
  }

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
    logger.error("❌ CENTRAL_DOCS_REPO não configurado no ENV.md");
    logger.error("\nConfigure a URL do repositório central:");
    logger.error("  CENTRAL_DOCS_REPO=https://gitlab.com/org/central-docs.git");
    process.exit(1);
  }

  // Usar override de squad/workspace se fornecido, senão usar do ENV.md
  const squad = squadOverride || env.SQUAD;
  const workspace = workspaceOverride || env.WORKSPACE;

  if (!squad || !workspace) {
    logger.error("❌ SQUAD ou WORKSPACE não definidos");
    logger.error("\nOpções:");
    logger.error("  1. Definir no ENV.md:");
    logger.error("     SQUAD=core");
    logger.error("     WORKSPACE=meu-workspace");
    logger.error("");
    logger.error("  2. Passar via flags:");
    logger.error("     --squad core --workspace meu-workspace");
    process.exit(1);
  }

  logger.info(`📤 Publicando ${tipo.toUpperCase()} ${feature}...\n`);

  try {
    await publishFile({
      localFile: file,
      tipo,
      feature,
      squad,
      workspace,
      repo: env.CENTRAL_DOCS_REPO,
      targetBranch: env.CENTRAL_DOCS_TARGET_BRANCH || "dev",
      cacheTtl: env.CENTRAL_DOCS_CACHE_TTL || "3600",
    });
  } catch (error) {
    logger.error("\n❌ Erro ao publicar documento\n");
    logger.error(error.message);

    // Dicas de troubleshooting
    logger.error("\n💡 Troubleshooting:\n");

    if (error.message.includes("Token GitLab")) {
      logger.error("1. Configure o token GitLab no .npmrc:");
      logger.error("   //gitlab.com/api/v4/packages/npm/:_authToken=seu-token\n");
    }

    if (error.message.includes("Campos obrigatórios")) {
      logger.error("2. Verifique o frontmatter do documento:");
      logger.error(`   Tipo ${tipo} requer campos específicos no YAML\n`);
    }

    if (error.message.includes("401") || error.message.includes("403")) {
      logger.error("4. Verifique permissões no GitLab:");
      logger.error("   Token precisa de scopes: api, read_api, write_repository\n");
    }

    logger.error("Para mais detalhes, execute com --verbose");

    process.exit(1);
  }
}
