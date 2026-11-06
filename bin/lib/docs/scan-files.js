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
 * Nome de chave sensível seguido de `:` ou `=` e de um valor longo (16+ caracteres sem espaço).
 * `API_KEY=` vazio e `token: <seu-token>` não casam.
 * @constant {RegExp}
 */
export const SECRET_RE = /\b(api[_-]?key|access[_-]?key|secret|token|password|passwd|senha)\b["']?\s*[:=]\s*["']?[A-Za-z0-9_\-/+=.]{16,}/i;

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
      const m = lines[i].match(SECRET_RE);
      if (m) flags.push({ kind: "possível segredo", detail: `linha ${i + 1}, chave "${m[1].toLowerCase()}"` });
    }
  }
  return flags;
}
