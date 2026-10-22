// Confere referências entre arquivos do framework que o test:comandos não cobre:
// caminhos $IDE/..., links dos skills e a metadata.area de cada skill.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => relative(root, p);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
}

// Blocos de código trazem exemplos e placeholders, não referências reais.
const withoutCode = (text) => text.replace(/```[\s\S]*?```/g, "");

test("caminhos $IDE/... citados no framework existem", () => {
  const folders = ["skills", "templates", "workflows", "rules", "rules-on-demand", "agents"];
  const broken = [];
  for (const folder of folders) {
    for (const file of walk(join(root, folder))) {
      const text = withoutCode(readFileSync(file, "utf8"));
      for (const m of text.matchAll(/\$IDE\/((?:skills|templates|workflows|rules|rules-on-demand|agents)\/[\w.@/-]+\.md)/g)) {
        if (!existsSync(join(root, m[1]))) broken.push(`${rel(file)}: $IDE/${m[1]}`);
      }
    }
  }
  assert.deepEqual(broken, [], `caminhos quebrados:\n${broken.join("\n")}`);
});

test("links relativos de SKILL.md e references/ dos skills existem", () => {
  // assets/ fica de fora: são modelos de arquivos que ainda serão gerados.
  const files = walk(join(root, "skills")).filter((f) => !f.includes(`${join("/", "assets", "/")}`));
  const broken = [];
  for (const file of files) {
    const text = withoutCode(readFileSync(file, "utf8"));
    for (const m of text.matchAll(/\]\(([^)#\s:$]+\.md)(?:#[^)]*)?\)/g)) {
      if (m[1].endsWith("CDD-MIND-MAP.md")) continue; // gerado na raiz do workspace
      if (!existsSync(normalize(join(dirname(file), m[1])))) broken.push(`${rel(file)}: ${m[1]}`);
    }
  }
  assert.deepEqual(broken, [], `links quebrados:\n${broken.join("\n")}`);
});

test("todo skill tem metadata.area reconhecida (eng.skills-rules.md)", () => {
  const rule = readFileSync(join(root, "rules", "engineering", "eng.skills-rules.md"), "utf8");
  const line = rule.match(/\*\*Áreas reconhecidas:\*\*(.+)/);
  assert.ok(line, "eng.skills-rules.md perdeu a linha **Áreas reconhecidas:**");
  const areas = new Set([...line[1].matchAll(/`([a-z]+)`/g)].map((m) => m[1]));

  const wrong = [];
  for (const name of readdirSync(join(root, "skills"))) {
    const file = join(root, "skills", name, "SKILL.md");
    if (!existsSync(file)) continue;
    const frontmatter = readFileSync(file, "utf8").match(/^---\s*\n([\s\S]*?)\n---/);
    const area = frontmatter?.[1].match(/^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+area:\s*["']?([\w-]+)/m)?.[1];
    if (!areas.has(area)) wrong.push(`${name}: area=${area ?? "(vazia)"}`);
  }
  assert.deepEqual(wrong, [], `skills sem área reconhecida:\n${wrong.join("\n")}`);
});
