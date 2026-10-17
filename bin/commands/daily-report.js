import { isAbsolute, join, relative } from "node:path";
import { scanSessions, parseDays } from "../lib/core/session-scan.js";
import { resolveEnvPath, loadEnv } from "../lib/env-loader.js";
import { logger } from "../lib/utils/logger.js";
import { GREEN, YELLOW, CYAN, DIM, NC } from "../lib/utils/ui.js";

const USAGE = "Uso: jarvis daily-report [--days 1|3|7|15|30|60] [--json]";
const DEFAULTS = {
  DOCS_FOLDER: "docs",
  JARVIS_DOCS: "$DOCS_FOLDER/jarvis",
  ENG_DOCS: "$JARVIS_DOCS/engineering",
  SESSIONS_DIR: ".jarvis/sessions",
};

/** Expande `$VAR` com os valores do ENV (e os padrões acima), em até 5 passadas. */
export function expandVars(value, env) {
  let out = value;
  for (let i = 0; i < 5 && /\$[A-Z_]+/.test(out); i++) {
    out = out.replace(/\$([A-Z_][A-Z0-9_]*)/g, (m, name) => env[name] ?? DEFAULTS[name] ?? m);
  }
  return out;
}

function resolveDir(root, value) {
  return isAbsolute(value) ? value : join(root, value);
}

/**
 * Lê as sessões do workspace e devolve o JSON do relatório. Separado de `dailyReport` para ser testável.
 * @param {Record<string, unknown>} flags - `days`, `ide`, `env-file`
 * @param {string} [cwd]
 * @param {Date} [now]
 * @returns {{ code: number, json?: object, lines?: string[] }}
 */
export function runDailyReport(flags = {}, cwd = process.cwd(), now = new Date()) {
  const parsed = parseDays(flags.days);
  if (parsed.error) return { code: 1, lines: [`❌ ${parsed.error}`, USAGE] };

  let envPath;
  let root;
  try {
    ({ path: envPath, root } = resolveEnvPath(cwd, flags));
  } catch (err) {
    return { code: 1, lines: [`❌ ${err.message}`, USAGE] };
  }
  root = root || cwd;
  const env = { ...DEFAULTS, ...loadEnv(cwd, envPath) };

  const sessionsDir = join(resolveDir(root, expandVars(env.SESSIONS_DIR, env)), "eng");
  const reportsDir = join(resolveDir(root, expandVars(env.ENG_DOCS, env)), "daily-reports");

  const result = scanSessions(sessionsDir, { days: parsed.days, now });
  const reportPathAbs = join(reportsDir, result.fileName);
  return {
    code: 0,
    json: {
      ...result,
      workspace: root,
      sessionsDir: relative(root, sessionsDir) || ".",
      reportPath: relative(root, reportPathAbs),
      reportPathAbs,
    },
  };
}

export async function dailyReport(flags) {
  const { code, json, lines } = runDailyReport(flags);
  if (code !== 0) {
    for (const line of lines) logger.error(line);
    process.exit(code);
  }

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(json, null, 2)}\n`);
    return;
  }

  logger.info(`${CYAN}🗓️  Registros dos últimos ${json.days} dia(s)${NC}`);
  logger.info(`${DIM}Janela: ${json.window.from} a ${json.window.to} (fuso local)${NC}`);
  logger.info(
    `Sessões lidas: ${json.sessionsScanned} · na janela: ${json.sessionsInWindow} · dias com registro: ${json.byDate.length}`
  );
  logger.info(
    json.alerts.length
      ? `${YELLOW}⚠️  ${json.alerts.length} sessão(ões) sem daily.md: ${json.alerts.map((a) => a.key).join(", ")}${NC}`
      : `${GREEN}✅ Todas as sessões da janela têm daily.md${NC}`
  );
  for (const w of json.warnings) logger.info(`${DIM}aviso: ${w}${NC}`);
  logger.info(`${DIM}Relatório (escrito pelo /eng.daily-report): ${json.reportPath}${NC}`);
}
