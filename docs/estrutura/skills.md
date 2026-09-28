# `skills/` — playbooks executáveis

## Para que serve

Cada skill é uma pasta com `SKILL.md` (e às vezes `assets/`, scripts). É a **fonte operacional** de um tema: passos, validações, templates de saída.

Quando o usuário digita `/init-jarvis` ou “use eng-backend”, a IDE carrega o skill correspondente.

## Como é montado

```
skills/
├── AGENTS.md
├── SKILLS-ROADMAP.md          # roadmap interno de skills
├── init-jarvis/              # onboarding + ENV.md
├── context-detect/
├── docs-central/              # sync/publish docs centrais
├── eng-backend/, eng-frontend/, eng-nestjs/, …
├── eng-pr/, eng-docs-write/, eng-task-comment/
├── eng-qa-*                   # família QA (cypress, gate, exploratory, …)
├── eng-data-*                 # família Data
├── eng-cybersecurity/, eng-threat-model/, eng-security-*
├── eng-rpa via eng-scraper*, eng-scraper-robot-builder
├── prod-specs/, prod-specs-update/, prod-roadmap-report/
├── taxonomy-manager/
├── report-issue/
└── … (~50 skills)
```

Inventário atual (pastas): rode `ls skills` ou `jarvis list` após o pacote instalado.

## Anatomia típica de um skill

```
skills/eng-backend/
├── SKILL.md          # contrato: quando usar, passos, guardrails
└── assets/           # opcional: exemplos, checklists, configs
```

Frontmatter comum: `name`, `description` (descoberta na IDE / Codex `openai.yaml`).

## Relação com workflows e agents

| Peça | Papel |
|------|--------|
| Workflow (`/eng.work`) | Orquestra a fase; aponta agent + skills |
| Agent | Persona |
| Skill | Detalhe de execução |

Mapa comando → skill: ver tabela em `AGENTS.md` (raiz) e `skills/AGENTS.md`.

## No ciclo de vida

1. Versionados neste repo.
2. `jarvis init` → `.$IDE/skills/` (ou `.codex/skills/` etc.).
3. Claude Code / Cursor também podem ter cópias em `~/.claude/skills` se o usuário sincronizou globalmente — **o caminho canônico do workspace** é `.$IDE/skills/` após o init.

## Skills especiais do fork

| Skill | Nota |
|-------|------|
| `init-jarvis` | Cria ENV; Context7 obrigatório; Jira **não** bloqueia; freelance OK |
| `eng-task-comment` | Comenta no board conforme `TASK_MANAGER` |
| `report-issue` | Abre issue no `JARVIS_PROJECT` |
| `taxonomy-manager` | Mantém `taxonomy.md` |
