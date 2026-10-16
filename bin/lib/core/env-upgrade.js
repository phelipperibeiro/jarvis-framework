// Upgrade do ENV.md (`jarvis init --upgrade`): acrescenta as chaves do template que faltam.
// Regra: só acrescenta. Nenhuma chave existente muda, preenchida, vazia ou com lista de opções.
// Mesmas regras do Upgrade (C) do skill jarvis-init (itens 4, 5, 9, 10 e 11).
import { readFileSync, writeFileSync } from "node:fs";

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

/**
 * Calcula o que o upgrade acrescenta, sem gravar nada.
 * @returns {{ added: {key: string, value: string}[], pending: string[], warnings: string[] }}
 *   `pending` e `warnings` trazem só nomes de chave, nunca valores do ENV.
 */
export function planEnvUpgrade(envText, templateText) {
  const env = parseEnvEntries(envText);
  const template = parseEnvEntries(templateText);
  const hub = (env.get("HUB") || "").toUpperCase();
  const area = (env.get("AREA") || "").toUpperCase();

  const added = [];
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
    added.push({ key, value });
  }

  if (env.has("PROD_MODE") && !env.get("PROD_MODE")) pending.push("PROD_MODE");

  if (env.get("CENTRAL_DOCS_REPO") && !env.has("CENTRAL_DOCS_STORAGE")) {
    warnings.push("CENTRAL_DOCS_REPO");
  }

  return { added, pending, warnings };
}

/**
 * Grava as chaves novas no fim do ENV, num bloco datado. Nenhuma linha existente muda.
 * `overrides` troca o valor de chaves novas (ex.: recusa em mover os discoveries).
 * @returns {boolean} true se gravou
 */
export function applyEnvUpgrade(envPath, plan, today, overrides = {}) {
  if (plan.added.length === 0) return false;
  const text = readFileSync(envPath, "utf-8");
  const lines = plan.added.map(({ key, value }) => `${key}=${overrides[key] ?? value}`);
  const sep = text.endsWith("\n") ? "" : "\n";
  writeFileSync(envPath, `${text}${sep}\n# --- Upgrade ${today} ---\n${lines.join("\n")}\n`);
  return true;
}
