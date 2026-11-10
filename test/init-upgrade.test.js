// Teste de integração de `jarvis init --upgrade` (pasta temporária, sem rede). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  realpathSync,
  symlinkSync,
  chmodSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import {
  docsIgnoreLines,
  logProjectGitSetup,
  parseMenuChoice,
  upgradePendencies,
  promptCompanyProfile,
  filterRulesByEnv,
} from "../bin/commands/init.js";

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

// #209 e #263: o upgrade apaga MESSAGE_BROKER e SMTP (blocos que saíram do template) e as chaves HUB,
// AREA e POSITION; o resto fica igual.
const semRemovidas = (text) => text.replace(/^(MESSAGE_BROKER|SMTP|HUB|AREA|POSITION)=.*\n/gm, "");

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
const run = (cwd, ...args) => runWithInput(cwd, "", ...args);

// O mesmo, com o texto digitado no menu (pipe, sem terminal: como `printf '\n' | jarvis init`).
const runWithInput = (cwd, input, ...args) =>
  spawnSync(process.execPath, [cli, "init", ...args], {
    cwd,
    input,
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1" },
  });

// Conteúdo de cada arquivo da pasta (caminho relativo → texto), para provar que nada mudou.
function snapshot(dir, base = dir) {
  const out = {};
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, snapshot(full, base));
    else out[full.slice(base.length + 1)] = readFileSync(full, "utf-8");
  }
  return out;
}

test("init --upgrade --yes: chaves novas, PROD_MODE pendente, discovery movido, ENV antigo intacto, idempotente", () => {
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
      assert.ok(env.startsWith(semRemovidas(ENV_V520)), "linhas existentes do ENV mudaram");
      assert.doesNotMatch(env, /^(MESSAGE_BROKER|SMTP)=/m);
      assert.match(r.stdout, /removidas \(não são mais usadas\): HUB, AREA, MESSAGE_BROKER, SMTP/);
      assert.doesNotMatch(r.stdout, /rabbitmq/);
      assert.match(env, /^DISCOVERIES_FOLDER_NAME=discoveries$/m);
      assert.match(env, /^DISCOVERIES_DOCS=\$JARVIS_DOCS\/\$DISCOVERIES_FOLDER_NAME$/m);
      assert.match(env, /^PROD_MODE=$/m);
      assert.match(r.stdout, /PROD_MODE está vazio: responda no \/jarvis-init upgrade/);
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
    assert.ok(after.startsWith(semRemovidas(env)));
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
    assert.ok(env.startsWith(semRemovidas(ENV_V520)), "linhas existentes do ENV mudaram");
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

test("init --upgrade: apaga o skill eng-backend-rabbitmq e a rule data-rules instalados (#209)", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_V520,
      ".claude/skills/eng-backend-rabbitmq/SKILL.md": SKILL,
      ".claude/skills/eng-backend-rabbitmq/references/4-troubleshooting.md": "# x\n",
      ".claude/rules/engineering/data/data-rules.md": "# data\n",
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.ok(!existsSync(join(ws, ".claude/skills/eng-backend-rabbitmq")));
      assert.ok(!existsSync(join(ws, ".claude/rules/engineering/data/data-rules.md")));
      assert.ok(existsSync(join(ws, ".claude/skills/eng-backend/SKILL.md")));
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

test("init (instalação): .gitignore existente sem \\n final recebe as linhas .jarvis/, a pasta da IDE e docs/jarvis/ (#227)", () => {
  withWorkspace({ ".git/HEAD": "", ".gitignore": "node_modules" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(ws, ".gitignore"), "utf-8"), "node_modules\n.jarvis/\n.claude/\ndocs/jarvis/\n");
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
    // .jarvis/ já estava (como /.jarvis/) e não repete; só a pasta da IDE entra (#227)
    assert.equal(readFileSync(join(ws, ".gitignore"), "utf-8"), "/.jarvis/\n.claude/\ndocs/jarvis/\n");
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
          // sem as variáveis de integração do ambiente de quem roda (o resultado não pode depender delas)
          env: {
            ...Object.fromEntries(
              Object.entries(process.env).filter(
                ([k]) => !/^(TASK_MANAGER|VERSION_CONTROL)/.test(k) && k !== "JARVIS_ENV_FILE"
              )
            ),
            PATH: `${bin}:${process.env.PATH}`,
            JARVIS_SKIP_CLI_CHECK: "",
          },
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

test("init --upgrade: avisa da cópia local (ignorada) e do lock mais novo que o global; sem as duas, nada", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_V520,
      "node_modules/jarvis-ai-framework/package.json": '{"version":"5.5.0"}',
      "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}',
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(
        r.stdout,
        /cópia local deste projeto \(5\.5\.0 em node_modules\/jarvis-ai-framework\) é ignorada/
      );
      assert.match(r.stdout, /assets deste projeto são da 999\.0\.0/);
      assert.match(r.stdout, /npm install -g jarvis-ai-framework/);
    }
  );
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /cópia local deste projeto/);
    assert.doesNotMatch(r.stdout, /Atualize o global/);
  });
});

test("init (instalação): avisa da dependência local no package.json", () => {
  withWorkspace(
    { "package.json": '{"devDependencies":{"jarvis-ai-framework":"^6.0.0"}}' },
    (ws) => {
      const r = run(ws, "--ide", "claude");
      assert.equal(r.status, 0, r.stderr);
      assert.match(
        r.stdout,
        /cópia local deste projeto \(\^6\.0\.0 em package\.json \(devDependencies\)\)/
      );
    }
  );
});

test("init --upgrade: lock mais novo, sem --yes e sem terminal, não rebaixa os assets e sai com 1", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}' },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude");
      assert.equal(r.status, 1, r.stdout);
      assert.match(r.stdout, /nada será rebaixado/);
      assert.match(r.stdout, /Upgrade interrompido/);
      assert.match(readFileSync(join(ws, "jarvis-lock.json"), "utf-8"), /"999\.0\.0"/);
    }
  );
});

test("init --upgrade: lock mais antigo que o global não gera aviso de atualizar o global", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "jarvis-lock.json": '{"version":"0.0.1","ide":"claude"}' },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude");
      assert.equal(r.status, 0, r.stderr);
      assert.doesNotMatch(r.stdout, /Atualize o global/);
    }
  );
});

test("init (instalação): lock mais novo avisa; sem lock, nenhum aviso de versão", () => {
  withWorkspace({ "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}' }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /assets deste projeto são da 999\.0\.0/);
  });
  withWorkspace({}, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Atualize o global/);
    assert.doesNotMatch(r.stdout, /cópia local/);
  });
});

test("init --upgrade: rodando a partir da cópia local do projeto (link em node_modules), o aviso diz isso", () => {
  // Caminho real do workspace (no macOS o tmp fica atrás de um link) e o Jarvis rodado de
  // dentro de node_modules, sem JARVIS_ROOT: o Node resolve o link do script.
  const ws = realpathSync(mkdtempSync(join(tmpdir(), "jarvis-init-local-")));
  try {
    mkdirSync(join(ws, ".claude"), { recursive: true });
    writeFileSync(join(ws, ".claude/ENV.md"), ENV_V520);
    mkdirSync(join(ws, "node_modules"), { recursive: true });
    const local = join(ws, "node_modules", "jarvis-ai-framework");
    symlinkSync(root, local, process.platform === "win32" ? "junction" : "dir");
    const r = spawnSync(
      process.execPath,
      [join(local, "bin", "jarvis.js"), "init", "--upgrade", "--ide", "claude", "--yes"],
      {
        cwd: ws,
        encoding: "utf-8",
        stdio: "pipe",
        env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1", JARVIS_ROOT: "" },
      }
    );
    assert.equal(r.status, 0, r.stderr);
    assert.match(
      r.stdout,
      /O Jarvis em uso \(.+\) é o mesmo de node_modules \(cópia local do projeto\)/
    );
    assert.doesNotMatch(r.stdout, /é ignorada: pode removê-la/);
  } finally {
    rmSync(ws, { recursive: true, force: true });
  }
});

