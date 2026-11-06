---
# Modelo de IA recomendado para trabalhar neste documento. Se a sessão estiver em outro,
# o comando avisa e segue (você decide se troca). Opções: opus | sonnet | haiku
recommended_model: opus

# Identificador do produto no Central docs (estável). Ex.: PROD-loja
id: {PROD-slug}

# Nome do produto, como as pessoas o chamam. Vai no título.
name: {Nome do produto}

# Labels no padrão Confluence: minúsculas, no singular, sem espaço (ex.: arquitetura, decisao).
labels: {label1, label2}

# Data da última atualização (YYYY-MM-DD).
updated_at: {YYYY-MM-DD}
---

# {name}

> Página do produto no Central docs: o que é **transversal** a mais de uma funcionalidade dele (visão geral, decisões de arquitetura que não pertencem a uma funcionalidade só) e o índice do histórico de entregas (`history/`). O que é específico de uma funcionalidade fica na página dela, não aqui — evite duplicar (ver `{funcionalidade}/{funcionalidade}.md`).

## Visão geral

{O que este produto é e para quem, em um parágrafo.}

## Decisões transversais

{Decisões de arquitetura ou de negócio que afetam mais de uma funcionalidade. Uma funcionalidade específica linka esta seção em vez de repetir o texto.}

## Funcionalidades

- [{funcionalidade}]({funcionalidade}/{funcionalidade}.md)

## Histórico (por entrega)

> Rodadas de revisão, comentários e diário ficam em `history/{task_key}/`, por entrega. Esta seção lista as entregas, não o conteúdo delas.

| Entrega | Data | Funcionalidade(s) |
|---|---|---|
| [{task_key}](history/{task_key}/) | {YYYY-MM-DD} | {funcionalidade(s)} |
