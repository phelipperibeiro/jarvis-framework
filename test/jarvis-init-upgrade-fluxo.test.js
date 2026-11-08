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
  assert.match(item5, /itens 6, 10 e 11/, "o item 5 deve pular 6, 10 e 11");
});

test("item 12 deixa explícito que pular etapa é permitido e encerrar antes do 9.5 não é", () => {
  assert.match(item12, /9\.5/, "o item 12 deve citar o passo 9.5");
  assert.match(item12, /resumo/i, "o item 12 deve citar o resumo");
  assert.match(item12, /pul/i, "o item 12 deve dizer que pular é permitido");
  assert.match(item12, /nunca encerra/, "o item 12 deve proibir encerrar antes do 9.5 e do resumo");
});

// ---- #233: apontamentos pós-merge do PR #232 --------------------------------------------------

const item7 = item(upgrade, "7. **Exceção — documentos nos caminhos antigos", "8. **Exceção — Central docs antigo");

test("item 5 não afirma que o ENV.md está atualizado (os itens 7 a 9.1 ainda podem alterá-lo)", () => {
  assert.match(item5, /Nenhuma variável nova encontrada/);
  assert.doesNotMatch(item5, /já está atualizado/i, "a frase de 'já atualizado' saiu do item 5");
  assert.doesNotMatch(item5, /ENV\.md atualizado/i);
  assert.match(item5, /ainda podem alterá-lo/, "o item 5 explica por que não diz 'atualizado'");
});

