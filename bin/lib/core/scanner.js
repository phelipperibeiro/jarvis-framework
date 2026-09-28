import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getFrameworkRoot } from "../utils/paths.js";

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) {
      let val = kv[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      fm[kv[1]] = val;
    }
  }
  return fm;
}

function extractDeps(content) {
  const deps = { rules: [], templates: [], skills: [], agents: [] };

  const ruleFile = content.match(/rules_file:\s*"?\$IDE\/rules\/(.+?)\.md"?/);
  if (ruleFile) deps.rules.push(ruleFile[1]);

  for (const m of content.matchAll(/rules\/([\w./-]+)\.md/g)) {
    if (!deps.rules.includes(m[1])) deps.rules.push(m[1]);
  }

  const tplFile = content.match(
    /template_file:\s*"?\$IDE\/templates\/(.+?)\.md"?/,
  );
  if (tplFile) deps.templates.push(tplFile[1]);

  const agentFile = content.match(/agent:\s*"?\$IDE\/agents\/(.+?)\.md"?/);
  if (agentFile) deps.agents.push(agentFile[1]);

  return deps;
}

function scanDir(dir, type) {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (type === "skill") {
        const skillFile = join(fullPath, "SKILL.md");
        if (existsSync(skillFile)) {
          const content = readFileSync(skillFile, "utf-8");
          const fm = parseFrontmatter(content);
          results.push({
            id: fm.name || entry.name,
            type,
            name: fm.name || entry.name,
            description: fm.description || "",
            version: fm.version || "1.0.0",
            deps: extractDeps(content),
            path: skillFile,
          });
        }
      } else {
        results.push(...scanDir(fullPath, type));
      }
      continue;
    }

    if (
      !entry.name.endsWith(".md") ||
      entry.name === "README.md" ||
      entry.name === "AGENTS.md"
    ) {
      continue;
    }

    const content = readFileSync(fullPath, "utf-8");
    const fm = parseFrontmatter(content);
    const id = entry.name.replace(".md", "");

    results.push({
      id,
      type,
      name: fm.description || id,
      description: fm.description || "",
      model: fm.model || fm.recommended_model || "",
      version: fm.version || "1.0.0",
      deps: extractDeps(content),
      path: fullPath,
    });
  }

  return results;
}

export function discoverAll() {
  const root = getFrameworkRoot();

  return {
    agents: scanDir(join(root, "agents"), "agent"),
    skills: scanDir(join(root, "skills"), "skill"),
    workflows: scanDir(join(root, "workflows"), "workflow"),
  };
}

export function findPrompt(typeAndName) {
  const [type, name] = typeAndName.split("/");
  if (!type || !name) return null;

  const all = discoverAll();
  const collection = all[type + "s"];
  if (!collection) return null;

  return collection.find((p) => p.id === name) || null;
}
