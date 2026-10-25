// Testes dos adapters de Git host (vcs/api.js + git-parser.js). Rode com: npm run test:filtro
//
// createMergeRequest/createIssue chamam a CLI do vendor (gh/glab) pelo runner
// (bin/lib/integrations/cli-runner.js). O `exec` é injetado pelo terceiro parâmetro
// (`deps`): nenhum teste chama a CLI de verdade nem depende do login da máquina.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createMergeRequest,
  createIssue,
  cardUrl,
  parseRepoUrl,
  mergeRequestPath,
  newMergeRequestUrl,
} from "../bin/lib/vcs/api.js";
import { parseLabels, runCreateIssue } from "../bin/lib/vcs/create-issue.js";

// ENV.md vazio: createMergeRequest lê o VERSION_CONTROL_ACCESS do ENV.md do workspace no que faltar
// no ambiente, e o teste não pode depender do ENV.md real de quem roda.
const EMPTY_ENV_DIR = mkdtempSync(join(tmpdir(), "jarvis-vcs-env-"));
writeFileSync(join(EMPTY_ENV_DIR, "ENV.md"), "");
const PREV_ENV_FILE = process.env.JARVIS_ENV_FILE;
process.env.JARVIS_ENV_FILE = join(EMPTY_ENV_DIR, "ENV.md");
after(() => {
  if (PREV_ENV_FILE === undefined) delete process.env.JARVIS_ENV_FILE;
  else process.env.JARVIS_ENV_FILE = PREV_ENV_FILE;
  rmSync(EMPTY_ENV_DIR, { recursive: true, force: true });
});

