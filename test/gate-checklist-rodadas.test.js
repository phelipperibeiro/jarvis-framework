// Confere o formato das rodadas do gate-checklist.md (#186), repetido em vários arquivos:
// o nome gate-checklist-rodada-{N}.md e os campos Rodada/Commit do modelo do relatório.
// Guarda só o formato (a prosa dos workflows não tem teste de comportamento).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
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

// Pastas varridas nos testes 3 e 4: qualquer .md novo que cite o padrão com formato errado é pego
const PASTAS = ["workflows", "rules-on-demand", "agents", "docs"];

function walk(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? walk(caminho) : caminho.endsWith(".md") ? [caminho] : [];
  });
}
const TODOS_MD = PASTAS.flatMap((pasta) => walk(join(root, pasta)));

test("o modelo do relatório tem Rodada, Commit e as seções de rodadas", () => {
  const texto = read(PRE_PR);
  assert.match(texto, /Rodada: \{N\}/, `${PRE_PR} sem "Rodada: {N}". ${DE_PROPOSITO}`);
  assert.match(texto, /Commit: \{/, `${PRE_PR} sem "Commit: {". ${DE_PROPOSITO}`);
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
  const invalido = /gate-checklist-rodada(?!-(\{[MN]\}|\d+|\*)(\.public)?\.md)/g;
  for (const file of TODOS_MD) {
    const achados = read(file).match(invalido) || [];
    assert.equal(achados.length, 0, `${rel(file)} tem gate-checklist-rodada fora do formato. ${DE_PROPOSITO}`);
  }
});

test("a grafia gate-checklist-rodada é sempre a mesma (hífens, sem underscore nem espaço)", () => {
  const solta = /gate[^a-z0-9]?checklist[^a-z0-9]?rodada/gi;
  for (const file of TODOS_MD) {
    for (const achado of read(file).match(solta) || []) {
      assert.equal(achado, "gate-checklist-rodada", `${rel(file)}: "${achado}". ${DE_PROPOSITO}`);
    }
  }
});
