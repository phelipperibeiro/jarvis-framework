// Testes do `jarvis tasks comment` (bin/lib/tasks/comment.js). Rode com: npm run test:filtro
// A CLI do vendor é falsa (`exec` injetado); nenhum token é lido.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { boardRepo, commentOnCard, isFreelance } from "../bin/lib/tasks/comment.js";

const ENV_KEYS = [
  "TASK_MANAGER",
  "TASK_MANAGER_ACCESS",
  "TASK_MANAGER_URL_BASE",
  "TOKEN_TASK_MANAGER",
  "JARVIS_ENV_FILE",
];

// ENV.md vazio: o comando lê o ENV.md do workspace no que faltar no ambiente, e o teste
// não pode depender do ENV.md real de quem roda.
const EMPTY_ENV = join(mkdtempSync(join(tmpdir(), "jarvis-empty-env-")), "ENV.md");
writeFileSync(EMPTY_ENV, "");

async function withEnv(vars, fn) {
  const prev = {};
  for (const k of ENV_KEYS) {
    prev[k] = process.env[k];
    delete process.env[k];
  }
  process.env.JARVIS_ENV_FILE = EMPTY_ENV;
  Object.assign(process.env, vars);
  try {
    return await fn();
  } finally {
    for (const k of ENV_KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
}

const ok = { code: 0, stdout: "", stderr: "" };
function fakeCli(res = ok) {
  const calls = [];
  const exec = async (bin, args) => {
    calls.push({ bin, args });
    if (args[0] === "--version" || (args.includes("auth") && args.includes("status"))) return ok;
    return res;
  };
  return { exec, calls };
}

test("isFreelance: vazio e a lista de exemplo (nova ou antiga) contam como sem board", () => {
  assert.equal(isFreelance(""), true);
  assert.equal(isFreelance("[jira, linear, github, asana]"), true);
  assert.equal(isFreelance("[jira, github, gitlab]"), true);
  assert.equal(isFreelance("github"), false);
});

test("boardRepo: tira o repo do TASK_MANAGER_URL_BASE", () => {
  assert.deepEqual(boardRepo("https://github.com/o/r/"), {
    repo: "github.com/o/r",
    repo_url: "https://github.com/o/r",
    host: "github.com",
  });
  assert.equal(boardRepo("https://empresa.atlassian.net"), null);
  assert.equal(boardRepo(""), null);
});

test("freelance: sai 0 sem chamar a CLI (sem jira como padrão)", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv({}, () => commentOnCard("F-042", "msg", { exec }));
  assert.equal(r.code, 0);
  assert.match(r.out[0], /freelance/);
  assert.equal(calls.length, 0);
});

test("vendor não suportado (linear) sai 3 sem chamar a CLI", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv({ TASK_MANAGER: "linear" }, () => commentOnCard("ENG-1", "m", { exec }));
  assert.equal(r.code, 3);
  assert.match(r.err[0], /não é suportado/);
  assert.equal(calls.length, 0);
});

test("TASK_MANAGER_ACCESS=manual sai 3 sem chamar a CLI", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv({ TASK_MANAGER: "github", TASK_MANAGER_ACCESS: "manual" }, () =>
    commentOnCard("1", "m", { exec })
  );
  assert.equal(r.code, 3);
  assert.equal(calls.length, 0);
});

test("github sem TASK_MANAGER_URL_BASE sai 3 com a instrução", async () => {
  const r = await withEnv({ TASK_MANAGER: "github", TASK_MANAGER_ACCESS: "cli" }, () =>
    commentOnCard("1", "m", { exec: fakeCli().exec })
  );
  assert.equal(r.code, 3);
  assert.match(r.err.join("\n"), /TASK_MANAGER_URL_BASE/);
});

