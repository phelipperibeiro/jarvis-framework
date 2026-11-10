// Testes de syncAssets (sync-engine.js). Rode com: npm run test:filtro
//
// getFrameworkRoot() (bin/lib/utils/paths.js) tem um escape hatch de propósito
// para isso: process.env.JARVIS_ROOT, se definido e existir, vence sobre o
// framework real. Cada teste monta um "framework root" fixture mínimo e aponta
// JARVIS_ROOT pra ele, em vez de sincronizar o framework inteiro (lento e
// dependente do conteúdo real de agents/skills/workflows).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  syncAssets,
  isExcludedFromSync,
  withOverlayMarker,
  readOverlayMarker,
  syncRulesForProfile,
} from "../bin/lib/core/sync-engine.js";
import { listRules } from "../bin/lib/core/profile-filter.js";
import { OBSOLETE_PATHS } from "../bin/lib/config/constants.js";
import { createHash } from "node:crypto";
import { dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

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

/** Fixture mínimo com 1 arquivo por SYNC_DIRS + os 2 SYNC_ROOT_FILES. */
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
  write(root, "taxonomy.md");
  write(root, "AGENTS.md");
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
    assert.ok(existsSync(join(target, ".claude/taxonomy.md")));
    assert.ok(existsSync(join(target, ".claude/AGENTS.md")));

    // flatten: workflows/sub/eng.start.md -> workflows/eng.start.md (sem subpasta)
    assert.ok(existsSync(join(target, ".claude/workflows/eng.start.md")));
    assert.ok(!existsSync(join(target, ".claude/workflows/sub")));

    // lock file
    assert.ok(existsSync(join(target, ".claude/jarvis-lock.json")));
  });
});

