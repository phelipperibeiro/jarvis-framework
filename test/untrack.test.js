// `jarvis untrack` (#227): tira AGENTS.md/CLAUDE.md versionados do índice, sem apagar o arquivo e sem
// commit. Integração com git de verdade em pasta temporária. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "bin", "jarvis.js");

// Isola os testes da configuração global do git de quem roda (gpgsign, hooks, excludesFile, templates).
process.env.GIT_CONFIG_GLOBAL = "/dev/null";
process.env.GIT_CONFIG_NOSYSTEM = "1";
const IDENTITY = [
  "-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null",
];

const git = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

const run = (cwd, ...args) =>
  spawnSync(process.execPath, [cli, "untrack", ...args], {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
  });

/** Repositório git real na raiz, com `.claude/ENV.md` e os arquivos dados já commitados. */
function withRepo(files, fn, { env = true } = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "jarvis-untrack-")));
  try {
    git(dir, "init", "-q");
    if (env) {
      mkdirSync(join(dir, ".claude"));
      writeFileSync(join(dir, ".claude", "ENV.md"), "IDE=claude\n");
    }
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    git(dir, "add", "-A");
    git(dir, ...IDENTITY, "commit", "-q", "-m", "base");
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const commits = (dir) => git(dir, "rev-list", "--count", "HEAD").trim();
const tracked = (dir, file) => git(dir, "ls-files", file).trim() === file;

test("untrack: tira AGENTS.md do índice, mantém o arquivo, deixa staged e não cria commit", () => {
  withRepo({ "AGENTS.md": "# do time\n" }, (dir) => {
    const before = commits(dir);
    const r = run(dir, "AGENTS.md");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /AGENTS\.md: removido do índice \(staged\)/);
    assert.match(r.stdout, /Nenhum commit foi criado/);
    assert.ok(!tracked(dir, "AGENTS.md"));
    assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf-8"), "# do time\n");
    assert.match(git(dir, "status", "--porcelain"), /^D {2}AGENTS\.md$/m);
    assert.equal(commits(dir), before);
    assert.ok(readFileSync(join(dir, ".git/info/exclude"), "utf-8").split(/\r?\n/).includes("AGENTS.md"));
  });
});

test("untrack: AGENTS.md e CLAUDE.md juntos, cada um com a sua remoção", () => {
  withRepo({ "AGENTS.md": "# a\n", "CLAUDE.md": "# c\n" }, (dir) => {
    const r = run(dir, "AGENTS.md", "CLAUDE.md");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!tracked(dir, "AGENTS.md") && !tracked(dir, "CLAUDE.md"));
    assert.equal(readFileSync(join(dir, "CLAUDE.md"), "utf-8"), "# c\n");
  });
});

test("untrack: depois do commit da pessoa, o arquivo não aparece como novo no status", () => {
  withRepo({ "AGENTS.md": "# do time\n" }, (dir) => {
    assert.equal(run(dir, "AGENTS.md").status, 0);
    git(dir, ...IDENTITY, "commit", "-q", "-m", "tira AGENTS.md do git");
    assert.equal(git(dir, "ls-files", "AGENTS.md").trim(), "");
    assert.equal(git(dir, "status", "--porcelain").trim(), "");
  });
});

test("untrack: arquivo que não está versionado sai com 1 e nada muda", () => {
  withRepo({ "README.md": "x\n" }, (dir) => {
    writeFileSync(join(dir, "AGENTS.md"), "# novo, nunca commitado\n");
    const r = run(dir, "AGENTS.md");
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /AGENTS\.md: AGENTS\.md não está versionado/);
    assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf-8"), "# novo, nunca commitado\n");
  });
});

test("untrack: nome fora da lista é recusado e o arquivo continua versionado", () => {
  withRepo({ "README.md": "x\n" }, (dir) => {
    const r = run(dir, "README.md");
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /só AGENTS\.md e CLAUDE\.md/);
    assert.ok(tracked(dir, "README.md"));
  });
});

