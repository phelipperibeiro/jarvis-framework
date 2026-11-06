// Testes do inventário de sessões e do comando `jarvis docs sessions` (#229).
// Rode com: npm run test:filtro
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXPECTED_FILES,
  deliveredIndex,
  inventorySessions,
  listSessionFiles,
} from "../bin/lib/docs/session-inventory.js";
import { docsSessions } from "../bin/commands/docs-sessions.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

function write(file, content = "x") {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

const created = [];
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-sessions-"));
  created.push(dir);
  return dir;
}
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

const delivery = (key, extra = "") => `---\nid: DEL-${key}\nfeature: feature-x.md\ntask_key: ${key}\npr: "#1"\ndate: 2026-10-15\n${extra}---\n# Entrega\n`;

/** Workspace: sessões 1 (completa), 2 (só architecture), 14 (vazia), 83 (entregue), 100 e 9; Central docs com a entrega 83. */
function fixture({ publishChapterFor = [] } = {}) {
  const ws = tmp();
  const eng = join(ws, ".jarvis/sessions/eng");
  for (const f of EXPECTED_FILES) write(join(eng, "1", f));
  write(join(eng, "1", "ferramentas/saidas/E8.txt"), "ok");
  write(join(eng, "1", ".timestamp_start"), "2026-10-01T00:00:00Z");
  write(join(eng, "1", "consolidation/manifest.json"), "[]");
  write(join(eng, "2", "architecture.md"));
  mkdirSync(join(eng, "14"), { recursive: true });
  for (const f of EXPECTED_FILES) write(join(eng, "83", f));
  write(join(eng, "100", "architecture.md"));
  write(join(eng, "9", "architecture.md"));

  const central = join(ws, "central-docs");
  write(join(central, "CORE/loja/checkout/deliveries/delivery-2026-11-02-83.md"), delivery('"#83"'));
  write(join(central, "CORE/loja/checkout/checkout.md"), "# Checkout\n");
  write(join(central, "CORE/index.md"), "# CORE\n");
  for (const card of publishChapterFor) write(join(central, `CORE/loja/history/${card}/${card}.md`), "# Sessão\n");

  write(
    join(ws, ".claude/ENV.md"),
    ["CENTRAL_DOCS_STORAGE=filesystem", `CENTRAL_DOCS_LOCATION=${central}`, "SQUAD=CORE", "WORKSPACE=loja"].join("\n")
  );
  return { ws, eng, central, envFile: join(ws, ".claude/ENV.md") };
}

test("listSessionFiles: recursivo, ordenado, com tamanho; ignora ocultos e a pasta consolidation/ da raiz", () => {
  const { eng } = fixture();
  const files = listSessionFiles(join(eng, "1"));
  assert.deepEqual(
    files.map((f) => f.path),
    ["architecture.md", "context.md", "ferramentas/saidas/E8.txt", "plan.md"]
  );
  assert.ok(files.every((f) => f.bytes > 0));
  assert.deepEqual(listSessionFiles(join(eng, "nao-existe")), []);
});

test("listSessionFiles: uma pasta consolidation/ aninhada (fora da raiz) é conteúdo da sessão", () => {
  const dir = tmp();
  write(join(dir, "ferramentas/consolidation/x.txt"), "x");
  write(join(dir, "consolidation/y.txt"), "y");
  assert.deepEqual(listSessionFiles(dir).map((f) => f.path), ["ferramentas/consolidation/x.txt"]);
});

test("deliveredIndex: lê task_key do frontmatter (aspas e #), cai no nome do arquivo e ignora .public.md", () => {
  const dir = tmp();
  write(join(dir, "CORE/loja/a/deliveries/delivery-2026-10-01-83.md"), delivery('"#83"'));
  write(join(dir, "CORE/loja/b/deliveries/delivery-2026-10-02-TASK-7.md"), "# sem frontmatter\n");
  write(join(dir, "CORE/loja/b/deliveries/delivery-2026-10-02-TASK-7.public.md"), delivery("999"));
  write(join(dir, "CORE/loja/c/deliveries/delivery-2026-10-03-83-c.md"), delivery("83"));
  write(join(dir, "CORE/loja/c/c.md"), "# C\n");
  const index = deliveredIndex(dir, "CORE");
  assert.deepEqual(index.get("83").map((d) => `${d.feature}:${d.file}`), [
    "a:delivery-2026-10-01-83.md",
    "c:delivery-2026-10-03-83-c.md",
  ]);
  assert.deepEqual(index.get("task-7").map((d) => d.feature), ["b"]);
  assert.equal(index.has("999"), false);
  assert.equal(deliveredIndex(dir, "OUTRO").size, 0, "squad sem pasta");
});

