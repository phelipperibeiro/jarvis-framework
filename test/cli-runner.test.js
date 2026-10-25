// Testes do runner das CLIs dos vendors (bin/lib/integrations/cli-runner.js). Rode com: npm run test:filtro
// Nenhum teste chama gh/glab/acli de verdade: o `exec` é injetado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  EXIT,
  buildArgs,
  checkCli,
  firstUrl,
  runAction,
  toPlainText,
} from "../bin/lib/integrations/cli-runner.js";

/**
 * `exec` falso: responde por subcomando e guarda as chamadas.
 * `routes`: lista de [predicado(bin, args), resposta | função].
 */
function fakeExec(routes) {
  const calls = [];
  const exec = async (bin, args) => {
    calls.push({ bin, args });
    for (const [match, res] of routes) {
      if (match(bin, args)) return typeof res === "function" ? res(bin, args) : res;
    }
    return { code: 0, stdout: "", stderr: "" };
  };
  return { exec, calls };
}

const isVersion = (_b, a) => a[0] === "--version";
const isAuth = (_b, a) => a.includes("auth") && a.includes("status");
const ok = { code: 0, stdout: "", stderr: "" };

test("checkCli: binário ausente → não instalada, com o link de instalação", async () => {
  const { exec } = fakeExec([[isVersion, { code: "ENOENT", stdout: "", stderr: "" }]]);
  const r = await checkCli("gitlab", { exec });
  assert.equal(r.installed, false);
  assert.equal(r.loggedIn, false);
  assert.match(r.reason, /glab.*não instalada.*gitlab-org\/cli/);
});

test("checkCli: auth status com exit 1 (glab 401) → instalada, login inválido", async () => {
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, { code: 1, stdout: "", stderr: "401 Unauthorized" }],
  ]);
  const r = await checkCli("gitlab", { exec });
  assert.deepEqual([r.installed, r.loggedIn], [true, false]);
  assert.match(r.reason, /login inválido.*glab auth login/);
});

test("checkCli: auth status ok → instalada e logada", async () => {
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, { code: 0, stdout: "Logged in to github.com account x", stderr: "" }],
  ]);
  const r = await checkCli("github", { exec });
  assert.deepEqual([r.installed, r.loggedIn], [true, true]);
});

test("checkCli: jira com exit 0 e texto de 'não logado' conta como login inválido", async () => {
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, { code: 0, stdout: "You are not logged in", stderr: "" }],
  ]);
  const r = await checkCli("jira", { exec });
  assert.equal(r.loggedIn, false);
});

test("checkCli: vendor fora do catálogo → não suportado, sem chamar nada", async () => {
  const { exec, calls } = fakeExec([]);
  const r = await checkCli("linear", { exec });
  assert.equal(r.supported, false);
  assert.equal(calls.length, 0);
});

test("buildArgs: gh issue comment com repo e arquivo do corpo", () => {
  const { bin, args } = buildArgs("github", "comment", {
    key: "42",
    repo: "github.com/o/r",
    body_file: "/tmp/b.md",
  });
  assert.equal(bin, "gh");
  assert.deepEqual(args, [
    "issue",
    "comment",
    "42",
    "--repo",
    "github.com/o/r",
    "--body-file",
    "/tmp/b.md",
  ]);
});

test("buildArgs: marcador vazio sai junto com a flag anterior (--label sem labels)", () => {
  const { args } = buildArgs("github", "create_issue", {
    repo: "github.com/o/r",
    title: "t",
    body_file: "/tmp/b.md",
    labels: "",
  });
  assert.equal(args.includes("--label"), false);
});

test("buildArgs: glab mr create usa a URL do repo e o corpo como argumento", () => {
  const { bin, args } = buildArgs("gitlab", "create_merge", {
    repo_url: "https://gitlab.empresa.com/g/r",
    source: "feat/x",
    target: "main",
    title: "Título com 'aspas' e \"duplas\"",
    body: "linha 1\nlinha 2",
  });
  assert.equal(bin, "glab");
  assert.deepEqual(args.slice(0, 4), ["mr", "create", "--repo", "https://gitlab.empresa.com/g/r"]);
  assert.equal(args[args.indexOf("-d") + 1], "linha 1\nlinha 2");
  assert.equal(args.at(-1), "--yes");
});

test("buildArgs: key, branch e repo inválidos são recusados (erro de uso)", () => {
  assert.throws(
    () => buildArgs("github", "comment", { key: "42; rm -rf /", repo: "github.com/o/r" }),
    /inválido/
  );
  assert.throws(
    () =>
      buildArgs("github", "create_merge", {
        repo: "github.com/o/r",
        source: "a b",
        target: "main",
        title: "t",
      }),
    /inválido/
  );
  assert.throws(() => buildArgs("github", "view", { key: "1", repo: "--help" }), /inválido/);
});

