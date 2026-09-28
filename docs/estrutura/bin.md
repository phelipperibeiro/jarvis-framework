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
│   ├── init.js             # jarvis init [--ide] [--force]
│   ├── list.js             # jarvis list
│   ├── info.js             # jarvis info …
│   ├── whoami.js           # jarvis whoami / logout legado
│   ├── docs-sync.js        # jarvis docs sync
│   ├── docs-publish.js     # jarvis docs publish
│   ├── install-rtk.js      # jarvis install-rtk
│   └── qa-signoff.js       # jarvis qa-signoff (CI)
└── lib/
    ├── core/               # sync-engine, scanner
    ├── config/             # IDEs, constants (SYNC_DIRS, LOCK_FILE)
    ├── vcs/                # adapters GitLab/GitHub/Bitbucket
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
| `jarvis qa-signoff` | Gate de QA para CI |
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

Se o cwd do install tiver `jarvis-lock.json` (workspace com `--save-dev`), o postinstall chama `syncAssets` com `force: true`. Em install global sem lock, só imprime dica de `jarvis init` / RTK.
