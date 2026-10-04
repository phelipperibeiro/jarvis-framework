// Confere que docs/comandos.md e os guias em docs/engenharia/ e docs/produto/
// acompanham os workflows em workflows/. Rode com: npm run test:comandos
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph, findBrokenReferences } from '../bin/lib/flow-map/tree.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const abs = (...p) => join(root, ...p);

// Workflows de produto sem guia didático por decisão (não é erro).
const SEM_GUIA_PRODUTO = new Set(['prod.roadmap.preview']);

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const workflows = [
  ...walk(abs('workflows', 'engineering')),
  ...walk(abs('workflows', 'product')),
]
  .map((f) => basename(f, '.md'))
  .filter((n) => /^(eng|prod)\./.test(n));

const comandosMd = readFileSync(abs('docs', 'comandos.md'), 'utf8');
const listados = new Set([...comandosMd.matchAll(/^\| \[?`\/((?:eng|prod)\.[a-z0-9.\-]+)`/gm)].map((m) => m[1]));

const erros = [];

for (const w of workflows) {
  if (!listados.has(w)) erros.push(`docs/comandos.md não lista /${w}`);
  const pasta = w.startsWith('eng.') ? 'engenharia' : 'produto';
  if (pasta === 'produto' && SEM_GUIA_PRODUTO.has(w)) continue;
  if (!existsSync(abs('docs', pasta, `${w}.md`))) erros.push(`falta o guia docs/${pasta}/${w}.md`);
}

for (const l of listados) {
  if (!workflows.includes(l)) erros.push(`docs/comandos.md lista /${l}, mas não existe workflow com esse nome`);
}

const paginas = [
  abs('docs', 'comandos.md'),
  ...readdirSync(abs('docs', 'engenharia')).map((n) => abs('docs', 'engenharia', n)),
];
for (const f of paginas) {
  const texto = readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/\]\((\.{1,2}\/[^)#\s]+)(?:#[^)]*)?\)/g)) {
    const destino = normalize(join(dirname(f), m[1]));
    if (!existsSync(destino)) erros.push(`link quebrado em ${f.replace(root + '/', '')}: ${m[1]}`);
  }
}

// Nomes citados nas tabelas de chamadas (workflows, skills e agentes) precisam existir.
const { errors: referencias, warnings: avisos } = findBrokenReferences(buildGraph(root));
for (const r of referencias) erros.push(`${r.file}: cita "${r.name}", que ${r.reason}`);
for (const a of avisos) console.warn(`  aviso: ${a.file}: "${a.name}" (${a.reason})`);

if (erros.length) {
  console.error(`✗ ${erros.length} problema(s) nos guias de comandos:\n`);
  for (const e of erros) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ ${workflows.length} comandos: lista, guias e links conferem`);
