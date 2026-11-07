// Testes do módulo git-exclude (#227): exclude local, untrack e a pasta da IDE, com git de verdade
// em pasta temporária (sem rede). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LOCAL_EXCLUDE_ENTRIES,
  UNTRACKABLE_FILES,
  applyProjectGitSetup,
  ensureLocalExclude,
  gitExcludePath,
  ideFolderEntry,
  isIdeFolderTracked,
  trackedFiles,
  untrackFromIndex,
} from "../bin/lib/core/git-exclude.js";

const IDENTITY = ["-c", "user.email=t@t", "-c", "user.name=t"];

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
}

function commit(cwd, message = "x") {
  git(cwd, ...IDENTITY, "commit", "-q", "--allow-empty", "-m", message);
}

function withTmp(fn) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "jarvis-gitexclude-")));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Repositório git real com um commit inicial. */
function withRepo(fn) {
  return withTmp((dir) => {
    git(dir, "init", "-q");
    commit(dir, "inicial");
    return fn(dir);
  });
}

const commitCount = (dir) => git(dir, "rev-list", "--count", "HEAD").trim();
const excludeLines = (dir) => readFileSync(gitExcludePath(dir), "utf-8").split(/\r?\n/);

// ---- 1.1 ensureLocalExclude ------------------------------------------------------------------

test("ensureLocalExclude: grava as linhas e devolve o que acrescentou", () => {
  withRepo((dir) => {
    const r = ensureLocalExclude(dir, ["AGENTS.md", "CDD-MIND-MAP.md"]);
    assert.deepEqual(r.added, ["AGENTS.md", "CDD-MIND-MAP.md"]);
    assert.deepEqual(r.existing, []);
    assert.equal(r.path, gitExcludePath(dir));
    assert.ok(excludeLines(dir).includes("AGENTS.md"));
  });
});

test("ensureLocalExclude: rodar duas vezes não duplica", () => {
  withRepo((dir) => {
    ensureLocalExclude(dir, ["AGENTS.md"]);
    const again = ensureLocalExclude(dir, ["AGENTS.md"]);
    assert.deepEqual(again.added, []);
    assert.deepEqual(again.existing, ["AGENTS.md"]);
    assert.equal(excludeLines(dir).filter((l) => l === "AGENTS.md").length, 1);
  });
});

test("ensureLocalExclude: reconhece /AGENTS.md já escrito à mão", () => {
  withRepo((dir) => {
    writeFileSync(gitExcludePath(dir), "/AGENTS.md\n");
    const r = ensureLocalExclude(dir, ["AGENTS.md"]);
    assert.deepEqual(r.added, []);
    assert.deepEqual(r.existing, ["AGENTS.md"]);
  });
});

test("ensureLocalExclude: cria a pasta info/ quando falta", () => {
  withRepo((dir) => {
    rmSync(join(dir, ".git", "info"), { recursive: true, force: true });
    const r = ensureLocalExclude(dir, ["CLAUDE.md"]);
    assert.deepEqual(r.added, ["CLAUDE.md"]);
    assert.ok(existsSync(join(dir, ".git", "info", "exclude")));
  });
});

test("ensureLocalExclude: mantém o CRLF e acrescenta a quebra que faltava", () => {
  withRepo((dir) => {
    writeFileSync(gitExcludePath(dir), "# local\r\nfoo");
    ensureLocalExclude(dir, ["AGENTS.md"]);
    assert.equal(readFileSync(gitExcludePath(dir), "utf-8"), "# local\r\nfoo\r\nAGENTS.md\r\n");
  });
});

test("ensureLocalExclude: raiz sem .git (modo workspace) não cria nada", () => {
  withTmp((dir) => {
    const r = ensureLocalExclude(dir, ["AGENTS.md"]);
    assert.deepEqual(r, { path: null, added: [], existing: [], error: null, gitUnavailable: false });
    assert.ok(!existsSync(join(dir, ".git")));
  });
});

test("ensureLocalExclude: o git passa a ignorar o arquivo (git check-ignore)", () => {
  withRepo((dir) => {
    writeFileSync(join(dir, "AGENTS.md"), "# gerado");
    ensureLocalExclude(dir, ["AGENTS.md"]);
    git(dir, "check-ignore", "-q", "AGENTS.md"); // lança se não ignorar
    assert.equal(git(dir, "status", "--porcelain").trim(), "");
  });
});