test("init --upgrade: lock mais novo com --yes segue e rebaixa os assets", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}' },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /assets deste projeto são da 999\.0\.0/);
      assert.doesNotMatch(readFileSync(join(ws, "jarvis-lock.json"), "utf-8"), /"999\.0\.0"/);
    }
  );
});

test("init (instalação): o aviso de versão vem antes da pergunta de reinstalação", () => {
  withWorkspace(
    {
      ".claude/AGENTS.md": "# x",
      "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}',
    },
    (ws) => {
      const r = run(ws, "--ide", "claude");
      const aviso = r.stdout.indexOf("assets deste projeto são da 999.0.0");
      const pergunta = r.stdout.indexOf("O que deseja fazer?");
      assert.ok(aviso >= 0 && pergunta >= 0, r.stdout);
      assert.ok(aviso < pergunta, "o aviso deveria vir antes da pergunta");
    }
  );
});

// --- Menu de atualizar ou reinstalar em pasta já instalada (#189) ---

test("parseMenuChoice: com ENV.md, Enter e 1 atualizam, 2 reinstala, 3 cancela, o resto é inválido", () => {
  const comEnv = { hasEnv: true };
  assert.equal(parseMenuChoice("", comEnv), "upgrade");
  assert.equal(parseMenuChoice("  1 ", comEnv), "upgrade");
  assert.equal(parseMenuChoice("2", comEnv), "reinstall");
  assert.equal(parseMenuChoice("3", comEnv), "cancel");
  for (const x of ["s", "5", "atualizar", "12"]) assert.equal(parseMenuChoice(x, comEnv), null, x);
});

test("parseMenuChoice: sem ENV.md, Enter cancela e 1 é inválido (o upgrade precisa do ENV.md)", () => {
  const semEnv = { hasEnv: false };
  assert.equal(parseMenuChoice("", semEnv), "cancel");
  assert.equal(parseMenuChoice("1", semEnv), null);
  assert.equal(parseMenuChoice("2", semEnv), "reinstall");
  assert.equal(parseMenuChoice("3", semEnv), "cancel");
});

test("init (pasta instalada): mostra o menu com as versões e a opção 3 não altera nada", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "jarvis-lock.json": '{"version":"7.0.0","ide":"claude"}' },
    (ws) => {
      const antes = snapshot(ws);
      const r = runWithInput(ws, "3\n", "--ide", "claude");
      assert.equal(r.status, 0, r.stderr);
      for (const linha of [
        "Jarvis já instalado em .claude (v7.0.0 · pacote v",
        "1) Atualizar (recomendado) — sincroniza com a versão do pacote, preserva o ENV.md",
        "2) Reinstalar — sobrescreve os arquivos do framework",
        "3) Cancelar",
        "Instalação cancelada.",
      ]) {
        assert.ok(r.stdout.includes(linha), `sem "${linha}":\n${r.stdout}`);
      }
      assert.deepEqual(snapshot(ws), antes);
    }
  );
});

test("init (pasta instalada): Enter executa a atualização (o mesmo fluxo do --upgrade)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = runWithInput(ws, "\n", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Upgrade do Jarvis em \.claude\//);
    assert.match(r.stdout, /Upgrade concluído/);
  });
});

test("init (pasta instalada): resposta inválida avisa e pergunta de novo", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = runWithInput(ws, "s\n3\n", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Opção inválida\. Escolha 1, 2 ou 3\./);
    assert.match(r.stdout, /Instalação cancelada\./);
  });
});

test("init (pasta instalada): sem resposta (entrada fechada) não altera nada e mostra os atalhos", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const antes = snapshot(ws);
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Sem resposta: nada alterado\. Use --upgrade \(atualizar\) ou --force/);
    // Sem jarvis-lock.json, a primeira linha do menu diz "versão desconhecida" (issue).
    assert.match(r.stdout, /Jarvis já instalado em \.claude \(versão desconhecida · pacote v\d/);
    assert.deepEqual(snapshot(ws), antes);
  });
});

test("init (pasta instalada sem ENV.md): menu só com 2 e 3, e Enter cancela", () => {
  withWorkspace({ ".claude/AGENTS.md": "# x" }, (ws) => {
    const antes = snapshot(ws);
    const r = runWithInput(ws, "\n", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /1\) Atualizar/);
    assert.match(r.stdout, /Atualizar precisa do ENV\.md/);
    assert.match(r.stdout, /2\) Reinstalar/);
    assert.match(r.stdout, /Instalação cancelada\./);
    assert.deepEqual(snapshot(ws), antes);
  });
});

test("init --force e init --upgrade não mostram o menu", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const force = run(ws, "--ide", "claude", "--force");
    assert.equal(force.status, 0, force.stderr);
    assert.doesNotMatch(force.stdout, /O que deseja fazer\?/);
    const upgrade = run(ws, "--upgrade", "--ide", "claude");
    assert.equal(upgrade.status, 0, upgrade.stderr);
    assert.doesNotMatch(upgrade.stdout, /O que deseja fazer\?/);
  });
});

test("init (pasta instalada): com a opção 1, o aviso de versão sai uma vez só", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "jarvis-lock.json": '{"version":"999.0.0","ide":"claude"}' },
    (ws) => {
      const r = runWithInput(ws, "1\n", "--ide", "claude");
      const avisos = r.stdout.split("assets deste projeto são da 999.0.0").length - 1;
      assert.equal(avisos, 1, r.stdout);
      // Sem terminal e sem --yes, o upgrade não rebaixa os assets (comportamento de antes).
      assert.equal(r.status, 1);
      assert.match(r.stdout, /Upgrade interrompido/);
    }
  );
});

// --- Reinstalação e resumo do upgrade (#189) ---

const ENV_SEM_BOARD = ENV_V520.replace("TASK_MANAGER=github", "TASK_MANAGER=");

test("upgradePendencies: só as quatro pendências da IDE contam", () => {
  assert.deepEqual(upgradePendencies({ pendingAxes: [], envPlan: {} }), []);
  assert.deepEqual(
    upgradePendencies({
      pendingAxes: [],
      envPlan: { pending: [], warnings: ["WORKSPACE_MODE", "UNSUPPORTED:TASK_MANAGER:linear"] },
    }),
    []
  );
  assert.deepEqual(
    upgradePendencies({
      pendingAxes: ["TASK_MANAGER", "VERSION_CONTROL"],
      envPlan: { pending: ["PROD_MODE"], warnings: ["CENTRAL_DOCS_REPO", "TOKEN_TASK_MANAGER"] },
    }),
    [
      "confirmar o acesso de TASK_MANAGER e VERSION_CONTROL",
      "preencher PROD_MODE",
      "migrar o Central docs",
      "remover o TOKEN_TASK_MANAGER",
    ]
  );
});

test("upgradePendencies: CENTRAL_DOCS_LAYOUT (#220) pede migrar para a estrutura por funcionalidade", () => {
  assert.deepEqual(
    upgradePendencies({
      pendingAxes: [],
      envPlan: { warnings: ["CENTRAL_DOCS_LAYOUT"] },
    }),
    ["migrar o Central docs para a estrutura por funcionalidade"]
  );
});

test("init --force: com rtk no PATH, RTK_ENABLED=false continua false no ENV.md", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, "fake-bin/rtk": "#!/bin/sh\nexit 0\n" }, (ws) => {
    chmodSync(join(ws, "fake-bin/rtk"), 0o755);
    const r = spawnSync(process.execPath, [cli, "init", "--ide", "claude", "--force"], {
      cwd: ws,
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        JARVIS_SKIP_CLI_CHECK: "1",
        PATH: `${join(ws, "fake-bin")}:${process.env.PATH}`,
      },
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), /^RTK_ENABLED=false$/m);
  });
});

test("init (instalação): os itens pulados dizem o motivo certo, sem o (já existe) repetido", () => {
  withWorkspace({}, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /not found in framework/);
    assert.doesNotMatch(r.stdout, /\) \(já existe\)/);
  });
});

