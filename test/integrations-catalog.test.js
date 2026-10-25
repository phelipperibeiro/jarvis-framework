// Testes do catálogo de vendors (bin/lib/integrations/vendors.json). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "../bin/lib/integrations/cli-runner.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARKERS = [
  "key",
  "repo",
  "repo_url",
  "body",
  "body_file",
  "title",
  "source",
  "target",
  "labels",
];

test("catálogo: exatamente jira, github e gitlab", () => {
  assert.deepEqual(Object.keys(loadCatalog().vendors).sort(), ["github", "gitlab", "jira"]);
});

test("catálogo: jira só no task manager; github e gitlab nos dois eixos", () => {
  const { vendors } = loadCatalog();
  assert.deepEqual(vendors.jira.axes, ["task_manager"]);
  assert.deepEqual(vendors.github.axes, ["task_manager", "version_control"]);
  assert.deepEqual(vendors.gitlab.axes, ["task_manager", "version_control"]);
});

test("catálogo: cada vendor tem a CLI completa e as ações do seu eixo", () => {
  for (const [name, v] of Object.entries(loadCatalog().vendors)) {
    for (const f of ["bin", "version", "auth_status", "install_url", "login_cmd", "login_url"]) {
      assert.ok(v.cli[f], `${name}: cli.${f}`);
    }
    assert.ok(["plain", "markdown"].includes(v.body_format), `${name}: body_format`);
    assert.ok(v.actions.comment && v.actions.view, `${name}: comment e view`);
    if (v.axes.includes("version_control")) {
      assert.ok(
        v.actions.create_merge && v.actions.create_issue,
        `${name}: create_merge e create_issue`
      );
    }
  }
});

test("catálogo: os comandos só usam marcadores conhecidos", () => {
  for (const [name, v] of Object.entries(loadCatalog().vendors)) {
    for (const [action, args] of Object.entries(v.actions)) {
      for (const piece of args) {
        const m = piece.match(/^\{(\w+)\}$/);
        if (m) assert.ok(MARKERS.includes(m[1]), `${name}.${action}: {${m[1]}}`);
        else
          assert.equal(
            piece.includes("{"),
            false,
            `${name}.${action}: marcador no meio de "${piece}"`
          );
      }
    }
  }
});

test("catálogo: nenhuma variável guarda token e todas têm o prefixo de um eixo", () => {
  for (const [key, v] of Object.entries(loadCatalog().variables)) {
    assert.equal(/TOKEN/.test(key), false, key);
    assert.match(key, /^(TASK_MANAGER|VERSION_CONTROL)(_|$)/);
    for (const f of ["axis", "what", "where", "example"]) assert.ok(f in v, `${key}.${f}`);
  }
});

// Variáveis dos eixos citadas fora do catálogo (RQT-1 do FRD-006): workflows, rules, skills e o
// template do ENV. Uma sobra (ex.: um *_TOKEN_ENV antigo) faz o teste falhar.
const SCAN = ["workflows", "rules", "rules-on-demand", "skills", "templates/ENV-template.md"];
// Exceções: nomes com o prefixo de um eixo que não são variáveis do catálogo.
const NOT_CATALOG = new Set([
  "TASK_MANAGER_KEY", // id da tarefa (card ou número de controle), não é variável do ENV
]);

function walk(path, out = []) {
  const st = statSync(path);
  if (st.isFile()) {
    if (/\.(md|json|js)$/.test(path)) out.push(path);
    return out;
  }
  for (const name of readdirSync(path)) walk(join(path, name), out);
  return out;
}

test("consistência: toda variável TASK_MANAGER_*/VERSION_CONTROL_* citada existe no catálogo", () => {
  const known = new Set(Object.keys(loadCatalog().variables));
  const missing = [];
  for (const base of SCAN) {
    for (const file of walk(join(root, base))) {
      const text = readFileSync(file, "utf-8");
      for (const m of text.matchAll(/\b(TASK_MANAGER|VERSION_CONTROL)_[A-Z0-9_]+\b/g)) {
        if (!known.has(m[0]) && !NOT_CATALOG.has(m[0]))
          missing.push(`${relative(root, file)}: ${m[0]}`);
      }
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});
