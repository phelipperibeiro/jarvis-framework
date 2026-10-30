/**
 * @fileoverview Perfil de empresa (`COMPANY_PROFILE`, #199): nome do overlay ativo em
 * `$IDE/overlays/{perfil}/`. A chave nunca fica vazia: o default é `stark-industries`,
 * o overlay padrão do Jarvis. Um nome fora do padrão ou igual a uma pasta do core cai
 * no default, com aviso. Este módulo só decide o nome; quem lê e grava arquivos é quem o chama.
 * @module core/company-profile
 */

/** @constant {string} Perfil default: o overlay padrão de todo workspace */
export const DEFAULT_COMPANY_PROFILE = "stark-industries";

/** @constant {RegExp} Mesmo padrão dos nomes de skill (minúsculas, números e hífen) */
export const COMPANY_PROFILE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Pastas do core que um perfil não pode usar como nome: o overlay espelha estas pastas,
 * e `overlays/rules/` ficaria ambíguo com `rules/`.
 * @constant {ReadonlyArray<string>}
 */
export const CORE_FOLDERS = Object.freeze([
  "agents",
  "skills",
  "workflows",
  "commands",
  "rules",
  "rules-on-demand",
  "templates",
  "scripts",
  "overlays",
]);

/**
 * @param {string} name
 * @returns {boolean} true se o nome serve como perfil (padrão e fora das pastas do core)
 */
export function isValidCompanyProfile(name) {
  return COMPANY_PROFILE_PATTERN.test(name) && !CORE_FOLDERS.includes(name);
}

/**
 * Resolve o perfil ativo a partir do valor lido do `ENV.md` (já sem aspas e comentário).
 * Vazio ou ausente → default com aviso ℹ️ (ENV editado à mão ou anterior à #199);
 * inválido → default com aviso ⚠️. O aviso vai no retorno, nunca em log: quem chama decide.
 * @param {string | undefined | null} raw - valor de `COMPANY_PROFILE`
 * @returns {{ profile: string, warning: string | null, isDefault: boolean }}
 */
export function resolveCompanyProfile(raw) {
  const value = (raw ?? "").trim();
  if (!value) {
    return {
      profile: DEFAULT_COMPANY_PROFILE,
      isDefault: true,
      warning:
        raw === undefined || raw === null
          ? null
          : `ℹ️ COMPANY_PROFILE vazio: usando o perfil default ${DEFAULT_COMPANY_PROFILE}. Rode /jarvis-init para definir um perfil próprio.`,
    };
  }
  if (CORE_FOLDERS.includes(value)) {
    return {
      profile: DEFAULT_COMPANY_PROFILE,
      isDefault: true,
      warning: `⚠️ COMPANY_PROFILE não pode ser o nome de uma pasta do core (${CORE_FOLDERS.join(", ")}). Usando o perfil default ${DEFAULT_COMPANY_PROFILE}.`,
    };
  }
  if (!COMPANY_PROFILE_PATTERN.test(value)) {
    return {
      profile: DEFAULT_COMPANY_PROFILE,
      isDefault: true,
      warning: `⚠️ COMPANY_PROFILE "${value}" inválido (use letras minúsculas, números e hífen). Usando o perfil default ${DEFAULT_COMPANY_PROFILE}.`,
    };
  }
  return { profile: value, isDefault: value === DEFAULT_COMPANY_PROFILE, warning: null };
}

/**
 * Lê `COMPANY_PROFILE=` de um texto de `ENV.md` (primeira ocorrência, sem aspas nem comentário
 * de fim de linha) e resolve o perfil. ENV.md sem a chave (anterior à #199) → default com o ℹ️,
 * como a chave vazia; sem ENV.md (`envText` ausente, primeiro `jarvis init`) → default sem aviso.
 * @param {string | undefined} envText
 * @returns {{ profile: string, warning: string | null, isDefault: boolean }}
 */
export function readCompanyProfile(envText) {
  if (envText === undefined || envText === null) return resolveCompanyProfile(undefined);
  const match = /^[ \t]*COMPANY_PROFILE=(.*)$/m.exec(envText);
  if (!match) return resolveCompanyProfile("");
  const raw = match[1]
    .replace(/\s+#.*$/, "")
    .trim()
    .replace(/^["']|["']$/g, "");
  return resolveCompanyProfile(raw);
}
