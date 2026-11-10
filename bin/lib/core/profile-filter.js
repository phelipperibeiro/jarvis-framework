/**
 * @fileoverview Filtro de rules por perfil (bloco "Applies to").
 *
 * Usado por `jarvis tokens` e `jarvis rules sync` (Passo 8 do `/jarvis-init`). O fallback em
 * prosa, para quando o CLI não está disponível, é `skills/jarvis-init/assets/rules-sync-manual.md`:
 * ao mudar a lógica aqui, mude lá também. A documentação de autoria (hierarquia, convenções,
 * estrutura de regra) vive em `docs/estrutura/rules.md`.
 *
 * Regras:
 * - Os eixos (HUB, POSITION, AREA, SQUAD e o opcional ARTIFACT_STYLE) são combinados com AND.
 * - ARTIFACT_STYLE (5º campo, opcional): ausente no bloco = `all`; perfil sem valor =
 *   `ai-generated`. Sem coringa: FULLCYCLE e GENERALIST não o satisfazem (é escolha da pessoa).
 * - `all` casa qualquer valor; listas são separadas por vírgula.
 * - FULLCYCLE (HUB) satisfaz qualquer HUB.
 * - GENERALIST (POSITION) satisfaz qualquer POSITION e qualquer AREA.
 * - Arquivo sem bloco "Applies to" é universal.
 * - `rtk-rules.md` só entra com RTK habilitado (opt-in).
 * @module core/profile-filter
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

// SQUAD para no próximo `|`: o 5º campo (ARTIFACT_STYLE) é opcional.
const APPLIES_TO_RE =
  /> \*\*Applies to:\*\* HUB: ([^|]+)\| POSITION: ([^|]+)\| AREA: ([^|]+)\| SQUAD: ([^|\n]+)(?:\| ARTIFACT_STYLE: ([^|\n]+))?/;

const DEFAULT_ARTIFACT_STYLE = "ai-generated";

/**
 * @typedef {Object} AppliesTo
 * @property {string} HUB
 * @property {string} POSITION
 * @property {string} AREA
 * @property {string} SQUAD
 * @property {string} ARTIFACT_STYLE - `all` quando o bloco não traz o campo
 */

/**
 * @typedef {Object} Profile
 * @property {string} HUB
 * @property {string} POSITION
 * @property {string} AREA
 * @property {string} SQUAD
 * @property {string} [ARTIFACT_STYLE] - vazio = `ai-generated`
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
    ARTIFACT_STYLE: (match[5] || "all").trim(),
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
  const style = axisMatches(
    appliesTo.ARTIFACT_STYLE || "all",
    profile.ARTIFACT_STYLE || DEFAULT_ARTIFACT_STYLE
  );
  return hub && position && area && squad && style;
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

    if (rel.endsWith("rtk-rules.md") && !opts.rtkEnabled) continue;
    if (matchesProfile(parseAppliesTo(content), profile)) {
      result.push({ path: rel, bytes });
    }
  }
  return result.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}

/**
 * Diz se uma rule entra na IDE. Toda rule entra, menos duas, decididas pelo nome do arquivo (o
 * conteúdo não é lido): `artifact-style-rules.md` só com `ARTIFACT_STYLE=human-generated` e
 * `rtk-rules.md` só com o RTK ligado. Vale para a rule do core e para a do overlay da empresa.
 * @param {string} relPath - Caminho da rule, relativo à pasta `rules/` (ou `rules-on-demand/`)
 * @param {{ artifactStyle?: string, rtkEnabled?: boolean }} [opts] - `artifactStyle` vazio = `ai-generated`
 * @returns {boolean}
 */
export function isRuleEnabled(relPath, { artifactStyle, rtkEnabled = false } = {}) {
  const name = basename(relPath.split("\\").join("/"));
  if (name === "artifact-style-rules.md") {
    return (artifactStyle || DEFAULT_ARTIFACT_STYLE).trim() === "human-generated";
  }
  if (name === "rtk-rules.md") return Boolean(rtkEnabled);
  return true;
}

/**
 * Lista as rules que entram na IDE, com o tamanho em bytes (o mesmo critério do `jarvis rules sync`).
 * @param {string} rulesDir - Pasta `rules/` do framework
 * @param {{ artifactStyle?: string, rtkEnabled?: boolean }} [opts]
 * @returns {Array<{ path: string, bytes: number }>} Ordenado do maior para o menor;
 *   `path` é relativo a `rulesDir`, com `/` como separador
 */
export function listRules(rulesDir, opts = {}) {
  if (!existsSync(rulesDir)) return [];
  const result = [];
  for (const file of walkMarkdown(rulesDir)) {
    const rel = relative(rulesDir, file).split(sep).join("/");
    if (!isRuleEnabled(rel, opts)) continue;
    result.push({ path: rel, bytes: Buffer.byteLength(readFileSync(file, "utf-8"), "utf-8") });
  }
  return result.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}
