/**
 * @fileoverview Leitura de frontmatter YAML (`---\n...\n---`) compartilhada
 * entre scanner.js, validate-frontmatter.js e sync-engine.js —
 * cada um tinha sua própria cópia da mesma regex de bloco.
 * @module utils/frontmatter
 */

const BLOCK_PATTERN = /^---\s*\n([\s\S]*?)\n---/;

// Exige a chave começando na coluna 0 (sem indentação) — por design, não
// desce em blocos aninhados (ex: `metadata:\n  area: x`). As 4 implementações
// que este módulo substitui já assumiam isso (`^\w`, sem flag multiline por
// linha); manter a mesma regra evita "vazar" uma chave aninhada como se fosse
// de nível raiz.
// Unicode-aware (`u` flag) para aceitar chaves acentuadas, como "Versão" e
// "Autor" usadas no frontmatter de ARD/RFC.
const KEY_VALUE_PATTERN = /^([\p{L}\p{N}_][\p{L}\p{N}_-]*):\s*(.+)$/u;

/**
 * Extrai o conteúdo bruto entre as cercas `---` do frontmatter.
 * @param {string} content - Conteúdo completo do arquivo
 * @returns {string | null} O bloco (sem as cercas), ou null se não houver frontmatter
 */
export function extractFrontmatterBlock(content) {
  const match = content.match(BLOCK_PATTERN);
  return match ? match[1] : null;
}

/**
 * Lê o `description` de um bloco de frontmatter, numa linha só: o valor na mesma linha (sem as
 * aspas) ou o bloco `>`/`|` (as linhas recuadas seguintes, unidas por espaço), que é como os
 * SKILL.md e parte dos agents e workflows o escrevem. Fonte única do `jarvis list` e da geração
 * para Codex, OpenCode e Kiro, que antes liam o bloco como ">" (#83).
 * @param {string | null} block - Bloco do frontmatter (`extractFrontmatterBlock`)
 * @returns {string} A descrição, ou "" sem o campo
 */
export function readDescription(block) {
  if (!block) return "";
  const lines = block.split("\n");
  const start = lines.findIndex((line) => line.startsWith("description:"));
  if (start === -1) return "";

  let value = lines[start].slice("description:".length).trim();
  if (value && !/^[>|][+-]?$/.test(value)) {
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }

  // Bloco: segue enquanto a linha é recuada (ou vazia); para na próxima chave sem recuo.
  const parts = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") continue;
    if (!/^\s/.test(line)) break;
    parts.push(line.trim());
  }
  return parts.join(" ");
}

/**
 * Parseia um bloco de frontmatter YAML simples (`chave: valor`, uma por linha,
 * sem indentação). Não suporta estruturas aninhadas, listas ou blocos
 * multilinha (`>`/`|`); para o `description` em bloco, use `readDescription`.
 * @param {string} content - Conteúdo completo do arquivo (com ou sem frontmatter)
 * @returns {Record<string, string>} Metadados; `{}` se não houver frontmatter
 */
export function parseFrontmatter(content) {
  const block = extractFrontmatterBlock(content);
  if (block === null) return {};

  const metadata = {};
  for (const line of block.split("\n")) {
    const kv = line.match(KEY_VALUE_PATTERN);
    if (!kv) continue;

    let value = kv[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    metadata[kv[1]] = value;
  }
  return metadata;
}
