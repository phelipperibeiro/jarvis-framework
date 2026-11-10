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
// O passo de rules só lê ARTIFACT_STYLE e RTK_ENABLED; o resto do ENV.md não conta (#263).
const ENV_MD = "SQUAD=CORE\n";
// Exceção desligada (ARTIFACT_STYLE padrão): se o comando gravasse algo, ela sairia da IDE.
const CANARIO = "rules/artifact-style-rules.md";

function withWorkspace({ env, lock, ide = "claude" }, fn) {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-rules-sync-"));
  try {
    mkdirSync(join(ws, ".claude", "rules"), { recursive: true });
    writeFileSync(join(ws, ".claude", CANARIO), "antes\n");
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
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
});

test("rules sync: ENV.md sem nenhuma chave sincroniza a IDE, sem pedir perfil (#263)", () => {
  withWorkspace({ env: "# ENV.md sem chaves\n", lock: VERSION }, (ws) => {
    const r = run(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stderr + r.stdout, /Perfil incompleto/);
    assert.ok(!existsSync(join(ws, ".claude", CANARIO)));
    assert.ok(existsSync(join(ws, ".claude", "rules", "engineering", "eng-rules.md")));
  });
});

test("rules sync: lock de outra versão (ou ausente) sai com 1 e não altera a IDE", () => {
  for (const lock of ["0.0.1", "999.0.0", undefined]) {
    withWorkspace({ env: ENV_MD, lock }, (ws) => {
      const r = run(ws);
      assert.equal(r.status, 1, `lock ${lock}`);
      assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
      if (lock)
        assert.match(r.stderr + r.stdout, new RegExp(`assets da ${lock} e Jarvis ${VERSION}`));
    });
  }
});

test("rules sync: com o lock certo sincroniza a IDE e mostra o resumo do Passo 8", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    const r = run(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", CANARIO)));
    assert.ok(existsSync(join(ws, ".claude", "rules", "engineering", "eng-rules.md")));
    assert.match(r.stdout, /Sincronizando rules: ARTIFACT_STYLE=ai-generated \| RTK=desligado/);
    assert.match(r.stdout, /Copiadas : \d+ arquivos \(rules\/: \d+ \| rules-on-demand\/: \d+\)/);
    assert.match(r.stdout, /Removidas: 1 arquivos/);
    assert.match(r.stdout, /Overlay stark-industries: pasta criada/);
  });
});

test("rules sync: sem --ide, filtra a pasta da IDE onde está o ENV.md", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    const r = run(ws, []);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", CANARIO)));
  });
});

// Sem --ide, o resolveEnvPath sobe pelas pastas acima do workspace do teste: um `.{ide}/ENV.md`
// acima do tmpdir() (TMPDIR dentro de um workspace do Jarvis) mudaria o resultado sem defeito no código.
const IDE_FOLDERS = [".windsurf", ".claude", ".cursor", ".codex", ".opencode", ".agents", ".kiro"];
function envAcimaDoTmp() {
  for (let dir = tmpdir(); ; dir = dirname(dir)) {
    if (IDE_FOLDERS.some((f) => existsSync(join(dir, f, "ENV.md")))) return dir;
    if (dirname(dir) === dir) return null;
  }
}

test("rules sync: sem --ide e sem ENV.md numa pasta de IDE, sai com 1 e a mensagem, sem gravar nada", (t) => {
  const acima = envAcimaDoTmp();
  if (acima) return t.skip(`há um ENV.md de IDE em ${acima}, acima do tmpdir()`);
  // Sem ENV.md nenhum e com o ENV.md na raiz (layout legado): os dois caem no fallback da raiz.
  for (const legado of [false, true]) {
    withWorkspace({ lock: VERSION }, (ws) => {
      if (legado) writeFileSync(join(ws, "ENV.md"), ENV_MD);
      const r = run(ws, []);
      assert.equal(r.status, 1, `legado ${legado}`);
      assert.match(r.stderr + r.stdout, /ENV\.md não encontrado na pasta de uma IDE/);
      assert.doesNotMatch(r.stderr, /node:fs|\n\s+at /);
      assert.ok(!existsSync(join(ws, "rules")));
      assert.ok(!existsSync(join(ws, "overlays")));
      assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
    });
  }
});

test("rules sync: --ide de outra IDE filtra só a pasta dela", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION, ide: "cursor" }, (ws) => {
    mkdirSync(join(ws, ".cursor", "rules"), { recursive: true });
    writeFileSync(join(ws, ".cursor", CANARIO), "antes\n");
    const r = run(ws, ["--ide", "cursor"]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".cursor", CANARIO)));
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
});

test("rules sync: falha ao gravar uma rule sai com 1 e lista o erro", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
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
    writeFileSync(join(ws, "config", "ENV.md"), ENV_MD);
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
      assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
    }
  });
});

test("rules sync: --env-file dentro da pasta da IDE continua valendo", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    const r = run(ws, ["--env-file", join(".claude", "ENV.md")]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", CANARIO)));
  });
});

