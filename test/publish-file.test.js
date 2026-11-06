// Testes de publish-file.js: o Central docs publica na estrutura por funcionalidade
// ({squad}/{produto}/{funcionalidade}/…, #220). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  publishFile,
  publishFiles,
  resolveDestPath,
  assertRelPath,
  REL_MAX_DEPTH,
  VALID_TYPES,
  DECISION_DOC_TYPES,
} from "../bin/lib/docs/publish-file.js";
import { validateFrontmatter } from "../bin/lib/docs/validate-frontmatter.js";
import { createFilesystemStorage } from "../bin/lib/docs/storage/filesystem.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

setTestMode(true);

const FEATURE = `---
id: FEAT-001
name: Checkout
status: in_production
product: loja
updated_at: 2026-10-15
---
# Checkout
`;

const DELIVERY = `---
id: DEL-2026-10-15-task-123
feature: feature-checkout.md
task_key: TASK-123
pr: "#42"
date: 2026-10-15
---
# Entrega
`;

const PRD = `---
id: PRD-001
name: Checkout
version: "1.0"
status: in_production
---
# PRD
`;

test("VALID_TYPES: feature, delivery, product, history, home e os tipos de decisão", () => {
  assert.ok(VALID_TYPES.includes("feature"));
  assert.ok(VALID_TYPES.includes("delivery"));
  assert.ok(VALID_TYPES.includes("product"));
  assert.ok(VALID_TYPES.includes("history"));
  assert.ok(VALID_TYPES.includes("home"));
  for (const tipo of DECISION_DOC_TYPES) assert.ok(VALID_TYPES.includes(tipo), tipo);
});

test("resolveDestPath: home vai para {squad}/home.md, sem precisar de produto", () => {
  assert.deepEqual(resolveDestPath({ tipo: "home", squad: "CORE", localFile: "home.md" }), {
    destPath: "CORE/home.md",
    area: "home",
    fileName: "home.md",
  });
});

test("resolveDestPath: feature vira a página da funcionalidade, sem o prefixo 'feature-'", () => {
  assert.deepEqual(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "/s/feature-checkout.md",
    }),
    {
      destPath: "CORE/loja/checkout/checkout.md",
      area: "feature",
      fileName: "checkout.md",
    }
  );
});

test("resolveDestPath: feature fora do padrão usa --feature; sem ele, erro orientando", () => {
  assert.equal(
    resolveDestPath({
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
      localFile: "x.md",
      feature: "pix",
    }).destPath,
    "CORE/loja/pix/pix.md"
  );
  assert.throws(
    () => resolveDestPath({ tipo: "feature", squad: "CORE", produto: "loja", localFile: "x.md" }),
    /--feature/
  );
});

test("resolveDestPath: delivery exige --feature e mora em deliveries/ dentro da funcionalidade", () => {
  assert.equal(
    resolveDestPath({
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
      localFile: "delivery-2026-10-15-task-123.md",
      feature: "checkout",
    }).destPath,
    "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md"
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "delivery",
        squad: "CORE",
        produto: "loja",
        localFile: "delivery-2026-10-15-task-123.md",
      }),
    /--feature/
  );
});

test("resolveDestPath: documento de trabalho (prd, ard…) vai para decisions/ da funcionalidade, exige --feature", () => {
  for (const tipo of DECISION_DOC_TYPES) {
    assert.equal(
      resolveDestPath({
        tipo,
        squad: "CORE",
        produto: "loja",
        localFile: `${tipo}-001-checkout.md`,
        feature: "checkout",
      }).destPath,
      `CORE/loja/checkout/decisions/${tipo}-001-checkout.md`,
      tipo
    );
    assert.throws(
      () => resolveDestPath({ tipo, squad: "CORE", produto: "loja", localFile: `${tipo}-1.md` }),
      /--feature/,
      tipo
    );
  }
});

test("resolveDestPath: product vai para {produto}.md, sem --feature", () => {
  assert.equal(
    resolveDestPath({
      tipo: "product",
      squad: "CORE",
      produto: "loja",
      localFile: "qualquer.md",
    }).destPath,
    "CORE/loja/loja.md"
  );
});

