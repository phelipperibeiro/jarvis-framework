/**
 * @fileoverview Monta o `program` do commander — único lugar que precisa mudar
 * para adicionar, remover ou alterar um comando do CLI `jarvis`.
 *
 * Os arquivos de `bin/commands/*.js` continuam puros: cada um exporta uma
 * função `async (flags) => {...}` sem saber nada sobre commander. Este módulo
 * só traduz as opções do commander (camelCase: `--env-file` -> `envFile`)
 * para o formato antigo que essas funções já esperam (`flags["env-file"]`,
 * `flags._` para positionals) — ver `architecture.md` da sessão `eng/72`,
 * Decisão 3.3.
 * @module cli/program
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

import { init } from "../../commands/init.js";
import { list } from "../../commands/list.js";
import { info } from "../../commands/info.js";
import { whoami } from "../../commands/whoami.js";
import { docsSync } from "../../commands/docs-sync.js";
import { docsPublish } from "../../commands/docs-publish.js";
import { qaSignoff } from "../../commands/qa-signoff.js";
import { installRtk } from "../../commands/install-rtk.js";
import { tokens } from "../../commands/tokens.js";
import { map } from "../../commands/map.js";
import { dailyReport } from "../../commands/daily-report.js";
import { runCreateMerge } from "../vcs/create-merge.js";
import { runCreateIssue } from "../vcs/create-issue.js";
import { runComment } from "../tasks/comment.js";
import { fetchFile } from "../docs/fetch-file.js";
import { formatIDEsList } from "../config/ide-config.js";
import { showBanner } from "../utils/ui.js";
import { withEnvOptions, withLogOptions } from "./shared-options.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion() {
  const packageJson = JSON.parse(readFileSync(join(__dirname, "../../../package.json"), "utf-8"));
  return packageJson.version;
}

/**
 * Remonta as opções do commander (camelCase) no formato antigo de `flags`
 * que `bin/commands/*.js` espera. `extra` (positionals, `logout: true`, etc.)
 * é aplicado por último e sempre vence.
 * @param {Record<string, unknown>} options
 * @param {Record<string, unknown>} [extra]
 */
function toLegacyFlags(options, extra = {}) {
  const { envFile, maxAge, ...rest } = options;
  const flags = { ...rest };
  if (envFile !== undefined) flags["env-file"] = envFile;
  if (maxAge !== undefined) flags["max-age"] = maxAge;
  return { ...flags, ...extra };
}

/**
 * `parent.command(name)` + `allowUnknownOption()` + `allowExcessArguments()`.
 * O commander não propaga essas duas configurações do pai para os
 * subcomandos — precisa repetir em cada um para manter a mesma
 * permissividade do parser manual antigo, que nunca validava flag nem
 * contava argumentos (ver `architecture.md` da sessão `eng/72`, Decisão 3.4).
 * @param {Command} parent
 * @param {string} name
 */
function cmd(parent, name) {
  return parent.command(name).allowUnknownOption().allowExcessArguments();
}

