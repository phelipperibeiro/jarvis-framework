// Repositórios do workspace × mapa de tecnologias (repos-map.js, #225). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAP_FILE, readMapRepos, reposOutsideMap, reposPendencyLine } from "../bin/lib/core/repos-map.js";

const TABELA = (linhas) =>
  [
    "# CDD-MIND-MAP — ws",
    "",
    "| Repositório | Papel | Linguagem | Framework | Área | Ferramentas principais | Observações |",
    "|-------------|-------|-----------|-----------|------|------------------------|-------------|",
    ...linhas,
    "",
  ].join("\n");

function withWorkspace(dirs, mapa, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-repos-map-"));
  try {
    for (const d of dirs) mkdirSync(join(root, d), { recursive: true });
    if (mapa !== null) writeFileSync(join(root, MAP_FILE), mapa);
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// --- readMapRepos -------------------------------------------------------------------------------

test("readMapRepos: lê a 1ª coluna da tabela do mapa, na ordem", () => {
  const texto = TABELA(["| api | api | php | laravel | backend | x | |", "| web | front | node | quasar | frontend | y | |"]);
  assert.deepEqual(readMapRepos(texto), ["api", "web"]);
});

test("readMapRepos: ignora a linha-modelo {pasta}, a separadora e os comentários HTML", () => {
  const texto = TABELA(["| {pasta} | {api} | {php} | {laravel} | {backend} | {x} | {o que} |", "| app | api | go | | backend | | |"]) +
    "\n<!--\n| Repositório | Papel |\n| fantasma | x |\n-->\n";
  assert.deepEqual(readMapRepos(texto), ["app"]);
});

test("readMapRepos: aceita crase e negrito no nome, e cabeçalho sem acento", () => {
  assert.deepEqual(readMapRepos("| Repositorio | Papel |\n|---|---|\n| `api` | x |\n| **web** | y |\n"), ["api", "web"]);
});

test("readMapRepos: texto vazio, sem tabela ou linha torta não quebra", () => {
  assert.deepEqual(readMapRepos(""), []);
  assert.deepEqual(readMapRepos(undefined), []);
  assert.deepEqual(readMapRepos("só texto, sem tabela"), []);
  assert.deepEqual(readMapRepos("| Repositório | Papel |\n|---|---|\n|\n| | vazio |\n| ok | x"), ["ok"]);
});

test("readMapRepos: só a tabela do cabeçalho Repositório conta (outra tabela é ignorada)", () => {
  const texto = "| Outra | Coisa |\n|---|---|\n| x | y |\n\n" + TABELA(["| api | a | | | | | |"]);
  assert.deepEqual(readMapRepos(texto), ["api"]);
});

// --- reposOutsideMap ----------------------------------------------------------------------------

test("reposOutsideMap: repositório novo (com .git) fora do mapa é listado, em ordem", () => {
  withWorkspace(["api/.git", "web/.git", "zeta/.git"], TABELA(["| api | a | | | | | |"]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), ["web", "zeta"]);
  });
});

test("reposOutsideMap: sem repositório novo, lista vazia", () => {
  withWorkspace(["api/.git", "web/.git"], TABELA(["| api | a | | | | | |", "| web | w | | | | | |"]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), []);
  });
});

test("reposOutsideMap: sem o arquivo do mapa não há pendência (montar o mapa é opcional)", () => {
  withWorkspace(["api/.git", "web/.git"], null, (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), []);
  });
});

test("reposOutsideMap: modo projeto (ou sem modo) não tem pendência", () => {
  withWorkspace(["api/.git", ".git"], TABELA([]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "project" }), []);
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: null }), []);
  });
});

test("reposOutsideMap: pasta sem .git, oculta e node_modules não contam", () => {
  withWorkspace(["docs", ".claude/.git", "node_modules/pkg/.git", "api/.git"], TABELA([]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), ["api"]);
  });
});

test("reposOutsideMap: linha do mapa sem pasta (repositório ausente) não vira pendência", () => {
  withWorkspace(["api/.git"], TABELA(["| api | a | | | | | |", "| sumiu | s | | | | | |"]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), []);
  });
});

// --- reposPendencyLine --------------------------------------------------------------------------

test("reposPendencyLine: cita o comando, a contagem e os nomes; vazio sem repositório", () => {
  assert.equal(reposPendencyLine([]), "");
  assert.equal(reposPendencyLine(["web"]), "Rode /jarvis-init repos: 1 repositório(s) fora do mapa (web)");
  assert.equal(reposPendencyLine(["a", "b"]), "Rode /jarvis-init repos: 2 repositório(s) fora do mapa (a, b)");
});
