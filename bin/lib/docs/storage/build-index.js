/**
 * @fileoverview Gera o `{SQUAD}/index.md` do Central docs a partir da estrutura por
 * funcionalidade (`{squad}/{produto}/{funcionalidade}/…`, seção 7 do `architecture.md`
 * da #220). O índice é sempre regenerado pela listagem (nunca editado), para duas
 * publicações seguidas não apagarem a entrada uma da outra.
 * @module docs/storage/build-index
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parseFrontmatter } from "../../utils/frontmatter.js";

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

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort();
}

function isMarkdown(path) {
  return path.endsWith(".md") && !path.endsWith(".public.md");
}

/** @constant {number} Entregas listadas por produto (as mais recentes) */
export const MAX_DELIVERIES_PER_PRODUCT = 10;

/**
 * Monta o conteúdo do índice de um squad: a página de cada produto, as funcionalidades
 * consolidadas (uma página por `feature-*`, publicada em `{funcionalidade}/{funcionalidade}.md`)
 * e as entregas mais recentes de cada produto (`{funcionalidade}/deliveries/delivery-*.md`,
 * deduplicadas por `task_key` — uma entrega quebrada em partes, Q9, cita o mesmo `task_key`
 * em mais de uma funcionalidade). `archive/`, `decisions/`, `history/` e `home.md` ficam fora:
 * não são o que foi implementado.
 * @param {string} root - Pasta do Central docs
 * @param {string} squad
 * @returns {string}
 */
export function renderIndex(root, squad) {
  const squadDir = join(root, squad);
  const out = [`# ${squad}`, ""];

  // `product`/`engineering`: nomes do layout antigo (pré-#220); se a migração não removeu as
  // pastas vazias (ou ainda não rodou), não tratá-las como produto evita "## product"/
  // "## engineering" vazios no índice (#220 item 9).
  const products = listDirs(squadDir).filter((name) => name !== "product" && name !== "engineering");
  if (products.length === 0) {
    out.push("_Nenhum documento._", "");
    return out.join("\n").replace(/\n+$/, "\n");
  }

  for (const product of products) {
    const productDir = join(squadDir, product);
    out.push(`## ${product}`, "");

    const productPage = join(productDir, `${product}.md`);
    if (existsSync(productPage)) {
      const meta = parseFrontmatter(readFileSync(productPage, "utf-8"));
      out.push(`> [${meta.name || "Visão do produto"}](${product}/${product}.md)`, "");
    }

    const features = listDirs(productDir).filter((name) => name !== "history");
    const deliveries = [];

    if (features.length === 0) {
      out.push("_Nenhuma funcionalidade consolidada._", "");
      continue;
    }

    for (const feature of features) {
      const featureDir = join(productDir, feature);
      const featurePage = join(featureDir, `${feature}.md`);
      if (!existsSync(featurePage)) continue; // pasta sem a página (ex.: só archive/, ainda não publicada)

      const meta = parseFrontmatter(readFileSync(featurePage, "utf-8"));
      let line = `- [${feature}](${product}/${feature}/${feature}.md)`;
      if (meta.status) line += ` | ${meta.status}`;
      if (meta.name) line += ` | ${meta.name}`;
      if (meta.updated_at) line += ` | ${meta.updated_at}`;
      out.push(line);

      for (const file of walkFiles(join(featureDir, "deliveries")).filter(isMarkdown)) {
        const meta = parseFrontmatter(readFileSync(file, "utf-8"));
        deliveries.push({ feature, file, meta });
      }
    }
    out.push("");

    if (deliveries.length > 0) {
      // Mais recente primeiro pela data; empate (mesmo task_key quebrado em partes, Q9) por nome.
      const sorted = [...deliveries].sort((a, b) => {
        const dateA = a.meta.updated_at || a.meta.date || "";
        const dateB = b.meta.updated_at || b.meta.date || "";
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return basename(a.file).localeCompare(basename(b.file));
      });
      const byKey = new Map();
      for (const d of sorted) {
        const key = d.meta.task_key || d.file; // sem task_key, cada arquivo conta por si
        if (!byKey.has(key)) byKey.set(key, d);
      }

      const recent = [...byKey.values()].slice(0, MAX_DELIVERIES_PER_PRODUCT);
      out.push("> Entregas recentes", "");
      for (const { feature, file, meta } of recent) {
        const name = basename(file);
        let line = `- [${name}](${product}/${feature}/deliveries/${name})`;
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
