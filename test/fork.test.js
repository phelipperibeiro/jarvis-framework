// Testes do `jarvis fork` (bin/commands/fork.js, #199). Rode com: npm run test:filtro
//
// O core vem de um fixture mínimo apontado por JARVIS_ROOT (como em sync-engine.test.js) e o
// workspace é uma pasta temporária com .claude/ENV.md, passada por --env-file. Nada toca o
// framework real nem o ENV.md de quem roda.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fork,
  resolveArtifact,
  stampFrontmatter,
  listOverlay,
  diffAgainstCore,
  formatOverlayTable,
  DIFF_CELL_LIMIT,
} from "../bin/commands/fork.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

before(() => setTestMode(true));
// `fork()` grava process.exitCode nos caminhos de erro (é o contrato do comando); se o último teste
// terminar em 1, o node:test marca o arquivo inteiro como falho. Zera no fim.
after(() => {
  setTestMode(false);
  process.exitCode = 0;
});

function write(base, rel, content = "x") {
  const full = join(base, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf-8");
}

/** Core fixture: um artefato de cada tipo e o package.json com a versão carimbada. */
function buildCore(root) {
  write(root, "package.json", JSON.stringify({ name: "jarvis-ai-framework", version: "9.9.9" }));
  write(root, "agents/eng.agent.md", "---\nname: eng.agent\n---\n# agente\n");
  write(root, "workflows/engineering/eng.start.md", "---\ndescription: start\n---\n# start\n");
  write(
    root,
    "skills/eng-global-pr/SKILL.md",
    "---\nname: eng-global-pr\ndescription: PR\nlicense: AGPL-3.0\n---\n# pr\n"
  );
  write(root, "skills/eng-global-pr/references/1.md", "# ref");
  write(root, "rules/engineering/eng-rules.md", "> **Applies to:** HUB: all\n\n# core rules\n");
  write(root, "rules-on-demand/engineering/eng.pr-rules.md", "# pr rules do core\n");
  write(root, "templates/pull-request.md", "# PR template, sem frontmatter\n");
}

// `return await`: sem o await, o finally apagaria as pastas antes do teste assíncrono terminar
// (armadilha documentada em bin/README.md, "Como testar código que lê fs/rede").
async function withFixture(profileLine, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-fork-root-"));
  const ws = mkdtempSync(join(tmpdir(), "jarvis-fork-ws-"));
  const prev = process.env.JARVIS_ROOT;
  process.env.JARVIS_ROOT = root;
  try {
    buildCore(root);
    write(ws, ".claude/ENV.md", `WORKSPACE=ws\n${profileLine}\n`);
    // cópias do core na IDE, como depois de um jarvis init
    write(
      ws,
      ".claude/rules/engineering/eng-rules.md",
      "> **Applies to:** HUB: all\n\n# core rules\n"
    );
    write(ws, ".claude/rules-on-demand/engineering/eng.pr-rules.md", "# pr rules do core\n");
    const envFile = join(ws, ".claude/ENV.md");
    const run = (args, extra = {}) => fork({ _: args, "env-file": envFile, ...extra });
    return await fn({ root, ws, run });
  } finally {
    if (prev === undefined) delete process.env.JARVIS_ROOT;
    else process.env.JARVIS_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
    rmSync(ws, { recursive: true, force: true });
  }
}

test("resolveArtifact: nome pelo índice (workflow, skill, agente) e caminho para rules/templates; recusa .., absoluto e desconhecido", () => {
  const root = mkdtempSync(join(tmpdir(), "jarvis-fork-res-"));
  try {
    buildCore(root);
    assert.deepEqual(resolveArtifact(root, "eng.start"), {
      type: "workflows",
      relPath: "workflows/engineering/eng.start.md",
      isDir: false,
    });
    assert.deepEqual(resolveArtifact(root, "eng-global-pr"), {
      type: "skills",
      relPath: "skills/eng-global-pr",
      isDir: true,
    });
    assert.equal(resolveArtifact(root, "eng.agent").type, "agents");
    assert.equal(resolveArtifact(root, "rules/engineering/eng-rules.md").type, "rules");
    assert.equal(resolveArtifact(root, "templates/pull-request.md").type, "templates");
    for (const bad of [
      "nao-existe",
      "rules/../package.json",
      "/etc/passwd",
      "bin/jarvis.js",
      "",
      "workflows/engineering/eng.start.md",
    ]) {
      assert.equal(resolveArtifact(root, bad), null, `aceitou "${bad}"`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("stampFrontmatter: acrescenta ao frontmatter existente (substituindo carimbo antigo) ou cria um só com o carimbo", () => {
  const stamp = { from: "eng.start@9.9.9", at: "2026-10-30" };
  assert.equal(
    stampFrontmatter("---\ndescription: start\nforked_from: velho\n---\n# start\n", stamp),
    "---\ndescription: start\nforked_from: eng.start@9.9.9\nforked_at: 2026-10-30\n---\n# start\n"
  );
  assert.equal(
    stampFrontmatter("# sem frontmatter\n", { ...stamp, candidate: true }),
    "---\nforked_from: eng.start@9.9.9\nforked_at: 2026-10-30\ncore_candidate: true\n---\n\n# sem frontmatter\n"
  );
});

test("fork: skill vai inteira para o overlay com o SKILL.md carimbado; workflow e template também; --candidate marca", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run(["eng-global-pr"]), 0);
    const skill = readFileSync(
      join(ws, ".claude/overlays/acme/skills/eng-global-pr/SKILL.md"),
      "utf-8"
    );
    assert.match(
      skill,
      /^---\nname: eng-global-pr\ndescription: PR\nlicense: AGPL-3.0\nforked_from: eng-global-pr@9\.9\.9\nforked_at: \d{4}-\d{2}-\d{2}\n---\n# pr\n$/
    );
    assert.ok(existsSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr/references/1.md")));

    assert.equal(await run(["eng.start"], { candidate: true }), 0);
    const wf = readFileSync(
      join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"),
      "utf-8"
    );
    assert.match(wf, /forked_from: eng\.start@9\.9\.9\nforked_at: .*\ncore_candidate: true\n---/);

    assert.equal(await run(["templates/pull-request.md"]), 0);
    const tpl = readFileSync(join(ws, ".claude/overlays/acme/templates/pull-request.md"), "utf-8");
    assert.match(
      tpl,
      /^---\nforked_from: templates\/pull-request\.md@9\.9\.9\nforked_at: .*\n---\n\n# PR template, sem frontmatter\n$/
    );

    // nada foi copiado para a IDE fora de rules/: o resolver na chamada cuida desses tipos
    assert.ok(!existsSync(join(ws, ".claude/workflows")));
    assert.ok(!existsSync(join(ws, ".claude/skills/eng-global-pr")));
  });
});

test("fork: rule e rule-on-demand são recopiadas na IDE na hora, com a marcação; o core no pacote não muda", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ root, ws, run }) => {
    assert.equal(await run(["rules/engineering/eng-rules.md"]), 0);
    const ide = readFileSync(join(ws, ".claude/rules/engineering/eng-rules.md"), "utf-8");
    assert.match(
      ide,
      /^---\nforked_from: rules\/engineering\/eng-rules\.md@9\.9\.9\nforked_at: .*\n---\n\n> Overlay: acme \(forked_from rules\/engineering\/eng-rules\.md@9\.9\.9\)\n\n> \*\*Applies to:\*\* HUB: all\n\n# core rules\n$/
    );
    assert.equal(await run(["rules-on-demand/engineering/eng.pr-rules.md"]), 0);
    assert.match(
      readFileSync(join(ws, ".claude/rules-on-demand/engineering/eng.pr-rules.md"), "utf-8"),
      /> Overlay: acme/
    );
    // o arquivo do overlay não leva a marcação; o core instalado continua igual
    assert.doesNotMatch(
      readFileSync(join(ws, ".claude/overlays/acme/rules/engineering/eng-rules.md"), "utf-8"),
      /> Overlay:/
    );
    assert.equal(
      readFileSync(join(root, "rules/engineering/eng-rules.md"), "utf-8"),
      "> **Applies to:** HUB: all\n\n# core rules\n"
    );
  });
});

