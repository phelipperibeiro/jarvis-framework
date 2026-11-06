// Teste ponta a ponta da #229: as sessões vão inteiras para o Central docs (publicar → arquivar →
// finalizar), com links convertidos, versão por hash, quebra por funcionalidade, trava de
// confirmação e o estado "pendente" do modo uma sessão por vez. Tudo em pasta temporária, com um
// repositório git real para os links de código. Rode com: npm run test:filtro
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import { docsPublish } from "../bin/commands/docs-publish.js";
import { docsArchive } from "../bin/commands/docs-archive.js";
import { docsFinalize } from "../bin/commands/docs-finalize.js";
import { docsSessions } from "../bin/commands/docs-sessions.js";
import { relativeLinkTargets } from "../bin/lib/docs/check-links.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

const created = [];
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-e2e-"));
  created.push(dir);
  return dir;
}
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

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

async function stdoutOf(fn) {
  const out = [];
  const w = process.stdout.write;
  process.stdout.write = (s) => (out.push(String(s)), true);
  try {
    await fn();
  } finally {
    process.stdout.write = w;
  }
  return out.join("");
}

/** Todos os arquivos .md de uma pasta, recursivamente. */
function walkMd(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walkMd(p) : p.endsWith(".md") ? [p] : [];
  });
}

const ARQ = (extra = "") =>
  [
    "> **Commit base:** `jarvis-framework@abc1234`",
    "# Arquitetura 229",
    "Plano: [plan](plan.md#fase-1).",
    "Código: [`x` (`x.js:5`)](../../../../jarvis-framework/bin/x.js#L5).",
    "PRD: [prd](../../../../docs/jarvis/product/prd.md). Card: [#229](https://github.com/o/r/issues/229).",
    extra,
  ].join("\n") + "\n";
const PLAN = "# Plano\nVeja a [arquitetura](architecture.md).\n## Fase 1\n";

/** Workspace com ENV, Central docs (filesystem, sem git), um repositório git real e as sessões 229 e 230. */
function fixture() {
  const ws = tmp();
  const centralDocs = join(ws, "central-docs");
  mkdirSync(centralDocs, { recursive: true });
  const envFile = join(ws, ".claude/ENV.md");
  write(envFile, ["CENTRAL_DOCS_STORAGE=filesystem", `CENTRAL_DOCS_LOCATION=${centralDocs}`, "SQUAD=CORE", "WORKSPACE=loja"].join("\n"));

  // repositório de código, para os links de código virarem URL do GitHub
  const repo = join(ws, "jarvis-framework");
  mkdirSync(join(repo, "bin"), { recursive: true });
  writeFileSync(join(repo, "bin/x.js"), "// x\n");
  const git = (...a) => execFileSync("git", a, { cwd: repo, stdio: "ignore" });
  git("init", "-q");
  git("remote", "add", "origin", "git@github.com:o/jarvis-framework.git");

  const s229 = join(ws, ".jarvis/sessions/eng/229");
  write(join(s229, "architecture.md"), ARQ());
  write(join(s229, "plan.md"), PLAN);
  write(join(s229, "context.md"), "# Contexto\n");
  write(join(s229, "ferramentas/saidas/E8.txt"), "saída\n");
  write(join(s229, "medicao.json"), '{"a":1}\n');
  write(join(s229, ".timestamp_start"), "2026-11-06T00:00:00Z");
  write(
    join(s229, "consolidation/session-229.md"),
    "---\nid: SES-229\nname: Sessão 229\n---\n# Sessão 229\n[arquitetura](../../checkout/decisions/architecture-229.md) · [plano](../../checkout/decisions/plan-229-checkout.md)\n"
  );
  write(join(s229, "consolidation/plan-frete.md"), "# Plano (parte frete)\n## Fase 2\n");

  const s230 = join(ws, ".jarvis/sessions/eng/230");
  write(join(s230, "architecture.md"), "# Arquitetura 230\n");

  const base = (extra) => ({ feature: "checkout", taskKey: "229", fromSession: true, ...extra });
  const orig = (rel) => join(s229, rel);
  const manifest = join(s229, "consolidation/manifest.json");
  const entries = [
    base({ file: "../architecture.md", tipo: "architecture", originalPath: orig("architecture.md") }),
    // o plano cobre duas funcionalidades: uma parte para cada (Q1)
    base({ file: "../plan.md", tipo: "plan", originalPath: orig("plan.md") }),
    base({ file: "plan-frete.md", tipo: "plan", feature: "frete", originalPath: orig("plan.md") }),
    base({ file: "../context.md", tipo: "history", relPath: "context.md", originalPath: orig("context.md") }),
    base({ file: "../ferramentas/saidas/E8.txt", tipo: "history", relPath: "ferramentas/saidas/E8.txt", confirmed: true, originalPath: orig("ferramentas/saidas/E8.txt") }),
    base({ file: "../medicao.json", tipo: "history", relPath: "medicao.json", confirmed: true, originalPath: orig("medicao.json") }),
    base({ file: "session-229.md", tipo: "history", relPath: "229.md" }), // página-índice: sem originalPath
  ];
  write(manifest, JSON.stringify(entries));
  return { ws, envFile, centralDocs, s229, s230, manifest, entries };
}

