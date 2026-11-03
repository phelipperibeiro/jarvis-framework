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
import { listRulesForProfile } from "../bin/lib/core/profile-filter.js";
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
    ],
    windsurf: ["workflows/AGENTS.md", "workflows/README.md", "workflows/all-tools.md"],
    kiro: [
      "steering/AGENTS.md",
      "steering/README.md",
      "steering/all-tools.md",
      // cópias do Kiro das rules que saíram de rules/ (#83)
      "steering/eng.bump-rules.md",
      "steering/eng.docs-scraping-rules.md",
      "steering/eng.rpa-rules.md",
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
      assert.ok(
        existsSync(join(target, `.${ide}/AGENTS.md`)),
        `${ide}: AGENTS.md da raiz da IDE deve ficar`
      );
      // A limpeza não leva junto a rule que continua no framework (nem a cópia dela no Kiro).
      assert.ok(existsSync(join(target, `.${ide}/rules/engineering/eng-rules.md`)));
      if (ide === "kiro") assert.ok(existsSync(join(target, ".kiro/steering/eng-rules.md")));
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

const AT = (hub, pos, area, squad, style) =>
  `> **Applies to:** HUB: ${hub} | POSITION: ${pos} | AREA: ${area} | SQUAD: ${squad}` +
  (style ? ` | ARTIFACT_STYLE: ${style}` : "");
const BACKEND = { HUB: "BACKEND", POSITION: "SENIOR", AREA: "ENGINEERING", SQUAD: "CORE" };

/** Core com uma rule de cada caso e a pasta da IDE com o ENV.md (sem COMPANY_PROFILE → default). */
function buildRulesFixture(root, target, envExtra = "") {
  write(root, "rules/engineering/eng-rules.md", `${AT("all", "all", "all", "all")}\n# eng\n`);
  write(
    root,
    "rules/engineering/frontend/x.md",
    `${AT("FRONTEND", "all", "ENGINEERING", "all")}\n`
  );
  write(root, "rules/product/y.md", `${AT("all", "all", "PRODUCT", "all")}\n`);
  write(root, "rules/universal.md", "# sem bloco\n");
  write(root, "rules/rtk-rules.md", `${AT("all", "all", "all", "all")}\n# rtk\n`);
  write(
    root,
    "rules/artifact-style-rules.md",
    `${AT("all", "all", "all", "all", "human-generated")}\n`
  );
  write(
    root,
    "rules-on-demand/engineering/eng.plan-rules.md",
    `${AT("all", "all", "ENGINEERING", "all")}\n`
  );
  write(
    root,
    "rules-on-demand/product/prod.guided-rules.md",
    `${AT("all", "all", "PRODUCT", "all")}\n`
  );
  write(target, ".claude/ENV.md", `HUB=BACKEND\nCOMPANY_PROFILE=acme\n${envExtra}`);
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

test("syncRulesForProfile: perfil BACKEND recebe a que bate e a universal, não a de FRONTEND nem a de PRODUCT (a)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.deepEqual(ideFiles(ideDir, "rules"), ["engineering/eng-rules.md", "universal.md"]);
    assert.equal(r.universal, 1);
    assert.equal(r.copied.rules, 2);
  });
});

test("syncRulesForProfile: rtk-rules.md só com rtkEnabled (b)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root, rtkEnabled: true });
    assert.ok(ideFiles(ideDir, "rules").includes("rtk-rules.md"));
    syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root, rtkEnabled: false });
    assert.ok(!ideFiles(ideDir, "rules").includes("rtk-rules.md"));
  });
});

test("syncRulesForProfile: artifact-style só para ARTIFACT_STYLE=human-generated (c)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    syncRulesForProfile(
      ideDir,
      { ...BACKEND, ARTIFACT_STYLE: "human-generated" },
      { frameworkRoot: root }
    );
    assert.ok(ideFiles(ideDir, "rules").includes("artifact-style-rules.md"));
    syncRulesForProfile(
      ideDir,
      { ...BACKEND, ARTIFACT_STYLE: "ai-generated" },
      { frameworkRoot: root }
    );
    assert.ok(!ideFiles(ideDir, "rules").includes("artifact-style-rules.md"));
  });
});

test("syncRulesForProfile: rule que deixou de bater sai; a que passou a bater é copiada (d)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/engineering/frontend/x.md", "cópia antiga");
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.ok(!existsSync(join(ideDir, "rules/engineering/frontend/x.md")));
    assert.equal(r.removed, 1);
    syncRulesForProfile(ideDir, { ...BACKEND, HUB: "FRONTEND" }, { frameworkRoot: root });
    assert.ok(existsSync(join(ideDir, "rules/engineering/frontend/x.md")));
  });
});

test("syncRulesForProfile: overlay com o mesmo caminho vale pelo Applies to dele, marcado; se não bate, sai (e)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    // O core manda a eng-rules para todos; o overlay acme só para FRONTEND.
    write(
      ideDir,
      "overlays/acme/rules/engineering/eng-rules.md",
      `${AT("FRONTEND", "all", "all", "all")}\n# acme\n`
    );
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.ok(!existsSync(join(ideDir, "rules/engineering/eng-rules.md")));
    assert.equal(r.fromOverlay, 0);
    const r2 = syncRulesForProfile(
      ideDir,
      { ...BACKEND, HUB: "FRONTEND" },
      { frameworkRoot: root }
    );
    const copia = readFileSync(join(ideDir, "rules/engineering/eng-rules.md"), "utf-8");
    assert.equal(readOverlayMarker(copia), "acme");
    assert.match(copia, /# acme/);
    assert.equal(r2.fromOverlay, 1);
  });
});

