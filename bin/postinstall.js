import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cwd = process.env.INIT_CWD || process.cwd();
const lockPath = join(cwd, "jarvis-lock.json");

// ── Sincronizar assets para projetos com jarvis-lock.json ───────────────────
if (existsSync(lockPath)) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
    const { syncAssets } = await import("./lib/core/sync-engine.js");
    const { getWorkflowsFolder } = await import("./lib/config/ide-config.js");
    const { logger } = await import("./lib/utils/logger.js");
    logger.info(`\n  jarvis-framework — syncing to .${lock.ide}/\n`);
    const result = syncAssets(cwd, lock.ide, {
      force: true,
      workflowsFolder: getWorkflowsFolder(lock.ide),
    });
    logger.info(`  ${result.copied.length} items synced.\n`);
  } catch {}
} else {
  const { logger } = await import("./lib/utils/logger.js");
  logger.info(`
  jarvis-framework installed.
  Run: npx jarvis init --ide windsurf
`);
}

// ── Sugestão RTK (sempre, se rtk não estiver instalado) ─────────────────────
try {
  execSync("rtk gain --help 2>/dev/null", { stdio: "pipe" });
} catch {
  const { logger } = await import("./lib/utils/logger.js");
  logger.info(`  💡 Dica: instale o RTK para economizar 60-90% dos tokens de shell.`);
  logger.info(`     npx jarvis install-rtk\n`);
}
