import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createMergeRequest, parseRepoUrl } from "./api.js";

/**
 * Abre um MR/PR via adapter (GitLab/GitHub/Bitbucket, pelo hostname do remote).
 * Usada por `jarvis vcs create-merge` e, diretamente, por `eng.pr`.
 * @param {Object} options
 * @param {string} options.source - Branch de origem
 * @param {string} options.target - Branch de destino
 * @param {string} options.title - Título do MR/PR
 * @param {string} [options.bodyFile] - Path de um arquivo com a descrição
 * @param {string} [options.repo] - URL do repo (padrão: `git remote get-url origin`)
 */
export async function runCreateMerge({ source, target, title, bodyFile, repo }) {
  if (!source || !target || !title) {
    console.error(
      "Uso: jarvis vcs create-merge --source <branch> --target <branch> --title <titulo> [--body-file path] [--repo url]"
    );
    process.exit(1);
  }

  const repoUrl = repo || execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
  const description = bodyFile ? readFileSync(bodyFile, "utf-8") : "";

  try {
    const result = await createMergeRequest(repoUrl, {
      source,
      target,
      title,
      description,
    });
    const parsed = parseRepoUrl(repoUrl);
    const noun = parsed.vendor === "gitlab" ? "MR" : "PR";
    console.log(`✅ ${noun} criado: ${result.url}`);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

// Compatibilidade: continua funcionando como `node bin/lib/vcs/create-merge.js --source ...`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCreateMerge({
    source: arg("source"),
    target: arg("target"),
    title: arg("title"),
    bodyFile: arg("body-file"),
    repo: arg("repo"),
  });
}
