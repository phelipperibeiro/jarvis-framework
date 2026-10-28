// Guarda a regra de ouro (#184): nada é comentado nem publicado sem mostrar o texto e perguntar.
// Confere a regra geral, o passo de pergunta do skill de comentário, a pergunta junto de cada ponto
// que envia algo (comentário, push, MR, issue, Central docs) e a ausência dos imperativos antigos.
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
const ENG_PRE_PR = "workflows/engineering/eng.pre-pr.md";
const SPEC_CONSOLIDATE = "workflows/engineering/eng.spec-consolidate.md";
const GLOBAL_PR = "skills/eng-global-pr/SKILL.md";
const PR_RULES = "rules-on-demand/engineering/eng.pr-rules.md";

// Arquivos que enviam algo para fora e precisam citar a regra (teste 3)
const CITAM_A_REGRA = [
  "workflows/engineering/eng.start.md",
  "workflows/engineering/eng.plan.md",
  "workflows/engineering/eng.work.md",
  "workflows/engineering/eng.light-arch.md",
  ENG_PR,
  GLOBAL_PR,
  TASK_COMMENT,
  REPORT_ISSUE,
  "templates/engineering/advisor-template.md",
  "agents/engineering/qa/eng.qa.quality-champion-task-agent.md",
  "skills/eng-global-tech-spec/references/delivery-spec.md",
  "workflows/engineering/data/data.contract.md",
  "workflows/product/prod.spec.issue.md",
  "skills/jarvis-docs-central/SKILL.md",
  SPEC_CONSOLIDATE,
];