test("init (Atualizar): com a versão igual, sem seta X → X e com o ENV.md completo intacto", () => {
  withWorkspace({ ".claude/ENV.md": ENV_SEM_BOARD }, (ws) => {
    // 1ª atualização: completa o ENV.md (chaves novas) e grava o lock da versão atual.
    const primeira = runWithInput(ws, "\n", "--ide", "claude");
    assert.equal(primeira.status, 0, primeira.stderr);
    const envPath = join(ws, ".claude/ENV.md");
    // As linhas que já existiam continuam iguais e no lugar; as novas entram no fim.
    assert.ok(readFileSync(envPath, "utf-8").startsWith(semRemovidas(ENV_SEM_BOARD).trimEnd()));
    const completo = readFileSync(envPath, "utf-8");

    const segunda = runWithInput(ws, "\n", "--ide", "claude");
    assert.equal(segunda.status, 0, segunda.stderr);
    assert.equal(readFileSync(envPath, "utf-8"), completo, "o ENV.md completo não muda");
    assert.match(segunda.stdout, /Upgrade concluído: já na v\d/);
    assert.doesNotMatch(segunda.stdout, /(\d+\.\d+\.\d+) → \1/);
  });
});

// ENV.md sem pendência do upgrade.
const ENV_PERFIL = ENV_SEM_BOARD.replace(
  "HUB=BACKEND",
  "HUB=BACKEND\nPOSITION=SENIOR\nSQUAD=CORE\nPROD_MODE=developer-guided"
);

// #225: mapa, AGENTS.md e CLAUDE.md (cópia idêntica) existem sempre; sem eles o upgrade tem pendência.
const MAPA_VAZIO = "| Repositório | Papel |\n|---|---|\n";
const DOCS_EM_DIA = { "CDD-MIND-MAP.md": MAPA_VAZIO, "AGENTS.md": "# Projeto\n", "CLAUDE.md": "# Projeto\n" };
const AGENTS_E_CLAUDE = { "AGENTS.md": "# Projeto\n", "CLAUDE.md": "# Projeto\n" };

test("init --upgrade: SENIORITY nova vem do cargo antigo, com o aviso no resumo; idempotente (#263)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.match(env, /^SENIORITY=senior$/m);
    for (const area of ["BACKEND", "FRONTEND", "QA", "DATA", "AUTOMATION", "PLATFORM"]) {
      assert.match(env, new RegExp(`^${area}_SENIORITY=$`, "m"), area);
    }
    assert.match(r.stdout, /SENIORITY: gravada como senior, a partir do cargo antigo; confira no ENV\.md/);
    assert.doesNotMatch(r.stdout, /SENIORITY está vazio/);

    const again = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(again.status, 0, again.stderr);
    assert.equal(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), env);
    assert.doesNotMatch(again.stdout, /SENIORITY: gravada/);
  });
});

test("init --upgrade: sem cargo antigo, SENIORITY fica vazia e é pendência do /jarvis-init upgrade (#263)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), /^SENIORITY=$/m);
    assert.match(r.stdout, /SENIORITY está vazio: responda no \/jarvis-init upgrade/);
    assert.match(r.stdout, /Agora rode .*\/jarvis-init upgrade.* preencher [^\n]*SENIORITY/);
  });
});

test("init --upgrade --yes: ENV.md antigo com HUB, AREA e POSITION perde as três linhas e ganha a SENIORITY derivada (#263)", () => {
  const antigo = ENV_V520.replace("HUB=BACKEND", "HUB=FULLCYCLE").replace(
    "AREA=ENGINEERING",
    "AREA=ENGINEERING\nPOSITION=GENERALIST\nSQUAD=CORE"
  );
  withWorkspace({ ".claude/ENV.md": antigo }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.doesNotMatch(env, /^(HUB|AREA|POSITION)=/m);
    assert.match(env, /^SQUAD=CORE$/m);
    assert.match(env, /^SENIORITY=senior$/m);
    for (const area of ["BACKEND", "FRONTEND", "QA", "DATA", "AUTOMATION", "PLATFORM"]) {
      assert.match(env, new RegExp(`^${area}_SENIORITY=$`, "m"), area);
    }
    assert.match(r.stdout, /removidas \(não são mais usadas\): HUB, AREA, POSITION/);
    assert.match(r.stdout, /SENIORITY: gravada como senior, a partir do cargo antigo/);
    assert.doesNotMatch(r.stdout, /SENIORITY está vazio/);
    assert.doesNotMatch(r.stdout, /FULLCYCLE|GENERALIST/, "valor do ENV apareceu no resumo");
    assert.match(r.stdout, /PROD_MODE está vazio/);

    const again = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(again.status, 0, again.stderr);
    assert.equal(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), env);
  });
  // Com a PROD_MODE já preenchida, ela não vira pendência.
  withWorkspace({ ".claude/ENV.md": `${antigo}PROD_MODE=product-led\n` }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /PROD_MODE está vazio/);
    assert.match(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), /^PROD_MODE=product-led$/m);
  });
});

test("init --upgrade: sem pendência, não manda rodar o /jarvis-init upgrade", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, ...DOCS_EM_DIA }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Agora rode/);
    assert.match(r.stdout, /Nada pendente na IDE\./);
  });
});

// #225: repositório (subpasta com .git) fora do CDD-MIND-MAP.md vira uma linha própria, que manda rodar /jarvis-init repos.
const MAPA_API = [
  "| Repositório | Papel | Linguagem | Framework | Área | Ferramentas principais | Observações |",
  "|---|---|---|---|---|---|---|",
  "| api | api | php | laravel | backend | | |",
  "",
].join("\n");

test("init --upgrade (#225): repositório fora do mapa tem linha própria e tira o 'Nada pendente'", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_PERFIL, ...AGENTS_E_CLAUDE, "CDD-MIND-MAP.md": MAPA_API, "api/.git/HEAD": "", "web/.git/HEAD": "" },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /Rode \/jarvis-init repos: 1 repositório\(s\) fora do mapa \(web\)/);
      assert.doesNotMatch(r.stdout, /Nada pendente na IDE/);
      assert.doesNotMatch(r.stdout, /Agora rode/, "a linha do upgrade não aparece sem pendência do upgrade");
    }
  );
});

test("init --upgrade (#225): com o mapa em dia, 'Nada pendente' e sem a linha do repos", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, ...AGENTS_E_CLAUDE, "CDD-MIND-MAP.md": MAPA_API, "api/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Nada pendente na IDE\./);
    assert.doesNotMatch(r.stdout, /jarvis-init repos/);
  });
});

test("init --upgrade (#225): sem o mapa, o upgrade pede para criá-lo e não há linha de repositório fora do mapa", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, ...AGENTS_E_CLAUDE, "api/.git/HEAD": "", "web/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /jarvis-init repos/);
    assert.match(r.stdout, /Agora rode \S*\/jarvis-init upgrade\S* na IDE: [^\n]*criar o mapa de tecnologias \(CDD-MIND-MAP\.md\)/);
  });
});

test("init --upgrade (#225): AGENTS.md ausente e CLAUDE.md fora de sincronia viram pendência, nos dois modos", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, "CDD-MIND-MAP.md": MAPA_VAZIO }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Agora rode \S*\/jarvis-init upgrade\S* na IDE: [^\n]*criar o AGENTS\.md \(e o CLAUDE\.md, cópia dele\)/);
  });
  withWorkspace(
    { ".claude/ENV.md": ENV_PERFIL, ".git/HEAD": "", "CDD-MIND-MAP.md": MAPA_VAZIO, "AGENTS.md": "# novo\n", "CLAUDE.md": "# antigo\n" },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /sincronizar o CLAUDE\.md com o AGENTS\.md/, "modo projeto também confere a sincronia");
    }
  );
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, "CDD-MIND-MAP.md": MAPA_VAZIO, "AGENTS.md": "# Projeto\n" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Agora rode \S*\/jarvis-init upgrade\S* na IDE: [^\n]*sincronizar o CLAUDE\.md com o AGENTS\.md/, "CLAUDE.md ausente com AGENTS.md presente");
  });
});

