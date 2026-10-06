# AGENTS.md

Arquivo de instrucoes para agentes de IA que atuam neste repositorio.

## Visao Geral

Este repositorio contem o **Framework Jarvis** - um framework de desenvolvimento orientado por contexto para IDEs de IA (Windsurf, Cursor, Claude Code, VS Code).

**Este repo NAO e um app executavel.** E um conjunto de templates, agentes, regras, skills e workflows para auxiliar desenvolvimento assistido por IA.

---

## 1) Estrutura do Repositorio

```
prompts/
├── .windsurf/                    # Framework principal
│   ├── ENV.md                    # Variaveis de ambiente
│   ├── README.md                 # Documentacao completa
│   ├── JARVIS.md                # Guia de uso
│   ├── MCPs.md                   # Integracoes MCP
│   ├── LEGACY_PROJECTS.md        # Guia para projetos legados
│   │
│   ├── agents/                   # 16 agentes ativos
│   │   ├── engineering/          # Agentes de engenharia (13 ativos: 7 main + 5 QA + 1 Data)
│   │   │   ├── eng.agent.md
│   │   │   ├── eng.bug-hunter.md
│   │   │   ├── eng.dev-code-reviewer.md
│   │   │   ├── eng.docs-writer.md
│   │   │   ├── eng.frontend.agent.md
│   │   │   ├── eng.ux-designer.agent.md
│   │   │   ├── eng.rpa.agent.md   # Agente RPA/Scraping (ARACHNE) — skill técnica
│   │   │   ├── data/             # 1 agente de Data
│   │   │   │   └── eng.data-engineer.agent.md
│   │   │   └── qa/               # 5 agentes de QA
│   │   └── product/              # Agentes de produto (2 ativos)
│   │       ├── prod.pm-checker.md
│   │       └── prod.discovery-interviewer.md
│   │
│   ├── workflows/                # Templates de execucao
│   │   ├── engineering/          # 25 workflows de engenharia
│   │   │   ├── data/             # 2 workflows de dados (data.new-pipeline, data.contract)
│   │   │   └── frontend/         # 3 workflows de frontend (component, review, perf-audit)
│   │   └── product/              # 10 workflows de produto
│   │
│   ├── skills/                   # Skills (todos com metadata.area)
│   │   ├── jarvis-context-detect/
│   │   ├── jarvis-docs-index/
│   │   ├── eng-ai/
│   │   ├── eng-backend-arch-c4/
│   │   ├── eng-backend/           # Base neutra de backend (+ especializações em BACKEND_SPECIALIZATIONS)
│   │   ├── eng-backend-microservices-trace/          # Rastreamento de bugs cross-service (HTTP + AMQP)
│   │   ├── eng-global-docs-write/
│   │   ├── eng-frontend/          # Base neutra de frontend (design system/tokens e micro frontend inclusos; + especializações em FRONTEND_SPECIALIZATIONS)
│   │   ├── eng-backend-nestjs/            # Framework NestJS: módulos, DI, guards, interceptors
│   │   ├── eng-global-pr/
│   │   ├── eng-backend-rabbitmq/          # Mensageria RabbitMQ
│   │   ├── eng-data/              # Base neutra de dados (+ especializações em DATA_SPECIALIZATIONS)
│   │   ├── eng-automation/           # Web scraping, Puppeteer, ETL
│   │   ├── jarvis-init/
│   │   ├── product-specs/
│   │   ├── product-specs-update/
│   │   ├── eng-qa/                 # Base neutra de QA (+ especializações em QA_SPECIALIZATIONS)
│   │   ├── eng-qa-planner/         # Planejamento de testes e análise de gaps de cobertura
│   │   ├── jarvis-report-issue/          # Auto-report de bugs no repo do Jarvis (GitLab/GitHub/Bitbucket)
│   │   ├── eng-global-task-comment/      # Comentário no card (Jira/Linear/GitHub/Asana)
│   │   ├── jarvis-list-specializations/ # Lista especializações de stack instaladas e registradas
│   │   ├── jarvis-create-specialization/ # Cria uma especialização de stack a partir do código do projeto e a registra
│   │   ├── jarvis-evolution-architect/ # Mentor de arquitetura para a evolução do Jarvis
│   │
│   ├── templates/                # Templates de documentos
│   │   ├── engineering/          # ARD, RFC, Tech Spec
│   │   └── product/              # PRD, FRD, épico, issue, breakdown, discovery
│   │
│   ├── rules/                    # Regras especificas (filtradas por perfil no jarvis-init)
│   │   ├── rtk-rules.md          # RTK Token Killer (opt-in: RTK_ENABLED=true)
│   │   ├── engineering/          # eng-rules.md + eng-security-rules.md + rules com applies_to por HUB/POSITION/AREA/SQUAD
│   │   │   └── frontend/         # eng.frontend-rules.md (HUB: FRONTEND)
│   │   └── product/              # prod-rules.md (AREA=PRODUCT)
│   │
│   ├── rules-on-demand/          # Rules de uma etapa so (start, plan, work, pre-pr, pr, tech-spec, breakdown): o workflow manda ler
│   │
│   ├── scripts/                  # Scripts utilitarios
│   └── docs/                     # Documentacao adicional
│
├── .gitlab/                      # Template de MR
├── docs/                         # Documentacao geral
├── AGENTS.md                     # Este arquivo
├── .windsurfrules                # Regras globais
└── .gitignore
```

