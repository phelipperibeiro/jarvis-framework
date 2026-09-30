# `/eng.qa-quality-report` — relatório de qualidade da sprint ou release

Workflow: `workflows/engineering/qa/eng.qa-quality-report.md` · Skill: `eng-qa-quality-report` · Template: `templates/engineering/qa/qa.quality-report-template.md`

## Em uma frase

Consolida as sessões exploratórias, os bugs e os quality gates de um período em um relatório de qualidade pronto para publicar.

## O que é

Uma visão única da qualidade de uma sprint, de uma release ou de um mês, para o time e para a liderança.

## Quando usar

- No fechamento de uma sprint ou release
- Quando você precisa mostrar tendências e áreas de risco

## Quando **não** usar

- Você quer decidir se um deploy pode acontecer → [`eng.qa-release-signoff`](./eng.qa-release-signoff.md)
- Você quer registrar uma sessão de teste → [`eng.qa-exploratory-session`](./eng.qa-exploratory-session.md)

## Como funciona

Aceita o período em texto livre (por exemplo "Sprint 42", "release 1.4", "abril/2026") e pergunta se você não informar. A skill:

1. Localiza os documentos do período em `.jarvis/sessions/qa/`
2. Localiza os bug reports relacionados, no board ou em documentos locais
3. **Consolida as métricas:** sessões, bugs por severidade, quality gates e cobertura E2E
4. Identifica **tendências e áreas de risco**
5. Gera o relatório pelo template e salva

## O que sai

`docs/engineering/qa/reports/QA-REPORT-{SQUAD}-{PERIODO}.md`

## Publicação

Se `CENTRAL_DOCS_REPO` estiver configurado, o comando confere o frontmatter (`period`, `squad` e `version`) e pergunta se você quer publicar no central docs. A publicação abre um merge request e o relatório só fica visível depois do merge. Se você recusar, ele mostra o comando para publicar depois.

## Regras que importam

- O relatório usa só o que existe nos documentos do período; não inventa números
- Sem `CENTRAL_DOCS_REPO`, o relatório fica só local

## Próximo passo típico

Compartilhar com o time, ou publicar no central docs