test("item 8.5: a carga inicial do Central docs, depois do item 8, tem uma condição por assert e só vale com documentos movidos nesta atualização", () => {
  const item85 = item(upgrade, "8.5. **Exceção — carga inicial do Central docs", "9. **Exceção — `PROD_MODE`");
  // fica depois do Central docs antigo (itens 8 a 8.4): quem o migra no mesmo Upgrade também recebe a oferta
  assert.ok(upgrade.indexOf("8.4. **Exceção") < upgrade.indexOf("8.5. **Exceção"), "a oferta vem depois do item 8.4");
  assert.doesNotMatch(item7, /carga inicial/, "o item 7 não oferece mais a carga inicial");
  // a oferta só é descrita no 8.5: fora dele nenhum texto manda oferecer a carga inicial
  assert.doesNotMatch(upgrade.replace(item85, ""), /ofereça a carga inicial/, "só o 8.5 manda oferecer a carga inicial");
  // uma asserção por condição (sem regex com `.*` solto no meio)
  assert.match(item85, /\*\*só se\*\*/, "a oferta tem condição");
  assert.match(item85, /o Central docs estiver ligado/, "condição 1: Central docs ligado");
  assert.match(item85, /considere também `CENTRAL_DOCS_STORAGE` entre as chaves novas, ainda não gravadas/, "'ligado' considera a chave nova, ainda não gravada (o item 10 grava depois)");
  assert.match(item85, /não estiver no layout antigo \(o item 8\.4 adiado\)/, "não oferece com o layout antigo do Central docs");
  assert.match(item85, /houver PRD, FRD, ARD, RFC ou SPEC em `\$PROD_DOCS`\/`\$ENG_DOCS`/, "condição 2: há documentos de trabalho");
  assert.match(item85, /documentos foram movidos nesta atualização/, "condição 3: documentos movidos");
  assert.match(item85, /pelo item 7 ou pelo `jarvis init --upgrade` rodado logo antes deste comando/, "o que o terminal moveu antes também conta");
  assert.match(item85, /Documentos movidos: N/, "o texto diz a frase que o terminal imprime");
  assert.match(item85, /Sem nada movido, não ofereça/, "sem mover nada, não oferece");
  // a pergunta sobre o terminal só vem depois das condições do Passo 5.3 (o skill não lê a saída do terminal)
  const iLigado = item85.indexOf("o Central docs estiver ligado");
  const iDocs = item85.indexOf("houver PRD, FRD, ARD, RFC ou SPEC");
  const iPergunta = item85.indexOf("Só pergunte");
  assert.ok(iLigado !== -1 && iDocs !== -1 && iPergunta !== -1 && iLigado < iPergunta && iDocs < iPergunta, "as duas primeiras condições vêm antes da pergunta");
  assert.match(readFileSync(join(root, "bin", "commands", "init.js"), "utf8"), /Documentos movidos: \$\{/, "o CLI ainda imprime a frase citada");
  const skillMd = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
  assert.match(skillMd, /\| Passo 5\.3 — Carga inicial do Central docs \|.*só se documentos foram movidos nesta atualização/, "a tabela do SKILL.md traz a mesma condição");
  assert.match(skillMd, /\| Passo 5\.3 — Carga inicial do Central docs \|.*Se o Central docs estiver ligado, houver PRD\/FRD\/ARD\/RFC\/SPEC/, "a tabela do SKILL.md também traz as condições de Central docs ligado e de haver documentos");
  // a nota do terminal diz que a oferta é feita aqui e que depende da saída do terminal
  const nota = upgrade.split("\n").find((l) => l.startsWith("> No terminal, rode antes"));
  assert.match(nota, /a carga inicial do Central docs \(item 8\.5; anote o "Documentos movidos: N" da saída do terminal\)/, "a nota do terminal cita o item 8.5");
});

test("item 12 e SKILL.md definem o resumo (item 5 do passo 9.5) e a única etapa pulável (as stacks)", () => {
  assert.match(item12, /passo 9\.5 do `SKILL\.md`/, "o item 12 cita o 9.5 do SKILL.md");
  assert.match(item12, /item 5 \(Resumo\)/, "o resumo do Upgrade é o item 5 do 9.5");
  assert.match(item12, /Só a etapa das stacks pode ser pulada/, "só as stacks podem ser puladas");
  const skillMd = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
  const linhaC = skillMd.split("\n").find((l) => l.startsWith("Siga `assets/upgrade.md` do começo ao fim"));
  assert.ok(linhaC, "o SKILL.md descreve o fim do Upgrade");
  assert.match(linhaC, /item 5 \(Resumo\)/, "o SKILL.md usa a mesma definição de resumo");
  assert.match(linhaC, /única etapa que a pessoa pode pular/);
  assert.doesNotMatch(linhaC, /rodando o 9\.5 e encerrando/, "a frase ambígua saiu");
});

test("ordem do Upgrade: item 5, exceções (7 a 9) e item 12, nesta ordem", () => {
  const i5 = upgrade.indexOf("5. Se não houver diff");
  const i7 = upgrade.indexOf("7. **Exceção");
  const i12 = upgrade.indexOf("12. Oferecer");
  assert.ok(i5 !== -1 && i7 !== -1 && i12 !== -1, "os itens 5, 7 e 12 devem existir");
  assert.ok(i5 < i7 && i7 < i12, "a ordem deve ser 5 → 7 → 12: as exceções rodam antes do fim");
  // #233: a ordem no arquivo já valia antes da correção da #226; o que a correção mudou foi o próprio
  // item 5, que mandava encerrar. Ele precisa mandar seguir para o item 7 e deixar o fim para o item 12.
  assert.match(item5, /siga para o item 7/, "o item 5 manda seguir para o item 7");
  assert.match(item5, /único fim do Upgrade/, "o item 5 deixa o fim para o item 12");
  assert.doesNotMatch(item5, /encerrar/i, "o item 5 não manda encerrar");
});

test("passo-adicionar-stacks não manda para o passo 10 (é do onboarding completo)", () => {
  assert.doesNotMatch(stacks, /passo 10/, "nenhuma referência ao passo 10 nos assets das stacks");
  // #233: o asset tem o sub-passo local "9.5 Sugerir uma ação por stack"; toda menção a "passo 9.5"
  // (o de validar o ENV.md) precisa dizer que é o do SKILL.md, sem contar quantas menções existem.
  assert.match(stacks, /^## 9\.5 Sugerir uma ação por stack/m, "o sub-passo local 9.5 continua existindo (a regra é qualificar)");
  const refs9_5 = [...stacks.matchAll(/(?<!sub-)passo 9\.5/g)];
  assert.ok(refs9_5.length > 0, "o asset ainda manda seguir para o passo 9.5");
  for (const m of refs9_5) {
    const depois = stacks.slice(m.index, m.index + 80);
    assert.match(depois, /^passo 9\.5\*{0,2} do `SKILL\.md`/, `referência ao 9.5 sem citar o SKILL.md: "${depois.replace(/\n/g, " ")}"`);
  }
});

test("SKILL.md continua com o passo 10 no onboarding completo (regressão)", () => {
  const skill = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
  assert.match(skill, /### 10\. Confirmar Criação/, "o passo 10 do onboarding completo não pode sumir");
});

// ---- #227: AGENTS.md/CLAUDE.md fora do git no modo projeto ----------------------------------------

const skill = readFileSync(join(root, "skills", "jarvis-init", "SKILL.md"), "utf8");
const item91 = item(upgrade, "9.1. **Exceção", "9.2. **Exceção");

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

test("upgrade.md 9.1: a opção Manter versionado não traz comando, e só o 9.1 chama o jarvis untrack em skills, workflows e agentes", () => {
  const manter = item91.split("\n").find((l) => l.includes("**Manter versionado**, ou sem resposta"));
  assert.ok(manter, "a opção Manter existe");
  assert.doesNotMatch(manter, /jarvis untrack|git rm|git add|git commit/, "Manter não executa nada");
  const chamadores = [];
  for (const dir of ["skills", "workflows", "agents", "rules", "rules-on-demand"]) {
    const r = spawnSync("grep", ["-rl", "--include=*.md", "jarvis untrack", join(root, dir)], { encoding: "utf-8" });
    for (const f of r.stdout.split("\n").filter(Boolean)) chamadores.push(f.slice(root.length + 1));
  }
  assert.deepEqual(chamadores, ["skills/jarvis-init/assets/upgrade.md"], "nenhum outro texto manda chamar o untrack");
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


// ---- #225: o Upgrade deixa AGENTS.md e CDD-MIND-MAP.md no padrão, com aviso e confirmação (Q5) -------------

const item92 = item(upgrade, "9.2. **Exceção — `AGENTS.md` e `CDD-MIND-MAP.md` no padrão", "10. Acrescentar");

test("upgrade.md 9.2: vem depois do 9.1 e antes do item 10, e o item 5 cita 7 a 9.2", () => {
  const i91 = upgrade.indexOf("9.1. **Exceção");
  const i92 = upgrade.indexOf("9.2. **Exceção");
  const i10 = upgrade.indexOf("10. Acrescentar");
  assert.ok(i91 !== -1 && i92 !== -1 && i10 !== -1 && i91 < i92 && i92 < i10, "9.1 → 9.2 → 10");
  assert.match(upgrade, /os itens 7 a 9\.2 ainda podem alterá-lo/);
});

test("upgrade.md 9.2: nos dois modos, confere mapa, AGENTS.md (linha do mapa e caminho de sessões) e CLAUDE.md igual ao AGENTS.md", () => {
  assert.match(item92, /os dois existem sempre, nos dois modos, e o `CLAUDE\.md` é sempre cópia idêntica do `AGENTS\.md` \(\*\*regra de sincronia\*\* do `SKILL\.md`\)/);
  assert.match(item92, /o `CDD-MIND-MAP\.md` existe, com a tabela do `templates\/cdd-mind-map-template\.md`/);
  assert.match(item92, /o `AGENTS\.md` existe, com a linha `> Mapa de tecnologias do projeto:`/);
  assert.match(item92, /o caminho de sessões `\$SESSIONS_DIR` \(padrão `\.jarvis\/sessions`\) no lugar de `\{IDE_FOLDER\}\/sessions`/);
  assert.match(item92, /\(num `AGENTS\.md` já gerado, a forma resolvida, como `\.claude\/sessions\/`\)/);
  assert.match(item92, /o `CLAUDE\.md` existe e é igual ao `AGENTS\.md`/);
});

test("upgrade.md 9.2: no modo workspace, também o bloco por repositório e uma linha do mapa por repositório com .git, sem filtrar por WORKSPACE_REPOS", () => {
  assert.match(item92, /o bloco entre `<!-- jarvis:repos:start -->` e `<!-- jarvis:repos:end -->` com uma linha por repositório do mapa/);
  assert.match(item92, /uma linha do mapa por repositório com `\.git` \(\*\*todas\*\* as subpastas, sem filtrar por `WORKSPACE_REPOS`\)/);
});

test("upgrade.md 9.2: no modo projeto, o mapa tem uma linha (a raiz) e o bloco de repositórios não se aplica", () => {
  assert.match(item92, /\*\*No modo projeto\*\*, o mapa tem uma linha \(a raiz\) e o bloco de repositórios não se aplica/);
});

test("upgrade.md 9.2: no padrão não pergunta; fora do padrão avisa cada mudança e pede a confirmação antes de gravar", () => {
  assert.match(item92, /\*\*Tudo no padrão:\*\* siga \*\*sem perguntar\*\*/);
  assert.match(item92, /\*\*avise\*\* o que precisa ficar no padrão, listando cada mudança/);
  assert.match(item92, /`AskUserQuestion`: \*\*Ajustar agora\*\* \| \*\*Deixar como está\*\*/);
  assert.match(item92, /Só com \*\*Ajustar agora\*\*, ajuste o que for necessário, mostrando cada mudança/);
  assert.match(item92, /\*\*Sem o Sim, nenhum arquivo muda\.\*\*/);
  const iAviso = item92.indexOf("**avise**");
  const iPergunta = item92.indexOf("`AskUserQuestion`");
  const iAjusta = item92.indexOf("Só com **Ajustar agora**");
  assert.ok(iAviso < iPergunta && iPergunta < iAjusta, "avisa, pergunta e só então ajusta");
});

test("upgrade.md 9.2: com o Sim, cria o mapa e o AGENTS.md que faltam, escreve o mesmo no CLAUDE.md e, para repositório novo, segue o repos.md e volta ao item 10", () => {
  assert.match(item92, /crie o mapa que não existe pelo `assets\/mapa-de-tecnologias\.md`/);
  assert.match(item92, /crie o `AGENTS\.md` que não existe pelo Passo 7 do `SKILL\.md`/);
  assert.match(item92, /pela regra do item 3 do \[repos\.md\]\(repos\.md\)/);
  assert.match(item92, /escreva o mesmo no `CLAUDE\.md` \(um `CLAUDE\.md` escrito à mão, diferente do `AGENTS\.md`, só é sobrescrito com essa confirmação, mostrando a diferença\)/);
  assert.match(item92, /para repositório novo, siga os itens 1 a 5 do \[repos\.md\]\(repos\.md\) \(tabela de papel e stack para a pessoa validar\) e \*\*volte ao item 10 deste arquivo\*\*: o resumo e o fim são os do Upgrade/);
  assert.doesNotMatch(item92, /não é criado aqui/, "o 9.2 cria o mapa e o AGENTS.md que faltam");
});

test("upgrade.md: a nota do terminal cita o item 9.2 e o /jarvis-init repos para repositório fora do mapa", () => {
  const nota = upgrade.split("\n").find((l) => l.startsWith("> No terminal, rode antes"));
  assert.match(nota, /o `AGENTS\.md` e o `CDD-MIND-MAP\.md` no padrão \(item 9\.2\)/);
  assert.match(nota, /repositório fora do mapa: `\/jarvis-init repos`/);
});

test("guias: README, docs/estrutura/skills.md e AGENTS.md citam o /jarvis-init repos", () => {
  assert.match(read("README.md"), /o `AGENTS\.md` e o `CDD-MIND-MAP\.md` no padrão/);
  assert.match(read("docs", "estrutura", "skills.md"), /o argumento `repos` \(`\/jarvis-init repos`\) atualiza o mapa, o bloco de repositórios do `AGENTS\.md` \(cria o `AGENTS\.md` se ainda não existir\) e as especializações/);
  assert.match(read("AGENTS.md"), /^\/jarvis-init repos +# Depois de clonar repositorios \(modo workspace\)/m);
});
