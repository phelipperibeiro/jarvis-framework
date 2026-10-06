# `skills/` — playbooks executáveis

## Para que serve

Cada skill é uma pasta com `SKILL.md` (e às vezes `assets/`, scripts). É a **fonte operacional** de um tema: passos, validações, templates de saída.

Quando o usuário digita `/jarvis-init` ou “use eng-backend”, a IDE carrega o skill correspondente.

## Como é montado

```
skills/
├── AGENTS.md
├── SKILLS-ROADMAP.md          # roadmap interno de skills
├── jarvis-init/              # onboarding + ENV.md
├── jarvis-context-detect/
├── jarvis-docs-central/              # sync/publish docs centrais
├── eng-backend/, eng-frontend/, eng-backend-nestjs/, …
├── eng-global-pr/, eng-global-docs-write/, eng-global-task-comment/
├── eng-qa/, eng-qa-planner/    # base de QA + especializações em QA_SPECIALIZATIONS
├── eng-data/                   # base de dados (+ especializações em DATA_SPECIALIZATIONS)
├── eng-platform/               # base de platform/infra (+ segurança) em PLATFORM_SPECIALIZATIONS
├── eng-rpa via eng-automation (base) + AUTOMATION_SPECIALIZATIONS
├── product-specs/ (porta de entrada), product-specs-update/, product-roadmap-report/
├── jarvis-report-issue/
└── … (skills restantes; todos com `metadata.area`)
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

Mapa comando → skill: ver a tabela em `skills/AGENTS.md` (só no repositório; não é copiada para a IDE).

## Áreas e nomes

Todo skill tem `metadata.area` (`qa`, `data`, `ai`, `frontend`, `backend`, `automation`, `devops`, `platform`, `global` ou `product`) e um nome no padrão `<prefixo>-<área>-<nome>`: `eng-<área>-...` para engenharia, `eng-global-...` para engenharia global, `product-...` para produto e `jarvis-...` para os transversais do framework. Especializações de backend e frontend também têm `metadata.stack` e só são carregadas quando registradas no `ENV.md`. Skill sem área reconhecida bloqueia os comandos `eng.*`. Detalhes em `skills/AGENTS.md`.

## No ciclo de vida

1. Versionados neste repo.
2. `jarvis init` → `.$IDE/skills/` (ou `.codex/skills/` etc.).
3. Claude Code / Cursor também podem ter cópias em `~/.claude/skills` se o usuário sincronizou globalmente — **o caminho canônico do workspace** é `.$IDE/skills/` após o init.

## Skills especiais do fork

| Skill | Nota |
|-------|------|
| `jarvis-init` | Cria ENV; Context7 obrigatório; Jira **não** bloqueia; freelance OK; passo opcional **adicionar as stacks** (detecta a stack do workspace e registra ou cria a especialização) |
| `eng-global-task-comment` | Comenta no board conforme `TASK_MANAGER` |
| `jarvis-report-issue` | Abre issue no `JARVIS_PROJECT` |
| `jarvis-list-specializations` | Lista as especializações instaladas (backend e frontend) e se estão registradas nas listas do `ENV.md`; só lê |
| `jarvis-evolution-architect` | Mentor de arquitetura para a evolução do próprio Jarvis: questiona designs (agent, skill, workflow ou rule?), identifica gaps e recomenda com opinião técnica; só lê e pesquisa |
| `jarvis-create-specialization` | Cria o skill de uma stack (backend ou frontend) a partir do código do projeto, mostra para revisão e o registra na lista da área |
