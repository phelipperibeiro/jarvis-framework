# AGENTS.md - Pasta skills/

Instrucoes especificas para agentes de IA que manipulam a pasta de skills.

---

## Proposito desta Pasta

A pasta `skills/` contem **playbooks executaveis** que sao a fonte de verdade operacional do framework. Skills definem o "como fazer" de forma detalhada e passo a passo.

---

## Estrutura

```
skills/
├── eng-backend-arch-c4/          # Diagramas C4
│   ├── SKILL.md
│   └── assets/
├── eng-global-docs-write/       # Escrita de documentacao
│   └── SKILL.md
├── eng-global-pr/               # Criacao de Pull/Merge Requests (GitLab/GitHub/Bitbucket)
│   └── SKILL.md
├── eng-global-task-comment/     # Comentário no card (Jira/Linear/GitHub Issues/Asana)
│   └── SKILL.md
├── eng-global-jira-comment/     # Alias → eng-global-task-comment
│   └── SKILL.md
├── jarvis-list-specializations/ # Lista especializações de stack instaladas e registradas
│   └── SKILL.md
├── jarvis-create-specialization/ # Cria uma especialização de stack (backend/frontend) a partir do código do projeto e a registra na lista
│   ├── SKILL.md
│   └── assets/
├── eng-backend/          # Base neutra de backend (APIs, auth, workers, dados); especializações por stack se somam a ele
│   └── SKILL.md
├── eng-frontend/         # Base neutra de frontend (componentes, estado, performance UI, acessibilidade); especializações se somam a ele
│   └── SKILL.md
├── eng-frontend-microfrontend/    # Module Federation, shell/remote, contratos de interface, event bus
│   └── SKILL.md
├── eng-frontend-design-system/    # Tokens semânticos, CVA, Storybook, versionamento, auditoria visual
│   └── SKILL.md
├── eng-backend-nestjs/           # Framework NestJS: módulos, DI, guards, interceptors, pipes, Passport/JWT
│   └── SKILL.md
├── eng-backend-rabbitmq/         # Mensageria RabbitMQ (HTTP API, codigo, arquitetura, troubleshooting)
│   └── SKILL.md
├── eng-security-cybersecurity/    # Segurança de aplicações: OWASP Top 10, secrets, supply chain, headers, SAST, compliance
│   └── SKILL.md
├── eng-backend-microservices-trace/ # Rastreamento de bugs entre serviços (HTTP + AMQP); especialização de backend
│   └── SKILL.md
├── eng-security-threat-model/ # Threat model estruturado do projeto (bootstrap/entrevista)
│   └── SKILL.md
├── eng-security-triage/ # Deduplicar, verificar e rankear achados de segurança
│   └── SKILL.md
├── eng-security-patch/ # Diffs candidatos para achados de segurança confirmados
│   └── SKILL.md
├── eng-devops-performance-engineer/ # Performance: baseline, SLIs/SLOs, load tests
│   └── SKILL.md
├── eng-ai-engineer/ # Features com LLM, RAG, agentes, embeddings
│   └── SKILL.md
├── eng-global-browser-extension-builder/ # Extensões de navegador (Manifest V3)
│   └── SKILL.md
├── eng-data-engineer/ # Pipelines ETL/ELT, camadas bronze/silver/gold, contratos de dados
│   └── SKILL.md
├── eng-data-bi/ # Dashboards BI e queries analíticas
│   └── SKILL.md
├── eng-data-debug/ # Diagnóstico de falhas em pipelines por camada
│   └── SKILL.md
├── eng-data-onboard/ # Onboarding de fonte nova de dados
│   └── SKILL.md
├── eng-data-orchestrator/ # DAGs, retries e alertas de orquestração
│   └── SKILL.md
├── eng-qa-bug-report/ # Bug reports de QA
│   └── SKILL.md
├── product-specs/ # Porta de entrada de especificação de produto
│   └── SKILL.md
├── product-specs-update/ # Sincroniza especificações de produto
│   └── SKILL.md
├── product-roadmap-report/ # Relatório de status do roadmap
│   └── SKILL.md
├── eng-scraper/          # Web scraping com Puppeteer, Cheerio, anti-bot, pipelines ETL
│   └── SKILL.md
├── eng-scraper-robot-builder/ # Converte fluxo manual (linguagem natural) em robô Playwright via Stagehand
│   └── SKILL.md
├── jarvis-docs-index/           # Indexacao de documentos
│   └── SKILL.md
├── jarvis-init/         # Inicializacao do framework (/jarvis-init)
│   ├── SKILL.md
│   └── assets/
├── eng-qa-gate/              # Quality gate validation
│   ├── SKILL.md
│   └── assets/
├── eng-qa-test-plan/         # Planejamento de testes
│   ├── SKILL.md
│   └── assets/
├── eng-qa-testsprite/        # Testes automatizados
│   ├── SKILL.md
│   └── assets/
├── eng-qa-e2e/               # Testes E2E em linguagem natural com Stagehand, exportação Cypress
│   └── SKILL.md
├── eng-qa-cypress-e2e/       # Testes E2E Cypress + TypeScript (Page Objects, data-testid, intercept)
│   └── SKILL.md
├── eng-qa-exploratory/       # Sessões de teste exploratório estruturadas (charter, risco, achados)
│   └── SKILL.md
├── eng-qa-dev-guide/         # Orienta devs a escreverem seus próprios testes Cypress
│   └── SKILL.md
├── eng-qa-a11y-audit/        # Testes de acessibilidade WCAG 2.1 AA via jest-axe em testes unitários existentes
│   └── SKILL.md
├── eng-qa-graphql-contract/  # Testes de contrato GraphQL: queries frontend vs schema do BFF
│   └── SKILL.md
├── eng-qa-e2e-spec-writer/   # Gera spec E2E de handoff (doc, não código): cenários, Page Objects, fixtures
│   └── SKILL.md
├── eng-qa-quality-report/    # Consolida sessões, bugs e quality gates e gera relatório de qualidade por período
│   └── SKILL.md
├── eng-qa-unit-test/         # Testes unitarios
│   └── SKILL.md
├── jarvis-report-issue/         # Reportar bug no próprio Jarvis (JARVIS_PROJECT)
│   └── SKILL.md
├── jarvis-context-detect/       # Detecta contexto do projeto/tarefa
│   └── SKILL.md
└── jarvis-docs-central/         # Sync/publish docs no central-docs (GitLab/GitHub/Bitbucket)
    └── SKILL.md
```

