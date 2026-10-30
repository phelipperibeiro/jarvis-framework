// Guarda do texto da rule de precedência do overlay (rules/company-overlay-rules.md, #199).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_COMPANY_PROFILE } from "../bin/lib/core/company-profile.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rule = readFileSync(join(root, "rules", "company-overlay-rules.md"), "utf-8");

test("company-overlay-rules: universal, abaixo de 1 KB e com o default do perfil", () => {
  assert.match(rule, /> \*\*Applies to:\*\* HUB: all \| POSITION: all \| AREA: all \| SQUAD: all/);
  assert.ok(Buffer.byteLength(rule, "utf-8") < 1024, "a rule passou de 1 KB");
  assert.ok(rule.includes(DEFAULT_COMPANY_PROFILE), "não cita o perfil default");
});

test("company-overlay-rules: cita os 6 tipos, a precedência e a proibição de escrever no overlay", () => {
  for (const tipo of ["workflows", "skills", "agents", "rules", "rules-on-demand", "templates"]) {
    assert.ok(rule.includes(`${tipo}/`), `não cita ${tipo}/`);
  }
  assert.match(rule, /overlay > especialização de stack > core/);
  assert.match(rule, /\$IDE\/overlays\/\{COMPANY_PROFILE\}\//);
  assert.match(rule, /Não escreva no overlay/);
  assert.match(rule, /rules\/.*instalação/s);
});

// Skill /jarvis-fork: a conversa que grava no overlay só com o Sim (#199).
const skill = readFileSync(join(root, "skills", "jarvis-fork", "SKILL.md"), "utf-8");

test("jarvis-fork: frontmatter com area global e as perguntas da regra de ouro e do alcance", () => {
  assert.match(skill, /^---\nname: jarvis-fork\n/);
  assert.match(skill, /^\s+area: global$/m);
  assert.match(skill, /Gravar no overlay\?/);
  assert.match(skill, /Remover o fork e voltar ao core\?/);
  for (const opcao of ["Apenas deste contexto", "Estender para o core", "Ainda não sei"]) {
    assert.ok(skill.includes(opcao), `falta a opção "${opcao}"`);
  }
  assert.match(skill, /jarvis fork \{artefato\}/);
  assert.match(skill, /sem o \*\*Sim\*\*/);
  assert.match(skill, /\| 8\. Alcance do ajuste \| `\/jarvis-report-issue` \|/);
});

// Fase 10 (#199): o que a skill e o /jarvis-init prometem na conversa.
test("jarvis-fork e jarvis-init: fork sem carimbo oferece carimbar; Passo 8 cria a pasta do perfil", () => {
  assert.match(skill, /Fork \*\*sem carimbo\*\*/);
  assert.match(skill, /Carimbar \{artefato\} com a versão atual do core, sem alterar o conteúdo\?/);
  assert.match(skill, /--update --diff/);
  const init = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf-8");
  assert.match(init, /Overlay \{COMPANY_PROFILE\}: pasta criada/);
  assert.match(init, /Órfãs do overlay/);
});