---

## 2) Regras Obrigatorias

### Pre-requisito: ENV.md

- Validar `$IDE/ENV.md` antes de qualquer comando; excecao: `/jarvis-init`.
- Se nao existir ou estiver incompleto, orientar o usuario a executar `/jarvis-init`.

### Taxonomia Organizacional

O framework usa `taxonomy.md` (raiz) como fonte de verdade para opções válidas:
- **SQUADS** - Times de desenvolvimento
- **HUBS** - Áreas técnicas (AI, FRONTEND, BACKEND, QA, DATA, FULLCYCLE)
- **POSITIONS** - Cargos (JUNIOR, PLENO, SENIOR, TECH LEAD, etc.)
- **AREAS** - Áreas de negócio (ENGINEERING, PRODUCT)

**Relação com jarvis-init:**
1. `taxonomy.md` define as opções válidas
2. `/jarvis-init` LÊ `taxonomy.md` e cria `ENV.md` com essas opções
3. Após modificar `taxonomy.md`, executar `/jarvis-init` novamente para atualizar

**Gerenciamento via `/taxonomy`:**
```bash
/taxonomy list SQUADS              # Listar opções
/taxonomy add SQUADS MOBILE "..."  # Adicionar
/taxonomy update SQUADS RPA "..."  # Atualizar
/taxonomy remove SQUADS LEGACY     # Remover
/taxonomy validate                 # Validar estrutura
```

### Variaveis obrigatorias no ENV.md

- `WORKSPACE`, `IDE`, `SQUAD`, `HUB`, `AREA`
- `MAX_AI_EXECUTION_PERCENTAGE` (60-100)
- `POSITION`
- `USER` (identidade; se vazio, fallback git / SO)

`WORKSPACE` e a pasta que contem `$IDE/` (nao um repo). Vazio = nome dessa pasta.
`WORKSPACE_REPOS` e allowlist opcional; vazio = todas as subpastas com `.git/`.
O CLI sobe diretorios a partir do cwd ate achar `$IDE/ENV.md` (abre um repo filho e ainda resolve o workspace).
Estado local fica em `{workspace}/.jarvis/` (sessions) — nao em `~/.jarvis/`.

> **Identidade do usuario**: `USER=` no ENV.md. Se vazio, usa `git config user.email` e, por ultimo, o usuario do SO.
> Nao ha login OAuth. `jarvis whoami` mostra a identidade resolvida.

