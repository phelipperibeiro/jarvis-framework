// Confere o fluxo do Upgrade (C) do /jarvis-init (#226): sem variável nova o Upgrade não
// encerra antes das exceções (itens 7 a 9) e do passo 9.5 (validação do ENV.md); pular o
// passo das stacks não manda para o "passo 10" (confirmação do onboarding completo).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "skills", "jarvis-init", "assets");
const upgrade = readFileSync(join(assets, "upgrade.md"), "utf8");
const stacks = readFileSync(join(assets, "passo-adicionar-stacks.md"), "utf8");

// Trecho entre o início de um item numerado e o início do próximo (ou o fim do arquivo).
function item(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert.notEqual(start, -1, `não achei "${startMarker}" em upgrade.md`);
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
  assert.notEqual(end, -1, `não achei "${endMarker}" depois de "${startMarker}"`);
  return text.slice(start, end);
}

const item5 = item(upgrade, "5. Se não houver diff:", "6. Se houver diff");
const item12 = item(upgrade, "12. Oferecer o **passo 9", null);

test("item 5 (sem diff) não encerra o Upgrade", () => {
  assert.doesNotMatch(item5, /encerrar/i, "o item 5 não pode mandar encerrar");
  assert.match(item5, /(itens?|item) 7/, "o item 5 deve seguir para o item 7 (exceções 7 a 9)");
});

test("item 5 pula os itens que só existem para variável nova", () => {
  assert.match(item5, /6, 10 e 11|itens 6, 10 e 11/, "o item 5 deve pular 6, 10 e 11");
});

test("item 12 deixa explícito que pular etapa é permitido e encerrar antes do 9.5 não é", () => {
  assert.match(item12, /9\.5/, "o item 12 deve citar o passo 9.5");
  assert.match(item12, /resumo/i, "o item 12 deve citar o resumo");
  assert.match(item12, /pul/i, "o item 12 deve dizer que pular é permitido");
  assert.match(item12, /nunca encerra|não encerra|antes do 9\.5/i,
    "o item 12 deve proibir encerrar antes do 9.5 e do resumo");
});

test("passo-adicionar-stacks não manda para o passo 10 (é do onboarding completo)", () => {
  assert.doesNotMatch(stacks, /passo 10/, "nenhuma referência ao passo 10 nos assets das stacks");
  const refs9_5 = stacks.match(/passo 9\.5/g) || [];
  assert.equal(refs9_5.length, 3, "as três referências (pular, fim, tabela) devem apontar para o passo 9.5");
});

test("SKILL.md continua com o passo 10 no onboarding completo (regressão)", () => {
  const skill = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
  assert.match(skill, /### 10\. Confirmar Criação/, "o passo 10 do onboarding completo não pode sumir");
});
