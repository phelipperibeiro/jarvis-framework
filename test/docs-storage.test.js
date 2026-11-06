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
      destPath: "CORE/loja/checkout/checkout.md",
      squad: "CORE",
      tipo: "feature",
    });
    assert.equal(r.indexPath, "CORE/index.md");
    assert.equal(r.sha, undefined);

    const index = await s.fetch("CORE/index.md");
    assert.match(index, /^# CORE/);
    assert.match(
      index,
      /## loja\n\n- \[checkout\]\(loja\/checkout\/checkout\.md\) \| in_production \| Checkout \| 2026-10-15/
    );

    assert.deepEqual(await s.list("CORE"), [
      "CORE/index.md",
      "CORE/loja/checkout/checkout.md",
    ]);
    assert.equal(await s.fetch("CORE/loja/checkout/checkout.md"), PRD);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: home.md é criado uma vez e nunca sobrescrito", async () => {
  const root = tmp();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" },
      { root }
    );
    mkdirSync(s.location);

    const src = join(root, "home.md");
    writeFileSync(src, "# Primeira versão\n");
    const r1 = await s.publish({ localFile: src, destPath: "CORE/home.md", squad: "CORE", tipo: "home" });
    assert.equal(r1.skipped, undefined);
    assert.equal(await s.fetch("CORE/home.md"), "# Primeira versão\n");

    writeFileSync(src, "# Segunda versão (não deveria valer)\n");
    const r2 = await s.publish({ localFile: src, destPath: "CORE/home.md", squad: "CORE", tipo: "home" });
    assert.equal(r2.skipped, true);
    assert.equal(await s.fetch("CORE/home.md"), "# Primeira versão\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: publishBatch copia vários arquivos e regenera o índice uma vez só", async () => {
  const root = tmp();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" },
      { root }
    );
    mkdirSync(s.location);

    const feature = join(root, "feature-checkout.md");
    const delivery = join(root, "delivery-2026-10-15-task-123.md");
    writeFileSync(feature, PRD);
    writeFileSync(delivery, "---\ntask_key: TASK-123\ndate: 2026-10-15\n---\n");

    const r = await s.publishBatch({
      squad: "CORE",
      slug: "task-123",
      files: [
        { localFile: feature, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
        {
          localFile: delivery,
          destPath: "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md",
          tipo: "delivery",
        },
      ],
    });

    assert.equal(r.published.length, 2);
    assert.ok(r.published.every((p) => p.skipped === false));
    assert.equal(await s.fetch("CORE/loja/checkout/checkout.md"), PRD);
    assert.match(await s.fetch("CORE/index.md"), /- \[checkout\]\(loja\/checkout\/checkout\.md\)/);
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

test("renderIndex: ignora a versão humanizada {nome}.public.md, decisions/, history/ e archive/", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/loja/a/a.md"), PRD);
    write(join(root, "CORE/loja/a/a.public.md"), PRD);
    write(
      join(root, "CORE/loja/a/deliveries/delivery-2026-10-16-t-1.md"),
      "---\ntask_key: T-1\ndate: 2026-10-16\n---\n"
    );
    write(
      join(root, "CORE/loja/a/deliveries/delivery-2026-10-16-t-1.public.md"),
      "---\ntask_key: T-1\ndate: 2026-10-16\n---\n"
    );
    write(join(root, "CORE/loja/a/decisions/prd-001-a.md"), PRD);
    write(join(root, "CORE/loja/a/archive/a.md"), PRD);
    write(join(root, "CORE/loja/history/t-1/daily.md"), "# Daily\n");
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /\[a\]\(loja\/a\/a\.md\)/);
    assert.match(idx, /\[delivery-2026-10-16-t-1\.md\]/);
    assert.doesNotMatch(idx, /\.public\.md/);
    assert.doesNotMatch(idx, /decisions|archive|history|daily/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderIndex: ignora pastas 'product'/'engineering' que sobraram do layout antigo (#220 item 9)", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/loja/a/a.md"), PRD);
    mkdirSync(join(root, "CORE/product"), { recursive: true });
    mkdirSync(join(root, "CORE/engineering"), { recursive: true });
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /## loja/);
    assert.doesNotMatch(idx, /## product/);
    assert.doesNotMatch(idx, /## engineering/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("renderIndex: lista a página do produto, as funcionalidades e as entregas recentes (deduplicadas por task_key)", () => {
  const root = tmp();
  try {
    write(join(root, "CORE/loja/loja.md"), "---\nid: PROD-loja\nname: Loja\n---\n# Loja\n");
    write(join(root, "CORE/loja/a/a.md"), PRD);
    write(join(root, "CORE/loja/b/b.md"), PRD.replace("FEAT-001", "FEAT-002"));
    for (let d = 1; d <= 12; d++) {
      const day = String(d).padStart(2, "0");
      write(
        join(root, `CORE/loja/a/deliveries/delivery-2026-10-${day}-t-${d}.md`),
        `---\ntask_key: T-${d}\ndate: 2026-10-${day}\n---\n`
      );
    }
    // entrega quebrada por funcionalidade (Q9): mesmo task_key em duas pastas, conta uma vez
    write(
      join(root, "CORE/loja/a/deliveries/delivery-2026-10-12-t-12.md"),
      "---\ntask_key: T-12\ndate: 2026-10-12\n---\n"
    );
    write(
      join(root, "CORE/loja/b/deliveries/delivery-2026-10-12-t-12-b.md"),
      "---\ntask_key: T-12\ndate: 2026-10-12\n---\n"
    );
    const idx = renderIndex(root, "CORE");
    assert.match(idx, /\[Loja\]\(loja\/loja\.md\)/);
    assert.match(idx, /\[a\]\(loja\/a\/a\.md\)/);
    assert.match(idx, /\[b\]\(loja\/b\/b\.md\)/);
    assert.equal(
      (idx.match(/T-12/g) || []).length,
      1,
      "T-12 aparece uma vez só, mesmo quebrada (Q9) em duas funcionalidades"
    );
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
    assert.doesNotMatch(calls[0].opts.description, /Revisores/);

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/product/loja/feature-checkout.md"));
    assert.ok(files.includes("CORE/index.md"));
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: publishBatch commita a entrega inteira numa branch e um PR só", async () => {
  const { base, origin, clone } = gitFixture();
  try {
    const feature = join(base, "feature-checkout.md");
    const delivery = join(base, "delivery-2026-10-15-task-123.md");
    writeFileSync(feature, PRD);
    writeFileSync(delivery, "---\ntask_key: TASK-123\ndate: 2026-10-15\n---\n");
    const calls = [];
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      {
        root: base,
        deps: {
          createMergeRequest: async (url, opts) => {
            calls.push({ url, opts });
            return { vendor: "github", iid: 9, url: "https://example/pr/9" };
          },
        },
      }
    );

    const r = await s.publishBatch({
      squad: "CORE",
      slug: "task-123",
      files: [
        { localFile: feature, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
        {
          localFile: delivery,
          destPath: "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md",
          tipo: "delivery",
        },
      ],
    });

    assert.equal(r.branch, "docs/core-task-123");
    assert.equal(r.mr.iid, 9);
    assert.equal(calls.length, 1, "um PR só para a entrega inteira");

    const commits = git(["log", "--oneline", `main..${r.branch}`], origin).split("\n");
    assert.equal(commits.length, 1, "um commit só para a entrega inteira");

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/loja/checkout/checkout.md"));
    assert.ok(files.includes("CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md"));
    assert.ok(files.includes("CORE/index.md"));
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: publishBatch com uma branch local já existente (retry) reusa em vez de falhar (#220 item 12)", async () => {
  const { base, clone } = gitFixture();
  try {
    // Simula uma tentativa anterior que criou a branch local e não chegou a terminar
    // (ex.: push falhou): a branch já existe quando `publishBatch` roda de novo.
    git(["checkout", "-b", "docs/core-retry-1"], clone);
    git(["checkout", "main"], clone);

    const feature = join(base, "feature-checkout.md");
    writeFileSync(feature, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      { root: base, deps: { createMergeRequest: async () => ({ vendor: "github", iid: 1, url: "x" }) } }
    );

    const r = await s.publishBatch({
      squad: "CORE",
      slug: "retry-1",
      files: [{ localFile: feature, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" }],
    });

    assert.equal(r.branch, "docs/core-retry-1");
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: publishBatch com lote todo pulado (home.md já existe) não tenta comitar (#220 item 12)", async () => {
  const { base, clone } = gitFixture();
  try {
    write(join(clone, "CORE/home.md"), "# já existe\n");
    git(["add", "CORE/home.md"], clone);
    git(["commit", "-m", "home existente"], clone);

    const home = join(base, "home.md");
    writeFileSync(home, "# home nova\n");
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      { root: base, deps: { createMergeRequest: async () => assert.fail("não deveria abrir PR") } }
    );

    const r = await s.publishBatch({
      squad: "CORE",
      slug: "so-home",
      files: [{ localFile: home, destPath: "CORE/home.md", tipo: "home" }],
    });

    assert.equal(r.published[0].skipped, true);
    assert.equal(r.mr, undefined);
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: archiveBatch copia os originais numa branch e PR próprios (#220 item 2)", async () => {
  const { base, origin, clone } = gitFixture();
  try {
    const original = join(base, "prd-001-checkout.md");
    writeFileSync(original, "---\nid: PRD-001\nstatus: in_progress\n---\n# PRD\n");
    const calls = [];
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      {
        root: base,
        deps: {
          createMergeRequest: async (url, opts) => {
            calls.push({ url, opts });
            return { vendor: "github", iid: 11, url: "https://example/pr/11" };
          },
        },
      }
    );
    const entries = [{ tipo: "prd", feature: "checkout", originalPath: original }];

    const r = await s.archiveBatch({ squad: "CORE", produto: "loja", entries });

    assert.equal(r.archived.length, 1);
    assert.equal(calls.length, 1, "um PR só para o arquivamento");
    assert.equal(git(["branch", "--show-current"], clone), "main");
    assert.ok(existsSync(original), "o original continua onde estava");

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/loja/checkout/archive/prd-001-checkout.md"));
    const archived = git(["show", `${r.branch}:CORE/loja/checkout/archive/prd-001-checkout.md`], origin);
    assert.match(archived, new RegExp(`origin: ${original.replace(/[/\\]/g, "\\$&")}`));
    assert.match(archived, /original_status: in_progress/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: archiveBatch sem nenhuma entrada arquivável não comita nem abre PR (#220 item 2)", async () => {
  const { base, clone } = gitFixture();
  try {
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      { root: base, deps: { createMergeRequest: async () => assert.fail("não deveria abrir PR") } }
    );
    // Entradas sem originalPath (feature/delivery/product/home/history): nada a arquivar.
    const entries = [{ tipo: "feature", feature: "checkout" }];

    const r = await s.archiveBatch({ squad: "CORE", produto: "loja", entries });

    assert.equal(r.archived.length, 0);
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: migrateApply move numa branch e PR próprios, sem mexer direto na branch atual (#220 item 7)", async () => {
  const { base, origin, clone } = gitFixture();
  try {
    write(
      join(clone, "CORE/product/loja/feature-checkout.md"),
      "---\nid: FEAT-001\nname: Checkout\nstatus: in_production\nproduct: loja\nupdated_at: 2026-10-15\nlast_delivery: delivery-2026-10-15-t-1.md\n---\n# Checkout\n"
    );
    write(join(clone, "CORE/engineering/loja/delivery-2026-10-15-t-1.md"), "---\ntask_key: T-1\n---\n");
    git(["add", "-A"], clone);
    git(["commit", "-m", "layout antigo"], clone);
    git(["push", "origin", "main"], clone);

    const { planCentralMigration } = await import("../bin/lib/docs/migrate-central.js");
    const calls = [];
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      {
        root: base,
        deps: {
          createMergeRequest: async (url, opts) => {
            calls.push({ url, opts });
            return { vendor: "github", iid: 21, url: "https://example/pr/21" };
          },
        },
      }
    );
    const plan = planCentralMigration(clone, "CORE");

    const r = await s.migrateApply({ plan, timestamp: "2026-11-06T00-00-00" });

    assert.equal(r.moved.length, 2);
    assert.equal(calls.length, 1, "um PR só para a migração");
    assert.equal(git(["branch", "--show-current"], clone), "main", "volta para a branch base");

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/loja/checkout/checkout.md"));
    assert.ok(files.includes("CORE/loja/checkout/deliveries/delivery-2026-10-15-t-1.md"));
    assert.ok(!files.includes("CORE/product/loja/feature-checkout.md"), "o arquivo antigo saiu da branch");
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

test("git: o ENV.md do comando (fileEnvResult) chega ao gate do MR: com manual, o push fica e o MR não abre", async (t) => {
  const { base, clone } = gitFixture();
  setTestMode(false);
  const warns = [];
  mock.method(console, "warn", (...a) => warns.push(a.join(" ")));
  t.after(() => {
    mock.reset();
    setTestMode(true);
    rmSync(base, { recursive: true, force: true });
  });
  const runGit = (args, cwd) =>
    args[0] === "remote" && args[1] === "get-url"
      ? "https://github.com/o/central-docs"
      : execFileSync("git", args, {
          cwd,
          encoding: "utf-8",
          stdio: ["ignore", "pipe", "pipe"],
        }).trim();
  // createMergeRequest real (sem mock): o gate barra antes de qualquer CLI.
  const s = getStorage(
    { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone },
    {
      root: base,
      deps: { runGit, fileEnvResult: { vars: { VERSION_CONTROL_ACCESS: "manual" }, error: null } },
    }
  );
  const src = join(base, "feature-u.md");
  writeFileSync(src, PRD);
  const r = await s.publish({
    localFile: src,
    destPath: "CORE/product/p/feature-u.md",
    squad: "CORE",
    tipo: "feature",
  });
  assert.equal(r.mr, null);
  assert.match(warns.join("\n"), /VERSION_CONTROL_ACCESS=manual/);
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
