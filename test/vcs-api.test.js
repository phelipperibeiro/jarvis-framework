// Testes dos adapters de Git host (vcs/api.js + git-parser.js). Rode com: npm run test:filtro
//
// fetchRawFile/createMergeRequest/createIssue/commitFiles fazem chamada de
// rede real via `fetch()` global — em vez de mockar módulo ou refatorar
// api.js para injetar um cliente HTTP, usa-se `mock.method` do `node:test`
// no `fetch` global, controlando a resposta por vendor. Zero mudança em
// api.js/git-parser.js.
//
// Toda chamada de rede passa primeiro por `getVcsToken()` (npmrc-parser.js),
// que lê GITLAB_TOKEN/.npmrc, GITHUB_TOKEN/GH_TOKEN/`gh auth token` ou
// BITBUCKET_TOKEN — nessa ordem de fallback, dependendo do que a máquina que
// roda o teste tiver configurado. Para o teste não depender do ambiente local
// (`.npmrc` do dev, `gh` autenticado ou não), cada teste de rede fixa o token
// explicitamente via env var antes de chamar a função.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  fetchRawFile,
  createMergeRequest,
  createIssue,
  cardUrl,
  parseRepoUrl,
  mergeRequestPath,
} from "../bin/lib/vcs/api.js";

function withEnv(vars, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ---------------------------------------------------------------------------
// parseRepoUrl / mergeRequestPath (git-parser.js, re-exportadas — puras)
// ---------------------------------------------------------------------------

test("parseRepoUrl: detecta gitlab.com e monta apiBase/projectPath", () => {
  const r = parseRepoUrl("https://gitlab.com/meu-grupo/meu-repo.git");
  assert.equal(r.vendor, "gitlab");
  assert.equal(r.apiBase, "https://gitlab.com/api/v4");
  assert.equal(r.projectPath, "meu-grupo/meu-repo");
  assert.equal(r.owner, "meu-grupo");
  assert.equal(r.repo, "meu-repo");
});

test("parseRepoUrl: detecta github.com", () => {
  const r = parseRepoUrl("https://github.com/org/repo");
  assert.equal(r.vendor, "github");
  assert.equal(r.apiBase, "https://api.github.com");
  assert.equal(r.owner, "org");
  assert.equal(r.repo, "repo");
});

test("parseRepoUrl: detecta bitbucket.org", () => {
  const r = parseRepoUrl("https://bitbucket.org/ws/repo.git");
  assert.equal(r.vendor, "bitbucket");
  assert.equal(r.apiBase, "https://api.bitbucket.org/2.0");
});

test("parseRepoUrl: normaliza URL SSH (git@host:owner/repo.git)", () => {
  const r = parseRepoUrl("git@github.com:org/repo.git");
  assert.equal(r.vendor, "github");
  assert.equal(r.owner, "org");
  assert.equal(r.repo, "repo");
});

test("parseRepoUrl: self-hosted sem 'gitlab'/'github'/'bitbucket' no host usa VERSION_CONTROL", () => {
  withEnv({ VERSION_CONTROL: "gitlab" }, () => {
    const r = parseRepoUrl("https://git.minhaempresa.com/grupo/repo");
    assert.equal(r.vendor, "gitlab");
    assert.equal(r.apiBase, "https://git.minhaempresa.com/api/v4");
  });
});

test("parseRepoUrl: self-hosted sem VERSION_CONTROL lança erro orientando a configurar", () => {
  withEnv({ VERSION_CONTROL: undefined }, () => {
    assert.throws(
      () => parseRepoUrl("https://git.minhaempresa.com/grupo/repo"),
      /VERSION_CONTROL=gitlab\|github\|bitbucket/
    );
  });
});

test("parseRepoUrl: URL vazia ou inválida lança erro", () => {
  assert.throws(() => parseRepoUrl(""), /vazia ou inválida/);
  assert.throws(() => parseRepoUrl("não é uma url"), /URL inválida/);
});

test("mergeRequestPath: path por vendor", () => {
  assert.equal(mergeRequestPath("gitlab", 7), "-/merge_requests/7");
  assert.equal(mergeRequestPath("github", 7), "pull/7");
  assert.equal(mergeRequestPath("bitbucket", 7), "pull-requests/7");
});

// ---------------------------------------------------------------------------
// cardUrl (api.js — pura)
// ---------------------------------------------------------------------------

test("cardUrl: um path por task manager", () => {
  const base = "https://empresa.atlassian.net";
  assert.equal(cardUrl("jira", base, "TASK-1"), `${base}/browse/TASK-1`);
  assert.equal(cardUrl("linear", base, "ENG-1"), `${base}/issue/ENG-1`);
  assert.equal(cardUrl("github", base, "#42"), `${base}/issues/42`);
  assert.equal(cardUrl("asana", base, "123"), `${base}/0/0/123`);
});

test("cardUrl: sem baseUrl retorna a própria card key", () => {
  assert.equal(cardUrl("jira", "", "TASK-1"), "TASK-1");
});

test("cardUrl: task manager desconhecido cai no formato jira (/browse/)", () => {
  assert.equal(cardUrl("notion", "https://x.com", "X-1"), "https://x.com/browse/X-1");
});

// ---------------------------------------------------------------------------
// fetchRawFile / createMergeRequest / createIssue — fetch mockado por vendor
// ---------------------------------------------------------------------------

test("fetchRawFile: monta a URL raw do GitLab e repassa o ref", async (t) => {
  t.after(() => mock.reset());
  let captured;
  mock.method(globalThis, "fetch", async (url) => {
    captured = String(url);
    return { status: 200, ok: true, text: async () => "conteúdo" };
  });

  const content = await withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
    fetchRawFile("https://gitlab.com/g/r", "docs/x.md", "main")
  );

  assert.equal(content, "conteúdo");
  assert.match(captured, /\/projects\/g%2Fr\/repository\/files\//);
  assert.match(captured, /ref=main$/);
});

test("fetchRawFile: GitHub usa o endpoint /contents e pede Accept raw", async (t) => {
  t.after(() => mock.reset());
  let seenHeaders;
  mock.method(globalThis, "fetch", async (url, init) => {
    seenHeaders = init.headers;
    return { status: 200, ok: true, text: async () => "conteúdo" };
  });

  await withEnv({ GITHUB_TOKEN: "fake-token" }, () =>
    fetchRawFile("https://github.com/o/r", "docs/x.md", "main")
  );

  assert.equal(seenHeaders.Accept, "application/vnd.github.raw");
});

test("fetchRawFile: 404 lança erro com err.code = 404", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({ status: 404, ok: false, text: async () => "" }));

  await withEnv({ GITHUB_TOKEN: "fake-token" }, () =>
    assert.rejects(
      () => fetchRawFile("https://github.com/o/r", "x.md"),
      (err) => {
        assert.equal(err.code, 404);
        return true;
      }
    )
  );
});

