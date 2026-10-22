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