test("github: gh issue comment no repo do URL base, sem token (resolve o #124)", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv(
    {
      TASK_MANAGER: "github",
      TASK_MANAGER_ACCESS: "cli",
      TASK_MANAGER_URL_BASE: "https://github.com/o/r",
    },
    () => commentOnCard("#181", "oi", { exec })
  );
  assert.equal(r.code, 0);
  assert.match(r.out.join("\n"), /https:\/\/github.com\/o\/r\/issues\/181/);
  const w = calls.find((c) => c.args[0] === "issue");
  assert.deepEqual(w.args.slice(0, 5), ["issue", "comment", "181", "--repo", "github.com/o/r"]);
});

test("ACCESS vazio: tenta a CLI e avisa para rodar o /jarvis-init", async () => {
  const r = await withEnv(
    { TASK_MANAGER: "github", TASK_MANAGER_URL_BASE: "https://github.com/o/r" },
    () => commentOnCard("1", "oi", { exec: fakeCli().exec })
  );
  assert.equal(r.code, 0);
  assert.match(r.err[0], /jarvis-init/);
});

test("jira: acli sem repo; erro depois de enviar sai 4 com o aviso de conferir", async () => {
  const { exec, calls } = fakeCli({ code: 1, stdout: "", stderr: "boom" });
  const r = await withEnv({ TASK_MANAGER: "jira", TASK_MANAGER_ACCESS: "cli" }, () =>
    commentOnCard("ABC-1", "**x**", { exec })
  );
  assert.equal(r.code, 4);
  assert.match(r.err[0], /confira no card antes de repetir/);
  const w = calls.find((c) => c.args[1] === "workitem");
  assert.equal(w.bin, "acli");
  assert.deepEqual(w.args.slice(0, 6), ["jira", "workitem", "comment", "create", "--key", "ABC-1"]);
});

test("TOKEN_TASK_MANAGER preenchido não é usado nem aparece na saída", async () => {
  const r = await withEnv(
    {
      TASK_MANAGER: "github",
      TASK_MANAGER_URL_BASE: "https://github.com/o/r",
      TOKEN_TASK_MANAGER: "segredo-123",
    },
    () => commentOnCard("1", "oi", { exec: fakeCli().exec })
  );
  assert.equal([...r.out, ...r.err].join("\n").includes("segredo-123"), false);
});

// --- Correções do pre-pr (#181) ---------------------------------------------

test("github/gitlab: key que não é número sai com 1 sem chamar a CLI", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv(
    {
      TASK_MANAGER: "github",
      TASK_MANAGER_ACCESS: "cli",
      TASK_MANAGER_URL_BASE: "https://github.com/o/r",
    },
    () => commentOnCard("TASK-12", "m", { exec })
  );
  assert.equal(r.code, 1);
  assert.equal(calls.length, 0);
  const empty = await withEnv(
    {
      TASK_MANAGER: "gitlab",
      TASK_MANAGER_ACCESS: "cli",
      TASK_MANAGER_URL_BASE: "https://gitlab.com/g/r",
    },
    () => commentOnCard("#", "m", { exec })
  );
  assert.equal(empty.code, 1);
});

test("TASK_MANAGER_ACCESS com a lista de opções do template conta como vazio (avisa e tenta a CLI)", async () => {
  const r = await withEnv(
    {
      TASK_MANAGER: "github",
      TASK_MANAGER_ACCESS: "[cli, manual]",
      TASK_MANAGER_URL_BASE: "https://github.com/o/r",
    },
    () => commentOnCard("1", "oi", { exec: fakeCli().exec })
  );
  assert.equal(r.code, 0);
  assert.match(r.err[0], /vazio/);
});

async function captureRun(fn) {
  const real = { exit: process.exit, log: console.log, error: console.error };
  const out = [];
  let code = 0;
  process.exit = (c) => {
    code = c;
    throw new Error("__exit__");
  };
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => out.push(a.join(" "));
  try {
    await fn();
  } catch (e) {
    if (e.message !== "__exit__") throw e;
  } finally {
    process.exit = real.exit;
    console.log = real.log;
    console.error = real.error;
  }
  return { code, out: out.join("\n") };
}