// `await fn()` (não `return fn()`): o `finally` só pode restaurar a env var
// depois que a promise resolver, senão uma função com mais de um `await`
// antes de ler a variável perderia o valor antes da leitura real acontecer
// (achado ao reusar este helper em publish-file.test.js, onde isso de fato
// acontecia — `publishFile` busca o index.md antes de chegar no commit, que
// é onde o token é lido).
async function withEnv(vars, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ---------------------------------------------------------------------------
// parseRepoUrl / mergeRequestPath (git-parser.js, re-exportadas — puras)
// ---------------------------------------------------------------------------

test("parseRepoUrl: detecta gitlab.com e monta projectPath", () => {
  const r = parseRepoUrl("https://gitlab.com/meu-grupo/meu-repo.git");
  assert.equal(r.vendor, "gitlab");
  assert.equal(r.projectPath, "meu-grupo/meu-repo");
  assert.equal(r.owner, "meu-grupo");
  assert.equal(r.repo, "meu-repo");
});

test("parseRepoUrl: detecta github.com", () => {
  const r = parseRepoUrl("https://github.com/org/repo");
  assert.equal(r.vendor, "github");
  assert.equal(r.owner, "org");
  assert.equal(r.repo, "repo");
});

test("parseRepoUrl: bitbucket.org não é suportado (sem VERSION_CONTROL válido)", () => {
  withEnv({ VERSION_CONTROL: undefined }, () => {
    assert.throws(
      () => parseRepoUrl("https://bitbucket.org/ws/repo.git"),
      /Bitbucket não é suportado/
    );
  });
});

test("parseRepoUrl: normaliza URL SSH (git@host:owner/repo.git)", () => {
  const r = parseRepoUrl("git@github.com:org/repo.git");
  assert.equal(r.vendor, "github");
  assert.equal(r.owner, "org");
  assert.equal(r.repo, "repo");
});

test("parseRepoUrl: self-hosted sem 'gitlab'/'github' no host usa VERSION_CONTROL", () => {
  withEnv({ VERSION_CONTROL: "gitlab" }, () => {
    const r = parseRepoUrl("https://git.minhaempresa.com/grupo/repo");
    assert.equal(r.vendor, "gitlab");
    assert.equal(r.origin, "https://git.minhaempresa.com");
  });
});

test("parseRepoUrl: self-hosted sem VERSION_CONTROL lança erro orientando a configurar", () => {
  withEnv({ VERSION_CONTROL: undefined }, () => {
    assert.throws(
      () => parseRepoUrl("https://git.minhaempresa.com/grupo/repo"),
      /VERSION_CONTROL=github\|gitlab/
    );
  });
});

test("parseRepoUrl: URL vazia ou inválida lança erro", () => {
  assert.throws(() => parseRepoUrl(""), /vazia ou inválida/);
  assert.throws(() => parseRepoUrl("não é uma url"), /URL inválida/);
});

test("mergeRequestPath: path por vendor", () => {
  assert.equal(mergeRequestPath("gitlab", 7), "-/merge_requests/7");
  assert.equal(mergeRequestPath("github", 7), "pull/7");
});

test("newMergeRequestUrl: link para abrir o MR/PR à mão", () => {
  assert.equal(
    newMergeRequestUrl("https://github.com/o/r", "feat/x", "main"),
    "https://github.com/o/r/compare/main...feat%2Fx?expand=1"
  );
  assert.equal(
    newMergeRequestUrl("https://gitlab.com/g/r", "feat/x", "main"),
    "https://gitlab.com/g/r/-/merge_requests/new?merge_request[source_branch]=feat%2Fx&merge_request[target_branch]=main"
  );
});

// ---------------------------------------------------------------------------
// cardUrl (api.js — pura)
// ---------------------------------------------------------------------------

test("cardUrl: um path por task manager", () => {
  const base = "https://empresa.atlassian.net";
  assert.equal(cardUrl("jira", base, "TASK-1"), `${base}/browse/TASK-1`);
  assert.equal(
    cardUrl("github", "https://github.com/o/r", "#42"),
    "https://github.com/o/r/issues/42"
  );
  assert.equal(
    cardUrl("gitlab", "https://gitlab.com/g/r", "7"),
    "https://gitlab.com/g/r/-/issues/7"
  );
});

test("cardUrl: sem baseUrl retorna a própria card key", () => {
  assert.equal(cardUrl("jira", "", "TASK-1"), "TASK-1");
});

test("cardUrl: task manager desconhecido cai no formato jira (/browse/)", () => {
  assert.equal(cardUrl("notion", "https://x.com", "X-1"), "https://x.com/browse/X-1");
});

// ---------------------------------------------------------------------------
// createMergeRequest / createIssue — `exec` injetado (CLI falsa)
// ---------------------------------------------------------------------------

const ok = { code: 0, stdout: "", stderr: "" };

/** CLI falsa: login ok; a ação de escrita responde `res` e as chamadas ficam em `calls`. */
function fakeCli(res) {
  const calls = [];
  const exec = async (bin, args) => {
    calls.push({ bin, args });
    if (args[0] === "--version" || (args.includes("auth") && args.includes("status"))) return ok;
    return res;
  };
  return { exec, calls };
}

const writeCall = (calls) =>
  calls.find((c) => !c.args.includes("--version") && !c.args.includes("status"));

test("createMergeRequest: GitHub — gh pr create com head/base e a URL da saída", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://github.com/o/r/pull/12\n",
    stderr: "",
  });
  const r = await createMergeRequest(
    "https://github.com/o/r.git",
    { source: "feat/x", target: "main", title: "Título", description: "corpo" },
    { exec }
  );
  assert.deepEqual(r, { vendor: "github", iid: 12, url: "https://github.com/o/r/pull/12" });
  const c = writeCall(calls);
  assert.equal(c.bin, "gh");
  assert.deepEqual(c.args.slice(0, 8), [
    "pr",
    "create",
    "--repo",
    "github.com/o/r",
    "--head",
    "feat/x",
    "--base",
    "main",
  ]);
});

test("createMergeRequest: GitLab — glab mr create com a URL do repo e o corpo como argumento", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://gitlab.com/g/r/-/merge_requests/3\n",
    stderr: "",
  });
  const r = await createMergeRequest(
    "git@gitlab.com:g/r.git",
    { source: "feat/x", target: "main", title: "t", description: "d" },
    { exec }
  );
  assert.equal(r.iid, 3);
  const c = writeCall(calls);
  assert.equal(c.bin, "glab");
  assert.equal(c.args[c.args.indexOf("--repo") + 1], "https://gitlab.com/g/r");
  assert.equal(c.args[c.args.indexOf("-d") + 1], "d");
});

