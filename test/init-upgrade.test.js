// Teste de integração de `jarvis init --upgrade` (pasta temporária, sem rede). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
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

// A descoberta da CLI (gh/glab/acli) fica desligada nos testes; o teste dela usa uma CLI falsa no PATH.
const run = (cwd, ...args) =>
  spawnSync(process.execPath, [cli, "init", ...args], {
    cwd,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
  });

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

test("init --upgrade: WORKSPACE_MODE=workspace quando a raiz não é repositório e há UMA subpasta com .git", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, "app/.git/HEAD": "ref: refs/heads/main\n" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.ok(env.startsWith(ENV_V520), "linhas existentes do ENV mudaram");
    assert.match(env, /^WORKSPACE_MODE=workspace$/m);

    const again = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(again.status, 0, again.stderr);
    assert.equal(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), env);
  });
});

test("init --upgrade: WORKSPACE_MODE=project quando a raiz é repositório", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".git/HEAD": "ref: refs/heads/main\n" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), /^WORKSPACE_MODE=project$/m);
  });
});

test("init --upgrade: WORKSPACE_MODE já definido no ENV não muda", () => {
  withWorkspace(
    { ".claude/ENV.md": `${ENV_V520}WORKSPACE_MODE=project\n`, "app/.git/HEAD": "x\n" },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
      assert.equal((env.match(/^WORKSPACE_MODE=/gm) || []).length, 1);
      assert.match(env, /^WORKSPACE_MODE=project$/m);
    }
  );
});

const SKILL = "---\nname: x\n---\n";

test("init --upgrade: skill antigo é listado e não é removido sem confirmação (nem com --yes)", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, ".claude/skills/skill-antigo/SKILL.md": SKILL },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /Skills instalados que saíram do framework/);
      assert.match(r.stdout, /skill-antigo/);
      assert.ok(existsSync(join(ws, ".claude/skills/skill-antigo/SKILL.md")));
    }
  );
});

test("init --upgrade --remove-stale: remove só o obsoleto; especialização registrada fica", () => {
  withWorkspace(
    {
      ".claude/ENV.md": `${ENV_V520}BACKEND_SPECIALIZATIONS=minha-stack\n`,
      ".claude/skills/skill-antigo/SKILL.md": SKILL,
      ".claude/skills/minha-stack/SKILL.md": SKILL,
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--remove-stale");
      assert.equal(r.status, 0, r.stderr);
      assert.ok(!existsSync(join(ws, ".claude/skills/skill-antigo")));
      assert.ok(existsSync(join(ws, ".claude/skills/minha-stack/SKILL.md")));
      assert.ok(existsSync(join(ws, ".claude/skills/eng-backend/SKILL.md")));

      const again = run(ws, "--upgrade", "--ide", "claude", "--remove-stale");
      assert.equal(again.status, 0, again.stderr);
      assert.doesNotMatch(again.stdout, /saíram do framework/);
    }
  );
});

test("init --upgrade: eng-scraper e eng-scraper-robot-builder (renomeados na #81) saem sozinhos", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_V520,
      ".claude/skills/eng-scraper/SKILL.md": SKILL,
      ".claude/skills/eng-scraper-robot-builder/SKILL.md": SKILL,
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.ok(!existsSync(join(ws, ".claude/skills/eng-scraper")));
      assert.ok(!existsSync(join(ws, ".claude/skills/eng-scraper-robot-builder")));
      assert.doesNotMatch(r.stdout, /saíram do framework/);
    }
  );
});

test("init (instalação): modo workspace não cria .gitignore na raiz e grava o .mcp.json", () => {
  withWorkspace({ "app/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".gitignore")));
    assert.ok(existsSync(join(ws, ".jarvis/sessions/eng")));
    const mcp = JSON.parse(readFileSync(join(ws, ".mcp.json"), "utf-8"));
    assert.ok(mcp.mcpServers.context7);
  });
});

test("init (instalação): modo project cria o .gitignore com .jarvis/", () => {
  withWorkspace({ ".git/HEAD": "" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(join(ws, ".gitignore"), "utf-8"), /^\.jarvis\/$/m);
  });
});

test("init --upgrade: .mcp.json inválido fica intacto, vira aviso e sai com 0", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".mcp.json": "{ quebrado" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(ws, ".mcp.json"), "utf-8"), "{ quebrado");
    assert.match(r.stdout, /Nada alterado; inclua à mão/);
  });
});

