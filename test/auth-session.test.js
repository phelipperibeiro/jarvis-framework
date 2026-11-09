// Testes da identidade local (bin/lib/auth/session.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveUser } from "../bin/lib/auth/session.js";

test("resolveUser: USER= do ENV.md vence, com os espaços aparados", () => {
  assert.deepEqual(resolveUser({ USER: "  pessoa@exemplo.com  " }), {
    id: "pessoa@exemplo.com",
    source: "ENV.md",
  });
});

test("resolveUser: USER vazio ou ausente cai no git, no SO ou em local (sem login)", () => {
  for (const env of [{}, { USER: "" }, { USER: "   " }, { USER: 42 }]) {
    const { id, source } = resolveUser(env);
    assert.ok(["git", "os", "fallback"].includes(source), `fonte inesperada: ${source}`);
    assert.ok(typeof id === "string" && id.length > 0);
  }
});