test("createMergeRequest: CLI sem login → erro indisponível (sent=false, exitCode 3)", async () => {
  const exec = async (_bin, args) =>
    args[0] === "--version" ? ok : { code: 1, stdout: "", stderr: "not logged in" };
  await assert.rejects(
    () =>
      createMergeRequest(
        "https://github.com/o/r",
        { source: "a", target: "b", title: "t" },
        { exec }
      ),
    (e) =>
      e.sent === false &&
      e.exitCode === 3 &&
      e.vendor === "github" &&
      /Falha ao criar PR github/.test(e.message)
  );
});

test("createMergeRequest: erro depois de enviar → sent=true, exitCode 4", async () => {
  const { exec } = fakeCli({ code: 1, stdout: "", stderr: "a pull request already exists" });
  await assert.rejects(
    () =>
      createMergeRequest(
        "https://github.com/o/r",
        { source: "a", target: "b", title: "t" },
        { exec }
      ),
    (e) =>
      e.sent === true &&
      e.exitCode === 4 &&
      e.vendor === "github" &&
      /already exists/.test(e.message)
  );
});

test("createMergeRequest: o erro da CLI leva o vendor (gitlab, saídas 3 e 4)", async () => {
  const opts = { source: "a", target: "b", title: "t" };
  const noLogin = async (_bin, args) =>
    args[0] === "--version" ? ok : { code: 1, stdout: "", stderr: "" };
  await assert.rejects(
    () => createMergeRequest("https://gitlab.com/g/r", opts, { exec: noLogin }),
    (e) => e.exitCode === 3 && e.vendor === "gitlab" && /Falha ao criar MR gitlab/.test(e.message)
  );
  const { exec } = fakeCli({ code: 1, stdout: "", stderr: "boom" });
  await assert.rejects(
    () => createMergeRequest("https://gitlab.com/g/r", opts, { exec }),
    (e) => e.exitCode === 4 && e.vendor === "gitlab"
  );
});

test("createIssue: GitHub repassa as labels; sem labels = bug", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://github.com/o/r/issues/9\n",
    stderr: "",
  });
  await createIssue(
    "https://github.com/o/r",
    { title: "t", body: "b", labels: ["enhancement", "docs"] },
    { exec }
  );
  await createIssue("https://github.com/o/r", { title: "t", body: "b" }, { exec });
  const writes = calls.filter((c) => c.args[0] === "issue");
  assert.equal(writes[0].args[writes[0].args.indexOf("--label") + 1], "enhancement,docs");
  assert.equal(writes[1].args[writes[1].args.indexOf("--label") + 1], "bug");
});

test("createIssue: GitLab — glab issue create", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://gitlab.com/g/r/-/issues/4\n",
    stderr: "",
  });
  const r = await createIssue("https://gitlab.com/g/r", { title: "t", body: "b" }, { exec });
  assert.deepEqual([r.vendor, r.iid], ["gitlab", 4]);
  assert.equal(writeCall(calls).bin, "glab");
});

test("parseLabels: vírgulas e espaços; vazio = padrão", () => {
  assert.deepEqual(parseLabels(" enhancement , docs ,"), ["enhancement", "docs"]);
  assert.equal(parseLabels(""), undefined);
  assert.equal(parseLabels(undefined), undefined);
});

test("runCreateIssue: repo sem host (grupo/repo) sai com 3 sem chamar a CLI", async (t) => {
  const calls = [];
  const exits = [];
  const realExit = process.exit;
  const realError = console.error;
  process.exit = (code) => {
    exits.push(code);
    throw new Error("exit");
  };
  console.error = () => {};
  t.after(() => {
    process.exit = realExit;
    console.error = realError;
  });
  await assert.rejects(
    () =>
      runCreateIssue(
        { repo: "grupo/repo", title: "t", bodyFile: "/nao/existe" },
        { exec: async (...a) => calls.push(a) }
      ),
    /exit/
  );
  assert.deepEqual(exits, [3]);
  assert.equal(calls.length, 0);
});