test("fork: erros saem com 1 (nome inexistente, caminho com .., fork já existente, sem nome) e nada é gravado", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run(["nao-existe"]), 1);
    assert.equal(await run(["rules/../package.json"]), 1);
    assert.equal(await run([]), 1);
    assert.equal(readdirSync(join(ws, ".claude")).includes("overlays"), false);
    assert.equal(await run(["eng.start"]), 0);
    assert.equal(await run(["eng.start"]), 1, "fork repetido deve pedir --update");
  });
});

test("fork: COMPANY_PROFILE vazio ou inválido cai no default stark-industries (com aviso) e o fork funciona lá", async () => {
  await withFixture("COMPANY_PROFILE=", async ({ ws, run }) => {
    assert.equal(await run(["eng.agent"]), 0);
    assert.ok(existsSync(join(ws, ".claude/overlays/stark-industries/agents/eng.agent.md")));
  });
  await withFixture("COMPANY_PROFILE=Acme Corp", async ({ ws, run }) => {
    assert.equal(await run(["eng.agent"]), 0);
    assert.ok(existsSync(join(ws, ".claude/overlays/stark-industries/agents/eng.agent.md")));
    assert.ok(!existsSync(join(ws, ".claude/overlays/Acme Corp")));
  });
});

test("fork --list: só lista o que está forkado (skill por pasta, sem carimbo, candidato, tipo não resolvido); vazio sai com 0", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run([], { list: true }), 0);
    assert.deepEqual(listOverlay(join(ws, ".claude/overlays/acme")), []);

    await run(["eng-global-pr"]);
    await run(["eng.start"], { candidate: true });
    write(ws, ".claude/overlays/acme/rules/manual.md", "# posto à mão, sem frontmatter\n");
    write(ws, ".claude/overlays/acme/scripts/x.md", "# tipo fora do overlay\n");

    const entries = listOverlay(join(ws, ".claude/overlays/acme"));
    assert.deepEqual(
      entries.map((e) => [e.path, e.type, e.forkedFrom, e.candidate, e.unknownType]),
      [
        ["rules/manual.md", "rules", null, false, false],
        ["scripts/x.md", "scripts", null, false, true],
        ["skills/eng-global-pr", "skills", "eng-global-pr@9.9.9", false, false],
        ["workflows/engineering/eng.start.md", "workflows", "eng.start@9.9.9", true, false],
      ]
    );
    assert.equal(await run([], { list: true }), 0);
  });
});

