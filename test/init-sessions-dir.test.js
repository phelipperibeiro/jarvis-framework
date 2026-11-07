// `jarvis init` respeita o SESSIONS_DIR do ENV.md (#228): pastas de sessão e .gitignore. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { planSessionsSetup } from "../bin/lib/core/env-paths.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "bin", "jarvis.js");

/** Workspace temporário; `repo` cria um `.git` (raiz versionada). */
function withWorkspace({ env, repo = true }, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-init-sessions-"));
  try {
    if (repo) mkdirSync(join(dir, ".git"));
    if (env !== undefined) {
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(join(dir, ".claude/ENV.md"), `${env}\n`);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const init = (cwd) =>
  spawnSync(process.execPath, [cli, "init", "--ide", "claude", "--force"], {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
  });

const gitignore = (ws) => (existsSync(join(ws, ".gitignore")) ? readFileSync(join(ws, ".gitignore"), "utf-8") : "");
const areas = (dir) => readdirSync(dir).sort();

// --- planSessionsSetup (função pura) -------------------------------------------

test("planSessionsSetup: sem a chave vale o padrão .jarvis/sessions", () => {
  const p = planSessionsSetup({ workspaceDir: "/w", isRepo: true });
  assert.equal(p.sessionsDir, "/w/.jarvis/sessions");
  assert.deepEqual(p.areaDirs, ["/w/.jarvis/sessions/eng", "/w/.jarvis/sessions/prod", "/w/.jarvis/sessions/qa"]);
  assert.deepEqual(p.gitignore, [".jarvis/"]);
  assert.deepEqual(p.warnings, []);
});

test("planSessionsSetup: relativo fora de .jarvis entra no .gitignore, além de .jarvis/", () => {
  const p = planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: "tmp/sessoes" }, isRepo: true });
  assert.equal(p.sessionsDir, "/w/tmp/sessoes");
  assert.deepEqual(p.gitignore, [".jarvis/", "tmp/sessoes/"]);
});

test("planSessionsSetup: com variável (e padrões do template)", () => {
  const p = planSessionsSetup({
    workspaceDir: "/w",
    env: { SESSIONS_DIR: "$DOCS_FOLDER/sessoes", DOCS_FOLDER: "documentos" },
    isRepo: true,
  });
  assert.equal(p.sessionsDir, "/w/documentos/sessoes");
});

test("planSessionsSetup: dentro de .jarvis não repete linha; absoluto avisa e não entra no .gitignore", () => {
  assert.deepEqual(planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: ".jarvis/outras" }, isRepo: true }).gitignore, [".jarvis/"]);
  const abs = planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: "/srv/sessoes" }, isRepo: true });
  assert.equal(abs.sessionsDir, "/srv/sessoes");
  assert.deepEqual(abs.gitignore, [".jarvis/"]);
  assert.equal(abs.warnings.length, 1);
  const fora = planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: "../fora" }, isRepo: true });
  assert.equal(fora.warnings.length, 1);
});

test("planSessionsSetup: SESSIONS_DIR igual à raiz do workspace tem aviso próprio (não 'fora da raiz')", () => {
  for (const v of [".", "./", "/w", "/w/"]) {
    const p = planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: v }, isRepo: true });
    assert.equal(p.sessionsDir, "/w", v);
    assert.deepEqual(p.gitignore, [".jarvis/"], v);
    assert.equal(p.warnings.length, 1, v);
    assert.match(p.warnings[0], /própria raiz do workspace/, v);
    assert.doesNotMatch(p.warnings[0], /fora da raiz/, v);
  }
});

test("planSessionsSetup: .jarvis exato não repete linha; .jarvisx/… (só começa igual) entra no .gitignore", () => {
  assert.deepEqual(planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: ".jarvis" }, isRepo: true }).gitignore, [".jarvis/"]);
  assert.deepEqual(planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: ".jarvisx/s" }, isRepo: true }).gitignore, [".jarvis/", ".jarvisx/s/"]);
  assert.deepEqual(planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: ".jarvis-outro/s" }, isRepo: true }).gitignore, [".jarvis/", ".jarvis-outro/s/"]);
});

