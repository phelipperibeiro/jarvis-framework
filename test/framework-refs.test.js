// Confere referências entre arquivos do framework que o test:comandos não cobre:
// caminhos $IDE/..., links relativos e a metadata.area de cada skill.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => relative(root, p);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
}

// assets/ guarda modelos de arquivos que ainda serão gerados: os links de lá apontam para o futuro.
const isAsset = (file) => file.split(sep).includes("assets");

// Placeholders de exemplo, não referências reais: {nome}, *, …, <x>, xxx, nome-da-skill.
const isPlaceholder = (path) => /[{}*…<>]|xxx|nome-d[aoe]-/i.test(path);

// Blocos de código trazem exemplos de comando; os links markdown de dentro deles não são navegáveis.
const withoutCode = (text) => text.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1/gm, "");

// Arquivos gerados fora do framework (na raiz do workspace do usuário).
const GENERATED = ["CDD-MIND-MAP.md"];

test("caminhos $IDE/... citados no framework existem (inclusive em blocos de código)", () => {
  const folders = ["skills", "templates", "workflows", "rules", "rules-on-demand", "agents"];
  const broken = [];
  for (const folder of folders) {
    for (const file of walk(join(root, folder))) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\$IDE\/((?:skills|templates|workflows|rules|rules-on-demand|agents)\/[^\s`'")\]|,;]+)/g)) {
        const path = m[1].replace(/[.:]+$/, "");
        if (isPlaceholder(path)) continue;
        if (!existsSync(join(root, path))) broken.push(`${rel(file)}: $IDE/${path}`);
      }
    }
  }
  assert.deepEqual(broken, [], `caminhos quebrados:\n${broken.join("\n")}`);
});

test("links relativos de skills, templates e workflows existem", () => {
  const files = ["skills", "templates", "workflows"]
    .flatMap((folder) => walk(join(root, folder)))
    .filter((file) => !isAsset(file));
  const broken = [];
  for (const file of files) {
    const text = withoutCode(readFileSync(file, "utf8"));
    for (const m of text.matchAll(/\]\(([^)#\s:$]+\.md)(?:#[^)]*)?\)/g)) {
      if (isPlaceholder(m[1]) || GENERATED.some((g) => m[1].endsWith(g))) continue;
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
    const frontmatter = readFileSync(file, "utf8").match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? "";
    // Aceita os dois formatos de YAML: bloco (metadata:\n  area: x) e inline (metadata: {area: x}).
    const area =
      frontmatter.match(/^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+area:\s*["']?([\w-]+)/m)?.[1] ??
      frontmatter.match(/^metadata:\s*\{[^}]*\barea:\s*["']?([\w-]+)/m)?.[1];
    if (!areas.has(area)) wrong.push(`${name}: area=${area ?? "(vazia)"}`);
  }
  assert.deepEqual(wrong, [], `skills sem área reconhecida:\n${wrong.join("\n")}`);
});
