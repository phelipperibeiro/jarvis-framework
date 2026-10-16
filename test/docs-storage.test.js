// Testes dos adaptadores do Central docs (bin/lib/docs/storage/). Rode com: npm run test:filtro
//
// Tudo em pastas temporárias (mkdtemp). A camada git usa um repositório bare local
// como `origin` — sem rede — e o `createMergeRequest` é injetado (mock).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getStorage, StorageConfigError } from "../bin/lib/docs/storage/index.js";
import { safePath } from "../bin/lib/docs/storage/filesystem.js";
import { renderIndex } from "../bin/lib/docs/storage/build-index.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

function tmp() {
  return mkdtempSync(join(tmpdir(), "jarvis-docs-"));
}

function write(file, content) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const PRD = `---
id: PRD-001
name: Checkout
version: 1.0.0
status: backlog
---
# PRD
`;

// --- getStorage ----------------------------------------------------------

test("getStorage: STORAGE vazio desliga o Central docs (null)", () => {
  assert.equal(getStorage({}, { root: "/tmp" }), null);
});

test("getStorage: CENTRAL_DOCS_REPO antigo sem STORAGE pede o Upgrade", () => {
  assert.throws(
    () => getStorage({ CENTRAL_DOCS_REPO: "https://gitlab.com/o/r" }, { root: "/tmp" }),
    (err) => err instanceof StorageConfigError && /Upgrade/.test(err.message)
  );
});

test("getStorage: valor não suportado (s3) para com mensagem clara", () => {
  assert.throws(
    () =>
      getStorage({ CENTRAL_DOCS_STORAGE: "s3", CENTRAL_DOCS_LOCATION: "s3://b" }, { root: "/tmp" }),
    /"s3" ainda não suportado/
  );
});

test("getStorage: filesystem sem LOCATION lança erro", () => {
  assert.throws(
    () => getStorage({ CENTRAL_DOCS_STORAGE: "filesystem" }, { root: "/tmp" }),
    /LOCATION/
  );
});