test("syncAssets: scripts/ do framework não é copiado (saiu do SYNC_DIRS, #239)", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(root, "scripts/x.sh");

    const result = syncAssets(target, "claude", {});

    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.ok(!existsSync(join(target, ".claude/scripts")));
    assert.ok(!result.skipped.some((s) => s.includes("scripts/")));
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

test("syncAssets: codex não corta a description na letra Z (bloco > e último campo)", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(
      root,
      "skills/z-skill/SKILL.md",
      [
        "---",
        "name: z-skill",
        "description: >",
        "  Base com QA_SPECIALIZATIONS e Zod.",
        "  Trigger: quando usar.",
        "metadata:",
        "  area: qa",
        "---",
      ].join("\n")
    );
    write(
      root,
      "skills/fim-skill/SKILL.md",
      "---\nname: fim-skill\ndescription: Zoom no fim\n---\n"
    );

    syncAssets(target, "codex", {});

    const yaml = (skill) =>
      readFileSync(join(target, `.codex/skills/${skill}/openai.yaml`), "utf-8");
    assert.match(
      yaml("z-skill"),
      /description: "Base com QA_SPECIALIZATIONS e Zod\. Trigger: quando usar\."/
    );
    assert.match(yaml("fim-skill"), /description: "Zoom no fim"/);
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
      // rules que saíram de rules/ na auditoria de tokens (#84, #86/#133)
      "rules/engineering/eng.bump-rules.md",
      "rules/engineering/eng.docs-scraping-rules.md",
      "rules/engineering/rpa/eng.rpa-rules.md",
      "rules/AGENTS.md",
      "rules/product/README.md",
      // templates e skill duplicado removidos (#91, #92)
      "templates/engineering/swagger-template.md",
      "templates/engineering/CONTACTS-template.md",
      "templates/cdd-aplicado-a-prompts.md",
      "skills/product-roadmap-report/rules/detailed-guide.md",
      // lote A de código morto (#238): template, agente, assets e comandos de skill sem consumidor
      "templates/engineering/work-progress-template.md",
      "agents/engineering/qa/eng.qa.quality-champion-task-agent.md",
      "skills/eng-qa-planner/assets/test-coverage-template.md", // os 2 somem com a entrada de pasta
      "skills/eng-qa-planner/assets/test-patterns.md",
      "skills/product-roadmap-report/commands/status.compiled.single.team.md",
      "skills/product-roadmap-report/commands/status.list.projects.md",
      // eng.review consolidado no eng.pre-pr (#245): o workflow fica achatado na pasta de comandos
      "commands/eng.review.md",
      // eng.docs removido (#246): coberto pela oferta de documentação do eng.work
      "commands/eng.docs.md",
      // eng.create-ard-from-code fundido no eng.create-ard e o C4 global (#247)
      "commands/eng.create-ard-from-code.md",
      "skills/eng-backend-arch-c4/SKILL.md", // some com a entrada de pasta
      // eng.breakdown-subtasks fundido no Delivery Spec (#248): workflow, rule e template
      "commands/eng.breakdown-subtasks.md",
      "rules-on-demand/engineering/eng.breakdown-subtasks-rules.md",
      "templates/engineering/breakdown-subtasks-template.md",
      // cluster DATA removido (#242): os 2 comandos achatados, o agente e os 2 templates
      "commands/data.contract.md",
      "commands/data.new-pipeline.md",
      "agents/engineering/data/eng.data-engineer.agent.md",
      "templates/engineering/data-contract-template.md",
      "templates/engineering/data-pipeline-template.md",
      // prod.roadmap.preview e product-roadmap-report removidos (#243)
      "commands/prod.roadmap.preview.md",
      "skills/product-roadmap-report/SKILL.md", // some com a entrada de pasta
      // product-specs e product-specs-update, skills sem chamador (#244): somem com a entrada de pasta
      "skills/product-specs/SKILL.md",
      "skills/product-specs-update/SKILL.md",
      // cluster QA fora do ciclo removido (#241): os 3 comandos achatados, o agente e os 2 templates
      "commands/eng.qa-refinement-entry.md",
      "commands/eng.qa-release-signoff.md",
      "commands/eng.qa-sprint-planning.md",
      "agents/engineering/qa/eng.qa.quality-strategist.md",
      "templates/engineering/qa/qa.release-signoff-template.md",
      "templates/engineering/qa/qa.sprint-plan-template.md",
      // rules de uma área só e o ponteiro de Cypress saíram de rules/ (#263)
      "rules/engineering/frontend/eng.frontend-rules.md",
      "rules/engineering/qa/eng.qa.cypress-standards-rules.md",
      "rules/product/prod.spec-rules.md",
    ],
    windsurf: [
      "workflows/AGENTS.md",
      "workflows/README.md",
      "workflows/all-tools.md",
      "workflows/eng.review.md",
      "workflows/eng.docs.md",
      "workflows/eng.create-ard-from-code.md",
      "workflows/eng.breakdown-subtasks.md",
      "workflows/data.contract.md", // cluster DATA removido (#242)
      "workflows/data.new-pipeline.md",
      "workflows/prod.roadmap.preview.md", // prod.roadmap.preview removido (#243)
      // cluster QA fora do ciclo removido (#241)
      "workflows/eng.qa-refinement-entry.md",
      "workflows/eng.qa-release-signoff.md",
      "workflows/eng.qa-sprint-planning.md",
      "agents/engineering/qa/eng.qa.quality-strategist.md",
      "templates/engineering/qa/qa.release-signoff-template.md",
      "templates/engineering/qa/qa.sprint-plan-template.md",
      "rules/engineering/frontend/eng.frontend-rules.md", // saíram de rules/ (#263)
      "rules/engineering/qa/eng.qa.cypress-standards-rules.md",
      "rules/product/prod.spec-rules.md",
    ],
    kiro: [
      "steering/AGENTS.md",
      "steering/README.md",
      "steering/all-tools.md",
      // cópias do Kiro das rules que saíram de rules/ (#83)
      "steering/eng.bump-rules.md",
      "steering/eng.docs-scraping-rules.md",
      "steering/eng.rpa-rules.md",
      "steering/eng.review.md", // eng.review consolidado no eng.pre-pr (#245)
      "steering/eng.docs.md", // eng.docs removido (#246)
      "steering/eng.create-ard-from-code.md", // fundido no eng.create-ard (#247)
      "steering/skills/skill-eng-backend-arch-c4.md", // C4 virou global (#247)
      "steering/eng.breakdown-subtasks.md", // fundido no Delivery Spec (#248)
      "rules-on-demand/engineering/eng.breakdown-subtasks-rules.md",
      "templates/engineering/breakdown-subtasks-template.md",
      "steering/data.contract.md", // cluster DATA removido (#242)
      "steering/data.new-pipeline.md",
      "templates/engineering/data-contract-template.md",
      "templates/engineering/data-pipeline-template.md",
      "steering/prod.roadmap.preview.md", // prod.roadmap.preview removido (#243)
      "steering/skills/skill-product-roadmap-report.md",
      "steering/skills/skill-product-specs.md", // skills sem chamador (#244)
      "steering/skills/skill-product-specs-update.md",
      // cluster QA fora do ciclo removido (#241)
      "steering/eng.qa-refinement-entry.md",
      "steering/eng.qa-release-signoff.md",
      "steering/eng.qa-sprint-planning.md",
      "agents/engineering/qa/eng.qa.quality-strategist.md",
      "templates/engineering/qa/qa.release-signoff-template.md",
      "templates/engineering/qa/qa.sprint-plan-template.md",
      // rules que saíram de rules/ (#263) e as cópias delas no steering
      "rules/engineering/frontend/eng.frontend-rules.md",
      "rules/engineering/qa/eng.qa.cypress-standards-rules.md",
      "rules/product/prod.spec-rules.md",
      "steering/eng.frontend-rules.md",
      "steering/eng.qa.cypress-standards-rules.md",
      "steering/prod.spec-rules.md",
    ],
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
      if (ide === "claude") {
        assert.ok(
          !existsSync(join(target, ".claude/skills/eng-backend-arch-c4")),
          "claude: a pasta skills/eng-backend-arch-c4 deveria ter sido removida inteira"
        );
        assert.ok(
          !existsSync(join(target, ".claude/skills/product-roadmap-report")),
          "claude: a pasta skills/product-roadmap-report deveria ter sido removida inteira"
        );
        for (const pasta of ["skills/product-specs", "skills/product-specs-update"]) {
          assert.ok(
            !existsSync(join(target, `.claude/${pasta}`)),
            `claude: a pasta ${pasta} deveria ter sido removida inteira`
          );
        }
      }
      assert.ok(
        existsSync(join(target, `.${ide}/AGENTS.md`)),
        `${ide}: AGENTS.md da raiz da IDE deve ficar`
      );
      // A limpeza não leva junto a rule que continua no framework (nem a cópia dela no Kiro).
      assert.ok(existsSync(join(target, `.${ide}/rules/engineering/eng-rules.md`)));
      if (ide === "kiro") assert.ok(existsSync(join(target, ".kiro/steering/eng-rules.md")));
      // Entrada de pasta (#238): a pasta some inteira, não só os arquivos de dentro
      if (ide === "claude")
        assert.ok(!existsSync(join(target, ".claude/skills/eng-qa-planner/assets")));
    });
  }
});

