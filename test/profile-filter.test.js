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
const BASE = [
  [
    "FULLCYCLE/GENERALIST/ENGINEERING/CORE",
    profile("FULLCYCLE", "GENERALIST", "ENGINEERING"),
    18,
    110631,
  ],
  ["BACKEND/SENIOR/ENGINEERING/CORE", profile("BACKEND", "SENIOR", "ENGINEERING"), 11, 62570],
  ["FRONTEND/PLENO/ENGINEERING/CORE", profile("FRONTEND", "PLENO", "ENGINEERING"), 11, 63415],
  ["QA/QA-ENGINEER/ENGINEERING/CORE", profile("QA", "QA-ENGINEER", "ENGINEERING"), 14, 76792],
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