test("planSessionsSetup: raiz sem .git não gera linha de .gitignore nem aviso", () => {
  const p = planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: "/srv/s" }, isRepo: false });
  assert.deepEqual(p.gitignore, []);
  assert.deepEqual(p.warnings, []);
});

test("planSessionsSetup: variável sem valor lança EnvPathError", () => {
  assert.throws(
    () => planSessionsSetup({ workspaceDir: "/w", env: { SESSIONS_DIR: "$NAO_EXISTE/x" }, isRepo: true }),
    /SESSIONS_DIR.*\$NAO_EXISTE/s
  );
});

// --- jarvis init (processo real) ------------------------------------------------

test("init sem ENV.md: cria .jarvis/sessions/{eng,prod,qa} e .jarvis/ no .gitignore", () => {
  withWorkspace({}, (ws) => {
    const r = init(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(areas(join(ws, ".jarvis/sessions")), ["eng", "prod", "qa"]);
    assert.match(gitignore(ws), /^\.jarvis\/$/m);
  });
});

test("init com SESSIONS_DIR=tmp/sessoes: cria nesse caminho, não cria .jarvis/sessions e põe no .gitignore", () => {
  withWorkspace({ env: "SESSIONS_DIR=tmp/sessoes" }, (ws) => {
    const r = init(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(areas(join(ws, "tmp/sessoes")), ["eng", "prod", "qa"]);
    assert.ok(!existsSync(join(ws, ".jarvis/sessions")), "antes: criava .jarvis/sessions de qualquer jeito");
    const ig = gitignore(ws);
    assert.match(ig, /^\.jarvis\/$/m);
    assert.match(ig, /^tmp\/sessoes\/$/m);
  });
});

test("init com SESSIONS_DIR=$DOCS_FOLDER/sessoes: expande a variável e não cria pasta com $", () => {
  withWorkspace({ env: "DOCS_FOLDER=documentos\nSESSIONS_DIR=$DOCS_FOLDER/sessoes" }, (ws) => {
    const r = init(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(areas(join(ws, "documentos/sessoes")), ["eng", "prod", "qa"]);
    assert.deepEqual(readdirSync(ws).filter((n) => n.includes("$")), []);
  });
});

test("init com SESSIONS_DIR absoluto: cria lá, avisa e deixa só .jarvis/ no .gitignore", () => {
  const abs = mkdtempSync(join(tmpdir(), "jarvis-init-sessions-abs-"));
  try {
    withWorkspace({ env: `SESSIONS_DIR=${abs}` }, (ws) => {
      const r = init(ws);
      assert.equal(r.status, 0, r.stderr);
      assert.deepEqual(areas(abs), ["eng", "prod", "qa"]);
      assert.match(r.stdout, /fora da raiz do repositório/);
      assert.equal(gitignore(ws).trim(), ".jarvis/");
    });
  } finally {
    rmSync(abs, { recursive: true, force: true });
  }
});

test("init com variável sem valor no SESSIONS_DIR: erro claro, status 1 e nenhuma pasta de sessão criada", () => {
  withWorkspace({ env: "SESSIONS_DIR=$NAO_EXISTE/x" }, (ws) => {
    const r = init(ws);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /SESSIONS_DIR.*\$NAO_EXISTE\/x/s);
    assert.ok(!existsSync(join(ws, ".jarvis/sessions")));
    assert.deepEqual(readdirSync(ws).filter((n) => n.includes("$")), []);
  });
});

test("init sem .git na raiz (modo workspace): cria as pastas e não cria .gitignore", () => {
  withWorkspace({ env: "SESSIONS_DIR=tmp/sessoes", repo: false }, (ws) => {
    const r = init(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(areas(join(ws, "tmp/sessoes")), ["eng", "prod", "qa"]);
    assert.ok(!existsSync(join(ws, ".gitignore")));
  });
});
