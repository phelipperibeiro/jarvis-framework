// Testes de finish-delivery.js: arquivar e finalizar uma entrega consolidada (#220).
// Rode com: npm run test:filtro
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  archiveDestFor,
  archiveEntries,
  finalizeEntries,
  forceFinalize,
  isAllowedOriginal,
  rewriteRelatedRefs,
  rewriteRelatedInText,
  sessionFolderOf,
  verifyPublishedCopy,
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

test("archiveEntries: funcionalidade chamada 'decisions' não quebra o caminho de archive/ (#220, rodada 2 item 2, N8)", () => {
  // Antes (N8), archiveDestFor trocava a primeira ocorrência de "/decisions/" no destPath já
  // pronto — com a funcionalidade chamada "decisions", o destPath é
  // "CORE/loja/decisions/decisions/prd-x.md" e a troca acertava o segmento errado.
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const original = join(dir, "docs-jarvis/product/prd-010.md");
    write(original, "# PRD\n");
    const entries = [{ tipo: "prd", feature: "decisions", originalPath: original }];

    const { archived, errors } = archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    assert.equal(errors.length, 0);
    assert.equal(archived.length, 1);
    assert.equal(archived[0].archiveDestPath, "CORE/loja/decisions/archive/prd-010.md");
    assert.ok(existsSync(join(root, "CORE/loja/decisions/archive/prd-010.md")));
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

test("rewriteRelatedInText: lista de um item só, sem espaço após a vírgula, e valor entre aspas (#220, rodada 2 item 2, N2)", () => {
  // Sem a ordem certa (lista antes de escalar) e sem tirar aspas, o `\S+` de SCALAR_RE casava
  // "[a.md]"/"\"a.md\"" inteiro e nunca reescrevia — regressão encontrada na própria rodada 2.
  assert.deepEqual(rewriteRelatedInText("related_prd: [a.md]", "a.md", "novo.md"), {
    text: "related_prd: [novo.md]",
    changed: true,
  });
  assert.deepEqual(rewriteRelatedInText("related_prd: [a.md,b.md]", "b.md", "novo.md"), {
    text: "related_prd: [a.md, novo.md]",
    changed: true,
  });
  assert.deepEqual(rewriteRelatedInText('related_prd: "a.md"', "a.md", "novo.md"), {
    text: "related_prd: novo.md",
    changed: true,
  });
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

test("finalizeEntries: não apaga sem archivedHash, sem a cópia em archive/, ou com o original mudado (#220 item 2)", () => {
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

    // A cópia em archive/ existe, mas o conteúdo dela não bate o `archivedHash` gravado (rodada
    // 2, N5: antes desta correção, só a existência era conferida — uma cópia corrompida ou
    // sobrescrita por fora passava direto).
    write(join(root, "CORE/loja/a/archive/divergente.md"), "# outro conteúdo (cópia corrompida)\n");
    const divergente = {
      tipo: "prd",
      feature: "a",
      originalPath: original,
      archiveDestPath: "CORE/loja/a/archive/divergente.md",
      archivedHash: "abc", // não é o hash real nem do original, nem da cópia em archive/
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

test("finalizeEntries: unlinkSync falhando (pasta sem permissão de escrita) entra em errors, sem travar o loop (#220 item 3)", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const protectedDir = join(dir, "docs-jarvis-protegida");
    const original = join(protectedDir, "prd-006.md");
    const outro = join(dir, "docs-jarvis/prd-007.md");
    write(original, "# PRD protegido\n");
    write(outro, "# PRD normal\n");
    const entries = [
      { tipo: "prd", feature: "a", originalPath: original },
      { tipo: "prd", feature: "b", originalPath: outro },
    ];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    chmodSync(protectedDir, 0o555); // sem permissão de escrita: unlinkSync falha (EACCES/EPERM)
    try {
      const { finalized, errors } = finalizeEntries({ entries, root });

      assert.equal(finalized.length, 1, "o outro item, sem bloqueio, foi finalizado normalmente");
      assert.equal(finalized[0].originalPath, outro);
      assert.equal(errors.length, 1);
      assert.match(errors[0], new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.equal(existsSync(original), true, "o bloqueado continua existindo, não foi apagado");
    } finally {
      chmodSync(protectedDir, 0o755);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("forceFinalize: unlinkSync falhando (pasta sem permissão de escrita) entra em errors, sem travar o loop (#220 item 3)", () => {
  const dir = tmp();
  try {
    const protectedDir = join(dir, "docs-jarvis-protegida");
    const original = join(protectedDir, "prd-008.md");
    write(original, "# PRD protegido\n");

    chmodSync(protectedDir, 0o555);
    try {
      const { finalized, errors } = forceFinalize({
        entries: [{ tipo: "prd", feature: "a", originalPath: original }],
        squad: "CORE",
        produto: "loja",
      });

      assert.equal(finalized.length, 0);
      assert.equal(errors.length, 1);
      assert.equal(existsSync(original), true);
    } finally {
      chmodSync(protectedDir, 0o755);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalizeEntries: dois originais que se citam por related_* terminam os dois finalizados (#220, rodada 2 item 2, N1)", () => {
  const dir = tmp();
  try {
    const root = join(dir, "cd");
    const prodDocs = join(dir, "docs-jarvis/product");
    const prd = join(prodDocs, "prd-009-checkout.md");
    const frd = join(prodDocs, "frd-009-checkout.md");
    write(prd, "---\nid: PRD-009\n---\n# PRD\n");
    write(frd, "---\nid: FRD-009\nrelated_prd: prd-009-checkout.md\n---\n# FRD\n");
    const env = { PROD_DOCS: prodDocs };

    const entries = [
      { tipo: "prd", feature: "checkout", originalPath: prd },
      { tipo: "frd", feature: "checkout", originalPath: frd },
    ];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });

    // Numa passada só, reescrever o related_prd do FRD (porque o PRD foi processado antes)
    // mudava o hash do próprio FRD antes de o loop chegar nele, e ele saía como "mudou".
    const { finalized, changed, errors } = finalizeEntries({
      entries,
      env,
      root,
      squad: "CORE",
      produto: "loja",
    });

    assert.equal(errors.length, 0);
    assert.equal(changed.length, 0, "nenhum dos dois deveria ficar pendente por falso positivo");
    assert.equal(finalized.length, 2, "os dois, PRD e FRD, foram finalizados");
    assert.equal(existsSync(prd), false);
    assert.equal(existsSync(frd), false);
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

// --- arquivos da sessão (#229) -----------------------------------------------------------------

const sha = (text) => createHash("sha256").update(text).digest("hex");

/** Workspace de teste: ENV com SESSIONS_DIR, sessão do card 229 e Central docs em `cd/`. */
function sessionFixture() {
  const dir = tmp();
  const ws = join(dir, "ws");
  const root = join(dir, "cd");
  const sessao = join(ws, ".jarvis/sessions/eng/229");
  const files = {
    "architecture.md": "# Arquitetura\n",
    "plan.md": "# Plano\n",
    "ferramentas/saida.txt": "ok\n",
  };
  for (const [rel, text] of Object.entries(files)) write(join(sessao, rel), text);
  const env = { SESSIONS_DIR: ".jarvis/sessions", DOCS_FOLDER: "docs", JARVIS_DOCS: "$DOCS_FOLDER/jarvis" };
  /** Entrada como o `publish --manifest` a deixa (publishedAs/publishedHash preenchidos). */
  const entry = (tipo, rel, extra = {}) => ({
    tipo,
    feature: "checkout",
    taskKey: "229",
    fromSession: true,
    originalPath: join(sessao, rel),
    ...extra,
  });
  return { dir, ws, root, sessao, env, entry, files };
}

test("archiveDestFor: decisions segue o nome publicado (inclui -vN); history preserva o caminho sob archive/{taskKey}/ (#229)", () => {
  const base = { squad: "CORE", produto: "loja", feature: "checkout", taskKey: "229" };
  assert.equal(
    archiveDestFor({ ...base, tipo: "architecture", e: { publishedAs: "CORE/loja/checkout/decisions/architecture-v1.md" } }),
    "CORE/loja/checkout/archive/architecture-v1.md"
  );
  assert.equal(
    archiveDestFor({ ...base, tipo: "history", e: { publishedAs: "CORE/loja/history/229/ferramentas/saidas/E8.txt" } }),
    "CORE/loja/checkout/archive/229/ferramentas/saidas/E8.txt"
  );
  // sem publishedAs: o cálculo de sempre (documentos de docs/jarvis)
  assert.equal(
    archiveDestFor({ ...base, tipo: "prd", e: { file: "prd-001.md" } }),
    "CORE/loja/checkout/archive/prd-001.md"
  );
  // history sem funcionalidade principal: erro claro
  assert.throws(
    () => archiveDestFor({ squad: "CORE", produto: "loja", tipo: "history", taskKey: "229", e: { publishedAs: "CORE/loja/history/229/a.md" } }),
    /Feature inválido/
  );
  // publishedAs fora de history/{taskKey}/
  assert.throws(
    () => archiveDestFor({ ...base, tipo: "history", e: { publishedAs: "CORE/loja/history/230/a.md" } }),
    /fora de history\/229\//
  );
});

test("sessionFolderOf: resolve $SESSIONS_DIR/eng/{card em minúsculas}; recusa taskKey inválido (#229)", () => {
  assert.equal(sessionFolderOf({ SESSIONS_DIR: ".jarvis/sessions" }, "/ws", "TASK-123"), "/ws/.jarvis/sessions/eng/task-123");
  assert.equal(sessionFolderOf({}, "/ws", "229"), "/ws/.jarvis/sessions/eng/229", "padrão sem SESSIONS_DIR");
  assert.equal(sessionFolderOf({ SESSIONS_DIR: "$DOCS/s", DOCS: "d" }, "/ws", "1"), "/ws/d/s/eng/1", "expande $VAR");
  for (const bad of ["../230", "a/b", "", "#229"]) {
    assert.throws(() => sessionFolderOf({}, "/ws", bad), /inválido/, bad);
  }
});

test("isAllowedOriginal: aceita a pasta do próprio card; recusa outro card, .., fora de fromSession e o resto do disco (#229)", () => {
  const env = {};
  const folders = ["/ws/docs/jarvis/product", "/ws/docs/jarvis/engineering", "/ws/docs/jarvis/discoveries"];
  const e = { fromSession: true, taskKey: "229" };
  const ok = (entry, p) => isAllowedOriginal(entry, p, folders, env, "/ws");
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/229/architecture.md"), true);
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/229/ferramentas/saidas/x.txt"), true);
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/230/architecture.md"), false, "sessão de outro card");
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/229"), false, "a própria pasta não");
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/229/../230/a.md"), false, "com ..");
  assert.equal(ok(e, "/ws/.jarvis/sessions/eng/229x/a.md"), false, "prefixo parecido");
  assert.equal(ok(e, "/ws/jarvis-framework/package.json"), false, "código do projeto");
  assert.equal(ok({ taskKey: "229" }, "/ws/.jarvis/sessions/eng/229/a.md"), false, "sem fromSession");
  assert.equal(ok({ fromSession: true }, "/ws/.jarvis/sessions/eng/229/a.md"), false, "sem taskKey");
  assert.equal(ok({ fromSession: true, taskKey: "../x" }, "/ws/.jarvis/x/a.md"), false, "taskKey inválido");
  // o que já valia: documento de trabalho de docs/jarvis
  assert.equal(ok({}, "/ws/docs/jarvis/product/prd.md"), true);
});

test("verifyPublishedCopy: com .git exige a cópia no HEAD e igual à publicada (#229, rodada 3)", () => {
  const dir = tmp();
  const g = (...a) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: dir, stdio: "ignore" });
  try {
    g("init", "-q");
    const rel = "CORE/loja com espaço/checkout/decisions/architecture.md";
    write(join(dir, rel), "# A\n");
    const e = { publishedAs: rel, publishedHash: sha("# A\n") };
    g("add", "-A");
    assert.match(verifyPublishedCopy(dir, e), /não está commitada/, "staged mas sem commit");
    g("commit", "-qm", "v1");
    assert.equal(verifyPublishedCopy(dir, e), null, "commitada e igual");
    write(join(dir, rel), "# B\n");
    g("add", "-A");
    assert.match(verifyPublishedCopy(dir, { ...e, publishedHash: sha("# B\n") }), /difere da publicada/, "HEAD tem o conteúdo antigo");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyPublishedCopy: com core.autocrlf o conteúdo do HEAD é comparado na forma da pasta de trabalho (#229, rodada 4)", () => {
  const dir = tmp();
  const g = (...a) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: dir, stdio: "ignore" });
  try {
    g("init", "-q");
    g("config", "core.autocrlf", "true");
    const rel = "CORE/loja/checkout/decisions/architecture.md";
    write(join(dir, rel), "# A\r\ntexto\r\n");
    g("add", "-A");
    g("commit", "-qm", "v1");
    const e = { publishedAs: rel, publishedHash: sha("# A\r\ntexto\r\n") };
    assert.equal(verifyPublishedCopy(dir, e), null, "antes: 'difere da publicada' para sempre (o blob do HEAD está em LF)");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyPublishedCopy: exige a cópia publicada, íntegra (Q11 da #229)", () => {
  const dir = tmp();
  try {
    write(join(dir, "CORE/loja/checkout/decisions/architecture.md"), "# A\n");
    const e = { publishedAs: "CORE/loja/checkout/decisions/architecture.md", publishedHash: sha("# A\n") };
    assert.equal(verifyPublishedCopy(dir, e), null);
    assert.match(verifyPublishedCopy(dir, { ...e, publishedHash: sha("outro") }), /não bate o hash/);
    assert.match(verifyPublishedCopy(dir, { ...e, publishedAs: "CORE/loja/sumiu.md" }), /não encontrada/);
    assert.match(verifyPublishedCopy(dir, { tipo: "plan" }), /sem publishedAs/);
    assert.match(verifyPublishedCopy(undefined, e), /desconhecida/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sessão: publicar → arquivar → finalizar apaga só o que está na pasta do card e foi arquivado (#229)", () => {
  const { dir, ws, root, sessao, env, entry } = sessionFixture();
  try {
    const entries = [
      entry("architecture", "architecture.md", { publishedAs: "CORE/loja/checkout/decisions/architecture.md" }),
      entry("history", "ferramentas/saida.txt", { publishedAs: "CORE/loja/history/229/ferramentas/saida.txt" }),
    ];
    // a publicação já copiou os arquivos para o Central docs
    write(join(root, entries[0].publishedAs), "# Arquitetura\n");
    write(join(root, entries[1].publishedAs), "ok\n");

    const arch = archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    assert.equal(arch.errors.length, 0);
    assert.deepEqual(
      entries.map((e) => e.archiveDestPath),
      ["CORE/loja/checkout/archive/architecture.md", "CORE/loja/checkout/archive/229/ferramentas/saida.txt"]
    );
    assert.ok(existsSync(join(sessao, "architecture.md")), "arquivar não apaga");

    const fin = finalizeEntries({ entries, env, root, squad: "CORE", produto: "loja", workspaceRoot: ws });
    assert.equal(fin.errors.length, 0);
    assert.equal(fin.finalized.length, 2);
    assert.equal(existsSync(join(sessao, "architecture.md")), false);
    assert.equal(existsSync(join(sessao, "ferramentas/saida.txt")), false);
    assert.ok(existsSync(join(sessao, "plan.md")), "o que não estava no manifesto fica");
    assert.ok(existsSync(join(root, "CORE/loja/checkout/archive/architecture.md")), "a cópia arquivada permanece");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sessão: finalize recusa arquivo de outro card, fora da sessão ou com taskKey de outro (#229)", () => {
  const { dir, ws, root, env, entry } = sessionFixture();
  try {
    const outra = join(ws, ".jarvis/sessions/eng/230/architecture.md");
    const codigo = join(ws, "jarvis-framework/package.json");
    write(outra, "# Outra\n");
    write(codigo, "{}\n");
    let n = 0;
    const mk = (originalPath, extra = {}) =>
      entry("architecture", "architecture.md", { originalPath, publishedAs: `CORE/loja/checkout/decisions/x${++n}.md`, ...extra });
    const entries = [mk(outra), mk(codigo), mk(join(ws, ".jarvis/sessions/eng/229/../230/architecture.md"))];
    archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    const fin = finalizeEntries({ entries, env, root, squad: "CORE", produto: "loja", workspaceRoot: ws });
    assert.equal(fin.finalized.length, 0);
    assert.equal(fin.errors.length, 3);
    assert.ok(fin.errors.every((m) => /fora das pastas de documentos de trabalho/.test(m)));
    assert.ok(existsSync(outra) && existsSync(codigo), "nada foi apagado");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sessão: --force apaga só com a cópia publicada íntegra; ausente ou adulterada, o arquivo fica (#229)", () => {
  const { dir, ws, root, sessao, env, entry } = sessionFixture();
  try {
    const ok = entry("architecture", "architecture.md", {
      publishedAs: "CORE/loja/checkout/decisions/architecture.md",
      publishedHash: sha("# Arquitetura\n"),
    });
    const adulterada = entry("plan", "plan.md", {
      publishedAs: "CORE/loja/checkout/decisions/plan.md",
      publishedHash: sha("# Plano\n"),
    });
    const ausente = entry("history", "ferramentas/saida.txt", {
      publishedAs: "CORE/loja/history/229/ferramentas/saida.txt",
      publishedHash: sha("ok\n"),
    });
    write(join(root, ok.publishedAs), "# Arquitetura\n");
    write(join(root, adulterada.publishedAs), "# Plano EDITADO\n"); // não bate o hash publicado
    // `ausente` não foi copiado para o Central docs

    const r = forceFinalize({ entries: [ok, adulterada, ausente], squad: "CORE", produto: "loja", env, workspaceRoot: ws, root });
    assert.deepEqual(r.finalized.map((e) => e.tipo), ["architecture"]);
    assert.equal(existsSync(join(sessao, "architecture.md")), false, "íntegra: apagado");
    assert.ok(existsSync(join(sessao, "plan.md")), "adulterada: fica");
    assert.ok(existsSync(join(sessao, "ferramentas/saida.txt")), "ausente: fica");
    assert.equal(r.errors.length, 2);
    assert.match(r.errors.join("\n"), /não bate o hash/);
    assert.match(r.errors.join("\n"), /não encontrada/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sessão: --force sem a pasta do Central docs (root) não apaga arquivo de sessão (#229)", () => {
  const { dir, ws, sessao, env, entry } = sessionFixture();
  try {
    const e = entry("architecture", "architecture.md", { publishedAs: "CORE/loja/checkout/decisions/architecture.md", publishedHash: sha("x") });
    const r = forceFinalize({ entries: [e], squad: "CORE", produto: "loja", env, workspaceRoot: ws });
    assert.equal(r.finalized.length, 0);
    assert.ok(existsSync(join(sessao, "architecture.md")));
    assert.match(r.errors[0], /desconhecida/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sessão: documento de docs/jarvis continua sem a conferência da cópia no --force (comportamento da #220) (#229)", () => {
  const dir = tmp();
  try {
    const ws = join(dir, "ws");
    const original = join(ws, "docs/jarvis/product/prd-001.md");
    write(original, "---\nid: PRD-001\n---\n");
    const r = forceFinalize({
      entries: [{ tipo: "prd", feature: "checkout", originalPath: original, file: "prd-001.md" }],
      squad: "CORE",
      produto: "loja",
      env: { DOCS_FOLDER: "docs", JARVIS_DOCS: "$DOCS_FOLDER/jarvis" },
      workspaceRoot: ws,
      root: join(dir, "cd"),
    });
    assert.equal(r.finalized.length, 1);
    assert.equal(existsSync(original), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalize: documento quebrado em partes (várias entradas, mesmo original) é apagado uma vez e todas contam como finalizadas (#229)", () => {
  const { dir, ws, root, sessao, env, entry } = sessionFixture();
  try {
    const entries = [
      entry("plan", "plan.md", { publishedAs: "CORE/loja/checkout/decisions/plan-229-checkout.md" }),
      entry("plan", "plan.md", { feature: "frete", publishedAs: "CORE/loja/frete/decisions/plan-229-frete.md" }),
    ];
    const arch = archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    assert.equal(arch.errors.length, 0);
    assert.deepEqual(entries.map((e) => e.archiveDestPath), [
      "CORE/loja/checkout/archive/plan-229-checkout.md",
      "CORE/loja/frete/archive/plan-229-frete.md",
    ]);
    const fin = finalizeEntries({ entries, env, root, squad: "CORE", produto: "loja", workspaceRoot: ws });
    assert.deepEqual(fin.errors, [], "a segunda parte não dá erro por o original já ter sido removido");
    assert.equal(fin.finalized.length, 2);
    assert.equal(existsSync(join(sessao, "plan.md")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("finalize: anexo binário e arquivo que não é .md são arquivados byte a byte e finalizados (#229)", () => {
  const { dir, ws, root, sessao, env, entry } = sessionFixture();
  try {
    const bin = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe, 0x00, 0x80, 0xc3, 0x28]); // não é UTF-8 válido
    writeFileSync(join(sessao, "img.png"), bin);
    // um .txt que começa com "---" não pode receber os campos origin/original_status
    write(join(sessao, "ferramentas/saida.txt"), "---\nlinha de saída\n");
    const entries = [
      entry("history", "img.png", { publishedAs: "CORE/loja/history/229/img.png" }),
      entry("history", "ferramentas/saida.txt", { publishedAs: "CORE/loja/history/229/ferramentas/saida.txt" }),
    ];
    const arch = archiveEntries({ root, squad: "CORE", produto: "loja", entries });
    assert.deepEqual(arch.errors, []);
    assert.deepEqual(readFileSync(join(root, entries[0].archiveDestPath)), bin, "a cópia arquivada é idêntica ao original");
    assert.equal(readFileSync(join(root, entries[1].archiveDestPath), "utf-8"), "---\nlinha de saída\n", "sem campos injetados fora de .md");

    const fin = finalizeEntries({ entries, env, root, squad: "CORE", produto: "loja", workspaceRoot: ws });
    assert.deepEqual(fin.changed, [], "antes: 'cópia em archive/ não bate o hash'");
    assert.deepEqual(fin.errors, []);
    assert.equal(fin.finalized.length, 2);
    assert.equal(existsSync(join(sessao, "img.png")), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("archiveDestFor: o card em maiúsculas (TASK-123) usa o history/ e o archive/ em minúsculas (#229)", () => {
  assert.equal(
    archiveDestFor({
      tipo: "history",
      squad: "CORE",
      produto: "loja",
      feature: "checkout",
      taskKey: "TASK-123",
      e: { publishedAs: "CORE/loja/history/task-123/ferramentas/a.txt" },
    }),
    "CORE/loja/checkout/archive/task-123/ferramentas/a.txt"
  );
});
