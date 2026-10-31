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
