import { readFileSync, existsSync } from "node:fs";
import { createIssue, parseRepoUrl } from "./api.js";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

const title = arg("title");
const bodyFile = arg("body-file");
const repo = arg("repo");

if (!title || !bodyFile || !repo) {
  console.error(
    "Uso: create-issue.js --repo <url-ou-path> --title <titulo> --body-file <path>",
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