// O members.md saiu do framework (#241) sem entrar no OBSOLETE_PATHS: a cópia instalada pode ter
// dados do time. O upgrade roda com force, que sobrescreveria um arquivo de raiz do SYNC_ROOT_FILES;
// o members.md na raiz do framework falso simula a volta dele ao sync.
test("syncAssets: o members.md instalado sobrevive ao upgrade e não é mais copiado (#241)", () => {
  const pastas = { claude: "commands", windsurf: "workflows", kiro: "steering" };
  for (const [ide, workflowsFolder] of Object.entries(pastas)) {
    withJarvisRoot((root, target) => {
      buildMinimalFramework(root);
      write(root, "members.md", "# Members\n(modelo vazio do framework)\n");
      const doTime = "# Members\n| Fulana | fulana@exemplo.com | SENIOR | U123 |\n";
      write(target, `.${ide}/members.md`, doTime);

      syncAssets(target, ide, { force: true, workflowsFolder });

      const instalado = join(target, `.${ide}/members.md`);
      assert.ok(existsSync(instalado), `${ide}: o members.md instalado não pode ser apagado`);
      assert.equal(
        readFileSync(instalado, "utf-8"),
        doTime,
        `${ide}: o members.md instalado não pode ser sobrescrito`
      );
    });
  }

  // Instalação nova: o arquivo não é copiado, mesmo que ainda exista na raiz do framework
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(root, "members.md");
    syncAssets(target, "claude", { workflowsFolder: "commands" });
    assert.ok(!existsSync(join(target, ".claude/members.md")));
  });
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

// Uma entrada de OBSOLETE_PATHS que ainda é copiada do framework seria instalada e apagada
// na mesma passada, sem aviso (#238). Cada entrada tem que ter saído do repositório ou ser
// documentação de pasta que o SYNC_EXCLUDE tira da cópia.
test("OBSOLETE_PATHS: nenhuma entrada ainda é copiada do repositório do framework", () => {
  const raiz = fileURLToPath(new URL("..", import.meta.url));
  const PASTAS_ACHATADAS = ["workflows", "commands", "steering"];

  // Arquivos de workflows/** (relativos a workflows/), para conferir os nomes achatados
  const arquivosDeWorkflows = [];
  const varrer = (dir) => {
    for (const entrada of readdirSync(join(raiz, "workflows", dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) varrer(rel);
      else arquivosDeWorkflows.push(rel);
    }
  };
  varrer("");

  const problemas = [];
  for (const entrada of OBSOLETE_PATHS) {
    const [pasta, ...resto] = entrada.split("/");
    const rel = resto.join("/");
    // steering/skills/skill-{nome}.md é gerado na instalação do Kiro; nunca existe no repositório
    if (entrada.startsWith("steering/skills/")) continue;
    const achatado = PASTAS_ACHATADAS.includes(pasta) && resto.length === 1;
    // A limpeza apaga todo workflow pelo nome achatado (sync-engine.js), inclusive o que tem
    // subpasta no caminho: um nome ainda usado em outra subpasta de workflows/ sumiria da IDE.
    if (achatado || pasta === "workflows") {
      const nome = resto[resto.length - 1];
      const copiados = arquivosDeWorkflows.filter(
        (arquivo) => arquivo.split("/").pop() === nome && !isExcludedFromSync("workflows", arquivo)
      );
      if (copiados.length) problemas.push(`${entrada} (ainda copiado de workflows/${copiados[0]})`);
      if (achatado) continue;
    }
    if (existsSync(join(raiz, entrada)) && !isExcludedFromSync(pasta, rel)) {
      problemas.push(`${entrada} (ainda existe no repositório e é copiado)`);
    }
  }
  assert.deepEqual(
    problemas,
    [],
    `Entradas de OBSOLETE_PATHS ainda copiadas:\n${problemas.join("\n")}`
  );
});

// OBSOLETE_PATHS guarda os workflows pelo caminho do framework (workflows/engineering/...),
// mas na instalação eles ficam achatados na pasta de workflows da IDE.
test("syncAssets: remove workflow obsoleto achatado na pasta de comandos do Claude Code", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/commands/eng.qa-exploratory-session.md");

    const result = syncAssets(target, "claude", { workflowsFolder: "commands" });

    assert.ok(!existsSync(join(target, ".claude/commands/eng.qa-exploratory-session.md")));
    assert.ok(
      result.copied.includes("(cleanup) .claude/commands/eng.qa-exploratory-session.md removed")
    );
    assert.ok(existsSync(join(target, ".claude/commands/eng.start.md")));
  });
});

test("syncAssets: remove workflow obsoleto achatado numa IDE que usa workflows/", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".windsurf/workflows/eng.security-incident.md");

    syncAssets(target, "windsurf", {});

    assert.ok(!existsSync(join(target, ".windsurf/workflows/eng.security-incident.md")));
  });
});

