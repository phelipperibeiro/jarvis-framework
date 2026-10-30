/**
 * @fileoverview `jarvis fork {nome} [--list] [--candidate]` (#199): a mecânica do overlay de empresa.
 * Copia um artefato do core instalado para `$IDE/overlays/{COMPANY_PROFILE}/`, no mesmo caminho e
 * com o mesmo nome, carimbado no frontmatter (`forked_from`, `forked_at`, `core_candidate`); e lista
 * o que está forkado. A conversa (o que ajustar, simular, confirmar) é da skill de fork: este
 * comando grava direto no overlay, e é o único que grava lá.
 * @module commands/fork
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync } from "node:fs";
import { join, dirname, relative, sep, isAbsolute } from "node:path";
import { resolveEnvPath } from "../lib/env-loader.js";
import { getFrameworkRoot, getPackageInfo } from "../lib/utils/paths.js";
import { buildIndex } from "../lib/flow-map/index.js";
import { extractFrontmatterBlock, parseFrontmatter } from "../lib/utils/frontmatter.js";
import { readCompanyProfile } from "../lib/core/company-profile.js";
import { applyRuleOverlay } from "../lib/core/sync-engine.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { RED, GREEN, YELLOW, CYAN, DIM, NC } from "../lib/utils/ui.js";

/** Tipos que o overlay conhece: as pastas do core que ele espelha. */
export const OVERLAY_TYPES = Object.freeze([
  "workflows",
  "skills",
  "agents",
  "rules",
  "rules-on-demand",
  "templates",
]);

/** Tipos aceitos por caminho relativo (os demais vêm por nome, pelo índice do `jarvis map`). */
const PATH_TYPES = Object.freeze(["rules", "rules-on-demand", "templates"]);

/** Tipos que a IDE carrega sozinha: o fork recopia a cópia da IDE na hora (RuleResolver). */
const RULE_TYPES = Object.freeze(["rules", "rules-on-demand"]);

const STAMP_KEYS = /^(forked_from|forked_at|core_candidate):/;

/**
 * Resolve `{nome}` para um artefato do core: workflow, skill ou agente pelo nome (índice do
 * `jarvis map`), ou `rules/…`, `rules-on-demand/…`, `templates/…` por caminho relativo.
 * @param {string} root - Raiz do core instalado
 * @param {string} name
 * @returns {{ type: string, relPath: string, isDir: boolean } | null} `relPath` com `/`
 */
