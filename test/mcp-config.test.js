// Testes do Context7 no arquivo de MCP de cada IDE (mcp-config.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { ensureContext7, mcpSnippet } from "../bin/lib/core/mcp-config.js";
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

test("caminho do arquivo de MCP por IDE", () => {
  const expected = {
    claude: [".mcp.json"],
    cursor: [".cursor/mcp.json"],
    codex: [".codex/config.toml"],
    opencode: ["opencode.json"],
    gemini: [".gemini/settings.json", ".agents/mcp_config.json"],
    kiro: [".kiro/settings/mcp.json"],
  };
  for (const [ide, paths] of Object.entries(expected)) {
    withWorkspace({}, (ws) => {
      assert.deepEqual(ensureContext7(ws, ide).written, paths, ide);
      for (const p of paths) assert.ok(existsSync(join(ws, p)), `${ide}: ${p}`);
    });
  }
  assert.ok(getMCPTargets("windsurf").every((t) => t.global && t.path.startsWith("~/")));
});

test("raiz que não é objeto ([] ou null): arquivo intacto e aviso com o motivo", () => {
  for (const content of ["[]", "null", '"x"']) {
    withWorkspace({ ".mcp.json": content }, (ws) => {
      const r = ensureContext7(ws, "claude");
      assert.deepEqual(r.written, [], content);
      assert.match(r.manual[0].reason, /não é um objeto JSON/, content);
      assert.equal(readFileSync(join(ws, ".mcp.json"), "utf-8"), content);
    });
  }
});

test("mcpServers que não é objeto (string, array, número): arquivo intacto e aviso", () => {
  for (const value of ['"abc"', '[{"a":1}]', "5"]) {
    const content = `{"mcpServers":${value}}`;
    withWorkspace({ ".mcp.json": content }, (ws) => {
      const r = ensureContext7(ws, "claude");
      assert.deepEqual(r.written, [], value);
      assert.match(r.manual[0].reason, /"mcpServers" não é um objeto/, value);
      assert.equal(readFileSync(join(ws, ".mcp.json"), "utf-8"), content);
    });
  }
});

test("mcpServers null vira objeto e recebe o context7", () => {
  withWorkspace({ ".mcp.json": '{"mcpServers":null}' }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "claude").written, [".mcp.json"]);
    assert.ok(readJson(ws, ".mcp.json").mcpServers.context7);
  });
});

test("JSON com BOM é lido; JSON com comentários fica intacto", () => {
  withWorkspace({ ".mcp.json": '\uFEFF{"mcpServers":{}}' }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "claude").written, [".mcp.json"]);
    const text = readFileSync(join(ws, ".mcp.json"), "utf-8");
    assert.ok(text.startsWith("\uFEFF"), "BOM preservado");
    assert.ok(JSON.parse(text.slice(1)).mcpServers.context7);
  });
  const jsonc = '{\n  // servidores\n  "mcpServers": {}\n}\n';
  withWorkspace({ ".gemini/settings.json": jsonc }, (ws) => {
    const r = ensureContext7(ws, "gemini");
    assert.deepEqual(r.written, [".agents/mcp_config.json"]);
    assert.equal(r.manual[0].path, ".gemini/settings.json");
    assert.equal(readFileSync(join(ws, ".gemini/settings.json"), "utf-8"), jsonc);
  });
});

test("preserva a indentação do JSON existente (tab e 4 espaços)", () => {
  for (const [indent, sample] of [
    ["\t", '{\n\t"mcpServers": {}\n}\n'],
    ["    ", '{\n    "mcpServers": {}\n}\n'],
  ]) {
    withWorkspace({ ".mcp.json": sample }, (ws) => {
      ensureContext7(ws, "claude");
      const text = readFileSync(join(ws, ".mcp.json"), "utf-8");
      assert.ok(text.startsWith(`{\n${indent}"mcpServers"`), JSON.stringify(indent));
    });
  }
});

