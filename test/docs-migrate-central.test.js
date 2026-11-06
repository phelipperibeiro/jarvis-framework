// Testes de migrate-central.js: migração do Central docs para a árvore por funcionalidade
// (#220). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planCentralMigration, applyCentralMigration } from "../bin/lib/docs/migrate-central.js";

function write(file, content) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

function featureFixture({ slug, lastDelivery, history = [] }) {
  const historyLines = history.map((d) => `| 2026-10-01 | KEY | #1 | a | x | [${d}](../../engineering/loja/${d}) |`);
  return `---
id: FEAT-001
name: ${slug}
status: in_production
product: loja
updated_at: 2026-10-15
last_delivery: ${lastDelivery}
---
# ${slug}

## 10. Histórico de entregas

| Data | Card | PR/MR | Autores | Resumo | Registro |
|---|---|---|---|---|---|
${historyLines.join("\n")}
`;
}

function tmp() {
  return mkdtempSync(join(tmpdir(), "jarvis-migrate-central-"));
}

test("planCentralMigration: move feature e delivery de dono único, não toca no resto", () => {
  const root = tmp();
  try {
    write(
      join(root, "CORE/product/loja/feature-checkout.md"),
      featureFixture({ slug: "checkout", lastDelivery: "delivery-2026-10-15-t-1.md" })
    );
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

    const plan = planCentralMigration(root, "CORE");
    assert.equal(plan.needsSplit.length, 0);
    assert.equal(plan.skipped.length, 0);
    assert.deepEqual(
      plan.moves.map((m) => [m.from, m.to]).sort(),
      [
        ["CORE/engineering/loja/delivery-2026-10-15-t-1.md", "CORE/loja/checkout/deliveries/delivery-2026-10-15-t-1.md"],
        ["CORE/product/loja/feature-checkout.md", "CORE/loja/checkout/checkout.md"],
      ].sort()
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planCentralMigration: entrega citada por duas funcionalidades vai para needsSplit, não é movida", () => {
  const root = tmp();
  try {
    write(
      join(root, "CORE/product/loja/feature-a.md"),
      featureFixture({ slug: "a", lastDelivery: "delivery-2026-10-15-t-1.md" })
    );
    write(
      join(root, "CORE/product/loja/feature-b.md"),
      featureFixture({ slug: "b", lastDelivery: "x", history: ["delivery-2026-10-15-t-1.md"] })
    );
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

    const plan = planCentralMigration(root, "CORE");
    assert.equal(plan.moves.filter((m) => m.kind === "delivery").length, 0);
    assert.equal(plan.needsSplit.length, 1);
    assert.deepEqual(plan.needsSplit[0].features, ["a", "b"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planCentralMigration: delivery sem funcionalidade citando-a fica 'sem funcionalidade'", () => {
  const root = tmp();
  try {
    mkdirSync(join(root, "CORE/product/loja"), { recursive: true });
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-9.md"), "---\ntask_key: T-9\n---\n");

    const plan = planCentralMigration(root, "CORE");
    assert.deepEqual(plan.skipped, [
      { from: "CORE/engineering/loja/delivery-2026-10-15-t-9.md", reason: "sem funcionalidade" },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planCentralMigration: destino já existente vira 'conflito', sem mover", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/product/loja/feature-checkout.md"), featureFixture({ slug: "checkout" }));
    write(join(root, "CORE/loja/checkout/checkout.md"), "# já existe\n");

    const plan = planCentralMigration(root, "CORE");
    assert.equal(plan.moves.length, 0);
    assert.deepEqual(plan.skipped, [
      { from: "CORE/product/loja/feature-checkout.md", reason: "conflito" },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("applyCentralMigration: move, guarda cópia do original e nunca sobrescreve", () => {
  const root = tmp();
  try {
    const original = featureFixture({ slug: "checkout", lastDelivery: "delivery-2026-10-15-t-1.md" });
    write(join(root, "CORE/product/loja/feature-checkout.md"), original);
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

    const plan = planCentralMigration(root, "CORE");
    const result = applyCentralMigration(root, plan, "2026-11-06T00-00-00");

    assert.equal(result.errors.length, 0);
    assert.equal(result.moved.length, 2);
    assert.ok(existsSync(join(root, "CORE/loja/checkout/checkout.md")));
    assert.ok(existsSync(join(root, "CORE/loja/checkout/deliveries/delivery-2026-10-15-t-1.md")));
    assert.equal(existsSync(join(root, "CORE/product/loja/feature-checkout.md")), false);

    const backup = join(root, result.backupDir, "CORE/product/loja/feature-checkout.md");
    assert.ok(existsSync(backup), "a cópia do original fica guardada");
    assert.equal(readFileSync(backup, "utf-8"), original);

    // Rodar o plano de novo sobre a árvore já migrada: nada mais para mover (idempotente).
    const plan2 = planCentralMigration(root, "CORE");
    assert.equal(plan2.moves.length, 0);
    assert.equal(plan2.needsSplit.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("applyCentralMigration: remove as pastas product/engineering que ficam vazias e ignora .migration-backup/ (#220 item 9)", () => {
  const root = tmp();
  try {
    write(
      join(root, "CORE/product/loja/feature-checkout.md"),
      featureFixture({ slug: "checkout", lastDelivery: "delivery-2026-10-15-t-1.md" })
    );
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

    const plan = planCentralMigration(root, "CORE");
    applyCentralMigration(root, plan, "2026-11-06T00-00-00");

    assert.equal(existsSync(join(root, "CORE/product")), false, "CORE/product ficou vazia e foi removida");
    assert.equal(existsSync(join(root, "CORE/engineering")), false, "CORE/engineering ficou vazia e foi removida");
    assert.match(readFileSync(join(root, ".gitignore"), "utf-8"), /\.migration-backup\//);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("applyCentralMigration: não remove product/engineering se ainda sobrar algo não migrado", () => {
  const root = tmp();
  try {
    write(
      join(root, "CORE/product/loja/feature-checkout.md"),
      featureFixture({ slug: "checkout", lastDelivery: "delivery-2026-10-15-t-1.md" })
    );
    write(join(root, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");
    // Um arquivo qualquer que o migrador não entende e não move — a pasta não deve ser removida.
    write(join(root, "CORE/product/loja/notas.txt"), "não é feature-*.md\n");

    const plan = planCentralMigration(root, "CORE");
    applyCentralMigration(root, plan, "2026-11-06T00-00-01");

    assert.ok(existsSync(join(root, "CORE/product/loja/notas.txt")), "arquivo não migrado continua");
    assert.ok(existsSync(join(root, "CORE/product")), "pasta não vazia não é removida");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("planCentralMigration: entrega move para o produto da funcionalidade dona, não o da pasta engineering/ (#220 item 10)", () => {
  const root = tmp();
  try {
    // A funcionalidade "checkout" está em product/loja-nova/, mas a entrega ficou na pasta
    // antiga product/loja/engineering/loja (produto diferente) — o destino tem que seguir o
    // produto de onde a funcionalidade de fato está, não o da pasta engineering/.
    write(
      join(root, "CORE/product/loja-nova/feature-checkout.md"),
      featureFixture({ slug: "checkout", lastDelivery: "delivery-2026-10-15-t-1.md" })
    );
    write(join(root, "CORE/engineering/loja-velha/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");

    const plan = planCentralMigration(root, "CORE");

    const deliveryMove = plan.moves.find((m) => m.kind === "delivery");
    assert.ok(deliveryMove, "a entrega foi movida");
    assert.equal(deliveryMove.produto, "loja-nova", "usa o produto da funcionalidade dona");
    assert.equal(deliveryMove.to, "CORE/loja-nova/checkout/deliveries/delivery-2026-10-15-t-1.md");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
