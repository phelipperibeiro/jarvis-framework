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
  "A regra de ouro é guardada de propósito (#184): ao mudar o texto, atualize test/publish-comments-rules.test.js junto.";

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
const PASTAS = ["workflows", "skills", "templates", "rules", "rules-on-demand", "agents", "docs"];
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
  // Board e git só pela CLI oficial (eng.integrations-rules.md): nada de REST nem MCP para criar ou ler o board.
  /\bAPI\s*(?:\/|ou)\s*ferramenta\s+dispon/i,
  /\bAtlassian:\w+/,
];

// Label no PR e anexo no card também são envios: só com a pergunta. Conferidos oração por oração (separadas por
// ".", ";" e ":"), para a negação de um verbo não isentar o imperativo de outro ("Adicione o label; não anexe nada").
// Isenta a oração: "regra de ouro", "Sim", "pergunt", "oriente a pessoa/o usuário a <verbo>" ("Oriente a pessoa e
// adicione…" e "…a revisar e adicione" acusam) e a negação do verbo ("o Jarvis não anexa nada na issue", "não comente nem abra card", "sem avisar os consumidores"). O infinitivo de criar/abrir só conta no
// início da oração ("- Criar card no board"); "sugira abrir os cards" e "ou abrir os cards" são opções para a pessoa. "sem
// perguntar", "não precisa perguntar" e "não pergunte" anulam as isenções. Só o verbo conta ("anexe", "vincule",
// "faça upload", "pôr"), não o substantivo ("Anexos no card"), o particípio ("associado ao card") nem a preposição
// "por".
const ISENTA_ENVIO = String.raw`(?!(?!.*\b(?:sem\s+(?:a\s+)?|não\s+precisa\s+(?:de\s+)?|não\s+)pergunt(?!a\s+duas)).*(?:regra de ouro|\bSim\b|pergunt|orient\w*\s+(?:a\s+pessoa|o\s+usu\w*)\s+a\s+(?!revis)\w|\ba\s+pessoa\s+(?:pode\s+|deve\s+)?\w+))`;
const IMPERATIVOS_POR_ORACAO = [
  new RegExp(
    String.raw`^(?!.*\b(?:não|nem|nunca|jamais|sem)\s+(?:adicion|colo(?:c|qu)|ponh|apli(?:c|qu)|marqu|inclu|rotul|etiquet)\w*\b)${ISENTA_ENVIO}.*(?:\b(?:adicion\w+|colo(?:c|qu)\w+|pôr|ponh\w+|apli(?:c|qu)\w+|inclu\w+)\s+(?:[oa]s?\s+)?(?:labels?\b|tags?\b.*\b(?:ao|no)\s+(?:PR|MR)\b)|\b(?:marqu|etiquet)\w+\s+(?:[oa]s?\s+)?(?:PRs?|MRs?)\b|\b(?:adicion\w+|colo(?:c|qu)\w+|ponh\w+|apli(?:c|qu)\w+)\s+\x60?[\w-]+\x60?\s+(?:(?:ao|no)\s+(?:PR|MR)\s+)?como\s+(?:label|tag)\b|\brotul\w+\s+(?:[oa]s?\s+)?(?:PRs?|MRs?)\b)`,
    "iu"
  ),
  new RegExp(
    String.raw`^(?!.*\b(?:não|nem|nunca|jamais|sem)\s+(?:anex|vincul|associ|fa[çz]|sub|envi)\w*\b)${ISENTA_ENVIO}.*(?:\b(?:anex(?:a|e|ar|em|ando|á-l[ao])|vincul(?:e|ar|em|ando)|associ(?:e|ar|em|ando)|fa[çz]\w*\s+(?:o\s+)?(?:upload|attach)|suba)\b.*(?:^|\s)(?:no|na|nos|nas|ao|aos|à|às|para\s+[oa]s?)\s+(?:Jira|issues?|cards?|tickets?|histórias?)\b|\bcomo\s+anexo\s+(?:d[oa]|n[oa])\s+(?:issue|card|ticket|história)\b)`,
    "iu"
  ),
  // Notificar ou comunicar a squad, o time, o canal ou os stakeholders também é envio (só o imperativo; "deve ser
  // comunicada no canal" descreve o processo para pessoas).
  new RegExp(
    String.raw`^(?!.*\b(?:não|nem|nunca|jamais|sem)\s+(?:notific|comunic|avis|post|envi|public|mand|inform|dispar|cri|abr)\w*\b)${ISENTA_ENVIO}.*(?:\b(?:notifi(?:car|ca|que|cando)|comuni(?:car|ca|que|cando)|avis(?:ar|e|ando)|post(?:ar|e|em|ando)|envi(?:ar|e|em|ando)|publi(?:car|que|cando)|mand(?:ar|e|em|ando)|inform(?:ar|e|em|ando)|dispar(?:ar|e|em|ando))\b(?:\s+(?!que\b)\S+){0,4}?\s+(?:(?:[oa]s?|à|às|ao|aos|n[oa]s?|para\s+[oa]s?|em)\s+)?(?:squads?|times?|canal|canais|equipes?|stakeholders?|requisitante|PM|owner|consumidores|Slack)\b|(?:\b(?:cri(?:e|em|ando)|abr(?:a|am|indo))|^\s*(?:[-*+]\s+|\d+[.)]\s+)?(?:criar|abrir))\s+(?:(?:[oa]s?|um|uma)\s+)?(?:(?:cards?|issues?|tickets?)\b|(?:subtarefas?|workitems?)\b.*\b(?:no|na)\s+(?:Jira|board)\b))`,
    "iu"
  ),
];

