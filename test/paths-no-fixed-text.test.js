// Textos do framework não supõem os caminhos padrão do ENV.md (#228): `docs/jarvis`, `.jarvis/sessions`
// e a profundidade fixa `../../../../` ficam só onde são o valor padrão descrito ou um exemplo.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { expandEnvPath } from "../bin/lib/core/env-paths.js";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Caminhos que o texto não pode supor. */
const FIXED = [
  { re: /\.\.\/\.\.\/\.\.\/\.\./, name: "profundidade fixa ../../../../" },
  { re: /docs\/jarvis/, name: "docs/jarvis escrito por extenso" },
  { re: /\.jarvis\/sessions/, name: ".jarvis/sessions escrito por extenso" },
];

/** Arquivos varridos (cresce a cada fase da #228). */
const TARGETS = [
  "rules-on-demand/doc-links-rules.md",
  "templates/engineering/architecture-template.md",
  "templates/engineering/tech-spec-template.md",
  "templates/engineering/light-arch-template.md",
  "templates/engineering/plan-template.md",
  "templates/engineering/PR-template.md",
  "workflows/engineering/eng.pre-pr.md",
  "skills/jarvis-init/SKILL.md",
  "skills/jarvis-init/assets/upgrade.md",
  "skills/jarvis-init/assets/exemplo-execucao.md",
  "skills/jarvis-docs-central/SKILL.md",
  "skills/jarvis-docs-central/README.md",
  "workflows/engineering/eng.start.md",
  "workflows/engineering/eng.pr.md",
  "workflows/engineering/eng.create-ard.md",
  "workflows/engineering/eng.create-rfc.md",
  "workflows/engineering/eng.daily-report.md",
  "workflows/engineering/eng.spec-consolidate.md",
  "rules/product/prod-rules.md",
  "rules/engineering/eng-rules.md",
  "rules-on-demand/product/prod.spec-common-rules.md",
  "rules-on-demand/engineering/eng.transitions-rules.md",
  "skills/AGENTS.md",
  "skills/product-specs-update/SKILL.md",
  "skills/eng-global-tech-spec/references/reference-spec.md",
  "docs/visao-geral.md",
  "docs/estrutura/docs.md",
];

