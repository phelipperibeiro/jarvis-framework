// Flat config (ESLint 9.x). Pinned to the 9.x line in package.json — ESLint 10
// raises the Node floor above this project's declared `engines.node >=18.0.0`.
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

/**
 * Each block below is a layer, applied in order:
 *   1. ignores      -> what ESLint never looks at
 *   2. recommended   -> @eslint/js baseline (bugs, not style)
 *   3. project rules  -> env/globals + the few rules this CLI actually needs
 *   4. prettier compat -> must stay last: turns off any stylistic rule that
 *                         would otherwise fight with Prettier's formatting
 */

const ignores = {
  ignores: ["node_modules/**", "coverage/**", ".jarvis/**"],
};

const recommended = {
  files: ["bin/**/*.js", "test/**/*.js"],
  ...js.configs.recommended,
};

const projectRules = {
  files: ["bin/**/*.js", "test/**/*.js"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      // Node.js ESM globals used across bin/ and test/
      process: "readonly",
      console: "readonly",
      Buffer: "readonly",
      __dirname: "readonly",
      __filename: "readonly",
      module: "readonly",
      require: "readonly",
      setTimeout: "readonly",
      clearTimeout: "readonly",
      URL: "readonly",
      fetch: "readonly",
      FormData: "readonly",
      Blob: "readonly",
      TextEncoder: "readonly",
      TextDecoder: "readonly",
    },
  },
  rules: {
    // Unused catch-block error params are common in this codebase's
    // fallback-handling style (try primary path, swallow and fall back).
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_?e(rr)?$" },
    ],
    // `catch {}` is the established pattern for "try the preferred path,
    // silently fall back" across sync-engine.js, postinstall.js, etc.
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
};

export default [ignores, recommended, projectRules, prettierConfig];