// --- runCreateMerge (contrato 0/1/3/4 do eng.pr) e correções do pre-pr (#181) ---

/** Roda `fn` com process.exit e console trocados; devolve { code, out, err }. */
async function captureRun(fn) {
  const real = { exit: process.exit, log: console.log, error: console.error };
  const out = [];
  const err = [];
  let code = 0;
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => err.push(a.join(" "));
  try {
    await fn();
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    Object.assign(process, { exit: real.exit });
    console.log = real.log;
    console.error = real.error;
  }
  return { code, out: out.join("\n"), err: err.join("\n") };
}

const { runCreateMerge } = await import("../bin/lib/vcs/create-merge.js");
const MERGE = { source: "feat/x", target: "main", title: "t", repo: "https://github.com/o/r" };
// Sem ENV.md de verdade: o comando lê o ENV.md no que faltar no ambiente.
const NO_FILE_ENV = { fileEnv: {} };

test("runCreateMerge: sem source/target/title sai com 1", async () => {
  const r = await captureRun(() => runCreateMerge({ source: "a" }));
  assert.equal(r.code, 1);
  assert.match(r.err, /Uso: jarvis vcs create-merge/);
});

test("runCreateMerge: --body-file inexistente sai com 1 sem chamar a CLI", async () => {
  const { exec, calls } = fakeCli(ok);
  const r = await captureRun(() =>
    runCreateMerge({ ...MERGE, bodyFile: "/nao/existe/181" }, { exec, ...NO_FILE_ENV })
  );
  assert.equal(r.code, 1);
  assert.equal(calls.length, 0);
});

test("runCreateMerge: VERSION_CONTROL_ACCESS=manual sai com 3, sem chamar a CLI, com o link", async () => {
  const { exec, calls } = fakeCli(ok);
  const r = await withEnv({ VERSION_CONTROL_ACCESS: "manual" }, () =>
    captureRun(() => runCreateMerge(MERGE, { exec, ...NO_FILE_ENV }))
  );
  assert.equal(r.code, 3);
  assert.equal(calls.length, 0);
  assert.match(r.err, /manual: nada foi enviado.*compare\/main\.\.\.feat%2Fx/);
});

test("runCreateMerge: sucesso lê o --body-file e imprime o PR", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-merge-"));
  try {
    const body = join(dir, "pr.md");
    writeFileSync(body, "descrição");
    let sentBody = null;
    const exec = async (bin, args) => {
      if (args[0] === "--version" || args.includes("status")) return ok;
      sentBody = readFileSync(args[args.indexOf("--body-file") + 1], "utf-8");
      return { code: 0, stdout: "https://github.com/o/r/pull/5\n", stderr: "" };
    };
    const r = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
      captureRun(() => runCreateMerge({ ...MERGE, bodyFile: body }, { exec, ...NO_FILE_ENV }))
    );
    assert.equal(r.code, 0);
    assert.match(r.out, /PR criado: https:\/\/github.com\/o\/r\/pull\/5/);
    assert.equal(sentBody, "descrição");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runCreateMerge: sem login sai com 3 e mostra o link; enviado com erro sai com 4 sem link", async () => {
  const noLogin = async (_b, args) =>
    args[0] === "--version" ? ok : { code: 1, stdout: "", stderr: "" };
  const a = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge(MERGE, { exec: noLogin, ...NO_FILE_ENV }))
  );
  assert.equal(a.code, 3);
  assert.match(a.err, /Abra o PR à mão: https:\/\/github.com\/o\/r\/compare/);
  const { exec } = fakeCli({ code: 1, stdout: "", stderr: "boom" });
  const b = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge(MERGE, { exec, ...NO_FILE_ENV }))
  );
  assert.equal(b.code, 4);
  assert.match(b.err, /pode ter sido criado/);
  assert.equal(/à mão/.test(b.err), false);
});

