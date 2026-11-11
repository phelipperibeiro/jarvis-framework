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
const GUIA_PRE_PR = "docs/engenharia/eng.pre-pr.md";
const WORK = "workflows/engineering/eng.work.md";

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
    4,
    `${TRANSITIONS}: a variante B deveria ter 4 opções. ${DE_PROPOSITO}`
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
  // Mesma ordem nos dois arquivos: a ordem é decisão de produto (#191 e #259: Aceitar, depois Corrigir e seguir).
  rotulos.forEach((rotulo, i) => {
    assert.ok(
      opcoes[i].includes(`**${rotulo}`),
      `${PRE_PR}: a ${i + 1}ª opção da variante B deveria ser "${rotulo}", como na tabela de transições. ${DE_PROPOSITO}`
    );
  });
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
    "Corrigir as 🟡 e as ⚪ e seguir para o PR",
    "Corrigir as 🟡 e seguir para o PR",
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

test("a opção \"Corrigir … e seguir para o PR\" (#259): linha do PR Brief, rule, guia e o atalho pelo /eng.work", () => {
  const prePr = read(PRE_PR);
  // A linha do modelo do PR Brief, gravada antes do /eng.work: "Mandadas corrigir" vale mesmo se ele parar.
  assert.match(
    prePr,
    /^- Mandadas corrigir depois da rodada \{N\}, sem nova rodada do pre-pr: \{lista\}/m,
    `${PRE_PR}: o modelo do PR Brief sem a linha "Mandadas corrigir … sem nova rodada do pre-pr". ${DE_PROPOSITO}`
  );
  // A rule e o guia citam a opção.
  assert.ok(
    read(PRE_PR_RULES).includes("Corrigir … e seguir para o PR"),
    `${PRE_PR_RULES} sem a opção "Corrigir … e seguir para o PR". ${DE_PROPOSITO}`
  );
  for (const rotulo of ["Corrigir as ⚪ e seguir para o PR", "Corrigir as 🟡 e as ⚪ e seguir para o PR"]) {
    assert.ok(read(GUIA_PRE_PR).includes(rotulo), `${GUIA_PRE_PR} sem "${rotulo}". ${DE_PROPOSITO}`);
  }
  // O atalho depende de rótulos do /eng.work: a opção "Rodar o /eng.pr" do "Depois do work" e a pergunta da retomada.
  const work = read(WORK);
  const depois = work.split("\n").find((l) => l.startsWith("| **Depois do work** |"));
  assert.ok(depois, `${WORK} sem a linha "Depois do work" da 1.3. ${DE_PROPOSITO}`);
  assert.ok(
    depois.includes("**Rodar o `/eng.pr`**"),
    `${WORK}: o "Depois do work" sem a opção "Rodar o \`/eng.pr\`", que o atalho do pre-pr cita. ${DE_PROPOSITO}`
  );
  assert.ok(work.includes("Manter as escolhas"), `${WORK} sem a pergunta "Manter as escolhas". ${DE_PROPOSITO}`);
  assert.ok(
    prePr.includes("no \"Depois do work\", \"Rodar o `/eng.pr`\"") && prePr.includes("\"Manter as escolhas?\""),
    `${PRE_PR}: a opção nova sem o aviso de "Mudar" para "Rodar o \`/eng.pr\`". ${DE_PROPOSITO}`
  );
});