test("runComment: --body-file lido; arquivo inexistente e falta de texto saem com 1", async () => {
  const { runComment } = await import("../bin/lib/tasks/comment.js");
  const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "jarvis-comment-"));
  try {
    const file = join(dir, "c.md");
    writeFileSync(file, "texto do arquivo");
    let sent = null;
    const exec = async (_b, args) => {
      if (args[0] === "--version" || args.includes("status")) return ok;
      sent = readFileSync(args[args.indexOf("--body-file") + 1], "utf-8");
      return ok;
    };
    const env = {
      TASK_MANAGER: "github",
      TASK_MANAGER_ACCESS: "cli",
      TASK_MANAGER_URL_BASE: "https://github.com/o/r",
    };
    const a = await withEnv(env, () =>
      captureRun(() => runComment("1", "", { bodyFile: file }, { exec }))
    );
    assert.equal(a.code, 0);
    assert.equal(sent, "texto do arquivo");
    const b = await withEnv(env, () =>
      captureRun(() => runComment("1", "", { bodyFile: join(dir, "x.md") }, { exec }))
    );
    assert.equal(b.code, 1);
    assert.match(b.out, /não encontrado/);
    const c = await withEnv(env, () => captureRun(() => runComment("1", "", {}, { exec })));
    assert.equal(c.code, 1);
    assert.match(c.out, /Uso: jarvis tasks comment/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sem a variável no ambiente, usa o ENV.md do workspace (sem eval no shell)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-envfile-"));
  const file = join(dir, "ENV.md");
  writeFileSync(
    file,
    "TASK_MANAGER=github\nTASK_MANAGER_ACCESS=manual\nTASK_MANAGER_URL_BASE=https://github.com/o/r\n"
  );
  const { exec, calls } = fakeCli();
  const r = await withEnv({ JARVIS_ENV_FILE: file }, () => commentOnCard("1", "m", { exec }));
  assert.equal(r.code, 3);
  assert.match(r.err[0], /manual/);
  assert.equal(calls.length, 0);
});

test("jira: key inválida (com espaço) sai com 1 sem enviar", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv({ TASK_MANAGER: "jira", TASK_MANAGER_ACCESS: "cli" }, () =>
    commentOnCard("a b", "m", { exec })
  );
  assert.equal(r.code, 1);
  assert.equal(calls.length, 0);
});

test("TASK_MANAGER_ACCESS com valor inválido, entre aspas ou com comentário: só cli segue", async () => {
  const base = { TASK_MANAGER: "github", TASK_MANAGER_URL_BASE: "https://github.com/o/r" };
  const { exec, calls } = fakeCli();
  const invalid = await withEnv({ ...base, TASK_MANAGER_ACCESS: "manul" }, () =>
    commentOnCard("1", "m", { exec })
  );
  assert.equal(invalid.code, 3);
  assert.match(invalid.err[0], /valor inválido/);
  const quoted = await withEnv({ ...base, TASK_MANAGER_ACCESS: '"manual"' }, () =>
    commentOnCard("1", "m", { exec })
  );
  assert.equal(quoted.code, 3);
  const commented = await withEnv({ ...base, TASK_MANAGER_ACCESS: "cli # padrão" }, () =>
    commentOnCard("1", "m", { exec })
  );
  assert.equal(commented.code, 0);
  assert.equal(calls.filter((c) => c.args[0] === "issue").length, 1);
});

test("ENV.md ilegível sem TASK_MANAGER no ambiente sai com 3 (não vira freelance às cegas)", async () => {
  const { exec, calls } = fakeCli();
  const r = await withEnv({}, () =>
    commentOnCard("1", "m", { exec, fileEnvResult: { vars: {}, error: "Múltiplos ENV.md" } })
  );
  assert.equal(r.code, 3);
  assert.match(r.err[0], /--ide ou --env-file/);
  assert.equal(calls.length, 0);
});
