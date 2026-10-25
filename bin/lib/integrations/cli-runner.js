// Runner das CLIs oficiais dos vendors (FRD-006: gh, glab, acli), dirigido pelo catálogo
// `vendors.json`. Usado por `jarvis tasks comment`, `jarvis vcs create-merge`,
// `jarvis vcs create-issue`, pelo Central docs e pela descoberta do init/upgrade.
//
// Todo comando externo usa `execFile` com lista de argumentos (sem shell). O Jarvis nunca
// lê, guarda nem mostra token: o login é o da CLI do vendor.
//
// Separa os dois tipos de falha da cadeia de execução (eng.integrations-rules.md):
// - indisponível: falhou ANTES de enviar (CLI ausente, login inválido) → `sent: false`;
// - enviado com erro: falhou DEPOIS de iniciar a chamada de escrita (inclusive timeout) → `sent: true`.
import { execFile } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, resolveEnvPath } from "../env-loader.js";

/** Códigos de saída dos comandos de integração (lidos pela regra e pelos skills). */
export const EXIT = { OK: 0, USAGE: 1, UNAVAILABLE: 3, SENT_WITH_ERROR: 4 };

const CATALOG_PATH = join(dirname(fileURLToPath(import.meta.url)), "vendors.json");
const DEFAULT_TIMEOUT_MS = 60_000;

let cached = null;

/** @returns {{ vendors: Object<string, any>, variables: Object<string, any> }} */
export function loadCatalog() {
  if (!cached) cached = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
  return cached;
}

/** @returns {Object|null} o vendor do catálogo, ou null se não for suportado */
export function getVendor(name) {
  const key = String(name || "")
    .trim()
    .toLowerCase();
  return loadCatalog().vendors[key] ?? null;
}

/**
 * `execFile` em forma de promessa, que resolve sempre (o chamador decide pelo `code`).
 * `code` é o exit code; `ENOENT` quando o binário não existe; `ETIMEDOUT` no timeout.
 * @returns {Promise<{ code: number|string, stdout: string, stderr: string }>}
 */
export function defaultExec(
  bin,
  args,
  { timeoutMs = DEFAULT_TIMEOUT_MS, maxBuffer = 10 * 1024 * 1024 } = {}
) {
  return new Promise((resolve) => {
    execFile(
      bin,
      args,
      { encoding: "utf-8", timeout: timeoutMs, maxBuffer },
      (error, stdout, stderr) => {
        if (!error) return resolve({ code: 0, stdout, stderr });
        let code = error.code ?? 1;
        if (code !== MAXBUFFER && (error.killed || error.signal)) code = "ETIMEDOUT";
        resolve({ code, stdout: stdout || "", stderr: stderr || "" });
      }
    );
  });
}

const MAXBUFFER = "ERR_CHILD_PROCESS_STDIO_MAXBUFFER";

// Erros do próprio spawn (o processo nem começou): nada foi enviado.
const SPAWN_ERRORS = new Set(["ENOENT", "EACCES", "EPERM", "E2BIG", "ENOEXEC", "ENOTDIR"]);

/**
 * Variáveis do `$IDE/ENV.md` do workspace (sobe a partir do cwd; `--ide`, `--env-file` e
 * `JARVIS_ENV_FILE` vencem). Sem ENV.md, `vars` vazio e sem erro. ENV.md ambíguo (dois IDEs no
 * workspace) ou caminho inexistente: `error` com o motivo, para o comando não seguir às cegas.
 * @param {{ cwd?: string, ide?: string, envFile?: string }} [opts]
 * @returns {{ vars: Object<string, string>, error: string|null }}
 */
export function readFileEnv({ cwd = process.cwd(), ide, envFile } = {}) {
  const flags = {};
  if (ide) flags.ide = ide;
  if (envFile) flags["env-file"] = envFile;
  try {
    const { path } = resolveEnvPath(cwd, flags);
    return { vars: existsSync(path) ? loadEnv(cwd, path) : {}, error: null };
  } catch (err) {
    return { vars: {}, error: err.message.split("\n")[0] };
  }
}

/** Só as variáveis do ENV.md (sem o erro). */
export function loadFileEnv(opts) {
  return readFileEnv(opts).vars;
}

/**
 * ENV.md dos `deps` de um comando: `fileEnvResult` ({ vars, error }), `fileEnv` (só vars, testes)
 * ou lido do workspace com `envOpts` ({ ide, envFile }).
 */
