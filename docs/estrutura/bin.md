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
│   ├── whoami.js           # jarvis whoami
│   ├── docs-sync.js        # jarvis docs sync
│   ├── docs-publish.js     # jarvis docs publish (--manifest/--force: #220)
│   ├── docs-archive.js     # jarvis docs archive (#220)
│   ├── docs-finalize.js    # jarvis docs finalize (#220)
│   ├── docs-sessions.js    # jarvis docs sessions (#229: inventário das sessões, só leitura)
│   ├── docs-migrate.js     # jarvis docs migrate (layout antigo → por funcionalidade, #220)
│   ├── install-rtk.js      # jarvis install-rtk
│   ├── tokens.js           # jarvis tokens
│   ├── rules.js            # jarvis rules sync (Passo 8 do /jarvis-init)
│   ├── untrack.js          # jarvis untrack AGENTS.md|CLAUDE.md (git rm --cached, sem commit; chamado pelo /jarvis-init upgrade depois do Sim, #227)
│   ├── map.js              # jarvis map
│   ├── fork.js             # jarvis fork (overlay de empresa, #199)
│   └── daily-report.js     # jarvis daily-report
└── lib/
    ├── core/               # sync-engine (com o RuleResolver do overlay), scanner, profile-filter, token-report, env-upgrade, docs-migrate, git-exclude (exclude local do modo projeto e untrack, #227), workspace-mode, repos-map (repositórios com `.git` fora do `CDD-MIND-MAP.md`, só lê, #225), mcp-config, stale-skills, session-scan, env-paths (`expandEnvPath`, `checkEnvPaths`, `EnvPathError`: caminhos do ENV.md com `$VAR`), company-profile (COMPANY_PROFILE e o default stark-industries)
    ├── flow-map/           # índice, leitor das tabelas de chamadas, árvore e saída do jarvis map
    ├── config/             # IDEs, constants (SYNC_DIRS, LOCK_FILE)
    ├── vcs/                # GitHub/GitLab pela CLI (gh, glab)
    ├── tasks/              # comentários em boards
    ├── docs/               # scripts de sync/publish de docs
    ├── auth/               # session.js (resolveUser: identidade por ENV.md, git e SO)
    └── utils/              # paths, ui (banner), logger