test("getStorage: LOCATION relativo é resolvido a partir do workspace", () => {
  const root = tmp();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "./central-docs" },
      { root }
    );
    assert.equal(s.kind, "filesystem");
    assert.equal(s.location, join(root, "central-docs"));
    assert.equal(s.isGit, false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- safePath ------------------------------------------------------------

test("safePath: rejeita .., caminho absoluto e vazio", () => {
  assert.throws(() => safePath("/a/b", "../x.md"), /fora da pasta/);
  assert.throws(() => safePath("/a/b", "CORE/../../x.md"), /fora da pasta/);
  assert.throws(() => safePath("/a/b", "/etc/passwd"), /inválido/);
  assert.throws(() => safePath("/a/b", ""), /inválido/);
  assert.equal(safePath("/a/b", "CORE/index.md"), "/a/b/CORE/index.md");
});

// --- filesystem sem git ---------------------------------------------------

test("filesystem: publish copia, regenera o índice, e fetch/list leem do disco", async () => {
  const root = tmp();
  try {
    const src = join(root, "prd-001-checkout.md");
    writeFileSync(src, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" },
      { root }
    );
    mkdirSync(s.location);

    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/loja/prd-001-checkout.md",
      squad: "CORE",
      tipo: "prd",
    });
    assert.equal(r.indexPath, "CORE/index.md");
    assert.equal(r.sha, undefined);

    const index = await s.fetch("CORE/index.md");
    assert.match(index, /^# CORE/);
    assert.match(
      index,
      /### loja\n- \[prd-001-checkout\.md\]\(product\/loja\/prd-001-checkout\.md\) \| v1\.0\.0 \| backlog \| Checkout/
    );
    assert.match(index, /## engineering\n\n_Nenhum documento\._/);

    assert.deepEqual(await s.list("CORE"), [
      "CORE/index.md",
      "CORE/product/loja/prd-001-checkout.md",
    ]);
    assert.equal(await s.fetch("CORE/product/loja/prd-001-checkout.md"), PRD);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: fetch de arquivo inexistente lança erro com code 404", async () => {
  const root = tmp();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: root },
      { root }
    );
    await assert.rejects(
      () => s.fetch("CORE/index.md"),
      (err) => err.code === 404
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: pasta inexistente dá erro orientando o /jarvis-init", async () => {
  const root = tmp();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "nao-existe" },
      { root }
    );
    await assert.rejects(() => s.fetch("CORE/index.md"), /não encontrada/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderIndex: duas publicações no mesmo produto ficam as duas no índice", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/product/loja/prd-001-a.md"), PRD);
    write(join(root, "CORE/product/loja/frd-001-b.md"), PRD.replace("PRD-001", "FRD-001"));
    write(join(root, "CORE/engineering/loja/ard-001-c.md"), "sem frontmatter\n");
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /\[frd-001-b\.md\]/);
    assert.match(idx, /\[prd-001-a\.md\]/);
    assert.match(
      idx,
      /## engineering\n\n### loja\n- \[ard-001-c\.md\]\(engineering\/loja\/ard-001-c\.md\)\n/
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- camada git -----------------------------------------------------------

function gitFixture() {
  const base = tmp();
  const origin = join(base, "origin.git");
  const clone = join(base, "central-docs");
  const other = join(base, "other");
  git(["init", "--bare", "-b", "main", origin], base);
  git(["clone", origin, clone], base);
  for (const dir of [clone]) {
    git(["config", "user.email", "test@example.com"], dir);
    git(["config", "user.name", "Teste"], dir);
  }
  write(join(clone, "README.md"), "central docs\n");
  git(["add", "README.md"], clone);
  git(["commit", "-m", "init"], clone);
  git(["push", "-u", "origin", "main"], clone);
  git(["clone", origin, other], base);
  git(["config", "user.email", "test@example.com"], other);
  git(["config", "user.name", "Teste"], other);
  return { base, origin, clone, other };
}

test("git: fetch faz pull antes de ler (arquivo empurrado por outro clone aparece)", async () => {
  const { base, clone, other } = gitFixture();
  try {
    write(join(other, "CORE/index.md"), "# CORE\n");
    git(["add", "CORE/index.md"], other);
    git(["commit", "-m", "add index"], other);
    git(["push", "origin", "main"], other);

    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
      { root: base }
    );
    assert.equal(s.isGit, true);
    assert.equal(await s.fetch("CORE/index.md"), "# CORE\n");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: publish cria branch, commita documento + índice, faz push e abre o PR", async () => {
  const { base, origin, clone } = gitFixture();
  try {
    const src = join(base, "prd-001-checkout.md");
    writeFileSync(src, PRD);
    const calls = [];
    const s = getStorage(
      {
        CENTRAL_DOCS_STORAGE: "filesystem",
        CENTRAL_DOCS_LOCATION: clone,
        CENTRAL_DOCS_TARGET_BRANCH: "main",
        CENTRAL_DOCS_REVIEWERS: "ana",
      },
      {
        root: base,
        deps: {
          createMergeRequest: async (url, opts) => {
            calls.push({ url, opts });
            return { vendor: "github", iid: 7, url: "https://example/pr/7" };
          },
        },
      }
    );

    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/loja/prd-001-checkout.md",
      squad: "CORE",
      tipo: "prd",
    });

    assert.equal(r.branch, "docs/CORE/product/loja/prd-001-checkout");
    assert.equal(r.mr.iid, 7);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, origin);
    assert.equal(calls[0].opts.target, "main");
    assert.match(calls[0].opts.description, /Revisores\*\*: ana/);

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/product/loja/prd-001-checkout.md"));
    assert.ok(files.includes("CORE/index.md"));
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: com scripts/build-index.sh no repositório, o índice vem do script", async () => {
  const { base, clone } = gitFixture();
  try {
    write(
      join(clone, "scripts/build-index.sh"),
      'mkdir -p CORE && echo "# gerado pelo script" > CORE/index.md\n'
    );
    git(["add", "scripts/build-index.sh"], clone);
    git(["commit", "-m", "script"], clone);
    git(["push", "origin", "main"], clone);

    const src = join(base, "prd-001-x.md");
    writeFileSync(src, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
      { root: base, deps: { createMergeRequest: async () => ({ iid: 1, url: "u" }) } }
    );
    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/p/prd-001-x.md",
      squad: "CORE",
      tipo: "prd",
    });
    const index = git(["show", `${r.branch}:CORE/index.md`], clone);
    assert.equal(index, "# gerado pelo script");
    assert.ok(
      !existsSync(join(clone, "CORE/product/p/prd-001-x.md")),
      "volta para a branch base após publicar"
    );
    assert.equal(readFileSync(join(clone, "README.md"), "utf-8"), "central docs\n");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
