# bin/ — CLI `jarvis`

Fonte do binário `jarvis` (instalado via `npm install -g jarvis-ai-framework`, entrypoint declarado em `package.json#bin`). Este README documenta a arquitetura para quem for adicionar, remover ou alterar um comando.

## Estrutura

```
bin/
├── jarvis.js                  # Entrypoint (shebang). ~10 linhas, não cresce.
├── postinstall.js             # Roda no `npm install` (sincroniza assets se já havia .{ide}/ no cwd)
├── commands/                  # Um arquivo por comando. Lógica pura, zero commander.
│   ├── init.js, list.js, info.js, whoami.js, ...
│   ├── docs-sync.js, docs-publish.js
│   └── qa-signoff.js, install-rtk.js, tokens.js, map.js
└── lib/
    ├── cli/
    │   ├── program.js         # Único lugar que monta o commander — ver "Arquitetura"
    │   └── shared-options.js  # .option() repetidos entre comandos (--ide, --quiet, etc.)
    ├── vcs/                   # Adapters de Git host (GitLab/GitHub/Bitbucket)
    │   ├── api.js             # Lógica HTTP real (createIssue, createMergeRequest, fetchRawFile)
    │   ├── create-merge.js, create-issue.js, fetch-raw.js   # função exportada + CLI direto (ver abaixo)
    ├── tasks/
    │   └── comment.js         # Adapter de task manager (jira/linear/github/asana) — mesmo padrão
    ├── config/                # ide-config.js (fonte de verdade de IDEs), constants.js
    ├── core/                  # scanner.js, sync-engine.js, profile-filter.js, token-report.js
    ├── docs/                  # central-docs: fetch/publish + validação de frontmatter
    │   ├── validate-frontmatter.js  # Valida/extrai frontmatter de PRD/FRD/ARD/RFC
    │   ├── redis-cache.js      # Cache best-effort via `redis-cli` (get/setex/del)
    │   ├── fetch-file.js       # fetchFile() — usado por `docs sync`/`docs fetch` e por publish-file.js
    │   └── publish-file.js     # publishFile() — usado por `docs publish`
    ├── utils/                 # logger.js, ui.js, paths.js, frontmatter.js, git-parser.js, npmrc-parser.js
    ├── flow-map/              # `jarvis map` — grafo de chamadas entre workflows/skills/agents
    ├── auth/                  # session.js (auth.json legado, hoje só `jarvis logout` o lê)
    └── env-loader.js          # Resolve e lê o ENV.md ($IDE/ENV.md)
```

## Arquitetura: 3 camadas, cada uma com uma responsabilidade

```
bin/jarvis.js              →  entrypoint: cria o program e faz parseAsync(argv)
  ↓
bin/lib/cli/program.js     →  ÚNICO lugar que sabe que existe commander
  ↓ (chama, já com o `flags` remontado)
bin/commands/*.js          →  lógica de negócio pura: async (flags) => {...}
```

**Por que separar assim?** `bin/commands/*.js` nunca importa `commander` nem sabe o que é um `Command`. Cada arquivo só recebe um objeto `flags` e faz o que precisa. Isso significa:
- Testar a lógica de um comando não exige simular argv/commander — chama a função direto com um objeto.
- Trocar de biblioteca de CLI um dia (se um dia fizer sentido) significa reescrever só `program.js`, não os 10 arquivos de comando.
- `program.js` é o **mapa completo** do CLI: para saber todo comando que existe, todas as flags que cada um aceita, é o único arquivo que precisa abrir.

## O adapter: commander → formato antigo de `flags`

O commander entrega ao `.action()` as opções em **camelCase** (`--env-file` → `options.envFile`, `--max-age` → `options.maxAge`) e cada positional como seu próprio parâmetro. As funções em `bin/commands/*.js` foram escritas para um objeto `flags` no formato que o parser manual antigo produzia: chaves com hífen literal (`flags["env-file"]`) e um array `flags._` para positionals.

Em vez de reescrever as 10 funções para o formato novo (risco maior, mexe em lógica que já funciona), `program.js` tem uma função `toLegacyFlags(options, extra)` que remonta o objeto no formato antigo antes de cada chamada:

```js
// bin/lib/cli/program.js
const whoamiCmd = cmd(program, "whoami").description("...");
withEnvOptions(withLogOptions(whoamiCmd)).action((options) => whoami(toLegacyFlags(options)));
```

`toLegacyFlags` remapeia só as duas chaves que mudam de formato (`envFile`→`"env-file"`, `maxAge`→`"max-age"`); todo o resto passa direto. O `extra` (segundo argumento) serve para injetar positionals como `_` ou flags sintéticas como `{ logout: true }` (usado por `jarvis logout`, que chama a mesma função de `whoami.js` com essa flag).

**Ao adicionar uma opção nova que usa hífen** (ex: `--body-file`), decida: se a função de `bin/commands/*.js` vai ler `flags["body-file"]` (formato antigo) ou se você vai atualizá-la para ler `options.bodyFile` direto. Os 4 comandos novos (`vcs create-merge`, `vcs create-issue`, etc.) já usam o segundo caminho — passam o objeto de opções do commander quase direto, sem o adapter — porque não têm lógica legada para preservar.