### Deteccao de IDE

A variavel `$IDE` representa a pasta da IDE:
- `.windsurf/` - Windsurf IDE
- `.claude/` - Claude Desktop/Code
- `.cursor/` - Cursor IDE
- `.codex/` - Codex CLI (OpenAI)
- `.opencode/` - OpenCode
- `.agents/` - Gemini CLI / Antigravity (Google)
- `.kiro/` - Kiro (AWS)

O CLI resolve o `ENV.md` na seguinte precedência:
1. `--env-file <path>` — path explícito
2. `--ide <ide>` — ex: `--ide windsurf` → `.windsurf/ENV.md`
3. `JARVIS_ENV_FILE` — variável de ambiente com path
4. `IDE` — variável de ambiente (ex: `IDE=windsurf`)
5. Auto-detect — ordem: windsurf → claude → cursor → codex → opencode → gemini → kiro (emite warning se múltiplos encontrados)

### Invocacao de Skills por IDE

| IDE | Mecanismo | Como invocar um skill |
|-----|-----------|-----------------------|
| Claude Code | Slash commands em `.claude/commands/` | `/warm-up-jarvis`, `/eng.start` |
| Windsurf | Rules + prompts em `.windsurf/` | `/warm-up-jarvis`, `/eng.start` |
| Cursor | Slash commands em `.cursor/` | `/warm-up-jarvis`, `/eng.start` |
| **Codex** | Skills TUI em `.codex/skills/` | Linguagem natural ou painel de skills do TUI |
| OpenCode | Slash commands em `.opencode/` | `/warm-up-jarvis`, `/eng.start` |
| Gemini CLI | Prompts em `.agents/` | `@warm-up-jarvis`, linguagem natural |
| **Kiro** | Steering files em `.kiro/steering/` | `#skill-{nome}` no chat (ex: `#skill-eng-backend`) |

> **Codex**: Não existe slash command (`/`) no Codex. Skills são descobertas automaticamente
> em `.codex/skills/` e aparecem no painel TUI. Para invocar, descreva o que quer:
> _"use o skill eng-backend para criar uma rota POST"_ ou selecione pelo painel.

### Idioma

- Todo arquivo `.md` gerado deve ser em pt-BR.
- Termos tecnicos em ingles sao aceitos.

### Seguranca

- Nao inventar stack, endpoints, ambientes, credenciais ou integracoes.
- Nao expor tokens/segredos; orientar uso de variaveis de ambiente.
- Nao sugerir acao destrutiva sem aviso e confirmacao explicita.
- Priorizar seguranca quando houver conflito com velocidade.
- Respeitar `MAX_AI_EXECUTION_PERCENTAGE` do ENV.md.

---

## 3) Build, Lint e Testes

Este repositorio possui `package.json` com o CLI `jarvis` (`bin/jarvis.js`).

Comandos disponíveis:
```bash
jarvis whoami   [--logout]                          # Exibir identidade (ENV.md / git / SO)
jarvis logout                                       # Remover auth.json legado (opcional)
jarvis init                                         # Bootstrap do framework no projeto
jarvis list                                         # Listar agents, skills e workflows
jarvis install-rtk                                  # Instalar RTK (token killer — economia 60-90% em tokens de shell)
jarvis tokens    [--hub X --position Y --area Z --squad W] [--rtk] [--json]   # Estimar o que carrega no início da sessão (perfil do ENV.md se sem flags)
jarvis map       <nome> [--depth N] [--reverse]      # Mapa de chamadas de um workflow, skill ou agente (lê só as tabelas padronizadas)
```

Quando atuar em um projeto alvo, detectar comandos em:
- JS/TS: `package.json`, `pnpm-lock.yaml`, `yarn.lock`
- Python: `pyproject.toml`, `requirements.txt`, `tox.ini`
- Go: `go.mod`, `Makefile`
- Rust: `Cargo.toml`
- Outros: `Makefile`, `justfile`, `.github/workflows/*`

