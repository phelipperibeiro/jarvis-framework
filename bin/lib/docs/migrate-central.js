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
  const ownersByDelivery = new Map(); // "delivery-x.md" -> Set<slug>

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
        ownersByDelivery.get(name).add(slug);
      }
    }
  }

  for (const produto of listDirs(engineeringDir)) {
    for (const file of listFiles(join(engineeringDir, produto))) {
      if (!file.startsWith("delivery-") || !file.endsWith(".md") || file.endsWith(".public.md")) {
        continue;
      }
      const from = `${squad}/engineering/${produto}/${file}`;
      const owners = [...(ownersByDelivery.get(file) || [])].sort();

      if (owners.length === 0) {
        skipped.push({ from, reason: "sem funcionalidade" });
        continue;
      }
      if (owners.length > 1) {
        needsSplit.push({ from, produto, delivery: file, features: owners });
        continue;
      }

      const to = `${squad}/${produto}/${owners[0]}/deliveries/${file}`;
      if (existsSync(join(root, to))) {
        skipped.push({ from, reason: "conflito" });
      } else {
        moves.push({ from, to, kind: "delivery", produto, feature: owners[0] });
      }
    }
  }

  return { moves, needsSplit, skipped };
}

/**
 * Aplica o plano: guarda uma cópia de cada arquivo em `{root}/.migration-backup/{timestamp}/`
 * antes de mover (Q6), e move com `rename` (o Central docs pode não ser um repositório git —
 * Q14). Não sobrescreve: um destino já existente foi marcado `skipped` pelo plano e não chega
 * aqui com `moves`.
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
    } catch (err) {
      errors.push(`${m.from}: ${err.message.split("\n")[0]}`);
    }
  }

  return { moved, backupDir: relative(root, backupDir), errors };
}
