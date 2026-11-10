// Caminho de erro dos comandos que leem caminhos do ENV.md (#228, pre-pr rodada 1): `$` sem valor vira
// mensagem clara e status 1, sem stack trace e sem mexer em nada. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { EnvPathError, assertPathsResolved, checkEnvPaths, expandEnv } from "../bin/lib/core/env-paths.js";
import { docsFolders } from "../bin/lib/core/docs-migrate.js";
import { sessionFolderOf } from "../bin/lib/docs/finish-delivery.js";
import { runDailyReport } from "../bin/commands/daily-report.js";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "jarvis.js");

/** Workspace temporário com `.claude/ENV.md`; `extra` cria arquivos (caminho → texto). */
function withWorkspace(envLines, extra, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-callers-"));
  try {
    mkdirSync(join(dir, ".claude"), { recursive: true });
    writeFileSync(join(dir, ".claude/ENV.md"), `${envLines.join("\n")}\n`);
    for (const [rel, content] of Object.entries(extra)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const run = (cwd, args) =>
  spawnSync(process.execPath, [cli, ...args, "--env-file", join(cwd, ".claude/ENV.md")], {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
  });

const CENTRAL = ["SQUAD=CORE", "WORKSPACE=loja", "CENTRAL_DOCS_STORAGE=filesystem", "CENTRAL_DOCS_LOCATION=central"];
const SEM_TRACE = (r) => assert.doesNotMatch(r.stdout + r.stderr, /EnvPathError\s*[:{]|\n\s+at \w/, "stack trace no lugar da mensagem");

// --- docsFolders / assertPathsResolved -----------------------------------------

test("docsFolders: aplica os padrões do template quando JARVIS_DOCS falta (PROD_DOCS=$JARVIS_DOCS/product)", () => {
  const f = docsFolders(expandEnv(new Map([["DOCS_FOLDER", "docs"], ["PROD_DOCS", "$JARVIS_DOCS/product"]])));
  assert.equal(f.jarvis, "docs/jarvis");
  assert.equal(f.prod, "docs/jarvis/product");
  assert.equal(f.eng, "docs/jarvis/engineering");
});

test("docsFolders: variável sem valor que não é do template continua sendo erro", () => {
  assert.throws(
    () => docsFolders(expandEnv(new Map([["PROD_DOCS", "$FOO/product"]]))),
    (err) => err instanceof EnvPathError && err.key === "PROD_DOCS"
  );
});

test("assertPathsResolved: aceita lista de chaves própria e ignora chave ausente", () => {
  const e = new Map([["SESSIONS_DIR", "$X/s"], ["JARVIS_DOCS", "ok"]]);
  assert.doesNotThrow(() => assertPathsResolved(e, ["JARVIS_DOCS", "ENG_DOCS"]));
  assert.throws(() => assertPathsResolved(e, ["SESSIONS_DIR"]), EnvPathError);
});

test("checkEnvPaths: confere todas as chaves de caminho do ENV cru", () => {
  assert.doesNotThrow(() => checkEnvPaths({ DOCS_FOLDER: "d", JARVIS_DOCS: "$DOCS_FOLDER/j" }));
  assert.throws(() => checkEnvPaths({ PROD_DOCS: "$FOO/p" }), EnvPathError);
  assert.doesNotThrow(() => checkEnvPaths({ RULES_FOLDER: ".$IDE/rules" }), "$IDE em chave que não é de caminho");
});

// --- chamadores em processo -----------------------------------------------------

test("runDailyReport: SESSIONS_DIR com variável sem valor devolve code 1 e a mensagem com a chave", () => {
  withWorkspace(["IDE=claude", "SESSIONS_DIR=$NAO_EXISTE/x"], {}, (root) => {
    const r = runDailyReport({ days: "7", "env-file": join(root, ".claude/ENV.md") }, root, new Date());
    assert.equal(r.code, 1);
    assert.match(r.lines.join("\n"), /SESSIONS_DIR.*\$NAO_EXISTE\/x/s);
  });
});

test("sessionFolderOf: SESSIONS_DIR com variável sem valor lança EnvPathError", () => {
  assert.throws(() => sessionFolderOf({ SESSIONS_DIR: "$NAO_EXISTE/x" }, "/w", "TASK-1"), EnvPathError);
  assert.equal(sessionFolderOf({ SESSIONS_DIR: "$DOCS_FOLDER/s", DOCS_FOLDER: "d" }, "/w", "TASK-1"), "/w/d/s/eng/task-1");
});

// --- comandos pelo CLI real -------------------------------------------------------

test("docs sessions: SESSIONS_DIR inválido sai com status 1 e a mensagem, sem stack trace", () => {
  withWorkspace([...CENTRAL, "SESSIONS_DIR=$NAO_EXISTE/x"], { "central/CORE/.keep": "" }, (ws) => {
    const r = run(ws, ["docs", "sessions"]);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /SESSIONS_DIR.*\$NAO_EXISTE\/x/s);
    SEM_TRACE(r);
  });
});

test("docs publish --manifest: SESSIONS_DIR inválido para antes de publicar, com status 1 e mensagem clara", () => {
  const manifest = JSON.stringify([{ file: "../architecture.md", tipo: "architecture", feature: "checkout", taskKey: "1", fromSession: true }]);
  withWorkspace(
    [...CENTRAL, "SESSIONS_DIR=$NAO_EXISTE/x"],
    { "central/CORE/.keep": "", "sessao/architecture.md": "# A\n", "sessao/consolidation/manifest.json": manifest },
    (ws) => {
      const r = run(ws, ["docs", "publish", "--manifest", join(ws, "sessao/consolidation/manifest.json")]);
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stdout + r.stderr, /Caminho do ENV\.md inválido/);
      assert.match(r.stdout + r.stderr, /SESSIONS_DIR/);
      SEM_TRACE(r);
      assert.deepEqual(readdirSync(join(ws, "central/CORE")), [".keep"], "nada foi publicado (a publicação grava dentro de central/CORE)");
    }
  );
});

test("docs finalize: caminho de documentos inválido sai com status 1 e a mensagem, sem stack trace", () => {
  withWorkspace(
    [...CENTRAL, "PROD_DOCS=$FOO/product"],
    { "central/CORE/.keep": "", "m/manifest.json": "[]" },
    (ws) => {
      const r = run(ws, ["docs", "finalize", "--manifest", join(ws, "m/manifest.json")]);
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stdout + r.stderr, /PROD_DOCS.*\$FOO\/product/s);
      SEM_TRACE(r);
    }
  );
});

test("init --upgrade: caminho inválido interrompe antes de sincronizar, com status 1 e sem stack trace", () => {
  withWorkspace(["WORKSPACE=ws", "IDE=claude", "SQUAD=CORE", "PROD_DOCS=$FOO/product", "DOCS_FOLDER=docs"], {}, (ws) => {
    const r = spawnSync(process.execPath, [cli, "init", "--upgrade", "--yes", "--ide", "claude"], {
      cwd: ws,
      encoding: "utf-8",
      stdio: "pipe",
      env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /PROD_DOCS.*\$FOO\/product/s);
    assert.match(r.stdout + r.stderr, /Upgrade interrompido: nada foi alterado/);
    SEM_TRACE(r);
    assert.deepEqual(readdirSync(join(ws, ".claude")), ["ENV.md"], "nada foi sincronizado");
    assert.ok(!existsSync(join(ws, ".mcp.json")));
  });
});

test("docsFolders: barra final, ./ e barras duplicadas não geram // nos caminhos", () => {
  for (const v of ["./docs/", ".//docs", ".//docs//", "./docs//"]) {
    assert.equal(docsFolders(expandEnv(new Map([["DOCS_FOLDER", v]]))).docs, "docs", v);
  }
  const f = docsFolders(expandEnv(new Map([["DOCS_FOLDER", "./docs/"]])));
  assert.equal(f.docs, "docs");
  assert.equal(f.jarvis, "docs/jarvis");
  assert.equal(f.prod, "docs/jarvis/product");
  assert.ok(![f.docs, f.jarvis, f.prod, f.eng, f.discoveries].some((p) => p.includes("//")));
});

test("init --upgrade: o erro de caminho vem antes do prompt de rebaixamento (lock de versão maior)", () => {
  withWorkspace(["WORKSPACE=ws", "IDE=claude", "SQUAD=CORE", "PROD_DOCS=$FOO/product"], { "jarvis-lock.json": JSON.stringify({ version: "99.0.0" }) }, (ws) => {
    const r = spawnSync(process.execPath, [cli, "init", "--upgrade", "--ide", "claude"], {
      cwd: ws,
      encoding: "utf-8",
      stdio: "pipe",
      input: "",
      env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /PROD_DOCS.*\$FOO\/product/s);
    assert.doesNotMatch(r.stdout + r.stderr, /nada será rebaixado|Seguir e rebaixar/, "antes: perguntava do rebaixamento primeiro");
    assert.deepEqual(readdirSync(join(ws, ".claude")), ["ENV.md"]);
  });
});
