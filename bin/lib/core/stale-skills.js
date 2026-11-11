// Skills obsoletos (`jarvis init --upgrade`): skills instalados na pasta da IDE que não existem
// mais no framework (renomeados ou removidos). O upgrade só LISTA e, com confirmação, remove.
// Nunca marca como obsoleto um skill registrado em alguma lista `*_SPECIALIZATIONS` do ENV.md
// (especializações criadas pelo usuário com o jarvis-create-specialization) nem um skill com o
// prefixo de um perfil de empresa (`{perfil}-…`, ex.: `claro-onboarding`): o perfil ativo
// (`COMPANY_PROFILE`) e os que têm pasta em `$IDE/overlays/`. É o skill próprio da empresa, que
// mora em `$IDE/skills/` e nunca vem do framework (#266).
// Só lê nomes de pasta: nunca lê nem imprime o conteúdo dos skills.
import { existsSync, lstatSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { isValidCompanyProfile } from "./company-profile.js";

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
 * Perfis de empresa que o workspace já usou: os nomes das pastas em `$IDE/overlays/` aceitos por
 * `isValidCompanyProfile` (#266). A pasta de um perfil nasce quando ele é ativado e o upgrade
 * nunca a apaga, então ela marca uma empresa conhecida mesmo depois da troca de `COMPANY_PROFILE`.
 * Segue link simbólico (o próprio `overlays/{perfil}` pode ser um link). Um link quebrado também
 * conta: o destino sumiu (o repositório da empresa mudou de lugar ou não foi clonado), mas o link
 * ainda marca uma empresa que o workspace usou, e na dúvida o skill fica. Um link para arquivo não
 * conta, como um arquivo comum: o destino existe e não é pasta. Só lê nomes.
 * @param {string} overlaysDir - `$IDE/overlays`
 * @returns {Set<string>}
 */
export function overlayProfiles(overlaysDir) {
  const profiles = new Set();
  let names;
  try {
    names = readdirSync(overlaysDir);
  } catch {
    // sem a pasta, `overlays` como arquivo ou sem permissão: nenhum perfil, e o upgrade segue
    return profiles;
  }
  for (const name of names) {
    if (!isValidCompanyProfile(name)) continue;
    const entry = join(overlaysDir, name);
    try {
      if (statSync(entry).isDirectory()) profiles.add(name);
    } catch {
      // o `stat` segue o link e falha no link quebrado; o `lstat` lê o próprio link
      try {
        if (lstatSync(entry).isSymbolicLink()) profiles.add(name);
      } catch {
        // sem permissão: não conta como perfil
      }
    }
  }
  return profiles;
}

/**
 * Os perfis cujo prefixo o upgrade protege (#266): o ativo, mesmo sem pasta em `overlays/` (rede de
 * segurança: o sync costuma criá-la antes, mas a criação pode falhar), e os de `overlayProfiles`.
 * @param {string} activeProfile - `COMPANY_PROFILE` já resolvido (`readCompanyProfile`)
 * @param {string} overlaysDir - `$IDE/overlays`
 * @returns {Set<string>}
 */
export function companyProfilesFor(activeProfile, overlaysDir) {
  return new Set([activeProfile, ...overlayProfiles(overlaysDir)].filter(Boolean));
}

/**
 * @param {{ ideSkillsDir: string, frameworkSkillsDir: string, registered?: Set<string>,
 *   companyProfiles?: Iterable<string> }} p - `companyProfiles`: os perfis de empresa
 *   (`companyProfilesFor`); um skill cujo nome começa com `{perfil}-` de algum
 *   deles nunca é obsoleto. Vazio = sem esse filtro. O prefixo inclui o hífen: com `claro`, os
 *   skills `claro` e `claroapp` continuam candidatos.
 * @returns {string[]} nomes (pastas) de skills instalados que o framework não tem mais
 */
export function findStaleSkills({
  ideSkillsDir,
  frameworkSkillsDir,
  registered = new Set(),
  companyProfiles = new Set(),
}) {
  if (!existsSync(ideSkillsDir)) return [];
  const companyPrefixes = [...companyProfiles].filter(Boolean).map((p) => `${p}-`);
  return readdirSync(ideSkillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && SKILL_NAME.test(e.name))
    .map((e) => e.name)
    .filter((name) => existsSync(join(ideSkillsDir, name, "SKILL.md")))
    .filter((name) => !existsSync(join(frameworkSkillsDir, name)))
    .filter((name) => !registered.has(name))
    .filter((name) => !companyPrefixes.some((prefix) => name.startsWith(prefix)))
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
