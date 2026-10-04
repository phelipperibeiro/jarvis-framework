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

### `eng-scraper` ✅
- **Trigger**: web scraping, extração de dados, automação de browser, parsing HTML/XML
- **Escopo**: Puppeteer, Cheerio, anti-bot, rate limiting, pipelines ETL light
- **Status**: `criado`

### `eng-scraper-robot-builder` ✅
- **Trigger**: converter fluxo manual em robô Playwright via Stagehand
- **Escopo**: exploração com `act()`/`observe()`, geração de script Playwright TypeScript
- **Status**: `criado`

### `eng-frontend-design-system` ✅
- **Trigger**: tokens, CVA, Storybook, versionamento de componentes, auditoria visual
- **Escopo**: design tokens, variantes com `cva`, componentes reutilizáveis, changelog de UI
- **Status**: `criado`

### `eng-frontend-microfrontend` ✅
- **Trigger**: Module Federation, shell/remote, contratos de interface, event bus
- **Escopo**: Webpack MF, standalone/integrado, shared dependencies, versionamento
- **Status**: `criado`

### `eng-backend-rabbitmq` ✅
- **Trigger**: mensageria, filas, events, consumers, producers, DLX
- **Escopo**: RabbitMQ, `@golevelup/nestjs-rabbitmq`, retry, DLQ, idempotência
- **Status**: `criado`

### `eng-backend-microservices-trace` ✅
- **Trigger**: bug cross-service, rastreamento HTTP + AMQP
- **Escopo**: correlation ID, tracing distribuído, diagnóstico de falhas entre microsserviços
- **Status**: `criado`

### `eng-devops-performance-engineer` ✅
- **Trigger**: performance, latência, throughput, profiling, otimização
- **Escopo**: Core Web Vitals, bundle analysis, lazy loading, caching, memory leaks
- **Status**: `criado`

### `eng-backend-arch-c4` ✅
- **Trigger**: arquitetura C4, diagramas de contexto/container/componente
- **Escopo**: modelagem C4, documentação arquitetural, decisões de design
- **Status**: `criado`

### `eng-ai-engineer` ✅
- **Trigger**: IA aplicada, chatbots, agents, n8n, LLMs
- **Escopo**: integração de LLMs, prompts, RAG, automação com IA
- **Status**: `criado`

### `eng-global-browser-extension-builder` ✅
- **Trigger**: extensões de navegador, Chrome extensions, content scripts
- **Escopo**: manifest v3, background workers, content scripts, popup UI
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
- **Escopo**: Jira/Linear/GitHub/Asana via adapter; alias `eng-global-jira-comment`
- **Status**: `criado`

---

## Skills Criadas — Engenharia de Dados

### `eng-data-engineer` ✅
- **Trigger**: pipelines ETL/ELT, contratos de dados, qualidade
- **Escopo**: Glue, Airflow, PySpark, Athena, Metabase, bronze/silver/gold, Great Expectations
- **Status**: `criado`

### `eng-data-bi` ✅
- **Trigger**: dashboards BI, queries SQL analíticas
- **Escopo**: Metabase, queries analíticas, compartilhamento com squads
- **Status**: `criado`

### `eng-data-debug` ✅
- **Trigger**: diagnóstico de falhas em pipelines por camada
- **Escopo**: fonte → bronze → silver → gold, troubleshooting
- **Status**: `criado`

### `eng-data-onboard` ✅
- **Trigger**: onboarding de fonte nova
- **Escopo**: schema discovery, bronze, Expectation Suite, documentação
- **Status**: `criado`

### `eng-data-orchestrator` ✅
- **Trigger**: DAGs, retry strategies, alertas, troubleshooting de orquestração
- **Escopo**: Airflow, Glue scheduler, monitoramento
- **Status**: `criado`

---

## Skills Criadas — QA

### `eng-qa-gate` ✅
- **Trigger**: quality gate validation
- **Escopo**: critérios de aceite, bloqueio/aprovação de entrega
- **Status**: `criado`

