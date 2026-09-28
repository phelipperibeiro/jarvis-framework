# AGENTS.md - Pasta skills/

Instrucoes especificas para agentes de IA que manipulam a pasta de skills.

---

## Proposito desta Pasta

A pasta `skills/` contem **playbooks executaveis** que sao a fonte de verdade operacional do framework. Skills definem o "como fazer" de forma detalhada e passo a passo.

---

## Estrutura

```
skills/
├── eng-arch-c4/          # Diagramas C4
│   ├── SKILL.md
│   └── assets/
├── eng-docs-write/       # Escrita de documentacao
│   └── SKILL.md
├── eng-pr/               # Criacao de Pull/Merge Requests (GitLab/GitHub/Bitbucket)
│   └── SKILL.md
├── eng-task-comment/     # Comentário no card (Jira/Linear/GitHub Issues/Asana)
│   └── SKILL.md
├── eng-jira-comment/     # Alias → eng-task-comment
│   └── SKILL.md
├── eng-backend/          # APIs REST/GraphQL, auth JWT/OAuth2/RBAC, RabbitMQ workers, caching
│   └── SKILL.md
├── eng-frontend/         # React/Next.js/Vue, estado, performance UI, acessibilidade
│   └── SKILL.md
├── eng-microfrontend/    # Module Federation, shell/remote, contratos de interface, event bus
│   └── SKILL.md
├── eng-design-system/    # Tokens semânticos, CVA, Storybook, versionamento, auditoria visual
│   └── SKILL.md
├── eng-nestjs/           # Framework NestJS: módulos, DI, guards, interceptors, pipes, Passport/JWT
│   └── SKILL.md
├── eng-rabbitmq/         # Mensageria RabbitMQ (HTTP API, codigo, arquitetura, troubleshooting)
│   └── SKILL.md
├── eng-cybersecurity/    # Segurança de aplicações: OWASP Top 10, secrets, supply chain, headers, SAST, compliance
│   └── SKILL.md
├── churn-audit/          # Análise de churn SaaS por squad com relatório narrativo via $MESSAGE_COMUNICATOR
│   └── SKILL.md
├── eng-scraper/          # Web scraping com Puppeteer, Cheerio, anti-bot, pipelines ETL
│   └── SKILL.md
├── eng-scraper-robot-builder/ # Converte fluxo manual (linguagem natural) em robô Playwright via Stagehand
│   └── SKILL.md
├── eng-tech-analyst/          # Triagem de chamados do HUBS board: keywords, sub-bug linking, frequência via comentários no card, encaminhamento para squad
│   └── SKILL.md
├── lovable-prompt-generator/ # Geracao de prompts para frontend React via Lovable
│   └── SKILL.md
├── docs-index/           # Indexacao de documentos
│   └── SKILL.md
├── init-jarvis/         # Inicializacao do framework (/init-jarvis)
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
├── report-issue/         # Reportar bug no próprio Jarvis (JARVIS_PROJECT)
│   └── SKILL.md
├── context-detect/       # Detecta contexto do projeto/tarefa
│   └── SKILL.md
└── docs-central/         # Sync/publish docs no central-docs (GitLab/GitHub/Bitbucket)
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
---
```

---

## Convencoes de Nomenclatura

| Domínio | Prefixo | Exemplos |
|---------|---------|----------|
| Engenharia | `eng-` | `eng-docs-write`, `eng-pr`, `eng-arch-c4` |
| Produto | `prod-` | `prod-prd`, `prod-frd`, `prod-epic` |
| QA | `qa-` | `eng-qa-gate`, `eng-qa-test-plan`, `eng-qa-unit-test` |
| Geral / utilitário | _(sem prefixo)_ | `skill-creator`, `docs-index`, `init-jarvis` |

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
| `/init-jarvis` | `init` |
| `/eng.docs` | `eng-docs-write`, `docs-index` |
| `/eng.pre-pr` | `eng-qa-test-plan` |
| `/eng.pr` | `eng-pr` |
| QA validation | `eng-qa-gate` |
| Criar skill | `skill-creator` |
| `/taxonomy-manager` | `taxonomy-manager` |
| `/members-manager` | `members-manager` |
| Mensageria, filas, RabbitMQ, events, consumers, producers | `eng-rabbitmq` |
| Gerar prompt para Lovable, criar frontend React com Lovable | `lovable-prompt-generator` |
| APIs REST/GraphQL, auth, workers, RabbitMQ, caching | `eng-backend` |
| Componentes, UI, estado, SSR/SSG, performance, acessibilidade | `eng-frontend` |
| Micro frontend, Module Federation, shell/remote, contratos de interface | `eng-microfrontend` |
| Design system, tokens, CVA, Storybook, versionamento de componentes | `eng-design-system` |
| Módulos NestJS, DI, guards, interceptors, pipes, Passport/JWT | `eng-nestjs` |
| Web scraping, Puppeteer, extração de dados, parsing, ETL | `eng-scraper` |
| Criar robô RPA novo ou manter existente (new|update + card) | `eng.rpa.robot` (workflow) |
| Atendimento técnico, triagem de chamados, diagnóstico, classificação de bugs, escalonamento | `eng-tech-analyst` |
| Gerar specs Cypress + TypeScript para fluxos de usuário | `eng-qa-cypress-e2e` |
| Sessão de teste exploratório estruturada (charter, risco, achados, bug cards) | `eng-qa-exploratory` |
| Orientar dev sobre cobertura Cypress sem escrever o teste | `eng-qa-dev-guide` |
| Consolidar sessões exploratórias, bugs e quality gates e gerar relatório de qualidade por sprint/release | `eng-qa-quality-report` |
| Análise de churn SaaS: coleta Slack, classificação por squad via taxonomy, relatório narrativo | `churn-audit` |
| Testes de acessibilidade WCAG 2.1 AA: integra jest-axe em testes unitários existentes | `eng-qa-a11y-audit` |
| Testes de contrato GraphQL: valida queries frontend contra schema do BFF | `eng-qa-graphql-contract` |
| Spec E2E para handoff: cenários priorizados, Page Objects, fixtures, intercepts, setup | `eng-qa-e2e-spec-writer` |
| Segurança de aplicações: OWASP Top 10, secrets, sanitização, headers, supply chain, compliance | `eng-cybersecurity` |

---

## Criando um Novo Skill

Use o skill-creator:

```bash
/skill-creator meu-novo-skill
```

Ou manualmente:

1. Criar pasta: `skills/{nome}/`
2. Copiar template: `skills/skill-creator/assets/SKILL-template.md`
3. Preencher todos os placeholders
4. Validar estrutura

---

## Regras

### Nunca

- Criar skill sem frontmatter completo
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