test("init --upgrade (#225): WORKSPACE_REPOS preenchida não esconde o clone novo", () => {
  withWorkspace(
    {
      ".claude/ENV.md": `${ENV_PERFIL}\nWORKSPACE_REPOS=api\n`,
      "CDD-MIND-MAP.md": MAPA_API,
      "api/.git/HEAD": "",
      "web/.git/HEAD": "",
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /fora do mapa \(web\)/);
    }
  );
});

test("init --upgrade (#225): as duas pendências saem em linhas separadas, cada uma com o seu comando", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_V520, "CDD-MIND-MAP.md": MAPA_API, "api/.git/HEAD": "", "web/.git/HEAD": "" },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /Agora rode .*\/jarvis-init upgrade.* confirmar o acesso de TASK_MANAGER/);
      assert.match(r.stdout, /Rode \/jarvis-init repos: 1 repositório\(s\) fora do mapa \(web\)/);
    }
  );
});

test("init --upgrade (#225): modo projeto (raiz com .git) não tem pendência de repositório", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL, ".git/HEAD": "", "CDD-MIND-MAP.md": MAPA_API, "web/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /jarvis-init repos/);
  });
});

test("init --upgrade: com pendência, o aviso diz o motivo", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(
      r.stdout,
      /Agora rode .*\/jarvis-init upgrade.* confirmar o acesso de TASK_MANAGER/
    );
  });
});

// --- Correções da rodada 1 do /eng.pre-pr (#189) ---

// Roda com um rtk falso no PATH (o reconcileRtk só age com o rtk instalado).
function runWithFakeRtk(ws, input, ...args) {
  mkdirSync(join(ws, "fake-bin"), { recursive: true });
  writeFileSync(join(ws, "fake-bin/rtk"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(ws, "fake-bin/rtk"), 0o755);
  return spawnSync(process.execPath, [cli, "init", ...args], {
    cwd: ws,
    input,
    encoding: "utf-8",
    stdio: "pipe",
    env: {
      ...process.env,
      JARVIS_SKIP_CLI_CHECK: "1",
      PATH: `${join(ws, "fake-bin")}:${process.env.PATH}`,
    },
  });
}

test("init (pasta instalada): a opção 2 reinstala os arquivos e preserva RTK_ENABLED=false", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".claude/taxonomy.md": "editado à mão\n" }, (ws) => {
    const r = runWithFakeRtk(ws, "2\n", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Instalação cancelada/);
    assert.notEqual(
      readFileSync(join(ws, ".claude/taxonomy.md"), "utf-8"),
      "editado à mão\n",
      "a reinstalação deveria sobrescrever o arquivo do framework"
    );
    assert.match(readFileSync(join(ws, ".claude/ENV.md"), "utf-8"), /^RTK_ENABLED=false$/m);
  });
});

test("init: sem RTK_ENABLED no ENV.md, o bloco acrescentado usa a moldura do template", () => {
  const semRtk = ENV_V520.replace("RTK_ENABLED=false\n", "");
  withWorkspace({ ".claude/ENV.md": semRtk }, (ws) => {
    const r = runWithFakeRtk(ws, "", "--ide", "claude", "--force");
    assert.equal(r.status, 0, r.stderr);
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.match(env, /^# ={77}\n# RTK — Token Killer \(opcional\)\n# ={77}\nRTK_ENABLED=true$/m);
    assert.doesNotMatch(env, /^# --- RTK/m);
  });
});

test("init sem --ide e com pipe: as respostas dos dois menus não se perdem", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    // 2 = Claude Code no menu de IDE; 3 = Cancelar no menu de pasta já instalada.
    const r = runWithInput(ws, "2\n3\n");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /O que deseja fazer\?/);
    assert.match(r.stdout, /Instalação cancelada\./);
    assert.doesNotMatch(r.stdout, /Sem resposta/);
  });
});

test("init sem --ide e sem resposta: o menu de IDE termina com a dica, sem alterar nada", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const antes = snapshot(ws);
    const r = run(ws);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Sem resposta: nada alterado\. Use --ide \{ide\}\./);
    assert.deepEqual(snapshot(ws), antes);
  });
});

test("init --upgrade --yes: COMPANY_PROFILE nasce com o default e não entra nas pendências (#199)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const env = readFileSync(join(ws, ".claude/ENV.md"), "utf-8");
    assert.match(env, /^COMPANY_PROFILE=stark-industries$/m);
    assert.match(r.stdout, /COMPANY_PROFILE: default/);
    assert.doesNotMatch(r.stdout, /preencher COMPANY_PROFILE/);
  });
});

test("init --upgrade sem terminal e sem --yes: COMPANY_PROFILE fica no default, com aviso (#199)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(
      readFileSync(join(ws, ".claude/ENV.md"), "utf-8"),
      /^COMPANY_PROFILE=stark-industries$/m
    );
    assert.match(r.stdout, /COMPANY_PROFILE fica no default stark-industries/);
  });
});

test("init --upgrade: rule forkada no overlay vence a do core em .claude/rules/, com a marcação; nada é escrito no overlay (#199)", () => {
  const OVERLAY = ".claude/overlays/acme/rules/engineering/eng-rules.md";
  withWorkspace(
    {
      ".claude/ENV.md": `${ENV_V520}COMPANY_PROFILE=acme\n`,
      [OVERLAY]: "---\nforked_from: eng-rules@8.2.0\n---\n\n# regras da empresa\n",
    },
    (ws) => {
      const before = snapshot(join(ws, ".claude/overlays/acme"));
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      const copied = readFileSync(join(ws, ".claude/rules/engineering/eng-rules.md"), "utf-8");
      assert.match(
        copied,
        /^---\nforked_from: eng-rules@8\.2\.0\n---\n\n> Overlay: acme \(forked_from eng-rules@8\.2\.0\)\n\n# regras da empresa\n$/
      );
      assert.deepEqual(snapshot(join(ws, ".claude/overlays/acme")), before);
      // a rule de precedência do core continua lá, como qualquer rule universal
      assert.ok(existsSync(join(ws, ".claude/rules/company-overlay-rules.md")));
    }
  );
});

// Pergunta do COMPANY_PROFILE no upgrade (#199), como função pura: o `ask` é simulado, sem terminal.
function fakeAsk(answers) {
  const queue = [...answers];
  const asked = [];
  return { ask: async (q) => (asked.push(q), queue.shift() ?? ""), asked };
}

test("promptCompanyProfile: Enter grava o default (null); nome válido é devolvido; digitar o default conta como default", async () => {
  const enter = fakeAsk([""]);
  assert.equal(await promptCompanyProfile(enter.ask), null);
  assert.equal(enter.asked.length, 1);
  assert.match(enter.asked[0], /COMPANY_PROFILE.*Enter = stark-industries/);

  assert.equal(await promptCompanyProfile(fakeAsk(["acme"]).ask), "acme");
  assert.equal(await promptCompanyProfile(fakeAsk(["stark-industries"]).ask), null);
});

test("promptCompanyProfile: inválido é perguntado de novo (com aviso); inválido duas vezes grava o default com aviso", async () => {
  const warned = [];
  const warn = (m) => warned.push(m);

  const recupera = fakeAsk(["Acme Corp", "acme"]);
  assert.equal(await promptCompanyProfile(recupera.ask, { warn }), "acme");
  assert.equal(recupera.asked.length, 2);
  assert.equal(warned.length, 1);
  assert.match(warned[0], /Nome inválido/);

  warned.length = 0;
  const insiste = fakeAsk(["rules", "../x"]);
  assert.equal(await promptCompanyProfile(insiste.ask, { warn }), null);
  assert.equal(insiste.asked.length, 2);
  assert.deepEqual(
    warned.map((m) => m.slice(0, 20)),
    ["Nome inválido: use l", "Nome inválido de nov"]
  );
  assert.match(warned[1], /gravando o default stark-industries/);
});