test("codex: variantes do cabeçalho já existentes não são duplicadas", () => {
  const variants = [
    '[mcp_servers."context7"]\ncommand = "npx"\n',
    "[ mcp_servers.context7 ]\ncommand = 'npx'\n",
    '[mcp_servers]\ncontext7 = { command = "npx" }\n',
    'mcp_servers = { context7 = { command = "npx" } }\n',
    'mcp_servers.context7.command = "npx"\n',
  ];
  for (const toml of variants) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.present, [".codex/config.toml"], toml);
      assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), toml);
    });
  }
});

test("codex: separador antes do bloco conforme o fim do arquivo", () => {
  const block = mcpSnippet(getMCPTargets("codex")[0]);
  for (const [before, sep] of [
    ['model = "x"', "\n\n"],
    ['model = "x"\n', "\n"],
    ['model = "x"\n\n', ""],
  ]) {
    withWorkspace({ ".codex/config.toml": before }, (ws) => {
      ensureContext7(ws, "codex");
      assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), before + sep + block);
    });
  }
  withWorkspace({}, (ws) => {
    ensureContext7(ws, "codex");
    assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), block);
  });
});

test("mcpSnippet: JSON com a chave da IDE e TOML com a tabela do servidor", () => {
  const json = JSON.parse(mcpSnippet(getMCPTargets("opencode")[0]));
  assert.deepEqual(Object.keys(json), ["mcp"]);
  assert.equal(json.mcp.context7.type, "local");
  assert.equal(
    mcpSnippet(getMCPTargets("codex")[0]),
    '[mcp_servers.context7]\ncommand = "npx"\nargs = ["-y", "@upstash/context7-mcp"]\n'
  );
});

test("erro de IO (.mcp.json é um diretório): vai para errors, nada é gravado", () => {
  withWorkspace({}, (ws) => {
    mkdirSync(join(ws, ".mcp.json"));
    const r = ensureContext7(ws, "claude");
    assert.equal(r.errors.length, 1);
    assert.deepEqual(r.written, []);
  });
});

test("opencode: arquivo existente sem $schema continua sem a chave", () => {
  const existing = { model: "x", mcp: { outro: { type: "local", command: ["y"] } } };
  withWorkspace({ "opencode.json": JSON.stringify(existing) }, (ws) => {
    ensureContext7(ws, "opencode");
    const cfg = readJson(ws, "opencode.json");
    assert.ok(!("$schema" in cfg));
    assert.equal(cfg.model, "x");
    assert.deepEqual(cfg.mcp.outro, existing.mcp.outro);
    assert.ok(cfg.mcp.context7);
  });
});

test("indentação: JSON minificado sai com 2 espaços; com 1 espaço, mantém 1", () => {
  withWorkspace({ ".mcp.json": '{"mcpServers":{}}' }, (ws) => {
    ensureContext7(ws, "claude");
    assert.ok(readFileSync(join(ws, ".mcp.json"), "utf-8").startsWith('{\n  "mcpServers"'));
  });
  withWorkspace({ ".mcp.json": '{\n "mcpServers": {}\n}\n' }, (ws) => {
    ensureContext7(ws, "claude");
    assert.ok(readFileSync(join(ws, ".mcp.json"), "utf-8").startsWith('{\n "mcpServers"'));
  });
});

test("JSON com CRLF é regravado com CRLF", () => {
  withWorkspace({ ".mcp.json": '{\r\n  "mcpServers": {}\r\n}\r\n' }, (ws) => {
    ensureContext7(ws, "claude");
    const text = readFileSync(join(ws, ".mcp.json"), "utf-8");
    assert.ok(!/[^\r]\n/.test(text), "toda quebra é CRLF");
    assert.ok(JSON.parse(text).mcpServers.context7);
  });
});

test("codex: inline com outras chaves antes do context7 é reconhecido", () => {
  const toml = 'mcp_servers = { outro = { command = "x" }, context7 = { command = "npx" } }\n';
  withWorkspace({ ".codex/config.toml": toml }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "codex").present, [".codex/config.toml"]);
  });
});

