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
    "sem `#`", // GitHub e GitLab
    "Nome da branch: `{nome}`?", // confirmação (Q2)
    "número da issue do `VERSION_CONTROL`", // freelance com número (Q4)
    "Freelance, sem número", // fallback só com a descrição (Q4)
    "O que os Gates 0.3 conferem",
    "jarvis fork eng-global-branch", // extension point do overlay
  ]) {
    assert.ok(skill.includes(trecho), `${SKILL} sem "${trecho}". ${DE_PROPOSITO}`);
  }
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

test("o eng.start, as regras dele e o guia apontam para a skill e não repetem a regra", () => {
  for (const arquivo of APONTAM) {
    const texto = read(arquivo);
    assert.ok(texto.includes("eng-global-branch"), `${arquivo} não cita a skill. ${DE_PROPOSITO}`);
    assert.ok(
      !texto.includes("siga a do projeto"),
      `${arquivo}: "siga a do projeto" sem a chave voltou. ${DE_PROPOSITO}`
    );
    assert.ok(
      !texto.includes("TASK-123-implementar-autenticacao-jwt"),
      `${arquivo} repete a tabela de exemplos da skill. ${DE_PROPOSITO}`
    );
  }
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
  return texto.slice(inicio, fim);
}

test("os quatro Gates 0.3 são idênticos e citam a skill", () => {
  const blocos = GATES.map((arquivo) => gate03(read(arquivo)));
  for (const [i, bloco] of blocos.entries()) {
    assert.ok(bloco.length > 0, `${GATES[i]} sem a Regra 0.3. ${DE_PROPOSITO}`);
    assert.ok(
      bloco.includes("eng-global-branch"),
      `${GATES[i]}: o Gate 0.3 não cita a skill. ${DE_PROPOSITO}`
    );
    assert.equal(
      bloco,
      blocos[0],
      `${GATES[i]}: o Gate 0.3 difere do de ${GATES[0]}. ${DE_PROPOSITO}`
    );
  }
});

test("eng.pr, eng-global-pr, eng.work, o guia do eng.pr e o freelance apontam para a skill", () => {
  const arquivos = [
    "workflows/engineering/eng.pr.md",
    "rules-on-demand/engineering/eng.pr-rules.md",
    "skills/eng-global-pr/SKILL.md",
    "docs/engenharia/eng.pr.md",
    "rules/engineering/eng.integrations-rules.md",
  ];
  for (const arquivo of arquivos) {
    const texto = read(arquivo);
    assert.ok(texto.includes("eng-global-branch"), `${arquivo} não cita a skill. ${DE_PROPOSITO}`);
    assert.ok(
      !texto.includes("TASK-123-implementar-autenticacao-jwt"),
      `${arquivo} repete a tabela de exemplos da skill. ${DE_PROPOSITO}`
    );
  }
  assert.ok(
    !read("workflows/engineering/eng.work.md").includes("Branch: {TASK_MANAGER_KEY}-{titulo}"),
    `eng.work.md: a mensagem final ainda dita o padrão antigo. ${DE_PROPOSITO}`
  );
  assert.match(
    read("skills/eng-global-pr/SKILL.md"),
    /^\| Passo 2 — Criar Branch \| `\/eng-global-branch` \|/m,
    `eng-global-pr sem a linha da skill na tabela de chamadas. ${DE_PROPOSITO}`
  );
});

test("fora da skill, ninguém mais dita o padrão {TASK_MANAGER_KEY}-{titulo} sem citar a skill", () => {
  const arquivos = [
    ...APONTAM,
    ...GATES,
    "workflows/engineering/eng.pr.md",
    "skills/eng-global-pr/SKILL.md",
  ];
  for (const arquivo of arquivos) {
    for (const [n, linha] of read(arquivo).split("\n").entries()) {
      if (!linha.includes("{TASK_MANAGER_KEY}-{titulo")) continue;
      // A linha do hotfix já é composta (`hotfix/{KEY}-{titulo}`) e não fala do nome da branch de trabalho.
      if (linha.includes("hotfix/{TASK_MANAGER_KEY}")) continue;
      assert.ok(
        linha.includes("eng-global-branch"),
        `${arquivo}:${n + 1} dita o padrão sem citar a skill: ${linha.trim()}. ${DE_PROPOSITO}`
      );
    }
  }
});