export function resolveArtifact(root, name) {
  if (!name || isAbsolute(name) || name.split(/[\\/]/).includes("..")) return null;
  const { items } = buildIndex(root);
  const item = items.get(name);
  if (item) {
    if (item.type === "skill") return { type: "skills", relPath: dirname(item.path), isDir: true };
    return { type: item.type === "workflow" ? "workflows" : "agents", relPath: item.path, isDir: false };
  }
  const norm = name.replace(/\\/g, "/").replace(/^\.\//, "");
  const first = norm.split("/")[0];
  if (PATH_TYPES.includes(first) && norm.endsWith(".md") && existsSync(join(root, norm))) {
    return { type: first, relPath: norm, isDir: false };
  }
  return null;
}

/**
 * Carimba o frontmatter com a origem do fork. Sem frontmatter (ex.: template), cria um só com o
 * carimbo. Carimbo anterior é substituído.
 * @param {string} content
 * @param {{ from: string, at: string, candidate?: boolean }} stamp
 * @returns {string}
 */
export function stampFrontmatter(content, { from, at, candidate = false }) {
  const lines = [`forked_from: ${from}`, `forked_at: ${at}`];
  if (candidate) lines.push("core_candidate: true");
  const block = extractFrontmatterBlock(content);
  if (block === null) return `---\n${lines.join("\n")}\n---\n\n${content}`;
  const kept = block
    .split("\n")
    .filter((l) => !STAMP_KEYS.test(l))
    .join("\n");
  const fenceEnd = content.indexOf("\n---", 3);
  return `---\n${kept}\n${lines.join("\n")}${content.slice(fenceEnd)}`;
}

/**
 * Lista o que está no overlay, e só isso (não compara com o core).
 * @param {string} overlayDir
 * @returns {Array<{ path: string, type: string, forkedFrom: string | null, forkedAt: string | null, candidate: boolean, unknownType: boolean }>}
 */
export function listOverlay(overlayDir) {
  if (!existsSync(overlayDir)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const rel = relative(overlayDir, full).split(sep).join("/");
      const type = rel.split("/")[0];
      // Skill: uma linha por pasta (o SKILL.md), não por arquivo de references/
      if (type === "skills" && !rel.endsWith("/SKILL.md")) continue;
      const fm = parseFrontmatter(readFileSync(full, "utf-8"));
      out.push({
        path: type === "skills" ? dirname(rel) : rel,
        type,
        forkedFrom: fm.forked_from ?? null,
        forkedAt: fm.forked_at ?? null,
        candidate: fm.core_candidate === "true",
        unknownType: !OVERLAY_TYPES.includes(type),
      });
    }
  };
  walk(overlayDir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Lê o perfil ativo a partir do ENV.md do workspace.
 * @returns {{ ideDir: string, profile: string, overlayDir: string, warning: string | null } | { error: string }}
 */
function readContext(flags) {
  let resolved;
  try {
    resolved = resolveEnvPath(process.cwd(), flags);
  } catch (err) {
    return { error: err.message.split("\n")[0] };
  }
  const ideDir = dirname(resolved.path);
  const envText = existsSync(resolved.path) ? readFileSync(resolved.path, "utf-8") : undefined;
  const { profile, warning } = readCompanyProfile(envText);
  return { ideDir, profile, warning, overlayDir: join(ideDir, "overlays", profile) };
}

/**
 * `jarvis fork {nome}` / `jarvis fork --list`.
 * @param {Record<string, unknown> & { _?: string[] }} flags
 * @returns {Promise<number>} código de saída (também gravado em `process.exitCode`)
 */
export async function fork(flags = {}) {
  configureFromFlags(flags);
  const exit = (code) => {
    process.exitCode = code;
    return code;
  };

  const ctx = readContext(flags);
  if (ctx.error) {
    logger.error(`${RED}🚫 ${ctx.error}${NC}`);
    logger.info(`${DIM}Rode jarvis init e depois /jarvis-init na IDE.${NC}`);
    return exit(1);
  }
  if (ctx.warning) logger.info(`${YELLOW}${ctx.warning}${NC}`);

  if (flags.list) {
    const entries = listOverlay(ctx.overlayDir);
    if (entries.length === 0) {
      logger.info(
        `ℹ️ Overlay "${ctx.profile}" sem forks. Use /jarvis-fork {artefato} para começar.`
      );
      return exit(0);
    }
    logger.info(`${CYAN}Overlay ${ctx.profile}: ${entries.length} fork(s)${NC}`);
    for (const e of entries) {
      const origin = e.forkedFrom ? `${e.forkedFrom}${e.forkedAt ? ` em ${e.forkedAt}` : ""}` : "(sem carimbo)";
      const flagsText = [e.candidate ? "candidato a core" : null, e.unknownType ? "⚠️ tipo não resolvido" : null]
        .filter(Boolean)
        .join(" · ");
      logger.info(`  ${e.path}${DIM}  ${origin}${flagsText ? `  ${flagsText}` : ""}${NC}`);
    }
    return exit(0);
  }

  const name = flags._?.[0];
  if (!name) {
    logger.error(`${RED}Uso: jarvis fork {nome} [--candidate] | jarvis fork --list${NC}`);
    return exit(1);
  }

  const root = getFrameworkRoot();
  const artifact = resolveArtifact(root, name);
  if (!artifact) {
    logger.error(
      `${YELLOW}⚠️ "${name}" não é um artefato do core. Use /jarvis-fork --list para ver o que já está no overlay ou jarvis map para os nomes do core.${NC}`
    );
    return exit(1);
  }

  const src = join(root, artifact.relPath);
  const dest = join(ctx.overlayDir, artifact.relPath);
  if (existsSync(dest)) {
    logger.error(
      `${YELLOW}⚠️ ${artifact.relPath} já está no overlay "${ctx.profile}". Use /jarvis-fork ${name} --update para ajustar.${NC}`
    );
    return exit(1);
  }

  const stamp = {
    from: `${name}@${getPackageInfo().version}`,
    at: new Date().toISOString().slice(0, 10),
    candidate: Boolean(flags.candidate),
  };
  mkdirSync(dirname(dest), { recursive: true });
  if (artifact.isDir) {
    cpSync(src, dest, { recursive: true });
    const skillMd = join(dest, "SKILL.md");
    writeFileSync(skillMd, stampFrontmatter(readFileSync(skillMd, "utf-8"), stamp), "utf-8");
  } else {
    writeFileSync(dest, stampFrontmatter(readFileSync(src, "utf-8"), stamp), "utf-8");
  }

  const shownDest = relative(dirname(ctx.ideDir), dest).split(sep).join("/");
  logger.info(`${GREEN}✓ Fork gravado:${NC} ${shownDest}`);
  logger.info(`${DIM}  forked_from: ${stamp.from} · forked_at: ${stamp.at}${stamp.candidate ? " · core_candidate: true" : ""}${NC}`);

  if (RULE_TYPES.includes(artifact.type)) {
    // A IDE carrega rules/ sozinha: recopia agora, sem esperar o próximo jarvis init --upgrade
    const result = { copied: [], skipped: [], errors: [] };
    applyRuleOverlay(ctx.ideDir, result);
    for (const e of result.errors) logger.error(`${RED}  ✗ ${e}${NC}`);
    logger.info(`${DIM}  ${artifact.type}/ recopiada na IDE com a marcação "> Overlay: ${ctx.profile}"${NC}`);
  } else {
    logger.info(`${DIM}  Vale na próxima chamada (rule de precedência). Edite o arquivo do overlay, não o da IDE.${NC}`);
  }
  logger.info(`${DIM}  A conversa e a confirmação ficam na skill de fork; este comando grava direto.${NC}`);
  return exit(0);
}
