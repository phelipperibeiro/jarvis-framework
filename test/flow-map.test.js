// Testes do mapa de chamadas (jarvis map). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "../bin/lib/flow-map/index.js";
import { parseDeclaration, classifyCell, splitCells } from "../bin/lib/flow-map/parse.js";
import { buildGraph, forwardTree, reverseEdges, findBrokenReferences, suggest } from "../bin/lib/flow-map/tree.js";
import { renderTree, renderReverse, summarizeCondition } from "../bin/lib/flow-map/render.js";
import { runMap } from "../bin/commands/map.js";

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
  assert.deepEqual(classifyCell("`/triage-issue` (skill externo `atlassian:triage-issue`)").targets, [
    { kind: "external", name: "triage-issue" },
  ]);
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
  assert.ok(porTipo("workflow") >= 46 && porTipo("skill") >= 49 && porTipo("agent") >= 16);
  const semDeclaracao = [...items.values()].filter(
    (i) => !parseDeclaration(i.type, readFileSync(join(root, i.path), "utf-8")).declared,
  );
  assert.deepEqual(semDeclaracao.map((i) => i.name), []);
});

// ---------- árvore, saída e comando ----------

const skillTable = (rows) =>
  `# S\n\n### Skills invocados durante a execução do skill\n\n| Passo | Skill | Condição |\n|-------|-------|----------|\n${rows.join("\n")}\n`;

/** Framework de exemplo: ciclo, menu, repetição, CLI, MCP, quebrada, autocontido, sem declaração. */
function frameworkDeExemplo() {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-map-"));
  const w = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  w("workflows/engineering/w-main.md", wf([
    "| Fase 1 | `/s-a` | Se `X=1` |",
    "| Fase 2 | `/s-c` e `/s-e` | Se o usuário escolher |",
    "| Fase 3 | `ag-x` (agente) | Sempre |",
    "| Fase 4 | `jarvis docs sync` (CLI do Jarvis) | Se houver docs |",
    "| Fase 5 | `context7` (MCP: `query-docs`) | Para pesquisar |",
    "| Fase 6 | `/nao-existe` | Quando der |",
    "| Fase 7 | `Jira MCP` (referência a confirmar) | Se Jira |",
    "| Fase 8 | `/s-d` | Sempre |",
  ]));
  w("workflows/engineering/w-solo.md", wf(["| — | Nenhuma — workflow autocontido | — |"]));
  w("workflows/engineering/w-deep.md", wf(["| 1 | `/s-1` | Sempre |"]));
  for (const [a, b] of [["s-1", "s-2"], ["s-2", "s-3"], ["s-3", "s-4"], ["s-4", "s-5"]]) {
    w(`skills/${a}/SKILL.md`, skillTable([`| 1 | \`/${b}\` | Sempre |`]));
  }
  w("skills/s-5/SKILL.md", skillTable(["| — | Nenhuma — skill autocontida | — |"]));
  w("skills/s-a/SKILL.md", skillTable(["| 1 | `/s-b` | Sempre |"]));
  w("skills/s-b/SKILL.md", skillTable(["| 1 | `/s-a` | Sempre |"]));
  w("skills/s-c/SKILL.md", skillTable(["| — | Nenhuma — skill autocontida | — |"]));
  w("skills/s-e/SKILL.md", skillTable(["| 1 | `/s-c` | Se precisar |"]));
  w("skills/s-d/SKILL.md", "# Sem tabela\n");
  w("agents/engineering/ag-x.md", "## Skills Disponíveis\n\n### s-c\nPara tarefas simples:\n- Arquivo: `$IDE/skills/s-c/SKILL.md`\n");
  return dir;
}

const find = (node, name) => {
  if (node.name === name) return node;
  for (const c of node.children) {
    const r = find(c, name);
    if (r) return r;
  }
  return null;
};