// Dirent.isDirectory() não segue link simbólico, então um link quebrado ou circular não derruba a varredura.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return walk(caminho);
    return entrada.isFile() && caminho.endsWith(".md") ? [caminho] : [];
  });
}
// Documentos históricos (guias de migração, por exemplo) podem citar o texto antigo de propósito.
// Valem nos testes 4 e 5; as pastas ainda não existem, e o nome é só o que vale quando aparecerem.
// A trash-archived-docs/ guarda arquivos mortos: ficam fora como os históricos; o CHANGELOG.md é histórico e não
// entra nas pastas varridas.
const HISTORICO = /^(?:docs\/(?:historico|migracao)|trash-archived-docs)\//;
const ehHistorico = (arquivo) => HISTORICO.test(relative(root, arquivo).split("\\").join("/"));

// Orações que ficam fora da recusa: terminam em vírgula, ponto, ponto e vírgula, dois-pontos, travessão,
// meia-risca, parêntese ou na conjunção "e"/"mas". Só o "nunca"/"jamais" segue no "e sem …", que continua a
// mesma negação ("nunca comente e sem perguntar"); "nem" e "nada" param no "e" ("nem sempre há board e …").
// Cobrem o modo freelance ("freelance pula", "freelance não pergunte" e "freelance (…)", em que o skill só
// registra; "freelance: …" vale até a vírgula, o ponto final, "!", "?", o ponto e vírgula ou o "e"/"mas", com o
// ponto de um nome de arquivo como `task-log.md` dentro da oração; texto do freelance que siga depois da vírgula
// vai entre parênteses) e as orações negadas ("nunca … sem perguntar"), mas não a condicional ("se nada mudou, …").
// O freelance só é isento como sujeito da oração: "não-freelance", "fora do/de freelance", "ao contrário do modo
// freelance", "exceto no/em freelance", "salvo no freelance", "com exceção do freelance", "a não ser no
// freelance" e "quando não é freelance" falam do modo com board e não são isentos.
// O "e sem …" só continua a negação de um "nunca/jamais" seguido de verbo de envio ("nunca comente e sem
// perguntar"); em "nunca há board e sem perguntar …" a oração seguinte é outra.
const FIM_SIMPLES = String.raw`(?=\s(?:e|mas)\s|[;),.:—–]|$)`;
const FIM_DO_NUNCA = String.raw`(?=\s(?:e|mas)\s(?!sem\b)|[;),.:—–]|$)`;
const VERBO_DE_ENVIO = String.raw`(?:publi\w+|coment\w+|envi\w+|post\w+|abr\w+|cri\w+|fa[çz]\w*|d[êe]\s+push)`;
const FIM_DO_FREELANCE = String.raw`(?=\s(?:e|mas)\s|[;,!?—–]|\.(?=\s|$)|$)`;
const SUJEITO_FREELANCE = String.raw`(?<![-A-Za-zÀ-ÿ])(?<!(?<![A-Za-zÀ-ÿ])(?:fora|contrário|exceto|salvo|exceção|ser|é|for)\s+(?:d[eoa]\s+|n[oa]\s+|em\s+)?(?:modo\s+)?)freelance`;
const semFreelance = (linha) =>
  linha
    .replace(new RegExp(String.raw`${SUJEITO_FREELANCE}\s*\([^)]*\)`, "gi"), "")
    .replace(
      new RegExp(
        String.raw`${SUJEITO_FREELANCE}:(?:[^;,.!?—–]|\.(?!\s|$))*?${FIM_DO_FREELANCE}`,
        "gi"
      ),
      ""
    )
    .replace(
      new RegExp(
        String.raw`${SUJEITO_FREELANCE}(?=\s+pula\b|\s+não pergunt)[^;),.:—–]*?${FIM_SIMPLES}`,
        "gi"
      ),
      ""
    );