```

## Comandos (resumo)

| Comando | Função |
|---------|--------|
| `jarvis init --ide cursor` | Copia assets → `.$IDE/`, sessions, lock |
| `jarvis list` / `info` | Descobre agents/skills/workflows no framework |
| `jarvis whoami` | Resolve `USER` (ENV → git → SO) |
| `jarvis docs sync\|fetch\|publish\|archive\|finalize\|migrate\|sessions` | Integração com o Central docs, por funcionalidade (#220): `archive`/`finalize` são os passos 2 e 3 da consolidação (guardar e depois apagar o original ligado, inclusive os arquivos da sessão, #229); `migrate` move o layout antigo para a estrutura nova; `sessions` lista as sessões, o que falta e quais estão pendentes (`--json`, `--pendentes`, `--proxima`); `publish --manifest --dry-run` simula; `publish --manifest`, `finalize`, `sessions` e `daily-report` conferem as chaves de caminho do `ENV.md` e param com `$` sem valor (status 1, sem stack trace) |
| `jarvis install-rtk` | rustup (se preciso) + `cargo install brokk-rtk` |
| `jarvis untrack <AGENTS.md\|CLAUDE.md>…` | Modo projeto (#227): tira do índice (`git rm --cached`) o arquivo gerado já versionado, mantém o arquivo local, deixa a remoção staged e grava o `.git/info/exclude`; nunca faz commit. Só o `/jarvis-init upgrade` o chama, depois do Sim da pessoa; recusa nome fora da lista, arquivo não versionado, raiz sem `.git` e execução sem o `ENV.md` do workspace (saída 1); se o git recusar, mostra o motivo dele; se tirar do índice mas não conseguir gravar o exclude, também sai com 1 e avisa que o índice já foi alterado |
| `jarvis rules sync` | Sincroniza `.$IDE/rules/` e `.$IDE/rules-on-demand/` com o ENV.md (as duas exceções seguem `ARTIFACT_STYLE` e `RTK_ENABLED`) e aplica o overlay de `COMPANY_PROFILE` (Passo 8 do `/jarvis-init`), avisando do fork do overlay num caminho de rule que saiu do framework; sai com 1, sem gravar, sem ENV.md numa pasta de IDE (sem `--ide`, vale a pasta do ENV.md; com `--ide`, o ENV.md pode vir de fora de uma IDE, e o workspace é a pasta, a atual ou uma acima, que tem a `.{ide}/`; nunca da pasta de outra IDE) ou com o lock ausente, ilegível ou de outra versão (o da pasta da IDE vale antes do da raiz) |
| `jarvis tokens` | Estima o que carrega no início da sessão (rules, `AGENTS.md`, frontmatter dos skills, `warm-up`). O `ARTIFACT_STYLE` e o RTK vêm de `--artifact-style` e `--rtk` ou, sem a flag, do ENV.md; sem ENV.md, vale `ai-generated` e o RTK desligado. Sem uma das duas flags, lê o ENV.md e sai com 1 quando não dá para escolhê-lo ou lê-lo (dois na mesma pasta sem `--ide`, `--ide` sem ENV.md ou inválida, `JARVIS_ENV_FILE` inexistente, ENV.md ilegível) |
| `jarvis map <nome>` | Árvore em texto do que um workflow, skill ou agente chama (`--reverse`: quem o chama; `--depth N`) |
| `jarvis fork <nome> [--candidate]` / `--list` / `<nome> --update [--diff]` / `<nome> --delete` | Overlay de empresa (#199): copia um artefato do core para `.$IDE/overlays/{COMPANY_PROFILE}/` com carimbo (`forked_from`, `forked_at`); lista o que está forkado em colunas (sem comparar); recarimba (e, com `--diff`, mostra o diff fork × core atual); remove (rule volta ao core na IDE). Confere por `realpath` que grava e apaga só dentro do overlay. A conversa é da skill `/jarvis-fork`; é o único comando que grava em `overlays/` |
| `jarvis daily-report` | Junta os `daily.md` das sessões por dia, com alertas das sessões sem registro (`--days N`, `--json`; base do `/eng.daily-report`) |
| `jarvis tasks comment <key> [msg] [--body-file]` | Comenta no card pela CLI do vendor (`gh`/`glab`/`acli`); lê o ENV.md (`--ide`/`--env-file`); saídas 0 ok, 1 uso, 3 indisponível (inclui `TASK_MANAGER_ACCESS` `manual` ou inválido e ENV.md ambíguo), 4 enviado com erro |
| `jarvis vcs create-merge` / `create-issue` | Abre PR/MR (`gh pr create`/`glab mr create`, respeitando o `VERSION_CONTROL_ACCESS`; `--ide`/`--env-file` no `create-merge`) e issue (`JARVIS_PROJECT` com URL completa); mesmas saídas. `ACCESS` `manual` ou inválido e ENV.md ambíguo saem com 3 |
| `jarvis --version` | Lê `package.json` |

**Orçamento de tokens:** `test/token-report.test.js` falha se o contexto base (o mesmo cálculo do `jarvis tokens`) passar do orçamento (valor medido + 2%, arredondado para cima à centena). Aumento intencional: recalcule pela fórmula e atualize `ORCAMENTO` no mesmo PR, dizendo o motivo. Reduções não exigem mudar o teste.

## Sync (`sync-engine`)

Pastas sincronizadas (`SYNC_DIRS`): `agents`, `skills`, `workflows`, `templates`, `rules`, `rules-on-demand`.

Arquivos de raiz (`SYNC_ROOT_FILES`): `taxonomy.md`, `AGENTS.md`.

Efeitos colaterais no init:

- Flatten de workflows (arquivos sobem para a raiz de `workflows/` ou `commands/`)
- `jarvis-lock.json` na raiz do workspace e em `.$IDE/`
- Git do modo projeto (#227; instalação, reinstalação e `--upgrade`; `applyProjectGitSetup` em `lib/core/git-exclude.js`): com `.git` na raiz, grava `AGENTS.md`, `CLAUDE.md` e `CDD-MIND-MAP.md` no `.git/info/exclude` (local, fora do PR) e `.jarvis/`, o `$SESSIONS_DIR/` relativo, `$JARVIS_DOCS/` e a pasta da IDE no `.gitignore`; avisa quando `AGENTS.md`, `CLAUDE.md`, o mapa, a pasta da IDE ou `$JARVIS_DOCS/` já estão versionados e **nunca tira arquivo do índice** (isso é o `jarvis untrack`, chamado pelo `/jarvis-init upgrade` depois do Sim). Git que não responde (`.git` inválido, git fora do PATH) é aviso com saída 0; falha ao gravar o exclude ou o `.gitignore` (`EACCES`, `.gitignore` diretório) é erro com saída 1, sem stack trace e sem derrubar o resumo do `--upgrade`. Sem `.git` na raiz (modo workspace) nada é criado ou alterado
- Reconciliação RTK (`RTK_ENABLED` + `rtk-rules.md`); na reinstalação (`--force` ou a opção Reinstalar do menu) e no `--upgrade`, o `RTK_ENABLED` que já está no ENV.md não muda
- RuleResolver do overlay de empresa (#199): lê `COMPANY_PROFILE` do ENV.md (vazio, inválido ou sem ENV.md → `stark-industries`), cria a pasta vazia `.$IDE/overlays/{perfil}/` se não existir (única escrita em `overlays/`) e copia por cima de `rules/` e `rules-on-demand/` da IDE cada `.md` do overlay com o mesmo caminho, marcado com `> Overlay: {perfil} (forked_from …)`. Workflows, skills, agentes e templates do overlay não são copiados: a rule `company-overlay-rules.md` os resolve na chamada
- Órfãs do overlay (#199): cópia em `rules/`/`rules-on-demand/` da IDE cuja primeira linha útil é a marcação `> Overlay: {perfil} (forked_from …)` e que o overlay **ativo** não tem (ficou de outro perfil, ou saiu do overlay à mão) volta à versão do core, se o core a tem, ou é removida da IDE. Rule própria que só cite a marcação no corpo não é tocada. `ENV.md` sem a chave `COMPANY_PROFILE` (anterior à #199) avisa ℹ️ e usa o default
- `--upgrade`: antes de sincronizar qualquer arquivo, confere as chaves de caminho do `ENV.md` (`checkEnvPaths`); com `$` sem valor, para com status 1 e não altera nada. Ao acrescentar `COMPANY_PROFILE` num ENV antigo, pergunta o perfil no terminal (Enter, `--yes` ou sem TTY = `stark-industries`); com um perfil próprio respondido, reaplica o overlay desse perfil depois de gravar o ENV (o sync anterior rodou com o default)
- `--upgrade` (modo workspace, com o `CDD-MIND-MAP.md` existente): no fim, lista numa linha própria os repositórios (todas as subpastas com `.git`, sem filtrar por `WORKSPACE_REPOS`) que não estão no mapa e orienta `/jarvis-init repos`; só lê, nunca escreve nos documentos (`repos-map.js`, #225). Sem o mapa, ou no modo projeto, não há essa pendência
- `--upgrade` (nos dois modos): lista como pendência do `/jarvis-init upgrade` o `CDD-MIND-MAP.md` ou o `AGENTS.md` ausentes e o `CLAUDE.md` ausente ou diferente do `AGENTS.md`, que é sempre cópia dele (`documentPendencies` em `repos-map.js`, #225); só lê, quem cria ou sincroniza é o Upgrade, com confirmação
- `jarvis fork` normaliza CRLF ao ler o fork e ao copiar rules para a IDE (fork editado no Windows não perde o carimbo); o recarimbo (`--update`) regrava o fork em LF
- `--upgrade` e reinstalação (`--force` ou opção 2 do menu): no fim, sincronizam `rules/` e `rules-on-demand/` como o `jarvis rules sync` (`filterRulesByEnv` em `commands/init.js`); a `rtk-rules.md` só entra com `RTK_ENABLED=true` e o `rtk` no PATH (#83, #263), e avisam do fork do overlay ativo num caminho de rule que saiu do framework e da rule do overlay numa pasta que saiu (entradas de `OBSOLETE_PATHS`; só os arquivos que o overlay copia), sem gravar no overlay
- Transformações por IDE (Codex `openai.yaml`, OpenCode frontmatter, Kiro steering). A `description` vem do `readDescription` (`utils/frontmatter.js`), que lê o valor na linha e o bloco `>`/`|`. No Kiro, a pasta de workflows é a própria `steering/`: o flatten deixa `steering/skills/` de fora, e o filtro de rules grava ou apaga o `steering/{nome}` junto com a rule (#83)

## Banner e versão

`bin/lib/utils/ui.js` + `getPackageInfo()` em `paths.js` exibem:

- nome do pacote + **versão**
- **origem** (path do framework no disco)

Use com `which jarvis` para confirmar que o PATH aponta para o clone certo.

## Postinstall

O postinstall só imprime as dicas (`jarvis init` e `jarvis install-rtk`). Ele não sincroniza projeto nenhum: o Jarvis é instalado só global, e os assets de um projeto se atualizam com o `jarvis init`, dentro dele: o menu de pasta já instalada (Atualizar ou Reinstalar), ou os atalhos `--upgrade` e `--force` (este se ainda não houver `ENV.md`).
