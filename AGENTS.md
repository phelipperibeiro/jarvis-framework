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
│   ├── agents/                   # 17 ativos + 5 arquivados
│   │   ├── engineering/          # Agentes de engenharia (15 ativos: 8 main + 6 QA + 1 Data)
│   │   │   ├── eng.agent.md
│   │   │   ├── eng.cybersecurity.agent.md  # Cybersecurity e AppSec (SENTINEL)
│   │   │   ├── eng.bug-hunter.md
│   │   │   ├── eng.dev-code-reviewer.md
│   │   │   ├── eng.docs-writer.md
│   │   │   ├── eng.frontend.agent.md
│   │   │   ├── eng.ux-designer.agent.md
│   │   │   ├── eng.rpa.agent.md   # Agente RPA/Scraping (ARACHNE) — skill técnica
│   │   │   ├── data/             # 1 agente de Data
│   │   │   │   └── eng.data-engineer.agent.md
│   │   │   └── qa/               # 6 agentes de QA
│   │   ├── product/              # Agentes de produto (2 ativos)
│   │   │   ├── prod.pm-checker.md
│   │   │   └── prod.discovery-interviewer.md
│   │   └── archive/              # Agentes arquivados (uso especializado)
│   │       ├── architecture-design/   # 2 agentes
│   │       ├── implementation/        # 2 agentes
│   │       └── product/               # 5 agentes (WIP)
│   │
│   ├── workflows/                # Templates de execucao
│   │   ├── engineering/          # 25 workflows de engenharia
│   │   │   ├── data/             # 2 workflows de dados (data.new-pipeline, data.contract)
│   │   │   └── frontend/         # 3 workflows de frontend (component, review, perf-audit)
│   │   └── product/              # 9 workflows de produto
│   │
│   ├── skills/                   # Skills (todos com metadata.area)
│   │   ├── jarvis-context-detect/
│   │   ├── jarvis-docs-index/
│   │   ├── eng-ai-engineer/
│   │   ├── eng-backend-arch-c4/
│   │   ├── eng-backend/           # Base neutra de backend (+ especializações em BACKEND_SPECIALIZATIONS)
│   │   ├── eng-backend-microservices-trace/          # Rastreamento de bugs cross-service (HTTP + AMQP)
│   │   ├── eng-global-browser-extension-builder/
│   │   ├── eng-global-docs-write/
│   │   ├── eng-frontend/          # Base neutra de frontend (+ especializações em FRONTEND_SPECIALIZATIONS)
│   │   ├── eng-frontend-microfrontend/     # Module Federation, shell/remote, contratos, event bus
│   │   ├── eng-frontend-design-system/     # Tokens, CVA, Storybook, versionamento, auditoria visual
│   │   ├── eng-backend-nestjs/            # Framework NestJS: módulos, DI, guards, interceptors
│   │   ├── eng-devops-performance-engineer/
│   │   ├── eng-global-pr/
│   │   ├── eng-backend-rabbitmq/          # Mensageria RabbitMQ
│   │   ├── eng-data-engineer/     # Pipelines ETL/ELT, Athena, MySQL, Metabase, contratos de dados
│   │   ├── eng-scraper/           # Web scraping, Puppeteer, ETL
│   │   ├── jarvis-init/
│   │   ├── product-specs/
│   │   ├── product-specs-update/
│   │   ├── eng-qa-bug-report/
│   │   ├── eng-qa-cypress-e2e/          # Testes E2E Cypress + TypeScript (Page Objects, data-testid, intercept)
│   │   ├── eng-qa-dev-guide/            # Orienta devs a escreverem seus próprios testes Cypress
│   │   ├── eng-qa-exploratory/          # Sessões de teste exploratório estruturadas
│   │   ├── eng-qa-gate/
│   │   ├── eng-qa-test-plan/
│   │   ├── eng-qa-testsprite/
│   │   ├── eng-qa-unit-test/
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
4. `$IDE/rules/` - Regras especificas por dominio
5. `$IDE/agents/` - Definicoes de agentes
6. `$IDE/skills/` - Playbooks operacionais
7. `$IDE/workflows/` - Templates de execucao
8. `$IDE/templates/` - Templates de documentos

### AGENTS.md Aninhados

Cada pasta pode ter seu proprio AGENTS.md com instrucoes especificas:
- `$IDE/agents/AGENTS.md` - Instrucoes sobre agentes
- `$IDE/rules/AGENTS.md` - Instrucoes sobre regras
- `$IDE/skills/AGENTS.md` - Instrucoes sobre skills
- `$IDE/templates/AGENTS.md` - Instrucoes sobre templates
- `$IDE/workflows/AGENTS.md` - Instrucoes sobre workflows
- `$IDE/commands/AGENTS.md` - Instrucoes sobre comandos

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

