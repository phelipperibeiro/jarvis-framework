// Testes de finish-delivery.js: arquivar e finalizar uma entrega consolidada (#220).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  archiveEntries,
  finalizeEntries,
  forceFinalize,
  rewriteRelatedRefs,
} from "../bin/lib/docs/finish-delivery.js";

function write(file, content) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

function tmp() {
  return mkdtempSync(join(tmpdir(), "jarvis-finish-delivery-"));
}

test("archiveEntries: copia o original para archive/, marca hash e destino; não apaga nada", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-001-checkout.md");
    write(original, "---\nid: PRD-001\n---\n# PRD\n");

    const entries = [
      { tipo: "prd", feature: "checkout", originalPath: original },
      { tipo: "feature", feature: "checkout" }, // sem originalPath: não é arquivado
    ];

    const { archived, skipped, errors } = archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    assert.equal(errors.length, 0);
    assert.equal(skipped.length, 0);
    assert.equal(archived.length, 1);
    assert.equal(archived[0].archiveDestPath, "CORE/loja/checkout/archive/prd-001-checkout.md");
    assert.ok(existsSync(join(root, "CORE/loja/checkout/archive/prd-001-checkout.md")));
    assert.ok(existsSync(original), "o original continua onde estava");
    assert.equal(entries[0].archivedHash.length, 64, "sha256 em hex");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archiveEntries: original ausente vira erro; destino já arquivado vira 'pulado'", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-002.md");
    write(original, "# PRD\n");
    write(join(root, "CORE/loja/checkout/archive/prd-002.md"), "# já estava aqui\n");

    const { archived, skipped, errors } = archiveEntries({
      root,
      squad: "CORE",
      produto: "loja",
      entries: [
        { tipo: "prd", feature: "checkout", originalPath: original },
        { tipo: "prd", feature: "checkout", originalPath: join(dir, "nao-existe.md") },
      ],
    });

    assert.equal(archived.length, 0);
    assert.equal(skipped.length, 1);
    assert.equal(skipped[0].reason, "já arquivado");
    assert.equal(errors.length, 1);
    assert.match(errors[0], /não encontrado/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteRelatedRefs: troca related_prd pelo caminho no Central docs só quando o basename casa", () => {
  const dir = tmp();
  try {
    const prodDocs = join(dir, "docs/jarvis/product");
    write(
      join(prodDocs, "frd-001-checkout.md"),
      "---\nid: FRD-001\nrelated_prd: prd-001-checkout.md\n---\n# FRD\n"
    );
    write(
      join(prodDocs, "frd-002-outro.md"),
      "---\nid: FRD-002\nrelated_prd: prd-999-outro.md\n---\n# FRD\n"
    );
    const env = { PROD_DOCS: prodDocs };

    const changed = rewriteRelatedRefs(env, "prd-001-checkout.md", "CORE/loja/checkout/archive/prd-001-checkout.md");

    assert.equal(changed.length, 1);
    assert.match(
      readFileSync(join(prodDocs, "frd-001-checkout.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/checkout\/archive\/prd-001-checkout\.md/
    );
    assert.match(readFileSync(join(prodDocs, "frd-002-outro.md"), "utf-8"), /prd-999-outro\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: apaga o original só se o hash não mudou desde o --archive", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const unchanged = join(dir, "docs-jarvis/prd-001.md");
    const edited = join(dir, "docs-jarvis/prd-002.md");
    write(unchanged, "# PRD 1\n");
    write(edited, "# PRD 2 (original)\n");

    const entries = [
      { tipo: "prd", feature: "a", originalPath: unchanged },
      { tipo: "prd", feature: "b", originalPath: edited },
    ];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    // o segundo documento é editado DEPOIS do --archive
    writeFileSync(edited, "# PRD 2 (editado depois do archive)\n");

    const { finalized, changed, errors } = finalizeEntries({ entries });

    assert.equal(errors.length, 0);
    assert.equal(finalized.length, 1);
    assert.equal(finalized[0].originalPath, unchanged);
    assert.equal(existsSync(unchanged), false, "o que não mudou foi apagado");

    assert.equal(changed.length, 1);
    assert.equal(changed[0].originalPath, edited);
    assert.equal(existsSync(edited), true, "o que mudou NÃO foi apagado");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: idempotente — rodar duas vezes não falha nem apaga de novo", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/prd-001.md");
    write(original, "# PRD\n");
    const entries = [{ tipo: "prd", feature: "a", originalPath: original }];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    const r1 = finalizeEntries({ entries });
    assert.equal(r1.finalized.length, 1);

    const r2 = finalizeEntries({ entries });
    assert.equal(r2.finalized.length, 0);
    assert.equal(r2.errors.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forceFinalize: apaga o original direto, sem archive/, e reescreve related_*", () => {
  const dir = tmp();
  try {
    const prodDocs = join(dir, "docs-jarvis/product");
    const original = join(prodDocs, "prd-001-checkout.md");
    write(original, "# PRD\n");
    write(
      join(prodDocs, "frd-001-checkout.md"),
      "---\nrelated_prd: prd-001-checkout.md\n---\n# FRD\n"
    );
    const env = { PROD_DOCS: prodDocs };

    const { finalized, rewritten, errors } = forceFinalize({
      entries: [{ tipo: "prd", feature: "checkout", originalPath: original }],
      squad: "CORE",
      produto: "loja",
      env,
    });

    assert.equal(errors.length, 0);
    assert.equal(finalized.length, 1);
    assert.equal(existsSync(original), false);
    assert.equal(rewritten.length, 1);
    assert.match(
      readFileSync(join(prodDocs, "frd-001-checkout.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/checkout\/decisions\/prd-001-checkout\.md/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forceFinalize: entrada sem originalPath (feature/delivery/...) é ignorada", () => {
  const { finalized, errors } = forceFinalize({
    entries: [{ tipo: "feature", feature: "checkout" }],
    squad: "CORE",
    produto: "loja",
  });
  assert.deepEqual(finalized, []);
  assert.deepEqual(errors, []);
});

test("finalizeEntries: entrada sem archiveDestPath (não arquivada) é ignorada", () => {
  const original = "/tmp/jarvis-does-not-matter.md";
  const { finalized, changed, errors } = finalizeEntries({
    entries: [{ tipo: "prd", feature: "a", originalPath: original }],
  });
  assert.deepEqual(finalized, []);
  assert.deepEqual(changed, []);
  assert.deepEqual(errors, []);
});
