// Testes do relatório de tokens (jarvis tokens). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateTokens, frontmatterBytes, buildReport } from "../bin/lib/core/token-report.js";

function frameworkMinimo() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-tokens-"));
  mkdirSync(join(dir, "rules", "engineering"), { recursive: true });
  mkdirSync(join(dir, "skills", "skill-a"), { recursive: true });
  mkdirSync(join(dir, "skills", "skill-b"), { recursive: true });
  mkdirSync(join(dir, "skills", "sem-skill-md"), { recursive: true });
  mkdirSync(join(dir, "workflows"), { recursive: true });
  writeFileSync(join(dir, "rules", "AGENTS.md"), "x".repeat(100));
  writeFileSync(join(dir, "rules", "engineering", "back.md"), "y".repeat(200));
  writeFileSync(join(dir, "rules", "engineering", "front.md"), "y".repeat(300));
  // As duas exceções: só entram com ARTIFACT_STYLE=human-generated e com o RTK ligado.
  writeFileSync(join(dir, "rules", "artifact-style-rules.md"), "s".repeat(40));
  writeFileSync(join(dir, "rules", "rtk-rules.md"), "r".repeat(60));
  writeFileSync(join(dir, "skills", "AGENTS.md"), "z".repeat(999)); // não é skill
  writeFileSync(
    join(dir, "skills", "skill-a", "SKILL.md"),
    "---\nname: a\n---\n" + "corpo ".repeat(500)
  );
  writeFileSync(
    join(dir, "skills", "skill-b", "SKILL.md"),
    "sem frontmatter\n" + "corpo ".repeat(10)
  );
  writeFileSync(join(dir, "workflows", "warm-up.md"), "w".repeat(400));
  writeFileSync(join(dir, "AGENTS.md"), "a".repeat(50));
  return dir;
}

test("estimateTokens: bytes ÷ 4, arredondado", () => {
  assert.equal(estimateTokens(0), 0);
  assert.equal(estimateTokens(100), 25);
  assert.equal(estimateTokens(101), 25);
  assert.equal(estimateTokens(102), 26);
});

test("frontmatterBytes: só o bloco entre os ---, 0 sem frontmatter", () => {
  assert.equal(
    frontmatterBytes("---\nname: a\n---\ncorpo"),
    Buffer.byteLength("---\nname: a\n---")
  );
  assert.equal(frontmatterBytes("sem frontmatter"), 0);
});

test("buildReport: soma por tipo e total; as rules entram todas, menos as duas exceções desligadas", () => {
  const dir = frameworkMinimo();
  try {
    const r = buildReport(dir, {});
    const por = Object.fromEntries(r.categories.map((c) => [c.id, c]));

    // rules: AGENTS.md (100) + back.md (200) + front.md (300); artifact-style e rtk ficam de fora
    assert.deepEqual(por.rules.files.map((f) => f.path).sort(), [
      "AGENTS.md",
      "engineering/back.md",
      "engineering/front.md",
    ]);
    assert.equal(por.rules.bytes, 600);

    assert.equal(por["agents-md"].bytes, 50);
    assert.equal(por.warmup.bytes, 400);

    // só o skill-a tem frontmatter; skills/AGENTS.md e sem-skill-md não contam
    assert.equal(por["skills-frontmatter"].files.length, 1);
    assert.equal(por["skills-frontmatter"].bytes, Buffer.byteLength("---\nname: a\n---"));

    const soma = r.categories.reduce((s, c) => s + c.bytes, 0);
    assert.equal(r.total.bytes, soma);
    assert.equal(r.total.tokens, estimateTokens(soma));
    assert.match(r.estimate, /estimativa/);
    assert.deepEqual(r.profile, { ARTIFACT_STYLE: "ai-generated" });
    assert.equal(r.rtkEnabled, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildReport: ARTIFACT_STYLE=human-generated e o RTK ligado mudam só as rules", () => {
  const dir = frameworkMinimo();
  try {
    const padrao = buildReport(dir, {});
    const r = buildReport(dir, { ARTIFACT_STYLE: "human-generated" }, { rtkEnabled: true });
    const rules = r.categories.find((c) => c.id === "rules");
    assert.deepEqual(rules.files.map((f) => f.path).sort(), [
      "AGENTS.md",
      "artifact-style-rules.md",
      "engineering/back.md",
      "engineering/front.md",
      "rtk-rules.md",
    ]);
    assert.equal(rules.bytes, 700);
    for (const id of ["agents-md", "skills-frontmatter", "warmup"]) {
      const bytes = (rep) => rep.categories.find((c) => c.id === id).bytes;
      assert.equal(bytes(r), bytes(padrao), id);
    }
    assert.deepEqual(r.profile, { ARTIFACT_STYLE: "human-generated" });
    assert.equal(r.rtkEnabled, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildReport: framework sem warm-up nem AGENTS.md não quebra", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-tokens-"));
  try {
    mkdirSync(join(dir, "rules"));
    const r = buildReport(dir);
    assert.equal(r.total.bytes, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Orçamento de tokens do contexto base (o mesmo cálculo do `jarvis tokens`), sem RTK, com
// ARTIFACT_STYLE padrão (ai-generated), sem overlay nem ENV.md, na raiz deste repositório
// (#122, #208 fase 4). Fórmula: orçamento = Math.ceil(medido × 1,02 / 100) × 100.
// Desde a #263 as rules são as mesmas para todo mundo, e a medida é uma só. Medido em 2026-11-10
// (af71103, antes da #263): 25.982 tokens; o orçamento é provisório até a medição final da #263.
// Arquivos não rastreados em rules/ ou skills/ e CRLF mudam a medida (como na medida de rules/ do
// profile-filter). Aumento intencional: recalcule pela fórmula e atualize no mesmo PR, com o
// motivo. Reduções não exigem mudar o teste.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ORCAMENTO = 27300;

test(`orçamento de tokens: contexto base ≤ ${ORCAMENTO}`, () => {
  const r = buildReport(root, {});
  const medido = r.total.tokens;
  if (medido <= ORCAMENTO) return;
  const maiores = r.categories
    .flatMap((c) =>
      c.files.map((f) => ({ ...f, path: c.id === "rules" ? `rules/${f.path}` : f.path }))
    )
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5)
    .map((f) => `${f.path} (${f.bytes})`)
    .join(", ");
  assert.fail(
    `orçamento estourado: ${medido} tokens (orçamento ${ORCAMENTO}, +${medido - ORCAMENTO}). ` +
      `Maiores arquivos: ${maiores}. Se o aumento é intencional, atualize ORCAMENTO em ` +
      "test/token-report.test.js (fórmula no comentário)."
  );
});