test("os textos de decisão da variante B são os mesmos no workflow e na rule", () => {
  for (const texto of [
    "👍 Aceitar: aceito no fechamento da rodada {N}",
    "👍 Aceitar: teto de rodadas atingido na rodada {N}",
    "sem nova rodada do pre-pr",
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

// A pergunta de merge do fim do eng.pr (#255, #268): o --force (o caminho mais usado) em primeiro, o "como hoje"
// presente e o "rodo depois" por último, mostrando os dois comandos.
const MERGE_FORCE =
  "As opções da pergunta de merge do eng.pr são guardadas de propósito (#255, #268): ao mudá-las, atualize a eng.transitions-rules.md, o workflows/engineering/eng.pr.md e este teste junto.";
const RODO_DEPOIS = "Sim, mas rodo o `/eng.spec-consolidate` depois";

test("a pergunta de merge do eng.pr tem o --force primeiro e o \"rodo depois\" por último, com os mesmos rótulos no workflow (#255, #268)", () => {
  const linha = read(TRANSITIONS)
    .split("\n")
    .find((l) => l.startsWith("| `eng.pr` | Fim |") && l.includes("aprovado e mergeado"));
  assert.ok(linha, `${TRANSITIONS} sem a linha da pergunta de merge do eng.pr. ${MERGE_FORCE}`);
  const celulas = linha.split("|").map((c) => c.trim());
  const opcoes = celulas[celulas.length - 2].split(" · ").map((o) => o.trim());
  assert.equal(opcoes.length, 4, `${TRANSITIONS}: a pergunta de merge deveria ter 4 opções. ${MERGE_FORCE}`);
  assert.match(opcoes[0], /--force/, `a primeira opção da pergunta de merge deve ser a do --force. ${MERGE_FORCE}`);
  assert.ok(
    opcoes.includes("Ainda não (como hoje)"),
    `a pergunta de merge deve manter "Ainda não (como hoje)", o fluxo de quem não escolhe. ${MERGE_FORCE}`
  );
  assert.equal(opcoes[3], RODO_DEPOIS, `a última opção da pergunta de merge deve ser "${RODO_DEPOIS}". ${MERGE_FORCE}`);
  // No workflow, as 4 opções aparecem como `**{opção}:**`, na mesma ordem da tabela.
  const workflow = read("workflows/engineering/eng.pr.md");
  const posicoes = opcoes.map((opcao) => {
    const i = workflow.indexOf(`**${opcao}:**`);
    assert.ok(i >= 0, `workflows/engineering/eng.pr.md sem a opção "${opcao}" da tabela. ${MERGE_FORCE}`);
    return i;
  });
  assert.deepEqual(
    [...posicoes].sort((x, y) => x - y),
    posicoes,
    `workflows/engineering/eng.pr.md: as opções da pergunta de merge estão fora da ordem da tabela. ${MERGE_FORCE}`
  );
  // O "rodo depois" mostra os dois comandos, para a pessoa copiar o que vai usar (Q1 da #268).
  const rodoDepois = workflow.split("\n").find((l) => l.includes(`**${RODO_DEPOIS}:**`));
  for (const comando of ["`/eng.spec-consolidate {TASK_MANAGER_KEY}`", "`/eng.spec-consolidate {TASK_MANAGER_KEY} --force`"]) {
    assert.ok(
      rodoDepois.includes(comando),
      `workflows/engineering/eng.pr.md: a opção "${RODO_DEPOIS}" sem o comando ${comando}. ${MERGE_FORCE}`
    );
  }
});

// A oferta de documentação do fim do eng.work (#268): o "Sim" é a primeira opção e o padrão, e a oferta nem é feita
// quando o diff já altera o guia de uso do repositório.
const OFERTA_DOCS =
  "A oferta de documentação do eng.work é guardada de propósito (#268): ao mudá-la, atualize a eng.transitions-rules.md, o workflows/engineering/eng.work.md e este teste junto.";

test("a oferta de documentação do eng.work tem o \"Sim\" primeiro e só aparece quando o diff não altera o guia (#268)", () => {
  const linha = read(TRANSITIONS)
    .split("\n")
    .find((l) => l.startsWith("| `eng.work` | Fim (Fase 6.2"));
  assert.ok(linha, `${TRANSITIONS} sem a linha da oferta de documentação do eng.work. ${OFERTA_DOCS}`);
  const celulas = linha.split("|").map((c) => c.trim());
  const opcoes = celulas[celulas.length - 2].split(" · ").map((o) => o.trim());
  assert.deepEqual(
    opcoes,
    ["Sim, gerar ou atualizar agora", "Não, seguir sem atualizar (como hoje)"],
    `${TRANSITIONS}: a oferta de documentação deveria ter o "Sim" primeiro e o "Não" depois. ${OFERTA_DOCS}`
  );
  // No workflow, as opções aparecem como `**{opção}**`, na mesma ordem, e o "Sim" é o padrão.
  const work = read(WORK);
  const sim = work.indexOf("**Sim, gerar ou atualizar agora** (padrão)");
  const nao = work.indexOf("**Não, seguir sem atualizar (como hoje)**");
  assert.ok(sim >= 0, `${WORK} sem "**Sim, gerar ou atualizar agora** (padrão)". ${OFERTA_DOCS}`);
  assert.ok(nao > sim, `${WORK}: o "Não, seguir sem atualizar (como hoje)" deveria vir depois do "Sim". ${OFERTA_DOCS}`);
  // A regra de não fazer a oferta e a linha que a substitui na mensagem final.
  for (const trecho of ["o `CHANGELOG` sozinho não conta", "📚 Documentação: já atualizada nesta entrega"]) {
    assert.ok(work.includes(trecho), `${WORK} sem "${trecho}" (regra de não fazer a oferta). ${OFERTA_DOCS}`);
  }
});

// As escolhas do início do eng.work (#268): "Execução das fases" e "Commits" têm 3 opções cada, com as de
// "tarefa a tarefa" no meio e o padrão (como hoje) em primeiro, iguais na tabela, no workflow e no plan-template.
const ESCOLHAS_INICIO =
  "As escolhas do início do eng.work são guardadas de propósito (#268): ao mudá-las, atualize a eng.transitions-rules.md, o workflows/engineering/eng.work.md (Fase 1.3), o templates/engineering/plan-template.md e este teste junto.";

test("as escolhas do início do eng.work oferecem tarefa a tarefa e um por tarefa, na mesma ordem na tabela e no workflow (#268)", () => {
  const transicoes = read(TRANSITIONS).split("\n");
  const work = read(WORK).split("\n");
  const perguntas = [
    {
      tabela: "| `eng.work` | Início | Execução |",
      workflow: "| **Execução das fases** |",
      rotulos: ["Fase a fase, com aprovação (como hoje)", "Tarefa a tarefa, com aprovação", "Todas de uma vez"],
    },
    {
      tabela: "| `eng.work` | Início | Commits |",
      workflow: "| **Commits** |",
      rotulos: ["Um por fase (como hoje)", "Um por tarefa", "Um commit só ao final"],
    },
  ];
  for (const { tabela, workflow, rotulos } of perguntas) {
    const linha = transicoes.find((l) => l.startsWith(tabela));
    assert.ok(linha, `${TRANSITIONS} sem a linha "${tabela}". ${ESCOLHAS_INICIO}`);
    const celulas = linha.split("|").map((c) => c.trim());
    const opcoes = celulas[celulas.length - 2].split(" · ").map((o) => o.trim());
    assert.equal(opcoes.length, rotulos.length, `${TRANSITIONS}: "${tabela}" deveria ter ${rotulos.length} opções. ${ESCOLHAS_INICIO}`);
    // "Todas de uma vez" traz o parêntese do limite na tabela: a opção começa pelo rótulo.
    rotulos.forEach((rotulo, i) =>
      assert.ok(opcoes[i].startsWith(rotulo), `${TRANSITIONS}: a opção ${i + 1} de "${tabela}" deveria ser "${rotulo}". ${ESCOLHAS_INICIO}`)
    );
    // Na Fase 1.3 do workflow, cada rótulo aparece como `**{rótulo}**`, na mesma ordem.
    const linhaWork = work.find((l) => l.startsWith(workflow));
    assert.ok(linhaWork, `${WORK} sem a linha "${workflow}" da Fase 1.3. ${ESCOLHAS_INICIO}`);
    const posicoes = rotulos.map((rotulo) => {
      const i = linhaWork.indexOf(`**${rotulo}**`);
      assert.ok(i >= 0, `${WORK}: "${workflow}" sem a opção "**${rotulo}**". ${ESCOLHAS_INICIO}`);
      return i;
    });
    assert.deepEqual(
      [...posicoes].sort((x, y) => x - y),
      posicoes,
      `${WORK}: as opções de "${workflow}" estão fora da ordem da tabela. ${ESCOLHAS_INICIO}`
    );
  }
  // O cabeçalho do plan-template grava os valores novos.
  const cabecalho = read("templates/engineering/plan-template.md")
    .split("\n")
    .find((l) => l.startsWith("> **Execução:**"));
  assert.ok(cabecalho, `templates/engineering/plan-template.md sem o cabeçalho "Execução:". ${ESCOLHAS_INICIO}`);
  for (const valor of ["tarefa a tarefa", "um por tarefa"]) {
    assert.ok(cabecalho.includes(valor), `templates/engineering/plan-template.md: o cabeçalho sem "${valor}". ${ESCOLHAS_INICIO}`);
  }
});
