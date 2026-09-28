import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createMergeRequest, parseRepoUrl } from "./api.js";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

const source = arg("source");
const target = arg("target");
const title = arg("title");
const bodyFile = arg("body-file");
const repoArg = arg("repo");

if (!source || !target || !title) {
  console.error(
    "Uso: create-merge.js --source <branch> --target <branch> --title <titulo> [--body-file path] [--repo url]",
  );
  process.exit(1);
}

const repoUrl =
  repoArg ||
  execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
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