test("resolveDestPath: history exige --task-key e mora em history/{chave}/", () => {
  assert.equal(
    resolveDestPath({
      tipo: "history",
      squad: "CORE",
      produto: "loja",
      localFile: "gate-checklist.md",
      taskKey: "task-123",
    }).destPath,
    "CORE/loja/history/task-123/gate-checklist.md"
  );
  assert.throws(
    () =>
      resolveDestPath({ tipo: "history", squad: "CORE", produto: "loja", localFile: "daily.md" }),
    /--task-key/
  );
});

test("VALID_TYPES: architecture, plan e light-arch da sessão são tipos de decisão (#229)", () => {
  for (const tipo of ["architecture", "plan", "light-arch"]) {
    assert.ok(DECISION_DOC_TYPES.includes(tipo), tipo);
    assert.ok(VALID_TYPES.includes(tipo), tipo);
    assert.equal(
      resolveDestPath({
        tipo,
        squad: "CORE",
        produto: "loja",
        localFile: `/sessao/${tipo}.md`,
        feature: "checkout",
      }).destPath,
      `CORE/loja/checkout/decisions/${tipo}.md`
    );
  }
  assert.throws(
    () => resolveDestPath({ tipo: "architecture", squad: "CORE", produto: "loja", localFile: "architecture.md" }),
    /--feature/
  );
});

test("resolveDestPath: history com relPath preserva subpastas e permite renomear (#229)", () => {
  const base = { tipo: "history", squad: "CORE", produto: "loja", taskKey: "229" };
  assert.deepEqual(
    resolveDestPath({ ...base, localFile: "x.md", relPath: "fontes/skill/9-browser-apis.md" }),
    {
      destPath: "CORE/loja/history/229/fontes/skill/9-browser-apis.md",
      area: "history",
      fileName: "9-browser-apis.md",
    }
  );
  // página-índice da sessão: o arquivo local session-229.md vira 229.md
  assert.equal(
    resolveDestPath({ ...base, localFile: "/tmp/consolidation/session-229.md", relPath: "229.md" }).destPath,
    "CORE/loja/history/229/229.md"
  );
  // sem relPath: como antes
  assert.equal(
    resolveDestPath({ ...base, localFile: "/tmp/daily.md" }).destPath,
    "CORE/loja/history/229/daily.md"
  );
});

test("assertRelPath: recusa .., oculto, barra no começo, segmento vazio, profundidade e vazio (#229)", () => {
  for (const ok of ["a.md", "fontes/a/b.txt", "saidas/E8_r2.txt", "v1.2/x-y_z.json"]) {
    assert.doesNotThrow(() => assertRelPath("Caminho", ok), ok);
  }
  for (const bad of ["../x", "a/../b", ".oculto", "a/.oculto", "/x", "a//b", "a/", "", "a\\b", "a b.md", "a..b.md"]) {
    assert.throws(() => assertRelPath("Caminho", bad), /inválido/, JSON.stringify(bad));
  }
  assert.throws(() => assertRelPath("Caminho", Array(REL_MAX_DEPTH + 1).fill("a").join("/")), /inválido/);
  assert.doesNotThrow(() => assertRelPath("Caminho", Array(REL_MAX_DEPTH).fill("a").join("/")));
  assert.throws(() => assertRelPath("Caminho", undefined), /inválido/);
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "history",
        squad: "CORE",
        produto: "loja",
        taskKey: "229",
        localFile: "x.md",
        relPath: "../fora.md",
      }),
    /Caminho relativo inválido/
  );
});

