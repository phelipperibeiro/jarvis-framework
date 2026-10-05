// Testes do relatório de tokens (jarvis tokens). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { estimateTokens, frontmatterBytes, buildReport } from "../bin/lib/core/token-report.js";

const bloco = (hub) => `> **Applies to:** HUB: ${hub} | POSITION: all | AREA: all | SQUAD: all\n`;

function frameworkMinimo() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-tokens-"));
  mkdirSync(join(dir, "rules", "engineering"), { recursive: true });
  mkdirSync(join(dir, "skills", "skill-a"), { recursive: true });
  mkdirSync(join(dir, "skills", "skill-b"), { recursive: true });
  mkdirSync(join(dir, "skills", "sem-skill-md"), { recursive: true });
  mkdirSync(join(dir, "workflows"), { recursive: true });
  writeFileSync(join(dir, "rules", "AGENTS.md"), "x".repeat(100));
  writeFileSync(join(dir, "rules", "engineering", "back.md"), bloco("BACKEND") + "y".repeat(200));
  writeFileSync(join(dir, "rules", "engineering", "front.md"), bloco("FRONTEND") + "y".repeat(300));
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

test("buildReport: soma por tipo e total, respeitando o perfil", () => {
  const dir = frameworkMinimo();
  try {
    const perfil = { HUB: "BACKEND", POSITION: "SENIOR", AREA: "ENGINEERING", SQUAD: "CORE" };
    const r = buildReport(dir, perfil);
    const por = Object.fromEntries(r.categories.map((c) => [c.id, c]));

    // rules: AGENTS.md (100) + back.md (bloco + 200); front.md fica de fora
    const back = Buffer.byteLength(bloco("BACKEND")) + 200;
    assert.equal(por.rules.files.length, 2);
    assert.equal(por.rules.bytes, 100 + back);

    assert.equal(por["agents-md"].bytes, 50);
    assert.equal(por.warmup.bytes, 400);

    // só o skill-a tem frontmatter; skills/AGENTS.md e sem-skill-md não contam
    assert.equal(por["skills-frontmatter"].files.length, 1);
    assert.equal(por["skills-frontmatter"].bytes, Buffer.byteLength("---\nname: a\n---"));

    const soma = r.categories.reduce((s, c) => s + c.bytes, 0);
    assert.equal(r.total.bytes, soma);
    assert.equal(r.total.tokens, estimateTokens(soma));
    assert.match(r.estimate, /estimativa/);
    assert.deepEqual(r.profile, perfil);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildReport: outro perfil muda só as rules", () => {
  const dir = frameworkMinimo();
  try {
    const r = buildReport(dir, {
      HUB: "FRONTEND",
      POSITION: "PLENO",
      AREA: "ENGINEERING",
      SQUAD: "CORE",
    });
    const rules = r.categories.find((c) => c.id === "rules");
    assert.deepEqual(rules.files.map((f) => f.path).sort(), ["AGENTS.md", "engineering/front.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildReport: framework sem warm-up nem AGENTS.md não quebra", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-tokens-"));
  try {
    mkdirSync(join(dir, "rules"));
    const r = buildReport(dir, {
      HUB: "QA",
      POSITION: "SENIOR",
      AREA: "ENGINEERING",
      SQUAD: "CORE",
    });
    assert.equal(r.total.bytes, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
