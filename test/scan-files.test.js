// Testes de scan-files.js e da trava de confirmação do publish (Q4 e Q15 da #229).
// Rode com: npm run test:filtro
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_BYTES, SECRET_RE, scanFile, secretKind } from "../bin/lib/docs/scan-files.js";
import { publishFiles } from "../bin/lib/docs/publish-file.js";
import { createFilesystemStorage } from "../bin/lib/docs/storage/filesystem.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

const created = [];
function tmp() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-scan-"));
  created.push(dir);
  return dir;
}
after(() => {
  for (const dir of created) rmSync(dir, { recursive: true, force: true });
});

function file(dir, name, content) {
  mkdirSync(join(dir, name, ".."), { recursive: true });
  writeFileSync(join(dir, name), content);
  return join(dir, name);
}

const kinds = (path) => scanFile(path).map((f) => f.kind);

test("scanFile: .md limpo não pede confirmação", () => {
  const dir = tmp();
  assert.deepEqual(scanFile(file(dir, "architecture.md", "# Arquitetura\n\nTexto normal, sem segredo. API_KEY= vazio.\n")), []);
});

test("scanFile: arquivo que não é Markdown pede confirmação (com a extensão)", () => {
  const dir = tmp();
  assert.deepEqual(scanFile(file(dir, "saida.txt", "ok\n")), [{ kind: "não é Markdown", detail: "extensão .txt" }]);
  assert.deepEqual(kinds(file(dir, "tokens.json", '{"a":1}')), ["não é Markdown"]);
  assert.deepEqual(kinds(file(dir, "Makefile", "all:\n")), ["não é Markdown"]);
  assert.equal(scanFile(file(dir, "Makefile2", "all:\n"))[0].detail, "sem extensão");
});

test("scanFile: binário (byte nulo) e acima de 1 MB", () => {
  const dir = tmp();
  const bin = join(dir, "img.png");
  writeFileSync(bin, Buffer.from([0x89, 0x50, 0x00, 0x47, 0x0d]));
  assert.deepEqual(kinds(bin), ["não é Markdown", "binário"]);
  const grande = join(dir, "grande.md");
  writeFileSync(grande, "a".repeat(MAX_BYTES + 10));
  assert.deepEqual(kinds(grande), ["acima de 1 MB"]);
  assert.match(scanFile(grande)[0].detail, /1\.0 MB/);
});

test("scanFile: possível segredo — chave sensível com valor longo; devolve a linha e a chave, nunca o valor", () => {
  const dir = tmp();
  const md = file(dir, "plan.md", [
    "# Plano",
    "Use a variável de ambiente.",
    'export API_KEY="abcdefghijklmnop1234"',
    "senha: valor-curto",
    'password = "ZZZZZZZZZZZZZZZZZZZZ"',
  ].join("\n"));
  const flags = scanFile(md);
  assert.deepEqual(flags.map((f) => f.detail), ['linha 3, chave "api_key"', 'linha 5, chave "password"']);
  assert.ok(flags.every((f) => f.kind === "possível segredo"));
  assert.ok(!JSON.stringify(flags).includes("abcdefghijklmnop1234"), "o valor do segredo não vaza");
  assert.ok(!JSON.stringify(flags).includes("ZZZZZZZZZZZZZZZZZZZZ"));
});

test("SECRET_RE: placeholders e valores curtos não casam", () => {
  for (const ok of ["API_KEY=", "token: <seu-token>", "secret = x", "password: 1234", "Authorization header", "tokens: 42"]) {
    assert.equal(SECRET_RE.test(ok), false, ok);
  }
  for (const bad of ["token: abcdefghijklmnopqrst", "access_key=AKIAABCDEFGHIJKLMNOP", "client-secret: 'abcdefghijklmnop'"]) {
    assert.equal(SECRET_RE.test(bad), true, bad);
  }
});

/** Workspace com Central docs e uma sessão com um .md limpo, um .txt, um .md com segredo e um binário. */
function publishFixture() {
  const dir = tmp();
  const root = join(dir, "cd");
  mkdirSync(root, { recursive: true });
  const storage = createFilesystemStorage({ location: root, root: dir });
  const arq = file(dir, "architecture.md", "# Arquitetura\n");
  const saida = file(dir, "saida.txt", "ok\n");
  const segredo = file(dir, "notas.md", "token: abcdefghijklmnopqrstuvwx\n");
  const bin = join(dir, "x.bin");
  writeFileSync(bin, Buffer.from([1, 0, 2]));
  const entry = (localFile, extra) => ({ localFile, tipo: "history", taskKey: "229", fromSession: true, ...extra });
  return { dir, root, storage, arq, saida, segredo, bin, entry };
}

