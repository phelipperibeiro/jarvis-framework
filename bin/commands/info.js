import { findPrompt, discoverAll } from "../lib/core/scanner.js";
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

export async function info(target) {
  showBanner();

  if (!target) {
    logger.error(`${RED}❌ Uso incorreto${NC}`);
    logger.info(`${YELLOW}Uso: jarvis info <type/name>${NC}`);
    logger.info(`${DIM}Exemplo: jarvis info agent/eng.agent${NC}\n`);
    process.exit(1);
  }

  let prompt = findPrompt(target);

  if (!prompt && !target.includes("/")) {
    const all = discoverAll();
    const allPrompts = [...all.agents, ...all.skills, ...all.workflows];

    prompt = allPrompts.find((p) => p.id === target);

    if (!prompt) {
      prompt = allPrompts.find((p) => p.id.startsWith(target));
    }

    if (!prompt) {
      prompt = allPrompts.find((p) => p.id.includes(target));
    }
  }

  if (!prompt) {
    logger.error(`${RED}❌ Não encontrado: ${YELLOW}${target}${NC}`);
    logger.info(
      `${DIM}Execute: ${YELLOW}jarvis list${DIM} para ver prompts disponíveis${NC}\n`,
    );
    process.exit(1);
  }

  // Icon based on type
  const icon =
    prompt.type === "agent" ? "🤖" : prompt.type === "skill" ? "⚡" : "🔄";

  logger.info(`${CYAN}${icon} ${prompt.type.toUpperCase()}/${prompt.id}${NC}`);
  logger.info("");
  logger.info(`  ${BLUE}Nome:${NC}        ${GREEN}${prompt.name}${NC}`);
  logger.info(`  ${BLUE}Versão:${NC}      ${prompt.version}`);
  if (prompt.model) {
    logger.info(`  ${BLUE}Modelo:${NC}      ${prompt.model}`);
  }
  logger.info(`  ${BLUE}Descrição:${NC}   ${DIM}${prompt.description}${NC}`);
  logger.info(`  ${BLUE}Caminho:${NC}     ${DIM}${prompt.path}${NC}`);
  logger.info("");

  const deps = prompt.deps;
  const hasDeps = Object.values(deps).some((arr) => arr.length > 0);

  if (hasDeps) {
    logger.info(`  ${YELLOW}📦 Dependências:${NC}`);
    if (deps.rules.length)
      logger.info(
        `    ${BLUE}Rules:${NC}     ${DIM}${deps.rules.join(", ")}${NC}`,
      );
    if (deps.templates.length)
      logger.info(
        `    ${BLUE}Templates:${NC} ${DIM}${deps.templates.join(", ")}${NC}`,
      );
    if (deps.agents.length)
      logger.info(
        `    ${BLUE}Agents:${NC}    ${DIM}${deps.agents.join(", ")}${NC}`,
      );
    if (deps.skills.length)
      logger.info(
        `    ${BLUE}Skills:${NC}    ${DIM}${deps.skills.join(", ")}${NC}`,
      );
    logger.info("");
  }
}