export function resolveFileEnv(deps = {}) {
  if (deps.fileEnvResult) return deps.fileEnvResult;
  if (deps.fileEnv) return { vars: deps.fileEnv, error: null };
  return readFileEnv(deps.envOpts);
}

// Valor sem aspas em volta e sem comentário de fim de linha (o loadEnv não tira nenhum dos dois).
// Entre aspas, o que está dentro vale como está (inclusive um " # " legítimo).
function clean(value) {
  const v = String(value ?? "").trim();
  const quoted = v.match(/^(["'])(.*?)\1(?:\s+#.*)?$/);
  if (quoted) return quoted[2].trim();
  return v.replace(/\s+#.*$/, "").trim();
}

/** Valor de uma variável: o ambiente do processo vence; senão, o ENV.md (`fileVars`). */
export function setting(name, fileVars = {}) {
  return clean(process.env[name]) || clean(fileVars[name]);
}

/**
 * Forma de acesso de um eixo: `cli`, `manual`, `empty` (vazio, ausente ou a lista de opções do
 * template, como `[cli, manual]`) ou `invalid` (qualquer outro valor, ex.: `manul`).
 */
export function accessMode(name, fileVars = {}) {
  const v = setting(name, fileVars).toLowerCase();
  if (!v || /^\[.*\]$/.test(v)) return "empty";
  return v === "cli" || v === "manual" ? v : "invalid";
}

/** Valor normalizado de uma variável `*_ACCESS` ("" quando vazio ou lista de opções). */
export function accessValue(name, fileVars = {}) {
  return accessMode(name, fileVars) === "empty" ? "" : setting(name, fileVars).toLowerCase();
}

/**
 * Decide se o comando pode tentar a CLI. Só `cli` (ou vazio, com aviso) segue: `manual`, valor
 * inválido ou ENV.md ilegível sem a variável no ambiente saem com 3, sem enviar nada (fail secure).
 * @param {string} name - ex.: `VERSION_CONTROL_ACCESS`
 * @param {{ vars: Object, error: string|null }} fileEnv - resultado do `readFileEnv`
 * @returns {{ ok: boolean, code: number, mode: string, reason?: string, warning?: string }}
 */
export function accessGate(name, fileEnv) {
  if (fileEnv.error && !clean(process.env[name])) {
    return {
      ok: false,
      code: EXIT.UNAVAILABLE,
      mode: "unknown",
      reason: `não deu para ler o ENV.md (${fileEnv.error}); use --ide ou --env-file. Nada foi enviado`,
    };
  }
  const mode = accessMode(name, fileEnv.vars);
  if (mode === "manual") {
    return { ok: false, code: EXIT.UNAVAILABLE, mode, reason: `${name}=manual: nada foi enviado` };
  }
  if (mode === "invalid") {
    return {
      ok: false,
      code: EXIT.UNAVAILABLE,
      mode,
      reason: `valor inválido em ${name} (use cli ou manual): nada foi enviado`,
    };
  }
  return {
    ok: true,
    code: EXIT.OK,
    mode,
    warning:
      mode === "empty"
        ? `${name} vazio: tentando a CLI. Rode o /jarvis-init para confirmar o acesso.`
        : undefined,
  };
}

// O `acli jira auth status` não tem o código de saída sem login documentado:
// além do código, o texto da resposta conta (R1 do architecture.md da #181).
const NOT_LOGGED_IN =
  /not (logged|authenticated)|no (account|accounts|credentials)|unauthori[sz]ed|\b401\b|log ?in first|não autenticado/i;

/**
 * Verifica se a CLI do vendor está instalada e logada (só leitura, sem rede além do `auth status`).
 * Com `host`, confere o login naquele host (`auth status --hostname`, quando o vendor tem).
 * @param {string} vendorName
 * @param {{ exec?: typeof defaultExec, host?: string }} [deps]
 * @returns {Promise<{ supported: boolean, installed: boolean, loggedIn: boolean, bin?: string, reason: string }>}
 */
export async function checkCli(vendorName, { exec = defaultExec, host } = {}) {
  const vendor = getVendor(vendorName);
  if (!vendor) {
    return {
      supported: false,
      installed: false,
      loggedIn: false,
      reason: `${vendorName} não é suportado`,
    };
  }
  const {
    bin,
    version,
    auth_status: authStatus,
    auth_status_host: authStatusHost,
    install_url: installUrl,
    login_cmd: loginCmd,
  } = vendor.cli;

  const v = await exec(bin, version, { timeoutMs: 15_000 });
  if (v.code === "ENOENT") {
    return {
      supported: true,
      installed: false,
      loggedIn: false,
      bin,
      reason: `\`${bin}\` não instalada (instale: ${installUrl})`,
    };
  }

  const validHost = host && /^[A-Za-z0-9.-]+$/.test(host);
  const statusArgs =
    validHost && authStatusHost
      ? authStatusHost.map((a) => (a === "{host}" ? host : a))
      : authStatus;
  const a = await exec(bin, statusArgs, { timeoutMs: 15_000 });
  const text = `${a.stdout}\n${a.stderr}`;
  const loggedIn = a.code === 0 && !NOT_LOGGED_IN.test(text);
  const where = validHost && authStatusHost ? ` em ${host}` : "";
  // gh: "Logged in to github.com account X"; glab: "Logged in to gitlab.com as X".
  const account = loggedIn ? text.match(/\b(?:account|as)\s+([A-Za-z0-9._@-]+)/)?.[1] : null;
  return {
    supported: true,
    installed: true,
    loggedIn,
    bin,
    account: account || null,
    reason: loggedIn
      ? `\`${bin}\`: instalada, logada${account ? ` como ${account}` : ""}${where}`
      : `\`${bin}\`: instalada, login inválido${where} (faça \`${loginCmd}\`)`,
  };
}

const KEY_RE = /^#?[A-Za-z0-9][A-Za-z0-9_-]*$/;
const BRANCH_RE = /^[A-Za-z0-9._/-]+$/;
const REPO_RE = /^[A-Za-z0-9.-]+(\/[A-Za-z0-9._-]+)+$/;
const REPO_URL_RE = /^https?:\/\/[A-Za-z0-9.-]+(:\d+)?(\/[A-Za-z0-9._-]+)+$/;

// Marcadores sem os quais a ação não faz sentido; os outros (labels, body) saem com a flag.
const REQUIRED_MARKERS = new Set([
  "key",
  "repo",
  "repo_url",
  "title",
  "source",
  "target",
  "body_file",
]);

function validate(name, value) {
  const checks = {
    key: KEY_RE,
    source: BRANCH_RE,
    target: BRANCH_RE,
    repo: REPO_RE,
    repo_url: REPO_URL_RE,
  };
  const re = checks[name];
  if (re && !re.test(value)) throw usageError(`valor inválido para {${name}}: ${value}`);
}

function usageError(message) {
  const err = new Error(message);
  err.exitCode = EXIT.USAGE;
  return err;
}

/**
 * Monta a lista de argumentos de uma ação do catálogo.
 * Marcador com valor vazio sai junto com a flag que vem antes dele (ex.: `--label {labels}` sem labels).
 * @param {string} vendorName
 * @param {string} action - comment | view | create_merge | create_issue
 * @param {Object<string, string>} params
 * @returns {{ bin: string, args: string[] }}
 */
export function buildArgs(vendorName, action, params = {}) {
  const vendor = getVendor(vendorName);
  if (!vendor) throw usageError(`vendor não suportado: ${vendorName}`);
  const template = vendor.actions[action];
  if (!template) throw usageError(`ação ${action} não existe para ${vendorName}`);

  const args = [];
  for (const piece of template) {
    const m = piece.match(/^\{(\w+)\}$/);
    if (!m) {
      args.push(piece);
      continue;
    }
    const value = params[m[1]];
    // O corpo vazio vai como "" (com a flag): sem ele, o glab sem terminal pode abrir o editor.
    if (m[1] === "body" && value === "") {
      args.push("");
      continue;
    }
    if (value === undefined || value === null || String(value) === "") {
      if (REQUIRED_MARKERS.has(m[1])) throw usageError(`falta o valor de {${m[1]}}`);
      if (args.length && args[args.length - 1].startsWith("-")) args.pop();
      continue;
    }
    validate(m[1], String(value));
    args.push(String(value));
  }
  return { bin: vendor.cli.bin, args };
}

/**
 * Markdown → texto simples, para o vendor com `body_format: "plain"` (Jira; Q5 da #181).
 * Tira `#` de títulos, negrito e crases; mantém listas com hífen; `[texto](url)` → `texto (url)`;
 * bloco de código vira o texto de dentro.
 */
export function toPlainText(markdown) {
  let inFence = false;
  const out = [];
  for (const line of String(markdown || "").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    // Dentro do bloco de código, o texto vai como está (# de comentário, **/glob etc.).
    if (inFence) {
      out.push(line);
      continue;
    }
    out.push(
      line
        .replace(/^(\s*)#{1,6}\s+/, "$1")
        .replace(/^(\s*)[*+]\s+/, "$1- ")
        .replace(/!?\[([^\]]*)\]\(([^)]+)\)/g, "$1 ($2)")
        .replace(/(\*\*|__)(.+?)\1/g, "$2")
        .replace(/`([^`]*)`/g, "$1")
    );
  }
  return out.join("\n");
}

/**
 * Executa uma ação de escrita ou leitura pela CLI do vendor.
 * Confere a CLI antes (indisponível = `sent: false`); grava `{body}` num arquivo temporário
 * quando a ação usa `{body_file}`, e o apaga no fim.
 * @param {string} vendorName
 * @param {string} action
 * @param {Object<string, string>} params - inclui `body` (texto) quando a ação tem corpo
 * @param {{ exec?: typeof defaultExec, timeoutMs?: number }} [deps]
 * @returns {Promise<{ ok: boolean, sent: boolean, code: number, stdout: string, stderr: string, reason?: string }>}
 */
export async function runAction(
  vendorName,
  action,
  params = {},
  { exec = defaultExec, timeoutMs, tmpRoot = tmpdir() } = {}
) {
  const fail = (code, sent, reason, res = {}) => ({
    ok: false,
    sent,
    code,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
    reason,
  });

  const vendor = getVendor(vendorName);
  if (!vendor) return fail(EXIT.UNAVAILABLE, false, `${vendorName} não é suportado`);

  // Valida os argumentos antes de tocar a CLI: erro de uso sai com 1, sem rede.
  const usesBodyFile = Boolean(vendor.actions[action]?.includes("{body_file}"));
  const body = vendor.body_format === "plain" ? toPlainText(params.body) : (params.body ?? "");
  try {
    buildArgs(vendorName, action, { ...params, body, body_file: usesBodyFile ? "/tmp/x" : "" });
  } catch (err) {
    return fail(err.exitCode ?? EXIT.USAGE, false, err.message);
  }

  const cli = await checkCli(vendorName, { exec, host: params.host });
  if (!cli.installed || !cli.loggedIn) return fail(EXIT.UNAVAILABLE, false, cli.reason);

  let tmpDir = null;
  try {
    const filled = { ...params, body };
    // O arquivo do corpo vai sempre, mesmo vazio: sem terminal, `gh pr create` exige o corpo.
    if (usesBodyFile) {
      tmpDir = mkdtempSync(join(tmpRoot, "jarvis-cli-"));
      filled.body_file = join(tmpDir, "body.md");
      writeFileSync(filled.body_file, body);
    }
    const { bin, args } = buildArgs(vendorName, action, filled);
    const res = await exec(bin, args, { timeoutMs });
    if (res.code === 0) {
      return { ok: true, sent: true, code: EXIT.OK, stdout: res.stdout, stderr: res.stderr };
    }
    // O processo nem começou (binário sumiu, sem permissão, argumento grande demais): nada foi enviado.
    if (SPAWN_ERRORS.has(res.code)) {
      return fail(EXIT.UNAVAILABLE, false, `\`${bin}\` não pôde ser executada (${res.code})`);
    }
    let reason = `${bin} saiu com código ${res.code}`;
    if (res.code === "ETIMEDOUT") reason = "tempo esgotado";
    if (res.code === MAXBUFFER) reason = "saída grande demais";
    return fail(EXIT.SENT_WITH_ERROR, true, reason, res);
  } catch (err) {
    // Falha local antes de chamar a CLI (ex.: não conseguiu gravar o arquivo do corpo).
    return fail(
      err.exitCode ?? EXIT.UNAVAILABLE,
      false,
      `falha local antes de enviar: ${err.message}`
    );
  } finally {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  }
}

/** Primeira URL http(s) da saída da CLI (gh/glab imprimem a URL do PR/MR/issue criado). */
export function firstUrl(text) {
  const m = String(text || "").match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[).,]+$/, "") : null;
}
