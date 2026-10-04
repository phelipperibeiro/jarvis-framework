/**
 * @fileoverview Índice nome → artefato (workflows, skills e agentes ativos).
 *
 * Montado a cada execução, sem arquivo persistido. O nome identifica o item:
 * - workflow: arquivo `workflows/**\/{nome}.md` (sem README e AGENTS)
 * - skill: pasta `skills/{nome}/SKILL.md`
 * - agente: arquivo `agents/**\/{nome}.md` (fora de `archive/`, sem README e AGENTS)
 * @module flow-map/index
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const IGNORED_FILES = new Set(["README.md", "AGENTS.md"]);

function walkMarkdown(dir, skipDirs = []) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return skipDirs.includes(name) ? [] : walkMarkdown(path, skipDirs);
    }
    return name.endsWith(".md") && !IGNORED_FILES.has(name) ? [path] : [];
  });
}

/**
 * @typedef {Object} FlowItem
 * @property {string} name
 * @property {"workflow" | "skill" | "agent"} type
 * @property {string} path - Caminho relativo à raiz do framework, com `/`
 */

/**
 * @param {string} root - Raiz do framework (`workflows/`, `skills/`, `agents/`)
 * @returns {{ items: Map<string, FlowItem>, duplicates: string[] }}
 */
export function buildIndex(root) {
  const items = new Map();
  const duplicates = [];
  const rel = (path) => relative(root, path).split(sep).join("/");

  function add(item) {
    if (items.has(item.name)) duplicates.push(item.name);
    else items.set(item.name, item);
  }

  for (const file of walkMarkdown(join(root, "workflows"))) {
    add({ name: basename(file, ".md"), type: "workflow", path: rel(file) });
  }

  const skillsDir = join(root, "skills");
  if (existsSync(skillsDir)) {
    for (const dir of readdirSync(skillsDir)) {
      const skillMd = join(skillsDir, dir, "SKILL.md");
      if (existsSync(skillMd)) add({ name: dir, type: "skill", path: rel(skillMd) });
    }
  }

  for (const file of walkMarkdown(join(root, "agents"), ["archive"])) {
    add({ name: basename(file, ".md"), type: "agent", path: rel(file) });
  }

  return { items, duplicates };
}
