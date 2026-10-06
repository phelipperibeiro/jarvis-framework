// Testes de syncAssets (sync-engine.js). Rode com: npm run test:filtro
//
// getFrameworkRoot() (bin/lib/utils/paths.js) tem um escape hatch de propósito
// para isso: process.env.JARVIS_ROOT, se definido e existir, vence sobre o
// framework real. Cada teste monta um "framework root" fixture mínimo e aponta
// JARVIS_ROOT pra ele, em vez de sincronizar o framework inteiro (lento e
// dependente do conteúdo real de agents/skills/workflows).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncAssets, isExcludedFromSync } from "../bin/lib/core/sync-engine.js";

function withJarvisRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-root-"));
  const target = mkdtempSync(join(tmpdir(), "jarvis-target-"));
  const prev = process.env.JARVIS_ROOT;
  process.env.JARVIS_ROOT = root;
  try {
    return fn(root, target);
  } finally {
    if (prev === undefined) delete process.env.JARVIS_ROOT;
    else process.env.JARVIS_ROOT = prev;
    rmSync(root, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  }
}

function write(root, relPath, content = "x") {
  const full = join(root, relPath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content, "utf-8");
}

/** Fixture mínimo com 1 arquivo por SYNC_DIRS + os 3 SYNC_ROOT_FILES. */
function buildMinimalFramework(root) {
  write(root, "agents/eng.agent.md");
  write(
    root,
    "skills/test-skill/SKILL.md",
    // `description:` precisa ter algo depois dela no bloco (ex: license) — é
    // assim que todo SKILL.md real do framework é escrito, e é o que o regex
    // de parseSkillFrontmatter espera para encontrar o fim do campo.
    [
      "---",
      "name: test-skill",
      "description: Um skill de teste",
      "license: AGPL-3.0",
      "---",
      "# corpo",
    ].join("\n")
  );
  write(root, "workflows/sub/eng.start.md"); // numa subpasta — testa o flatten
  write(root, "templates/engineering/architecture-template.md");
  write(root, "rules/engineering/eng-rules.md");
  write(root, "rules-on-demand/engineering/eng.plan-rules.md");
  write(root, "scripts/algum-script.sh");
  write(root, "taxonomy.md");
  write(root, "AGENTS.md");
  write(root, "members.md");
}

test("syncAssets: caminho feliz para claude — copia SYNC_DIRS, SYNC_ROOT_FILES, achata workflows/ e grava o lock", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    const result = syncAssets(target, "claude", {});

    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.ok(existsSync(join(target, ".claude/agents/eng.agent.md")));
    assert.ok(existsSync(join(target, ".claude/skills/test-skill/SKILL.md")));
    assert.ok(existsSync(join(target, ".claude/templates/engineering/architecture-template.md")));
    assert.ok(existsSync(join(target, ".claude/rules/engineering/eng-rules.md")));
    assert.ok(existsSync(join(target, ".claude/rules-on-demand/engineering/eng.plan-rules.md")));
    assert.ok(existsSync(join(target, ".claude/scripts/algum-script.sh")));
    assert.ok(existsSync(join(target, ".claude/taxonomy.md")));
    assert.ok(existsSync(join(target, ".claude/AGENTS.md")));
    assert.ok(existsSync(join(target, ".claude/members.md")));

    // flatten: workflows/sub/eng.start.md -> workflows/eng.start.md (sem subpasta)
    assert.ok(existsSync(join(target, ".claude/workflows/eng.start.md")));
    assert.ok(!existsSync(join(target, ".claude/workflows/sub")));

    // lock file
    assert.ok(existsSync(join(target, ".claude/jarvis-lock.json")));
  });
});

test("syncAssets: dir inexistente no framework é listado em skipped, não em errors", () => {
  withJarvisRoot((root, target) => {
    // framework vazio — nenhum SYNC_DIRS/SYNC_ROOT_FILES existe
    const result = syncAssets(target, "claude", {});
    assert.equal(result.errors.length, 0);
    assert.ok(result.skipped.some((s) => s.includes("agents/")));
    assert.ok(result.skipped.some((s) => s.includes("skills/")));
  });
});

