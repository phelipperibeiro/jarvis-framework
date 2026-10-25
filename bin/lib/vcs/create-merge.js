import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXIT, createMergeRequest, newMergeRequestUrl, parseRepoUrl } from "./api.js";

/**
 * Abre um MR/PR pela CLI do vendor (`gh pr create` / `glab mr create`, pelo hostname do remote).
 * Usada por `jarvis vcs create-merge` e, diretamente, por `eng.pr`.
 * Saída: 0 criado · 3 indisponível (nada enviado) · 4 enviado com erro (confira antes de repetir).
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
    process.exit(EXIT.USAGE);
  }

  const repoUrl = repo || execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
  const description = bodyFile ? readFileSync(bodyFile, "utf-8") : "";

  let noun = "PR";
  try {
    noun = parseRepoUrl(repoUrl).vendor === "gitlab" ? "MR" : "PR";
    const result = await createMergeRequest(repoUrl, { source, target, title, description });
    console.log(`✅ ${noun} criado: ${result.url}`);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err.message);
    if (err.exitCode === EXIT.SENT_WITH_ERROR) {
      console.error(`⚠️ O ${noun} pode ter sido criado. Confira no host antes de repetir.`);
      process.exit(EXIT.SENT_WITH_ERROR);
    }
    try {
      console.error(`Abra o ${noun} à mão: ${newMergeRequestUrl(repoUrl, source, target)}`);
    } catch {
      // URL do repositório inválida: a mensagem acima já explica
    }
    process.exit(EXIT.UNAVAILABLE);
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
