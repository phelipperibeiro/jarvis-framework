// Confere a consistência do critério de parada e da rodada incremental do /eng.pre-pr (#191): o mesmo
// valor escrito em mais de um arquivo (rótulos da variante B, teto de rodadas por urgência) e a numeração
// dos gates citada em três lugares do workflow. Guarda só o texto (a prosa não tem teste de comportamento).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const PRE_PR = "workflows/engineering/eng.pre-pr.md";
const PRE_PR_RULES = "rules-on-demand/engineering/eng.pre-pr-rules.md";
const TRANSITIONS = "rules-on-demand/engineering/eng.transitions-rules.md";
const CONTEXT_DETECT = "skills/jarvis-context-detect/SKILL.md";

// A mensagem de falha diz que o valor é guardado de propósito: mudar num arquivo pede mudar nos outros e no teste.
const DE_PROPOSITO =
  "O critério de parada do pre-pr é guardado de propósito (#191): ao mudá-lo, atualize os outros arquivos e test/pre-pr-criterio.test.js junto.";

// Trecho entre o título `de` e o próximo título do mesmo nível (ou o fim do arquivo).
function secao(texto, titulo) {
  const linhas = texto.split("\n");
  const inicio = linhas.findIndex((l) => l === titulo);
  assert.notEqual(inicio, -1, `seção não encontrada: ${titulo}. ${DE_PROPOSITO}`);
  const nivel = titulo.match(/^#+/)[0];
  const fim = linhas.findIndex(
    (l, i) => i > inicio && new RegExp(`^#{1,${nivel.length}} `).test(l)
  );
  return linhas.slice(inicio, fim === -1 ? undefined : fim).join("\n");
}

test("os rótulos da variante B na tabela de transições são os mesmos do fechamento", () => {
  const linha = read(TRANSITIONS)
    .split("\n")
    .find((l) => l.startsWith("| `eng.pre-pr` |") && l.includes("Variante B"));
  assert.ok(linha, `${TRANSITIONS} sem a linha da variante B do eng.pre-pr. ${DE_PROPOSITO}`);
  const celulas = linha.split("|").map((c) => c.trim());
  const rotulos = celulas[celulas.length - 2]
    .split(" · ")
    .map((r) => r.replace(/\s*\(como hoje\)$/, "").trim());
  assert.equal(
    rotulos.length,
    3,
    `${TRANSITIONS}: a variante B deveria ter 3 opções. ${DE_PROPOSITO}`
  );
  const fechamento = secao(read(PRE_PR), "## Fechamento");
  for (const rotulo of rotulos) {
    assert.ok(
      fechamento.includes(`**${rotulo}`),
      `${PRE_PR}: o Fechamento não tem a opção "${rotulo}" da tabela de transições. ${DE_PROPOSITO}`
    );
  }
});

test("o teto de rodadas por urgência é o mesmo no workflow e na rule, com as urgências do context.md", () => {
  const TETO = /`alta` (\d+) · `normal` (\d+) · `baixa` (\d+)/;
  const doWorkflow = read(PRE_PR).match(TETO);
  const daRule = read(PRE_PR_RULES).match(TETO);
  assert.ok(
    doWorkflow,
    `${PRE_PR} sem o teto "\`alta\` N · \`normal\` N · \`baixa\` N". ${DE_PROPOSITO}`
  );
  assert.ok(
    daRule,
    `${PRE_PR_RULES} sem o teto "\`alta\` N · \`normal\` N · \`baixa\` N". ${DE_PROPOSITO}`
  );
  assert.deepEqual(
    daRule.slice(1),
    doWorkflow.slice(1),
    `teto diferente entre o workflow e a rule. ${DE_PROPOSITO}`
  );
  // O teto é lido do campo `urgencia` do context.md, gerado pelo jarvis-context-detect.
  assert.match(
    read(CONTEXT_DETECT),
    /urgencia: \[alta\|normal\|baixa\]/,
    `${CONTEXT_DETECT}: o campo urgencia mudou de valores; o teto do pre-pr depende deles. ${DE_PROPOSITO}`
  );
});

test("a numeração dos gates é a mesma na lista, na tabela de chamadas e na tabela da rodada incremental", () => {
  const texto = read(PRE_PR);
  const lista = secao(texto, "## Gates (revisão)")
    .split("\n")
    .map((l) => l.match(/^(\d+)\. /))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  const esperado = lista.map((_, i) => i + 1);
  assert.deepEqual(
    lista,
    esperado,
    `${PRE_PR}: a lista de gates não vai de 1 a N em ordem. ${DE_PROPOSITO}`
  );

  const chamadas = [...texto.matchAll(/^\| Gates › item (\d+) \|/gm)].map((m) => Number(m[1]));
  assert.deepEqual(
    [...chamadas].sort((a, b) => a - b),
    esperado,
    `${PRE_PR}: a tabela de chamadas não cita cada gate da lista uma vez ("Gates › item N"). ${DE_PROPOSITO}`
  );

  const incremental = secao(texto, "### Rodada incremental")
    .split("\n")
    .filter((l) => /^\s*\| [^|]*\((\d+)\) \|/.test(l))
    .map((l) => Number(l.match(/\((\d+)\) \|/)[1]));
  assert.deepEqual(
    [...incremental].sort((a, b) => a - b),
    esperado,
    `${PRE_PR}: a tabela da rodada incremental não cobre cada gate da lista uma vez ("Gate (N)"). ${DE_PROPOSITO}`
  );
});