### `eng-qa-test-plan` ✅
- **Trigger**: planejamento de testes
- **Escopo**: estratégia de testes, cobertura, priorização
- **Status**: `criado`

### `eng-qa-unit-test` ✅
- **Trigger**: testes unitários
- **Escopo**: Jest, Vitest, Testing Library, mocks, assertions
- **Status**: `criado`

### `eng-qa-e2e` ✅
- **Trigger**: testes E2E em linguagem natural, regressão de UI
- **Escopo**: Stagehand `act()`/`extract()`/`observe()`, exportação Cypress
- **Status**: `criado`

### `eng-qa-cypress-e2e` ✅
- **Trigger**: specs Cypress + TypeScript
- **Escopo**: Page Objects, `data-testid`, `cy.intercept`, fixtures, CI
- **Status**: `criado`

### `eng-qa-exploratory` ✅
- **Trigger**: sessões de teste exploratório
- **Escopo**: charter, roteiro de risco, achados, bug cards
- **Status**: `criado`

### `eng-qa-dev-guide` ✅
- **Trigger**: orientar dev sobre cobertura de testes
- **Escopo**: guia Cypress sem escrever código, Quality Champion
- **Status**: `criado`

### `eng-qa-bug-report` ✅
- **Trigger**: reporte de bugs
- **Escopo**: descrição, reprodução, impacto, classificação
- **Status**: `criado`

### `eng-qa-quality-report` ✅
- **Trigger**: relatório de qualidade por sprint/release
- **Escopo**: consolida sessões, bugs, quality gates
- **Status**: `criado`

### `eng-qa-testsprite` ✅
- **Trigger**: testes automatizados via TestSprite
- **Escopo**: geração automática de testes, integração MCP
- **Status**: `criado`

### `eng-qa-a11y-audit` ✅
- **Trigger**: testes de acessibilidade WCAG 2.1 AA
- **Escopo**: jest-axe em testes unitários existentes, report com fix sugerido
- **Status**: `criado` (v1.5.0)

### `eng-qa-graphql-contract` ✅
- **Trigger**: testes de contrato GraphQL frontend vs BFF
- **Escopo**: validar queries/mutations contra schema, cobertura reversa
- **Status**: `criado` (v1.5.0)

### `eng-qa-e2e-spec-writer` ✅
- **Trigger**: spec E2E para handoff (documentação, não código)
- **Escopo**: cenários priorizados, Page Objects, fixtures, intercepts, setup
- **Status**: `criado` (v1.5.0)

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

### `eng-infrastructure`
- **Trigger**: CI/CD, containers, cloud, IaC, observabilidade, deploy
- **Escopo**: Docker, Kubernetes, GitHub Actions, Terraform, AWS/GCP, logs/métricas/tracing
- **Status**: `planejado`

### `eng-security-cybersecurity` ✅
- **Trigger**: segurança de aplicação, OWASP, hardening, secrets, supply chain, compliance
- **Escopo**: OWASP Top 10, secrets management, sanitização, headers de segurança, SAST, supply chain, LGPD/GDPR
- **Status**: `criado`

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
| 4 | `eng-scraper` | ✅ criado | Puppeteer como primário, ETL pipelines NestJS |
| 6 | `eng-frontend-design-system` | ✅ criado | Tokens, CVA, Storybook, versionamento |
| 7 | `eng-frontend-microfrontend` | ✅ criado | Module Federation, shell/remote |
| 8 | `eng-database` | planejado | Área densa com muitos anti-patterns críticos |
| 9 | `eng-security-cybersecurity` | ✅ criado | Transversal — impacta todas as outras áreas |
| 10 | `eng-infrastructure` | planejado | Necessário para squads com CI/CD próprio |
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
| Engenharia | 18 | 8 |
| Engenharia de Dados | 5 | 0 |
| QA | 13 | 0 |
| Produto | 4 | 0 |
| Daily Ritual | 6 | 0 |
| Utilitários | 8 | 0 |
| **Total** | **54** | **8** |

---

**Última atualização**: 2026-05-30
