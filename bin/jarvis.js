#!/usr/bin/env node

import { buildProgram } from "./lib/cli/program.js";

const program = buildProgram();

// Sem comando: mostra a ajuda e sai com sucesso (não é um erro de uso).
// O default do commander para esse caso é process.exit(1); aqui replicamos
// o comportamento do dispatcher antigo, que apenas chamava help() e seguia.
if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}

await program.parseAsync(process.argv);
