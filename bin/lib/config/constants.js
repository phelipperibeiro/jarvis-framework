/**
 * @fileoverview Constantes globais do sistema
 * @module config/constants
 */

/** @constant {string} Nome do pacote NPM */
export const CLI_NAME = "jarvis-framework";

/** @constant {string} Nome do arquivo de lock */
export const LOCK_FILE = "jarvis-lock.json";

/**
 * Diretórios que devem ser sincronizados do framework para a IDE
 * @constant {ReadonlyArray<string>}
 */
export const SYNC_DIRS = Object.freeze([
  "agents",
  "skills",
  "workflows",
  "templates",
  "rules",
  "scripts",
]);

/**
 * Caminhos que saíram do framework e são removidos das instalações que atualizam.
 * Lista explícita, relativa à pasta da IDE (ex.: `.claude/`): o `init` nunca varre
 * nem apaga nada fora dela. Para uma remoção futura, acrescente o caminho aqui.
 * @constant {ReadonlyArray<string>}
 */
export const OBSOLETE_PATHS = Object.freeze([
  "skills/prod-specs/references",
  "skills/prod-specs/templates",
  "skills/prod-specs/rules",
]);

/**
 * Arquivos da raiz que devem ser sincronizados
 * @constant {ReadonlyArray<string>}
 */
export const SYNC_ROOT_FILES = Object.freeze(["taxonomy.md", "AGENTS.md", "members.md"]);

/**
 * Mapeamento de model do Jarvis para formato OpenCode (provider/model-id)
 * @constant {Readonly<Record<string, string>>}
 */
export const OPENCODE_MODEL_MAP = Object.freeze({
  // Anthropic — shorthands usados no Jarvis
  opus: "anthropic/claude-opus-4-6",
  sonnet: "anthropic/claude-sonnet-4-6",
  haiku: "anthropic/claude-haiku-4-5-20250414",
  // Anthropic — IDs completos
  "claude-opus-4-6-20250529": "anthropic/claude-opus-4-6",
  "claude-sonnet-4-6-20250514": "anthropic/claude-sonnet-4-6",
  "claude-sonnet-4-20250514": "anthropic/claude-sonnet-4-6",
  "claude-haiku-4-5-20250414": "anthropic/claude-haiku-4-5-20250414",
  // OpenAI
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "gpt-4.1": "openai/gpt-4.1",
  "gpt-4.1-mini": "openai/gpt-4.1-mini",
  "gpt-4.1-nano": "openai/gpt-4.1-nano",
  "o3": "openai/o3",
  "o3-mini": "openai/o3-mini",
  "o4-mini": "openai/o4-mini",
  // Google
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.0-flash": "google/gemini-2.0-flash",
});

/**
 * Permissões padrão para agents OpenCode
 * @constant {Readonly<Record<string, string>>}
 */
export const OPENCODE_DEFAULT_PERMISSIONS = Object.freeze({
  edit: "allow",
  bash: "allow",
  read: "allow",
  glob: "allow",
  grep: "allow",
  task: "allow",
});

/**
 * Campos de frontmatter Jarvis-only que devem ser removidos para OpenCode commands
 * @constant {ReadonlyArray<string>}
 */
export const OPENCODE_STRIP_FIELDS = Object.freeze([
  "auto_execution_mode",
  "rules_file",
  "template_file",
  "model_tier",
  "model_justification",
  "recommended_model",
  "env_file",
  "globs",
]);

/**
 * Campos de frontmatter Jarvis-only que devem ser removidos para steering files Kiro
 * @constant {ReadonlyArray<string>}
 */
export const KIRO_STRIP_FIELDS = Object.freeze([
  "trigger",
  "auto_execution_mode",
  "rules_file",
  "template_file",
  "model_tier",
  "model_justification",
  "recommended_model",
  "env_file",
  "globs",
  "agent",
  "allowed-tools",
  "disable-model-invocation",
  "compatibility",
  "license",
  "metadata",
  "argument-hint",
]);

/**
 * Mapeamento de HUB Jarvis para fileMatchPattern do Kiro
 * Usado para gerar steering files de rules com inclusion: fileMatch
 * @constant {Readonly<Record<string, string>>}
 */
export const KIRO_HUB_FILE_PATTERNS = Object.freeze({
  FRONTEND: "**/*.tsx,**/*.ts,**/*.jsx,**/*.js,**/*.css,**/*.scss",
  BACKEND: "**/*.ts,**/*.js",
  QA: "**/*.test.ts,**/*.spec.ts,**/*.cy.ts,**/*.test.js,**/*.spec.js",
  DATA: "**/*.py,**/*.sql,**/*.ipynb",
  AI: "**/*.ts,**/*.py",
});