test("syncAssets: não remove comando do usuário com nome parecido ao de um workflow obsoleto", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/commands/eng.qa-exploratory-session-meu.md");

    syncAssets(target, "claude", { workflowsFolder: "commands" });

    assert.ok(existsSync(join(target, ".claude/commands/eng.qa-exploratory-session-meu.md")));
  });
});

test("syncAssets: dryRun não remove workflow obsoleto achatado", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/commands/eng.qa-exploratory-session.md");

    syncAssets(target, "claude", { workflowsFolder: "commands", dryRun: true });

    assert.ok(existsSync(join(target, ".claude/commands/eng.qa-exploratory-session.md")));
  });
});

// --- RuleResolver do overlay de empresa (#199) ---------------------------------------------
// O overlay fica em {target}/.claude/overlays/{perfil}/ e espelha o core. O sync copia por cima
// só rules/ e rules-on-demand/; nunca grava arquivo no overlay (só cria a pasta do perfil).

import { symlinkSync, statSync } from "node:fs";

function snapshotDir(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out[full.slice(dir.length + 1)] = readFileSync(full, "utf-8");
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

function withOverlay(target, profile, files) {
  write(target, ".claude/ENV.md", `WORKSPACE=ws\nCOMPANY_PROFILE=${profile}\n`);
  for (const [rel, content] of Object.entries(files)) {
    write(target, `.claude/overlays/${profile}/${rel}`, content);
  }
}

test("overlay: rule e rule-on-demand do overlay vencem as do core e recebem a marcação; o overlay fica intacto", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(root, "rules/engineering/eng-rules.md", "# core");
    withOverlay(target, "acme", {
      "rules/engineering/eng-rules.md":
        "---\nforked_from: eng-rules@8.2.0\nforked_at: 2026-10-30\n---\n\n# empresa\n",
      "rules-on-demand/engineering/eng.plan-rules.md": "# plano da empresa, sem frontmatter\n",
      "workflows/engineering/eng.start.md": "# não é copiado pelo sync\n",
    });
    const before = snapshotDir(join(target, ".claude/overlays/acme"));

    const result = syncAssets(target, "claude", {});

    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    const rule = readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8");
    assert.match(
      rule,
      /^---\nforked_from: eng-rules@8\.2\.0\nforked_at: 2026-10-30\n---\n\n> Overlay: acme \(forked_from eng-rules@8\.2\.0\)\n\n# empresa\n$/
    );
    const onDemand = readFileSync(
      join(target, ".claude/rules-on-demand/engineering/eng.plan-rules.md"),
      "utf-8"
    );
    assert.equal(
      onDemand,
      "> Overlay: acme (forked_from sem carimbo)\n\n# plano da empresa, sem frontmatter\n"
    );
    assert.ok(!existsSync(join(target, ".claude/workflows/engineering/eng.start.md")));
    assert.ok(result.copied.includes("(overlay) rules/engineering/eng-rules.md"));
    assert.ok(result.copied.includes("(overlay) rules-on-demand/engineering/eng.plan-rules.md"));
    assert.deepEqual(snapshotDir(join(target, ".claude/overlays/acme")), before);
  });
});

test("overlay: sem a pasta do perfil, o sync cria só a pasta vazia; sem ENV.md vale o default stark-industries", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=acme\n");
    const result = syncAssets(target, "claude", {});
    const dir = join(target, ".claude/overlays/acme");
    assert.ok(statSync(dir).isDirectory());
    assert.deepEqual(readdirSync(dir), []);
    assert.ok(result.copied.includes("Overlay acme: pasta criada"));
    // core intacto na IDE
    assert.ok(existsSync(join(target, ".claude/rules/engineering/eng-rules.md")));
  });
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    const result = syncAssets(target, "claude", {});
    assert.ok(statSync(join(target, ".claude/overlays/stark-industries")).isDirectory());
    assert.ok(result.copied.includes("Overlay stark-industries: pasta criada"));
    assert.ok(
      !result.skipped.some((m) => m.includes("COMPANY_PROFILE vazio")),
      "sem ENV.md não há aviso"
    );
  });
});

test("overlay: COMPANY_PROFILE vazio ou inválido cai no default com aviso", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=\n");
    const result = syncAssets(target, "claude", {});
    assert.ok(existsSync(join(target, ".claude/overlays/stark-industries")));
    assert.ok(result.skipped.some((m) => /ℹ️ COMPANY_PROFILE vazio/.test(m)));
  });
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=rules\n");
    const result = syncAssets(target, "claude", {});
    assert.ok(existsSync(join(target, ".claude/overlays/stark-industries")));
    assert.ok(!existsSync(join(target, ".claude/overlays/rules")));
    assert.ok(
      result.skipped.some((m) =>
        /⚠️ COMPANY_PROFILE não pode ser o nome de uma pasta do core/.test(m)
      )
    );
  });
});

test("overlay: link para fora do overlay é ignorado com aviso; dryRun não cria nada", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    withOverlay(target, "acme", {});
    const outside = join(target, "fora.md");
    writeFileSync(outside, "# fora do overlay");
    mkdirSync(join(target, ".claude/overlays/acme/rules"), { recursive: true });
    symlinkSync(outside, join(target, ".claude/overlays/acme/rules/evil.md"));
    const result = syncAssets(target, "claude", {});
    assert.ok(!existsSync(join(target, ".claude/rules/evil.md")));
    assert.ok(result.skipped.some((m) => /evil\.md: aponta para fora do overlay/.test(m)));
  });
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=acme\n");
    syncAssets(target, "claude", { dryRun: true });
    assert.ok(!existsSync(join(target, ".claude/overlays")));
  });
});