test("ensureLocalExclude: worktree grava no exclude que o repositório usa", () => {
  withRepo((dir) => {
    const wt = join(dir, "..", `${dir.split("/").pop()}-wt`);
    try {
      git(dir, "worktree", "add", "-q", "-b", "wt-branch", wt);
      assert.ok(existsSync(join(wt, ".git")), ".git do worktree deve ser um arquivo");
      const r = ensureLocalExclude(wt, ["AGENTS.md"]);
      assert.deepEqual(r.added, ["AGENTS.md"]);
      writeFileSync(join(wt, "AGENTS.md"), "# gerado");
      git(wt, "check-ignore", "-q", "AGENTS.md");
    } finally {
      rmSync(wt, { recursive: true, force: true });
    }
  });
});

test("ensureLocalExclude: submódulo (.git em arquivo) grava no exclude do submódulo", () => {
  withTmp((root) => {
    const sub = join(root, "sub-origem");
    const sup = join(root, "super");
    mkdirSync(sub);
    mkdirSync(sup);
    git(sub, "init", "-q");
    writeFileSync(join(sub, "a.txt"), "a");
    git(sub, "add", "a.txt");
    commit(sub);
    git(sup, "init", "-q");
    commit(sup);
    git(sup, "-c", "protocol.file.allow=always", ...IDENTITY, "submodule", "add", "-q", sub, "modulo");
    const modDir = join(sup, "modulo");
    assert.ok(existsSync(join(modDir, ".git")));
    const r = ensureLocalExclude(modDir, ["AGENTS.md"]);
    assert.deepEqual(r.added, ["AGENTS.md"]);
    writeFileSync(join(modDir, "AGENTS.md"), "# gerado");
    git(modDir, "check-ignore", "-q", "AGENTS.md");
  });
});

// ---- 1.2 trackedFiles / untrackFromIndex -----------------------------------------------------

function trackAgents(dir, body = "# do time\n") {
  writeFileSync(join(dir, "AGENTS.md"), body);
  git(dir, "add", "AGENTS.md");
  commit(dir, "adiciona AGENTS.md");
}

test("trackedFiles: lista só os rastreados; raiz sem .git devolve vazio", () => {
  withRepo((dir) => {
    assert.deepEqual(trackedFiles(dir), []);
    trackAgents(dir);
    writeFileSync(join(dir, "CLAUDE.md"), "novo, não rastreado");
    assert.deepEqual(trackedFiles(dir), ["AGENTS.md"]);
  });
  withTmp((dir) => assert.deepEqual(trackedFiles(dir), []));
});

test("untrackFromIndex: tira do índice, mantém o arquivo, fica staged e não faz commit", () => {
  withRepo((dir) => {
    trackAgents(dir, "# conteúdo do time\n");
    const before = commitCount(dir);
    const r = untrackFromIndex(dir, "AGENTS.md");
    assert.equal(r.ok, true);
    assert.deepEqual(r.excludeAdded, ["AGENTS.md"]);
    assert.deepEqual(trackedFiles(dir), []);
    assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf-8"), "# conteúdo do time\n");
    assert.match(git(dir, "status", "--porcelain"), /^D {2}AGENTS\.md$/m);
    assert.equal(commitCount(dir), before);
    assert.ok(excludeLines(dir).includes("AGENTS.md"));
  });
});

test("untrackFromIndex: depois do commit da remoção o status não mostra o arquivo como novo", () => {
  withRepo((dir) => {
    trackAgents(dir);
    untrackFromIndex(dir, "AGENTS.md");
    commit(dir, "tira AGENTS.md do git");
    assert.equal(git(dir, "ls-files", "AGENTS.md").trim(), "");
    assert.equal(git(dir, "status", "--porcelain").trim(), "");
  });
});

test("untrackFromIndex: recusa nome fora da lista, arquivo não rastreado e raiz sem .git", () => {
  withRepo((dir) => {
    writeFileSync(join(dir, "README.md"), "x");
    git(dir, "add", "README.md");
    commit(dir);
    assert.equal(untrackFromIndex(dir, "README.md").ok, false);
    assert.equal(trackedFiles(dir, ["README.md"]).length, 1, "README.md segue rastreado");
    const notTracked = untrackFromIndex(dir, "AGENTS.md");
    assert.equal(notTracked.ok, false);
    assert.match(notTracked.reason, /não está versionado/);
  });
  withTmp((dir) => {
    const r = untrackFromIndex(dir, "AGENTS.md");
    assert.equal(r.ok, false);
    assert.match(r.reason, /não é um repositório/);
  });
});

test("UNTRACKABLE_FILES é subconjunto das entradas locais (e o mapa nunca sai do índice)", () => {
  for (const f of UNTRACKABLE_FILES) assert.ok(LOCAL_EXCLUDE_ENTRIES.includes(f));
  assert.ok(!UNTRACKABLE_FILES.includes("CDD-MIND-MAP.md"));
});

