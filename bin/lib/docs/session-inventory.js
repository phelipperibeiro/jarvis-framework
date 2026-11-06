/**
 * @fileoverview Inventário das sessões de engenharia (`$SESSIONS_DIR/eng/{card}/`) para o
 * `/eng.spec-consolidate` (#229): lista cada sessão, seus arquivos, os que faltam e se a entrega
 * já está no Central docs. Só lê o disco (nenhuma rede, nenhuma escrita), no estilo do
 * `session-scan.js` do `/eng.daily-report`.
 *
 * O estado "pendente" é a própria página-índice da sessão no Central docs
 * (`{squad}/{produto}/history/{card}/{card}.md`): sem ela, a sessão ainda não foi consolidada.
 * Assim a pessoa processa as sessões uma por vez, no seu ritmo, e retoma de onde parou sem
 * arquivo de estado.
 * @module docs/session-inventory
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "../utils/frontmatter.js";

/** Arquivos que uma sessão completa tem (`/eng.start` e `/eng.plan`); o que faltar aparece em `ausentes`. */
export const EXPECTED_FILES = Object.freeze(["architecture.md", "plan.md", "context.md"]);

/** Pasta que o próprio `/eng.spec-consolidate` cria na sessão: não é conteúdo a publicar. */
const CONSOLIDATION_DIR = "consolidation";

/**
 * Arquivos da sessão, recursivamente, em caminho relativo (`/`) e com tamanho. Fora da lista:
 * nomes que começam com `.` (`.timestamp_start`, `.lead_time_minutes`) e a pasta
 * `consolidation/` da raiz da sessão.
 * @param {string} dir - Pasta da sessão
 * @returns {Array<{ path: string, bytes: number }>} em ordem alfabética
 */
export function listSessionFiles(dir) {
  const out = [];
  const walk = (current, prefix) => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name.startsWith(".")) continue;
      if (!prefix && entry.name === CONSOLIDATION_DIR) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else if (entry.isFile()) out.push({ path: rel, bytes: statSync(full).size });
    }
  };
  walk(dir, "");
  return out;
}

/** Normaliza a chave de uma entrega: sem aspas, sem `#`, em minúsculas. */
function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^#/, "")
    .toLowerCase();
}

/**
 * Índice das entregas já publicadas no Central docs: `task_key` → onde estão. Lê o frontmatter
 * de cada `{squad}/{produto}/{funcionalidade}/deliveries/delivery-*.md`; sem `task_key`, usa o
 * que vem depois da data no nome do arquivo.
 * @param {string} centralRoot - Pasta do Central docs
 * @param {string} squad
 * @returns {Map<string, Array<{ produto: string, feature: string, file: string }>>}
 */
export function deliveredIndex(centralRoot, squad) {
  const index = new Map();
  const squadDir = join(centralRoot, squad);
  if (!existsSync(squadDir)) return index;
  const dirs = (p) =>
    readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  for (const produto of dirs(squadDir)) {
    for (const feature of dirs(join(squadDir, produto))) {
      const deliveries = join(squadDir, produto, feature, "deliveries");
      if (!existsSync(deliveries)) continue;
      for (const file of readdirSync(deliveries).sort()) {
        if (!/^delivery-.+\.md$/.test(file) || file.endsWith(".public.md")) continue;
        let key = "";
        try {
          key = normalizeKey(parseFrontmatter(readFileSync(join(deliveries, file), "utf-8")).task_key);
        } catch {
          // arquivo ilegível: cai no nome
        }
        if (!key) key = normalizeKey(file.replace(/^delivery-\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, ""));
        if (!key) continue;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push({ produto, feature, file });
      }
    }
  }
  return index;
}

/** Ordem natural dos cards: numéricos em ordem numérica, depois os demais em ordem alfabética. */
function compareCards(a, b) {
  const na = /^\d+$/.test(a);
  const nb = /^\d+$/.test(b);
  if (na && nb) return Number(a) - Number(b);
  if (na) return -1;
  if (nb) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Inventário das sessões.
 * @param {Object} p
 * @param {string} p.sessionsDir - Pasta `eng/` das sessões (`$SESSIONS_DIR/eng`)
 * @param {string|null} [p.centralRoot] - Pasta do Central docs; `null` = desligado (sem
 *   `delivered`/`capituloPublicado`)
 * @param {string} [p.squad]
 * @param {string} [p.produto]
 * @returns {Array<{
 *   card: string,
 *   files: Array<{ path: string, bytes: number }>,
 *   totalBytes: number,
 *   ausentes: string[],
 *   vazia: boolean,
 *   delivered: boolean|null,
 *   deliveries: Array<{ produto: string, feature: string, file: string }>,
 *   capituloPublicado: boolean|null,
 *   pendente: boolean,
 * }>}
 */
export function inventorySessions({ sessionsDir, centralRoot = null, squad, produto }) {
  if (!existsSync(sessionsDir)) return [];
  const central = centralRoot && squad && existsSync(centralRoot);
  const delivered = central ? deliveredIndex(centralRoot, squad) : null;
  const cards = readdirSync(sessionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort(compareCards);

  return cards.map((card) => {
    const files = listSessionFiles(join(sessionsDir, card));
    const names = new Set(files.map((f) => f.path));
    const deliveries = delivered ? (delivered.get(normalizeKey(card)) ?? []) : [];
    const capituloPublicado =
      central && produto ? existsSync(join(centralRoot, squad, produto, "history", card, `${card}.md`)) : null;
    return {
      card,
      files,
      totalBytes: files.reduce((sum, f) => sum + f.bytes, 0),
      ausentes: EXPECTED_FILES.filter((name) => !names.has(name)),
      vazia: files.length === 0,
      delivered: delivered ? deliveries.length > 0 : null,
      deliveries,
      capituloPublicado,
      pendente: capituloPublicado !== true,
    };
  });
}
