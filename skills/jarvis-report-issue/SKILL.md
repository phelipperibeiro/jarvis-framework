---
name: jarvis-report-issue
description: Reporta um bug no próprio framework Jarvis. A IA reflete sobre qual artefato (skill/workflow/rule) causou o erro, monta o report e abre um issue no repo do Jarvis (GitLab, GitHub ou Bitbucket, conforme VERSION_CONTROL).
argument-hint: "[descrição opcional do problema]"
disable-model-invocation: false
allowed-tools: Read Bash Grep Glob
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# jarvis-report-issue — Auto-report de bug no Framework Jarvis

Você é a IA que acabou de cometer ou identificar um erro causado por uma instrução do Jarvis.
Sua tarefa é: **refletir sobre o que falhou no framework, montar o report e abrir o issue no repositório do Jarvis**.

O usuário não precisa preencher nada — você é o autor do report.

---

## Fase 1 — Reflexão (obrigatória antes de qualquer ação)

Responda internamente às perguntas abaixo. Use o contexto da conversa atual:

```
1. Qual skill, workflow ou rule estava sendo executado quando o erro ocorreu?
   → Nome do artefato + caminho (ex: skills/eng-backend/SKILL.md)

2. O que a instrução dizia que eu deveria fazer?
   → Transcreva ou resuma a instrução relevante

3. O que eu fiz de errado ou o que saiu diferente do esperado?
   → Comportamento real vs. comportamento esperado

4. Por que a instrução induziu esse erro?
   → Ambiguidade? Instrução incompleta? Pressuposto incorreto? Conflito com outra rule?

5. O que deve mudar no artefato para que esse erro não ocorra novamente?
   → Sugestão concreta de correção (reescrita de instrução, adição de gate, exemplo, etc.)
```

Se não houver contexto suficiente na conversa, pergunte ao usuário **uma** coisa antes de continuar:
> "Para abrir o issue, preciso saber: qual skill ou workflow estava sendo executado?"

---

## Fase 2 — Montar o issue

Com as respostas da Fase 1, monte o issue no formato abaixo.

**Título:** `[BUG] {artefato}: {descrição curta do problema em até 80 chars}`

**Corpo:**

```markdown
## O que aconteceu

{descrição do comportamento errado observado — o que a IA fez de errado}

## O que deveria ter acontecido

{comportamento correto esperado pelo framework}

## Artefato com problema

`{caminho/do/arquivo}` — {seção ou instrução problemática, se identificável}

## Causa raiz (hipótese)

{análise da IA: por que a instrução induziu o erro — ambiguidade, lacuna, conflito}

## Sugestão de correção

{o que deve mudar no artefato para evitar o problema — seja específico}

## Contexto de execução

- **Artefato em execução:** {nome do skill/workflow/rule}
- **Versão do Jarvis:** {ler de package.json → campo "version"}
- **Reportado por:** IA (auto-report)
```

---

## Fase 3 — Credenciais e repo

Ler do `$IDE/ENV.md`:

- `JARVIS_PROJECT` (preferido) ou alias `JARVIS_GITLAB_PROJECT` — URL ou `grupo/repo`
- `VERSION_CONTROL` — `gitlab` | `github` | `bitbucket` (default pelo hostname da URL)

Se o projeto não estiver definido:

> `🚫 BLOQUEADO: defina JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework` (ou GitLab/Bitbucket) no ENV.md.`
> → PARAR

Token: o adapter resolve sozinho (`.npmrc` GitLab, `gh auth` / `GITHUB_TOKEN`, `BITBUCKET_TOKEN`).

Versão do Jarvis:

```bash
grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
```

---

## Fase 4 — Abrir o issue

```bash
BODY_FILE=$(mktemp)
# gravar o corpo markdown do issue em $BODY_FILE

REPO=$(grep -E '^(JARVIS_PROJECT|JARVIS_GITLAB_PROJECT)=' $IDE/ENV.md | tail -1 | cut -d= -f2-)

node bin/lib/vcs/create-issue.js \
  --repo "$REPO" \
  --title "$ISSUE_TITLE" \
  --body-file "$BODY_FILE"

rm -f "$BODY_FILE"
```

---

## Fase 5 — Confirmar ao usuário

Sucesso (exit 0):

```
✅ Issue aberto com sucesso!

  Título : {título do issue}
  Artefato: {caminho do arquivo com problema}
  URL     : {url retornada}

O time do Jarvis vai revisar e corrigir o artefato.
```

Erro:

```
🚫 Erro ao abrir issue: {mensagem}

Verifique token (GitLab .npmrc / gh auth / BITBUCKET_TOKEN) e JARVIS_PROJECT.
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

- **Nunca** pedir ao usuário que preencha o report — a IA preenche tudo
- **Nunca** abrir issue sem completar a Fase 1 (reflexão obrigatória)
- **Nunca** hardcodar o repo ou token — sempre ler `JARVIS_PROJECT` do ENV.md; o adapter resolve o vendor
- **Sempre** usar label `bug` — sem exceções
- **Sempre** limpar arquivos temporários após o curl
