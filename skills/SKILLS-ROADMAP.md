# Skills Roadmap

Skills existentes e planejadas do framework Jarvis.

---

## Skills Criadas — Engenharia

### `eng-frontend` ✅
- **Trigger**: componentes, estado, bundle, performance de UI, acessibilidade, SSR/SSG
- **Escopo**: React 19, Next.js 15 App Router, Tailwind, Zustand, Core Web Vitals, Blade/Laravel
- **Status**: `criado`

### `eng-backend` ✅
- **Trigger**: APIs REST/GraphQL, autenticação, workers, jobs, integrações externas, caching
- **Escopo**: NestJS, JWT/OAuth2/RBAC, RabbitMQ, Redis, webhooks, circuit breaker
- **Status**: `criado`

### `eng-backend-nestjs` ✅
- **Trigger**: framework NestJS — DI, guards, interceptors, pipes, Passport/JWT, circular deps
- **Escopo**: módulos, providers, middleware, ConfigModule, testes com `Test.createTestingModule`
- **Status**: `criado`

### `eng-automation` ✅
- **Trigger**: RPA, web scraping, automação de browser, automação de APIs, extração e ingestão de dados
- **Escopo**: base neutra de automação (16 temas: fundamentos, aquisição, navegador, scraping/crawling, APIs, webhooks, RPA, extração estruturada/documentos, ingestão, anti-bot, rate limiting, agendamento, retentativa, credenciais, observabilidade) — especializações em `AUTOMATION_SPECIALIZATIONS` se somam a ela
- **Status**: `criado`

> `eng-automation-robot-builder` (conversão de fluxo manual em robô Playwright via Stagehand) foi
> removido em 2026-10-05 — resumo em `skills/automation-skills-deleted.md`.

> `eng-frontend-design-system` e `eng-frontend-microfrontend` foram removidos em 2026-10-05 — os
> princípios agnósticos (tokens semânticos, contrato de props, shell/remote, dependência singleton)
> entraram na base `eng-frontend` (temas 13 e 14). Resumo em `skills/frontend-skills-deleted.md`.

### `eng-backend-rabbitmq` ✅
- **Trigger**: mensageria, filas, events, consumers, producers, DLX
- **Escopo**: RabbitMQ, `@golevelup/nestjs-rabbitmq`, retry, DLQ, idempotência
- **Status**: `criado`

### `eng-backend-microservices-trace` ✅
- **Trigger**: bug cross-service, rastreamento HTTP + AMQP
- **Escopo**: correlation ID, tracing distribuído, diagnóstico de falhas entre microsserviços
- **Status**: `criado`

> `eng-devops-performance-engineer` (performance, profiling, load testing, caching) foi removido em
> 2026-10-05 — os temas de profiling, testes de carga/chaos engineering e cache multi-camada
> entraram no `eng-platform` (temas 14, 15, 16). Resumo em `skills/devops-skills-deleted.md`.

### `eng-backend-arch-c4` ✅
- **Trigger**: arquitetura C4, diagramas de contexto/container/componente
- **Escopo**: modelagem C4, documentação arquitetural, decisões de design
- **Status**: `criado`

### `eng-ai` ✅
- **Trigger**: IA aplicada, LLM, RAG, agentes, chatbots, ML, avaliação, MLOps
- **Escopo**: base neutra de IA (12 temas: fundamentos de ML, matemática/estatística, dados para IA, deep learning/fundacionais, LLMs/chatbots/agentes/RAG, avaliação/experimentação, engenharia de sistemas de IA, MLOps, produto de IA, arquitetura de soluções de IA, governança, segurança/IA responsável)
- **Status**: `criado`

### `eng-global-pr` ✅
- **Trigger**: criação de branch, commit, Merge Request
- **Escopo**: git flow, MR description, `eng-global-task-comment`, code review automation
- **Status**: `criado`

