// Confere o formato das rodadas do gate-checklist.md (#186), repetido em vários arquivos:
// o nome gate-checklist-rodada-{N}.md e os campos Rodada/Commit do modelo do relatório.
// Guarda só o formato (a prosa dos workflows não tem teste de comportamento).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const PRE_PR = "workflows/engineering/eng.pre-pr.md";

// Arquivos que citam as rodadas anteriores
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

test("o modelo do relatório tem Rodada, Commit e as seções de rodadas", () => {
  const texto = read(PRE_PR);
  assert.match(texto, /Rodada: \{N\}/);
  assert.match(texto, /Commit: \{/);
  assert.match(texto, /^## Rodadas anteriores$/m);
  assert.match(texto, /^## Resolução da rodada anterior$/m);
});

test("os arquivos que tratam do relatório citam as rodadas anteriores", () => {
  for (const file of CITAM_RODADAS) {
    assert.match(read(file), /gate-checklist-rodada-/, `${file} não cita gate-checklist-rodada-`);
  }
});

test("todo gate-checklist-rodada vem com número ou curinga: -{N}, -{M}, -<dígito> ou -*", () => {
  const invalido = /gate-checklist-rodada(?!-(\{[MN]\}|\d|\*))/g;
  for (const file of CITAM_RODADAS) {
    const achados = read(file).match(invalido) || [];
    assert.equal(achados.length, 0, `${file} tem gate-checklist-rodada sem o número depois do hífen`);
  }
});