> Pastas listadas acima refletem skills com `SKILL.md` neste repo. Não invente `skill-creator` / `taxonomy-manager` / `members-manager` se a pasta não existir.

---

## Estrutura de um Skill

Cada skill vive em sua propria pasta:

```
skills/{nome-do-skill}/
├── SKILL.md              # Obrigatorio - arquivo principal
├── assets/               # Opcional - schemas, templates
│   ├── schema.json
│   └── template.md
└── references/           # Opcional - docs locais
│   └── docs.md
└── commands/             # Opcional - Comandos ou workflows usados pela skills
    └── command-name.md
```

---

## Frontmatter Obrigatorio

Todo SKILL.md deve comecar com frontmatter YAML:

```yaml
---
name: nome-do-skill
description: >
  O que faz + Trigger de quando usar.
argument-hint: "[argumentos]"
disable-model-invocation: false
allowed-tools: Read Edit Write Glob Grep Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: backend        # obrigatório: área do skill (ver "Áreas e nomes")
  stack: golang        # só em especializações de backend/frontend
---
```

> **`metadata.area` é obrigatório.** Um skill instalado sem área reconhecida faz os comandos `eng.*` serem bloqueados (ver `rules/engineering/eng.skills-rules.md`).

---

## Áreas e nomes

### Áreas reconhecidas (`metadata.area`)

| Área | O que cobre |
|------|-------------|
| `backend` | APIs, autenticação, workers, mensageria, banco de dados |
| `frontend` | Componentes, estado, estilos, performance de UI, acessibilidade |
| `qa` | Testes, quality gates, relatórios de qualidade |
| `data` | Pipelines, qualidade e contratos de dados |
| `ai` | Features com modelos de IA |
| `security` | Segurança de aplicações |
| `scraper` | Scraping e automação de robôs |
| `devops` | Performance, infraestrutura, entrega |
| `global` | Skills transversais de engenharia e do próprio framework |
| `product` | Especificação de produto |

