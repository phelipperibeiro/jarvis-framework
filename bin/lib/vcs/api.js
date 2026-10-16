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
      }
    );
    if (!ok || !json?.web_url) {
      throw new Error(`Falha ao criar MR GitLab (${status}): ${JSON.stringify(json)}`);
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
      }
    );
    if (!ok || !json?.html_url) {
      throw new Error(`Falha ao criar PR GitHub (${status}): ${JSON.stringify(json)}`);
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
    }
  );
  if (!ok || !json?.links?.html?.href) {
    throw new Error(`Falha ao criar PR Bitbucket (${status}): ${JSON.stringify(json)}`);
  }
  return {
    vendor: "bitbucket",
    iid: json.id,
    url: json.links.html.href,
  };
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
      }
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
      }
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
    }
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