test("publishFiles: arquivo de sessão sinalizado sem confirmed não é publicado — nada é gravado", async () => {
  const { root, storage, arq, saida, segredo, bin, entry } = publishFixture();
  await assert.rejects(
    publishFiles({
      storage,
      squad: "CORE",
      produto: "loja",
      files: [
        { localFile: arq, tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true },
        entry(saida, { relPath: "saida.txt" }),
        entry(segredo, { relPath: "notas.md" }),
        entry(bin, { relPath: "x.bin" }),
      ],
    }),
    (e) => {
      assert.match(e.message, /3 arquivo\(s\) da sessão precisam da sua confirmação/);
      assert.match(e.message, /history\/229\/saida\.txt: não é Markdown \(extensão \.txt\)/);
      assert.match(e.message, /history\/229\/notas\.md: possível segredo \(linha 1, chave "token"\)/);
      assert.match(e.message, /binário/);
      assert.doesNotMatch(e.message, /abcdefghijklmnopqrstuvwx/, "o valor do segredo não aparece na mensagem");
      return true;
    }
  );
  const { existsSync } = await import("node:fs");
  assert.equal(existsSync(join(root, "CORE")), false, "nenhum arquivo, nem o limpo, foi publicado");
});

test("publishFiles: com confirmed:true o arquivo sinalizado é publicado; só os sinalizados pedem confirmação", async () => {
  const { storage, arq, saida, segredo, entry } = publishFixture();
  const result = await publishFiles({
    storage,
    squad: "CORE",
    produto: "loja",
    files: [
      { localFile: arq, tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true },
      entry(saida, { relPath: "saida.txt", confirmed: true }),
      entry(segredo, { relPath: "notas.md", confirmed: true }),
    ],
  });
  assert.equal(result.published.length, 3);
  assert.deepEqual(result.alerts.map((a) => [a.destPath, a.confirmed]), [
    ["CORE/loja/history/229/saida.txt", true],
    ["CORE/loja/history/229/notas.md", true],
  ]);
});

test("publishFiles --dry-run: lista os alertas sem lançar e sem gravar; documentos que não são da sessão não são varridos", async () => {
  const { root, storage, saida, dir } = publishFixture();
  const prd = file(dir, "prd.txt", "token: abcdefghijklmnopqrstuvwx\n"); // fora da sessão: fluxo da #220, sem varredura
  const result = await publishFiles({
    storage,
    squad: "CORE",
    produto: "loja",
    dryRun: true,
    files: [
      { localFile: saida, tipo: "history", taskKey: "229", relPath: "saida.txt", fromSession: true },
      { localFile: prd, tipo: "swagger", feature: "checkout" },
    ],
  });
  assert.equal(result.dryRun, true);
  assert.deepEqual(result.alerts.map((a) => [a.destPath, a.confirmed]), [["CORE/loja/history/229/saida.txt", false]]);
  const { existsSync } = await import("node:fs");
  assert.equal(existsSync(join(root, "CORE")), false);
});

test("secretKind: pega chave com prefixo (GITHUB_TOKEN, OPENAI_API_KEY, DB_PASSWORD) e os outros formatos, sem devolver o valor (#229)", () => {
  const casos = [
    ["GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwx", 'chave "token"'],
    ["OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwx", 'chave "api_key"'],
    ["export DB_PASSWORD=abcdefghijklmnopqrstuvwx", 'chave "password"'],
    ["client-secret: 'abcdefghijklmnopqrstuvwx'", 'chave "secret"'],
    ["token: abcdefghijklmnopqrstuvwx", 'chave "token"'],
    ["-----BEGIN RSA PRIVATE KEY-----", "chave privada (PEM)"],
    ["-----BEGIN PRIVATE KEY-----", "chave privada (PEM)"],
    ["postgres://usuario:senhaSecreta@host:5432/db", "credencial dentro de uma URL"],
    ["Authorization: Bearer abcdefghijklmnopqrstuvwxyz", "token Bearer"],
    ["use ghp_abcdefghijklmnopqrstuvwxyz0123 aqui", "token com prefixo conhecido"],
    ["glpat-abcdefghijklmnopqrstu", "token com prefixo conhecido"],
    ["AKIAABCDEFGHIJKLMNOP", "token com prefixo conhecido"],
  ];
  for (const [linha, esperado] of casos) {
    const kind = secretKind(linha);
    assert.equal(kind, esperado, linha);
    assert.ok(!kind.includes("abcdefghijklmnop") && !kind.includes("senhaSecreta"), "o valor não vaza");
  }
});

test("secretKind: placeholders, valores curtos e URLs comuns não geram falso positivo", () => {
  for (const ok of [
    "API_KEY=",
    "token: <seu-token>",
    "tokens: 42",
    "password: 1234",
    "git@github.com:o/r.git",
    "https://github.com/o/r/issues/229",
    "ssh://git@github.com/o/r.git",
    "O token de acesso fica no .npmrc.",
    "senha: valor-curto",
  ]) {
    assert.equal(secretKind(ok), null, ok);
  }
});

test("secretKind: linha enorme não trava (busca linear)", () => {
  const t0 = Date.now();
  secretKind("a-".repeat(500000));
  secretKind("a".repeat(1000000));
  secretKind("token=".repeat(100000));
  assert.ok(Date.now() - t0 < 2000, `levou ${Date.now() - t0} ms`);
});

test("scanFile: marca GITHUB_TOKEN= num .md e mostra só a linha e a chave", () => {
  const dir = tmp();
  const md = file(dir, "env.md", "# Env\nGITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwx\n");
  const flags = scanFile(md);
  assert.deepEqual(flags.map((f) => f.detail), ['linha 2, chave "token"']);
  assert.ok(!JSON.stringify(flags).includes("ghp_"));
});
