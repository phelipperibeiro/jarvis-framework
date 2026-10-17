// Skills obsoletos (`jarvis init --upgrade`): skills instalados na pasta da IDE que não existem
// mais no framework (renomeados ou removidos). O upgrade só LISTA e, com confirmação, remove.
// Nunca marca como obsoleto um skill registrado em alguma lista `*_SPECIALIZATIONS` do ENV.md
// (especializações criadas pelo usuário com o jarvis-create-specialization).
// Só lê nomes de pasta: nunca lê nem imprime o conteúdo dos skills.
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SKILL_NAME = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Nomes registrados nas listas `*_SPECIALIZATIONS` do ENV (aceita vírgulas, colchetes, aspas e espaços).
 * @param {Map<string, string>} entries - `parseEnvEntries(envText)`
 * @returns {Set<string>}
 */
export function registeredSpecializations(entries) {
  const names = new Set();
  for (const [key, value] of entries) {
    if (!key.endsWith("_SPECIALIZATIONS")) continue;
    for (const item of value.replace(/[[\]"']/g, "").split(",")) {
      const name = item.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

/**
 * @param {{ ideSkillsDir: string, frameworkSkillsDir: string, registered?: Set<string> }} p
 * @returns {string[]} nomes (pastas) de skills instalados que o framework não tem mais
 */
export function findStaleSkills({ ideSkillsDir, frameworkSkillsDir, registered = new Set() }) {
  if (!existsSync(ideSkillsDir)) return [];
  return readdirSync(ideSkillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && SKILL_NAME.test(e.name))
    .map((e) => e.name)
    .filter((name) => existsSync(join(ideSkillsDir, name, "SKILL.md")))
    .filter((name) => !existsSync(join(frameworkSkillsDir, name)))
    .filter((name) => !registered.has(name))
    .sort();
}

/**
 * Remove as pastas listadas, uma a uma (só nomes já validados por `findStaleSkills`).
 * @returns {{ removed: string[], errors: string[] }}
 */
export function removeStaleSkills(ideSkillsDir, names) {
  const removed = [];
  const errors = [];
  for (const name of names) {
    if (!SKILL_NAME.test(name)) {
      errors.push(`${name}: nome inválido`);
      continue;
    }
    try {
      rmSync(join(ideSkillsDir, name), { recursive: true, force: true });
      removed.push(name);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }
  return { removed, errors };
}