Skill sem `metadata.area`, ou com área fora desta lista, é tratado como **sem área** (`unknown`) e bloqueia os comandos `eng.*`.

### Nome do skill

O nome tem a forma `<prefixo>-<área>-<nome>`; **só os dois primeiros segmentos importam** para a regra, o resto é livre.

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Engenharia por área | `eng-<área>-<nome>` | `eng-qa-gate`, `eng-data-engineer`, `eng-security-cybersecurity` |
| Skill base de backend/frontend | `eng-backend`, `eng-frontend` | — |
| Especialização de stack | `eng-<backend\|frontend>-<stack>` | `eng-backend-nestjs`, `eng-frontend-design-system` |
| Engenharia global | `eng-global-<nome>` | `eng-global-pr`, `eng-global-docs-write` |
| Produto | `product-<nome>` | `product-specs`, `product-specs-update` |
| Transversal do framework | `jarvis-<nome>` (`area: global`) | `jarvis-init`, `jarvis-docs-central` |

### Skill base, especialização e `stack`

- **Base:** `area: backend` ou `frontend`, **sem** `stack`. É sempre carregado pela regra `eng.specializations-rules.md`.
- **Especialização:** `area: backend` ou `frontend`, **com** `metadata.stack` (o sufixo do nome). Só é carregada quando o projeto a registra em `BACKEND_SPECIALIZATIONS` ou `FRONTEND_SPECIALIZATIONS` no `ENV.md`.
- Demais áreas não têm lista e não usam `stack`.

---

## Secoes Obrigatorias de um SKILL.md

1. **Frontmatter** - Metadados YAML
2. **Objetivo** - O que o skill faz
3. **Entrada** - Argumentos e inputs
4. **Recursos** - Templates, schemas, referencias
5. **Pre-requisito** - Validacoes antes de executar
6. **Quando Usar** - Cenarios de uso
7. **Padroes Criticos** - Regras mais importantes
8. **Fluxo de Trabalho** - Passo a passo
9. **Regras** - Nunca/Sempre
10. **Checklist de Conclusao** - Validacao final
11. **Output** - Artefatos gerados
12. **Mensagem de Conclusao** - Feedback ao usuario

---

## Diferenca entre Skills e Agents

| Aspecto | Skills | Agents |
|---------|--------|--------|
| Define | Playbook executavel | Persona e postura |
| Foco | Como executar | Quem executa |
| Detalhe | Passo a passo | Alto nivel |
| Fonte de verdade | Operacional | Comportamento |

**Regra**: Skills tem precedencia para detalhes operacionais.

---

## Invocação por IDE

Skills são invocados de formas diferentes dependendo da IDE:

| IDE | Invocação |
|-----|-----------|
| Claude Code, Cursor, OpenCode | `/nome-do-skill` (slash command) |
| Windsurf | `/nome-do-skill` (slash command) |
| **Codex (OpenAI)** | Linguagem natural ou painel TUI de skills — **sem slash commands** |
| Gemini CLI | `@nome-do-skill` ou linguagem natural |

> **Codex**: Skills ficam em `.codex/skills/` com `SKILL.md` + `openai.yaml` gerado
> automaticamente pelo `jarvis init`. O Codex descobre os skills pelo `openai.yaml`
> e os exibe no painel TUI. Para invocar, diga o que quer fazer — o Codex seleciona
> o skill adequado ou você indica pelo nome: _"use o skill eng-backend"_.

---

## Mapeamento Comando → Skill

