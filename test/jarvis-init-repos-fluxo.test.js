// Fluxo do `/jarvis-init repos` e do mapa de tecnologias compartilhado (#225): testes de texto dos skills,
// assets, workflow e template. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(root, ...p), "utf8");

const assets = (f) => read("skills", "jarvis-init", "assets", f);
const warmUp = read("workflows", "warm-up.md");
const skill = read("skills", "jarvis-init", "SKILL.md");
const mapa = assets("mapa-de-tecnologias.md");
const stacks = assets("passo-adicionar-stacks.md");

// Trecho entre um marcador e o próximo (ou o fim do texto); falha alto se o marcador sumir.
function trecho(text, inicio, fim) {
  const a = text.indexOf(inicio);
  assert.notEqual(a, -1, `não achei "${inicio}"`);
  const b = fim ? text.indexOf(fim, a + inicio.length) : text.length;
  assert.notEqual(b, -1, `não achei "${fim}" depois de "${inicio}"`);
  return text.slice(a, b);
}

// ---- Fase 2: asset compartilhado do mapa (Q1) e o /warm-up sem mudar de comportamento -----------------

const passo2 = trecho(warmUp, "## Passo 2 — Mapa de tecnologias", "## Passo 3 — Repositórios ativos");

test("warm-up Passo 2: aponta para o asset compartilhado do mapa e para a tabela de sinais de stack", () => {
  assert.match(passo2, /\$IDE\/skills\/jarvis-init\/assets\/mapa-de-tecnologias\.md/);
  assert.match(passo2, /\$IDE\/skills\/jarvis-init\/assets\/sinais-de-stack\.md/);
  assert.match(passo2, /\*\*Confirmar\*\* \| \*\*Corrigir\*\* \| \*\*Incluir informação\*\*/, "as três respostas da validação continuam citadas");
  assert.match(passo2, /acrescenta só os repositórios que faltam, sem reprocessar as linhas existentes/);
});

test("warm-up Passo 2: o que é específico do /warm-up fica inline (item 1 e frases do .gitignore e do AGENTS.md)", () => {
  assert.match(passo2, /1\. \*\*Repositórios do workspace:\*\* use o `WORKSPACE_MODE` do ENV\. `workspace`: os de `WORKSPACE_REPOS` ou, se vazia, as subpastas com `\.git\/`/);
  assert.match(passo2, /Reconfira pelo critério/, "o aviso de WORKSPACE_MODE divergente continua no warm-up");
  assert.match(passo2, /sugira `jarvis init --upgrade`, sem alterar o ENV/);
  assert.match(passo2, /\*\*não escreva no `\.gitignore`\*\*/);
  assert.match(passo2, /git check-ignore -q CDD-MIND-MAP\.md/);
  assert.match(passo2, /> Mapa de tecnologias do projeto: \[CDD-MIND-MAP\.md\]\(CDD-MIND-MAP\.md\)/);
  assert.match(passo2, /Nunca leia `\.env\*`, chaves nem credenciais\./);
});

test("warm-up: os passos 1 a 9 continuam na mesma ordem (a extração só mexeu no Passo 2)", () => {
  const titulos = [...warmUp.matchAll(/^## Passo (\d) — /gm)].map((m) => m[1]);
  assert.deepEqual(titulos, ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
});

test("asset do mapa: entrada pela lista de quem chama, as 3 respostas e o acréscimo incremental", () => {
  assert.match(mapa, /lista de repositórios a processar\*\*, definida por quem chama/);
  assert.match(mapa, /`WORKSPACE_REPOS`/);
  assert.match(mapa, /o `\/jarvis-init repos` usa todas as subpastas com `\.git\/`/);
  assert.match(mapa, /\*\*Confirmar\*\* \| \*\*Corrigir\*\* \| \*\*Incluir informação\*\*/);
  assert.match(mapa, /\*\*Não reprocesse as linhas existentes\*\*/);
  assert.match(mapa, /acrescente \*\*só ele\*\*/);
});

test("asset do mapa: nunca apaga linha sem perguntar, nunca lê .env* e nunca grava o que a pessoa não confirmou", () => {
  assert.match(mapa, /Apagar uma linha do mapa sem perguntar/);
  assert.match(mapa, /Ler `\.env\*`, chaves, certificados ou credenciais/);
  assert.match(mapa, /Gravar uma linha que a pessoa não confirmou/);
});

test("asset do mapa: cita os três fluxos que o usam", () => {
  assert.match(mapa, /Passo 2 do `workflows\/warm-up\.md`/);
  assert.match(mapa, /sub-passo 9\.8 do \[passo-adicionar-stacks\.md\]/);
  assert.match(mapa, /\[repos\.md\]\(repos\.md\)/);
});

test("asset das stacks: o sub-passo 9.8 monta o mapa pelo asset e termina no passo 9.5 do SKILL.md", () => {
  const s98 = trecho(stacks, "## 9.8 Montar o mapa de tecnologias", "## Tratamento de situações");
  assert.match(s98, /\[mapa-de-tecnologias\.md\]\(mapa-de-tecnologias\.md\)/);
  assert.match(s98, /Pular é permitido: o primeiro `\/warm-up` cria o mapa/);
  assert.match(s98, /passo 9\.5 do `SKILL\.md` \(validar o ENV\.md\)/);
  const s97 = trecho(stacks, "## 9.7 Resumo final", "## 9.8 Montar o mapa de tecnologias");
  assert.match(s97, /Siga para o sub-passo 9\.8 \(mapa de tecnologias\)\./, "o 9.7 segue para o 9.8");
});

test("SKILL.md: o sub-passo do mapa e os Recursos apontam para o sub-passo 9.8 e para o asset", () => {
  const item6 = skill.split("\n").find((l) => l.startsWith("6. **Monta o `CDD-MIND-MAP.md`**"));
  assert.ok(item6, "o item 6 do passo 9 existe");
  assert.match(item6, /sub-passo 9\.8 do `passo-adicionar-stacks\.md`, que segue `assets\/mapa-de-tecnologias\.md`/);
  assert.match(skill, /\*\*Mapa de tecnologias \(parte comum\)\*\*: `\$IDE\/skills\/jarvis-init\/assets\/mapa-de-tecnologias\.md`/);
});
