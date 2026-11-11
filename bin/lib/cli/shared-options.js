/**
 * @fileoverview Opções do commander repetidas entre vários comandos — evita
 * reescrever `.option(...)` em cada registro de `program.js`.
 * @module cli/shared-options
 */

/** Ajuda do `--env`, também usada nas opções diretas de `program.js`. */
export const ENV_OPTION_HELP = "Path explícito do ENV.md";

/**
 * Ajuda do `--env-file`, a alternativa ao `--env`: o Node 20+ confere o arquivo de todo
 * `--env-file` da linha de comando, mesmo depois do script, e sai com 9 antes do CLI quando o
 * caminho não existe (#269). Com os dois, vale o `--env`.
 */
export const ENV_FILE_OPTION_HELP =
  "Igual a --env; prefira --env (no Node 20+, caminho inexistente sai com 9 antes do CLI)";

/**
 * `--ide`/`--env` (e a alternativa `--env-file`), usados por todo comando que resolve o ENV.md
 * (via `env-loader.js#resolveEnvPath`).
 * @param {import("commander").Command} cmd
 * @returns {import("commander").Command}
 */
export function withEnvOptions(cmd) {
  return cmd
    .option("--ide <ide>", "IDE alvo (ex: claude, windsurf, cursor)")
    .option("--env <path>", ENV_OPTION_HELP)
    .option("--env-file <path>", ENV_FILE_OPTION_HELP);
}

/**
 * `-q/--quiet`, `-v/--verbose`, `--silent` — lidos por `logger.js#configureFromFlags`.
 * @param {import("commander").Command} cmd
 * @returns {import("commander").Command}
 */
export function withLogOptions(cmd) {
  return cmd
    .option("-q, --quiet", "Só mostra erros")
    .option("-v, --verbose", "Mostra detalhes extras (nível debug)")
    .option("--silent", "Não mostra nada, nem erros");
}
