import { execSync } from "node:child_process";
import { userInfo } from "node:os";

/**
 * Resolve local identity without OAuth.
 * Order: ENV.md USER → git user.email → OS username → "local"
 */
export function resolveUser(env = {}) {
  const envUser = typeof env.USER === "string" ? env.USER.trim() : "";
  if (envUser) return { id: envUser, source: "ENV.md" };

  try {
    const email = execSync("git config --get user.email", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (email) return { id: email, source: "git" };
  } catch {
    // ignore
  }

  try {
    const username = userInfo().username;
    if (username) return { id: username, source: "os" };
  } catch {
    // ignore
  }

  return { id: "local", source: "fallback" };
}
