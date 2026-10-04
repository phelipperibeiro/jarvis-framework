/**
 * @fileoverview Estimativa do que o framework carrega no início de uma sessão.
 *
 * Mede, por tipo, os arquivos que a IDE lê no início para um perfil (HUB,
 * POSITION, AREA, SQUAD). Tokens são uma **estimativa** (bytes ÷ 4): serve
 * para comparar antes e depois, não para cobrar custo.
 * @module core/token-report
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { listRulesForProfile } from "./profile-filter.js";

/** Bytes por token usados na estimativa. */
export const BYTES_PER_TOKEN = 4;

/**
 * @param {number} bytes
 * @returns {number} tokens estimados (bytes ÷ 4, arredondado)
 */
export function estimateTokens(bytes) {
  return Math.round(bytes / BYTES_PER_TOKEN);
}

/**
 * Tamanho em bytes do bloco de frontmatter (do primeiro `---` ao segundo `---`).
 * @param {string} content
 * @returns {number} 0 quando não há frontmatter
 */
export function frontmatterBytes(content) {
  const match = content.match(/^---\s*\n[\s\S]*?\n---/);
  return match ? Buffer.byteLength(match[0], "utf-8") : 0;
}

function fileBytes(path) {
  return Buffer.byteLength(readFileSync(path, "utf-8"), "utf-8");
}

function category(id, label, files, note = "") {
  const sorted = [...files].sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
  const bytes = sorted.reduce((sum, f) => sum + f.bytes, 0);
  return { id, label, note, files: sorted, bytes, tokens: estimateTokens(bytes) };
}

/**
 * @param {string} root - Raiz do framework (`rules/`, `skills/`, `workflows/`, `AGENTS.md`)
 * @param {import("./profile-filter.js").Profile} profile
 * @param {{ rtkEnabled?: boolean }} [opts]
 */
export function buildReport(root, profile, opts = {}) {
  const rtkEnabled = Boolean(opts.rtkEnabled);

  const rules = listRulesForProfile(join(root, "rules"), profile, { rtkEnabled });

  const agentsMd = existsSync(join(root, "AGENTS.md"))
    ? [{ path: "AGENTS.md", bytes: fileBytes(join(root, "AGENTS.md")) }]
    : [];

  const skillsDir = join(root, "skills");
  const skills = [];
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir)) {
      const skillMd = join(skillsDir, name, "SKILL.md");
      if (!statSync(join(skillsDir, name)).isDirectory() || !existsSync(skillMd)) continue;
      const bytes = frontmatterBytes(readFileSync(skillMd, "utf-8"));
      if (bytes > 0) skills.push({ path: `skills/${name}/SKILL.md`, bytes });
    }
  }

  const warmupPath = join(root, "workflows", "warm-up.md");
  const warmup = existsSync(warmupPath)
    ? [{ path: "workflows/warm-up.md", bytes: fileBytes(warmupPath) }]
    : [];

  const categories = [
    category("rules", "Rules", rules, "carregadas no início pelo Claude Code"),
    category("agents-md", "AGENTS.md", agentsMd, "instrução de projeto"),
    category("skills-frontmatter", "Frontmatter dos skills", skills, "sempre visível; o corpo só ao invocar"),
    category("warmup", "warm-up", warmup, "só se executado no início da sessão"),
  ];

  const bytes = categories.reduce((sum, c) => sum + c.bytes, 0);
  return {
    profile: { HUB: profile.HUB, POSITION: profile.POSITION, AREA: profile.AREA, SQUAD: profile.SQUAD },
    rtkEnabled,
    estimate: `tokens = bytes ÷ ${BYTES_PER_TOKEN} (estimativa)`,
    categories,
    total: { bytes, tokens: estimateTokens(bytes) },
  };
}
