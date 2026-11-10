/**
 * @fileoverview Quais rules entram na IDE.
 *
 * Toda rule de `rules/` (e de `rules-on-demand/`) entra, menos duas, decididas pelo nome do
 * arquivo: `artifact-style-rules.md` só com `ARTIFACT_STYLE=human-generated` e `rtk-rules.md` só
 * com o RTK ligado (#263). Usado por `jarvis tokens` e `jarvis rules sync` (Passo 8 do
 * `/jarvis-init`). O fallback em prosa, para quando o CLI não está disponível, é
 * `skills/jarvis-init/assets/rules-sync-manual.md`: ao mudar a lógica aqui, mude lá também. A
 * documentação de autoria (hierarquia, convenções, estrutura de regra) vive em
 * `docs/estrutura/rules.md`.
 * @module core/profile-filter
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const DEFAULT_ARTIFACT_STYLE = "ai-generated";

function walkMarkdown(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walkMarkdown(p);
    return p.endsWith(".md") ? [p] : [];
  });
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
