/**
 * @fileoverview Saída em texto da árvore de chamadas.
 * @module flow-map/render
 */

const TYPE_LABEL = {
  workflow: "workflow",
  skill: "skill",
  agent: "agente",
  cli: "CLI",
  mcp: "MCP",
  external: "externo",
  broken: "?",
  unresolved: "?",
};

/**
 * Resume a coluna `Condição` para uma linha: sem crases, "Se" em minúscula e limite de tamanho.
 * @param {string} text
 * @param {number} [max]
 */
export function summarizeCondition(text, max = 90) {
  let t = text.replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
  if (!t || t === "—") return "";
  t = t.charAt(0).toLowerCase() + t.slice(1);
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function describe(node) {
  const head = node.kind === "menu" ? node.name : `${node.name} [${TYPE_LABEL[node.kind]}]`;
  const notes = [];
  const condition = summarizeCondition(node.condicao);
  if (node.available) notes.push("disponível");
  if (condition) notes.push(condition);
  if (node.via) notes.push(`via ${node.via}`);
  if (node.kind === "broken" || node.marker === "quebrada") notes.push("referência quebrada");
  else if (node.marker === "a confirmar") notes.push("referência a confirmar");
  if (node.status === "cycle") notes.push("ciclo: já mapeado acima");
  else if (node.status === "seen") notes.push("já mapeado acima");
  else if (node.status === "truncated") notes.push("truncado: use --depth N");
  return notes.length ? `${head}  (${notes.join("; ")})` : head;
}

/**
 * @param {import("./tree.js").TreeNode} root
 * @returns {string[]} linhas da árvore
 */
export function renderTree(root) {
  const lines = [describe(root)];
  if (root.status === "selfContained") lines.push("└── (autocontido: não chama nenhum outro item)");
  else if (root.status === "undeclared")
    lines.push("└── (sem declaração de chamadas: o item não segue a tabela padronizada)");

  function walk(node, prefix) {
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${describe(child)}`);
      walk(child, `${prefix}${last ? "    " : "│   "}`);
    });
  }
  walk(root, "");
  return lines;
}

/**
 * @param {string} name
 * @param {string} type
 * @param {ReturnType<typeof import("./tree.js").reverseEdges>} edges
 * @returns {string[]}
 */
export function renderReverse(name, type, edges) {
  const lines = [`Quem chama ${name} [${TYPE_LABEL[type]}]`];
  if (edges.length === 0) {
    lines.push(`└── nenhum artefato chama ${name} — pode ser um ponto de entrada`);
    return lines;
  }
  edges.forEach((e, i) => {
    const notes = [];
    if (e.passo) notes.push(`passo: ${e.passo}`);
    if (e.available) notes.push("disponível");
    const condition = summarizeCondition(e.condicao);
    if (condition) notes.push(condition);
    if (e.via) notes.push(`via ${e.via}`);
    lines.push(
      `${i === edges.length - 1 ? "└── " : "├── "}${e.from} [${TYPE_LABEL[e.type]}]${notes.length ? `  (${notes.join("; ")})` : ""}`
    );
  });
  return lines;
}
