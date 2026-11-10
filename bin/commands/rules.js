import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { resolveEnvPath, loadEnv } from "../lib/env-loader.js";
import { syncRulesForProfile } from "../lib/core/sync-engine.js";
import { getIDEFolder, getIDEValues } from "../lib/config/ide-config.js";
import { LOCK_FILE } from "../lib/config/constants.js";
import { getPackageInfo } from "../lib/utils/paths.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { RED, GREEN, YELLOW, CYAN, NC } from "../lib/utils/ui.js";

/**
 * Versão do `jarvis-lock.json` da pasta (a da IDE ou a raiz do workspace), ou `null` sem o arquivo.
 * Arquivo presente, mas ilegível ou sem `version`, interrompe o comando: não cai para outro lock.
 * @param {string} dir
 */
function readLock(dir) {
  const lockPath = join(dir, LOCK_FILE);
  if (!existsSync(lockPath)) return null;
  let version;
  try {
    version = JSON.parse(readFileSync(lockPath, "utf-8")).version;
  } catch {
    // tratado abaixo
  }
  if (!version) fail(`${lockPath} ilegível ou sem versão: rode \`jarvis init --upgrade\``);
  return version;
}

/** Pasta (o `cwd` ou uma acima) que tem a pasta `folder` da IDE, ou `null`. */
function findWorkspaceWith(folder) {
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    if (existsSync(join(dir, folder))) return dir;
    if (dirname(dir) === dir) return null;
  }
}

function fail(message) {
  logger.error(`${RED}❌ ${message}${NC}`);
  logger.info(
    `${YELLOW}Sem o comando, o /jarvis-init segue skills/jarvis-init/assets/rules-sync-manual.md.${NC}\n`
  );
  process.exit(1);
}

/**
 * `jarvis rules sync`: Passo 8 do `/jarvis-init` pelo CLI (#102). Sincroniza `.{ide}/rules/` e
 * `.{ide}/rules-on-demand/` com o ENV.md (as duas exceções seguem `ARTIFACT_STYLE` e `RTK_ENABLED`,
 * #263) e aplica o overlay de `COMPANY_PROFILE`. Sai com 1, sem gravar nada, sem ENV.md numa pasta
 * de IDE ou com o lock ausente ou de outra versão (os assets da IDE seriam de outra versão que as
 * rules do Jarvis em uso).
 * @param {{ ide?: string, "env-file"?: string }} flags
 */
export async function rulesSync(flags) {
  configureFromFlags(flags);

  let resolved;
  try {
    resolved = resolveEnvPath(process.cwd(), flags);
  } catch (err) {
    fail(err.message);
  }
  // Sem --ide, a pasta filtrada é a do ENV.md. Fora de uma pasta de IDE (o fallback legado do
  // resolveEnvPath, ou um --env-file/JARVIS_ENV_FILE em outro lugar), o comando gravaria rules ali.
  // Com --ide, o ENV.md pode vir de fora de uma IDE (o workspace é então a pasta, o cwd ou uma
  // acima, que tem a .{ide}/), mas não da pasta de outra IDE.
  const ideFolders = getIDEValues().map((ide) => `.${getIDEFolder(ide)}`);
  const envFolder = basename(dirname(resolved.path));
  if (!flags.ide && !ideFolders.includes(envFolder)) {
    fail(
      `ENV.md não encontrado na pasta de uma IDE (${resolved.path}): rode \`jarvis init\` ou passe --ide`
    );
  }
  const ideFolder = flags.ide ? `.${getIDEFolder(flags.ide)}` : envFolder;
  if (ideFolders.includes(envFolder) && envFolder !== ideFolder) {
    fail(
      `ENV.md de outra IDE (${envFolder}/) com --ide ${flags.ide}: use o ENV.md de ${ideFolder}/`
    );
  }
  let workspaceDir = dirname(dirname(resolved.path));
  if (!ideFolders.includes(envFolder)) {
    workspaceDir = findWorkspaceWith(ideFolder);
    if (workspaceDir === null) {
      fail(
        `Pasta ${ideFolder}/ não encontrada a partir de ${process.cwd()}: rode o comando na pasta do workspace`
      );
    }
  }
  const ideDir = join(workspaceDir, ideFolder);
  const envText = readFileSync(resolved.path, "utf-8");
  const env = loadEnv(process.cwd(), resolved.path);

  // O lock da IDE filtrada vale primeiro: com duas IDEs, o da raiz é o do último init.
  const lock = readLock(ideDir) ?? readLock(workspaceDir);
  const running = getPackageInfo().version;
  if (lock === null) fail(`Sem ${LOCK_FILE} no workspace: rode \`jarvis init\``);
  if (lock !== running) {
    fail(
      `assets da ${lock} e Jarvis ${running}: rode \`jarvis init --upgrade\` (ou sincronize sem o CLI)`
    );
  }

  const profile = { ARTIFACT_STYLE: env.ARTIFACT_STYLE || "ai-generated" };
  const rtkEnabled = env.RTK_ENABLED === "true";
  const result = syncRulesForProfile(ideDir, profile, { rtkEnabled, envText });

  logger.info(
    `${CYAN}🔍 Sincronizando rules: ARTIFACT_STYLE=${profile.ARTIFACT_STYLE} | RTK=${rtkEnabled ? "ligado" : "desligado"}${NC}\n`
  );
  for (const warning of result.warnings) logger.info(`${YELLOW}⚠️  ${warning}${NC}`);
  const total = result.copied.rules + result.copied["rules-on-demand"];
  logger.info(`${GREEN}✅ Rules sincronizadas:${NC}`);
  logger.info(
    `   Copiadas : ${total} arquivos (rules/: ${result.copied.rules} | rules-on-demand/: ${result.copied["rules-on-demand"]})`
  );
  logger.info(`   Removidas: ${result.removed} arquivos (exceção desligada)`);
  logger.info(`   Do overlay: ${result.fromOverlay} arquivos (${result.companyProfile})`);
  if (result.folderCreated) logger.info(`   Overlay ${result.companyProfile}: pasta criada`);

  if (result.errors.length > 0) {
    for (const error of result.errors) logger.error(`${RED}  ✗ ${error}${NC}`);
    process.exit(1);
  }
}
