// Varredura por chave de caminho do ENV.md (#228): cada chave aceita $VAR, nenhuma pasta nasce com
// "$" no nome e nenhum ponto do CLI lê uma chave de caminho crua. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PATH_KEYS, EnvPathError, expandEnvPath } from "../bin/lib/core/env-paths.js";
import { getStorage } from "../bin/lib/docs/storage/index.js";
import { docsFolders } from "../bin/lib/core/docs-migrate.js";
import { expandEnv } from "../bin/lib/core/env-paths.js";
import { sessionFolderOf } from "../bin/lib/docs/finish-delivery.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- cada chave de caminho aceita $VAR e acompanha a variável -------------------

for (const key of PATH_KEYS) {
  test(`${key}: aceita $VAR, vale o valor expandido e o erro de $ sobrando mostra a chave`, () => {
    const env = { RAIZ_TESTE: "base-x", [key]: "$RAIZ_TESTE/pasta" };
    // RAIZ_TESTE não é um padrão do template: primeiro sem valor (erro), depois com valor
    assert.throws(() => expandEnvPath({ [key]: "$RAIZ_TESTE/pasta" }, key), (err) => err instanceof EnvPathError && err.key === key);
    assert.equal(expandEnvPath(env, key), "base-x/pasta");
  });
}

// --- nenhuma pasta com $ nasce, em cada ponto de entrada -------------------------

test("getStorage: com $VAR no CENTRAL_DOCS_LOCATION nenhuma pasta com $ é criada na raiz", () => {
  const root = mkdtempSync(join(tmpdir(), "jarvis-keys-"));
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "$JARVIS_DOCS/central-docs", DOCS_FOLDER: "outro" },
      { root }
    );
    assert.equal(s.location, join(root, "outro/jarvis/central-docs"));
    assert.deepEqual(readdirSync(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("docsFolders e sessionFolderOf: acompanham DOCS_FOLDER, JARVIS_DOCS e SESSIONS_DIR customizados", () => {
  const env = {
    DOCS_FOLDER: "documentos",
    JARVIS_DOCS: ".jarvis/$DOCS_FOLDER/jarvis",
    SESSIONS_DIR: "$DOCS_FOLDER/sessoes",
  };
  const f = docsFolders(expandEnv(new Map(Object.entries(env))));
  assert.equal(f.jarvis, ".jarvis/documentos/jarvis");
  assert.equal(f.prod, ".jarvis/documentos/jarvis/product");
  assert.equal(f.eng, ".jarvis/documentos/jarvis/engineering");
  assert.equal(f.discoveries, ".jarvis/documentos/jarvis/discoveries");
  assert.equal(sessionFolderOf(env, "/w", "TASK-1"), "/w/documentos/sessoes/eng/task-1");
});

// --- varredura do código: nenhuma leitura crua de chave de caminho ---------------

const KEYS = PATH_KEYS.join("|");
const RAW_READ = new RegExp(
  `(?:\\b(?:env|expanded|entries|futureEntries)\\??\\.(?:get|has)\\(\\s*["'](?:${KEYS})["'])|(?:\\benv\\.(?:${KEYS})\\b)|(?:\\bprocess\\.env\\.(?:${KEYS})\\b)`
);

/** Leituras cruas permitidas, com o motivo (arquivo → trecho). */
const ALLOWED = [
  { file: "bin/lib/core/env-upgrade.js", text: 'env.get("CENTRAL_DOCS_LOCATION") &&', why: "só confere se a chave existe; o valor passa por expandEnvPath logo abaixo" },
  { file: "bin/lib/docs/storage/index.js", text: "!env.CENTRAL_DOCS_LOCATION", why: "só confere se a chave existe; o valor passa por expandEnvPath" },
  { file: "bin/lib/core/docs-migrate.js", text: 'env.get("', why: "docsFolders lê o Map já expandido, depois de assertPathsResolved" },
];

function jsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...jsFiles(full));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

test("varredura: nenhum ponto de bin/ lê uma chave de caminho do ENV sem passar pela função única", () => {
  const found = [];
  for (const file of jsFiles(join(repoRoot, "bin"))) {
    const rel = relative(repoRoot, file).split(sep).join("/");
    readFileSync(file, "utf-8")
      .split("\n")
      .forEach((line, i) => {
        if (!RAW_READ.test(line)) return;
        if (ALLOWED.some((a) => a.file === rel && a.text && line.includes(a.text))) return;
        found.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
  }
  assert.deepEqual(found, [], "leitura crua de chave de caminho: use expandEnvPath (env-paths.js)");
});

test("varredura: o detector acha as leituras que o código antigo fazia", () => {
  assert.ok(RAW_READ.test('const sessions = expanded.get("SESSIONS_DIR") || ".jarvis/sessions";'));
  assert.ok(RAW_READ.test("location: resolveLocation(env.CENTRAL_DOCS_LOCATION, root),"));
  assert.ok(!RAW_READ.test('const sessions = expandEnvPath(env, "SESSIONS_DIR");'));
});
