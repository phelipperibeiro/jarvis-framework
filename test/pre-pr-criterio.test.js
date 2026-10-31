// Confere a consistência do critério de parada e da rodada incremental do /eng.pre-pr (#191, #195): o mesmo
// valor escrito em mais de um arquivo (rótulos da variante B e da pergunta do teto, teto de rodadas por urgência) e a numeração
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
  // Só o trecho da variante B: "Só gerar o relatório" também é opção da variante A.
  const fechamento = secao(read(PRE_PR), "## Fechamento");
  const inicio = fechamento.indexOf("**Variante B.**");
  assert.notEqual(inicio, -1, `${PRE_PR}: o Fechamento sem "**Variante B.**". ${DE_PROPOSITO}`);
  const fim = fechamento.indexOf("   Grave as decisões", inicio);
  const varianteB = fechamento.slice(inicio, fim === -1 ? undefined : fim);
  const opcoes = varianteB.split("\n").filter((l) => /^ {3}- \*\*/.test(l));
  assert.equal(
    opcoes.length,
    rotulos.length,
    `${PRE_PR}: a variante B tem ${opcoes.length} opções, a tabela de transições tem ${rotulos.length}. ${DE_PROPOSITO}`
  );
  for (const rotulo of rotulos) {
    assert.ok(
      opcoes.some((l) => l.includes(`**${rotulo}`)),
      `${PRE_PR}: a variante B não tem a opção "${rotulo}" da tabela de transições. ${DE_PROPOSITO}`
    );
  }
});

test("os rótulos da pergunta do teto na tabela de transições são os mesmos do fechamento", () => {
  const linha = read(TRANSITIONS)
    .split("\n")
    .find((l) => l.startsWith("| `eng.pre-pr` |") && l.includes("Teto de rodadas atingido"));
  assert.ok(linha, `${TRANSITIONS} sem a linha da pergunta do teto do eng.pre-pr. ${DE_PROPOSITO}`);
  const celulas = linha.split("|").map((c) => c.trim());
  const rotulos = celulas[celulas.length - 2]
    .split(" · ")
    .map((r) => r.replace(/\s*\(como hoje\)$/, "").trim());
  assert.equal(
    rotulos.length,
    3,
    `${TRANSITIONS}: a pergunta do teto deveria ter 3 opções. ${DE_PROPOSITO}`
  );
  // Só o bloco da pergunta do teto: os rótulos das variantes A e B ficam de fora.
  const fechamento = secao(read(PRE_PR), "## Fechamento");
  const inicio = fechamento.indexOf("**Pergunta do teto.**");
  assert.notEqual(inicio, -1, `${PRE_PR}: o Fechamento sem "**Pergunta do teto.**". ${DE_PROPOSITO}`);
  const fim = fechamento.indexOf("   Grave a escolha", inicio);
  const bloco = fechamento.slice(inicio, fim === -1 ? undefined : fim);
  const opcoes = bloco.split("\n").filter((l) => /^ {3}- \*\*/.test(l));
  assert.equal(
    opcoes.length,
    rotulos.length,
    `${PRE_PR}: a pergunta do teto tem ${opcoes.length} opções, a tabela de transições tem ${rotulos.length}. ${DE_PROPOSITO}`
  );
  for (const rotulo of rotulos) {
    assert.ok(
      opcoes.some((l) => l.includes(`**${rotulo}`)),
      `${PRE_PR}: a pergunta do teto não tem a opção "${rotulo}" da tabela de transições. ${DE_PROPOSITO}`
    );
  }
  // A pergunta e os rótulos também estão escritos na rule: ela não pode ficar defasada.
  const pergunta = "Teto de {T} rodadas da urgência `{u}` atingido. Como seguir?";
  for (const arquivo of [PRE_PR, PRE_PR_RULES, TRANSITIONS]) {
    assert.ok(
      read(arquivo).includes(pergunta),
      `${arquivo} sem a pergunta do teto "${pergunta}". ${DE_PROPOSITO}`
    );
  }
  for (const rotulo of rotulos) {
    assert.ok(
      read(PRE_PR_RULES).includes(`**${rotulo}`),
      `${PRE_PR_RULES} sem o rótulo "${rotulo}" da pergunta do teto. ${DE_PROPOSITO}`
    );
  }
});