## O helper `cmd()` — por que todo comando passa por ele

```js
function cmd(parent, name) {
  return parent.command(name).allowUnknownOption().allowExcessArguments();
}
```

O parser manual antigo nunca validava nada: qualquer `--flag` era aceito e ignorado silenciosamente se o comando não o lesse. O commander, por padrão, dá erro em flag não declarada e em positional excedente. `allowUnknownOption()`/`allowExcessArguments()` replicam a permissividade antiga — mas **o commander não propaga essas duas configs do comando pai para os subcomandos**: setar só no `program` raiz não é suficiente (testado e confirmado durante a implementação). Por isso `cmd()` existe e **todo** comando — incluindo os aninhados (`docs sync`, `vcs create-merge`) — é criado com ele, nunca com `.command()` direto.

## Argumentos: `[opcional]`, não `<obrigatório>` — de propósito

Note que `info`, `vcs fetch-raw` e `tasks comment` declaram seus positionals como **opcionais** (`[target]`, `[file-path]`) mesmo sendo, na prática, obrigatórios para o comando funcionar. Isso é deliberado: se o commander validar "argumento obrigatório ausente" sozinho, ele intercepta **antes** da função rodar — e cada uma dessas funções já tem sua própria validação com mensagem de uso customizada e mais específica (`info.js`: `"❌ Uso incorreto\nUso: jarvis info <type/name>\nExemplo: ..."`). Deixar o positional opcional no commander e a validação dentro da função preserva essa mensagem.

**A mesma regra vale para `--flag` que já tem validação própria.** Nenhum comando aqui usa `.requiredOption()` ou `.choices()` do commander, mesmo quando faria sentido à primeira vista (ex: `--tipo` em `docs publish` só aceita `prd|frd|ard|rfc|swagger|qa-report`). `docsPublish.js` já valida isso e mostra um bloco de exemplos de uso bem mais rico que o que o commander mostraria. Usar `.choices()` ali faria o commander interceptar o valor errado com uma mensagem genérica, perdendo esse texto. **Ao adicionar uma opção nova**: se a função já vai validar o valor por dentro, deixe o commander permissivo (`.option()` simples) e confie na validação interna. Se não há validação nenhuma hoje, `.choices()`/`.argParser()` são bons lugares para adicionar uma — não há essa perda a proteger.

## `program.command()` vs `program.addCommand()`

Este código usa `.command(nome)` (que cria e já anexa o subcomando) em todo lugar — não `.addCommand(instanciaDeCommand)`. São equivalentes; `.addCommand()` só compensa quando o `Command` é montado em outro módulo e precisa ser importado antes de anexar. Como tudo mora em `program.js`, não há motivo para o nível extra de indireção.

## Os 4 "scripts standalone" (`vcs/*.js`, `tasks/comment.js`): dupla forma

`create-merge.js`, `create-issue.js`, `fetch-raw.js` e `comment.js` são chamados de duas formas:

1. **Como subcomando do CLI**: `jarvis vcs create-merge --source ... --target ...` (via `program.js`)
2. **Direto, por skills/workflows que ainda shell-am pra eles**: `node bin/lib/vcs/create-merge.js --source ...`

Cada um dos 4 arquivos segue o mesmo padrão: exporta uma função (`runCreateMerge`, `runCreateIssue`, `runFetchRaw`, `runComment`) com a lógica, e termina com um guard que só lê `process.argv` quando o arquivo é executado diretamente:

```js
// Compatibilidade: continua funcionando como `node bin/lib/vcs/create-merge.js --source ...`
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await runCreateMerge({ source: arg("source"), ... });
}
```

**Ao editar um desses 4 arquivos**: a lógica de negócio fica dentro da função exportada. O bloco de `arg()`/guard no final é só para quem ainda invoca via `node bin/lib/.../arquivo.js` direto (uso legado — todo caller novo deve preferir o subcomando `jarvis`). Não remova o guard sem primeiro confirmar que nenhuma skill/workflow ainda referencia o path direto (`grep -rn "bin/lib/vcs\|bin/lib/tasks/comment" --include="*.md" .`).

## Como adicionar um comando novo

1. Criar `bin/commands/meu-comando.js` exportando `export async function meuComando(flags) { ... }` — igual aos outros, sem importar `commander`.
2. Em `bin/lib/cli/program.js`:
   - Importar a função no topo.
   - Registrar com `cmd(program, "meu-comando")` (ou `cmd(parentExistente, "nome")` se for subcomando de um grupo como `docs`/`vcs`/`tasks`).
   - Declarar as opções/positionals com `.option()`/`.argument()`. Usar `withEnvOptions()`/`withLogOptions()` de `shared-options.js` se o comando precisar de `--ide`/`--env-file` ou `--quiet`/`--verbose`/`--silent`.
   - No `.action()`, chamar `toLegacyFlags(options, extra)` se a função usa o formato antigo de flags, ou passar `options` quase direto se for um comando novo sem lógica legada (ver os 4 de `vcs`/`tasks` como exemplo).
