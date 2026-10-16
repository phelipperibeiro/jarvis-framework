# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/) (ver `rules/engineering/eng.bump-rules.md`).

> Versões anteriores a `2.1.1` não foram documentadas retroativamente neste changelog — o histórico detalhado dessas versões continua disponível via `git log`.

## [Unreleased]

### Added
- **Modo Developer-Guided nos comandos de produto** (#146): o `/jarvis-init` sempre pergunta o modo de condução (`PROD_MODE=product-led | developer-guided`, sem opção sugerida, inclusive no Upgrade quando a chave é nova). Com `developer-guided`, os 10 comandos de `workflows/product/` e o `eng.create-ard` leem a regra sob demanda `rules-on-demand/product/prod.guided-rules.md`: uma pergunta por vez, termo de PM sempre com explicação, opções `[Sim]/[Não]/[Explicar melhor]/[Dúvida]` (a dúvida usa o "Outro" de texto livre), mentoria entre artefatos e revisão ao fechar cada documento. O documento gerado é o mesmo nos dois modos
- **Frontmatter comentado** em todos os templates de produto e no de ARD: cada campo diz o que significa e lista todas as opções
- **`recommended_model: opus`** nos documentos de produto e no ARD; os comandos que criam ou editam documento avisam (sem bloquear) quando a sessão está em outro modelo
- Status `deprecated` (esteve em produção e foi descontinuado) na lista única de `rules/product/prod-rules.md`; `cancelled` passa a significar "cancelado antes de ser entregue"

### Changed
- `templates/engineering/ARD-template.md` ganhou frontmatter YAML (`status: proposed | in_progress | in_review | approved`, versão, datas, autor, relacionados); as linhas equivalentes saíram do bloco do corpo
- `prod-breakdown-template.md`: `last_updated` → `updated_at` e campo `status` novo; `prod-epic-template.md` e `prod-issue-template.md` usam a lista única de status
- `recommended_model` dos 11 workflows (10 de produto e `eng.create-ard`) passou a `opus` (o `prod.roadmap.preview` ganhou o campo)
- Upgrade do `jarvis-init`: numeração dos passos corrigida (havia dois "4." e dois "5.")

## [Unreleased]

### Added
- **Central docs por adaptador de armazenamento** (#143): `CENTRAL_DOCS_STORAGE` escolhe o adaptador e `CENTRAL_DOCS_LOCATION` diz onde ele guarda. Primeiro adaptador: `filesystem` (uma pasta do disco). Se a pasta tiver `.git` (clone de um repositório de documentação), o adaptador faz `git pull` antes de ler e branch + commit + push + Pull/Merge Request ao publicar (usando o `scripts/build-index.sh` do repositório, quando existir). Código em `bin/lib/docs/storage/` (`index.js`, `filesystem.js`, `build-index.js`); S3 e Google Drive ficam para #144 e #145
- `{SQUAD}/index.md` regenerado a partir do frontmatter a cada publicação (em vez de editado), no mesmo caminho lido pelo `docs sync`
- `jarvis docs publish`: tipos `feat`, `epic`, `story` e `task` (o `/prod.spec.epic` passa a publicar), `--produto` (padrão `WORKSPACE`) e o nome do arquivo local como nome no Central docs (`--feature` só para nome fora do padrão)
- `/jarvis-init`: pergunta "Onde fica a documentação central?" (pasta local, repositório git com `git clone`, ou não usar), com o local padrão por modo de trabalho (`./central-docs` no workspace; `docs/jarvis/central-docs` no projeto único) e o `.gitignore` correspondente; migração do `CENTRAL_DOCS_REPO` no Upgrade
- **Branch base perguntada**: `eng.start` e `eng.rpa.robot` perguntam de qual branch partir (`main`, `dev`, a atual ou outra) e gravam `Branch base:` no `architecture.md`; o `eng.pr` abre o PR para essa base

### Changed
- **Breaking:** `CENTRAL_DOCS_REPO` deu lugar a `CENTRAL_DOCS_STORAGE` + `CENTRAL_DOCS_LOCATION`. Com a variável antiga e sem a nova, os comandos `jarvis docs` pedem o Upgrade do `/jarvis-init`
- **Breaking:** destino do publish passa a `{SQUAD}/{product|engineering}/{produto}/{arquivo}` (antes `{SQUAD}/{WORKSPACE}/product/{tipo}-{feature}.md`, com ARD em `engineering/ARD/`)
- Projeto único: `PROD_DOCS=docs/jarvis/product`, com `docs/jarvis/*` no `.gitignore`
- `jarvis docs fetch` lê pelo adaptador e perdeu o argumento `[ref]` (a ref vem de `CENTRAL_DOCS_REF`)
- Padrão de `CENTRAL_DOCS_TARGET_BRANCH` no código passou de `dev` para `main` (igual ao template)
- `validate-frontmatter.js`: status de produto, ARD e RFC atualizados (#146) e campos obrigatórios do ARD no frontmatter (`id`, `name`, `version`, `status`)
- Workflows, agente e templates que citavam `CENTRAL_DOCS_REPO` passam a checar `CENTRAL_DOCS_STORAGE`

### Removed
- `jarvis vcs fetch-raw` (e `bin/lib/vcs/fetch-raw.js`), `fetchRawFile` e `commitFiles` de `vcs/api.js`: a leitura do Central docs é sempre `jarvis docs fetch`
- Cache Redis (`bin/lib/docs/redis-cache.js`) e `CENTRAL_DOCS_CACHE_TTL`

## [3.2.0] - 2026-10-06

### Added
- **Advisor opcional no `eng.start`** (#140): no início do comando, o usuário escolhe se quer um Advisor e com qual modelo (lista `ADVISOR_MODELS` no `ENV.md`, até 4 opções; fallback `Sonnet 5.5`). O Advisor é um subagente novo, `agents/engineering/eng.advisor.agent.md` (sem `model:` fixo, só leitura, no GitHub só consulta), aberto só na primeira questão em aberto: faz uma carga inicial do contexto (card, documentos de especificação, sessão) e responde a uma questão por mensagem. A sugestão dele é a decisão adotada; o agente principal registra tudo num comentário de auditoria na issue
- `templates/engineering/advisor-template.md`: Prompt 1 (carga inicial), Prompt 2 (questão em aberto) e o modelo do comentário de auditoria
- `ADVISOR_MODELS` em `templates/ENV-template.md` (o Upgrade do `/jarvis-init` acrescenta a variável) e na tabela de opcionais do `jarvis-init`, sem pergunta na criação do `ENV.md`

### Changed
- `templates/engineering/architecture-template.md`: campo `Advisor:` no cabeçalho e a seção 8 "Questões em Aberto" reescrita (contexto, arquivos, dúvida, no mínimo 3 opções mais "4 — Outra", sugestões do agente principal e do Advisor, decisão adotada, divergência e impacto)
- `eng.start`: a Fase 0.5 vira "Advisor (opcional)", a nova Fase 4.3 trata as questões em aberto e, com Advisor, o gate de aprovação segue a autonomia do CDD (`alta` segue sem esperar); `eng.start-rules.md` registra a exceção
- `eng.plan` e `eng.work`: consulta ao Advisor só por exceção, quando surge uma questão nova (o ideal é levantar tudo no `eng.start`)
- **Comentários no `TASK_MANAGER` só para eventos relevantes:** desvio do plano, auditoria do Advisor, bloqueio (pré-PR reprovado) e, uma única vez, o link do MR. Saíram os 10 comentários de início e fim de `eng.start`, `eng.plan`, `eng.work`, `eng.pre-pr` e `eng.pr` (e as duas duplicatas do link do MR no `eng.pr`); regra única em `rules/engineering/eng.integrations-rules.md`

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
