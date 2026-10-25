import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXIT, createMergeRequest, newMergeRequestUrl, parseRepoUrl } from "./api.js";
import { accessValue, loadFileEnv, setting } from "../integrations/cli-runner.js";

/**
 * Abre um MR/PR pela CLI do vendor (`gh pr create` / `glab mr create`, pelo hostname do remote).
 * Usada por `jarvis vcs create-merge` e, diretamente, por `eng.pr`.
 * Saída: 0 criado · 1 uso · 3 indisponível (nada enviado; inclui `VERSION_CONTROL_ACCESS=manual`)
 * · 4 enviado com erro (confira antes de repetir).
 * @param {Object} options
 * @param {string} options.source - Branch de origem
 * @param {string} options.target - Branch de destino
 * @param {string} options.title - Título do MR/PR
 * @param {string} [options.bodyFile] - Path de um arquivo com a descrição
 * @param {string} [options.repo] - URL do repo (padrão: `git remote get-url origin`)
 * @param {{ exec?: Function, fileEnv?: Object }} [deps] - `exec` da CLI e as variáveis do ENV.md, injetáveis (testes)
 */
export async function runCreateMerge({ source, target, title, bodyFile, repo }, deps = {}) {
  if (!source || !target || !title) {
    console.error(
      "Uso: jarvis vcs create-merge --source <branch> --target <branch> --title <titulo> [--body-file path] [--repo url]"
    );
    process.exit(EXIT.USAGE);
  }

  if (bodyFile && !existsSync(bodyFile)) {
    console.error(`⚠️ Arquivo da descrição não encontrado: ${bodyFile}. Nada foi enviado.`);
    process.exit(EXIT.USAGE);
  }

  const repoUrl = repo || execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
  const manualUrl = () => {
    try {
      return newMergeRequestUrl(repoUrl, source, target);
    } catch {
      return null; // remote fora de github/gitlab: sem link
    }
  };

  // O eng.pr chama este comando sem exportar o ENV.md: o que não vier no ambiente sai de lá.
  const fileVars = deps.fileEnv ?? loadFileEnv();
  const access = accessValue("VERSION_CONTROL_ACCESS", fileVars);
  if (access === "manual") {
    const link = manualUrl();
    console.error(
      "ℹ️ VERSION_CONTROL_ACCESS=manual: nada foi enviado; abra o PR/MR à mão com o pull-request.md" +
        (link ? `: ${link}` : ".")
    );
    process.exit(EXIT.UNAVAILABLE);
  }
  if (!access && setting("VERSION_CONTROL", fileVars)) {
    console.error(
      "ℹ️ VERSION_CONTROL_ACCESS vazio: tentando a CLI. Rode o /jarvis-init para confirmar o acesso."
    );
  }

  const description = bodyFile ? readFileSync(bodyFile, "utf-8") : "";

  let noun = "PR";
  try {
    noun = parseRepoUrl(repoUrl).vendor === "gitlab" ? "MR" : "PR";
    const result = await createMergeRequest(repoUrl, { source, target, title, description }, deps);
    console.log(`✅ ${noun} criado: ${result.url}`);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err.message);
    if (err.exitCode === EXIT.SENT_WITH_ERROR) {
      console.error(`⚠️ O ${noun} pode ter sido criado. Confira no host antes de repetir.`);
      process.exit(EXIT.SENT_WITH_ERROR);
    }
    if (err.exitCode === EXIT.USAGE) process.exit(EXIT.USAGE);
    const link = manualUrl();
    if (link) console.error(`Abra o ${noun} à mão: ${link}`);
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