3. Rodar manualmente o comando novo e **todos os outros** (não há suíte automatizada de CLI end-to-end — só `test/comandos-docs.test.js`, que valida a documentação dos workflows/skills, não o comportamento do CLI em si). Checklist mínimo: `--help` do comando novo, caminho feliz, caminho de erro (flag/argumento faltando).
4. `npm run lint && npm run test:comandos && npm run test:filtro` antes de comitar.

## Variáveis de ambiente lidas diretamente (fora do ENV.md)

`bin/lib/tasks/comment.js` e `bin/lib/vcs/*.js` leem `process.env` direto (`TASK_MANAGER`, `TOKEN_TASK_MANAGER`, `CENTRAL_DOCS_REPO`, `VERSION_CONTROL`, etc.) — não passam pelo `env-loader.js`/ENV.md. Isso é intencional: esses adapters são chamados por skills/workflows que já exportam essas variáveis do `ENV.md` para o processo (`set -a; eval "$(grep ... $IDE/ENV.md)"; set +a`) antes de invocar o comando. Se um comando novo precisar ler o `ENV.md` diretamente, use `env-loader.js#resolveEnvPath`/`loadEnv` (ver `whoami.js`, `tokens.js`, `qa-signoff.js` como exemplo) em vez de `process.env`.

## Testes

- `npm run test:comandos` — valida que toda referência a comando/skill nos workflows e skills existe de fato (não testa o CLI em runtime).
- `npm run test:filtro` — testes unitários de `profile-filter.js`, `token-report.js`, `flow-map`, `env-loader.js`, `sync-engine.js` e `vcs/api.js`.
- Não há teste automatizado de ponta a ponta do CLI (`jarvis <comando>` real) — a camada de dispatch (`program.js`, `bin/commands/*.js`) não é cobrida pelos testes unitários. Qualquer mudança ali precisa de validação manual dos comandos afetados.

### Como testar código que lê `fs`/rede sem mockar módulo

Os 3 arquivos mais críticos sem cobertura até pouco tempo atrás (`env-loader.js`, `sync-engine.js`, `vcs/api.js`) tocam filesystem real ou rede real — nenhum foi refatorado para isso, cada um usou o hook que já existia:

- **`env-loader.js`** (e `flow-map.test.js`, mais antigo): `mkdtempSync(join(tmpdir(), "jarvis-..."))` monta um workspace fake com `.{ide}/ENV.md`, roda a função contra ele, `rmSync` no `finally`.
- **`sync-engine.js`**: `getFrameworkRoot()` (`utils/paths.js`) já tem um escape hatch — `process.env.JARVIS_ROOT`, se definido e existir, vence sobre o framework real. O teste aponta `JARVIS_ROOT` para um fixture mínimo (`agents/`, `skills/`, etc. com 1 arquivo cada) em vez de sincronizar o framework inteiro.
- **`vcs/api.js`**: usa `mock.method(globalThis, "fetch", ...)` do `node:test` pra controlar a resposta por vendor, sem mockar o módulo nem tocar rede real. **Atenção**: toda função de rede chama `getVcsToken()` antes do fetch — fixe `GITLAB_TOKEN`/`GITHUB_TOKEN`/`BITBUCKET_TOKEN` via env var no teste (ver `withEnv` em `vcs-api.test.js`), senão o resultado depende do que a máquina que roda o teste tiver em `.npmrc`/`gh auth`.
- **`docs/fetch-file.js`/`docs/publish-file.js`**: mesmo mock de `fetch`. `redis-cli` (chamado por `docs/redis-cache.js`) **não dá pra mockar** — é um módulo nativo (`node:child_process`) não configurável, `mock.method` lança `TypeError: Cannot redefine property`. Como pode haver um `redis-cli` de verdade instalado (com ou sem servidor acessível) na máquina que roda o teste, cada teste usa uma chave de cache única (`docs:${randomUUID()}...`) em vez de mockar o cache — garante cache-miss determinístico sem depender do estado de nenhum Redis real.

**Armadilha com `async`**: o helper `withEnv(vars, fn)` (repetido nos 3 arquivos acima) precisa de `return **await** fn()`, não `return fn()`, dentro do `try`. Sem o `await`, o `finally` que restaura a env var roda assim que `fn()` retorna uma Promise pendente — ou seja, **antes** da função terminar. Isso só não quebra quando a leitura da env var acontece antes do primeiro `await` de `fn` (ex: `fetchRawFile` lê o token antes do seu próprio `fetch`); quebra silenciosamente em qualquer função com mais de um `await` no meio do caminho (ex: `publishFile`, que busca o `index.md` antes de chegar no commit, que é onde o token é lido).

Ao escrever um teste novo para um arquivo que toca `fs`/rede, prefira um desses padrões a mockar o módulo inteiro ou refatorar pra injeção de dependência — nenhum dos arquivos acima precisou mudar uma linha de lógica de produção para ganhar teste.

## Lint e formatação

`eslint.config.js` (raiz) + `.prettierrc.json` cobrem `bin/` e `test/`. `npm run lint` / `npm run format` — ver `package.json#scripts`.
