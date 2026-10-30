// Testes do `jarvis fork` (bin/commands/fork.js, #199). Rode com: npm run test:filtro
//
// O core vem de um fixture mínimo apontado por JARVIS_ROOT (como em sync-engine.test.js) e o
// workspace é uma pasta temporária com .claude/ENV.md, passada por --env-file. Nada toca o
// framework real nem o ENV.md de quem roda.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fork, resolveArtifact, stampFrontmatter, listOverlay } from "../bin/commands/fork.js";
import { setTestMode } from "../bin/lib/utils/logger.js";

before(() => setTestMode(true));
after(() => setTestMode(false));

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
    write(ws, ".claude/rules/engineering/eng-rules.md", "> **Applies to:** HUB: all\n\n# core rules\n");
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
    for (const bad of ["nao-existe", "rules/../package.json", "/etc/passwd", "bin/jarvis.js", "", "workflows/engineering/eng.start.md"]) {
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
    const skill = readFileSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr/SKILL.md"), "utf-8");
    assert.match(skill, /^---\nname: eng-global-pr\ndescription: PR\nlicense: AGPL-3.0\nforked_from: eng-global-pr@9\.9\.9\nforked_at: \d{4}-\d{2}-\d{2}\n---\n# pr\n$/);
    assert.ok(existsSync(join(ws, ".claude/overlays/acme/skills/eng-global-pr/references/1.md")));

    assert.equal(await run(["eng.start"], { candidate: true }), 0);
    const wf = readFileSync(join(ws, ".claude/overlays/acme/workflows/engineering/eng.start.md"), "utf-8");
    assert.match(wf, /forked_from: eng\.start@9\.9\.9\nforked_at: .*\ncore_candidate: true\n---/);

    assert.equal(await run(["templates/pull-request.md"]), 0);
    const tpl = readFileSync(join(ws, ".claude/overlays/acme/templates/pull-request.md"), "utf-8");
    assert.match(tpl, /^---\nforked_from: templates\/pull-request\.md@9\.9\.9\nforked_at: .*\n---\n\n# PR template, sem frontmatter\n$/);

    // nada foi copiado para a IDE fora de rules/: o resolver na chamada cuida desses tipos
    assert.ok(!existsSync(join(ws, ".claude/workflows")));
    assert.ok(!existsSync(join(ws, ".claude/skills/eng-global-pr")));
  });
});

test("fork: rule e rule-on-demand são recopiadas na IDE na hora, com a marcação; o core no pacote não muda", async () => {
  await withFixture("COMPANY_PROFILE=acme", async ({ root, ws, run }) => {
    assert.equal(await run(["rules/engineering/eng-rules.md"]), 0);
    const ide = readFileSync(join(ws, ".claude/rules/engineering/eng-rules.md"), "utf-8");
    assert.match(ide, /^---\nforked_from: rules\/engineering\/eng-rules\.md@9\.9\.9\nforked_at: .*\n---\n\n> Overlay: acme \(forked_from rules\/engineering\/eng-rules\.md@9\.9\.9\)\n\n> \*\*Applies to:\*\* HUB: all\n\n# core rules\n$/);
    assert.equal(await run(["rules-on-demand/engineering/eng.pr-rules.md"]), 0);
    assert.match(readFileSync(join(ws, ".claude/rules-on-demand/engineering/eng.pr-rules.md"), "utf-8"), /> Overlay: acme/);
    // o arquivo do overlay não leva a marcação; o core instalado continua igual
    assert.doesNotMatch(readFileSync(join(ws, ".claude/overlays/acme/rules/engineering/eng-rules.md"), "utf-8"), /> Overlay:/);
    assert.equal(readFileSync(join(root, "rules/engineering/eng-rules.md"), "utf-8"), "> **Applies to:** HUB: all\n\n# core rules\n");
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
