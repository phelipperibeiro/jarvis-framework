// Upgrade do ENV.md (`jarvis init --upgrade`): acrescenta as chaves do template que faltam.
// Regra: só acrescenta. Nenhuma chave existente muda, preenchida, vazia ou com lista de opções.
// Exceções declaradas (automáticas): `JARVIS_PROJECT=` vazio recebe o valor oficial do template, e
// as chaves de REMOVED_KEYS (blocos e chaves que saíram do template, #209, #239 e #263) são apagadas
// sem ler o valor, salvo o POSITION, que vira a SENIORITY (#263).
// As outras exceções (CENTRAL_DOCS_LOCATION e esvaziar o TOKEN_TASK_MANAGER) pedem confirmação
// e ficam no Upgrade (C) do skill jarvis-init (item 8). Mesmas regras dos itens 3, 4, 8, 9 e 10.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { detectWorkspaceMode } from "./workspace-mode.js";
import { getVendor } from "../integrations/cli-runner.js";
import { resolveLocation } from "../docs/storage/index.js";
import { EnvPathError, expandEnvPath } from "./env-paths.js";

const KEY_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;

/**
 * SENIORITY nova (#263): vem do cargo antigo (POSITION), que o upgrade apaga, lido sem distinguir
 * maiúsculas nem espaços nas pontas. JUNIOR → junior, PLENO → pleno, outro valor → senior. Sem
 * cargo (ausente, vazio ou a lista de exemplo do template) → vazia, e vira pendência.
 * @param {string | undefined} role
 * @returns {string}
 */
function seniorityFromRole(role) {
  const value = (role || "").trim().toUpperCase();
  if (!value || isOptionList(value)) return "";
  if (value === "JUNIOR") return "junior";
  if (value === "PLENO") return "pleno";
  return "senior";
}

/**
 * Lê as chaves do ENV na ordem do arquivo, **incluindo as vazias** (o `loadEnv`
 * descarta as vazias, o que esconderia uma chave existente do diff).
 * Linhas comentadas não contam.
 * @returns {Map<string, string>}
 */
export function parseEnvEntries(text) {
  const entries = new Map();
  for (const line of text.split("\n")) {
    const m = line.trim().match(KEY_LINE);
    if (m && !entries.has(m[1])) entries.set(m[1], m[2].trim());
  }
  return entries;
}

function isOptionList(value) {
  return /^\[.*\]$/.test(value);
}

// Blocos que saíram do template (#209, #239): o upgrade apaga as chaves e, quando o bloco fica vazio,
// a moldura dele. Os comentários são os do template na época; moldura diferente fica. Na #263 saem só
// três chaves da moldura "Organização", que fica no ENV.md da pessoa com o SQUAD.
const REMOVED_BLOCKS = Object.freeze([
  {
    title: "Mensageria (opcional)",
    keys: ["MESSAGE_BROKER", "MESSAGE_BROKER_URL_API", "MESSAGE_BROKER_API_AUTH"],
    comments: [],
  },
  {
    title: "Banco de dados (opcional)",
    keys: ["DATABASE", "USER_DATABASE", "PASSWORD_DATABASE", "HOST_DATABASE", "PORT_DATABASE"],
    comments: [],
  },
  {
    title: "Observabilidade (opcional)",
    keys: ["OBSERVABILITY", "TOKEN_OBSERVABILITY", "OBSERVABILITY_ORG"],
    comments: [],
  },
  { title: "SMTP (opcional)", keys: ["SMTP"], comments: [] },
  {
    title: "Data Engineering (só se HUB=DATA)",
    keys: [
      "DATA_ORCHESTRATOR",
      "DATA_ETL_TOOL",
      "DATA_QUALITY_TOOL",
      "DATA_LAKE",
      "DATA_QUERY_ENGINE",
      "DATA_BI_TOOL",
      "DATA_WAREHOUSE",
      "DATA_REPO",
    ],
    comments: [
      "# Obrigatório quando HUB=DATA. Omitir o bloco inteiro se o HUB for outro.",
      "# Vazio se não houver warehouse dedicado.",
    ],
  },
  {
    title: "Code quality (opcional)",
    keys: ["CODE_QUALITY_TOOL", "CODE_QUALITY_URL", "CODE_QUALITY_TOKEN"],
    comments: [
      "# Análise estática / quality gate. Em branco = sem MCP de code quality.",
      "# URL da instância (self-hosted).",
    ],
  },
  {
    title: "Chat / comunicador (opcional)",
    keys: [
      "MESSAGE_COMUNICATOR",
      "MESSAGE_COMUNICATOR_BOT_TOKEN",
      "MESSAGE_COMUNICATOR_SIGNING_SECRET",
      "MESSAGE_COMUNICATOR_APP_TOKEN",
      "ALERTS_CHANNEL",
    ],
    comments: [
      "# slack: BOT_TOKEN + SIGNING_SECRET + APP_TOKEN (Socket Mode)",
      "# discord: BOT_TOKEN (Bot) + ALERTS_CHANNEL = ID do canal",
      "# teams: BOT_TOKEN = URL do Incoming Webhook (SIGNING/APP vazios)",
    ],
  },
  {
    title: "Object storage (opcional)",
    keys: ["OBJECT_STORAGE", "TOKEN_OBJECT_STORAGE"],
    comments: [],
  },
  {
    // #263: a variável só servia à rule de Cypress, que saiu.
    title: "QA / suíte de testes (opcional)",
    keys: ["TEST_FOLDER"],
    comments: [
      "# Caminho relativo à raiz do projeto.",
      "# Cypress E2E: cypress | e2e | tests/e2e",
      "# Unit/integração: tests | test | src/__tests__",
    ],
  },
  {
    // #263: o cargo vira a SENIORITY nova antes de sair (planEnvUpgrade); hub e área não têm substituto.
    title: "Organização (obrigatório — opções vêm do taxonomy.md)",
    keys: ["HUB", "AREA", "POSITION"],
    comments: [],
  },
]);

