// Teste de integração de `jarvis init --upgrade` (pasta temporária, sem rede). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "bin", "jarvis.js");

// ENV no formato da v5.2.0: sem DISCOVERIES_* e (para o teste) sem a chave PROD_MODE
const ENV_V520 = [
  "WORKSPACE=ws",
  "IDE=claude",
  "HUB=BACKEND",
  "AREA=ENGINEERING",
  "TASK_MANAGER=github",
  "MESSAGE_BROKER=[rabbitmq, kafka, sqs]",
  "SMTP=",
  "RTK_ENABLED=false",
  "DOCS_FOLDER=docs",
  "JARVIS_DOCS=$DOCS_FOLDER/jarvis",
  "ENG_DOCS=$JARVIS_DOCS/engineering",
  "PROD_FOLDER_NAME=product",
  "PROD_DOCS=$JARVIS_DOCS/$PROD_FOLDER_NAME",
  "",
].join("\n");

const OLD = "docs/jarvis/product/discoveries/discovery-001-x.md";
const NEW = "docs/jarvis/discoveries/discovery-001-x.md";
const PRD = "docs/jarvis/product/prd-001-x/prd-001-x.md";

function withWorkspace(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-init-upgrade-"));
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

const run = (cwd, ...args) =>
  spawnSync(process.execPath, [cli, "init", ...args], { cwd, encoding: "utf-8", stdio: "pipe" });

test("init --upgrade --yes: chaves novas, PROD_MODE pela AREA, discovery movido, ENV antigo intacto, idempotente", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_V520,
      [OLD]: "# discovery",
      [PRD]: "---\nid: 1\nrelated_discovery: docs/product/discoveries/discovery-001-x.md\n---\n",
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);

      const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
      assert.ok(env.startsWith(ENV_V520), "linhas existentes do ENV mudaram");
      assert.match(env, /^DISCOVERIES_FOLDER_NAME=discoveries$/m);
      assert.match(env, /^DISCOVERIES_DOCS=\$JARVIS_DOCS\/\$DISCOVERIES_FOLDER_NAME$/m);
      assert.match(env, /^PROD_MODE=developer-guided$/m);
      assert.match(env, /^ARTIFACT_STYLE=ai-generated$/m);
      assert.match(env, /^RTK_ENABLED=false$/m);
      assert.equal((env.match(/^TASK_MANAGER=/gm) || []).length, 1);

      assert.ok(existsSync(join(ws, NEW)));
      assert.ok(!existsSync(join(ws, "docs/jarvis/product/discoveries")));
      assert.match(
        readFileSync(join(ws, PRD), "utf-8"),
        new RegExp(`^related_discovery: ${NEW}$`, "m")
      );
      assert.match(r.stdout, /\/jarvis-init upgrade/);

      const again = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(again.status, 0, again.stderr);
      assert.equal(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), env);
      assert.match(again.stdout, /nenhuma variável nova/);
    }
  );
});

test("init --upgrade sem terminal e sem --yes: não move e DISCOVERIES_DOCS fica no caminho antigo", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, [OLD]: "# discovery" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(ws, OLD)));
    assert.ok(!existsSync(join(ws, NEW)));
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.match(env, /^DISCOVERIES_DOCS=\$PROD_DOCS\/discoveries$/m);
  });
});

test("init --upgrade sem ENV.md: sai com erro e orienta jarvis init", () => {
  withWorkspace({}, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude");
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /jarvis init/);
    assert.ok(!existsSync(join(ws, ".claude")));
  });
});

test("init --upgrade: Central docs antigo só gera aviso; PROD_MODE= existente não muda", () => {
  const env = `${ENV_V520}PROD_MODE=\nCENTRAL_DOCS_REPO=git@exemplo:docs.git\n`;
  withWorkspace({ ".claude/ENV.md": env }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    const after = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.ok(after.startsWith(env));
    assert.match(after, /^PROD_MODE=$/m);
    assert.ok(!existsSync(join(ws, "docs/jarvis/central-docs/.git")));
    assert.match(r.stdout, /CENTRAL_DOCS_REPO/);
    assert.match(r.stdout, /PROD_MODE está vazio/);
    assert.ok(!r.stdout.includes("git@exemplo"), "valor do ENV apareceu no resumo");
  });
});

test("init --upgrade: ENV com JARVIS_DOCS depois de PROD_DOCS (upgrade antigo) ainda acha o discovery", () => {
  const env =
    ENV_V520.replace("JARVIS_DOCS=$DOCS_FOLDER/jarvis\n", "") + "JARVIS_DOCS=$DOCS_FOLDER/jarvis\n";
  withWorkspace({ ".claude/ENV.md": env, [OLD]: "# discovery" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(ws, OLD)));
    assert.match(
      readFileSync(join(ws, ".claude/ENV.md"), "utf-8"),
      /^DISCOVERIES_DOCS=\$PROD_DOCS\/discoveries$/m
    );
  });
});
