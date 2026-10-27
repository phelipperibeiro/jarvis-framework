import { existsSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { join, dirname, basename, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { syncAssets } from "../lib/core/sync-engine.js";
import { discoverAll } from "../lib/core/scanner.js";
import {
  IDES,
  getIDEConfig,
  getIDEFolder,
  getIDEValues,
  getWorkflowsFolder,
  isIDESupported,
} from "../lib/config/ide-config.js";
import { showBanner, RED, GREEN, BLUE, YELLOW, CYAN, DIM, BOLD, NC } from "../lib/utils/ui.js";
import { getPackageInfo, getFrameworkRoot } from "../lib/utils/paths.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";
import { resolveEnvPath } from "../lib/env-loader.js";
import { LOCK_FILE } from "../lib/config/constants.js";
import { compareVersions, localInstall } from "../lib/utils/version.js";
import {
  findStaleSkills,
  registeredSpecializations,
  removeStaleSkills,
} from "../lib/core/stale-skills.js";
import { parseEnvEntries, planEnvUpgrade, applyEnvUpgrade } from "../lib/core/env-upgrade.js";
import { checkCli, getVendor } from "../lib/integrations/cli-runner.js";
import {
  expandEnv,
  planDocsMigration,
  applyDocsMigration,
  rewriteRelatedDiscovery,
  declineEnvValues,
  ensureGitignore,
} from "../lib/core/docs-migrate.js";
import { rootIsRepo } from "../lib/core/workspace-mode.js";
import { ensureContext7 } from "../lib/core/mcp-config.js";

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Grava o Context7 (MCP obrigatório) no arquivo de MCP da IDE e mostra o que falta.
 * Só avisa: problema no arquivo de MCP não muda o código de saída (instalação e --upgrade).
 */
function setupMcp(workspaceDir, ide) {
  const mcp = ensureContext7(workspaceDir, ide);
  logger.info(`${BLUE}🔌 MCP (Context7):${NC}`);
  for (const p of mcp.written) logger.info(`  ${GREEN}✓ ${p}${NC} (Context7 adicionado)`);
  for (const p of mcp.present) logger.info(`${DIM}  ↳ ${p} (Context7 já configurado)${NC}`);
  for (const m of mcp.manual) {
    const why = m.reason
      ? `${m.path}: ${m.reason}. Nada alterado; inclua à mão:`
      : `Config só global: inclua em ${m.path}:`;
    logger.info(`${YELLOW}  ⚠️  ${why}${NC}`);
    for (const line of m.snippet.trimEnd().split("\n")) logger.info(`${DIM}     ${line}${NC}`);
  }
  for (const e of mcp.errors) logger.info(`${YELLOW}  ⚠️  ${e} (nada alterado)${NC}`);
  const note = getIDEConfig(ide)?.mcpNote;
  if (note && (mcp.written.length || mcp.manual.length)) logger.info(`${DIM}  ${note}${NC}`);
  logger.info("");
}

export async function init(flags) {
  configureFromFlags(flags);

  const cwd = process.cwd();

  showBanner();

  if (flags.upgrade) {
    process.exitCode = await runUpgrade(cwd, flags);
    return;
  }

  let ide;
  if (flags.ide) {
    if (!isIDESupported(flags.ide)) {
      logger.error(`${RED}❌ IDE inválida: ${flags.ide}${NC}`);
      logger.info(
        `${YELLOW}IDEs disponíveis: ${IDES.filter((i) => i.supported)
          .map((i) => i.value)
          .join(", ")}${NC}\n`
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
        logger.info(`  ${DIM}${index + 1}) ${ideObj.name} (não suportado)${NC}`);
      }
    });
    logger.info("");

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let choice;
    while (true) {
      choice = await ask(rl, `${BLUE}Digite o número da sua escolha (1-${IDES.length}): ${NC}`);
      const choiceNum = parseInt(choice, 10);

      if (choiceNum >= 1 && choiceNum <= IDES.length) {
        const selectedIde = IDES[choiceNum - 1];
        if (selectedIde.supported) {
          ide = selectedIde.value;
          logger.info("");
          logger.info(`${GREEN}Interface selecionada: ${selectedIde.name}${NC}`);
          logger.info(`${DIM}Pasta destino: .${getIDEFolder(ide)}${NC}`);
          logger.info("");
          break;
        } else {
          logger.info(`${DIM}Esta interface ainda não é suportada.${NC}\n`);
        }
      } else {
        logger.info(
          `${RED}Opção inválida. Por favor, escolha um número entre 1 e ${IDES.length}.${NC}\n`
        );
      }
    }

    rl.close();
  }

  const ideDir = join(cwd, `.${getIDEFolder(ide)}`);

  // Avisos de versão antes da pergunta de reinstalação: quem responde "s" (ou usa --force)
  // já sabe se vai rebaixar os assets.
  warnVersionMismatch(cwd);

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
      `Deseja reinstalar? Isso irá sobrescrever a instalação existente. (s/N): `
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
  logger.info(`${BLUE}Configurando ambiente para ${ideConfig?.name}...${NC}`);
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

  const jarvisRoot = join(cwd, ".jarvis");
  for (const area of ["eng", "prod", "qa"]) {
    mkdirSync(join(jarvisRoot, "sessions", area), { recursive: true });
  }
  // .gitignore só numa raiz versionada (com .git): no modo workspace a raiz não é um repositório.
  if (rootIsRepo(cwd)) {
    ensureGitignore(cwd, ".jarvis/");
  }

  logger.info("");
  setupMcp(cwd, ide);

  const pkg = getPackageInfo();

  logger.info(`${GREEN}✓ Configuração concluída!${NC}`);
  logger.info(`${BOLD}${CYAN}  versão: ${pkg.name} v${pkg.version}${NC}`);
  logger.info(`${DIM}  origem: ${pkg.root}${NC}`);
  logger.info(`${DIM}  pasta criada: ${ideDir}${NC}`);
  logger.info("");

  const all = discoverAll();

  logger.info(`${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
  logger.info(`${CYAN}  🏁 PRÓXIMO PASSO${NC}`);
  logger.info(`${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
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
  logger.info(`${DIM}  Isso irá criar o arquivo ENV.md com as configurações${NC}`);
  logger.info(`${DIM}  necessárias para o funcionamento do JARVIS.${NC}`);
  logger.info("");
  logger.info(`${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`);
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

/** IDE de um ENV.md encontrado (`.claude/ENV.md` → `claude`). */
function ideFromEnvPath(envPath) {
  const folder = basename(dirname(envPath));
  return getIDEValues().find((v) => `.${getIDEFolder(v)}` === folder);
}

/**
 * Avisos de versão antes do sync. O Jarvis é instalado só global:
 * - cópia local no projeto (`node_modules` ou dependência no `package.json`) é ignorada;
 *   se é ela que está rodando (`npx jarvis`, `./node_modules/.bin/jarvis`), o aviso diz isso;
 * - lock do projeto mais novo que o Jarvis em uso: o sync rebaixaria os assets.
 * Recebe o lock lido antes do `syncAssets`, que o reescreve.
 * @param {string} workspaceDir
 * @param {string} [lock] - versão do `jarvis-lock.json` do projeto
 * @returns {{ downgrade: boolean, running: string }} `downgrade` = lock mais novo que o Jarvis em uso
 */
export function warnVersionMismatch(workspaceDir, lock = readLockVersion(workspaceDir)) {
  const running = getPackageInfo().version;
  // Caminhos reais dos dois lados: o Node já resolve o link do script (`import.meta.url`),
  // então uma cópia por `npm link` em node_modules só bate com o realpath.
  const real = (p) => {
    try {
      return realpathSync(p);
    } catch {
      return resolve(p);
    }
  };
  const root = real(getFrameworkRoot());
  const localDir = join(workspaceDir, "node_modules", "jarvis-ai-framework");
  const runningLocal =
    (root + sep).startsWith(real(join(workspaceDir, "node_modules")) + sep) ||
    (existsSync(localDir) && root === real(localDir));
  const local = localInstall(workspaceDir);
  if (runningLocal) {
    logger.info(
      `${BLUE}ℹ️  O Jarvis em uso (${running}) é o mesmo de node_modules (cópia local do projeto). O Jarvis é instalado global: npm install -g jarvis-ai-framework, rode \`jarvis\` (sem npx) e remova a cópia local.${NC}`
    );
  } else if (local) {
    logger.info(
      `${BLUE}ℹ️  O Jarvis é instalado global (npm install -g jarvis-ai-framework). A cópia local deste projeto (${local.version} em ${local.source}) é ignorada: pode removê-la.${NC}`
    );
  }
  const downgrade = compareVersions(lock, running) === 1;
  if (downgrade) {
    const who = runningLocal ? "o Jarvis em uso (cópia local)" : "o seu jarvis global";
    logger.info(
      `${YELLOW}⚠️  Os assets deste projeto são da ${lock}, mas ${who} é a ${running}. Atualize o global: npm install -g jarvis-ai-framework${NC}`
    );
  }
  if (runningLocal || local || downgrade) logger.info("");
  return { downgrade, running };
}

function readLockVersion(workspaceDir) {
  try {
    return (
      JSON.parse(readFileSync(join(workspaceDir, LOCK_FILE), "utf-8")).version || "desconhecida"
    );
  } catch {
    return "desconhecida";
  }
}

/**
 * Descoberta da CLI de cada eixo (só leitura: binário no PATH + `auth status`).
 * Não pergunta nada: a confirmação do acesso e as variáveis ficam no `/jarvis-init` (Q2 da #181).
 * `JARVIS_SKIP_CLI_CHECK=1` pula a descoberta (CI, sem rede).
 */
async function reportCliDiscovery(entries) {
  const axes = [
    ["TASK_MANAGER", "Board de cards"],
    ["VERSION_CONTROL", "Controle de versão"],
  ];
  const targets = axes
    .map(([key, label]) => ({ key, label, vendor: (entries.get(key) || "").toLowerCase() }))
    .filter((t) => getVendor(t.vendor));
  if (!targets.length) return;
  if (process.env.JARVIS_SKIP_CLI_CHECK) {
    logger.info(`${DIM}  • Descoberta da CLI pulada (JARVIS_SKIP_CLI_CHECK)${NC}`);
    return;
  }
  for (const t of targets) {
    const r = await checkCli(t.vendor);
    const mark = r.installed && r.loggedIn ? GREEN : YELLOW;
    logger.info(`${mark}  • ${t.label} (${t.key}=${t.vendor}): ${r.reason}${NC}`);
  }
}

/**
 * `jarvis init --upgrade`: atualiza um projeto já configurado em uma passada.
 * 1. arquivos do framework (como o --force, sem perguntar); 2. só as chaves novas do ENV;
 * 3. documentos dos caminhos antigos → docs/jarvis/… (com confirmação ou --yes).
 * Nunca imprime valores do ENV, só nomes de chave e caminhos.
 * @returns {Promise<number>} código de saída
 */
async function runUpgrade(cwd, flags) {
  let resolved;
  try {
    resolved = resolveEnvPath(cwd, flags.ide ? { ide: flags.ide } : {});
  } catch (err) {
    resolved = { error: err.message.split("\n")[0] };
  }
  const ide = flags.ide || (resolved.path && ideFromEnvPath(resolved.path));
  if (resolved.error || !ide || !existsSync(resolved.path)) {
    logger.error(
      `${RED}🚫 Nenhuma instalação do Jarvis encontrada (ENV.md ausente)${resolved.error ? `: ${resolved.error}` : ""}.${NC}`
    );
    logger.error(
      `${YELLOW}Rode ${BOLD}jarvis init --ide ${flags.ide || "{ide}"}${NC}${YELLOW} e depois ${BOLD}/jarvis-init${NC}${YELLOW} na IDE.${NC}\n`
    );
    return 1;
  }
  const workspaceDir = resolved.root;
  const envPath = resolved.path;
  const previousVersion = readLockVersion(workspaceDir);
  const { downgrade, running } = warnVersionMismatch(workspaceDir, previousVersion);
  if (downgrade && !flags.yes) {
    let go = false;
    if (process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await ask(
        rl,
        `Seguir e rebaixar os assets de ${previousVersion} para ${running}? (s/N): `
      );
      rl.close();
      go = answer.trim().toLowerCase() === "s";
    } else {
      logger.info(`${DIM}  Sem terminal interativo e sem --yes: nada será rebaixado.${NC}`);
    }
    if (!go) {
      logger.info(
        `${YELLOW}Upgrade interrompido: atualize o global (npm install -g jarvis-ai-framework) e rode de novo.${NC}\n`
      );
      return 1;
    }
  }

  // 1. Arquivos do framework (o ENV.md não está entre os sincronizados)
  logger.info(`${BLUE}⬆️  Upgrade do Jarvis em .${getIDEFolder(ide)}/${NC}\n`);
  const sync = syncAssets(workspaceDir, ide, {
    force: true,
    workflowsFolder: getWorkflowsFolder(ide),
    keepEnvValues: true,
  });
  for (const item of sync.errors) logger.error(`${RED}  ✗ ${item}${NC}`);
  setupMcp(workspaceDir, ide);

  // 2. Variáveis novas (só acrescenta)
  const envText = readFileSync(envPath, "utf-8");
  const templateText = readFileSync(
    join(getFrameworkRoot(), "templates", "ENV-template.md"),
    "utf-8"
  );
  const envPlan = planEnvUpgrade(envText, templateText, { workspaceDir });
  const addedKeys = envPlan.added.map((a) => a.key);

  // 3. Documentos: o plano usa o ENV como ficará depois do upgrade (com as chaves novas)
  const futureEntries = parseEnvEntries(
    `${envText}\n${envPlan.added.map(({ key, value }) => `${key}=${value}`).join("\n")}\n`
  );
  const env = expandEnv(futureEntries);
  const docsPlan = planDocsMigration(workspaceDir, env);

  let accepted = false;
  if (docsPlan.moves.length > 0) {
    logger.info(`${YELLOW}📁 Documentos em caminhos antigos:${NC}`);
    for (const m of docsPlan.moves) logger.info(`  ${m.from} → ${m.to}`);
    if (flags.yes) accepted = true;
    else if (process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await ask(rl, `Mover para docs/jarvis/…? (s/N): `);
      rl.close();
      accepted = answer.trim().toLowerCase() === "s";
    } else {
      logger.info(`${DIM}  Sem terminal interativo e sem --yes: nada será movido.${NC}`);
    }
  }

  const overrides =
    docsPlan.moves.length > 0 && !accepted ? declineEnvValues(docsPlan, addedKeys, env) : {};
  const today = new Date().toISOString().slice(0, 10);
  applyEnvUpgrade(envPath, envPlan, today, overrides);

  // 3.1 Skills instalados que saíram do framework: só lista; remove com confirmação ou --remove-stale
  const ideSkillsDir = join(workspaceDir, `.${getIDEFolder(ide)}`, "skills");
  const stale = findStaleSkills({
    ideSkillsDir,
    frameworkSkillsDir: join(getFrameworkRoot(), "skills"),
    registered: registeredSpecializations(parseEnvEntries(envText)),
  });
  let staleRemoved = [];
  let staleErrors = [];
  if (stale.length > 0) {
    logger.info(`${YELLOW}🧹 Skills instalados que saíram do framework:${NC}`);
    for (const name of stale) logger.info(`  .${getIDEFolder(ide)}/skills/${name}/`);
    let confirmed = Boolean(flags.removeStale);
    if (!confirmed && !flags.yes && process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await ask(rl, `Remover estes skills antigos? (s/N): `);
      rl.close();
      confirmed = answer.trim().toLowerCase() === "s";
    }
    if (confirmed) {
      ({ removed: staleRemoved, errors: staleErrors } = removeStaleSkills(ideSkillsDir, stale));
    } else {
      logger.info(
        `${DIM}  Nada removido. Apague as pastas à mão ou rode de novo com ${BOLD}--remove-stale${NC}${DIM}.${NC}`
      );
    }
  }

  let moved = [];
  let rewritten = [];
  let moveErrors = [];
  if (accepted) {
    const result = applyDocsMigration(workspaceDir, docsPlan, env);
    moved = result.moved;
    moveErrors = result.errors;
    rewritten = rewriteRelatedDiscovery(workspaceDir, env, moved);
  }

  // 4. Resumo (só nomes de chave e caminhos)
  const pkg = getPackageInfo();
  logger.info("");
  logger.info(`${GREEN}✅ Upgrade concluído: ${previousVersion} → ${pkg.version}${NC}`);
  logger.info(`  • Arquivos do framework: ${sync.copied.length} item(ns) sincronizado(s)`);
  logger.info(
    `  • ENV.md: ${addedKeys.length ? `+ ${addedKeys.join(", ")}` : "nenhuma variável nova"}`
  );
  if (Object.keys(overrides).length) {
    logger.info(`  • Mantidos no caminho antigo: ${Object.keys(overrides).join(", ")}`);
  }
  if (docsPlan.moves.length && !accepted) {
    logger.info(`  • Documentos: nada movido (${docsPlan.moves.length} no caminho antigo)`);
  }
  if (moved.length) logger.info(`  • Documentos movidos: ${moved.length}`);
  if (rewritten.length) logger.info(`  • related_discovery atualizado: ${rewritten.join(", ")}`);
  for (const s of docsPlan.skipped)
    logger.info(`${YELLOW}  ⚠️  Pulado (${s.reason}): ${s.from}${NC}`);
  for (const e of moveErrors) logger.error(`${RED}  ✗ ${e}${NC}`);
  if (staleRemoved.length) logger.info(`  • Skills antigos removidos: ${staleRemoved.join(", ")}`);
  for (const e of staleErrors) logger.error(`${RED}  ✗ ${e}${NC}`);
  for (const k of envPlan.pending) {
    logger.info(`${YELLOW}  ⚠️  ${k} está vazio: responda no /jarvis-init upgrade${NC}`);
  }
  if (envPlan.warnings.includes("CENTRAL_DOCS_REPO")) {
    logger.info(
      `${YELLOW}  ⚠️  Central docs no formato antigo (CENTRAL_DOCS_REPO): a migração é feita pelo /jarvis-init upgrade${NC}`
    );
  }
  if (envPlan.warnings.includes("WORKSPACE_MODE")) {
    logger.info(
      `${YELLOW}  ⚠️  WORKSPACE_MODE: a raiz é um repositório e há subpastas com .git (submódulos?): gravado como project; confira no ENV.md${NC}`
    );
  }
  for (const key of envPlan.filledApplied || []) {
    logger.info(`  • ${key} estava vazio: preenchido com o repositório oficial do Jarvis`);
  }
  if (envPlan.warnings.includes("TOKEN_TASK_MANAGER")) {
    logger.info(
      `${YELLOW}  ⚠️  TOKEN_TASK_MANAGER não é mais usado: o Jarvis usa o login da CLI do vendor. Faça o login da CLI e remova a linha pelo /jarvis-init upgrade (o valor não foi lido nem copiado)${NC}`
    );
  }
  for (const w of envPlan.warnings.filter((x) => x.startsWith("UNSUPPORTED:"))) {
    const [, key, vendor] = w.split(":");
    logger.info(
      `${YELLOW}  ⚠️  ${key}=${vendor} não é suportado (jira, github, gitlab): o eixo fica em freelance e as ações viram .md${NC}`
    );
  }
  await reportCliDiscovery(futureEntries);

  // Eixos com vendor do catálogo e sem forma de acesso definida: a confirmação é no /jarvis-init.
  const pendingAxes = ["TASK_MANAGER", "VERSION_CONTROL"].filter((key) => {
    const access = (futureEntries.get(`${key}_ACCESS`) || "").trim();
    return getVendor(futureEntries.get(key)) && (!access || /^\[.*\]$/.test(access));
  });
  logger.info("");
  logger.info(
    pendingAxes.length
      ? `${CYAN}➡️  Agora rode ${BOLD}/jarvis-init upgrade${NC}${CYAN} na IDE para confirmar o acesso de ${pendingAxes.join(" e ")} (e as variáveis).${NC}\n`
      : `${CYAN}➡️  Agora rode ${BOLD}/jarvis-init upgrade${NC}${CYAN} na IDE.${NC}\n`
  );
  return sync.errors.length || moveErrors.length || staleErrors.length ? 1 : 0;
}
