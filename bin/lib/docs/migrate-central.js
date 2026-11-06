/**
 * @fileoverview Migra o Central docs do layout antigo (`{squad}/product/{produto}/feature-*.md`,
 * `{squad}/engineering/{produto}/delivery-*.md`) para a estrutura por funcionalidade
 * (`{squad}/{produto}/{funcionalidade}/…`, Q2 e Q6 da #220). Só move e reorganiza: **nunca**
 * reescreve conteúdo. `planCentralMigration` é puro (não toca em nada, é o que roda por padrão,
 * dry-run); `applyCentralMigration` guarda uma cópia de cada arquivo antes de mover (Q6: a
 * migração deixa rastro, mesmo sem git no Central docs) e nunca sobrescreve um destino que já
 * exista. Entrega citada por mais de um `feature-*.md` (Q9) não é movida: entra em `needsSplit`,
 * para o `/jarvis-init` acionar o agente (Q17, Q21).
 * @module docs/migrate-central
 */

import {
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  renameSync,
  readFileSync,
  cpSync,
  rmdirSync,
  appendFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { parseFrontmatter } from "../utils/frontmatter.js";

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isDirectory())
    .sort();
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

function slugOfFeatureFile(name) {
  if (!name.startsWith("feature-") || !name.endsWith(".md") || name.endsWith(".public.md")) {
    return null;
  }
  return name.slice("feature-".length, name.length - ".md".length);
}

/**
 * Calcula o plano de migração de um squad. Não lê nem escreve fora da pasta do Central docs,
 * e não altera nada (dry-run).
 *
 * @param {string} root - Pasta do Central docs
 * @param {string} squad
 * @returns {{
 *   moves: Array<{from: string, to: string, kind: "feature"|"delivery", produto: string, feature: string}>,
 *   needsSplit: Array<{from: string, produto: string, delivery: string, features: string[]}>,
 *   skipped: Array<{from: string, reason: "conflito"|"sem funcionalidade"}>,
 * }}
 */
export function planCentralMigration(root, squad) {
  const squadDir = join(root, squad);
  const productDir = join(squadDir, "product");
  const engineeringDir = join(squadDir, "engineering");

  const moves = [];
  const skipped = [];
  const needsSplit = [];
  // "delivery-x.md" -> Set<"{produto}::{slug}"> — o produto junto do slug (#220 item 10):
  // sem isso, uma entrega ia para o produto da pasta engineering/, que pode não ser o produto
  // onde a funcionalidade dona de fato está em product/.
  const ownersByDelivery = new Map();

  for (const produto of listDirs(productDir)) {
    for (const file of listFiles(join(productDir, produto))) {
      const slug = slugOfFeatureFile(file);
      if (!slug) continue;

      const from = `${squad}/product/${produto}/${file}`;
      const to = `${squad}/${produto}/${slug}/${slug}.md`;
      if (existsSync(join(root, to))) {
        skipped.push({ from, reason: "conflito" });
      } else {
        moves.push({ from, to, kind: "feature", produto, feature: slug });
      }

      // Vínculo entrega → funcionalidade: last_delivery e as citações de delivery-*.md no
      // corpo (ex.: a tabela "Histórico de entregas"). A mesma entrega citada por mais de uma
      // funcionalidade entra em needsSplit (Q9) — ela não é movida automaticamente.
      const content = readFileSync(join(productDir, produto, file), "utf-8");
      const meta = parseFrontmatter(content);
      const cited = new Set();
      if (meta.last_delivery) cited.add(meta.last_delivery.trim());
      for (const m of content.matchAll(/delivery-[\w.-]+\.md/g)) cited.add(m[0]);
      for (const name of cited) {
        if (!ownersByDelivery.has(name)) ownersByDelivery.set(name, new Set());
        ownersByDelivery.get(name).add(`${produto}::${slug}`);
      }
    }
  }

  for (const produtoEngenharia of listDirs(engineeringDir)) {
    for (const file of listFiles(join(engineeringDir, produtoEngenharia))) {
      if (!file.startsWith("delivery-") || !file.endsWith(".md") || file.endsWith(".public.md")) {
        continue;
      }
      const from = `${squad}/engineering/${produtoEngenharia}/${file}`;
      const owners = [...(ownersByDelivery.get(file) || [])].sort();

      if (owners.length === 0) {
        skipped.push({ from, reason: "sem funcionalidade" });
        continue;
      }
      if (owners.length > 1) {
        needsSplit.push({
          from,
          produto: produtoEngenharia,
          delivery: file,
          features: owners.map((o) => o.split("::")[1]),
        });
        continue;
      }

      // O produto é o da funcionalidade dona (de product/), não o da pasta engineering/ onde
      // a entrega estava: os dois podem divergir (#220 item 10).
      const [produtoDaFeature, slugDaFeature] = owners[0].split("::");
      const to = `${squad}/${produtoDaFeature}/${slugDaFeature}/deliveries/${file}`;
      if (existsSync(join(root, to))) {
        skipped.push({ from, reason: "conflito" });
      } else {
        moves.push({ from, to, kind: "delivery", produto: produtoDaFeature, feature: slugDaFeature });
      }
    }
  }

  return { moves, needsSplit, skipped };
}

