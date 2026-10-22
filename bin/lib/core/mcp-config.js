// MCP obrigatório (Context7) no arquivo e no formato que cada IDE lê (`jarvis init`).
// Os caminhos vêm de `getMCPTargets` (ide-config.js). Regras:
//   - arquivo ausente → cria só com o Context7;
//   - arquivo presente → acrescenta o `context7` se faltar, sem tocar nos outros servidores
//     e mantendo a indentação do JSON;
//   - o que não reconhece com segurança (JSON com comentários ou inválido, raiz ou lista de
//     servidores que não é objeto, TOML que já cita `context7` numa forma desconhecida) → não
//     mexe e devolve o trecho para a pessoa colar. O TOML não é validado por inteiro: só se
//     procura o `context7` antes de acrescentar o bloco no fim;
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

function ensureJson(file, target) {
  let data = {};
  let indent = 2;
  if (existsSync(file)) {
    const text = readFileSync(file, "utf-8").replace(/^\uFEFF/, "");
    indent = detectIndent(text);
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Unrecognized(
        `não consegui ler o JSON com segurança (comentários ou erro de sintaxe: ${err.message.split("\n")[0]})`
      );
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
  writeFileSync(file, `${JSON.stringify(data, null, indent)}\n`);
  return true;
}

/**
 * O TOML já declara o servidor? Reconhece `[mcp_servers.context7]` (com espaços e aspas),
 * `context7 = …` dentro de `[mcp_servers]`, `mcp_servers.context7 = …` e a tabela inline
 * `mcp_servers = { context7 = … }`.
 */
function tomlHasServer(text, key) {
  const name = `["']?${CONTEXT7.name}["']?`;
  const serverTable = new RegExp(`^\\[\\s*${key}\\s*\\.\\s*${name}\\s*\\]`);
  const keyTable = new RegExp(`^\\[\\s*${key}\\s*\\]`);
  const inKeyTableAssign = new RegExp(`^${name}\\s*[.=]`);
  const dotted = new RegExp(`^${key}\\s*\\.\\s*${name}\\s*[.=]`);
  const inline = new RegExp(`^${key}\\s*=\\s*\\{.*\\b${CONTEXT7.name}\\b`);
  let inKeyTable = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      if (serverTable.test(line)) return true;
      inKeyTable = keyTable.test(line);
      continue;
    }
    if (inKeyTable && inKeyTableAssign.test(line)) return true;
    if (dotted.test(line) || inline.test(line)) return true;
  }
  return false;
}

function ensureToml(file, target) {
  const text = existsSync(file) ? readFileSync(file, "utf-8") : "";
  if (tomlHasServer(text, target.key)) return false;
  if (text.includes(CONTEXT7.name)) {
    throw new Unrecognized(`o arquivo já cita "${CONTEXT7.name}" numa forma que não reconheço`);
  }
  mkdirSync(dirname(file), { recursive: true });
  const sep = text === "" || text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  appendFileSync(file, `${sep}${mcpSnippet(target)}`);
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