test("fetchRawFile: 401/403 lança erro de não autorizado com o status em err.code", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({ status: 401, ok: false, text: async () => "" }));

  await withEnv({ BITBUCKET_TOKEN: "fake-token" }, () =>
    assert.rejects(
      () => fetchRawFile("https://bitbucket.org/w/r", "x.md"),
      (err) => {
        assert.equal(err.code, 401);
        return true;
      }
    )
  );
});

test("createMergeRequest: GitLab — POST em merge_requests, retorna iid/url de web_url", async (t) => {
  t.after(() => mock.reset());
  let seen;
  mock.method(globalThis, "fetch", async (url, init) => {
    seen = { url: String(url), method: init.method, body: JSON.parse(init.body) };
    return {
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({ iid: 5, web_url: "https://gitlab.com/g/r/-/merge_requests/5" }),
    };
  });

  const result = await withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
    createMergeRequest("https://gitlab.com/g/r", {
      source: "feature",
      target: "main",
      title: "Minha MR",
    })
  );

  assert.equal(result.vendor, "gitlab");
  assert.equal(result.iid, 5);
  assert.equal(result.url, "https://gitlab.com/g/r/-/merge_requests/5");
  assert.equal(seen.method, "POST");
  assert.match(seen.url, /\/merge_requests$/);
  assert.equal(seen.body.source_branch, "feature");
  assert.equal(seen.body.target_branch, "main");
});

test("createMergeRequest: GitHub — POST em pulls (head/base), retorna iid=number/url=html_url", async (t) => {
  t.after(() => mock.reset());
  let seen;
  mock.method(globalThis, "fetch", async (url, init) => {
    seen = { url: String(url), body: JSON.parse(init.body) };
    return {
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ number: 9, html_url: "https://github.com/o/r/pull/9" }),
    };
  });

  const result = await withEnv({ GITHUB_TOKEN: "fake-token" }, () =>
    createMergeRequest("https://github.com/o/r", {
      source: "feature",
      target: "main",
      title: "Minha PR",
    })
  );

  assert.equal(result.vendor, "github");
  assert.equal(result.iid, 9);
  assert.match(seen.url, /\/pulls$/);
  assert.equal(seen.body.head, "feature");
  assert.equal(seen.body.base, "main");
});

test("createMergeRequest: resposta sem web_url/html_url lança erro com o status", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 422,
    text: async () => JSON.stringify({ message: "branch inválida" }),
  }));

  await withEnv({ GITLAB_TOKEN: "fake-token" }, () =>
    assert.rejects(
      () => createMergeRequest("https://gitlab.com/g/r", { source: "a", target: "b", title: "t" }),
      /Falha ao criar MR GitLab \(422\)/
    )
  );
});

test("createIssue: Bitbucket — POST em issues, retorna iid/url de links.html.href", async (t) => {
  t.after(() => mock.reset());
  mock.method(globalThis, "fetch", async () => ({
    ok: true,
    status: 201,
    text: async () =>
      JSON.stringify({ id: 3, links: { html: { href: "https://bitbucket.org/w/r/issues/3" } } }),
  }));

  const result = await withEnv({ BITBUCKET_TOKEN: "fake-token" }, () =>
    createIssue("https://bitbucket.org/w/r", { title: "Bug", body: "desc" })
  );

  assert.equal(result.vendor, "bitbucket");
  assert.equal(result.iid, 3);
  assert.equal(result.url, "https://bitbucket.org/w/r/issues/3");
});
