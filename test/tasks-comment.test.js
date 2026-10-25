// Testes do `jarvis tasks comment` (bin/lib/tasks/comment.js). Rode com: npm run test:filtro
// A CLI do vendor é falsa (`exec` injetado); nenhum token é lido.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boardRepo, commentOnCard, isFreelance } from "../bin/lib/tasks/comment.js";

const ENV_KEYS = [
  "TASK_MANAGER",
  "TASK_MANAGER_ACCESS",
  "TASK_MANAGER_URL_BASE",
  "TOKEN_TASK_MANAGER",
];

async function withEnv(vars, fn) {
  const prev = {};
  for (const k of ENV_KEYS) {
    prev[k] = process.env[k];
    delete process.env[k];
  }
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
