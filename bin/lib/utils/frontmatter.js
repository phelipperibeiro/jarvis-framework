/**
 * @fileoverview Leitura de frontmatter YAML (`---\n...\n---`) compartilhada
 * entre scanner.js, validate-frontmatter.js, qa-signoff.js e sync-engine.js —
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
 * Parseia um bloco de frontmatter YAML simples (`chave: valor`, uma por linha,
 * sem indentação). Não suporta estruturas aninhadas, listas ou blocos
 * multilinha (`>`/`|`) — para isso, veja `sync-engine.js#parseSkillFrontmatter`,
 * que extrai campos específicos com necessidades diferentes.
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