test("syncAssets: SYNC_ROOT_FILES não sobrescreve sem --force; SYNC_DIRS sempre sobrescreve", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    syncAssets(target, "claude", {});
    writeFileSync(join(target, ".claude/taxonomy.md"), "versão local editada", "utf-8");
    writeFileSync(join(target, ".claude/agents/eng.agent.md"), "versão local editada", "utf-8");

    const result = syncAssets(target, "claude", {});

    // SYNC_ROOT_FILES: existe no destino e sem --force -> preservado, listado em skipped
    assert.equal(
      readFileSync(join(target, ".claude/taxonomy.md"), "utf-8"),
      "versão local editada"
    );
    assert.ok(result.skipped.some((s) => s.startsWith("taxonomy.md")));

    // SYNC_DIRS: cpSync usa force !== false por padrão -> sempre sobrescreve, com ou sem --force
    assert.equal(readFileSync(join(target, ".claude/agents/eng.agent.md"), "utf-8"), "x");
  });
});

test("syncAssets: --force sobrescreve também os SYNC_ROOT_FILES", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    syncAssets(target, "claude", {});
    writeFileSync(join(target, ".claude/taxonomy.md"), "versão local editada", "utf-8");

    syncAssets(target, "claude", { force: true });

    assert.equal(readFileSync(join(target, ".claude/taxonomy.md"), "utf-8"), "x");
  });
});

test("syncAssets: workflowsFolder customizado (ex: Claude Code usa 'commands')", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    const result = syncAssets(target, "claude", { workflowsFolder: "commands" });

    assert.ok(existsSync(join(target, ".claude/commands/eng.start.md")));
    assert.ok(!existsSync(join(target, ".claude/workflows")));
    assert.ok(result.copied.includes("commands/"));
  });
});

test("syncAssets: codex gera openai.yaml por skill com name/description do frontmatter", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    syncAssets(target, "codex", {});

    const yamlPath = join(target, ".codex/skills/test-skill/openai.yaml");
    assert.ok(existsSync(yamlPath));
    const yaml = readFileSync(yamlPath, "utf-8");
    assert.match(yaml, /^name: test-skill$/m);
    assert.match(yaml, /description: "Um skill de teste"/);
  });
});

test("syncAssets: dryRun não escreve nada no disco", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);

    const result = syncAssets(target, "claude", { dryRun: true });

    assert.ok(!existsSync(join(target, ".claude")));
    assert.ok(result.copied.length > 0); // reporta o que faria, sem fazer
  });
});

/** Arquivos de documentação de pasta (não são componentes) em cada SYNC_DIRS do fixture. */
function addDocFiles(root) {
  write(root, "workflows/AGENTS.md");
  write(root, "workflows/README.md");
  write(root, "workflows/sub/README.md");
  write(root, "workflows/warm-up.md");
  write(root, "skills/AGENTS.md");
  write(root, "skills/SKILLS-ROADMAP.md");
  write(root, "skills/test-skill/README.md");
  write(root, "skills/test-skill/references/README.md");
  write(root, "agents/README.md");
  write(root, "agents/AGENTS.md");
}

