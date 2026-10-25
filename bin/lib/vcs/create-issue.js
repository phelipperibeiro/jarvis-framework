import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXIT, createIssue } from "./api.js";

/**
 * "enhancement, documentation" → ["enhancement", "documentation"]; vazio → undefined (padrão: bug).
 * @param {string} [raw]
 * @returns {string[] | undefined}
 */
export function parseLabels(raw) {
  const list = String(raw || "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * Abre uma issue pela CLI do vendor do repositório (`gh issue create` / `glab issue create`).
 * Usada por `jarvis vcs create-issue` e pelo skill `jarvis-report-issue`.
 * `repo` precisa ser a URL completa (ex.: o `JARVIS_PROJECT`); sem host, o vendor não é adivinhado.
 * Saída: 0 aberta · 3 indisponível (nada enviado) · 4 enviado com erro (confira antes de repetir).
 * @param {Object} options
 * @param {string} options.repo - URL completa do repositório
 * @param {string} options.title - Título da issue
 * @param {string} options.bodyFile - Path de um arquivo com o corpo em markdown
 * @param {string} [options.labels] - Labels separadas por vírgula (padrão: bug)
 */
export async function runCreateIssue({ repo, title, bodyFile, labels }, deps = {}) {
  if (!title || !bodyFile || !repo) {
    console.error(
      "Uso: jarvis vcs create-issue --repo <url-completa> --title <titulo> --body-file <path> [--label <labels>]"
    );
    process.exit(EXIT.USAGE);
  }

  const repoUrl = repo.trim();
  if (!/^https?:\/\//.test(repoUrl) && !repoUrl.includes("@")) {
    console.error(
      `⚠️ Repositório sem host: ${repoUrl}. Defina JARVIS_PROJECT com a URL completa ` +
        "(ex.: https://github.com/phelipperibeiro/jarvis-framework). Nada foi enviado."
    );
    process.exit(EXIT.UNAVAILABLE);
  }

  if (!existsSync(bodyFile)) {
    console.error(`⚠️ Arquivo do corpo não encontrado: ${bodyFile}. Nada foi enviado.`);
    process.exit(EXIT.USAGE);
  }
  const body = readFileSync(bodyFile, "utf-8");

  try {
    const result = await createIssue(repoUrl, { title, body, labels: parseLabels(labels) }, deps);
    console.log(`✅ Issue aberto: ${result.url}`);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err.message);
    if (err.exitCode === EXIT.SENT_WITH_ERROR) {
      console.error("⚠️ A issue pode ter sido aberta. Confira no repositório antes de repetir.");
      process.exit(EXIT.SENT_WITH_ERROR);
    }
    process.exit(err.exitCode === EXIT.USAGE ? EXIT.USAGE : EXIT.UNAVAILABLE);
  }
}

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

// Compatibilidade: continua funcionando como `node bin/lib/vcs/create-issue.js --repo ...`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCreateIssue({
    title: arg("title"),
    bodyFile: arg("body-file"),
    repo: arg("repo"),
    labels: arg("label"),
  });
}
