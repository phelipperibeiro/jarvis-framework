import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// From bin/lib/utils -> go up 3 levels to reach project root (both dev and production)
export const FRAMEWORK_ROOT = join(__dirname, "..", "..", "..");

export function getFrameworkRoot() {
  if (process.env.JARVIS_ROOT && existsSync(process.env.JARVIS_ROOT)) {
    return process.env.JARVIS_ROOT;
  }

  if (existsSync(join(FRAMEWORK_ROOT, "agents"))) {
    return FRAMEWORK_ROOT;
  }

  throw new Error(
    "Não foi possível localizar os assets do framework.\n" +
      "Instale o Jarvis global: npm install -g jarvis-ai-framework"
  );
}

/** @returns {{ name: string, version: string, root: string }} */
export function getPackageInfo() {
  const root = getFrameworkRoot();
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) {
    return { name: "jarvis-framework", version: "0.0.0", root };
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return {
    name: pkg.name || "jarvis-framework",
    version: pkg.version || "0.0.0",
    root,
  };
}
