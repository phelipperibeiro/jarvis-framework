// Testes da mudança de pasta dos documentos (docs-migrate.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { parseEnvEntries } from "../bin/lib/core/env-upgrade.js";
import {
  expandEnv,
  planDocsMigration,
  applyDocsMigration,
  rewriteRelatedDiscovery,
  declineEnvValues,
} from "../bin/lib/core/docs-migrate.js";

const ENV = [
  "DOCS_FOLDER=docs",
  "JARVIS_DOCS=$DOCS_FOLDER/jarvis",
  "ENG_DOCS=$JARVIS_DOCS/engineering",
  "PROD_FOLDER_NAME=product",
  "PROD_DOCS=$JARVIS_DOCS/$PROD_FOLDER_NAME",
  "DISCOVERIES_FOLDER_NAME=discoveries",
  "DISCOVERIES_DOCS=$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME",
].join("\n");

const env = (text = ENV) => expandEnv(parseEnvEntries(text));
// ENV com uma chave trocada (parseEnvEntries fica com a primeira ocorrência).
const envWith = (key, value) =>
  env(
    ENV.split("\n")
      .map((l) => (l.startsWith(`${key}=`) ? `${key}=${value}` : l))
      .join("\n")
  );

function withWorkspace(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-docs-migrate-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const OLD = "docs/jarvis/product/discoveries/discovery-001-x.md";
const NEW = "docs/jarvis/discoveries/discovery-001-x.md";

test("expandEnv: resolve a cadeia DOCS_FOLDER → JARVIS_DOCS → DISCOVERIES_DOCS; desconhecida fica literal", () => {
  const e = expandEnv(parseEnvEntries(`${ENV}\nRULES=.$IDE/rules\n`));
  assert.equal(e.get("DISCOVERIES_DOCS"), "docs/jarvis/discoveries");
  assert.equal(e.get("PROD_DOCS"), "docs/jarvis/product");
  assert.equal(e.get("RULES"), ".$IDE/rules");
});

test("expandEnv: resolve fora de ordem (JARVIS_DOCS no fim do ENV) e não trava em ciclo", () => {
  const e = expandEnv(
    parseEnvEntries(
      "DOCS_FOLDER=docs\nPROD_DOCS=$JARVIS_DOCS/product\nA=$B\nB=$A\nJARVIS_DOCS=$DOCS_FOLDER/jarvis\n"
    )
  );
  assert.equal(e.get("PROD_DOCS"), "docs/jarvis/product");
  assert.ok(e.get("A").includes("$"));
});

test("planDocsMigration: discovery do caminho antigo vai para docs/jarvis/discoveries", () => {
  withWorkspace({ [OLD]: "# d" }, (ws) => {
    const plan = planDocsMigration(ws, env());
    assert.deepEqual(plan.moves, [{ from: OLD, to: NEW, discovery: true }]);
    assert.deepEqual(plan.sources, ["docs/jarvis/product/discoveries"]);
  });
});

test("planDocsMigration: layout antigo docs/product/discoveries vai direto para a pasta dos discoveries", () => {
  withWorkspace(
    { "docs/product/discoveries/discovery-002-y.md": "", "docs/product/prd-001/prd.md": "" },
    (ws) => {
      const plan = planDocsMigration(ws, env());
      assert.deepEqual(plan.moves.map((m) => m.to).sort(), [
        "docs/jarvis/discoveries/discovery-002-y.md",
        "docs/jarvis/product/prd-001/prd.md",
      ]);
    }
  );
});

test("planDocsMigration: conflito no destino pula e não toca no arquivo", () => {
  withWorkspace({ [OLD]: "antigo", [NEW]: "novo" }, (ws) => {
    const plan = planDocsMigration(ws, env());
    assert.deepEqual(plan.moves, []);
    assert.deepEqual(plan.skipped, [{ from: OLD, to: NEW, reason: "conflito" }]);
    applyDocsMigration(ws, plan, env());
    assert.equal(readFileSync(join(ws, OLD), "utf-8"), "antigo");
    assert.equal(readFileSync(join(ws, NEW), "utf-8"), "novo");
  });
});

test("planDocsMigration: caminho fora do workspace é recusado", () => {
  withWorkspace({}, (ws) => {
    const plan = planDocsMigration(ws, envWith("DISCOVERIES_DOCS", "../fora"));
    assert.ok(plan.skipped.some((s) => s.reason === "fora do workspace"));
    assert.deepEqual(plan.moves, []);
  });
});

test("planDocsMigration: DISCOVERIES_DOCS no caminho antigo (recusa anterior) não propõe nada", () => {
  withWorkspace({ [OLD]: "" }, (ws) => {
    const plan = planDocsMigration(ws, envWith("DISCOVERIES_DOCS", "$PROD_DOCS/discoveries"));
    assert.deepEqual(plan.moves, []);
  });
});

test("applyDocsMigration: move, remove a pasta antiga vazia, mantém a não vazia e garante o .gitignore", () => {
  withWorkspace({ [OLD]: "# d", "docs/jarvis/product/prd-001/prd.md": "" }, (ws) => {
    const e = env();
    const result = applyDocsMigration(ws, planDocsMigration(ws, e), e);
    assert.equal(result.errors.length, 0);
    assert.ok(existsSync(join(ws, NEW)));
    assert.ok(!existsSync(join(ws, "docs/jarvis/product/discoveries")));
    assert.ok(existsSync(join(ws, "docs/jarvis/product/prd-001/prd.md")));
    assert.match(readFileSync(join(ws, ".gitignore"), "utf-8"), /^docs\/jarvis\/$/m);
    assert.deepEqual(planDocsMigration(ws, e).moves, []);
  });
});

test("applyDocsMigration: arquivo versionado sai por git mv (rename no git)", () => {
  withWorkspace({ [OLD]: "# d" }, (ws) => {
    const git = (...args) => execFileSync("git", args, { cwd: ws, encoding: "utf-8" });
    git("init", "-q");
    git("-c", "user.email=t@t", "-c", "user.name=t", "add", OLD);
    git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "x");
    applyDocsMigration(ws, planDocsMigration(ws, env()), env());
    assert.match(git("status", "--porcelain"), new RegExp(`^R  ${OLD} -> ${NEW}$`, "m"));
  });
});