// ---- 1.3 pasta da IDE ------------------------------------------------------------------------

test("ideFolderEntry: pasta de cada IDE", () => {
  assert.equal(ideFolderEntry("claude"), ".claude/");
  assert.equal(ideFolderEntry("windsurf"), ".windsurf/");
  assert.equal(ideFolderEntry("gemini"), ".agents/");
});

test("isIdeFolderTracked: detecta a pasta da IDE versionada", () => {
  withRepo((dir) => {
    assert.equal(isIdeFolderTracked(dir, "claude"), false);
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude", "ENV.md"), "IDE=claude\n");
    git(dir, "add", ".claude/ENV.md");
    commit(dir);
    assert.equal(isIdeFolderTracked(dir, "claude"), true);
  });
  withTmp((dir) => assert.equal(isIdeFolderTracked(dir, "claude"), false));
});

// ---- applyProjectGitSetup --------------------------------------------------------------------

test("applyProjectGitSetup: projeto novo grava as 3 entradas no exclude e a pasta da IDE no .gitignore", () => {
  withRepo((dir) => {
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.isRepo, true);
    assert.deepEqual(r.exclude.added.sort(), [...LOCAL_EXCLUDE_ENTRIES].sort());
    assert.equal(r.ideIgnoreAdded, true);
    assert.deepEqual(r.tracked, []);
    assert.match(readFileSync(join(dir, ".gitignore"), "utf-8"), /^\.claude\/$/m);
    for (const entry of LOCAL_EXCLUDE_ENTRIES) {
      assert.doesNotMatch(readFileSync(join(dir, ".gitignore"), "utf-8"), new RegExp(`^${entry}$`, "m"));
    }
  });
});

test("applyProjectGitSetup: segunda execução não duplica nada", () => {
  withRepo((dir) => {
    applyProjectGitSetup({ dir, ide: "claude" });
    const gitignoreBefore = readFileSync(join(dir, ".gitignore"), "utf-8");
    const excludeBefore = readFileSync(gitExcludePath(dir), "utf-8");
    const again = applyProjectGitSetup({ dir, ide: "claude" });
    assert.deepEqual(again.exclude.added, []);
    assert.equal(again.ideIgnoreAdded, false);
    assert.equal(readFileSync(join(dir, ".gitignore"), "utf-8"), gitignoreBefore);
    assert.equal(readFileSync(gitExcludePath(dir), "utf-8"), excludeBefore);
  });
});

test("applyProjectGitSetup: AGENTS.md rastreado fica de fora do exclude e do índice (decisão é do Upgrade)", () => {
  withRepo((dir) => {
    trackAgents(dir);
    const before = commitCount(dir);
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.deepEqual(r.tracked, ["AGENTS.md"]);
    assert.ok(!r.exclude.added.includes("AGENTS.md"));
    assert.ok(r.exclude.added.includes("CLAUDE.md") && r.exclude.added.includes("CDD-MIND-MAP.md"));
    assert.deepEqual(trackedFiles(dir), ["AGENTS.md"], "o índice não muda");
    assert.equal(commitCount(dir), before);
  });
});

test("applyProjectGitSetup: avisa quando a pasta da IDE já está rastreada, sem tirá-la do índice", () => {
  withRepo((dir) => {
    mkdirSync(join(dir, ".claude"));
    writeFileSync(join(dir, ".claude", "ENV.md"), "IDE=claude\n");
    git(dir, "add", ".claude/ENV.md");
    commit(dir);
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.ideFolderTracked, true);
    assert.equal(git(dir, "ls-files", ".claude").trim(), ".claude/ENV.md");
  });
});

test("applyProjectGitSetup: modo workspace (raiz sem .git) não cria nem altera arquivo de git", () => {
  withTmp((dir) => {
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.isRepo, false);
    assert.deepEqual(r.exclude.added, []);
    assert.ok(!existsSync(join(dir, ".gitignore")));
    assert.ok(!existsSync(join(dir, ".git")));
  });
});

// ---- Fase 6 (pre-pr rodada 1): docs/jarvis/, falhas do git e mapa versionado ------------------------

const isRoot = typeof process.getuid === "function" && process.getuid() === 0;

test("applyProjectGitSetup: gitignoreLines (docs/jarvis/) entram no .gitignore junto da pasta da IDE, sem duplicar", () => {
  withRepo((dir) => {
    const r = applyProjectGitSetup({ dir, ide: "claude", gitignoreLines: ["docs/jarvis/"] });
    assert.deepEqual(r.ignoreAdded, [".claude/", "docs/jarvis/"]);
    assert.equal(r.ideIgnoreAdded, true);
    assert.deepEqual(r.errors, []);
    const again = applyProjectGitSetup({ dir, ide: "claude", gitignoreLines: ["docs/jarvis/"] });
    assert.deepEqual(again.ignoreAdded, []);
    assert.equal(readFileSync(join(dir, ".gitignore"), "utf-8"), ".claude/\ndocs/jarvis/\n");
  });
});

