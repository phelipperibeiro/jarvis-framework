import { buildGraph, forwardTree, suggest, DEFAULT_DEPTH } from "../lib/flow-map/tree.js";
import { renderTree } from "../lib/flow-map/render.js";
import { getFrameworkRoot } from "../lib/utils/paths.js";
import { logger } from "../lib/utils/logger.js";

const USAGE = "Uso: jarvis map <nome> [--depth N]   (nome de um workflow, skill ou agente)";

/**
 * Monta a saída do mapa. Separado de `map` para ser testável.
 * @param {string | undefined} name
 * @param {Record<string, unknown>} flags
 * @param {string} [root]
 * @returns {{ code: number, lines: string[] }}
 */
export function runMap(name, flags = {}, root = getFrameworkRoot()) {
  if (!name) return { code: 1, lines: ["❌ Informe o nome de um workflow, skill ou agente.", USAGE] };

  let depth = DEFAULT_DEPTH;
  if (flags.depth !== undefined) {
    depth = Number.parseInt(String(flags.depth), 10);
    if (!Number.isInteger(depth) || depth < 1) return { code: 1, lines: ["❌ --depth precisa ser um número inteiro maior que zero.", USAGE] };
  }

  const graph = buildGraph(root);
  if (!graph.items.has(name)) {
    const similar = suggest(graph.items, name);
    const lines = [`❌ Não encontrado: ${name}`];
    if (similar.length) lines.push("Você quis dizer:", ...similar.map((s) => `  - ${s}`));
    lines.push("Use `jarvis list` para ver o que existe.");
    return { code: 1, lines };
  }

  return { code: 0, lines: renderTree(forwardTree(graph, name, { depth })) };
}

export async function map(flags) {
  const { code, lines } = runMap(flags._?.[0], flags);
  for (const line of lines) (code === 0 ? logger.info : logger.error)(line);
  if (code !== 0) process.exit(code);
}
