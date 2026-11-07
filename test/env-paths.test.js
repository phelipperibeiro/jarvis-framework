// Testes da expansão de $VAR nos caminhos do ENV.md (#228). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ENV_PATH_DEFAULTS,
  EnvPathError,
  PATH_KEYS,
  assertPathsResolved,
  expandEnv,
  expandEnvPath,
  expandEnvValue,
} from "../bin/lib/core/env-paths.js";
import { docsFolders, expandEnv as expandEnvReexport } from "../bin/lib/core/docs-migrate.js";

const base = {
  DOCS_FOLDER: "docs",
  JARVIS_DOCS: "$DOCS_FOLDER/jarvis",
  CENTRAL_DOCS_LOCATION: "$JARVIS_DOCS/central-docs",
};

test("expandEnvPath: resolve o Central docs a partir do JARVIS_DOCS (padrão do template)", () => {
  assert.equal(expandEnvPath(base, "CENTRAL_DOCS_LOCATION"), "docs/jarvis/central-docs");
});

test("expandEnvPath: acompanha o DOCS_FOLDER customizado", () => {
  assert.equal(
    expandEnvPath({ ...base, DOCS_FOLDER: "documentos" }, "CENTRAL_DOCS_LOCATION"),
    "documentos/jarvis/central-docs"
  );
});

test("expandEnvPath: variável no meio do valor", () => {
  const env = { ...base, JARVIS_DOCS: ".jarvis/$DOCS_FOLDER/jarvis" };
  assert.equal(expandEnvPath(env, "CENTRAL_DOCS_LOCATION"), ".jarvis/docs/jarvis/central-docs");
});

test("expandEnvPath: a ordem das chaves não importa (JARVIS_DOCS depois do CENTRAL_DOCS_LOCATION)", () => {
  const map = new Map([
    ["CENTRAL_DOCS_LOCATION", "$JARVIS_DOCS/central-docs"],
    ["JARVIS_DOCS", ".jarvis/$DOCS_FOLDER/jarvis"],
    ["DOCS_FOLDER", "docs"],
  ]);
  assert.equal(expandEnvPath(map, "CENTRAL_DOCS_LOCATION"), ".jarvis/docs/jarvis/central-docs");
});

test("expandEnvPath: caminho relativo simples e absoluto não mudam", () => {
  assert.equal(expandEnvPath({ CENTRAL_DOCS_LOCATION: "docs/jarvis/central-docs" }, "CENTRAL_DOCS_LOCATION"), "docs/jarvis/central-docs");
  assert.equal(expandEnvPath({ CENTRAL_DOCS_LOCATION: "/srv/central" }, "CENTRAL_DOCS_LOCATION"), "/srv/central");
});

test("expandEnvPath: aplica os padrões do template quando a chave falta ou está vazia", () => {
  assert.equal(expandEnvPath({}, "SESSIONS_DIR"), ".jarvis/sessions");
  assert.equal(expandEnvPath({ SESSIONS_DIR: "" }, "SESSIONS_DIR"), ".jarvis/sessions");
  assert.equal(expandEnvPath({}, "ENG_DOCS"), "docs/jarvis/engineering");
  assert.equal(expandEnvPath({ DOCS_FOLDER: "documentos" }, "PROD_DOCS"), "documentos/jarvis/product");
  assert.equal(expandEnvPath({}, "DISCOVERIES_DOCS"), "docs/jarvis/discoveries");
});

test("expandEnvPath: chave sem valor e sem padrão devolve undefined (Central docs desligado)", () => {
  assert.equal(expandEnvPath({}, "CENTRAL_DOCS_LOCATION"), undefined);
});

test("expandEnvPath: variável inexistente num caminho vira erro claro com o valor original", () => {
  assert.throws(
    () => expandEnvPath({ CENTRAL_DOCS_LOCATION: "$NAO_EXISTE/x" }, "CENTRAL_DOCS_LOCATION"),
    (err) => {
      assert.ok(err instanceof EnvPathError);
      assert.equal(err.key, "CENTRAL_DOCS_LOCATION");
      assert.equal(err.value, "$NAO_EXISTE/x");
      assert.deepEqual(err.leftover, ["$NAO_EXISTE"]);
      assert.match(err.message, /CENTRAL_DOCS_LOCATION/);
      assert.match(err.message, /\$NAO_EXISTE\/x/);
      assert.match(err.message, /sobrou: \$NAO_EXISTE/);
      return true;
    }
  );
});

test("expandEnvPath: o erro vale também quando a variável sem valor vem de outra chave", () => {
  const env = { ...base, JARVIS_DOCS: "$RAIZ/jarvis" };
  assert.throws(() => expandEnvPath(env, "CENTRAL_DOCS_LOCATION"), (err) => {
    assert.equal(err.value, "$JARVIS_DOCS/central-docs");
    assert.deepEqual(err.leftover, ["$RAIZ"]);
    return true;
  });
});

test("expandEnvPath: ciclo entre chaves de caminho vira erro, não trava", () => {
  const env = { DOCS_FOLDER: "$JARVIS_DOCS/a", JARVIS_DOCS: "$DOCS_FOLDER/b" };
  assert.throws(() => expandEnvPath(env, "DOCS_FOLDER"), EnvPathError);
});

