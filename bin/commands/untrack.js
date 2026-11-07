import { resolveEnvPath } from "../lib/env-loader.js";
import { UNTRACKABLE_FILES, untrackFromIndex } from "../lib/core/git-exclude.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { RED, GREEN, YELLOW, DIM, NC } from "../lib/utils/ui.js";

/**
 * `jarvis untrack <arquivos…>` (#227): tira `AGENTS.md` e/ou `CLAUDE.md` já versionados do índice do git
 * (`git rm --cached`), sem apagar o arquivo local, e os põe no `.git/info/exclude`. Nunca faz commit nem
 * push: a remoção fica staged para a pessoa revisar e commitar.
 *
 * É a execução da escolha **Tirar do git**, feita no `/jarvis-init upgrade` (skill na IDE) depois do Sim da
 * pessoa. O `jarvis init` e o `jarvis init --upgrade` nunca chamam isto, nem com `--yes`: arquivo que a
 * pessoa não confirmou não sai do índice. Só vale no modo projeto (raiz com `.git`).
 *
 * Sai com 1 se algum arquivo foi recusado (nome fora da lista, não versionado, raiz sem repositório).
 * @param {string[]} files
 * @param {{ ide?: string, "env-file"?: string }} [flags]
 */
export function untrack(files, flags = {}) {
  configureFromFlags(flags);

  const names = [...new Set((files || []).filter(Boolean))];
  if (names.length === 0) {
    logger.error(`${RED}❌ Informe o arquivo: jarvis untrack ${UNTRACKABLE_FILES.join(" | ")}${NC}`);
    process.exitCode = 1;
    return;
  }

  let workspaceDir;
  try {
    workspaceDir = resolveEnvPath(process.cwd(), flags).root || process.cwd();
  } catch (error) {
    logger.error(`${RED}❌ ${error.message}${NC}`);
    process.exitCode = 1;
    return;
  }

  let removed = 0;
  for (const name of names) {
    const result = untrackFromIndex(workspaceDir, name);
    if (!result.ok) {
      logger.error(`${RED}❌ ${name}: ${result.reason}${NC}`);
      process.exitCode = 1;
      continue;
    }
    removed += 1;
    logger.info(`${GREEN}✅ ${name}: removido do índice (staged). O arquivo local continua.${NC}`);
    if (result.excludeAdded.length) {
      logger.info(`${DIM}   • .git/info/exclude: ${result.excludeAdded.join(", ")}${NC}`);
    }
    if (result.excludeError) {
      logger.error(
        `${YELLOW}   ⚠ O exclude não foi gravado (${result.excludeError}): o arquivo local pode voltar a aparecer como novo no git.${NC}`
      );
    }
  }
  if (removed > 0) {
    logger.info(
      `${YELLOW}ℹ️  Nenhum commit foi criado. Revise com \`git status\` e faça o commit; ao ser integrado, ` +
        `o commit apaga o arquivo para o resto do time (o histórico guarda o conteúdo).${NC}`
    );
  }
}