test("overlay: rule só do overlay vira órfã na troca de perfil e sai da IDE; marcada com origem no core ou no overlay ativo fica", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    withOverlay(target, "acme", {
      "rules/so-da-acme.md": "# só no overlay acme\n",
      "rules/engineering/eng-rules.md": "# eng-rules da acme\n",
    });
    syncAssets(target, "claude", {});
    assert.ok(existsSync(join(target, ".claude/rules/so-da-acme.md")));
    assert.match(
      readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      /> Overlay: acme/
    );

    // troca de perfil: o overlay acme fica no disco, mas não está mais ativo
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=beta\n");
    const result = syncAssets(target, "claude", {});
    assert.ok(!existsSync(join(target, ".claude/rules/so-da-acme.md")), "órfã continuou na IDE");
    assert.ok(
      result.copied.some((m) =>
        /^\(overlay\) rules\/so-da-acme\.md: órfã removida da IDE \(era do perfil acme\)$/.test(m)
      ),
      JSON.stringify(result.copied)
    );
    // a do core volta à versão do core (o cpSync a sobrescreveu); o overlay acme segue intacto
    assert.equal(
      readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      "x"
    );
    assert.ok(existsSync(join(target, ".claude/overlays/acme/rules/so-da-acme.md")));
    assert.ok(statSync(join(target, ".claude/overlays/beta")).isDirectory());
  });
});

test("overlay: dryRun diz que a pasta seria criada e não cria", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=acme\n");
    const result = syncAssets(target, "claude", { dryRun: true });
    assert.ok(result.copied.includes("Overlay acme: pasta seria criada"));
    assert.ok(!existsSync(join(target, ".claude/overlays")));
  });
});

test("overlay: link quebrado e link para pasta são ignorados sem erro; erro de escrita vai para errors", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    withOverlay(target, "acme", {});
    const rulesDir = join(target, ".claude/overlays/acme/rules");
    mkdirSync(rulesDir, { recursive: true });
    symlinkSync(join(target, "nao-existe.md"), join(rulesDir, "quebrado.md"));
    mkdirSync(join(target, "pasta-fora"), { recursive: true });
    writeFileSync(join(target, "pasta-fora/dentro.md"), "# fora");
    symlinkSync(join(target, "pasta-fora"), join(rulesDir, "link-pasta"));

    const result = syncAssets(target, "claude", {});
    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    assert.ok(result.skipped.some((m) => /quebrado\.md: link quebrado/.test(m)));
    assert.ok(!existsSync(join(target, ".claude/rules/quebrado.md")));
    assert.ok(!existsSync(join(target, ".claude/rules/link-pasta")));
  });
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    withOverlay(target, "acme", { "rules-on-demand/sub/x.md": "# x" });
    // o destino `.claude/rules-on-demand/sub` é um arquivo: o mkdir falha e vira errors
    syncAssets(target, "claude", {});
    rmSync(join(target, ".claude/rules-on-demand/sub"), { recursive: true, force: true });
    writeFileSync(join(target, ".claude/rules-on-demand/sub"), "não sou pasta");
    const result = syncAssets(target, "claude", {});
    assert.ok(
      result.errors.some((m) => /\(overlay\) rules-on-demand\/sub\/x\.md/.test(m)),
      JSON.stringify(result.errors)
    );
  });
});

// --- Fase 11 (#199): órfãs completas, marcação exata, CRLF no marker -----------------------------

test("readOverlayMarker: só na primeira linha útil depois do frontmatter e no formato exato; CRLF aceito", () => {
  assert.equal(
    readOverlayMarker("---\nforked_from: a@1\n---\n\n> Overlay: acme (forked_from a@1)\n\n# x\n"),
    "acme"
  );
  assert.equal(readOverlayMarker("> Overlay: acme (forked_from sem carimbo)\n\n# x\n"), "acme");
  assert.equal(
    readOverlayMarker(
      "---\r\nforked_from: a@1\r\n---\r\n\r\n> Overlay: acme (forked_from a@1)\r\n# x\r\n"
    ),
    "acme"
  );
  // marcação citada no corpo, ou fora do formato: não é cópia do overlay
  assert.equal(
    readOverlayMarker("# minha rule\n\nA marcação é > Overlay: acme (forked_from x)\n"),
    null
  );
  assert.equal(readOverlayMarker("# minha rule\n> Overlay: acme (forked_from x)\n"), null);
  assert.equal(readOverlayMarker("> Overlay: Acme Corp (forked_from x)\n"), null);
  assert.equal(readOverlayMarker("# só core\n"), null);
});

test("withOverlayMarker: CRLF vira LF e o forked_from do frontmatter entra na marcação", () => {
  const out = withOverlayMarker("---\r\nforked_from: a@1\r\n---\r\n# x\r\n", "acme");
  assert.equal(out, "---\nforked_from: a@1\n---\n\n> Overlay: acme (forked_from a@1)\n\n# x\n");
  assert.ok(!out.includes("\r"));
});