// --- Filtro de rules pelo perfil no --upgrade (#83) ---

test("upgradePendencies (#225): os motivos dos documentos (mapa, AGENTS.md, CLAUDE.md) entram no fim da lista", () => {
  assert.deepEqual(
    upgradePendencies({ pendingAxes: ["TASK_MANAGER"], envPlan: {}, documents: ["criar o AGENTS.md (e o CLAUDE.md, cópia dele)"] }),
    ["confirmar o acesso de TASK_MANAGER", "criar o AGENTS.md (e o CLAUDE.md, cópia dele)"]
  );
  assert.deepEqual(upgradePendencies({ pendingAxes: [], envPlan: {} }), [], "sem documents, nada muda");
});

test("init --upgrade: sincroniza as rules como o jarvis rules sync, sem a exceção desligada (#83, #263)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Rules sincronizadas: \d+ copiada\(s\), \d+ removida\(s\)/);
    // Toda rule entra, menos a artifact-style-rules.md (ARTIFACT_STYLE padrão).
    assert.ok(!existsSync(join(ws, ".claude/rules/artifact-style-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/product/prod.spec-common-rules.md")));
  });
});

test("init --upgrade: sem os eixos antigos no ENV.md, sincroniza as rules sem pendência por isso (#83, #263)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_SEM_BOARD }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Rules sincronizadas: \d+ copiada\(s\), \d+ removida\(s\)/);
    assert.ok(!existsSync(join(ws, ".claude/rules/artifact-style-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
    assert.doesNotMatch(r.stdout, /filtro do perfil/);
  });
});

test("init --upgrade: instalação 8.4.0 → estado final de rules/ e rules-on-demand/ (#83)", () => {
  const antigas = [
    "engineering/eng.bump-rules.md",
    "engineering/eng.docs-scraping-rules.md",
    "engineering/rpa/eng.rpa-rules.md",
    "AGENTS.md",
    "product/README.md",
    "engineering/eng.start-rules.md",
  ];
  const files = {
    ".claude/ENV.md": ENV_PERFIL,
    "jarvis-lock.json": '{"version":"8.4.0","ide":"claude"}',
  };
  for (const a of antigas) files[`.claude/rules/${a}`] = "# rule da 8.4.0\n";
  withWorkspace(files, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    for (const a of antigas) {
      assert.ok(!existsSync(join(ws, ".claude/rules", a)), `rules/${a} deveria ter saído`);
    }
    // Fica toda rule do core, menos a exceção desligada.
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
    assert.ok(!existsSync(join(ws, ".claude/rules/artifact-style-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/product/prod.spec-common-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/engineering/eng.rpa-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/engineering/eng.start-rules.md")));
  });
});

test("init --upgrade (kiro): o steering acompanha as rules, sem as exceções desligadas (#83, #263)", () => {
  withWorkspace({ ".kiro/ENV.md": ENV_PERFIL.replace("IDE=claude", "IDE=kiro") }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "kiro", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const steering = join(ws, ".kiro/steering");
    assert.ok(existsSync(join(steering, "eng-rules.md")));
    // ARTIFACT_STYLE padrão e RTK desligado: as duas exceções não viram steering.
    assert.ok(!existsSync(join(steering, "artifact-style-rules.md")));
    assert.ok(!existsSync(join(steering, "rtk-rules.md")));
  });
});

// PATH sem nenhuma pasta que tenha um `rtk` (a máquina de quem roda pode ter o real).
function runSemRtk(ws, ...args) {
  const path = (process.env.PATH || "")
    .split(":")
    .filter((d) => d && !existsSync(join(d, "rtk")))
    .join(":");
  return spawnSync(process.execPath, [cli, "init", ...args], {
    cwd: ws,
    input: "",
    encoding: "utf-8",
    stdio: "pipe",
    env: { ...process.env, JARVIS_SKIP_CLI_CHECK: "1", PATH: path },
  });
}

const ENV_PERFIL_RTK = ENV_PERFIL.replace("RTK_ENABLED=false", "RTK_ENABLED=true");

test("init --upgrade: RTK_ENABLED=true sem o rtk no PATH não traz a rtk-rules.md (#83)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL_RTK }, (ws) => {
    const r = runSemRtk(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".claude/rules/rtk-rules.md")));
  });
});

test("init --upgrade: RTK_ENABLED=true com o rtk no PATH traz a rtk-rules.md (#83)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL_RTK }, (ws) => {
    const r = runWithFakeRtk(ws, "", "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(ws, ".claude/rules/rtk-rules.md")));
  });
});

test("init --force: reinstalação com o ENV.md sincroniza as rules como o --upgrade (#83, #263)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--ide", "claude", "--force");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Rules sincronizadas: \d+ copiada\(s\), \d+ removida\(s\)/);
    assert.ok(!existsSync(join(ws, ".claude/rules/artifact-style-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
  });
});

const RULE_TODOS =
  "> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all\n\n# empresa\n";

test("init --upgrade: falha ao gravar uma rule do overlay sai com 1 e mostra o ✗ (#83)", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_PERFIL,
      ".claude/overlays/stark-industries/rules/empresa-rules.md": RULE_TODOS,
    },
    (ws) => {
      // Uma pasta no lugar do destino da rule do overlay (o syncAssets e o filtro a aplicam).
      mkdirSync(join(ws, ".claude/rules/empresa-rules.md"), { recursive: true });
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 1);
      assert.match(r.stdout + r.stderr, /✗ .*empresa-rules\.md/);
    }
  );
});

test("init --upgrade: o filtro aplica a rule do overlay do COMPANY_PROFILE (#83)", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_PERFIL,
      ".claude/overlays/stark-industries/rules/empresa-rules.md": RULE_TODOS,
    },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.match(readFileSync(join(ws, ".claude/rules/empresa-rules.md"), "utf-8"), /# empresa/);
    }
  );
});

test("init --upgrade: ARTIFACT_STYLE decide a artifact-style-rules.md (#83)", () => {
  for (const [estilo, presente] of [
    ["human-generated", true],
    ["", false],
  ]) {
    withWorkspace({ ".claude/ENV.md": `${ENV_PERFIL}ARTIFACT_STYLE=${estilo}\n` }, (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.equal(existsSync(join(ws, ".claude/rules/artifact-style-rules.md")), presente, estilo);
    });
  }
});

// Limite conhecido: o código de saída 1 do CLI (upgrade e reinstalação) com erro do filtro não tem
// teste isolado. No único caso que faz o filtro falhar (destino não gravável), o syncAssets aplica o
// mesmo overlay e falha antes; aqui fica provado que o filtro devolve o erro.
test("filterRulesByEnv: devolve o erro de gravação para o código de saída (#83)", () => {
  withWorkspace(
    {
      ".claude/ENV.md": ENV_PERFIL,
      ".claude/overlays/stark-industries/rules/empresa-rules.md": RULE_TODOS,
    },
    (ws) => {
      mkdirSync(join(ws, ".claude/rules/empresa-rules.md"), { recursive: true });
      const { rulesSync } = filterRulesByEnv(
        ws,
        "claude",
        join(ws, ".claude/ENV.md")
      );
      assert.ok(
        rulesSync.errors.some((e) => /empresa-rules\.md/.test(e)),
        rulesSync.errors.join("; ")
      );
    }
  );
});

// ---- #227: exclude local no modo projeto (git de verdade) -----------------------------------------

const gitIn = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

/** Workspace com um repositório git real na raiz (modo projeto). */
function withRealRepo(files, fn) {
  return withWorkspace(files, (ws) => {
    gitIn(ws, "init", "-q");
    return fn(ws);
  });
}

// Isola dos ajustes globais do git de quem roda (gpgsign, hooks, excludesFile, templates); o CLI herda o ambiente.
process.env.GIT_CONFIG_GLOBAL = "/dev/null";
process.env.GIT_CONFIG_NOSYSTEM = "1";
const GIT_ID = ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null"];

