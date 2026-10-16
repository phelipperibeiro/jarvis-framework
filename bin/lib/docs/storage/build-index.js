/**
 * @fileoverview Gera o `{SQUAD}/index.md` do Central docs a partir do frontmatter
 * da consolidação (funcionalidades e entregas). O índice é sempre regenerado pela listagem (nunca editado), para
 * duas publicações seguidas não apagarem a entrada uma da outra.
 * @module docs/storage/build-index
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseFrontmatter } from "../../utils/frontmatter.js";

/** @constant {ReadonlyArray<string>} Áreas do Central docs, na ordem do índice */
export const AREAS = Object.freeze(["product", "engineering"]);

/**
 * Lista arquivos (recursivo) de uma pasta, em ordem alfabética.
 * @param {string} dir
 * @returns {string[]} caminhos absolutos
 */
export function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walkFiles(full) : [full];
    });
}

/** @constant {Readonly<Record<string, {prefix: string, title: string}>>} O que cada área lista no índice */
export const INDEXED = Object.freeze({
  product: { prefix: "feature-", title: "Funcionalidades (estado atual)" },
  engineering: { prefix: "delivery-", title: "Entregas recentes" },
});

/** @constant {number} Entregas listadas por produto (as mais recentes; o nome começa pela data) */
export const MAX_DELIVERIES_PER_PRODUCT = 10;

/**
 * Monta o conteúdo do índice de um squad. Lista só a consolidação do
 * `/eng.spec-consolidate`: funcionalidades (`feature-*`) e as entregas mais recentes
 * (`delivery-*`). Outros arquivos (ex.: PRD/ARD publicados na 4.0.0) ficam fora.
 * Formato: `# SQUAD` › `## área` › `### produto` › `- [arquivo](caminho) | status | nome | atualizado`.
 * @param {string} root - Pasta do Central docs
 * @param {string} squad
 * @returns {string}
 */
export function renderIndex(root, squad) {
  const out = [`# ${squad}`, ""];

  for (const area of AREAS) {
    const { prefix, title } = INDEXED[area];
    const areaDir = join(root, squad, area);
    const files = walkFiles(areaDir).filter((f) => {
      const name = f.split(sep).pop();
      return name.startsWith(prefix) && name.endsWith(".md");
    });
    out.push(`## ${area}`, "", `> ${title}`, "");
    if (files.length === 0) {
      out.push("_Nenhum documento._", "");
      continue;
    }

    const byProduct = new Map();
    for (const file of files) {
      const [product = "", ...rest] = relative(areaDir, file).split(sep);
      if (rest.length === 0) continue; // arquivo solto na área, sem pasta de produto
      if (!byProduct.has(product)) byProduct.set(product, []);
      byProduct.get(product).push(file);
    }

    for (const [product, productFiles] of byProduct) {
      const listed =
        area === "engineering"
          ? [...productFiles].sort().reverse().slice(0, MAX_DELIVERIES_PER_PRODUCT)
          : productFiles;
      out.push(`### ${product}`);
      for (const file of listed) {
        const rel = relative(join(root, squad), file).split(sep).join("/");
        const name = rel.split("/").pop();
        const meta = parseFrontmatter(readFileSync(file, "utf-8"));
        let line = `- [${name}](${rel})`;
        if (meta.status) line += ` | ${meta.status}`;
        if (meta.name) line += ` | ${meta.name}`;
        if (meta.task_key) line += ` | ${meta.task_key}`;
        const when = meta.updated_at || meta.date;
        if (when) line += ` | ${when}`;
        out.push(line);
      }
      out.push("");
    }
  }

  return out.join("\n").replace(/\n+$/, "\n");
}

/**
 * Regenera e grava `{root}/{squad}/index.md`.
 * @param {string} root - Pasta do Central docs
 * @param {string} squad
 * @returns {{ path: string, content: string }}
 */
export function buildIndex(root, squad) {
  const content = renderIndex(root, squad);
  const path = join(root, squad, "index.md");
  writeFileSync(path, content);
  return { path, content };
}