test("expandEnvPath: $IDE fica literal sem erro em chave que não é de caminho", () => {
  assert.equal(expandEnvPath({ RULES_FOLDER: ".$IDE/rules" }, "RULES_FOLDER"), ".$IDE/rules");
  assert.ok(!PATH_KEYS.includes("RULES_FOLDER"));
});

test("expandEnvPath: ${VAR} com chaves não é suportada e sobra como erro num caminho", () => {
  assert.throws(
    () => expandEnvPath({ CENTRAL_DOCS_LOCATION: "${DOCS_FOLDER}/central" }, "CENTRAL_DOCS_LOCATION"),
    EnvPathError
  );
});

test("expandEnvPath: aceita o objeto do loadEnv e o Map do ENV", () => {
  const obj = { DOCS_FOLDER: "d", JARVIS_DOCS: "$DOCS_FOLDER/j" };
  assert.equal(expandEnvPath(obj, "JARVIS_DOCS"), "d/j");
  assert.equal(expandEnvPath(new Map(Object.entries(obj)), "JARVIS_DOCS"), "d/j");
});

test("expandEnvValue: texto avulso, com padrões, desconhecida literal e sem erro", () => {
  assert.equal(expandEnvValue("$JARVIS_DOCS/engineering", { DOCS_FOLDER: "documentos" }), "documentos/jarvis/engineering");
  assert.equal(expandEnvValue("$ENG_DOCS", {}), "docs/jarvis/engineering");
  assert.equal(expandEnvValue("$NAO_EXISTE/x", {}), "$NAO_EXISTE/x");
});

test("expandEnv: o re-export de docs-migrate é a mesma função", () => {
  assert.equal(expandEnvReexport, expandEnv);
  const e = expandEnv(new Map([["A", "$B/x"], ["B", "y"]]));
  assert.equal(e.get("A"), "y/x");
});

test("PATH_KEYS e padrões: toda chave de caminho com padrão está coberta", () => {
  for (const key of PATH_KEYS) {
    if (key === "CENTRAL_DOCS_LOCATION") continue; // sem padrão: desligado quando falta
    assert.ok(key in ENV_PATH_DEFAULTS, `${key} sem padrão`);
  }
});

test("assertPathsResolved e docsFolders: $ sobrando numa chave de documentos vira erro", () => {
  const ok = expandEnv(new Map([["DOCS_FOLDER", "docs"], ["JARVIS_DOCS", "$DOCS_FOLDER/jarvis"]]));
  assert.doesNotThrow(() => assertPathsResolved(ok));
  assert.equal(docsFolders(ok).jarvis, "docs/jarvis");
  const bad = expandEnv(new Map([["JARVIS_DOCS", "$NAO_EXISTE/jarvis"]]));
  assert.throws(() => docsFolders(bad), (err) => err instanceof EnvPathError && err.key === "JARVIS_DOCS");
  // chave que não é de caminho não conta
  assert.doesNotThrow(() => assertPathsResolved(new Map([["RULES_FOLDER", ".$IDE/rules"]])));
});

test("expandEnvPath: $ isolado, no fim ou duplicado é texto, não variável sem valor", () => {
  for (const v of ["a$", "a$ b", "C:\\Users\\a$\\d", "preço$/x", "$1/x", "$(pwd)/a", "$-x/a"]) {
    assert.equal(expandEnvPath({ CENTRAL_DOCS_LOCATION: v }, "CENTRAL_DOCS_LOCATION"), v);
  }
  // variável de verdade (letra ou _ primeiro) e ${...} continuam sendo erro
  for (const v of ["$x/a", "$_X/a", "${X}/a", "a/$NAO_EXISTE", "a$$b"]) {
    assert.throws(() => expandEnvPath({ CENTRAL_DOCS_LOCATION: v }, "CENTRAL_DOCS_LOCATION"), EnvPathError, v);
  }
});

test("EnvPathError: o prefixo da mensagem é o mesmo em expandEnvPath e assertPathsResolved; o valor expandido só aparece quando difere", () => {
  let direto = "";
  try {
    expandEnvPath({ DOCS_FOLDER: "d", CENTRAL_DOCS_LOCATION: "$JARVIS_DOCS/c", JARVIS_DOCS: "$RAIZ/j" }, "CENTRAL_DOCS_LOCATION");
  } catch (e) {
    direto = e.message;
  }
  assert.match(direto, /"\$JARVIS_DOCS\/c" \(expande para "\$RAIZ\/j\/c"\) \(sobrou: \$RAIZ\)/);
  try {
    assertPathsResolved(new Map([["JARVIS_DOCS", "$RAIZ/j"]]));
    assert.fail("deveria lançar");
  } catch (e) {
    assert.match(e.message, /Caminho "JARVIS_DOCS" do ENV\.md com variável sem valor: "\$RAIZ\/j" \(sobrou: \$RAIZ\)/);
    assert.doesNotMatch(e.message, /expande para/);
  }
});
