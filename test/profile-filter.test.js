// Testes do filtro de rules por perfil. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isRuleEnabled, listRules } from "../bin/lib/core/profile-filter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("isRuleEnabled: artifact-style-rules.md só com human-generated, rtk-rules.md só com o RTK, o resto entra (#263)", () => {
  assert.equal(isRuleEnabled("artifact-style-rules.md"), false);
  assert.equal(isRuleEnabled("artifact-style-rules.md", { artifactStyle: "ai-generated" }), false);
  assert.equal(
    isRuleEnabled("artifact-style-rules.md", { artifactStyle: " human-generated " }),
    true
  );
  assert.equal(isRuleEnabled("rtk-rules.md"), false);
  assert.equal(isRuleEnabled("rtk-rules.md", { rtkEnabled: true }), true);
  // Decide o nome exato do arquivo, em qualquer pasta e com qualquer separador.
  assert.equal(isRuleEnabled("engineering\\rtk-rules.md"), false);
  for (const rel of ["engineering/eng-rules.md", "product/prod-rules.md", "minha-rtk-rules.md"]) {
    assert.equal(isRuleEnabled(rel), true, rel);
    assert.equal(isRuleEnabled(rel, { artifactStyle: "human-generated", rtkEnabled: true }), true);
  }
});

test("listRules: recursivo em subpastas, sem as exceções desligadas e do maior para o menor (#263)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-filtro-"));
  try {
    mkdirSync(join(dir, "engineering", "frontend"), { recursive: true });
    writeFileSync(join(dir, "universal.md"), "u".repeat(10));
    writeFileSync(join(dir, "engineering", "back.md"), "b".repeat(30));
    writeFileSync(join(dir, "engineering", "frontend", "front.md"), "f".repeat(20));
    writeFileSync(join(dir, "rtk-rules.md"), "r".repeat(5));
    writeFileSync(join(dir, "artifact-style-rules.md"), "a".repeat(5));
    writeFileSync(join(dir, "notas.txt"), "não é rule");

    assert.deepEqual(listRules(dir), [
      { path: "engineering/back.md", bytes: 30 },
      { path: "engineering/frontend/front.md", bytes: 20 },
      { path: "universal.md", bytes: 10 },
    ]);
    const tudo = listRules(dir, { artifactStyle: "human-generated", rtkEnabled: true });
    assert.deepEqual(
      tudo.map((r) => r.path),
      [
        "engineering/back.md",
        "engineering/frontend/front.md",
        "universal.md",
        "artifact-style-rules.md",
        "rtk-rules.md",
      ]
    );
    assert.deepEqual(listRules(join(dir, "nao-existe")), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Medida de rules/ (o que o Claude Code carrega no início da sessão), sem RTK e com ARTIFACT_STYLE
// padrão: as rules de toda instalação, desde a #263. Muda quando uma rule é acrescentada, movida,
// apagada ou editada: atualize no mesmo PR, dizendo o motivo. Arquivos não rastreados em rules/ e
// CRLF mudam a medida. As medidas antigas, por perfil, estão no histórico do git deste arquivo.
const RULES = { arquivos: 7, bytes: 46724 };

test(`rules reais: rules/ entrega ${RULES.arquivos} arquivos e ${RULES.bytes} B`, () => {
  const rules = listRules(join(root, "rules"));
  assert.equal(rules.length, RULES.arquivos);
  assert.equal(
    rules.reduce((s, r) => s + r.bytes, 0),
    RULES.bytes
  );
});

test("rules reais: artifact-style-rules.md só com ARTIFACT_STYLE=human-generated", () => {
  const tem = (opts) =>
    listRules(join(root, "rules"), opts).some((r) => r.path === "artifact-style-rules.md");
  assert.equal(tem({}), false);
  assert.equal(tem({ artifactStyle: "ai-generated" }), false);
  assert.equal(tem({ artifactStyle: "human-generated" }), true);
});

test("rules reais: a de frontend e a de spec de produto ficam em rules-on-demand/, e os comandos da área mandam lê-las (#263)", () => {
  const sobDemanda = listRules(join(root, "rules-on-demand")).map((r) => r.path);
  for (const caminho of [
    "engineering/frontend/eng.frontend-rules.md",
    "product/prod.spec-rules.md",
  ]) {
    assert.ok(sobDemanda.includes(caminho), `rules-on-demand/${caminho}`);
    assert.ok(!existsSync(join(root, "rules", caminho)), `rules/${caminho} não deveria existir`);
  }
  // O ponteiro de Cypress saiu de rules/ (a pasta engineering/qa/ ficou vazia e sumiu).
  assert.ok(!existsSync(join(root, "rules", "engineering", "qa")));
  // Os 7 comandos de spec de produto mandam ler a prod.spec-rules.md.
  for (const w of ["prd", "frd", "epic", "issue", "breakdown", "ard", "clarify"]) {
    assert.match(
      readFileSync(join(root, "workflows", "product", `prod.spec.${w}.md`), "utf8"),
      /antes de começar, leia [^\n]*`\$IDE\/rules-on-demand\/product\/prod\.spec-rules\.md`/,
      w
    );
  }
  // Os 3 comandos de frontend e o agente mandam ler a eng.frontend-rules.md.
  for (const arquivo of [
    "workflows/engineering/frontend/eng.frontend-component.md",
    "workflows/engineering/frontend/eng.frontend-perf-audit.md",
    "workflows/engineering/frontend/eng.frontend-review.md",
    "agents/engineering/eng.frontend.agent.md",
  ]) {
    assert.match(
      readFileSync(join(root, arquivo), "utf8"),
      /\$IDE\/rules-on-demand\/engineering\/frontend\/eng\.frontend-rules\.md/,
      arquivo
    );
  }
});

test("rules reais: prod.spec-common-rules.md fica em rules-on-demand/ e os 5 workflows mandam lê-la (#83)", () => {
  const caminho = "product/prod.spec-common-rules.md";
  assert.ok(
    listRules(join(root, "rules-on-demand")).some((r) => r.path === caminho),
    "rule comum dos prod.spec.* em rules-on-demand/"
  );
  // As 3 seções não voltam para rules/, que é carregada no início da sessão.
  const todas = { artifactStyle: "human-generated", rtkEnabled: true };
  for (const r of listRules(join(root, "rules"), todas)) {
    assert.doesNotMatch(
      readFileSync(join(root, "rules", r.path), "utf8"),
      /^### Busca de contexto/m,
      `${r.path} não deve ter a seção Busca de contexto`
    );
  }
  // Os 5 workflows (prd, frd, epic, issue, breakdown) mandam ler a rule antes de começar.
  for (const w of ["prd", "frd", "epic", "issue", "breakdown"]) {
    assert.match(
      readFileSync(join(root, "workflows", "product", `prod.spec.${w}.md`), "utf8"),
      /antes de começar, leia `\$IDE\/rules-on-demand\/product\/prod\.spec-common-rules\.md`/
    );
  }
});