const CD = (p) => `CORE/loja/${p}`;

test("e2e: dry-run, publicação, links convertidos, nada duplicado, versão por hash e links que resolvem", async () => {
  const { envFile, centralDocs, s229, manifest } = fixture();

  // 1) simulação: mostra o plano e não grava nada
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", dryRun: true, "env-file": envFile })), 0);
  assert.equal(existsSync(join(centralDocs, "CORE")), false);

  // 2) publicação
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  for (const rel of [
    "checkout/decisions/architecture-229.md",
    "checkout/decisions/plan-229-checkout.md", // o plano quebrado ganha o card e a funcionalidade
    "frete/decisions/plan-229-frete.md",
    "history/229/context.md",
    "history/229/ferramentas/saidas/E8.txt",
    "history/229/medicao.json",
    "history/229/229.md",
  ]) {
    assert.ok(existsSync(join(centralDocs, CD(rel))), rel);
  }

  // 3) links: de outro arquivo da entrega, de código (repo git real) e de docs/jarvis
  const arq = readFileSync(join(centralDocs, CD("checkout/decisions/architecture-229.md")), "utf-8");
  assert.match(arq, /\[plan\]\(plan-229-checkout\.md#fase-1\)/);
  assert.match(arq, /\[`x` \(`x\.js:5`\)\]\(https:\/\/github\.com\/o\/jarvis-framework\/blob\/abc1234\/bin\/x\.js#L5\)/);
  assert.match(arq, /PRD: prd\./, "docs/jarvis vira texto");
  assert.match(arq, /\[#229\]\(https:\/\/github\.com\/o\/r\/issues\/229\)/);
  assert.equal(readFileSync(join(s229, "architecture.md"), "utf-8"), ARQ(), "o original na sessão não muda");

  // 4) o manifesto guarda onde cada arquivo foi parar
  let saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].publishedAs, CD("checkout/decisions/architecture-229.md"));
  assert.equal(saved[2].publishedAs, CD("frete/decisions/plan-229-frete.md"));
  assert.equal(saved[6].publishedAs, CD("history/229/229.md"));

  // 5) mesma sessão de novo: nada de -v1
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  assert.equal(existsSync(join(centralDocs, CD("checkout/decisions/architecture-229-v1.md"))), false);

  // 6) a sessão mudou: a nova versão entra como -v1 e a anterior permanece
  write(join(s229, "architecture.md"), ARQ("Linha nova."));
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].publishedAs, CD("checkout/decisions/architecture-229-v1.md"));
  assert.match(readFileSync(join(centralDocs, CD("checkout/decisions/architecture-229-v1.md")), "utf-8"), /Linha nova\./);
  assert.doesNotMatch(readFileSync(join(centralDocs, CD("checkout/decisions/architecture-229.md")), "utf-8"), /Linha nova\./);

  // 7) migrável: todo link relativo das páginas publicadas resolve dentro do Central docs
  //    (archive/ fica de fora: guarda o original byte a byte, fora do índice e da migração)
  const quebrados = [];
  for (const page of walkMd(join(centralDocs, "CORE")).filter((p) => !p.includes(`${posix.sep}archive${posix.sep}`))) {
    for (const link of relativeLinkTargets(readFileSync(page, "utf-8"))) {
      if (!existsSync(join(dirname(page), decodeURIComponent(link)))) quebrados.push(`${page.replace(centralDocs, "")}: ${link}`);
    }
  }
  assert.deepEqual(quebrados, [], "links relativos que não resolvem no Central docs");
});

test("e2e: publicar → arquivar → finalizar tira a sessão do disco e mantém tudo no Central docs; o que não está no manifesto fica", async () => {
  const { envFile, centralDocs, s229, manifest } = fixture();
  write(join(s229, "nota-solta.md"), "# Fora do manifesto\n");

  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  assert.equal(await captureRun(() => docsArchive({ manifest, "env-file": envFile })), 0, "arquivar");
  const saved = JSON.parse(readFileSync(manifest, "utf-8"));
  assert.equal(saved[0].archiveDestPath, CD("checkout/archive/architecture-229.md"));
  assert.equal(saved[4].archiveDestPath, CD("checkout/archive/229/ferramentas/saidas/E8.txt"));
  assert.ok(existsSync(join(s229, "architecture.md")), "arquivar não apaga");

  assert.equal(await captureRun(() => docsFinalize({ manifest, "env-file": envFile })), 0, "finalizar");
  for (const rel of ["architecture.md", "plan.md", "context.md", "ferramentas/saidas/E8.txt", "medicao.json"]) {
    assert.equal(existsSync(join(s229, rel)), false, `${rel} saiu da sessão`);
  }
  assert.ok(existsSync(join(s229, "nota-solta.md")), "o que não estava no manifesto permanece");
  assert.ok(existsSync(join(s229, ".timestamp_start")), "os metadados da sessão permanecem (o Passo 9.1 do workflow oferece apagar a pasta)");
  // tudo continua no Central docs: a cópia publicada e a arquivada (byte a byte, com os links originais)
  assert.ok(existsSync(join(centralDocs, CD("history/229/medicao.json"))));
  assert.equal(readFileSync(join(centralDocs, CD("checkout/archive/architecture-229.md")), "utf-8"), ARQ());
});

test("e2e: o --force apaga a sessão conferindo a cópia publicada e mantém as de outros cards", async () => {
  const { envFile, centralDocs, s229, s230, manifest } = fixture();
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", force: true, "env-file": envFile })), 0);
  assert.equal(existsSync(join(s229, "architecture.md")), false);
  assert.equal(existsSync(join(s229, "medicao.json")), false);
  assert.ok(existsSync(join(s230, "architecture.md")), "a sessão do card 230 não é tocada");
  assert.equal(existsSync(join(centralDocs, CD("checkout/archive"))), false, "o --force não arquiva");
});

test("e2e: dois cards na mesma funcionalidade não colidem em decisions/", async () => {
  const { ws, envFile, centralDocs, manifest, s230 } = fixture();
  const m230 = join(ws, "m230.json");
  write(m230, JSON.stringify([{ file: ".jarvis/sessions/eng/230/architecture.md", tipo: "architecture", feature: "checkout", taskKey: "230", fromSession: true, originalPath: join(s230, "architecture.md") }]));
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  assert.equal(await captureRun(() => docsPublish({ manifest: m230, slug: "230", "env-file": envFile })), 0);
  assert.equal(readFileSync(join(centralDocs, CD("checkout/decisions/architecture-230.md")), "utf-8"), "# Arquitetura 230\n");
  assert.match(readFileSync(join(centralDocs, CD("checkout/decisions/architecture-229.md")), "utf-8"), /Arquitetura 229/);
  assert.equal(existsSync(join(centralDocs, CD("checkout/decisions/architecture-230-v1.md"))), false, "não é revisão do 229");
});

test("e2e: o modo uma sessão por vez — a página-índice publicada tira a sessão das pendentes", async () => {
  const { envFile, manifest } = fixture();
  const proxima = async () => (await stdoutOf(() => docsSessions({ proxima: true, "env-file": envFile }))).trim();
  assert.equal(await proxima(), "229", "a 229 vem primeiro (ordem numérica)");
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 0);
  assert.equal(await proxima(), "230", "publicada a página-índice da 229, a próxima pendente é a 230");

  const data = JSON.parse(await stdoutOf(() => docsSessions({ json: true, "env-file": envFile })));
  const by = Object.fromEntries(data.sessoes.map((s) => [s.card, s]));
  assert.equal(by["229"].pendente, false);
  assert.equal(by["229"].capituloPublicado, true);
  assert.deepEqual(by["230"].ausentes, ["plan.md", "context.md"], "a sessão incompleta aparece com o que falta");
  assert.equal(by["230"].pendente, true);
});

test("e2e: a trava de confirmação — sem confirmed, nem o .txt nem os arquivos limpos são publicados", async () => {
  const { envFile, centralDocs, manifest, entries } = fixture();
  write(manifest, JSON.stringify(entries.map((e) => (e.confirmed ? { ...e, confirmed: undefined } : e))));
  assert.equal(await captureRun(() => docsPublish({ manifest, slug: "229", "env-file": envFile })), 1);
  assert.equal(existsSync(join(centralDocs, "CORE")), false);
});
