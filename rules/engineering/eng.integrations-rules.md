> **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all

# Integrações — vendors via ENV

O Jarvis não assume Jira, GitLab ou Slack. Leia `$IDE/ENV.md` e siga a cadeia de execução abaixo. Board e git usam **só a CLI oficial** do vendor, com o login dela; nenhum token passa pelo Jarvis.

## Variáveis

| Variável | Vendors | Como |
|----------|---------|------|
| `TASK_MANAGER` (+ `TASK_MANAGER_ACCESS`, `TASK_MANAGER_URL_BASE`) | jira (`acli`, só Cloud), github (`gh`), gitlab (`glab`) | `jarvis tasks comment` |
| `VERSION_CONTROL` (+ `VERSION_CONTROL_ACCESS`) | github (`gh`), gitlab (`glab`); repo vem do `git remote` | `jarvis vcs create-merge` / `create-issue` |
| `CENTRAL_DOCS_STORAGE` | filesystem (s3 e gdrive no futuro) | `jarvis docs fetch` / `sync` / `publish` |
| `MESSAGE_COMUNICATOR` | slack, discord, teams | runtime `communicator/` |

Comandos por ação: `bin/lib/integrations/vendors.json` (o catálogo). `*_ACCESS`: `cli` ou `manual`. `{TASK_MANAGER_KEY}` = id do card; sem board, o número de controle.

## Cadeia de execução

Para agir no vendor: 1) **`jarvis`** (`jarvis tasks comment`, `jarvis vcs create-merge`/`create-issue`); 2) saiu com **3** só por CLI ausente ou sem login (a mensagem diz o motivo), ou sem `jarvis` → a **CLI do vendor direto**, com o comando da ação no catálogo (por `*_ACCESS` `manual` ou inválido, não rode a CLI; por ENV.md ambíguo, repita com `--ide`/`--env-file`); 3) CLI indisponível, `*_ACCESS=manual` ou freelance → **`.md`** (`task-comment-{YYYYMMDD-HHMM}.md` na sessão, `pull-request.md` ou `.jarvis/issues/`; detalhes no skill `eng-global-task-comment`).

- Saídas: **0** ok · **1** uso (corrija a chamada; não siga para o passo 2) · **3** indisponível (antes de enviar; nada foi enviado) · **4** enviado com erro (depois de iniciar, inclusive timeout): não repita nem troque de passo; gere o `.md` e avise para conferir no vendor.
- `*_ACCESS` vazio com vendor preenchido = `cli` + aviso para rodar o `/jarvis-init`. Uma ação é enviada no máximo uma vez. Nunca gravar no `ENV.md`.
- Ler o card (`eng.debug`): ação `view` do catálogo, pela CLI; sem acesso, peça para colar.

## Freelance (TASK_MANAGER vazio)

`TASK_MANAGER` vazio, ausente, com a lista de exemplo (`[...]`) ou com vendor fora do catálogo = **sem board** (freelance).

1. **Perguntar** o `TASK_MANAGER_KEY` se não veio em `$ARGUMENTS`. Não inventar. Não exigir padrão `XXX-000`.
2. Prompt:

```
Não há TASK_MANAGER no ENV — modo freelance.
Qual o seu número de controle para esta tarefa?
(ex: F-042, CLIENTE-agosto, 2026-08-13)
```

3. Usar a resposta (lowercase) como pasta `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` e no prefixo da branch.
4. Eventos relevantes (abaixo) vão para o `task-log.md` da sessão pelo `/eng-global-task-comment` (formato no skill), não para board. Não mover card nem buscar issue no board.

Com board definido, se o key não veio nos argumentos, perguntar o id do card naquele vendor (ex: Jira `TASK-123`, GitHub `#42`).

## Comentário no card

Falha no comentário não bloqueia o workflow.

Comentar **somente** em eventos relevantes: (a) **desvio do plano** (mudança de direção, fase bloqueada), (b) **auditoria do Advisor** (as questões do `architecture.md` com as opções junto da escolha), (c) **bloqueio** com valor de rastreabilidade, (d) **link do MR**, uma única vez, (e) o **`gate-checklist.md` do `eng.pre-pr`**, só se o usuário escolher registrar (resumo ou relatório completo). **Nunca** comentar início ou fim de etapa ("Iniciando…", "concluído…"): o acompanhamento fica no fluxo e no PR.

```
/eng-global-task-comment {TASK_MANAGER_KEY} {mensagem}
```

## Alertas (runtime)

`MESSAGE_COMUNICATOR=slack` → Socket Mode (três tokens).
`discord` → Bot token + channel ID em `ALERTS_CHANNEL`.
`teams` → Incoming Webhook em `MESSAGE_COMUNICATOR_BOT_TOKEN`.

## URL do card

| TASK_MANAGER | Padrão |
|--------------|--------|
| jira | `{TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}` |
| github | `{TASK_MANAGER_URL_BASE}/issues/{número}` |
| gitlab | `{TASK_MANAGER_URL_BASE}/-/issues/{número}` |

## Proibido

- Hardcodar `gitlab.com`, `/browse/` ou Slack Bolt fora dos adapters.
- Pedir, ler ou gravar token do board ou do git; usar REST ou MCP para eles (a forma de acesso é a CLI oficial).
