// Guarda a regra de ouro (#184): nada é comentado nem publicado sem mostrar o texto e perguntar.
// Confere a regra geral, o passo de pergunta do skill de comentário, a frase-marca "regra de ouro"
// nos arquivos que enviam algo, e a ausência dos imperativos antigos ("poste", "comente" sem pergunta).
// Guarda só o texto (a prosa dos workflows não tem teste de comportamento).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");
const rel = (file) => relative(root, file);

// A mensagem de falha diz que o texto é guardado de propósito: reescrever o literal pede a atualização do teste junto.
const DE_PROPOSITO =
  "A regra de ouro é guardada de propósito (#184): ao mudar o texto, atualize test/regra-de-ouro.test.js junto.";

const INTEGRATIONS = "rules/engineering/eng.integrations-rules.md";
const TASK_COMMENT = "skills/eng-global-task-comment/SKILL.md";
const REPORT_ISSUE = "skills/jarvis-report-issue/SKILL.md";
const ENG_PR = "workflows/engineering/eng.pr.md";
const GLOBAL_PR = "skills/eng-global-pr/SKILL.md";

// Arquivos que enviam algo para fora (comentário, PR, issue, push) e precisam citar a regra (teste 3)
const CITAM_A_REGRA = [
  "workflows/engineering/eng.start.md",
  "workflows/engineering/eng.plan.md",
  "workflows/engineering/eng.work.md",
  ENG_PR,
  GLOBAL_PR,
  TASK_COMMENT,
  REPORT_ISSUE,
  "templates/engineering/advisor-template.md",
];

// Varridos no teste 4: o imperativo que manda publicar sem a pergunta não pode voltar
const PASTAS = ["workflows", "skills", "templates", "rules"];
const IMPERATIVOS = [
  /Poste \*\*um\*\* comentário/,
  /poste o comentário de auditoria/i,
  /comente também no card/i,
  /Comente o bloqueio no card/i,
  /um único comentário no card, com o link/,
  /Adicionar comentário com link do MR/,
  /Sempre: comentário no card/,
];

// Dirent.isDirectory() não segue link simbólico, então um link quebrado ou circular não derruba a varredura.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return walk(caminho);
    return entrada.isFile() && caminho.endsWith(".md") ? [caminho] : [];
  });
}
function todosMd() {
  return PASTAS.map((p) => join(root, p))
    .filter((p) => existsSync(p))
    .flatMap(walk);
}

test("a regra geral está em eng.integrations-rules.md e mantém a proibição de início e fim", () => {
  const texto = read(INTEGRATIONS);
  assert.match(texto, /^## Nada é publicado sem perguntar$/m, `${INTEGRATIONS} sem a seção "Nada é publicado sem perguntar". ${DE_PROPOSITO}`);
  assert.match(texto, /AskUserQuestion/, `${INTEGRATIONS} sem AskUserQuestion. ${DE_PROPOSITO}`);
  assert.match(texto, /regra de ouro/, `${INTEGRATIONS} sem a frase-marca "regra de ouro". ${DE_PROPOSITO}`);
  assert.match(
    texto,
    /\*\*Nunca\*\* comentar início ou fim de etapa/,
    `${INTEGRATIONS} sem a proibição de comentar início ou fim de etapa. ${DE_PROPOSITO}`
  );
});

test("o skill eng-global-task-comment mostra o texto e pergunta antes de enviar (passo 0.5)", () => {
  const texto = read(TASK_COMMENT);
  const inicio = texto.search(/^### 0\.5 /m);
  assert.notEqual(inicio, -1, `${TASK_COMMENT} sem o passo "### 0.5". ${DE_PROPOSITO}`);
  const resto = texto.slice(inicio);
  const fim = resto.search(/^### 1\. /m);
  const passo = fim === -1 ? resto : resto.slice(0, fim);
  assert.match(passo, /AskUserQuestion/, `${TASK_COMMENT}: o passo 0.5 sem AskUserQuestion. ${DE_PROPOSITO}`);
  assert.match(passo, /task-comment-/, `${TASK_COMMENT}: o passo 0.5 sem o .md para o "Não". ${DE_PROPOSITO}`);
});

test("os arquivos que enviam algo citam a regra de ouro", () => {
  for (const file of CITAM_A_REGRA) {
    assert.match(read(file), /regra de ouro/, `${file} não cita "regra de ouro". ${DE_PROPOSITO}`);
  }
});

test("nenhum imperativo manda publicar sem a pergunta", () => {
  for (const file of todosMd()) {
    const texto = readFileSync(file, "utf8");
    for (const padrao of IMPERATIVOS) {
      assert.doesNotMatch(texto, padrao, `${rel(file)} ainda tem o imperativo ${padrao}. ${DE_PROPOSITO}`);
    }
  }
});

test("o push das correções do code review só sai depois da pergunta", () => {
  // O bloco do commit de correção vem logo depois do texto do passo; o trecho entre o título do passo e o bloco precisa citar a regra.
  for (const file of [ENG_PR, GLOBAL_PR]) {
    const texto = read(file);
    const bloco = texto.indexOf('git commit -m "fix: corrigir {problema} conforme code review"');
    assert.notEqual(bloco, -1, `${file} sem o bloco do commit de correção do code review. ${DE_PROPOSITO}`);
    const antes = texto.slice(0, bloco);
    // O passo é um título de nível 3; as linhas "# ..." dentro do bloco de código não contam como título.
    const titulo = antes.lastIndexOf("\n### ");
    assert.match(
      antes.slice(titulo),
      /regra de ouro/,
      `${file}: o passo do push do code review não cita a regra de ouro. ${DE_PROPOSITO}`
    );
  }
});

test("o jarvis-report-issue mostra o texto e pergunta antes de abrir a issue", () => {
  const texto = read(REPORT_ISSUE);
  assert.match(texto, /Sim, abrir a issue/, `${REPORT_ISSUE} sem a pergunta "Sim, abrir a issue". ${DE_PROPOSITO}`);
  assert.match(texto, /AskUserQuestion/, `${REPORT_ISSUE} sem AskUserQuestion. ${DE_PROPOSITO}`);
});
