// Repositórios do workspace × mapa de tecnologias (CDD-MIND-MAP.md), #225.
// Funções puras e só de leitura: nunca escrevem arquivo. Quem grava o mapa, o bloco do AGENTS.md e o ENV.md
// é o skill (`/jarvis-init repos`), com a confirmação da pessoa.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listGitSubdirs } from "./workspace-mode.js";

export const MAP_FILE = "CDD-MIND-MAP.md";

const norm = (s) => String(s).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Tira negrito/crase das pontas (cabeçalho e nome) de uma célula da tabela. */
const unmark = (s) => String(s).replace(/^[`*\s]+|[`*\s]+$/g, "");

/** Nome do repositório: sem link (`[api](api/)` vira `api`), sem negrito/crase e sem barra no fim. */
const cleanName = (raw) => unmark(String(raw).replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")).replace(/\/+$/, "");

/**
 * Nomes dos repositórios do mapa: a 1ª coluna da tabela cujo cabeçalho é `Repositório`.
 * Ignora a linha separadora, a linha-modelo `{pasta}`, comentários HTML e linhas tortas (nunca lança).
 * @param {string} text conteúdo do CDD-MIND-MAP.md
 * @returns {string[]}
 */
export function readMapRepos(text) {
  const names = [];
  let inTable = false;
  const body = String(text || "").replace(/<!--[\s\S]*?-->/g, "");
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (!inTable) {
      if (norm(unmark(cells[0])) === "repositorio") inTable = true;
      continue;
    }
    if (cells.every((c) => /^:?-{1,}:?$/.test(c))) continue; // separador
    const name = cleanName(cells[0] || "");
    if (!name || /^\{.*\}$/.test(name)) continue; // vazio ou linha-modelo
    names.push(name);
  }
  return names;
}

/**
 * Repositórios (subpastas com `.git`) que não estão no mapa. Só vale no modo `workspace`; sem o arquivo do
 * mapa não há esta pendência (a falta do mapa é pendência própria, de `documentPendencies`); e **todas** as subpastas com `.git` entram, sem filtrar
 * por `WORKSPACE_REPOS` (senão um clone novo, fora da lista, nunca apareceria).
 * @param {{ workspaceDir: string, mode: string|null }} input
 * @returns {string[]}
 */
export function reposOutsideMap({ workspaceDir, mode }) {
  if (mode !== "workspace") return [];
  const mapPath = join(workspaceDir, MAP_FILE);
  if (!existsSync(mapPath)) return [];
  let text;
  try {
    text = readFileSync(mapPath, "utf-8");
  } catch {
    return [];
  }
  const inMap = new Set(readMapRepos(text));
  return listGitSubdirs(workspaceDir).filter((name) => !inMap.has(name));
}

/**
 * Pendências dos documentos gerados (#225, ajuste do usuário): `AGENTS.md` e `CDD-MIND-MAP.md` existem sempre,
 * nos dois modos, e o `CLAUDE.md` é sempre cópia idêntica do `AGENTS.md` (a fonte). Só lê; quem cria ou
 * sincroniza é o `/jarvis-init upgrade` (item 9.2), com a confirmação da pessoa. Fim de linha não conta (CRLF = LF).
 * @param {string} workspaceDir pasta que contém o `$IDE/`
 * @returns {string[]} um motivo por pendência; vazio = documentos em dia
 */
export function documentPendencies(workspaceDir) {
  const read = (name) => {
    try {
      return readFileSync(join(workspaceDir, name), "utf-8").replace(/\r\n/g, "\n");
    } catch {
      return null;
    }
  };
  const reasons = [];
  if (!existsSync(join(workspaceDir, MAP_FILE))) reasons.push(`criar o mapa de tecnologias (${MAP_FILE})`);
  const agents = read("AGENTS.md");
  if (agents === null) {
    reasons.push("criar o AGENTS.md (e o CLAUDE.md, cópia dele)");
  } else if (read("CLAUDE.md") !== agents) {
    reasons.push("sincronizar o CLAUDE.md com o AGENTS.md (o CLAUDE.md é sempre cópia do AGENTS.md)");
  }
  return reasons;
}

/**
 * Frase da pendência. Só nomes de pasta, nunca valores do ENV.md.
 * @param {string[]} names
 * @returns {string} vazio se não há repositório fora do mapa
 */
export function reposPendencyLine(names) {
  if (!names.length) return "";
  return `Rode /jarvis-init repos: ${names.length} repositório(s) fora do mapa (${names.join(", ")})`;
}