test("overlay: cópia marcada com outro perfil volta ao core quando o core a tem; rule própria que cita a marcação no corpo fica; dryRun só registra", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(root, "rules/engineering/eng-rules.md", "# core");
    // estado deixado por um fork feito no perfil acme, agora com o perfil beta ativo e sem o cpSync do core
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=beta\n");
    write(
      target,
      ".claude/rules/engineering/eng-rules.md",
      "---\nforked_from: rules/engineering/eng-rules.md@9.9.9\n---\n\n> Overlay: acme (forked_from rules/engineering/eng-rules.md@9.9.9)\n\n# eng-rules da acme\n"
    );
    write(
      target,
      ".claude/rules/minha.md",
      "# minha rule\n\nEla explica a marcação > Overlay: acme (forked_from x) no corpo.\n"
    );
    write(
      target,
      ".claude/rules/so-acme.md",
      "> Overlay: acme (forked_from rules/so-acme.md@9.9.9)\n\n# só da acme\n"
    );
    write(target, ".claude/overlays/acme/rules/so-acme.md", "# só da acme\n");

    const dry = syncAssets(target, "claude", { dryRun: true });
    assert.ok(
      dry.copied.some((m) => /eng-rules\.md: voltou ao core \(era do perfil acme\)/.test(m))
    );
    assert.ok(
      dry.copied.some((m) => /so-acme\.md: órfã removida da IDE \(era do perfil acme\)/.test(m))
    );
    assert.match(
      readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      /> Overlay: acme/,
      "dryRun gravou"
    );
    assert.ok(existsSync(join(target, ".claude/rules/so-acme.md")), "dryRun apagou");

    const result = syncAssets(target, "claude", {});
    assert.equal(
      readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"),
      "# core"
    );
    assert.ok(!existsSync(join(target, ".claude/rules/so-acme.md")));
    assert.ok(existsSync(join(target, ".claude/rules/minha.md")), "apagou a rule própria");
    assert.ok(!result.copied.some((m) => /minha\.md/.test(m)));
    assert.ok(
      existsSync(join(target, ".claude/overlays/acme/rules/so-acme.md")),
      "tocou no overlay inativo"
    );
  });
});

test("overlay: segundo sync com o mesmo perfil mantém a rule só do overlay sem avisar órfã", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    withOverlay(target, "acme", { "rules/so-da-acme.md": "# só no overlay acme\n" });
    syncAssets(target, "claude", {});
    const again = syncAssets(target, "claude", {});
    assert.ok(existsSync(join(target, ".claude/rules/so-da-acme.md")));
    assert.ok(
      !again.copied.some((m) => /órfã|voltou ao core/.test(m)),
      JSON.stringify(again.copied)
    );
    assert.ok(again.copied.includes("(overlay) rules/so-da-acme.md"));
  });
});

// ---------------------------------------------------------------------------
// syncRulesForProfile: Passo 8 do /jarvis-init pelo CLI (#102)
// ---------------------------------------------------------------------------

/** Core com rules em subpastas, as duas exceções e rules-on-demand/; o ENV.md da IDE ativa o overlay acme. */
function buildRulesFixture(root, target, envExtra = "") {
  write(root, "rules/engineering/eng-rules.md", "# eng\n");
  write(root, "rules/engineering/frontend/x.md", "# x\n");
  write(root, "rules/product/y.md", "# y\n");
  write(root, "rules/universal.md", "# universal\n");
  write(root, "rules/rtk-rules.md", "# rtk\n");
  write(root, "rules/artifact-style-rules.md", "# estilo\n");
  write(root, "rules-on-demand/engineering/eng.plan-rules.md", "# plano\n");
  write(root, "rules-on-demand/product/prod.guided-rules.md", "# guiado\n");
  write(target, ".claude/ENV.md", `COMPANY_PROFILE=acme\n${envExtra}`);
  return join(target, ".claude");
}

const ideFiles = (ideDir, dir) => {
  const base = join(ideDir, dir);
  if (!existsSync(base)) return [];
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith(".md")) out.push(relative(base, f).split(sep).join("/"));
    }
  };
  walk(base);
  return out.sort();
};

test("syncRulesForProfile: toda rule do core entra, menos as duas exceções desligadas (a)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.deepEqual(ideFiles(ideDir, "rules"), [
      "engineering/eng-rules.md",
      "engineering/frontend/x.md",
      "product/y.md",
      "universal.md",
    ]);
    assert.equal(r.copied.rules, 4);
    assert.equal(r.removed, 0);
    assert.equal("universal" in r, false);
  });
});

test("syncRulesForProfile: rtk-rules.md só com rtkEnabled (b)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    syncRulesForProfile(ideDir, {}, { frameworkRoot: root, rtkEnabled: true });
    assert.ok(ideFiles(ideDir, "rules").includes("rtk-rules.md"));
    syncRulesForProfile(ideDir, {}, { frameworkRoot: root, rtkEnabled: false });
    assert.ok(!ideFiles(ideDir, "rules").includes("rtk-rules.md"));
  });
});

test("syncRulesForProfile: artifact-style só para ARTIFACT_STYLE=human-generated (c)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    syncRulesForProfile(ideDir, { ARTIFACT_STYLE: "human-generated" }, { frameworkRoot: root });
    assert.ok(ideFiles(ideDir, "rules").includes("artifact-style-rules.md"));
    syncRulesForProfile(ideDir, { ARTIFACT_STYLE: "ai-generated" }, { frameworkRoot: root });
    assert.ok(!ideFiles(ideDir, "rules").includes("artifact-style-rules.md"));
  });
});