---

## 4) Hierarquia de Documentos

### Prioridade de leitura (da mais alta para a mais baixa)

1. `.windsurfrules` / `.cursorrules` - Regras globais do framework
2. `$IDE/ENV.md` - Contexto do ambiente
3. `$IDE/JARVIS.md` - Guia principal de uso
4. `$IDE/rules/` - Regras especificas por dominio (carregadas no inicio)
   `$IDE/rules-on-demand/` - Regras de uma etapa so, lidas pelo workflow
5. `$IDE/agents/` - Definicoes de agentes
6. `$IDE/skills/` - Playbooks operacionais
7. `$IDE/workflows/` - Templates de execucao
8. `$IDE/templates/` - Templates de documentos

### AGENTS.md Aninhados

Cada pasta pode ter seu proprio AGENTS.md com instrucoes especificas. No repositorio do Jarvis, `agents/`, `skills/` e `workflows/` tem cada uma o seu; eles nao sao copiados para a IDE. Na IDE instalada existe apenas `$IDE/templates/AGENTS.md` (instrucoes sobre templates).

**Regra**: O AGENTS.md mais proximo tem precedencia.

---

## 5) Fluxos Principais

### Inicializacao

```bash
/jarvis-init            # Cria ENV.md lendo taxonomy.md (unico comando sem ENV.md); oferece o passo opcional de adicionar as stacks
/warm-up                 # Carrega contexto do projeto
```

### Desenvolvimento de Feature

```bash
/eng.start "feature"     # Investigacao e arquitetura (somente planejamento)
/eng.plan "feature"      # Plano de execucao faseado (somente planejamento)
/eng.work "feature"      # Implementacao e testes (commit por fase, sem push/PR)
/eng.pre-pr              # Validacao pre-PR
/eng.pr                  # Cria branch, commit e PR
```

### Documentacao

```bash
/eng.docs                # Atualiza documentacao de engenharia
```

---

## 6) Relacao Agents x Skills

- **Agents**: definem persona, postura e forma de atuacao.
- **Skills**: definem playbooks executaveis e padroes detalhados.

Quando um agente atua em tema com skill correspondente, o skill e a fonte de verdade operacional.

### Mapeamento

Tabela completa de mapeamento comando/trigger → skill: ver `skills/AGENTS.md`, seção "Mapeamento Comando → Skill", no repositorio do Jarvis (nao e copiada para a IDE; cada skill e escolhida pela propria `description`).

---

## 7) Comandos de Processo

| Fase | Comando | Restricao |
|------|---------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente analise, sem codigo |
| Implementacao | `eng.work` | Codigo e testes, commit por fase, sem push nem PR |
| Entrega | `eng.pr` | Branch, commit e PR |

---

## 8) Agentes Disponiveis

Lista completa de agentes: `jarvis list` (ou `agents/README.md`, no repositorio do Jarvis; nao e copiado para a IDE).

---

## 9) Referencias Rapidas

- `.windsurfrules` - Regras globais
- `$IDE/README.md` - Documentacao completa
- `$IDE/JARVIS.md` - Guia de uso
- `jarvis list` - Agentes, skills e workflows instalados (os guias `agents/README.md`, `workflows/README.md` e `skills/AGENTS.md` ficam no repositorio do Jarvis)
- `$IDE/rules/engineering/` - Regras de engenharia
- `$IDE/rules/product/` - Regras de produto
- `$IDE/rules-on-demand/engineering/` - Regras de etapa (lidas pelo workflow)

---

## 10) O Que Este Repo NAO Fornece

- Comandos reais de build/lint/test para um app especifico.
- Convencoes de codigo de um produto especifico.
- Logica de negocio ou implementacao de features.

Se o usuario pedir comandos especificos, solicite o projeto alvo ou arquivos de config.

---

**Última atualização**: 2026-04-26
