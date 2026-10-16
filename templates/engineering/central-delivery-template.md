---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador da entrega. Padrão: DEL-{AAAA-MM-DD}-{task_key}
id: {DEL-AAAA-MM-DD-task_key}

# Documento da funcionalidade que esta entrega atualizou (basename).
feature: {feature-slug.md}

# Card ou número de controle da tarefa (TASK_MANAGER do ENV.md; freelance = número de controle).
task_key: {TASK-123}

# URL do card no task manager (padrão da eng.integrations-rules.md). Vazio no modo freelance.
card_url: {URL}

# Pull/Merge Request: número e URL (VERSION_CONTROL / remote origin).
pr: {#n URL}

# Branch de trabalho e branch base (Branch base: do architecture.md).
branch: {branch}
base: {main | dev | outra}

# Data da consolidação (YYYY-MM-DD).
date: {YYYY-MM-DD}
---

# Entrega {task_key}: {título}

> Registro **autossuficiente** do que esta entrega fez. O estado atual da funcionalidade fica em [{feature-slug.md}](../../product/{produto}/{feature-slug.md}).

## 1. O que a entrega fez

{Resumo completo em linguagem de produto e de engenharia: o que passou a existir ou mudou.}

## 2. Decisões tomadas

| Questão | Decisão | Por quê |
|---|---|---|
| {das Questões em Aberto do architecture.md e das decisões do card} | {…} | {…} |

## 3. Commits

| Commit | Autor | Data | Mensagem |
|---|---|---|---|
| `{hash curto}` | {nome (sem e-mail)} | {AAAA-MM-DD} | {mensagem} |

## 4. Arquivos alterados

{Resumo do `git diff --stat {base}...HEAD`, agrupado por área (código, testes, docs, config).}

## 5. Fora do escopo e follow-ups

{O que ficou para depois, com card quando existir.}

## 6. Testes e validação

{Comandos rodados e resultados; testes manuais; o que ficou para validar.}

## 7. Referências

- Card: [{TASK_KEY}]({URL})
- PR/MR: [#{n}]({URL})
- Documentos de trabalho de origem (referência): {basenames}
