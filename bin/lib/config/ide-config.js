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
  },
  {
    name: "Claude Code",
    value: "claude",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "🔌",
  },
  {
    name: "Cursor",
    value: "cursor",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "💻",
  },
  {
    name: "Codex (OpenAI)",
    value: "codex",
    supported: true,
    workflowsFolder: DEFAULT_WORKFLOWS_FOLDER,
    icon: "🔮",
  },
  {
    name: "OpenCode",
    value: "opencode",
    supported: true,
    workflowsFolder: COMMANDS_FOLDER,
    icon: "⚡",
  },
  {
    name: "Gemini CLI / Antigravity (Google)",
    value: "gemini",
    folderName: "agents",
    supported: true,
    workflowsFolder: DEFAULT_WORKFLOWS_FOLDER,
    icon: "🌐",
  },
  {
    name: "Kiro (AWS)",
    value: "kiro",
    supported: true,
    workflowsFolder: STEERING_FOLDER,
    icon: "☁️",
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
    throw new Error(
      `IDE config inválida: 'value' é obrigatório (string) para ${config.name}`,
    );
  }
  if (typeof config.supported !== "boolean") {
    throw new Error(
      `IDE config inválida: 'supported' é obrigatório (boolean) para ${config.name}`,
    );
  }
  if (!config.workflowsFolder || typeof config.workflowsFolder !== "string") {
    throw new Error(
      `IDE config inválida: 'workflowsFolder' é obrigatório (string) para ${config.name}`,
    );
  }
  // Validar valores conhecidos
  const knownFolders = [DEFAULT_WORKFLOWS_FOLDER, COMMANDS_FOLDER, STEERING_FOLDER];
  if (!knownFolders.includes(config.workflowsFolder)) {
    logger.warn(
      `⚠️  Atenção: IDE '${config.name}' usa workflowsFolder customizado: '${config.workflowsFolder}'`,
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
 * Limpa o cache (útil para testes)
 * @private
 */
export function _clearCache() {
  _ideConfigCache = null;
}
