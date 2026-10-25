import { existsSync } from "node:fs";
import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { publishFile, VALID_TYPES, WORKING_DOC_TYPES } from "../lib/docs/publish-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Publica um documento no Central docs pelo adaptador configurado.
 * Sem `.git` na pasta: copia e regenera o índice. Com `.git`: branch, commit, push e PR.
 *
 * @param {Object} flags - Flags do comando
 * @param {string} flags.file - Caminho do arquivo local
 * @param {string} flags.tipo - feature | delivery (ver VALID_TYPES)
 * @param {string} [flags.produto] - Pasta do produto (padrão: WORKSPACE do ENV.md)
 * @param {string} [flags.feature] - Slug, só se o nome do arquivo fugir do padrão {tipo}-{nome}.md
 * @param {string} [flags.squad] - Override do SQUAD do ENV.md
 * @param {string} [flags.workspace] - Override do WORKSPACE (padrão do --produto)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsPublish(flags = {}) {
  configureFromFlags(flags);

  const {
    file,
    tipo,
    feature,
    produto,
    squad: squadOverride,
    workspace: workspaceOverride,
  } = flags;

  if (!file || !tipo) {
    logger.error("❌ Parâmetros obrigatórios faltando\n");
    logger.error(
      `Uso: jarvis docs publish --file <path> --tipo <${VALID_TYPES.join("|")}> [--produto <produto>] [--feature <slug>] [--squad <squad>]\n`
    );
    logger.error(
      "Normalmente chamado pelo /eng.spec-consolidate, que gera os dois arquivos na sessão:"
    );
    logger.error(
      "  jarvis docs publish --file .jarvis/sessions/eng/task-123/consolidation/delivery-2026-10-15-task-123.md --tipo delivery"
    );
    logger.error(
      "  jarvis docs publish --file .jarvis/sessions/eng/task-123/consolidation/feature-checkout.md --tipo feature"
    );
    process.exit(1);
  }

  if (WORKING_DOC_TYPES.includes(tipo)) {
    logger.error(
      `❌ O Central docs guarda só o que foi implementado: "${tipo}" é um documento de trabalho.`
    );
    logger.error("   Ele fica em docs/jarvis/. Gere a consolidação com /eng.spec-consolidate.");
    process.exit(1);
  }

  if (!VALID_TYPES.includes(tipo)) {
    logger.error(`❌ Tipo inválido: ${tipo}`);
    logger.error(`Tipos válidos: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  if (!existsSync(file)) {
    logger.error(`❌ Arquivo não encontrado: ${file}`);
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
    logger.error("   Configure-o com o /jarvis-init.");
    process.exit(1);
  }

  const squad = squadOverride || env.SQUAD;
  const product = produto || workspaceOverride || env.WORKSPACE;

  if (!squad || !product) {
    logger.error("❌ SQUAD ou WORKSPACE não definidos");
    logger.error("   Defina no ENV.md ou passe --squad <squad> --produto <produto>");
    process.exit(1);
  }

  logger.info(`📤 Publicando ${tipo.toUpperCase()} (${file})...\n`);

  try {
    await publishFile({ storage, localFile: file, tipo, squad, produto: product, feature });
    logger.info("");
    logger.info("✅ Publicação concluída!");
  } catch (error) {
    logger.error("\n❌ Erro ao publicar documento\n");
    logger.error(error.message);

    if (error.message.includes("Campos obrigatórios")) {
      logger.error(
        `\n💡 Verifique o frontmatter do documento: o tipo ${tipo} exige campos específicos.`
      );
    }
    if (storage.isGit) {
      logger.error(
        "\n💡 Central docs com git: confira se a pasta está limpa (git status), se você tem permissão de push"
      );
      logger.error(
        "   e se a CLI do host está logada (gh auth login, glab auth login)."
      );
    }
    process.exit(1);
  }
}
