// MCP obrigatório (Context7) no arquivo e no formato que cada IDE lê (`jarvis init`).
// Os caminhos vêm de `getMCPTargets` (ide-config.js). Regras:
//   - arquivo ausente → cria só com o Context7;
//   - arquivo presente → acrescenta o `context7` se faltar, sem tocar nos outros servidores
//     e mantendo a indentação, o BOM e a quebra de linha (LF ou CRLF);
//   - o que não reconhece com segurança (JSON com comentários ou inválido, raiz ou lista de
//     servidores que não é objeto, TOML que não parseia ou em que o bloco não cabe) → não mexe
//     e devolve o trecho para a pessoa colar. O TOML é lido com parser (smol-toml), mas nunca
//     reescrito: o bloco é acrescentado no fim;
//   - config só global (`~/…`) → não grava fora do workspace: devolve o trecho.
// Nada disso muda o código de saída do `jarvis init`: são avisos.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { parse as parseTomlText } from "smol-toml";
import { getMCPTargets } from "../config/ide-config.js";

export const CONTEXT7 = Object.freeze({
  name: "context7",
  command: "npx",
  args: Object.freeze(["-y", "@upstash/context7-mcp"]),
});

/** Arquivo que existe mas não dá para alterar com segurança: fica intacto e vira `manual`. */
class Unrecognized extends Error {}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Item do servidor no formato do alvo. */
function serverEntry(style) {
  if (style === "opencode") {
    return { type: "local", command: [CONTEXT7.command, ...CONTEXT7.args], enabled: true };
  }
  const entry = { command: CONTEXT7.command, args: [...CONTEXT7.args] };
  return style === "stdio" ? { type: "stdio", ...entry } : entry;
}

/** Trecho pronto para colar (usado nos alvos globais e nos arquivos não reconhecidos). */
export function mcpSnippet(target) {
  if (target.format === "toml") {
    return [
      `[${target.key}.${CONTEXT7.name}]`,
      `command = "${CONTEXT7.command}"`,
      `args = [${CONTEXT7.args.map((a) => `"${a}"`).join(", ")}]`,
      "",
    ].join("\n");
  }
  const block = { [target.key]: { [CONTEXT7.name]: serverEntry(target.style) } };
  return `${JSON.stringify(block, null, 2)}\n`;
}

/** Indentação de um JSON existente: tab ou N espaços (2 se não der para saber). */
function detectIndent(text) {
  const m = text.match(/^([ \t]+)\S/m);
  if (!m) return 2;
  return m[1].startsWith("\t") ? "\t" : m[1].length;
}

/** Quebra de linha usada no arquivo: CRLF se aparecer, senão LF. */
const detectEol = (text) => (text.includes("\r\n") ? "\r\n" : "\n");

const BOM = "\uFEFF";

function ensureJson(file, target) {
  let data = {};
  let indent = 2;
  let bom = "";
  let eol = "\n";
  if (existsSync(file)) {
    const raw = readFileSync(file, "utf-8");
    bom = raw.startsWith(BOM) ? BOM : "";
    const text = raw.slice(bom.length);
    indent = detectIndent(text);
    eol = detectEol(text);
    try {
      data = JSON.parse(text);
    } catch (err) {
      const detail = err.message.split("\n")[0];
      const reason = "não consegui ler o JSON com segurança (comentários ou erro de sintaxe";
      throw new Unrecognized(`${reason}: ${detail})`);
    }
    if (!isPlainObject(data)) throw new Unrecognized("o arquivo não é um objeto JSON");
  } else if (target.style === "opencode") {
    data.$schema = "https://opencode.ai/config.json";
  }
  const current = data[target.key];
  if (current != null && !isPlainObject(current)) {
    throw new Unrecognized(`"${target.key}" não é um objeto`);
  }
  const servers = current ?? {};
  if (Object.hasOwn(servers, CONTEXT7.name)) return false;
  data[target.key] = { ...servers, [CONTEXT7.name]: serverEntry(target.style) };
  mkdirSync(dirname(file), { recursive: true });
  const body = JSON.stringify(data, null, indent).replace(/\n/g, eol);
  writeFileSync(file, `${bom}${body}${eol}`);
  return true;
}

/** Lê um TOML; devolve `null` se não parseia. */
function parseToml(text) {
  try {
    return parseTomlText(text);
  } catch {
    return null;
  }
}

/**
 * Codex: lê o `config.toml` com um parser (smol-toml) para saber se o servidor já existe.
 * O texto nunca é reescrito pelo parser (comentários e formatação ficam); o bloco é
 * acrescentado no fim, com o EOL do arquivo, e só se o resultado também parsear.
 */
function ensureToml(file, target) {
  const text = existsSync(file) ? readFileSync(file, "utf-8") : "";
  const data = parseToml(text);
  if (!data) throw new Unrecognized("o TOML não pôde ser lido (sintaxe inválida)");
  const servers = data[target.key];
  if (servers !== undefined && !isPlainObject(servers)) {
    throw new Unrecognized(`"${target.key}" não é uma tabela`);
  }
  if (servers && Object.hasOwn(servers, CONTEXT7.name)) return false;
  const eol = detectEol(text);
  const sep = text === "" || text.endsWith(eol + eol) ? "" : text.endsWith(eol) ? eol : eol + eol;
  const addition = `${sep}${mcpSnippet(target).replace(/\n/g, eol)}`;
  if (!parseToml(text + addition)?.[target.key]?.[CONTEXT7.name]) {
    throw new Unrecognized(`acrescentar [${target.key}.${CONTEXT7.name}] deixaria o TOML inválido`);
  }
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, addition);
  return true;
}

/**
 * Garante o Context7 na configuração de MCP da IDE.
 * @param {string} workspaceDir - pasta que contém o `$IDE/`
 * @param {string} ide - slug da IDE
 * @returns {{ written: string[], present: string[],
 *   manual: {path: string, snippet: string, reason?: string}[], errors: string[] }}
 *   caminhos relativos ao workspace (ou com `~/`, nos globais). `manual` sem `reason` é
 *   config só global; com `reason`, é arquivo do workspace que ficou intacto.
 */
export function ensureContext7(workspaceDir, ide) {
  const result = { written: [], present: [], manual: [], errors: [] };
  for (const target of getMCPTargets(ide)) {
    if (target.global) {
      result.manual.push({ path: target.path, snippet: mcpSnippet(target) });
      continue;
    }
    const file = join(workspaceDir, target.path);
    try {
      const wrote = target.format === "toml" ? ensureToml(file, target) : ensureJson(file, target);
      (wrote ? result.written : result.present).push(target.path);
    } catch (err) {
      if (err instanceof Unrecognized) {
        result.manual.push({ path: target.path, snippet: mcpSnippet(target), reason: err.message });
      } else {
        result.errors.push(`${target.path}: ${err.message.split("\n")[0]}`);
      }
    }
  }
  return result;
}
