// Testes do mapa de chamadas (jarvis map). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "../bin/lib/flow-map/index.js";
import { parseDeclaration, classifyCell, splitCells } from "../bin/lib/flow-map/parse.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const wf = (rows) =>
  `# W\n\n### Skills invocados durante o workflow\n\n| Passo | Skill | Condição |\n|-------|-------|----------|\n${rows.join("\n")}\n\n## Outro\n`;

test("splitCells ignora | dentro de crases", () => {
  assert.deepEqual(splitCells("| Passo | `a | b` | Se x |"), ["Passo", "`a | b`", "Se x"]);
});

test("classifyCell: skill/workflow, com argumentos, CLI, MCP, agente e ferramentas", () => {
  assert.deepEqual(classifyCell("`/eng-qa-gate`").targets, [{ kind: "internal", name: "eng-qa-gate" }]);
  assert.deepEqual(classifyCell("`/jarvis-create-specialization {área} {stack}`").targets, [
    { kind: "internal", name: "jarvis-create-specialization" },
  ]);
  assert.deepEqual(classifyCell("`jarvis docs sync` (CLI do Jarvis)").targets, [{ kind: "cli", name: "jarvis docs sync" }]);
  assert.deepEqual(classifyCell("`context7` (MCP: `resolve-library-id`, `query-docs`)").targets, [{ kind: "mcp", name: "context7" }]);
  assert.deepEqual(classifyCell("`mcp__claude_ai_Atlassian__getJiraIssue`").targets, [
    { kind: "mcp", name: "mcp__claude_ai_Atlassian__getJiraIssue" },
  ]);
  assert.deepEqual(classifyCell("`eng.agent` (agente)").targets, [{ kind: "agent", name: "eng.agent" }]);
  assert.deepEqual(classifyCell("`Read` / `Grep` / `Glob` (leitura do repo)").targets, []);
});

test("classifyCell: via, várias chamadas, autocontido e marcadores", () => {
  const via = classifyCell("`/eng-frontend` (via `eng.specializations-rules.md`)");
  assert.deepEqual(via.targets, [{ kind: "internal", name: "eng-frontend" }]);
  assert.equal(via.via, "eng.specializations-rules.md");

  const viaCli = classifyCell("`/jarvis-docs-central` (via `jarvis docs sync --silent`)");
  assert.deepEqual(viaCli.targets, [{ kind: "internal", name: "jarvis-docs-central" }]);

  assert.deepEqual(classifyCell("`/eng-backend` e `/eng-frontend`").targets.map((t) => t.name), ["eng-backend", "eng-frontend"]);
  assert.equal(classifyCell("Nenhuma — workflow autocontido").selfContained, true);
  assert.equal(classifyCell("`Jira MCP` (referência a confirmar)").marker, "a confirmar");
  assert.equal(classifyCell("`/x-y` (referência quebrada)").marker, "quebrada");
});

test("parseDeclaration de workflow: passo, condição e autocontido", () => {
  const d = parseDeclaration("workflow", wf(["| Fase 1 | `/a-b` | Se `X=1` |", "| Fase 2 | `/c-d` | Sempre |"]));
  assert.equal(d.declared, true);
  assert.equal(d.selfContained, false);
  assert.equal(d.rows.length, 2);
  assert.equal(d.rows[0].passo, "Fase 1");
  assert.equal(d.rows[0].condicao, "Se `X=1`");

  const self = parseDeclaration("workflow", wf(["| — | Nenhuma — workflow autocontido | — |"]));
  assert.equal(self.selfContained, true);
});

test("parseDeclaration: arquivo sem declaração e título dentro de bloco de código", () => {
  assert.equal(parseDeclaration("workflow", "# Sem tabela\n").declared, false);
  const fenced = "```\n### Skills invocados durante o workflow\n| Passo | Skill | Condição |\n|--|--|--|\n| a | `/x` | y |\n```\n";
  assert.equal(parseDeclaration("workflow", fenced).declared, false);
});

test("parseDeclaration de skill usa o título da skill", () => {
  const text = "### Skills invocados durante a execução do skill\n\n| Passo | Skill | Condição |\n|--|--|--|\n| 1 | `/a-b` | Sempre |\n";
  assert.equal(parseDeclaration("skill", text).rows[0].targets[0].name, "a-b");
});

test("parseDeclaration de agente: skills disponíveis e relacionados", () => {
  const text = [
    "## Skills Disponíveis",
    "",
    "### eng-qa-test-plan",
    "Para análise de cobertura:",
    "- Arquivo: `$IDE/skills/eng-qa-test-plan/SKILL.md`",
    "",
    "### Backend e frontend (skill base)",
    "Quando a tarefa envolver backend ou frontend:",
    "- Backend: `$IDE/skills/eng-backend/SKILL.md` + itens",
    "- Frontend: `$IDE/skills/eng-frontend/SKILL.md` + itens",
    "",
    "## Workflows e Agentes Relacionados",
    "",
    "- **eng.qa.testing-engineer**: para escrever os testes",
    "  - Arquivo: `$IDE/agents/engineering/qa/eng.qa.testing-engineer.md`",
    "- `eng.qa-quality-report` (workflow): gerar o relatório",
    "- Workflow de referência: ver `workflows/engineering/frontend/`",
    "",
    "---",
  ].join("\n");
  const d = parseDeclaration("agent", text);
  assert.equal(d.declared, true);
  assert.deepEqual(d.rows.map((r) => r.targets[0].name), [
    "eng-qa-test-plan", "eng-backend", "eng-frontend", "eng.qa.testing-engineer", "eng.qa-quality-report",
  ]);
  assert.equal(d.rows[0].available, true);
  assert.equal(d.rows[0].condicao, "Para análise de cobertura");
  assert.equal(d.rows[3].available, false);
});

test("buildIndex: workflows, skills e agentes de um framework mínimo (sem archive, README, AGENTS)", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-map-"));
  try {
    for (const d of ["workflows/engineering", "skills/s-a", "agents/engineering", "agents/archive"]) mkdirSync(join(dir, d), { recursive: true });
    writeFileSync(join(dir, "workflows/engineering/w-a.md"), "x");
    writeFileSync(join(dir, "workflows/README.md"), "x");
    writeFileSync(join(dir, "skills/s-a/SKILL.md"), "x");
    writeFileSync(join(dir, "skills/AGENTS.md"), "x");
    writeFileSync(join(dir, "agents/engineering/a-a.md"), "x");
    writeFileSync(join(dir, "agents/archive/velho.md"), "x");
    const { items, duplicates } = buildIndex(dir);
    assert.deepEqual([...items.keys()].sort(), ["a-a", "s-a", "w-a"]);
    assert.equal(items.get("s-a").path, "skills/s-a/SKILL.md");
    assert.deepEqual(duplicates, []);
    writeFileSync(join(dir, "agents/engineering/w-a.md"), "x");
    assert.deepEqual(buildIndex(dir).duplicates, ["w-a"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("framework real: índice sem duplicados e todos os artefatos declaram chamadas", () => {
  const { items, duplicates } = buildIndex(root);
  assert.deepEqual(duplicates, []);
  const porTipo = (t) => [...items.values()].filter((i) => i.type === t).length;
  assert.ok(porTipo("workflow") >= 46 && porTipo("skill") >= 50 && porTipo("agent") >= 17);
  const semDeclaracao = [...items.values()].filter(
    (i) => !parseDeclaration(i.type, readFileSync(join(root, i.path), "utf-8")).declared,
  );
  assert.deepEqual(semDeclaracao.map((i) => i.name), []);
});
