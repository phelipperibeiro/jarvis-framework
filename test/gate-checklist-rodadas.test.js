// Confere o formato das rodadas do gate-checklist.md (#186), repetido em vários arquivos:
// o nome gate-checklist-rodada-{N}.md e os campos Rodada/Commit do modelo do relatório.
// Guarda só o formato (a prosa dos workflows não tem teste de comportamento).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(file.startsWith("/") ? file : join(root, file), "utf8");
const rel = (file) => relative(root, file);

const PRE_PR = "workflows/engineering/eng.pre-pr.md";

// As mensagens de falha dizem que o formato é guardado de propósito: uma redação que muda
// o literal (por exemplo, "Rodada: {n}") quebra o teste e pede a atualização dele junto.
const DE_PROPOSITO =
  "O formato das rodadas do gate-checklist é guardado de propósito (#186): ao mudá-lo, atualize test/gate-checklist-rodadas.test.js junto.";

// Arquivos que devem citar as rodadas anteriores (teste 2)
const CITAM_RODADAS = [
  PRE_PR,
  "rules-on-demand/engineering/eng.pre-pr-rules.md",
  "rules-on-demand/engineering/eng.transitions-rules.md",
  "rules-on-demand/engineering/eng.pr-rules.md",
  "rules-on-demand/doc-links-rules.md",
  "workflows/engineering/eng.pr.md",
  "workflows/engineering/eng.spec-consolidate.md",
  "agents/engineering/eng.docs-consolidator.agent.md",
  "docs/engenharia/eng.pre-pr.md",
  "docs/engenharia/README.md",
];

// Varridos nos testes 3 e 4: qualquer .md novo que cite o padrão com formato errado é pego
const PASTAS = ["workflows", "rules-on-demand", "agents", "docs", "rules", "skills", "templates"];
const ARQUIVOS_RAIZ = ["CHANGELOG.md"];

// Dirent.isDirectory() não segue link simbólico (statSync seguiria, e um link quebrado ou circular
// derrubaria a varredura). A lista é calculada dentro de cada teste, não na carga do arquivo.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return walk(caminho);
    return entrada.isFile() && caminho.endsWith(".md") ? [caminho] : [];
  });
}
function todosMd() {
  const pastas = PASTAS.map((p) => join(root, p)).filter((p) => existsSync(p));
  const raiz = ARQUIVOS_RAIZ.map((f) => join(root, f)).filter((f) => existsSync(f));
  return [...pastas.flatMap(walk), ...raiz];
}

test("o modelo do relatório tem Rodada, Commit e as seções de rodadas", () => {
  const texto = read(PRE_PR);
  assert.match(texto, /Rodada: \{N\}/, `${PRE_PR} sem "Rodada: {N}". ${DE_PROPOSITO}`);
  assert.match(texto, /Commit: \{sha/, `${PRE_PR} sem "Commit: {sha". ${DE_PROPOSITO}`);
  assert.match(texto, /^## Rodadas anteriores$/m, `${PRE_PR} sem a seção "Rodadas anteriores". ${DE_PROPOSITO}`);
  assert.match(
    texto,
    /^## Resolução da rodada anterior$/m,
    `${PRE_PR} sem a seção "Resolução da rodada anterior". ${DE_PROPOSITO}`
  );
});

test("os arquivos que tratam do relatório citam as rodadas anteriores", () => {
  for (const file of CITAM_RODADAS) {
    assert.match(read(file), /gate-checklist-rodada-/, `${file} não cita gate-checklist-rodada-. ${DE_PROPOSITO}`);
  }
});

test("todo gate-checklist-rodada vem com número ou curinga e extensão: -{N}.md, -{M}.public.md, -1.md ou -*.md", () => {
  // (?!\w) depois de .md pega .mdx e .md5, e deixa passar o ponto final de uma frase;
  // (?!s(...)) ignora o plural só como palavra solta na frase ("as gate-checklist-rodadas anteriores"),
  // mas pega o plural em nome de arquivo (gate-checklist-rodadas-1.md, gate-checklist-rodadas_2.md)
  const invalido = /gate-checklist-rodada(?!s(?:[\s,;:)]|\.(?!md)|$))(?!-(\{[MN]\}|\d+|\*)(\.public)?\.md(?!\w))/g;
  for (const file of todosMd()) {
    const achados = read(file).match(invalido) || [];
    assert.equal(achados.length, 0, `${rel(file)} tem gate-checklist-rodada fora do formato. ${DE_PROPOSITO}`);
  }
});

test("a grafia gate-checklist-rodada é sempre a mesma: minúscula, com hífens (sem underscore, espaço nem maiúscula)", () => {
  // Só olha a forma seguida de -{, -<dígito>, -* (ou o mesmo com _) ou de .md/.public.md, que é onde o nome
  // do arquivo aparece; o espaço fica de fora: "gate-checklist Rodada 2" é frase, não nome de arquivo.
  const solta = /gate[_ -]?checklist[_ -]?rodada(?=[-_](?:\{|\d|\*)|[-_]?\.(?:public\.)?md)/gi;
  for (const file of todosMd()) {
    for (const achado of read(file).match(solta) || []) {
      assert.equal(achado, "gate-checklist-rodada", `${rel(file)}: "${achado}". Nome de arquivo é minúsculo. ${DE_PROPOSITO}`);
    }
  }
});
