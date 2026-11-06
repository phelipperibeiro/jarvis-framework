// Testes de rewrite-links.js: a conversão dos links de uma sessão para o Central docs (#229).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  normalizeRemote,
  isGitlab,
  parseCommitBase,
  commitBaseFor,
  makeRepoResolver,
  rewriteLinksForCentral,
} from "../bin/lib/docs/rewrite-links.js";

const SESSION = "/ws/.jarvis/sessions/eng/229";
const DEST = "CORE/loja/checkout/decisions/architecture.md";

/** Contexto padrão: repositório `jarvis-framework` no GitHub, commit base 2d149a1. */
function ctx(over = {}) {
  return {
    fileDir: SESSION,
    destPath: DEST,
    published: new Map([
      [`${SESSION}/plan.md`, "CORE/loja/checkout/decisions/plan.md"],
      [`${SESSION}/architecture.md`, DEST],
      [`${SESSION}/context.md`, "CORE/loja/history/229/context.md"],
    ]),
    repoOf: (abs) =>
      abs.startsWith("/ws/jarvis-framework/")
        ? { repo: "jarvis-framework", remote: "https://github.com/o/jarvis-framework", relPath: abs.slice("/ws/jarvis-framework/".length) }
        : null,
    commitBase: new Map([["jarvis-framework", "2d149a1"]]),
    localOnlyDirs: ["/ws/docs/jarvis", "/ws/.jarvis"],
    ...over,
  };
}

test("normalizeRemote: ssh, https e ssh://; tira .git e credenciais; recusa o que não entende", () => {
  assert.equal(normalizeRemote("git@github.com:o/r.git"), "https://github.com/o/r");
  assert.equal(normalizeRemote("https://github.com/o/r.git"), "https://github.com/o/r");
  assert.equal(normalizeRemote("https://user:segredo@gitlab.com/g/s/r.git"), "https://gitlab.com/g/s/r");
  assert.equal(normalizeRemote("ssh://git@gitlab.com/g/r.git"), "https://gitlab.com/g/r");
  assert.equal(normalizeRemote(""), null);
  assert.equal(normalizeRemote("/caminho/local/repo"), null);
});

test("isGitlab: reconhece pelo host", () => {
  assert.equal(isGitlab("https://gitlab.com/g/r"), true);
  assert.equal(isGitlab("https://gitlab.empresa.com/g/r"), true);
  assert.equal(isGitlab("https://github.com/o/r"), false);
});

test("parseCommitBase: sha puro vale para qualquer repo; {repo}@{sha} é por repositório", () => {
  assert.deepEqual([...parseCommitBase("> **Commit base:** `2d149a1` (as linhas...)")], [["*", "2d149a1"]]);
  const m = parseCommitBase("> **Commit base:** `api@abc1234`, `web@def5678` (modo workspace)");
  assert.equal(m.get("api"), "abc1234");
  assert.equal(m.get("web"), "def5678");
  assert.equal(parseCommitBase("sem a linha").size, 0);
});