const semIsencoes = (linha) =>
  semFreelance(linha)
    .replace(
      new RegExp(
        String.raw`(?<!\bse\s+)\b(?:nunca|jamais)\s+${VERBO_DE_ENVIO}[^;),.:—–]*?${FIM_DO_NUNCA}`,
        "gi"
      ),
      ""
    )
    .replace(
      new RegExp(String.raw`(?<!\bse\s+)\b(?:nunca|jamais)\b[^;),.:—–]*?${FIM_SIMPLES}`, "gi"),
      ""
    )
    .replace(
      new RegExp(String.raw`(?<!\bse\s+)\b(?:nada|nem)\b[^;),.:—–]*?${FIM_SIMPLES}`, "gi"),
      ""
    )
    // "não … sem perguntar" e "não … automaticamente" negam o envio sem pergunta ("o push não sai sem perguntar",
    // "o Jarvis não move o card automaticamente"); "Sem a aprovação, …" no começo da oração é condição.
    .replace(
      /\bnão\s+(?!só\b|apenas\b|somente\b)(?:(?!e\s|mas\s|só\s|apenas\s|somente\s)[\p{L}-]+\s+){0,4}?(?:sem\s+(?:a\s+)?(?:pergunt\w*|confirmação|aprovação)|automaticamente)/giu,
      ""
    )
    .replace(
      /(?:^|[.;:(—–]\s*|\*\*\s*)sem\s+(?:a\s+|o\s+)?(?:pergunta|confirmação|aprovação|Sim)\b[^,;.]*,/giu,
      ""
    );

// A linha seguinte continua a mesma frase quando não está em branco (linha em branco fecha o parágrafo) e não
// abre item, título, tabela, citação, bloco, HTML, régua ou árvore, nem chama o skill de novo. Negrito no começo
// da linha e "#184" continuam a frase (no markdown, ficam no mesmo parágrafo).
const NOVO_BLOCO = /^\s*$|^\s*(?:[-*+]\s|\d+[.)]\s|#{1,6}\s|\||>|```|<|---|[├└│])/;
// Numa citação (linhas com ">"), a linha seguinte com ">" continua a mesma citação.
const CITACAO = /^\s*>/;
const continuacao = (todas, i) => {
  const proxima = todas[i + 1] ?? "";
  if (/eng-global-task-comment/.test(proxima)) return "";
  if (CITACAO.test(todas[i] ?? "") && CITACAO.test(proxima)) return proxima;
  return NOVO_BLOCO.test(proxima) ? "" : proxima;
};
// A linha anterior faz parte da frase quando a linha `i` a continua (não abre bloco) e ela não está em branco nem
// é título, tabela ou bloco; numa citação, a linha anterior com ">" faz parte.
const anterior = (todas, i) => {
  const antes = todas[i - 1] ?? "";
  if (CITACAO.test(todas[i] ?? "") && CITACAO.test(antes)) return antes;
  if (NOVO_BLOCO.test(todas[i] ?? "") || !antes.trim()) return "";
  return /^\s*(?:#{1,6}\s|\||```|>)/.test(antes) ? "" : antes;
};

// Redações que dispensam a pergunta. Os espaços aceitam repetição, NBSP e quebra com recuo. O teste guarda
// redação: a lista cobre as formas achadas nas revisões, não todo sinônimo possível.
const RECUSA = new RegExp(
  [
    String.raw`\bsem\s+(?:a\s+)?perguntar`,
    String.raw`\bsem\s+a\s+pergunta`,
    String.raw`\bsem\s+pedir\s+confirma`,
    String.raw`\bsem\s+(?:a\s+)?confirmação`,
    String.raw`\bsem\s+(?:a\s+)?aprovação`,
    String.raw`\bsem\s+consultar`,
    String.raw`não\s+pergunte`,
    String.raw`não\s+precisa\s+(?:de\s+)?(?:perguntar|da\s+pergunta|confirma)`,
    String.raw`\bpul(?:e|a|ar|ando)\s+a\s+pergunta`,
    String.raw`\bomit\w*\s+a\s+pergunta`,
    String.raw`\bautomaticamente\b`,
    String.raw`não\s+se\s+pergunta\b`,
    String.raw`não\s+é\s+necessário\s+perguntar`,
    String.raw`já\s+vale\s+como\s+o\s+Sim`,
    String.raw`regra\s+de\s+ouro\s+não\s+se\s+aplica`,
    String.raw`não\s+é\s+preciso\s+perguntar`,
  ].join("|"),
  "i"
);
// Dispensas escritas com nunca/nem/jamais/nada, que a isenção das orações negadas apagaria: olhadas no texto só
// sem as isenções do freelance.
// "nunca pergunta duas vezes" é contra a pergunta dupla, não dispensa; "nada impede" só conta seguido de
// "sem perguntar".
const NUNCA_PERGUNTE =
  /\b(?:nunca|nem|jamais)\s+(?:(?:é|precisa|vai|se)\s+(?:preciso\s+)?)?pergunt(?:e|a|ar|ando)\b(?!\s+duas\s+vezes)|\b(?:nunca|jamais|não)\s+espere\s+(?:o|pelo)\s+Sim\b|\bnada\s+impede\b[^.;]*\bsem\s+(?:a\s+)?pergunt/i;
// "dispens…" vale como recusa, salvo logo depois de "não" ou "sem" (com até três palavras de ligação: "não
// pode dispensar", "não a dispense", "não deve ser dispensada", "sem dispensar"); o "não" de outra oração
// ("não espere e dispense") não conta. A negação é conferida só nos 40 caracteres antes de cada "dispens".
const NEGA_O_DISPENS =
  /\b(?:não|sem)\s+(?:(?:a|o|as|os|lhe|pode|podem|deve|devem|precisa|vai|se|é|ser|foi|está|fica)\s+){0,3}$/i;
const dispensa = (texto) =>
  [...texto.matchAll(/\bdispens\w*/gi)].some(
    (m) => !NEGA_O_DISPENS.test(texto.slice(Math.max(0, m.index - 40), m.index))
  );
// As isenções valem linha a linha: o fim da linha fecha a oração negada, mesmo com a frase juntada.
const recusa = (linhas) => {
  const limpo = linhas.map(semIsencoes).join(" ");
  return (
    RECUSA.test(limpo) || dispensa(limpo) || NUNCA_PERGUNTE.test(linhas.map(semFreelance).join(" "))
  );
};

function todosMd() {
  return PASTAS.map((p) => join(root, p))
    .filter((p) => existsSync(p))
    .flatMap(walk)
    .filter((f) => !ehHistorico(f));
}

// A linha do passo 0.5 que pula a pergunta no acesso manual (sem envio possível); o teste do passo 0.5 confere
// que ela é a única.
const ACESSO_MANUAL =
  /^- \*\*`TASK_MANAGER_ACCESS` `manual` ou inválido:\*\* não há envio possível; pule a pergunta/;
// Nas janelas, as exceções apagam só a frase isenta, não a linha inteira.
const semExcecoes = (file, l) => {
  let s = file === TASK_COMMENT && ACESSO_MANUAL.test(l) ? l.replace("pule a pergunta", "") : l;
  if ((file === ENG_PR || file === GLOBAL_PR) && EXCECAO_DA_FASE_0(s))
    s = s.replace(/não (?:se )?pergunt\w* de novo/, "");
  return s;
};

// A 4.3 do eng.pr e o Passo 4 do eng-global-pr registram a exceção da Fase 0 (que já vale como a pergunta do
// push e do PR) e mandam não perguntar de novo: é a exceção da regra geral, não uma dispensa.
const EXCECAO_DA_FASE_0 = (l) =>
  /exceção da regra/.test(l) && /não (?:se )?pergunt\w* de novo/.test(l);

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
        (/^4\. Eventos relevantes/.test(linha) &&
          /task-log\.md/.test(linha) &&
          /não para board/.test(linha)) ||
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
    .concat(["README.md", "AGENTS.md"].map((p) => join(root, p)).filter(existsSync))
    .filter((f) => !FORA.has(relative(root, f).split("\\").join("/")) && !ehHistorico(f));
  for (const arquivo of arquivos) {
    const nome = relative(root, arquivo).split("\\").join("/");
    readFileSync(arquivo, "utf8")
      .split("\n")
      .forEach((linha, i, todas) => {
        if (!/eng-global-task-comment/.test(linha)) return;
        const onde = `${nome}:${i + 1}`;
        const frase = [linha, continuacao(todas, i)];
        const fraseToda = [anterior(todas, i), ...frase];
        // O "Sim" vale só como palavra inteira ("assim" não conta). A pergunta pode estar na continuação da frase.
        // As linhas isentas só descrevem o skill: dispensam a pergunta na linha, não a recusa abaixo.
        if (!ISENTA(nome, linha))
          assert.match(
            frase.join(" "),
            /regra de ouro|\bSim\b|escolher um dos \*\*Sim\*\*|[Mm]ostra o texto e pergunta|pergunta antes|AskUserQuestion/,
            `${onde} chama o /eng-global-task-comment sem a pergunta na linha. ${DE_PROPOSITO}`
          );
        // Redações que dispensam a pergunta não valem, mesmo com a frase da regra na mesma linha.
        assert.ok(!recusa(fraseToda), `${onde} dispensa a pergunta. ${DE_PROPOSITO}`);
      });
  }
});

