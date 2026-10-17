// Testes dos skills obsoletos do upgrade (stale-skills.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findStaleSkills,
  registeredSpecializations,
  removeStaleSkills,
} from "../bin/lib/core/stale-skills.js";
import { parseEnvEntries } from "../bin/lib/core/env-upgrade.js";

function withDirs(ideSkills, frameworkSkills, fn) {
  const root = mkdtempSync(join(tmpdir(), "jarvis-stale-"));
  try {
    const ide = join(root, "ide-skills");
    const fw = join(root, "fw-skills");
    mkdirSync(ide, { recursive: true });
    mkdirSync(fw, { recursive: true });
    for (const n of ideSkills) {
      mkdirSync(join(ide, n), { recursive: true });
      writeFileSync(join(ide, n, "SKILL.md"), "---\nname: x\n---\n");
    }
    for (const n of frameworkSkills) mkdirSync(join(fw, n), { recursive: true });
    return fn(ide, fw);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("skill instalado que o framework não tem mais é obsoleto; os que existem não são", () => {
  withDirs(["eng-backend", "antigo"], ["eng-backend"], (ide, fw) => {
    assert.deepEqual(findStaleSkills({ ideSkillsDir: ide, frameworkSkillsDir: fw }), ["antigo"]);
  });
});

test("skill registrado em *_SPECIALIZATIONS nunca é obsoleto", () => {
  withDirs(["eng-backend-golang", "antigo"], [], (ide, fw) => {
    const registered = registeredSpecializations(
      parseEnvEntries('BACKEND_SPECIALIZATIONS=[ "eng-backend-golang" ]\nQA_SPECIALIZATIONS=\n')
    );
    assert.deepEqual(findStaleSkills({ ideSkillsDir: ide, frameworkSkillsDir: fw, registered }), [
      "antigo",
    ]);
  });
});

test("registeredSpecializations: aceita vírgulas, colchetes, aspas e espaços", () => {
  const set = registeredSpecializations(
    parseEnvEntries("A_SPECIALIZATIONS=a,b\nB_SPECIALIZATIONS=[ \"c\" , 'd' ]\nOUTRA=x\n")
  );
  assert.deepEqual([...set].sort(), ["a", "b", "c", "d"]);
});

test("pasta sem SKILL.md e nome fora do padrão são ignorados; pasta inexistente devolve lista vazia", () => {
  withDirs([], [], (ide, fw) => {
    mkdirSync(join(ide, "sem-skill-md"), { recursive: true });
    mkdirSync(join(ide, "Maiuscula"), { recursive: true });
    writeFileSync(join(ide, "Maiuscula", "SKILL.md"), "x");
    assert.deepEqual(findStaleSkills({ ideSkillsDir: ide, frameworkSkillsDir: fw }), []);
    assert.deepEqual(
      findStaleSkills({ ideSkillsDir: join(ide, "nao-existe"), frameworkSkillsDir: fw }),
      []
    );
  });
});

test("removeStaleSkills remove só as pastas listadas e recusa nome inválido", () => {
  withDirs(["antigo", "outro"], [], (ide) => {
    const r = removeStaleSkills(ide, ["antigo", "../fora"]);
    assert.deepEqual(r.removed, ["antigo"]);
    assert.equal(r.errors.length, 1);
    assert.ok(!existsSync(join(ide, "antigo")));
    assert.ok(existsSync(join(ide, "outro")));
  });
});
