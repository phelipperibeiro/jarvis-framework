import { execSync } from "node:child_process";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { GREEN, RED, YELLOW, DIM, NC } from "../lib/utils/ui.js";

function commandExists(cmd) {
  try {
    execSync(`which ${cmd} 2>/dev/null`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export async function installRtk(flags) {
  configureFromFlags(flags);

  logger.info("");
  logger.info(`${GREEN}🦀 RTK — Rust Token Killer${NC}`);
  logger.info(`${DIM}   Proxy CLI que economiza 60-90% de tokens em outputs de shell${NC}`);
  logger.info("");

  // 1. Verificar se RTK já está instalado
  if (commandExists("rtk")) {
    try {
      const version = execSync("rtk --version", { encoding: "utf-8" }).trim();
      logger.info(`${GREEN}✓ RTK já instalado: ${version}${NC}`);
      logger.info(`${DIM}  Para atualizar: cargo install rtk --force${NC}`);
      logger.info("");
      return;
    } catch {}
  }

  // 2. Verificar se cargo está disponível
  if (!commandExists("cargo")) {
    logger.info(`${YELLOW}⚠ cargo não encontrado — instalando Rust via rustup...${NC}`);
    logger.info("");
    try {
      execSync('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y', {
        stdio: "inherit",
        shell: true,
      });
      // Atualizar PATH para a sessão atual
      const home = process.env.HOME || process.env.USERPROFILE;
      process.env.PATH = `${home}/.cargo/bin:${process.env.PATH}`;
    } catch (err) {
      logger.error(`${RED}✗ Falha ao instalar Rust: ${err.message}${NC}`);
      logger.info(`${DIM}  Instale manualmente: https://rustup.rs${NC}`);
      logger.info("");
      process.exit(1);
    }

    if (!commandExists("cargo")) {
      logger.error(`${RED}✗ cargo não encontrado após instalação do Rust${NC}`);
      logger.info(`${DIM}  Reinicie o terminal e tente novamente: jarvis install-rtk${NC}`);
      logger.info("");
      process.exit(1);
    }

    logger.info(`${GREEN}✓ Rust instalado${NC}`);
    logger.info("");
  }

  // 3. Instalar RTK via cargo
  logger.info(`${YELLOW}⏳ Instalando RTK via cargo (pode levar alguns minutos)...${NC}`);
  logger.info("");
  try {
    execSync("cargo install rtk", { stdio: "inherit" });
  } catch (err) {
    logger.error(`${RED}✗ Falha ao instalar RTK: ${err.message}${NC}`);
    logger.info("");
    process.exit(1);
  }

  // 4. Verificar instalação
  if (commandExists("rtk")) {
    const version = execSync("rtk --version", { encoding: "utf-8" }).trim();
    logger.info("");
    logger.info(`${GREEN}✓ RTK instalado com sucesso: ${version}${NC}`);
    logger.info("");
    logger.info(`${YELLOW}Próximo passo:${NC}`);
    logger.info(`  Execute ${GREEN}jarvis init${NC} (ou atualize o ENV.md) para ativar ${GREEN}RTK_ENABLED=true${NC}`);
    logger.info(`  A rule de economia de tokens será ativada automaticamente.`);
    logger.info("");
  } else {
    logger.error(`${RED}✗ RTK não encontrado no PATH após instalação${NC}`);
    logger.info(`${DIM}  Reinicie o terminal e verifique: rtk --version${NC}`);
    logger.info("");
    process.exit(1);
  }
}
