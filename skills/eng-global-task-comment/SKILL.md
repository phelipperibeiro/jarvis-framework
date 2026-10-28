---
name: eng-global-task-comment
description: >
  Adiciona um comentário no card do TASK_MANAGER (Jira, GitHub Issues ou GitLab Issues) pela CLI oficial do vendor, só depois de mostrar o texto e o usuário dizer Sim (regra de ouro); sem board (freelance), registra no task-log.md da sessão.
  Trigger: registrar no card um evento relevante: desvio do plano, auditoria do Advisor, bloqueio ou o link do MR (nunca início ou fim de etapa).
argument-hint: "{TASK_MANAGER_KEY} {mensagem}"
disable-model-invocation: false
allowed-tools: Read Write Bash
metadata:
  author: jarvis-team
  version: "2.0"
  area: global
---

# eng-global-task-comment

Comenta no card do board configurado em `TASK_MANAGER` no ENV.md, pela cadeia de execução de `rules/engineering/eng.integrations-rules.md`: `jarvis` → CLI do vendor direto → `.md`. Nenhum token: o login é o da CLI (`gh auth login`, `glab auth login`, `acli jira auth login`).

`{TASK_MANAGER_KEY}` = id do card (Jira `TASK-123`, GitHub ou GitLab `#42`).

## Entrada

`$ARGUMENTS` — `{TASK_MANAGER_KEY} {mensagem}`

## Execução

Ler `TASK_MANAGER`, `TASK_MANAGER_ACCESS` e `TASK_MANAGER_URL_BASE` do `$IDE/ENV.md`.

Com `ARTIFACT_STYLE=human-generated`, o comentário sai sem marcas de IA (`rules/artifact-style-rules.md`).

### 0. Freelance (sem board)

`TASK_MANAGER` vazio, ausente, com a lista de exemplo (`[jira, github, gitlab]` ou a antiga `[jira, linear, github, asana]`) ou com vendor não suportado (linear, asana…) → **não** comente em board. Acrescente uma entrada em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/task-log.md` e responda `Registro gravado em {caminho}`. Não falhar o workflow.

Formato (criar o arquivo se não existir; só acrescentar, nunca sobrescrever):

````markdown
# Registro da tarefa {TASK_MANAGER_KEY}

| Quando | Evento | Resumo |
|---|---|---|
| [{YYYY-MM-DD HH:MM}](#{âncora do título}) | {evento} | {resumo de uma linha} |

## {YYYY-MM-DD HH:MM} · {evento}

```text
{mensagem}
```
````

A cada entrada nova: uma linha nova no fim da tabela do índice e a seção nova no fim do arquivo. `{evento}`: desvio do plano, auditoria do Advisor, bloqueio, link do MR ou gate do pre-pr.

### 0.5 Mostrar e perguntar (com board)

**Regra de ouro** (`rules/engineering/eng.integrations-rules.md`): nada é comentado sem perguntar. Antes de qualquer envio, mostre o texto da mensagem e pergunte com `AskUserQuestion`: **"Publicar este comentário no card {TASK_MANAGER_KEY}?"** → **Sim, publicar** / **Não, manter só na sessão (como hoje)**. A pergunta vale para cada comentário, mesmo quando o workflow que chamou o skill já perguntou algo parecido.

- **Sim:** siga para o passo 1.
- **Não:** não envie. Grave o `.md` do passo 3 (`task-comment-{YYYYMMDD-HHMM}.md`) e diga `Comentário não enviado; o texto está em {caminho do .md}`, sem o aviso de falha do passo 3. É lá que o texto recusado fica (na auditoria do Advisor, ele também já está no `architecture.md`). O fluxo principal segue.
- **`TASK_MANAGER_ACCESS` `manual`:** não há envio possível; pule a pergunta e faça o mesmo que no Não, avisando que o texto está no `.md`.

### 1. `jarvis tasks comment`

```bash
BODY_FILE=$(mktemp)
# gravar a mensagem em "$BODY_FILE"
jarvis tasks comment "{TASK_MANAGER_KEY}" --body-file "$BODY_FILE"
STATUS=$?
```

O comando lê `TASK_MANAGER`, `TASK_MANAGER_ACCESS` e `TASK_MANAGER_URL_BASE` do `$IDE/ENV.md` do workspace (não precisa exportar nada; não use `eval` no ENV).

Se o `jarvis` não estiver no projeto, use `node "$JARVIS_ROOT/bin/jarvis.js" tasks comment ...` (`$JARVIS_ROOT` = raiz do clone do framework).

- `0` → comentário feito (ou freelance). Encerrar.
- `1` → uso (ex.: no GitHub/GitLab o card é o número da issue). Corrija a chamada; não siga para o passo 2.
- `3` → indisponível, nada enviado → passo 2 só com CLI ausente ou sem login; `TASK_MANAGER_ACCESS` `manual` ou inválido → passo 3; ENV.md ambíguo → repetir o passo 1 com `--ide` ou `--env-file`.
- `4` → enviado com erro → passo 3, com o aviso de conferir no card antes de repetir. **Não** tentar o passo 2.

### 2. CLI do vendor direto

Só se o passo 1 saiu com `3` por CLI ausente ou sem login (ou o `jarvis` não rodou). Se o motivo for `TASK_MANAGER_ACCESS` `manual` ou inválido, vá direto ao passo 3; se for ENV.md ambíguo, repita o passo 1 com `--ide` ou `--env-file`. Confira a CLI com o `auth_status` do catálogo (`bin/lib/integrations/vendors.json`) e, logada, rode a ação `comment` dele:

| Vendor | Comando |
|---|---|
| github | `gh issue comment {número} --repo {host}/{dono}/{repo} --body-file "$BODY_FILE"` |
| gitlab | `glab issue note {número} --repo {URL do repo} -m "{mensagem}"` |
| jira | `acli jira workitem comment create --key {KEY} --body-file "$BODY_FILE"` (texto simples, sem markdown) |

O repo do github/gitlab vem do `TASK_MANAGER_URL_BASE`. Avise: `jarvis indisponível; usei {bin} direto. Para corrigir, {motivo}`. Falhou depois de enviar → passo 3 com o aviso de conferir.

### 3. `.md` da ocorrência

Grave `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/task-comment-{YYYYMMDD-HHMM}.md`:

````markdown
# Comentário para o card {TASK_MANAGER_KEY}

Card: {URL do card (tabela "URL do card" da regra), se houver URL base}

```text
{mensagem}
```
````

E diga:

```
⚠️ Não foi possível comentar no card {TASK_MANAGER_KEY} ({motivo}).
   Cole este comentário no card: {caminho do .md}
   Para comentar direto da próxima vez: {login_cmd ou install_url do catálogo}.
```

Nunca pedir credenciais no chat. Nunca parar o fluxo principal por falha de comentário.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |
