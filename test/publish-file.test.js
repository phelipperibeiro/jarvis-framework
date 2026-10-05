// Testes de publishFile/resolveDestPath/insertIndexLine (publish-file.js).
// Rode com: npm run test:filtro
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { publishFile, resolveDestPath, insertIndexLine } from "../bin/lib/docs/publish-file.js";

// `await fn()` (não `return fn()`) é essencial aqui: o `finally` só pode
// restaurar o env var depois que a promise resolver — senão, numa função com
// mais de um `await` antes de ler a env var (ex: publishFile busca o index.md
// antes de chegar no commit, que é onde o token é lido), o valor já teria
// sido desfeito antes da leitura real acontecer.
async function withEnv(vars, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function withTempFile(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-publish-file-"));
  const file = join(dir, "doc.md");
  writeFileSync(file, content, "utf-8");
  try {
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ardFrontmatter = (overrides = "") =>
  [
    "---",
    "Status: Em validação",
    "Data: 2026-01-01",
    "Autor: Dev",
    "Versão: 1.0.0",
    overrides,
    "---",
    "# Corpo do documento",
  ]
    .filter(Boolean)
    .join("\n");

// ---------------------------------------------------------------------------
// resolveDestPath
// ---------------------------------------------------------------------------

test("resolveDestPath: prd/frd vão para product/, ard/rfc para engineering/", () => {
  const base = { squad: "core", workspace: "ws", feature: "minha-feature", localFile: "x.md" };
  assert.equal(
    resolveDestPath({ ...base, tipo: "prd" }).destPath,
    "core/ws/product/prd-minha-feature.md"
  );
  assert.equal(resolveDestPath({ ...base, tipo: "prd" }).area, "product");
  assert.equal(
    resolveDestPath({ ...base, tipo: "ard" }).destPath,
    "core/ws/engineering/ARD/ard-minha-feature.md"
  );
  assert.equal(resolveDestPath({ ...base, tipo: "ard" }).area, "engineering");
  assert.equal(
    resolveDestPath({ ...base, tipo: "rfc" }).destPath,
    "core/ws/engineering/RFC/rfc-minha-feature.md"
  );
  assert.equal(
    resolveDestPath({ ...base, tipo: "qa-report" }).destPath,
    "core/ws/engineering/qa/qa-report-minha-feature.md"
  );
});

test("resolveDestPath: swagger detecta extensão do arquivo local (yaml/json/default .md)", () => {
  const base = { squad: "core", workspace: "ws", feature: "api-x", tipo: "swagger" };
  assert.equal(
    resolveDestPath({ ...base, localFile: "./openapi.yaml" }).destPath,
    "core/ws/engineering/swagger/api-api-x.yaml"
  );
  assert.equal(
    resolveDestPath({ ...base, localFile: "./openapi.json" }).destPath,
    "core/ws/engineering/swagger/api-api-x.json"
  );
  assert.equal(
    resolveDestPath({ ...base, localFile: "./openapi-notes.md" }).destPath,
    "core/ws/engineering/swagger/swagger-api-x.md"
  );
});

test("resolveDestPath: tipo inválido lança erro listando os tipos válidos", () => {
  assert.throws(
    () => resolveDestPath({ tipo: "invalido", squad: "s", workspace: "w", feature: "f" }),
    /Tipo inválido: invalido.*Tipos válidos/s
  );
});

// ---------------------------------------------------------------------------
// insertIndexLine — a correção do bug do AWK (ver architecture.md, 3.4)
// ---------------------------------------------------------------------------

test("insertIndexLine: seção com entrada colada no header não perde a entrada existente", () => {
  const index = ["# ws", "", "## engineering", "- [ard-existing.md](...)", "", "## product"].join(
    "\n"
  );
  const { content, found } = insertIndexLine(index, "engineering", "- [ard-novo.md](...)");
  assert.equal(found, true);
  assert.match(content, /## engineering\n- \[ard-novo\.md\]\(\.\.\.\)\n- \[ard-existing\.md\]/);
  assert.match(content, /ard-existing\.md/); // nunca pode desaparecer
});

test("insertIndexLine: seção com linha em branco após o header também funciona", () => {
  const index = ["# ws", "", "## engineering", "", "- [ard-existing.md](...)"].join("\n");
  const { content } = insertIndexLine(index, "engineering", "- [ard-novo.md](...)");
  assert.match(content, /ard-existing\.md/);
  assert.match(content, /ard-novo\.md/);
});

test("insertIndexLine: seção inexistente é criada no final, sem perder o resto", () => {
  const index = "# ws\n\n**Squad:** core\n";
  const { content, found } = insertIndexLine(index, "product", "- [prd-novo.md](...)");
  assert.equal(found, false);
  assert.match(content, /\*\*Squad:\*\* core/);
  assert.match(content, /## product\n- \[prd-novo\.md\]/);
});

// ---------------------------------------------------------------------------
// publishFile — fim a fim, fetch/redis mockados
// ---------------------------------------------------------------------------

test("publishFile: sem repo lança erro antes de qualquer chamada de rede", async () => {
  await withTempFile(ardFrontmatter(), (file) =>
    assert.rejects(
      () =>
        publishFile({ localFile: file, tipo: "ard", feature: "x", squad: "core", workspace: "ws" }),
      /CENTRAL_DOCS_REPO não configurado/
    )
  );
});

test("publishFile: frontmatter inválido lança erro antes de qualquer chamada de rede", async (t) => {
  t.after(() => mock.reset());
  let fetchCalled = false;
  mock.method(globalThis, "fetch", async () => {
    fetchCalled = true;
    throw new Error("não deveria ter chamado fetch");
  });

  await withTempFile("# Documento sem frontmatter", (file) =>
    withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
      assert.rejects(
        () =>
          publishFile({
            localFile: file,
            tipo: "ard",
            feature: "x",
            squad: "core",
            workspace: "ws",
            repo: "https://gitlab.com/g/r",
          }),
        /Frontmatter YAML não encontrado/
      )
    )
  );

  assert.equal(fetchCalled, false);
});

test("publishFile: caminho feliz GitLab — valida, cria index novo, comita e abre MR", async (t) => {
  t.after(() => mock.reset());
  const calls = [];
  mock.method(globalThis, "fetch", async (url, init) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("/repository/files/")) {
      // fetchFile do index.md -- simula "não encontrado" (índice ainda não existe)
      return { status: 404, ok: false, text: async () => "" };
    }
    if (u.endsWith("/repository/commits")) {
      return { status: 201, ok: true, text: async () => JSON.stringify({ id: "abc123" }) };
    }
    if (u.endsWith("/merge_requests")) {
      const body = JSON.parse(init.body);
      assert.equal(body.source_branch, `docs/core/ws/ard-${feature}`);
      assert.equal(body.target_branch, "dev");
      return {
        status: 201,
        ok: true,
        text: async () =>
          JSON.stringify({ iid: 7, web_url: "https://gitlab.com/g/r/-/merge_requests/7" }),
      };
    }
    throw new Error(`URL inesperada no teste: ${u}`);
  });

  const feature = `feature-${randomUUID()}`;

  const result = await withTempFile(ardFrontmatter(), (file) =>
    withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
      publishFile({
        localFile: file,
        tipo: "ard",
        feature,
        squad: "core",
        workspace: "ws",
        repo: "https://gitlab.com/g/r",
        targetBranch: "dev",
      })
    )
  );

  assert.equal(result.sha, "abc123");
  assert.equal(result.mr.iid, 7);
  assert.equal(result.mr.url, "https://gitlab.com/g/r/-/merge_requests/7");
  assert.ok(calls.some((u) => u.includes("/repository/files/")));
  assert.ok(calls.some((u) => u.endsWith("/repository/commits")));
  assert.ok(calls.some((u) => u.endsWith("/merge_requests")));
});

test("publishFile: index.md existente é atualizado (action=update), preservando o conteúdo anterior", async (t) => {
  t.after(() => mock.reset());
  const existingIndex = "# ws\n\n## engineering\n- [ard-outro.md](engineering/ard-outro.md)\n";
  let commitBody;
  mock.method(globalThis, "fetch", async (url, init) => {
    const u = String(url);
    if (u.includes("/repository/files/")) {
      return { status: 200, ok: true, text: async () => existingIndex };
    }
    if (u.endsWith("/repository/commits")) {
      commitBody = JSON.parse(init.body);
      return { status: 201, ok: true, text: async () => JSON.stringify({ id: "def456" }) };
    }
    if (u.endsWith("/merge_requests")) {
      return {
        status: 201,
        ok: true,
        text: async () =>
          JSON.stringify({ iid: 8, web_url: "https://gitlab.com/g/r/-/merge_requests/8" }),
      };
    }
    throw new Error(`URL inesperada: ${u}`);
  });

  await withTempFile(ardFrontmatter(), (file) =>
    withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
      publishFile({
        localFile: file,
        tipo: "ard",
        feature: `f-${randomUUID()}`,
        squad: "core",
        workspace: "ws",
        repo: "https://gitlab.com/g/r",
      })
    )
  );

  const indexAction = commitBody.actions.find((a) => a.file_path.endsWith("index.md"));
  assert.equal(indexAction.action, "update");
  const decoded = Buffer.from(indexAction.content, "base64").toString("utf-8");
  assert.match(decoded, /ard-outro\.md/); // entrada anterior preservada
});
