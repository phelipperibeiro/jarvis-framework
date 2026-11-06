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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { docsPublish } from "../bin/commands/docs-publish.js";
import { docsArchive } from "../bin/commands/docs-archive.js";
import { docsFinalize } from "../bin/commands/docs-finalize.js";
import { docsMigrate } from "../bin/commands/docs-migrate.js";
import { docsSessions } from "../bin/commands/docs-sessions.js";
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

test("docsPublish --manifest: grava publishedAs e publishedHash por entrada, e versiona a sessão que mudou (#229)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const manifest = join(ws, "consolidation/manifest.json");
  const entries = [
    { file: "architecture.md", tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true },
    { file: "saida.txt", tipo: "history", taskKey: "229", relPath: "ferramentas/saida.txt", fromSession: true },
  ];
  const publish = () => captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile }));

  write(join(ws, "consolidation/architecture.md"), "# Arquitetura\n");
  write(join(ws, "consolidation/saida.txt"), "ok\n");
  write(manifest, JSON.stringify(entries));
  assert.equal(await publish(), 0);

  let saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].publishedAs, "CORE/loja/checkout/decisions/architecture-229.md");
  assert.equal(saved[1].publishedAs, "CORE/loja/history/229/ferramentas/saida.txt");
  assert.equal(saved[0].publishedHash.length, 64);
  assert.equal(saved[0].feature, "checkout", "os demais campos do manifesto ficam intactos");
  assert.ok(existsSync(join(centralDocs, "CORE/loja/history/229/ferramentas/saida.txt")));

  // mesma sessão, nada mudou: nada de -v1 e o mesmo publishedAs
  write(manifest, JSON.stringify(entries));
  assert.equal(await publish(), 0);
  saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].publishedAs, "CORE/loja/checkout/decisions/architecture-229.md");
  assert.equal(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/architecture-229-v1.md")), false);

  // a sessão mudou: nova versão, e o manifesto aponta para ela
  write(join(ws, "consolidation/architecture.md"), "# Arquitetura revisada\n");
  write(manifest, JSON.stringify(entries));
  assert.equal(await publish(), 0);
  saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].publishedAs, "CORE/loja/checkout/decisions/architecture-229-v1.md");
  assert.equal(readFileSync(join(centralDocs, "CORE/loja/checkout/decisions/architecture-229.md"), "utf-8"), "# Arquitetura\n");
});

test("docsPublish --manifest: link relativo que não resolve no Central docs só avisa, não bloqueia (#229)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  write(join(ws, "consolidation/plan.md"), "# Plano\n[código](../../../../../jarvis-framework/bin/x.js#L5)\n");
  write(
    join(ws, "consolidation/manifest.json"),
    JSON.stringify([{ file: "plan.md", tipo: "plan", feature: "checkout", taskKey: "229", fromSession: true }])
  );
  const code = await captureRun(() =>
    docsPublish({ manifest: join(ws, "consolidation/manifest.json"), slug: "229", "env-file": envFile })
  );
  assert.equal(code, 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/plan-229.md")));
});

test("docsPublish --manifest: converte os links do .md da sessão (originalPath) e deixa o original intacto (#229)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  const original = join(ws, ".jarvis/sessions/eng/229/plan.md");
  const text = "# Plano\n[PRD](../../../../docs/jarvis/product/prd.md) e [arquitetura](architecture.md) e [card](https://x.dev/1)\n";
  write(original, text);
  write(join(ws, ".jarvis/sessions/eng/229/architecture.md"), "# Arquitetura\n");
  write(join(ws, "consolidation/plan.md"), text);
  write(join(ws, "consolidation/architecture.md"), "# Arquitetura\n");
  write(
    join(ws, "consolidation/manifest.json"),
    JSON.stringify([
      { file: "plan.md", tipo: "plan", feature: "checkout", taskKey: "229", fromSession: true, originalPath: original },
      { file: "architecture.md", tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true, originalPath: join(ws, ".jarvis/sessions/eng/229/architecture.md") },
    ])
  );
  const code = await captureRun(() =>
    docsPublish({ manifest: join(ws, "consolidation/manifest.json"), slug: "229", "env-file": envFile })
  );
  assert.equal(code, 0);
  const published = readFileSync(join(centralDocs, "CORE/loja/checkout/decisions/plan-229.md"), "utf-8");
  assert.equal(published, "# Plano\nPRD e [arquitetura](architecture-229.md) e [card](https://x.dev/1)\n", "docs/jarvis vira texto; o resto fica");
  assert.equal(readFileSync(original, "utf-8"), text, "o original na sessão não muda");
});

