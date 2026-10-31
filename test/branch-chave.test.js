// Confere que a política de nome da branch mora numa skill só, `eng-global-branch` (#200), e que os
// workflows, as rules e as outras skills apontam para ela em vez de repetir a regra. Guarda só o texto
// (a prosa não tem teste de comportamento); o fork da skill pelo overlay é coberto pelo índice do `jarvis map`.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

const SKILL = "skills/eng-global-branch/SKILL.md";

// Espaços e quebras iguais, e espaço em volta de `|` ignorado (tabela reformatada não liga nem desliga a guarda).
const norm = (texto) => texto.replace(/\s+/g, " ").replace(/\s*\|\s*/g, "|");

// A mensagem de falha diz que a regra é guardada de propósito: mudá-la é mudar a skill e este teste.
const DE_PROPOSITO =
  "A política de nome da branch é guardada de propósito numa skill só (#200): mude-a em skills/eng-global-branch/SKILL.md e em test/branch-chave.test.js, e nos outros arquivos só aponte para a skill.";

// Bloco de frontmatter, do primeiro `---` ao segundo, com os delimitadores.
function frontmatter(texto) {
  const fim = texto.indexOf("\n---", 4);
  return texto.slice(0, fim + 4);
}

test("a skill eng-global-branch existe, é global e descreve a política inteira", () => {
  const skill = read(SKILL);
  assert.match(
    frontmatter(skill),
    /^ {2}area: global$/m,
    `${SKILL} sem area: global. ${DE_PROPOSITO}`
  );
  for (const trecho of [
    "{prefixo}/{chave}-{titulo}", // composição com a convenção do projeto
    "{chave}-{titulo}", // sem convenção
    "A chave é identificador, não estilo", // caixa da chave (Q3)
    "o número, sem `#`", // GitHub e GitLab, de quem compõe
    "Mudar a caixa da chave de board ou pôr `#` no nome", // regra de Nunca
    "Nome da branch: `{nome}`?", // confirmação (Q2)
    "número da issue do `VERSION_CONTROL`", // freelance com número (Q4)
    "em minúsculas, como a pasta da sessão", // chave do freelance reconhecida pelo Gate 0.3
    "Freelance, sem número", // fallback só com a descrição (Q4)
    "O que os Gates 0.3 conferem",
    "no idioma que a convenção pede", // idioma do título (Q2)
    "O nome da branch **contém** a chave da tarefa", // critério que os Gates 0.3 citam
    "sem a chave, avise e pergunte de novo", // Ajustar nunca cria a branch sem a chave
    "Convenção sem prefixo", // formato sem `/`
    "jarvis fork eng-global-branch", // extension point do overlay
  ]) {
    assert.ok(skill.includes(trecho), `${SKILL} sem "${trecho}". ${DE_PROPOSITO}`);
  }
  // Os marcadores que só a skill pode ter existem nela (senão a guarda "não copia" não vigia nada).
  for (const marcador of SO_DA_SKILL) {
    assert.ok(
      norm(skill).includes(norm(marcador)),
      `${SKILL} sem o marcador "${marcador}". ${DE_PROPOSITO}`
    );
  }
  // "o número, sem `#`" tem de estar nos Padrões Críticos (junto da regra da chave) e na seção dos Gates 0.3.
  assert.match(
    skill,
    /A chave é identificador, não estilo[^\n]*o número, sem `#`/,
    `${SKILL}: os Padrões Críticos perderam "o número, sem \`#\`". ${DE_PROPOSITO}`
  );
  assert.match(
    skill,
    /O nome da branch \*\*contém\*\* a chave da tarefa \([^)]*o número, sem `#`/,
    `${SKILL}: a seção "O que os Gates 0.3 conferem" perdeu "o número, sem \`#\`". ${DE_PROPOSITO}`
  );
  // O freelance sem número de controle (e não "de issue") é o que a tabela, o Passo 4 e os Gates dizem.
  assert.ok(
    !skill.includes("sem número de issue"),
    `${SKILL} voltou a falar de "sem número de issue". ${DE_PROPOSITO}`
  );
  assert.match(
    skill,
    /`feature\/199-company-overlay-fork`/,
    `${SKILL} sem o exemplo do GitHub. ${DE_PROPOSITO}`
  );
  assert.match(skill, /`feature\/TASK-123-/, `${SKILL} sem o exemplo do Jira. ${DE_PROPOSITO}`);
});

test("o frontmatter da skill fica pequeno (entra no início de toda sessão)", () => {
  const bytes = Buffer.byteLength(frontmatter(read(SKILL)), "utf8");
  assert.ok(
    bytes <= 500,
    `${SKILL}: frontmatter com ${bytes} B (limite 500 B; o jarvis tokens soma o frontmatter de toda skill). ${DE_PROPOSITO}`
  );
});

test("a skill está registrada onde as eng-global-* aparecem", () => {
  for (const arquivo of [
    "skills/AGENTS.md",
    "skills/SKILLS-ROADMAP.md",
    "AGENTS.md",
    "docs/estrutura/skills.md",
  ]) {
    assert.ok(
      read(arquivo).includes("eng-global-branch"),
      `${arquivo} sem eng-global-branch. ${DE_PROPOSITO}`
    );
  }
});

// Arquivos que antes repetiam a regra de nome da branch; agora só apontam para a skill.
const APONTAM = [
  "workflows/engineering/eng.start.md",
  "rules-on-demand/engineering/eng.start-rules.md",
  "docs/engenharia/eng.start.md",
];

test("o eng.start chama a skill pela tabela de chamadas (o que o jarvis map e o test:comandos leem)", () => {
  // Citar a skill e não copiar a regra dela é conferido para o escopo inteiro, no teste de ESCOPO.
  // A Fase 1.1 chama a skill pela tabela de chamadas (é o que o jarvis map e o test:comandos leem).
  assert.match(
    read("workflows/engineering/eng.start.md"),
    /^\| Fase 1\.1: Criar Branch de Feature \| `\/eng-global-branch` \|/m,
    `eng.start.md sem a linha da skill na tabela "Skills invocados". ${DE_PROPOSITO}`
  );
});

const GATES = ["plan", "work", "pre-pr", "pr"].map(
  (cmd) => `rules-on-demand/engineering/eng.${cmd}-rules.md`
);

// Bloco do Gate 0.3: do título até o separador `---` seguinte.
function gate03(texto) {
  const inicio = texto.indexOf("### Regra 0.3");
  const fim = texto.indexOf("\n---", inicio);
  const bloco = texto.slice(inicio, fim);
  // Um separador dentro do bloco o truncaria sem erro: o bloco termina na pergunta e na nota do freelance.
  assert.ok(
    bloco.includes("esta confirmação é esperada"),
    `O Gate 0.3 está truncado ou sem a nota do freelance. ${DE_PROPOSITO}`
  );
  return bloco;
}

test("os quatro Gates 0.3 são idênticos e citam a skill", () => {
  const blocos = GATES.map((arquivo) => gate03(read(arquivo)));
  for (const [i, bloco] of blocos.entries()) {
    assert.ok(
      bloco.includes("eng-global-branch"),
      `${GATES[i]}: o Gate 0.3 não cita a skill. ${DE_PROPOSITO}`
    );
    if (i > 0) {
      assert.equal(
        bloco,
        blocos[0],
        `${GATES[i]}: o Gate 0.3 difere do de ${GATES[0]}. ${DE_PROPOSITO}`
      );
    }
  }
});

// O escopo inteiro (decisão Q1): todos os arquivos que antes ditavam o nome da branch.
const ESCOPO = [
  ...APONTAM,
  ...GATES,
  "workflows/engineering/eng.pr.md",
  "workflows/engineering/eng.work.md",
  "rules-on-demand/engineering/eng.pr-rules.md",
  "skills/eng-global-pr/SKILL.md",
  "docs/engenharia/eng.pr.md",
  "rules/engineering/eng.integrations-rules.md",
];

// Marcadores estáveis da regra, que só a skill pode ter (a tabela de composição e a regra da chave).
const SO_DA_SKILL = [
  "A chave é identificador, não estilo",
  "| Com card, com convenção |",
  "| Com card, sem convenção |",
  "Freelance, sem número",
  "TASK-123-implementar-autenticacao-jwt",
];

test("todo o escopo cita a skill, não proíbe a chave por convenção e não copia a regra dela", () => {
  for (const arquivo of ESCOPO) {
    const texto = read(arquivo);
    assert.ok(texto.includes("eng-global-branch"), `${arquivo} não cita a skill. ${DE_PROPOSITO}`);
    assert.ok(
      !texto.includes("siga a do projeto"),
      `${arquivo}: "siga a do projeto" sem a chave voltou. ${DE_PROPOSITO}`
    );
    assert.ok(
      !texto.includes("sem número de issue"),
      `${arquivo} voltou a falar de "sem número de issue". ${DE_PROPOSITO}`
    );
    for (const marcador of SO_DA_SKILL) {
      assert.ok(
        !norm(texto).includes(norm(marcador)),
        `${arquivo} copia da skill: "${marcador}". ${DE_PROPOSITO}`
      );
    }
  }
});

test("os Gates 0.3 mantêm o critério (contém a chave, sem # no GitHub/GitLab) e a nota do freelance", () => {
  for (const arquivo of GATES) {
    const bloco = gate03(read(arquivo));
    assert.ok(
      bloco.includes("**não contém** o `{TASK_MANAGER_KEY}`"),
      `${arquivo}: o Gate 0.3 perdeu o critério "não contém a chave". ${DE_PROPOSITO}`
    );
    assert.ok(
      bloco.includes("sem `#`"),
      `${arquivo}: o Gate 0.3 não diz que a chave do GitHub/GitLab é o número sem "#". ${DE_PROPOSITO}`
    );
    assert.ok(
      bloco.includes("freelance sem número de controle"),
      `${arquivo}: o Gate 0.3 perdeu a nota do freelance sem número. ${DE_PROPOSITO}`
    );
  }
});

