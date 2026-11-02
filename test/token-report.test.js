// Testes do relatório de tokens (jarvis tokens). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
    assert.deepEqual(r.profile, { ...perfil, ARTIFACT_STYLE: "ai-generated" });
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

// Orçamento de tokens do contexto base (o mesmo cálculo do `jarvis tokens`) em 6 perfis de
// referência (#122, #208 fase 4). Medido em 2026-11-02 no commit 86fbe47, com
// orçamento = Math.ceil(medido × 1,02 / 100) × 100. Condições: buildReport(root, perfil) na raiz
// deste repositório, sem RTK, ARTIFACT_STYLE padrão (ai-generated), sem overlay nem ENV.md.
// Arquivos não rastreados em rules/ ou skills/ e CRLF mudam a medida (como no BASE do
// profile-filter). Aumento intencional: recalcule pela fórmula e atualize no mesmo PR, com o
// motivo. Reduções não exigem mudar o teste.
// Medidos (tokens): FULLCYCLE/GENERALIST 26.726, BACKEND 21.515, FRONTEND 23.590, QA 21.631,
// DATA 21.515, FULLCYCLE/PM/PRODUCT 20.993.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const perfil = (HUB, POSITION, AREA) => ({ HUB, POSITION, AREA, SQUAD: "CORE" });
const ORCAMENTO = [
  [
    "FULLCYCLE/GENERALIST/ENGINEERING/CORE",
    perfil("FULLCYCLE", "GENERALIST", "ENGINEERING"),
    27300,
  ],
  ["BACKEND/SENIOR/ENGINEERING/CORE", perfil("BACKEND", "SENIOR", "ENGINEERING"), 22000],
  ["FRONTEND/PLENO/ENGINEERING/CORE", perfil("FRONTEND", "PLENO", "ENGINEERING"), 24100],
  ["QA/QA-ENGINEER/ENGINEERING/CORE", perfil("QA", "QA-ENGINEER", "ENGINEERING"), 22100],
  // DATA recebe hoje as mesmas rules que BACKEND (a data-rules.md saiu na #209); fica para pegar
  // uma rule futura de HUB: DATA.
  ["DATA/SENIOR/ENGINEERING/CORE", perfil("DATA", "SENIOR", "ENGINEERING"), 22000],
  ["FULLCYCLE/PM/PRODUCT/CORE", perfil("FULLCYCLE", "PM", "PRODUCT"), 21500],
];

for (const [nome, p, orcamento] of ORCAMENTO) {
  test(`orçamento de tokens: ${nome} ≤ ${orcamento}`, () => {
    const r = buildReport(root, p);
    const medido = r.total.tokens;
    if (medido <= orcamento) return;
    const maiores = r.categories
      .flatMap((c) =>
        c.files.map((f) => ({ ...f, path: c.id === "rules" ? `rules/${f.path}` : f.path }))
      )
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
      .map((f) => `${f.path} (${f.bytes})`)
      .join(", ");
    assert.fail(
      `orçamento estourado em ${nome}: ${medido} tokens (orçamento ${orcamento}, +${medido - orcamento}). ` +
        `Maiores arquivos: ${maiores}. Se o aumento é intencional, atualize ORCAMENTO em ` +
        "test/token-report.test.js (fórmula no comentário)."
    );
  });
}
