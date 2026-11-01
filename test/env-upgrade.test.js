// Testes do upgrade do ENV.md (env-upgrade.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseEnvEntries,
  planEnvUpgrade,
  applyEnvUpgrade,
  removeEnvKeys,
  REMOVED_KEYS,
} from "../bin/lib/core/env-upgrade.js";

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
  const env =
    "HUB=BACKEND\nTASK_MANAGER=github\nMESSAGE_COMUNICATOR=[slack, discord]\nOBJECT_STORAGE=\n";
  const tpl =
    "TASK_MANAGER=[jira, linear]\nMESSAGE_COMUNICATOR=[x]\nOBJECT_STORAGE=[aws_s3]\nNOVA=valor\n";
  const plan = planEnvUpgrade(env, tpl);
  assert.deepEqual(plan.added, [{ key: "NOVA", value: "valor" }]);
});

test("planEnvUpgrade: lista de opções do template entra vazia", () => {
  const plan = planEnvUpgrade("HUB=BACKEND\n", "OBJECT_STORAGE=[aws_s3, gcs]\n");
  assert.deepEqual(plan.added, [{ key: "OBJECT_STORAGE", value: "" }]);
});

test("planEnvUpgrade: DATA_SPECIALIZATIONS entra com qualquer HUB (sem regra do bloco DATA, #209)", () => {
  const tpl = "DATA_SPECIALIZATIONS=\n";
  for (const hub of ["DATA", "BACKEND", "FULLCYCLE"]) {
    assert.deepEqual(keys(planEnvUpgrade(`HUB=${hub}\n`, tpl)), ["DATA_SPECIALIZATIONS"]);
  }
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

// #209: blocos que saíram do template. O upgrade apaga as chaves sem ler o valor.
const BAR = "# =============================================================================";
const frame = (title) => [BAR, `# ${title}`, BAR];

test("planEnvUpgrade: removed traz só os nomes das chaves removidas presentes, sem valores", () => {
  const env = "HUB=BACKEND\nSMTP=google\nPASSWORD_DATABASE=segredo\nMESSAGE_COMUNICATOR=slack\n";
  const plan = planEnvUpgrade(env, "HUB=[A]\n");
  assert.deepEqual(plan.removed, ["SMTP", "PASSWORD_DATABASE"]);
  assert.ok(!JSON.stringify(plan).includes("segredo"));
  assert.equal(REMOVED_KEYS.length, 23);
  // Nunca volta pelo template (um template antigo ainda com o bloco não a acrescenta).
  assert.deepEqual(planEnvUpgrade("HUB=BACKEND\n", "SMTP=[google]\nNOVA=1\n").added, [
    { key: "NOVA", value: "1" },
  ]);
  assert.ok(!REMOVED_KEYS.includes("DATA_SPECIALIZATIONS"));
});

test("removeEnvKeys: apaga a chave e a moldura vazia; o resto fica igual", () => {
  const text = [
    "HUB=BACKEND",
    "",
    "",
    ...frame("Mensageria (opcional)"),
    "MESSAGE_BROKER=rabbitmq",
    "MESSAGE_BROKER_URL_API=",
    "",
    "",
    ...frame("Chat / comunicador (opcional)"),
    "MESSAGE_COMUNICATOR=slack",
    "",
  ].join("\n");
  const out = removeEnvKeys(text, ["MESSAGE_BROKER", "MESSAGE_BROKER_URL_API"]);
  assert.deepEqual(out.removed, ["MESSAGE_BROKER", "MESSAGE_BROKER_URL_API"]);
  assert.equal(
    out.text,
    [
      "HUB=BACKEND",
      "",
      "",
      ...frame("Chat / comunicador (opcional)"),
      "MESSAGE_COMUNICATOR=slack",
      "",
    ].join("\n")
  );
});

test("removeEnvKeys: moldura com comentários do template sai; no fim do arquivo também", () => {
  const text = [
    "HUB=DATA",
    "",
    "",
    ...frame("Data Engineering (só se HUB=DATA)"),
    "# Obrigatório quando HUB=DATA. Omitir o bloco inteiro se o HUB for outro.",
    "DATA_LAKE=aws_s3",
    "# Vazio se não houver warehouse dedicado.",
    "DATA_WAREHOUSE=",
    "",
  ].join("\n");
  assert.equal(removeEnvKeys(text, ["DATA_LAKE", "DATA_WAREHOUSE"]).text, "HUB=DATA\n");
});

test("removeEnvKeys: moldura com chave ou comentário próprio fica; só a chave sai", () => {
  const comChave = [...frame("SMTP (opcional)"), "SMTP=ses", "MINHA_VAR=1", ""].join("\n");
  assert.equal(
    removeEnvKeys(comChave, ["SMTP"]).text,
    [...frame("SMTP (opcional)"), "MINHA_VAR=1", ""].join("\n")
  );
  const comNota = [...frame("SMTP (opcional)"), "# nota minha", "SMTP=ses", ""].join("\n");
  assert.equal(
    removeEnvKeys(comNota, ["SMTP"]).text,
    [...frame("SMTP (opcional)"), "# nota minha", ""].join("\n")
  );
});

test("removeEnvKeys: casa só o nome inteiro da chave (SMTP_HOST e linha comentada ficam)", () => {
  const text = "SMTP=ses\nSMTP_HOST=x\n# SMTP=antigo\n";
  const out = removeEnvKeys(text, ["SMTP"]);
  assert.equal(out.text, "SMTP_HOST=x\n# SMTP=antigo\n");
  assert.deepEqual(out.removed, ["SMTP"]);
  assert.deepEqual(removeEnvKeys(out.text, ["SMTP"]), { text: out.text, removed: [] });
});

test("removeEnvKeys: só mexe na moldura do bloco de onde a chave saiu", () => {
  const text = [
    ...frame("Mensageria (opcional)"),
    "MESSAGE_BROKER=x",
    "",
    "",
    ...frame("SMTP (opcional)"),
    "",
    "",
    ...frame("Chat / comunicador (opcional)"),
    "MESSAGE_COMUNICATOR=slack",
    "",
  ].join("\n");
  assert.equal(
    removeEnvKeys(text, ["MESSAGE_BROKER"]).text,
    [
      ...frame("SMTP (opcional)"),
      "",
      "",
      ...frame("Chat / comunicador (opcional)"),
      "MESSAGE_COMUNICATOR=slack",
      "",
    ].join("\n")
  );
});

test("removeEnvKeys: subconjunto das chaves do bloco mantém a moldura; duplicada sai inteira", () => {
  const text = [
    ...frame("Banco de dados (opcional)"),
    "DATABASE=pg",
    "DATABASE=my",
    "HOST_DATABASE=h",
    "",
  ].join("\n");
  const out = removeEnvKeys(text, ["DATABASE"]);
  assert.deepEqual(out.removed, ["DATABASE"]);
  assert.equal(out.text, [...frame("Banco de dados (opcional)"), "HOST_DATABASE=h", ""].join("\n"));
});

test("applyEnvUpgrade: remove e acrescenta no mesmo passe", () => {
  const original = `HUB=BACKEND\n\n\n${frame("SMTP (opcional)").join("\n")}\nSMTP=ses\n`;
  withTempEnv(original, (p) => {
    const plan = planEnvUpgrade(original, "HUB=[A]\nNOVA=1\n");
    assert.equal(applyEnvUpgrade(p, plan, "2026-11-01"), true);
    assert.equal(readFileSync(p, "utf-8"), "HUB=BACKEND\n\n# --- Upgrade 2026-11-01 ---\nNOVA=1\n");
  });
});

test("removeEnvKeys: ENV com CRLF", () => {
  const text = ["HUB=X", "", ...frame("SMTP (opcional)"), "SMTP=ses", ""].join("\r\n");
  const out = removeEnvKeys(text, ["SMTP"]);
  assert.equal(out.text, "HUB=X\r\n");
});

test("applyEnvUpgrade: só remoção grava, informa removedApplied e é idempotente", () => {
  const original = `HUB=BACKEND\n\n\n${frame("SMTP (opcional)").join("\n")}\nSMTP=segredo\n`;
  withTempEnv(original, (p) => {
    const plan = planEnvUpgrade(original, "HUB=[A]\n");
    assert.equal(applyEnvUpgrade(p, plan, "2026-11-01"), true);
    assert.deepEqual(plan.removedApplied, ["SMTP"]);
    const after = readFileSync(p, "utf-8");
    assert.equal(after, "HUB=BACKEND\n");
    const again = planEnvUpgrade(after, "HUB=[A]\n");
    assert.deepEqual(again.removed, []);
    assert.equal(applyEnvUpgrade(p, again, "2026-11-02"), false);
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

test("planEnvUpgrade: JARVIS_PROJECT vazio é preenchido; preenchido ou ausente segue a regra normal", () => {
  const tpl = "JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework\n";
  assert.deepEqual(planEnvUpgrade("JARVIS_PROJECT=\n", tpl).filled, [
    { key: "JARVIS_PROJECT", value: "https://github.com/phelipperibeiro/jarvis-framework" },
  ]);
  assert.deepEqual(
    planEnvUpgrade("JARVIS_PROJECT=https://github.com/fork/jarvis\n", tpl).filled,
    []
  );
  const absent = planEnvUpgrade("HUB=X\n", tpl);
  assert.deepEqual(absent.filled, []);
  assert.deepEqual(keys(absent), ["JARVIS_PROJECT"]);
});

test("applyEnvUpgrade: preenche só a linha vazia do JARVIS_PROJECT, sem mexer nas vizinhas", () => {
  const original = "A=1\nJARVIS_PROJECT=\n\nB=\n";
  const tpl = "JARVIS_PROJECT=https://x/y\nB=2\n";
  withTempEnv(original, (p) => {
    const plan = planEnvUpgrade(original, tpl);
    assert.equal(applyEnvUpgrade(p, plan, "2026-10-25"), true);
    assert.equal(readFileSync(p, "utf-8"), "A=1\nJARVIS_PROJECT=https://x/y\n\nB=\n");
    assert.equal(
      applyEnvUpgrade(p, planEnvUpgrade(readFileSync(p, "utf-8"), tpl), "2026-10-26"),
      false
    );
  });
});

test("planEnvUpgrade: TOKEN_TASK_MANAGER com valor e vendor não suportado viram aviso, sem o valor do token", () => {
  const plan = planEnvUpgrade(
    "TOKEN_TASK_MANAGER=segredo\nTASK_MANAGER=asana\nVERSION_CONTROL=github\n",
    ""
  );
  assert.deepEqual(plan.warnings, ["TOKEN_TASK_MANAGER", "UNSUPPORTED:TASK_MANAGER:asana"]);
  assert.equal(JSON.stringify(plan).includes("segredo"), false);
  assert.deepEqual(planEnvUpgrade("TOKEN_TASK_MANAGER=\n", "").warnings, []);
});

test("planEnvUpgrade: *_ACCESS do template real entram vazios (lista de opções)", () => {
  const tpl = readFileSync(join(root, "templates", "ENV-template.md"), "utf-8");
  const plan = planEnvUpgrade("HUB=BACKEND\n", tpl);
  const access = plan.added.filter((a) => a.key.endsWith("_ACCESS"));
  assert.deepEqual(access, [
    { key: "TASK_MANAGER_ACCESS", value: "" },
    { key: "VERSION_CONTROL_ACCESS", value: "" },
  ]);
  assert.equal(keys(plan).includes("TOKEN_TASK_MANAGER"), false);
});

test("applyEnvUpgrade: ENV com CRLF também é preenchido; $ do valor não vira referência", () => {
  const original = "A=1\r\nJARVIS_PROJECT=\r\nB=2\r\n";
  const tpl = "JARVIS_PROJECT=https://x/$1/y\n";
  withTempEnv(original, (p) => {
    const plan = planEnvUpgrade(original, tpl);
    assert.equal(applyEnvUpgrade(p, plan, "2026-10-25"), true);
    assert.equal(readFileSync(p, "utf-8"), "A=1\r\nJARVIS_PROJECT=https://x/$1/y\r\nB=2\r\n");
    assert.deepEqual(plan.filledApplied, ["JARVIS_PROJECT"]);
  });
});

// #189: cada assunto do template fica numa moldura de três linhas (barra, título, barra), o
// formato que o /jarvis-init usa ao regravar o ENV.md. O separador fino antigo não volta.
test("ENV-template: cada assunto numa moldura de # ==== e nenhum separador # ---", () => {
  const lines = readFileSync(join(root, "templates", "ENV-template.md"), "utf-8").split("\n");
  const BAR = /^# ={77}$/;
  assert.equal(lines.filter((l) => /^# ---/.test(l)).length, 0, "separador # --- no template");
  const titles = [];
  for (let i = 7; i < lines.length; i++) {
    if (!BAR.test(lines[i])) continue;
    assert.ok(
      lines[i + 1] && /^# \S/.test(lines[i + 1]) && !BAR.test(lines[i + 1]),
      `linha ${i + 1}: barra sem título logo abaixo`
    );
    assert.ok(BAR.test(lines[i + 2] || ""), `linha ${i + 3}: moldura sem a barra de baixo`);
    titles.push(lines[i + 1].slice(2));
    i += 2;
  }
  assert.ok(titles.includes("Workspace e identidade"), titles.join(" | "));
  assert.ok(titles.length >= 15, `só ${titles.length} assuntos: ${titles.join(" | ")}`);
});

test("planEnvUpgrade: COMPANY_PROFILE nova entra com o default stark-industries e não vira pendência (#199)", () => {
  const tpl = readFileSync(join(root, "templates", "ENV-template.md"), "utf-8");
  const plan = planEnvUpgrade("HUB=BACKEND\nAREA=ENGINEERING\n", tpl);
  const added = plan.added.find((a) => a.key === "COMPANY_PROFILE");
  assert.deepEqual(added, { key: "COMPANY_PROFILE", value: "stark-industries" });
  assert.ok(!plan.pending.includes("COMPANY_PROFILE"));
});
