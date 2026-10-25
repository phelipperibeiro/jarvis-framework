// Adapters de Git host (GitHub, GitLab) pela CLI oficial do vendor (FRD-006): `gh` e `glab`,
// com o login delas. O Jarvis não guarda nem lê token. Bitbucket não é suportado.
import { parseRepoUrl, mergeRequestPath, newMergeRequestUrl } from "../utils/git-parser.js";
import { EXIT, firstUrl, runAction } from "../integrations/cli-runner.js";

/** Parâmetros de repositório que o catálogo usa: {repo} = host/caminho; {repo_url} = URL web. */
export function repoParams(repoUrl) {
  const repo = parseRepoUrl(repoUrl);
  return {
    parsed: repo,
    params: {
      repo: `${repo.host}/${repo.projectPath}`,
      repo_url: `${repo.origin}/${repo.projectPath}`,
    },
  };
}

/**
 * Erro de integração com o que a cadeia precisa: `exitCode` (3 indisponível, 4 enviado com erro)
 * e `sent` (se a chamada de escrita chegou a começar).
 */
function integrationError(what, result) {
  const detail = [result.reason, result.stderr?.trim()].filter(Boolean).join(": ");
  const err = new Error(`${what}: ${detail || "falha na CLI"}`);
  err.exitCode = result.code;
  err.sent = result.sent;
  return err;
}

function lastNumber(url) {
  const m = String(url || "").match(/(\d+)(?:\D*)$/);
  return m ? Number(m[1]) : null;
}

/**
 * Abre um MR/PR pela CLI do vendor do repositório.
 * @param {string} repoUrl
 * @param {{ source: string, target: string, title: string, description?: string }} opts
 * @param {{ exec?: Function }} [deps] - `exec` injetável (testes)
 * @returns {Promise<{ vendor: string, iid: number|null, url: string|null }>}
 */
export async function createMergeRequest(repoUrl, opts, deps = {}) {
  const { source, target, title, description = "" } = opts;
  const { parsed, params } = repoParams(repoUrl);
  const noun = parsed.vendor === "gitlab" ? "MR" : "PR";
  const result = await runAction(
    parsed.vendor,
    "create_merge",
    { ...params, source, target, title, body: description },
    deps
  );
  if (!result.ok) throw integrationError(`Falha ao criar ${noun} ${parsed.vendor}`, result);
  const url = firstUrl(result.stdout);
  return { vendor: parsed.vendor, iid: lastNumber(url), url };
}

/**
 * Abre uma issue pela CLI do vendor do repositório.
 * @param {string} repoUrl
 * @param {{ title: string, body: string, labels?: string[] }} opts - `labels` padrão: ["bug"]
 * @param {{ exec?: Function }} [deps]
 * @returns {Promise<{ vendor: string, iid: number|null, url: string|null }>}
 */
export async function createIssue(repoUrl, opts, deps = {}) {
  const { title, body, labels = ["bug"] } = opts;
  const { parsed, params } = repoParams(repoUrl);
  const result = await runAction(
    parsed.vendor,
    "create_issue",
    { ...params, title, body, labels: labels.join(",") },
    deps
  );
  if (!result.ok) throw integrationError(`Issue ${parsed.vendor}`, result);
  const url = firstUrl(result.stdout);
  return { vendor: parsed.vendor, iid: lastNumber(url), url };
}

/**
 * Link do card no board. Sem `baseUrl`, devolve a própria key.
 * jira → /browse/KEY · github → /issues/N · gitlab → /-/issues/N
 */
export function cardUrl(taskManager, baseUrl, cardKey) {
  const tm = String(taskManager || "").toLowerCase();
  const base = String(baseUrl || "").replace(/\/$/, "");
  if (!base) return cardKey;
  const number = String(cardKey).replace(/^#/, "");
  if (tm === "github") return `${base}/issues/${number}`;
  if (tm === "gitlab") return `${base}/-/issues/${number}`;
  return `${base}/browse/${cardKey}`;
}

export { EXIT, parseRepoUrl, mergeRequestPath, newMergeRequestUrl };
