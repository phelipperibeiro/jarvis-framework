---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador da sessão no Central docs. Padrão: SES-{task_key}
id: SES-{task_key}

# Nome da página, como as pessoas a chamam. Vai no título: "Sessão {task_key}: {título}".
name: {Sessão TASK-123: título da tarefa}

# Card ou número de controle da tarefa (o mesmo da pasta da sessão, em minúsculas).
task_key: {task_key}

# URL do card no task manager (padrão da eng.integrations-rules.md). Vazio no modo freelance.
card_url: {URL}

# Pull/Merge Request: número e URL. Sem PR encontrado, escreva "PR não localizado".
pr: {#n URL}

# Funcionalidades que esta sessão tocou (slugs, uma página em {produto}/{slug}/{slug}.md cada).
features: [{slug-1, slug-2}]

# Data da entrega (YYYY-MM-DD): a do merge do PR; sem PR, a do fechamento da issue; sem as duas,
# a do início da sessão (.timestamp_start), dizendo isso em "Fontes".
date: {YYYY-MM-DD}

# De onde veio cada informação desta página (arquivos da sessão, issue, PR, commits). Uma IA que
# ler só o frontmatter sabe em que se apoiar.
sources: [{architecture.md, plan.md, issue #229, PR #230}]

# Artefatos que a sessão não tinha (ex.: plan.md, context.md). Vazio quando está completa.
absent: [{plan.md, context.md}]

# Labels no padrão Confluence: minúsculas, no singular, sem espaço.
labels: sessao
---

# Sessão {task_key}: {título da tarefa}

> Página-índice da sessão no Central docs. Reúne tudo o que a tarefa produziu e liga às
> funcionalidades que ela tocou. No Confluence, é a página-pai dos artefatos abaixo. Escrita só com
> fontes reais; o que faltou está em "Artefatos ausentes e fontes", sem inventar.

## 1. Resumo

{O que a tarefa fez, em poucas frases completas, para quem não conhece o projeto. Cada afirmação
vem de uma fonte da seção 5; sem fonte, escreva "não informado".}

## 2. Funcionalidades tocadas

> Links relativos a esta página (`history/{task_key}/`): `../../{slug}/…`.

| Funcionalidade | Página | Registro da entrega |
|---|---|---|
| {nome} | [{slug}](../../{slug}/{slug}.md) | [delivery-{AAAA-MM-DD}-{task_key}.md](../../{slug}/deliveries/delivery-{AAAA-MM-DD}-{task_key}.md) |

## 3. Artefatos

> Um por linha. **Onde está**: link relativo para a cópia no Central docs. **Versão**: `—` se é a única;
> `v1`, `v2`… quando a sessão mudou depois de publicada (a anterior permanece).

| Arquivo | Tipo | Onde está | Versão | Fonte |
|---|---|---|---|---|
| architecture.md | Decisões de arquitetura | [architecture-{task_key}.md](../../{slug}/decisions/architecture-{task_key}.md) | — | sessão |
| plan.md | Plano de execução | [plan-{task_key}.md](../../{slug}/decisions/plan-{task_key}.md) | — | sessão |
| context.md | Contexto da tarefa | [context.md]({context.md}) | — | sessão |

## 4. Anexos que não são Markdown

> Scripts, saídas de comando, JSON de medição. No Confluence, viram anexos desta página. Sem anexos: "Nenhum".

| Arquivo | Tamanho | Onde está |
|---|---|---|
| {ferramentas/saidas/E8.txt} | {12 KB} | [{ferramentas/saidas/E8.txt}]({ferramentas/saidas/E8.txt}) |

## 5. Artefatos ausentes e fontes

**Ausentes:** {lista do que a sessão não tinha, ou "Nenhum"}.

**Fontes consultadas:**

- {Arquivos da sessão: …}
- {Issue [#229](https://github.com/o/r/issues/229): título, descrição, estado}
- {PR [#230](https://github.com/o/r/pull/230): commits e data do merge}

**Lacunas:** {o que não foi possível saber (ex.: "sem PR vinculado à issue"), ou "Nenhuma"}.

## 6. Referências

- Card: [{task_key}]({card_url}) · PR/MR: [{#n}]({URL})
- Commits: {hash curto e título de cada um, com o autor (nome, sem e-mail)}
