---
name: jarvis-report-issue
description: Reporta um bug ou propõe uma melhoria no próprio framework Jarvis. Classifica o report (bug ou melhoria), monta a issue no formato do tipo e a abre no repo do Jarvis (o JARVIS_PROJECT, hoje no GitHub) pela CLI do host (gh issue create), com a label certa, só depois de mostrar o texto e o usuário dizer Sim (regra de ouro); sem a CLI ou sem o Sim, deixa a issue pronta em .jarvis/issues/.
argument-hint: "[descrição opcional do problema ou da melhoria]"
disable-model-invocation: false
allowed-tools: Read Bash Grep Glob
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.1"
  area: global
---

# jarvis-report-issue — Bug ou melhoria no Framework Jarvis

Você abre uma issue no repositório do Jarvis: um **bug** (uma instrução do Jarvis induziu um erro) ou uma **melhoria** (funcionalidade nova ou mudança de comportamento pedida pelo usuário).

O usuário não precisa preencher nada — você é o autor do report.

---

## Fase 0 — Classificar (obrigatória)

| Tipo | Quando | Título | Label |
|---|---|---|---|
| **Bug** | Um skill, workflow ou rule do Jarvis induziu um erro (algo saiu diferente do que o framework promete) | `[BUG] {artefato}: {descrição curta}` | `bug` |
| **Melhoria** | Funcionalidade nova, mudança de comportamento ou proposta de evolução | `[MELHORIA] {artefato}: {descrição curta}` | `enhancement` |

Na dúvida, pergunte com `AskUserQuestion`: **"É um bug (algo do Jarvis induziu um erro) ou uma melhoria?"**, com a sua sugestão primeiro, marcada "(Recomendada)".

- **Bug:** siga as Fases 1 e 2 como estão.
- **Melhoria:** pule a Fase 1 (reflexão sobre o erro) e use o formato da Fase 2-M.

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
> "Para abrir a issue, preciso saber: qual skill ou workflow estava sendo executado?"

---

## Fase 2 — Montar a issue

Com as respostas da Fase 1, monte a issue no formato abaixo.

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

Com `ARTIFACT_STYLE=human-generated`, troque a linha por `- **Reportado por:** {USER do ENV, só o nome antes do @}` e não cite IA no corpo (`rules/artifact-style-rules.md`).

---

## Fase 2-M — Montar a melhoria

**Título:** `[MELHORIA] {artefato}: {descrição curta em até 80 chars}`

**Corpo** (issue autossuficiente, executável sem reconstruir a conversa):

```markdown
## Contexto
{por que a mudança importa; situação atual, com arquivos e linhas medidos}

## Problema
{o que falta ou atrapalha hoje}

## Objetivo
{o resultado esperado, em itens verificáveis}

## Escopo
**Alterar:** {arquivos e o que muda em cada um}
**Não alterar:** {o que fica de fora}

## Decisões
{as escolhas já feitas com o usuário; o que ficou em aberto vai para "Questões em aberto", com a sugestão}

## Critérios de aceite
{comandos ou buscas verificáveis}

## Entrega
{branch base, destino do PR, `Closes #N`, idioma}

## Contexto de execução
- **Artefatos:** {caminhos}
- **Versão do Jarvis:** {package.json → version}
- **Reportado por:** IA, a partir do pedido do usuário
```

Antes de abrir, se o pedido tiver pontos em conflito com as regras atuais ou ambíguos, pergunte ao usuário (uma pergunta por ponto) e registre as respostas em "Decisões". Além disso, a Fase 4 sempre mostra o texto e pergunta antes de abrir.

---

## Fase 3 — Credenciais e repo

Ler do `$IDE/ENV.md`:

- `JARVIS_PROJECT` (preferido) ou alias `JARVIS_GITLAB_PROJECT` — **URL completa** do repositório do Jarvis (padrão: `https://github.com/phelipperibeiro/jarvis-framework`; troque só para um fork interno)
- O vendor vem do host dessa URL (hoje GitHub → `gh`), **não** do `VERSION_CONTROL` do projeto: um projeto no GitLab reporta ao Jarvis normalmente, desde que o `gh` esteja logado

Se o projeto não estiver definido:

> `🚫 BLOQUEADO: defina JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework no ENV.md (URL completa).`

Sem host (`grupo/repo`), o vendor não é adivinhado: o `jarvis vcs create-issue` sai com `3` e a issue vai para o fallback da Fase 4.
> → PARAR

Login: o da CLI do host (`gh auth login`; no GitLab, `glab auth login`). Nenhum token é lido ou pedido. O `VERSION_CONTROL_ACCESS` do projeto não se aplica aqui: a issue vai para o repositório do Jarvis.

Versão do Jarvis:

```bash
grep '"version"' package.json | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/'
```

---

## Fase 4 — Abrir a issue

**Antes de abrir, mostre e pergunte (regra de ouro, `eng.integrations-rules.md`).** Mostre o título, a label e o corpo da issue e pergunte com `AskUserQuestion`: **"Abrir esta issue no repositório do Jarvis?"** → **Sim, abrir a issue** / **Não, manter só em `.jarvis/issues/`**. A pergunta vale mesmo quando o usuário pediu o report direto, porque ele ainda não viu o texto final. Com **Não**, grave o fallback abaixo (rode `unset STATUS` antes: indefinido conta como "não abriu") e não rode o `jarvis vcs create-issue`.