test("runCreateMerge: no GitLab, a mensagem usa MR (vendor vindo do createMergeRequest)", async () => {
  const GL = { ...MERGE, repo: "https://gitlab.com/o/r" };
  const ok0 = async (_b, args) =>
    args[0] === "--version" || args.includes("status")
      ? ok
      : { code: 0, stdout: "https://gitlab.com/o/r/-/merge_requests/7\n", stderr: "" };
  const a = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge(GL, { exec: ok0, ...NO_FILE_ENV }))
  );
  assert.equal(a.code, 0);
  assert.match(a.out, /MR criado: https:\/\/gitlab.com\/o\/r\/-\/merge_requests\/7/);
  const { exec } = fakeCli({ code: 1, stdout: "", stderr: "boom" });
  const b = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge(GL, { exec, ...NO_FILE_ENV }))
  );
  assert.equal(b.code, 4);
  assert.match(b.err, /O MR pode ter sido criado/);
  const noLogin = async (_b, args) =>
    args[0] === "--version" ? ok : { code: 1, stdout: "", stderr: "" };
  const c = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge(GL, { exec: noLogin, ...NO_FILE_ENV }))
  );
  assert.equal(c.code, 3);
  assert.match(c.err, /Abra o MR à mão: https:\/\/gitlab.com\/o\/r/);
});

test("runCreateMerge: host não suportado (Bitbucket) sai com 3, sem chamar a CLI e sem link", async () => {
  const { exec, calls } = fakeCli(ok);
  const r = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() =>
      runCreateMerge(
        { ...MERGE, repo: "https://bitbucket.org/ws/repo.git" },
        { exec, ...NO_FILE_ENV }
      )
    )
  );
  assert.equal(r.code, 3);
  assert.equal(calls.length, 0);
  assert.match(r.err, /Bitbucket não é suportado/);
  assert.equal(/à mão/.test(r.err), false);
});

test("runCreateMerge: branch inválida sai com 1", async () => {
  const { exec } = fakeCli(ok);
  const r = await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    captureRun(() => runCreateMerge({ ...MERGE, source: "a b" }, { exec, ...NO_FILE_ENV }))
  );
  assert.equal(r.code, 1);
});

test("cardUrl: não mostra usuário e senha embutidos na URL base", () => {
  assert.equal(
    cardUrl("jira", "https://user:segredo@empresa.atlassian.net/", "ABC-1"),
    "https://empresa.atlassian.net/browse/ABC-1"
  );
});

test("newMergeRequestUrl: sem target", () => {
  assert.equal(
    newMergeRequestUrl("https://github.com/o/r", "feat/x"),
    "https://github.com/o/r/compare/feat%2Fx?expand=1"
  );
  assert.equal(
    newMergeRequestUrl("https://gitlab.com/g/r", "feat/x"),
    "https://gitlab.com/g/r/-/merge_requests/new?merge_request[source_branch]=feat%2Fx"
  );
});

test("runCreateMerge: VERSION_CONTROL_ACCESS=manual vindo do ENV.md (o eng.pr não exporta o ENV) sai com 3", async () => {
  const { exec, calls } = fakeCli(ok);
  const r = await withEnv({ VERSION_CONTROL_ACCESS: undefined }, () =>
    captureRun(() => runCreateMerge(MERGE, { exec, fileEnv: { VERSION_CONTROL_ACCESS: "manual" } }))
  );
  assert.equal(r.code, 3);
  assert.equal(calls.length, 0);
});

test("createMergeRequest: confere o login no host do repositório (auth status --hostname)", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://ghe.empresa.com/o/r/pull/1\n",
    stderr: "",
  });
  await withEnv({ VERSION_CONTROL: "github" }, () =>
    createMergeRequest(
      "https://ghe.empresa.com/o/r",
      { source: "a", target: "b", title: "t" },
      { exec }
    )
  );
  const auth = calls.find((c) => c.args.includes("status"));
  assert.deepEqual(auth.args, ["auth", "status", "--hostname", "ghe.empresa.com"]);
});

