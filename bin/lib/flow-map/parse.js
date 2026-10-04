/**
 * @fileoverview Leitor das declarações padronizadas de chamadas.
 *
 * Só lê a estrutura (sem interpretar prosa, sem IA):
 * - workflows e skills: tabela `| Passo | Skill | Condição |` sob
 *   `### Skills invocados durante o workflow` (ou `... durante a execução do skill`);
 * - agentes: `## Skills Disponíveis` (`### {skill}`) e `## Workflows e Agentes Relacionados`.
 * @module flow-map/parse
 */

export const WORKFLOW_TITLE = "Skills invocados durante o workflow";
export const SKILL_TITLE = "Skills invocados durante a execução do skill";

/**
 * @typedef {Object} Target
 * @property {"internal" | "agent" | "cli" | "mcp" | "external" | "unresolved"} kind
 * @property {string} name
 */

/**
 * @typedef {Object} Row
 * @property {string | null} passo
 * @property {string} condicao
 * @property {Target[]} targets
 * @property {string | null} via - Texto de `(via ...)`, quando houver
 * @property {"quebrada" | "a confirmar" | null} marker
 * @property {boolean} selfContained - Linha "Nenhuma — … autocontido"
 * @property {boolean} available - Skill que o agente pode usar (não é chamada fixa)
 */

/** Troca o conteúdo dos blocos de código por linhas em branco (títulos dentro deles não valem). */
function stripFences(text) {
  let fence = false;
  return text
    .split("\n")
    .map((line) => {
      if (line.trimStart().startsWith("```")) {
        fence = !fence;
        return "";
      }
      return fence ? "" : line;
    })
    .join("\n");
}

/** Divide uma linha de tabela em células, ignorando `|` dentro de crases. */
export function splitCells(line) {
  const cells = [];
  let current = "";
  let inCode = false;
  for (const ch of line.trim()) {
    if (ch === "`") inCode = !inCode;
    if (ch === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  if (cells[0] === "") cells.shift();
  if (cells[cells.length - 1] === "") cells.pop();
  return cells;
}

/**
 * Classifica a célula `Skill` de uma linha da tabela.
 * @param {string} cell
 * @returns {{ targets: Target[], via: string | null, marker: Row["marker"], selfContained: boolean }}
 */
export function classifyCell(cell) {
  const text = cell.trim();
  if (/^nenhuma/i.test(text)) return { targets: [], via: null, marker: null, selfContained: true };

  const marker = /refer[eê]ncia quebrada/i.test(text)
    ? "quebrada"
    : /refer[eê]ncia a confirmar/i.test(text)
      ? "a confirmar"
      : null;

  let via = null;
  let analyzed = text;
  const viaMatch = text.match(/\(via\s+([^)]*)\)/);
  if (viaMatch) {
    via = viaMatch[1].replace(/`/g, "").trim();
    analyzed = text.replace(viaMatch[0], "");
  }

  const spans = [...analyzed.matchAll(/`([^`]+)`(\s*\(agente\))?/g)];
  const targets = [];
  const external = /skill externo/i.test(analyzed); // skill de fora do framework: não está no índice

  if (/\(MCP/.test(analyzed) && spans[0]) {
    targets.push({ kind: "mcp", name: spans[0][1].trim() });
    return { targets, via, marker, selfContained: false };
  }

  for (const span of spans) {
    const token = span[1].trim();
    if (span[2]) targets.push({ kind: "agent", name: token });
    else if (token.startsWith("/")) {
      targets.push({ kind: external ? "external" : "internal", name: token.slice(1).split(/\s+/)[0] });
    }
    else if (/^(jarvis|node)\s/.test(token)) targets.push({ kind: "cli", name: token });
    else if (token.startsWith("mcp__")) targets.push({ kind: "mcp", name: token });
    // Read, Grep, Glob e texto livre não são chamadas a artefatos: ignorados
  }

  if (marker && targets.length === 0 && spans[0]) {
    targets.push({ kind: "unresolved", name: spans[0][1].trim() });
  }
  return { targets, via, marker, selfContained: false };
}

function parseTable(text, title) {
  const lines = stripFences(text).split("\n");
  const start = lines.findIndex((l) => l.trim() === `### ${title}`);
  if (start === -1) return null;
  const rows = [];
  let i = start + 1;
  while (i < lines.length && !lines[i].startsWith("|")) {
    if (/^#{1,3} /.test(lines[i])) return rows;
    i++;
  }
  i += 2; // cabeçalho e separador
  for (; i < lines.length && lines[i].startsWith("|"); i++) {
    const [passo = "", skill = "", condicao = ""] = splitCells(lines[i]);
    const c = classifyCell(skill);
    rows.push({
      passo,
      condicao,
      targets: c.targets,
      via: c.via,
      marker: c.marker,
      selfContained: c.selfContained,
      available: false,
    });
  }
  return rows;
}

function section(text, title) {
  const m = text.match(new RegExp(`^## ${title}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n---\\s*\\n|(?![\\s\\S]))`, "m"));
  return m ? m[1] : null;
}

function parseAgent(text) {
  const clean = stripFences(text);
  const rows = [];

  const skills = section(clean, "Skills Disponíveis");
  if (skills !== null) {
    for (const block of skills.split(/^### /m).slice(1)) {
      const [heading, ...rest] = block.split("\n");
      // Um bloco pode citar mais de uma skill: uma linha por skill (nome tirado do caminho do SKILL.md).
      const names = [...new Set([...block.matchAll(/skills\/([A-Za-z0-9._-]+)\/SKILL\.md/g)].map((m) => m[1]))];
      if (names.length === 0) {
        const token = heading.trim().split(/[\s(]/)[0];
        if (/[-.]/.test(token)) names.push(token);
      }
      const context = rest.map((l) => l.trim()).find((l) => l && !l.startsWith("- ")) ?? "";
      for (const name of names) {
        rows.push({
          passo: null,
          condicao: context.replace(/:$/, ""),
          targets: [{ kind: "internal", name }],
          via: null,
          marker: null,
          selfContained: false,
          available: true,
        });
      }
    }
  }

  const related = section(clean, "Workflows e Agentes Relacionados");
  if (related !== null) {
    for (const line of related.split("\n")) {
      if (!/^- /.test(line) || /^- Arquivo:/.test(line)) continue;
      const bold = line.match(/\*\*([^*]+)\*\*/);
      const code = line.match(/`([^`]+)`/);
      let name = bold ? bold[1] : code ? code[1] : null;
      if (!name) continue;
      if (name.includes("/")) {
        if (!name.endsWith(".md")) continue;
        name = name.split("/").pop().replace(/\.md$/, "");
      }
      const condicao = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : "";
      rows.push({
        passo: null,
        condicao,
        targets: [{ kind: "internal", name }],
        via: null,
        marker: null,
        selfContained: false,
        available: false,
      });
    }
  }

  const declared = skills !== null || related !== null;
  return { declared, selfContained: declared && rows.length === 0, rows };
}

/**
 * Lê as chamadas declaradas por um artefato.
 * @param {"workflow" | "skill" | "agent"} type
 * @param {string} text
 * @returns {{ declared: boolean, selfContained: boolean, rows: Row[] }}
 */
export function parseDeclaration(type, text) {
  if (type === "agent") return parseAgent(text);
  const rows = parseTable(text, type === "workflow" ? WORKFLOW_TITLE : SKILL_TITLE);
  if (rows === null) return { declared: false, selfContained: false, rows: [] };
  const hasTargets = rows.some((r) => r.targets.length > 0);
  return { declared: true, selfContained: rows.some((r) => r.selfContained) && !hasTargets, rows };
}
