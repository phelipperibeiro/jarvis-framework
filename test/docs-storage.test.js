// Testes dos adaptadores do Central docs (bin/lib/docs/storage/). Rode com: npm run test:filtro
//
// Tudo em pastas temporárias (mkdtemp). A camada git usa um repositório bare local
// como `origin` — sem rede — e o `createMergeRequest` é injetado (mock).
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getStorage, StorageConfigError } from "../bin/lib/docs/storage/index.js";
import { safePath, pickVersionedDest, versionedName } from "../bin/lib/docs/storage/filesystem.js";
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

test("versionedName: -v{n} antes da extensão, preservando subpasta; sem extensão vai no fim (#229)", () => {
  assert.equal(versionedName("CORE/loja/checkout/decisions/architecture.md", 1), "CORE/loja/checkout/decisions/architecture-v1.md");
  assert.equal(versionedName("CORE/loja/history/229/saidas/E8.estado", 12), "CORE/loja/history/229/saidas/E8-v12.estado");
  assert.equal(versionedName("CORE/loja/history/229/Makefile", 2), "CORE/loja/history/229/Makefile-v2");
  assert.equal(versionedName("a/b.tar.gz", 1), "a/b.tar-v1.gz");
});

test("pickVersionedDest: novo grava no original; igual não grava; diferente vai para -v1, -v2…; igual a uma versão antiga não grava (#229)", () => {
  const root = tmp();
  try {
    const location = join(root, "cd");
    const dest = "CORE/loja/checkout/decisions/architecture.md";
    const put = (rel, text) => write(join(location, rel), text);
    const local = (name, text) => {
      const f = join(root, name);
      writeFileSync(f, text);
      return f;
    };

    // 1) nada publicado: nome original
    const a = local("a.md", "versão A\n");
    let r = pickVersionedDest(location, dest, a);
    assert.deepEqual([r.destPath, r.skipped], [dest, false]);
    assert.equal(r.hash.length, 64);
    put(dest, "versão A\n");

    // 2) conteúdo igual: não grava, aponta para o que já existe
    r = pickVersionedDest(location, dest, a);
    assert.deepEqual([r.destPath, r.skipped], [dest, true]);

    // 3) conteúdo diferente: -v1
    const b = local("b.md", "versão B\n");
    r = pickVersionedDest(location, dest, b);
    assert.deepEqual([r.destPath, r.skipped], ["CORE/loja/checkout/decisions/architecture-v1.md", false]);
    put("CORE/loja/checkout/decisions/architecture-v1.md", "versão B\n");

    // 4) terceira versão: -v2
    const c = local("c.md", "versão C\n");
    r = pickVersionedDest(location, dest, c);
    assert.deepEqual([r.destPath, r.skipped], ["CORE/loja/checkout/decisions/architecture-v2.md", false]);
    put("CORE/loja/checkout/decisions/architecture-v2.md", "versão C\n");

    // 5) volta a ser igual à B: reconhece a -v1 e não cria nada
    r = pickVersionedDest(location, dest, b);
    assert.deepEqual([r.destPath, r.skipped], ["CORE/loja/checkout/decisions/architecture-v1.md", true]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("pickVersionedDest: caminho que sai da pasta é recusado (#229)", () => {
  const root = tmp();
  try {
    const f = join(root, "x.md");
    writeFileSync(f, "x");
    assert.throws(() => pickVersionedDest(join(root, "cd"), "../fora.md", f), /fora da pasta/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: publishBatch versiona só as entradas fromSession; as demais sobrescrevem (#229)", async () => {
  const root = tmp();
  try {
    const s = getStorage({ CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" }, { root });
    mkdirSync(s.location);
    const arch = join(root, "architecture.md");
    const feat = join(root, "feature-checkout.md");
    const files = () => [
      { localFile: arch, destPath: "CORE/loja/checkout/decisions/architecture.md", tipo: "architecture", fromSession: true },
      { localFile: feat, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
    ];

    // rodada 1
    writeFileSync(arch, "# Arquitetura v0\n");
    writeFileSync(feat, PRD);
    let r = await s.publishBatch({ squad: "CORE", slug: "229", files: files() });
    assert.deepEqual(r.published.map((p) => [p.destPath, p.skipped]), [
      ["CORE/loja/checkout/decisions/architecture.md", false],
      ["CORE/loja/checkout/checkout.md", false],
    ]);
    assert.ok(r.published.every((p) => p.hash && p.hash.length === 64), "todas devolvem o hash publicado");

    // rodada 2, nada mudou: a sessão não duplica; a feature é regravada igual
    r = await s.publishBatch({ squad: "CORE", slug: "229", files: files() });
    assert.deepEqual(r.published.map((p) => [p.destPath, p.skipped]), [
      ["CORE/loja/checkout/decisions/architecture.md", true],
      ["CORE/loja/checkout/checkout.md", false],
    ]);

    // rodada 3, a sessão mudou e a feature também
    writeFileSync(arch, "# Arquitetura v1\n");
    writeFileSync(feat, PRD.replace("Checkout", "Checkout 2"));
    r = await s.publishBatch({ squad: "CORE", slug: "229", files: files() });
    assert.deepEqual(r.published.map((p) => [p.destPath, p.skipped]), [
      ["CORE/loja/checkout/decisions/architecture-v1.md", false],
      ["CORE/loja/checkout/checkout.md", false],
    ]);
    assert.equal(await s.fetch("CORE/loja/checkout/decisions/architecture.md"), "# Arquitetura v0\n", "a versão anterior permanece");
    assert.equal(await s.fetch("CORE/loja/checkout/decisions/architecture-v1.md"), "# Arquitetura v1\n");
    assert.match(await s.fetch("CORE/loja/checkout/checkout.md"), /Checkout 2/, "feature sobrescrita, sem -v1");
    assert.equal(existsSync(join(s.location, "CORE/loja/checkout/checkout-v1.md")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: previewBatch simula sem gravar — novo, igual, nova versão, sobrescreve e mantido (#229)", async () => {
  const root = tmp();
  try {
    const s = getStorage({ CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: "cd" }, { root });
    mkdirSync(s.location);
    const arch = join(root, "architecture.md");
    const feat = join(root, "feature.md");
    const home = join(root, "home.md");
    writeFileSync(arch, "# v0\n");
    writeFileSync(feat, PRD);
    writeFileSync(home, "# home\n");
    const files = () => [
      { localFile: arch, destPath: "CORE/loja/checkout/decisions/architecture-229.md", tipo: "architecture", fromSession: true },
      { localFile: feat, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
      { localFile: home, destPath: "CORE/home.md", tipo: "home" },
    ];
    const status = () => s.previewBatch({ files: files() }).map((p) => `${p.status}:${p.destPath}`);

    assert.deepEqual(status(), [
      "novo:CORE/loja/checkout/decisions/architecture-229.md",
      "novo:CORE/loja/checkout/checkout.md",
      "novo:CORE/home.md",
    ]);
    assert.equal(existsSync(join(s.location, "CORE")), false, "a simulação não grava nada");

    await s.publishBatch({ squad: "CORE", slug: "229", files: files() });
    assert.deepEqual(status(), [
      "igual:CORE/loja/checkout/decisions/architecture-229.md",
      "sobrescreve:CORE/loja/checkout/checkout.md",
      "mantido:CORE/home.md",
    ]);

    writeFileSync(arch, "# v1\n");
    assert.deepEqual(status()[0], "nova versão:CORE/loja/checkout/decisions/architecture-229-v1.md");
    assert.equal(existsSync(join(s.location, "CORE/loja/checkout/decisions/architecture-229-v1.md")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("filesystem: publishBatch sem git — falha num arquivo do meio deixa os anteriores copiados, sem rollback (#220 item 3)", async () => {
  const root = tmp();
  try {
    const feature = join(root, "..", "feature-checkout.md");
    writeFileSync(feature, PRD);
    const s = getStorage({ CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: root }, { root });

    await assert.rejects(
      () =>
        s.publishBatch({
          squad: "CORE",
          files: [
            { localFile: feature, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
            {
              localFile: join(root, "nao-existe.md"),
              destPath: "CORE/loja/checkout/deliveries/delivery-x.md",
              tipo: "delivery",
            },
          ],
        }),
      /ENOENT|no such file/
    );

    // Documentado (não corrigido nesta entrega): sem rollback, o primeiro arquivo fica
    // publicado mesmo com o lote tendo falhado — quem chama precisa decidir o que fazer
    // (o `docsPublishManifest` já reporta o erro e sai com 1, sem fingir sucesso).
    assert.ok(existsSync(join(root, "CORE/loja/checkout/checkout.md")), "o primeiro já tinha sido copiado");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("git: publishBatch — falha num arquivo do meio não deixa a branch de trabalho travada", async () => {
  const { base, clone } = gitFixture();
  try {
    const feature = join(base, "feature-checkout.md");
    writeFileSync(feature, PRD);
    const s = getStorage(
      { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
      { root: base, deps: { createMergeRequest: async () => assert.fail("não deveria abrir PR") } }
    );

    await assert.rejects(() =>
      s.publishBatch({
        squad: "CORE",
        slug: "falha-no-meio",
        files: [
          { localFile: feature, destPath: "CORE/loja/checkout/checkout.md", tipo: "feature" },
          {
            localFile: join(base, "nao-existe.md"),
            destPath: "CORE/loja/checkout/deliveries/delivery-x.md",
            tipo: "delivery",
          },
        ],
      })
    );

    // O `finally` do publishBatch sempre volta para a branch base, mesmo com erro no meio.
    assert.equal(git(["branch", "--show-current"], clone), "main");

    // #220, rodada 2 item 3: sem commit nenhum na branch de trabalho (falhou antes do commit),
    // ela é apagada (não fica órfã para sempre) e o arquivo já copiado, ainda untracked, some.
    const branches = git(["branch", "--list"], clone);
    assert.doesNotMatch(branches, /docs\/core-falha-no-meio/, "a branch de trabalho não ficou órfã");
    assert.equal(git(["status", "--porcelain"], clone), "", "sem arquivo untracked sobrando");
  } finally {
    rmSync(base, { recursive: true, force: true });
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

/** Storage git do fixture, com o MR mockado (conta as chamadas). */
function gitStorage(base, clone) {
  const mrs = [];
  const s = getStorage(
    { CENTRAL_DOCS_STORAGE: "filesystem", CENTRAL_DOCS_LOCATION: clone, CENTRAL_DOCS_TARGET_BRANCH: "main" },
    {
      root: base,
      deps: {
        createMergeRequest: async (url, opts) => {
          mrs.push(opts.source);
          return { vendor: "github", iid: mrs.length, url: `https://example/pr/${mrs.length}` };
        },
      },
    }
  );
  return { s, mrs };
}

/** Simula o merge do PR da branch de trabalho na main e o `git pull` de quem lê. */
function mergeBranch(clone, branch) {
  git(["checkout", "main"], clone);
  git(["merge", "--ff-only", branch], clone);
  git(["push", "origin", "main"], clone);
}

test("git: republicar uma sessão igual não apaga a cópia já publicada, não commita nem abre PR (#229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s, mrs } = gitStorage(base, clone);
    const notes = join(base, "notes.md");
    writeFileSync(notes, "# notas\n");
    const files = () => [
      { localFile: notes, destPath: "CORE/loja/history/k/notes.md", tipo: "history", fromSession: true },
    ];

    const r1 = await s.publishBatch({ squad: "CORE", slug: "k", files: files() });
    assert.equal(r1.published[0].skipped, false);
    assert.equal(mrs.length, 1);
    mergeBranch(clone, r1.branch);
    const dest = join(clone, "CORE/loja/history/k/notes.md");
    assert.ok(existsSync(dest), "depois do merge, a cópia está na pasta");

    // mesma sessão, mesmo conteúdo
    const commitsAntes = git(["rev-list", "--all", "--count"], clone);
    const r2 = await s.publishBatch({ squad: "CORE", slug: "k2", files: files() });
    assert.equal(r2.published[0].skipped, true, "igual: nada a publicar");
    assert.ok(existsSync(dest), "a cópia publicada continua na pasta (antes da correção, sumia)");
    assert.equal(git(["status", "--porcelain"], clone), "", "a árvore de trabalho continua limpa");
    assert.equal(mrs.length, 1, "nenhum PR novo");
    assert.equal(git(["rev-list", "--all", "--count"], clone), commitsAntes, "nenhum commit novo");
    assert.equal(git(["branch", "--list", "docs/*"], clone).includes("k2"), false, "sem branch órfã");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: sessão que mudou depois do merge entra como -v1 no commit e no PR, e a anterior permanece (#229)", async () => {
  const { base, origin, clone } = gitFixture();
  try {
    const { s, mrs } = gitStorage(base, clone);
    const arq = join(base, "arq.md");
    const files = () => [
      { localFile: arq, destPath: "CORE/loja/checkout/decisions/architecture-229.md", tipo: "architecture", fromSession: true },
    ];
    writeFileSync(arq, "# v0\n");
    const r1 = await s.publishBatch({ squad: "CORE", slug: "a", files: files() });
    mergeBranch(clone, r1.branch);

    writeFileSync(arq, "# v1\n");
    const prev = await s.previewBatch({ files: files() });
    assert.deepEqual(prev.map((p) => [p.status, p.destPath]), [["nova versão", "CORE/loja/checkout/decisions/architecture-229-v1.md"]]);
    const r2 = await s.publishBatch({ squad: "CORE", slug: "b", files: files() });
    assert.equal(r2.published[0].destPath, "CORE/loja/checkout/decisions/architecture-229-v1.md");
    assert.equal(mrs.length, 2);
    const tree = git(["ls-tree", "-r", "--name-only", r2.branch], origin).split("\n");
    assert.ok(tree.includes("CORE/loja/checkout/decisions/architecture-229-v1.md"), "a versão nova está no PR");
    assert.ok(tree.includes("CORE/loja/checkout/decisions/architecture-229.md"), "a anterior permanece");
    assert.equal(git(["branch", "--show-current"], clone), "main");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: lote todo pulado por home.md existente também não apaga o home.md da pasta (#220, corrigido na #229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const home = join(base, "home.md");
    writeFileSync(home, "# home\n");
    const r1 = await s.publishBatch({ squad: "CORE", slug: "h", files: [{ localFile: home, destPath: "CORE/home.md", tipo: "home" }] });
    mergeBranch(clone, r1.branch);
    const r2 = await s.publishBatch({ squad: "CORE", slug: "h2", files: [{ localFile: home, destPath: "CORE/home.md", tipo: "home" }] });
    assert.equal(r2.published[0].skipped, true);
    assert.ok(existsSync(join(clone, "CORE/home.md")), "o home.md publicado continua na pasta");
    assert.equal(git(["status", "--porcelain"], clone), "");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

/** Hook pre-commit que sempre falha (como identidade do git ausente, assinatura GPG ou um hook do time). */
function breakCommits(clone) {
  const hook = join(clone, ".git/hooks/pre-commit");
  write(hook, "#!/bin/sh\nexit 1\n");
  chmodSync(hook, 0o755);
  return () => rmSync(hook, { force: true });
}

test("git: commit que falha não deixa a cópia só no índice — a limpeza desfaz o git add e a republicação commita de verdade (#229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s, mrs } = gitStorage(base, clone);
    const arq = join(base, "arq.md");
    writeFileSync(arq, "# arq\n");
    const files = () => [
      { localFile: arq, destPath: "CORE/loja/checkout/decisions/architecture-229.md", tipo: "architecture", fromSession: true },
    ];
    const fixHook = breakCommits(clone);

    await assert.rejects(s.publishBatch({ squad: "CORE", slug: "a", files: files() }), /commit/);
    assert.equal(git(["status", "--porcelain"], clone), "", "sem resíduo no índice nem na pasta (antes: 'A  CORE/…/architecture-229.md')");
    assert.equal(existsSync(join(clone, "CORE/loja/checkout/decisions/architecture-229.md")), false);
    assert.equal(git(["branch", "--list", "docs/*"], clone), "", "sem branch órfã");
    assert.equal(mrs.length, 0);

    // a próxima publicação não vê a cópia como 'igual': regrava e, com o commit funcionando, publica de verdade
    fixHook();
    const r = await s.publishBatch({ squad: "CORE", slug: "a", files: files() });
    assert.equal(r.published[0].skipped, false);
    assert.equal(mrs.length, 1);
    assert.ok(git(["ls-tree", "-r", "--name-only", r.branch], clone).includes("CORE/loja/checkout/decisions/architecture-229.md"));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: falha no meio do lote — o arquivo já mesclado permanece, o novo não deixa resíduo e não sobra branch (#229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const ok = join(base, "ok.md");
    writeFileSync(ok, "# ok\n");
    const r1 = await s.publishBatch({
      squad: "CORE",
      slug: "a",
      files: [{ localFile: ok, destPath: "CORE/loja/history/k/ok.md", tipo: "history", fromSession: true }],
    });
    mergeBranch(clone, r1.branch);

    // segundo lote: o mesmo arquivo (igual, já mesclado) + um que não existe mais
    await assert.rejects(
      s.publishBatch({
        squad: "CORE",
        slug: "b",
        files: [
          { localFile: ok, destPath: "CORE/loja/history/k/ok.md", tipo: "history", fromSession: true },
          { localFile: join(base, "sumiu.md"), destPath: "CORE/loja/history/k/sumiu.md", tipo: "history", fromSession: true },
        ],
      })
    );
    assert.ok(existsSync(join(clone, "CORE/loja/history/k/ok.md")), "o arquivo já mesclado permanece");
    assert.equal(existsSync(join(clone, "CORE/loja/history/k/sumiu.md")), false);
    assert.equal(git(["status", "--porcelain"], clone), "");
    assert.equal(git(["branch", "--list", "docs/*"], clone).includes("-b"), false, "sem branch órfã");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: um arquivo untracked que já estava na pasta antes do lote não é apagado pela limpeza (#229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const arq = join(base, "arq.md");
    writeFileSync(arq, "# do lote\n");
    const meu = join(clone, "CORE/loja/history/k/notas.md");
    write(meu, "# escrito à mão, fora do git\n");
    const fixHook = breakCommits(clone);
    await assert.rejects(
      s.publishBatch({
        squad: "CORE",
        slug: "u",
        files: [{ localFile: arq, destPath: "CORE/loja/history/k/notas.md", tipo: "history", fromSession: true }],
      })
    );
    fixHook();
    assert.ok(existsSync(meu), "o arquivo preexistente continua lá");
    assert.match(readFileSync(meu, "utf-8"), /escrito à mão/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: arquivo já no HEAD, sobrescrito pelo lote com outro conteúdo, volta ao do HEAD quando o commit falha (#229, rodada 3)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const f = join(base, "d.md");
    writeFileSync(f, "# v1\n");
    const dest = "CORE/loja/checkout/decisions/prd-1-x.md";
    const r1 = await s.publishBatch({ squad: "CORE", slug: "a", files: [{ localFile: f, destPath: dest, tipo: "prd" }] });
    mergeBranch(clone, r1.branch);
    writeFileSync(f, "# v2\n");
    const fixHook = breakCommits(clone);
    await assert.rejects(s.publishBatch({ squad: "CORE", slug: "b", files: [{ localFile: f, destPath: dest, tipo: "prd" }] }), /commit/);
    assert.equal(git(["status", "--porcelain"], clone), "", "antes: 'M  …' (v2 só no índice, vista como igual na próxima publicação)");
    assert.equal(readFileSync(join(clone, dest), "utf-8"), "# v1\n");
    fixHook();
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: arquivo staged à mão antes do lote não é desfeito pela limpeza (#229, rodada 3)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const arq = join(base, "arq.md");
    writeFileSync(arq, "# do lote\n");
    const meu = join(clone, "CORE/loja/history/k/notas.md");
    write(meu, "# staged à mão\n");
    git(["add", "CORE/loja/history/k/notas.md"], clone);
    const fixHook = breakCommits(clone);
    await assert.rejects(
      s.publishBatch({ squad: "CORE", slug: "u", files: [{ localFile: arq, destPath: "CORE/loja/history/k/notas.md", tipo: "history", fromSession: true }] })
    );
    fixHook();
    assert.match(readFileSync(meu, "utf-8"), /staged à mão/);
    assert.match(git(["status", "--porcelain"], clone), /^A\s+CORE\/loja\/history\/k\/notas\.md/m);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: arquivo untracked com acento que já estava na pasta antes do lote não é apagado pela limpeza (#229, rodada 4)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const arq = join(base, "arq.md");
    writeFileSync(arq, "# do lote\n");
    const meu = join(clone, "CORE/produção/checkout/history/ação.md");
    write(meu, "# escrito à mão\n");
    const fixHook = breakCommits(clone);
    await assert.rejects(
      s.publishBatch({
        squad: "CORE",
        slug: "u",
        files: [{ localFile: arq, destPath: "CORE/produção/checkout/history/ação.md", tipo: "history", fromSession: true }],
      })
    );
    fixHook();
    assert.ok(existsSync(meu), "antes: apagado (o git devolvia o nome em octal e ele não casava com o snapshot)");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("git: archive com commit que falha também não deixa a cópia só no índice (#229)", async () => {
  const { base, clone } = gitFixture();
  try {
    const { s } = gitStorage(base, clone);
    const original = join(base, "ws/docs/jarvis/product/prd-001.md");
    write(original, "---\nid: PRD-001\n---\n# PRD\n");
    const entries = [{ tipo: "prd", feature: "checkout", originalPath: original }];
    const fixHook = breakCommits(clone);
    await assert.rejects(s.archiveBatch({ squad: "CORE", produto: "loja", entries }));
    fixHook();
    assert.equal(git(["status", "--porcelain"], clone), "", "sem resíduo (antes: o arquivo ficava staged)");
    assert.equal(existsSync(join(clone, "CORE/loja/checkout/archive/prd-001.md")), false);
    assert.ok(existsSync(original), "o original nunca é tocado");
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

    const r = await s.migrateApply({ plan, squad: "CORE", timestamp: "2026-11-06T00-00-00" });

    assert.equal(r.moved.length, 2);
    assert.equal(calls.length, 1, "um PR só para a migração");
    assert.equal(git(["branch", "--show-current"], clone), "main", "volta para a branch base");

    const files = git(["ls-tree", "-r", "--name-only", r.branch], origin).split("\n");
    assert.ok(files.includes("CORE/loja/checkout/checkout.md"));
    assert.ok(files.includes("CORE/loja/checkout/deliveries/delivery-2026-10-15-t-1.md"));
    assert.ok(!files.includes("CORE/product/loja/feature-checkout.md"), "o arquivo antigo saiu da branch");
    // #220, rodada 2, N4: o índice tem que ir no MESMO commit da migração, não fora dele.
    assert.ok(files.includes("CORE/index.md"), "o índice entrou no commit da migração");
    assert.equal(
      git(["log", "--oneline", `main..${r.branch}`], origin).split("\n").length,
      1,
      "um commit só, com a migração e o índice juntos"
    );
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
