// Testes do upgrade do ENV.md (env-upgrade.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnvEntries, planEnvUpgrade, applyEnvUpgrade } from "../bin/lib/core/env-upgrade.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function withTempEnv(text, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-"));
  try {
    const p = join(dir, "ENV.md");
    writeFileSync(p, text);
    return fn(p);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const keys = (plan) => plan.added.map((a) => a.key);

test("parseEnvEntries: chave vazia conta; comentário não", () => {
  const e = parseEnvEntries("A=1\nB=\n# C=3\n  D = x\n");
  assert.deepEqual([...e.keys()], ["A", "B"]);
  assert.equal(e.get("B"), "");
});

test("planEnvUpgrade: só chaves que faltam; existentes ficam fora (preenchida, vazia ou lista)", () => {
  const env = "HUB=BACKEND\nTASK_MANAGER=github\nMESSAGE_BROKER=[rabbitmq, kafka]\nSMTP=\n";
  const tpl = "TASK_MANAGER=[jira, linear]\nMESSAGE_BROKER=[x]\nSMTP=[google]\nNOVA=valor\n";
  const plan = planEnvUpgrade(env, tpl);
  assert.deepEqual(plan.added, [{ key: "NOVA", value: "valor" }]);
});

test("planEnvUpgrade: lista de opções do template entra vazia", () => {
  const plan = planEnvUpgrade("HUB=BACKEND\n", "DATABASE=[mysql, postgres]\n");
  assert.deepEqual(plan.added, [{ key: "DATABASE", value: "" }]);
});

test("planEnvUpgrade: DATA_* só com HUB=DATA; DATA_SPECIALIZATIONS sempre", () => {
  const tpl = "DATA_SPECIALIZATIONS=\nDATA_LAKE=[aws_s3]\n";
  assert.deepEqual(keys(planEnvUpgrade("HUB=BACKEND\n", tpl)), ["DATA_SPECIALIZATIONS"]);
  assert.deepEqual(keys(planEnvUpgrade("HUB=DATA\n", tpl)), ["DATA_SPECIALIZATIONS", "DATA_LAKE"]);
});

test("planEnvUpgrade: PROD_MODE nova vem da AREA", () => {
  const tpl = "PROD_MODE=\n";
  const byArea = (area) => planEnvUpgrade(`AREA=${area}\n`, tpl);
  assert.deepEqual(byArea("ENGINEERING").added, [{ key: "PROD_MODE", value: "developer-guided" }]);
  assert.deepEqual(byArea("PRODUCT").added, [{ key: "PROD_MODE", value: "product-led" }]);
  const other = byArea("OUTRA");
  assert.deepEqual(other.added, [{ key: "PROD_MODE", value: "" }]);
  assert.deepEqual(other.pending, ["PROD_MODE"]);
});

test("planEnvUpgrade: PROD_MODE= existente não muda e vira pendência", () => {
  const plan = planEnvUpgrade("AREA=ENGINEERING\nPROD_MODE=\n", "PROD_MODE=\n");
  assert.deepEqual(plan.added, []);
  assert.deepEqual(plan.pending, ["PROD_MODE"]);
});

test("planEnvUpgrade: CENTRAL_DOCS_REPO sem CENTRAL_DOCS_STORAGE só gera aviso (nome, sem valor)", () => {
  const plan = planEnvUpgrade(
    "CENTRAL_DOCS_REPO=git@x:segredo.git\n",
    "CENTRAL_DOCS_STORAGE=filesystem\n"
  );
  assert.deepEqual(plan.warnings, ["CENTRAL_DOCS_REPO"]);
  assert.ok(!JSON.stringify(plan).includes("segredo"));
});

test("applyEnvUpgrade: linhas antigas intactas, bloco datado no fim, idempotente", () => {
  const original = "# cabeçalho\nHUB=BACKEND\nTOKEN_X=abc\nVAZIA=\n";
  const tpl = "HUB=[A]\nNOVA=1\nDISCOVERIES_DOCS=$JARVIS_DOCS/discoveries\n";
  withTempEnv(original, (p) => {
    const plan = planEnvUpgrade(original, tpl);
    assert.equal(
      applyEnvUpgrade(p, plan, "2026-10-16", { DISCOVERIES_DOCS: "$PROD_DOCS/discoveries" }),
      true
    );
    const after = readFileSync(p, "utf-8");
    assert.ok(after.startsWith(original));
    assert.equal(
      after.slice(original.length),
      "\n# --- Upgrade 2026-10-16 ---\nNOVA=1\nDISCOVERIES_DOCS=$PROD_DOCS/discoveries\n"
    );
    const again = planEnvUpgrade(after, tpl);
    assert.equal(applyEnvUpgrade(p, again, "2026-10-17"), false);
    assert.equal(readFileSync(p, "utf-8"), after);
  });
});

test("template real × ENV sem as variáveis da #157: plano traz só as duas chaves de discoveries", () => {
  const tpl = readFileSync(join(root, "templates", "ENV-template.md"), "utf-8");
  const env = [...parseEnvEntries(tpl)]
    .filter(([k]) => !k.startsWith("DISCOVERIES_"))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const plan = planEnvUpgrade(`${env}\n`, tpl);
  assert.deepEqual(keys(plan), ["DISCOVERIES_FOLDER_NAME", "DISCOVERIES_DOCS"]);
  assert.deepEqual(plan.added[1], {
    key: "DISCOVERIES_DOCS",
    value: "$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME",
  });
});

test("planEnvUpgrade: WORKSPACE_MODE novo entra com o modo detectado (workspace com 1 subpasta)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-ws-"));
  try {
    mkdirSync(join(dir, "app", ".git"), { recursive: true });
    const plan = planEnvUpgrade("HUB=BACKEND\n", "WORKSPACE_MODE=\n", { workspaceDir: dir });
    assert.deepEqual(plan.added, [{ key: "WORKSPACE_MODE", value: "workspace" }]);
    assert.deepEqual(plan.warnings, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planEnvUpgrade: WORKSPACE_MODE em raiz com .git entra como project", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-ws-"));
  try {
    mkdirSync(join(dir, ".git"), { recursive: true });
    const plan = planEnvUpgrade("HUB=BACKEND\n", "WORKSPACE_MODE=\n", { workspaceDir: dir });
    assert.deepEqual(plan.added, [{ key: "WORKSPACE_MODE", value: "project" }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planEnvUpgrade: WORKSPACE_MODE com submódulo gera aviso só com o nome da chave", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-ws-"));
  try {
    mkdirSync(join(dir, ".git"), { recursive: true });
    mkdirSync(join(dir, "lib", ".git"), { recursive: true });
    const plan = planEnvUpgrade("HUB=BACKEND\n", "WORKSPACE_MODE=\n", { workspaceDir: dir });
    assert.deepEqual(plan.warnings, ["WORKSPACE_MODE"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planEnvUpgrade: WORKSPACE_MODE já existente nunca muda (preenchido ou vazio)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-ws-"));
  try {
    mkdirSync(join(dir, "app", ".git"), { recursive: true });
    for (const env of ["WORKSPACE_MODE=project\n", "WORKSPACE_MODE=\n"]) {
      const plan = planEnvUpgrade(env, "WORKSPACE_MODE=\n", { workspaceDir: dir });
      assert.deepEqual(plan.added, []);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("planEnvUpgrade: sem workspaceDir, WORKSPACE_MODE entra com o valor do template", () => {
  const plan = planEnvUpgrade("HUB=BACKEND\n", "WORKSPACE_MODE=\n");
  assert.deepEqual(plan.added, [{ key: "WORKSPACE_MODE", value: "" }]);
});

test("planEnvUpgrade: WORKSPACE_REPOS restringe a detecção", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-upgrade-ws-"));
  try {
    mkdirSync(join(dir, "a", ".git"), { recursive: true });
    const plan = planEnvUpgrade("WORKSPACE_REPOS=outro\n", "WORKSPACE_MODE=\n", {
      workspaceDir: dir,
    });
    assert.deepEqual(plan.added, [{ key: "WORKSPACE_MODE", value: "project" }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
