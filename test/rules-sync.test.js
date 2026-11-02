// Testes do comando `jarvis rules sync` (Passo 8 do /jarvis-init pelo CLI, #102). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "bin", "jarvis.js");
const VERSION = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")).version;
const PERFIL = "HUB=BACKEND\nPOSITION=SENIOR\nAREA=ENGINEERING\nSQUAD=CORE\n";
// Rule que não bate com BACKEND: se o comando gravasse algo, ela sairia da IDE.
const FRONT = "rules/engineering/frontend/eng.frontend-rules.md";

function withWorkspace({ env, lock }, fn) {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-rules-sync-"));
  try {
    mkdirSync(join(ws, ".claude", "rules", "engineering", "frontend"), { recursive: true });
    writeFileSync(join(ws, ".claude", FRONT), "antes\n");
    if (env !== undefined) writeFileSync(join(ws, ".claude", "ENV.md"), env);
    if (lock !== undefined)
      writeFileSync(join(ws, "jarvis-lock.json"), JSON.stringify({ version: lock }));
    return fn(ws);
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
}

const run = (ws) =>
  spawnSync("node", [cli, "rules", "sync", "--ide", "claude"], {
    cwd: ws,
    encoding: "utf-8",
    env: { ...process.env, NO_COLOR: "1" },
  });

test("rules sync: sem ENV.md sai com 1 e não altera a IDE", () => {
  withWorkspace({ lock: VERSION }, (ws) => {
    assert.equal(run(ws).status, 1);
    assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
  });
});

test("rules sync: eixo faltando sai com 1, diz quais e não altera a IDE", () => {
  withWorkspace({ env: "HUB=BACKEND\nAREA=ENGINEERING\n", lock: VERSION }, (ws) => {
    const r = run(ws);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /POSITION, SQUAD/);
    assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
  });
});

test("rules sync: lock de outra versão (ou ausente) sai com 1 e não altera a IDE", () => {
  for (const lock of ["0.0.1", "999.0.0", undefined]) {
    withWorkspace({ env: PERFIL, lock }, (ws) => {
      const r = run(ws);
      assert.equal(r.status, 1, `lock ${lock}`);
      assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
      if (lock)
        assert.match(r.stderr + r.stdout, new RegExp(`assets da ${lock} e Jarvis ${VERSION}`));
    });
  }
});

test("rules sync: com perfil e lock certos filtra a IDE e mostra o resumo do Passo 8", () => {
  withWorkspace({ env: PERFIL, lock: VERSION }, (ws) => {
    const r = run(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", FRONT)));
    assert.ok(existsSync(join(ws, ".claude", "rules", "engineering", "eng-rules.md")));
    assert.match(
      r.stdout,
      /HUB=BACKEND \| POSITION=SENIOR \| AREA=ENGINEERING \| SQUAD=CORE \| ARTIFACT_STYLE=ai-generated/
    );
    assert.match(r.stdout, /Copiadas : \d+ arquivos \(rules\/: \d+ \| rules-on-demand\/: \d+\)/);
    assert.match(r.stdout, /Removidas: 1 arquivos/);
    assert.match(r.stdout, /Overlay stark-industries: pasta criada/);
  });
});