test("codex: TOML com CRLF recebe o bloco com CRLF", () => {
  withWorkspace({ ".codex/config.toml": 'model = "x"\r\n' }, (ws) => {
    ensureContext7(ws, "codex");
    const text = readFileSync(join(ws, ".codex/config.toml"), "utf-8");
    assert.ok(!/[^\r]\n/.test(text), "toda quebra é CRLF");
    assert.match(text, /\[mcp_servers\.context7\]\r\n/);
  });
});

test("codex: menções que não são chave não geram aviso e recebem o bloco", () => {
  const cases = [
    '[mcp_servers.outro]\nargs = ["a,context7=1"]\n',
    'model = "x" # context7 = 1\n',
    'site = "context7.com"\n',
    'lista = ["context7"]\n',
    'nota = """\ncontext7 = 1\n"""\n',
    "nota = '''\n[context7\n'''\n",
    "m = [\n  [\n 1 ],\n]\n",
  ];
  for (const toml of cases) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.written, [".codex/config.toml"], toml);
      assert.deepEqual(r.manual, [], toml);
    });
  }
});

test("codex: context7 fora de mcp_servers (em outra tabela) recebe o bloco", () => {
  const cases = [
    '[outros]\ncontext7 = { command = "npx" }\n',
    '[other]\nmcp_servers.context7.command = "x"\n',
  ];
  for (const toml of cases) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.written, [".codex/config.toml"], toml);
      const after = readFileSync(join(ws, ".codex/config.toml"), "utf-8");
      assert.ok(after.startsWith(toml), toml);
      assert.match(after, /^\[mcp_servers\.context7\]$/m, toml);
    });
  }
});

test("codex: mcp_servers inline sem context7 não é estendido: aviso, arquivo intacto", () => {
  const cases = [
    'mcp_servers = { context7-legacy = { command = "x" } }\n',
    'mcp_servers = { outro = { env = { context7 = "1" } } }\n',
  ];
  for (const toml of cases) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.present, [], toml);
      assert.match(r.manual[0].reason, /deixaria o TOML inválido/, toml);
      assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), toml);
    });
  }
});

test("codex: TOML que não parseia fica intacto e vira aviso", () => {
  const cases = ['[mcp_servers.outro\ncommand = "x"\n', 'model = "x"\nmodel = "y"\n'];
  for (const toml of cases) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.match(r.manual[0].reason, /não pôde ser lido/, toml);
      assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), toml);
    });
  }
});

test("codex: mcp_servers que não é tabela vira aviso", () => {
  const toml = 'mcp_servers = "x"\n';
  withWorkspace({ ".codex/config.toml": toml }, (ws) => {
    const r = ensureContext7(ws, "codex");
    assert.match(r.manual[0].reason, /"mcp_servers" não é uma tabela/);
    assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), toml);
  });
});

test("codex: escape em string multilinha e array multilinha recebem o bloco", () => {
  const tq = '"'.repeat(3);
  const cases = [
    `[other]\nnota = ${tq}\nx \\${tq}\n[mcp_servers.context7]\n${tq}\n`,
    `nota = ${tq}x\\${tq}\n[mcp_servers]\ncontext7 = 1\n${tq}\n`,
    "m = [\n  [1, 2],\n  [3],\n]\n",
  ];
  for (const toml of cases) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.written, [".codex/config.toml"], toml);
      assert.deepEqual(r.manual, [], toml);
    });
  }
});

