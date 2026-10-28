// Testes do filtro de rules por perfil. Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseAppliesTo,
  matchesProfile,
  listRulesForProfile,
} from "../bin/lib/core/profile-filter.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bloco = (hub, pos, area, squad) =>
  `> **Applies to:** HUB: ${hub} | POSITION: ${pos} | AREA: ${area} | SQUAD: ${squad}`;

const profile = (HUB, POSITION, AREA, SQUAD = "CORE") => ({ HUB, POSITION, AREA, SQUAD });

test("parseAppliesTo lê o bloco, com valores múltiplos", () => {
  const r = parseAppliesTo(
    `---\nenv_file: x\n---\n\n${bloco("BACKEND, FRONTEND", "all", "ENGINEERING", "all")}\n\n# T`
  );
  assert.deepEqual(r, {
    HUB: "BACKEND, FRONTEND",
    POSITION: "all",
    AREA: "ENGINEERING",
    SQUAD: "all",
    ARTIFACT_STYLE: "all",
  });
});

test("parseAppliesTo devolve null sem bloco", () => {
  assert.equal(parseAppliesTo("# Sem bloco\n"), null);
});

test("parseAppliesTo: 5º campo ARTIFACT_STYLE opcional, sem vazar para o SQUAD", () => {
  const cinco = parseAppliesTo(
    `${bloco("all", "all", "all", "CORE")} | ARTIFACT_STYLE: human-generated\n`
  );
  assert.equal(cinco.SQUAD, "CORE");
  assert.equal(cinco.ARTIFACT_STYLE, "human-generated");
  const quatro = parseAppliesTo(`${bloco("all", "all", "all", "all")}\n\n# T | com barra`);
  assert.equal(quatro.SQUAD, "all");
  assert.equal(quatro.ARTIFACT_STYLE, "all");
});

test("matchesProfile: ARTIFACT_STYLE só pelo perfil, sem coringa para FULLCYCLE/GENERALIST", () => {
  const rule = parseAppliesTo(
    `${bloco("all", "all", "all", "all")} | ARTIFACT_STYLE: human-generated`
  );
  const comEstilo = (estilo, p = profile("BACKEND", "SENIOR", "ENGINEERING")) => ({
    ...p,
    ARTIFACT_STYLE: estilo,
  });
  assert.equal(matchesProfile(rule, comEstilo("human-generated")), true);
  assert.equal(matchesProfile(rule, comEstilo("ai-generated")), false);
  assert.equal(matchesProfile(rule, profile("BACKEND", "SENIOR", "ENGINEERING")), false);
  assert.equal(matchesProfile(rule, profile("FULLCYCLE", "GENERALIST", "ENGINEERING")), false);
  // rule sem o eixo vale para qualquer estilo
  const semEixo = parseAppliesTo(bloco("all", "all", "all", "all"));
  assert.equal(matchesProfile(semEixo, comEstilo("human-generated")), true);
});

test("matchesProfile: sem bloco é universal", () => {
  assert.equal(matchesProfile(null, profile("QA", "JUNIOR", "PRODUCT")), true);
});

test("matchesProfile: all casa tudo", () => {
  const a = parseAppliesTo(bloco("all", "all", "all", "all"));
  assert.equal(matchesProfile(a, profile("DATA", "PM", "PRODUCT", "OUTRO")), true);
});

test("matchesProfile: AND entre os eixos", () => {
  const a = parseAppliesTo(bloco("BACKEND", "all", "ENGINEERING", "all"));
  assert.equal(matchesProfile(a, profile("BACKEND", "SENIOR", "ENGINEERING")), true);
  assert.equal(matchesProfile(a, profile("FRONTEND", "SENIOR", "ENGINEERING")), false);
  assert.equal(matchesProfile(a, profile("BACKEND", "SENIOR", "PRODUCT")), false);
});

test("matchesProfile: lista separada por vírgula", () => {
  const a = parseAppliesTo(bloco("all", "QA-ENGINEER, SPECIALIST", "all", "all"));
  assert.equal(matchesProfile(a, profile("QA", "SPECIALIST", "ENGINEERING")), true);
  assert.equal(matchesProfile(a, profile("QA", "SENIOR", "ENGINEERING")), false);
});

test("matchesProfile: SQUAD diferente bloqueia, mesmo com GENERALIST e FULLCYCLE", () => {
  const a = parseAppliesTo(bloco("all", "all", "all", "CORE"));
  assert.equal(
    matchesProfile(a, profile("FULLCYCLE", "GENERALIST", "ENGINEERING", "OUTRO")),
    false
  );
  assert.equal(matchesProfile(a, profile("FULLCYCLE", "GENERALIST", "ENGINEERING", "CORE")), true);
});

