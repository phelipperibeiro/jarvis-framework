// Testes de check-links.js: links relativos que não resolvem dentro do Central docs (#229).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { stripCode, relativeLinkTargets, findUnresolvableLinks } from "../bin/lib/docs/check-links.js";

const DEST = "CORE/loja/checkout/decisions/architecture.md";

test("stripCode: remove blocos cercados e trechos entre crases", () => {
  const out = stripCode("antes\n```md\n[a](x.md)\n```\ndepois `[b](y.md)` e [c](z.md)\n~~~\n[d](w.md)\n~~~\n");
  assert.ok(!out.includes("x.md"));
  assert.ok(!out.includes("y.md"));
  assert.ok(!out.includes("w.md"));
  assert.ok(out.includes("[c](z.md)"));
});

test("stripCode: cerca de ~~~ não é fechada por ``` (e vice-versa)", () => {
  const out = stripCode("~~~\n```\n[a](x.md)\n~~~\n[b](y.md)\n");
  assert.ok(!out.includes("x.md"));
  assert.ok(out.includes("y.md"));
});

test("relativeLinkTargets: ignora URL, âncora pura, mailto e alvo vazio; tira #âncora, ?query e título", () => {
  const md = [
    "[a](https://x.dev/a.md) [b](#secao) [c](mailto:a@b.com) [d]() [e](http://x)",
    '[f](../outro.md#L10) [g](a/b.md?x=1) [h](c.md "título") ![i](img/p.png) [j](<d e.md>)',
  ].join("\n");
  assert.deepEqual(relativeLinkTargets(md), ["../outro.md", "a/b.md", "c.md", "img/p.png", "d e.md"]);
});

test("findUnresolvableLinks: resolve no lote, no disco e acusa o que sai do Central docs ou não existe", () => {
  const content = [
    "[irmão](plan.md)",
    "[existente](../checkout.md)",
    "[no lote](../../../loja/checkout/deliveries/delivery-1.md)",
    "[código](../../../../../jarvis-framework/bin/x.js#L5)",
    "[sumiu](../nao-existe.md)",
    "[url](https://github.com/o/r/blob/abc/x.js#L5)",
    "```",
    "[exemplo](../../../../../fora.md)",
    "```",
  ].join("\n");
  const publishedSet = new Set([DEST, "CORE/loja/checkout/decisions/plan.md", "CORE/loja/checkout/deliveries/delivery-1.md"]);
  const exists = (rel) => rel === "CORE/loja/checkout/checkout.md";
  const problems = findUnresolvableLinks({ destPath: DEST, content, publishedSet, exists });
  assert.deepEqual(
    problems.map((p) => [p.link, p.reason]),
    [
      ["../../../../../jarvis-framework/bin/x.js", "aponta para fora do Central docs"],
      ["../nao-existe.md", "o destino não existe no Central docs"],
    ]
  );
});

test("findUnresolvableLinks: caminho absoluto no disco conta como fora do Central docs", () => {
  const problems = findUnresolvableLinks({
    destPath: DEST,
    content: "[x](/home/felipe/projeto/a.md)",
    publishedSet: new Set(),
    exists: () => true,
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0].reason, /fora do Central docs/);
});

test("findUnresolvableLinks: página sem links relativos não gera aviso", () => {
  assert.deepEqual(
    findUnresolvableLinks({ destPath: DEST, content: "# Só texto\n[card](https://x/y)\n", publishedSet: new Set(), exists: () => false }),
    []
  );
});
