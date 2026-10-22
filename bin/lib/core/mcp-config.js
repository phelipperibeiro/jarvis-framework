// MCP obrigatório (Context7) no arquivo e no formato que cada IDE lê (`jarvis init`).
// Os caminhos vêm de `getMCPTargets` (ide-config.js). Regras:
//   - arquivo ausente → cria só com o Context7;
//   - arquivo presente → acrescenta o `context7` se faltar, sem tocar nos outros servidores;
//   - JSON inválido → não mexe e reporta o erro;
//   - config só global (`~/…`) → não grava fora do workspace: devolve o trecho para a pessoa colar.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { getMCPTargets } from "../config/ide-config.js";

export const CONTEXT7 = Object.freeze({
  name: "context7",
  command: "npx",
  args: Object.freeze(["-y", "@upstash/context7-mcp"]),
});

/** Item do servidor no formato do alvo. */
function serverEntry(style) {
  if (style === "opencode") {
    return { type: "local", command: [CONTEXT7.command, ...CONTEXT7.args], enabled: true };
  }
  const entry = { command: CONTEXT7.command, args: [...CONTEXT7.args] };
  return style === "stdio" ? { type: "stdio", ...entry } : entry;
}

/** Trecho pronto para colar (usado nos alvos globais e na mensagem de erro). */
export function mcpSnippet(target) {
  if (target.format === "toml") {
    return `[${target.key}.${CONTEXT7.name}]\ncommand = "${CONTEXT7.command}"\nargs = [${CONTEXT7.args.map((a) => `"${a}"`).join(", ")}]\n`;
  }
  return `${JSON.stringify({ [target.key]: { [CONTEXT7.name]: serverEntry(target.style) } }, null, 2)}\n`;
}

function ensureJson(file, target) {
  let data = {};
  if (existsSync(file)) {
    try {
      data = JSON.parse(readFileSync(file, "utf-8"));
    } catch (err) {
      throw new Error(`JSON inválido (${err.message.split("\n")[0]})`);
    }
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("o arquivo não é um objeto JSON");
    }
  } else if (target.style === "opencode") {
    data.$schema = "https://opencode.ai/config.json";
  }
  const servers = data[target.key] ?? {};
  if (Object.prototype.hasOwnProperty.call(servers, CONTEXT7.name)) return false;
  data[target.key] = { ...servers, [CONTEXT7.name]: serverEntry(target.style) };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return true;
}

function ensureToml(file, target) {
  const header = new RegExp(`^\\[${target.key}\\.${CONTEXT7.name}\\]\\s*$`, "m");
  const text = existsSync(file) ? readFileSync(file, "utf-8") : "";
  if (header.test(text)) return false;
  mkdirSync(dirname(file), { recursive: true });
  const sep = text === "" ? "" : text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  appendFileSync(file, `${sep}${mcpSnippet(target)}`);
  return true;
}

/**
 * Garante o Context7 na configuração de MCP da IDE.
 * @param {string} workspaceDir - pasta que contém o `$IDE/`
 * @param {string} ide - slug da IDE
 * @returns {{ written: string[], present: string[], manual: {path: string, snippet: string}[],
 *   errors: string[] }} caminhos relativos ao workspace (ou com `~/`, nos globais)
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
      result.errors.push(`${target.path}: ${err.message}`);
    }
  }
  return result;
}