test("syncRulesForProfile: rule própria da pessoa (fora do core e do overlay) fica intacta (f)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/minha-rule.md", `${AT("FRONTEND", "all", "all", "all")}\nminha\n`);
    syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.equal(
      readFileSync(join(ideDir, "rules/minha-rule.md"), "utf-8"),
      `${AT("FRONTEND", "all", "all", "all")}\nminha\n`
    );
  });
});

test("syncRulesForProfile: rules-on-demand/ é filtrada igual (g)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules-on-demand/product/prod.guided-rules.md", "antiga");
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.deepEqual(ideFiles(ideDir, "rules-on-demand"), ["engineering/eng.plan-rules.md"]);
    assert.equal(r.copied["rules-on-demand"], 1);
  });
});

test("syncRulesForProfile: overlays/ fica intacto, conferido por hash; a pasta do perfil é criada se faltar (h)", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const semPasta = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.equal(semPasta.folderCreated, true);
    write(
      ideDir,
      "overlays/acme/rules/engineering/eng-rules.md",
      `${AT("all", "all", "all", "all")}\n# acme\n`
    );
    const hash = () => {
      const h = createHash("sha256");
      for (const f of ideFiles(ideDir, "overlays"))
        h.update(f + readFileSync(join(ideDir, "overlays", f)));
      return h.digest("hex");
    };
    const antes = hash();
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
    assert.equal(hash(), antes);
    assert.equal(r.folderCreated, false);
  });
});

test("syncRulesForProfile: com o rules/ real e sem overlay, o resultado é o de listRulesForProfile nos 4 perfis do BASE", () => {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
  const perfis = [
    { HUB: "FULLCYCLE", POSITION: "GENERALIST", AREA: "ENGINEERING", SQUAD: "CORE" },
    BACKEND,
    { HUB: "FRONTEND", POSITION: "PLENO", AREA: "ENGINEERING", SQUAD: "CORE" },
    { HUB: "QA", POSITION: "QA-ENGINEER", AREA: "ENGINEERING", SQUAD: "CORE" },
  ];
  for (const perfil of perfis) {
    const target = mkdtempSync(join(tmpdir(), "jarvis-rules-equiv-"));
    try {
      const ideDir = join(target, ".claude");
      mkdirSync(join(ideDir, "overlays", "stark-industries"), { recursive: true });
      writeFileSync(join(ideDir, "ENV.md"), "HUB=X\n");
      syncRulesForProfile(ideDir, perfil, { frameworkRoot: repo });
      for (const dir of ["rules", "rules-on-demand"]) {
        const esperado = listRulesForProfile(join(repo, dir), perfil)
          .map((r) => r.path)
          .sort();
        assert.deepEqual(ideFiles(ideDir, dir), esperado, `${perfil.HUB}: ${dir}/`);
      }
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  }
});

test("syncRulesForProfile: com dryRun não grava nem apaga, e conta o que faria", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    write(ideDir, "rules/engineering/frontend/x.md", "cópia antiga");
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root, dryRun: true });
    assert.deepEqual(ideFiles(ideDir, "rules"), ["engineering/frontend/x.md"]);
    assert.ok(!existsSync(join(ideDir, "overlays", "acme")));
    assert.equal(r.removed, 1);
    assert.equal(r.copied.rules, 2);
  });
});

test("syncRulesForProfile: envText vale no lugar do ENV.md do disco; COMPANY_PROFILE inválido vira aviso e o default", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    const globex = syncRulesForProfile(ideDir, BACKEND, {
      frameworkRoot: root,
      envText: "COMPANY_PROFILE=globex\n",
    });
    assert.equal(globex.companyProfile, "globex");
    assert.ok(existsSync(join(ideDir, "overlays", "globex")));
    const invalido = syncRulesForProfile(ideDir, BACKEND, {
      frameworkRoot: root,
      envText: "COMPANY_PROFILE=../x\n",
    });
    assert.equal(invalido.companyProfile, "stark-industries");
    assert.ok(invalido.warnings.length > 0);
  });
});

test("syncRulesForProfile: falha ao gravar uma rule vai para errors e as outras seguem", () => {
  withJarvisRoot((root, target) => {
    const ideDir = buildRulesFixture(root, target);
    // Uma pasta no lugar do arquivo de destino faz a cópia falhar.
    mkdirSync(join(ideDir, "rules", "engineering", "eng-rules.md"), { recursive: true });
    const r = syncRulesForProfile(ideDir, BACKEND, { frameworkRoot: root });
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

test("syncRulesForProfile (kiro): o steering acompanha o filtro de rules (#83)", () => {
  withJarvisRoot((root, target) => {
    buildRulesFixture(root, target);
    const kiroDir = join(target, ".kiro");
    write(target, ".kiro/ENV.md", "HUB=BACKEND\n");
    // Instalação com o steering de todas as rules (o que o transformKiroAssets gera) e um workflow.
    for (const n of ["eng-rules.md", "x.md", "y.md", "universal.md", "rtk-rules.md"])
      write(target, `.kiro/steering/${n}`, "antigo");
    write(target, ".kiro/steering/eng.start.md", "workflow");

    syncRulesForProfile(kiroDir, BACKEND, { frameworkRoot: root });

    const steering = readdirSync(join(kiroDir, "steering")).filter((n) => n.endsWith(".md"));
    assert.deepEqual(steering.sort(), ["eng-rules.md", "eng.start.md", "universal.md"]);
    // A rule que fica tem o steering regravado a partir da rule (não o arquivo antigo).
    assert.match(
      readFileSync(join(kiroDir, "steering/eng-rules.md"), "utf-8"),
      /^inclusion: auto$/m
    );
    assert.equal(readFileSync(join(kiroDir, "steering/eng.start.md"), "utf-8"), "workflow");
  });
});
