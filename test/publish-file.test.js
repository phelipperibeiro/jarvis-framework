// Testes de publish-file.js: o Central docs recebe só a consolidação do
// /eng.spec-consolidate (feature + delivery). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  publishFile,
  resolveDestPath,
  VALID_TYPES,
  WORKING_DOC_TYPES,
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

test("VALID_TYPES: só a consolidação (feature, delivery)", () => {
  assert.deepEqual([...VALID_TYPES].sort(), ["delivery", "feature"]);
});

test("resolveDestPath: feature vai para product/ e delivery para engineering/, com o nome local", () => {
  assert.deepEqual(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "/s/feature-checkout.md",
    }),
    {
      destPath: "CORE/product/loja/feature-checkout.md",
      area: "product",
      fileName: "feature-checkout.md",
    }
  );
  assert.equal(
    resolveDestPath({
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
      localFile: "delivery-2026-10-15-task-123.md",
    }).destPath,
    "CORE/engineering/loja/delivery-2026-10-15-task-123.md"
  );
});

test("resolveDestPath: documento de trabalho (prd, ard…) é recusado com a explicação", () => {
  for (const tipo of WORKING_DOC_TYPES) {
    assert.throws(
      () => resolveDestPath({ tipo, squad: "CORE", produto: "loja", localFile: `${tipo}-1.md` }),
      /guarda só o que foi implementado.*\/eng\.spec-consolidate/s,
      tipo
    );
  }
});

test("resolveDestPath: a SPEC (Reference Spec) é documento de trabalho, não 'Tipo inválido'", () => {
  assert.ok(WORKING_DOC_TYPES.includes("spec"));
  assert.throws(
    () => resolveDestPath({ tipo: "spec", squad: "CORE", produto: "loja", localFile: "SPEC-001-x.md" }),
    /guarda só o que foi implementado.*\/eng\.spec-consolidate/s
  );
});

test("resolveDestPath: nome fora do padrão usa --feature; sem ele, erro orientando", () => {
  assert.equal(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "x.md",
      feature: "pix",
    }).destPath,
    "CORE/product/loja/feature-pix.md"
  );
  assert.throws(
    () => resolveDestPath({ tipo: "feature", squad: "CORE", produto: "loja", localFile: "x.md" }),
    /--feature/
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

test("publishFile: entrega + funcionalidade publicadas entram no índice", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const location = join(dir, "cd");
    mkdirSync(location);
    const storage = createFilesystemStorage({ location });
    const delivery = join(dir, "delivery-2026-10-15-task-123.md");
    const feature = join(dir, "feature-checkout.md");
    writeFileSync(delivery, DELIVERY);
    writeFileSync(feature, FEATURE);

    await publishFile({
      storage,
      localFile: delivery,
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
    });
    const r = await publishFile({
      storage,
      localFile: feature,
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
    });

    assert.equal(r.destPath, "CORE/product/loja/feature-checkout.md");
    const index = readFileSync(join(location, "CORE", "index.md"), "utf-8");
    assert.match(
      index,
      /- \[feature-checkout\.md\]\(product\/loja\/feature-checkout\.md\) \| in_production \| Checkout \| 2026-10-15/
    );
    assert.match(
      index,
      /- \[delivery-2026-10-15-task-123\.md\]\(engineering\/loja\/delivery-2026-10-15-task-123\.md\) \| TASK-123 \| 2026-10-15/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