export const REMOVED_KEYS = Object.freeze(REMOVED_BLOCKS.flatMap((b) => b.keys));

const SEPARATOR = /^#\s*=+\s*$/;

// Chave existente e vazia que o upgrade preenche com o valor do template (exceção automática).
const FILL_WHEN_EMPTY = ["JARVIS_PROJECT"];

// Eixos de integração: vendor fora do catálogo vira aviso (o eixo fica em freelance).
const AXES = ["TASK_MANAGER", "VERSION_CONTROL"];

/**
 * Calcula o que o upgrade acrescenta, sem gravar nada.
 * @param {string} envText
 * @param {string} templateText
 * @param {{ workspaceDir?: string }} [options] - `workspaceDir`: pasta que contém o `$IDE/`, para detectar o `WORKSPACE_MODE`
 * @returns {{ added: {key: string, value: string}[], filled: {key: string, value: string}[], removed: string[], pending: string[], warnings: string[] }}
 *   `filled`: chaves existentes e vazias preenchidas com o valor do template (só `JARVIS_PROJECT`).
 *   `removed`: chaves de REMOVED_KEYS presentes no ENV, que o upgrade apaga (só nomes).
 *   `pending` e `warnings` trazem só nomes de chave, nunca valores do ENV
 *   (exceto o nome do vendor não suportado, em `UNSUPPORTED:{CHAVE}:{vendor}`).
 */
