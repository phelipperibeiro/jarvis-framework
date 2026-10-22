// MCP obrigatório (Context7) no arquivo e no formato que cada IDE lê (`jarvis init`).
// Os caminhos vêm de `getMCPTargets` (ide-config.js). Regras:
//   - arquivo ausente → cria só com o Context7;
//   - arquivo presente → acrescenta o `context7` se faltar, sem tocar nos outros servidores
//     e mantendo a indentação, o BOM e a quebra de linha (LF ou CRLF);
//   - o que não reconhece com segurança (JSON com comentários ou inválido, raiz ou lista de
//     servidores que não é objeto, TOML que já usa `context7` como chave numa forma desconhecida
//     ou com cabeçalho de tabela sem `]`) → não mexe e devolve o trecho para a pessoa colar.
//     O TOML não é validado por inteiro (seria preciso um parser, dependência nova): além do
//     cabeçalho sem `]`, só se procura o `context7` antes de acrescentar o bloco no fim;
//   - config só global (`~/…`) → não grava fora do workspace: devolve o trecho.
// Nada disso muda o código de saída do `jarvis init`: são avisos.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
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

/** Posição da aspa que fecha a string aberta em `from` (`-1` se não fecha na linha). */
function closingQuote(line, from, quote) {
  for (let j = from; j < line.length; j++) {
    if (quote === '"' && line[j] === "\\") {
      j++;
      continue;
    }
    if (line.startsWith(quote, j)) return j;
  }
  return -1;
}

/**
 * Linhas do TOML prontas para inspeção, sem espaços nas pontas e sem as vazias:
 *   - sem comentário (`#` fora de string) e sem as linhas de dentro de `"""` ou `'''`;
 *   - strings com cara de chave (`"context7"`) ficam; as demais viram `""` (assim
 *     `"context7.com"` ou `"@upstash/context7-mcp"` não contam como menção à chave).
 */
function tomlLines(text) {
  const out = [];
  let multi = null; // aspas triplas de uma string multilinha aberta
  for (const raw of text.split(/\r?\n/)) {
    let line = raw;
    if (multi) {
      const end = line.indexOf(multi);
      if (end === -1) continue;
      line = line.slice(end + multi.length);
      multi = null;
    }
    let clean = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "#") break;
      if (ch !== '"' && ch !== "'") {
        clean += ch;
        continue;
      }
      const quote = line.startsWith(ch.repeat(3), i) ? ch.repeat(3) : ch;
      const close = closingQuote(line, i + quote.length, quote);
      if (close === -1) {
        if (quote.length === 3) multi = quote;
        clean += `${ch}${ch}`;
        break;
      }
      const content = line.slice(i + quote.length, close);
      clean += /^[A-Za-z0-9_-]+$/.test(content) ? `${ch}${content}${ch}` : `${ch}${ch}`;
      i = close + quote.length - 1;
    }
    clean = clean.trim();
    if (clean) out.push(clean);
  }
  return out;
}

/** Cabeçalho de tabela (`[a]`, `[[a]]`, `["a"]`): `[` seguido de chave, não de valor. */
const isTomlHeader = (line) => /^\[\[?\s*[A-Za-z0-9_"'-]/.test(line);

/** Chaves do primeiro nível de uma tabela inline (`{ a = 1, b = { c = 2 } }` → `a`, `b`). */
function inlineTopKeys(inline) {
  const keys = [];
  let depth = 0;
  let expectKey = false;
  for (let i = 0; i < inline.length; i++) {
    const ch = inline[i];
    if (ch === "{" || ch === "[") {
      depth++;
      if (depth === 1 && ch === "{") expectKey = true;
    } else if (ch === "}" || ch === "]") {
      depth--;
    } else if (depth === 1 && ch === ",") {
      expectKey = true;
    } else if (depth === 1 && expectKey && !/\s/.test(ch)) {
      const m = inline.slice(i).match(/^["']?([A-Za-z0-9_-]+)/);
      if (m) keys.push(m[1]);
      expectKey = false;
    }
  }
  return keys;
}

/**
 * O TOML já declara o servidor? Reconhece `[mcp_servers.context7]` (com espaços e aspas),
 * `context7 = …` dentro de `[mcp_servers]` e, antes do primeiro cabeçalho (na raiz),
 * `mcp_servers.context7 = …` e a tabela inline `mcp_servers = { context7 = … }` (só no
 * primeiro nível). `context7` precisa ser a chave inteira (`context7-legacy` não conta).
 */
function tomlHasServer(text, key) {
  const name = `["']?${CONTEXT7.name}["']?`;
  const serverTable = new RegExp(`^\\[\\s*${key}\\s*\\.\\s*${name}\\s*\\]`);
  const keyTable = new RegExp(`^\\[\\s*${key}\\s*\\]`);
  const inKeyTableAssign = new RegExp(`^${name}\\s*[.=]`);
  const dotted = new RegExp(`^${key}\\s*\\.\\s*${name}\\s*[.=]`);
  const inlineStart = new RegExp(`^${key}\\s*=\\s*(\\{.*)$`);
  let table = null; // null = raiz, antes do primeiro cabeçalho
  for (const line of tomlLines(text)) {
    if (isTomlHeader(line)) {
      if (serverTable.test(line)) return true;
      table = keyTable.test(line) ? "key" : "other";
      continue;
    }
    if (table === "key" && inKeyTableAssign.test(line)) return true;
    if (table !== null) continue;
    if (dotted.test(line)) return true;
    const inline = line.match(inlineStart);
    if (inline && inlineTopKeys(inline[1]).includes(CONTEXT7.name)) return true;
  }
  return false;
}

/** Primeira linha que usa `context7` como chave, numa forma qualquer (já sem comentários). */
function tomlContext7KeyLine(text) {
  const name = `["']?${CONTEXT7.name}["']?`;
  const inHeader = new RegExp(`[\\[.]\\s*${name}\\s*[.\\]]`);
  const asKey = new RegExp(`(^|[{,.])\\s*${name}\\s*[=.]`);
  return tomlLines(text).find((l) => (isTomlHeader(l) ? inHeader : asKey).test(l));
}

function ensureToml(file, target) {
  const text = existsSync(file) ? readFileSync(file, "utf-8") : "";
  if (tomlHasServer(text, target.key)) return false;
  const brokenHeader = tomlLines(text).find((l) => isTomlHeader(l) && !l.includes("]"));
  if (brokenHeader) {
    throw new Unrecognized(`cabeçalho de tabela sem "]" (${brokenHeader})`);
  }
  const keyLine = tomlContext7KeyLine(text);
  if (keyLine) {
    throw new Unrecognized(
      `o arquivo já usa "${CONTEXT7.name}" numa forma que não reconheço (${keyLine})`
    );
  }
  mkdirSync(dirname(file), { recursive: true });
  const eol = detectEol(text);
  const sep = text === "" || text.endsWith(eol + eol) ? "" : text.endsWith(eol) ? eol : eol + eol;
  appendFileSync(file, `${sep}${mcpSnippet(target).replace(/\n/g, eol)}`);
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