test("init --upgrade: .mcp.json com outro servidor é preservado e recebe o context7", () => {
  const mcp = JSON.stringify({ mcpServers: { outro: { command: "x" } } });
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".mcp.json": mcp }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const after = JSON.parse(readFileSync(join(ws, ".mcp.json"), "utf-8"));
    assert.deepEqual(after.mcpServers.outro, { command: "x" });
    assert.ok(after.mcpServers.context7);
  });
});

test("init (instalação): pasta sem nenhum .git não recebe .gitignore", () => {
  withWorkspace({}, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".gitignore")));
  });
});

test("init (instalação): .gitignore existente sem \\n final recebe uma linha .jarvis/", () => {
  withWorkspace({ ".git/HEAD": "", ".gitignore": "node_modules" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(ws, ".gitignore"), "utf-8"), "node_modules\n.jarvis/\n");
  });
});

test("init (instalação) na Windsurf: só config global, mostra o trecho e o que fazer", () => {
  withWorkspace({}, (ws) => {
    const r = run(ws, "--ide", "windsurf");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Config só global: inclua em ~\/\.config\/devin\/mcp_config\.json/);
    assert.match(r.stdout, /"context7"/);
    assert.match(r.stdout, /painel MCP do Cascade/);
  });
});

test("init --upgrade: erro de IO no arquivo de MCP vira aviso e não muda o código de saída", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".mcp.json/x": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /\.mcp\.json: .*\(nada alterado\)/);
  });
});

test("init (instalação): .gitignore com /.jarvis/ não recebe a linha de novo", () => {
  withWorkspace({ ".git/HEAD": "", ".gitignore": "/.jarvis/\n" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(ws, ".gitignore"), "utf-8"), "/.jarvis/\n");
  });
});

test(
  "init --upgrade: token antigo vira aviso sem o valor, JARVIS_PROJECT vazio é preenchido e a CLI é descoberta",
  // o gh falso é um script POSIX
  { skip: process.platform === "win32" },
  () => {
    const env = [
      ENV_V520.trimEnd(),
      "TOKEN_TASK_MANAGER=segredo-xyz",
      "TASK_MANAGER_URL_BASE=https://github.com/o/r",
      "JARVIS_PROJECT=",
      "",
    ].join("\n");
    withWorkspace({ ".claude/ENV.md": env }, (ws) => {
      // gh falso no PATH: --version e auth status com exit 0
      const bin = join(ws, "fake-bin");
      mkdirSync(bin);
      writeFileSync(join(bin, "gh"), "#!/bin/sh\nexit 0\n");
      chmodSync(join(bin, "gh"), 0o755);
      const r = spawnSync(
        process.execPath,
        [cli, "init", "--upgrade", "--ide", "claude", "--yes"],
        {
          cwd: ws,
          encoding: "utf-8",
          stdio: "pipe",
          env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, JARVIS_SKIP_CLI_CHECK: "" },
        }
      );
      assert.equal(r.status, 0, r.stderr);
      const after = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
      assert.match(
        after,
        /^JARVIS_PROJECT=https:\/\/github.com\/phelipperibeiro\/jarvis-framework$/m
      );
      assert.match(after, /^TOKEN_TASK_MANAGER=segredo-xyz$/m, "o Node não apaga o token");
      assert.match(after, /^TASK_MANAGER_ACCESS=$/m);
      assert.equal(
        `${r.stdout}${r.stderr}`.includes("segredo-xyz"),
        false,
        "o valor do token apareceu"
      );
      assert.match(r.stdout, /TOKEN_TASK_MANAGER não é mais usado/);
      assert.match(r.stdout, /JARVIS_PROJECT estava vazio/);
      assert.match(r.stdout, /TASK_MANAGER=github\): `gh`: instalada, logada/);
      assert.match(r.stdout, /confirmar o acesso de TASK_MANAGER/);
    });
  }
);

test("init --upgrade: vendor não suportado (TASK_MANAGER=linear) vira aviso de freelance", () => {
  const env = ENV_V520.replace("TASK_MANAGER=github", "TASK_MANAGER=linear");
  withWorkspace({ ".claude/ENV.md": env }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /TASK_MANAGER=linear não é suportado/);
  });
});
