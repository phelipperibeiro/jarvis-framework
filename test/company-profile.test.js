// Testes do perfil de empresa (company-profile.js, #199). Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_COMPANY_PROFILE,
  isValidCompanyProfile,
  resolveCompanyProfile,
  readCompanyProfile,
} from "../bin/lib/core/company-profile.js";

test("isValidCompanyProfile: padrão de nome (minúsculas, números, hífen) e fora das pastas do core", () => {
  assert.ok(isValidCompanyProfile("acme"));
  assert.ok(isValidCompanyProfile("acme-2"));
  assert.ok(isValidCompanyProfile(DEFAULT_COMPANY_PROFILE));
  for (const bad of ["Acme", "a b", "../x", "a/b", "rules", "skills", "overlays", ""]) {
    assert.ok(!isValidCompanyProfile(bad), `aceitou "${bad}"`);
  }
});

test("resolveCompanyProfile: ausente = default sem aviso; vazio e inválido = default com aviso", () => {
  assert.deepEqual(resolveCompanyProfile(undefined), {
    profile: DEFAULT_COMPANY_PROFILE,
    isDefault: true,
    warning: null,
  });

  const empty = resolveCompanyProfile("");
  assert.equal(empty.profile, DEFAULT_COMPANY_PROFILE);
  assert.match(empty.warning, /vazio/);

  const bad = resolveCompanyProfile("Acme Corp");
  assert.equal(bad.profile, DEFAULT_COMPANY_PROFILE);
  assert.match(bad.warning, /inválido \(use letras minúsculas, números e hífen\)\. Usando o perfil default stark-industries\.$/);
  assert.match(bad.warning, /Acme Corp/);
  assert.match(resolveCompanyProfile("skills").warning, /não pode ser o nome de uma pasta do core \(.*skills.*\)/);

  assert.deepEqual(resolveCompanyProfile("acme"), { profile: "acme", isDefault: false, warning: null });
  assert.equal(resolveCompanyProfile(DEFAULT_COMPANY_PROFILE).isDefault, true);
});

test("readCompanyProfile: lê a chave do ENV.md sem aspas nem comentário; ENV sem a chave avisa; sem ENV, default sem aviso", () => {
  assert.equal(readCompanyProfile('X=1\nCOMPANY_PROFILE="acme"  # empresa\n').profile, "acme");
  assert.equal(readCompanyProfile("X=1\n  COMPANY_PROFILE=acme\n").profile, "acme");
  // ENV.md anterior à #199: sem a chave, vale o default com a dica de rodar o /jarvis-init
  const semChave = readCompanyProfile("X=1\n");
  assert.equal(semChave.profile, DEFAULT_COMPANY_PROFILE);
  assert.match(semChave.warning, /vazio/);
  // sem ENV.md (primeiro jarvis init): default em silêncio
  assert.deepEqual(readCompanyProfile(undefined), {
    profile: DEFAULT_COMPANY_PROFILE,
    isDefault: true,
    warning: null,
  });
  assert.match(readCompanyProfile("COMPANY_PROFILE=\n").warning, /vazio/);
  assert.match(readCompanyProfile("COMPANY_PROFILE=rules\n").warning, /não pode ser o nome de uma pasta do core \(agents, skills/);
});
