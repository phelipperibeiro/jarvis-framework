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
  });
});

test("parseAppliesTo devolve null sem bloco", () => {
  assert.equal(parseAppliesTo("# Sem bloco\n"), null);
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

test("listRulesForProfile: rtk é opt-in, sem bloco é universal, recursivo em subpastas", () => {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-filtro-"));
  try {
    mkdirSync(join(dir, "engineering"), { recursive: true });
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
    assert.deepEqual(sem, ["engineering/back.md", "universal.md"]);

    const com = listRulesForProfile(dir, p, { rtkEnabled: true })
      .map((r) => r.path)
      .sort();
    assert.deepEqual(com, ["engineering/back.md", "rtk-rules.md", "universal.md"]);
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
// Issue #84 (auditoria de eficiência de tokens, item P0-01, 2026-10-05): rules/AGENTS.md
// (6.724 B) e rules/product/README.md (1.519 B) removidos — eram universais (sem bloco
// `Applies to`, o primeiro com caso especial no código), então saem da contagem dos 4
// perfis igualmente: -2 arquivos e -8.243 B em cada um.
// Issue #85 (auditoria de eficiência de tokens, item P0-02, 2026-10-06): prod-rules.md
// (AREA: all) perdeu o bloco de ENV/$IDE/isolamento já coberto por eng-rules.md — de 11.240 B
// para 8.567 B (-2.673 B), mesmo delta nos 4 perfis; nenhum arquivo removido.
// Issue #86 (auditoria de eficiência de tokens, item P0-03, 2026-10-06): eng.bump-rules.md,
// eng.docs-scraping-rules.md (fundida na seção 6 de eng.rpa-rules.md) e eng.rpa-rules.md movidos
// para rules-on-demand/. bump e docs-scraping saem dos 4 perfis; rpa só saía de BACKEND e FULLCYCLE.
// FULLCYCLE -3 arquivos (-11.893 B), BACKEND -3 (-11.893 B), FRONTEND -2 (-4.070 B), QA -2 (-4.070 B).
const BASE = [
  [
    "FULLCYCLE/GENERALIST/ENGINEERING/CORE",
    profile("FULLCYCLE", "GENERALIST", "ENGINEERING"),
    10,
    74465,
  ],
  ["BACKEND/SENIOR/ENGINEERING/CORE", profile("BACKEND", "SENIOR", "ENGINEERING"), 6, 41195],
  ["FRONTEND/PLENO/ENGINEERING/CORE", profile("FRONTEND", "PLENO", "ENGINEERING"), 7, 49554],
  ["QA/QA-ENGINEER/ENGINEERING/CORE", profile("QA", "QA-ENGINEER", "ENGINEERING"), 7, 48790],
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
