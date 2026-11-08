// Repositórios do workspace × mapa de tecnologias (repos-map.js, #225). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAP_FILE, documentPendencies, readMapRepos, reposOutsideMap, reposPendencyLine } from "../bin/lib/core/repos-map.js";

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

test("readMapRepos: cabeçalho com negrito ou crase também é reconhecido", () => {
  assert.deepEqual(readMapRepos("| **Repositório** | Papel |\n|---|---|\n| api | x |\n"), ["api"]);
  assert.deepEqual(readMapRepos("| `Repositório` | Papel |\n|---|---|\n| web | x |\n"), ["web"]);
});

test("readMapRepos: nome com link ou barra no fim vira só o nome da pasta", () => {
  assert.deepEqual(readMapRepos("| Repositório | Papel |\n|---|---|\n| [api](api/) | x |\n| web/ | y |\n| `lib/` | z |\n"), ["api", "web", "lib"]);
});

test("readMapRepos: fim de linha CRLF dá o mesmo resultado que LF", () => {
  const lf = TABELA(["| api | a | | | | | |", "| web | w | | | | | |"]);
  assert.deepEqual(readMapRepos(lf.replace(/\n/g, "\r\n")), readMapRepos(lf));
  assert.deepEqual(readMapRepos(lf.replace(/\n/g, "\r\n")), ["api", "web"]);
});

test("readMapRepos: nome com espaço é aceito e a caixa é respeitada (API e api são nomes diferentes)", () => {
  assert.deepEqual(readMapRepos(TABELA(["| Meu App | a | | | | | |", "| API | b | | | | | |"])), ["Meu App", "API"]);
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

test("reposOutsideMap: .git como ARQUIVO (worktree, submódulo) também conta como repositório", () => {
  withWorkspace(["api/.git"], TABELA(["| api | a | | | | | |"]), (root) => {
    mkdirSync(join(root, "web"), { recursive: true });
    writeFileSync(join(root, "web", ".git"), "gitdir: ../.git/worktrees/web\n");
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), ["web"]);
  });
});

test("reposOutsideMap: node_modules com .git na própria pasta não conta", () => {
  withWorkspace(["node_modules/.git", "api/.git"], TABELA(["| api | a | | | | | |"]), (root) => {
    assert.deepEqual(reposOutsideMap({ workspaceDir: root, mode: "workspace" }), []);
  });
});

test("reposOutsideMap: nome com espaço casa com a linha do mapa; a caixa diferente conta como outro repositório", () => {
  withWorkspace(["Meu App/.git", "api/.git"], TABELA(["| Meu App | a | | | | | |", "| API | b | | | | | |"]), (root) => {
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

// --- documentPendencies (ajuste do usuário: documentos sempre existentes e CLAUDE.md espelho) ---------------

function withFiles(files, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-docs-pend-"));
  try {
    for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("documentPendencies: com mapa, AGENTS.md e CLAUDE.md idêntico, nada pendente", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\n", "CLAUDE.md": "# a\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), []);
  });
});

test("documentPendencies: mapa ausente pede para criar o mapa", () => {
  withFiles({ "AGENTS.md": "# a\n", "CLAUDE.md": "# a\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), ["criar o mapa de tecnologias (CDD-MIND-MAP.md)"]);
  });
});

test("documentPendencies: AGENTS.md ausente pede para criá-lo com o CLAUDE.md (e não acusa sincronia)", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "CLAUDE.md": "# só o claude\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), ["criar o AGENTS.md (e o CLAUDE.md, cópia dele)"]);
  });
});

test("documentPendencies: CLAUDE.md ausente ou diferente pede sincronia", () => {
  const msg = "sincronizar o CLAUDE.md com o AGENTS.md (o CLAUDE.md é sempre cópia do AGENTS.md)";
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), [msg]);
  });
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\n", "CLAUDE.md": "# b\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), [msg]);
  });
});

test("documentPendencies: só o fim de linha diferente (CRLF × LF) não conta como fora de sincronia", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\nlinha\n", "CLAUDE.md": "# a\r\nlinha\r\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), []);
  });
});

test("documentPendencies: CRLF só no AGENTS.md também não conta (a normalização vale para os dois)", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\r\nlinha\r\n", "CLAUDE.md": "# a\nlinha\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), []);
  });
});

test("documentPendencies: BOM no início não conta como diferença", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\n", "CLAUDE.md": "\uFEFF# a\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), []);
  });
});

test("documentPendencies: quebras de linha no fim do arquivo não contam como diferença", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a", "CLAUDE.md": "# a\n\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), []);
  });
});

test("documentPendencies: diferença no meio do texto continua contando", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "# a\n\nb\n", "CLAUDE.md": "# a\nb\n" }, (root) => {
    assert.deepEqual(documentPendencies(root), ["sincronizar o CLAUDE.md com o AGENTS.md (o CLAUDE.md é sempre cópia do AGENTS.md)"]);
  });
});

test("documentPendencies: AGENTS.md vazio (só espaços) vale como ausente", () => {
  withFiles({ [MAP_FILE]: TABELA([]), "AGENTS.md": "  \n", "CLAUDE.md": "  \n" }, (root) => {
    assert.deepEqual(documentPendencies(root), ["criar o AGENTS.md (e o CLAUDE.md, cópia dele)"]);
  });
});

test("documentPendencies: tudo ausente lista mapa e AGENTS.md, nesta ordem", () => {
  withFiles({}, (root) => {
    assert.deepEqual(documentPendencies(root), ["criar o mapa de tecnologias (CDD-MIND-MAP.md)", "criar o AGENTS.md (e o CLAUDE.md, cópia dele)"]);
  });
});
