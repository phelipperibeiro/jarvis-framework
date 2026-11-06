// Testes de integração dos comandos `jarvis docs publish/archive/finalize/migrate` (#220,
// item 2 do gate de testes do pre-pr: nenhum tinha teste direto). Chama as funções dos comandos
// (bin/commands/docs-*.js) direto, como o skill de QA sugeriu como alternativa ao spawn do CLI;
// mais rápido e tão fiel quanto, já que o parsing de flags do commander só repassa um objeto
// plano (toLegacyFlags). Rode com: npm run test:filtro
import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { docsPublish } from "../bin/commands/docs-publish.js";
import { docsArchive } from "../bin/commands/docs-archive.js";
import { docsFinalize } from "../bin/commands/docs-finalize.js";
import { docsMigrate } from "../bin/commands/docs-migrate.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

function write(file, content) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

const created = [];
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-docs-cli-"));
  created.push(dir);
  return dir;
}
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

/** Pasta de workspace com `.claude/ENV.md` (Central docs em `central-docs/`, filesystem, sem git). */
function workspaceFixture() {
  const ws = tmp();
  const centralDocs = join(ws, "central-docs");
  mkdirSync(centralDocs, { recursive: true });
  write(
    join(ws, ".claude/ENV.md"),
    [
      "CENTRAL_DOCS_STORAGE=filesystem",
      `CENTRAL_DOCS_LOCATION=${centralDocs}`,
      "SQUAD=CORE",
      "WORKSPACE=loja",
    ].join("\n")
  );
  return { ws, envFile: join(ws, ".claude/ENV.md"), centralDocs };
}

/** Mesmo padrão de test/tasks-comment.test.js: captura o código de `process.exit`. */
async function captureRun(fn) {
  const real = process.exit;
  let code = 0;
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  try {
    await fn();
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    process.exit = real;
  }
  return code;
}

// --- docs publish --file (um documento só, o modo típico do /eng.spec-consolidate) --------

