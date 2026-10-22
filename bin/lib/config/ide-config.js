/**
 * @fileoverview Configuração centralizada de IDEs suportadas
 * @module config/ide-config
 */

import { logger } from "../utils/logger.js";

/** @constant {string} Pasta padrão para workflows */
export const DEFAULT_WORKFLOWS_FOLDER = "workflows";

/** @constant {string} Pasta alternativa para comandos */
export const COMMANDS_FOLDER = "commands";

/** @constant {string} Pasta de steering files (Kiro) */
export const STEERING_FOLDER = "steering";

/**
 * @typedef {Object} IDEConfig
 * @property {string} name - Nome completo da IDE
 * @property {string} value - Identificador único (slug)
 * @property {boolean} supported - Se a IDE é suportada
 * @property {string} workflowsFolder - Nome da pasta para workflows/commands
 * @property {string} [folderName] - Nome real da pasta no filesystem (sem o ponto). Defaults para value.
 * @property {string} [icon] - Emoji/ícone da IDE (opcional)
 * @property {ReadonlyArray<MCPTarget>} mcp - Onde a IDE lê a configuração de MCP
 * @property {string} mcpNote - O que falta para o servidor ficar ativo depois de gravado
 */

/**
 * Arquivo de MCP que a IDE lê. Fonte: documentação oficial de cada IDE (conferida em 2026-10).
 * @typedef {Object} MCPTarget
 * @property {string} path - Relativo ao workspace; com `~/`, é da pasta do usuário (global)
 * @property {"json"|"toml"} format
 * @property {"mcpServers"|"mcp"|"mcp_servers"} key - Chave raiz dos servidores
 * @property {"stdio"|"opencode"|"plain"} style - Formato do item do servidor
 * @property {boolean} [global] - Só existe config global: o init não grava, só orienta
 */

/**
 * Lista de IDEs suportadas (source of truth)
 * @type {ReadonlyArray<Readonly<IDEConfig>>}
 */
export const IDES = Object.freeze([
  {
    name: "Windsurf",
    value: "windsurf",
    supported: true,
    workflowsFolder: DEFAULT_WORKFLOWS_FOLDER,
    icon: "🤖",
    mcp: [
      {
        path: "~/.config/devin/mcp_config.json",
        format: "json",
        key: "mcpServers",
        style: "plain",
        global: true,
      },
      {
        path: "~/.codeium/windsurf/mcp_config.json",
        format: "json",
        key: "mcpServers",
        style: "plain",
        global: true,
      },
    ],
    mcpNote:
      "A Windsurf só tem config global de MCP: inclua o servidor no arquivo indicado e ative-o no painel MCP do Cascade.",
  },
  {
    name: "Claude Code",
    value: "claude",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "🔌",
    mcp: [{ path: ".mcp.json", format: "json", key: "mcpServers", style: "stdio" }],
    mcpNote: "Reinicie o Claude Code e aprove o servidor do .mcp.json quando ele perguntar.",
  },
  {
    name: "Cursor",
    value: "cursor",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "💻",
    mcp: [{ path: ".cursor/mcp.json", format: "json", key: "mcpServers", style: "plain" }],
    mcpNote: "Recarregue o Cursor; o servidor aparece em Settings → MCP.",
  },
  {
    name: "Codex (OpenAI)",
    value: "codex",
    supported: true,
    workflowsFolder: DEFAULT_WORKFLOWS_FOLDER,
    icon: "🔮",
    mcp: [{ path: ".codex/config.toml", format: "toml", key: "mcp_servers", style: "plain" }],
    mcpNote:
      "O Codex só lê o .codex/config.toml de projetos confiáveis (trusted): confie no projeto e reinicie o Codex.",
  },
  {
    name: "OpenCode",
    value: "opencode",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "⚡",
    mcp: [{ path: "opencode.json", format: "json", key: "mcp", style: "opencode" }],
    mcpNote: "Reinicie o OpenCode para carregar o servidor do opencode.json.",
  },
  {
    name: "Gemini CLI / Antigravity (Google)",
    value: "gemini",
    folderName: "agents",
    supported: true,
    workflowsFolder: DEFAULT_WORKFLOWS_FOLDER,
    icon: "🌐",
    mcp: [
      { path: ".gemini/settings.json", format: "json", key: "mcpServers", style: "plain" },
      { path: ".agents/mcp_config.json", format: "json", key: "mcpServers", style: "plain" },
    ],
    mcpNote:
      "Gemini CLI: confie na pasta (gemini trust) e reinicie. Antigravity: use Refresh em Customizations (ou /mcp no CLI).",
  },
  {
    name: "Kiro (AWS)",
    value: "kiro",
    supported: true,
    workflowsFolder: STEERING_FOLDER,
    icon: "☁️",
    mcp: [{ path: ".kiro/settings/mcp.json", format: "json", key: "mcpServers", style: "plain" }],
    mcpNote: "O Kiro reconecta os servidores ao salvar o arquivo; confira no painel MCP.",
  },
]);

/** @type {Map<string, IDEConfig> | null} */
let _ideConfigCache = null;

/**
 * Inicializa o cache de configurações (O(n) uma vez, depois O(1))
 * @private
 * @returns {Map<string, IDEConfig>}
 */