// --- Fase 5: --update e --delete ----------------------------------------------------------------

test("diffAgainstCore: só as linhas diferentes, ignorando o carimbo; marca contrato quando a mudança toca sessão, ENV, template ou CLI", () => {
  const fork = "---\nforked_from: x@1.0.0\n---\n# titulo\nlinha igual\nminha linha\n";
  const core = "---\n---\n# titulo\nlinha igual\nlinha nova do core\n";
  const d = diffAgainstCore(fork, core);
  assert.deepEqual(
    d.changes.map(({ op, line }) => ({ op, line })),
    [
      { op: "-", line: "minha linha" },
      { op: "+", line: "linha nova do core" },
    ]
  );
  assert.equal(d.contract, false);
  assert.equal(diffAgainstCore("a\n", "a\n").changes.length, 0);
  assert.equal(diffAgainstCore("a\n", "a\ngrava em .jarvis/sessions/x\n").contract, true);
  assert.equal(diffAgainstCore("a\n", "a\nleia templates/plan-template.md\n").contract, true);
  assert.equal(diffAgainstCore("a\n", "a\nrode jarvis tokens\n").contract, true);
});

test("fork --update: fork inexistente sai com 1; existente recarimba forked_from para a versão atual sem mudar o corpo", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run(["eng.start"], { update: true }), 1);
    write(
      ws,
      ".claude/overlays/acme/workflows/engineering/eng.start.md",
      "---\ndescription: start\nforked_from: eng.start@1.0.0\nforked_at: 2026-01-01\ncore_candidate: true\n---\n# start da empresa\n"
    );
    assert.equal(await run(["eng.start"], { update: true }), 0);
    assert.equal(
      readFileSync(join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"), "utf-8"),
      "---\ndescription: start\nforked_from: eng.start@9.9.9\nforked_at: 2026-01-01\ncore_candidate: true\n---\n# start da empresa\n"
    );
  });
});

test("fork --update: artefato que o core não tem mais avisa e sugere --delete (sai com 0, fork intacto)", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    write(
      ws,
      ".claude/overlays/acme/workflows/engineering/eng.velho.md",
      "---\nforked_from: eng.velho@1.0.0\n---\n# velho\n"
    );
    assert.equal(await run(["eng.velho"], { update: true }), 0);
    assert.match(
      readFileSync(join(ws, ".claude/overlays/acme/workflows/engineering/eng.velho.md"), "utf-8"),
      /forked_from: eng\.velho@1\.0\.0/
    );
  });
});