test("syncAssets: AGENTS.md, README.md e roadmap não chegam à IDE; componentes continuam sendo copiados", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    addDocFiles(root);

    const result = syncAssets(target, "claude", { workflowsFolder: "commands" });

    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    // documentação de pasta fica só no repositório
    assert.ok(!existsSync(join(target, ".claude/commands/AGENTS.md")));
    assert.ok(!existsSync(join(target, ".claude/commands/README.md")));
    assert.ok(!existsSync(join(target, ".claude/skills/AGENTS.md")));
    assert.ok(!existsSync(join(target, ".claude/skills/SKILLS-ROADMAP.md")));
    assert.ok(!existsSync(join(target, ".claude/skills/test-skill/README.md")));
    assert.ok(!existsSync(join(target, ".claude/agents/AGENTS.md")));
    assert.ok(!existsSync(join(target, ".claude/agents/README.md")));
    // componentes e conteúdo continuam
    assert.ok(existsSync(join(target, ".claude/skills/test-skill/SKILL.md")));
    assert.ok(existsSync(join(target, ".claude/skills/test-skill/references/README.md")));
    assert.ok(existsSync(join(target, ".claude/agents/eng.agent.md")));
    assert.ok(existsSync(join(target, ".claude/commands/eng.start.md")));
    assert.ok(existsSync(join(target, ".claude/commands/warm-up.md")));
    // SYNC_ROOT_FILES continuam, inclusive o AGENTS.md da raiz da IDE
    assert.ok(existsSync(join(target, ".claude/taxonomy.md")));
    assert.ok(existsSync(join(target, ".claude/AGENTS.md")));
  });
});

test("syncAssets: instalação antiga é limpa (claude, windsurf e kiro) pelo OBSOLETE_PATHS", () => {
  const antigos = {
    claude: [
      "commands/AGENTS.md",
      "commands/README.md",
      "commands/all-tools.md",
      "skills/AGENTS.md",
      "skills/SKILLS-ROADMAP.md",
      "skills/jarvis-docs-central/README.md",
      "skills/product-roadmap-report/README.md",
      "agents/AGENTS.md",
      "agents/README.md",
    ],
    windsurf: ["workflows/AGENTS.md", "workflows/README.md", "workflows/all-tools.md"],
    kiro: ["steering/AGENTS.md", "steering/README.md", "steering/all-tools.md"],
  };
  for (const [ide, arquivos] of Object.entries(antigos)) {
    withJarvisRoot((root, target) => {
      buildMinimalFramework(root);
      for (const arquivo of arquivos) write(target, `.${ide}/${arquivo}`, "antigo");

      syncAssets(target, ide, {
        workflowsFolder: ide === "claude" ? "commands" : ide === "kiro" ? "steering" : "workflows",
      });

      for (const arquivo of arquivos) {
        assert.ok(
          !existsSync(join(target, `.${ide}/${arquivo}`)),
          `${ide}: ${arquivo} deveria ter sido removido`
        );
      }
      assert.ok(
        existsSync(join(target, `.${ide}/AGENTS.md`)),
        `${ide}: AGENTS.md da raiz da IDE deve ficar`
      );
    });
  }
});

test("isExcludedFromSync: só documentação de pasta fica de fora; componentes e conteúdo passam", () => {
  const fora = [
    ["workflows", "AGENTS.md"],
    ["workflows", "README.md"],
    ["workflows", "product/README.md"], // aninhado: o flatten faria colidir com o da raiz
    ["skills", "AGENTS.md"],
    ["skills", "SKILLS-ROADMAP.md"],
    ["skills", "jarvis-docs-central/README.md"],
    ["agents", "AGENTS.md"],
    ["agents", "README.md"],
  ];
  const dentro = [
    ["workflows", ""], // a própria pasta
    ["workflows", "warm-up.md"],
    ["workflows", "taxonomy.md"],
    ["workflows", "engineering/eng.start.md"],
    ["skills", ""],
    ["skills", "eng-backend/SKILL.md"],
    ["skills", "eng-backend/references/README.md"], // conteúdo da skill, não documentação de pasta
    ["skills", "eng-backend/assets/template.md"],
    ["agents", "eng.agent.md"], // agent direto na raiz de agents/ é componente
    ["agents", "engineering/eng.agent.md"],
    ["agents", "engineering/README.md"], // só os da raiz de agents/ saem
    ["templates", "AGENTS.md"], // fora do escopo da #89 (follow-up na #83)
    ["rules", "engineering/eng-rules.md"],
  ];
  for (const [dir, rel] of fora) assert.equal(isExcludedFromSync(dir, rel), true, `${dir}/${rel}`);
  for (const [dir, rel] of dentro)
    assert.equal(isExcludedFromSync(dir, rel), false, `${dir}/${rel}`);
});
