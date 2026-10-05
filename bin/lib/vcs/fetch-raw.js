import { fileURLToPath } from "node:url";
import { fetchRawFile } from "./api.js";

/**
 * Busca o conteúdo bruto de um arquivo no central-docs via adapter.
 * Usada por `jarvis vcs fetch-raw`.
 * @param {string} filePath - Path do arquivo dentro do repo central-docs
 * @param {string} [ref] - Branch/ref (padrão: "main")
 */
export async function runFetchRaw(filePath, ref = "main") {
  const repo = process.env.CENTRAL_DOCS_REPO;

  if (!filePath) {
    console.error("Uso: jarvis vcs fetch-raw <file-path> [ref]");
    process.exit(1);
  }
  if (!repo) {
    console.error("CENTRAL_DOCS_REPO não definido");
    process.exit(1);
  }

  try {
    const content = await fetchRawFile(repo, filePath, ref);
    process.stdout.write(content);
  } catch (err) {
    if (err.code === 404) {
      console.error(`⚠️  Arquivo não encontrado no central-docs: ${filePath}`);
      process.exit(2);
    }
    if (err.code === 401 || err.code === 403) {
      console.error("❌ Token sem permissão para acessar o repositório");
      process.exit(1);
    }
    console.error(err.message);
    process.exit(1);
  }
}

// Compatibilidade: continua funcionando como `node bin/lib/vcs/fetch-raw.js <file-path> [ref]`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runFetchRaw(process.argv[2], process.argv[3] || "main");
}
