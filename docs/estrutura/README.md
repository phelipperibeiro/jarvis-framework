# Estrutura do repositório

Como o Jarvis está **montado** no disco: o que cada peça é, o que entra no pacote npm e o que o `jarvis init` copia para a IDE.

## Como as pastas se encaixam

```
┌─────────────────────────────────────────────────────────────┐
│  Repo do framework (este clone)                             │
│                                                             │
│  agents/ skills/ workflows/ rules/ templates/  + taxonomy   │
│  rules-on-demand/                                           │
│            │                                                │
│            │  jarvis init --ide cursor                     │
│            ▼                                                │
│  workspace-squad/.cursor/{agents,skills,workflows,...}      │
│  workspace-squad/.cursor/ENV.md   ← /jarvis-init           │
│  workspace-squad/.jarvis/sessions/{eng,prod,qa}/           │
└─────────────────────────────────────────────────────────────┘
```

1. Você desenvolve/versiona o **framework** neste repo.
2. `npm install -g` / `npm link` registra o CLI `jarvis` (lê assets de `bin/` + pastas do pacote).
3. No **workspace** do projeto, `jarvis init` **copia** agents, skills, workflows, rules, rules-on-demand, templates (+ taxonomy, AGENTS, members) para `.$IDE/`.
4. No chat, `/jarvis-init` cria o `ENV.md` e filtra rules pelo perfil.

O que o npm publica (campo `files` do `package.json`): `bin/`, `agents/`, `skills/`, `workflows/`, `templates/`, `rules/`, `rules-on-demand/`, `taxonomy.md`, `members.md`, `AGENTS.md`, `README.md`.  
**Não** entra no pacote: `docs/`, `issues/`, `node_modules/`, `.git/`, etc. (docs ficam no GitHub para leitura humana).

## Índice das subpáginas

### Arquivos da raiz

| Arquivo | Página |
|---------|--------|
| `README.md` | [raiz.md#readmemd](./raiz.md#readmemd) |
| `AGENTS.md` | [raiz.md#agentsmd](./raiz.md#agentsmd) |
| `LICENSE` | [raiz.md#license](./raiz.md#license) |
| `package.json` | [raiz.md#packagejson](./raiz.md#packagejson) |
| `taxonomy.md` | [raiz.md#taxonomymd](./raiz.md#taxonomymd) |
| `members.md` | [raiz.md#membersmd](./raiz.md#membersmd) |

### Pastas

| Pasta | Página |
|-------|--------|
| `agents/` | [agents.md](./agents.md) |
| `bin/` | [bin.md](./bin.md) |
| `docs/` | [docs.md](./docs.md) |
| `issues/` | [issues.md](./issues.md) |
| `node_modules/` | [node_modules.md](./node_modules.md) |
| `rules/` | [rules.md](./rules.md) |
| `rules-on-demand/` | [rules.md](./rules.md) |
| `skills/` | [skills.md](./skills.md) |
| `templates/` | [templates.md](./templates.md) |
| `workflows/` | [workflows.md](./workflows.md) |

Voltar: [visão geral](../visao-geral.md) · [índice docs](../README.md)
