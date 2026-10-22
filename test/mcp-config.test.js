// Testes do Context7 no arquivo de MCP de cada IDE (mcp-config.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { ensureContext7 } from "../bin/lib/core/mcp-config.js";
import { getIDEValues, getMCPTargets } from "../bin/lib/config/ide-config.js";

function withWorkspace(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-mcp-"));
  try {
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
    }
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const readJson = (ws, rel) => JSON.parse(readFileSync(join(ws, rel), "utf-8"));

test("toda IDE suportada declara ao menos um arquivo de MCP", () => {
  for (const ide of getIDEValues()) assert.ok(getMCPTargets(ide).length > 0, ide);
});

test("claude: cria .mcp.json com mcpServers.context7 (stdio)", () => {
  withWorkspace({}, (ws) => {
    const r = ensureContext7(ws, "claude");
    assert.deepEqual(r.written, [".mcp.json"]);
    assert.deepEqual(readJson(ws, ".mcp.json"), {
      mcpServers: {
        context7: { type: "stdio", command: "npx", args: ["-y", "@upstash/context7-mcp"] },
      },
    });
  });
});

test("arquivo existente: preserva os outros servidores e é idempotente", () => {
  const existing = { mcpServers: { outro: { command: "x" } }, extra: 1 };
  withWorkspace({ ".cursor/mcp.json": JSON.stringify(existing) }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "cursor").written, [".cursor/mcp.json"]);
    const after = readJson(ws, ".cursor/mcp.json");
    assert.deepEqual(after.mcpServers.outro, { command: "x" });
    assert.equal(after.extra, 1);
    assert.ok(after.mcpServers.context7);
    const again = ensureContext7(ws, "cursor");
    assert.deepEqual(again.written, []);
    assert.deepEqual(again.present, [".cursor/mcp.json"]);
  });
});

test("JSON inválido: não mexe no arquivo e devolve o trecho com o motivo", () => {
  withWorkspace({ ".mcp.json": "{ quebrado" }, (ws) => {
    const r = ensureContext7(ws, "claude");
    assert.deepEqual(r.written, []);
    assert.equal(r.manual.length, 1);
    assert.match(r.manual[0].reason, /não consegui ler o JSON/);
    assert.match(r.manual[0].snippet, /"context7"/);
    assert.equal(readFileSync(join(ws, ".mcp.json"), "utf-8"), "{ quebrado");
  });
});

test("opencode: chave mcp com type local e command em array", () => {
  withWorkspace({}, (ws) => {
    ensureContext7(ws, "opencode");
    const cfg = readJson(ws, "opencode.json");
    assert.equal(cfg.$schema, "https://opencode.ai/config.json");
    assert.deepEqual(cfg.mcp.context7, {
      type: "local",
      command: ["npx", "-y", "@upstash/context7-mcp"],
      enabled: true,
    });
  });
});

test("codex: acrescenta [mcp_servers.context7] ao config.toml sem duplicar", () => {
  withWorkspace({ ".codex/config.toml": 'model = "x"\n' }, (ws) => {
    ensureContext7(ws, "codex");
    ensureContext7(ws, "codex");
    const toml = readFileSync(join(ws, ".codex/config.toml"), "utf-8");
    assert.match(toml, /^model = "x"$/m);
    assert.equal(toml.match(/^\[mcp_servers\.context7\]$/gm).length, 1);
    assert.match(toml, /^args = \["-y", "@upstash\/context7-mcp"\]$/m);
  });
});

test("gemini: grava o do Gemini CLI e o do Antigravity", () => {
  withWorkspace({}, (ws) => {
    assert.deepEqual(ensureContext7(ws, "gemini").written, [
      ".gemini/settings.json",
      ".agents/mcp_config.json",
    ]);
  });
});

test("windsurf (só config global): não grava nada, devolve o trecho para colar", () => {
  withWorkspace({}, (ws) => {
    const r = ensureContext7(ws, "windsurf");
    assert.deepEqual(r.written, []);
    assert.ok(r.manual.length > 0);
    assert.match(r.manual[0].snippet, /"context7"/);
    assert.ok(!existsSync(join(ws, "mcp_config.json")));
  });
});
