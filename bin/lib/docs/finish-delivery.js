/**
 * @fileoverview Arquivar e finalizar uma entrega consolidada no Central docs (#220, Q3/Q5/Q13/
 * Q14/Q15). Depois de publicar (`jarvis docs publish --manifest`), dois passos, cada um numa
 * execução própria do `/eng.spec-consolidate` (`--archive`, `--finalize`):
 *
 * - **Arquivar** (`archiveEntries`): copia o original de cada documento de trabalho publicado
 *   em `decisions/` para `archive/` da mesma funcionalidade, sem apagar nada; grava o hash do
 *   original no momento do arquivamento (Q13).
 * - **Finalizar** (`finalizeEntries`): confere se o original mudou desde o `--archive` (hash);
 *   se mudou, avisa e **não** apaga aquele item (Q13). Reescreve, nos documentos de trabalho
 *   restantes, os `related_*` que apontavam para o original (best effort — o que não resolver
 *   entra no relatório, Q14) e só então apaga o original.
 *
 * Só os documentos de trabalho (PRD, FRD, épico, história, tarefa, ARD, RFC, SPEC, discovery…)
 * têm "original" fora do Central docs. `feature`, `delivery`, `product`, `home` e `history` não
 * passam por aqui: não existe outro lugar de onde arquivá-los ou apagá-los.
 * @module docs/finish-delivery
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, isAbsolute } from "node:path";
import { assertRelPath, assertSegment, resolveDestPath } from "./publish-file.js";
import { expandEnv, docsFolders } from "../core/docs-migrate.js";
import { parseFrontmatter } from "../utils/frontmatter.js";

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Caminho do arquivo tal como foi publicado: `e.localFile` (entradas pós-`readManifest`, usadas
 * por `forceFinalize`, chamado no mesmo processo do `publish --manifest`) ou `e.file` (entradas
 * cruas do manifesto em disco, lidas de novo por `archiveEntries`/`finalizeEntries`). Nunca o
 * `e.originalPath`: o nome publicado pode diferir do nome local (#220 item 2 — documento
 * quebrado por funcionalidade, Q9).
 */
function publishedFileRef(e) {
  return e.localFile ?? e.file ?? e.originalPath;
}

/** Nome do arquivo a usar no destino: o publicado, não o do original (#220 item 2). */
function publishedBasename(e) {
  return basename(publishedFileRef(e));
}

function destFor({ tipo, squad, produto, feature, taskKey, e }) {
  return resolveDestPath({
    tipo,
    squad,
    produto,
    feature,
    taskKey,
    localFile: publishedFileRef(e),
  }).destPath;
}

/**
 * Monta o caminho em `archive/` pelos mesmos componentes validados de `resolveDestPath`
 * (squad/produto/feature/nome do arquivo), em vez de trocar `/decisions/` por `/archive/`
 * no `destPath` já pronto (rodada 2, N8): a troca de texto dava errado se squad, produto
 * ou feature fosse, por coincidência, literalmente "decisions".
 */
export function archiveDestFor({ tipo, squad, produto, feature, taskKey, e }) {
  // Entrada com o nome efetivo publicado (`publishedAs`, gravado pelo `publish --manifest`, #229):
  // o arquivo em `archive/` segue esse nome (inclusive um `-vN`). Os arquivos de `history`
  // preservam o caminho relativo sob `archive/{taskKey}/`, para não colidir nomes de subpastas.
  if (e.publishedAs) {
    assertSegment("Feature", feature ?? "");
    if (tipo === "history") {
      assertSegment("Task key", taskKey ?? "");
      const prefix = `${squad}/${produto}/history/${taskKey}/`;
      if (!e.publishedAs.startsWith(prefix)) {
        throw new Error(`publishedAs fora de history/${taskKey}/: ${e.publishedAs}`);
      }
      const rel = e.publishedAs.slice(prefix.length);
      assertRelPath("Caminho relativo", rel);
      return `${squad}/${produto}/${feature}/archive/${taskKey}/${rel}`;
    }
    return `${squad}/${produto}/${feature}/archive/${basename(e.publishedAs)}`;
  }
  const { fileName } = resolveDestPath({
    tipo,
    squad,
    produto,
    feature,
    taskKey,
    localFile: publishedFileRef(e),
  });
  return `${squad}/${produto}/${feature}/archive/${fileName}`;
}

