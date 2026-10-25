// Testes dos adaptadores do Central docs (bin/lib/docs/storage/). Rode com: npm run test:filtro
//
// Tudo em pastas temporárias (mkdtemp). A camada git usa um repositório bare local
// como `origin` — sem rede — e o `createMergeRequest` é injetado (mock).
import { test, mock } from "node:test";
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
id: FEAT-001
name: Checkout
status: in_production
product: loja
updated_at: 2026-10-15
---
# Checkout
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
    const src = join(root, "feature-checkout.md");
    writeFileSync(src, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" },
      { root }
    );
    mkdirSync(s.location);

    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/loja/feature-checkout.md",
      squad: "CORE",
      tipo: "feature",
    });
    assert.equal(r.indexPath, "CORE/index.md");
    assert.equal(r.sha, undefined);

    const index = await s.fetch("CORE/index.md");
    assert.match(index, /^# CORE/);
    assert.match(
      index,
      /### loja\n- \[feature-checkout\.md\]\(product\/loja\/feature-checkout\.md\) \| in_production \| Checkout \| 2026-10-15/
    );
    assert.match(index, /## engineering\n\n> Entregas recentes\n\n_Nenhum documento\._/);

    assert.deepEqual(await s.list("CORE"), [
      "CORE/index.md",
      "CORE/product/loja/feature-checkout.md",
    ]);
    assert.equal(await s.fetch("CORE/product/loja/feature-checkout.md"), PRD);
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

test("renderIndex: ignora a versão humanizada {nome}.public.md", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/product/loja/feature-a.md"), PRD);
    write(join(root, "CORE/product/loja/feature-a.public.md"), PRD);
    write(
      join(root, "CORE/engineering/loja/delivery-2026-10-16-t-1.md"),
      "---\ntask_key: T-1\ndate: 2026-10-16\n---\n"
    );
    write(
      join(root, "CORE/engineering/loja/delivery-2026-10-16-t-1.public.md"),
      "---\ntask_key: T-1\ndate: 2026-10-16\n---\n"
    );
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /\[feature-a\.md\]/);
    assert.match(idx, /\[delivery-2026-10-16-t-1\.md\]/);
    assert.doesNotMatch(idx, /\.public\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderIndex: lista só feature-*/delivery-*, as duas funcionalidades e as entregas recentes", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/product/loja/feature-a.md"), PRD);
    write(join(root, "CORE/product/loja/feature-b.md"), PRD.replace("FEAT-001", "FEAT-002"));
    write(join(root, "CORE/product/loja/prd-001-legado.md"), PRD); // publicado na 4.0.0: fora do índice
    for (let d = 1; d <= 12; d++) {
      const day = String(d).padStart(2, "0");
      write(
        join(root, `CORE/engineering/loja/delivery-2026-10-${day}-t-${d}.md`),
        `---\ntask_key: T-${d}\ndate: 2026-10-${day}\n---\n`
      );
    }
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /\[feature-a\.md\]/);
    assert.match(idx, /\[feature-b\.md\]/);
    assert.doesNotMatch(idx, /prd-001-legado/);
    assert.match(idx, /delivery-2026-10-12-t-12\.md/);
    assert.doesNotMatch(idx, /delivery-2026-10-02-t-2\.md/, "só as 10 entregas mais recentes");
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
    const src = join(base, "feature-checkout.md");
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
      destPath: "CORE/product/loja/feature-checkout.md",
      squad: "CORE",
      tipo: "feature",
    });

    assert.equal(r.branch, "docs/CORE/product/loja/feature-checkout");
    assert.equal(r.mr.iid, 7);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, origin);
    assert.equal(calls[0].opts.target, "main");
    assert.match(calls[0].opts.description, /Revisores\*\*: ana/);

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/product/loja/feature-checkout.md"));
    assert.ok(files.includes("CORE/index.md"));
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: sem CLI (indisponível) o push fica e o MR é null; enviado com erro sobe", async () => {
  const { base, clone } = gitFixture();
  try {
    const src = join(base, "feature-y.md");
    writeFileSync(src, PRD);
    const unavailable = Object.assign(new Error("gh: login inválido"), {
      sent: false,
      exitCode: 3,
    });
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
      { root: base, deps: { createMergeRequest: async () => Promise.reject(unavailable) } }
    );
    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/p/feature-y.md",
      squad: "CORE",
      tipo: "feature",
    });
    assert.equal(r.mr, null);
    assert.equal(r.branch, "docs/CORE/product/p/feature-y");

    const sentErr = Object.assign(new Error("timeout"), { sent: true, exitCode: 4 });
    const s2 = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
      { root: base, deps: { createMergeRequest: async () => Promise.reject(sentErr) } }
    );
    const src2 = join(base, "feature-z.md");
    writeFileSync(src2, PRD);
    await assert.rejects(
      () =>
        s2.publish({
          localFile: src2,
          destPath: "CORE/product/p/feature-z.md",
          squad: "CORE",
          tipo: "feature",
        }),
      /timeout/
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: sem CLI, o aviso traz o link de novo MR (github) ou nenhum link (remote fora de github/gitlab)", async (t) => {
  const { base, clone } = gitFixture();
  setTestMode(false);
  const warns = [];
  mock.method(console, "warn", (...a) => warns.push(a.join(" ")));
  t.after(() => {
    mock.reset();
    setTestMode(true);
    rmSync(base, { recursive: true, force: true });
  });
  const unavailable = Object.assign(new Error("gh: login inválido"), { sent: false, exitCode: 3 });
  // O push vai para o origin local; o "remote get-url" responde um endereço do GitHub.
  const runGit = (args, cwd) =>
    args[0] === "remote" && args[1] === "get-url"
      ? "https://github.com/o/central-docs"
      : execFileSync("git", args, {
          cwd,
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "pipe"],
        }).trim();
  const s = getStorage(
    { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
    { root: base, deps: { runGit, createMergeRequest: async () => Promise.reject(unavailable) } }
  );
  const src = join(base, "feature-w.md");
  writeFileSync(src, PRD);
  const r = await s.publish({
    localFile: src,
    destPath: "CORE/product/p/feature-w.md",
    squad: "CORE",
    tipo: "feature",
  });
  assert.equal(r.mr, null);
  assert.match(
    warns.join("\n"),
    /abra o MR à mão: https:\/\/github.com\/o\/central-docs\/compare\/main\.\.\.docs/
  );

  warns.length = 0;
  const s2 = getStorage(
    { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
    { root: base, deps: { createMergeRequest: async () => Promise.reject(unavailable) } }
  );
  const src2 = join(base, "feature-v.md");
  writeFileSync(src2, PRD);
  await s2.publish({
    localFile: src2,
    destPath: "CORE/product/p/feature-v.md",
    squad: "CORE",
    tipo: "feature",
  });
  assert.match(warns.join("\n"), /abra o MR à mão no host/);
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

    const src = join(base, "feature-x.md");
    writeFileSync(src, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
      { root: base, deps: { createMergeRequest: async () => ({ iid: 1, url: "u" }) } }
    );
    const r = await s.publish({
      localFile: src,
      destPath: "CORE/product/p/feature-x.md",
      squad: "CORE",
      tipo: "feature",
    });
    const index = git(["show", `${r.branch}:CORE/index.md`], clone);
    assert.equal(index, "# gerado pelo script");
    assert.ok(
      !existsSync(join(clone, "CORE/product/p/feature-x.md")),
      "volta para a branch base após publicar"
    );
    assert.equal(readFileSync(join(clone, "README.md"), "utf-8"), "central docs\n");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
