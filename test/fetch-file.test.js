// Testes de fetchFile (fetch-file.js) pelo adaptador do Central docs. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchFile, openStorageFromEnv } from "../bin/lib/docs/fetch-file.js";

function workspace(envLines) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-fetch-"));
  mkdirSync(join(root, ".claude"));
  writeFileSync(join(root, ".claude", "ENV.md"), `${envLines.join("\n")}\n`);
  return { root, envFile: join(root, ".claude", "ENV.md") };
}

test("fetchFile: sem file-path lança erro", async () => {
  await assert.rejects(() => fetchFile(""), /file-path é obrigatório/);
});

test("fetchFile: Central docs desligado (STORAGE vazio) lança erro claro", async () => {
  const { root, envFile } = workspace(["SQUAD=CORE"]);
  try {
    await assert.rejects(
      () => fetchFile("CORE/index.md", { flags: { "env-file": envFile } }),
      /Central docs desligado/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fetchFile: lê da pasta configurada, com LOCATION relativo ao workspace", async () => {
  const { root, envFile } = workspace([
    "SQUAD=CORE",
    "CENTRAL_DOCS_STORAGE=filesystem",
    "CENTRAL_DOCS_LOCATION=./central-docs",
  ]);
  try {
    mkdirSync(join(root, "central-docs", "CORE"), { recursive: true });
    writeFileSync(join(root, "central-docs", "CORE", "index.md"), "# CORE\n");
    assert.equal(await fetchFile("CORE/index.md", { flags: { "env-file": envFile } }), "# CORE\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fetchFile: arquivo ausente propaga code 404 (o CLI sai com 2)", async () => {
  const { root, envFile } = workspace([
    "CENTRAL_DOCS_STORAGE=filesystem",
    "CENTRAL_DOCS_LOCATION=.",
  ]);
  try {
    await assert.rejects(
      () => fetchFile("CORE/index.md", { flags: { "env-file": envFile } }),
      (err) => err.code === 404
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("openStorageFromEnv: STORAGE não suportado propaga o erro de configuração", () => {
  const { root, envFile } = workspace(["CENTRAL_DOCS_STORAGE=gdrive", "CENTRAL_DOCS_LOCATION=abc"]);
  try {
    assert.throws(
      () => openStorageFromEnv({ "env-file": envFile }),
      /"gdrive" ainda não suportado/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