test("forwardTree: menu, CLI, MCP, quebrada, a confirmar, agente e sem declaração", () => {
  const dir = frameworkDeExemplo();
  try {
    const tree = forwardTree(buildGraph(dir), "w-main");
    const kinds = Object.fromEntries(tree.children.map((c) => [c.name, c.kind]));
    assert.equal(kinds["s-a"], "skill");
    assert.equal(kinds["menu (2 opções)"], "menu");
    assert.equal(kinds["ag-x"], "agent");
    assert.equal(kinds["jarvis docs sync"], "cli");
    assert.equal(kinds["context7"], "mcp");
    assert.equal(kinds["nao-existe"], "broken");
    assert.equal(kinds["Jira MCP"], "unresolved");
    assert.equal(tree.children.find((c) => c.name === "s-a").condicao, "Se `X=1`");
    assert.deepEqual(tree.children.find((c) => c.kind === "menu").children.map((c) => c.name), ["s-c", "s-e"]);
    assert.equal(find(tree, "s-d").status, "undeclared");
    assert.equal(find(tree, "Jira MCP").marker, "a confirmar");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forwardTree: ciclo e repetição", () => {
  const dir = frameworkDeExemplo();
  try {
    const tree = forwardTree(buildGraph(dir), "w-main");
    const sb = find(tree, "s-b");
    assert.equal(sb.children[0].name, "s-a");
    assert.equal(sb.children[0].status, "cycle");
    // s-c aparece no menu (expandido) e de novo no agente (já mapeado)
    const scs = [];
    (function collect(n) { if (n.name === "s-c") scs.push(n); n.children.forEach(collect); })(tree);
    assert.equal(scs.length >= 2, true);
    assert.equal(scs.filter((n) => n.status === "seen").length >= 1, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forwardTree: profundidade, autocontido", () => {
  const dir = frameworkDeExemplo();
  try {
    const graph = buildGraph(dir);
    const limited = forwardTree(graph, "w-deep", { depth: 2 });
    assert.equal(find(limited, "s-2").status, "truncated");
    assert.equal(find(limited, "s-3"), null);
    const full = forwardTree(graph, "w-deep");
    assert.equal(find(full, "s-4").status, "truncated"); // nível 4 é o último; s-5 fica de fora
    assert.equal(forwardTree(graph, "w-solo").status, "selfContained");
    assert.equal(forwardTree(graph, "s-d").status, "undeclared");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("renderTree: conectores, condição e notas", () => {
  const dir = frameworkDeExemplo();
  try {
    const lines = renderTree(forwardTree(buildGraph(dir), "w-main"));
    assert.equal(lines[0], "w-main [workflow]");
    assert.match(lines.find((l) => l.includes("s-a [skill]")), /^├── s-a \[skill\]  \(se X=1\)$/);
    assert.ok(lines.some((l) => l.startsWith("└── ") && l.includes("s-d")));
    assert.ok(lines.some((l) => l.includes("jarvis docs sync [CLI]")));
    assert.ok(lines.some((l) => l.includes("context7 [MCP]")));
    assert.ok(lines.some((l) => l.includes("nao-existe [?]") && l.includes("referência quebrada")));
    assert.ok(lines.some((l) => l.includes("referência a confirmar")));
    assert.ok(lines.some((l) => l.includes("ciclo: já mapeado acima")));
    assert.deepEqual(renderTree(forwardTree(buildGraph(dir), "w-solo")), [
      "w-solo [workflow]",
      "└── (autocontido: não chama nenhum outro item)",
    ]);
    assert.ok(renderTree(forwardTree(buildGraph(dir), "s-d")).join("\n").includes("sem declaração de chamadas"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("summarizeCondition: sem crases, minúscula e limite", () => {
  assert.equal(summarizeCondition("Se `ENABLE_CDD=true` no ENV.md"), "se ENABLE_CDD=true no ENV.md");
  assert.equal(summarizeCondition("—"), "");
  assert.ok(summarizeCondition("x".repeat(200)).length <= 90);
  assert.ok(summarizeCondition("x".repeat(200)).endsWith("…"));
});

test("suggest: prefixo, trecho e erro de digitação", () => {
  const items = new Map(["eng.start", "eng.plan", "eng-qa-gate", "warm-up"].map((n) => [n, {}]));
  assert.deepEqual(suggest(items, "eng.sta"), ["eng.start"]);
  assert.ok(suggest(items, "warmup").includes("warm-up"));
  assert.deepEqual(suggest(items, "zzzzzzzzzz"), []);
});

test("runMap: uso, profundidade inválida, nome inexistente com sugestões e sucesso", () => {
  const dir = frameworkDeExemplo();
  try {
    assert.equal(runMap(undefined, {}, dir).code, 1);
    assert.equal(runMap("w-main", { depth: "abc" }, dir).code, 1);
    assert.equal(runMap("w-main", { depth: "0" }, dir).code, 1);
    const missing = runMap("w-mai", {}, dir);
    assert.equal(missing.code, 1);
    assert.ok(missing.lines.join("\n").includes("w-main"));
    const ok = runMap("w-main", { depth: "3" }, dir);
    assert.equal(ok.code, 0);
    assert.equal(ok.lines[0], "w-main [workflow]");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("framework real: eng.start, warm-up, eng-qa-gate e eng.agent mapeiam", () => {
  const start = runMap("eng.start", {}, root);
  assert.equal(start.code, 0);
  const startText = start.lines.join("\n");
  assert.match(startText, /jarvis-context-detect \[skill\]  \(se ENABLE_CDD=true/);
  assert.match(startText, /via eng\.specializations-rules\.md/);

  const warm = runMap("warm-up", {}, root);
  assert.equal(warm.code, 0);
  assert.ok(warm.lines.filter((l) => l.includes("menu (")).length >= 6);

  assert.equal(runMap("eng-qa-gate", {}, root).code, 0);
  const agent = runMap("eng.agent", {}, root);
  assert.equal(agent.code, 0);
  assert.ok(agent.lines.some((l) => l.includes("disponível")));
});

test("reverseEdges e renderReverse: com e sem chamadores", () => {
  const dir = frameworkDeExemplo();
  try {
    const graph = buildGraph(dir);
    const edges = reverseEdges(graph, "s-c");
    assert.deepEqual(edges.map((e) => e.from), ["ag-x", "s-e", "w-main"]);
    assert.equal(edges.find((e) => e.from === "ag-x").available, true);
    assert.equal(edges.find((e) => e.from === "w-main").passo, "Fase 2");

    const lines = renderReverse("s-c", "skill", edges);
    assert.equal(lines[0], "Quem chama s-c [skill]");
    assert.match(lines[1], /^├── ag-x \[agente\]  \(disponível; /);
    assert.ok(lines[3].startsWith("└── w-main [workflow]  (passo: Fase 2;"));

    assert.deepEqual(renderReverse("w-deep", "workflow", reverseEdges(graph, "w-deep")), [
      "Quem chama w-deep [workflow]",
      "└── nenhum artefato chama w-deep — pode ser um ponto de entrada",
    ]);
    assert.ok(runMap("s-c", { reverse: true }, dir).lines[0].startsWith("Quem chama s-c"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("findBrokenReferences: erro para nome inexistente, aviso para marcado e sem declaração", () => {
  const dir = frameworkDeExemplo();
  try {
    const { errors, warnings } = findBrokenReferences(buildGraph(dir));
    assert.deepEqual(errors.map((e) => e.name), ["nao-existe"]);
    assert.equal(errors[0].file, "workflows/engineering/w-main.md");
    assert.ok(warnings.some((w) => w.name === "Jira MCP" && /a confirmar/.test(w.reason)));
    assert.ok(warnings.some((w) => w.name === "s-d" && /sem declaração/.test(w.reason)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("framework real: nenhuma referência quebrada nas tabelas", () => {
  const { errors } = findBrokenReferences(buildGraph(root));
  assert.deepEqual(errors, []);
});
