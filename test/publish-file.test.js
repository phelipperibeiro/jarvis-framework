// Testes de publish-file.js: o Central docs publica na estrutura por funcionalidade
// ({squad}/{produto}/{funcionalidade}/…, #220). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  publishFile,
  resolveDestPath,
  VALID_TYPES,
  DECISION_DOC_TYPES,
} from "../bin/lib/docs/publish-file.js";
import { createFilesystemStorage } from "../bin/lib/docs/storage/filesystem.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

const FEATURE = `---
id: FEAT-001
name: Checkout
status: in_production
product: loja
updated_at: 2026-10-15
---
# Checkout
`;

const DELIVERY = `---
id: DEL-2026-10-15-task-123
feature: feature-checkout.md
task_key: TASK-123
pr: "#42"
date: 2026-10-15
---
# Entrega
`;

const PRD = `---
id: PRD-001
name: Checkout
version: "1.0"
status: in_production
---
# PRD
`;

test("VALID_TYPES: feature, delivery, product, history e os tipos de decisão", () => {
  assert.ok(VALID_TYPES.includes("feature"));
  assert.ok(VALID_TYPES.includes("delivery"));
  assert.ok(VALID_TYPES.includes("product"));
  assert.ok(VALID_TYPES.includes("history"));
  for (const tipo of DECISION_DOC_TYPES) assert.ok(VALID_TYPES.includes(tipo), tipo);
});

test("resolveDestPath: feature vira a página da funcionalidade, sem o prefixo 'feature-'", () => {
  assert.deepEqual(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "/s/feature-checkout.md",
    }),
    {
      destPath: "CORE/loja/checkout/checkout.md",
      area: "feature",
      fileName: "checkout.md",
    }
  );
});

test("resolveDestPath: feature fora do padrão usa --feature; sem ele, erro orientando", () => {
  assert.equal(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "x.md",
      feature: "pix",
    }).destPath,
    "CORE/loja/pix/pix.md"
  );
  assert.throws(
    () => resolveDestPath({ tipo: "feature", squad: "CORE", produto: "loja", localFile: "x.md" }),
    /--feature/
  );
});

test("resolveDestPath: delivery exige --feature e mora em deliveries/ dentro da funcionalidade", () => {
  assert.equal(
    resolveDestPath({
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
      localFile: "delivery-2026-10-15-task-123.md",
      feature: "checkout",
    }).destPath,
    "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md"
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "delivery",
        squad: "CORE",
        produto: "loja",
        localFile: "delivery-2026-10-15-task-123.md",
      }),
    /--feature/
  );
});

test("resolveDestPath: documento de trabalho (prd, ard…) vai para decisions/ da funcionalidade, exige --feature", () => {
  for (const tipo of DECISION_DOC_TYPES) {
    assert.equal(
      resolveDestPath({
        tipo,
        squad: "CORE",
        produto: "loja",
        localFile: `${tipo}-001-checkout.md`,
        feature: "checkout",
      }).destPath,
      `CORE/loja/checkout/decisions/${tipo}-001-checkout.md`,
      tipo
    );
    assert.throws(
      () => resolveDestPath({ tipo, squad: "CORE", produto: "loja", localFile: `${tipo}-1.md` }),
      /--feature/,
      tipo
    );
  }
});

test("resolveDestPath: product vai para {produto}.md, sem --feature", () => {
  assert.equal(
    resolveDestPath({
      tipo: "product",
      squad: "CORE",
      produto: "loja",
      localFile: "qualquer.md",
    }).destPath,
    "CORE/loja/loja.md"
  );
});

test("resolveDestPath: history exige --task-key e mora em history/{chave}/", () => {
  assert.equal(
    resolveDestPath({
      tipo: "history",
      squad: "CORE",
      produto: "loja",
      localFile: "gate-checklist.md",
      taskKey: "task-123",
    }).destPath,
    "CORE/loja/history/task-123/gate-checklist.md"
  );
  assert.throws(
    () =>
      resolveDestPath({ tipo: "history", squad: "CORE", produto: "loja", localFile: "daily.md" }),
    /--task-key/
  );
});

test("resolveDestPath: rejeita tipo desconhecido e segmentos com / ou ..", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "xyz", squad: "CORE", produto: "p", localFile: "xyz-1.md" }),
    /Tipos válidos/
  );
  assert.throws(
    () =>
      resolveDestPath({ tipo: "feature", squad: "../x", produto: "p", localFile: "feature-1.md" }),
    /Squad inválido/
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "feature",
        squad: "CORE",
        produto: "a/b",
        localFile: "feature-1.md",
      }),
    /Produto inválido/
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "delivery",
        squad: "CORE",
        produto: "p",
        localFile: "delivery-1.md",
        feature: "../x",
      }),
    /Feature inválido/
  );
});

test("publishFile: sem adaptador (Central docs desligado) lança erro", async () => {
  await assert.rejects(
    () =>
      publishFile({
        storage: null,
        localFile: "x.md",
        tipo: "feature",
        squad: "CORE",
        produto: "p",
      }),
    /desligado/
  );
});

test("publishFile: frontmatter sem os campos da consolidação lança erro antes de gravar", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const file = join(dir, "feature-x.md");
    writeFileSync(file, "---\nid: FEAT-001\n---\n");
    const storage = createFilesystemStorage({ location: dir });
    await assert.rejects(
      () => publishFile({ storage, localFile: file, tipo: "feature", squad: "CORE", produto: "p" }),
      /Campos obrigatórios/
    );
    assert.equal(existsSync(join(dir, "CORE")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFile: entrega + funcionalidade + PRD ligado publicados entram no índice", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const location = join(dir, "cd");
    mkdirSync(location);
    const storage = createFilesystemStorage({ location });
    const delivery = join(dir, "delivery-2026-10-15-task-123.md");
    const feature = join(dir, "feature-checkout.md");
    const prd = join(dir, "prd-001-checkout.md");
    writeFileSync(delivery, DELIVERY);
    writeFileSync(feature, FEATURE);
    writeFileSync(prd, PRD);

    await publishFile({
      storage,
      localFile: delivery,
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
      feature: "checkout",
    });
    const r = await publishFile({
      storage,
      localFile: feature,
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
    });
    await publishFile({
      storage,
      localFile: prd,
      tipo: "prd",
      squad: "CORE",
      produto: "loja",
      feature: "checkout",
    });

    assert.equal(r.destPath, "CORE/loja/checkout/checkout.md");
    assert.ok(existsSync(join(location, "CORE/loja/checkout/decisions/prd-001-checkout.md")));

    const index = readFileSync(join(location, "CORE", "index.md"), "utf-8");
    assert.match(index, /- \[checkout\]\(loja\/checkout\/checkout\.md\) \| in_production \| Checkout \| 2026-10-15/);
    assert.match(
      index,
      /- \[delivery-2026-10-15-task-123\.md\]\(loja\/checkout\/deliveries\/delivery-2026-10-15-task-123\.md\) \| TASK-123 \| 2026-10-15/
    );
    // o PRD foi publicado (decisions/), mas o índice continua listando só o que foi implementado
    assert.doesNotMatch(index, /prd-001-checkout/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
