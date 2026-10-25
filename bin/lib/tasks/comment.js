import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cardUrl } from "../vcs/api.js";
import { EXIT, accessValue, getVendor, runAction } from "../integrations/cli-runner.js";

function env(name) {
  return String(process.env[name] || "").trim();
}

/**
 * TASK_MANAGER vazio, ausente ou ainda com a lista de exemplo do template (`[jira, github, gitlab]`,
 * ou a antiga `[jira, linear, github, asana]`) = sem board (freelance).
 */
export function isFreelance(taskManager) {
  const tm = String(taskManager || "").trim();
  return !tm || /^\[.*\]$/.test(tm);
}

/**
 * Repositório do card a partir do TASK_MANAGER_URL_BASE (github/gitlab).
 * `https://github.com/dono/repo` → { repo: "github.com/dono/repo", repo_url: "https://github.com/dono/repo" }
 */
export function boardRepo(baseUrl) {
  const raw = String(baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path.includes("/")) return null;
    return { repo: `${u.host}/${path}`, repo_url: `${u.origin}/${path}` };
  } catch {
    return null;
  }
}

/**
 * Comenta num card pela CLI do vendor de TASK_MANAGER (gh, glab ou acli), sem token no Jarvis.
 * Devolve o código de saída e as mensagens, sem encerrar o processo (o `runComment` encerra).
 * @param {string} cardKey - Chave do card (`TASK-123`, ou número/`#42` no GitHub e no GitLab)
 * @param {string} message - Texto do comentário (markdown; no Jira vai como texto simples)
 * @param {{ exec?: Function }} [deps]
 * @returns {Promise<{ code: number, out: string[], err: string[] }>}
 */
export async function commentOnCard(cardKey, message, deps = {}) {
  const out = [];
  const err = [];
  const tm = env("TASK_MANAGER").toLowerCase();

  if (isFreelance(tm)) {
    out.push("ℹ️ TASK_MANAGER vazio (freelance): nada foi enviado ao board.");
    return { code: EXIT.OK, out, err };
  }
  if (!getVendor(tm)) {
    err.push(
      `⚠️ ${tm} não é suportado (vendors: jira, github, gitlab). O eixo fica em freelance: gere o .md.`
    );
    return { code: EXIT.UNAVAILABLE, out, err };
  }

  const access = accessValue("TASK_MANAGER_ACCESS");
  if (access === "manual") {
    err.push("ℹ️ TASK_MANAGER_ACCESS=manual: nada foi enviado; gere o .md do comentário.");
    return { code: EXIT.UNAVAILABLE, out, err };
  }
  if (!access) {
    err.push(
      "ℹ️ TASK_MANAGER_ACCESS vazio: tentando a CLI. Rode o /jarvis-init para confirmar o acesso."
    );
  }

  const base = env("TASK_MANAGER_URL_BASE");
  const key = String(cardKey || "").replace(/^#/, "");
  // GitHub e GitLab identificam o card pelo número; o Jira, pela key (ABC-123).
  if (tm !== "jira" && !/^\d+$/.test(key)) {
    err.push(
      `⚠️ ${tm}: o card é o número da issue (ex.: 42 ou #42), não "${cardKey}". Nada foi enviado.`
    );
    return { code: EXIT.USAGE, out, err };
  }
  const params = { key, body: message };
  if (tm !== "jira") {
    const repo = boardRepo(base);
    if (!repo) {
      err.push(
        `⚠️ ${tm}: defina TASK_MANAGER_URL_BASE com o endereço do repositório dos cards ` +
          "(ex.: https://github.com/empresa/projeto). Nada foi enviado."
      );
      return { code: EXIT.UNAVAILABLE, out, err };
    }
    Object.assign(params, repo);
  }

  const result = await runAction(tm, "comment", params, deps);
  if (result.ok) {
    out.push(`💬 Comentário adicionado em ${cardKey} (${tm})`);
    const url = cardUrl(tm, base, cardKey);
    if (url !== cardKey) out.push(`   ${url}`);
    return { code: EXIT.OK, out, err };
  }
  if (result.code === EXIT.USAGE) {
    err.push(`⚠️ ${result.reason}. Nada foi enviado.`);
    return { code: EXIT.USAGE, out, err };
  }
  if (result.sent) {
    err.push(
      `⚠️ Erro depois de enviar o comentário em ${cardKey} (${result.reason}). ` +
        "Ele pode ter sido publicado: confira no card antes de repetir."
    );
    if (result.stderr?.trim()) err.push(result.stderr.trim());
    return { code: EXIT.SENT_WITH_ERROR, out, err };
  }
  err.push(`⚠️ Não foi possível comentar no card ${cardKey}: ${result.reason}. Nada foi enviado.`);
  return { code: EXIT.UNAVAILABLE, out, err };
}

/**
 * `jarvis tasks comment`. Usada pelo skill `eng-global-task-comment`.
 * Saída: 0 ok (ou freelance) · 1 uso · 3 indisponível (nada enviado) · 4 enviado com erro.
 * @param {string} cardKey
 * @param {string} message
 * @param {{ bodyFile?: string }} [options] - `bodyFile`: lê o texto de um arquivo
 */
export async function runComment(cardKey, message, { bodyFile } = {}, deps = {}) {
  if (bodyFile && !existsSync(bodyFile)) {
    console.error(`⚠️ Arquivo do comentário não encontrado: ${bodyFile}. Nada foi enviado.`);
    process.exit(EXIT.USAGE);
  }
  const text = bodyFile ? readFileSync(bodyFile, "utf-8") : message;
  if (!cardKey || !text) {
    console.error("Uso: jarvis tasks comment <TASK_MANAGER_KEY> <mensagem> | --body-file <path>");
    process.exit(EXIT.USAGE);
  }
  const { code, out, err } = await commentOnCard(cardKey, text, deps);
  for (const line of out) console.log(line);
  for (const line of err) console.error(line);
  process.exit(code);
}

// Compatibilidade: continua funcionando como `node bin/lib/tasks/comment.js <key> <mensagem>`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runComment(process.argv[2], process.argv.slice(3).join(" "));
}
