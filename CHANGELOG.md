# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/) (ver `rules/engineering/eng.bump-rules.md`).

> Versões anteriores a `2.1.1` não foram documentadas retroativamente neste changelog — o histórico detalhado dessas versões continua disponível via `git log`.

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