test("syncRulesForProfile: a cópia de uma exceção desligada sai da IDE e volta quando ela liga (d)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/rtk-rules.md", "cópia antiga");
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.ok(!existsSync(join(ideDir, "rules/rtk-rules.md")));
    assert.equal(r.removed, 1);
    syncRulesForProfile(ideDir, {}, { frameworkRoot: root, rtkEnabled: true });
    assert.match(readFileSync(join(ideDir, "rules/rtk-rules.md"), "utf-8"), /# rtk/);
  });
});

test("syncRulesForProfile: a rule do overlay no mesmo caminho entra sempre, marcada, até com o cabeçalho de um fork antigo; o fork de uma exceção segue a variável (e)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(
      ideDir,
      "overlays/acme/rules/engineering/eng-rules.md",
      "> **Applies to:** linha de um fork antigo\n\n# acme\n"
    );
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    const copia = readFileSync(join(ideDir, "rules/engineering/eng-rules.md"), "utf-8");
    assert.equal(readOverlayMarker(copia), "acme");
    assert.match(copia, /# acme/);
    assert.equal(r.fromOverlay, 1);

    // Fork de uma exceção: sai da IDE com ai-generated e volta, marcado, com human-generated.
    write(ideDir, "overlays/acme/rules/artifact-style-rules.md", "# estilo da acme\n");
    const sem = syncRulesForProfile(
      ideDir,
      { ARTIFACT_STYLE: "ai-generated" },
      { frameworkRoot: root }
    );
    assert.ok(!existsSync(join(ideDir, "rules/artifact-style-rules.md")));
    assert.equal(sem.fromOverlay, 1);
    const com = syncRulesForProfile(
      ideDir,
      { ARTIFACT_STYLE: "human-generated" },
      { frameworkRoot: root }
    );
    const estilo = readFileSync(join(ideDir, "rules/artifact-style-rules.md"), "utf-8");
    assert.equal(readOverlayMarker(estilo), "acme");
    assert.match(estilo, /# estilo da acme/);
    assert.equal(com.fromOverlay, 2);
  });
});

test("syncRulesForProfile: rule própria da pessoa (fora do core e do overlay) fica intacta (f)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/minha-rule.md", "# minha rule\n");
    syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.equal(readFileSync(join(ideDir, "rules/minha-rule.md"), "utf-8"), "# minha rule\n");
  });
});

test("syncRulesForProfile: rules-on-demand/ segue a mesma regra (g)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules-on-demand/product/prod.guided-rules.md", "antiga");
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.deepEqual(ideFiles(ideDir, "rules-on-demand"), [
      "engineering/eng.plan-rules.md",
      "product/prod.guided-rules.md",
    ]);
    assert.equal(r.copied["rules-on-demand"], 2);
    assert.notEqual(
      readFileSync(join(ideDir, "rules-on-demand/product/prod.guided-rules.md"), "utf-8"),
      "antiga"
    );
  });
});

test("syncRulesForProfile: overlays/ fica intacto, conferido por hash; a pasta do perfil é criada se faltar (h)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const semPasta = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.equal(semPasta.folderCreated, true);
    write(ideDir, "overlays/acme/rules/engineering/eng-rules.md", "# acme\n");
    const hash = () => {
      const h = createHash("sha256");
      for (const f of ideFiles(ideDir, "overlays"))
        h.update(f + readFileSync(join(ideDir, "overlays", f)));
      return h.digest("hex");
    };
    const antes = hash();
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.equal(hash(), antes);
    assert.equal(r.folderCreated, false);
  });
});

test("syncRulesForProfile: com o rules/ real e sem overlay, o resultado é o de listRules", () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
  const target = mkdtempSync(join(tmpdir(), "jarvis-rules-equiv-"));
  try {
    const ideDir = join(target, ".claude");
    mkdirSync(join(ideDir, "overlays", "stark-industries"), { recursive: true });
    writeFileSync(join(ideDir, "ENV.md"), "SQUAD=CORE\n");
    syncRulesForProfile(ideDir, {}, { frameworkRoot: repo });
    for (const dir of ["rules", "rules-on-demand"]) {
      const esperado = listRules(join(repo, dir))
        .map((r) => r.path)
        .sort();
      assert.deepEqual(ideFiles(ideDir, dir), esperado, `${dir}/`);
    }
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("syncRulesForProfile: com dryRun não grava nem apaga, e conta o que faria", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/rtk-rules.md", "cópia antiga");
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root, dryRun: true });
    assert.deepEqual(ideFiles(ideDir, "rules"), ["rtk-rules.md"]);
    assert.ok(!existsSync(join(ideDir, "overlays", "acme")));
    assert.equal(r.removed, 1);
    assert.equal(r.copied.rules, 4);
  });
});

