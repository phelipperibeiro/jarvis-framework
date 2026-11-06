/**
 * @fileoverview Confere se os links relativos de um `.md` resolvem **dentro do Central docs**
 * (#229): uma página com link para fora (ex.: `../../../../repo/arquivo.js`, que só existe no
 * workspace de quem escreveu) quebra para quem lê o Central docs em outro lugar e na migração
 * para o Confluence. Só avisa; não bloqueia a publicação.
 * @module docs/check-links
 */

import { posix } from "node:path";

/** Esquema de URL (`https:`, `mailto:`, `tel:`…): link absoluto, nunca avaliado aqui. */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Tira os blocos de código cercados (``` ou ~~~) e os trechos entre crases, que trazem
 * exemplos de sintaxe de link e não links de verdade.
 * @param {string} content
 * @returns {string}
 */
export function stripCode(content) {
  const out = [];
  let fence = null;
  for (const line of content.split("\n")) {
    const m = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      continue;
    }
    if (m) {
      fence = m[1];
      continue;
    }
    out.push(line.replace(/`[^`\n]*`/g, ""));
  }
  return out.join("\n");
}

/**
 * Alvos dos links `[texto](alvo)` e `![alt](alvo)` fora de código. O alvo vem sem o título
 * opcional (`"..."`), sem âncora e sem query; URL, âncora pura e alvo vazio são ignorados.
 * @param {string} content
 * @returns {string[]} alvos relativos (como escritos, já sem `#…` e `?…`)
 */
export function relativeLinkTargets(content) {
  const targets = [];
  // Alvo entre <...> (aceita espaço) ou sem espaço; título opcional entre aspas.
  const re = /!?\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^)\s]+))(?:\s+"[^"]*")?\s*\)/g;
  for (const m of stripCode(content).matchAll(re)) {
    const raw = m[1] ?? m[2];
    if (SCHEME.test(raw) || raw.startsWith("#")) continue;
    const target = raw.split("#")[0].split("?")[0];
    if (target) targets.push(target);
  }
  return targets;
}

/**
 * Links relativos de uma página publicada que não resolvem dentro do Central docs.
 * @param {Object} p
 * @param {string} p.destPath - Destino da página (relativo à pasta do Central docs, com `/`)
 * @param {string} p.content - Texto da página
 * @param {Set<string>} p.publishedSet - Destinos que fazem parte do mesmo lote
 * @param {(rel: string) => boolean} p.exists - O destino já existe no Central docs?
 * @returns {Array<{ link: string, reason: string }>}
 */
export function findUnresolvableLinks({ destPath, content, publishedSet, exists }) {
  const problems = [];
  const dir = posix.dirname(destPath);
  for (const link of relativeLinkTargets(content)) {
    let decoded = link;
    try {
      decoded = decodeURIComponent(link);
    } catch {
      // %-sequência inválida: usa o texto como está
    }
    const resolved = posix.normalize(posix.join(dir, decoded)).replace(/\/$/, "");
    if (resolved === ".." || resolved.startsWith("../") || posix.isAbsolute(decoded)) {
      problems.push({ link, reason: "aponta para fora do Central docs" });
    } else if (!publishedSet.has(resolved) && !exists(resolved)) {
      problems.push({ link, reason: "o destino não existe no Central docs" });
    }
  }
  return problems;
}
