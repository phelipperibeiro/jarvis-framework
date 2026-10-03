---
name: eng-{area}-{stack}
description: >
  Especialização de {area} para {stack}: convenções, estrutura, comandos e padrões que este
  projeto usa de fato. Soma-se à skill base eng-{area}.
  Trigger: Use ao implementar, revisar ou depurar código de {area} em {stack} neste projeto.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Glob Grep Bash
metadata:
  author: jarvis-create-specialization
  version: "1.0"
  area: {area}
  stack: {stack}
---

<!--
  MOLDE do skill gerado por jarvis-create-specialization.
  Substitua os {...} SOMENTE com o que o código do projeto confirma. Cada afirmação cita o
  arquivo de origem entre parênteses. O que não foi confirmado vai para "A validar".
  Mantenha este arquivo com MENOS de 500 linhas; o detalhe vai para references/.
  Remova este comentário no skill gerado.
-->

# Eng {Area} {Stack} - Especialização de {stack} para {area}

## Objetivo

{Em 2 ou 3 frases: o que esta especialização acrescenta à skill base eng-{area} neste projeto.}

## Quando Usar

- {Situação em que esta especialização vale (ex.: criar um endpoint, escrever um teste, depurar)}
- Sempre junto da skill base `eng-{area}`: esta especialização **soma-se** a ela, não a substitui

## Stack do Projeto

| Item | Valor | Origem |
|------|-------|--------|
| {Linguagem e versão} | {valor} | `{arquivo}` |
| {Framework ou biblioteca principal} | {valor} | `{arquivo}` |
| {Banco, fila ou outra dependência relevante} | {valor} | `{arquivo}` |

## Comandos

| Ação | Comando | Origem |
|------|---------|--------|
| Build | `{comando}` | `{arquivo}` |
| Testes | `{comando}` | `{arquivo}` |
| Lint e formatação | `{comando}` | `{arquivo}` |

## Índice de references/

{Liste só os arquivos de references/ que existem, um por linha, com uma frase do que cada um cobre.}

- [1-convencoes-do-projeto.md](references/1-convencoes-do-projeto.md): {o que cobre}
- [2-estrutura-e-arquitetura.md](references/2-estrutura-e-arquitetura.md): {o que cobre}
- [3-padroes-de-codigo.md](references/3-padroes-de-codigo.md): {o que cobre}
- [4-testes.md](references/4-testes.md): {o que cobre}
- [5-ferramentas-e-comandos.md](references/5-ferramentas-e-comandos.md): {o que cobre}

## Regras

### Nunca

- {Proibição que o projeto confirma, com a origem}
- Inventar convenção ou comando que não esteja no código do projeto

### Sempre

- {Prática que o projeto confirma, com a origem}
- Seguir o padrão do código existente antes de propor outro

## A validar

> Itens que o criador não conseguiu confirmar no código. Trate como suposição até alguém validar.

- [ ] {Item não confirmado e por que não foi possível confirmar}
