/**
 * Parseia URL de repositório Git (GitHub, GitLab, self-hosted).
 * Vendor: hostname, senão VERSION_CONTROL do ENV. Bitbucket não é suportado (FRD-006).
 */

const VENDORS = {
  gitlab: { detect: (host) => host.includes("gitlab") },
  github: { detect: (host) => host.includes("github") },
};

function normalizeGitUrl(url) {
  let raw = String(url).trim();
  // ssh://[user@]host[:porta]/caminho → https://host/caminho (a porta do SSH não é a do site)
  const sshUrl = raw.match(/^ssh:\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+)$/);
  if (sshUrl) raw = `https://${sshUrl[1]}/${sshUrl[2]}`;
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
 *   vendor: 'gitlab'|'github',
 *   host: string,
 *   origin: string,
 *   projectPath: string,
 *   projectPathEncoded: string,
 *   owner: string,
 *   repo: string,
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
        "Formatos: https://github.com/org/repo.git | https://gitlab.com/grupo/repo.git"
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
        "Defina VERSION_CONTROL=github|gitlab no ENV.md (Bitbucket não é suportado)."
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
    webBase: origin,
  };
}

export function buildWebUrl(repoUrl, path) {
  const { webBase, projectPath } = parseRepoUrl(repoUrl);
  return `${webBase}/${projectPath}/${path}`;
}

export function mergeRequestPath(vendor, iid) {
  if (vendor === "gitlab") return `-/merge_requests/${iid}`;
  return `pull/${iid}`;
}

/**
 * Link para abrir um MR/PR à mão (quando a CLI não está disponível).
 * @param {string} repoUrl
 * @param {string} source - branch de origem
 * @param {string} [target] - branch de destino
 */
export function newMergeRequestUrl(repoUrl, source, target) {
  const { vendor, webBase, projectPath } = parseRepoUrl(repoUrl);
  if (vendor === "gitlab") {
    const q =
      `merge_request[source_branch]=${encodeURIComponent(source)}` +
      (target ? `&merge_request[target_branch]=${encodeURIComponent(target)}` : "");
    return `${webBase}/${projectPath}/-/merge_requests/new?${q}`;
  }
  const range = target
    ? `${encodeURIComponent(target)}...${encodeURIComponent(source)}`
    : encodeURIComponent(source);
  return `${webBase}/${projectPath}/compare/${range}?expand=1`;
}
