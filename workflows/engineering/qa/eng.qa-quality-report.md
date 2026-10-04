---
description: Gera relatório de qualidade consolidado para uma sprint ou release
auto_execution_mode: 2
rules_file: "$IDE/rules/engineering/qa/eng.qa.exploratory-session-rules.md"
template_file: "$IDE/templates/engineering/qa/qa.quality-report-template.md"
model_tier: medium
model_justification: Consolidação de dados locais e síntese analítica
---

# qa.quality-report

Consolida sessões exploratórias, bug reports e quality gates do período e gera
relatório de qualidade em markdown pronto para publicar.

> 📤 **Template**: `$IDE/templates/engineering/qa/qa.quality-report-template.md`
> 🔧 **Skill**: `eng-qa-quality-report`

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Execução | `/eng-qa-quality-report` | Sempre — invocado via Skill tool |
| Publicação no Central Docs (condicional) | `/jarvis-docs-central` (via `jarvis docs publish --tipo qa-report`) | Se `CENTRAL_DOCS_REPO` estiver configurado, o relatório tiver frontmatter válido (period, squad, version) e o usuário aceitar publicar |

---

## Entrada

```
#$ARGUMENTS
```

Aceita: período em texto livre (ex: "Sprint 42", "release 1.4", "abril/2026").

**Se não receber argumentos**, perguntar:
- Qual período deseja cobrir no relatório? (ex: Sprint N, release X.Y, mês)

---

## Execução

Invocar Skill tool: `eng-qa-quality-report`

A skill irá:
1. Localizar docs do período em `$SESSIONS_DIR/qa/`
2. Localizar bug reports relacionados (via $TASK_MANAGER ou docs locais)
3. Consolidar métricas: sessões, bugs por severidade, quality gates, cobertura E2E
4. Identificar tendências e áreas de risco
5. Gerar relatório usando o template de quality report
6. Salvar em `$DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{PERIODO}.md`

---

## Output

- `$DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{PERIODO}.md` — relatório completo

---

## Publicação no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md:

1. Verificar se o relatório tem frontmatter válido (period, squad, version)
2. Perguntar ao usuário: "Publicar relatório no central-docs?"
3. Se sim:

```bash
jarvis docs publish \
  --file $DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{PERIODO}.md \
  --tipo qa-report \
  --feature {squad}-{periodo-slug}
```

Exemplo de feature slug: `core-sprint-42`, `checkout-release-1-4`

- ✅ Sucesso: "Relatório publicado no central-docs. MR criado: [URL]"
- ❌ Erro de frontmatter: orientar o usuário a preencher os campos `period`, `squad` e `version`
- ℹ️ Recusou: "Para publicar depois, execute: `jarvis docs publish --file {caminho} --tipo qa-report --feature {slug}`"

Se `CENTRAL_DOCS_REPO` não estiver definido:
- Informar: "Para habilitar publicação automática, configure `CENTRAL_DOCS_REPO` no ENV.md"

> **Nota**: A publicação cria um Merge Request no GitLab. O relatório só será visível no central-docs após aprovação e merge do MR.
> O destino no central-docs é: `{SQUAD}/{PRODUCT}/engineering/qa/qa-report-{feature}.md`
