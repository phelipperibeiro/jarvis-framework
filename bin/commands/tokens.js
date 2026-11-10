import { buildReport } from "../lib/core/token-report.js";
import { resolveEnvPath, loadEnv } from "../lib/env-loader.js";
import { getFrameworkRoot } from "../lib/utils/paths.js";
import { showBanner, RED, GREEN, BLUE, CYAN, DIM, NC } from "../lib/utils/ui.js";
import { logger } from "../lib/utils/logger.js";

/**
 * O que muda a medida: ARTIFACT_STYLE e RTK. A flag manda; o que faltar vem do ENV.md, se houver.
 * Sem ENV.md, vale `ai-generated` e o RTK desligado (#263). Se não dá para escolher ou ler o ENV.md
 * (dois na mesma pasta, `--ide` inválida ou sem ENV.md, `JARVIS_ENV_FILE` inexistente, ENV.md
 * ilegível), sai com 1, como o `jarvis rules sync`: medir com o padrão daria um número errado que
 * parece certo.
 */
function resolveProfile(flags) {
  const profile = {};
  if (typeof flags.artifactStyle === "string") profile.ARTIFACT_STYLE = flags.artifactStyle;
  let rtkEnabled = flags.rtk === true || flags.rtk === "true";
  if (profile.ARTIFACT_STYLE && flags.rtk !== undefined) return { profile, rtkEnabled };

  let env;
  try {
    // Sem ENV.md, o resolveEnvPath devolve o caminho da raiz, que não existe, e o loadEnv devolve {}.
    env = loadEnv(process.cwd(), resolveEnvPath(process.cwd(), flags).path);
  } catch (err) {
    logger.error(`${RED}❌ ${err.message}${NC}`);
    process.exit(1);
  }
  if (!profile.ARTIFACT_STYLE && env.ARTIFACT_STYLE) profile.ARTIFACT_STYLE = env.ARTIFACT_STYLE;
  if (flags.rtk === undefined) rtkEnabled = env.RTK_ENABLED === "true";
  return { profile, rtkEnabled };
}

const kb = (bytes) => (bytes / 1000).toFixed(1);

export async function tokens(flags) {
  const { profile, rtkEnabled } = resolveProfile(flags);
  const report = buildReport(getFrameworkRoot(), profile, { rtkEnabled });

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  showBanner();
  logger.info(`${CYAN}📏 Custo estimado no início da sessão${NC}`);
  logger.info(
    `${DIM}ARTIFACT_STYLE=${report.profile.ARTIFACT_STYLE} | RTK=${rtkEnabled ? "ligado" : "desligado"}${NC}`
  );
  logger.info(`${DIM}${report.estimate}${NC}`);
  logger.info("");
  logger.info(
    `${DIM}${"Tipo".padEnd(26)}${"Arquivos".padStart(9)}${"KB".padStart(10)}${"Tokens (≈)".padStart(13)}${NC}`
  );
  logger.info(`${DIM}${"─".repeat(58)}${NC}`);

  for (const c of report.categories) {
    logger.info(
      `${GREEN}${c.label.padEnd(26)}${NC}${String(c.files.length).padStart(9)}` +
        `${kb(c.bytes).padStart(10)}${String(c.tokens).padStart(13)}`
    );
    if (c.files[0]) {
      logger.info(
        `  ${DIM}maior: ${c.files[0].path} (${kb(c.files[0].bytes)} KB) — ${c.note}${NC}`
      );
    }
  }

  logger.info(`${DIM}${"─".repeat(58)}${NC}`);
  logger.info(
    `${BLUE}${"Total".padEnd(26)}${NC}${"".padStart(9)}` +
      `${kb(report.total.bytes).padStart(10)}${String(report.total.tokens).padStart(13)}`
  );
  logger.info("");
}
