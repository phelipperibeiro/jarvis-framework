import { resolveUser } from "../lib/auth/session.js";
import { loadEnv, resolveEnvPath } from "../lib/env-loader.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { BLUE, DIM, NC } from "../lib/utils/ui.js";

export async function whoami(flags) {
  configureFromFlags(flags);

  let env = {};
  try {
    const cwd = process.cwd();
    const resolved = resolveEnvPath(cwd, flags);
    env = loadEnv(cwd, resolved.path);
  } catch {
    // sem ENV.md ainda — resolve via git/os
  }

  const { id, source } = resolveUser(env);

  logger.info("");
  logger.info(`${BLUE}👤 Identidade${NC}`);
  logger.info("");
  logger.info(`  ${BLUE}USER:${NC}   ${id}`);
  logger.info(`  ${BLUE}Fonte:${NC}  ${source}`);
  logger.info("");
  logger.info(
    `${DIM}Sem login. Ordem: ENV.md (USER=) → git config user.email → usuário do SO.${NC}`
  );

  logger.info("");
}
