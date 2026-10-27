# `bin/` — CLI Jarvis

## Para que serve

Implementação do comando **`jarvis`**: bootstrap da IDE, listagem de prompts, identidade, docs centrais, instalação do RTK, sign-off QA.

É a única parte “executável” do pacote (Node ≥ 18, ESM).

## Como é montado

```
bin/
├── jarvis.js              # entrypoint (bin no package.json)
├── postinstall.js          # após npm install: sync se houver jarvis-lock.json
├── commands/
│   ├── init.js             # jarvis init [--ide] [--force] [--upgrade [--yes] [--remove-stale]]; grava o Context7 no MCP da IDE
│   ├── list.js             # jarvis list
│   ├── info.js             # jarvis info …
│   ├── whoami.js           # jarvis whoami / logout legado
│   ├── docs-sync.js        # jarvis docs sync
│   ├── docs-publish.js     # jarvis docs publish
│   ├── install-rtk.js      # jarvis install-rtk
│   ├── tokens.js           # jarvis tokens
│   ├── map.js              # jarvis map
│   └── daily-report.js     # jarvis daily-report
└── lib/
    ├── core/               # sync-engine, scanner, profile-filter, token-report, env-upgrade, docs-migrate, workspace-mode, mcp-config, stale-skills, session-scan
    ├── flow-map/           # índice, leitor das tabelas de chamadas, árvore e saída do jarvis map
    ├── config/             # IDEs, constants (SYNC_DIRS, LOCK_FILE)
    ├── vcs/                # GitHub/GitLab pela CLI (gh, glab)
    ├── tasks/              # comentários em boards
    ├── docs/               # scripts de sync/publish de docs
    ├── auth/               # legado (login removido no fork)
    └── utils/              # paths, ui (banner), logger
```

## Comandos (resumo)

| Comando | Função |
|---------|--------|
| `jarvis init --ide cursor` | Copia assets → `.$IDE/`, sessions, lock |
| `jarvis list` / `info` | Descobre agents/skills/workflows no framework |
| `jarvis whoami` | Resolve `USER` (ENV → git → SO) |
| `jarvis docs sync\|publish` | Integração com repo central de docs |
| `jarvis install-rtk` | rustup (se preciso) + `cargo install rtk` |
| `jarvis tokens` | Estima o que carrega no início da sessão para um perfil (rules, `AGENTS.md`, frontmatter dos skills, `warm-up`) |
| `jarvis map <nome>` | Árvore em texto do que um workflow, skill ou agente chama (`--reverse`: quem o chama; `--depth N`) |
| `jarvis daily-report` | Junta os `daily.md` das sessões por dia, com alertas das sessões sem registro (`--days N`, `--json`; base do `/eng.daily-report`) |
| `jarvis tasks comment <key> [msg] [--body-file]` | Comenta no card pela CLI do vendor (`gh`/`glab`/`acli`); lê o ENV.md (`--ide`/`--env-file`); saídas 0 ok, 1 uso, 3 indisponível (inclui `TASK_MANAGER_ACCESS` `manual` ou inválido e ENV.md ambíguo), 4 enviado com erro |
| `jarvis vcs create-merge` / `create-issue` | Abre PR/MR (`gh pr create`/`glab mr create`, respeitando o `VERSION_CONTROL_ACCESS`; `--ide`/`--env-file` no `create-merge`) e issue (`JARVIS_PROJECT` com URL completa); mesmas saídas. `ACCESS` `manual` ou inválido e ENV.md ambíguo saem com 3 |
| `jarvis --version` | Lê `package.json` |

## Sync (`sync-engine`)

Pastas sincronizadas (`SYNC_DIRS`): `agents`, `skills`, `workflows`, `templates`, `rules`, `scripts` (se existir).

Arquivos de raiz (`SYNC_ROOT_FILES`): `taxonomy.md`, `AGENTS.md`, `members.md`.

Efeitos colaterais no init:

- Flatten de workflows (arquivos sobem para a raiz de `workflows/` ou `commands/`)
- `jarvis-lock.json` na raiz do workspace e em `.$IDE/`
- Reconciliação RTK (`RTK_ENABLED` + `rtk-rules.md`)
- Transformações por IDE (Codex `openai.yaml`, OpenCode frontmatter, Kiro steering)

## Banner e versão

`bin/lib/utils/ui.js` + `getPackageInfo()` em `paths.js` exibem:

- nome do pacote + **versão**
- **origem** (path do framework no disco)

Use com `which jarvis` para confirmar que o PATH aponta para o clone certo.

## Postinstall

O postinstall só imprime as dicas (`jarvis init` e `jarvis install-rtk`). Ele não sincroniza projeto nenhum: o Jarvis é instalado só global, e os assets de um projeto se atualizam com `jarvis init --upgrade`, dentro dele.
