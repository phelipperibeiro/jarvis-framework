# `bin/` — CLI Jarvis

## Para que serve

Implementação do comando **`jarvis`**: bootstrap da IDE, listagem de prompts, identidade, docs centrais, instalação do RTK.

É a única parte “executável” do pacote (Node ≥ 18, ESM).

## Como é montado

```
bin/
├── jarvis.js              # entrypoint (bin no package.json)
├── postinstall.js          # após npm install: só imprime as dicas
├── commands/
│   ├── init.js             # jarvis init [--ide] [--force] [--upgrade [--yes] [--remove-stale]]; em pasta já instalada, menu Atualizar / Reinstalar / Cancelar; grava o Context7 no MCP da IDE
│   ├── list.js             # jarvis list
│   ├── info.js             # jarvis info …
│   ├── whoami.js           # jarvis whoami / logout legado
│   ├── docs-sync.js        # jarvis docs sync
│   ├── docs-publish.js     # jarvis docs publish
│   ├── install-rtk.js      # jarvis install-rtk
│   ├── tokens.js           # jarvis tokens
│   ├── map.js              # jarvis map
│   ├── fork.js             # jarvis fork (overlay de empresa, #199)
│   └── daily-report.js     # jarvis daily-report
└── lib/
    ├── core/               # sync-engine (com o RuleResolver do overlay), scanner, profile-filter, token-report, env-upgrade, docs-migrate, workspace-mode, mcp-config, stale-skills, session-scan, company-profile (COMPANY_PROFILE e o default stark-industries)
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
| `jarvis fork <nome> [--candidate]` / `--list` / `<nome> --update [--diff]` / `<nome> --delete` | Overlay de empresa (#199): copia um artefato do core para `.$IDE/overlays/{COMPANY_PROFILE}/` com carimbo (`forked_from`, `forked_at`); lista o que está forkado em colunas (sem comparar); recarimba (e, com `--diff`, mostra o diff fork × core atual); remove (rule volta ao core na IDE). Confere por `realpath` que grava e apaga só dentro do overlay. A conversa é da skill `/jarvis-fork`; é o único comando que grava em `overlays/` |
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
- Reconciliação RTK (`RTK_ENABLED` + `rtk-rules.md`); na reinstalação (`--force` ou a opção Reinstalar do menu) e no `--upgrade`, o `RTK_ENABLED` que já está no ENV.md não muda
- RuleResolver do overlay de empresa (#199): lê `COMPANY_PROFILE` do ENV.md (vazio, inválido ou sem ENV.md → `stark-industries`), cria a pasta vazia `.$IDE/overlays/{perfil}/` se não existir (única escrita em `overlays/`) e copia por cima de `rules/` e `rules-on-demand/` da IDE cada `.md` do overlay com o mesmo caminho, marcado com `> Overlay: {perfil} (forked_from …)`. Workflows, skills, agentes e templates do overlay não são copiados: a rule `company-overlay-rules.md` os resolve na chamada
- Órfãs do overlay (#199): cópia em `rules/`/`rules-on-demand/` da IDE cuja primeira linha útil é a marcação `> Overlay: {perfil} (forked_from …)` e que o overlay **ativo** não tem (ficou de outro perfil, ou saiu do overlay à mão) volta à versão do core, se o core a tem, ou é removida da IDE. Rule própria que só cite a marcação no corpo não é tocada. `ENV.md` sem a chave `COMPANY_PROFILE` (anterior à #199) avisa ℹ️ e usa o default
- `--upgrade`: ao acrescentar `COMPANY_PROFILE` num ENV antigo, pergunta o perfil no terminal (Enter, `--yes` ou sem TTY = `stark-industries`); com um perfil próprio respondido, reaplica o overlay desse perfil depois de gravar o ENV (o sync anterior rodou com o default)
- `jarvis fork` normaliza CRLF ao ler o fork e ao copiar rules para a IDE (fork editado no Windows não perde o carimbo); o recarimbo (`--update`) regrava o fork em LF
- Transformações por IDE (Codex `openai.yaml`, OpenCode frontmatter, Kiro steering)

## Banner e versão

`bin/lib/utils/ui.js` + `getPackageInfo()` em `paths.js` exibem:

- nome do pacote + **versão**
- **origem** (path do framework no disco)

Use com `which jarvis` para confirmar que o PATH aponta para o clone certo.

## Postinstall

O postinstall só imprime as dicas (`jarvis init` e `jarvis install-rtk`). Ele não sincroniza projeto nenhum: o Jarvis é instalado só global, e os assets de um projeto se atualizam com o `jarvis init`, dentro dele: o menu de pasta já instalada (Atualizar ou Reinstalar), ou os atalhos `--upgrade` e `--force` (este se ainda não houver `ENV.md`).
