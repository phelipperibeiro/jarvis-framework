import { openStorageFromEnv } from "../lib/docs/fetch-file.js";
import { planCentralMigration } from "../lib/docs/migrate-central.js";
import { assertSegment } from "../lib/docs/publish-file.js";
import { logger, configureFromFlags } from "../lib/utils/logger.js";

/**
 * Migra o Central docs do layout antigo ({squad}/product/{produto}/feature-*.md,
 * {squad}/engineering/{produto}/delivery-*.md) para a estrutura por funcionalidade (#220).
 * Dry-run por padrão: só mostra o plano. Com `--apply`, guarda uma cópia e move de verdade.
 * Chamado pelo `/jarvis-init` (Upgrade C), que mostra o plano e pergunta antes de `--apply`
 * (regra de ouro); rodar direto no terminal é equivalente, a pessoa decide na hora.
 *
 * @param {Object} flags
 * @param {boolean} [flags.apply] - Aplica o plano; sem ela, só mostra (dry-run)
 * @param {string} [flags.squad] - Override do SQUAD do ENV.md
 * @param {string} flags.envFile - Path customizado do ENV.md
 */
export async function docsMigrate(flags = {}) {
  configureFromFlags(flags);

  let env;
  let storage;
  try {
    ({ env, storage } = openStorageFromEnv(flags));
  } catch (error) {
    logger.error("❌ Central docs:", error.message);
    process.exit(1);
  }

  if (!storage) {
    logger.error("❌ Central docs desligado (CENTRAL_DOCS_STORAGE vazio no ENV.md).");
    process.exit(1);
  }
  if (storage.kind !== "filesystem") {
    logger.error(
      `❌ jarvis docs migrate só funciona com CENTRAL_DOCS_STORAGE=filesystem (acesso direto à pasta); este ENV.md usa "${storage.kind}".`
    );
    process.exit(1);
  }

  const squad = flags.squad || env.SQUAD;
  if (!squad) {
    logger.error("❌ SQUAD não definido no ENV.md (ou passe --squad <squad>)");
    process.exit(1);
  }
  try {
    // Sem isto, um squad errado (ou `--squad ../x`) chegava direto ao `join(root, squad, ...)`
    // sem a mesma validação que `publish`/`archive` já fazem (#220 item 8).
    assertSegment("Squad", squad);
  } catch (error) {
    logger.error(`❌ ${error.message}`);
    process.exit(1);
  }

  const plan = planCentralMigration(storage.location, squad);

  logger.info(`📦 Migração do Central docs — squad ${squad}`);
  logger.info(`   ${plan.moves.length} arquivo(s) para a estrutura por funcionalidade`);

  if (plan.needsSplit.length > 0) {
    logger.info(
      `   ⚠️  ${plan.needsSplit.length} entrega(s) ligada(s) a mais de uma funcionalidade — não movida(s) automaticamente (a quebra, Q9/Q21 da #220, pede o agente):`
    );
    for (const s of plan.needsSplit) {
      logger.info(`      - ${s.delivery} → ${s.features.join(", ")}`);
    }
  }
  if (plan.skipped.length > 0) {
    logger.info(`   ${plan.skipped.length} ignorado(s):`);
    for (const s of plan.skipped) logger.info(`      - ${s.from} (${s.reason})`);
  }

  if (!flags.apply) {
    logger.debug("");
    for (const m of plan.moves) logger.debug(`   ${m.from} → ${m.to}`);
    logger.info("\nDry-run: nada foi alterado. Rode de novo com --apply para mover de verdade.");
    return;
  }

  if (plan.moves.length === 0) {
    logger.info("\nNada para mover.");
    return;
  }

  const result = await storage.migrateApply({ plan, squad });

  logger.info(`\n✅ ${result.moved.length} arquivo(s) movido(s)`);
  logger.info(`🗄️  Cópia dos originais em: ${result.backupDir}`);
  if (result.branch) logger.info(`🌿 Branch: ${result.branch}`);
  if (result.mr) logger.info(`🔀 Pull/Merge Request: ${result.mr.url}`);

  // Com .git, o índice já foi regenerado e comitado dentro de migrateApply, na branch de
  // trabalho (rodada 2, N4) — regenerá-lo aqui de novo rodaria na branch base, sem o que
  // acabou de ser migrado. Sem .git, não há branch nenhuma: regenera direto na cópia local.
  if (!storage.isGit) {
    const indexPath = storage.buildIndex(squad);
    logger.info(`🗂️  Índice regenerado: ${indexPath}`);
  }

  if (result.errors.length > 0) {
    logger.error(`⚠️  ${result.errors.length} erro(s):`);
    for (const e of result.errors) logger.error(`   - ${e}`);
    // #220 item 11: migração parcial não é sucesso — scripts que dependem do código de saída
    // (ex.: /jarvis-init) não devem tratá-la como se tivesse ido tudo bem.
    process.exit(1);
  }
}
