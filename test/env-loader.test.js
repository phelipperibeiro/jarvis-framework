// Testes de resolução/leitura do ENV.md (env-loader.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveEnvPath,
  loadEnv,
  deriveWorkspaceName,
  getJarvisDir,
} from "../bin/lib/env-loader.js";

function withTempWorkspace(fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-env-loader-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeEnv(dir, ide, content = "WORKSPACE=meu-workspace\n") {
  const ideDir = join(dir, `.${ide}`);
  mkdirSync(ideDir, { recursive: true });
  writeFileSync(join(ideDir, "ENV.md"), content, "utf-8");
  return join(ideDir, "ENV.md");
}

test("resolveEnvPath: --env-file explícito (absoluto)", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "claude");
    const resolved = resolveEnvPath(dir, { "env-file": envPath });
    assert.equal(resolved.path, envPath);
    assert.equal(resolved.source, "--env-file");
  });
});

test("resolveEnvPath: --env-file relativo ao cwd", () => {
  withTempWorkspace((dir) => {
    writeEnv(dir, "claude");
    const resolved = resolveEnvPath(dir, { "env-file": ".claude/ENV.md" });
    assert.equal(resolved.path, join(dir, ".claude/ENV.md"));
  });
});

test("resolveEnvPath: --env-file inexistente lança erro com dica", () => {
  withTempWorkspace((dir) => {
    assert.throws(() => resolveEnvPath(dir, { "env-file": "nope.md" }), /não encontrado/);
  });
});

test("resolveEnvPath: --ide resolve mesmo a partir de um repo filho (sobe ancestrais)", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "claude");
    const childRepo = join(dir, "meu-repo");
    mkdirSync(childRepo, { recursive: true });

    const resolved = resolveEnvPath(childRepo, { ide: "claude" });
    assert.equal(resolved.path, envPath);
    assert.equal(resolved.source, "--ide claude");
    assert.equal(resolved.root, dir);
  });
});

test("resolveEnvPath: --ide com valor não suportado lança erro listando as válidas", () => {
  withTempWorkspace((dir) => {
    assert.throws(() => resolveEnvPath(dir, { ide: "vscode" }), /IDE não suportada.*vscode/s);
  });
});

test("resolveEnvPath: --ide suportada mas sem ENV.md no workspace lança erro com dica de init", () => {
  withTempWorkspace((dir) => {
    assert.throws(
      () => resolveEnvPath(dir, { ide: "windsurf" }),
      /ENV\.md não encontrado para --ide windsurf.*jarvis init --ide windsurf/s
    );
  });
});

test("resolveEnvPath: JARVIS_ENV_FILE (variável de ambiente)", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "claude");
    const prev = process.env.JARVIS_ENV_FILE;
    process.env.JARVIS_ENV_FILE = envPath;
    try {
      const resolved = resolveEnvPath(dir, {});
      assert.equal(resolved.path, envPath);
      assert.equal(resolved.source, "JARVIS_ENV_FILE");
    } finally {
      if (prev === undefined) delete process.env.JARVIS_ENV_FILE;
      else process.env.JARVIS_ENV_FILE = prev;
    }
  });
});

test("resolveEnvPath: IDE (variável de ambiente)", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "cursor");
    const prev = process.env.IDE;
    process.env.IDE = "cursor";
    try {
      const resolved = resolveEnvPath(dir, {});
      assert.equal(resolved.path, envPath);
      assert.equal(resolved.source, "IDE=cursor");
    } finally {
      if (prev === undefined) delete process.env.IDE;
      else process.env.IDE = prev;
    }
  });
});

test("resolveEnvPath: auto-detect com exatamente um ENV.md no workspace", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "claude");
    const resolved = resolveEnvPath(dir, {});
    assert.equal(resolved.path, envPath);
    assert.match(resolved.source, /^auto-detect/);
  });
});

test("resolveEnvPath: múltiplos ENV.md no mesmo diretório lança erro pedindo para especificar a IDE", () => {
  withTempWorkspace((dir) => {
    writeEnv(dir, "claude");
    writeEnv(dir, "cursor");
    assert.throws(() => resolveEnvPath(dir, {}), /Múltiplos ENV\.md encontrados.*--ide/s);
  });
});

test("resolveEnvPath: sem nenhum ENV.md, cai no fallback da raiz", () => {
  withTempWorkspace((dir) => {
    const resolved = resolveEnvPath(dir, {});
    assert.equal(resolved.path, join(dir, "ENV.md"));
    assert.equal(resolved.source, "auto-detect (root)");
    assert.equal(resolved.root, dir);
  });
});

test("loadEnv: parseia key=value, ignora comentário e linha em branco", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(
      dir,
      "claude",
      ["# comentário", "", "HUB=BACKEND", "SQUAD = CORE ", "SEM_VALOR="].join("\n")
    );
    const env = loadEnv(dir, envPath);
    assert.equal(env.HUB, "BACKEND");
    assert.equal(env.SQUAD, "CORE");
    assert.equal(env.SEM_VALOR, undefined);
  });
});

test("loadEnv: WORKSPACE ausente é derivado do path do ENV.md", () => {
  withTempWorkspace((dir) => {
    const envPath = writeEnv(dir, "claude", "HUB=BACKEND\n");
    const env = loadEnv(dir, envPath);
    assert.equal(env.WORKSPACE, deriveWorkspaceName(envPath));
  });
});

test("loadEnv: ENV.md inexistente retorna objeto vazio", () => {
  withTempWorkspace((dir) => {
    assert.deepEqual(loadEnv(dir, join(dir, "nope/ENV.md")), {});
  });
});

test("deriveWorkspaceName: pasta pai é a pasta da IDE (ponto) -> sobe mais um nível", () => {
  withTempWorkspace((dir) => {
    const envPath = join(dir, "meu-workspace", ".claude", "ENV.md");
    assert.equal(deriveWorkspaceName(envPath), "meu-workspace");
  });
});

test("getJarvisDir: resolve para {root}/.jarvis quando o ENV.md existe", () => {
  withTempWorkspace((dir) => {
    writeEnv(dir, "claude");
    assert.equal(getJarvisDir(dir, {}), join(dir, ".jarvis"));
  });
});

test("getJarvisDir: sem ENV.md, cai para {cwd}/.jarvis sem lançar", () => {
  withTempWorkspace((dir) => {
    assert.equal(getJarvisDir(dir, {}), join(dir, ".jarvis"));
  });
});