test("buildArgs: ação ou vendor inexistente lança erro de uso", () => {
  assert.throws(
    () => buildArgs("jira", "create_merge", {}),
    (e) => e.exitCode === EXIT.USAGE
  );
  assert.throws(() => buildArgs("bitbucket", "comment", {}), /não suportado/);
});

test("runAction: CLI sem login → indisponível, nada enviado", async () => {
  const { exec, calls } = fakeExec([
    [isVersion, ok],
    [isAuth, { code: 1, stdout: "", stderr: "" }],
  ]);
  const r = await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: "oi" },
    { exec }
  );
  assert.deepEqual([r.ok, r.sent, r.code], [false, false, EXIT.UNAVAILABLE]);
  assert.equal(
    calls.some((c) => c.args[0] === "issue"),
    false
  );
});

test("runAction: sucesso grava o corpo num arquivo temporário e o apaga no fim", async () => {
  let bodyPath = null;
  let bodyText = null;
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [
      (_b, a) => a[0] === "issue",
      (_b, a) => {
        bodyPath = a[a.indexOf("--body-file") + 1];
        bodyText = readFileSync(bodyPath, "utf-8");
        return { code: 0, stdout: "https://github.com/o/r/issues/1#issuecomment-9\n", stderr: "" };
      },
    ],
  ]);
  const r = await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: "**oi**" },
    { exec }
  );
  assert.deepEqual([r.ok, r.sent, r.code], [true, true, EXIT.OK]);
  assert.equal(bodyText, "**oi**");
  assert.equal(existsSync(bodyPath), false);
});

test("runAction: erro depois de enviar → enviado com erro (sem nova tentativa)", async () => {
  const { exec, calls } = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [(_b, a) => a[0] === "pr", { code: 1, stdout: "", stderr: "GraphQL: something" }],
  ]);
  const r = await runAction(
    "github",
    "create_merge",
    { repo: "github.com/o/r", source: "feat/x", target: "main", title: "t", body: "b" },
    { exec }
  );
  assert.deepEqual([r.ok, r.sent, r.code], [false, true, EXIT.SENT_WITH_ERROR]);
  assert.equal(calls.filter((c) => c.args[0] === "pr").length, 1);
});

test("runAction: timeout conta como enviado com erro", async () => {
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [(_b, a) => a[0] === "issue", { code: "ETIMEDOUT", stdout: "", stderr: "" }],
  ]);
  const r = await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: "x" },
    { exec }
  );
  assert.deepEqual([r.sent, r.code], [true, EXIT.SENT_WITH_ERROR]);
  assert.match(r.reason, /tempo esgotado/);
});

test("runAction: no jira o corpo vai como texto simples; no github, como markdown", async () => {
  const seen = {};
  const capture = (vendor) => (_b, a) => {
    seen[vendor] = readFileSync(a[a.indexOf("--body-file") + 1], "utf-8");
    return ok;
  };
  const md = "## Título\n**negrito** e `código`";
  await runAction(
    "jira",
    "comment",
    { key: "ABC-1", body: md },
    {
      exec: fakeExec([
        [isVersion, ok],
        [isAuth, { code: 0, stdout: "✓ Authenticated", stderr: "" }],
        [(_b, a) => a[1] === "workitem", capture("jira")],
      ]).exec,
    }
  );
  await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: md },
    {
      exec: fakeExec([
        [isVersion, ok],
        [isAuth, ok],
        [(_b, a) => a[0] === "issue", capture("github")],
      ]).exec,
    }
  );
  assert.equal(seen.jira, "Título\nnegrito e código");
  assert.equal(seen.github, md);
});

test("runAction: vendor não suportado → indisponível", async () => {
  const r = await runAction("asana", "comment", {}, { exec: fakeExec([]).exec });
  assert.deepEqual([r.sent, r.code], [false, EXIT.UNAVAILABLE]);
});

test("toPlainText: títulos, negrito, crases, listas, links e blocos de código", () => {
  const md = [
    "# Auditoria",
    "- **Q1**: opção `1`",
    "* item com asterisco",
    "Veja [o PR](https://x/pr/1).",
    "```bash",
    "npm test",
    "```",
    "__fim__",
  ].join("\n");
  assert.equal(
    toPlainText(md),
    [
      "Auditoria",
      "- Q1: opção 1",
      "- item com asterisco",
      "Veja o PR (https://x/pr/1).",
      "npm test",
      "fim",
    ].join("\n")
  );
});

test("firstUrl: pega a URL da saída da CLI", () => {
  assert.equal(
    firstUrl("Creating pull request...\nhttps://github.com/o/r/pull/7\n"),
    "https://github.com/o/r/pull/7"
  );
  assert.equal(firstUrl("nada"), null);
});

