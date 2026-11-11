// Testes da montagem do CLI (bin/lib/cli/program.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgram } from "../bin/lib/cli/program.js";
import { explicitEnvPath } from "../bin/lib/cli/shared-options.js";

test("buildProgram: whoami registrado e logout fora do CLI (#239)", () => {
  const nomes = buildProgram().commands.map((c) => c.name());
  assert.ok(nomes.includes("whoami"), nomes.join(", "));
  // O jarvis logout apagava o ~/.jarvis/auth.json da época do login OAuth; a identidade vem de
  // USER=, git ou SO (resolveUser), e o comando saiu.
  assert.ok(!nomes.includes("logout"), nomes.join(", "));
});

test("buildProgram: jarvis tokens só com as opções da medida, sem os eixos antigos (#263)", () => {
  const tokens = buildProgram().commands.find((c) => c.name() === "tokens");
  assert.deepEqual(
    tokens.options.map((o) => o.long),
    ["--artifact-style", "--rtk", "--json", "--ide", "--env", "--env-file"]
  );
  // O CLI aceita flag desconhecida de propósito (o helper cmd()): a conferência é o --help.
  assert.doesNotMatch(tokens.helpInformation(), /--(hub|position|area|squad)\b/);
});

// #269: os 15 comandos que resolvem o ENV.md aceitam o --env (o nome que o Node não confere antes
// do script) e, depois dele, a alternativa --env-file.
test("buildProgram: os 15 comandos com ENV.md têm --env antes do --env-file (#269)", () => {
  const program = buildProgram();
  const achar = (caminho) =>
    caminho.reduce((c, nome) => c.commands.find((k) => k.name() === nome), program);
  const comandos = [
    ["whoami"],
    ["docs", "sync"],
    ["docs", "fetch"],
    ["docs", "publish"],
    ["docs", "archive"],
    ["docs", "sessions"],
    ["docs", "finalize"],
    ["docs", "migrate"],
    ["tokens"],
    ["rules", "sync"],
    ["untrack"],
    ["fork"],
    ["daily-report"],
    ["vcs", "create-merge"],
    ["tasks", "comment"],
  ];
  for (const caminho of comandos) {
    const longos = achar(caminho).options.map((o) => o.long);
    const env = longos.indexOf("--env");
    assert.ok(
      env >= 0 && longos.indexOf("--env-file") === env + 1,
      `${caminho.join(" ")}: ${longos}`
    );
  }
});

test("explicitEnvPath: o --env vence; sem ele (ou vazio), vale o --env-file (#269)", () => {
  assert.equal(explicitEnvPath({ env: "a.md", envFile: "b.md" }), "a.md");
  assert.equal(explicitEnvPath({ envFile: "b.md" }), "b.md");
  assert.equal(explicitEnvPath({ env: "", envFile: "b.md" }), "b.md");
  assert.equal(explicitEnvPath({}), undefined);
});