test("eng.work, eng.pr, eng-global-pr e a regra de integração dizem de onde vem o nome", () => {
  assert.ok(
    read("workflows/engineering/eng.work.md").includes("🌿 Branch: {NOME_DA_BRANCH}"),
    `eng.work.md: a mensagem final sem {NOME_DA_BRANCH}. ${DE_PROPOSITO}`
  );
  assert.ok(
    read("workflows/engineering/eng.pr.md").includes("o `Branch:` do `architecture.md`"),
    `eng.pr.md não diz que o nome vem do Branch: do architecture.md. ${DE_PROPOSITO}`
  );
  assert.match(
    read("rules/engineering/eng.integrations-rules.md"),
    /nome da branch vem da skill `eng-global-branch`[\s\S]*?número informado entra no nome, em minúsculas/,
    `eng.integrations-rules.md: o freelance sem a frase do número da issue. ${DE_PROPOSITO}`
  );
  assert.match(
    read("skills/eng-global-pr/SKILL.md"),
    /^\| Passo 2 — Criar Branch \| `\/eng-global-branch` \|/m,
    `eng-global-pr sem a linha da skill na tabela de chamadas. ${DE_PROPOSITO}`
  );
});

test("o renomeio da branch no eng.start só vale com as condições certas e vem antes do checkout da base", () => {
  const texto = read("workflows/engineering/eng.start.md");
  // Só a Fase 1.1: do título até o próximo título de seção.
  const inicio = texto.indexOf("### 1.1 Criar Branch de Feature");
  const fim = texto.indexOf("### 1.2", inicio);
  assert.ok(inicio !== -1 && fim !== -1, `eng.start.md sem a Fase 1.1. ${DE_PROPOSITO}`);
  const fase = texto.slice(inicio, fim);
  for (const trecho of [
    "diferente de `{BRANCH_BASE}`",
    "não protegida",
    "`homolog`",
    "sem upstream",
    "git rev-parse --abbrev-ref @{u}",
    "git log {BRANCH_BASE}..HEAD",
    "git branch -m {NOME_DA_BRANCH}",
    "`origin/{BRANCH_BASE}`",
    "não rode o bloco abaixo",
  ]) {
    assert.ok(
      fase.includes(trecho),
      `Fase 1.1 do eng.start sem "${trecho}" no renomeio. ${DE_PROPOSITO}`
    );
  }
  const renomeio = fase.indexOf("git branch -m {NOME_DA_BRANCH}");
  const checkout = fase.indexOf("git checkout {BRANCH_BASE}");
  assert.ok(
    renomeio !== -1 && checkout !== -1,
    `Fase 1.1 sem o renomeio ou sem o checkout da base. ${DE_PROPOSITO}`
  );
  assert.ok(
    renomeio < checkout,
    `Fase 1.1: o renomeio voltou para depois do checkout da base. ${DE_PROPOSITO}`
  );
});

