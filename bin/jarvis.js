#!/usr/bin/env node

import { argv, exit } from "node:process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { init } from "./commands/init.js";
import { list } from "./commands/list.js";
import { info } from "./commands/info.js";
import { whoami } from "./commands/whoami.js";
import { docsSync } from "./commands/docs-sync.js";
import { docsPublish } from "./commands/docs-publish.js";
import { qaSignoff } from "./commands/qa-signoff.js";
import { installRtk } from "./commands/install-rtk.js";
import { tokens } from "./commands/tokens.js";
import { map } from "./commands/map.js";
import { formatIDEsList } from "./lib/config/ide-config.js";
import { showBanner, BLUE, GREEN, YELLOW, DIM, NC } from "./lib/utils/ui.js";
import { logger } from "./lib/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = argv.slice(2);
const command = args[0];

// Lazy loading do package.json (só quando necessário)
let _version = null;
function getVersion() {
  if (_version === null) {
    const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));
    _version = packageJson.version;
  }
  return _version;
}

function help() {
  showBanner();

  logger.info(`${BLUE}📚 Ajuda${NC}\n`);

  logger.info(`${YELLOW}Uso:${NC}`);
  logger.info(`  ${GREEN}jarvis init${NC} [--ide <ide>]   Bootstrap framework no workspace`);
  logger.info(
    `  ${GREEN}jarvis list${NC}                             Listar agents, skills & workflows`
  );
  logger.info(`  ${GREEN}jarvis info${NC} <type/name>                 Detalhes de um prompt`);
  logger.info(
    `  ${GREEN}jarvis whoami${NC}                           Exibir identidade (ENV.md / git / SO)`
  );
  logger.info(`  ${GREEN}jarvis logout${NC}                           Remover auth.json legado`);
  logger.info(
    `  ${GREEN}jarvis docs sync${NC} [--silent] [--verbose]              Sincronizar docs do central-docs`
  );
  logger.info(
    `  ${GREEN}jarvis docs publish${NC} --file <path> --tipo <tipo> --feature <slug> [--squad <squad>] [--workspace <workspace>]`
  );
  logger.info(
    `  ${GREEN}jarvis install-rtk${NC}                      Instalar RTK (token killer — economia 60-90%)`
  );
  logger.info(
    `  ${GREEN}jarvis tokens${NC} [--hub <h> --position <p> --area <a> --squad <s>] [--rtk] [--json]   Estimar o que carrega no início da sessão (perfil do ENV.md se sem flags)`
  );
  logger.info(
    `  ${GREEN}jarvis map${NC} <nome> [--depth N] [--reverse]   Mapa do que um workflow, skill ou agente chama (ou, com --reverse, quem o chama)`
  );
  logger.info(
    `  ${GREEN}jarvis qa-signoff${NC} [--branch <branch>] [--max-age <horas>]   Verificar sign-off QA (usado pelo CI)`
  );
  logger.info(`  ${GREEN}jarvis --version${NC}                        Versão instalada`);
  logger.info("");

  logger.info(`${YELLOW}IDEs Suportadas:${NC}`);
  logger.info(`  ${formatIDEsList()}`);
  logger.info("");

  logger.info(`${YELLOW}🚀 Começar:${NC}`);
  logger.info(`  ${DIM}1.${NC} npm install -g ${GREEN}/caminho/para/jarvis${NC}`);
  logger.info(`  ${DIM}2.${NC} ${GREEN}jarvis init${NC} --ide cursor`);
  logger.info(`  ${DIM}3.${NC} No chat da IDE: ${GREEN}/jarvis-init${NC}`);
  logger.info("");

  logger.info(`${BLUE}📖 Exemplos:${NC}`);
  logger.info(
    `  ${GREEN}jarvis list${NC}                                  Listar todos os prompts`
  );
  logger.info(`  ${GREEN}jarvis info agent/eng${NC}                        Detalhes do agent eng`);
  logger.info(
    `  ${GREEN}jarvis docs sync${NC}                             Sincronizar docs do central-docs`
  );
  logger.info(
    `  ${GREEN}jarvis docs publish --file ./docs/ard.md --tipo ard --feature auth-jwt${NC}`
  );
  logger.info("");
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      flags[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
    } else {
      flags._ = flags._ || [];
      flags._.push(args[i]);
    }
  }
  return flags;
}

const flags = parseFlags(args.slice(1));

const commands = {
  init: () => init(flags),
  list: () => list(flags),
  ls: () => list(flags),
  info: () => info(flags._?.[0], flags),
  logout: () => whoami({ ...flags, logout: true }),
  whoami: () => whoami(flags),
  docs: () => {
    const subcommand = flags._?.[0];
    if (subcommand === "sync") {
      return docsSync(flags);
    } else if (subcommand === "publish") {
      return docsPublish(flags);
    } else {
      logger.error("\n  Subcomando inválido para docs\n");
      logger.info("Uso:");
      logger.info(`  ${GREEN}jarvis docs sync${NC} [--silent] [--verbose]`);
      logger.info(
        `  ${GREEN}jarvis docs publish${NC} --file <path> --tipo <prd|frd|ard|rfc> --feature <slug> [--squad <squad>] [--workspace <workspace>]`
      );
      logger.info("");
      exit(1);
    }
  },
  "install-rtk": () => installRtk(flags),
  "qa-signoff": () => qaSignoff(flags),
  tokens: () => tokens(flags),
  map: () => map(flags),
  "--version": () => logger.info(getVersion()),
  "-v": () => logger.info(getVersion()),
  "--help": () => help(),
  "-h": () => help(),
};

if (command in commands) {
  await commands[command]();
} else if (!command) {
  help();
} else {
  logger.error(`\n  Unknown command: ${command}\n`);
  help();
  exit(1);
}
