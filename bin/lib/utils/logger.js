/**
 * @fileoverview Sistema de logging centralizado
 * @module utils/logger
 */

/**
 * @typedef {'debug' | 'info' | 'warn' | 'error' | 'silent'} LogLevel
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 99,
};

let currentLevel = LOG_LEVELS.info;
let isTestMode = false;

/**
 * Define o nível mínimo de log
 * @param {LogLevel} level
 */
export function setLogLevel(level) {
  currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

/**
 * Ativa modo de teste (silencia todos os logs)
 * @param {boolean} enabled
 */
export function setTestMode(enabled) {
  isTestMode = enabled;
}

/**
 * Verifica se deve logar baseado no nível
 * @private
 * @param {number} level
 * @returns {boolean}
 */
function shouldLog(level) {
  return !isTestMode && level >= currentLevel;
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de debug (desenvolvimento)
   * @param {...any} args
   */
  debug(...args) {
    if (shouldLog(LOG_LEVELS.debug)) {
      console.log(...args);
    }
  },

  /**
   * Log informativo
   * @param {...any} args
   */
  info(...args) {
    if (shouldLog(LOG_LEVELS.info)) {
      console.log(...args);
    }
  },

  /**
   * Log de aviso
   * @param {...any} args
   */
  warn(...args) {
    if (shouldLog(LOG_LEVELS.warn)) {
      console.warn(...args);
    }
  },

  /**
   * Log de erro
   * @param {...any} args
   */
  error(...args) {
    if (shouldLog(LOG_LEVELS.error)) {
      console.error(...args);
    }
  },
};

/**
 * Detecta flags de verbosidade e configura logger
 * @param {Object} flags - Flags do CLI
 */
export function configureFromFlags(flags) {
  if (flags.quiet || flags.q) {
    setLogLevel("error");
  } else if (flags.verbose || flags.v) {
    setLogLevel("debug");
  } else if (flags.silent) {
    setLogLevel("silent");
  }
}
