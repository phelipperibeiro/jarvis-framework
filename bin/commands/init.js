import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { syncAssets } from "../lib/core/sync-engine.js";
import { discoverAll } from "../lib/core/scanner.js";
import {
  IDES,
  getIDEConfig,
  getIDEFolder,
  getWorkflowsFolder,
  isIDESupported,
} from "../lib/config/ide-config.js";
import {
  showBanner,
  RED,
  GREEN,
  BLUE,
  YELLOW,
  CYAN,
  DIM,
  BOLD,
  NC,
} from "../lib/utils/ui.js";
import { getPackageInfo } from "../lib/utils/paths.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

export async function init(flags) {
  configureFromFlags(flags);

  const cwd = process.cwd();

  showBanner();

  let ide;
  if (flags.ide) {
    if (!isIDESupported(flags.ide)) {
      logger.error(`${RED}❌ IDE inválida: ${flags.ide}${NC}`);
      logger.info(
        `${YELLOW}IDEs disponíveis: ${IDES.filter((i) => i.supported).map((i) => i.value).join(", ")}${NC}\n`,
      );
      return;
    }
    ide = flags.ide;
    const ideObj = getIDEConfig(ide);
    logger.info(`${GREEN}✓ IDE: ${ideObj.name}${NC}\n`);
  } else {
    logger.info(`${YELLOW}Qual IDE você está usando?${NC}`);
    logger.info("");

    IDES.forEach((ideObj, index) => {
      if (ideObj.supported) {
        logger.info(`  ${GREEN}${index + 1}${NC}) ${ideObj.name}`);
      } else {
        logger.info(
          `  ${DIM}${index + 1}) ${ideObj.name} (não suportado)${NC}`,
        );
      }
    });
    logger.info("");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let choice;
    while (true) {
      choice = await ask(
        rl,
        `${BLUE}Digite o número da sua escolha (1-${IDES.length}): ${NC}`,
      );
      const choiceNum = parseInt(choice, 10);

      if (choiceNum >= 1 && choiceNum <= IDES.length) {
        const selectedIde = IDES[choiceNum - 1];
        if (selectedIde.supported) {
          ide = selectedIde.value;
          logger.info("");
          logger.info(
            `${GREEN}Interface selecionada: ${selectedIde.name}${NC}`,
          );
          logger.info(`${DIM}Pasta destino: .${getIDEFolder(ide)}${NC}`);
          logger.info("");
          break;
        } else {
          logger.info(`${DIM}Esta interface ainda não é suportada.${NC}\n`);
        }
      } else {
        logger.info(
          `${RED}Opção inválida. Por favor, escolha um número entre 1 e ${IDES.length}.${NC}\n`,
        );
      }
    }

    rl.close();
  }

  const ideDir = join(cwd, `.${getIDEFolder(ide)}`);

  // Reinstall: --force ou confirmação "s" devem sobrescrever assets (cpSync force:true).
  let forceSync = !!flags.force;

  if (existsSync(ideDir) && !forceSync) {
    logger.info(`${YELLOW}⚠️  Framework já instalado em .${getIDEFolder(ide)}${NC}`);
    logger.info("");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const confirm = await ask(
      rl,
      `Deseja reinstalar? Isso irá sobrescrever a instalação existente. (s/N): `,
    );
    rl.close();

    if (confirm.toLowerCase() !== "s") {
      logger.info(`${BLUE}ℹ️  Instalação cancelada.${NC}\n`);
      return;
    }
    forceSync = true;
    logger.info("");
  }

  const ideConfig = getIDEConfig(ide);
  logger.info(
    `${BLUE}Configurando ambiente para ${ideConfig?.name}...${NC}`,
  );
  logger.info("");
  const result = syncAssets(cwd, ide, {
    force: forceSync,
    workflowsFolder: getWorkflowsFolder(ide),
  });

  for (const item of result.copied) {
    logger.info(`${BLUE}  ↳ ${item}${NC}`);
  }
  for (const item of result.skipped) {
    logger.info(`${DIM}  ↳ ${item} (já existe)${NC}`);
  }
  for (const item of result.errors) {
    logger.error(`${RED}  ✗ ${item}${NC}`);
  }

  const jarvisRoot = join(cwd, '.jarvis');
  for (const area of ['eng', 'prod', 'qa']) {
    mkdirSync(join(jarvisRoot, 'sessions', area), { recursive: true });
  }
  const gitignore = join(cwd, '.gitignore');
  const ignoreLine = '.jarvis/';
  if (existsSync(gitignore)) {
    const text = readFileSync(gitignore, 'utf8');
    if (!text.split('\n').some((l) => l.trim() === ignoreLine || l.trim() === '.jarvis')) {
      appendFileSync(gitignore, `${text.endsWith('\n') ? '' : '\n'}${ignoreLine}\n`);
    }
  } else {
    writeFileSync(gitignore, `${ignoreLine}\n`);
  }

  const pkg = getPackageInfo();

  logger.info("");
  logger.info(`${GREEN}✓ Configuração concluída!${NC}`);
  logger.info(
    `${BOLD}${CYAN}  versão: ${pkg.name} v${pkg.version}${NC}`,
  );
  logger.info(`${DIM}  origem: ${pkg.root}${NC}`);
  logger.info(`${DIM}  pasta criada: ${ideDir}${NC}`);
  logger.info("");

  const all = discoverAll();

  logger.info(
    `${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`,
  );
  logger.info(`${CYAN}  🏁 PRÓXIMO PASSO${NC}`);
  logger.info(
    `${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`,
  );
  logger.info("");

  if (ide === "codex") {
    logger.info(`  No ${GREEN}Codex${NC}, skills não usam slash commands.`);
    logger.info(`  Para invocar um skill, use linguagem natural:`);
    logger.info(`  ${DIM}  "use o skill jarvis-init para configurar o projeto"${NC}`);
    logger.info(`  ${DIM}  "execute o warm-up do Jarvis"${NC}`);
    logger.info("");
    logger.info(`  Skills disponíveis em ${YELLOW}.codex/skills/${NC}`);
    logger.info(`  Cada pasta é um skill — veja o SKILL.md para a descrição.`);
    logger.info("");
    logger.info(`  Para configurar as variáveis do projeto, peça ao Codex:`);
    logger.info(`  ${GREEN}"execute o skill jarvis-init"${NC}`);
  } else if (ide === "kiro") {
    logger.info(`  No ${GREEN}Kiro${NC}, skills e workflows são steering files.`);
    logger.info(`  Para invocar um skill, use ${GREEN}#skill-{nome}${NC} no chat:`);
    logger.info(`  ${DIM}  #skill-jarvis-init${NC}`);
    logger.info(`  ${DIM}  #skill-eng-backend${NC}`);
    logger.info("");
    logger.info(`  Steering files gerados em ${YELLOW}.kiro/steering/${NC}`);
    logger.info(`  • ${DIM}steering/*.md${NC}       — workflows (inclusion: manual)`);
    logger.info(`  • ${DIM}steering/*.md${NC}       — rules (inclusion: auto)`);
    logger.info(`  • ${DIM}steering/skills/*.md${NC} — skills (inclusion: manual)`);
    logger.info("");
    logger.info(`  Para configurar as variáveis do projeto, ative:`);
    logger.info(`  ${GREEN}#skill-jarvis-init${NC} no chat do Kiro`);
  } else {
    logger.info(`  Execute o comando ${GREEN}/jarvis-init${NC} na sua IDE para`);
    logger.info(`  configurar as variáveis de ambiente do projeto.`);
  }

  logger.info("");
  logger.info(
    `${DIM}  Isso irá criar o arquivo ENV.md com as configurações${NC}`,
  );
  logger.info(`${DIM}  necessárias para o funcionamento do JARVIS.${NC}`);
  logger.info("");
  logger.info(
    `${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`,
  );
  logger.info("");
  logger.info(`${GREEN}✓ Instalação completa! 🎉${NC}`);
  logger.info("");
  logger.info(`${BLUE}📁 Estrutura criada:${NC}`);
  logger.info(`  • ${YELLOW}.${getIDEFolder(ide)}/${NC} - Configuração da IDE`);
  logger.info(`  • ${GREEN}${all.agents.length}${NC} agents`);
  logger.info(`  • ${GREEN}${all.skills.length}${NC} skills`);
  logger.info(`  • ${GREEN}${all.workflows.length}${NC} workflows`);
  logger.info("");
  logger.info(`${BLUE}📖 Para ver todos os prompts disponíveis:${NC}`);
  logger.info(`     ${YELLOW}jarvis list${NC}`);
  logger.info("");

}