test("rewriteRelatedDiscovery: pelo nome do arquivo, inclusive valor já quebrado", () => {
  const prd = "docs/jarvis/product/prd-001/prd-001.md";
  withWorkspace(
    {
      [OLD]: "",
      [prd]: "---\nid: 1\nrelated_discovery: docs/product/discoveries/discovery-001-x.md\n---\n",
      "docs/jarvis/product/prd-002/prd-002.md":
        "---\nrelated_discovery: docs/outro/discovery-009-z.md\n---\n",
    },
    (ws) => {
      const e = env();
      const { moved } = applyDocsMigration(ws, planDocsMigration(ws, e), e);
      assert.deepEqual(rewriteRelatedDiscovery(ws, e, moved), [prd]);
      assert.match(
        readFileSync(join(ws, prd), "utf-8"),
        new RegExp(`^related_discovery: ${NEW}$`, "m")
      );
      assert.match(
        readFileSync(join(ws, "docs/jarvis/product/prd-002/prd-002.md"), "utf-8"),
        /discovery-009-z\.md/
      );
    }
  );
});

test("declineEnvValues: só chave nova recebe o caminho antigo", () => {
  withWorkspace({ [OLD]: "" }, (ws) => {
    const plan = planDocsMigration(ws, env());
    assert.deepEqual(
      declineEnvValues(plan, ["DISCOVERIES_FOLDER_NAME", "DISCOVERIES_DOCS"], env()),
      {
        DISCOVERIES_DOCS: "$PROD_DOCS/discoveries",
      }
    );
    assert.deepEqual(declineEnvValues(plan, [], env()), {});
  });
});

test("applyDocsMigration: modo workspace move os documentos sem criar .gitignore na raiz", () => {
  withWorkspace({ [OLD]: "# d", "app/.git/HEAD": "" }, (ws) => {
    const e = env();
    const result = applyDocsMigration(ws, planDocsMigration(ws, e), e);
    assert.equal(result.errors.length, 0);
    assert.ok(existsSync(join(ws, NEW)));
    assert.ok(!existsSync(join(ws, ".gitignore")));
  });
});