test("fork --delete: remove skill e workflow do overlay; rule volta à versão do core na IDE, sem marcação; inexistente sai com 1", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run(["eng.start"], { delete: true }), 1);
    await run(["eng-global-pr"]);
    await run(["rules/engineering/eng-rules.md"]);
    assert.match(
      readFileSync(join(ws, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      /> Overlay: acme/
    );

    assert.equal(await run(["eng-global-pr"], { delete: true }), 0);
    assert.ok(!existsSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr")));

    assert.equal(await run(["rules/engineering/eng-rules.md"], { delete: true }), 0);
    assert.ok(!existsSync(join(ws, ".claude/overlays/acme/rules/engineering/eng-rules.md")));
    assert.equal(
      readFileSync(join(ws, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      "> **Applies to:** HUB: all\n\n# core rules\n"
    );
    assert.deepEqual(listOverlay(join(ws, ".claude/overlays/acme")), []);
  });
});

// --- Fase 8: correções do pre-pr rodada 1 --------------------------------------------------------

test("fork: subpasta do overlay que é link para fora do overlay bloqueia fork, --update e --delete (R5)", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    const outside = join(ws, "fora-do-overlay");
    mkdirSync(outside, { recursive: true });
    mkdirSync(join(ws, ".claude/overlays/acme"), { recursive: true });
    symlinkSync(outside, join(ws, ".claude/overlays/acme/skills"));

    assert.equal(await run(["eng-global-pr"]), 1);
    assert.deepEqual(readdirSync(outside), [], "o fork gravou fora do overlay");

    // um fork já existente atrás do link também não é alterado nem apagado
    write(
      outside,
      "eng-global-pr/SKILL.md",
      "---\nforked_from: eng-global-pr@1.0.0\n---\n# fora\n"
    );
    assert.equal(await run(["eng-global-pr"], { update: true }), 1);
    assert.equal(await run(["eng-global-pr"], { delete: true }), 1);
    assert.match(
      readFileSync(join(outside, "eng-global-pr/SKILL.md"), "utf-8"),
      /forked_from: eng-global-pr@1\.0\.0/
    );
  });
});

test("fork: recópia da rule na IDE com erro sai com 1 (o fork fica no overlay)", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    // .claude/rules-on-demand/engineering vira arquivo: o mkdir do destino falha
    rmSync(join(ws, ".claude/rules-on-demand/engineering"), { recursive: true, force: true });
    writeFileSync(join(ws, ".claude/rules-on-demand/engineering"), "não sou uma pasta");
    assert.equal(await run(["rules-on-demand/engineering/eng.pr-rules.md"]), 1);
    assert.ok(
      existsSync(join(ws, ".claude/overlays/acme/rules-on-demand/engineering/eng.pr-rules.md"))
    );
  });
});

test("fork --update --candidate marca core_candidate; --delete de rule só do overlay apaga a cópia da IDE", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    await run(["eng.start"]);
    assert.equal(await run(["eng.start"], { update: true, candidate: true }), 0);
    assert.match(
      readFileSync(join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"), "utf-8"),
      /core_candidate: true/
    );

    write(
      ws,
      ".claude/overlays/acme/rules/so-acme.md",
      "---\nforked_from: rules/so-acme.md@1.0.0\n---\n# só overlay\n"
    );
    write(
      ws,
      ".claude/rules/so-acme.md",
      "> Overlay: acme (forked_from rules/so-acme.md@1.0.0)\n\n# só overlay\n"
    );
    assert.equal(await run(["rules/so-acme.md"], { delete: true }), 0);
    assert.ok(!existsSync(join(ws, ".claude/overlays/acme/rules/so-acme.md")));
    assert.ok(!existsSync(join(ws, ".claude/rules/so-acme.md")), "a cópia da IDE ficou órfã");
  });
});

test("fork: ENV.md inexistente (--env-file errado) sai com 1 sem gravar", async () => {
  assert.equal(
    await fork({ _: ["eng.start"], "env-file": join(tmpdir(), "nao-existe", "ENV.md") }),
    1
  );
});

// --- Fase 9: contrato do --update, --list em colunas, CRLF, LCS ----------------------------------