test("inventorySessions: classifica completa, incompleta, vazia, entregue e pendente; ordem numérica", () => {
  const { eng, central } = fixture({ publishChapterFor: ["83"] });
  const inv = inventorySessions({ sessionsDir: eng, centralRoot: central, squad: "CORE", produto: "loja" });
  assert.deepEqual(inv.map((s) => s.card), ["1", "2", "9", "14", "83", "100"], "ordem numérica, não alfabética");
  const by = Object.fromEntries(inv.map((s) => [s.card, s]));

  assert.deepEqual(by["1"].ausentes, []);
  assert.equal(by["1"].delivered, false);
  assert.equal(by["1"].pendente, true);
  assert.ok(by["1"].totalBytes > 0);

  assert.deepEqual(by["2"].ausentes, ["plan.md", "context.md"]);
  assert.equal(by["14"].vazia, true);
  assert.equal(by["14"].files.length, 0);

  assert.equal(by["83"].delivered, true);
  assert.equal(by["83"].deliveries[0].feature, "checkout");
  assert.equal(by["83"].capituloPublicado, true);
  assert.equal(by["83"].pendente, false, "página-índice publicada: não está mais pendente");
});

test("inventorySessions: Central docs desligado → delivered e capituloPublicado nulos, tudo pendente", () => {
  const { eng } = fixture();
  const inv = inventorySessions({ sessionsDir: eng });
  assert.ok(inv.length > 0);
  assert.ok(inv.every((s) => s.delivered === null && s.capituloPublicado === null && s.pendente === true));
});

test("inventorySessions: pasta de sessões inexistente devolve lista vazia; pastas ocultas são ignoradas", () => {
  const dir = tmp();
  assert.deepEqual(inventorySessions({ sessionsDir: join(dir, "nada") }), []);
  write(join(dir, "eng/.oculta/a.md"));
  write(join(dir, "eng/5/a.md"));
  assert.deepEqual(inventorySessions({ sessionsDir: join(dir, "eng") }).map((s) => s.card), ["5"]);
});

/** Captura o que o comando escreve em stdout/stderr. */
async function capture(fn) {
  const out = [];
  const err = [];
  const w = process.stdout.write;
  const e = console.error;
  process.stdout.write = (s) => (out.push(String(s)), true);
  console.error = (...a) => err.push(a.join(" "));
  try {
    await fn();
  } finally {
    process.stdout.write = w;
    console.error = e;
  }
  return { out: out.join(""), err: err.join("\n") };
}

test("docsSessions --json: só dados em stdout, com o resumo de cada sessão", async () => {
  const { envFile } = fixture({ publishChapterFor: ["83"] });
  const { out } = await capture(() => docsSessions({ json: true, "env-file": envFile }));
  const data = JSON.parse(out);
  assert.equal(data.central, true);
  assert.deepEqual(data.sessoes.map((s) => s.card), ["1", "2", "9", "14", "83", "100"]);
  assert.equal(data.sessoes.find((s) => s.card === "83").pendente, false);
});

test("docsSessions --pendentes: tira as já publicadas", async () => {
  const { envFile } = fixture({ publishChapterFor: ["83", "1"] });
  const { out } = await capture(() => docsSessions({ json: true, pendentes: true, "env-file": envFile }));
  assert.deepEqual(JSON.parse(out).sessoes.map((s) => s.card), ["2", "9", "14", "100"]);
});

test("docsSessions --proxima: imprime só o menor card pendente e avança conforme as páginas-índice são publicadas", async () => {
  const a = fixture();
  assert.equal((await capture(() => docsSessions({ proxima: true, "env-file": a.envFile }))).out, "1\n");
  const b = fixture({ publishChapterFor: ["1", "2"] });
  assert.equal((await capture(() => docsSessions({ proxima: true, "env-file": b.envFile }))).out, "9\n");
  const c = fixture({ publishChapterFor: ["1", "2", "9", "14", "83", "100"] });
  const done = await capture(() => docsSessions({ proxima: true, "env-file": c.envFile }));
  assert.equal(done.out, "", "nada em stdout quando não há pendente");
  assert.match(done.err, /Nenhuma sessão pendente/);
});

test("docsSessions (saída em tabela): roda sem lançar, com e sem Central docs (o conteúdo é conferido pelo --json)", async () => {
  const { envFile } = fixture({ publishChapterFor: ["83"] });
  await assert.doesNotReject(capture(() => docsSessions({ "env-file": envFile })));
  const off = tmp();
  write(join(off, ".claude/ENV.md"), "SQUAD=CORE\nWORKSPACE=loja\n");
  write(join(off, ".jarvis/sessions/eng/5/architecture.md"));
  const { out } = await capture(() => docsSessions({ json: true, "env-file": join(off, ".claude/ENV.md") }));
  const data = JSON.parse(out);
  assert.equal(data.central, false);
  assert.deepEqual(data.sessoes.map((s) => [s.card, s.delivered, s.pendente]), [["5", null, true]]);
});

test("inventário: a página-índice publicada como TASK-123.md (card do board em maiúsculas) é reconhecida (#229)", () => {
  const dir = tmp();
  write(join(dir, "eng/task-123/architecture.md"));
  write(join(dir, "central/CORE/loja/history/task-123/TASK-123.md"), "# Sessão\n");
  const inv = inventorySessions({ sessionsDir: join(dir, "eng"), centralRoot: join(dir, "central"), squad: "CORE", produto: "loja" });
  assert.equal(inv[0].capituloPublicado, true);
  assert.equal(inv[0].pendente, false);
});
