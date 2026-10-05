/**
 * @fileoverview Opções do commander repetidas entre vários comandos — evita
 * reescrever `.option(...)` em cada registro de `program.js`.
 * @module cli/shared-options
 */

/**
 * `--ide`/`--env-file`, usados por todo comando que resolve o ENV.md
 * (via `env-loader.js#resolveEnvPath`).
 * @param {import("commander").Command} cmd
 * @returns {import("commander").Command}
 */
export function withEnvOptions(cmd) {
  return cmd
    .option("--ide <ide>", "IDE alvo (ex: claude, windsurf, cursor)")
    .option("--env-file <path>", "Path explícito do ENV.md");
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
