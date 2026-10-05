# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/) (ver `rules/engineering/eng.bump-rules.md`).

> Versões anteriores a `2.1.1` não foram documentadas retroativamente neste changelog — o histórico detalhado dessas versões continua disponível via `git log`.

## [3.0.0] - 2026-10-05

### Added
- Estendido o mecanismo de especialização opt-in (skill base sempre carregada + especializações registradas no `ENV.md`) para as áreas `qa`, `data`, `automation` e `platform`, no mesmo padrão já usado por `backend`/`frontend` (`QA_SPECIALIZATIONS`, `DATA_SPECIALIZATIONS`, `AUTOMATION_SPECIALIZATIONS`, `PLATFORM_SPECIALIZATIONS`) — issue [#63](https://github.com/phelipperibeiro/jarvis-framework/issues/63)
- Criadas as skills base `eng-qa`, `eng-data`, `eng-ai` e `eng-platform`, todas no padrão de `eng-backend` (SKILL.md + `references/` por tema, agnósticas de ferramenta/provedor)
- `/jarvis-init` (Passo 9) e `/jarvis-list-specializations` passam a listar e registrar especializações das 6 áreas (qa/data/automation/platform ficam restritas a listar + registrar — sem detecção por código nem criação, que continuam exclusivas de backend/frontend)
- Adicionados 3 temas novos ao `eng-platform`: Profiling e Diagnóstico de Performance, Testes de Carga e Chaos Engineering, Cache Multi-Camada
- Adicionados 2 temas novos ao `eng-frontend`: Design System e Tokens, Arquitetura de Micro Frontend
- `QA_SPECIALIZATIONS` vem pré-registrada com `eng-qa-planner` por padrão no `ENV-template.md` (única especialização de QA hoje, útil pra quase todo projeto)

### Changed
- Gates/recomendações antes incondicionais de `eng.pre-pr.md`, `eng.pr.md` e `eng.review.md` (ex: `eng-qa-planner`) agora checam a especialização registrada antes de rodar — a skill base de cada área continua sempre disponível
- Toda citação de skill base em workflow/agente passa a vir acompanhada da variável de especialização correspondente (`eng-qa` + `QA_SPECIALIZATIONS`, etc.)

### Removed
- Descontinuada a área `security`: skills `eng-security-cybersecurity`, `eng-security-threat-model`, `eng-security-triage`, `eng-security-patch`, os workflows `eng.security-review/incident/audit/pipeline` e o agente `eng.cybersecurity.agent` (SENTINEL) — segurança de código de aplicação já é padrão embutido em `eng-backend`/`eng-frontend`; segurança de infraestrutura e fundamentos de segurança da informação entraram no `eng-platform`
- Consolidados os skills de QA (`eng-qa-test-plan`, `eng-qa-gate`, `eng-qa-cypress-e2e`, `eng-qa-exploratory`, `eng-qa-dev-guide`, `eng-qa-bug-report`, `eng-qa-quality-report`, `eng-qa-testsprite`, `eng-qa-a11y-audit`, `eng-qa-graphql-contract`, `eng-qa-e2e-spec-writer`) na base `eng-qa` + a especialização `eng-qa-planner`
- Consolidados os skills de Data (`eng-data-engineer`, `eng-data-bi`, `eng-data-debug`, `eng-data-onboard`, `eng-data-orchestrator`) na base `eng-data`
- Removidos `eng-devops-performance-engineer` (absorvido pelo `eng-platform`), `eng-frontend-design-system`/`eng-frontend-microfrontend` (princípios agnósticos absorvidos pelo `eng-frontend`), `eng-automation-robot-builder` e `eng-global-browser-extension-builder`
- Removidos os 5 workflows de QA que só orquestravam os skills descontinuados (`eng.qa-dev-quality-guide`, `eng.qa-e2e-test-generation`, `eng.qa-exploratory-session`, `eng.qa-quality-gate-validation`, `eng.qa-quality-report`)
- Resumo de 3 linhas de cada skill removido em `skills/*-skills-deleted.md` (por área)
- `OBSOLETE_PATHS` em `bin/lib/config/constants.js` atualizado com todos os caminhos acima, para instalações existentes limparem no próximo `jarvis init`

## [2.1.1] - 2026-10-04

### Fixed
- Removido o último resíduo textual do nome antigo do projeto ("spoiler-framework") em `CONTRIBUTING.md`
- Generalizados exemplos de domínio de negócio vazados do fork original (robô de multas/DETRAN, domínio "drivers"/condutores) em regras, skills e um agent

### Removed
- Removida a skill `eng-global-jira-comment` (alias morto, já substituído por `eng-global-task-comment`)
- Removido o agent `eng.qa.cypress-specialist.md` (conteúdo único migrado para `eng.qa.testing-engineer.md` antes da remoção)
- Removidas todas as referências a `agents/archive/`, uma biblioteca de 9 agentes que nunca existiu no repositório, incluindo nomes de agentes fictícios usados como exemplo em `AGENTS.md`, `agents/AGENTS.md` e `agents/README.md`

### Changed
- Consolidada a tabela "Comando → Skill", antes duplicada quase 1:1 entre `AGENTS.md` (raiz) e `skills/AGENTS.md`, em um único lugar (`skills/AGENTS.md`)
- Consolidada a lista de agentes disponíveis em `AGENTS.md` para uma referência a `agents/README.md`
- Consolidada a instrução `DOMAIN:` em `taxonomy.md`, antes repetida 3 vezes
- Renomeado `templates/CDD aplicado a Prompts.md` → `templates/cdd-aplicado-a-prompts.md` (kebab-case, consistente com o resto de `templates/`)
- Corrigida `rules/engineering/eng.bump-rules.md` para referenciar `package.json`/`npm` (Node.js) em vez de `pyproject.toml`/`uv` (Python)
- Contagens de agentes reconciliadas em todos os arquivos de catálogo (16 agentes ativos)
