/**
 * @fileoverview Detecta, nos arquivos de uma sessão, o que não pode ser publicado sem a
 * confirmação da pessoa (Q4 e Q15 da #229): arquivo que não é Markdown, binário, acima de 1 MB e
 * Markdown com possível segredo. É a trava do `publish --manifest`: a entrada marcada
 * `confirmed: true` no manifesto foi aprovada pela pessoa no Passo 4 do `/eng.spec-consolidate`;
 * sem isso, o arquivo sinalizado não é publicado. Nunca devolve o valor do possível segredo,
 * só a linha e o nome da chave.
 * @module docs/scan-files
 */

import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { extname } from "node:path";

/** @constant {number} Acima disto (1 MB) o arquivo só é publicado com confirmação. */
export const MAX_BYTES = 1024 * 1024;

/** @constant {number} Quantos bytes do começo olhar para decidir se o arquivo é binário. */
const SNIFF_BYTES = 8000;

/** @constant {number} Acima disto não se varre o texto atrás de segredo (já é "acima de 1 MB"). */
const MAX_SCAN_BYTES = 5 * MAX_BYTES;

/**
 * Nome de chave sensível (com ou sem prefixo, como `GITHUB_TOKEN`, `OPENAI_API_KEY`, `DB_PASSWORD`,
 * `client-secret`) seguido de `:` ou `=` e de um valor longo (16+ caracteres sem espaço).
 * `API_KEY=` vazio e `token: <seu-token>` não casam. O grupo 1 é só a palavra-chave (sem prefixo). O
 * lookbehind aceita o prefixo (`GITHUB_` termina em `_`, que não é letra nem número) e mantém a busca
 * linear: um prefixo repetido no regex ficaria quadrático numa linha enorme.
 * @constant {RegExp}
 */
export const SECRET_RE = /(?<![A-Za-z0-9])(api[_-]?key|access[_-]?key|secret|token|password|passwd|senha)(?![A-Za-z0-9])["']?\s*[:=]\s*["']?[A-Za-z0-9_\-/+=.]{16,}/i;

/**
 * Outros formatos que denunciam um segredo mesmo sem uma chave nomeada ao lado.
 * @constant {ReadonlyArray<{ re: RegExp, label: string }>}
 */
const OTHER_SECRETS = Object.freeze([
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: "chave privada (PEM)" },
  { re: /:\/\/[^\s:@/]+:[^\s@/]+@/, label: "credencial dentro de uma URL" },
  { re: /\bBearer\s+[A-Za-z0-9_\-.=]{16,}/, label: "token Bearer" },
  { re: /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bglpat-[A-Za-z0-9_-]{16,}|\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9]{20,}/, label: "token com prefixo conhecido" },
]);

/**
 * Diz o que parece segredo numa linha, sem nunca devolver o valor.
 * @param {string} line
 * @returns {string|null} descrição curta (`chave "token"`, `chave privada (PEM)`…) ou `null`
 */
export function secretKind(line) {
  const keyed = line.match(SECRET_RE);
  if (keyed) return `chave "${keyed[1].toLowerCase()}"`;
  for (const { re, label } of OTHER_SECRETS) if (re.test(line)) return label;
  return null;
}

/**
 * @typedef {Object} ScanFlag
 * @property {"não é Markdown"|"binário"|"acima de 1 MB"|"possível segredo"} kind
 * @property {string} detail - Texto curto para mostrar à pessoa (sem o valor do segredo)
 */

/**
 * O arquivo contém byte nulo no começo (sinal de binário)?
 * @param {string} path
 * @returns {boolean}
 */
function looksBinary(path) {
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(SNIFF_BYTES);
    const n = readSync(fd, buf, 0, SNIFF_BYTES, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    closeSync(fd);
  }
}

/**
 * Confere um arquivo da sessão.
 * @param {string} path
 * @returns {ScanFlag[]} vazio = pode publicar sem perguntar
 */
export function scanFile(path) {
  const flags = [];
  const bytes = statSync(path).size;
  const ext = extname(path).toLowerCase();

  if (ext !== ".md") flags.push({ kind: "não é Markdown", detail: ext ? `extensão ${ext}` : "sem extensão" });
  if (bytes > MAX_BYTES) flags.push({ kind: "acima de 1 MB", detail: `${(bytes / MAX_BYTES).toFixed(1)} MB` });

  let binary = false;
  try {
    binary = looksBinary(path);
  } catch {
    // ilegível: o erro aparece na publicação
  }
  if (binary) {
    flags.push({ kind: "binário", detail: "contém byte nulo" });
    return flags;
  }

  if (bytes <= MAX_SCAN_BYTES) {
    const lines = readFileSync(path, "utf-8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const kind = secretKind(lines[i]);
      if (kind) flags.push({ kind: "possível segredo", detail: `linha ${i + 1}, ${kind}` });
    }
  }
  return flags;
}