// --- Correções do pre-pr (#181) ---------------------------------------------

test("defaultExec: binário inexistente → ENOENT; exit numérico; timeout → ETIMEDOUT", async () => {
  const { defaultExec } = await import("../bin/lib/integrations/cli-runner.js");
  assert.equal((await defaultExec("binario-que-nao-existe-xyz-181", [])).code, "ENOENT");
  assert.equal((await defaultExec(process.execPath, ["-e", "process.exit(3)"])).code, 3);
  const t = await defaultExec(process.execPath, ["-e", "setTimeout(() => {}, 5000)"], {
    timeoutMs: 100,
  });
  assert.equal(t.code, "ETIMEDOUT");
});

test("runAction: binário some entre a checagem e o envio (ENOENT) → indisponível, nada enviado", async () => {
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [(_b, a) => a[0] === "issue", { code: "ENOENT", stdout: "", stderr: "" }],
  ]);
  const r = await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: "x" },
    { exec }
  );
  assert.deepEqual([r.ok, r.sent, r.code], [false, false, EXIT.UNAVAILABLE]);
});

test("runAction: erro de spawn (E2BIG) → indisponível; saída grande demais → enviado com erro", async () => {
  const spawn = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [(_b, a) => a[0] === "issue", { code: "E2BIG", stdout: "", stderr: "" }],
  ]);
  const a = await runAction(
    "gitlab",
    "comment",
    { key: "1", repo_url: "https://gitlab.com/g/r", body: "x" },
    { exec: spawn.exec }
  );
  assert.deepEqual([a.sent, a.code], [false, EXIT.UNAVAILABLE]);
  const big = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [
      (_b, a) => a[0] === "issue",
      { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER", stdout: "", stderr: "" },
    ],
  ]);
  const b = await runAction(
    "github",
    "comment",
    { key: "1", repo: "github.com/o/r", body: "x" },
    { exec: big.exec }
  );
  assert.deepEqual([b.sent, b.code], [true, EXIT.SENT_WITH_ERROR]);
  assert.match(b.reason, /saída grande demais/);
});

test("runAction: argumento inválido sai com 1 antes de tocar a CLI", async () => {
  const { exec, calls } = fakeExec([]);
  const r = await runAction(
    "github",
    "create_merge",
    { repo: "github.com/o/r", source: "a b", target: "main", title: "t" },
    { exec }
  );
  assert.deepEqual([r.sent, r.code], [false, EXIT.USAGE]);
  assert.equal(calls.length, 0);
});

test("runAction: sem descrição, o gh pr create recebe --body-file (arquivo vazio)", async () => {
  let seen = null;
  const { exec } = fakeExec([
    [isVersion, ok],
    [isAuth, ok],
    [
      (_b, a) => a[0] === "pr",
      (_b, a) => {
        seen = readFileSync(a[a.indexOf("--body-file") + 1], "utf-8");
        return ok;
      },
    ],
  ]);
  const r = await runAction(
    "github",
    "create_merge",
    { repo: "github.com/o/r", source: "feat/x", target: "main", title: "t" },
    { exec }
  );
  assert.equal(r.ok, true);
  assert.equal(seen, "");
});

test("buildArgs: key, título e branches são obrigatórios (não somem com a flag)", () => {
  assert.throws(
    () => buildArgs("github", "comment", { key: "", repo: "github.com/o/r", body_file: "/b" }),
    /falta o valor de \{key\}/
  );
  assert.throws(
    () =>
      buildArgs("github", "create_merge", {
        repo: "github.com/o/r",
        source: "a",
        target: "",
        title: "t",
        body_file: "/b",
      }),
    /\{target\}/
  );
});

test("toPlainText: o conteúdo de bloco de código fica como está", () => {
  assert.equal(toPlainText("```\n# x\n**/y\n```\n# Título"), "# x\n**/y\nTítulo");
  assert.equal(toPlainText(null), "");
  assert.equal(toPlainText("`sem fecho e **sem par"), "`sem fecho e **sem par");
});

test("accessValue: vazio, ausente e a lista de opções do template contam como vazio", async () => {
  const { accessValue } = await import("../bin/lib/integrations/cli-runner.js");
  const prev = process.env.X_ACCESS_181;
  try {
    process.env.X_ACCESS_181 = "[cli, manual]";
    assert.equal(accessValue("X_ACCESS_181"), "");
    process.env.X_ACCESS_181 = " Manual ";
    assert.equal(accessValue("X_ACCESS_181"), "manual");
    delete process.env.X_ACCESS_181;
    assert.equal(accessValue("X_ACCESS_181"), "");
  } finally {
    if (prev === undefined) delete process.env.X_ACCESS_181;
    else process.env.X_ACCESS_181 = prev;
  }
});
