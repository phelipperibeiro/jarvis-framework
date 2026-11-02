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

function withWorkspace({ env, lock, ide = "claude" }, fn) {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-rules-sync-"));
  try {
    mkdirSync(join(ws, ".claude", "rules", "engineering", "frontend"), { recursive: true });
    writeFileSync(join(ws, ".claude", FRONT), "antes\n");
    if (env !== undefined) {
      mkdirSync(join(ws, `.${ide}`), { recursive: true });
      writeFileSync(join(ws, `.${ide}`, "ENV.md"), env);
    }
    if (lock !== undefined)
      writeFileSync(join(ws, "jarvis-lock.json"), JSON.stringify({ version: lock }));
    return fn(ws);
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
}

// Sem IDE nem JARVIS_ENV_FILE herdados: o ENV.md vem só do workspace do teste.
const ENV_LIMPO = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k !== "IDE" && k !== "JARVIS_ENV_FILE")
);
const run = (ws, args = ["--ide", "claude"]) =>
  spawnSync("node", [cli, "rules", "sync", ...args], {
    cwd: ws,
    encoding: "utf-8",
    env: { ...ENV_LIMPO, NO_COLOR: "1" },
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

test("rules sync: sem --ide, filtra a pasta da IDE onde está o ENV.md", () => {
  withWorkspace({ env: PERFIL, lock: VERSION }, (ws) => {
    const r = run(ws, []);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", FRONT)));
  });
});

test("rules sync: sem --ide e sem ENV.md numa pasta de IDE, sai com 1 e a mensagem, sem gravar nada", () => {
  // Sem ENV.md nenhum e com o ENV.md na raiz (layout legado): os dois caem no fallback da raiz.
  for (const legado of [false, true]) {
    withWorkspace({ lock: VERSION }, (ws) => {
      if (legado) writeFileSync(join(ws, "ENV.md"), PERFIL);
      const r = run(ws, []);
      assert.equal(r.status, 1, `legado ${legado}`);
      assert.match(r.stderr + r.stdout, /ENV\.md não encontrado na pasta de uma IDE/);
      assert.doesNotMatch(r.stderr, /node:fs|\n\s+at /);
      assert.ok(!existsSync(join(ws, "rules")));
      assert.ok(!existsSync(join(ws, "overlays")));
      assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
    });
  }
});

test("rules sync: --ide de outra IDE filtra só a pasta dela", () => {
  withWorkspace({ env: PERFIL, lock: VERSION, ide: "cursor" }, (ws) => {
    mkdirSync(join(ws, ".cursor", "rules", "engineering", "frontend"), { recursive: true });
    writeFileSync(join(ws, ".cursor", FRONT), "antes\n");
    const r = run(ws, ["--ide", "cursor"]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".cursor", FRONT)));
    assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
  });
});

test("rules sync: falha ao gravar uma rule sai com 1 e lista o erro", () => {
  withWorkspace({ env: PERFIL, lock: VERSION }, (ws) => {
    // Uma pasta no lugar do arquivo de destino faz a cópia falhar.
    mkdirSync(join(ws, ".claude", "rules", "engineering", "eng-rules.md"), { recursive: true });
    const r = run(ws);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /✗ rules\/engineering\/eng-rules\.md: /);
  });
});

test("rules sync: --env-file ou JARVIS_ENV_FILE fora de uma pasta de IDE sai com 1, sem gravar nada", () => {
  withWorkspace({ lock: VERSION }, (ws) => {
    mkdirSync(join(ws, "config"));
    writeFileSync(join(ws, "config", "ENV.md"), PERFIL);
    const casos = [
      run(ws, ["--env-file", join("config", "ENV.md")]),
      spawnSync("node", [cli, "rules", "sync"], {
        cwd: ws,
        encoding: "utf-8",
        env: { ...ENV_LIMPO, NO_COLOR: "1", JARVIS_ENV_FILE: join(ws, "config", "ENV.md") },
      }),
    ];
    for (const [i, r] of casos.entries()) {
      assert.equal(r.status, 1, `caso ${i}`);
      assert.match(r.stderr + r.stdout, /ENV\.md não encontrado na pasta de uma IDE/);
      assert.ok(!existsSync(join(ws, "config", "rules")), `caso ${i}`);
      assert.ok(!existsSync(join(ws, "config", "overlays")), `caso ${i}`);
      assert.equal(readFileSync(join(ws, ".claude", FRONT), "utf-8"), "antes\n");
    }
  });
});

test("rules sync: --env-file dentro da pasta da IDE continua valendo", () => {
  withWorkspace({ env: PERFIL, lock: VERSION }, (ws) => {
    const r = run(ws, ["--env-file", join(".claude", "ENV.md")]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", FRONT)));
  });
});