/** Captura o que o comando imprime: desliga o modo de teste do logger só durante `fn` e troca o console. */
async function captureOutput(fn) {
  const lines = [];
  const { log, error } = console;
  console.log = (...a) => lines.push(a.join(" "));
  console.error = (...a) => lines.push(a.join(" "));
  setTestMode(false);
  try {
    return { result: await fn(), out: lines.join("\n") };
  } finally {
    setTestMode(true);
    console.log = log;
    console.error = error;
  }
}

test("fork --update: sem --diff não compara (só recarimba); com --diff mostra -/+ e 🔴 quando toca contrato; igual ao core avisa", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    await run(["eng.start"]);
    const forkPath = join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md");
    writeFileSync(
      forkPath,
      readFileSync(forkPath, "utf-8").replace("# start", "# start da acme\nleia templates/x.md")
    );

    const semDiff = await captureOutput(() => run(["eng.start"], { update: true }));
    assert.equal(semDiff.result, 0);
    assert.match(semDiff.out, /Sem comparação com o core/);
    assert.doesNotMatch(semDiff.out, /^[-+] /m);

    const comDiff = await captureOutput(() => run(["eng.start"], { update: true, diff: true }));
    assert.equal(comDiff.result, 0);
    assert.match(comDiff.out, /- # start da acme/);
    assert.match(comDiff.out, /\+ # start/);
    assert.match(comDiff.out, /🔴 possível mudança de contrato/);

    writeFileSync(
      forkPath,
      readFileSync(forkPath, "utf-8").replace("# start da acme\nleia templates/x.md", "# start")
    );
    const igual = await captureOutput(() => run(["eng.start"], { update: true, diff: true }));
    assert.match(igual.out, /o fork é igual ao core atual/);
  });
});

test("fork --update e --delete com skill: SKILL.md recarimbado, references/ intacto, pasta removida; skill só do overlay avisa", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    await run(["eng-global-pr"]);
    const skillMd = join(ws, ".claude/overlays/acme/skills/eng-global-pr/SKILL.md");
    writeFileSync(skillMd, readFileSync(skillMd, "utf-8").replace("@9.9.9", "@1.0.0"));
    assert.equal(await run(["eng-global-pr"], { update: true }), 0);
    assert.match(readFileSync(skillMd, "utf-8"), /forked_from: eng-global-pr@9\.9\.9/);
    assert.equal(
      readFileSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr/references/1.md"), "utf-8"),
      "# ref"
    );

    write(
      ws,
      ".claude/overlays/acme/skills/so-acme/SKILL.md",
      "---\nname: so-acme\ndescription: x\nlicense: y\nforked_from: so-acme@1.0.0\n---\n# só overlay\n"
    );
    const r = await captureOutput(() => run(["so-acme"], { update: true }));
    assert.equal(r.result, 0);
    assert.match(r.out, /O core atual não tem mais skills\/so-acme/);

    assert.equal(await run(["eng-global-pr"], { delete: true }), 0);
    assert.ok(!existsSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr")));
  });
});

test("formatOverlayTable: cabeçalho com as 5 colunas, tipo não resolvido na coluna Tipo, candidato na última", () => {
  const lines = formatOverlayTable([
    {
      path: "skills/eng-global-pr",
      type: "skills",
      forkedFrom: "eng-global-pr@9.9.9",
      forkedAt: "2026-10-30",
      candidate: true,
      unknownType: false,
    },
    {
      path: "scripts/x.md",
      type: "scripts",
      forkedFrom: null,
      forkedAt: null,
      candidate: false,
      unknownType: true,
    },
  ]);
  assert.match(lines[0], /^ {2}Caminho\s+Tipo\s+forked_from\s+forked_at\s+Candidato$/);
  assert.match(
    lines[2],
    /^ {2}skills\/eng-global-pr\s+skills\s+eng-global-pr@9\.9\.9\s+2026-10-30\s+candidato a core$/
  );
  assert.match(
    lines[3],
    /scripts\/x\.md\s+⚠️ tipo não resolvido \(scripts\)\s+\(sem carimbo\)\s+—\s+—$/
  );
});

