import { execSync } from "node:child_process";

// O Jarvis é instalado só global (npm install -g); o postinstall só dá as dicas.
// A atualização dos assets de um projeto tem um caminho só: jarvis init --upgrade, dentro dele.
const { logger } = await import("./lib/utils/logger.js");
logger.info(`
  jarvis-ai-framework instalado.
  No projeto: jarvis init --ide {ide}   (ou jarvis init --upgrade para atualizar os assets)
`);

// ── Sugestão RTK (sempre, se rtk não estiver instalado) ─────────────────────
try {
  execSync("rtk gain --help 2>/dev/null", { stdio: "pipe" });
} catch {
  logger.info(`  💡 Dica: instale o RTK para economizar 60-90% dos tokens de shell.`);
  logger.info(`     jarvis install-rtk\n`);
}