```bash
BODY_FILE=$(mktemp)
# gravar o corpo markdown da issue em $BODY_FILE

REPO=$(grep -E '^(JARVIS_PROJECT|JARVIS_GITLAB_PROJECT)=' $IDE/ENV.md | tail -1 | cut -d= -f2-)

jarvis vcs create-issue \
  --repo "$REPO" \
  --title "$ISSUE_TITLE" \
  --body-file "$BODY_FILE" \
  --label "$LABEL"   # bug (Bug) ou enhancement (Melhoria), pela Fase 0
STATUS=$?
```

**Cadeia (`rules/engineering/eng.integrations-rules.md`).** `0` → aberta. `1` (uso: arquivo do corpo inexistente, título vazio) → corrija a chamada e rode de novo. `3` (indisponível: CLI ausente, sem login, `JARVIS_PROJECT` sem host; nada enviado) → rode a CLI direto, se ela estiver logada (`gh issue create --repo {host}/{dono}/{repo} --title "$ISSUE_TITLE" --body-file "$BODY_FILE" --label "$LABEL"`); se também não der, o fallback abaixo. `4` (enviado com erro) → **não** repita: grave o fallback e avise para conferir no repositório se a issue foi aberta.

**Fallback — sem CLI ou sem conexão com o repositório.** Se a cadeia não abrir a issue, **não descarte o report**. Grave a issue montada em `.jarvis/issues/issue-{desc}.md`, na pasta do workspace (a que contém `$IDE/`), para a pessoa abrir manualmente:

- `{desc}` é o slug do título, sem o prefixo de tipo: minúsculas, sem acentos, palavras separadas por `-`, até 60 caracteres (ex.: `[MELHORIA] jarvis-init: Central docs padrão` → `issue-jarvis-init-central-docs-padrao.md`). Se o arquivo já existir, acrescente `-2`, `-3`…
- Conteúdo: um cabeçalho com o que vai nos campos do formulário e, depois, o corpo exatamente como seria enviado:

  ```markdown
  <!-- Abrir em: {URL de nova issue} · Label: {LABEL} -->
  # {título da issue}

  {corpo da issue}
  ```

- `{URL de nova issue}` vem de `JARVIS_PROJECT` pelo vendor: GitHub `{repo}/issues/new`, GitLab `{repo}/-/issues/new`.
- `.jarvis/` já fica fora do versionamento, então o arquivo não vai para nenhum commit.

```bash
if [ "${STATUS:-1}" -ne 0 ]; then   # STATUS indefinido = o usuário disse Não, ou o envio falhou
  mkdir -p .jarvis/issues
  # gravar cabeçalho + "# $ISSUE_TITLE" + corpo em .jarvis/issues/issue-{desc}.md
fi
rm -f "$BODY_FILE"
```

---

## Fase 5 — Confirmar ao usuário

Sucesso (exit 0):

```
✅ Issue aberta com sucesso!

  Título : {título da issue}
  Artefato: {caminho do arquivo com problema}
  URL     : {url retornada}

O time do Jarvis vai revisar e corrigir o artefato.
```

Sem o Sim (o usuário recusou; o fallback da Fase 4 gravou o arquivo):

```
ℹ️ Issue não aberta, como você pediu. O texto ficou em:
  Arquivo : .jarvis/issues/issue-{desc}.md
  Título  : {título da issue}
  Label   : {LABEL}

Quando quiser abrir, peça para abrir a issue a partir desse arquivo.
```

Erro (o fallback da Fase 4 gravou o arquivo):

```
⚠️ Não consegui abrir a issue: {mensagem}

A issue ficou pronta para você abrir manualmente:
  Arquivo : .jarvis/issues/issue-{desc}.md
  Título  : {título da issue}
  Label   : {LABEL}
  Abrir em: {URL de nova issue}

Cole o título no campo de título e o conteúdo abaixo do título no corpo.
Para abrir direto da próxima vez, faça `gh auth login` (ou o login da CLI do host) e confira o JARVIS_PROJECT (URL completa).
```

Com a CLI logada depois, a pessoa pode pedir para abrir a issue a partir desse arquivo, sem montar o report de novo. Depois que a issue for aberta, o arquivo pode ser apagado.

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

- **Nunca** pedir ao usuário que preencha o report — a IA preenche tudo
- **Nunca** abrir issue sem a Fase 0 (classificação); num bug, sem a Fase 1 (reflexão)
- **Nunca** hardcodar o repo nem pedir token — sempre ler `JARVIS_PROJECT` do ENV.md; o vendor vem do host da URL
- **Sempre** usar a label do tipo: `bug` para bug, `enhancement` para melhoria
- **Sempre** limpar arquivos temporários após o curl
- **Nunca** descartar o report quando a abertura falhar: grave o fallback em `.jarvis/issues/issue-{desc}.md` (Fase 4)