test("applyProjectGitSetup: modo workspace ignora gitignoreLines e não cria nada", () => {
  withTmp((dir) => {
    const r = applyProjectGitSetup({ dir, ide: "claude", gitignoreLines: ["docs/jarvis/"] });
    assert.equal(r.isRepo, false);
    assert.deepEqual(r.ignoreAdded, []);
    assert.ok(!existsSync(join(dir, ".gitignore")));
  });
});

test("applyProjectGitSetup: git que não responde (.git inválido) vira aviso, não silêncio nem exceção", () => {
  withTmp((dir) => {
    mkdirSync(join(dir, ".git"));
    writeFileSync(join(dir, ".git", "HEAD"), "");
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.isRepo, true);
    assert.equal(r.exclude.path, null);
    assert.equal(r.exclude.gitUnavailable, true);
    assert.equal(r.warnings.length, 1);
    assert.match(r.warnings[0], /o git não respondeu/);
    assert.deepEqual(r.errors, [], "git indisponível é aviso (saída 0), não erro");
    assert.match(readFileSync(join(dir, ".gitignore"), "utf-8"), /^\.claude\/$/m, "o .gitignore é gravado mesmo assim");
  });
});

test("applyProjectGitSetup: git fora do PATH também vira aviso, com o motivo", () => {
  withRepo((dir) => {
    const antes = process.env.PATH;
    process.env.PATH = "/caminho/que/nao/existe";
    try {
      const r = applyProjectGitSetup({ dir, ide: "claude" });
      assert.equal(r.exclude.gitUnavailable, true);
      assert.equal(r.warnings.length, 1);
      assert.match(r.warnings[0], /o git não respondeu \(.*ENOENT/);
    } finally {
      process.env.PATH = antes;
    }
  });
});

test("ensureLocalExclude: exclude sem permissão de escrita devolve error (não lança) e não marca git indisponível", { skip: isRoot }, () => {
  withRepo((dir) => {
    const alvo = gitExcludePath(dir);
    chmodSync(alvo, 0o444);
    try {
      const r = ensureLocalExclude(dir, ["AGENTS.md"]);
      assert.deepEqual(r.added, []);
      assert.equal(r.gitUnavailable, false);
      assert.match(r.error, /não foi possível gravar .*exclude: EACCES/);
    } finally {
      chmodSync(alvo, 0o644);
    }
  });
});

test("applyProjectGitSetup: exclude sem permissão vira erro (saída 1 no init), sem exceção", { skip: isRoot }, () => {
  withRepo((dir) => {
    const alvo = gitExcludePath(dir);
    chmodSync(alvo, 0o444);
    try {
      const r = applyProjectGitSetup({ dir, ide: "claude" });
      assert.equal(r.errors.length, 1);
      assert.match(r.errors[0], /EACCES/);
      assert.deepEqual(r.warnings, []);
    } finally {
      chmodSync(alvo, 0o644);
    }
  });
});

test("applyProjectGitSetup: .gitignore que é um diretório vira erro, sem exceção", () => {
  withRepo((dir) => {
    mkdirSync(join(dir, ".gitignore"));
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /não foi possível gravar .*\.gitignore: EISDIR/);
    assert.deepEqual(r.ignoreAdded, []);
    assert.ok(r.exclude.added.includes("AGENTS.md"), "o exclude foi gravado antes da falha do .gitignore");
  });
});

test("applyProjectGitSetup: CDD-MIND-MAP.md já versionado fica fora do exclude e vira aviso (trackedMap)", () => {
  withRepo((dir) => {
    writeFileSync(join(dir, "CDD-MIND-MAP.md"), "# mapa\n");
    git(dir, "add", "CDD-MIND-MAP.md");
    commit(dir, "versiona o mapa");
    const r = applyProjectGitSetup({ dir, ide: "claude" });
    assert.equal(r.trackedMap, true);
    assert.ok(!r.exclude.added.includes("CDD-MIND-MAP.md"));
    assert.deepEqual(r.tracked, [], "o mapa não entra na lista do untrack");
    assert.ok(r.exclude.added.includes("AGENTS.md") && r.exclude.added.includes("CLAUDE.md"));
    assert.ok(!excludeLines(dir).includes("CDD-MIND-MAP.md"));
  });
});
