import {
  existsSync,
  mkdirSync,
  cpSync,
  readdirSync,
  renameSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { join, relative, basename } from "node:path";
import { getFrameworkRoot } from "../utils/paths.js";
import { getIDEFolder } from "../config/ide-config.js";
import { extractFrontmatterBlock } from "../utils/frontmatter.js";
import {
  SYNC_DIRS,
  SYNC_ROOT_FILES,
  OBSOLETE_PATHS,
  LOCK_FILE,
  OPENCODE_MODEL_MAP,
  OPENCODE_DEFAULT_PERMISSIONS,
  OPENCODE_STRIP_FIELDS,
  KIRO_STRIP_FIELDS,
  KIRO_HUB_FILE_PATTERNS,
} from "../config/constants.js";

/**
 * Extrai name e description do frontmatter YAML de um SKILL.md
 * @param {string} content - Conteúdo do SKILL.md
 * @returns {{ name: string, description: string } | null}
 */
function parseSkillFrontmatter(content) {
  const fm = extractFrontmatterBlock(content);
  if (fm === null) return null;
  const name = (fm.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  // description pode ser multiline com `>`
  const descMatch = fm.match(/^description:\s*[>|]?\n?([\s\S]*?)(?=\n\S|\n---|Z)/m);
  const description = descMatch
    ? descMatch[1].replace(/^\s+/gm, "").replace(/\n+/g, " ").trim()
    : "";
  return name ? { name, description } : null;
}

/**
 * Gera openai.yaml para cada skill sincronizado ao Codex.
 * O Codex CLI usa este arquivo para integrar skills no painel TUI.
 * @param {string} skillsDir - Caminho para .codex/skills/
 */
function generateCodexOpenAIYaml(skillsDir) {
  if (!existsSync(skillsDir)) return;
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillDir = join(skillsDir, entry.name);
    const skillMdPath = join(skillDir, "SKILL.md");
    const yamlPath = join(skillDir, "openai.yaml");
    if (!existsSync(skillMdPath) || existsSync(yamlPath)) continue;
    const content = readFileSync(skillMdPath, "utf-8");
    const parsed = parseSkillFrontmatter(content);
    if (!parsed) continue;
    const yaml =
      `name: ${parsed.name}\n` + `description: "${parsed.description.replace(/"/g, '\\"')}"\n`;
    writeFileSync(yamlPath, yaml, "utf-8");
  }
}

export function syncAssets(targetDir, ide, opts = {}) {
  const frameworkRoot = getFrameworkRoot();
  const ideDir = join(targetDir, `.${getIDEFolder(ide)}`);
  const result = { copied: [], skipped: [], errors: [] };

  if (!opts.dryRun) {
    mkdirSync(ideDir, { recursive: true });
  }

  for (const dir of SYNC_DIRS) {
    const src = join(frameworkRoot, dir);
    // Se for "workflows" e a IDE usa outro nome, usa o nome configurado
    const destDirName = dir === "workflows" && opts.workflowsFolder ? opts.workflowsFolder : dir;
    const dest = join(ideDir, destDirName);

    if (!existsSync(src)) {
      result.skipped.push(`${dir}/ (not found in framework)`);
      continue;
    }

    try {
      if (!opts.dryRun) {
        cpSync(src, dest, { recursive: true, force: opts.force ?? true });
      }
      result.copied.push(`${destDirName}/`);
    } catch (err) {
      result.errors.push(`${destDirName}/: ${err.message}`);
    }
  }

  // Copy root files to IDE folder
  for (const file of SYNC_ROOT_FILES) {
    const src = join(frameworkRoot, file);
    const dest = join(ideDir, file);

    if (!existsSync(src)) continue;

    if (existsSync(dest) && !opts.force) {
      result.skipped.push(`${file} (already exists)`);
      continue;
    }

    try {
      if (!opts.dryRun) {
        cpSync(src, dest);
      }
      result.copied.push(file);
    } catch (err) {
      result.errors.push(`${file}: ${err.message}`);
    }
  }

  // Flatten workflows subfolders — todas as IDEs requerem arquivos na raiz sem subpastas
  const workflowsDest = join(ideDir, opts.workflowsFolder || "workflows");
  if (existsSync(workflowsDest)) {
    const moved = flattenDir(workflowsDest);
    if (moved > 0) result.copied.push(`(flatten) ${moved} workflows movidos para raiz`);
  }

  // Cleanup leftover metrics skill copies from older installs
  const legacyMetricsDir = join(ideDir, "metrics");
  if (existsSync(legacyMetricsDir) && !opts.dryRun) {
    try {
      rmSync(legacyMetricsDir, { recursive: true, force: true });
      result.copied.push(`(cleanup) .${ide}/metrics/ removed`);
    } catch {}
  }

  // Cleanup de caminhos que saíram do framework (lista explícita em OBSOLETE_PATHS)
  for (const obsolete of OBSOLETE_PATHS) {
    const obsoletePath = join(ideDir, obsolete);
    if (existsSync(obsoletePath) && !opts.dryRun) {
      try {
        rmSync(obsoletePath, { recursive: true, force: true });
        result.copied.push(`(cleanup) .${getIDEFolder(ide)}/${obsolete} removed`);
      } catch {}
    }
  }

  if (!opts.dryRun) {
    writeLockFile(targetDir, ideDir, ide, frameworkRoot);
  }

  // RTK: detectar e reconciliar RTK_ENABLED + rtk-rules.md
  if (!opts.dryRun) {
    const rtkResult = reconcileRtk(ideDir, targetDir, ide);
    if (rtkResult) result.copied.push(rtkResult);
  }

  // Codex: gerar openai.yaml por skill para integração no painel TUI
  if (ide === "codex" && !opts.dryRun) {
    const codexSkillsDir = join(ideDir, "skills");
    generateCodexOpenAIYaml(codexSkillsDir);
    result.copied.push("(codex) openai.yaml gerado por skill em skills/*/");
  }

  // Kiro: gerar steering files (workflows já estão em steering/, processar rules e skills)
  if (ide === "kiro" && !opts.dryRun) {
    const kiroDir = ideDir;
    transformKiroAssets(kiroDir, targetDir);
    result.copied.push("(kiro) steering files gerados para workflows, rules e skills");

    generateKiroMcpConfig(targetDir, kiroDir);
    result.copied.push("(kiro) .kiro/settings/mcp.json verificado");
  }

  // OpenCode: transformar frontmatter de agents e commands + gerar opencode.json
  if (ide === "opencode" && !opts.dryRun) {
    const ocAgentsDir = join(ideDir, "agents");
    transformOpenCodeAgents(ocAgentsDir);
    result.copied.push("(opencode) agents transformados para formato OpenCode");

    const ocCommandsDir = join(ideDir, opts.workflowsFolder || "commands");
    transformOpenCodeCommands(ocCommandsDir);
    result.copied.push("(opencode) commands transformados para formato OpenCode");

    generateOpenCodeConfig(targetDir);
    result.copied.push("(opencode) opencode.json gerado na raiz");
  }

  return result;
}

/**
 * Detecta RTK no PATH e reconcilia RTK_ENABLED no ENV.md + rtk-rules.md na IDE.
 * - RTK encontrado → RTK_ENABLED=true no ENV.md, mantém rule
 * - RTK não encontrado → remove rtk-rules.md da IDE, mantém RTK_ENABLED=false
 * @returns {string|null} mensagem de log ou null se nenhuma ação
 */
function reconcileRtk(ideDir, targetDir, ide) {
  const rtkRulePath = join(ideDir, "rules", "rtk-rules.md");
  const envPath = join(ideDir, "ENV.md");
  const hasRtk = (() => {
    try {
      execSync("rtk gain --help 2>/dev/null", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  })();

  if (hasRtk) {
    // Ativar RTK_ENABLED no ENV.md se existir e estiver false
    if (existsSync(envPath)) {
      let env = readFileSync(envPath, "utf-8");
      if (env.includes("RTK_ENABLED=false")) {
        env = env.replace("RTK_ENABLED=false", "RTK_ENABLED=true");
        writeFileSync(envPath, env, "utf-8");
        return "(rtk) detectado — RTK_ENABLED=true no ENV.md";
      }
      if (!env.includes("RTK_ENABLED")) {
        env = env.trimEnd() + "\n\n# --- RTK — Token Killer ---\nRTK_ENABLED=true\n";
        writeFileSync(envPath, env, "utf-8");
        return "(rtk) detectado — RTK_ENABLED=true adicionado ao ENV.md";
      }
    }
    return null; // já estava true
  }

  // RTK não encontrado — remover rule se foi copiada
  if (existsSync(rtkRulePath)) {
    rmSync(rtkRulePath);
    return "(rtk) não detectado — rtk-rules.md removida de rules/";
  }
  return null;
}

/**
 * Resolve o model Jarvis para formato OpenCode (provider/model-id).
 * @param {string} model - Model no formato Jarvis (ex: "opus", "claude-sonnet-4-20250514")
 * @returns {string} Model no formato OpenCode (ex: "anthropic/claude-opus-4-6")
 */
function resolveOpenCodeModel(model) {
  if (!model) return "anthropic/claude-sonnet-4-6";
  const trimmed = model.trim();
  if (trimmed.includes("/")) return trimmed; // já no formato provider/model
  if (OPENCODE_MODEL_MAP[trimmed]) return OPENCODE_MODEL_MAP[trimmed];
  // Inferir provider pelo prefixo do modelo
  if (trimmed.startsWith("claude")) return `anthropic/${trimmed}`;
  if (trimmed.startsWith("gpt") || trimmed.startsWith("o3") || trimmed.startsWith("o4"))
    return `openai/${trimmed}`;
  if (trimmed.startsWith("gemini")) return `google/${trimmed}`;
  // Fallback: retornar sem provider — OpenCode resolverá pelo provider padrão
  return trimmed;
}

/**
 * Transforma frontmatter de agents Jarvis para formato OpenCode.
 * Reescreve os .md já copiados em .opencode/agents/.
 * @param {string} agentsDir - Caminho para .opencode/agents/
 */
function transformOpenCodeAgents(agentsDir) {
  if (!existsSync(agentsDir)) return;
  const files = [];
  collectMdFiles(agentsDir, files);

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const body = content.slice(fmMatch[0].length).trim();

    // Extract fields from Jarvis frontmatter
    const description = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || "";
    const model = (fm.match(/^model:\s*(.+)$/m) || [])[1]?.trim();
    const name = basename(filePath, ".md");
    const isMainAgent = name === "eng.agent" || name === "eng-agent";
    const mode = isMainAgent ? "primary" : "subagent";

    // Build OpenCode frontmatter
    const lines = [`description: "${description.replace(/"/g, '\\"')}"`];
    lines.push(`mode: ${mode}`);
    lines.push(`model: ${resolveOpenCodeModel(model)}`);
    lines.push("permission:");
    for (const [key, val] of Object.entries(OPENCODE_DEFAULT_PERMISSIONS)) {
      lines.push(`  ${key}: ${val}`);
    }

    const newContent = `---\n${lines.join("\n")}\n---\n\n${body}\n`;
    writeFileSync(filePath, newContent, "utf-8");
  }
}

/**
 * Transforma frontmatter de commands (workflows) Jarvis para formato OpenCode.
 * Remove campos Jarvis-only, converte model e agent path para nome.
 * @param {string} commandsDir - Caminho para .opencode/commands/
 */
function transformOpenCodeCommands(commandsDir) {
  if (!existsSync(commandsDir)) return;
  const files = [];
  collectMdFiles(commandsDir, files);

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const body = content.slice(fmMatch[0].length).trim();

    // Extract fields
    const description = (fm.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || "";
    const model =
      (fm.match(/^recommended_model:\s*(.+)$/m) || [])[1]?.trim() ||
      (fm.match(/^model:\s*(.+)$/m) || [])[1]?.trim();

    // Convert agent path to agent name: $IDE/agents/engineering/eng.agent.md → eng.agent
    const agentMatch = fm.match(/^agent:\s*["']?(.+?)["']?\s*$/m);
    let agentName = "";
    if (agentMatch) {
      const agentPath = agentMatch[1].trim();
      agentName = basename(agentPath, ".md");
    }

    // Build OpenCode command frontmatter (only supported fields)
    const lines = [`description: "${description.replace(/"/g, '\\"')}"`];
    if (agentName) lines.push(`agent: ${agentName}`);
    if (model) lines.push(`model: ${resolveOpenCodeModel(model)}`);

    const newContent = `---\n${lines.join("\n")}\n---\n\n${body}\n`;
    writeFileSync(filePath, newContent, "utf-8");
  }
}

/**
 * Gera opencode.json na raiz do projeto se não existir.
 * @param {string} targetDir - Raiz do projeto alvo
 */
function generateOpenCodeConfig(targetDir) {
  const configPath = join(targetDir, "opencode.json");
  if (existsSync(configPath)) return; // não sobrescrever config do usuário

  const config = {
    $schema: "https://opencode.ai/config.json",
    model: "anthropic/claude-sonnet-4-6",
    instructions: [".opencode/AGENTS.md", ".opencode/rules/**/*.md"],
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

/**
 * Coleta recursivamente todos os .md de um diretório.
 * @param {string} dir
 * @param {string[]} acc
 */
function collectMdFiles(dir, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectMdFiles(full, acc);
    else if (entry.isFile() && entry.name.endsWith(".md")) acc.push(full);
  }
}

function flattenDir(dir, rootDir) {
  const root = rootDir ?? dir;
  let moved = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      moved += flattenDir(fullPath, root);
      try {
        rmSync(fullPath, { recursive: true, force: true });
      } catch {}
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const dest = join(root, basename(entry.name));
      if (fullPath !== dest) {
        try {
          renameSync(fullPath, dest);
          moved++;
        } catch {}
      }
    }
  }
  return moved;
}

/**
 * Converte o frontmatter de um arquivo .md para um steering file Kiro.
 * - Remove campos Jarvis-only (KIRO_STRIP_FIELDS)
 * - Adiciona `inclusion` se não presente
 * - Preserva `name` e `description`
 * @param {string} content - Conteúdo original do .md
 * @param {string} inclusion - Valor de inclusion: "auto" | "manual" | "fileMatch"
 * @param {string} [fileMatchPattern] - Pattern para inclusion: fileMatch
 * @returns {string} Conteúdo transformado
 */
function toKiroSteeringFile(content, inclusion, fileMatchPattern) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const body = fmMatch ? content.slice(fmMatch[0].length).trimStart() : content;

  const lines = [`inclusion: ${inclusion}`];
  if (inclusion === "fileMatch" && fileMatchPattern) {
    lines.push(`fileMatchPattern: "${fileMatchPattern}"`);
  }

  if (fmMatch) {
    const fm = fmMatch[1];
    const description = (fm.match(/^description:\s*[>|]?\s*\n?([\s\S]*?)(?=\n\S|\n---|Z)/m) ||
      [])[1];
    const descInline = (fm.match(/^description:\s*(.+)$/m) || [])[1];
    const finalDesc = (description || descInline || "")
      .replace(/^\s+/gm, "")
      .replace(/\n+/g, " ")
      .trim();
    if (finalDesc) lines.push(`description: "${finalDesc.replace(/"/g, '\\"')}"`);
  }

  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

/**
 * Detecta o HUB de uma rule a partir do bloco "Applies to" no corpo.
 * Retorna o HUB em maiúsculas ou null se não encontrado.
 * @param {string} content
 * @returns {string | null}
 */
function detectRuleHub(content) {
  const match = content.match(/\*\*Applies to:\*\*[^\n]*HUB:\s*([A-Z-]+)/i);
  if (!match) return null;
  const hub = match[1].trim().toUpperCase();
  return hub === "ALL" ? null : hub;
}

/**
 * Transforma os assets copiados para .kiro/ em steering files.
 * 1. Workflows em steering/ → adiciona inclusion: manual
 * 2. Rules em rules/ → copia para steering/ com inclusion: auto ou fileMatch
 * 3. Skills em skills/*\/SKILL.md → copia para steering/skills/skill-{nome}.md
 * @param {string} kiroDir - Caminho para .kiro/
 * @param {string} targetDir - Raiz do projeto (para buscar MCPs.md)
 */
function transformKiroAssets(kiroDir, targetDir) {
  const steeringDir = join(kiroDir, "steering");
  mkdirSync(steeringDir, { recursive: true });

  // 1. Workflows — já estão em steering/ (copiados com workflowsFolder="steering")
  //    Adicionar `inclusion: manual` no frontmatter de cada arquivo
  if (existsSync(steeringDir)) {
    for (const entry of readdirSync(steeringDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const filePath = join(steeringDir, entry.name);
      const content = readFileSync(filePath, "utf-8");
      const transformed = toKiroSteeringFile(content, "manual");
      writeFileSync(filePath, transformed, "utf-8");
    }
  }

  // 2. Rules — copiar de rules/ para steering/ com inclusion adequada
  const rulesDir = join(kiroDir, "rules");
  if (existsSync(rulesDir)) {
    const ruleFiles = [];
    collectMdFiles(rulesDir, ruleFiles);

    for (const filePath of ruleFiles) {
      const name = basename(filePath);
      // Ignorar arquivos de índice/meta
      if (name === "AGENTS.md" || name === "README.md") continue;

      const content = readFileSync(filePath, "utf-8");
      const hub = detectRuleHub(content);
      const pattern = hub ? KIRO_HUB_FILE_PATTERNS[hub] : null;
      const inclusion = pattern ? "fileMatch" : "auto";
      const transformed = toKiroSteeringFile(content, inclusion, pattern);

      writeFileSync(join(steeringDir, name), transformed, "utf-8");
    }
  }

  // 3. Skills — copiar SKILL.md de cada skill para steering/skills/skill-{nome}.md
  const skillsDir = join(kiroDir, "skills");
  const steeringSkillsDir = join(steeringDir, "skills");
  if (existsSync(skillsDir)) {
    mkdirSync(steeringSkillsDir, { recursive: true });

    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillName = entry.name;
      const skillMdPath = join(skillsDir, skillName, "SKILL.md");
      if (!existsSync(skillMdPath)) continue;

      const content = readFileSync(skillMdPath, "utf-8");
      const transformed = toKiroSteeringFile(content, "manual");
      writeFileSync(join(steeringSkillsDir, `skill-${skillName}.md`), transformed, "utf-8");
    }
  }
}

/**
 * Gera .kiro/settings/mcp.json a partir de MCPs.md do projeto (se existir).
 * Busca em $IDE/MCPs.md (qualquer IDE detectada no targetDir).
 * Não sobrescreve se o arquivo já existir.
 * @param {string} targetDir - Raiz do projeto alvo
 * @param {string} kiroDir - Caminho para .kiro/
 */
function generateKiroMcpConfig(targetDir, kiroDir) {
  const settingsDir = join(kiroDir, "settings");
  const mcpJsonPath = join(settingsDir, "mcp.json");
  if (existsSync(mcpJsonPath)) return;

  // Buscar MCPs.md em qualquer pasta de IDE do projeto
  const ideFolders = ["windsurf", "claude", "cursor", "codex", "opencode", "agents"];
  let mcpsContent = null;
  for (const folder of ideFolders) {
    const candidate = join(targetDir, `.${folder}`, "MCPs.md");
    if (existsSync(candidate)) {
      mcpsContent = readFileSync(candidate, "utf-8");
      break;
    }
  }

  mkdirSync(settingsDir, { recursive: true });

  if (!mcpsContent) {
    // Gerar estrutura base vazia para o usuário preencher
    const base = { mcpServers: {} };
    writeFileSync(mcpJsonPath, JSON.stringify(base, null, 2) + "\n", "utf-8");
    return;
  }

  // Extrair blocos de código JSON do MCPs.md (```json ... ```)
  const blocks = [];
  for (const m of mcpsContent.matchAll(/```json\n([\s\S]*?)```/g)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed && typeof parsed === "object") blocks.push(parsed);
    } catch {
      // ignorar blocos inválidos
    }
  }

  const mcpServers = {};
  for (const block of blocks) {
    if (block.mcpServers) Object.assign(mcpServers, block.mcpServers);
    else if (block.name && block.command) mcpServers[block.name] = block;
  }

  writeFileSync(mcpJsonPath, JSON.stringify({ mcpServers }, null, 2) + "\n", "utf-8");
}

function writeLockFile(targetDir, ideDir, ide, frameworkRoot) {
  const pkgPath = join(frameworkRoot, "package.json");
  const pkg = existsSync(pkgPath)
    ? JSON.parse(readFileSync(pkgPath, "utf-8"))
    : { version: "0.0.0" };

  const lock = {
    version: pkg.version,
    ide,
    syncedAt: new Date().toISOString(),
    frameworkRoot: relative(targetDir, frameworkRoot) || ".",
  };

  const lockContent = JSON.stringify(lock, null, 2) + "\n";

  // Write lock file to project root (for postinstall.js)
  writeFileSync(join(targetDir, LOCK_FILE), lockContent);

  // Also write lock file to IDE folder
  writeFileSync(join(ideDir, LOCK_FILE), lockContent);
}