test("a variante B tem os rótulos de cada caso e a condição dela é a mesma nos três arquivos", () => {
  const fechamento = secao(read(PRE_PR), "## Fechamento");
  for (const rotulo of [
    "Aceitar as 🟡 e as ⚪ e seguir para o PR",
    "Aceitar as ⚪ e decidir as 🟡 uma a uma",
    "Decidir as 🟡 uma a uma",
  ]) {
    assert.ok(
      fechamento.includes(rotulo),
      `${PRE_PR}: a variante B sem o rótulo "${rotulo}". ${DE_PROPOSITO}`
    );
  }
  for (const arquivo of [PRE_PR, PRE_PR_RULES, TRANSITIONS]) {
    assert.ok(
      read(arquivo).includes("com o critério de parada atingido"),
      `${arquivo}: a condição da variante B sem "com o critério de parada atingido". ${DE_PROPOSITO}`
    );
  }
});

test('o modelo do relatório e a rule usam o "(item N)" que a rodada incremental lê', () => {
  assert.match(
    read(PRE_PR),
    /^\| 1 \| \{o que falta ou está errado\} \(item \{N\}\) \|/m,
    `${PRE_PR}: a linha do modelo da tabela de lacunas sem "(item {N})". ${DE_PROPOSITO}`
  );
  assert.ok(
    read(PRE_PR).includes("(não reavaliada nesta rodada) (item N)"),
    `${PRE_PR}: a cópia das pendentes sem o formato "(não reavaliada nesta rodada) (item N)". ${DE_PROPOSITO}`
  );
  assert.ok(
    read(PRE_PR_RULES).includes("(item N)"),
    `${PRE_PR_RULES} sem "(item N)". ${DE_PROPOSITO}`
  );
});

test("os textos de decisão da variante B são os mesmos no workflow e na rule", () => {
  for (const texto of [
    "👍 Aceitar: aceito no fechamento da rodada {N}",
    "👍 Aceitar: teto de rodadas atingido na rodada {N}",
  ]) {
    for (const arquivo of [PRE_PR, PRE_PR_RULES]) {
      assert.ok(read(arquivo).includes(texto), `${arquivo} sem "${texto}". ${DE_PROPOSITO}`);
    }
  }
});

test("o registro da escolha no teto e das rodadas além do teto é o mesmo no workflow e na rule", () => {
  for (const texto of ["escolha no teto:", "além do teto, por decisão da pessoa"]) {
    for (const arquivo of [PRE_PR, PRE_PR_RULES]) {
      assert.ok(read(arquivo).includes(texto), `${arquivo} sem "${texto}". ${DE_PROPOSITO}`);
    }
  }
  // O PR Brief e o Resumo do modelo registram as duas coisas.
  const modelo = read(PRE_PR);
  assert.match(
    modelo,
    /^Critério de parada: .*escolha no teto: .*além do teto, por decisão da pessoa/m,
    `${PRE_PR}: a linha do Resumo sem a escolha no teto e as rodadas além do teto. ${DE_PROPOSITO}`
  );
  assert.match(
    modelo,
    /^- Rodadas do pre-pr: .*além do teto, por decisão da pessoa/m,
    `${PRE_PR}: o PR Brief sem as rodadas além do teto. ${DE_PROPOSITO}`
  );
});

test("cada área da tabela da rodada incremental é uma área do modelo do relatório", () => {
  const texto = read(PRE_PR);
  const modelo = texto.match(/^### \{Área: (.+)\}$/m);
  assert.ok(modelo, `${PRE_PR}: o modelo sem "### {Área: …}". ${DE_PROPOSITO}`);
  const areas = new Set(modelo[1].split(" | ").map((a) => a.trim()));
  const linhas = secao(texto, "### Rodada incremental")
    .split("\n")
    .filter((l) => /^\s*\| [^|]*\(\d+\) \|/.test(l));
  assert.ok(linhas.length > 0, `${PRE_PR}: a tabela da rodada incremental sumiu. ${DE_PROPOSITO}`);
  for (const linha of linhas) {
    const area = linha.split("|")[2].trim();
    assert.ok(
      areas.has(area),
      `${PRE_PR}: a área "${area}" da rodada incremental não está no modelo do relatório. ${DE_PROPOSITO}`
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