test("o Gate 0.1 das quatro rules não manda pôr a branch em minúsculas (a pasta da sessão sim)", () => {
  for (const arquivo of GATES) {
    const texto = read(arquivo);
    assert.ok(
      !texto.includes("pasta/branch em lowercase"),
      `${arquivo}: o Gate 0.1 manda a branch em minúsculas, contra a Q3. ${DE_PROPOSITO}`
    );
    assert.ok(
      texto.includes(
        "pasta da sessão em lowercase; o nome da branch segue a skill `eng-global-branch`"
      ),
      `${arquivo}: o Gate 0.1 sem a referência à skill. ${DE_PROPOSITO}`
    );
  }
});

test("o Gate 0.2 das quatro rules aponta para a skill", () => {
  for (const arquivo of GATES) {
    assert.ok(
      read(arquivo).includes("Branch esperada: no padrão da skill eng-global-branch"),
      `${arquivo}: o Gate 0.2 perdeu a referência à skill. ${DE_PROPOSITO}`
    );
  }
});

test("fora da skill, ninguém mais dita o padrão {TASK_MANAGER_KEY}-{titulo} sem citar a skill", () => {
  for (const arquivo of ESCOPO) {
    for (const [n, linha] of read(arquivo).split("\n").entries()) {
      if (!linha.includes("{TASK_MANAGER_KEY}-{titulo")) continue;
      assert.ok(
        linha.includes("eng-global-branch"),
        `${arquivo}:${n + 1} dita o padrão sem citar a skill: ${linha.trim()}. ${DE_PROPOSITO}`
      );
    }
  }
});