/** Linhas permitidas: arquivo + condição + motivo. Curta e explícita. */
const EXEMPT = [
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.startsWith("   | "), why: "tabela de exemplo com os valores padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.includes("com `JARVIS_DOCS=.jarvis/docs/jarvis`"), why: "exemplo com valores diferentes do padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.startsWith("Num `architecture.md` em `$SESSIONS_DIR/eng/{KEY}/`"), why: "introdução da seção Exemplos, que diz o que o {RAIZ} vira com os valores padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => /^- (Requisito|Decisão com travessão|Código|Trecho):/.test(l), why: "seção Exemplos, com os valores padrão" },
  // O padrão descrito como padrão (valor do template, não suposição). Cada exceção casa um trecho específico:
  { file: "skills/jarvis-init/SKILL.md", when: (l) => /\(padrão `?\.jarvis\/sessions`?[,)]/.test(l), why: "SESSIONS_DIR com o padrão entre parênteses (linhas 23, 231, 642 e 1174)" },
  { file: "skills/jarvis-init/SKILL.md", when: (l) => /^(#\s+)?SESSIONS_DIR=\.jarvis\/sessions$/.test(l.trim()), why: "ENV de exemplo com o valor padrão da chave" },
  { file: "skills/jarvis-init/SKILL.md", when: (l) => l.includes("| `SESSIONS_DIR` | `.jarvis/sessions` |"), why: "tabela de variáveis: o valor padrão" },
  { file: "skills/jarvis-init/SKILL.md", when: (l) => l.includes("hoje `docs/jarvis/central-docs`"), why: "Central docs: o padrão hoje, junto do derivado" },
  { file: "skills/jarvis-init/SKILL.md", when: (l) => l.startsWith("- ❌ Criar") && l.includes("`~/.jarvis/sessions`"), why: "o que NÃO criar no home" },
  { file: "skills/jarvis-init/assets/upgrade.md", when: (l) => l.includes("o padrão atual (`docs/jarvis/central-docs` com os valores padrão)"), why: "Central docs: o padrão atual" },
  { file: "skills/jarvis-init/assets/upgrade.md", when: (l) => l.includes("(padrão `.jarvis/sessions`) no lugar de `{IDE_FOLDER}/sessions`"), why: "9.2: o caminho de sessões padrão que o AGENTS.md novo cita (#225)" },
  { file: "skills/jarvis-init/assets/exemplo-execucao.md", when: (l) => l.includes("(padrão `.jarvis/sessions`)"), why: "exemplo de execução com o padrão" },
  { file: "skills/jarvis-docs-central/SKILL.md", when: (l) => l.includes("hoje `docs/jarvis/central-docs`"), why: "Central docs: o padrão hoje" },
  { file: "skills/jarvis-docs-central/README.md", when: (l) => l.includes("com os valores padrão, `docs/jarvis/central-docs`"), why: "Central docs: o padrão" },
  { file: "docs/visao-geral.md", when: (l) => l.includes("padrão `.jarvis/sessions`"), why: "guia: SESSIONS_DIR com o padrão descrito como padrão" },
  { file: "docs/estrutura/docs.md", when: (l) => l.includes("(com os valores padrão, `docs/jarvis/`)"), why: "guia: o padrão de JARVIS_DOCS descrito como padrão" },
  { file: "rules/product/prod-rules.md", when: (l) => /`\$(JARVIS_DOCS\/product|JARVIS_DOCS\/discoveries|ENG_DOCS)` \(`docs\/jarvis\//.test(l), why: "o padrão ao lado da variável (rule carregada no início da sessão: o tamanho é fixado em teste, #83)" },
  { file: "rules/engineering/eng-rules.md", when: (l) => l.includes("`$SESSIONS_DIR` → `.jarvis/sessions`"), why: "mapeamento da variável para o seu valor padrão (rule carregada no início da sessão)" },
  { file: "rules-on-demand/engineering/eng.transitions-rules.md", when: (l) => l.includes("com o `SESSIONS_DIR` padrão"), why: "exemplo de link com o padrão" },
  { file: "skills/product-specs-update/SKILL.md", when: (l) => l.includes("com os valores padrão"), why: "padrão descrito como padrão" },
  { file: "workflows/engineering/eng.spec-consolidate.md", when: (l) => l.includes('"originalPath": "/ws/.jarvis/sessions/'), why: "manifesto de exemplo, com caminho real de sessão" },
];

function violations(file) {
  const found = [];
  readFileSync(join(repoRoot, file), "utf-8")
    .split("\n")
    .forEach((line, i) => {
      for (const { re, name } of FIXED) {
        if (!re.test(line)) continue;
        if (EXEMPT.some((e) => e.file === file && e.when(line))) continue;
        found.push(`${file}:${i + 1} (${name}): ${line.trim().slice(0, 100)}`);
      }
    });
  return found;
}

for (const file of TARGETS) {
  test(`${file}: sem caminho padrão escrito por extenso fora das exceções`, () => {
    assert.deepEqual(violations(file), []);
  });
}

test("doc-links-rules.md: define o marcador {RAIZ} e o cálculo da profundidade", () => {
  const text = readFileSync(join(repoRoot, "rules-on-demand/doc-links-rules.md"), "utf-8");
  assert.match(text, /\{RAIZ\}/);
  assert.match(text, /um `\.\.\/` para cada pasta do caminho do arquivo gravado/);
});

test("o detector de caminho fixo acha o que o texto antigo tinha", () => {
  const velho = "A tabela supõe `DOCS_FOLDER=docs` e `SESSIONS_DIR=.jarvis/sessions`.";
  assert.ok(FIXED.some(({ re }) => re.test(velho)));
  assert.ok(FIXED.some(({ re }) => re.test("[x](../../../../docs/jarvis/product/a.md)")));
  assert.ok(!FIXED.some(({ re }) => re.test("[x]({RAIZ}$JARVIS_DOCS/product/a.md)")));
});

// --- os templates usam {RAIZ} em formas que o agente sabe expandir ---------------

const TEMPLATES = TARGETS.filter((f) => f.startsWith("templates/engineering/") && !f.endsWith("PR-template.md"));
const RAIZ_FORMS = /\]\(\{RAIZ\}(?:\{repo\}\/|\$(?:PROD_DOCS|ENG_DOCS|JARVIS_DOCS|DISCOVERIES_DOCS)\/)/g;

for (const file of TEMPLATES) {
  test(`${file}: todo {RAIZ} é seguido de {repo}/ ou de uma variável de pasta de documentos`, () => {
    const text = readFileSync(join(repoRoot, file), "utf-8");
    const all = text.match(/\]\(\{RAIZ\}/g) || [];
    const ok = text.match(RAIZ_FORMS) || [];
    assert.ok(all.length > 0, "o template deveria usar {RAIZ} nos links");
    assert.equal(ok.length, all.length);
  });
}

/** A regra 1 de doc-links-rules.md: um `../` por pasta do caminho do arquivo, a partir do workspace. */
const raiz = (folderFromWorkspace) => "../".repeat(folderFromWorkspace.split("/").filter(Boolean).length);

test("regra 1: o {RAIZ} calculado chega à pasta do workspace com valores padrão e com valores diferentes", () => {
  const ws = "/ws";
  const casos = [
    { env: {}, key: "SESSIONS_DIR", sub: "eng/K" },
    { env: { SESSIONS_DIR: "tmp/sessoes" }, key: "SESSIONS_DIR", sub: "eng/K" },
    { env: { DOCS_FOLDER: "documentos" }, key: "PROD_DOCS", sub: "prd-1-x" },
    { env: { JARVIS_DOCS: ".jarvis/$DOCS_FOLDER/jarvis" }, key: "PROD_DOCS", sub: "prd-1-x/issues" },
    { env: { DOCS_FOLDER: "d" }, key: "DISCOVERIES_DOCS", sub: "" },
  ];
  for (const { env, key, sub } of casos) {
    const pasta = `${expandEnvPath(env, key)}/${sub}`.replace(/\/$/, "");
    const dir = resolve(ws, pasta);
    assert.equal(resolve(dir, raiz(pasta)), ws, `${key} ${JSON.stringify(env)} → ${pasta}`);
    assert.ok(dir.startsWith(ws + sep));
  }
  // os valores padrão da tabela da regra
  assert.equal(raiz(".jarvis/sessions/eng/K"), "../../../../");
  assert.equal(raiz("docs/jarvis/product/prd-1-x/issues"), "../../../../../");
  assert.equal(raiz("docs/jarvis/discoveries"), "../../../");
});

test("templates: com DOCS_FOLDER, JARVIS_DOCS e SESSIONS_DIR fora do padrão, todo link {RAIZ}… resolve para uma pasta que existe", () => {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-templates-links-"));
  try {
    const env = { DOCS_FOLDER: "documentos", JARVIS_DOCS: ".jarvis/$DOCS_FOLDER/jarvis", SESSIONS_DIR: "sess/a/b" };
    const fileDir = join(ws, expandEnvPath(env, "SESSIONS_DIR"), "eng", "KEY-1"); // onde o architecture.md etc. são gravados
    mkdirSync(fileDir, { recursive: true });
    mkdirSync(join(ws, "jarvis-framework"), { recursive: true });
    for (const key of ["PROD_DOCS", "ENG_DOCS", "JARVIS_DOCS", "DISCOVERIES_DOCS"]) {
      mkdirSync(join(ws, expandEnvPath(env, key)), { recursive: true });
    }
    const prefixo = raiz(relative(ws, fileDir).split(sep).join("/"));
    assert.equal(prefixo, "../../../../../", "sess/a/b/eng/KEY-1 tem 5 pastas até o workspace");

    for (const file of TEMPLATES.filter((f) => !f.endsWith("PR-template.md"))) {
      const text = readFileSync(join(repoRoot, file), "utf-8");
      const links = [...text.matchAll(/\]\(\{RAIZ\}(\{repo\}|\$(PROD_DOCS|ENG_DOCS|JARVIS_DOCS|DISCOVERIES_DOCS))\//g)];
      assert.ok(links.length > 0, `${file}: sem link {RAIZ}`);
      for (const [, destino, chave] of links) {
        const base = destino === "{repo}" ? "jarvis-framework" : expandEnvPath(env, chave);
        const alvo = resolve(fileDir, prefixo + base);
        assert.ok(existsSync(alvo), `${file}: ${destino} → ${alvo} não existe`);
      }
    }
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});

// --- completude: arquivo novo com caminho fixo não passa batido -------------------

/** Arquivos que têm o padrão por natureza e por isso ficam fora de TARGETS (com o motivo). */
const IGNORED = {
  "templates/ENV-template.md": "é o próprio arquivo dos valores padrão",
  "templates/engineering/AGENTS-template.md": "o AGENTS.md do projeto alvo cita `.jarvis/sessions` como o valor padrão de `SESSIONS_DIR`, dito na própria frase (#225)",
};

function markdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(join(repoRoot, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...markdownFiles(rel));
    else if (entry.name.endsWith(".md")) out.push(rel);
  }
  return out;
}

test("completude: todo .md de workflows, skills, rules, templates, agents e docs com caminho fixo está em TARGETS ou em IGNORED", () => {
  const faltam = [];
  for (const dir of ["workflows", "skills", "rules", "rules-on-demand", "templates", "agents", "docs"]) {
    for (const file of markdownFiles(dir)) {
      if (TARGETS.includes(file) || file in IGNORED) continue;
      const text = readFileSync(join(repoRoot, file), "utf-8");
      if (FIXED.some(({ re }) => re.test(text))) faltam.push(file);
    }
  }
  assert.deepEqual(faltam, [], "arquivo com caminho fixo fora de TARGETS: acrescente a TARGETS (e às exceções) ou a IGNORED, com o motivo");
});

test("completude: os arquivos de IGNORED existem (a lista não apodrece)", () => {
  for (const file of Object.keys(IGNORED)) assert.ok(existsSync(join(repoRoot, file)), file);
});
