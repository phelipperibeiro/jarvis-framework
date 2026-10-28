// Confere os nomes soltos de skill, workflow e agente citados entre crases na prosa do framework (#191):
// um nome que não existe mais (skill, workflow ou agente apagado) acusa. O test:comandos já confere as
// tabelas padronizadas de chamadas; este teste cobre o texto fora delas.
// Limites, de propósito: confere só as pastas que a #191 definiu (docs/ e os .md da raiz ficam de fora);
// skill citada sem a barra (`eng-backend`) é texto, não chamada; nome de arquivo (`eng.x-rules.md`) não
// é artefato; caminhos `$IDE/skills/x/SKILL.md` são conferidos pelo framework-refs.test.js.
// Rode com: npm run test:filtro
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph } from "../bin/lib/flow-map/tree.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// A mensagem de falha diz o que fazer: corrigir o nome, ou o teste, se o nome for um exemplo.
const DE_PROPOSITO =
  "Nome solto de skill, workflow ou agente que não existe (#191): corrija a referência; se for exemplo, use um placeholder ({nome}) ou tire a barra.";

// Pastas conferidas e arquivos que listam, por definição, skills que não existem (planejadas ou apagadas).
const PASTAS = ["workflows", "rules", "rules-on-demand", "agents", "skills", "templates"];
const FORA = new Set(["skills/SKILLS-ROADMAP.md", "skills/security-skills-deleted.md"]);

// Dirent.isDirectory() não segue link simbólico, então um link quebrado ou circular não derruba a varredura.
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return walk(caminho);
    return entrada.isFile() && caminho.endsWith(".md") ? [caminho] : [];
  });
}

// Blocos de código (inclusive recuados) trazem exemplos; o fechamento é uma linha só com as mesmas crases.
// Mesma regra do framework-refs.test.js, mas o bloco vira linhas em branco, para o número de linha da falha
// continuar certo.
const withoutCode = (text) =>
  text.replace(/^[ \t]*(`{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, (bloco) =>
    bloco.replace(/[^\n]/g, "")
  );

// Placeholders de exemplo: {nome}, *, …, <x>, xxx e nome-da-skill (mesma ideia do framework-refs.test.js).
const ehPlaceholder = (trecho, nome) =>
  /[{}*…<>]/.test(trecho) || /(^|[-_.])x{3}([-_.]|$)/i.test(nome) || /nome-d[aoe]-/i.test(nome);

// Arquivos citados pelo nome (eng.pre-pr-rules.md, eng.work-rules, architecture-template), não artefatos.
const EH_ARQUIVO = /(-rules|-template)$|\.(md|js|json|mjs|ya?ml)$/;

// Entre crases: skill só com a barra (/eng-x, /jarvis-x, /prod-x, /product-x); workflow ou agente como eng.x ou
// prod.x, com ou sem a barra. O nome é a primeira palavra (/eng.spec-consolidate --inicial → eng.spec-consolidate).
const CITACAO = /`(\/)?((?:eng|jarvis|prod|product)[-.][A-Za-z0-9][A-Za-z0-9._-]*)(?:\s[^`]*)?`/g;

/**
 * Nomes soltos que não existem no índice de workflows, skills e agentes (buildGraph).
 * @param {string} base - Raiz do framework (ou de uma fixture com a mesma estrutura)
 * @returns {{ conferidas: number, acusados: string[] }}
 */
function nomesSoltos(base) {
  const { items } = buildGraph(base);
  const acusados = [];
  let conferidas = 0;
  for (const pasta of PASTAS) {
    let arquivos;
    try {
      arquivos = walk(join(base, pasta));
    } catch {
      continue; // fixture sem a pasta
    }
    for (const arquivo of arquivos) {
      const nomeArquivo = relative(base, arquivo).split(sep).join("/");
      if (FORA.has(nomeArquivo)) continue;
      withoutCode(readFileSync(arquivo, "utf8"))
        .split("\n")
        .forEach((linha, i) => {
          for (const m of linha.matchAll(CITACAO)) {
            const nome = m[2].replace(/\.+$/, "");
            if (ehPlaceholder(m[0], nome) || EH_ARQUIVO.test(nome)) continue;
            const ehWorkflowOuAgente = /^(eng|prod)\./.test(nome);
            if (!ehWorkflowOuAgente && !m[1]) continue; // skill sem a barra: texto, não chamada
            conferidas++;
            if (!items.has(nome)) acusados.push(`${nomeArquivo}:${i + 1}: ${m[0]}`);
          }
        });
    }
  }
  return { conferidas, acusados };
}

test("todo nome solto de skill, workflow ou agente citado no framework existe", () => {
  const { conferidas, acusados } = nomesSoltos(root);
  assert.ok(
    conferidas > 100,
    `o teste conferiu só ${conferidas} citações; o padrão de busca quebrou?`
  );
  assert.deepEqual(acusados, [], `nomes que não existem:\n${acusados.join("\n")}\n${DE_PROPOSITO}`);
});

// Fixture mínima com a estrutura do framework: prova o que o teste acusa e o que ele deixa passar.
const fixture = mkdtempSync(join(tmpdir(), "jarvis-nomes-"));
after(() => rmSync(fixture, { recursive: true, force: true }));
function grava(caminho, texto) {
  mkdirSync(dirname(join(fixture, caminho)), { recursive: true });
  writeFileSync(join(fixture, caminho), texto);
}

test("o teste acusa nome inexistente e ignora exemplos, arquivos e skills sem barra (fixture)", () => {
  grava("skills/eng-backend/SKILL.md", "---\nname: eng-backend\n---\n");
  grava("workflows/engineering/eng.start.md", "# start\n");
  grava("agents/engineering/eng.agent.md", "# agente\n");
  grava(
    "workflows/engineering/eng.plan.md",
    [
      "Existem: `/eng-backend`, `eng.start`, `/eng.start 123`, `eng.agent`.", // não acusa
      "Não existem: `/eng-inexistente` e `eng.fantasma`.", // acusa os dois
      "Exemplos: `/eng-{nome}`, `eng.*`, `/eng-nome-da-skill`.", // placeholders
      "Arquivos: `eng.start-rules.md`, `eng.plan-rules`, `eng.x-template`.", // não são artefatos
      "Termo, não skill: `product-led`, `eng-database`.", // sem barra
      "```",
      "`/eng-dentro-do-bloco`",
      "```",
      "Depois do bloco: `/eng-depois`.", // acusa, na linha certa (9)
    ].join("\n")
  );
  grava("skills/SKILLS-ROADMAP.md", "Planejada: `/eng-planejada`.\n"); // arquivo fora da varredura
  const { acusados } = nomesSoltos(fixture);
  assert.deepEqual(acusados, [
    "workflows/engineering/eng.plan.md:2: `/eng-inexistente`",
    "workflows/engineering/eng.plan.md:2: `eng.fantasma`",
    "workflows/engineering/eng.plan.md:9: `/eng-depois`",
  ]);
});
