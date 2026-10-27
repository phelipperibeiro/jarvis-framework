---
description: Sign-off QA pré-deploy — verifica cobertura de testes e bugs abertos para a branch, produz decisão GO/NO-GO
auto_execution_mode: 2
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Leitura de arquivos locais, análise de cobertura e geração de documento estruturado
---

# qa.release-signoff

Sign-off QA antes de um deploy. Verifica cobertura de testes, sessões exploratórias e bugs abertos para a branch atual, e produz um documento GO/NO-GO.

## Entrada

```
#$ARGUMENTS
```

Aceita: nome da branch (padrão: branch atual via `git branch --show-current`).

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — workflow autocontido | — |

---

## Fase 0 — Identificar branch e mudanças

```bash
# Branch atual (se não passada como argumento)
git branch --show-current

# Tasks incluídas neste deploy
git log origin/main..HEAD --oneline

# Arquivos alterados
git diff origin/main...HEAD --name-only
```

---

## Fase 1 — Verificar cobertura

Para cada domínio/área afetada pelas mudanças:

**1. Testes E2E**
```bash
ls $TEST_FOLDER/e2e/ 2>/dev/null
```
Verificar se existe spec cobrindo o domínio. Confrontar com arquivos alterados.

**2. Sessão exploratória**
```bash
ls $SESSIONS_DIR/qa/ 2>/dev/null | grep -i {dominio}
```
Verificar se foi realizada sessão para a feature.

**3. Quality gate**
```bash
ls $ENG_DOCS/qa/ 2>/dev/null | grep -i "quality-gate\|qg"
```
Verificar se a spec passou pelo quality gate antes da sprint.

---

## Fase 2 — Verificar bugs abertos

Buscar no $TASK_MANAGER bugs abertos relacionados às tasks do deploy:

```
Buscar: type = Bug AND status != Done AND linkedIssue in ({tasks_do_deploy})
```

Para cada bug encontrado, apresentar ao QA:
- É bloqueador para este deploy?
- Aceitar com ressalva (documentar motivo)?
- Não relacionado ao deploy atual?

---

## Fase 3 — Decisão GO / NO-GO

| Condição | Decisão |
|----------|---------|
| Toda cobertura crítica atendida, nenhum bug bloqueador | ✅ GO |
| Cobertura atendida, bugs não-bloqueadores documentados | ✅ GO com ressalvas |
| Cobertura crítica ausente OU bug bloqueador em aberto | 🚫 NO-GO |

Apresentar a decisão ao QA para confirmação antes de salvar.

---

## Fase 4 — Gerar documento

Usar template `$TEMPLATES_FOLDER/engineering/qa/qa.release-signoff-template.md`.

Salvar em:
```
$ENG_DOCS/qa/signoffs/signoff-{branch-slug}-{YYYYMMDD}.md
```

> O frontmatter **deve** conter `status: GO` ou `status: NO-GO`: é a decisão registrada.

---

## Output

- `$ENG_DOCS/qa/signoffs/signoff-{branch-slug}-{YYYYMMDD}.md` — documento de sign-off
