/**
 * @fileoverview Filtro de rules por perfil (bloco "Applies to").
 *
 * Espelha em JS a lógica do Passo 8 ("Profile-Aware Rules Sync") do skill
 * `skills/jarvis-init/SKILL.md`, que é executada pela IA. As duas fontes da
 * regra são esse passo e a seção "Profile-Aware Rules Loading" de
 * `rules/AGENTS.md`: ao mudar uma, mude as três.
 *
 * Regras:
 * - Os quatro eixos (HUB, POSITION, AREA, SQUAD) são combinados com AND.
 * - `all` casa qualquer valor; listas são separadas por vírgula.
 * - FULLCYCLE (HUB) satisfaz qualquer HUB.
 * - GENERALIST (POSITION) satisfaz qualquer POSITION e qualquer AREA.
 * - Arquivo sem bloco "Applies to" é universal.
 * - `rules/AGENTS.md` nunca é filtrado.
 * - `rtk-rules.md` só entra com RTK habilitado (opt-in).
 * @module core/profile-filter
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APPLIES_TO_RE =
  /> \*\*Applies to:\*\* HUB: ([^|]+)\| POSITION: ([^|]+)\| AREA: ([^|]+)\| SQUAD: (.+)/;

/**
 * @typedef {Object} AppliesTo
 * @property {string} HUB
 * @property {string} POSITION
 * @property {string} AREA
 * @property {string} SQUAD
 */

/**
 * @typedef {Object} Profile
 * @property {string} HUB
 * @property {string} POSITION
 * @property {string} AREA
 * @property {string} SQUAD
 */

/**
 * Lê o primeiro bloco "Applies to" do conteúdo.
 * @param {string} content
 * @returns {AppliesTo | null} `null` quando não há bloco (arquivo universal)
 */
export function parseAppliesTo(content) {
  const match = content.match(APPLIES_TO_RE);
  if (!match) return null;
  return {
    HUB: match[1].trim(),
    POSITION: match[2].trim(),
    AREA: match[3].trim(),
    SQUAD: match[4].trim(),
  };
}

function axisMatches(list, value) {
  if (list.toLowerCase() === "all") return true;
  return list
    .split(",")
    .map((s) => s.trim())
    .includes(value);
}

/**
 * Decide se um bloco "Applies to" casa com o perfil.
 * @param {AppliesTo | null} appliesTo
 * @param {Profile} profile
 * @returns {boolean}
 */
export function matchesProfile(appliesTo, profile) {
  if (!appliesTo) return true;
  const hub = profile.HUB === "FULLCYCLE" || axisMatches(appliesTo.HUB, profile.HUB);
  const generalist = profile.POSITION === "GENERALIST";
  const position = generalist || axisMatches(appliesTo.POSITION, profile.POSITION);
  const area = generalist || axisMatches(appliesTo.AREA, profile.AREA);
  const squad = axisMatches(appliesTo.SQUAD, profile.SQUAD);
  return hub && position && area && squad;
}

function walkMarkdown(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walkMarkdown(p);
    return p.endsWith(".md") ? [p] : [];
  });
}

/**
 * Lista as rules que o perfil recebe, com o tamanho em bytes.
 * @param {string} rulesDir - Pasta `rules/` do framework
 * @param {Profile} profile
 * @param {{ rtkEnabled?: boolean }} [opts]
 * @returns {Array<{ path: string, bytes: number }>} Ordenado do maior para o menor;
 *   `path` é relativo a `rulesDir`, com `/` como separador
 */
export function listRulesForProfile(rulesDir, profile, opts = {}) {
  if (!existsSync(rulesDir)) return [];
  const result = [];
  for (const file of walkMarkdown(rulesDir)) {
    const rel = relative(rulesDir, file).split(sep).join("/");
    const content = readFileSync(file, "utf-8");
    const bytes = Buffer.byteLength(content, "utf-8");

    if (rel === "AGENTS.md") {
      result.push({ path: rel, bytes });
      continue;
    }
    if (rel.endsWith("rtk-rules.md") && !opts.rtkEnabled) continue;
    if (matchesProfile(parseAppliesTo(content), profile)) {
      result.push({ path: rel, bytes });
    }
  }
  return result.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}