test("syncRulesForProfile: envText vale no lugar do ENV.md do disco; COMPANY_PROFILE inválido vira aviso e o default", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const globex = syncRulesForProfile(
      ideDir,
      {},
      {
        frameworkRoot: root,
        envText: "COMPANY_PROFILE=globex\n",
      }
    );
    assert.equal(globex.companyProfile, "globex");
    assert.ok(existsSync(join(ideDir, "overlays", "globex")));
    const invalido = syncRulesForProfile(
      ideDir,
      {},
      {
        frameworkRoot: root,
        envText: "COMPANY_PROFILE=../x\n",
      }
    );
    assert.equal(invalido.companyProfile, "stark-industries");
    assert.ok(invalido.warnings.length > 0);
  });
});

test("syncRulesForProfile: falha ao gravar uma rule vai para errors e as outras seguem", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    // Uma pasta no lugar do arquivo de destino faz a cópia falhar.
    mkdirSync(join(ideDir, "rules", "engineering", "eng-rules.md"), { recursive: true });
    const r = syncRulesForProfile(ideDir, {}, { frameworkRoot: root });
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0], /^rules\/engineering\/eng-rules\.md: /);
    assert.ok(existsSync(join(ideDir, "rules", "universal.md")));
  });
});

test("syncAssets (kiro): upgrade sobre instalação existente não solta skill-*.md em steering/ (#83)", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(
      root,
      "skills/bloco-skill/SKILL.md",
      [
        "---",
        "name: bloco-skill",
        "description: >",
        "  Atende a Zona Norte",
        "  e a Sul.",
        "---",
        "# corpo",
      ].join("\n")
    );
    const opts = { workflowsFolder: "steering" };
    syncAssets(target, "kiro", opts);
    // Instalação afetada por upgrades antigos: um solto com par e um arquivo da pessoa sem par.
    write(target, ".kiro/steering/skill-test-skill.md", "solto antigo");
    write(target, ".kiro/steering/skill-meu.md", "da pessoa");
    syncAssets(target, "kiro", opts);

    const steering = join(target, ".kiro/steering");
    const soltos = readdirSync(steering).filter((n) => n.startsWith("skill-"));
    assert.deepEqual(soltos, ["skill-meu.md"], "só fica o arquivo sem par em steering/skills/");
    assert.ok(existsSync(join(steering, "skills/skill-test-skill.md")));
    assert.ok(existsSync(join(steering, "skills/skill-bloco-skill.md")));
    // A description em bloco passa inteira, sem cortar na letra "Z".
    assert.match(
      readFileSync(join(steering, "skills/skill-bloco-skill.md"), "utf-8"),
      /^description: "Atende a Zona Norte e a Sul\."$/m
    );
  });
});

test("syncRulesForProfile (kiro): o steering acompanha as rules copiadas (#83, #263)", () => {
  withJarvisRoot((root, target) => {
    buildRulesFixture(root, target);
    const kiroDir = join(target, ".kiro");
    write(target, ".kiro/ENV.md", "SQUAD=CORE\n");
    // Instalação com o steering de todas as rules (o que o transformKiroAssets gera) e um workflow.
    for (const n of ["eng-rules.md", "x.md", "y.md", "universal.md", "rtk-rules.md"])
      write(target, `.kiro/steering/${n}`, "antigo");
    write(target, ".kiro/steering/eng.start.md", "workflow");

    syncRulesForProfile(kiroDir, {}, { frameworkRoot: root });

    // Só o steering da exceção desligada (rtk-rules.md) sai.
    const steering = readdirSync(join(kiroDir, "steering")).filter((n) => n.endsWith(".md"));
    assert.deepEqual(steering.sort(), [
      "eng-rules.md",
      "eng.start.md",
      "universal.md",
      "x.md",
      "y.md",
    ]);
    // A rule que fica tem o steering regravado a partir da rule (não o arquivo antigo).
    assert.match(
      readFileSync(join(kiroDir, "steering/eng-rules.md"), "utf-8"),
      /^inclusion: auto$/m
    );
    assert.equal(readFileSync(join(kiroDir, "steering/eng.start.md"), "utf-8"), "workflow");
  });
});

test("syncAssets (claude): workflows/skills/ é achatada como as outras subpastas (#83)", () => {
  withJarvisRoot((root, target) => {
    buildMinimalFramework(root);
    write(root, "workflows/skills/x.md", "# x");
    syncAssets(target, "claude", { workflowsFolder: "commands" });
    assert.ok(existsSync(join(target, ".claude/commands/x.md")));
    assert.ok(!existsSync(join(target, ".claude/commands/skills")));
  });
});

test("syncRulesForProfile (kiro): toda rule vira steering com inclusion auto e o README do steering fica (#83, #263)", () => {
  withJarvisRoot((root, target) => {
    buildRulesFixture(root, target);
    const kiroDir = join(target, ".kiro");
    write(target, ".kiro/ENV.md", "SQUAD=CORE\n");
    write(target, ".kiro/steering/README.md", "índice");

    syncRulesForProfile(kiroDir, {}, { frameworkRoot: root });

    // Sem fileMatch: a rule de uma subpasta de área vira steering auto, como as outras.
    for (const n of ["x.md", "y.md", "eng-rules.md"]) {
      const steering = readFileSync(join(kiroDir, "steering", n), "utf-8");
      assert.match(steering, /^inclusion: auto$/m, n);
      assert.doesNotMatch(steering, /fileMatch/, n);
    }
    // README/AGENTS do steering não são tocados.
    assert.equal(readFileSync(join(kiroDir, "steering/README.md"), "utf-8"), "índice");
  });
});
