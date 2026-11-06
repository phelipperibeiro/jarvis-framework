// Testes de validate-frontmatter.js: status aceitos sem aviso. Rode com: npm run test:filtro
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateFrontmatter } from "../bin/lib/docs/validate-frontmatter.js";

function featureWithStatus(status) {
  return `---
id: FEAT-001
name: Checkout
status: ${status}
product: loja
updated_at: 2026-10-15
---
# Checkout
`;
}

function warningsFor(t, status) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-frontmatter-"));
  t.after(() => {
    mock.reset();
    rmSync(dir, { recursive: true, force: true });
  });
  const file = join(dir, "feature-checkout.md");
  writeFileSync(file, featureWithStatus(status));
  const warn = mock.method(console, "warn", () => {});
  validateFrontmatter(file, "feature");
  return warn.mock.callCount();
}

test("validateFrontmatter: superseded (status da SPEC) não gera aviso", (t) => {
  assert.equal(warningsFor(t, "superseded"), 0);
});

test("validateFrontmatter: status fora da lista gera aviso", (t) => {
  assert.equal(warningsFor(t, "inventado"), 1);
});

test("validateFrontmatter: labels no padrão (minúsculas, hífen) passa sem erro", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-frontmatter-"));
  try {
    const file = join(dir, "feature-checkout.md");
    writeFileSync(
      file,
      "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\nlabels: arquitetura, decisao\n---\n"
    );
    const metadata = validateFrontmatter(file, "feature");
    assert.equal(metadata.labels, "arquitetura, decisao");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validateFrontmatter: labels fora do padrão (maiúscula ou espaço) lança erro", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-frontmatter-"));
  try {
    const file = join(dir, "feature-checkout.md");
    writeFileSync(
      file,
      "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\nlabels: Arquitetura, item errado\n---\n"
    );
    assert.throws(() => validateFrontmatter(file, "feature"), /Labels fora do padrão/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validateFrontmatter: tipo sem campo obrigatório e sem frontmatter não lança erro (ex.: swagger)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-frontmatter-"));
  try {
    const file = join(dir, "swagger-api.yaml");
    writeFileSync(file, "openapi: 3.0.3\ninfo:\n  title: API\n");
    assert.deepEqual(validateFrontmatter(file, "swagger"), {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("validateFrontmatter: product e home exigem seus próprios campos", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-frontmatter-"));
  try {
    const product = join(dir, "loja.md");
    writeFileSync(product, "---\nid: PROD-loja\n---\n");
    assert.throws(() => validateFrontmatter(product, "product"), /Campos obrigatórios/);

    const home = join(dir, "home.md");
    writeFileSync(home, "---\nname: CORE\n---\n");
    assert.deepEqual(validateFrontmatter(home, "home"), { name: "CORE" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