test("context7 que existe mas não parece um servidor vira aviso (TOML e JSON)", () => {
  const toml = [
    "[mcp_servers]\ncontext7 = 1\n",
    "[mcp_servers]\ncontext7 = false\n",
    "mcp_servers.context7 = []\n",
    "[mcp_servers.context7]\n",
    '[mcp_servers.context7.env]\nX = "1"\n',
  ];
  for (const text of toml) {
    withWorkspace({ ".codex/config.toml": text }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.present, [], text);
      assert.match(r.manual[0].reason, /não parece um servidor/, text);
      assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), text);
    });
  }
  for (const json of ['{"mcpServers":{"context7":1}}', '{"mcpServers":{"context7":{}}}']) {
    withWorkspace({ ".mcp.json": json }, (ws) => {
      const r = ensureContext7(ws, "claude");
      assert.deepEqual(r.present, [], json);
      assert.match(r.manual[0].reason, /não parece um servidor/, json);
      assert.equal(readFileSync(join(ws, ".mcp.json"), "utf-8"), json);
    });
  }
});

test("context7 com url (servidor remoto) conta como já configurado", () => {
  const toml = '[mcp_servers.context7]\nurl = "https://exemplo/mcp"\n';
  withWorkspace({ ".codex/config.toml": toml }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "codex").present, [".codex/config.toml"]);
  });
});

test("codex: TOML com BOM e arquivo vazio recebem o bloco; [[mcp_servers]] vira aviso", () => {
  withWorkspace({ ".codex/config.toml": '﻿model = "x"\n' }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "codex").written, [".codex/config.toml"]);
    const text = readFileSync(join(ws, ".codex/config.toml"), "utf-8");
    assert.ok(text.startsWith("﻿"), "BOM preservado");
    assert.match(text, /^\[mcp_servers\.context7\]$/m);
  });
  withWorkspace({ ".codex/config.toml": "" }, (ws) => {
    assert.deepEqual(ensureContext7(ws, "codex").written, [".codex/config.toml"]);
  });
  const arrayOfTables = '[[mcp_servers]]\nname = "x"\n';
  withWorkspace({ ".codex/config.toml": arrayOfTables }, (ws) => {
    const r = ensureContext7(ws, "codex");
    assert.match(r.manual[0].reason, /"mcp_servers" não é uma tabela/);
    assert.equal(readFileSync(join(ws, ".codex/config.toml"), "utf-8"), arrayOfTables);
  });
});

test("parece um servidor: vazio vira aviso; remotos e enabled=false contam", () => {
  const invalid = [
    { command: [] },
    { command: "  " },
    { command: 0 },
    { command: false },
    { command: [""] },
    { url: "" },
    { httpUrl: " " },
    { enabled: false },
  ];
  for (const entry of invalid) {
    const json = JSON.stringify({ mcpServers: { context7: entry } });
    withWorkspace({ ".mcp.json": json }, (ws) => {
      const r = ensureContext7(ws, "claude");
      assert.deepEqual(r.present, [], json);
      assert.match(r.manual[0].reason, /não parece um servidor/, json);
    });
  }
  const valid = [
    { type: "http", url: "https://exemplo/mcp" },
    { type: "sse", url: "https://exemplo/sse" },
    { type: "remote", url: "https://exemplo/mcp" },
    { httpUrl: "https://exemplo/mcp" },
    { serverUrl: "https://exemplo/mcp" },
    { type: "local", command: ["npx", "-y", "@upstash/context7-mcp"] },
    { command: "npx", enabled: false },
  ];
  for (const entry of valid) {
    const json = JSON.stringify({ mcpServers: { context7: entry } });
    withWorkspace({ ".mcp.json": json }, (ws) => {
      assert.deepEqual(ensureContext7(ws, "claude").present, [".mcp.json"], json);
    });
  }
});

test("codex: command vazio ou url vazia no TOML viram aviso", () => {
  for (const toml of [
    '[mcp_servers.context7]\ncommand = ""\n',
    '[mcp_servers.context7]\nurl = " "\n',
  ]) {
    withWorkspace({ ".codex/config.toml": toml }, (ws) => {
      const r = ensureContext7(ws, "codex");
      assert.deepEqual(r.present, [], toml);
      assert.match(r.manual[0].reason, /não parece um servidor/, toml);
    });
  }
});
