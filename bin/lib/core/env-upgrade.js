// Upgrade do ENV.md (`jarvis init --upgrade`): acrescenta as chaves do template que faltam.
// Regra: só acrescenta. Nenhuma chave existente muda, preenchida, vazia ou com lista de opções.
// Exceção declarada (automática): `JARVIS_PROJECT=` vazio recebe o valor oficial do template.
// As outras exceções (CENTRAL_DOCS_LOCATION e esvaziar o TOKEN_TASK_MANAGER) pedem confirmação
// e ficam no Upgrade (C) do skill jarvis-init (item 9). Mesmas regras dos itens 4, 5, 9, 10 e 11.
import { readFileSync, writeFileSync } from "node:fs";
import { detectWorkspaceMode } from "./workspace-mode.js";
import { getVendor } from "../integrations/cli-runner.js";

const KEY_LINE = /^([A-Z][A-Z0-9_]*)=(.*)$/;

// PROD_MODE nova: o valor vem da AREA (só no upgrade; a criação do ENV continua perguntando).
const PROD_MODE_BY_AREA = { ENGINEERING: "developer-guided", PRODUCT: "product-led" };

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

// Bloco "Data Engineering": DATA_* só entram com HUB=DATA. DATA_SPECIALIZATIONS é
// obrigatória em qualquer HUB (eng.specializations-rules.md) e nunca é excluída.
function isDataOnlyKey(key) {
  return key.startsWith("DATA_") && key !== "DATA_SPECIALIZATIONS";
}

// Chave existente e vazia que o upgrade preenche com o valor do template (exceção automática).
const FILL_WHEN_EMPTY = ["JARVIS_PROJECT"];

// Eixos de integração: vendor fora do catálogo vira aviso (o eixo fica em freelance).
const AXES = ["TASK_MANAGER", "VERSION_CONTROL"];

/**
 * Calcula o que o upgrade acrescenta, sem gravar nada.
 * @param {string} envText
 * @param {string} templateText
 * @param {{ workspaceDir?: string }} [options] - `workspaceDir`: pasta que contém o `$IDE/`, para detectar o `WORKSPACE_MODE`
 * @returns {{ added: {key: string, value: string}[], filled: {key: string, value: string}[], pending: string[], warnings: string[] }}
 *   `filled`: chaves existentes e vazias preenchidas com o valor do template (só `JARVIS_PROJECT`).
 *   `pending` e `warnings` trazem só nomes de chave, nunca valores do ENV
 *   (exceto o nome do vendor não suportado, em `UNSUPPORTED:{CHAVE}:{vendor}`).
 */
export function planEnvUpgrade(envText, templateText, { workspaceDir } = {}) {
  const env = parseEnvEntries(envText);
  const template = parseEnvEntries(templateText);
  const hub = (env.get("HUB") || "").toUpperCase();
  const area = (env.get("AREA") || "").toUpperCase();

  const added = [];
  const filled = [];
  const pending = [];
  const warnings = [];

  for (const [key, templateValue] of template) {
    if (env.has(key)) continue;
    if (hub !== "DATA" && isDataOnlyKey(key)) continue;

    let value = isOptionList(templateValue) ? "" : templateValue;
    if (key === "PROD_MODE") {
      value = PROD_MODE_BY_AREA[area] || "";
      if (!value) pending.push("PROD_MODE");
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

  return { added, filled, pending, warnings };
}

/**
 * Grava as chaves novas no fim do ENV, num bloco datado, e preenche as chaves de `plan.filled`
 * (linha `CHAVE=` vazia). Nenhuma outra linha existente muda.
 * `overrides` troca o valor de chaves novas (ex.: recusa em mover os discoveries).
 * @returns {boolean} true se gravou
 */
export function applyEnvUpgrade(envPath, plan, today, overrides = {}) {
  const filled = plan.filled || [];
  if (plan.added.length === 0 && filled.length === 0) {
    plan.filledApplied = [];
    return false;
  }
  let text = readFileSync(envPath, "utf-8");
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
