/**
 * @fileoverview Grafo de chamadas e árvore para frente.
 * @module flow-map/tree
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildIndex } from "./index.js";
import { parseDeclaration } from "./parse.js";

export const DEFAULT_DEPTH = 4;

/**
 * Lê o índice e as declarações de todos os artefatos.
 * @param {string} root - Raiz do framework
 */
export function buildGraph(root) {
  const { items, duplicates } = buildIndex(root);
  const decl = new Map();
  for (const item of items.values()) {
    decl.set(item.name, parseDeclaration(item.type, readFileSync(join(root, item.path), "utf-8")));
  }
  return { items, duplicates, decl };
}

/**
 * @typedef {Object} TreeNode
 * @property {string} name
 * @property {"workflow"|"skill"|"agent"|"cli"|"mcp"|"external"|"broken"|"unresolved"|"menu"} kind
 * @property {string | null} passo
 * @property {string} condicao
 * @property {string | null} via
 * @property {"quebrada"|"a confirmar"|null} marker
 * @property {boolean} available
 * @property {null|"cycle"|"seen"|"truncated"|"undeclared"|"selfContained"} status
 * @property {TreeNode[]} children
 */

function hasCalls(graph, name) {
  const d = graph.decl.get(name);
  return Boolean(d) && d.rows.some((r) => r.targets.length > 0);
}

/**
 * Árvore do que o item chama, até `depth` níveis.
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {string} name - Nome de um item do índice
 * @param {{ depth?: number }} [opts]
 * @returns {TreeNode}
 */
export function forwardTree(graph, name, opts = {}) {
  const depth = opts.depth ?? DEFAULT_DEPTH;
  const expanded = new Set([name]);

  function base(partial) {
    return { passo: null, condicao: "", via: null, marker: null, available: false, status: null, children: [], ...partial };
  }

  function childrenOf(itemName, level, ancestors) {
    const d = graph.decl.get(itemName);
    const children = [];
    for (const row of d.rows) {
      if (row.targets.length === 0) continue;
      const grouped = row.targets.filter((t) => t.kind === "internal" || t.kind === "agent").length > 1;
      // Em menu, a condição fica no nó do menu e não se repete em cada alvo.
      const nodes = row.targets.map((t) => targetNode(t, grouped ? { ...row, condicao: "", via: null } : row, level + 1, ancestors));
      if (grouped) {
        children.push(
          base({ name: `menu (${nodes.length} opções)`, kind: "menu", passo: row.passo, condicao: row.condicao, via: row.via, children: nodes }),
        );
      } else {
        children.push(...nodes);
      }
    }
    return children;
  }

  function targetNode(target, row, level, ancestors) {
    const common = { passo: row.passo, condicao: row.condicao, via: row.via, marker: row.marker, available: row.available };

    if (["cli", "mcp", "external", "unresolved"].includes(target.kind)) {
      return base({ name: target.name, kind: target.kind, ...common });
    }
    const item = graph.items.get(target.name);
    if (!item) return base({ name: target.name, kind: "broken", ...common, marker: row.marker ?? "quebrada" });

    const node = base({ name: item.name, kind: item.type, ...common });
    if (ancestors.has(item.name)) node.status = "cycle";
    else if (expanded.has(item.name)) node.status = "seen";
    else if (level >= depth) node.status = hasCalls(graph, item.name) ? "truncated" : null;
    else {
      expanded.add(item.name);
      fill(node, level, new Set([...ancestors, item.name]));
    }
    return node;
  }

  function fill(node, level, ancestors) {
    const d = graph.decl.get(node.name);
    if (!d.declared) node.status = "undeclared";
    else if (d.selfContained) node.status = "selfContained";
    else node.children = childrenOf(node.name, level, ancestors);
  }

  const item = graph.items.get(name);
  const root = base({ name, kind: item.type });
  fill(root, 0, new Set([name]));
  return root;
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Até 5 nomes parecidos (prefixo, trecho ou distância de edição de até 1 a cada 4 caracteres).
 * @param {Map<string, unknown>} items
 * @param {string} name
 */
export function suggest(items, name) {
  const lower = name.toLowerCase();
  return [...items.keys()]
    .map((candidate) => {
      const c = candidate.toLowerCase();
      const score = c.startsWith(lower) || lower.startsWith(c) ? 0 : c.includes(lower) || lower.includes(c) ? 1 : levenshtein(lower, c) <= Math.max(1, Math.floor(Math.min(lower.length, c.length) / 4)) ? 2 : null;
      return { candidate, score };
    })
    .filter((s) => s.score !== null)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .slice(0, 5)
    .map((s) => s.candidate);
}

/**
 * Quem declara chamar o item (arestas invertidas do mesmo grafo).
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {string} name
 * @returns {Array<{ from: string, type: string, passo: string | null, condicao: string, via: string | null, available: boolean }>}
 */
export function reverseEdges(graph, name) {
  const edges = [];
  for (const [from, d] of graph.decl) {
    if (from === name) continue;
    for (const row of d.rows) {
      if (row.targets.some((t) => (t.kind === "internal" || t.kind === "agent") && t.name === name)) {
        edges.push({
          from,
          type: graph.items.get(from).type,
          passo: row.passo,
          condicao: row.condicao,
          via: row.via,
          available: row.available,
        });
      }
    }
  }
  return edges.sort((a, b) => a.from.localeCompare(b.from));
}

/**
 * Confere os nomes citados nas declarações.
 * - erro: `/nome` ou `nome (agente)` que não existe, e nomes duplicados no índice;
 * - aviso: linha já marcada "referência quebrada" ou "a confirmar", e artefato sem declaração.
 * @param {ReturnType<typeof buildGraph>} graph
 * @returns {{ errors: Array<{ file: string, name: string, reason: string }>, warnings: Array<{ file: string, name: string, reason: string }> }}
 */
export function findBrokenReferences(graph) {
  const errors = duplicatesOf(graph);
  const warnings = [];
  for (const [name, d] of graph.decl) {
    const file = graph.items.get(name).path;
    if (!d.declared) warnings.push({ file, name, reason: "sem declaração de chamadas" });
    for (const row of d.rows) {
      for (const t of row.targets) {
        if (t.kind === "unresolved") {
          warnings.push({ file, name: t.name, reason: `referência ${row.marker}` });
        } else if ((t.kind === "internal" || t.kind === "agent") && !graph.items.has(t.name)) {
          if (row.marker) warnings.push({ file, name: t.name, reason: `referência ${row.marker}` });
          else errors.push({ file, name: t.name, reason: "não existe como workflow, skill ou agente" });
        }
      }
    }
  }
  return { errors, warnings };
}

function duplicatesOf(graph) {
  return graph.duplicates.map((name) => ({ file: name, name, reason: "nome repetido entre os artefatos" }));
}
