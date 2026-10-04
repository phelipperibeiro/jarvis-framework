import { buildReport } from "../lib/core/token-report.js";
import { resolveEnvPath, loadEnv } from "../lib/env-loader.js";
import { getFrameworkRoot } from "../lib/utils/paths.js";
import {
  showBanner,
  RED,
  GREEN,
  BLUE,
  YELLOW,
  CYAN,
  DIM,
  NC,
} from "../lib/utils/ui.js";
import { logger } from "../lib/utils/logger.js";

const AXES = ["HUB", "POSITION", "AREA", "SQUAD"];

/** Perfil: as flags (`--hub` etc.) mandam; o que faltar vem do ENV.md. */
function resolveProfile(flags) {
  const profile = {};
  for (const axis of AXES) {
    const value = flags[axis.toLowerCase()];
    if (typeof value === "string") profile[axis] = value;
  }

  let rtkEnabled = flags.rtk === true || flags.rtk === "true";
  // O ENV.md só entra quando falta algum eixo; com os 4 eixos nas flags, o RTK vem só da flag.
  if (AXES.some((axis) => !profile[axis])) {
    try {
      const { path } = resolveEnvPath(process.cwd(), flags);
      const env = loadEnv(process.cwd(), path);
      for (const axis of AXES) {
        if (!profile[axis] && env[axis]) profile[axis] = env[axis];
      }
      if (flags.rtk === undefined) rtkEnabled = env.RTK_ENABLED === "true";
    } catch {
      // sem ENV.md: valem só as flags
    }
  }

  const missing = AXES.filter((axis) => !profile[axis]);
  return { profile, rtkEnabled, missing };
}

const kb = (bytes) => (bytes / 1000).toFixed(1);

export async function tokens(flags) {
  const { profile, rtkEnabled, missing } = resolveProfile(flags);

  if (missing.length > 0) {
    logger.error(`${RED}❌ Perfil incompleto: faltam ${missing.join(", ")}${NC}`);
    logger.info(
      `${YELLOW}Uso: jarvis tokens [--hub X --position Y --area Z --squad W] [--rtk] [--json]${NC}`,
    );
    logger.info(`${DIM}Sem flags, o perfil vem do ENV.md do workspace (use --ide <ide> se houver mais de um).${NC}\n`);
    process.exit(1);
  }

  const report = buildReport(getFrameworkRoot(), profile, { rtkEnabled });

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  showBanner();
  logger.info(`${CYAN}📏 Custo estimado no início da sessão${NC}`);
  logger.info(
    `${DIM}Perfil: HUB=${profile.HUB} | POSITION=${profile.POSITION} | AREA=${profile.AREA} | SQUAD=${profile.SQUAD}` +
      ` | RTK=${rtkEnabled ? "ligado" : "desligado"}${NC}`,
  );
  logger.info(`${DIM}${report.estimate}${NC}`);
  logger.info("");
  logger.info(`${DIM}${"Tipo".padEnd(26)}${"Arquivos".padStart(9)}${"KB".padStart(10)}${"Tokens (≈)".padStart(13)}${NC}`);
  logger.info(`${DIM}${"─".repeat(58)}${NC}`);

  for (const c of report.categories) {
    logger.info(
      `${GREEN}${c.label.padEnd(26)}${NC}${String(c.files.length).padStart(9)}` +
        `${kb(c.bytes).padStart(10)}${String(c.tokens).padStart(13)}`,
    );
    if (c.files[0]) {
      logger.info(`  ${DIM}maior: ${c.files[0].path} (${kb(c.files[0].bytes)} KB) — ${c.note}${NC}`);
    }
  }

  logger.info(`${DIM}${"─".repeat(58)}${NC}`);
  logger.info(
    `${BLUE}${"Total".padEnd(26)}${NC}${"".padStart(9)}` +
      `${kb(report.total.bytes).padStart(10)}${String(report.total.tokens).padStart(13)}`,
  );
  logger.info("");
}
