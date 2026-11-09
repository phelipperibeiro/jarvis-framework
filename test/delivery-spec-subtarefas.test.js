// Guarda o que o Delivery Spec absorveu do eng.breakdown-subtasks (#248, limpeza de código morto #237):
// o atalho da Tech Spec pronta, a pergunta do nível de detalhe, o subtarefas.md gravado antes da pergunta
// da 7.3 e a ausência de citações ao comando removido.
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DELIVERY = "skills/eng-global-tech-spec/references/delivery-spec.md";
const TEMPLATE = "templates/engineering/tech-spec-delivery-template.md";
const read = (p) => readFileSync(join(root, p), "utf8");

const DE_PROPOSITO =
  "O Delivery Spec absorveu o eng.breakdown-subtasks (#248): ao mudar o texto, atualize este teste junto.";

test("Delivery Spec: atalho da Tech Spec pronta e pergunta do nível de detalhe", () => {
  const texto = read(DELIVERY);
  const FRASES = [
    /\*\*"Já existe uma Tech Spec para este card"\*\* → \*\*Gerar a Tech Spec de novo \(como hoje\)\*\* \/ \*\*Só gerar as subtarefas dela \(vai para a Fase 7\)\*\*/,
    /\*\*"Como descrever cada subtarefa\?"\*\* → \*\*Resumo \(como hoje\)\*\* \/ \*\*Passo a passo para quem executa sem perguntar\*\*/,
    /localize no projeto \(glob e grep\) arquivos parecidos/,
  ];
  for (const frase of FRASES) assert.match(texto, frase, `${DELIVERY} sem ${frase}. ${DE_PROPOSITO}`);
  assert.match(
    read(TEMPLATE),
    /## Descrição da subtarefa no board, passo a passo/,
    `${TEMPLATE} sem o bloco passo a passo. ${DE_PROPOSITO}`
  );
});

test("Delivery Spec: o subtarefas.md é gravado na 7.2, antes da pergunta da 7.3", () => {
  const texto = read(DELIVERY);
  const grava = texto.search(/Grave as descrições de todas as subtarefas[^\n]*subtarefas\.md`, \*\*antes\*\* da pergunta da 7\.3/);
  const secao73 = texto.indexOf("#### 7.3");
  const pergunta = texto.search(/[Aa]ntes de criar as subtarefas, mostre o texto e pergunte/);
  assert.notEqual(grava, -1, `${DELIVERY}: a 7.2 não grava o subtarefas.md. ${DE_PROPOSITO}`);
  assert.notEqual(secao73, -1, `${DELIVERY}: seção 7.3 não encontrada. ${DE_PROPOSITO}`);
  assert.notEqual(pergunta, -1, `${DELIVERY}: a pergunta da 7.3 não encontrada. ${DE_PROPOSITO}`);
  assert.ok(grava < secao73 && secao73 < pergunta, `${DELIVERY}: o subtarefas.md precisa ser gravado antes da pergunta da 7.3. ${DE_PROPOSITO}`);
});

// Os .md versionados do framework (fora do CHANGELOG, que guarda o histórico) não citam o comando removido.
// Só os arquivos do git: pastas locais ignoradas (rascunhos, backups) não fazem parte do framework.
const versionados = () =>
  execFileSync("git", ["ls-files", "*.md"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);

test("nenhum .md do framework cita o eng.breakdown-subtasks removido", () => {
  const achados = versionados()
    .filter((f) => f !== "CHANGELOG.md")
    .filter((f) => /breakdown-subtasks/.test(read(f)));
  assert.deepEqual(achados, [], `Citam o eng.breakdown-subtasks removido: ${achados.join(", ")}. ${DE_PROPOSITO}`);
});
