// Testes da montagem do CLI (bin/lib/cli/program.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgram } from "../bin/lib/cli/program.js";

test("buildProgram: whoami registrado e logout fora do CLI (#239)", () => {
  const nomes = buildProgram().commands.map((c) => c.name());
  assert.ok(nomes.includes("whoami"), nomes.join(", "));
  // O jarvis logout apagava o ~/.jarvis/auth.json da época do login OAuth; a identidade vem de
  // USER=, git ou SO (resolveUser), e o comando saiu.
  assert.ok(!nomes.includes("logout"), nomes.join(", "));
});
