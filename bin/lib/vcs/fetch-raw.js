import { fetchRawFile } from "./api.js";

const filePath = process.argv[2];
const ref = process.argv[3] || "main";
const repo = process.env.CENTRAL_DOCS_REPO;

if (!filePath) {
  console.error("Uso: fetch-raw.js <file-path> [ref]");
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
