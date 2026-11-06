import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { publishFile, publishFiles, VALID_TYPES } from "../lib/docs/publish-file.js";
import { forceFinalize } from "../lib/docs/finish-delivery.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

function openEnvAndStorage(flags) {
  let env;
  let storage;
  let root;
  try {
    ({ env, storage, root } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }
  if (!storage) {
    logger.error("❌ Central docs desligado (CENTRAL_DOCS_STORAGE vazio no ENV.md).");
    logger.error("   Configure-o com o /jarvis-init.");
    process.exit(1);
  }
  return { env, storage, root };
}

function resolveSquadProduto(flags, env) {
  const squad = flags.squad || env.SQUAD;
  const produto = flags.produto || flags.workspace || env.WORKSPACE;
  if (!squad || !produto) {
    logger.error("❌ SQUAD ou WORKSPACE não definidos");
    logger.error("   Defina no ENV.md ou passe --squad <squad> --produto <produto>");
    process.exit(1);
  }
  return { squad, produto };
}

function reportPublishError(error, storage, tipo) {
  logger.error("\n❌ Erro ao publicar documento\n");
  logger.error(error.message);
  if (error.message.includes("Campos obrigatórios")) {
    logger.error(`\n💡 Verifique o frontmatter do documento: o tipo ${tipo} exige campos específicos.`);
  }
  if (storage.isGit) {
    logger.error(
      "\n💡 Central docs com git: confira se a pasta está limpa (git status), se você tem permissão de push"
    );
    logger.error("   e se a CLI do host está logada (gh auth login, glab auth login).");
  }
}

/**
 * Lê um manifesto `[{file, tipo, feature?, taskKey?, relPath?, fromSession?}, …]` (caminhos
 * relativos à pasta do manifesto). Gerado pelo `/eng.spec-consolidate` a partir da listagem
 * "move / fica" (#220). `relPath` (só `history`) preserva subpastas da sessão; `fromSession`
 * marca o arquivo vindo de uma sessão (#229).
 */
function readManifest(path) {
  if (!existsSync(path)) {
    logger.error(`❌ Manifesto não encontrado: ${path}`);
    process.exit(1);
  }
  let entries;
  try {
    entries = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    logger.error(`❌ Manifesto inválido (${path}): ${error.message}`);
    process.exit(1);
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    logger.error(`❌ Manifesto vazio ou no formato errado: ${path}`);
    process.exit(1);
  }
  const base = dirname(path);
  return entries.map(({ file, ...rest }) => ({ ...rest, localFile: join(base, file) }));
}

/**
 * Grava no manifesto, por entrada, onde o arquivo foi de fato publicado (`publishedAs`, que
 * pode ser um `-vN`, Q6 da #229) e o hash do conteúdo publicado (`publishedHash`): o
 * `--archive` e o `--finalize` usam o nome certo, e o `--force` confere a cópia antes de apagar a
 * sessão. As entradas em memória (`files`) recebem os mesmos campos, para o `--force` do mesmo
 * processo. Só regrava o JSON cru, sem tocar nos outros campos.
 * @param {string} manifestPath
 * @param {Array<Object>} files - Entradas lidas por `readManifest`
 * @param {Array<{destPath: string, hash?: string}>} published - Na ordem das entradas
 */
function recordPublished(manifestPath, files, published) {
  if (!Array.isArray(published) || published.length !== files.length) return;
  const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
  if (!Array.isArray(raw) || raw.length !== files.length) return;
  published.forEach((p, i) => {
    raw[i].publishedAs = p.destPath;
    files[i].publishedAs = p.destPath;
    if (p.hash) {
      raw[i].publishedHash = p.hash;
      files[i].publishedHash = p.hash;
    }
  });
  writeFileSync(manifestPath, JSON.stringify(raw, null, 2));
}

/**
 * Publica no Central docs pelo adaptador configurado.
 * Sem `.git` na pasta: copia e regenera o índice. Com `.git`: branch, commit, push e PR.
 *
 * @param {Object} flags - Flags do comando
 * @param {string} [flags.file] - Caminho do arquivo local (um só; alternativa ao `--manifest`)
 * @param {string} [flags.tipo] - Ver VALID_TYPES (feature, delivery, product, history e os
 *   documentos de trabalho ligados a uma entrega consolidada)
 * @param {string} [flags.manifest] - Caminho de um manifesto JSON com vários arquivos (publicação
 *   em lote: uma branch e um PR só, em vez de um por arquivo)
 * @param {string} [flags.slug] - Nome da branch/commit do lote (ex.: a chave da entrega)
 * @param {string} [flags.produto] - Pasta do produto (padrão: WORKSPACE do ENV.md)
 * @param {string} [flags.feature] - Slug da funcionalidade. Opcional para `feature` quando o
 *   nome do arquivo segue `feature-{slug}.md`; obrigatório para `delivery` e para os
 *   documentos de trabalho (é a funcionalidade dona da pasta `decisions/`)
 * @param {string} [flags.taskKey] - Obrigatório para `--tipo history`
 * @param {string} [flags.squad] - Override do SQUAD do ENV.md
 * @param {string} [flags.workspace] - Override do WORKSPACE (padrão do --produto)
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsPublish(flags = {}) {
  configureFromFlags(flags);

  if (flags.manifest) {
    return docsPublishManifest(flags);
  }

  const { file, tipo, feature, taskKey } = flags;

  if (!file || !tipo) {
    logger.error("❌ Parâmetros obrigatórios faltando\n");
    logger.error(
      `Uso: jarvis docs publish --file <path> --tipo <${VALID_TYPES.join("|")}> [--produto <produto>] [--feature <slug>] [--task-key <chave>] [--squad <squad>]\n` +
        "   ou: jarvis docs publish --manifest <path> [--slug <chave>] (publicação em lote)\n"
    );
    logger.error("Normalmente chamado pelo /eng.spec-consolidate, que gera os arquivos na sessão:");
    logger.error("  jarvis docs publish --file .../consolidation/feature-checkout.md --tipo feature");
    logger.error(
      "  jarvis docs publish --file .../consolidation/delivery-2026-10-15-task-123.md --tipo delivery --feature checkout"
    );
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

  const { env, storage } = openEnvAndStorage(flags);
  const { squad, produto } = resolveSquadProduto(flags, env);

  logger.info(`📤 Publicando ${tipo.toUpperCase()} (${file})...\n`);

  try {
    await publishFile({ storage, localFile: file, tipo, squad, produto, feature, taskKey });
    logger.info("");
    logger.info("✅ Publicação concluída!");
  } catch (error) {
    reportPublishError(error, storage, tipo);
    process.exit(1);
  }
}

async function docsPublishManifest(flags) {
  const files = readManifest(flags.manifest);
  const { env, storage, root } = openEnvAndStorage(flags);
  const { squad, produto } = resolveSquadProduto(flags, env);

  logger.info(`📤 Publicando a consolidação em lote (${files.length} arquivo(s))...\n`);

  try {
    const result = await publishFiles({ storage, squad, produto, slug: flags.slug, files });
    recordPublished(flags.manifest, files, result.published);
    logger.info("");
    logger.info("✅ Publicação concluída!");
  } catch (error) {
    reportPublishError(error, storage, "lote");
    process.exit(1);
  }

  if (!flags.force) return;

  // --force (Q15, #220): publica e já apaga os originais, sem --archive. Zero reversão.
  logger.info("\n⚠️  --force: finalizando sem arquivar (zero reversão)...");
  const { finalized, rewritten, errors } = forceFinalize({
    entries: files,
    squad,
    produto,
    env,
    workspaceRoot: root,
  });
  logger.info(`🧹 ${finalized.length} original(is) removido(s) (sem cópia em archive/)`);
  for (const f of finalized) logger.info(`   - ${f.originalPath}`);
  if (rewritten.length > 0) {
    logger.info(`🔗 ${rewritten.length} referência(s) (related_*) reescrita(s):`);
    for (const r of rewritten) logger.info(`   - ${r}`);
  }
  if (errors.length > 0) {
    logger.error(`⚠️  ${errors.length} erro(s) ao finalizar:`);
    for (const e of errors) logger.error(`   - ${e}`);
    process.exit(1);
  }
}
