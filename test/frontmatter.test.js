/**
 * readDescription (#83): o `description` em bloco (`>`/`|`) era lido como ">" pelo `jarvis list` e
 * pela geração do OpenCode, e a cópia do Kiro cortava o bloco na letra "Z".
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readDescription } from "../bin/lib/utils/frontmatter.js";
import { discoverAll } from "../bin/lib/core/scanner.js";
import { syncAssets } from "../bin/lib/core/sync-engine.js";
import { getWorkflowsFolder } from "../bin/lib/config/ide-config.js";
import { OPENCODE_MODEL_MAP } from "../bin/lib/config/constants.js";

test("readDescription: valor na mesma linha, com e sem aspas", () => {
  assert.equal(
    readDescription("name: x\ndescription: Um texto: com dois-pontos"),
    "Um texto: com dois-pontos"
  );
  assert.equal(readDescription('description: "Entre aspas"\nversion: 1'), "Entre aspas");
  assert.equal(readDescription("description: 'Simples'"), "Simples");
});

test("readDescription: bloco > e | numa linha só, parando na próxima chave", () => {
  const bloco = [
    "name: x",
    "description: >",
    "  Primeira linha",
    "  da Zona Sul.",
    "version: 1",
  ].join("\n");
  assert.equal(readDescription(bloco), "Primeira linha da Zona Sul.");
  assert.equal(readDescription("description: |\n  um\n\n  dois\nlicense: MIT"), "um dois");
  assert.equal(readDescription("description: >-\n  com indicador"), "com indicador");
});

test("readDescription: bloco no fim do frontmatter e campo ausente", () => {
  assert.equal(
    readDescription("name: x\ndescription: >\n  Último campo, com Z no meio"),
    "Último campo, com Z no meio"
  );
  assert.equal(readDescription("name: x"), "");
  assert.equal(readDescription(null), "");
});

test("jarvis list: nenhum agent, skill ou workflow real com a descrição '>' (#83)", () => {
  const all = discoverAll();
  const ruins = [...all.agents, ...all.skills, ...all.workflows]
    .filter((item) => /^[>|][+-]?$/.test(item.description))
    .map((item) => item.id);
  assert.deepEqual(ruins, []);
  const review = all.workflows.find((w) => w.id === "eng.frontend-review");
  assert.match(review.description, /^Revisão de PR frontend/);
});

test("OpenCode: agents e commands gerados do framework real sem description '>' (#83)", () => {
  const target = mkdtempSync(join(tmpdir(), "jarvis-opencode-"));
  try {
    syncAssets(target, "opencode", { workflowsFolder: getWorkflowsFolder("opencode") });
    const ide = join(target, ".opencode");
    const ruins = [];
    for (const pasta of ["agents", "agent", "commands", "command"]) {
      let nomes = [];
      try {
        nomes = readdirSync(join(ide, pasta)).filter((n) => n.endsWith(".md"));
      } catch {
        continue;
      }
      for (const nome of nomes) {
        if (/^description: "[>|]"$/m.test(readFileSync(join(ide, pasta, nome), "utf-8"))) {
          ruins.push(`${pasta}/${nome}`);
        }
      }
    }
    assert.deepEqual(ruins, []);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("OpenCode: model dos agents, dos comandos e do opencode.json na família Claude 5.5 (#239)", () => {
  const target = mkdtempSync(join(tmpdir(), "jarvis-opencode-model-"));
  try {
    syncAssets(target, "opencode", { workflowsFolder: getWorkflowsFolder("opencode") });
    const model = (caminho) =>
      readFileSync(join(target, ".opencode", caminho), "utf-8").match(/^model: (.*)$/m)?.[1];
    // opus e sonnet (shorthands do mapa); claude-sonnet-5 passa pelo fallback anthropic/{id}.
    assert.equal(model("agents/engineering/eng.agent.md"), "anthropic/claude-opus-5-5");
    assert.equal(model("agents/product/prod.pm-checker.md"), "anthropic/claude-sonnet-5-5");
    assert.equal(model("commands/eng.start.md"), "anthropic/claude-sonnet-5");
    // haiku não é usado por nenhum agent hoje: confere direto no mapa.
    assert.equal(OPENCODE_MODEL_MAP.haiku, "anthropic/claude-haiku-5-5");
    const config = JSON.parse(readFileSync(join(target, "opencode.json"), "utf-8"));
    assert.equal(config.model, "anthropic/claude-sonnet-5-5");
    // Nenhum model gerado aponta para os IDs antigos (o do haiku nem existia no catálogo).
    const antigos = [];
    const visitar = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const caminho = join(dir, e.name);
        if (e.isDirectory()) visitar(caminho);
        else if (
          e.name.endsWith(".md") &&
          /^model: .*(4-6|haiku-4-5)/m.test(readFileSync(caminho, "utf-8"))
        ) {
          antigos.push(caminho.slice(target.length + 1));
        }
      }
    };
    visitar(join(target, ".opencode"));
    assert.deepEqual(antigos, []);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("rules reais: o Applies to vem na 1ª linha ou logo depois do frontmatter (#83)", () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
  const fora = [];
  const visitar = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, e.name);
      if (e.isDirectory()) visitar(caminho);
      else if (e.name.endsWith(".md") && !["AGENTS.md", "README.md"].includes(e.name)) {
        const texto = readFileSync(caminho, "utf-8");
        const fm = texto.match(/^---\n[\s\S]*?\n---\n/);
        const corpo = (fm ? texto.slice(fm[0].length) : texto).replace(/^\n+/, "");
        if (!corpo.startsWith("> **Applies to:**")) fora.push(caminho.slice(raiz.length + 1));
      }
    }
  };
  visitar(join(raiz, "rules"));
  visitar(join(raiz, "rules-on-demand"));
  assert.deepEqual(fora, []);
});

test("readDescription: indicadores de bloco e aspas escapadas (#83)", () => {
  assert.equal(readDescription("description: >2\n  a\n  b\nlicense: MIT"), "a b");
  assert.equal(readDescription("description: |-\n  x"), "x");
  assert.equal(readDescription('description: "diz \\"oi\\""'), 'diz "oi"');
});

test("readDescription: CRLF, valor vazio e description aninhada (#83)", () => {
  assert.equal(readDescription("name: x\r\ndescription: Com CRLF\r\nversion: 1\r"), "Com CRLF");
  assert.equal(readDescription("description: >\r\n  a\r\n  b\r\nlicense: MIT\r"), "a b");
  assert.equal(readDescription('description: ""'), "");
  assert.equal(readDescription("name: x\nmetadata:\n  description: aninhada"), "");
});

test("readDescription: uma aspa sozinha continua como está (#83)", () => {
  assert.equal(readDescription('description: "'), '"');
  assert.equal(readDescription("description: '"), "'");
});