test("untrack: um nome recusado não impede os outros, mas o código de saída é 1", () => {
  withRepo({ "AGENTS.md": "# a\n", "README.md": "x\n" }, (dir) => {
    const r = run(dir, "README.md", "AGENTS.md");
    assert.equal(r.status, 1);
    assert.ok(!tracked(dir, "AGENTS.md"), "AGENTS.md saiu mesmo assim");
    assert.ok(tracked(dir, "README.md"));
  });
});

test("untrack: sem nenhum arquivo informado não é aceito", () => {
  withRepo({ "AGENTS.md": "# a\n" }, (dir) => {
    const r = run(dir);
    assert.notEqual(r.status, 0);
    assert.ok(tracked(dir, "AGENTS.md"));
  });
});

test("untrack: modo workspace (raiz sem .git) recusa e não cria arquivo de git", () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "jarvis-untrack-ws-")));
  try {
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude", "ENV.md"), "IDE=claude\n");
    mkdirSync(join(dir, "app"));
    git(join(dir, "app"), "init", "-q");
    writeFileSync(join(dir, "AGENTS.md"), "# a\n");
    const r = run(dir, "AGENTS.md");
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /não é um repositório/);
    assert.throws(() => git(dir, "rev-parse", "--git-dir"), "a raiz continua sem repositório");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("untrack: sem ENV.md recusa com saída 1 e não toca no índice (não age em repositório filho por acidente)", () => {
  withRepo(
    { "AGENTS.md": "# a\n" },
    (dir) => {
      const r = run(dir, "AGENTS.md");
      assert.equal(r.status, 1);
      assert.match(r.stderr + r.stdout, /ENV\.md não encontrado/);
      assert.ok(tracked(dir, "AGENTS.md"), "o arquivo continua versionado");
      assert.equal(git(dir, "diff", "--cached", "--name-only").trim(), "", "nada staged");
    },
    { env: false }
  );
});

test("untrack: com ENV.md na raiz, rodar de uma subpasta do repositório resolve a raiz e funciona", () => {
  withRepo({ "AGENTS.md": "# a\n", "pacote/x.txt": "x\n" }, (dir) => {
    const r = run(join(dir, "pacote"), "AGENTS.md");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!tracked(dir, "AGENTS.md"));
    assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf-8"), "# a\n");
  });
});

test("untrack: AGENTS.md já no exclude é idempotente (tira do índice sem duplicar a linha)", () => {
  withRepo({ "AGENTS.md": "# a\n" }, (dir) => {
    writeFileSync(join(dir, ".git", "info", "exclude"), "AGENTS.md\n", { flag: "a" });
    const r = run(dir, "AGENTS.md");
    assert.equal(r.status, 0, r.stderr);
    const linhas = readFileSync(join(dir, ".git/info/exclude"), "utf-8").split(/\r?\n/).filter((l) => l === "AGENTS.md");
    assert.equal(linhas.length, 1);
  });
});

test("untrack: --ide inválido sai com 1 e explica", () => {
  withRepo({ "AGENTS.md": "# a\n" }, (dir) => {
    const r = run(dir, "AGENTS.md", "--ide", "ide-que-nao-existe");
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /IDE não suportada/);
    assert.ok(tracked(dir, "AGENTS.md"));
  });
});

test("untrack: versão staged diferente do HEAD e do disco é recusada com o motivo do git, e nada muda", () => {
  withRepo({ "AGENTS.md": "v1\n" }, (dir) => {
    writeFileSync(join(dir, "AGENTS.md"), "v2\n");
    git(dir, "add", "AGENTS.md");
    writeFileSync(join(dir, "AGENTS.md"), "v3\n");
    const antes = git(dir, "diff", "--cached", "--name-only").trim();
    const r = run(dir, "AGENTS.md");
    assert.equal(r.status, 1);
    assert.match(r.stderr + r.stdout, /AGENTS\.md: git rm --cached falhou: .*staged content different/);
    assert.ok(tracked(dir, "AGENTS.md"), "continua rastreado");
    assert.equal(git(dir, "diff", "--cached", "--name-only").trim(), antes, "o índice não mudou");
    assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf-8"), "v3\n", "o arquivo local fica como estava");
  });
});
