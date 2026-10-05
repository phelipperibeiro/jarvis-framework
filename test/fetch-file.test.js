// Testes de fetchFile (fetch-file.js). Rode com: npm run test:filtro
//
// Usa caminhos de arquivo aleatórios por teste (randomUUID) para a chave de
// cache do Redis nunca colidir entre execuções — `redis-cli` pode estar
// instalado e com um servidor real acessível na máquina que roda o teste
// (não dá pra mockar `execFileSync` de `node:child_process`, é um módulo
// nativo não configurável), então a única forma de garantir isolamento é
// nunca reusar uma chave.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fetchFile } from "../bin/lib/docs/fetch-file.js";

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

test("fetchFile: sem file-path lança erro", async () => {
  await assert.rejects(() => fetchFile(""), /file-path é obrigatório/);
});

test("fetchFile: sem repo (nem opts.repo, nem CENTRAL_DOCS_REPO) lança erro", async () => {
  await withEnv({ CENTRAL_DOCS_REPO: undefined }, () =>
    assert.rejects(() => fetchFile(`docs/${randomUUID()}.md`), /CENTRAL_DOCS_REPO não definido/)
  );
});

test("fetchFile: busca via fetchRawFile (fetch mockado) e retorna o conteúdo", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({
    status: 200,
    ok: true,
    text: async () => "# Conteúdo do doc",
  }));

  const content = await withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
    fetchFile(`docs/${randomUUID()}.md`, "main", { repo: "https://gitlab.com/g/r" })
  );

  assert.equal(content, "# Conteúdo do doc");
});

test("fetchFile: opts.repo tem prioridade sobre CENTRAL_DOCS_REPO do ambiente", async (t) => {
  t.after(() => mock.reset());
  let seenUrl;
  mock.method(globalThis, "fetch", async (url) => {
    seenUrl = String(url);
    return { status: 200, ok: true, text: async () => "x" };
  });

  await withEnv(
    { GITLAB_TOKEN: "fake-token", CENTRAL_DOCS_REPO: "https://gitlab.com/outro/repo" },
    () => fetchFile(`docs/${randomUUID()}.md`, "main", { repo: "https://gitlab.com/g/r" })
  );

  assert.match(seenUrl, /\/projects\/g%2Fr\//);
});

test("fetchFile: propaga erro 404 do adapter (err.code = 404)", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({ status: 404, ok: false, text: async () => "" }));

  await withEnv({ GITHUB_TOKEN: "fake-token" }, () =>
    assert.rejects(
      () => fetchFile(`docs/${randomUUID()}.md`, "main", { repo: "https://github.com/o/r" }),
      (err) => {
        assert.equal(err.code, 404);
        return true;
      }
    )
  );
});
