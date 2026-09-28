import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

function readNpmrcToken(hostFragment, cwd = process.cwd()) {
  const paths = [join(cwd, ".npmrc"), join(homedir(), ".npmrc")];
  const re = new RegExp(
    `//[^\\s]*${hostFragment.replace(".", "\\.")}[^\\s]*:_authToken=([^\\s]+)`,
  );

  for (const path of paths) {
    if (!existsSync(path)) continue;
    try {
      const content = readFileSync(path, "utf-8");
      const match = content.match(re);
      if (match?.[1]) return match[1];
    } catch {
      continue;
    }
  }
  return null;
}

function ghCliToken() {
  try {
    const token = execSync("gh auth token", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return token || null;
  } catch {
    return null;
  }
}

/**
 * Token do vendor de Git (ENV / .npmrc / CLI).
 * @param {'gitlab'|'github'|'bitbucket'|string} vendor
 * @param {string} [cwd]
 */
export function getVcsToken(vendor, cwd = process.cwd()) {
  const v = String(vendor || process.env.VERSION_CONTROL || "")
    .trim()
    .toLowerCase();

  if (v === "github") {
    const token =
      process.env.GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      readNpmrcToken("npm.pkg.github.com", cwd) ||
      readNpmrcToken("github.com", cwd) ||
      ghCliToken();
    if (token) return token;
    throw new Error(
      "Token GitHub não encontrado.\n" +
        "Use `gh auth login`, ou defina GITHUB_TOKEN, ou //npm.pkg.github.com/:_authToken= no .npmrc.",
    );
  }

  if (v === "bitbucket") {
    const token =
      process.env.BITBUCKET_TOKEN ||
      readNpmrcToken("bitbucket.org", cwd);
    if (token) return token;
    throw new Error(
      "Token Bitbucket não encontrado.\n" +
        "Defina BITBUCKET_TOKEN (App Password) no ambiente.",
    );
  }

  const token =
    process.env.GITLAB_TOKEN ||
    readNpmrcToken("gitlab.com", cwd) ||
    readNpmrcToken("gitlab", cwd);
  if (token) return token;
  throw new Error(
    "Token GitLab não encontrado no .npmrc\n" +
      "Configure:\n" +
      "  //gitlab.com/api/v4/packages/npm/:_authToken=seu-token\n" +
      "Ou GITLAB_TOKEN no ambiente.",
  );
}

/** @deprecated use getVcsToken('gitlab') */
export function getGitLabToken(cwd = process.cwd()) {
  return getVcsToken("gitlab", cwd);
}

export function hasGitLabToken(cwd = process.cwd()) {
  try {
    getVcsToken("gitlab", cwd);
    return true;
  } catch {
    return false;
  }
}

export function hasVcsToken(vendor, cwd = process.cwd()) {
  try {
    getVcsToken(vendor, cwd);
    return true;
  } catch {
    return false;
  }
}
