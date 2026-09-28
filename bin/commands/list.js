import { discoverAll } from "../lib/core/scanner.js";
import {
  showBanner,
  GREEN,
  BLUE,
  YELLOW,
  CYAN,
  DIM,
  NC,
} from "../lib/utils/ui.js";
import { logger } from "../lib/utils/logger.js";

export async function list(flags) {
  const all = discoverAll();
  const filter = flags.type || flags._?.[0];

  showBanner();

  logger.info(`${CYAN}📋 Prompts Disponíveis${NC}`);
  logger.info("");

  function printSection(title, items, emoji) {
    if (items.length === 0) return;
    logger.info(`${YELLOW}${emoji} ${title}${NC} ${DIM}(${items.length})${NC}`);
    logger.info(`${DIM}${"─".repeat(80)}${NC}`);
    for (const item of items) {
      const desc =
        item.description.length > 45
          ? item.description.slice(0, 45) + "..."
          : item.description;
      logger.info(`  ${GREEN}${item.id.padEnd(30)}${NC} ${DIM}${desc}${NC}`);
    }
    logger.info("");
  }

  if (!filter || filter === "agent")
    printSection("AGENTS", all.agents, "🤖");
  if (!filter || filter === "skill")
    printSection("SKILLS", all.skills, "⚡");
  if (!filter || filter === "workflow")
    printSection("WORKFLOWS", all.workflows, "🔄");

  const total = all.agents.length + all.skills.length + all.workflows.length;
  logger.info(`${BLUE}📦 Total: ${GREEN}${total}${BLUE} prompts disponíveis${NC}`);
  logger.info("");
  logger.info(`${DIM}Use: ${YELLOW}jarvis info <type/name>${DIM} para ver detalhes${NC}`);
  logger.info("");
}
