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

// #209: o upgrade apaga MESSAGE_BROKER e SMTP (blocos que saíram do template); o resto fica igual.
const semRemovidas = (text) => text.replace(/^(MESSAGE_BROKER|SMTP)=.*\n/gm, "");

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
      assert.ok(env.startsWith(semRemovidas(ENV_V520)), "linhas existentes do ENV mudaram");
      assert.doesNotMatch(env, /^(MESSAGE_BROKER|SMTP)=/m);
      assert.match(r.stdout, /removidas \(não são mais usadas\): MESSAGE_BROKER, SMTP/);
      assert.doesNotMatch(r.stdout, /rabbitmq/);
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

// Perfil completo (os 4 eixos): sem ele, o upgrade não filtra as rules e pede o /jarvis-init (#83).
const ENV_PERFIL = ENV_SEM_BOARD.replace("HUB=BACKEND", "HUB=BACKEND\nPOSITION=SENIOR\nSQUAD=CORE");

test("init --upgrade: sem pendência, não manda rodar o /jarvis-init upgrade", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Agora rode/);
    assert.match(r.stdout, /Nada pendente na IDE\./);
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

test("upgradePendencies: eixo do perfil vazio é pendência (#83)", () => {
  assert.deepEqual(
    upgradePendencies({ pendingAxes: [], envPlan: {}, missingProfile: ["POSITION", "SQUAD"] }),
    ["preencher POSITION, SQUAD (as rules ficam sem o filtro do perfil)"]
  );
});

test("init --upgrade: com o perfil completo, filtra as rules como o jarvis rules sync (#83)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Rules filtradas pelo perfil \(BACKEND\/SENIOR\/ENGINEERING\/CORE\)/);
    // AREA: PRODUCT não é do perfil; a rule comum dos prod.spec.* (AREA: all) fica.
    assert.ok(!existsSync(join(ws, ".claude/rules/product/prod.spec-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/product/prod.spec-common-rules.md")));
  });
});

test("init --upgrade: sem os 4 eixos, não filtra e manda ao /jarvis-init upgrade (#83)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_SEM_BOARD }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /Rules filtradas pelo perfil/);
    assert.ok(existsSync(join(ws, ".claude/rules/product/prod.spec-rules.md")));
    assert.match(
      r.stdout,
      /Agora rode .*\/jarvis-init upgrade.* preencher POSITION, SQUAD \(as rules ficam sem o filtro do perfil\)/
    );
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
    // Do perfil BACKEND/SENIOR/ENGINEERING: fica o que é dele e o que é de qualquer AREA.
    assert.ok(existsSync(join(ws, ".claude/rules/engineering/eng-rules.md")));
    assert.ok(!existsSync(join(ws, ".claude/rules/product/prod.spec-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/product/prod.spec-common-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/engineering/eng.rpa-rules.md")));
    assert.ok(existsSync(join(ws, ".claude/rules-on-demand/engineering/eng.start-rules.md")));
  });
});

test("init --upgrade (kiro): o steering fica só com as rules do perfil (#83)", () => {
  withWorkspace({ ".kiro/ENV.md": ENV_PERFIL.replace("IDE=claude", "IDE=kiro") }, (ws) => {
    const r = run(ws, "--upgrade", "--ide", "kiro", "--yes");
    assert.equal(r.status, 0, r.stderr);
    const steering = join(ws, ".kiro/steering");
    assert.ok(existsSync(join(steering, "eng-rules.md")));
    // AREA: PRODUCT e HUB: FRONTEND não são do perfil BACKEND/SENIOR/ENGINEERING.
    assert.ok(!existsSync(join(steering, "prod.spec-rules.md")));
    assert.ok(!existsSync(join(steering, "eng.frontend-rules.md")));
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

test("init --force: reinstalação com o ENV.md completo filtra as rules como o --upgrade (#83)", () => {
  withWorkspace({ ".claude/ENV.md": ENV_PERFIL }, (ws) => {
    const r = run(ws, "--ide", "claude", "--force");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Rules filtradas pelo perfil \(BACKEND\/SENIOR\/ENGINEERING\/CORE\)/);
    assert.ok(!existsSync(join(ws, ".claude/rules/product/prod.spec-rules.md")));
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

test("init --upgrade: eixo com o exemplo [..] do template não filtra e vira pendência (#83)", () => {
  withWorkspace(
    { ".claude/ENV.md": ENV_PERFIL.replace("POSITION=SENIOR", "POSITION=[SENIOR]") },
    (ws) => {
      const r = run(ws, "--upgrade", "--ide", "claude", "--yes");
      assert.equal(r.status, 0, r.stderr);
      assert.doesNotMatch(r.stdout, /Rules filtradas pelo perfil/);
      assert.match(r.stdout, /preencher POSITION \(as rules ficam sem o filtro do perfil\)/);
    }
  );
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
      const { rulesSync, missingProfile } = filterRulesByEnv(
        ws,
        "claude",
        join(ws, ".claude/ENV.md")
      );
      assert.deepEqual(missingProfile, []);
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

const commitAll = (ws) => {
  gitIn(ws, "add", "-A");
  gitIn(ws, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "x");
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
  const base = { pendingAxes: [], envPlan: {}, missingProfile: [] };
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
    assert.match(r.stdout, /Nada pendente na IDE|Agora rode/);
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
    assert.match(output(r), /Git \(modo projeto\): o git não respondeu/);
    assert.match(output(r), /O exclude não foi gravado: AGENTS\.md, CLAUDE\.md e CDD-MIND-MAP\.md podem entrar no PR/);
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
    assert.match(r.stdout, /Nada pendente na IDE|Agora rode/);
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
