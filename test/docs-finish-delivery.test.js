// Testes de finish-delivery.js: arquivar e finalizar uma entrega consolidada (#220).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  archiveEntries,
  finalizeEntries,
  forceFinalize,
  rewriteRelatedRefs,
  rewriteRelatedInText,
} from "../bin/lib/docs/finish-delivery.js";

function write(file, content) {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

function tmp() {
  return mkdtempSync(join(tmpdir(), "jarvis-finish-delivery-"));
}

test("archiveEntries: copia o original para archive/, marca hash e destino; não apaga nada", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-001-checkout.md");
    write(original, "---\nid: PRD-001\n---\n# PRD\n");

    const entries = [
      { tipo: "prd", feature: "checkout", originalPath: original },
      { tipo: "feature", feature: "checkout" }, // sem originalPath: não é arquivado
    ];

    const { archived, skipped, errors } = archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    assert.equal(errors.length, 0);
    assert.equal(skipped.length, 0);
    assert.equal(archived.length, 1);
    assert.equal(archived[0].archiveDestPath, "CORE/loja/checkout/archive/prd-001-checkout.md");
    assert.ok(existsSync(join(root, "CORE/loja/checkout/archive/prd-001-checkout.md")));
    assert.ok(existsSync(original), "o original continua onde estava");
    assert.equal(entries[0].archivedHash.length, 64, "sha256 em hex");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archiveEntries: original ausente vira erro; destino já arquivado vira 'pulado'", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-002.md");
    write(original, "# PRD\n");
    write(join(root, "CORE/loja/checkout/archive/prd-002.md"), "# já estava aqui\n");

    const { archived, skipped, errors } = archiveEntries({
      root,
      squad: "CORE",
      produto: "loja",
      entries: [
        { tipo: "prd", feature: "checkout", originalPath: original },
        { tipo: "prd", feature: "checkout", originalPath: join(dir, "nao-existe.md") },
      ],
    });

    assert.equal(archived.length, 0);
    assert.equal(skipped.length, 1);
    assert.equal(skipped[0].reason, "já arquivado");
    assert.equal(errors.length, 1);
    assert.match(errors[0], /não encontrado/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteRelatedRefs: troca related_prd pelo caminho no Central docs só quando o basename casa", () => {
  const dir = tmp();
  try {
    const prodDocs = join(dir, "docs/jarvis/product");
    write(
      join(prodDocs, "frd-001-checkout.md"),
      "---\nid: FRD-001\nrelated_prd: prd-001-checkout.md\n---\n# FRD\n"
    );
    write(
      join(prodDocs, "frd-002-outro.md"),
      "---\nid: FRD-002\nrelated_prd: prd-999-outro.md\n---\n# FRD\n"
    );
    const env = { PROD_DOCS: prodDocs };

    const changed = rewriteRelatedRefs(env, "prd-001-checkout.md", "CORE/loja/checkout/archive/prd-001-checkout.md");

    assert.equal(changed.length, 1);
    assert.match(
      readFileSync(join(prodDocs, "frd-001-checkout.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/checkout\/archive\/prd-001-checkout\.md/
    );
    assert.match(readFileSync(join(prodDocs, "frd-002-outro.md"), "utf-8"), /prd-999-outro\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteRelatedRefs: expande $VAR do ENV.md antes de montar PROD_DOCS/ENG_DOCS/DISCOVERIES_DOCS (#220 item 2)", () => {
  const dir = tmp();
  try {
    const prodDocs = join(dir, "docs/jarvis/product");
    write(
      join(prodDocs, "frd-010.md"),
      "---\nrelated_prd: prd-010.md\n---\n# FRD\n"
    );
    // ENV.md real: variáveis cruas, sem expandir (loadEnv não expande, #220 item 2).
    // DOCS_FOLDER absoluto (dentro da pasta temporária) para a expansão apontar exatamente
    // para `prodDocs`, sem depender do cwd do teste.
    const env = {
      DOCS_FOLDER: join(dir, "docs"),
      JARVIS_DOCS: "$DOCS_FOLDER/jarvis",
      PROD_FOLDER_NAME: "product",
      PROD_DOCS: "$JARVIS_DOCS/$PROD_FOLDER_NAME",
    };

    const changed = rewriteRelatedRefs(env, "prd-010.md", "CORE/loja/x/decisions/prd-010.md");

    // Sem expandir, a pasta resolvida seria o literal "$JARVIS_DOCS/$PROD_FOLDER_NAME" (relativo
    // ao cwd do teste) e nunca encontraria o arquivo criado em `prodDocs` (caminho absoluto).
    assert.equal(changed.length, 1, "encontrou e reescreveu o arquivo depois de expandir $VAR");
    assert.match(
      readFileSync(join(prodDocs, "frd-010.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/x\/decisions\/prd-010\.md/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewriteRelatedInText: lista inline ({a, b} ou [a, b]) troca só o item removido (#220 item 3)", () => {
  const curly = rewriteRelatedInText(
    "related_docs: {prd-001-nome.md, frd-001-nome.md}",
    "prd-001-nome.md",
    "CORE/loja/checkout/decisions/prd-001-nome.md"
  );
  assert.equal(curly.changed, true);
  assert.equal(
    curly.text,
    "related_docs: {CORE/loja/checkout/decisions/prd-001-nome.md, frd-001-nome.md}"
  );

  const brackets = rewriteRelatedInText(
    "related_prd: [prd-001.md, prd-002.md]",
    "prd-002.md",
    "novo.md"
  );
  assert.equal(brackets.text, "related_prd: [prd-001.md, novo.md]");
});

test("rewriteRelatedInText: lista em bloco (YAML multi-linha) troca só o item removido (#220 item 3)", () => {
  const text = ["related_prd:", "  - prd-001.md", "  - prd-002.md", "related_frd: frd-001.md"].join(
    "\n"
  );
  const { text: next, changed } = rewriteRelatedInText(text, "prd-002.md", "novo-destino.md");
  assert.equal(changed, true);
  assert.equal(
    next,
    ["related_prd:", "  - prd-001.md", "  - novo-destino.md", "related_frd: frd-001.md"].join("\n")
  );
});

test("rewriteRelatedInText: sem casar nenhum item, devolve o texto igual e changed=false", () => {
  const text = "related_prd: {prd-003.md, prd-004.md}";
  const { text: next, changed } = rewriteRelatedInText(text, "prd-999.md", "novo.md");
  assert.equal(changed, false);
  assert.equal(next, text);
});

test("archiveEntries: grava origin e original_status na cópia; rodar de novo após o original mudar atualiza o hash (#220 item 2)", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-003.md");
    write(original, "---\nstatus: in_progress\n---\n# PRD\n");
    const entries = [{ tipo: "prd", feature: "checkout", originalPath: original }];

    archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    const destAbs = join(root, entries[0].archiveDestPath);
    const firstContent = readFileSync(destAbs, "utf-8");
    assert.match(firstContent, new RegExp(`origin: ${original}`));
    assert.match(firstContent, /original_status: in_progress/);
    const firstHash = entries[0].archivedHash;

    // Rodar --archive de novo sem o original ter mudado: pula (hash igual).
    const r2 = archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    assert.equal(r2.archived.length, 0);
    assert.equal(r2.skipped[0].reason, "já arquivado");

    // O original muda depois do primeiro --archive: rodar de novo atualiza a cópia e o hash
    // (#220 item 2 — antes, ficava pulado para sempre e o --finalize nunca aceitava o item).
    writeFileSync(original, "---\nstatus: in_review\n---\n# PRD (editado)\n");
    const r3 = archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    assert.equal(r3.archived.length, 1);
    assert.notEqual(entries[0].archivedHash, firstHash);
    assert.match(readFileSync(destAbs, "utf-8"), /# PRD \(editado\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: não apaga sem archivedHash, sem a cópia em archive/, ou com a cópia divergente (#220 item 2)", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/prd-004.md");
    write(original, "# PRD\n");

    const semHash = { tipo: "prd", feature: "a", originalPath: original, archiveDestPath: "x.md" };
    const r1 = finalizeEntries({ entries: [semHash], root });
    assert.equal(r1.finalized.length, 0);
    assert.equal(r1.changed[0].reason, "sem hash do arquivamento");
    assert.equal(existsSync(original), true);

    const semCopia = {
      tipo: "prd",
      feature: "a",
      originalPath: original,
      archiveDestPath: "CORE/loja/a/archive/nao-existe.md",
      archivedHash: "abc",
    };
    const r2 = finalizeEntries({ entries: [semCopia], root });
    assert.equal(r2.finalized.length, 0);
    assert.equal(r2.changed[0].reason, "cópia em archive/ não encontrada");
    assert.equal(existsSync(original), true);

    write(join(root, "CORE/loja/a/archive/divergente.md"), "# outro conteúdo\n");
    const divergente = {
      tipo: "prd",
      feature: "a",
      originalPath: original,
      archiveDestPath: "CORE/loja/a/archive/divergente.md",
      archivedHash: "abc", // não é o hash real do arquivo em archive/
    };
    const r3 = finalizeEntries({ entries: [divergente], root });
    assert.equal(r3.finalized.length, 0);
    assert.equal(r3.changed[0].reason, "cópia em archive/ não bate o hash");
    assert.equal(existsSync(original), true, "nada foi apagado sem a conferência passar");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries e forceFinalize: não apagam originalPath fora das pastas de documentos de trabalho (#220 item 2)", () => {
  const dir = tmp();
  try {
    const outside = join(dir, "fora-do-docs-jarvis", "nao-deveria-ser-apagado.md");
    write(outside, "# não é um documento de trabalho\n");
    const env = { PROD_DOCS: join(dir, "docs-jarvis/product") };

    const entryFinalize = {
      tipo: "prd",
      feature: "a",
      originalPath: outside,
      archiveDestPath: "x.md",
      archivedHash: "qualquer",
    };
    const r1 = finalizeEntries({ entries: [entryFinalize], env });
    assert.equal(r1.finalized.length, 0);
    assert.match(r1.errors[0], /fora das pastas de documentos de trabalho/);
    assert.equal(existsSync(outside), true);

    const r2 = forceFinalize({
      entries: [{ tipo: "prd", feature: "a", originalPath: outside }],
      squad: "CORE",
      produto: "loja",
      env,
    });
    assert.equal(r2.finalized.length, 0);
    assert.match(r2.errors[0], /fora das pastas de documentos de trabalho/);
    assert.equal(existsSync(outside), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: reescreve related_* para decisions/ (mesmo destino do forceFinalize), não archive/ (#220 item 2)", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const prodDocs = join(dir, "docs-jarvis/product");
    const original = join(prodDocs, "prd-005-checkout.md");
    write(original, "# PRD\n");
    write(join(prodDocs, "frd-005-checkout.md"), "---\nrelated_prd: prd-005-checkout.md\n---\n# FRD\n");
    const env = { PROD_DOCS: prodDocs };

    const entries = [{ tipo: "prd", feature: "checkout", originalPath: original }];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    const { finalized, rewritten } = finalizeEntries({
      entries,
      env,
      root,
      squad: "CORE",
      produto: "loja",
    });

    assert.equal(finalized.length, 1);
    assert.equal(rewritten.length, 1);
    assert.match(
      readFileSync(join(prodDocs, "frd-005-checkout.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/checkout\/decisions\/prd-005-checkout\.md/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: apaga o original só se o hash não mudou desde o --archive", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const unchanged = join(dir, "docs-jarvis/prd-001.md");
    const edited = join(dir, "docs-jarvis/prd-002.md");
    write(unchanged, "# PRD 1\n");
    write(edited, "# PRD 2 (original)\n");

    const entries = [
      { tipo: "prd", feature: "a", originalPath: unchanged },
      { tipo: "prd", feature: "b", originalPath: edited },
    ];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    // o segundo documento é editado DEPOIS do --archive
    writeFileSync(edited, "# PRD 2 (editado depois do archive)\n");

    const { finalized, changed, errors } = finalizeEntries({ entries });

    assert.equal(errors.length, 0);
    assert.equal(finalized.length, 1);
    assert.equal(finalized[0].originalPath, unchanged);
    assert.equal(existsSync(unchanged), false, "o que não mudou foi apagado");

    assert.equal(changed.length, 1);
    assert.equal(changed[0].originalPath, edited);
    assert.equal(existsSync(edited), true, "o que mudou NÃO foi apagado");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: idempotente — rodar duas vezes não falha nem apaga de novo", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/prd-001.md");
    write(original, "# PRD\n");
    const entries = [{ tipo: "prd", feature: "a", originalPath: original }];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    const r1 = finalizeEntries({ entries });
    assert.equal(r1.finalized.length, 1);

    const r2 = finalizeEntries({ entries });
    assert.equal(r2.finalized.length, 0);
    assert.equal(r2.errors.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forceFinalize: apaga o original direto, sem archive/, e reescreve related_*", () => {
  const dir = tmp();
  try {
    const prodDocs = join(dir, "docs-jarvis/product");
    const original = join(prodDocs, "prd-001-checkout.md");
    write(original, "# PRD\n");
    write(
      join(prodDocs, "frd-001-checkout.md"),
      "---\nrelated_prd: prd-001-checkout.md\n---\n# FRD\n"
    );
    const env = { PROD_DOCS: prodDocs };

    const { finalized, rewritten, errors } = forceFinalize({
      entries: [{ tipo: "prd", feature: "checkout", originalPath: original }],
      squad: "CORE",
      produto: "loja",
      env,
    });

    assert.equal(errors.length, 0);
    assert.equal(finalized.length, 1);
    assert.equal(existsSync(original), false);
    assert.equal(rewritten.length, 1);
    assert.match(
      readFileSync(join(prodDocs, "frd-001-checkout.md"), "utf-8"),
      /related_prd:\s*CORE\/loja\/checkout\/decisions\/prd-001-checkout\.md/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forceFinalize: entrada sem originalPath (feature/delivery/...) é ignorada", () => {
  const { finalized, errors } = forceFinalize({
    entries: [{ tipo: "feature", feature: "checkout" }],
    squad: "CORE",
    produto: "loja",
  });
  assert.deepEqual(finalized, []);
  assert.deepEqual(errors, []);
});

test("finalizeEntries: entrada sem archiveDestPath (não arquivada) é ignorada", () => {
  const original = "/tmp/jarvis-does-not-matter.md";
  const { finalized, changed, errors } = finalizeEntries({
    entries: [{ tipo: "prd", feature: "a", originalPath: original }],
  });
  assert.deepEqual(finalized, []);
  assert.deepEqual(changed, []);
  assert.deepEqual(errors, []);
});
