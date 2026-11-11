// Testes dos skills obsoletos do upgrade (stale-skills.js). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  companyProfilesFor,
  findStaleSkills,
  overlayProfiles,
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

test("skill com o prefixo de um perfil de empresa nunca é obsoleto; sem o prefixo continua listado (#266)", () => {
  withDirs(["claro-onboarding", "skill-antigo"], [], (ide, fw) => {
    assert.deepEqual(
      findStaleSkills({
        ideSkillsDir: ide,
        frameworkSkillsDir: fw,
        companyProfiles: new Set(["claro"]),
      }),
      ["skill-antigo"]
    );
  });
});

test("sem perfil (ausente, vazio ou só texto vazio): sem o filtro do prefixo, como antes (#266)", () => {
  withDirs(["claro-onboarding", "skill-antigo"], [], (ide, fw) => {
    const todos = ["claro-onboarding", "skill-antigo"];
    const base = { ideSkillsDir: ide, frameworkSkillsDir: fw };
    assert.deepEqual(findStaleSkills(base), todos);
    assert.deepEqual(findStaleSkills({ ...base, companyProfiles: new Set() }), todos);
    assert.deepEqual(findStaleSkills({ ...base, companyProfiles: new Set([""]) }), todos);
  });
});

test("o perfil padrão stark-industries protege o próprio prefixo, como qualquer perfil (#266)", () => {
  withDirs(["stark-industries-local", "skill-antigo"], [], (ide, fw) => {
    assert.deepEqual(
      findStaleSkills({
        ideSkillsDir: ide,
        frameworkSkillsDir: fw,
        companyProfiles: new Set(["stark-industries"]),
      }),
      ["skill-antigo"]
    );
  });
});

test("o prefixo inclui o hífen: nome igual ao perfil ou sem o hífen continua listado (#266)", () => {
  withDirs(["claro", "claroapp", "claro-onboarding"], [], (ide, fw) => {
    assert.deepEqual(
      findStaleSkills({
        ideSkillsDir: ide,
        frameworkSkillsDir: fw,
        companyProfiles: new Set(["claro"]),
      }),
      ["claro", "claroapp"]
    );
  });
});

test("prefixo do perfil e *_SPECIALIZATIONS valem juntos (#266)", () => {
  withDirs(["claro-onboarding", "eng-backend-golang", "skill-antigo"], [], (ide, fw) => {
    const registered = registeredSpecializations(
      parseEnvEntries("BACKEND_SPECIALIZATIONS=eng-backend-golang\n")
    );
    assert.deepEqual(
      findStaleSkills({
        ideSkillsDir: ide,
        frameworkSkillsDir: fw,
        registered,
        companyProfiles: new Set(["claro"]),
      }),
      ["skill-antigo"]
    );
  });
});

test("com mais de um perfil (o ativo e os do overlay), todos os prefixos são protegidos (#266)", () => {
  withDirs(["claro-onboarding", "vivo-onboarding", "skill-antigo"], [], (ide, fw) => {
    assert.deepEqual(
      findStaleSkills({
        ideSkillsDir: ide,
        frameworkSkillsDir: fw,
        companyProfiles: new Set(["vivo", "claro"]),
      }),
      ["skill-antigo"]
    );
  });
});

test("overlayProfiles: só pastas com nome de perfil válido; ignora arquivo, pasta do core e nome inválido (#266)", () => {
  const root = mkdtempSync(join(tmpdir(), "jarvis-overlays-"));
  try {
    const overlays = join(root, "overlays");
    for (const n of ["claro", "stark-industries", "skills", "Claro", ".git"]) {
      mkdirSync(join(overlays, n), { recursive: true });
    }
    writeFileSync(join(overlays, "acme"), "não é pasta");
    assert.deepEqual([...overlayProfiles(overlays)].sort(), ["claro", "stark-industries"]);
    assert.deepEqual([...overlayProfiles(join(root, "nao-existe"))], []);
    // `overlays` como arquivo: nenhum perfil, sem lançar (o upgrade não pode quebrar aqui)
    writeFileSync(join(root, "overlays-arquivo"), "x");
    assert.deepEqual([...overlayProfiles(join(root, "overlays-arquivo"))], []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("companyProfilesFor: o perfil ativo entra mesmo sem pasta em overlays/, junto com os do overlay (#266)", () => {
  const root = mkdtempSync(join(tmpdir(), "jarvis-overlays-"));
  try {
    const overlays = join(root, "overlays");
    assert.deepEqual([...companyProfilesFor("claro", overlays)], ["claro"]);
    mkdirSync(join(overlays, "vivo"), { recursive: true });
    assert.deepEqual([...companyProfilesFor("claro", overlays)].sort(), ["claro", "vivo"]);
    assert.deepEqual([...companyProfilesFor("vivo", overlays)], ["vivo"]);
    assert.deepEqual([...companyProfilesFor("", overlays)], ["vivo"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// O link quebrado é o overlay guardado no repositório da empresa quando esse repositório muda de
// lugar ou não foi clonado: o nome ainda marca uma empresa que o workspace usou, então conta. O link
// para arquivo não conta, como um arquivo comum: o destino existe e não é pasta.
test("overlayProfiles: segue link para pasta, conta o link quebrado e ignora o link para arquivo (#266)", () => {
  const root = mkdtempSync(join(tmpdir(), "jarvis-overlays-"));
  try {
    const overlays = join(root, "overlays");
    const repoDaEmpresa = join(root, "repo-da-empresa");
    mkdirSync(overlays, { recursive: true });
    mkdirSync(repoDaEmpresa, { recursive: true });
    writeFileSync(join(root, "notas.txt"), "");
    symlinkSync(repoDaEmpresa, join(overlays, "vivo"));
    symlinkSync(join(root, "nao-existe"), join(overlays, "tim"));
    symlinkSync(join(root, "nao-existe"), join(overlays, "Oi"));
    symlinkSync(join(root, "notas.txt"), join(overlays, "claro"));
    assert.deepEqual([...overlayProfiles(overlays)].sort(), ["tim", "vivo"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