test("o jarvis fork resolve eng-global-branch como skill (o extension point é forkável)", async () => {
  const { resolveArtifact } = await import("../bin/commands/fork.js");
  const artefato = resolveArtifact(root, "eng-global-branch");
  assert.ok(artefato, `o jarvis fork não acha eng-global-branch. ${DE_PROPOSITO}`);
  assert.equal(
    artefato.type,
    "skills",
    `eng-global-branch resolvida como ${artefato.type}. ${DE_PROPOSITO}`
  );
  assert.equal(artefato.relPath, "skills/eng-global-branch", DE_PROPOSITO);
});

test("a caixa da chave em minúsculas é dita só para a pasta da sessão, nunca para a variável nem para a branch", () => {
  const arquivos = [
    "workflows/engineering/eng.start.md",
    "workflows/engineering/eng.plan.md",
    "rules-on-demand/engineering/eng.start-rules.md",
    "rules-on-demand/engineering/eng.plan-rules.md",
    "rules-on-demand/engineering/eng.tech-spec-rules.md",
    ...GATES,
  ];
  for (const arquivo of new Set(arquivos)) {
    for (const [n, linha] of read(arquivo).split("\n").entries()) {
      if (!/TASK_MANAGER_KEY/.test(linha) || !/lowercase/.test(linha)) continue;
      assert.ok(
        /nome da pasta|pasta da sessão|\*\*pasta\*\*/i.test(linha),
        `${arquivo}:${n + 1} manda pôr o TASK_MANAGER_KEY em lowercase sem dizer que é a pasta: ${linha.trim()}. ${DE_PROPOSITO}`
      );
    }
  }
});