test("parseRepoUrl: remote ssh:// com porta vira https do host (sem a porta do SSH)", () => {
  const r = parseRepoUrl("ssh://git@gitlab.empresa.com:2222/grupo/sub/repo.git");
  assert.equal(r.vendor, "gitlab");
  assert.equal(r.origin, "https://gitlab.empresa.com");
  assert.equal(r.projectPath, "grupo/sub/repo");
});

test("createMergeRequest: GitLab self-hosted em subgrupo usa a URL completa no --repo", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://git.corp.com/g/sub/r/-/merge_requests/2\n",
    stderr: "",
  });
  await withEnv({ VERSION_CONTROL: "gitlab" }, () =>
    createMergeRequest(
      "https://git.corp.com/g/sub/r.git",
      { source: "a", target: "b", title: "t" },
      { exec }
    )
  );
  const w = writeCall(calls);
  assert.equal(w.args[w.args.indexOf("--repo") + 1], "https://git.corp.com/g/sub/r");
});

// --- Segunda passada do pre-pr (#181) ----------------------------------------

test("createMergeRequest: manual, valor inválido ou ENV.md ilegível não chamam a CLI (vale para o Central docs)", async () => {
  const { exec, calls } = fakeCli(ok);
  const opts = { source: "a", target: "b", title: "t" };
  await withEnv({ VERSION_CONTROL_ACCESS: undefined }, async () => {
    for (const fileEnv of [
      { VERSION_CONTROL_ACCESS: "manual" },
      { VERSION_CONTROL_ACCESS: "manul" },
      { VERSION_CONTROL_ACCESS: '"manual"' },
      { VERSION_CONTROL_ACCESS: "manual # opt-out" },
    ]) {
      await assert.rejects(
        () => createMergeRequest("https://github.com/o/r", opts, { exec, fileEnv }),
        (e) => e.sent === false && e.exitCode === 3,
        JSON.stringify(fileEnv)
      );
    }
    await assert.rejects(
      () =>
        createMergeRequest("https://github.com/o/r", opts, {
          exec,
          fileEnvResult: { vars: {}, error: "Múltiplos ENV.md" },
        }),
      (e) => e.sent === false && /não deu para ler o ENV.md/.test(e.message)
    );
  });
  assert.equal(calls.length, 0);
});

test("createMergeRequest: VERSION_CONTROL_ACCESS=cli no ambiente vence o ENV.md ilegível", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://github.com/o/r/pull/3\n",
    stderr: "",
  });
  await withEnv({ VERSION_CONTROL_ACCESS: "cli" }, () =>
    createMergeRequest(
      "https://github.com/o/r",
      { source: "a", target: "b", title: "t" },
      { exec, fileEnvResult: { vars: {}, error: "Múltiplos" } }
    )
  );
  assert.equal(
    calls.some((c) => c.args[0] === "pr"),
    true
  );
});

test("createMergeRequest: host próprio usa o VERSION_CONTROL do ENV.md para achar o vendor", async () => {
  const { exec, calls } = fakeCli({
    code: 0,
    stdout: "https://git.corp.com/g/r/-/merge_requests/1\n",
    stderr: "",
  });
  await withEnv({ VERSION_CONTROL: undefined, VERSION_CONTROL_ACCESS: undefined }, () =>
    createMergeRequest(
      "https://git.corp.com/g/r",
      { source: "a", target: "b", title: "t" },
      { exec, fileEnv: { VERSION_CONTROL: "gitlab" } }
    )
  );
  assert.equal(writeCall(calls).bin, "glab");
});

test("cardUrl: URL base sem https:// também não mostra a credencial", () => {
  assert.equal(cardUrl("jira", "u:tok@x.atlassian.net", "ABC-1"), "x.atlassian.net/browse/ABC-1");
  assert.equal(cardUrl("jira", "x.atlassian.net:443", "ABC-1"), "x.atlassian.net:443/browse/ABC-1");
});

