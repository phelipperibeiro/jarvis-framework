import { parseRepoUrl, mergeRequestPath } from "../utils/git-parser.js";
import { getVcsToken } from "../utils/npmrc-parser.js";

function authHeaders(vendor, token) {
  if (vendor === "gitlab") {
    return { "PRIVATE-TOKEN": token };
  }
  if (vendor === "github") {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

async function request(url, { method = "GET", headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json, text };
}

export async function fetchRawFile(repoUrl, filePath, ref = "main") {
  const repo = parseRepoUrl(repoUrl);
  const token = getVcsToken(repo.vendor);
  const headers = authHeaders(repo.vendor, token);
  const encodedPath = encodeURIComponent(filePath);

  let url;
  if (repo.vendor === "gitlab") {
    url = `${repo.apiBase}/projects/${repo.projectPathEncoded}/repository/files/${encodedPath}/raw?ref=${encodeURIComponent(ref)}`;
  } else if (repo.vendor === "github") {
    url = `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`;
    headers.Accept = "application/vnd.github.raw";
  } else {
    url = `${repo.apiBase}/repositories/${repo.owner}/${repo.repo}/src/${encodeURIComponent(ref)}/${filePath}`;
  }

  const res = await fetch(url, { headers });
  if (res.status === 404) {
    const err = new Error(`not_found:${filePath}`);
    err.code = 404;
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    const err = new Error(`unauthorized:${repo.vendor}`);
    err.code = res.status;
    throw err;
  }
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status}: ${await res.text()}`);
  }
  return await res.text();
}

export async function createMergeRequest(repoUrl, opts) {
  const { source, target, title, description = "" } = opts;
  const repo = parseRepoUrl(repoUrl);
  const token = getVcsToken(repo.vendor);
  const headers = authHeaders(repo.vendor, token);

  if (repo.vendor === "gitlab") {
    const { ok, status, json } = await request(
      `${repo.apiBase}/projects/${repo.projectPathEncoded}/merge_requests`,
      {
        method: "POST",
        headers,
        body: {
          source_branch: source,
          target_branch: target,
          title,
          description,
          remove_source_branch: true,
        },
      },
    );
    if (!ok || !json?.web_url) {
      throw new Error(
        `Falha ao criar MR GitLab (${status}): ${JSON.stringify(json)}`,
      );
    }
    return { vendor: "gitlab", iid: json.iid, url: json.web_url };
  }

  if (repo.vendor === "github") {
    const { ok, status, json } = await request(
      `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/pulls`,
      {
        method: "POST",
        headers,
        body: {
          title,
          head: source,
          base: target,
          body: description,
        },
      },
    );
    if (!ok || !json?.html_url) {
      throw new Error(
        `Falha ao criar PR GitHub (${status}): ${JSON.stringify(json)}`,
      );
    }
    return { vendor: "github", iid: json.number, url: json.html_url };
  }

  const { ok, status, json } = await request(
    `${repo.apiBase}/repositories/${repo.owner}/${repo.repo}/pullrequests`,
    {
      method: "POST",
      headers,
      body: {
        title,
        description,
        source: { branch: { name: source } },
        destination: { branch: { name: target } },
        close_source_branch: true,
      },
    },
  );
  if (!ok || !json?.links?.html?.href) {
    throw new Error(
      `Falha ao criar PR Bitbucket (${status}): ${JSON.stringify(json)}`,
    );
  }
  return {
    vendor: "bitbucket",
    iid: json.id,
    url: json.links.html.href,
  };
}

/**
 * Commit de um ou mais arquivos numa branch nova (docs publish).
 * files: [{ path, contentBase64, action: 'create'|'update' }]
 */
export async function commitFiles(repoUrl, opts) {
  const { branch, startBranch, message, files } = opts;
  const repo = parseRepoUrl(repoUrl);
  const token = getVcsToken(repo.vendor);
  const headers = authHeaders(repo.vendor, token);

  if (repo.vendor === "gitlab") {
    const { ok, status, json } = await request(
      `${repo.apiBase}/projects/${repo.projectPathEncoded}/repository/commits`,
      {
        method: "POST",
        headers,
        body: {
          branch,
          start_branch: startBranch,
          commit_message: message,
          actions: files.map((f) => ({
            action: f.action || "create",
            file_path: f.path,
            content: f.contentBase64,
            encoding: "base64",
          })),
        },
      },
    );
    if (!ok || !json?.id) {
      throw new Error(
        `Falha no commit GitLab (${status}): ${JSON.stringify(json)}`,
      );
    }
    return { sha: json.id };
  }

  if (repo.vendor === "github") {
    const refRes = await request(
      `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/git/ref/heads/${startBranch}`,
      { headers },
    );
    if (!refRes.ok) {
      throw new Error(
        `Branch ${startBranch} não encontrada no GitHub (${refRes.status})`,
      );
    }
    const sha = refRes.json.object.sha;
    await request(
      `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/git/refs`,
      {
        method: "POST",
        headers,
        body: { ref: `refs/heads/${branch}`, sha },
      },
    );
    let lastSha = sha;
    for (const file of files) {
      const put = await request(
        `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/contents/${file.path}`,
        {
          method: "PUT",
          headers,
          body: {
            message,
            content: file.contentBase64,
            branch,
          },
        },
      );
      if (!put.ok) {
        throw new Error(
          `Falha ao escrever ${file.path} no GitHub (${put.status}): ${JSON.stringify(put.json)}`,
        );
      }
      lastSha = put.json.commit?.sha || lastSha;
    }
    return { sha: lastSha };
  }

  const form = new FormData();
  form.set("branch", branch);
  form.set("parents", startBranch);
  form.set("message", message);
  for (const file of files) {
    const buf = Buffer.from(file.contentBase64, "base64");
    form.set(file.path, new Blob([buf]));
  }
  const res = await fetch(
    `${repo.apiBase}/repositories/${repo.owner}/${repo.repo}/src`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  if (!res.ok) {
    throw new Error(`Falha no commit Bitbucket (${res.status}): ${await res.text()}`);
  }
  return { sha: "ok" };
}

export async function createIssue(repoUrl, opts) {
  const { title, body, labels = ["bug"] } = opts;
  const repo = parseRepoUrl(repoUrl);
  const token = getVcsToken(repo.vendor);
  const headers = authHeaders(repo.vendor, token);

  if (repo.vendor === "gitlab") {
    const { ok, status, json } = await request(
      `${repo.apiBase}/projects/${repo.projectPathEncoded}/issues`,
      {
        method: "POST",
        headers,
        body: { title, description: body, labels: labels.join(",") },
      },
    );
    if (!ok || !json?.web_url) {
      throw new Error(`Issue GitLab (${status}): ${JSON.stringify(json)}`);
    }
    return { vendor: "gitlab", iid: json.iid, url: json.web_url };
  }

  if (repo.vendor === "github") {
    const { ok, status, json } = await request(
      `${repo.apiBase}/repos/${repo.owner}/${repo.repo}/issues`,
      {
        method: "POST",
        headers,
        body: { title, body, labels },
      },
    );
    if (!ok || !json?.html_url) {
      throw new Error(`Issue GitHub (${status}): ${JSON.stringify(json)}`);
    }
    return { vendor: "github", iid: json.number, url: json.html_url };
  }

  const { ok, status, json } = await request(
    `${repo.apiBase}/repositories/${repo.owner}/${repo.repo}/issues`,
    {
      method: "POST",
      headers,
      body: { title, content: { raw: body } },
    },
  );
  if (!ok || !json?.links?.html?.href) {
    throw new Error(`Issue Bitbucket (${status}): ${JSON.stringify(json)}`);
  }
  return { vendor: "bitbucket", iid: json.id, url: json.links.html.href };
}

export function cardUrl(taskManager, baseUrl, cardKey) {
  const tm = String(taskManager || "jira").toLowerCase();
  const base = String(baseUrl || "").replace(/\/$/, "");
  if (!base) return cardKey;
  if (tm === "linear") return `${base}/issue/${cardKey}`;
  if (tm === "github") return `${base}/issues/${cardKey.replace(/^#/, "")}`;
  if (tm === "asana") return `${base}/0/0/${cardKey}`;
  return `${base}/browse/${cardKey}`;
}

export { parseRepoUrl, mergeRequestPath, getVcsToken };