/** Sessão do card 229 no workspace de teste, com os arquivos e o manifesto (`fromSession`). */
function sessionManifestFixture() {
  const fx = workspaceFixture();
  const sessao = join(fx.ws, ".jarvis/sessions/eng/229");
  write(join(sessao, "architecture.md"), "# Arquitetura\n");
  write(join(sessao, "plan.md"), "# Plano\n");
  write(join(sessao, "ferramentas/saida.txt"), "ok\n");
  write(join(fx.ws, "consolidation/architecture.md"), "# Arquitetura\n");
  write(join(fx.ws, "consolidation/plan.md"), "# Plano\n");
  write(join(fx.ws, "consolidation/saida.txt"), "ok\n");
  const base = { feature: "checkout", taskKey: "229", fromSession: true };
  const manifest = join(fx.ws, "consolidation/manifest.json");
  write(
    manifest,
    JSON.stringify([
      { ...base, file: "architecture.md", tipo: "architecture", originalPath: join(sessao, "architecture.md") },
      { ...base, file: "plan.md", tipo: "plan", originalPath: join(sessao, "plan.md") },
      { ...base, file: "saida.txt", tipo: "history", relPath: "ferramentas/saida.txt", originalPath: join(sessao, "ferramentas/saida.txt") },
    ])
  );
  return { ...fx, sessao, manifest };
}

test("sessão pelos comandos: publicar → arquivar → finalizar apaga os arquivos da sessão e mantém as cópias (#229)", async () => {
  const { envFile, centralDocs, sessao, manifest } = sessionManifestFixture();
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/history/229/ferramentas/saida.txt")));
  assert.ok(existsSync(join(sessao, "architecture.md")), "publicar só copia");

  assert.equal(await captureRun(() => docsArchive({ manifest, "env-file": envFile })), 0);
  const saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.deepEqual(saved.map((e) => e.archiveDestPath), [
    "CORE/loja/checkout/archive/architecture-229.md",
    "CORE/loja/checkout/archive/plan-229.md",
    "CORE/loja/checkout/archive/229/ferramentas/saida.txt",
  ]);
  assert.ok(existsSync(join(sessao, "plan.md")), "arquivar não apaga");

  assert.equal(await captureRun(() => docsFinalize({ manifest, "env-file": envFile })), 0);
  assert.equal(existsSync(join(sessao, "architecture.md")), false);
  assert.equal(existsSync(join(sessao, "plan.md")), false);
  assert.equal(existsSync(join(sessao, "ferramentas/saida.txt")), false);
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/architecture-229.md")), "a cópia publicada fica");
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/archive/229/ferramentas/saida.txt")), "e a arquivada também");
});

test("sessão pelos comandos: --force publica e apaga a sessão conferindo a cópia publicada (#229)", async () => {
  const { envFile, centralDocs, sessao, manifest } = sessionManifestFixture();
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", force: true, "env-file": envFile })), 0);
  for (const rel of ["architecture.md", "plan.md", "ferramentas/saida.txt"]) {
    assert.equal(existsSync(join(sessao, rel)), false, rel);
  }
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/plan-229.md")));
  assert.ok(existsSync(join(centralDocs, "CORE/loja/history/229/ferramentas/saida.txt")));
  assert.equal(existsSync(join(centralDocs, "CORE/loja/checkout/archive")), false, "--force não arquiva");
});

test("sessão pelos comandos: --force não apaga a sessão de outro card, mesmo com taskKey errado no manifesto (#229)", async () => {
  const fx = sessionManifestFixture();
  const outra = join(fx.ws, ".jarvis/sessions/eng/230/architecture.md");
  write(outra, "# Outra sessão\n");
  write(
    fx.manifest,
    JSON.stringify([
      { file: "architecture.md", tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true, originalPath: outra },
    ])
  );
  const code = await captureRun(() => docsPublish({ manifest: fx.manifest, slug: "229", force: true, "env-file": fx.envFile }));
  assert.equal(code, 1, "o --force reporta o erro de segurança");
  assert.ok(existsSync(outra), "a sessão do card 230 permanece");
  assert.ok(existsSync(join(fx.centralDocs, "CORE/loja/checkout/decisions/architecture-229.md")), "a publicação em si ocorreu");
});

test("docsPublish --manifest --dry-run: mostra o plano sem gravar, sem alterar o manifesto e sem apagar nada, nem com --force (#229)", async () => {
  const { envFile, centralDocs, sessao, manifest } = sessionManifestFixture();
  const antes = readFileSync(manifest, "utf-8");
  const code = await captureRun(() =>
    docsPublish({ manifest, slug: "229", force: true, dryRun: true, "env-file": envFile })
  );
  assert.equal(code, 0);
  assert.equal(existsSync(join(centralDocs, "CORE")), false, "nada foi publicado");
  assert.equal(readFileSync(manifest, "utf-8"), antes, "o manifesto não ganhou publishedAs");
  for (const rel of ["architecture.md", "plan.md", "ferramentas/saida.txt"]) {
    assert.ok(existsSync(join(sessao, rel)), `${rel} continua na sessão (o --force não vale na simulação)`);
  }
});

