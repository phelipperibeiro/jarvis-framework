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
  assert.match(mapa, /o `\/jarvis-init repos` usa todas as subpastas com `\.git`, pasta ou arquivo/);
  assert.match(mapa, /\*\*Confirmar\*\* \| \*\*Corrigir\*\* \| \*\*Incluir informação\*\*/);
  assert.match(mapa, /\*\*Não reprocesse as linhas existentes\*\*/);
  assert.match(mapa, /acrescente \*\*só ele\*\*/);
});

test("asset do mapa: nunca apaga linha sem perguntar, nunca lê .env* e nunca grava o que a pessoa não confirmou", () => {
  assert.match(mapa, /Apagar uma linha do mapa sem perguntar/);
  assert.match(mapa, /Ler `\.env\*`, chaves, certificados ou credenciais/);
  assert.match(mapa, /Gravar uma linha que a pessoa não confirmou/);
});

test("asset do mapa: cita os cinco fluxos que o usam", () => {
  assert.match(mapa, /Lido por cinco fluxos:/);
  assert.match(mapa, /Passo 2 do `workflows\/warm-up\.md`/);
  assert.match(mapa, /o Passo 7 do `SKILL\.md` \(instalação\)/);
  assert.match(mapa, /o item 9\.2 do \[upgrade\.md\]\(upgrade\.md\)/);
  assert.match(mapa, /sub-passo 9\.8 do \[passo-adicionar-stacks\.md\]/);
  assert.match(mapa, /\[repos\.md\]\(repos\.md\)/);
});