test("runCreateMerge: aviso de acesso vazio só quando o VERSION_CONTROL é um vendor do catálogo", async () => {
  const { exec } = fakeCli({ code: 0, stdout: "https://github.com/o/r/pull/1\n", stderr: "" });
  const env = { VERSION_CONTROL_ACCESS: undefined, VERSION_CONTROL: undefined };
  const a = await withEnv(env, () =>
    captureRun(() => runCreateMerge(MERGE, { exec, fileEnv: { VERSION_CONTROL: "github" } }))
  );
  assert.match(a.err, /VERSION_CONTROL_ACCESS vazio/);
  const b = await withEnv(env, () =>
    captureRun(() =>
      runCreateMerge(MERGE, { exec, fileEnv: { VERSION_CONTROL: "[github, gitlab]" } })
    )
  );
  assert.equal(/vazio/.test(b.err), false);
});

test("runCreateIssue: --body-file inexistente sai com 1; repo com caractere inválido sai com 1 (uso)", async () => {
  const { exec, calls } = fakeCli(ok);
  const a = await captureRun(() =>
    runCreateIssue(
      { repo: "https://github.com/o/r", title: "t", bodyFile: "/nao/existe/181" },
      { exec }
    )
  );
  assert.equal(a.code, 1);
  assert.match(a.err, /não encontrado/);
  const dir = mkdtempSync(join(tmpdir(), "jarvis-issue-"));
  try {
    const body = join(dir, "b.md");
    writeFileSync(body, "corpo");
    const b = await captureRun(() =>
      runCreateIssue({ repo: "https://github.com/o/r$x", title: "t", bodyFile: body }, { exec })
    );
    assert.equal(b.code, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.equal(calls.filter((c) => c.args[0] === "issue").length, 0);
});

test("parseRepoUrl: ssh:// sem usuário, sem porta e git+ssh://", () => {
  assert.equal(parseRepoUrl("ssh://github.com/o/r.git").origin, "https://github.com");
  assert.equal(parseRepoUrl("ssh://git@gitlab.com/g/r").projectPath, "g/r");
  const r = parseRepoUrl("git+ssh://git@github.com/o/r.git");
  assert.equal(r.origin, "https://github.com");
  assert.equal(r.projectPath, "o/r");
});

// --- Terceira passada do pre-pr (#181) ---------------------------------------

test("runCreateMerge --ide com dois ENV.md reais no workspace: o PR abre (o ENV.md resolvido chega ao createMergeRequest)", async () => {
  const ws = mkdtempSync(join(tmpdir(), "jarvis-two-envs-"));
  const prevCwd = process.cwd();
  try {
    mkdirSync(join(ws, ".claude"));
    mkdirSync(join(ws, ".cursor"));
    writeFileSync(
      join(ws, ".claude", "ENV.md"),
      "VERSION_CONTROL=github\nVERSION_CONTROL_ACCESS=cli\n"
    );
    writeFileSync(
      join(ws, ".cursor", "ENV.md"),
      "VERSION_CONTROL=github\nVERSION_CONTROL_ACCESS=manual\n"
    );
    process.chdir(ws);
    const { exec, calls } = fakeCli({
      code: 0,
      stdout: "https://github.com/o/r/pull/9\n",
      stderr: "",
    });
    const env = {
      JARVIS_ENV_FILE: undefined,
      VERSION_CONTROL_ACCESS: undefined,
      VERSION_CONTROL: undefined,
      IDE: undefined,
    };
    const a = await withEnv(env, () =>
      captureRun(() => runCreateMerge({ ...MERGE, ide: "claude" }, { exec }))
    );
    assert.equal(a.code, 0, a.err);
    assert.equal(
      calls.some((c) => c.args[0] === "pr"),
      true
    );
    const b = await withEnv(env, () =>
      captureRun(() => runCreateMerge({ ...MERGE, ide: "cursor" }, { exec }))
    );
    assert.equal(b.code, 3);
    assert.match(b.err, /manual/);
    const c = await withEnv(env, () => captureRun(() => runCreateMerge(MERGE, { exec })));
    assert.equal(c.code, 3);
    assert.match(c.err, /--ide ou --env-file/);
  } finally {
    process.chdir(prevCwd);
    rmSync(ws, { recursive: true, force: true });
  }
});
