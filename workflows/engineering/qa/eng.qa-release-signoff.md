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

> ℹ️ O documento gerado é validado automaticamente pelo CI via `jarvis qa-signoff`.
> Para ativar a validação automática, o TL precisa adicionar o job ao pipeline — o snippet é fornecido ao final.

## Entrada

```
#$ARGUMENTS
```

Aceita: nome da branch (padrão: branch atual via `git branch --show-current`).

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
ls $DOCS_FOLDER/engineering/qa/ 2>/dev/null | grep -i "quality-gate\|qg"
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
$DOCS_FOLDER/engineering/qa/signoffs/signoff-{branch-slug}-{YYYYMMDD}.md
```

> O frontmatter **deve** conter `status: GO` ou `status: NO-GO` — o CLI `jarvis qa-signoff` lê este campo.

---

## Fase 5 — Setup CI (condicional, apenas na primeira vez)

Verificar se o job de sign-off já existe no pipeline:

```bash
grep -l "qa-signoff\|jarvis qa-signoff" .gitlab-ci.yml .github/workflows/*.yml 2>/dev/null
```

Se **já encontrado** → pular silenciosamente.

Se **não encontrado**:

**1. Identificar o Tech Lead do squad**

Ler `members.md` e buscar o membro com `TECH LEAD` na seção do squad atual (`SQUAD` do ENV.md):

```bash
grep -A 20 "^## $SQUAD" members.md | grep -i "TECH LEAD"
```

Extrair nome e Slack ID do TL encontrado.

**2. Enviar mensagem automática via $MESSAGE_COMUNICATOR**

Enviar Slack DM para o Slack ID do TL com o seguinte conteúdo:

```
📋 *Setup QA Sign-off — {WORKSPACE}*

Olá, {nome_do_tl}! O QA {nome_do_qa} configurou o sign-off automático de release.

Para ativar a validação no pipeline CI, adicione ao `.gitlab-ci.yml`:

```yaml
qa-signoff:
  stage: validate
  script:
    - npx jarvis qa-signoff --branch $CI_COMMIT_REF_NAME
  rules:
    - if: $CI_COMMIT_BRANCH =~ /^(main|master|release\/.*)$/
  allow_failure: false
```

*Pré-requisito:* `jarvis-framework` em `devDependencies` (já instalado se o projeto usa Jarvis).

Após o merge, todo push para `main`/`release/*` será validado automaticamente. ✅
```

**3. Confirmar ao QA**

```
✅ Mensagem enviada para {nome_do_tl} via Slack.
   O CI será ativado assim que ele adicionar o job ao pipeline.
```

Se $MESSAGE_COMUNICATOR não estiver configurado ou o TL não tiver Slack ID em `members.md`:
- Exibir o snippet na tela para envio manual
- Avisar: "Configure MESSAGE_COMUNICATOR no ENV.md para envios automáticos futuros."

---

## Output

- `$DOCS_FOLDER/engineering/qa/signoffs/signoff-{branch-slug}-{YYYYMMDD}.md` — documento de sign-off
- Snippet CI (apenas na primeira execução, se pipeline ainda não configurado)