const commitAll = (ws) => {
  gitIn(ws, "add", "-A");
  gitIn(ws, ...GIT_ID, "commit", "-q", "-m", "x");
};
const excludeOf = (ws) => readFileSync(join(ws, ".git", "info", "exclude"), "utf-8").split(/\r?\n/);
const gitignoreOf = (ws) => (existsSync(join(ws, ".gitignore")) ? readFileSync(join(ws, ".gitignore"), "utf-8") : "");
const GENERATED = ["AGENTS.md", "CLAUDE.md", "CDD-MIND-MAP.md"];

test("init (instalação) no modo projeto: AGENTS.md, CLAUDE.md e CDD-MIND-MAP.md vão para o exclude, não para o .gitignore", () => {
  withRealRepo({}, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    for (const f of GENERATED) {
      assert.ok(excludeOf(ws).includes(f), `${f} deve estar no .git/info/exclude`);
      assert.doesNotMatch(gitignoreOf(ws), new RegExp(`^${f}$`, "m"), `${f} não deve ir para o .gitignore`);
    }
    assert.match(gitignoreOf(ws), /^\.jarvis\/$/m, ".jarvis/ segue no .gitignore (Q1)");
    assert.match(gitignoreOf(ws), /^\.claude\/$/m, "a pasta da IDE entra no .gitignore (Q3)");
    assert.match(r.stdout, /\.git\/info\/exclude \(local, fora do PR\)/);
    assert.match(r.stdout, /remova a linha do \.git\/info\/exclude/);
  });
});

test("init (instalação) no modo projeto: rodar de novo não duplica linha no exclude nem no .gitignore", () => {
  withRealRepo({}, (ws) => {
    assert.equal(run(ws, "--ide", "claude").status, 0);
    for (const f of GENERATED) assert.ok(excludeOf(ws).includes(f), `${f} entrou na primeira rodada`);
    const exclude = readFileSync(join(ws, ".git/info/exclude"), "utf-8");
    const ignore = gitignoreOf(ws);
    assert.equal(run(ws, "--ide", "claude", "--force").status, 0);
    assert.equal(readFileSync(join(ws, ".git/info/exclude"), "utf-8"), exclude);
    assert.equal(gitignoreOf(ws), ignore);
  });
});

test("init (instalação): AGENTS.md já versionado só gera aviso; o índice, o exclude e o histórico não mudam", () => {
  withRealRepo({ "AGENTS.md": "# do time\n" }, (ws) => {
    commitAll(ws);
    const commits = gitIn(ws, "rev-list", "--count", "HEAD").trim();
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /AGENTS\.md está versionado: nada foi removido/);
    assert.equal(gitIn(ws, "ls-files", "AGENTS.md").trim(), "AGENTS.md");
    assert.ok(!excludeOf(ws).includes("AGENTS.md"));
    assert.equal(gitIn(ws, "rev-list", "--count", "HEAD").trim(), commits);
    assert.equal(readFileSync(join(ws, "AGENTS.md"), "utf-8"), "# do time\n");
  });
});

test("init --force --yes nunca tira AGENTS.md do índice (a confirmação é do Upgrade, pelo skill)", () => {
  withRealRepo({ "AGENTS.md": "# do time\n" }, (ws) => {
    commitAll(ws);
    const r = run(ws, "--ide", "claude", "--force", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.equal(gitIn(ws, "ls-files", "AGENTS.md").trim(), "AGENTS.md");
    assert.equal(gitIn(ws, "diff", "--cached", "--name-only").trim(), "", "nada staged pelo init");
  });
});

test("init (instalação): pasta da IDE já versionada vira aviso e continua no índice", () => {
  withRealRepo({ ".claude/regra-do-time.md": "x\n" }, (ws) => {
    commitAll(ws);
    const r = run(ws, "--ide", "claude", "--force"); // a pasta já existe: reinstala em vez de abrir o menu
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /\.claude\/ já está versionada: ignorar não a tira do git/);
    assert.equal(gitIn(ws, "ls-files", ".claude/regra-do-time.md").trim(), ".claude/regra-do-time.md");
  });
});

test("init (instalação) no modo workspace: nenhum arquivo de git é criado e nada fala em exclude", () => {
  withWorkspace({ "app/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".git")));
    assert.ok(!existsSync(join(ws, ".gitignore")));
    assert.doesNotMatch(r.stdout, /info\/exclude/);
  });
});

// ---- #227: --upgrade no modo projeto --------------------------------------------------------------

test("upgradePendencies: AGENTS.md/CLAUDE.md versionados pedem a decisão no /jarvis-init upgrade", () => {
  const base = { pendingAxes: [], envPlan: {} };
  assert.deepEqual(upgradePendencies({ ...base, trackedGenerated: [] }), []);
  assert.deepEqual(upgradePendencies({ ...base, trackedGenerated: ["AGENTS.md"] }), [
    "decidir se AGENTS.md sai do git",
  ]);
  assert.deepEqual(upgradePendencies({ ...base, trackedGenerated: ["AGENTS.md", "CLAUDE.md"] }), [
    "decidir se AGENTS.md e CLAUDE.md saem do git",
  ]);
});

test("init --upgrade no modo projeto: grava o exclude e a pasta da IDE no .gitignore", () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    for (const f of GENERATED) assert.ok(excludeOf(ws).includes(f), `${f} no exclude`);
    assert.match(gitignoreOf(ws), /^\.claude\/$/m);
    assert.match(r.stdout, /Git \(modo projeto\)/);
    assert.match(r.stdout, /Agora rode .*\/jarvis-init upgrade.* na IDE: confirmar o acesso de TASK_MANAGER/);
  });
});

test("init --upgrade: segunda execução não repete a mensagem nem duplica linha", () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    assert.equal(run(ws, "--upgrade", "--ide", "claude", "--yes").status, 0);
    const exclude = readFileSync(join(ws, ".git/info/exclude"), "utf-8");
    const ignore = gitignoreOf(ws);
    const again = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(again.status, 0, again.stderr);
    assert.equal(readFileSync(join(ws, ".git/info/exclude"), "utf-8"), exclude);
    assert.equal(gitignoreOf(ws), ignore);
    assert.doesNotMatch(again.stdout, /Git \(modo projeto\)/, "sem novidade, sem bloco");
  });
});

test("init --upgrade --yes: AGENTS.md versionado vira pendência e NÃO sai do índice", () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520, "AGENTS.md": "# do time\n" }, (ws) => {
    commitAll(ws);
    const commits = gitIn(ws, "rev-list", "--count", "HEAD").trim();
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /AGENTS\.md está versionado: nada foi removido/);
    assert.match(r.stdout, /decidir se AGENTS\.md sai do git/);
    assert.equal(gitIn(ws, "ls-files", "AGENTS.md").trim(), "AGENTS.md");
    assert.equal(gitIn(ws, "diff", "--cached", "--name-only").trim(), "", "nada staged pelo upgrade");
    assert.equal(gitIn(ws, "rev-list", "--count", "HEAD").trim(), commits);
    assert.ok(!excludeOf(ws).includes("AGENTS.md"));
    assert.equal(readFileSync(join(ws, "AGENTS.md"), "utf-8"), "# do time\n");
  });
});

test("init --upgrade no modo workspace: nenhum arquivo de git é criado e nada fala em exclude", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, "app/.git/HEAD": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!existsSync(join(ws, ".git")));
    assert.ok(!existsSync(join(ws, ".gitignore")));
    assert.doesNotMatch(r.stdout, /Git \(modo projeto\)|info\/exclude/);
  });
});

// ---- Fase 6 (pre-pr rodada 1): docs/jarvis/, falhas do git e mapa versionado -----------------------

const RUNNING_AS_ROOT = typeof process.getuid === "function" && process.getuid() === 0;
const output = (r) => `${r.stdout}\n${r.stderr}`;

test("init (instalação) no modo projeto: docs/jarvis/ volta ao .gitignore (regressão da #227)", () => {
  withRealRepo({}, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(gitignoreOf(ws), /^docs\/jarvis\/$/m);
    assert.match(r.stdout, /\.gitignore: .*docs\/jarvis\//);
    assert.equal(run(ws, "--ide", "claude", "--force").status, 0);
    assert.equal(gitignoreOf(ws).split("\n").filter((l) => l === "docs/jarvis/").length, 1, "sem duplicar");
  });
});