// Board e git só pela CLI oficial (eng.integrations-rules.md): uma linha que manda usar MCP ou a API (REST) do
// board não vale; a proibição ("sem REST nem MCP", "não use o MCP do Jira") vale.
const MCP_DO_BOARD =
  /\b(?:API(?:\s+v?\d+)?(?:\s+REST)?|endpoints?(?:\s+REST)?|REST\s+API)\s+d[oa]\s+`?(?:Jira|Atlassian|GitHub|GitLab|board|\$?TASK_MANAGER)\b|\b(?:Jira|Atlassian|GitHub|GitLab)\s+(?:Cloud\s+)?(?:REST\s+)?API\b|\/rest\/(?:api|agile)\/|\bMCPs?[\s/]+(?:(?:configurad|específic|especific|disponív|instalad|relacionad)\w*\s+)*(?:(?:d[oa]|a[oa]|para\s+o)\s+)?`?(?:Jira|Atlassian|GitHub|GitLab|\$?TASK_MANAGER|board)\b/i;
// A proibição precisa estar na mesma oração (sem vírgula, ponto e vírgula ou dois-pontos entre a negação e o MCP):
// "Sem a CLI logada, use o MCP do Jira" não é proibição.
const PROIBE_MCP =
  /\b(?:sem|nem|não|nunca|proibid\w*)\b[^.,;:\n]{0,30}\b(?:MCPs?|API|REST|endpoints?)\b/i;
