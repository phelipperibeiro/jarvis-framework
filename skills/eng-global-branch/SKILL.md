---
name: eng-global-branch
description: >
  Política de nome da branch de trabalho: compõe o nome (convenção do projeto + chave do card), confirma e diz o que os Gates 0.3 conferem. Forkável pelo overlay.
  Trigger: criar, renomear ou validar a branch de uma tarefa.
argument-hint: "{TASK_MANAGER_KEY} [titulo]"
disable-model-invocation: false
allowed-tools: Read Bash
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# eng-global-branch

## Objetivo

Ser a **única fonte** da política de nome da branch de trabalho do Jarvis: como compor o nome, quando confirmar com a pessoa e o que os Gates 0.3 (`eng.plan`, `eng.work`, `eng.pre-pr`, `eng.pr`) conferem. Os workflows apontam para esta skill e não repetem a regra.

Uma empresa com política diferente roda `jarvis fork eng-global-branch` e ajusta o fork no overlay; a rule `company-overlay-rules.md` faz o fork valer na chamada, no lugar desta.

Fica de fora: a branch base (perguntada no `eng.start`), o formato do commit e o template do PR.

## Entrada

- `$ARGUMENTS`: `{TASK_MANAGER_KEY}` e, opcionalmente, o título da tarefa.
- `TASK_MANAGER` do `$IDE/ENV.md` (vazio = freelance, `rules/engineering/eng.integrations-rules.md`).
- `tipo` do `context.md` da sessão (`feature`, `bugfix`, `hotfix`, `refactor`); sem `context.md`, `feature`.
- A convenção de branch do projeto, se houver (Passo 1).

## Recursos

- `rules/engineering/eng.integrations-rules.md`: freelance e chave do card
- `rules/company-overlay-rules.md`: fork desta skill no overlay da empresa

## Pré-requisito

`$IDE/ENV.md` válido (validado pelo workflow que chama). Sem chave, o workflow pergunta antes de chamar esta skill.

## Quando Usar

- `eng.start`, Fase 1.1: criar a branch de trabalho, ou renomear uma que já existe sem a chave
- `eng-global-pr`, criação de branch
- Gates 0.2 e 0.3 dos comandos `eng.*`: saber o nome esperado

## Padrões Críticos

- **Com card, a chave é obrigatória no nome.** A convenção do projeto define só o prefixo e o estilo; ela não dispensa a chave (é por ela que os comandos seguintes acham o card).
- **A chave é identificador, não estilo:** fica como o board a escreve (`TASK-123` continua em maiúsculas, mesmo com convenção só-minúscula). GitHub e GitLab: o número, sem `#` (`199`), porque `#` não é válido em nome de branch.
- **Formato composto:** `{prefixo}/{chave}-{titulo}`, e não `{chave}-{prefixo}-…`.
- **Título:** kebab-case, minúsculas, sem acentos, no máximo 50 caracteres, no idioma que a convenção pede. Fora a chave, só `[a-z0-9/-]`.

## Fluxo de Trabalho

### 1. Achar a convenção do projeto

Leia, nesta ordem, a seção de branches do `CONTRIBUTING.md`, do `AGENTS.md` ou do `CLAUDE.md` do repositório: **a primeira fonte que tiver uma seção de branches vence**. No modo workspace (`WORKSPACE_MODE=workspace`), o repositório é o da tarefa, não a raiz do workspace. Convenção = um formato de nome (ex.: `<type>/<description>`) e, de preferência, a tabela de prefixos por tipo. Nada encontrado = **sem convenção**.

### 2. Compor o nome

| Caso | Nome |
|---|---|
| Com card, com convenção | `{prefixo}/{chave}-{titulo}` |
| Com card, sem convenção | `{chave}-{titulo}` |
| Freelance, com o número da issue do `VERSION_CONTROL` | `{prefixo}/{numero}-{titulo}` (sem convenção: `{numero}-{titulo}`) |
| Freelance, sem número | `{prefixo}/{titulo}` (sem convenção: `{titulo}`) |

- **Prefixo:** o `tipo` mapeado na tabela da convenção (`feature` → `feature/`, `bugfix` → `fix/`, `hotfix` → `hotfix/`, `refactor` → `refactor/`). Convenção sem tabela de prefixos, mas com formato com `/`: proponha o mais próximo e deixe a confirmação decidir.
- **Convenção sem prefixo** (o formato não tem `/`, ex.: `TASK-123-feature-name`): não invente prefixo; o nome é `{chave}-{titulo}` no estilo da convenção.
- **Freelance:** qualquer número de controle informado entra como chave; de preferência, o número da issue no repositório (`VERSION_CONTROL`, GitHub ou GitLab). Sem número, a branch leva só a descrição.

Exemplos:

| Situação | Nome |
|---|---|
| GitHub #199, `CONTRIBUTING.md` com `<type>/<description>` em inglês | `feature/199-company-overlay-fork` |
| Jira `TASK-123`, convenção `feature/` | `feature/TASK-123-implementar-jwt` |
| Jira `TASK-123`, sem convenção | `TASK-123-implementar-autenticacao-jwt` |
| Freelance, issue 42, convenção `feature/` | `feature/42-ajuste-relatorio` |
| Freelance, sem número, convenção `feature/` | `feature/ajuste-relatorio` |

### 3. Confirmar (só com convenção)

Com convenção do projeto, mostre o nome e pergunte com `AskUserQuestion`: **"Nome da branch: `{nome}`?"** → **Usar esse nome (Recomendada)** / **Ajustar**. Com Ajustar, use o nome digitado, desde que mantenha a chave quando há card; sem a chave, avise e pergunte de novo, e nunca crie a branch sem ela. Sem convenção, não pergunte.

### 4. O que os Gates 0.3 conferem

O nome da branch **contém** a chave da tarefa (GitHub e GitLab: o número, sem `#`). No freelance sem número de issue não há chave no nome, e o Gate pergunta "Confirmar que está na branch certa?" (esperado nesse caso).

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

## Regras

### Nunca

- Omitir a chave quando há card, nem por convenção do projeto
- Mudar a caixa da chave ou pôr `#` no nome
- Criar a branch sem confirmar quando há convenção do projeto

### Sempre

- Prefixo e estilo da convenção do projeto; chave como o board a escreve
- Mostrar o nome composto antes de criar, quando há convenção

## Checklist de Conclusão

- [ ] Convenção do projeto procurada (`CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`)
- [ ] Nome composto pela tabela do Passo 2
- [ ] Confirmado com a pessoa (só com convenção)

## Output

O nome da branch, para o workflow que chamou rodar `git checkout -b {nome}` ou `git branch -m {nome}`.

## Mensagem de Conclusão

```
🌿 Branch: {nome} ({com convenção: prefixo {prefixo} | sem convenção})
```