/**
 * Insere campos no bloco de frontmatter de um arquivo já copiado (depois do `---` de abertura).
 * Só usado em campos reconhecidos, mas não exigidos (`origin`, `original_status`, Q14 da #220):
 * não falha se o arquivo não tiver frontmatter (fica como está).
 * @param {string} path
 * @param {Record<string, string>} fields - Omite a chave cujo valor for vazio/undefined
 */
function injectFrontmatterFields(path, fields) {
  const content = readFileSync(path, "utf-8");
  const lines = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`);
  if (lines.length === 0 || !content.startsWith("---")) return;
  const next = content.replace(/^---\s*\n/, (opening) => `${opening}${lines.join("\n")}\n`);
  writeFileSync(path, next);
}

/**
 * Desfaz `injectFrontmatterFields`: tira as linhas `origin:`/`original_status:` logo depois
 * do `---` de abertura, para hashear a cópia em `archive/` como se nunca tivessem sido
 * acrescentadas (rodada 2, N5) — sem isso, o hash da cópia nunca bate o do original puro.
 * @param {string} content
 * @returns {string}
 */
function stripInjectedFields(content) {
  const lines = content.split("\n");
  if (lines[0] !== "---") return content;
  let i = 1;
  while (i < lines.length && /^(origin|original_status):/.test(lines[i])) i++;
  return [lines[0], ...lines.slice(i)].join("\n");
}

/**
 * Resolve, com `$VAR` expandido (#220 item 2), as três pastas onde um documento de trabalho
 * "original" pode estar. Reaproveita `docsFolders` de `core/docs-migrate.js` (rodada 2, N7):
 * duas regras para as mesmas pastas (com normalização diferente de `./`/`/` nas pontas)
 * podiam divergir com o tempo.
 * @param {Record<string, string>} env
 * @returns {string[]} caminhos (relativos ou absolutos, como vierem do ENV.md)
 */
function resolveDocsFolders(env) {
  const expanded = expandEnv(new Map(Object.entries(env || {})));
  const { prod, eng, discoveries } = docsFolders(expanded);
  return [prod, eng, discoveries];
}

/**
 * Confere se `absPath` está dentro de uma das pastas de documentos de trabalho (#220 item 2,
 * gate de código): trava o `unlinkSync` de `finalizeEntries`/`forceFinalize` para não apagar
 * um caminho qualquer que um manifesto editado ou gerado com erro tenha colocado em `originalPath`.
 * @param {string} absPath
 * @param {string[]} folders - De `resolveDocsFolders`; relativas são resolvidas a partir de `workspaceRoot`
 * @param {string} [workspaceRoot] - A pasta do workspace (`openStorageFromEnv(...).root`), não o
 *   cwd do processo: o comando pode ser chamado de uma subpasta do workspace
 * @returns {boolean}
 */
function isWithinDocsFolders(absPath, folders, workspaceRoot = process.cwd()) {
  return folders.some((folder) => {
    const folderAbs = isAbsolute(folder) ? folder : resolve(workspaceRoot, folder);
    const rel = relative(folderAbs, absPath);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
  });
}

/**
 * Pasta da sessão de um card: `$SESSIONS_DIR/eng/{taskKey em minúsculas}` (padrão
 * `.jarvis/sessions`), resolvida a partir da pasta do workspace (#229, Q2).
 * @param {Record<string, string>} env - `loadEnv` (variáveis cruas)
 * @param {string} workspaceRoot
 * @param {string} taskKey - Validada por `assertSegment`
 * @returns {string} caminho absoluto
 * @throws {Error} `taskKey` inválido
 */
export function sessionFolderOf(env, workspaceRoot, taskKey) {
  assertSegment("Task key", String(taskKey ?? ""));
  const expanded = expandEnv(new Map(Object.entries(env || {})));
  const sessions = expanded.get("SESSIONS_DIR") || ".jarvis/sessions";
  return resolve(workspaceRoot || process.cwd(), sessions, "eng", String(taskKey).toLowerCase());
}

/**
 * Pode apagar este original? Dentro das pastas de documentos de trabalho (como sempre) **ou**,
 * para uma entrada de sessão (`fromSession`), dentro da pasta da sessão do **próprio card**
 * (`taskKey`) e de mais nenhuma outra (#229, Q2). Um caminho com `..` ou da sessão de outro card
 * é recusado, porque o caminho é resolvido antes da comparação.
 * @param {Object} e - Entrada do manifesto
 * @param {string} absPath - `originalPath` já resolvido
 * @param {string[]} folders - De `resolveDocsFolders`
 * @param {Record<string, string>} env
 * @param {string} [workspaceRoot]
 * @returns {boolean}
 */
export function isAllowedOriginal(e, absPath, folders, env, workspaceRoot) {
  if (isWithinDocsFolders(absPath, folders, workspaceRoot)) return true;
  if (!e.fromSession || !e.taskKey) return false;
  try {
    return isInside(absPath, sessionFolderOf(env, workspaceRoot, e.taskKey));
  } catch {
    return false;
  }
}

/** `absPath` está dentro de `dir` (e não é o próprio `dir`)? */
function isInside(absPath, dir) {
  const rel = relative(dir, absPath);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/**
 * Antes de o `--force` apagar um arquivo de sessão (Q11): a cópia publicada existe no Central docs
 * e bate o hash do que foi publicado? Sem isso, a sessão seria a única cópia e o arquivo não é
 * apagado. Com o Central docs em git, a cópia só aparece na pasta depois que o PR da publicação é
 * mesclado e a pasta atualizada: antes disso, o arquivo fica na sessão (é o desejado).
 * @param {string|undefined} root - Pasta do Central docs
 * @param {Object} e - Entrada do manifesto (`publishedAs`, `publishedHash`)
 * @returns {string|null} motivo da recusa, ou `null` se está íntegra
 */
export function verifyPublishedCopy(root, e) {
  if (!root) return "cópia publicada não conferida (pasta do Central docs desconhecida)";
  if (!e.publishedAs || !e.publishedHash) return "sem publishedAs/publishedHash no manifesto";
  const copy = join(root, e.publishedAs);
  if (!existsSync(copy)) {
    return `cópia publicada não encontrada em ${e.publishedAs} (com Central docs em git, mescle o PR e atualize a pasta antes)`;
  }
  if (sha256(copy) !== e.publishedHash) return `cópia publicada em ${e.publishedAs} não bate o hash`;
  return null;
}

/**
 * Passo `--archive`: copia o original de cada entrada com `originalPath` para `archive/` da
 * funcionalidade (não move, não apaga). Preenche `entry.archiveDestPath` e `entry.archivedHash`
 * nas entradas arquivadas — quem chama grava essas duas no manifesto, para o `--finalize` ler.
 *
 * @param {Object} p
 * @param {string} p.root - Pasta do Central docs
 * @param {string} p.squad
 * @param {string} p.produto
 * @param {Array<Object>} p.entries - Entradas do manifesto (mutadas com `archiveDestPath`/`archivedHash`)
 * @returns {{ archived: Array, skipped: Array<{originalPath: string, reason: string}>, errors: string[] }}
 */
export function archiveEntries({ root, squad, produto, entries }) {
  const archived = [];
  const skipped = [];
  const errors = [];

  for (const e of entries) {
    if (!e.originalPath) continue; // feature/delivery/product/home/history: nada a arquivar

    if (!existsSync(e.originalPath)) {
      errors.push(`${e.originalPath}: não encontrado`);
      continue;
    }
    try {
      const archiveDestPath = archiveDestFor({
        tipo: e.tipo,
        squad,
        produto,
        feature: e.feature,
        taskKey: e.taskKey,
        e,
      });
      const dest = join(root, archiveDestPath);
      // Lido uma vez só: o hash é sempre o do conteúdo de fato copiado (#220 item 13), não de
      // uma releitura separada do original (que poderia já ter mudado entre as duas leituras).
      const buffer = readFileSync(e.originalPath);
      const currentHash = createHash("sha256").update(buffer).digest("hex");
      if (existsSync(dest)) {
        // Sem `archivedHash` registrado nesta entrada, não dá para saber se o arquivo em
        // `dest` é desta mesma entrada ou de outra origem: pula, por segurança (como sempre).
        // **Com** `archivedHash` e ele bater o hash atual, nada mudou: também pula. Só quando
        // `archivedHash` existe e o original mudou desde então é que sobrescreve e atualiza o
        // hash — rodar `--archive` de novo é como se atualiza, em vez de ficar pulado para
        // sempre e o `--finalize` nunca aceitar o item (#220 item 2).
        if (!e.archivedHash || e.archivedHash === currentHash) {
          skipped.push({ originalPath: e.originalPath, reason: "já arquivado" });
          continue;
        }
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buffer);
      const originalMeta = parseFrontmatter(buffer.toString("utf-8"));
      injectFrontmatterFields(dest, {
        origin: e.originalPath,
        original_status: originalMeta.status,
      });
      e.archiveDestPath = archiveDestPath;
      e.archivedHash = currentHash;
      archived.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { archived, skipped, errors };
}

/**
 * Lista `.md` recursivamente (igual a `docs-migrate.js`, cópia local para não acoplar os dois
 * módulos a um helper comum por um detalhe tão pequeno).
 */
function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(p));
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// INLINE_LIST_RE é testada antes de SCALAR_RE (#220, rodada 2 item 2, N2): o `\S+` de
// SCALAR_RE casa `[a.md]` inteiro (não tem espaço dentro), inclusive lista de um item só ou
// sem espaço depois da vírgula — sem a ordem certa, SCALAR_RE "ganha" e a lista nunca é vista.
const SCALAR_RE = /^(related_\w+:[ \t]*)(\S+)[ \t]*$/;
const INLINE_LIST_RE = /^(related_\w+:[ \t]*)([{[])([^\]}]*)([}\]])[ \t]*$/;
const BLOCK_KEY_RE = /^(related_\w+:)[ \t]*$/;
const BLOCK_ITEM_RE = /^([ \t]*-[ \t]*)(\S+)[ \t]*$/;

/** Tira aspas simples/duplas das pontas, se o valor estiver todo entre elas (#220, N2). */
function unquote(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/**
 * Troca, no texto de um documento, todo `related_*:` cujo valor seja o **basename** do arquivo
 * removido pelo caminho novo — nos três formatos que os templates de produto orientam para
 * múltiplos relacionados ("se forem vários, utilize sintaxe compatível com YAML", #220 item 3):
 * valor único na mesma linha, lista inline (`related_docs: {a.md, b.md}` ou `[a.md, b.md]`) e
 * lista em bloco (`related_docs:` seguido de linhas `  - a.md`).
 *
 * @param {string} text
 * @param {string} removedBasename
 * @param {string} newRef
 * @returns {{ text: string, changed: boolean }}
 */
export function rewriteRelatedInText(text, removedBasename, newRef) {
  const lines = text.split("\n");
  const out = [];
  let changed = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const inlineList = line.match(INLINE_LIST_RE);
    if (inlineList) {
      const [, prefix, opener, body, closer] = inlineList;
      let lineChanged = false;
      const items = body
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          if (basename(unquote(item)) === removedBasename) {
            lineChanged = true;
            return newRef;
          }
          return item;
        });
      if (lineChanged) {
        out.push(`${prefix}${opener}${items.join(", ")}${closer}`);
        changed = true;
      } else {
        out.push(line);
      }
      i++;
      continue;
    }

    const scalar = line.match(SCALAR_RE);
    if (scalar) {
      if (basename(unquote(scalar[2])) === removedBasename) {
        out.push(`${scalar[1]}${newRef}`);
        changed = true;
      } else {
        out.push(line);
      }
      i++;
      continue;
    }

    const blockKey = line.match(BLOCK_KEY_RE);
    if (blockKey) {
      out.push(line);
      i++;
      while (i < lines.length && BLOCK_ITEM_RE.test(lines[i])) {
        const [, prefix, value] = lines[i].match(BLOCK_ITEM_RE);
        if (basename(unquote(value)) === removedBasename) {
          out.push(`${prefix}${newRef}`);
          changed = true;
        } else {
          out.push(lines[i]);
        }
        i++;
      }
      continue;
    }

    out.push(line);
    i++;
  }

  return { text: out.join("\n"), changed };
}

/**
 * Nos documentos de trabalho restantes (`$PROD_DOCS`/`$ENG_DOCS`/`$DISCOVERIES_DOCS`), troca
 * todo `related_*:` que citava o arquivo removido pelo caminho dele no Central docs (texto,
 * como já é a convenção de `related_docs` — não é um link clicável: os dois lados podem estar
 * fora do workspace um do outro). Best effort (Q14): não tenta resolver citação em prosa, só o
 * campo de frontmatter.
 *
 * As três variáveis vêm do `env` **sem expandir** `$VAR` (`loadEnv` não expande, #220 item 2):
 * `expandEnv` resolve `$DOCS_FOLDER`, `$JARVIS_DOCS`, `$PROD_FOLDER_NAME`… antes de montar o
 * caminho, senão `existsSync("$JARVIS_DOCS/...")` dá falso e esta função nunca encontra nada
 * para reescrever, em silêncio.
 *
 * @param {Record<string, string>} env - `loadEnv` (objeto plano, variáveis cruas)
 * @param {string} removedBasename
 * @param {string} centralDocsDestPath
 * @param {string} [workspaceRoot] - A pasta do workspace (`openStorageFromEnv(...).root`), para
 *   resolver as três pastas quando vierem relativas; sem ele, usa o cwd do processo
 * @returns {string[]} arquivos alterados (absolutos)
 */
export function rewriteRelatedRefs(env, removedBasename, centralDocsDestPath, workspaceRoot) {
  const folders = resolveDocsFolders(env);

  const changed = [];
  for (const rawFolder of folders) {
    const folder = isAbsolute(rawFolder) ? rawFolder : resolve(workspaceRoot || process.cwd(), rawFolder);
    if (!existsSync(folder) || !statSync(folder).isDirectory()) continue;
    for (const fileAbs of listMarkdown(folder)) {
      const text = readFileSync(fileAbs, "utf-8");
      const next = rewriteRelatedInText(text, removedBasename, centralDocsDestPath);
      if (next.changed) {
        writeFileSync(fileAbs, next.text);
        changed.push(fileAbs);
      }
    }
  }
  return changed;
}

/**
 * `--force` (#220, Q15): publica e já apaga os originais, numa execução só, **sem** o passo
 * `--archive` — zero reversão. Mesmas travas que não dependem de pergunta (documento sem
 * vínculo não chega a ter `originalPath`; falha ao publicar nunca chama esta função); a única
 * coisa que falta, de propósito, é a cópia de segurança do `archive/`.
 *
 * @param {Object} p
 * @param {Array<Object>} p.entries - As mesmas do manifesto, já publicadas
 * @param {string} p.squad
 * @param {string} p.produto
 * @param {Record<string, string>} [p.env] - Para reescrever `related_*` (omitir = não reescreve); também usado para travar o `unlinkSync` dentro das pastas de documentos de trabalho (#220 item 2) e, para entradas de sessão, da pasta do próprio card (#229)
 * @param {string} [p.root] - Pasta do Central docs: para entradas de sessão, o `--force` só apaga
 *   depois de conferir a cópia publicada (existe e bate o hash, Q11 da #229)
 * @returns {{ finalized: Array, rewritten: string[], errors: string[] }}
 */
export function forceFinalize({ entries, squad, produto, env, workspaceRoot, root }) {
  const finalized = [];
  const rewritten = [];
  const errors = [];
  const folders = env ? resolveDocsFolders(env) : null;

  for (const e of entries) {
    if (!e.originalPath) continue; // feature/delivery/product/home/history: nada a apagar
    if (!existsSync(e.originalPath)) continue;
    if (folders && !isAllowedOriginal(e, resolve(e.originalPath), folders, env, workspaceRoot)) {
      errors.push(`${e.originalPath}: fora das pastas de documentos de trabalho, não apagado`);
      continue;
    }
    if (e.fromSession) {
      const motivo = verifyPublishedCopy(root, e);
      if (motivo) {
        errors.push(`${e.originalPath}: ${motivo}, não apagado`);
        continue;
      }
    }

    try {
      // O nome vem do arquivo publicado (`e.file`), não do original: #220 item 2 — no
      // `--force`, o destino em `decisions/` segue o que de fato foi copiado, não o nome
      // local, que pode diferir (ex.: documento quebrado por funcionalidade, Q9).
      // Arquivo de sessão não tem `related_*` a reescrever.
      if (env && !e.fromSession) {
        const destPath = destFor({ tipo: e.tipo, squad, produto, feature: e.feature, taskKey: e.taskKey, e });
        rewritten.push(...rewriteRelatedRefs(env, publishedBasename(e), destPath, workspaceRoot));
      }
      unlinkSync(e.originalPath);
      finalized.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { finalized, rewritten, errors };
}

/**
 * Passo `--finalize`: para cada entrada já arquivada (`archiveDestPath` presente), confere se
 * o original mudou desde o `--archive` (hash) e se a cópia em `archive/` de fato existe e bate
 * o hash gravado (#220 item 2 — sem isso, um manifesto editado à mão ou um `archive/` limpo por
 * fora levava a apagar a única cópia sem nenhuma checagem); se qualquer uma falhar, **não apaga**
 * (Q13). Reescreve as referências para `decisions/` (o mesmo destino do `--force`, não mais
 * `archive/` — #220 item 2, "finalize e --force reescreviam para destinos diferentes") e apaga
 * o original.
 *
 * @param {Object} p
 * @param {Array<Object>} p.entries - Entradas do manifesto (já com `archiveDestPath`/`archivedHash`)
 * @param {Record<string, string>} [p.env] - Para reescrever `related_*` (omitir = não reescreve); também trava o `unlinkSync` dentro das pastas de documentos de trabalho
 * @param {string} [p.root] - Pasta do Central docs, para conferir a cópia em `archive/` (omitir = pula a conferência de existência, mas o hash ainda é conferido)
 * @param {string} [p.squad]
 * @param {string} [p.produto]
 * @returns {{ finalized: Array, changed: Array<{originalPath: string, reason: string}>, rewritten: string[], errors: string[] }}
 */
export function finalizeEntries({ entries, env, root, squad, produto, workspaceRoot }) {
  const finalized = [];
  const changed = [];
  const rewritten = [];
  const errors = [];
  const folders = env ? resolveDocsFolders(env) : null;

  // Duas passadas (#220, rodada 2 item 2, N1): valida o hash de TODAS as entradas antes de
  // reescrever qualquer `related_*` ou apagar qualquer original. Numa passada só, reescrever o
  // original de uma entrada (porque outra a cita em `related_*`) mudava o hash dela bem na hora
  // em que o loop chegava nela, e ela saía como "original mudou desde o --archive" — um
  // documento comum (PRD citado pelo FRD) nunca terminava de ser finalizado.
  const eligible = [];
  for (const e of entries) {
    if (!e.originalPath || !e.archiveDestPath) continue;
    if (!existsSync(e.originalPath)) continue; // já finalizado antes; idempotente
    if (folders && !isAllowedOriginal(e, resolve(e.originalPath), folders, env, workspaceRoot)) {
      errors.push(`${e.originalPath}: fora das pastas de documentos de trabalho, não apagado`);
      continue;
    }

    if (!e.archivedHash) {
      changed.push({ originalPath: e.originalPath, reason: "sem hash do arquivamento" });
      continue;
    }
    if (root) {
      const archivedAbs = join(root, e.archiveDestPath);
      if (!existsSync(archivedAbs)) {
        changed.push({ originalPath: e.originalPath, reason: "cópia em archive/ não encontrada" });
        continue;
      }
      // Tira origin/original_status (injetados no --archive, Q14) antes de hashear, senão o
      // hash da cópia nunca bateria o do original puro (rodada 2, N5): confere que a cópia
      // não foi corrompida ou sobrescrita por fora, além da conferência do original abaixo.
      const archivedContent = stripInjectedFields(readFileSync(archivedAbs, "utf-8"));
      const archivedCopyHash = createHash("sha256").update(archivedContent).digest("hex");
      if (archivedCopyHash !== e.archivedHash) {
        changed.push({ originalPath: e.originalPath, reason: "cópia em archive/ não bate o hash" });
        continue;
      }
    }
    const currentHash = sha256(e.originalPath);
    if (currentHash !== e.archivedHash) {
      changed.push({ originalPath: e.originalPath, reason: "original mudou desde o --archive" });
      continue;
    }
    eligible.push(e);
  }

  for (const e of eligible) {
    try {
      // Um documento quebrado em partes (Q9) tem várias entradas com o mesmo original: a primeira
      // apaga, as outras já o encontram removido e contam como finalizadas (#229).
      if (!existsSync(e.originalPath)) {
        finalized.push(e);
        continue;
      }
      if (env && !e.fromSession) {
        const destPath = destFor({ tipo: e.tipo, squad, produto, feature: e.feature, taskKey: e.taskKey, e });
        rewritten.push(...rewriteRelatedRefs(env, publishedBasename(e), destPath, workspaceRoot));
      }
      unlinkSync(e.originalPath);
      finalized.push(e);
    } catch (err) {
      errors.push(`${e.originalPath}: ${err.message.split("\n")[0]}`);
    }
  }
  return { finalized, changed, rewritten, errors };
}