### `eng-global-docs-write` ✅
- **Trigger**: documentação técnica, ADRs, RFCs, tech specs
- **Escopo**: geração e atualização de docs de engenharia
- **Status**: `criado`

### `eng-global-task-comment` ✅
- **Trigger**: comentários técnicos em cards do task manager
- **Escopo**: Jira/Linear/GitHub/Asana via adapter
- **Status**: `criado`

---

## Skills Criadas — Engenharia de Dados

### `eng-data` ✅
- **Trigger**: pipelines ETL/ELT, modelagem, qualidade, BI/dashboards, governança, onboarding de fonte, orquestração
- **Escopo**: base neutra de dados (12 temas: fundamentos, modelagem, bancos de dados, arquitetura, pipelines/integração, qualidade, governança/metadados, estatística/análise, analytics/BI, ciência de dados, DataOps/plataforma, segurança/privacidade) — especializações em `DATA_SPECIALIZATIONS` se somam a ela
- **Status**: `criado`

> Os antigos `eng-data-engineer`, `eng-data-bi`, `eng-data-debug`, `eng-data-onboard` e
> `eng-data-orchestrator` foram removidos em 2026-10-05 — resumo em `skills/data-skills-deleted.md`.

---

## Skills Criadas — QA

### `eng-qa` ✅
- **Trigger**: estratégia de testes, design de casos, cobertura, automação, não funcionais, gestão de defeitos
- **Escopo**: base neutra de QA (15 temas: fundamentos, estratégia, design de casos, manual/exploratório, automação, API/contrato, interface/mobile, performance, confiabilidade, segurança, acessibilidade, dados de teste, gestão de defeitos, arquitetura de QA) — especializações em `QA_SPECIALIZATIONS` se somam a ela
- **Status**: `criado`

### `eng-qa-planner` ✅
- **Trigger**: planejamento de testes
- **Escopo**: análise de gaps de cobertura na branch atual, priorização — especialização de qa (registrar em `QA_SPECIALIZATIONS`)
- **Status**: `criado`

> Os demais skills de QA (gate, unit-test, e2e, cypress-e2e, exploratory, dev-guide, bug-report,
> quality-report, testsprite, a11y-audit, graphql-contract, e2e-spec-writer) foram removidos em
> 2026-10-05 — a área QA ficou só com a base (`eng-qa`) e a especialização de planejamento
> (`eng-qa-planner`), e outras especializações entram conforme a necessidade. Resumo de 3 linhas
> de cada um em `skills/qa-skills-deleted.md`.

---

## Skills Criadas — Produto

### `product-specs` ✅
- **Trigger**: pedido de especificação de produto (PRD, FRD, épico, história, discovery), inclusive em linguagem natural
- **Escopo**: skill fina, só porta de entrada: aponta para os workflows `prod.spec.*`, que são a fonte única de cada comando
- **Status**: `criado`

### `product-specs-update` ✅
- **Trigger**: atualização de specs existentes
- **Escopo**: revisão e evolução de requisitos
- **Status**: `criado`

### `product-roadmap-report` ✅
- **Trigger**: relatório de roadmap de produto
- **Status**: `criado`

---

## Skills — Daily Ritual

Removidas: `checkin`, `checkout`, `daily`, `task-log`, `send-priority`, `sent-priorities`, `my-priorities`.

---

## Skills Criadas — Utilitários / Framework

### `jarvis-init` ✅
- **Trigger**: inicialização do framework
- **Escopo**: criação de ENV.md, validação de MCPs, onboarding
- **Status**: `criado`

### `jarvis-report-issue` ✅
- **Trigger**: auto-report de bugs no framework Jarvis via GitLab API
- **Status**: `criado`

### `jarvis-docs-index` / `jarvis-docs-central` / `jarvis-context-detect` ✅
- **Trigger**: indexação de docs, sync com repo central, detecção de contexto
- **Status**: `criado`

---

## Skills Planejadas

