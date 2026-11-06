// Guarda as decisões da #229 no texto do /eng.spec-consolidate e no guia: a sessão inteira vai ao
// Central docs, os três passos cobrem os arquivos dela e a pasta só é apagada com Sim próprio.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf-8");
const WF = read("workflows/engineering/eng.spec-consolidate.md");
const GUIA = read("docs/engenharia/eng.spec-consolidate.md");

/** Texto de um passo: do título até o próximo `## `. */
function passo(titulo) {
  const a = WF.indexOf(`## ${titulo}`);
  assert.notEqual(a, -1, `${titulo} não encontrado`);
  const b = WF.indexOf("\n## ", a + 3);
  return WF.slice(a, b === -1 ? undefined : b);
}

test("Passo 8 arquiva os arquivos da sessão (não exclui mais history)", () => {
  const p8 = passo("Passo 8");
  assert.match(p8, /arquivos da sessão/);
  assert.doesNotMatch(p8, /`history` não têm "original"/, "a frase antiga que excluía history saiu");
  assert.match(p8, /archive\/\{card\}\/\{caminho relativo\}/);
});

test("Passo 9 limita a remoção da sessão à pasta do próprio card e o 9.1 pede Sim próprio para apagar a pasta", () => {
  const p9 = passo("Passo 9");
  assert.match(p9, /pasta `\$SESSIONS_DIR\/eng\/\{card\}\/` \*\*do próprio card\*\*/);
  assert.match(p9, /### Passo 9\.1: Apagar a pasta da sessão/);
  assert.match(p9, /Apagar a pasta da sessão \{card\}\?/);
  assert.match(p9, /nada ficou na sessão por escolha sua/);
});

test("--force vale para a sessão, conferindo a cópia publicada", () => {
  assert.match(WF, /Vale também para os arquivos da sessão \(#229\)/);
  assert.match(WF, /só depois de conferir que a cópia publicada existe e bate o hash/);
});

test("a regra 'Nunca' protege a pasta da sessão e a página-índice só usa fontes reais", () => {
  assert.match(WF, /Apagar um arquivo de sessão fora da pasta do card/);
  assert.match(WF, /sessão incompleta é documentada com o que existe/);
});

test("Passo 2B: uma sessão por vez (--sessao, --proxima), retomável, com issue e PR só de leitura", () => {
  assert.match(WF, /- `--sessao \{card\}`/);
  assert.match(WF, /- `--proxima`/);
  const p2b = passo("Passo 2B");
  assert.match(p2b, /uma por vez/);
  assert.match(p2b, /jarvis docs sessions --proxima/);
  assert.match(p2b, /Nenhuma sessão pendente/);
  assert.match(p2b, /não regera\*\* `feature-\*` nem `delivery-\*`/, "sessão já entregue: só os arquivos (Q5)");
  assert.match(p2b, /\*\*"PR não localizado"\*\*/);
  assert.match(p2b, /Sessão sem issue e sem PR/);
  assert.match(p2b, /Épicos \(Q7 da #229\)/);
  assert.match(p2b, /gh issue view/);
  assert.doesNotMatch(p2b, /gh (issue|pr) (create|comment|edit|close|merge)/, "o modo só lê o GitHub");
  assert.match(WF, /Faltam \{N\} sessão\(ões\) pendente\(s\)/);
});

test("o guia para humanos descreve destinos, página-índice, nova versão e a oferta de apagar a sessão", () => {
  assert.match(GUIA, /Página-índice da sessão/);
  assert.match(GUIA, /`-v1`, `-v2`/);
  assert.match(GUIA, /oferece apagar a pasta da sessão/);
  assert.doesNotMatch(GUIA, /A sessão não é apagada: remova à mão/, "a frase antiga saiu");
  assert.match(GUIA, /## Sessões antigas, uma por vez/);
  assert.match(GUIA, /`\/eng\.spec-consolidate --proxima`/);
});
