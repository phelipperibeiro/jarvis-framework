// Testes da comparação de versões e da cópia local do Jarvis (bin/lib/utils/version.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareVersions, localInstall } from "../bin/lib/utils/version.js";

test("compareVersions: igual, maior e menor em cada posição", () => {
  assert.equal(compareVersions("7.0.0", "7.0.0"), 0);
  assert.equal(compareVersions("8.0.0", "7.9.9"), 1);
  assert.equal(compareVersions("7.1.0", "7.0.9"), 1);
  assert.equal(compareVersions("7.0.1", "7.0.0"), 1);
  assert.equal(compareVersions("6.0.0", "7.0.0"), -1);
  assert.equal(compareVersions("7.0.0", "7.1.0"), -1);
  assert.equal(compareVersions("7.0.0", "7.0.10"), -1);
});

test("compareVersions: aceita v na frente e ignora o sufixo", () => {
  assert.equal(compareVersions("v7.0.0", "7.0.0"), 0);
  assert.equal(compareVersions("7.0.0-beta.1", "7.0.0"), 0);
});

test("compareVersions: versão ilegível devolve null", () => {
  assert.equal(compareVersions("desconhecida", "7.0.0"), null);
  assert.equal(compareVersions("7.0.0", undefined), null);
  assert.equal(compareVersions("^7.0.0", "7.0.0"), null);
});

function withDir(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-version-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(join(dir, rel, ".."), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("localInstall: node_modules tem precedência e devolve a versão instalada", () => {
  withDir(
    {
      "node_modules/jarvis-ai-framework/package.json": '{"version":"5.5.0"}',
      "package.json": '{"dependencies":{"jarvis-ai-framework":"^5.5.0"}}',
    },
    (dir) =>
      assert.deepEqual(localInstall(dir), {
        version: "5.5.0",
        source: "node_modules/jarvis-ai-framework",
      })
  );
});

test("localInstall: só a dependência no package.json (dependencies ou devDependencies)", () => {
  withDir({ "package.json": '{"dependencies":{"jarvis-ai-framework":"^7.0.0"}}' }, (dir) =>
    assert.deepEqual(localInstall(dir), {
      version: "^7.0.0",
      source: "package.json (dependencies)",
    })
  );
  withDir({ "package.json": '{"devDependencies":{"jarvis-ai-framework":"^6.0.0"}}' }, (dir) =>
    assert.deepEqual(localInstall(dir), {
      version: "^6.0.0",
      source: "package.json (devDependencies)",
    })
  );
});

test("localInstall: sem cópia local (ou package.json ilegível) devolve null", () => {
  withDir({}, (dir) => assert.equal(localInstall(dir), null));
  withDir({ "package.json": '{"dependencies":{"outro":"1.0.0"}}' }, (dir) =>
    assert.equal(localInstall(dir), null)
  );
  withDir({ "package.json": "{quebrado" }, (dir) => assert.equal(localInstall(dir), null));
});

test("localInstall: pasta em node_modules sem versão legível conta como cópia local", () => {
  withDir({ "node_modules/jarvis-ai-framework/package.json": "{quebrado" }, (dir) =>
    assert.deepEqual(localInstall(dir), {
      version: "desconhecida",
      source: "node_modules/jarvis-ai-framework",
    })
  );
});

test("localInstall: link simbólico quebrado em node_modules ainda conta como cópia local", () => {
  withDir({}, (dir) => {
    mkdirSync(join(dir, "node_modules"), { recursive: true });
    symlinkSync(join(dir, "nao-existe"), join(dir, "node_modules", "jarvis-ai-framework"));
    assert.deepEqual(localInstall(dir), {
      version: "desconhecida",
      source: "node_modules/jarvis-ai-framework",
    });
  });
});