test("CRLF: fork editado no Windows mantém o carimbo no --list e no --update; diff só de quebra de linha é vazio", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    write(
      ws,
      ".claude/overlays/acme/workflows/engineering/eng.start.md",
      "---\r\ndescription: start\r\nforked_from: eng.start@1.0.0\r\nforked_at: 2026-01-01\r\ncore_candidate: true\r\n---\r\n# start\r\n"
    );
    const [entry] = listOverlay(join(ws, ".claude/overlays/acme"));
    assert.equal(entry.forkedFrom, "eng.start@1.0.0");
    assert.equal(entry.candidate, true);

    assert.equal(await run(["eng.start"], { update: true }), 0);
    const after = readFileSync(
      join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"),
      "utf-8"
    );
    assert.equal(
      after,
      "---\ndescription: start\nforked_from: eng.start@9.9.9\nforked_at: 2026-01-01\ncore_candidate: true\n---\n# start\n"
    );
  });
  assert.equal(diffAgainstCore("a\r\nb\r\n", "a\nb\n").changes.length, 0);
  assert.equal(
    stampFrontmatter("---\r\nx: 1\r\n---\r\ncorpo\r\n", { from: "f@1", at: "d" }),
    "---\nx: 1\nforked_from: f@1\nforked_at: d\n---\ncorpo\n"
  );
});

test("diffAgainstCore: 70.000 linhas iguais com 2 mudanças dão 2 changes (corte do prefixo/sufixo); miolo gigante vira tooLarge", () => {
  const base = Array.from({ length: 70_000 }, (_, i) => `linha ${i}`);
  const fork = [...base];
  fork[35_000] = "minha linha";
  const core = [...base];
  core[35_000] = "linha nova do core";
  const d = diffAgainstCore(fork.join("\n"), core.join("\n"));
  assert.deepEqual(
    d.changes.map(({ op, line }) => ({ op, line })),
    [
      { op: "-", line: "minha linha" },
      { op: "+", line: "linha nova do core" },
    ]
  );
  assert.equal(d.tooLarge, false);

  const n = Math.ceil(Math.sqrt(DIFF_CELL_LIMIT)) + 10;
  const a = Array.from({ length: n }, (_, i) => `a${i}`).join("\n");
  const b = Array.from({ length: n }, (_, i) => `b${i}`).join("\n");
  const big = diffAgainstCore(a, b);
  assert.equal(big.tooLarge, true);
  assert.equal(big.removed, n);
  assert.deepEqual(big.changes, []);
});

// --- Fase 11 (#199): link quebrado no destino, --diff não grava e mostra a seção, tooLarge, tabela --

test("fork: link quebrado no lugar do destino bloqueia o fork (nada gravado fora); link de arquivo bloqueia o --delete", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    const fora = join(ws, "FORA.md");
    mkdirSync(join(ws, ".claude/overlays/acme/workflows/engineering"), { recursive: true });
    symlinkSync(fora, join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"));
    assert.equal(await run(["eng.start"]), 1);
    assert.ok(!existsSync(fora), "o fork gravou fora do overlay seguindo o link quebrado");

    const alvo = join(ws, "alvo.md");
    writeFileSync(alvo, "# fora");
    mkdirSync(join(ws, ".claude/overlays/acme/rules/engineering"), { recursive: true });
    symlinkSync(alvo, join(ws, ".claude/overlays/acme/rules/engineering/eng-rules.md"));
    assert.equal(await run(["rules/engineering/eng-rules.md"], { delete: true }), 1);
    assert.ok(existsSync(alvo), "o --delete apagou o alvo do link");
  });
});

test("fork --update --diff: só mostra (não grava), agrupa pela seção; --update sem --diff recarimba", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    await run(["eng.start"]);
    const forkPath = join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md");
    writeFileSync(
      forkPath,
      readFileSync(forkPath, "utf-8")
        .replace("@9.9.9", "@1.0.0")
        .replace("# start", "# start\n\n## Fase 2\n\nbranch nasce da develop")
    );
    const before = readFileSync(forkPath, "utf-8");

    const out = await captureOutput(() => run(["eng.start"], { update: true, diff: true }));
    assert.equal(out.result, 0);
    assert.match(out.out, /── ## Fase 2/);
    assert.match(out.out, /- branch nasce da develop/);
    assert.match(out.out, /Nada gravado/);
    assert.equal(readFileSync(forkPath, "utf-8"), before, "o --diff alterou o fork");

    assert.equal(await run(["eng.start"], { update: true }), 0);
    assert.match(readFileSync(forkPath, "utf-8"), /forked_from: eng\.start@9\.9\.9/);
  });
});

