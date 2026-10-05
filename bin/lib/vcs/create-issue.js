import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createIssue, parseRepoUrl } from "./api.js";

/**
 * Abre uma issue via adapter (GitLab/GitHub/Bitbucket).
 * Usada por `jarvis vcs create-issue` e pelo skill `jarvis-report-issue`.
 * @param {Object} options
 * @param {string} options.repo - URL ou `org/repo` do repositório
 * @param {string} options.title - Título da issue
 * @param {string} options.bodyFile - Path de um arquivo com o corpo em markdown
 */
export async function runCreateIssue({ repo, title, bodyFile }) {
  if (!title || !bodyFile || !repo) {
    console.error(
      "Uso: jarvis vcs create-issue --repo <url-ou-path> --title <titulo> --body-file <path>"
    );
    process.exit(1);
  }

  let repoUrl = repo.trim();
  if (!/^https?:\/\//.test(repoUrl) && !repoUrl.includes("@")) {
    const hostGuess = (process.env.VERSION_CONTROL || "gitlab").toLowerCase();
    const host =
      hostGuess === "github"
        ? "github.com"
        : hostGuess === "bitbucket"
          ? "bitbucket.org"
          : "gitlab.com";
    repoUrl = `https://${host}/${repoUrl.replace(/^\/+/, "")}`;
  }

  const body = existsSync(bodyFile) ? readFileSync(bodyFile, "utf-8") : "";

  try {
    const result = await createIssue(repoUrl, { title, body });
    parseRepoUrl(repoUrl);
    console.log(`✅ Issue aberto: ${result.url}`);
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

// Compatibilidade: continua funcionando como `node bin/lib/vcs/create-issue.js --repo ...`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCreateIssue({
    title: arg("title"),
    bodyFile: arg("body-file"),
    repo: arg("repo"),
  });
}