test("commitBaseFor: sem a linha no texto (plan.md), lê o architecture.md da mesma pasta", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-cb-"));
  try {
    writeFileSync(join(dir, "architecture.md"), "> **Commit base:** `jarvis-framework@2d149a1`\n");
    assert.equal(commitBaseFor("# Plano\n", dir).get("jarvis-framework"), "2d149a1");
    assert.equal(commitBaseFor("> **Commit base:** `a1b2c3d`\n", dir).get("*"), "a1b2c3d", "o próprio texto prevalece");
    assert.equal(commitBaseFor("# x", join(dir, "nao-existe")).size, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteLinksForCentral: link para outro arquivo da entrega vira link relativo no Central docs, com âncora", () => {
  const r = rewriteLinksForCentral("Veja [o plano](plan.md#fase-1) e [o contexto](context.md).", ctx());
  assert.equal(r.text, "Veja [o plano](plan.md#fase-1) e [o contexto](../../history/229/context.md).");
  assert.equal(r.converted, 2);
  assert.equal(r.dropped, 0);
  assert.equal(r.changed, true);
});

test("rewriteLinksForCentral: código do repositório vira URL do blob no commit base (linha e trecho)", () => {
  const r = rewriteLinksForCentral(
    "[`a` (`x.js:5`)](../../../../jarvis-framework/bin/lib/x.js#L5) e [trecho](../../../../jarvis-framework/bin/y.js#L10-L20)",
    ctx()
  );
  assert.equal(
    r.text,
    "[`a` (`x.js:5`)](https://github.com/o/jarvis-framework/blob/2d149a1/bin/lib/x.js#L5) e [trecho](https://github.com/o/jarvis-framework/blob/2d149a1/bin/y.js#L10-L20)"
  );
  assert.equal(r.converted, 2);
});

test("rewriteLinksForCentral: no GitLab usa /-/blob/ e #L10-20", () => {
  const r = rewriteLinksForCentral(
    "[t](../../../../jarvis-framework/a.js#L10-L20)",
    ctx({
      repoOf: () => ({ repo: "jarvis-framework", remote: "https://gitlab.com/g/jarvis-framework", relPath: "a.js" }),
    })
  );
  assert.equal(r.text, "[t](https://gitlab.com/g/jarvis-framework/-/blob/2d149a1/a.js#L10-20)");
});

test("rewriteLinksForCentral: sem sha ou sem remote o código vira texto, sem link", () => {
  const semSha = rewriteLinksForCentral("[`x.js:5`](../../../../jarvis-framework/x.js#L5)", ctx({ commitBase: new Map() }));
  assert.equal(semSha.text, "`x.js:5`");
  assert.equal(semSha.dropped, 1);
  const semRemote = rewriteLinksForCentral("[x](../../../../jarvis-framework/x.js)", ctx({ repoOf: () => null }));
  assert.equal(semRemote.text, "x");
});

test("rewriteLinksForCentral: sha '*' (commit base sem nome de repo) vale para qualquer repositório", () => {
  const r = rewriteLinksForCentral("[x](../../../../jarvis-framework/x.js#L1)", ctx({ commitBase: new Map([["*", "abc1234"]]) }));
  assert.match(r.text, /blob\/abc1234\/x\.js#L1/);
});

test("rewriteLinksForCentral: docs/jarvis e sessão não publicados viram texto, mesmo dentro de um repositório", () => {
  const r = rewriteLinksForCentral(
    "[PRD](../../../../docs/jarvis/product/prd/prd.md#rqt-1) e [outra sessão](../../230/architecture.md)",
    ctx({ repoOf: () => ({ repo: "ws", remote: "https://github.com/o/ws", relPath: "x" }) })
  );
  assert.equal(r.text, "PRD e outra sessão");
  assert.equal(r.dropped, 2);
});

test("rewriteLinksForCentral: URL, âncora pura e mailto ficam como estão; imagem sem destino vira o alt", () => {
  const md = "[card](https://github.com/o/r/issues/229) [seção](#fase-1) [e](mailto:a@b.com) ![diagrama](../../../../jarvis-framework/img.png)";
  const r = rewriteLinksForCentral(md, ctx({ commitBase: new Map() }));
  assert.equal(
    r.text,
    "[card](https://github.com/o/r/issues/229) [seção](#fase-1) [e](mailto:a@b.com) diagrama"
  );
});

test("rewriteLinksForCentral: não toca em links dentro de bloco de código nem entre crases", () => {
  const md = ["```md", "[x](../../../../jarvis-framework/a.js#L1)", "```", "no texto: `[y](../../../../jarvis-framework/b.js)` e [z](plan.md)"].join("\n");
  const r = rewriteLinksForCentral(md, ctx());
  assert.ok(r.text.includes("```md\n[x](../../../../jarvis-framework/a.js#L1)\n```"));
  assert.ok(r.text.includes("`[y](../../../../jarvis-framework/b.js)`"));
  assert.ok(r.text.includes("[z](plan.md)"));
  assert.equal(r.converted, 1);
});

test("rewriteLinksForCentral: texto sem link relativo volta idêntico (changed=false)", () => {
  const md = "# Título\n\nTexto [card](https://x/y) e `código`.\n";
  const r = rewriteLinksForCentral(md, ctx());
  assert.equal(r.text, md);
  assert.equal(r.changed, false);
});

test("rewriteLinksForCentral: alvo com %-codificação e título opcional", () => {
  const r = rewriteLinksForCentral('[a](plan.md "título") [b](<plan.md#x>) [c](pl%61n.md)', ctx());
  assert.equal(r.text, '[a](plan.md "título") [b](plan.md#x) [c](plan.md)');
});

test("makeRepoResolver: acha a raiz git, o remote web e o caminho dentro do repositório (git real, sem rede)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-repo-"));
  try {
    const repo = join(dir, "meu-repo");
    mkdirSync(join(repo, "src"), { recursive: true });
    const git = (...a) => execFileSync("git", a, { cwd: repo, stdio: "ignore" });
    git("init", "-q");
    git("remote", "add", "origin", "git@github.com:dono/meu-repo.git");
    writeFileSync(join(repo, "src", "a.js"), "x");
    const repoOf = makeRepoResolver();
    assert.deepEqual(repoOf(join(repo, "src", "a.js")), {
      repo: "meu-repo",
      remote: "https://github.com/dono/meu-repo",
      relPath: "src/a.js",
    });
    // arquivo removido: sobe até a pasta que existe
    assert.equal(repoOf(join(repo, "src", "apagado.js")).relPath, "src/apagado.js");
    // fora de qualquer repositório
    assert.equal(repoOf(join(dir, "solto", "x.js")), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteLinksForCentral: caminhos não normalizados chegam ao mesmo arquivo publicado", () => {
  const r = rewriteLinksForCentral("[p](./sub/../plan.md)", ctx());
  assert.equal(r.text, "[p](plan.md)");
  assert.equal(resolve(SESSION, "./sub/../plan.md"), `${SESSION}/plan.md`);
});