test("validateFrontmatter: architecture, plan e light-arch sem frontmatter passam (#229)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-vf-"));
  try {
    const file = join(dir, "architecture.md");
    writeFileSync(file, "# Architecture: 229\n\n> sem frontmatter\n");
    for (const tipo of ["architecture", "plan", "light-arch", "history"]) {
      assert.deepEqual(validateFrontmatter(file, tipo), {}, tipo);
    }
    // não-Markdown também passa em history (saídas de comando, JSON de medição)
    const json = join(dir, "tokens.json");
    writeFileSync(json, '{"a":1}\n');
    assert.deepEqual(validateFrontmatter(json, "history"), {});
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFiles: repassa relPath e fromSession ao adaptador (#229)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pf-"));
  try {
    const root = join(dir, "cd");
    mkdirSync(root, { recursive: true });
    const storage = createFilesystemStorage({ location: root, root: dir });
    const file = join(dir, "origem.txt");
    writeFileSync(file, "saída do comando\n");
    const result = await publishFiles({
      storage,
      squad: "CORE",
      produto: "loja",
      slug: "229",
      files: [
        { localFile: file, tipo: "history", taskKey: "229", relPath: "ferramentas/saidas/E8_r2.txt", fromSession: true },
      ],
    });
    assert.equal(result.published[0].destPath, "CORE/loja/history/229/ferramentas/saidas/E8_r2.txt");
    assert.equal(readFileSync(join(root, result.published[0].destPath), "utf-8"), "saída do comando\n");
    await assert.rejects(
      publishFiles({
        storage,
        squad: "CORE",
        produto: "loja",
        files: [{ localFile: file, tipo: "history", taskKey: "229", relPath: "../x.txt" }],
      }),
      /Caminho relativo inválido/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFiles: devolve linkWarnings dos links que não resolvem no Central docs e publica mesmo assim (#229)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pf-"));
  try {
    const root = join(dir, "cd");
    mkdirSync(root, { recursive: true });
    const storage = createFilesystemStorage({ location: root, root: dir });
    const plan = join(dir, "plan.md");
    const arch = join(dir, "architecture.md");
    writeFileSync(plan, "# Plano\n[código](../../../../../jarvis-framework/bin/x.js#L5)\n[arquitetura](architecture.md)\n[url](https://github.com/o/r)\n");
    writeFileSync(arch, "# Arquitetura\n[plano](plan.md)\n");
    const result = await publishFiles({
      storage,
      squad: "CORE",
      produto: "loja",
      slug: "229",
      files: [
        { localFile: plan, tipo: "plan", feature: "checkout", fromSession: true },
        { localFile: arch, tipo: "architecture", feature: "checkout", fromSession: true },
      ],
    });
    assert.equal(result.published.length, 2, "publica mesmo com o aviso");
    assert.deepEqual(
      result.linkWarnings.map((w) => [w.destPath, w.link]),
      [["CORE/loja/checkout/decisions/plan.md", "../../../../../jarvis-framework/bin/x.js"]]
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFiles: converte os links dos .md da sessão no destino e deixa o original intacto (#229)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pf-"));
  try {
    const root = join(dir, "cd");
    mkdirSync(root, { recursive: true });
    const storage = createFilesystemStorage({ location: root, root: dir });

    // sessão real (originalPath) e cópias em consolidation/ (localFile)
    const sessao = join(dir, ".jarvis/sessions/eng/229");
    mkdirSync(sessao, { recursive: true });
    const archOriginal =
      "> **Commit base:** `jarvis-framework@2d149a1`\n" +
      "# Arquitetura\n" +
      "Plano: [plan](plan.md#fase-1). Código: [`x` (`x.js:5`)](../../../../jarvis-framework/bin/x.js#L5).\n" +
      "PRD: [prd](../../../../docs/jarvis/product/prd.md). Card: [#229](https://github.com/o/r/issues/229).\n";
    const planOriginal = "# Plano\nVeja [a arquitetura](architecture.md).\n";
    writeFileSync(join(sessao, "architecture.md"), archOriginal);
    writeFileSync(join(sessao, "plan.md"), planOriginal);
    const consolidation = join(sessao, "consolidation");
    mkdirSync(consolidation, { recursive: true });
    writeFileSync(join(consolidation, "architecture.md"), archOriginal);
    writeFileSync(join(consolidation, "plan.md"), planOriginal);
    writeFileSync(join(consolidation, "session-229.md"), "# Sessão 229\n[arquitetura](../../checkout/decisions/architecture.md)\n");

    const result = await publishFiles({
      storage,
      squad: "CORE",
      produto: "loja",
      slug: "229",
      localOnlyDirs: [join(dir, "docs/jarvis"), join(dir, ".jarvis")],
      deps: {
        repoOf: (abs) =>
          abs.includes("/jarvis-framework/")
            ? { repo: "jarvis-framework", remote: "https://github.com/o/jarvis-framework", relPath: abs.split("/jarvis-framework/")[1] }
            : null,
      },
      files: [
        { localFile: join(consolidation, "architecture.md"), originalPath: join(sessao, "architecture.md"), tipo: "architecture", feature: "checkout", taskKey: "229", fromSession: true },
        { localFile: join(consolidation, "plan.md"), originalPath: join(sessao, "plan.md"), tipo: "plan", feature: "checkout", taskKey: "229", fromSession: true },
        // página-índice gerada: sem originalPath, não é convertida
        { localFile: join(consolidation, "session-229.md"), tipo: "history", taskKey: "229", relPath: "229.md", fromSession: true },
      ],
    });

    const arch = readFileSync(join(root, "CORE/loja/checkout/decisions/architecture.md"), "utf-8");
    assert.match(arch, /\[plan\]\(plan\.md#fase-1\)/, "outro arquivo da entrega: link relativo no Central docs");
    assert.match(arch, /\(https:\/\/github\.com\/o\/jarvis-framework\/blob\/2d149a1\/bin\/x\.js#L5\)/, "código: URL no commit base");
    assert.match(arch, /PRD: prd\./, "docs/jarvis vira texto");
    assert.match(arch, /\[#229\]\(https:\/\/github\.com\/o\/r\/issues\/229\)/, "URL intacta");
    const plan = readFileSync(join(root, "CORE/loja/checkout/decisions/plan.md"), "utf-8");
    assert.match(plan, /\[a arquitetura\]\(architecture\.md\)/);
    const indice = readFileSync(join(root, "CORE/loja/history/229/229.md"), "utf-8");
    assert.match(indice, /\(\.\.\/\.\.\/checkout\/decisions\/architecture\.md\)/, "página-índice não é reescrita");

    assert.equal(readFileSync(join(sessao, "architecture.md"), "utf-8"), archOriginal, "o original na sessão não muda");
    assert.equal(readFileSync(join(consolidation, "architecture.md"), "utf-8"), archOriginal, "a cópia em consolidation/ também não");
    // o plan.md já tinha o link certo (mesma pasta): nada a regravar, então não entra na lista
    assert.deepEqual(
      result.linkRewrites.map((r) => [r.destPath, r.converted, r.dropped]),
      [["CORE/loja/checkout/decisions/architecture.md", 2, 1]]
    );
    assert.deepEqual(result.linkWarnings, [], "depois da conversão, todos os links relativos resolvem no Central docs");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("resolveDestPath: tipo home rejeita squad inválido mesmo sem produto (early-return antes da validação de produto) (#220 item 3)", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "home", squad: "../x", localFile: "home.md" }),
    /Squad inválido/
  );
  // Squad válido, sem produto: o tipo "home" não exige produto (early-return antes dessa validação).
  assert.deepEqual(resolveDestPath({ tipo: "home", squad: "CORE", localFile: "home.md" }), {
    destPath: "CORE/home.md",
    area: "home",
    fileName: "home.md",
  });
});

test("resolveDestPath: tipo product rejeita produto inválido", () => {
  assert.throws(
    () =>
      resolveDestPath({ tipo: "product", squad: "CORE", produto: "../x", localFile: "produto.md" }),
    /Produto inválido/
  );
  assert.throws(
    () =>
      resolveDestPath({ tipo: "product", squad: "CORE", produto: "a/b", localFile: "produto.md" }),
    /Produto inválido/
  );
});

test("resolveDestPath: rejeita tipo desconhecido e segmentos com / ou ..", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "xyz", squad: "CORE", produto: "p", localFile: "xyz-1.md" }),
    /Tipos válidos/
  );
  assert.throws(
    () =>
      resolveDestPath({ tipo: "feature", squad: "../x", produto: "p", localFile: "feature-1.md" }),
    /Squad inválido/
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "feature",
        squad: "CORE",
        produto: "a/b",
        localFile: "feature-1.md",
      }),
    /Produto inválido/
  );
  assert.throws(
    () =>
      resolveDestPath({
        tipo: "delivery",
        squad: "CORE",
        produto: "p",
        localFile: "delivery-1.md",
        feature: "../x",
      }),
    /Feature inválido/
  );
});

test("publishFile: sem adaptador (Central docs desligado) lança erro", async () => {
  await assert.rejects(
    () =>
      publishFile({
        storage: null,
        localFile: "x.md",
        tipo: "feature",
        squad: "CORE",
        produto: "p",
      }),
    /desligado/
  );
});

test("publishFile: frontmatter sem os campos da consolidação lança erro antes de gravar", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const file = join(dir, "feature-x.md");
    writeFileSync(file, "---\nid: FEAT-001\n---\n");
    const storage = createFilesystemStorage({ location: dir });
    await assert.rejects(
      () => publishFile({ storage, localFile: file, tipo: "feature", squad: "CORE", produto: "p" }),
      /Campos obrigatórios/
    );
    assert.equal(existsSync(join(dir, "CORE")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFile: entrega + funcionalidade + PRD ligado publicados entram no índice", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const location = join(dir, "cd");
    mkdirSync(location);
    const storage = createFilesystemStorage({ location });
    const delivery = join(dir, "delivery-2026-10-15-task-123.md");
    const feature = join(dir, "feature-checkout.md");
    const prd = join(dir, "prd-001-checkout.md");
    writeFileSync(delivery, DELIVERY);
    writeFileSync(feature, FEATURE);
    writeFileSync(prd, PRD);

    await publishFile({
      storage,
      localFile: delivery,
      tipo: "delivery",
      squad: "CORE",
      produto: "loja",
      feature: "checkout",
    });
    const r = await publishFile({
      storage,
      localFile: feature,
      tipo: "feature",
      squad: "CORE",
      produto: "loja",
    });
    await publishFile({
      storage,
      localFile: prd,
      tipo: "prd",
      squad: "CORE",
      produto: "loja",
      feature: "checkout",
    });

    assert.equal(r.destPath, "CORE/loja/checkout/checkout.md");
    assert.ok(existsSync(join(location, "CORE/loja/checkout/decisions/prd-001-checkout.md")));

    const index = readFileSync(join(location, "CORE", "index.md"), "utf-8");
    assert.match(index, /- \[checkout\]\(loja\/checkout\/checkout\.md\) \| in_production \| Checkout \| 2026-10-15/);
    assert.match(
      index,
      /- \[delivery-2026-10-15-task-123\.md\]\(loja\/checkout\/deliveries\/delivery-2026-10-15-task-123\.md\) \| TASK-123 \| 2026-10-15/
    );
    // o PRD foi publicado (decisions/), mas o índice continua listando só o que foi implementado
    assert.doesNotMatch(index, /prd-001-checkout/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFiles: resolve o destino de cada arquivo e publica tudo numa operação só", async () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-pub-"));
  try {
    const location = join(dir, "cd");
    mkdirSync(location);
    const storage = createFilesystemStorage({ location });
    const feature = join(dir, "feature-checkout.md");
    const delivery = join(dir, "delivery-2026-10-15-task-123.md");
    writeFileSync(feature, FEATURE);
    writeFileSync(delivery, DELIVERY);

    const r = await publishFiles({
      storage,
      squad: "CORE",
      produto: "loja",
      slug: "task-123",
      files: [
        { localFile: feature, tipo: "feature" },
        { localFile: delivery, tipo: "delivery", feature: "checkout" },
      ],
    });

    assert.equal(r.published.length, 2);
    assert.ok(existsSync(join(location, "CORE/loja/checkout/checkout.md")));
    assert.ok(
      existsSync(join(location, "CORE/loja/checkout/deliveries/delivery-2026-10-15-task-123.md"))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("publishFiles: sem storage ou sem arquivos lança erro antes de tocar no disco", async () => {
  await assert.rejects(() => publishFiles({ storage: null, files: [{}] }), /desligado/);
  await assert.rejects(
    () => publishFiles({ storage: {}, files: [] }),
    /Nenhum arquivo/
  );
});