/**
 * Remove `dir` se estiver vazio, depois o pai, subindo até (sem incluir) `stopAt`. Usado para
 * não deixar `product/{produto}/` e `engineering/{produto}/` (e as pastas `product`/`engineering`
 * do squad) vazias depois da migração — senão poluem o índice e o aviso `CENTRAL_DOCS_LAYOUT`
 * do Upgrade continua disparando mesmo com a migração completa (#220 item 9).
 * @param {string} dir
 * @param {string} stopAt - Pasta onde parar (exclusive); nunca removida
 */
function removeEmptyDirsUpward(dir, stopAt) {
  let current = dir;
  while (true) {
    const rel = relative(stopAt, current);
    if (rel === "" || rel.startsWith("..")) break; // chegou em stopAt ou saiu dela
    if (!existsSync(current)) break;
    try {
      if (readdirSync(current).length > 0) break;
      rmdirSync(current);
    } catch {
      break; // não vazia por uma corrida, ou sem permissão: deixa como está
    }
    current = dirname(current);
  }
}

/**
 * Garante `.migration-backup/` no `.gitignore` do Central docs (#220 item 7): a cópia de
 * segurança não é um documento publicado, e com `.git` ela não deveria entrar nos commits da
 * migração.
 * @param {string} root
 */
function ensureBackupIgnored(root) {
  const gitignore = join(root, ".gitignore");
  const line = ".migration-backup/";
  if (!existsSync(gitignore)) {
    writeFileSync(gitignore, `${line}\n`);
    return;
  }
  const content = readFileSync(gitignore, "utf-8");
  if (!content.split("\n").some((l) => l.trim() === line)) {
    appendFileSync(gitignore, `${content.endsWith("\n") || content === "" ? "" : "\n"}${line}\n`);
  }
}

/**
 * Aplica o plano: guarda uma cópia de cada arquivo em `{root}/.migration-backup/{timestamp}/`
 * antes de mover (Q6), e move com `rename` (o Central docs pode não ser um repositório git —
 * Q14). Não sobrescreve: um destino já existente foi marcado `skipped` pelo plano e não chega
 * aqui com `moves`. Remove as pastas de origem (`product/{produto}`, `engineering/{produto}`,
 * e `product`/`engineering` do squad) que ficarem vazias (#220 item 9).
 *
 * @param {string} root - Pasta do Central docs
 * @param {{moves: Array<{from: string, to: string}>}} plan - De `planCentralMigration`
 * @param {string} [timestamp] - Para o nome da pasta de backup (testável); padrão: agora
 * @returns {{moved: Array, backupDir: string, errors: string[]}}
 */
export function applyCentralMigration(root, plan, timestamp = new Date().toISOString().replace(/[:.]/g, "-")) {
  const backupDir = join(root, ".migration-backup", timestamp);
  const moved = [];
  const errors = [];
  const emptiedCandidates = new Set();

  for (const m of plan.moves) {
    const fromAbs = join(root, m.from);
    const toAbs = join(root, m.to);
    try {
      if (existsSync(toAbs)) {
        errors.push(`${m.from}: destino já existe (${m.to}), não sobrescrito`);
        continue;
      }
      const backupAbs = join(backupDir, m.from);
      mkdirSync(dirname(backupAbs), { recursive: true });
      cpSync(fromAbs, backupAbs);

      mkdirSync(dirname(toAbs), { recursive: true });
      renameSync(fromAbs, toAbs);
      moved.push(m);
      emptiedCandidates.add(dirname(fromAbs));
    } catch (err) {
      errors.push(`${m.from}: ${err.message.split("\n")[0]}`);
    }
  }

  if (moved.length > 0) {
    ensureBackupIgnored(root);
  }
  for (const dir of emptiedCandidates) {
    removeEmptyDirsUpward(dir, root);
  }

  return { moved, backupDir: relative(root, backupDir), errors };
}
