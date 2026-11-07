import { resolve } from "node:path";
import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { inventorySessions } from "../lib/docs/session-inventory.js";
import { expandEnv } from "../lib/core/docs-migrate.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

const sim = (v) => (v === null ? "?" : v ? "sim" : "não");

/**
 * Lista as sessões de engenharia, os arquivos de cada uma e se a entrega já está no Central
 * docs (#229). Só lê: não escreve nada nem consulta a rede. É a base do modo "uma sessão por
 * vez" do `/eng.spec-consolidate` (`--sessao {card}` e `--proxima`).
 *
 * @param {Object} flags - Flags do comando
 * @param {boolean} [flags.json] - Saída em JSON (só os dados, em stdout)
 * @param {boolean} [flags.pendentes] - Só as sessões sem página-índice publicada
 * @param {boolean} [flags.proxima] - Imprime só o card da próxima sessão pendente (stdout)
 * @param {string} [flags.squad] - Override do SQUAD do ENV.md
 * @param {string} [flags.produto] - Override do WORKSPACE do ENV.md (pasta do produto)
 * @param {string} [flags.envFile] - Path customizado do ENV.md
 */
export async function docsSessions(flags = {}) {
  configureFromFlags(flags);

  let env;
  let storage;
  let root;
  try {
    ({ env, storage, root } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }

  const expanded = expandEnv(new Map(Object.entries(env || {})));
  const sessionsDir = resolve(root, expanded.get("SESSIONS_DIR") || ".jarvis/sessions", "eng");
  const squad = flags.squad || env.SQUAD;
  const produto = flags.produto || flags.workspace || env.WORKSPACE;
  const centralRoot = storage?.location ?? null;

  const all = inventorySessions({ sessionsDir, centralRoot, squad, produto });
  const list = flags.pendentes || flags.proxima ? all.filter((s) => s.pendente) : all;

  if (flags.proxima) {
    // stdout só com o card: o workflow lê esta saída
    if (list.length > 0) process.stdout.write(`${list[0].card}\n`);
    else console.error("Nenhuma sessão pendente.");
    return;
  }
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ sessionsDir, central: centralRoot !== null, sessoes: list }, null, 2)}\n`);
    return;
  }

  if (!centralRoot) {
    logger.warn("⚠️  Central docs desligado: não dá para saber quais sessões já foram entregues ou publicadas.");
  }
  if (all.length === 0) {
    logger.info(`ℹ️  Nenhuma sessão em ${sessionsDir}`);
    return;
  }

  logger.info(`📚 Sessões em ${sessionsDir}\n`);
  logger.info("card    arquivos  bytes     entregue  publicada  faltam");
  for (const s of list) {
    logger.info(
      [
        s.card.padEnd(7),
        String(s.files.length).padStart(8),
        String(s.totalBytes).padStart(7),
        sim(s.delivered).padStart(10),
        sim(s.capituloPublicado).padStart(10),
        `  ${s.vazia ? "(vazia)" : s.ausentes.join(", ") || "-"}`,
      ].join(" ")
    );
  }
  const pendentes = all.filter((s) => s.pendente).length;
  const entregues = all.filter((s) => s.delivered).length;
  logger.info(
    `\n${all.length} sessão(ões): ${entregues} com entrega no Central docs, ${pendentes} pendente(s) (sem página-índice publicada).`
  );
  if (pendentes > 0 && centralRoot) logger.info("Próxima: /eng.spec-consolidate --proxima");
}
