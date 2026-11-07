// Testes de fetchFile (fetch-file.js) pelo adaptador do Central docs. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

// --- $VAR no CENTRAL_DOCS_LOCATION (#228) --------------------------------------

/** Cria `{root}/{pasta}/CORE/index.md` e lê pelo fetch, com o ENV dado. */
async function fetchComEnv(envLines, pasta) {
  const { root, envFile } = workspace(["SQUAD=CORE", "CENTRAL_DOCS_STORAGE=filesystem", ...envLines]);
  try {
    mkdirSync(join(root, pasta, "CORE"), { recursive: true });
    writeFileSync(join(root, pasta, "CORE", "index.md"), "# CORE\n");
    const texto = await fetchFile("CORE/index.md", { flags: { "env-file": envFile } });
    return { texto, root };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("fetchFile: CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs resolve para docs/jarvis/central-docs", async () => {
  const { texto } = await fetchComEnv(
    ["DOCS_FOLDER=docs", "JARVIS_DOCS=$DOCS_FOLDER/jarvis", "CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs"],
    "docs/jarvis/central-docs"
  );
  assert.equal(texto, "# CORE\n");
});

test("fetchFile: o Central docs acompanha o DOCS_FOLDER customizado", async () => {
  const { texto } = await fetchComEnv(
    ["DOCS_FOLDER=documentos", "JARVIS_DOCS=$DOCS_FOLDER/jarvis", "CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs"],
    "documentos/jarvis/central-docs"
  );
  assert.equal(texto, "# CORE\n");
});

test("fetchFile: variável no meio do valor e JARVIS_DOCS depois do CENTRAL_DOCS_LOCATION", async () => {
  const { texto } = await fetchComEnv(
    ["CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs", "JARVIS_DOCS=.jarvis/$DOCS_FOLDER/jarvis", "DOCS_FOLDER=docs"],
    ".jarvis/docs/jarvis/central-docs"
  );
  assert.equal(texto, "# CORE\n");
});

test("fetchFile: variável sem valor no CENTRAL_DOCS_LOCATION dá erro claro e não cria a pasta com $", async () => {
  const { root, envFile } = workspace(["CENTRAL_DOCS_STORAGE=filesystem", "CENTRAL_DOCS_LOCATION=$NAO_EXISTE/x"]);
  try {
    await assert.rejects(
      () => fetchFile("CORE/index.md", { flags: { "env-file": envFile } }),
      /CENTRAL_DOCS_LOCATION.*\$NAO_EXISTE\/x.*sobrou: \$NAO_EXISTE/s
    );
    assert.equal(readdirSync(root).filter((n) => n.includes("$")).length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fetchFile: caminho absoluto continua valendo", async () => {
  const { root, envFile } = workspace(["CENTRAL_DOCS_STORAGE=filesystem"]);
  const abs = mkdtempSync(join(tmpdir(), "jarvis-fetch-abs-"));
  try {
    mkdirSync(join(abs, "CORE"), { recursive: true });
    writeFileSync(join(abs, "CORE", "index.md"), "# ABS\n");
    writeFileSync(envFile, `CENTRAL_DOCS_STORAGE=filesystem\nCENTRAL_DOCS_LOCATION=${abs}\n`);
    assert.equal(await fetchFile("CORE/index.md", { flags: { "env-file": envFile } }), "# ABS\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(abs, { recursive: true, force: true });
  }
});