test("asset das stacks: o sub-passo 9.8 completa o mapa (que já existe) pelo asset e termina no passo 9.5 do SKILL.md", () => {
  const s98 = trecho(stacks, "## 9.8 Montar o mapa de tecnologias", "## Tratamento de situações");
  assert.match(s98, /\[mapa-de-tecnologias\.md\]\(mapa-de-tecnologias\.md\)/);
  assert.match(s98, /complete o `CDD-MIND-MAP\.md` \(o mapa de tecnologias, que já existe: o Passo 7 do `SKILL\.md` o monta antes do `AGENTS\.md`;/);
  assert.doesNotMatch(s98, /Pular é permitido/, "o mapa deixou de ser pulável");
  assert.match(s98, /Quem \*\*pulou\*\* o passo das stacks \(9\.2\) não fica sem mapa: ele já foi montado no Passo 7/);
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

// ---- Fase 3: o modo `repos` (Q1 a Q6) -------------------------------------------------------------------

const repos = assets("repos.md");
const preCond = trecho(repos, "## Pré-condições", "## Fluxo (modo workspace)");
const fluxo = trecho(repos, "## Fluxo (modo workspace)", "## Regras");
const passo = (n, prox) => trecho(fluxo, `${n}. **`, prox ? `${prox}. **` : null);

test("SKILL.md: `repos` no argument-hint, na Entrada (reservada) e roteado para o asset sem continuar o onboarding", () => {
  assert.match(skill, /^argument-hint: "\[upgrade \| repos \| nome-do-membro-opcional\]"/m);
  const entrada = trecho(skill, "## Entrada", "## Recursos");
  assert.match(entrada, /`repos` \(sem diferenciar maiúsculas\)/);
  assert.match(entrada, /segue `assets\/repos\.md`/);
  assert.match(entrada, /\*\*não continua o onboarding\*\*/);
  assert.match(skill, /\*\*Modo `repos`\*\*: `\$IDE\/skills\/jarvis-init\/assets\/repos\.md`/);
  const modo = trecho(skill, "### Modo `repos` (`$ARGUMENTS` = `repos`)", "### 2. Verificar Existência do ENV.md");
  assert.match(modo, /só o passo 0 \(versão\) e siga `assets\/repos\.md` do começo ao fim/);
});

test("SKILL.md: tabela de skills invocados traz o modo `repos` chamando /jarvis-create-specialization", () => {
  const linha = skill.split("\n").find((l) => l.startsWith("| Modo `repos` — especializações dos repositórios novos |"));
  assert.ok(linha, "a linha do modo repos existe na tabela");
  assert.match(linha, /`\/jarvis-create-specialization \{área\} \{stack\}`/);
  assert.match(linha, /só backend e frontend/);
});

test("SKILL.md: `_REVIEWERS` saiu da tabela de variáveis opcionais (a chave não está mais no template)", () => {
  assert.doesNotMatch(skill, /_REVIEWERS/);
  assert.match(skill, /\| `CENTRAL_DOCS_REF` \/ `_TARGET_BRANCH` \| `main` \/ `main` \|/);
});

test("repos.md (Q4): modo projeto responde 'não se aplica', indica o /warm-up e não escreve arquivo", () => {
  assert.match(preCond, /Não se aplica ao modo projeto: o mapa tem só a raiz\. Para revisá-la, rode `\/warm-up`\./);
  assert.match(preCond, /repita o aviso do `\/warm-up` \(sugira `jarvis init --upgrade`, sem alterar o ENV\)/);
  assert.match(preCond, /\*\*Termine sem escrever arquivo\.\*\*/);
  assert.match(preCond, /Sem ele, avise "O framework não foi inicializado: rode `\/jarvis-init`" e termine/);
});

test("repos.md (Q2): compara TODAS as subpastas com .git, sem filtrar por WORKSPACE_REPOS", () => {
  const p1 = passo(1, 2);
  assert.match(p1, /\*\*todas\*\* as subpastas com `\.git` \(pasta ou arquivo, como num worktree\)/);
  assert.match(p1, /\*\*sem filtrar por `WORKSPACE_REPOS`\*\*/);
  assert.match(p1, /\*\*novos:\*\*/);
  assert.match(p1, /\*\*ausentes:\*\*/);
  assert.doesNotMatch(repos, /só no mapa/, "o caso 'só no mapa' saiu do modo repos (pedido do usuário no pre-pr)");
});

test("repos.md: sem repositório novo, 'Nada a atualizar.' e nenhum arquivo muda", () => {
  const p1 = passo(1, 2);
  assert.match(p1, /Nada novo, nada ausente e o `AGENTS\.md` existe: responda "Nada a atualizar\." e \*\*termine sem escrever nenhum arquivo\*\*/);
  assert.match(p1, /Sem o `AGENTS\.md`, siga o fluxo: ele é criado no item 3/);
  assert.match(p1, /Um `CLAUDE\.md` fora de sincronia, sem repositório novo, fica para o Upgrade \(item 9\.2 do \[upgrade\.md\]\(upgrade\.md\)\)/);
});

test("repos.md (Q6): tabela com 'O que será gravado' por repositório; tirar a linha deixa o repositório fora de todos os documentos", () => {
  const p2 = passo(2, 3);
  assert.match(p2, /coluna \*\*O que será gravado\*\* por repositório/);
  assert.match(p2, /acrescentar à `WORKSPACE_REPOS`/);
  assert.match(p2, /\*\*Confirmar\*\* \| \*\*Corrigir\*\* \| \*\*Incluir informação\*\*/);
  assert.match(p2, /\*\*Tirar a linha\*\* de um repositório o deixa fora de todos os documentos/);
  assert.match(p2, /volta a ser oferecido na próxima execução e na pendência do `jarvis init --upgrade`/);
});

test("repos.md: o mapa recebe só linhas novas, sem reprocessar as existentes", () => {
  const p3 = passo(3, 4);
  assert.match(p3, /\*\*Mapa:\*\* acrescente só as linhas novas, sem reprocessar as existentes/);
});

test("repos.md: bloco do AGENTS.md entre marcadores, uma linha por repositório, texto fora do bloco idêntico", () => {
  const p3 = passo(3, 4);
  assert.match(p3, /entre `<!-- jarvis:repos:start -->` e `<!-- jarvis:repos:end -->`/);
  assert.match(p3, /`- \*\*\{repo\}\*\* — \{papel\}; \{linguagem\}\/\{framework\} \(\{área\}\)`/);
  assert.match(p3, /o texto \*\*fora do bloco permanece idêntico\*\*/);
});

test("repos.md (Q5 ajustada): AGENTS.md ausente é criado pelo Passo 7 com o CLAUDE.md igual; sem marcadores o bloco entra depois da linha do mapa (ou no fim), na mesma confirmação", () => {
  const p3 = passo(3, 4);
  assert.match(p3, /\*\*`AGENTS\.md` não existe:\*\* \*\*crie-o pelo Passo 7 do `SKILL\.md`\*\*/);
  assert.match(p3, /com o bloco preenchido por todos os repositórios do mapa já confirmado\); o `CLAUDE\.md` nasce igual, pela regra de sincronia/);
  assert.match(passo(2, 3), /Se o `AGENTS\.md` não existe, a tabela avisa que ele será criado e que o `CLAUDE\.md` recebe o mesmo conteúdo \(\*\*regra de sincronia\*\* do `SKILL\.md`\)/);
  assert.match(passo(2, 3), /\*\*Em qualquer caso\*\*, exista ou não o `AGENTS\.md`, um `CLAUDE\.md` diferente do `AGENTS\.md` \(escrito à mão\) aparece na tabela com a diferença, e só é sobrescrito com a confirmação dela/);
  assert.match(p3, /\*\*Existe com os marcadores:\*\* só acrescente as linhas novas entre eles/);
  assert.match(p3, /\*\*Existe sem os marcadores:\*\* insira o bloco, com uma linha por repositório do mapa \(já confirmado\), logo depois da linha `> Mapa de tecnologias do projeto:`; sem essa linha, no fim do arquivo/);
  assert.match(p3, /\*\*na mesma confirmação da tabela\*\* do item 2 \(não é uma pergunta a mais\)/);
});

test("repos.md: o CLAUDE.md recebe sempre o mesmo conteúdo do AGENTS.md (regra de sincronia), e gravar só o AGENTS.md é proibido", () => {
  const p3 = passo(3, 4);
  assert.match(p3, /\*\*`CLAUDE\.md`:\*\* depois de gravar o `AGENTS\.md`, escreva o mesmo conteúdo no `CLAUDE\.md` \(\*\*regra de sincronia\*\* do `SKILL\.md`\): os dois ficam sempre iguais/);
  assert.match(p3, /Um `CLAUDE\.md` diferente do `AGENTS\.md` só é sobrescrito com a confirmação da tabela do item 2, que mostrou a diferença/);
  assert.match(trecho(repos, "## Regras", null), /Gravar o `AGENTS\.md` sem gravar o mesmo no `CLAUDE\.md` \(regra de sincronia\)/);
});

test("repos.md (Q6): WORKSPACE_REPOS só é gravada se preenchida, só acrescenta os nomes confirmados e nenhuma outra chave muda", () => {
  const p3 = passo(3, 4);
  assert.match(p3, /\*\*`WORKSPACE_REPOS`:\*\* só se estiver preenchida, acrescente os nomes confirmados na tabela/);
  assert.match(p3, /nenhuma outra chave do `ENV\.md` muda\. Vazia: não mexa\./);
});

test("repos.md: especializações só dos novos, depois da confirmação, criação só para backend e frontend", () => {
  const p4 = passo(4, 5);
  assert.match(p4, /\*\*Especializações, só dos repositórios novos\*\*, depois da confirmação da tabela/);
  assert.match(p4, /\*\*registrada\*\* em `\{ÁREA\}_SPECIALIZATIONS`: nada/);
  assert.match(p4, /\*\*instalada e não registrada\*\*: ofereça registrar/);
  assert.match(p4, /\*\*inexistente\*\*: ofereça `\/jarvis-create-specialization \{área\} \{stack\}` \(a criação vale só para backend e frontend\)/);
});

test("repos.md: repositório ausente tem pergunta própria (Remover | Manter) e nunca é apagado sem o Sim", () => {
  const p5 = passo(5, 6);
  assert.match(p5, /pergunte \*\*um por vez\*\* com `AskUserQuestion`: \*\*Remover\*\* \| \*\*Manter\*\*/);
  assert.match(p5, /apaga a linha do mapa, a linha do bloco do `AGENTS\.md` \(e o mesmo no `CLAUDE\.md`, pela regra de sincronia\) e o nome da `WORKSPACE_REPOS`/);
  assert.match(p5, /\*\*nunca apague sem o Sim\*\*/);
});

test("repos.md: regras — nunca lê .env*, nunca reprocessa linhas validadas, nunca faz commit, e termina sem arquivo quando nada muda", () => {
  const regras = trecho(repos, "## Regras", null);
  assert.match(regras, /Tocar no texto do `AGENTS\.md` fora do bloco \(o `AGENTS\.md` só é criado quando não existe\)/);
  assert.match(regras, /Ler `\.env\*`, chaves, certificados ou credenciais/);
  assert.match(regras, /Reprocessar as linhas já validadas do mapa/);
  assert.match(regras, /Fazer commit ou push/);
  assert.match(regras, /Terminar sem escrever arquivo quando não há nada a atualizar/);
  assert.match(repos, /um por vez dá o mesmo resultado que todos juntos, e as linhas já validadas não mudam/);
});

// ---- Fase 4: template do AGENTS.md e Passo 7 ---------------------------------------------------------------

const template = read("templates", "engineering", "AGENTS-template.md");
const passo7 = trecho(skill, "### 7. Criar AGENTS.md", "### 8. Rules Sync");

test("AGENTS-template: marcadores do bloco de repositórios uma vez cada, com {REPOS_BLOCK} entre eles", () => {
  const abre = "<!-- jarvis:repos:start -->";
  const fecha = "<!-- jarvis:repos:end -->";
  assert.equal(template.split(abre).length - 1, 1, "um marcador de início");
  assert.equal(template.split(fecha).length - 1, 1, "um marcador de fim");
  const i = template.indexOf(abre);
  const f = template.indexOf(fecha);
  const corpo = template.slice(i, f);
  assert.ok(i < f && corpo.includes("{REPOS_BLOCK}"), "{REPOS_BLOCK} fica entre os marcadores");
  assert.match(corpo, /o mapa \[CDD-MIND-MAP\.md\]\(CDD-MIND-MAP\.md\) é a fonte/);
});

test("AGENTS-template: a linha do mapa vem antes do bloco (é onde o modo repos insere o bloco quando falta)", () => {
  const linha = template.indexOf("> Mapa de tecnologias do projeto: [CDD-MIND-MAP.md](CDD-MIND-MAP.md)");
  assert.notEqual(linha, -1, "o template traz a linha do mapa");
  assert.ok(linha < template.indexOf("<!-- jarvis:repos:start -->"), "a linha do mapa vem antes do bloco");
});

test("AGENTS-template: o caminho das sessões é .jarvis/sessions, sem {IDE_FOLDER}/sessions", () => {
  assert.match(template, /Use `\.jarvis\/sessions` \(o padrão de `SESSIONS_DIR` no `ENV\.md`\) para contexto de tarefas em andamento/);
  assert.doesNotMatch(template, /\{IDE_FOLDER\}\/sessions/);
});

test("SKILL.md Passo 7: o template já traz a linha do mapa; só acrescenta se o AGENTS.md existente não a cita", () => {
  assert.match(passo7, /O template já traz a linha que identifica o mapa de tecnologias do projeto; acrescente-a se o `AGENTS\.md` \*\*já existir\*\* e não a citar/);
});

test("SKILL.md Passo 7 (Q4 e Q5): mapa primeiro, nos dois modos; bloco removido no modo projeto; no workspace, uma linha por repositório do mapa", () => {
  assert.match(passo7, /\*\*Mapa primeiro \(obrigatório, nos dois modos\):\*\* se o `CDD-MIND-MAP\.md` não existe, monte-o agora pelo `assets\/mapa-de-tecnologias\.md`/);
  assert.ok(passo7.indexOf("**Mapa primeiro") < passo7.indexOf("1. Detectar stack"), "o mapa vem antes da criação do AGENTS.md");
  const item7 = trecho(passo7, "7. **Bloco de repositórios**", "8. **`CLAUDE.md` (sempre");
  assert.match(item7, /no \*\*modo projeto\*\*, remova o bloco inteiro, marcadores incluídos/);
  assert.match(item7, /No \*\*modo workspace\*\*, substitua `\{REPOS_BLOCK\}` por uma linha por repositório do `CDD-MIND-MAP\.md`/);
  assert.match(item7, /`- \*\*\{repo\}\*\* — \{papel\}; \{linguagem\}\/\{framework\} \(\{área\}\)`/);
  assert.match(item7, /o mapa já existe \(montado no início deste passo\)/);
  assert.doesNotMatch(item7, /ainda não existe/, "o bloco não nasce mais vazio");
});

test("passo-adicionar-stacks 9.8: depois de gravar o mapa, preenche o bloco do AGENTS.md pelo formato do repos.md", () => {
  const s98 = trecho(stacks, "## 9.8 Montar o mapa de tecnologias", "## Tratamento de situações");
  assert.match(s98, /preencha o bloco `jarvis:repos` com uma linha por repositório do mapa, no formato do item 3 de \[repos\.md\]\(repos\.md\)/);
  assert.match(s98, /o texto fora do bloco não muda/);
});

test("o formato da linha do bloco é o mesmo no Passo 7 e no repos.md", () => {
  const formato = "- **{repo}** — {papel}; {linguagem}/{framework} ({área})";
  assert.ok(passo7.includes(formato), "Passo 7");
  assert.ok(repos.includes(formato), "repos.md");
});

// ---- Fase 6: lacunas da rodada 1 do pre-pr -----------------------------------------------------------------

test("repos.md: chamado pelo Upgrade (9.2), faz os itens 1 a 5 e volta ao item 10 do upgrade.md", () => {
  assert.match(repos, /\*\*Chamado pelo Upgrade\*\* \(item 9\.2 do \[upgrade\.md\]\(upgrade\.md\)\), faça os itens 1 a 5 e volte ao item 10 do `upgrade\.md`: o resumo e o fim são os do Upgrade/);
});

test("passo-adicionar-stacks 9.8: o bloco jarvis:repos só é preenchido no modo workspace", () => {
  const s98 = trecho(stacks, "## 9.8 Montar o mapa de tecnologias", "## Tratamento de situações");
  assert.match(s98, /No modo workspace, depois de gravar o mapa, se o `AGENTS\.md` existir, preencha o bloco `jarvis:repos`/);
});

test("mapa-de-tecnologias e repos.md: repositório é subpasta com .git, pasta ou arquivo (worktree)", () => {
  assert.doesNotMatch(mapa, /subpastas com `\.git\/`/);
  assert.doesNotMatch(repos, /subpastas com `\.git\/`/);
});

test("template do mapa: o /warm-up respeita WORKSPACE_REPOS e o /jarvis-init repos e o Upgrade usam todas as subpastas com .git", () => {
  const t = read("templates", "cdd-mind-map-template.md");
  assert.match(t, /o \/warm-up respeita WORKSPACE_REPOS, se preenchida; o \/jarvis-init repos e o Upgrade usam todas as subpastas com \.git/);
});

test("guias: README, bin.md, templates.md, visao-geral.md e especializacoes-de-stack.md descrevem o repos e a pendência do --upgrade", () => {
  assert.match(read("README.md"), /manda rodar o `\/jarvis-init upgrade` quando há pendência da IDE e o `\/jarvis-init repos` quando há repositório \(subpasta com `\.git`\) fora do mapa/);
  const bin = read("docs", "estrutura", "bin.md");
  assert.match(bin, /repos-map \(repositórios com `\.git` fora do `CDD-MIND-MAP\.md`, só lê, #225\)/);
  assert.match(bin, /lista numa linha própria os repositórios \(todas as subpastas com `\.git`, sem filtrar por `WORKSPACE_REPOS`\) que não estão no mapa e orienta `\/jarvis-init repos`/);
  assert.match(read("docs", "estrutura", "templates.md"), /AGENTS-template\.md +# gera AGENTS\.md do projeto alvo \(com a linha do mapa e, no modo workspace, o bloco de repositórios mantido pelo \/jarvis-init repos\)/);
  assert.match(read("docs", "visao-geral.md"), /Depois de clonar repositórios no workspace, `\/jarvis-init repos` atualiza o mapa, o bloco de repositórios do `AGENTS\.md` \(cria o `AGENTS\.md` se ainda não existir\) e as especializações/);
  assert.match(read("docs", "especializacoes-de-stack.md"), /Depois de clonar repositórios novos no workspace, `\/jarvis-init repos` registra \(ou oferece criar\) as especializações só dos repositórios novos/);
});

// ---- Fase 7: lacunas da rodada 2 do pre-pr ----------------------------------------------------------------

test("SKILL.md: o modo repos não faz as perguntas do onboarding, salvo as do Passo 7 quando cria o AGENTS.md", () => {
  const entrada = trecho(skill, "## Entrada", "## Recursos");
  assert.match(entrada, /\*\*não continua o onboarding\*\* \(a única exceção é o Passo 7, quando o `AGENTS\.md` não existe e o modo o cria: só as perguntas que ele mesmo faz\)/);
  const modo = trecho(skill, "### Modo `repos` (`$ARGUMENTS` = `repos`)", "### 2. Verificar Existência do ENV.md");
  assert.match(modo, /termina sem continuar o fluxo \(passos 1 a 13\), salvo o Passo 7, quando o `AGENTS\.md` não existe \(só as perguntas que ele mesmo faz\)/);
});

test("guias: dizem que o /jarvis-init repos cria o AGENTS.md se ele ainda não existir", () => {
  assert.match(read("docs", "estrutura", "skills.md"), /o bloco de repositórios do `AGENTS\.md` \(cria o `AGENTS\.md` se ainda não existir\)/);
  assert.match(read("docs", "visao-geral.md"), /o bloco de repositórios do `AGENTS\.md` \(cria o `AGENTS\.md` se ainda não existir\)/);
  assert.match(read("AGENTS.md"), /bloco do AGENTS\.md \(cria o AGENTS\.md se faltar\)/);
});

// ---- Fase 8: lacunas da rodada 3 do pre-pr ----------------------------------------------------------------

test("SKILL.md: a regra de sincronia (AGENTS.md fonte, CLAUDE.md cópia idêntica, sempre presentes) e o item 8 do Passo 7 que a aplica", () => {
  const regra = trecho(skill, "## Regra de sincronia: `AGENTS.md` e `CLAUDE.md` (sempre)", "## Fluxo de Execução");
  assert.match(regra, /O `AGENTS\.md` da raiz do workspace é a \*\*fonte\*\*; o `CLAUDE\.md` é sempre uma \*\*cópia idêntica\*\* dele, em qualquer IDE/);
  assert.match(regra, /o Claude Code lê o `CLAUDE\.md`; Cursor e VS Code \(Copilot\) leem o `AGENTS\.md`/);
  assert.match(regra, /\*\*Toda escrita no `AGENTS\.md` escreve o mesmo no `CLAUDE\.md`, na mesma ação:\*\*/);
  assert.match(regra, /`CLAUDE\.md` com conteúdo diferente do `AGENTS\.md` \(escrito à mão\): não o sobrescreva sem confirmação/);
  assert.match(regra, /`AGENTS\.md`, `CLAUDE\.md` e `CDD-MIND-MAP\.md` existem \*\*sempre\*\*, nos dois modos de trabalho/);
  const item8 = trecho(passo7, "8. **`CLAUDE.md` (sempre, exista ou não o `AGENTS.md`):**", null);
  assert.match(item8, /pela \*\*regra de sincronia\*\* \(seção acima\), em qualquer IDE, ele é cópia idêntica do `AGENTS\.md`/);
  assert.match(item8, /se não existir, crie-o com o mesmo conteúdo do `AGENTS\.md`/);
  assert.match(item8, /se já existir com outro conteúdo \(escrito à mão\), mostre a diferença e pergunte antes de sobrescrever/);
  assert.match(passo7, /Se o `AGENTS\.md` não existir na raiz do projeto \(itens 1 a 7; o item 8 vale sempre\):/, "o item 8 não fica preso à condição");
  assert.match(skill, /│ {2}7\. CRIAR → mapa, AGENTS\.md e CLAUDE\.md \(cópia\) +│/, "diagrama do fluxo");
  assert.match(skill, /\(usado pelo `\/warm-up`, pelo Passo 7, pelo sub-passo 9\.8 das stacks, pelo Upgrade \(item 9\.2\) e pelo modo `repos`\)/);
  assert.doesNotMatch(item8, /só se a IDE for `claude`/, "a cópia não depende mais da IDE");
});

test("repos.md: não repete a regra do CLAUDE.md (aponta para o item 8 do Passo 7) e a linha 3 cita a exceção do Passo 7", () => {
  assert.doesNotMatch(repos, /como cópia\)/, "a regra da cópia não é repetida no repos.md");
  assert.match(repos, /Termina aqui, sem continuar o onboarding, salvo o Passo 7 quando o `AGENTS\.md` não existe e o modo o cria\./);
});

// ---- Fase 9: documentos sempre existentes e CLAUDE.md espelho ------------------------------------------------

test("AGENTS.md do repositório do Jarvis: a convenção da sincronia AGENTS.md/CLAUDE.md fica escrita para as evoluções", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /### AGENTS\.md e CLAUDE\.md sempre sincronizados/);
  assert.match(agents, /o `AGENTS\.md` é a fonte e o `CLAUDE\.md` é sempre cópia idêntica dele/);
  assert.match(agents, /todo texto \(skill, workflow, asset, template\) ou código que escreve no `AGENTS\.md` precisa escrever o mesmo no `CLAUDE\.md` e citar a "regra de sincronia"/);
});

test("todo ponto que escreve no AGENTS.md cita a regra de sincronia (Passo 7, 9.8, repos.md, Upgrade 9.2, warm-up)", () => {
  assert.match(trecho(passo7, "8. **`CLAUDE.md` (sempre", null), /regra de sincronia/, "Passo 7");
  assert.match(trecho(stacks, "## 9.8 Montar o mapa de tecnologias", "## Tratamento de situações"), /regra de sincronia/, "9.8");
  assert.match(passo(3, 4), /regra de sincronia/, "repos.md item 3");
  assert.match(passo(5, 6), /regra de sincronia/, "repos.md item 5 (ausentes)");
  assert.match(read("skills", "jarvis-init", "assets", "upgrade.md"), /9\.2\. \*\*Exceção[^\n]*regra de sincronia/, "Upgrade 9.2");
  assert.match(passo2, /acrescente uma linha \(e a mesma no `CLAUDE\.md`, pela regra de sincronia do `\$IDE\/skills\/jarvis-init\/SKILL\.md`\)/, "warm-up Passo 2");
});

test("mapa-de-tecnologias.md: o mapa existe sempre, nos dois modos (instalação e Upgrade o criam)", () => {
  assert.match(mapa, /Ele \*\*existe sempre\*\*, nos dois modos: a instalação \(Passo 7 do `SKILL\.md`\) e o Upgrade \(9\.2\) o criam quando falta/);
});

test("guias: mapa e AGENTS.md sempre presentes, CLAUDE.md cópia do AGENTS.md e as pendências novas do --upgrade", () => {
  assert.match(read("README.md"), /os dois existem sempre, nos dois modos, e o `CLAUDE\.md` é sempre cópia do `AGENTS\.md`/);
  assert.match(read("docs", "estrutura", "bin.md"), /lista como pendência do `\/jarvis-init upgrade` o `CDD-MIND-MAP\.md` ou o `AGENTS\.md` ausentes e o `CLAUDE\.md` ausente ou diferente do `AGENTS\.md`/);
  assert.match(read("docs", "estrutura", "skills.md"), /`AGENTS\.md`, `CLAUDE\.md` \(cópia idêntica do `AGENTS\.md`\) e `CDD-MIND-MAP\.md` existem sempre, nos dois modos/);
  assert.match(read("docs", "visao-geral.md"), /o `CLAUDE\.md` \(sempre cópia do `AGENTS\.md`\) ou o mapa faltarem ou estiverem fora do padrão/);
  assert.match(read("docs", "especializacoes-de-stack.md"), /o mapa de tecnologias não é pulado: ele é montado antes, no Passo 7/);
});
