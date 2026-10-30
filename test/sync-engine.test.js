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
import { syncAssets } from "../bin/lib/core/sync-engine.js";

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
      "rules/engineering/eng-rules.md": "---\nforked_from: eng-rules@8.2.0\nforked_at: 2026-10-30\n---\n\n# empresa\n",
      "rules-on-demand/engineering/eng.plan-rules.md": "# plano da empresa, sem frontmatter\n",
      "workflows/engineering/eng.start.md": "# não é copiado pelo sync\n",
    });
    const before = snapshotDir(join(target, ".claude/overlays/acme"));

    const result = syncAssets(target, "claude", {});

    assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
    const rule = readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8");
    assert.match(rule, /^---\nforked_from: eng-rules@8\.2\.0\nforked_at: 2026-10-30\n---\n\n> Overlay: acme \(forked_from eng-rules@8\.2\.0\)\n\n# empresa\n$/);
    const onDemand = readFileSync(join(target, ".claude/rules-on-demand/engineering/eng.plan-rules.md"), "utf-8");
    assert.equal(onDemand, "> Overlay: acme (forked_from sem carimbo)\n\n# plano da empresa, sem frontmatter\n");
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
    assert.ok(!result.skipped.some((m) => m.includes("COMPANY_PROFILE vazio")), "sem ENV.md não há aviso");
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
    assert.ok(result.skipped.some((m) => /⚠️ COMPANY_PROFILE não pode ser o nome de uma pasta do core/.test(m)));
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
    assert.match(readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"), /> Overlay: acme/);

    // troca de perfil: o overlay acme fica no disco, mas não está mais ativo
    write(target, ".claude/ENV.md", "COMPANY_PROFILE=beta\n");
    const result = syncAssets(target, "claude", {});
    assert.ok(!existsSync(join(target, ".claude/rules/so-da-acme.md")), "órfã continuou na IDE");
    assert.ok(result.copied.includes("(overlay) rules/so-da-acme.md: órfã removida da IDE"));
    // a do core volta à versão do core (o cpSync a sobrescreveu); o overlay acme segue intacto
    assert.equal(readFileSync(join(target, ".claude/rules/engineering/eng-rules.md"), "utf-8"), "x");
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