function _initCache() {
  if (_ideConfigCache === null) {
    _ideConfigCache = new Map();
    for (const ide of IDES) {
      _validateIDEConfig(ide);
      _ideConfigCache.set(ide.value, ide);
    }
  }
  return _ideConfigCache;
}

/**
 * Valida schema de configuração de IDE
 * @private
 * @param {IDEConfig} config
 * @throws {Error} Se a configuração for inválida
 */
function _validateIDEConfig(config) {
  if (!config.name || typeof config.name !== "string") {
    throw new Error(`IDE config inválida: 'name' é obrigatório (string)`);
  }
  if (!config.value || typeof config.value !== "string") {
    throw new Error(`IDE config inválida: 'value' é obrigatório (string) para ${config.name}`);
  }
  if (typeof config.supported !== "boolean") {
    throw new Error(`IDE config inválida: 'supported' é obrigatório (boolean) para ${config.name}`);
  }
  if (!config.workflowsFolder || typeof config.workflowsFolder !== "string") {
    throw new Error(
      `IDE config inválida: 'workflowsFolder' é obrigatório (string) para ${config.name}`
    );
  }
  // Validar valores conhecidos
  const knownFolders = [DEFAULT_WORKFLOWS_FOLDER, COMMANDS_FOLDER, STEERING_FOLDER];
  if (!knownFolders.includes(config.workflowsFolder)) {
    logger.warn(
      `⚠️  Atenção: IDE '${config.name}' usa workflowsFolder customizado: '${config.workflowsFolder}'`
    );
  }
}

/**
 * Busca configuração de IDE por slug (O(1) com cache)
 * @param {string} ideValue - Slug da IDE (ex: "windsurf", "claude")
 * @returns {IDEConfig | undefined} Configuração da IDE ou undefined
 * @example
 * const config = getIDEConfig("windsurf");
 * // config.workflowsFolder === "workflows"
 */
export function getIDEConfig(ideValue) {
  if (!ideValue || typeof ideValue !== "string") {
    return undefined;
  }
  const cache = _initCache();
  return cache.get(ideValue);
}

/**
 * Retorna todas as IDEs suportadas
 * @returns {ReadonlyArray<Readonly<IDEConfig>>}
 */
export function getSupportedIDEs() {
  return IDES.filter((ide) => ide.supported);
}

/**
 * Retorna lista de slugs de IDEs suportadas
 * @returns {string[]}
 * @example
 * getIDEValues() // ["windsurf", "claude", "cursor", ...]
 */
export function getIDEValues() {
  return getSupportedIDEs().map((ide) => ide.value);
}

/**
 * Valida se uma IDE é suportada
 * @param {string} ideValue - Slug da IDE
 * @returns {boolean}
 * @example
 * isIDESupported("windsurf") // true
 * isIDESupported("vscode") // false
 */
export function isIDESupported(ideValue) {
  const config = getIDEConfig(ideValue);
  return config !== undefined && config.supported === true;
}

/**
 * Formata lista de IDEs para exibição no CLI
 * @param {string} [separator=" | "] - Separador entre IDEs
 * @returns {string}
 * @example
 * formatIDEsList() // "🤖 Windsurf | 🔌 Claude Code | ..."
 */
export function formatIDEsList(separator = "  |  ") {
  return getSupportedIDEs()
    .map((ide) => `${ide.icon || "•"} ${ide.name}`)
    .join(separator);
}

/**
 * Retorna o nome da pasta no filesystem para uma IDE (sem o ponto)
 * Usa folderName se definido, senão usa value.
 * @param {string} ideValue - Slug da IDE
 * @returns {string} Nome da pasta (ex: "windsurf", "agents" para gemini)
 * @example
 * getIDEFolder("windsurf") // "windsurf"
 * getIDEFolder("gemini")   // "agents"
 * getIDEFolder("unknown")  // "unknown" (fallback)
 */
export function getIDEFolder(ideValue) {
  const config = getIDEConfig(ideValue);
  return config?.folderName || ideValue;
}

/**
 * Retorna a pasta de workflows para uma IDE (com fallback)
 * @param {string} ideValue - Slug da IDE
 * @returns {string} Nome da pasta (ex: "workflows", "commands")
 * @example
 * getWorkflowsFolder("windsurf") // "workflows"
 * getWorkflowsFolder("claude") // "commands"
 * getWorkflowsFolder("gemini") // "workflows"
 * getWorkflowsFolder("unknown") // "workflows" (fallback)
 */
export function getWorkflowsFolder(ideValue) {
  const config = getIDEConfig(ideValue);
  return config?.workflowsFolder || DEFAULT_WORKFLOWS_FOLDER;
}

/**
 * Arquivos de MCP da IDE (lista vazia para IDE desconhecida)
 * @param {string} ideValue - Slug da IDE
 * @returns {ReadonlyArray<MCPTarget>}
 */
export function getMCPTargets(ideValue) {
  return getIDEConfig(ideValue)?.mcp || [];
}

/**
 * Limpa o cache (útil para testes)
 * @private
 */
export function _clearCache() {
  _ideConfigCache = null;
}