test("docsPublish --file: sem --file/--tipo sai com 1 (#220, rodada 2 item 3)", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() => docsPublish({ "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsPublish --file: tipo inválido sai com 1 (#220, rodada 2 item 3)", async () => {
  const { ws, envFile } = workspaceFixture();
  const file = join(ws, "checkout.md");
  write(file, "# Checkout\n");
  const code = await captureRun(() => docsPublish({ file, tipo: "xyz", "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsPublish --file: arquivo inexistente sai com 1 (#220, rodada 2 item 3)", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() =>
    docsPublish({ file: "/tmp/nao-existe-jarvis.md", tipo: "feature", "env-file": envFile })
  );
  assert.equal(code, 1);
});

test("docsPublish --file: caminho feliz publica um documento só e regenera o índice (#220, rodada 2 item 3)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const file = join(ws, "feature-checkout.md");
  write(
    file,
    "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\n---\n# Checkout\n"
  );

  const code = await captureRun(() => docsPublish({ file, tipo: "feature", "env-file": envFile }));

  assert.equal(code, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/checkout.md")));
  assert.ok(existsSync(join(centralDocs, "CORE/index.md")));
});

// --- docs publish --manifest ----------------------------------------------

test("docsPublish --manifest: manifesto inexistente sai com 1", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() =>
    docsPublish({ manifest: "/tmp/nao-existe-jarvis.json", "env-file": envFile })
  );
  assert.equal(code, 1);
});

test("docsPublish --manifest: JSON inválido sai com 1", async () => {
  const { ws, envFile } = workspaceFixture();
  const manifest = join(ws, "consolidation/manifest.json");
  write(manifest, "{ não é json");
  const code = await captureRun(() => docsPublish({ manifest, "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsPublish --manifest: caminho feliz publica e regenera o índice", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  write(
    join(ws, "consolidation/checkout.md"),
    "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\n---\n# Checkout\n"
  );
  write(
    join(ws, "consolidation/delivery-2026-10-15-task-1.md"),
    "---\nid: DEL-001\nfeature: checkout\ntask_key: TASK-1\npr: https://example/pr/1\ndate: 2026-10-15\n---\n"
  );
  write(
    join(ws, "consolidation/manifest.json"),
    JSON.stringify([
      { file: "checkout.md", tipo: "feature", feature: "checkout" },
      { file: "delivery-2026-10-15-task-1.md", tipo: "delivery", feature: "checkout", taskKey: "TASK-1" },
    ])
  );

  const code = await captureRun(() =>
    docsPublish({ manifest: join(ws, "consolidation/manifest.json"), slug: "task-1", "env-file": envFile })
  );

  assert.equal(code, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/checkout.md")));
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-1.md")));
  assert.ok(existsSync(join(centralDocs, "CORE/index.md")));
});

test("docsPublish --manifest --force: publica e já apaga o original ligado (zero reversão)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const original = join(ws, "docs/jarvis/product/prd-001-checkout.md");
  const prdContent = "---\nid: PRD-001\nname: Checkout\nversion: 1.0.0\nstatus: in_progress\n---\n# PRD\n";
  write(original, prdContent);
  write(join(ws, "consolidation/prd-001-checkout.md"), prdContent);
  write(
    join(ws, "consolidation/manifest.json"),
    JSON.stringify([
      { file: "prd-001-checkout.md", tipo: "prd", feature: "checkout", originalPath: original },
    ])
  );

  const code = await captureRun(() =>
    docsPublish({
      manifest: join(ws, "consolidation/manifest.json"),
      slug: "task-force",
      force: true,
      "env-file": envFile,
    })
  );

  assert.equal(code, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/prd-001-checkout.md")));
  assert.equal(existsSync(original), false, "--force já apaga o original, sem --archive");
});

// --- docs archive -----------------------------------------------------------

test("docsArchive: sem --manifest sai com 1", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() => docsArchive({ "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsArchive: manifesto inexistente sai com 1", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() =>
    docsArchive({ manifest: "/tmp/nao-existe-jarvis.json", "env-file": envFile })
  );
  assert.equal(code, 1);
});

test("docsArchive: caminho feliz copia para archive/ e reescreve o manifesto com o hash", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const original = join(ws, "docs/jarvis/product/prd-002-checkout.md");
  write(original, "---\nstatus: in_progress\n---\n# PRD\n");
  const manifestPath = join(ws, "consolidation/manifest.json");
  write(
    manifestPath,
    JSON.stringify([{ file: "prd-002-checkout.md", tipo: "prd", feature: "checkout", originalPath: original }])
  );

  const code = await captureRun(() => docsArchive({ manifest: manifestPath, "env-file": envFile }));

  assert.equal(code, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/archive/prd-002-checkout.md")));
  assert.ok(existsSync(original), "o original continua onde estava");
  const entries = JSON.parse(readFileSync(manifestPath, "utf-8"));
  assert.ok(entries[0].archiveDestPath);
  assert.equal(entries[0].archivedHash.length, 64);
});

// --- docs finalize ------------------------------------------------------------

test("docsFinalize: sem --manifest sai com 1", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() => docsFinalize({ "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsFinalize: entrada sem --archive antes sai com 1 e orienta o comando certo", async () => {
  const { ws, envFile } = workspaceFixture();
  const manifestPath = join(ws, "consolidation/manifest.json");
  write(manifestPath, JSON.stringify([{ file: "x.md", tipo: "prd", feature: "a", originalPath: "/tmp/x.md" }]));

  const code = await captureRun(() => docsFinalize({ manifest: manifestPath, "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsFinalize: caminho feliz apaga o original já arquivado e reescreve related_*", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const original = join(ws, "docs/jarvis/product/prd-003-checkout.md");
  write(original, "---\nstatus: in_progress\n---\n# PRD\n");
  write(
    join(ws, "docs/jarvis/product/frd-003-checkout.md"),
    "---\nrelated_prd: prd-003-checkout.md\n---\n# FRD\n"
  );
  const manifestPath = join(ws, "consolidation/manifest.json");
  write(
    manifestPath,
    JSON.stringify([{ file: "prd-003-checkout.md", tipo: "prd", feature: "checkout", originalPath: original }])
  );
  const archiveCode = await captureRun(() => docsArchive({ manifest: manifestPath, "env-file": envFile }));
  assert.equal(archiveCode, 0);

  const code = await captureRun(() => docsFinalize({ manifest: manifestPath, "env-file": envFile }));

  assert.equal(code, 0);
  assert.equal(existsSync(original), false);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/archive/prd-003-checkout.md")));
  assert.match(
    readFileSync(join(ws, "docs/jarvis/product/frd-003-checkout.md"), "utf-8"),
    /related_prd:\s*CORE\/loja\/checkout\/decisions\/prd-003-checkout\.md/
  );
});

// --- docs migrate --------------------------------------------------------------

test("docsMigrate: sem SQUAD no ENV.md sai com 1", async () => {
  const ws = tmp();
  const centralDocs = join(ws, "central-docs");
  mkdirSync(centralDocs, { recursive: true });
  write(
    join(ws, ".claude/ENV.md"),
    `CENTRAL_DOCS_STORAGE=filesystem\nCENTRAL_DOCS_LOCATION=${centralDocs}\nWORKSPACE=loja\n`
  );
  const code = await captureRun(() => docsMigrate({ "env-file": join(ws, ".claude/ENV.md") }));
  assert.equal(code, 1);
});

test("docsMigrate: --squad com caminho (../) sai com 1 em vez de escrever fora do Central docs (#220 item 8)", async () => {
  const { envFile } = workspaceFixture();
  const code = await captureRun(() => docsMigrate({ squad: "../fora", "env-file": envFile }));
  assert.equal(code, 1);
});

test("docsMigrate: dry-run não altera nada; --apply move e sai com 0", async () => {
  const { envFile, centralDocs } = workspaceFixture();
  write(
    join(centralDocs, "CORE/product/loja/feature-checkout.md"),
    "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\nlast_delivery: delivery-2026-10-15-t-1.md\n---\n# Checkout\n"
  );
  write(join(centralDocs, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

  const dryRunCode = await captureRun(() => docsMigrate({ "env-file": envFile }));
  assert.equal(dryRunCode, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/product/loja/feature-checkout.md")), "dry-run não move nada");

  const applyCode = await captureRun(() => docsMigrate({ apply: true, "env-file": envFile }));
  assert.equal(applyCode, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/checkout.md")));
  assert.equal(existsSync(join(centralDocs, "CORE/product")), false);
});