test("matchesProfile: FULLCYCLE satisfaz qualquer HUB", () => {
  const a = parseAppliesTo(bloco("QA", "all", "all", "all"));
  assert.equal(matchesProfile(a, profile("FULLCYCLE", "SENIOR", "ENGINEERING")), true);
});

test("matchesProfile: GENERALIST satisfaz qualquer POSITION e AREA, mas não o HUB", () => {
  const a = parseAppliesTo(bloco("QA", "QA-ENGINEER", "PRODUCT", "all"));
  assert.equal(matchesProfile(a, profile("QA", "GENERALIST", "ENGINEERING")), true);
  assert.equal(matchesProfile(a, profile("BACKEND", "GENERALIST", "ENGINEERING")), false);
});

test("listRulesForProfile: AGENTS.md nunca é filtrado, rtk é opt-in, sem bloco é universal", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-filtro-"));
  try {
    mkdirSync(join(dir, "engineering"), { recursive: true });
    writeFileSync(join(dir, "AGENTS.md"), bloco("QA", "SENIOR", "PRODUCT", "OUTRO") + "\n");
    writeFileSync(join(dir, "universal.md"), "# Sem bloco\n");
    writeFileSync(join(dir, "rtk-rules.md"), bloco("all", "all", "all", "all") + "\n");
    writeFileSync(
      join(dir, "engineering", "back.md"),
      bloco("BACKEND", "all", "all", "all") + "\n"
    );
    writeFileSync(join(dir, "engineering", "qa.md"), bloco("QA", "all", "all", "all") + "\n");
    const p = profile("BACKEND", "SENIOR", "ENGINEERING");

    const sem = listRulesForProfile(dir, p)
      .map((r) => r.path)
      .sort();
    assert.deepEqual(sem, ["AGENTS.md", "engineering/back.md", "universal.md"]);

    const com = listRulesForProfile(dir, p, { rtkEnabled: true })
      .map((r) => r.path)
      .sort();
    assert.deepEqual(com, ["AGENTS.md", "engineering/back.md", "rtk-rules.md", "universal.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Linha de base de rules/ para 4 perfis, sem RTK (architecture.md, seção 1.1), já sem as 7 rules de etapa
// (92.260 B), movidas para rules-on-demand/ na etapa 2 da #54 (e com o rules/AGENTS.md 691 B maior, por documentar as duas pastas). Mudam quando uma rule é adicionada, movida ou editada.
// +26 B em cada perfil na #64 (generalização de exemplos de domínio em eng.docs-scraping-rules.md).
// +129 B em cada perfil na #67 (eng.bump-rules.md corrigido para package.json/npm + referência ao CHANGELOG.md).
// +29 B em cada perfil na #72 (eng.integrations-rules.md: referências a `node bin/lib/vcs/...`
// trocadas por `jarvis vcs .../jarvis tasks comment`) — baseline reconstruída agora na #74,
// que foi quando o drift apareceu (test:filtro não tinha sido re-rodado após aquele PR).
// #80 (rename eng-scraper/área scraper -> eng-automation/área automation): deltas variam por
// perfil porque eng.rpa-rules.md (HUB: BACKEND) e eng.frontend-rules.md (HUB: FRONTEND) mudaram
// quantidades diferentes de bytes, e cada perfil carrega um subconjunto diferente de rules.
// +1020 B em cada perfil na #63 (eng.specializations-rules.md estendida pra 6 áreas +
// eng-rules.md validando as 4 variáveis novas — as duas são universais, por isso o delta
// é igual nos 4 perfis, diferente do caso da #80 acima).
// +12 B em cada perfil na introdução da área `platform` (eng.skills-rules.md: lista de
// áreas reconhecidas ganhou "platform" — rule universal, delta igual nos 4 perfis).
// Consolidação de QA em eng-qa/eng-qa-planner (2026-10-05): removidas 3 rules de QA
// (eng.qa.exploratory-session-rules.md, eng.qa.quality-gate-scoring-rules.md,
// eng.qa.tech-spec-validation-criteria-rules.md) — -3 arquivos em FULLCYCLE e QA (que
// carregam rules de HUB:QA); eng.qa.cypress-standards-rules.md (HUB:QA) teve só uma linha
// trocada; eng.frontend-rules.md (HUB:FRONTEND) e eng.rpa-rules.md (HUB:BACKEND) tiveram
// trechos de TestSprite/eng-qa-* reescritos — por isso BACKEND e FRONTEND mantêm a
// contagem de arquivos mas mudam de bytes, cada um no seu próprio delta.
// +201 B em cada perfil ao wirear PLATFORM_SPECIALIZATIONS (eng.specializations-rules.md
// ganhou a área platform + eng-rules.md validando a variável nova — as duas são
// universais, delta igual nos 4 perfis).
// Descontinuação da área security (2026-10-05): eng-security-rules.md, eng-rules.md,
// eng.skills-rules.md e eng.specializations-rules.md (todas universais) tiveram trechos
// reescritos — nenhuma rule foi removida, só o conteúdo mudou de tamanho, por isso a
// contagem de arquivos não muda e o delta de bytes é igual nos 4 perfis.
// Remoção do eng-automation-robot-builder (2026-10-05): eng.rpa-rules.md (HUB: BACKEND) e
// eng.frontend-rules.md (HUB: FRONTEND) perderam a referência ao Stagehand — cada um no seu
// próprio delta; QA não carrega nenhuma das duas, por isso fica inalterado.
// Consolidação de data em eng-data (2026-10-05): eng.specializations-rules.md trocou
// `eng-data-engineer` por `eng-data` na tabela de skill base — rule universal, delta igual
// nos 4 perfis.
// Issue #140 (Advisor opcional e comentários no card só para eventos relevantes, 2026-10-06):
// eng.integrations-rules.md (universal) trocou a seção "Comentário no card" pela regra dos
// eventos relevantes (+482 B) — delta igual nos 4 perfis, nenhum arquivo adicionado.
// Issue #146 (Modo Developer-Guided, 2026-10-15): +282 B em cada perfil — rules/AGENTS.md
// (sempre copiado) passou a mostrar rules-on-demand/product/ (+220 B) e prod-rules.md
// (universal) ganhou o status `deprecated` (+62 B). A regra do modo guiado fica em
// rules-on-demand/ e não entra nesta conta.
// Issue #143 (Central docs por adaptador, 2026-10-15): +261 B em cada perfil — prod-rules.md
// (universal) trocou CENTRAL_DOCS_REPO por CENTRAL_DOCS_STORAGE/LOCATION e o PROD_DOCS do
// projeto único; eng.integrations-rules.md (universal) tirou o `fetch-raw` e ganhou a linha
// CENTRAL_DOCS_STORAGE. Nenhum arquivo adicionado.
// Issue #149 (Central docs = o que foi implementado; documentos em docs/jarvis/, 2026-10-15):
// prod-rules.md (universal: PROD_DOCS/ENG_DOCS e o novo papel do Central docs),
// eng.integrations-rules.md (universal: evento do gate-checklist), eng.docs-scraping-rules.md
// (AREA ENGINEERING: $ENG_DOCS/robots) e eng.rpa-rules.md (HUB BACKEND: $ENG_DOCS/robots).
// +222 B em FRONTEND e QA; +215 B em FULLCYCLE e BACKEND, que também carregam eng.rpa-rules.md
// (a troca de `docs/engineering/robots` por `$ENG_DOCS/robots` encurta essa rule em 7 B).
// Issue #153 (warm-up enxuto, 2026-10-16): +128 B em cada perfil — rules/AGENTS.md (sempre
// copiado) passou a mostrar rules-on-demand/warm-up-consume-rules.md. A rule nova fica em
// rules-on-demand/ e não entra nesta conta.
// Issue #154 (discovery fluido, 2026-10-16): +59 B só em FULLCYCLE/GENERALIST — prod.spec-rules.md
// (AREA PRODUCT, que o GENERALIST também recebe) trocou "hipóteses e perguntas em aberto" por
// "suposições e lacunas" na seção "Discovery como insumo".
// Issue #157 (discoveries em pasta própria, 2026-10-16): +309 B em todos os perfis — prod-rules.md
// (AREA all) ganhou $DISCOVERIES_DOCS no ENV de fallback, a descrição dela e a regra de ENV antigo;
// no FULLCYCLE/GENERALIST, -10 B de prod.spec-rules.md ($PROD_DOCS/discoveries/ → $DISCOVERIES_DOCS/).
// Issue #159 (estilo de artefatos, 2026-10-16): +241 B em todos os perfis — rules/AGENTS.md (sempre
// copiado) documenta o 5º campo opcional ARTIFACT_STYLE. A rule nova (artifact-style-rules.md) só entra
// com ARTIFACT_STYLE=human-generated, que nenhum destes perfis tem.
// Issue #163 (perguntas do ciclo eng.*, 2026-10-17): +37 B em todos os perfis — eng.integrations-rules.md
// (comentário no card: o relatório do eng.pre-pr passa a ser registrado se o usuário escolher resumo ou completo).
// Issue #163 (WORKSPACE_MODE, 2026-10-17): +342 B em todos os perfis — eng-rules.md ganha a validação não bloqueante do modo.
// Issue #163 (buscas em modo workspace, 2026-10-17): +1552 B em todos os perfis — eng-rules.md ganha a tabela IDE → pasta e a regra de buscas.
// Issue #181 (integrações pelas CLIs oficiais, 2026-10-25): +1077 B em todos os perfis — eng.integrations-rules.md
// ganha a cadeia de execução (jarvis → CLI do vendor → .md), os códigos de saída e o catálogo; sai a seção MR/PR.
// Issue #181 (limpeza, 2026-10-25): -8 B em todos os perfis — eng-rules.md cita os boards como Jira, GitHub, GitLab (sai o Linear).
// Issue #181 (pre-pr, 2026-10-25): +113 B em todos os perfis — eng-rules.md ganha a nota de que o .npmrc vale para registries npm e que board e git usam o login da CLI.
// Issue #181 (pre-pr 2, 2026-10-25): +109 B em todos os perfis — eng.integrations-rules.md cita a saída 1 (uso) e exclui o *_ACCESS=manual do passo 2 da cadeia.
// Issue #181 (pre-pr 3, 2026-10-25): +118 B em todos os perfis — o passo 2 da cadeia só vale para CLI ausente ou sem login (manual/inválido não roda a CLI; ENV.md ambíguo repete com --ide/--env-file).
// Issue #182 (links clicáveis, 2026-10-26): +132 B em todos os perfis — rules/AGENTS.md (sempre copiado) passou a mostrar
// rules-on-demand/doc-links-rules.md. A rule nova fica em rules-on-demand/ e não entra nesta conta.
// Issue #182 (pre-pr 2, 2026-10-26): +43 B em todos os perfis — rules/AGENTS.md descreve rules-on-demand/ como etapa ou transversal.
// Issue #184 (regra de ouro, 2026-10-27): +1022 B em todos os perfis — eng.integrations-rules.md ganha a seção "Nada é publicado sem perguntar" (com as exceções da Fase 0 do eng.pr e dos documentos aprovados juntos) e os eventos (f) e (g) na lista.
// Issue #184 (pre-pr 11, 2026-10-28): +26 B em todos os perfis — rules/AGENTS.md descreve o eng.pr como "Push e PR, depois da pergunta (regra de ouro)".
// Issue #184 (pre-pr 13, 2026-10-28): +191 B em todos os perfis — eng-security-rules.md: o label `security` é registrado no PR Brief e a pessoa é orientada a pô-lo no PR (o Jarvis não altera o PR sem perguntar).
// Issue #184 (pre-pr 17, 2026-10-28): +3 B em todos os perfis — eng-security-rules.md diz que o `jarvis vcs create-merge` não põe label.
// Issue #184 (pre-pr 19, 2026-10-28): +104 B em todos os perfis — eng-rules.md separa os documentos de trabalho da cópia local do Central docs.
const BASE = [
  [
    "FULLCYCLE/GENERALIST/ENGINEERING/CORE",
    profile("FULLCYCLE", "GENERALIST", "ENGINEERING"),
    15,
    104168,
  ],
  ["BACKEND/SENIOR/ENGINEERING/CORE", profile("BACKEND", "SENIOR", "ENGINEERING"), 11, 70849],
  ["FRONTEND/PLENO/ENGINEERING/CORE", profile("FRONTEND", "PLENO", "ENGINEERING"), 11, 71392],
  ["QA/QA-ENGINEER/ENGINEERING/CORE", profile("QA", "QA-ENGINEER", "ENGINEERING"), 11, 70628],
];

for (const [nome, p, arquivos, bytes] of BASE) {
  test(`rules reais: ${nome} recebe ${arquivos} arquivos e ${bytes} B`, () => {
    const rules = listRulesForProfile(join(root, "rules"), p);
    assert.equal(rules.length, arquivos);
    assert.equal(
      rules.reduce((s, r) => s + r.bytes, 0),
      bytes
    );
  });
}

test("rules reais: artifact-style-rules.md só com ARTIFACT_STYLE=human-generated (sem coringa)", () => {
  const tem = (p) =>
    listRulesForProfile(join(root, "rules"), p).some((r) => r.path === "artifact-style-rules.md");
  const base = profile("FULLCYCLE", "GENERALIST", "ENGINEERING");
  assert.equal(tem(base), false);
  assert.equal(tem({ ...base, ARTIFACT_STYLE: "ai-generated" }), false);
  assert.equal(tem({ ...base, ARTIFACT_STYLE: "human-generated" }), true);
  assert.equal(
    tem({ ...profile("BACKEND", "SENIOR", "ENGINEERING"), ARTIFACT_STYLE: "human-generated" }),
    true
  );
});