test("init (instalação): a pasta de documentos segue o JARVIS_DOCS do ENV.md", () => {
  withRealRepo({ ".claude/ENV.md": "DOCS_FOLDER=meusdocs\nJARVIS_DOCS=$DOCS_FOLDER/jarvis\n" }, (ws) => {
    const r = run(ws, "--ide", "claude", "--force");
    assert.equal(r.status, 0, r.stderr);
    assert.match(gitignoreOf(ws), /^meusdocs\/jarvis\/$/m);
    assert.doesNotMatch(gitignoreOf(ws), /^docs\/jarvis\/$/m);
  });
});

test("init (instalação) no modo workspace: docs/jarvis/ não cria .gitignore", () => {
  withWorkspace({ "app/.git/HEAD": "" }, (ws) => {
    assert.equal(run(ws, "--ide", "claude").status, 0);
    assert.ok(!existsSync(join(ws, ".gitignore")));
  });
});

test("init --upgrade no modo projeto: docs/jarvis/ também entra no .gitignore", () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(gitignoreOf(ws), /^docs\/jarvis\/$/m);
  });
});

test("init: git que não responde (.git inválido) avisa que o exclude não foi gravado e sai com 0", () => {
  withWorkspace({ ".git/HEAD": "" }, (ws) => {
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    // uma linha só: a causa, o que ficou sem proteção e o que fazer
    assert.match(
      output(r),
      /Git \(modo projeto\): o git não respondeu .*\. O exclude não foi gravado e AGENTS\.md, CLAUDE\.md, CDD-MIND-MAP\.md podem entrar no PR; corrija e rode o init de novo/
    );
    assert.equal((output(r).match(/o git não respondeu/g) || []).length, 1, "a causa aparece uma vez só");
    assert.match(gitignoreOf(ws), /^\.jarvis\/$/m, "o .gitignore é gravado mesmo assim");
  });
});

test("init: exclude sem permissão de escrita vira erro claro e saída 1, sem stack trace", { skip: RUNNING_AS_ROOT }, () => {
  withRealRepo({}, (ws) => {
    const alvo = join(ws, ".git", "info", "exclude");
    chmodSync(alvo, 0o444);
    try {
      const r = run(ws, "--ide", "claude");
      assert.equal(r.status, 1);
      assert.match(output(r), /Git \(modo projeto\): não foi possível gravar .*exclude: EACCES/);
      assert.equal((output(r).match(/EACCES/g) || []).length, 1, "a falha do exclude aparece uma vez só");
      assert.doesNotMatch(output(r), /at .*\.js:\d+/, "sem stack trace");
    } finally {
      chmodSync(alvo, 0o644);
    }
  });
});

test("init --upgrade: .gitignore que é diretório vira erro, o resumo continua e a saída é 1", () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    mkdirSync(join(ws, ".gitignore"));
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 1);
    assert.match(output(r), /Git \(modo projeto\): não foi possível gravar .*\.gitignore: EISDIR/);
    assert.match(r.stdout, /Upgrade concluído/, "o resumo não é derrubado");
    assert.match(r.stdout, /Agora rode .*\/jarvis-init upgrade.* na IDE: confirmar o acesso de TASK_MANAGER/, "as pendências aparecem");
  });
});

test("init (instalação): CDD-MIND-MAP.md já versionado não vai para o exclude e gera aviso", () => {
  withRealRepo({ "CDD-MIND-MAP.md": "# mapa\n" }, (ws) => {
    commitAll(ws);
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /CDD-MIND-MAP\.md está versionado: o exclude não vale para arquivo rastreado/);
    assert.ok(!excludeOf(ws).includes("CDD-MIND-MAP.md"));
    assert.ok(excludeOf(ws).includes("AGENTS.md"));
  });
});

test("init (instalação) numa raiz que é worktree (.git em arquivo): o exclude vai para o repositório comum", () => {
  withRealRepo({}, (ws) => {
    gitIn(ws, ...GIT_ID, "commit", "-q", "--allow-empty", "-m", "base");
    const wt = `${ws}-wt`;
    try {
      gitIn(ws, "worktree", "add", "-q", "-b", "wt", wt);
      assert.ok(existsSync(join(wt, ".git")));
      const r = run(wt, "--ide", "claude");
      assert.equal(r.status, 0, r.stderr);
      for (const f of GENERATED) assert.ok(excludeOf(ws).includes(f), `${f} no exclude do repositório comum`);
      writeFileSync(join(wt, "AGENTS.md"), "# gerado\n");
      gitIn(wt, "check-ignore", "-q", "AGENTS.md"); // lança se o git não ignora
      assert.match(gitignoreOf(wt), /^\.claude\/$/m);
    } finally {
      rmSync(wt, { recursive: true, force: true });
    }
  });
});

