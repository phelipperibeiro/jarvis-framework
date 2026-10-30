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
import { spawnSync } from "node:child_process";
import { parseMenuChoice, upgradePendencies } from "../bin/commands/init.js";

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
    assert.ok(readFileSync(envPath, "utf-8").startsWith(ENV_SEM_BOARD.trimEnd()));
    const completo = readFileSync(envPath, "utf-8");

    const segunda = runWithInput(ws, "\n", "--ide", "claude");
    assert.equal(segunda.status, 0, segunda.stderr);
    assert.equal(readFileSync(envPath, "utf-8"), completo, "o ENV.md completo não muda");
    assert.match(segunda.stdout, /Upgrade concluído: já na v\d/);
    assert.doesNotMatch(segunda.stdout, /(\d+\.\d+\.\d+) → \1/);
  });
});

test("init --upgrade: sem pendência, não manda rodar o /jarvis-init upgrade", () => {
  withWorkspace({ ".claude/ENV.md": ENV_SEM_BOARD }, (ws) => {
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