test("workflow eng.spec-consolidate: o manifesto de exemplo do Passo 5 é aceito pelo CLI e gera os destinos descritos (#229)", async () => {
  const wf = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "workflows/engineering/eng.spec-consolidate.md"),
    "utf-8"
  );
  const passo5 = wf.slice(wf.indexOf("## Passo 5"), wf.indexOf("## Passo 6"));
  const bloco = passo5.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(bloco, "o Passo 5 traz o manifesto de exemplo num bloco json");

  const { ws, envFile, centralDocs } = workspaceFixture();
  const exemplo = bloco[1].replaceAll("/ws/", `${ws}/`);
  const sessao = join(ws, ".jarvis/sessions/eng/229");
  write(join(sessao, "architecture.md"), "# Arquitetura\n");
  write(join(sessao, "ferramentas/saidas/E8.txt"), "ok\n");
  write(join(sessao, "consolidation/manifest.json"), exemplo);
  write(join(sessao, "consolidation/session-229.md"), "---\nid: SES-229\nname: Sessão 229\n---\n# Sessão 229\n[arquitetura](../../checkout/decisions/architecture-229.md)\n");
  write(join(sessao, "consolidation/feature-checkout.md"), "---\nid: FEAT-1\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-11-06\n---\n# Checkout\n");
  write(join(sessao, "consolidation/delivery-2026-11-06-229.md"), "---\nid: DEL-1\nfeature: feature-checkout.md\ntask_key: 229\npr: \"#230\"\ndate: 2026-11-06\n---\n# Entrega\n");

  const manifest = join(sessao, "consolidation/manifest.json");
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", dryRun: true, "env-file": envFile })), 0);
  assert.equal(existsSync(join(centralDocs, "CORE")), false, "o --dry-run não grava");

  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  for (const rel of [
    "CORE/loja/checkout/decisions/architecture-229.md",
    "CORE/loja/history/229/ferramentas/saidas/E8.txt",
    "CORE/loja/history/229/229.md",
    "CORE/loja/checkout/checkout.md",
    "CORE/loja/checkout/deliveries/delivery-2026-11-06-229.md",
  ]) {
    assert.ok(existsSync(join(centralDocs, rel)), rel);
  }
});

test("sessão já entregue: publica só os arquivos e a página-índice, sem tocar em feature/delivery; a --proxima avança (#229)", async () => {
  const { ws, envFile, centralDocs } = workspaceFixture();
  // Central docs com a funcionalidade e a entrega do card 229 já publicadas
  const feature = "---\nid: FEAT-1\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\n---\n# Checkout (editado à mão)\n";
  const delivery = "---\nid: DEL-1\nfeature: feature-checkout.md\ntask_key: 229\npr: \"#230\"\ndate: 2026-10-15\n---\n# Entrega (editada à mão)\n";
  write(join(centralDocs, "CORE/loja/checkout/checkout.md"), feature);
  write(join(centralDocs, "CORE/loja/checkout/deliveries/delivery-2026-10-15-229.md"), delivery);
  // sessões 229 (entregue) e 300 (pendente, sem entrega)
  write(join(ws, ".jarvis/sessions/eng/229/architecture.md"), "# Arquitetura\n");
  write(join(ws, ".jarvis/sessions/eng/300/architecture.md"), "# Outra\n");
  write(join(ws, ".jarvis/sessions/eng/229/consolidation/session-229.md"), "---\nid: SES-229\nname: Sessão 229\n---\n# Sessão 229\n[entrega](../../checkout/deliveries/delivery-2026-10-15-229.md)\n");
  write(
    join(ws, ".jarvis/sessions/eng/229/consolidation/manifest.json"),
    JSON.stringify([
      { file: "../architecture.md", tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true, originalPath: join(ws, ".jarvis/sessions/eng/229/architecture.md") },
      { file: "session-229.md", tipo: "history", feature: "checkout", taskKey: "229", relPath: "229.md", fromSession: true },
    ])
  );
  const proxima = async () => {
    const out = [];
    const w = process.stdout.write;
    process.stdout.write = (s) => (out.push(String(s)), true);
    try {
      await docsSessions({ proxima: true, "env-file": envFile });
    } finally {
      process.stdout.write = w;
    }
    return out.join("").trim();
  };
  assert.equal(await proxima(), "229", "antes: a 229 é a primeira pendente (entregue, mas sem a página-índice)");

  const manifest = join(ws, ".jarvis/sessions/eng/229/consolidation/manifest.json");
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);

  assert.equal(readFileSync(join(centralDocs, "CORE/loja/checkout/checkout.md"), "utf-8"), feature, "a página da funcionalidade não muda");
  assert.equal(readFileSync(join(centralDocs, "CORE/loja/checkout/deliveries/delivery-2026-10-15-229.md"), "utf-8"), delivery, "o registro da entrega não muda");
  assert.ok(existsSync(join(centralDocs, "CORE/loja/checkout/decisions/architecture-229.md")));
  assert.ok(existsSync(join(centralDocs, "CORE/loja/history/229/229.md")));
  assert.equal(await proxima(), "300", "depois: a próxima pendente é a 300");
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
