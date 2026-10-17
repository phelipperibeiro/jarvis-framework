// Testes da detecção do modo de trabalho (workspace-mode.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectWorkspaceMode, normalizeWorkspaceMode } from "../bin/lib/core/workspace-mode.js";

function withTree(dirs, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-ws-mode-"));
  try {
    for (const d of dirs) mkdirSync(join(root, d), { recursive: true });
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("raiz com .git e sem subrepos: project", () => {
  withTree([".git", "src"], (root) => {
    assert.deepEqual(detectWorkspaceMode(root), { mode: "project", repos: [], warning: null });
  });
});

test("raiz sem .git e UMA subpasta com .git: workspace (não depende do número de repos)", () => {
  withTree([".claude", ".jarvis", "app/.git"], (root) => {
    const r = detectWorkspaceMode(root);
    assert.equal(r.mode, "workspace");
    assert.deepEqual(r.repos, ["app"]);
  });
});

test("raiz sem .git e várias subpastas com .git: workspace com todas, em ordem", () => {
  withTree(["repo-b/.git", "repo-a/.git", "docs"], (root) => {
    assert.deepEqual(detectWorkspaceMode(root).repos, ["repo-a", "repo-b"]);
  });
});

test("raiz sem .git e nenhuma subpasta com .git: project (padrão)", () => {
  withTree(["docs", "scripts"], (root) => {
    assert.equal(detectWorkspaceMode(root).mode, "project");
  });
});

test("raiz com .git e subpasta com .git (submódulo): project com aviso", () => {
  withTree([".git", "lib/.git"], (root) => {
    const r = detectWorkspaceMode(root);
    assert.equal(r.mode, "project");
    assert.match(r.warning, /submódulos/);
  });
});

test(".git como arquivo (worktree/submódulo) também conta", () => {
  withTree(["wt"], (root) => {
    writeFileSync(join(root, "wt", ".git"), "gitdir: ../x\n");
    assert.equal(detectWorkspaceMode(root).mode, "workspace");
  });
});

test("pastas ocultas e node_modules são ignoradas", () => {
  withTree([".claude/.git", "node_modules/pkg/.git", "node_modules/.git"], (root) => {
    assert.equal(detectWorkspaceMode(root).mode, "project");
  });
});

test("allowlist (WORKSPACE_REPOS) restringe os repositórios considerados", () => {
  withTree(["a/.git", "b/.git"], (root) => {
    assert.deepEqual(detectWorkspaceMode(root, { repos: ["b"] }).repos, ["b"]);
    assert.equal(detectWorkspaceMode(root, { repos: ["inexistente"] }).mode, "project");
  });
});

test("pasta inexistente: project, sem lançar erro", () => {
  assert.equal(detectWorkspaceMode(join(tmpdir(), "jarvis-nao-existe-xyz")).mode, "project");
});

test("normalizeWorkspaceMode: aceita só workspace ou project", () => {
  assert.equal(normalizeWorkspaceMode(" Workspace "), "workspace");
  assert.equal(normalizeWorkspaceMode("PROJECT"), "project");
  assert.equal(normalizeWorkspaceMode("disabled"), null);
  assert.equal(normalizeWorkspaceMode(""), null);
  assert.equal(normalizeWorkspaceMode(undefined), null);
});
