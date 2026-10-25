import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXIT, createMergeRequest, newMergeRequestUrl } from "./api.js";
import { accessGate, getVendor, resolveFileEnv, setting } from "../integrations/cli-runner.js";

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
 * @param {string} [options.ide] - `--ide`, para achar o ENV.md quando há mais de um no workspace
 * @param {string} [options.envFile] - `--env-file`, ENV.md explícito
 * @param {{ exec?: Function, fileEnv?: Object }} [deps] - `exec` da CLI e as variáveis do ENV.md, injetáveis (testes)
 */
export async function runCreateMerge(
  { source, target, title, bodyFile, repo, ide, envFile },
  deps = {}
) {
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
  const fileEnv = resolveFileEnv({ ...deps, envOpts: { ide, envFile } });
  const gate = accessGate("VERSION_CONTROL_ACCESS", fileEnv);
  if (!gate.ok) {
    const link = gate.mode === "manual" ? manualUrl() : null;
    console.error(
      `ℹ️ ${gate.reason}` +
        (gate.mode === "manual"
          ? `; abra o PR/MR à mão com o pull-request.md${link ? `: ${link}` : "."}`
          : ".")
    );
    process.exit(EXIT.UNAVAILABLE);
  }
  if (gate.warning && getVendor(setting("VERSION_CONTROL", fileEnv.vars))) {
    console.error(`ℹ️ ${gate.warning}`);
  }

  const description = bodyFile ? readFileSync(bodyFile, "utf-8") : "";

  const nounOf = (vendor) => (vendor === "gitlab" ? "MR" : "PR");
  try {
    // Repassa o ENV.md já resolvido (com --ide/--env-file): sem isso, o createMergeRequest o leria
    // de novo pelo cwd e falharia com dois ENV.md no workspace.
    const result = await createMergeRequest(
      repoUrl,
      { source, target, title, description },
      { ...deps, fileEnvResult: fileEnv }
    );
    console.log(`✅ ${nounOf(result.vendor)} criado: ${result.url}`);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(err.message);
    const noun = nounOf(err.vendor); // sem vendor (remote fora de github/gitlab): "PR"
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
    ide: arg("ide"),
    envFile: arg("env-file"),
  });
}