export function planEnvUpgrade(envText, templateText, { workspaceDir } = {}) {
  const env = parseEnvEntries(envText);
  const template = parseEnvEntries(templateText);

  const added = [];
  const filled = [];
  const pending = [];
  const warnings = [];

  for (const [key, templateValue] of template) {
    if (env.has(key) || REMOVED_KEYS.includes(key)) continue;

    let value = isOptionList(templateValue) ? "" : templateValue;
    // PROD_MODE nova: sempre perguntada no /jarvis-init upgrade (#263).
    if (key === "PROD_MODE") pending.push("PROD_MODE");
    if (key === "SENIORITY") {
      value = seniorityFromRole(env.get("POSITION"));
      if (value) warnings.push("SENIORITY_DERIVED");
      else pending.push("SENIORITY");
    }
    if (key === "WORKSPACE_MODE" && workspaceDir) {
      const repos = (env.get("WORKSPACE_REPOS") || "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const detected = detectWorkspaceMode(workspaceDir, { repos });
      value = detected.mode;
      if (detected.warning) warnings.push("WORKSPACE_MODE");
    }
    added.push({ key, value });
  }

  if (env.has("PROD_MODE") && !env.get("PROD_MODE")) pending.push("PROD_MODE");

  const removed = [...env.keys()].filter((key) => REMOVED_KEYS.includes(key));

  for (const key of FILL_WHEN_EMPTY) {
    const value = template.get(key);
    if (env.has(key) && !env.get(key) && value && !isOptionList(value)) filled.push({ key, value });
  }

  // O token não é mais usado (o login é o da CLI do vendor). Só o nome da chave sai daqui.
  if (env.get("TOKEN_TASK_MANAGER")) warnings.push("TOKEN_TASK_MANAGER");

  for (const key of AXES) {
    const vendor = (env.get(key) || "").toLowerCase();
    if (vendor && !isOptionList(vendor) && !getVendor(vendor)) {
      warnings.push(`UNSUPPORTED:${key}:${vendor.replace(/[^a-z0-9_-]/g, "")}`);
    }
  }

  if (env.get("CENTRAL_DOCS_REPO") && !env.has("CENTRAL_DOCS_STORAGE")) {
    warnings.push("CENTRAL_DOCS_REPO");
  }

  // Central docs ainda no layout por tipo (product/engineering), anterior à estrutura por
  // funcionalidade (#220): a migração (`jarvis docs migrate`) é oferecida pelo Upgrade (C).
  if (
    workspaceDir &&
    (env.get("CENTRAL_DOCS_STORAGE") || "").trim().toLowerCase() === "filesystem" &&
    env.get("CENTRAL_DOCS_LOCATION") &&
    env.get("SQUAD")
  ) {
    let location = null;
    try {
      location = expandEnvPath(env, "CENTRAL_DOCS_LOCATION");
    } catch (error) {
      // `$` sem valor no caminho: não dá para conferir o layout; o erro aparece no comando que usa o Central docs
      if (!(error instanceof EnvPathError)) throw error;
    }
    if (location) {
      const root = resolveLocation(location, workspaceDir);
      const squadDir = join(root, env.get("SQUAD"));
      if (existsSync(join(squadDir, "product")) || existsSync(join(squadDir, "engineering"))) {
        warnings.push("CENTRAL_DOCS_LAYOUT");
      }
    }
  }

  return { added, filled, removed, pending, warnings };
}

/**
 * Apaga do texto do ENV as linhas das chaves pedidas e, nos blocos de REMOVED_BLOCKS que ficaram
 * vazios, a moldura (separador, título, separador), os comentários do template e as linhas em
 * branco logo depois (no fim do arquivo, também as de antes). Moldura com outra coisa dentro
 * (chave ou comentário próprio) fica. Nunca lê o valor das chaves: casa só o nome antes do `=`.
 * @param {string} text
 * @param {string[]} keys
 * @returns {{ text: string, removed: string[] }} `removed`: as chaves que de fato saíram
 */
export function removeEnvKeys(text, keys) {
  const wanted = new Set(keys);
  const removed = [];
  let lines = text.split("\n").filter((line) => {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)=/);
    if (!m || !wanted.has(m[1])) return true;
    if (!removed.includes(m[1])) removed.push(m[1]);
    return false;
  });
  if (removed.length === 0) return { text, removed };

  const bare = (line) => line.replace(/\r$/, "").trim();
  // Só os blocos de onde saiu alguma chave: moldura vazia de outro bloco é escolha da pessoa.
  for (const block of REMOVED_BLOCKS.filter((b) => b.keys.some((k) => removed.includes(k)))) {
    const i = lines.findIndex(
      (line, n) =>
        bare(line) === `# ${block.title}` &&
        SEPARATOR.test(bare(lines[n - 1] ?? "")) &&
        SEPARATOR.test(bare(lines[n + 1] ?? ""))
    );
    if (i < 0) continue;
    let j = i + 2;
    while (j < lines.length && (bare(lines[j]) === "" || block.comments.includes(bare(lines[j])))) {
      j++;
    }
    if (j < lines.length && !SEPARATOR.test(bare(lines[j]))) continue;
    if (j < lines.length) {
      lines = [...lines.slice(0, i - 1), ...lines.slice(j)];
      continue;
    }
    // Bloco no fim do arquivo: tira também as linhas em branco antes dele e termina numa quebra só.
    let end = i - 1;
    while (end > 0 && bare(lines[end - 1]) === "") end--;
    lines = [...lines.slice(0, end), ""];
  }
  return { text: lines.join("\n"), removed };
}

/**
 * Grava as chaves novas no fim do ENV, num bloco datado, preenche as chaves de `plan.filled`
 * (linha `CHAVE=` vazia) e apaga as de `plan.removed` (`removeEnvKeys`). Nenhuma outra linha muda.
 * `overrides` troca o valor de chaves novas (ex.: recusa em mover os discoveries).
 * @returns {boolean} true se gravou
 */
export function applyEnvUpgrade(envPath, plan, today, overrides = {}) {
  const filled = plan.filled || [];
  const toRemove = plan.removed || [];
  if (plan.added.length === 0 && filled.length === 0 && toRemove.length === 0) {
    plan.filledApplied = [];
    plan.removedApplied = [];
    return false;
  }
  let text = readFileSync(envPath, "utf-8");
  // `plan.removedApplied`: só as chaves que de fato saíram (para o resumo não mentir).
  const removal = removeEnvKeys(text, toRemove);
  text = removal.text;
  plan.removedApplied = removal.removed;
  // `plan.filledApplied`: só as chaves que de fato mudaram (para o resumo não mentir).
  plan.filledApplied = [];
  for (const { key, value } of filled) {
    const before = text;
    // `\r?` cobre ENV com CRLF; a função evita que um `$` do valor vire referência de grupo.
    text = text.replace(
      new RegExp(`^([ \\t]*)${key}=[ \\t]*(\\r?)$`, "m"),
      (_m, indent, cr) => `${indent}${key}=${value}${cr}`
    );
    if (text !== before) plan.filledApplied.push(key);
  }
  if (plan.added.length > 0) {
    const lines = plan.added.map(({ key, value }) => `${key}=${overrides[key] ?? value}`);
    const sep = text.endsWith("\n") ? "" : "\n";
    text = `${text}${sep}\n# --- Upgrade ${today} ---\n${lines.join("\n")}\n`;
  }
  writeFileSync(envPath, text);
  return true;
}
