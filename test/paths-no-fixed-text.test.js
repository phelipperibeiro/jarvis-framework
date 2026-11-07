// Textos do framework não supõem os caminhos padrão do ENV.md (#228): `docs/jarvis`, `.jarvis/sessions`
// e a profundidade fixa `../../../../` ficam só onde são o valor padrão descrito ou um exemplo.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Caminhos que o texto não pode supor. */
const FIXED = [
  { re: /\.\.\/\.\.\/\.\.\/\.\./, name: "profundidade fixa ../../../../" },
  { re: /docs\/jarvis/, name: "docs/jarvis escrito por extenso" },
  { re: /\.jarvis\/sessions/, name: ".jarvis/sessions escrito por extenso" },
];

/** Arquivos varridos (cresce a cada fase da #228). */
const TARGETS = ["rules-on-demand/doc-links-rules.md"];

/** Linhas permitidas: arquivo + condição + motivo. Curta e explícita. */
const EXEMPT = [
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.startsWith("   | "), why: "tabela de exemplo com os valores padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.includes("com `JARVIS_DOCS=.jarvis/docs/jarvis`"), why: "exemplo com valores diferentes do padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => l.startsWith("Num `architecture.md` em `$SESSIONS_DIR/eng/{KEY}/`"), why: "introdução da seção Exemplos, que diz o que o {RAIZ} vira com os valores padrão" },
  { file: "rules-on-demand/doc-links-rules.md", when: (l) => /^- (Requisito|Decisão com travessão|Código|Trecho):/.test(l), why: "seção Exemplos, com os valores padrão" },
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
