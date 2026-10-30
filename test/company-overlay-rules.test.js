// Guarda do texto da rule de precedência do overlay (rules/company-overlay-rules.md, #199).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_COMPANY_PROFILE } from "../bin/lib/core/company-profile.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const rule = readFileSync(join(root, "rules", "company-overlay-rules.md"), "utf-8");

test("company-overlay-rules: universal, abaixo de 1 KB e com o default do perfil", () => {
  assert.match(rule, /> \*\*Applies to:\*\* HUB: all \| POSITION: all \| AREA: all \| SQUAD: all/);
  assert.ok(Buffer.byteLength(rule, "utf-8") < 1024, "a rule passou de 1 KB");
  assert.ok(rule.includes(DEFAULT_COMPANY_PROFILE), "não cita o perfil default");
});

test("company-overlay-rules: cita os 6 tipos, a precedência e a proibição de escrever no overlay", () => {
  for (const tipo of ["workflows", "skills", "agents", "rules", "rules-on-demand", "templates"]) {
    assert.ok(rule.includes(`${tipo}/`), `não cita ${tipo}/`);
  }
  assert.match(rule, /overlay > especialização de stack > core/);
  assert.match(rule, /\$IDE\/overlays\/\{COMPANY_PROFILE\}\//);
  assert.match(rule, /Não escreva no overlay/);
  assert.match(rule, /rules\/.*instalação/s);
});
