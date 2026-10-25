// Testes dos adapters de Git host (vcs/api.js + git-parser.js). Rode com: npm run test:filtro
//
// createMergeRequest/createIssue chamam a CLI do vendor (gh/glab) pelo runner
// (bin/lib/integrations/cli-runner.js). O `exec` é injetado pelo terceiro parâmetro
// (`deps`): nenhum teste chama a CLI de verdade nem depende do login da máquina.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMergeRequest,
  createIssue,
  cardUrl,
  parseRepoUrl,
  mergeRequestPath,
  newMergeRequestUrl,
} from "../bin/lib/vcs/api.js";
import { parseLabels, runCreateIssue } from "../bin/lib/vcs/create-issue.js";

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
    (e) => e.sent === false && e.exitCode === 3 && /Falha ao criar PR github/.test(e.message)
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
    (e) => e.sent === true && e.exitCode === 4 && /already exists/.test(e.message)
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