test("fork --update --diff: arquivos grandes demais avisam em vez de dizer que são iguais", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ root, ws, run }) => {
    const n = Math.ceil(Math.sqrt(DIFF_CELL_LIMIT)) + 10;
    write(
      root,
      "workflows/engineering/eng.start.md",
      Array.from({ length: n }, (_, i) => `c${i}`).join("\n")
    );
    await run(["eng.start"]);
    const forkPath = join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md");
    writeFileSync(
      forkPath,
      "---\nforked_from: eng.start@9.9.9\nforked_at: 2026-10-30\n---\n\n" +
        Array.from({ length: n }, (_, i) => `f${i}`).join("\n")
    );
    const out = await captureOutput(() => run(["eng.start"], { update: true, diff: true }));
    assert.match(out.out, /grandes demais/);
    assert.doesNotMatch(out.out, /igual ao core/);
  });
});

test("formatOverlayTable: tipo não resolvido e candidato na mesma linha ficam em colunas separadas", () => {
  const [, , row] = formatOverlayTable([
    {
      path: "scripts/x.md",
      type: "scripts",
      forkedFrom: "x@1",
      forkedAt: "2026-10-30",
      candidate: true,
      unknownType: true,
    },
  ]);
  assert.match(
    row,
    /scripts\/x\.md\s+⚠️ tipo não resolvido \(scripts\)\s+x@1\s+2026-10-30\s+candidato a core$/
  );
});

// --- Fase 13 (#199): o próprio overlay pode ser link; SKILL.md linkado no --update ------------------

test("fork: overlays/{perfil} que é link para uma pasta real funciona (fork, --update, --delete gravam na pasta real)", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    const real = join(ws, "overlay-da-empresa");
    mkdirSync(real, { recursive: true });
    mkdirSync(join(ws, ".claude/overlays"), { recursive: true });
    symlinkSync(real, join(ws, ".claude/overlays/acme"));

    assert.equal(await run(["eng.start"]), 0);
    const forkPath = join(real, "workflows/engineering/eng.start.md");
    assert.match(readFileSync(forkPath, "utf-8"), /forked_from: eng\.start@9\.9\.9/);

    writeFileSync(forkPath, readFileSync(forkPath, "utf-8").replace("@9.9.9", "@1.0.0"));
    assert.equal(await run(["eng.start"], { update: true }), 0);
    assert.match(readFileSync(forkPath, "utf-8"), /forked_from: eng\.start@9\.9\.9/);

    assert.equal(await run(["eng.start"], { delete: true }), 0);
    assert.ok(!existsSync(forkPath));
    // skill (pasta, rmSync recursivo) no overlay linkado: fork e --delete na pasta real
    assert.equal(await run(["eng-global-pr"]), 0);
    assert.ok(existsSync(join(real, "skills/eng-global-pr/SKILL.md")));
    assert.equal(await run(["eng-global-pr"], { delete: true }), 0);
    assert.ok(!existsSync(join(real, "skills/eng-global-pr")));
    assert.ok(existsSync(real), "o --delete apagou a pasta real do overlay");
    // um link abaixo do overlay continua recusado
    symlinkSync(join(ws, "fora"), join(real, "workflows/engineering/eng.start.md"));
    assert.equal(await run(["eng.start"]), 1);
    assert.ok(!existsSync(join(ws, "fora")));
  });
});

test("fork --update: SKILL.md do fork que é link para fora do overlay sai com 1 e não altera o alvo (R5)", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ ws, run }) => {
    assert.equal(await run(["eng-global-pr"]), 0);
    const skillDir = join(ws, ".claude/overlays/acme/skills/eng-global-pr");
    const fora = join(ws, "FORA.md");
    writeFileSync(fora, "---\nforked_from: eng-global-pr@1.0.0\n---\n# fora\n");
    rmSync(join(skillDir, "SKILL.md"));
    symlinkSync(fora, join(skillDir, "SKILL.md"));

    assert.equal(await run(["eng-global-pr"], { update: true }), 1);
    assert.equal(
      readFileSync(fora, "utf-8"),
      "---\nforked_from: eng-global-pr@1.0.0\n---\n# fora\n",
      "o --update gravou fora do overlay seguindo o link"
    );
    // o --delete remove o link (a pasta da skill), não o alvo
    assert.equal(await run(["eng-global-pr"], { delete: true }), 0);
    assert.ok(!existsSync(skillDir));
    assert.equal(
      readFileSync(fora, "utf-8"),
      "---\nforked_from: eng-global-pr@1.0.0\n---\n# fora\n"
    );
  });
});
