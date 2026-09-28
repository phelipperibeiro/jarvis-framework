/**
 * Parseia URL de repositório Git (GitLab, GitHub, Bitbucket, self-hosted).
 * Vendor: hostname, senão VERSION_CONTROL do ENV.
 */

const VENDORS = {
  gitlab: {
    detect: (host) => host.includes("gitlab"),
    apiBase: (origin, host) =>
      host === "gitlab.com" ? "https://gitlab.com/api/v4" : `${origin}/api/v4`,
  },
  github: {
    detect: (host) => host.includes("github"),
    apiBase: (origin, host) =>
      host === "github.com" ? "https://api.github.com" : `${origin}/api/v3`,
  },
  bitbucket: {
    detect: (host) => host.includes("bitbucket"),
    apiBase: () => "https://api.bitbucket.org/2.0",
  },
};

function normalizeGitUrl(url) {
  let raw = String(url).trim();
  const ssh = raw.match(/^git@([^:]+):(.+?)(\.git)?$/);
  if (ssh) {
    raw = `https://${ssh[1]}/${ssh[2].replace(/\.git$/, "")}`;
  }
  raw = raw.replace(/\.git$/, "");
  return raw;
}

function detectVendor(host) {
  const fromEnv = String(process.env.VERSION_CONTROL || "")
    .trim()
    .toLowerCase();
  for (const [vendor, spec] of Object.entries(VENDORS)) {
    if (spec.detect(host)) return vendor;
  }
  if (VENDORS[fromEnv]) return fromEnv;
  return null;
}

/**
 * @param {string} url
 * @returns {{
 *   vendor: 'gitlab'|'github'|'bitbucket',
 *   host: string,
 *   origin: string,
 *   projectPath: string,
 *   projectPathEncoded: string,
 *   owner: string,
 *   repo: string,
 *   apiBase: string,
 *   webBase: string,
 * }}
 */
export function parseRepoUrl(url) {
  if (!url || typeof url !== "string") {
    throw new Error("URL do repositório vazia ou inválida");
  }

  const normalized = normalizeGitUrl(url);
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(
      `URL inválida: ${url}\n` +
        "Formatos: https://github.com/org/repo.git | https://gitlab.com/grupo/repo.git | https://bitbucket.org/ws/repo.git",
    );
  }

  const host = parsed.hostname;
  const origin = parsed.origin;
  const projectPath = parsed.pathname.replace(/^\/+|\/+$/g, "");
  if (!projectPath) {
    throw new Error(`Project path vazio na URL: ${url}`);
  }

  const vendor = detectVendor(host);
  if (!vendor) {
    throw new Error(
      `Não foi possível detectar o vendor de ${host}.\n` +
        "Defina VERSION_CONTROL=gitlab|github|bitbucket no ENV.md.",
    );
  }

  const parts = projectPath.split("/");
  const repo = parts[parts.length - 1];
  const owner = parts.slice(0, -1).join("/");

  return {
    vendor,
    host,
    origin,
    projectPath,
    projectPathEncoded: encodeURIComponent(projectPath),
    owner,
    repo,
    apiBase: VENDORS[vendor].apiBase(origin, host),
    webBase: origin,
  };
}

/** @deprecated use parseRepoUrl */
export function parseGitLabUrl(url) {
  const parsed = parseRepoUrl(url);
  if (parsed.vendor !== "gitlab") {
    throw new Error(
      `URL não é GitLab (${parsed.vendor}): ${url}\n` +
        "Use parseRepoUrl() para GitHub/Bitbucket.",
    );
  }
  return parsed;
}

export function buildApiUrl(repoUrl, endpoint) {
  const { vendor, apiBase, projectPathEncoded, owner, repo } =
    parseRepoUrl(repoUrl);
  if (vendor === "gitlab") {
    return `${apiBase}/projects/${projectPathEncoded}/${endpoint}`;
  }
  if (vendor === "github") {
    return `${apiBase}/repos/${owner}/${repo}/${endpoint}`;
  }
  return `${apiBase}/repositories/${owner}/${repo}/${endpoint}`;
}

export function buildWebUrl(repoUrl, path) {
  const { webBase, projectPath, vendor } = parseRepoUrl(repoUrl);
  if (vendor === "gitlab") {
    return `${webBase}/${projectPath}/${path}`;
  }
  if (vendor === "github") {
    return `${webBase}/${projectPath}/${path}`;
  }
  return `${webBase}/${projectPath}/${path}`;
}

export function mergeRequestPath(vendor, iid) {
  if (vendor === "gitlab") return `-/merge_requests/${iid}`;
  if (vendor === "github") return `pull/${iid}`;
  return `pull-requests/${iid}`;
}
