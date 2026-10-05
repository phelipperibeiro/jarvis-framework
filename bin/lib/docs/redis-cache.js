/**
 * @fileoverview Cache best-effort via `redis-cli` para fetch-file.js/publish-file.js.
 * Nunca lança — falha de leitura/escrita no cache nunca quebra o fluxo principal
 * (mesmo contrato do `fetch-file.sh`/`publish-file.sh` originais, que faziam
 * `redis-cli ... 2>/dev/null || true`).
 * @module docs/redis-cache
 */

import { execFileSync } from "node:child_process";

/**
 * @param {string} key
 * @returns {string} valor em cache, ou "" se não houver (ou `redis-cli` falhar)
 */
export function redisGet(key) {
  try {
    return execFileSync("redis-cli", ["GET", key], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * @param {string} key
 * @param {string|number} ttlSeconds
 * @param {string} value
 */
export function redisSetex(key, ttlSeconds, value) {
  try {
    execFileSync("redis-cli", ["-x", "SETEX", key, String(ttlSeconds)], {
      input: value,
      stdio: ["pipe", "ignore", "ignore"],
    });
  } catch {
    // best-effort
  }
}

/** @param {string} key */
export function redisDel(key) {
  try {
    execFileSync("redis-cli", ["DEL", key], { stdio: "ignore" });
  } catch {
    // best-effort
  }
}
