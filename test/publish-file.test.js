// Testes de publish-file.js (destino na estrutura única + publicação pelo adaptador).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publishFile, resolveDestPath, VALID_TYPES } from "../bin/lib/docs/publish-file.js";
import { createFilesystemStorage } from "../bin/lib/docs/storage/filesystem.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

test("VALID_TYPES: tipos de produto e de engenharia (Q2 da #143)", () => {
  assert.deepEqual([...VALID_TYPES].sort(), [
    "ard",
    "epic",
    "feat",
    "frd",
    "prd",
    "qa-report",
    "rfc",
    "story",
    "swagger",
    "task",
  ]);
});

test("resolveDestPath: usa o nome do arquivo local quando ele segue {tipo}-…", () => {
  const r = resolveDestPath({
    tipo: "prd",
    squad: "CORE",
    produto: "loja",
    localFile: "./docs/product/prd-001-checkout.md",
  });
  assert.deepEqual(r, {
    destPath: "CORE/product/loja/prd-001-checkout.md",
    area: "product",
    fileName: "prd-001-checkout.md",
  });
});

test("resolveDestPath: produto e engenharia vão para a área certa", () => {
  const area = (tipo) =>
    resolveDestPath({ tipo, squad: "CORE", produto: "loja", localFile: `${tipo}-001-x.md` }).area;
  for (const t of ["prd", "frd", "feat", "epic", "story", "task"])
    assert.equal(area(t), "product", t);
  for (const t of ["ard", "rfc", "qa-report"]) assert.equal(area(t), "engineering", t);
});

test("resolveDestPath: nome fora do padrão usa --feature (mantendo a extensão)", () => {
  const r = resolveDestPath({
    tipo: "swagger",
    squad: "CORE",
    produto: "api",
    localFile: "./openapi.yaml",
    feature: "wallet",
  });
  assert.equal(r.destPath, "CORE/engineering/api/swagger-wallet.yaml");
});

test("resolveDestPath: nome fora do padrão sem --feature lança erro orientando", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "prd", squad: "CORE", produto: "loja", localFile: "meu-doc.md" }),
    /--feature/
  );
});

test("resolveDestPath: rejeita tipo inválido e segmentos com / ou ..", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "xyz", squad: "CORE", produto: "p", localFile: "xyz-1.md" }),
    /Tipos válidos/
  );
  assert.throws(
    () => resolveDestPath({ tipo: "prd", squad: "../x", produto: "p", localFile: "prd-1.md" }),
    /Squad inválido/
  );
  assert.throws(
    () => resolveDestPath({ tipo: "prd", squad: "CORE", produto: "a/b", localFile: "prd-1.md" }),
    /Produto inválido/
  );
});

test("publishFile: sem adaptador (Central docs desligado) lança erro", async () => {
  await assert.rejects(
    () =>
      publishFile({ storage: null, localFile: "x.md", tipo: "prd", squad: "CORE", produto: "p" }),
    /desligado/
  );
});

test("publishFile: frontmatter inválido lança erro antes de gravar", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const file = join(dir, "prd-001-x.md");
    writeFileSync(file, "---\nid: PRD-001\n---\n");
    const storage = createFilesystemStorage({ location: dir });
    await assert.rejects(
      () => publishFile({ storage, localFile: file, tipo: "prd", squad: "CORE", produto: "p" }),
      /Campos obrigatórios/
    );
    assert.equal(existsSync(join(dir, "CORE")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFile: épico publica em product/ e entra no índice", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const file = join(dir, "epic-001-pagamentos.md");
    writeFileSync(
      file,
      "---\nid: EPIC-001\nname: Pagamentos\nversion: 1.0.0\nstatus: backlog\nrelated_prd: prd-001-x.md\n---\n"
    );
    const location = join(dir, "cd");
    const storage = createFilesystemStorage({ location });
    mkdirSync(location);

    const r = await publishFile({
      storage,
      localFile: file,
      tipo: "epic",
      squad: "CORE",
      produto: "loja",
    });
    assert.equal(r.destPath, "CORE/product/loja/epic-001-pagamentos.md");
    const index = readFileSync(join(location, "CORE", "index.md"), "utf-8");
    assert.match(
      index,
      /\[epic-001-pagamentos\.md\]\(product\/loja\/epic-001-pagamentos\.md\) \| v1\.0\.0 \| backlog \| Pagamentos/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