| Comando/Workflow | Skill |
|------------------|-------|
| `/warm-up` | `jarvis-docs-central` (sync) |
| `eng.start` | `jarvis-docs-central` (buscar PRD/ARD) |
| `eng.docs` | `eng-global-docs-write`, `jarvis-docs-index` |
| `eng.pre-pr` | `eng-qa-test-plan`, `eng-global-docs-write`, `jarvis-docs-central` (detectar docs) |
| `eng.pr` | `eng-global-pr` (MR/PR via `VERSION_CONTROL`) |
| Comentário no card | `eng-global-task-comment` |
| Listar especializações de stack (instaladas e registradas) | `jarvis-list-specializations` |
| Criar uma especialização de stack (backend ou frontend) a partir do código do projeto | `jarvis-create-specialization` |
| Decisão de arquitetura do Jarvis (agent, skill, workflow ou rule?), simplificação, tendências | `jarvis-evolution-architect` |
| `jarvis docs sync` | `jarvis-docs-central` |
| `jarvis docs publish` | `jarvis-docs-central` |
| QA validation | `eng-qa-gate` |
| Arquitetura C4 | `eng-backend-arch-c4` |
| Inicializacao | `jarvis-init` |
| Testes unitarios | `eng-qa-unit-test` |
| Testes TestSprite | `eng-qa-testsprite` |
| Mensageria / RabbitMQ | `eng-backend-rabbitmq` (especialização de backend) |
| APIs, auth, workers, caching | `eng-backend` (base) + `BACKEND_SPECIALIZATIONS` |
| Componentes, UI, frontend | `eng-frontend` (base) + `FRONTEND_SPECIALIZATIONS` |
| Micro frontend, Module Federation, shell/remote | `eng-frontend-microfrontend` (especialização de frontend) |
| Design system, tokens, CVA, Storybook, versionamento | `eng-frontend-design-system` (especialização de frontend) |
| Revisão de PR frontend (tipagem, a11y, tokens, itens da stack) | `eng.frontend-review` |
| Auditoria de performance frontend (Core Web Vitals, pacote entregue) | `eng.frontend-perf-audit` |
| Framework NestJS (módulos, DI, guards) | `eng-backend-nestjs` (especialização de backend) |
| Web scraping, Puppeteer, ETL | `eng-scraper` |
| Converter fluxo manual (produto/dev) em robô Playwright via Stagehand | `eng-scraper-robot-builder` |
| Criar ou manter robô RPA (ciclo completo) | `eng.rpa.robot` |
| Testes E2E em linguagem natural, fluxos de usuário, regressão de UI, smoke tests pós-deploy | `eng-qa-e2e` |
| Gerar specs Cypress + TypeScript (Page Objects, data-testid, cy.intercept, fixtures) | `eng-qa-cypress-e2e` |
| Sessão de teste exploratório (charter, roteiro de risco, achados, bug cards) | `eng-qa-exploratory` |
| Orientar dev sobre cobertura de testes Cypress sem escrever o teste | `eng-qa-dev-guide` |
| Consolidar sessões exploratórias, bugs e quality gates e gerar relatório de qualidade por sprint/release | `eng-qa-quality-report` |
| Testes de acessibilidade WCAG 2.1 AA: integra jest-axe em testes unitários existentes | `eng-qa-a11y-audit` |
| Testes de contrato GraphQL: valida queries frontend contra schema do BFF | `eng-qa-graphql-contract` |
| Spec E2E para handoff: cenários, Page Objects, fixtures, intercepts, setup de ambiente | `eng-qa-e2e-spec-writer` |
| Planejar capacidade QA da sprint: risco por task, alocação entre QAs e Quality Champions | workflow `eng.qa-sprint-planning` |
| Sign-off QA pré-deploy: verifica cobertura, bugs abertos, produz GO/NO-GO + snippet CI para TL | workflow `eng.qa-release-signoff` |
| Pipelines ETL/ELT, Glue, Airflow, PySpark, Athena, Metabase, bronze/silver/gold, contratos de dados, Great Expectations | `eng-data-engineer` |
| Criar pipeline novo (docs, qualidade, idempotência, gold) | `data.new-pipeline` |
| Criar contrato de dados para squad requisitante | `data.contract` |
| Dashboards BI, queries SQL analíticas, compartilhamento com squads | `eng-data-bi` |
| Diagnóstico de falhas em pipelines por camada (fonte→bronze→silver→gold) | `eng-data-debug` |
| Onboarding de fonte nova: schema discovery, bronze, Expectation Suite, doc | `eng-data-onboard` |
| Criar/manter DAGs, retry strategies, alertas, troubleshooting de orquestração | `eng-data-orchestrator` |
| Documentação central (GitLab/GitHub/Bitbucket) | `jarvis-docs-central` |
| Bug cross-service (HTTP + AMQP) | `eng-backend-microservices-trace` |
| Auditoria de segurança OWASP, secrets, supply chain, headers, compliance | `eng-security-cybersecurity` |
| Resposta a incidentes de segurança, CVEs, vulnerabilidades | `eng.security-incident` |
| Review de segurança em PRs (gate pré-merge) | `eng.security-review` |
| Pipeline defensivo completo: threat-model → audit → triage → patch (fluxo guiado) | `eng.security-pipeline` |
| Produzir threat model estruturado do projeto (bootstrap/interview) | `eng-security-threat-model` |
| Deduplicar, verificar com multi-voto e rankear achados de segurança | `eng-security-triage` |
| Gerar diffs candidatos para achados confirmados de segurança (fechar o loop do triage) | `eng-security-patch` |