/** @returns {Command} */
export function buildProgram() {
  const program = new Command("jarvis")
    .description("Framework Jarvis para desenvolvimento assistido por IA")
    .version(getVersion(), "-v, --version", "Versão instalada")
    .allowUnknownOption() // o parser antigo nunca validava flags — mantém a mesma permissividade
    .allowExcessArguments()
    .showHelpAfterError(true);

  program.addHelpText("beforeAll", () => {
    showBanner();
    return "";
  });
  program.addHelpText("after", () => `\nIDEs Suportadas:\n  ${formatIDEsList()}\n`);

  const initCmd = cmd(program, "init")
    .description("Bootstrap do framework no workspace")
    .option("--ide <ide>", "IDE a configurar (pula o menu interativo)")
    .option("--force", "Sobrescreve a instalação existente sem perguntar")
    .option(
      "--upgrade",
      "Atualiza um projeto já configurado: arquivos do framework, variáveis novas do ENV e pastas de documentos"
    )
    .option("--yes", "Com --upgrade, move os documentos para as pastas novas sem perguntar")
    .option(
      "--remove-stale",
      "Com --upgrade, remove sem perguntar os skills instalados que saíram do framework (só os listados)"
    );
  withLogOptions(initCmd).action((options) => init(toLegacyFlags(options)));

  cmd(program, "list")
    .alias("ls")
    .description("Listar agents, skills & workflows")
    .argument("[type]", "Filtra por tipo: agent, skill ou workflow")
    .option("--type <type>", "Mesmo filtro que o positional acima")
    .action((type, options) => list(toLegacyFlags(options, { _: [type].filter(Boolean) })));

  cmd(program, "info")
    .description("Detalhes de um prompt")
    .argument("[target]", "Ex: agent/eng.agent, skill/eng-backend")
    .action((target) => info(target));

  const whoamiCmd = cmd(program, "whoami").description("Exibir identidade (ENV.md / git / SO)");
  withEnvOptions(withLogOptions(whoamiCmd)).action((options) => whoami(toLegacyFlags(options)));

  const logoutCmd = cmd(program, "logout").description("Remover auth.json legado");
  withLogOptions(logoutCmd).action((options) => whoami(toLegacyFlags(options, { logout: true })));

  const docs = cmd(program, "docs").description("Sincronizar ou publicar documentação");

  const docsSyncCmd = cmd(docs, "sync").description(
    "Sincronizar docs do Central docs pelo adaptador de CENTRAL_DOCS_STORAGE (usado por /warm-up)"
  );
  withEnvOptions(withLogOptions(docsSyncCmd)).action((options) => docsSync(toLegacyFlags(options)));

  const docsFetchCmd = cmd(docs, "fetch")
    .description(
      "Buscar um arquivo do Central docs pelo adaptador de CENTRAL_DOCS_STORAGE (com git: pull antes de ler)"
    )
    .argument("<file-path>", "Caminho do arquivo dentro do Central docs (ex: CORE/index.md)");
  withEnvOptions(docsFetchCmd).action(async (filePath, options) => {
    try {
      const content = await fetchFile(filePath, { flags: toLegacyFlags(options) });
      process.stdout.write(content);
    } catch (error) {
      console.error(error.message);
      process.exit(error.code === 404 ? 2 : 1);
    }
  });

  const docsPublishCmd = cmd(docs, "publish")
    .description(
      "Publicar a consolidação (feature/delivery) no Central docs (pasta: copia e regenera o índice; com git: branch + PR)"
    )
    .option("--file <path>", "Caminho do arquivo local")
    .option("--tipo <tipo>", "feature|delivery (consolidação do /eng.spec-consolidate)")
    .option("--produto <produto>", "Pasta do produto no Central docs (padrão: WORKSPACE do ENV.md)")
    .option("--feature <slug>", "Só se o nome do arquivo fugir do padrão {tipo}-{nome}.md")
    .option("--squad <squad>", "Override do SQUAD do ENV.md")
    .option(
      "--workspace <workspace>",
      "Override do WORKSPACE do ENV.md (mesmo efeito de --produto)"
    );
  withEnvOptions(withLogOptions(docsPublishCmd)).action((options) =>
    docsPublish(toLegacyFlags(options))
  );

  const installRtkCmd = cmd(program, "install-rtk").description(
    "Instalar RTK (token killer — economia 60-90% em tokens de shell)"
  );
  withLogOptions(installRtkCmd).action((options) => installRtk(toLegacyFlags(options)));

  const qaSignoffCmd = cmd(program, "qa-signoff")
    .description("Verificar sign-off QA válido para a branch atual (usado pelo CI)")
    .option("--branch <branch>", "Branch a verificar (padrão: lido do git)")
    .option("--max-age <horas>", "Validade máxima em horas (padrão: 24)");
  withEnvOptions(qaSignoffCmd).action((options) => qaSignoff(toLegacyFlags(options)));

  cmd(program, "tokens")
    .description("Estimar o que carrega no início da sessão")
    .option("--hub <hub>")
    .option("--position <position>")
    .option("--area <area>")
    .option("--squad <squad>")
    .option("--artifact-style <estilo>", "ai-generated ou human-generated (padrão: lido do ENV.md)")
    .option("--rtk", "Força RTK ligado (padrão: lido do ENV.md)")
    .option("--json", "Saída em JSON")
    .option("--ide <ide>")
    .option("--env-file <path>")
    .action((options) => tokens(toLegacyFlags(options)));

  cmd(program, "map")
    .description("Mapa de chamadas de um workflow, skill ou agente")
    .argument("[name]", "Nome do workflow, skill ou agente")
    .option("--depth <n>", "Profundidade máxima")
    .option("--reverse", "Mostra quem chama, em vez do que é chamado")
    .action((name, options) => map(toLegacyFlags(options, { _: [name].filter(Boolean) })));

  cmd(program, "daily-report")
    .description("Junta os daily.md das sessões por dia (base do /eng.daily-report)")
    .option("--days <n>", "Janela em dias: 1, 3, 7, 15, 30 ou 60 (padrão: 7)")
    .option("--json", "Saída em JSON")
    .option("--ide <ide>")
    .option("--env-file <path>")
    .action((options) => dailyReport(toLegacyFlags(options)));

  const vcs = cmd(program, "vcs").description("Git host pela CLI oficial (gh, glab)");

  cmd(vcs, "create-merge")
    .description("Abrir um MR/PR (gh pr create / glab mr create)")
    .option("--source <branch>")
    .option("--target <branch>")
    .option("--title <titulo>")
    .option("--body-file <path>")
    .option("--repo <url>", "Padrão: git remote get-url origin")
    .option("--ide <ide>", "IDE do ENV.md (quando há mais de um no workspace)")
    .option("--env-file <path>", "Path explícito do ENV.md")
    .action((options) =>
      runCreateMerge({
        source: options.source,
        target: options.target,
        title: options.title,
        bodyFile: options.bodyFile,
        repo: options.repo,
        ide: options.ide,
        envFile: options.envFile,
      })
    );

  cmd(vcs, "create-issue")
    .description("Abrir uma issue (gh issue create / glab issue create)")
    .option("--repo <url>", "URL completa do repositório")
    .option("--title <titulo>")
    .option("--body-file <path>")
    .option("--label <labels>", "Labels separadas por vírgula (padrão: bug)")
    .action((options) =>
      runCreateIssue({
        repo: options.repo,
        title: options.title,
        bodyFile: options.bodyFile,
        labels: options.label,
      })
    );

  const tasks = cmd(program, "tasks").description(
    "Board de cards pela CLI oficial (gh, glab, acli)"
  );

  cmd(tasks, "comment")
    .description("Comentar num card (Jira, GitHub, GitLab — lê TASK_MANAGER do ambiente)")
    .argument("[card-key]")
    .argument("[message...]", "Texto do comentário (pode ter espaços)")
    .option("--body-file <path>", "Lê o texto do comentário de um arquivo")
    .option("--ide <ide>", "IDE do ENV.md (quando há mais de um no workspace)")
    .option("--env-file <path>", "Path explícito do ENV.md")
    .action((cardKey, messageParts, options) =>
      runComment(cardKey, messageParts.join(" "), {
        bodyFile: options.bodyFile,
        ide: options.ide,
        envFile: options.envFile,
      })
    );

  return program;
}