| Comando / Trigger | Skill |
|-------------------|-------|
| `/jarvis-init` | `jarvis-init` |
| `/eng.docs` | `eng-global-docs-write`, `jarvis-docs-index` |
| `/eng.pre-pr` | `eng-qa-test-plan` |
| `/eng.pr` | `eng-global-pr` |
| QA validation | `eng-qa-gate` |
| Criar skill | `skill-creator` |
| `/taxonomy-manager` | `taxonomy-manager` |
| Listar especializações de stack (instaladas e registradas) | `jarvis-list-specializations` |
| Criar uma especialização de stack (backend ou frontend) a partir do código do projeto | `jarvis-create-specialization` |
| `/members-manager` | `members-manager` |
| Mensageria, filas, RabbitMQ, events, consumers, producers | `eng-backend-rabbitmq` (especialização de backend: registrar em `BACKEND_SPECIALIZATIONS`) |
| APIs, auth, workers, filas, caching, banco de dados | `eng-backend` (base) + `BACKEND_SPECIALIZATIONS` |
| Componentes, UI, estado, estilos, performance, acessibilidade | `eng-frontend` (base) + `FRONTEND_SPECIALIZATIONS` |
| Micro frontend, Module Federation, shell/remote, contratos de interface | `eng-frontend-microfrontend` (especialização de frontend) |
| Design system, tokens, CVA, Storybook, versionamento de componentes | `eng-frontend-design-system` (especialização de frontend) |
| Módulos NestJS, DI, guards, interceptors, pipes, Passport/JWT | `eng-backend-nestjs` (especialização de backend) |
| Web scraping, Puppeteer, extração de dados, parsing, ETL | `eng-scraper` |
| Criar robô RPA novo ou manter existente (new|update + card) | `eng.rpa.robot` (workflow) |
| Gerar specs Cypress + TypeScript para fluxos de usuário | `eng-qa-cypress-e2e` |
| Sessão de teste exploratório estruturada (charter, risco, achados, bug cards) | `eng-qa-exploratory` |
| Orientar dev sobre cobertura Cypress sem escrever o teste | `eng-qa-dev-guide` |
| Consolidar sessões exploratórias, bugs e quality gates e gerar relatório de qualidade por sprint/release | `eng-qa-quality-report` |
| Testes de acessibilidade WCAG 2.1 AA: integra jest-axe em testes unitários existentes | `eng-qa-a11y-audit` |
| Testes de contrato GraphQL: valida queries frontend contra schema do BFF | `eng-qa-graphql-contract` |
| Spec E2E para handoff: cenários priorizados, Page Objects, fixtures, intercepts, setup | `eng-qa-e2e-spec-writer` |
| Segurança de aplicações: OWASP Top 10, secrets, sanitização, headers, supply chain, compliance | `eng-security-cybersecurity` |

---

## Criando um Novo Skill

Use o skill-creator:

```bash
/skill-creator meu-novo-skill
```

Ou manualmente:

1. Escolher a **área** e o nome no padrão `<prefixo>-<área>-<nome>` (ver "Áreas e nomes")
2. Criar pasta: `skills/{nome}/`
3. Copiar template: `skills/skill-creator/assets/SKILL-template.md`
4. Preencher todos os placeholders, **inclusive `metadata.area`** (e `metadata.stack` se for especialização)
5. Validar estrutura: `name` igual ao nome da pasta e área reconhecida

---

## Regras

### Nunca

- Criar skill sem frontmatter completo ou sem `metadata.area`
- Duplicar skill existente
- Colocar detalhes de persona (isso vai no agent)
- Usar URLs web em references (use caminhos locais)
- Omitir secao "Quando Usar" ou "Padroes Criticos"
- Remover acentos do portugues

### Sempre

- Verificar se skill ja existe antes de criar
- Seguir convencoes de nomenclatura
- Incluir todas as secoes obrigatorias
- Documentar padroes criticos primeiro
- Manter exemplos de codigo minimos e focados
- Usar portugues correto com acentos

---

## assets/ vs references/

```
Precisa de templates de codigo?    → templates/{skill}-template.md
Precisa de schemas JSON?           → assets/
Precisa de configs de exemplo?     → assets/
Link para docs existentes?         → references/
```

**Regra**: `references/` deve apontar para arquivos LOCAIS, nao URLs web.

---

## Referencias

- `skill-creator/SKILL.md` - Skill para criar skills
- `skill-creator/assets/SKILL-template.md` - Template padrao
- `../agents/` - Agentes que usam skills
- `../workflows/` - Workflows relacionados
- `../rules/` - Regras que skills implementam

---

**Ultima atualizacao**: 2026-03-10