---

## 7) Comandos de Processo

| Fase | Comando | Restricao |
|------|---------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente analise, sem codigo |
| Implementacao | `eng.work` | Codigo e testes, commit por fase, sem push nem PR |
| Entrega | `eng.pr` | Branch, commit e PR |

---

## 8) Agentes Disponiveis

### Engenharia (Ativos)
- `eng.agent.md` - Agente principal de engenharia
- `eng.bug-hunter.md` - Caça e análise de bugs
- `eng.dev-code-reviewer.md` - Revisao de codigo
- `eng.docs-writer.md` - Documentacao tecnica
- `eng.rpa.agent.md` - Automação e scraping RPA (ARACHNE) — robôs resilientes, análise de sistemas externos
- `eng.frontend.agent.md` - Especialista frontend (neutro de stack): UI, estado, performance, a11y
- `eng.ux-designer.agent.md` - Especialista UX/UI: auditoria heurística, fluxos, microcopy, arquitetura de informação
- `eng.cybersecurity.agent.md` - Especialista em cybersecurity e AppSec (SENTINEL) — OWASP Top 10, secrets, supply chain, incident response

### Data (Ativo)
- `data/eng.data-engineer.agent.md` - Engenharia de dados: pipelines, contratos, qualidade (HEPHAESTUS)

### QA (Ativos)
- `eng.qa.test-planner.md` - Planejamento de testes
- `eng.qa.testing-engineer.md` - Implementacao de testes
- `eng.qa.test-architect.md` - Arquitetura de testes
- `eng.qa.quality-champion-task-agent.md` - Qualidade de tickets
- `eng.qa.cypress-specialist.md` - Page Objects, Custom Commands, CI, debugging de testes flaky
- `eng.qa.quality-strategist.md` - Priorização de esforço QA, risco de feature, distribuição QA/dev

### Produto (Ativo)
- `prod.pm-checker.md` - Validacao de requisitos
- `prod.discovery-interviewer.md` - Entrevistador de discovery: investiga uma ideia sem chutar e gera um rascunho estruturado

### Arquivados
Disponiveis em `$IDE/agents/archive/` organizados por categoria.
Uso especializado quando necessário.

**Categorias:**
- Product WIP (5): prod.wip.collect, prod.wip.refine, prod.wip.spec.breakdown, etc.

📖 **Ver detalhes:** `agents/archive/README.md` para lista completa e instruções de ativação.

---

## 9) Referencias Rapidas

- `.windsurfrules` - Regras globais
- `$IDE/README.md` - Documentacao completa
- `$IDE/JARVIS.md` - Guia de uso
- `$IDE/agents/README.md` - Lista de agentes
- `$IDE/workflows/README.md` - Lista de workflows
- `$IDE/skills/AGENTS.md` - Skills disponiveis
- `$IDE/rules/engineering/` - Regras de engenharia
- `$IDE/rules/product/` - Regras de produto

---

## 10) O Que Este Repo NAO Fornece

- Comandos reais de build/lint/test para um app especifico.
- Convencoes de codigo de um produto especifico.
- Logica de negocio ou implementacao de features.

Se o usuario pedir comandos especificos, solicite o projeto alvo ou arquivos de config.

---

**Última atualização**: 2026-04-26