test("rules sync: --ide com ENV.md de fora de uma IDE filtra a pasta da IDE pedida", () => {
  withWorkspace({ lock: VERSION }, (ws) => {
    mkdirSync(join(ws, "config"));
    writeFileSync(join(ws, "config", "ENV.md"), ENV_MD);
    const r = run(ws, ["--ide", "claude", "--env-file", join("config", "ENV.md")]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude", CANARIO)));
    assert.ok(!existsSync(join(ws, "config", "rules")));
  });
});

test("rules sync: --ide com o ENV.md da pasta de outra IDE sai com 1, sem gravar nada", () => {
  withWorkspace({ env: ENV_MD, lock: VERSION, ide: "cursor" }, (ws) => {
    const r = run(ws, ["--ide", "claude", "--env-file", join(".cursor", "ENV.md")]);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /ENV\.md de outra IDE \(\.cursor\/\) com --ide claude/);
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
});

test("rules sync: o lock da pasta da IDE vale antes do da raiz", () => {
  // Raiz na versão atual (o último init foi de outra IDE) e .claude/ antiga: recusa.
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    writeFileSync(join(ws, ".claude", "jarvis-lock.json"), JSON.stringify({ version: "0.0.1" }));
    const r = run(ws);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, new RegExp(`assets da 0\\.0\\.1 e Jarvis ${VERSION}`));
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
  // Raiz antiga e .claude/ na versão atual: segue.
  withWorkspace({ env: ENV_MD, lock: "0.0.1" }, (ws) => {
    writeFileSync(join(ws, ".claude", "jarvis-lock.json"), JSON.stringify({ version: VERSION }));
    assert.equal(run(ws).status, 0);
  });
});

test("rules sync: jarvis-lock.json ilegível sai com 1, também na pasta da IDE com o da raiz válido", () => {
  withWorkspace({ env: ENV_MD }, (ws) => {
    writeFileSync(join(ws, "jarvis-lock.json"), "{");
    const r = run(ws);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /jarvis-lock\.json ilegível ou sem versão/);
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    writeFileSync(join(ws, ".claude", "jarvis-lock.json"), "{");
    const r = run(ws);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /\.claude.jarvis-lock\.json ilegível ou sem versão/);
    assert.equal(readFileSync(join(ws, ".claude", CANARIO), "utf-8"), "antes\n");
  });
});

test("rules sync: --ide com o ENV.md na raiz (ou numa subpasta funda) usa o workspace da pasta da IDE", () => {
  for (const envRel of ["ENV.md", join("a", "b", "ENV.md")]) {
    withWorkspace({ lock: VERSION }, (ws) => {
      mkdirSync(join(ws, "a", "b"), { recursive: true });
      writeFileSync(join(ws, envRel), ENV_MD);
      const r = run(ws, ["--ide", "claude", "--env-file", envRel]);
      assert.equal(r.status, 0, `${envRel}: ${r.stderr}`);
      assert.ok(!existsSync(join(ws, ".claude", CANARIO)), envRel);
    });
  }
});

test("rules sync: --ide com ENV.md de fora e sem a pasta da IDE no caminho sai com 1, sem gravar", () => {
  withWorkspace({ lock: VERSION }, (ws) => {
    writeFileSync(join(ws, "ENV.md"), ENV_MD);
    const r = run(ws, ["--ide", "cursor", "--env-file", "ENV.md"]);
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /Pasta \.cursor\/ não encontrada/);
    assert.ok(!existsSync(join(ws, ".cursor")));
  });
});

test("rules sync: workspace dentro de outro grava só no de dentro", () => {
  withWorkspace({ lock: VERSION }, (fora) => {
    const dentro = join(fora, "projeto");
    mkdirSync(join(dentro, ".claude", "rules"), { recursive: true });
    writeFileSync(join(dentro, ".claude", CANARIO), "antes\n");
    writeFileSync(join(dentro, "jarvis-lock.json"), JSON.stringify({ version: VERSION }));
    mkdirSync(join(dentro, "config"));
    writeFileSync(join(dentro, "config", "ENV.md"), ENV_MD);
    const r = run(dentro, ["--ide", "claude", "--env-file", join("config", "ENV.md")]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(dentro, ".claude", CANARIO)));
    assert.equal(readFileSync(join(fora, ".claude", CANARIO), "utf-8"), "antes\n");
  });
});

test("rules sync: RTK_ENABLED=true no ENV.md traz a rtk-rules.md e mostra o aviso do overlay", () => {
  withWorkspace({ env: `${ENV_MD}RTK_ENABLED=true\n`, lock: VERSION }, (ws) => {
    const r = run(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(ws, ".claude", "rules", "rtk-rules.md")));
    assert.match(r.stdout, /⚠️ {2}\(overlay\) .*COMPANY_PROFILE vazio/);
  });
  withWorkspace({ env: ENV_MD, lock: VERSION }, (ws) => {
    assert.equal(run(ws).status, 0);
    assert.ok(!existsSync(join(ws, ".claude", "rules", "rtk-rules.md")));
  });
});