### `eng-database`
- **Trigger**: queries, migrations, schema design, performance de banco, indexação
- **Escopo**: PostgreSQL, MySQL, Prisma, TypeORM, EXPLAIN ANALYZE, transações, NoSQL
- **Status**: `planejado`

### `eng-platform` ✅
- **Trigger**: CI/CD, containers, cloud, IaC, observabilidade, SRE, segurança de infra, FinOps, deploy
- **Escopo**: base neutra de platform/infra (sistemas, redes, cloud, IaC, orquestração, CI/CD, observabilidade, confiabilidade, segurança de infra, resiliência, DevEx, custos) — unifica o que antes seria `eng-infrastructure` e a parte de infra de `devops`/`security`
- **Status**: `criado`

> A área `security` (skill base `eng-security-cybersecurity` + `eng-security-threat-model`,
> `eng-security-triage`, `eng-security-patch`) foi descontinuada em 2026-10-05. Segurança de código
> de aplicação já é padrão embutido em `eng-backend`/`eng-frontend`; segurança de infraestrutura e
> fundamentos de segurança da informação entram no `eng-platform` (temas 9 e 13) ou em uma
> especialização registrada em `PLATFORM_SPECIALIZATIONS`. Resumo de 3 linhas de cada skill
> removido em `skills/security-skills-deleted.md`.

### `eng-ui`
- **Trigger**: padrões de UI, layouts, responsividade, grids, animações
- **Status**: `planejado`

### `eng-ux`
- **Trigger**: UX research, heurísticas, fluxos de usuário, microcopy
- **Status**: `planejado`

### `eng-react`
- **Trigger**: React avançado isolado — hooks custom, concurrent features, suspense
- **Status**: `planejado`

### `eng-support`
- **Trigger**: suporte técnico, runbooks, escalonamento, SLA
- **Status**: `planejado`

### `eng-back-for-frontend`
- **Trigger**: BFF, agregação de APIs, GraphQL gateway, data loaders
- **Status**: `planejado`

### `eng-laravel`
- **Trigger**: Laravel, Blade, Eloquent, migrations PHP, artisan
- **Escopo**: coberto parcialmente por `eng-frontend` (contexto Blade)
- **Status**: `planejado`

---

## Prioridade Sugerida

| # | Skill | Status | Justificativa |
|---|-------|--------|--------------|
| 1 | `eng-frontend` | ✅ criado | Alta demanda, dois contextos (React + PHP/Blade) |
| 2 | `eng-backend` | ✅ criado | APIs, auth, workers RabbitMQ — core do produto |
| 3 | `eng-backend-nestjs` | ✅ criado | Framework principal — DI, guards, Passport/JWT |
| 4 | `eng-automation` | ✅ criado | Base neutra de RPA, web e automação de APIs |
| 8 | `eng-database` | planejado | Área densa com muitos anti-patterns críticos |
| 9 | `eng-platform` | ✅ criado | Base de platform/infra — CI/CD, cloud, IaC, observabilidade, SRE, segurança |
| 11 | `eng-back-for-frontend` | planejado | BFF, GraphQL gateway — demanda crescente |
| 12 | `eng-ui` | planejado | Nicho — criar sob demanda |
| 13 | `eng-ux` | planejado | Nicho — criar sob demanda |
| 14 | `eng-react` | planejado | Nicho — criar sob demanda |
| 15 | `eng-support` | planejado | Nicho — criar sob demanda |
| 16 | `eng-laravel` | planejado | Nicho — coberto parcialmente por eng-frontend |

---

## Resumo

| Categoria | Criados | Planejados |
|-----------|---------|------------|
| Engenharia | 12 | 7 |
| Engenharia de Dados | 1 | 0 |
| QA | 2 | 0 |
| Produto | 4 | 0 |
| Daily Ritual | 6 | 0 |
| Utilitários | 8 | 0 |
| **Total** | **33** | **7** |

---

**Última atualização**: 2026-10-05
