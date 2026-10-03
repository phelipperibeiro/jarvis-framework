# Jarvis — visão geral (documentação completa)

Complemento do [README](../README.md) (leitura rápida). Aqui está o **detalhe**: proposta, conceitos e **como o repositório é montado**.

| Atalho | Link |
|--------|------|
| Índice de toda a pasta `docs/` | [README.md](./README.md) |
| Cada arquivo/pasta da raiz | [estrutura/](./estrutura/README.md) |
| Produto / PM / PO (comandos `/prod.spec*`) | [produto/](./produto/README.md) |
| Instruções para agentes (operacional) | [../AGENTS.md](../AGENTS.md) |

**Pacote:** `jarvis-framework` · **Versão:** ver `package.json` (marco deste fork: **2.0.0**) · **Repo:** [phelipperibeiro/jarvis-framework](https://github.com/phelipperibeiro/jarvis-framework)

---

## 1. Proposta

O Jarvis é um **framework de desenvolvimento assistido por IA**, orientado por contexto (**CDD** — Context-Driven Development).

Ele **não é um aplicativo** com tela ou API de negócio. É um kit versionado de:

| Peça | Função em uma frase |
|------|---------------------|
| [agents/](./estrutura/agents.md) | Personas (como a IA se comporta) |
| [skills/](./estrutura/skills.md) | Playbooks (o que fazer, passo a passo) |
| [workflows/](./estrutura/workflows.md) | Comandos slash / fases do processo |
| [rules/](./estrutura/rules.md) | Guardrails filtrados por perfil |
| [templates/](./estrutura/templates.md) | Modelos de ENV e documentos |
| [bin/](./estrutura/bin.md) | CLI `jarvis` (init, list, RTK, docs…) |
| [taxonomy.md](./estrutura/raiz.md#taxonomymd) | Opções válidas de org (squad/hub/…) |

A proposta: a IDE (Cursor, Claude, Windsurf, Codex, …) deixa de improvisar a cada chat e passa a operar com **processo, papel e contexto do workspace**.

### Problema que resolve

Sem framework:

- cada sessão reinventa o fluxo (planejar? codar? commitar?)
- a IA ignora stack e convenções
- planejamento se mistura com implementação
- contexto some quando a conversa acaba

Com Jarvis, o contexto vive em arquivos (`ENV.md`, taxonomy, sessions, skills) e os comandos (`/eng.start` → `/eng.pr`) conduzem o ciclo.

### Para quem é

- Dev solo / freelance (`TASK_MANAGER` vazio)
- Squads com board (Jira, Linear, GitHub Issues, Asana)
- Hubs AI, Frontend, Backend, QA, Data
- Qualquer `POSITION` pode fechar o card ponta a ponta (TL/PM apoiam; não são gate no init)

---

## 2. O que o Jarvis **não** é

| Não é | Por quê |
|-------|---------|
| App de produto | Só prompts + CLI |
| Login OAuth | Identidade = `USER=` → git → SO |
| Runtime Redis / event bus | Removidos no fork v2 |
| Ritual diário (checkin/daily) | Removido do CLI |
| Vendor locked | Vendors no `ENV.md` |
| `node_modules` “mágico” | Ver [node_modules.md](./estrutura/node_modules.md) |

---

## 3. Como o repositório é montado

Árvore na raiz do clone:

```
jarvis/
├── README.md          # leitura rápida
├── AGENTS.md          # manual operacional para agentes neste repo
├── LICENSE            # AGPL-3.0
├── package.json       # jarvis-framework @ 2.x + bin
├── taxonomy.md        # opções de org
├── members.md         # membros (opcional)
├── agents/            # personas
├── skills/            # playbooks
├── workflows/         # slash commands
├── rules/             # guardrails
├── templates/         # ENV + docs models
├── bin/               # CLI
├── docs/              # esta documentação (humana)
├── issues/            # pendências internas do framework
└── node_modules/      # deps locais de desenvolvimento
```

**Detalhe de cada item:** [estrutura/README.md](./estrutura/README.md) (subpáginas por pasta/arquivo).

### Fluxo de montagem (framework → workspace → IDE)

```
┌──────────────────────┐
│  Clone do framework  │  você edita agents/skills/… e o CLI
└──────────┬───────────┘
           │ npm install -g | npm link | --save-dev
           ▼
┌──────────────────────┐
│  CLI jarvis no PATH │  which jarvis · jarvis --version
└──────────┬───────────┘
           │ no workspace do produto: jarvis init --ide cursor
           ▼
┌──────────────────────┐
│  .cursor/ (ou IDE)   │  cópia de agents, skills, workflows, rules, templates
│  jarvis-lock.json   │  versão + origem do framework
│  .jarvis/sessions/  │  estado local eng/prod/qa
└──────────┬───────────┘
           │ no chat: /jarvis-init
           ▼
┌──────────────────────┐
│  .cursor/ENV.md      │  perfil (USER, SQUAD, HUB, vendors, RTK…)
│  rules filtradas     │  só o que aplica ao perfil
└──────────────────────┘
```

O que o **npm publica** (`package.json` → `files`): CLI + agents + skills + workflows + templates + rules + taxonomy + members + AGENTS + README.  
**Fora do pacote** (mas no Git): `docs/`, `issues/`, etc.

---

## 4. Conceitos centrais

### Workspace

Pasta que contém `.$IDE/`. Não é “um repo git” necessariamente — pode ser multi-repo com `WORKSPACE_REPOS`.

Sessões: `{workspace}/.jarvis/sessions/{eng,prod,qa}/` (`SESSIONS_DIR=.jarvis/sessions`).  
Estado do framework **não** fica em `~/.jarvis/` neste fork (exceto restos legados de login, ignorados).

### ENV.md

Fonte de verdade do perfil no projeto. Criado só via `/jarvis-init` a partir de [templates/ENV-template.md](./estrutura/templates.md). Sem ENV, workflows de eng não têm contexto confiável.

### Taxonomia

[taxonomy.md](./estrutura/raiz.md#taxonomymd) define opções de `SQUAD`, `HUB`, `AREA`, `POSITION`. O init valida contra ela. Customizar com `/taxonomy`.

### CDD

`ENABLE_CDD=true`. Ler contexto antes de agir; respeitar `MAX_AI_EXECUTION_PERCENTAGE`; não inventar stack/secrets.

### TASK_MANAGER_KEY

ID da tarefa: key do board **ou**, se freelance, slug próprio.

### Identidade

Sem OAuth. Ordem: `USER=` no ENV → `git config user.email` → `whoami`. CLI: `jarvis whoami`.

---

## 5. As cinco camadas (detalhe)

| Camada | Doc | Depois do init |
|--------|-----|----------------|
| Agents | [agents.md](./estrutura/agents.md) | `.$IDE/agents/` |
| Skills | [skills.md](./estrutura/skills.md) | `.$IDE/skills/` |
| Workflows | [workflows.md](./estrutura/workflows.md) | `.$IDE/workflows/` ou `commands/` |
| Rules | [rules.md](./estrutura/rules.md) | `.$IDE/rules/` (filtradas no jarvis-init) |
| Templates | [templates.md](./estrutura/templates.md) | `.$IDE/templates/` |

**Agents × Skills:** agent = postura; skill = playbook. Com skill no tema, a skill manda.

Hierarquia de leitura completa: ver `AGENTS.md` na raiz.

---

## 6. Fluxo de entrega

| Fase | Comando | Pode | Não pode |
|------|---------|------|----------|
| Warm-up | `/warm-up` | Carregar contexto | — |
| Investigar | `/eng.start` | Arquitetura, dúvidas | Código de prod |
| Planejar | `/eng.plan` | Plano faseado | Implementar |
| Implementar | `/eng.work` | Código + testes | Commit/PR |
| Pré-PR | `/eng.pre-pr` | Checklist | — |
| Entregar | `/eng.pr` | Branch, commit, MR/PR | — |

Produto: família `/prod.spec*`. Data/QA/RPA/Security: workflows sob `workflows/engineering/…` (após flatten, nomes na raiz da IDE).

---

## 7. CLI

Ver [bin.md](./estrutura/bin.md).

Comandos principais: `init`, `list`, `info`, `whoami`, `docs sync|publish`, `install-rtk`, `qa-signoff`, `--version`.

Validação pós-install:

```bash
which jarvis
jarvis --version
```

O banner do `init` mostra **versão + path de origem** do pacote.

---

## 8. Integrações (ENV)

| Capacidade | Variável | Notas |
|------------|----------|-------|
| Board | `TASK_MANAGER` | vazio = freelance |
| Git | `VERSION_CONTROL` | tokens **fora** do ENV |
| Chat | `MESSAGE_COMUNICATOR` | slack/discord/teams |
| Demais | ver ENV-template | DB, broker, storage, observability, Sonar… |

**MCPs no `/jarvis-init`:** Context7 **obrigatório**. Task manager / Jira **não bloqueiam**.

---

## 9. RTK (opcional)

Proxy Rust que comprime output de shell (~60–90% menos tokens).

```bash
jarvis install-rtk          # rustup se preciso + cargo install rtk
# ENV: RTK_ENABLED=true      # rule rtk-rules.md entra no perfil
```

Detalhe da rule: `rules/rtk-rules.md`. Comentários: `templates/ENV-template.md`.

---

## 10. Atualizar o framework

**Via npm registry** (uso padrão, sem editar o framework): `npm install -g jarvis-ai-framework@latest` + `jarvis init --ide {ide}`.

**Via clone local** (contribuindo com o framework) — resumo (passo a passo no README):

1. `git pull` no clone  
2. Reinstall do pacote (`npm install -g` / `--save-dev` / link)  
3. `which jarvis` + `jarvis --version`  
4. No workspace: `jarvis init` (espelha `.$IDE/`)  
5. `/jarvis-init` → **Upgrade (C)** só se houver chaves novas no template  

`ENV.md` e `.jarvis/sessions/` **não** são sobrescritos pelo sync de assets.

---

## 11. Mapa rápido dos arquivos da raiz

| Arquivo | Uma linha | Detalhe |
|---------|-----------|---------|
| `README.md` | Install/sync rápido | [raiz.md](./estrutura/raiz.md#readmemd) |
| `AGENTS.md` | Manual do agente neste repo | [raiz.md](./estrutura/raiz.md#agentsmd) |
| `LICENSE` | AGPL-3.0 | [raiz.md](./estrutura/raiz.md#license) |
| `package.json` | Nome, versão 2.x, bin | [raiz.md](./estrutura/raiz.md#packagejson) |
| `taxonomy.md` | Opções de org | [raiz.md](./estrutura/raiz.md#taxonomymd) |
| `members.md` | Pessoas da org | [raiz.md](./estrutura/raiz.md#membersmd) |

Pastas: [agents](./estrutura/agents.md) · [bin](./estrutura/bin.md) · [docs](./estrutura/docs.md) · [issues](./estrutura/issues.md) · [node_modules](./estrutura/node_modules.md) · [rules](./estrutura/rules.md) · [skills](./estrutura/skills.md) · [templates](./estrutura/templates.md) · [workflows](./estrutura/workflows.md)

---

## 12. Princípios

- Não inventar stack, ambientes, secrets ou integrações  
- Não expor tokens no chat  
- Sem ação destrutiva sem confirmação  
- Autonomia por `POSITION`; TL/PM não bloqueiam o init  
- Context7 obrigatório no onboarding; demais MCPs best-effort  
- Leitura rápida → README; leitura profunda → esta pasta `docs/`

---

**Última atualização:** 2026-08-13 · documentação em subarquivos sob `docs/estrutura/`