// Varridos no teste 5: o imperativo que manda publicar sem a pergunta não pode voltar
const PASTAS = [
  "workflows",
  "skills",
  "templates",
  "rules",
  "rules-on-demand",
  "agents",
  "docs/engenharia",
];
const IMPERATIVOS = [
  /Poste \*\*um\*\* comentário/i,
  /poste o comentário de auditoria/i,
  /Posto um comentário na issue/i,
  /comente também no card/i,
  /Comente o bloqueio no card/i,
  /um único comentário no card, com o link/i,
  /Adicionar comentário com link do MR/i,
  /Sempre: comentário no card/i,
  /Mover card para "In Review"/i,
  /mova o card para a etapa/i,
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

// Trecho de `texto` que vai de `linhas` linhas antes da linha `i` até a própria linha `i`.
const janelaAntes = (linhas, i, n) => linhas.slice(Math.max(0, i - n), i + 1).join("\n");

// Trecho entre o primeiro `de` e o primeiro `ate` seguinte (ou o resto do texto).
function trecho(texto, de, ate) {
  const inicio = texto.search(de);
  assert.notEqual(inicio, -1, `trecho não encontrado: ${de}`);
  const resto = texto.slice(inicio);
  const fim = ate ? resto.search(ate) : -1;
  return fim === -1 ? resto : resto.slice(0, fim);
}

test("a regra geral está em eng.integrations-rules.md com o conteúdo-chave e a proibição de início e fim", () => {
  const texto = read(INTEGRATIONS);
  const secao = trecho(texto, /^## Nada é publicado sem perguntar$/m, /^## Comentário no card$/m);
  for (const [padrao, o_que] of [
    [/regra de ouro/, 'a frase-marca "regra de ouro"'],
    [/AskUserQuestion/, "AskUserQuestion"],
    [/Sim, publicar/, 'o rótulo "Sim, publicar"'],
    [/Não, manter só na sessão/, 'o rótulo "Não, manter só na sessão"'],
    [/cada envio/, '"cada envio" (a aprovação não vale para o próximo)'],
    [/push/, "o push"],
    [/Central docs/, "o Central docs"],
    [/Exceção:.*Fase 0 do `eng\.pr`/, "a exceção da Fase 0 do eng.pr"],
  ]) {
    assert.match(secao, padrao, `${INTEGRATIONS}: a seção da regra sem ${o_que}. ${DE_PROPOSITO}`);
  }
  assert.match(
    texto,
    /cada um depois da pergunta/,
    `${INTEGRATIONS}: a lista de eventos sem "cada um depois da pergunta". ${DE_PROPOSITO}`
  );
});

test("o skill eng-global-task-comment mostra o texto e pergunta antes de enviar (passo 0.5, antes do passo 1)", () => {
  const texto = read(TASK_COMMENT);
  const inicio = texto.search(/^### 0\.5 /m);
  const passo1 = texto.search(/^### 1\. /m);
  assert.notEqual(inicio, -1, `${TASK_COMMENT} sem o passo "### 0.5". ${DE_PROPOSITO}`);
  assert.ok(
    passo1 > inicio,
    `${TASK_COMMENT}: o passo 0.5 precisa vir antes do passo 1. ${DE_PROPOSITO}`
  );
  const passo = texto.slice(inicio, passo1);
  for (const padrao of [
    /AskUserQuestion/,
    /Sim, publicar/,
    /Não, manter só na sessão/,
    /task-comment-/,
  ]) {
    assert.match(passo, padrao, `${TASK_COMMENT}: o passo 0.5 sem ${padrao}. ${DE_PROPOSITO}`);
  }
});

test("os arquivos que enviam algo citam a regra de ouro", () => {
  for (const file of CITAM_A_REGRA) {
    assert.match(read(file), /regra de ouro/, `${file} não cita "regra de ouro". ${DE_PROPOSITO}`);
  }
});

test("toda linha que chama o /eng-global-task-comment traz a pergunta na mesma linha", () => {
  // Varre todos os arquivos que podem mandar enviar algo (e não uma lista fixa); o skill em si, os índices de
  // skills e a regra de links (que só cita o skill) ficam de fora, e na regra geral só saem a linha do comando
  // de exemplo, a da cadeia de execução (que só descreve) e a do modo freelance (que só grava no task-log.md).
  const FORA = new Set([
    TASK_COMMENT,
    "skills/AGENTS.md",
    "skills/SKILLS-ROADMAP.md",
    "rules-on-demand/doc-links-rules.md",
  ]);
  // As linhas de árvore de pastas (├── …) só listam o skill.
  const ISENTA = (arquivo, linha) =>
    /^\s*[├└│]/.test(linha) ||
    (arquivo === INTEGRATIONS &&
      (/^\/eng-global-task-comment \{/.test(linha) ||
        /task-log\.md/.test(linha) ||
        /^Para agir no vendor:/.test(linha)));
  const arquivos = [
    "workflows",
    "skills",
    "agents",
    "templates",
    "rules",
    "rules-on-demand",
    "docs",
  ]
    .map((p) => join(root, p))
    .filter((p) => existsSync(p))
    .flatMap(walk)
    .concat(join(root, "README.md"))
    .filter((f) => !FORA.has(relative(root, f).split("\\").join("/")));
  for (const arquivo of arquivos) {
    const nome = relative(root, arquivo).split("\\").join("/");
    readFileSync(arquivo, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        if (!/eng-global-task-comment/.test(linha) || ISENTA(nome, linha)) return;
        const onde = `${nome}:${i + 1}`;
        // O "Sim" vale só como palavra inteira ("assim" não conta).
        assert.match(
          linha,
          /regra de ouro|\bSim\b|escolher|[Mm]ostra o texto e pergunta|pergunta antes|AskUserQuestion/,
          `${onde} chama o /eng-global-task-comment sem a pergunta na linha. ${DE_PROPOSITO}`
        );
        // Redações que dispensam a pergunta não valem, mesmo com a frase da regra na mesma linha.
        // Só o trecho entre parênteses sobre o freelance fica de fora (nesse modo não há pergunta, o skill só registra).
        const semFreelance = linha.replace(/\([^)]*freelance[^)]*\)/gi, "");
        assert.doesNotMatch(
          semFreelance,
          /\bsem (a )?perguntar|\bsem a pergunta|não pergunte|dispens\w+|pule a pergunta|já vale como o Sim|não se aplica/i,
          `${onde} dispensa a pergunta. ${DE_PROPOSITO}`
        );
      });
  }
});

test("nenhum imperativo manda publicar sem a pergunta", () => {
  for (const file of todosMd()) {
    const texto = readFileSync(file, "utf8");
    for (const padrao of IMPERATIVOS) {
      assert.doesNotMatch(
        texto,
        padrao,
        `${rel(file)} ainda tem o imperativo ${padrao}. ${DE_PROPOSITO}`
      );
    }
  }
});

test("cada ponto que envia algo tem a pergunta logo antes", () => {
  // [arquivo, linha do envio, quantas linhas olhar antes, o que precisa aparecer nessa janela]
  const PONTOS = [
    [ENG_PR, /^git push -u origin \{NOME_DA_BRANCH\}$/, 45, /depois da escolha de publicar/],
    [ENG_PR, /^jarvis vcs create-merge/, 30, /exceção da regra de ouro/],
    [ENG_PR, /^git push$/, 8, /regra de ouro/],
    [ENG_PR, /^# só com o Sim da pergunta acima$/, 4, /git commit/],
    [
      GLOBAL_PR,
      /^git push -u origin \{NOME_DA_BRANCH\}$/,
      8,
      /Passos 4 e 5 só acontecem depois da pergunta/,
    ],
    [GLOBAL_PR, /^git push -u origin/, 8, /Fase 0 dele vale como essa pergunta/],
    [GLOBAL_PR, /^\s+git push$/, 8, /só com o Sim da pergunta acima/],
    [PR_RULES, /^\s+git push -u origin/, 6, /regra de ouro/],
    [REPORT_ISSUE, /^jarvis vcs create-issue/, 25, /Sim, abrir a issue/],
    [
      SPEC_CONSOLIDATE,
      /^\s+jarvis docs publish --file .*delivery/,
      6,
      /Publicar no Central docs\?/,
    ],
    [SPEC_CONSOLIDATE, /^\s+jarvis docs publish --file .*feature/, 8, /Publicar no Central docs\?/],
    [TASK_COMMENT, /^jarvis tasks comment/, 15, /Sim, publicar/],
    [TASK_COMMENT, /gh issue comment/, 40, /Sim, publicar/],
    [TASK_COMMENT, /glab issue note/, 40, /Sim, publicar/],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /^jarvis docs publish --file .*delivery/,
      6,
      /depois do \*\*Sim\*\*/,
    ],
    [TASK_COMMENT, /acli jira workitem comment/, 40, /Sim, publicar/],
    [ENG_PR, /gh pr create --repo/, 45, /exceção da regra de ouro/],
  ];
  for (const [file, envio, n, precisa] of PONTOS) {
    const linhas = read(file).split("\n");
    const achadas = linhas.map((l, i) => (envio.test(l) ? i : -1)).filter((i) => i !== -1);
    assert.notEqual(
      achadas.length,
      0,
      `${file}: ponto de envio ${envio} não encontrado. ${DE_PROPOSITO}`
    );
    for (const i of achadas) {
      assert.match(
        janelaAntes(linhas, i, n),
        precisa,
        `${file}:${i + 1}: o envio ${envio} sem ${precisa} antes. ${DE_PROPOSITO}`
      );
    }
  }
});

test("o push das correções do code review só sai depois da pergunta, com AskUserQuestion ou Sim", () => {
  // O bloco do commit de correção vem logo depois do texto do passo; o trecho entre o título do passo e o bloco precisa citar a regra.
  for (const file of [ENG_PR, GLOBAL_PR]) {
    const texto = read(file);
    const bloco = texto.indexOf('git commit -m "fix: corrigir {problema} conforme code review"');
    assert.notEqual(
      bloco,
      -1,
      `${file} sem o bloco do commit de correção do code review. ${DE_PROPOSITO}`
    );
    const antes = texto.slice(0, bloco);
    // O passo é um título de nível 3; as linhas "# ..." dentro do bloco de código não contam como título.
    const titulo = antes.lastIndexOf("\n### ");
    assert.notEqual(
      titulo,
      -1,
      `${file}: sem o título do passo antes do bloco do code review. ${DE_PROPOSITO}`
    );
    const passo = antes.slice(titulo);
    assert.match(
      passo,
      /regra de ouro/,
      `${file}: o passo do push do code review não cita a regra de ouro. ${DE_PROPOSITO}`
    );
    assert.match(
      passo,
      /AskUserQuestion|\bSim\b/,
      `${file}: o passo do push do code review sem AskUserQuestion ou Sim. ${DE_PROPOSITO}`
    );
  }
});

test("o jarvis-report-issue mostra o texto e pergunta antes de abrir a issue", () => {
  const texto = read(REPORT_ISSUE);
  const fase4 = trecho(texto, /^## Fase 4 — Abrir a issue$/m, /^jarvis vcs create-issue/m);
  assert.match(
    fase4,
    /AskUserQuestion/,
    `${REPORT_ISSUE}: a Fase 4 sem AskUserQuestion antes do create-issue. ${DE_PROPOSITO}`
  );
  assert.match(
    fase4,
    /Sim, abrir a issue/,
    `${REPORT_ISSUE}: a Fase 4 sem "Sim, abrir a issue". ${DE_PROPOSITO}`
  );
  assert.match(
    fase4,
    /Não, manter só em `\.jarvis\/issues\/`/,
    `${REPORT_ISSUE}: a Fase 4 sem o rótulo do Não. ${DE_PROPOSITO}`
  );
  assert.match(
    texto,
    /Sem o Sim \(o usuário recusou/,
    `${REPORT_ISSUE}: a Fase 5 sem a mensagem de quando o usuário recusa. ${DE_PROPOSITO}`
  );
});

test("as perguntas que já existiam continuam no eng.pr, no eng.pre-pr e no eng.spec-consolidate", () => {
  const pr = trecho(read(ENG_PR), /^## Fase 0: /m, /^## Fase 1: /m);
  assert.match(pr, /AskUserQuestion/, `${ENG_PR}: a Fase 0 sem AskUserQuestion. ${DE_PROPOSITO}`);
  assert.match(
    pr,
    /Só gerar os arquivos/,
    `${ENG_PR}: a Fase 0 sem a opção "Só gerar os arquivos". ${DE_PROPOSITO}`
  );
  const prePr = trecho(
    read(ENG_PRE_PR),
    /\*\*Modo freelance \(`TASK_MANAGER` vazio\)/,
    /\n4\. Próximo passo/
  );
  assert.match(
    prePr,
    /AskUserQuestion/,
    `${ENG_PRE_PR}: o fechamento 3 sem AskUserQuestion. ${DE_PROPOSITO}`
  );
  assert.match(
    prePr,
    /Não, manter só na sessão/,
    `${ENG_PRE_PR}: o fechamento 3 sem a opção do Não. ${DE_PROPOSITO}`
  );
  const consolidate = trecho(
    read(SPEC_CONSOLIDATE),
    /^## Passo 6: Publicar$/m,
    /^Com `ARTIFACT_STYLE=human-generated`/m
  );
  assert.match(
    consolidate,
    /AskUserQuestion/,
    `${SPEC_CONSOLIDATE}: o Passo 6 sem AskUserQuestion. ${DE_PROPOSITO}`
  );
});

test("a proibição de comentar início ou fim de etapa continua na regra e no skill", () => {
  for (const file of [INTEGRATIONS, TASK_COMMENT]) {
    assert.match(
      read(file),
      /nunca\W*(comentar )?início ou fim/i,
      `${file} sem a proibição de comentar início ou fim de etapa. ${DE_PROPOSITO}`
    );
  }
});

test("os outros pontos que enviam algo (agente, delivery-spec, data.contract, prod.spec.issue, central docs) trazem a pergunta", () => {
  const FRASES = [
    [
      "agents/engineering/qa/eng.qa.quality-champion-task-agent.md",
      /pelo `\/eng-global-task-comment`, que mostra o texto e pergunta/,
    ],
    [
      "skills/eng-global-tech-spec/references/delivery-spec.md",
      /Antes de criar as subtarefas, mostre o texto e pergunte/,
    ],
    [
      "skills/eng-global-tech-spec/references/delivery-spec.md",
      /sem o Sim, entregue só o template formatado e deixe o texto na sessão/,
    ],
    ["workflows/engineering/eng.light-arch.md", /sem o Sim, o texto fica só na sessão/],
    ["skills/eng-global-pr/SKILL.md", /Sem o Sim, grave o `pull-request\.md` na sessão e pare/],
    ["workflows/product/prod.spec.issue.md", /só com o Sim, abra o card/],
    [
      "skills/eng-global-tech-spec/references/delivery-spec.md",
      /com o `\/eng-global-task-comment`, que mostra o texto e pergunta/,
    ],
    [
      "workflows/engineering/data/data.contract.md",
      /pergunte com `AskUserQuestion` antes de notificar/,
    ],
    [
      "workflows/engineering/data/data.contract.md",
      /pergunte com `AskUserQuestion` antes de criar/,
    ],
    ["workflows/product/prod.spec.issue.md", /pergunte com `AskUserQuestion` \(regra de ouro/],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /só roda depois da pergunta do `\/eng\.spec-consolidate`/,
    ],
    [INTEGRATIONS, /Exceção:.*e, conforme a opção, como a revisão do texto/],
    [INTEGRATIONS, /documentos aprovados juntos .* são um envio/],
    [
      "workflows/engineering/eng.start.md",
      /sem o Sim, o texto fica no `task-comment-\*\.md` e no `architecture\.md`/,
    ],
  ];
  for (const [file, frase] of FRASES) {
    assert.match(read(file), frase, `${file} sem ${frase}. ${DE_PROPOSITO}`);
  }
  // O passo 0.5 só pode pular a pergunta no caso do acesso manual (que não tem envio possível).
  const passo05 =
    read(TASK_COMMENT)
      .split(/^### 1\. /m)[0]
      .split(/^### 0\.5 /m)[1] ?? "";
  const pulos = passo05.split("\n").filter((l) => /pule a pergunta|dispens/i.test(l));
  assert.equal(
    pulos.length,
    1,
    `${TASK_COMMENT}: o passo 0.5 só pode pular a pergunta uma vez (acesso manual). ${DE_PROPOSITO}`
  );
  assert.match(
    pulos[0],
    /manual/,
    `${TASK_COMMENT}: a única saída sem pergunta do passo 0.5 é o acesso manual. ${DE_PROPOSITO}`
  );
});
