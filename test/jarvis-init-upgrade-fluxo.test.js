// Confere o fluxo do Upgrade (C) do /jarvis-init (#226): sem variável nova o Upgrade não
// encerra antes das exceções (itens 7 a 9) e do passo 9.5 (validação do ENV.md); pular o
// passo das stacks não manda para o "passo 10" (confirmação do onboarding completo).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

test("ordem do Upgrade: item 5, exceções (7 a 9) e item 12, nesta ordem", () => {
  const i5 = upgrade.indexOf("5. Se não houver diff");
  const i7 = upgrade.indexOf("7. **Exceção");
  const i12 = upgrade.indexOf("12. Oferecer");
  assert.ok(i5 !== -1 && i7 !== -1 && i12 !== -1, "os itens 5, 7 e 12 devem existir");
  assert.ok(i5 < i7 && i7 < i12, "a ordem deve ser 5 → 7 → 12: as exceções rodam antes do fim");
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

// ---- #227: AGENTS.md/CLAUDE.md fora do git no modo projeto ----------------------------------------

const skill = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
const item91 = item(upgrade, "9.1. **Exceção", "10. Acrescentar");

test("SKILL.md: o CLI grava o git do modo projeto; o texto não repete a lista nem escreve no .gitignore", () => {
  assert.match(skill, /\.git\/info\/exclude/, "o Passo 5 deve citar o exclude local");
  assert.doesNotMatch(skill, /echo "\$line" >> \.gitignore/, "o bash que escrevia no .gitignore saiu");
  assert.doesNotMatch(skill, /for line in '\.jarvis\/'/, "a lista de entradas não é mais repetida no texto");
});

test("SKILL.md: o mapa de tecnologias vale nos dois modos (sem 'contexto de workspace')", () => {
  assert.doesNotMatch(skill, /Contexto de workspace/i);
  assert.match(skill, /Mapa de tecnologias do projeto: \[CDD-MIND-MAP\.md\]/);
  assert.match(skill, /ou, no modo projeto, do repositório/);
});

test("SKILL.md: o Passo 7 avisa como versionar de propósito e deixa a saída do git para o Upgrade", () => {
  assert.match(skill, /para versionar de propósito, remova a linha do `\.git\/info\/exclude`/);
  assert.match(skill, /não o tire do índice aqui/i);
});

test("upgrade.md: o item 9.1 pergunta por arquivo, com Manter versionado primeiro, e chama jarvis untrack", () => {
  assert.match(item91, /jarvis untrack \{arquivo\}/);
  assert.ok(
    item91.indexOf("**Manter versionado**") < item91.indexOf("**Tirar do git**"),
    "Manter versionado deve vir antes de Tirar do git"
  );
  assert.match(item91, /AskUserQuestion/);
  assert.match(item91, /nunca faz commit nem push/);
  assert.match(item91, /apaga o `\{arquivo\}` para o resto do time/, "o aviso explica o efeito para o time");
});

test("upgrade.md: o item 9.1 roda entre as exceções (antes do item 10, que o caminho sem diff pula)", () => {
  const i7 = upgrade.indexOf("7. **Exceção");
  const i91 = upgrade.indexOf("9.1. **Exceção");
  const i10 = upgrade.indexOf("10. Acrescentar");
  const i12 = upgrade.indexOf("12. Oferecer");
  assert.ok(i7 !== -1 && i91 !== -1 && i10 !== -1 && i12 !== -1);
  assert.ok(i7 < i91 && i91 < i10 && i10 < i12, "a ordem deve ser 7 → 9.1 → 10 → 12");
});

test("upgrade.md: a nota do terminal diz que o CLI nunca tira arquivo do índice", () => {
  assert.match(upgrade, /\*\*nunca tira arquivo do índice\*\*/);
});

// ---- #227: o mapa de tecnologias vale nos dois modos; comando novo documentado ---------------------

const read = (...parts) => readFileSync(join(root, ...parts), "utf8");

test("warm-up: o mapa vale nos dois modos e o /warm-up não escreve mais no .gitignore", () => {
  const warm = read("workflows", "warm-up.md");
  assert.doesNotMatch(warm, /Contexto de workspace/i);
  assert.match(warm, /Vale nos \*\*dois modos\*\*/);
  assert.doesNotMatch(warm, />> \.gitignore/, "o bash que gravava o mapa no .gitignore saiu");
  assert.match(warm, /git check-ignore -q CDD-MIND-MAP\.md/);
  assert.match(warm, /Mapa de tecnologias do projeto: \[CDD-MIND-MAP\.md\]/);
});

test("template do mapa: descrição dos dois modos e do exclude, sem 'contexto de workspace'", () => {
  const template = read("templates", "cdd-mind-map-template.md");
  assert.doesNotMatch(template, /Contexto de workspace/i);
  assert.match(template, /Mapa de tecnologias do projeto/);
  assert.match(template, /modo workspace/);
  assert.match(template, /modo projeto/);
  assert.match(template, /\.git\/info\/exclude/);
});

test("prod-rules: a cópia do AGENTS.md para o CLAUDE.md respeita o exclude no modo projeto", () => {
  assert.match(read("rules", "product", "prod-rules.md"), /respeita o `\.git\/info\/exclude`/);
});

test("nenhum texto do framework chama o mapa de 'contexto de workspace'", () => {
  for (const dir of ["workflows", "templates", "rules", "rules-on-demand", "skills", "agents"]) {
    // grep sai com 1 quando não acha nada (o esperado) e com 0 quando acha
    const r = spawnSync("grep", ["-rIil", "contexto de workspace", join(root, dir)], { encoding: "utf8" });
    assert.equal(r.status, 1, `${dir}/ ainda cita "contexto de workspace": ${r.stdout.trim()}`);
  }
});

test("jarvis untrack está na lista de comandos do AGENTS.md e no guia da pasta bin", () => {
  assert.match(read("AGENTS.md"), /jarvis untrack\s+<AGENTS\.md\|CLAUDE\.md>/);
  const bin = read("docs", "estrutura", "bin.md");
  assert.match(bin, /untrack\.js/);
  assert.match(bin, /`jarvis untrack /);
  assert.match(bin, /git-exclude/);
});

test("upgrade.md 9.1: jarvis untrack só na opção Tirar do git; Manter versionado não muda nada", () => {
  assert.match(item91, /- \*\*Tirar do git:\*\* rode `jarvis untrack \{arquivo\}`/);
  assert.match(item91, /- \*\*Manter versionado\*\*, ou sem resposta: nada muda no índice nem no exclude/);
  assert.equal((item91.match(/jarvis untrack \{arquivo\}/g) || []).length, 1, "a chamada aparece uma vez, ligada à opção");
  assert.ok(
    item91.indexOf("**Tirar do git:**") < item91.indexOf("jarvis untrack {arquivo}") &&
      item91.indexOf("jarvis untrack {arquivo}") < item91.indexOf("**Manter versionado**, ou sem resposta"),
    "a chamada fica dentro da opção Tirar do git, antes da opção Manter"
  );
});

test("README: o parágrafo do .gitignore lista tudo o que o init grava (inclusive docs/jarvis/ e a pasta da IDE)", () => {
  const linha = read("README.md").split("\n").find((l) => l.includes("põe no `.gitignore`"));
  assert.ok(linha, "o parágrafo do .gitignore existe");
  assert.match(linha, /`\.jarvis\/`.*`\$SESSIONS_DIR\/`.*`docs\/jarvis\/`.*pasta da IDE/);
  assert.match(linha, /`\.git\/info\/exclude`/);
});

test("upgrade.md 9.1: a falha parcial do untrack (índice já alterado) não manda repetir o git rm --cached", () => {
  assert.match(item91, /se ele falhar \*\*sem\*\* ter alterado o índice/);
  assert.match(item91, /Saída 1 com a mensagem \*\*"O índice JÁ foi alterado"\*\*/);
  assert.match(item91, /\*\*não repita\*\* o `git rm --cached`/);
  assert.match(item91, /falta gravar `\{arquivo\}` no `\.git\/info\/exclude`/);
  // o git rm --cached manual só é oferecido no caso em que o índice NÃO foi alterado
  const falhaTotal = item91.indexOf("se ele falhar **sem** ter alterado o índice");
  const falhaParcial = item91.indexOf("Saída 1 com a mensagem");
  assert.ok(falhaTotal !== -1 && falhaTotal < falhaParcial);
  assert.ok(item91.indexOf("mostre `git rm --cached -- {arquivo}`") > falhaTotal);
  assert.ok(item91.indexOf("mostre `git rm --cached -- {arquivo}`") < falhaParcial, "o comando manual fica no caso da falha total");
});

test("upgrade.md: a nota do terminal lista a pasta da IDE e a pasta dos documentos ($JARVIS_DOCS/) entre o que o --upgrade grava no .gitignore", () => {
  assert.match(upgrade, /a pasta da IDE e a pasta dos documentos \(`\$JARVIS_DOCS\/`\) no `\.gitignore`, mas \*\*nunca tira arquivo do índice\*\*/);
  // convenção do projeto: o asset usa a variável, não o caminho padrão por extenso (paths-no-fixed-text)
});