// A proibição vale só na oração do MCP/API ("Use a API do Jira; não use MCP" acusa a primeira oração).
const mandaUsarMcpOuApi = (linha) =>
  linha.split(/[.;:](?=\s|$)/).some((o) => MCP_DO_BOARD.test(o) && !PROIBE_MCP.test(o));

test("nenhum imperativo manda publicar sem a pergunta", () => {
  for (const file of todosMd()) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        // Títulos ("### 4.2 — Comunicar à squad") e linhas de tabela (resumos) não são imperativos: o passo que
        // eles resumem é que é conferido.
        // A vírgula também separa quando a oração seguinte começa por negação ("Notifique o time, nunca crie card").
        for (const oracao of /^\s*[#|]/.test(linha)
          ? []
          : linha.split(/[.;:](?=\s|$)|,(?=\s+(?:não|nem|nunca|jamais|sem)\b)/))
          for (const padrao of IMPERATIVOS_POR_ORACAO)
            assert.doesNotMatch(
              oracao,
              padrao,
              `${rel(file)}:${i + 1}: manda rotular o PR, anexar no card ou notificar sem a pergunta. ${DE_PROPOSITO}`
            );
        assert.ok(
          !mandaUsarMcpOuApi(linha),
          `${rel(file)}:${i + 1}: manda usar MCP ou a API do board. ${DE_PROPOSITO}`
        );
      });
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
    [TASK_COMMENT, /gh issue comment/, 32, /Sim, publicar/],
    [TASK_COMMENT, /glab issue note/, 33, /Sim, publicar/],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /^jarvis docs publish --file .*feature/,
      6,
      /depois do \*\*Sim\*\*/,
    ],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /^jarvis docs publish --file .*delivery/,
      6,
      /depois do \*\*Sim\*\*/,
    ],
    [TASK_COMMENT, /acli jira workitem comment/, 34, /Sim, publicar/],
    [ENG_PR, /gh pr create --repo/, 45, /exceção da regra de ouro/],
    [
      "skills/jarvis-docs-central/README.md",
      /^jarvis docs publish --file .*feature/,
      0,
      /depois do Sim \(regra de ouro\)/,
    ],
    [
      "skills/jarvis-docs-central/README.md",
      /^jarvis docs publish --file .*delivery/,
      1,
      /depois do Sim/,
    ],
    [
      "skills/jarvis-docs-central/README.md",
      /`gh pr create` \/ `glab mr create`/,
      0,
      /só depois da pergunta do `\/eng\.spec-consolidate`, regra de ouro/,
    ],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /`gh pr create` \/ `glab mr create`/,
      2,
      /regra de ouro/,
    ],
    [
      "skills/eng-global-tech-spec/references/delivery-spec.md",
      /`acli jira workitem create`/,
      4,
      /depois da pergunta, regra de ouro|e o Sim:/,
    ],
    [ENG_PR, /^\| Fase 4 › 4\.4 Criar MR\/PR pela CLI/, 0, /escolha da Fase 0 for publicar/],
    [ENG_PR, /^Segue a cadeia de/, 30, /exceção da regra de ouro/],
    [SPEC_CONSOLIDATE, /^\| Passo 3 \(funcionalidade\) e Passo 6/, 0, /depois do Sim/],
    [
      GLOBAL_PR,
      /^Criar a branch e o commit, gerar o texto/,
      0,
      /só depois da pergunta \(regra de ouro\)/,
    ],
    [TASK_COMMENT, /^### 1\. `jarvis tasks comment`/, 8, /Sim, publicar/],
    ["skills/jarvis-docs-central/README.md", /^- \*\*Publicar\*\*/, 0, /depois da pergunta/],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /^O `jarvis docs publish` só roda/,
      0,
      /depois da pergunta/,
    ],
    [REPORT_ISSUE, /^\*\*Antes de abrir, mostre e pergunte/, 0, /AskUserQuestion/],
    [REPORT_ISSUE, /^\*\*Cadeia/, 25, /Sim, abrir a issue/],
    [
      REPORT_ISSUE,
      /^description: /,
      0,
      /só depois de mostrar o texto e o usuário dizer Sim \(regra de ouro\)/,
    ],
    ["docs/engenharia/eng.spec-consolidate.md", /^6\. Pergunta/, 0, /Pergunta \*\*Sim \/ Não\*\*/],
    [
      "workflows/engineering/eng.build-tech-spec.md",
      /`acli jira workitem create`/,
      0,
      /perguntar \(regra de ouro\)/,
    ],
    [
      "workflows/product/prod.spec.issue.md",
      /`acli jira workitem create`/,
      0,
      /só com o Sim da pergunta \(regra de ouro\)|regra de ouro.*só com o Sim, abra o card/,
    ],
  ];
  // Linhas que só descrevem o comando (catálogo de integrações, tabelas de skills invocados, referência da CLI,
  // proibições): não mandam executar nada.
  const DESCRITIVAS = [
    ["workflows/engineering/eng.work.md", /❌ NÃO faça push/],
    ["rules-on-demand/engineering/eng.work-rules.md", /^\| Fazer `git push`/],
    ["skills/AGENTS.md", /^\| `jarvis docs publish` \| `jarvis-docs-central` \|$/],
    ["skills/jarvis-init/SKILL.md", /é gerado pelo `jarvis docs publish`/],
    [REPORT_ISSUE, /^Sem host \(`grupo\/repo`\), o vendor não é adivinhado/],
    [INTEGRATIONS, /^\| `(?:TASK_MANAGER|VERSION_CONTROL)` \(\+/],
    [INTEGRATIONS, /^Para agir no vendor:/],
    ["docs/estrutura/bin.md", /^\| `jarvis (?:tasks comment|vcs create-merge)/],
    ["bin/README.md", /^1\. \*\*Como subcomando do CLI\*\*: `jarvis vcs create-merge/],
    [
      "bin/README.md",
      /^`bin\/lib\/tasks\/comment\.js` e `bin\/lib\/vcs\/\*\.js` leem `process\.env`/,
    ],
    ["templates/ENV-template.md", /^# git remote get-url origin\. PR\/MR pela CLI oficial/],
    ["templates/ENV-template.md", /^# Usado pelo skill \/jarvis-report-issue, pela CLI do host/],
  ];
  // Completude: toda linha que cita um comando que envia algo, em qualquer posição (com ou sem prefixo como
  // "$ ", "rtk ", "npx ", "$(" ou crases), precisa estar nesta lista ou na das descritivas.
  const COMANDO =
    /(?:^|[\s`(|&;$"'[*:>—–])(?:rtk\s+|npx\s+)?(?:git(?:\s+-C\s+\S+)?\s+push\b|gh\s+(?:pr\s+(?:create|comment|merge|close|edit|review|ready|reopen)|issue\s+(?:create|comment|close|edit|reopen)|api|release\s+create|label)\b|glab\s+(?:mr\s+(?:create|note|merge|close|update|approve)|issue\s+(?:create|note|close|update)|api|release\s+create|label)\b|acli\s+jira\s+workitem\s+(?:create|comment|transition|assign|edit|attachment)\b|jarvis\s+(?:vcs\s+create-|tasks\s+comment|docs\s+publish))/;
  // Os .md da raiz e o bin/README.md entram; o CONTRIBUTING.md fica fora: é o guia de quem contribui com o
  // framework, e o push ali é a própria pessoa que roda, não um passo que o Jarvis executa.
  const RAIZ = ["README.md", "AGENTS.md", "members.md", "taxonomy.md", "bin/README.md"]
    .map((p) => join(root, p))
    .filter((p) => existsSync(p));
  for (const file of todosMd().concat(RAIZ)) {
    const nome = rel(file).split("\\").join("/");
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        // As linhas de árvore de pastas (├── …) só listam os arquivos.
        if (/^\s*[├└│]/.test(linha)) return;
        // "o `jarvis vcs create-merge` não põe label" só descreve o comando.
        if (
          /`jarvis vcs create-merge` n[aã]o p[oõ]e label/.test(linha) &&
          !/git push|\bgh |\bglab |\bacli |jarvis (?:docs publish|tasks comment|vcs create-issue)/.test(
            linha
          )
        )
          return;
        if (!COMANDO.test(linha) || DESCRITIVAS.some(([f, d]) => f === nome && d.test(linha)))
          return;
        assert.ok(
          PONTOS.some(([f, envio]) => f === nome && envio.test(linha)),
          `${nome}:${i + 1}: comando de envio sem ponto guardado no teste. ${DE_PROPOSITO}`
        );
      });
  }
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
      // Na janela, nenhuma linha pode dispensar a pergunta (a do acesso manual do passo 0.5 é a exceção).
      // Cada linha vai junto com a continuação dela (uma dispensa quebrada em duas linhas também conta).
      const limpas = linhas.map((l) => semExcecoes(file, l));
      const inicio = Math.max(0, i - n);
      assert.ok(
        !limpas.slice(inicio, i + 1).some((l, k) => recusa([l, continuacao(limpas, inicio + k)])),
        `${file}:${i + 1}: a janela do envio ${envio} dispensa a pergunta. ${DE_PROPOSITO}`
      );
    }
  }
  // Além da janela, a ordem: no skill de comentário, todo envio vem depois do passo 0.5; no eng.pr, o push e o PR
  // vêm depois da Fase 0 e da 4.3 (que registra a exceção).
  const ordem = [
    [
      TASK_COMMENT,
      /^### 0\.5 /m,
      [
        /gh issue comment/,
        /glab issue note/,
        /acli jira workitem comment/,
        /^jarvis tasks comment/m,
      ],
    ],
    [ENG_PR, /exceção da regra de ouro/, [/^jarvis vcs create-merge/m, /gh pr create --repo/]],
    [ENG_PR, /^## Fase 0: /m, [/^git push -u origin \{NOME_DA_BRANCH\}$/m]],
  ];
  for (const [file, antes, envios] of ordem) {
    const texto = read(file);
    const marco = texto.search(antes);
    assert.notEqual(marco, -1, `${file}: marco ${antes} não encontrado. ${DE_PROPOSITO}`);
    for (const envio of envios) {
      const pos = texto.search(envio);
      assert.ok(
        pos > marco,
        `${file}: o envio ${envio} precisa vir depois de ${antes}. ${DE_PROPOSITO}`
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
      /[Aa]ntes de criar as subtarefas, mostre o texto e pergunte/,
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
      "skills/jarvis-docs-central/SKILL.md",
      /Com `\.git`: branch, cópia, índice, commit, push e PR \(só depois da pergunta, regra de ouro\)/,
    ],
    [
      "skills/jarvis-docs-central/SKILL.md",
      /só depois de mostrar o que será enviado e perguntar, regra de ouro/,
    ],
    [
      "skills/jarvis-docs-central/README.md",
      /só depois da pergunta do `\/eng\.spec-consolidate`, regra de ouro/,
    ],
    [
      "workflows/engineering/eng.start.md",
      /[Ss]em o Sim, o texto fica no `task-comment-\*\.md` e no `architecture\.md`/,
    ],
    ["workflows/engineering/eng.work.md", /Sem o Sim, o texto fica no `task-comment-\*\.md`/],
    [
      TASK_COMMENT,
      /A pergunta vale para cada comentário, mesmo quando o workflow que chamou o skill já perguntou/,
    ],
    [
      "workflows/engineering/eng.build-tech-spec.md",
      /`acli jira workitem create`.*só depois de mostrar o texto e perguntar \(regra de ouro\)/,
    ],
    [ENG_PRE_PR, /nada é enviado ao card \(o texto fica no `gate-checklist\.md`\)/],
    [
      "skills/eng-global-tech-spec/references/delivery-spec.md",
      /Para anexá-la na issue do board, depois da aprovação da 6\.3, mostre o que vai e pergunte com `AskUserQuestion` \(regra de ouro/,
    ],
    [
      "skills/product-roadmap-report/commands/status.roadmap.preview.md",
      /Leia o board pela CLI oficial do `\$TASK_MANAGER`.*sem REST nem MCP/,
    ],
  ];
  for (const [file, frase] of FRASES) {
    assert.match(read(file), frase, `${file} sem ${frase}. ${DE_PROPOSITO}`);
  }
  // Toda linha de prosa do eng.work (e do eng.plan) que manda publicar pelo skill diz onde o texto recusado fica.
  for (const file of ["workflows/engineering/eng.work.md", "workflows/engineering/eng.plan.md"]) {
    read(file)
      .split("\n")
      .forEach((linha, i, todas) => {
        // Linhas de tabela (mesmo indentadas) são resumos; a nota do acesso manual (sem desvio, bloqueio ou auditoria)
        // só diz que o skill grava o .md.
        if (!/eng-global-task-comment/.test(linha) || linha.trim().startsWith("|")) return;
        if (
          /acesso manual/.test(linha) &&
          /só grava o `\.md`/.test(linha) &&
          !/desvio|bloqueio|auditoria/.test(linha)
        )
          return;
        // O ramo do Não pode estar na linha ou na continuação da frase (não um item novo nem outra chamada do skill).
        assert.match(
          `${linha} ${continuacao(todas, i)}`,
          /Sem o Sim, o texto fica no `task-comment-\*\.md`/,
          `${file}:${i + 1}: falta o ramo do Não (onde o texto recusado fica). ${DE_PROPOSITO}`
        );
      });
  }
  // O passo 0.5 só pode pular a pergunta no caso do acesso manual (que não tem envio possível).
  const passo05 =
    read(TASK_COMMENT)
      .split(/^### 1\. /m)[0]
      .split(/^### 0\.5 /m)[1] ?? "";
  const pulos = passo05.split("\n").filter((l) => recusa([l]));
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