// logProjectGitSetup escreve no logger (console); aqui o console é capturado.
function capturar(fn) {
  const saidas = [];
  const { log, error } = console;
  console.log = (...a) => saidas.push(a.join(" "));
  console.error = (...a) => saidas.push(a.join(" "));
  try {
    fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return saidas.join("\n");
}

const gitSetupBase = () => ({
  isRepo: true,
  exclude: { path: "/x/.git/info/exclude", added: [], existing: [], error: null, gitUnavailable: false },
  tracked: [],
  trackedMap: false,
  ideEntry: ".claude/",
  ignoreAdded: [],
  ideIgnoreAdded: false,
  ideFolderTracked: false,
  ignoredButTracked: [],
  warnings: [],
  errors: [],
});

test("logProjectGitSetup: nada novo, ou raiz sem .git, não imprime nada", () => {
  assert.equal(capturar(() => logProjectGitSetup(gitSetupBase())), "");
  assert.equal(capturar(() => logProjectGitSetup({ ...gitSetupBase(), isRepo: false })), "");
});

test("logProjectGitSetup: lista o que gravou e como reverter", () => {
  const out = capturar(() =>
    logProjectGitSetup({
      ...gitSetupBase(),
      exclude: { ...gitSetupBase().exclude, added: ["AGENTS.md", "CLAUDE.md"] },
      ignoreAdded: [".claude/", "docs/jarvis/"],
    })
  );
  assert.match(out, /\.git\/info\/exclude \(local, fora do PR\): AGENTS\.md, CLAUDE\.md/);
  assert.match(out, /remova a linha do \.git\/info\/exclude/);
  assert.match(out, /\.gitignore: \.claude\/, docs\/jarvis\//);
});

test("logProjectGitSetup: avisos de versionado, de git indisponível e erros de gravação", () => {
  const out = capturar(() =>
    logProjectGitSetup({
      ...gitSetupBase(),
      tracked: ["AGENTS.md"],
      trackedMap: true,
      ideFolderTracked: true,
      exclude: { ...gitSetupBase().exclude, error: "o git não respondeu (fatal)", gitUnavailable: true },
      warnings: ["o git não respondeu (fatal)"],
      errors: ["não foi possível gravar /x/.gitignore: EISDIR"],
    })
  );
  assert.match(out, /AGENTS\.md está versionado: nada foi removido/);
  assert.match(out, /CDD-MIND-MAP\.md está versionado: o exclude não vale para arquivo rastreado/);
  assert.match(out, /\.claude\/ já está versionada: ignorar não a tira do git/);
  // AGENTS.md e o mapa já estão versionados: só o CLAUDE.md fica sem proteção, no singular
  assert.match(out, /Git \(modo projeto\): o git não respondeu \(fatal\)\. O exclude não foi gravado e CLAUDE\.md pode entrar no PR/);
  assert.doesNotMatch(out, /CDD-MIND-MAP\.md podem entrar/, "o mapa versionado não é listado como sem proteção");
  assert.match(out, /Git \(modo projeto\): não foi possível gravar \/x\/\.gitignore: EISDIR/);
  assert.equal((out.match(/o git não respondeu/g) || []).length, 1, "a causa não se repete");
});

test("logProjectGitSetup: a instrução final muda no upgrade e só lista o que de fato faltou no exclude", () => {
  const base = {
    ...gitSetupBase(),
    exclude: { path: null, added: [], existing: ["CLAUDE.md"], error: "o git não respondeu (fatal)", gitUnavailable: true },
    warnings: ["o git não respondeu (fatal)"],
  };
  const instalacao = capturar(() => logProjectGitSetup(base));
  const upgrade = capturar(() => logProjectGitSetup(base, { upgrade: true }));
  assert.match(instalacao, /AGENTS\.md, CDD-MIND-MAP\.md podem entrar no PR; corrija e rode o init de novo/);
  assert.doesNotMatch(instalacao, /CLAUDE\.md[,]? .*entrar no PR/, "CLAUDE.md já estava no exclude");
  assert.match(upgrade, /corrija e rode jarvis init --upgrade de novo/);
});

test("logProjectGitSetup: pasta de documentos já versionada vira aviso", () => {
  const out = capturar(() => logProjectGitSetup({ ...gitSetupBase(), ignoredButTracked: ["docs/jarvis/"] }));
  assert.match(out, /docs\/jarvis\/ já está versionada: ignorar não a tira do git e os arquivos novos dela deixam de aparecer/);
});

test("docsIgnoreLines: só pasta dentro da raiz; recusa o que vira lixo ou padrão especial no .gitignore", () => {
  const com = (jarvis) => docsIgnoreLines(new Map(jarvis === undefined ? [] : [["JARVIS_DOCS", jarvis]]));
  assert.deepEqual(com(undefined), ["docs/jarvis/"], "sem a chave vale o padrão");
  assert.deepEqual(com("meusdocs/jarvis"), ["meusdocs/jarvis/"]);
  assert.deepEqual(com("docs//jarvis/"), ["docs/jarvis/"], "normaliza barras duplicadas e a final");
  assert.deepEqual(com("docs/./jarvis"), ["docs/jarvis/"]);
  for (const ruim of ["/tmp/fora", "../fora", "docs/../../x", ".", "!docs", "#docs", ":(glob)x", "docs/*", "docs/?", "docs/[a]", "docs\\jarvis"]) {
    assert.deepEqual(com(ruim), [], `${ruim} não vira linha do .gitignore`);
  }
});

test("init (instalação): docs/jarvis/ já versionado avisa que ignorar não o tira do git", () => {
  withRealRepo({ "docs/jarvis/product/prd.md": "# prd\n" }, (ws) => {
    commitAll(ws);
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /docs\/jarvis\/ já está versionada: ignorar não a tira do git/);
    assert.equal(gitIn(ws, "ls-files", "docs/jarvis/product/prd.md").trim(), "docs/jarvis/product/prd.md");
  });
});

// ---- Fase 10 (pre-pr rodada 2): --upgrade e instalação com o git falhando ------------------------------

test("init --upgrade: git que não responde (.git inválido) avisa dentro do bloco do upgrade e sai com 0", () => {
  withWorkspace({ ".claude/ENV.md": ENV_V520, ".git/HEAD": "" }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /🔒 Git \(modo projeto\):/);
    assert.match(
      output(r),
      /Git \(modo projeto\): o git não respondeu .*\. O exclude não foi gravado e AGENTS\.md, CLAUDE\.md, CDD-MIND-MAP\.md podem entrar no PR; corrija e rode jarvis init --upgrade de novo/
    );
    assert.match(r.stdout, /Upgrade concluído/, "o resumo continua");
    assert.match(gitignoreOf(ws), /^\.claude\/$/m, "o .gitignore é gravado mesmo assim");
  });
});

test("init --upgrade: exclude sem permissão de escrita vira erro com saída 1 e o resumo continua", { skip: RUNNING_AS_ROOT }, () => {
  withRealRepo({ ".claude/ENV.md": ENV_V520 }, (ws) => {
    const alvo = join(ws, ".git", "info", "exclude");
    chmodSync(alvo, 0o444);
    try {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 1);
      assert.match(output(r), /Git \(modo projeto\): não foi possível gravar .*exclude: EACCES/);
      assert.equal((output(r).match(/EACCES/g) || []).length, 1, "a falha do exclude aparece uma vez só");
      assert.match(r.stdout, /Upgrade concluído/, "o resumo não é derrubado");
      assert.match(gitignoreOf(ws), /^docs\/jarvis\/$/m, "o .gitignore foi gravado antes da falha do exclude");
    } finally {
      chmodSync(alvo, 0o644);
    }
  });
});

test("init (instalação): .gitignore que é diretório vira erro claro e saída 1, sem stack trace", () => {
  withRealRepo({}, (ws) => {
    mkdirSync(join(ws, ".gitignore"));
    const r = run(ws, "--ide", "claude");
    assert.equal(r.status, 1);
    assert.match(output(r), /não foi possível gravar .*\.gitignore: EISDIR/);
    assert.equal((output(r).match(/EISDIR/g) || []).length, 1, "a mesma falha aparece uma vez só");
    assert.doesNotMatch(output(r), /at .*\.js:\d+/, "sem stack trace");
  });
});

// ---- Fase 11 (pre-pr rodada 3) --------------------------------------------------------------------------

// Como `capturar`, mas separa stdout (logger.info) de stderr (logger.error).
function capturarSeparado(fn) {
  const out = [];
  const err = [];
  const { log, error } = console;
  console.log = (...a) => out.push(a.join(" "));
  console.error = (...a) => err.push(a.join(" "));
  try {
    fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return { out: out.join("\n"), err: err.join("\n") };
}

test("logProjectGitSetup: aviso sai amarelo com ⚠ no stdout e erro sai vermelho com ✗ no stderr, cada um uma vez", () => {
  const { out, err } = capturarSeparado(() =>
    logProjectGitSetup({
      ...gitSetupBase(),
      warnings: ["aviso qualquer do git"],
      errors: ["erro qualquer de gravação"],
    })
  );
  assert.match(out, /⚠ Git \(modo projeto\): aviso qualquer do git/);
  assert.doesNotMatch(out, /erro qualquer/, "o erro não vai para o stdout");
  assert.match(err, /✗ Git \(modo projeto\): erro qualquer de gravação/);
  assert.doesNotMatch(err, /aviso qualquer/, "o aviso não vai para o stderr");
  assert.equal((out + err).match(/aviso qualquer/g).length, 1);
});

test("init --upgrade: docs/jarvis/ já versionado avisa dentro do bloco do upgrade (também numa 2ª execução, sem mais nada novo) e não sai do índice", () => {
  // só os documentos são versionados: a pasta da IDE não (senão o bloco apareceria por outra causa)
  withRealRepo({ ".claude/ENV.md": ENV_V520, "docs/jarvis/product/prd.md": "# prd\n" }, (ws) => {
    gitIn(ws, "add", "docs/jarvis/product/prd.md");
    gitIn(ws, ...GIT_ID, "commit", "-q", "-m", "versiona os documentos");
    const primeira = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(primeira.status, 0, primeira.stderr);
    assert.match(primeira.stdout, /🔒 Git \(modo projeto\):/);
    assert.match(primeira.stdout, /docs\/jarvis\/ já está versionada: ignorar não a tira do git/);
    // 2ª execução: o exclude e o .gitignore já têm tudo; só o aviso da pasta versionada sobra
    const segunda = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(segunda.status, 0, segunda.stderr);
    assert.match(segunda.stdout, /🔒 Git \(modo projeto\):/, "o bloco aparece só por causa do aviso");
    assert.match(segunda.stdout, /docs\/jarvis\/ já está versionada/);
    assert.doesNotMatch(segunda.stdout, /\.git\/info\/exclude \(local, fora do PR\)/, "nada novo no exclude");
    assert.equal(gitIn(ws, "ls-files", "docs/jarvis/product/prd.md").trim(), "docs/jarvis/product/prd.md");
  });
});

