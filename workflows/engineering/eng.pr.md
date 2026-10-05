---
description: Criação de branch, commit e merge request (MR)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.pr-rules.md"
template_file: "$IDE/templates/engineering/PR-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: medium
model_justification: Operações Git e preenchimento de templates são tarefas estruturadas que não requerem raciocínio extremamente complexo
---

# Pull Request / Merge Request

Este comando cria a **branch, commita as alterações e abre um Merge Request**.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.pr-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 📤 **Template**: `$IDE/templates/engineering/PR-template.md`

## Skills recomendados

- **pr**: siga o playbook do skill para padronizar branch, commits e MR.
  - Arquivo: `$IDE/skills/eng-global-pr/SKILL.md`
- **eng-qa-test-plan**: se precisar validar lacunas de testes antes de abrir o MR.
  - Arquivo: `$IDE/skills/eng-qa-test-plan/SKILL.md`
- **eng-qa-testsprite**: para executar testes automatizados E2E/API antes de abrir o MR.
  - Arquivo: `$IDE/skills/eng-qa-testsprite/SKILL.md`
- **eng-qa-e2e**: para validar fluxos de usuário críticos com testes E2E em linguagem natural antes de abrir o MR.
  - Arquivo: `$IDE/skills/eng-qa-e2e/SKILL.md`
- **eng-global-docs-write**: se houver necessidade de atualizar documentação junto do PR.
  - Arquivo: `$IDE/skills/eng-global-docs-write/SKILL.md`
- **eng-security-cybersecurity**: se o PR toca em auth, inputs, APIs públicas ou permissões — adicionar label `security` ao MR.
  - Arquivo: `$IDE/skills/eng-security-cybersecurity/SKILL.md`

## Agentes recomendados (opcional)

- **eng.qa.test-planner**: para análise detalhada de cobertura antes do MR.
  - Arquivo: `$IDE/agents/engineering/qa/eng.qa.test-planner.md`
  - Quando usar: Se houver dúvidas sobre cobertura de testes ou mudanças significativas.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Skills recomendados | `/eng-global-pr` | Sempre — seguir o playbook do skill para padronizar branch, commits e MR |
| Skills recomendados | `/eng-qa-test-plan` | Se for preciso validar lacunas de testes antes de abrir o MR |
| Fase 1 › 1.4 Executar Testes Automatizados (Opcional) | `/eng-qa-testsprite` | Se o projeto estiver rodando localmente (`/eng-qa-testsprite diff`); passo opcional, recomendado em mudanças significativas |
| Skills recomendados | `/eng-qa-e2e` | Se for preciso validar fluxos de usuário críticos com testes E2E em linguagem natural antes de abrir o MR |
| Skills recomendados | `/eng-global-docs-write` | Se houver necessidade de atualizar documentação junto do PR |
| Skills recomendados | `/eng-security-cybersecurity` | Se o PR tocar em auth, inputs, APIs públicas ou permissões (adicionar label `security` ao MR) |
| Agentes recomendados (opcional) | `eng.qa.test-planner` (agente) | Se houver dúvidas sobre cobertura de testes ou mudanças significativas |
| Fase 0.5: Comentário no card — Início | `/eng-global-task-comment` | Se `TASK_MANAGER` estiver preenchido (freelance pula) |
| Fase 4 › 4.2 Criar MR/PR via adapter | `jarvis vcs create-merge` (CLI do Jarvis) | Sempre — abre o MR/PR conforme `VERSION_CONTROL` ou o host do `origin` |
| Fase 5: Comentário no card — Conclusão | `/eng-global-task-comment` | Se `TASK_MANAGER` estiver preenchido, depois de o MR ser criado (freelance pula) |

---

## Entrada

<task_manager_key>
#$ARGUMENTS
</task_manager_key>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Seguir `$IDE/rules/engineering/eng.integrations-rules.md`.

**Se não receber argumentos**, perguntar e **aguardar**:

- `TASK_MANAGER` vazio → *Qual o seu número de controle para esta tarefa? (ex: F-042)*
- `TASK_MANAGER` preenchido → *Qual o id do card no {TASK_MANAGER}?*

> A branch de destino **padrão é `dev`** (GitFlow). Só perguntar se o usuário indicar outra branch (ex: hotfix direto para `main`).
> 💡 A branch de feature já foi criada no `eng.start`. Este workflow apenas faz push e abre o MR.

---

## Fase 0.5: Comentário no card — Início

Pular se `TASK_MANAGER` estiver vazio (freelance).

Registrar início da criação do MR:

```
/eng-global-task-comment {TASK_MANAGER_KEY} 🔀 [Jarvis] Iniciando criação do Merge Request para {TARGET_BRANCH}
```

> Usa o skill `/eng-global-task-comment`. Não bloquear se falhar.

---

## Fase 1: Validação Pré-PR

### 1.1 Executar Testes Unitários

```bash
npm test  # ou comando do projeto
```

### 1.2 Verificar Lint

```bash
npm run lint  # ou comando do projeto
```

### 1.3 Verificar Build

```bash
npm run build  # ou comando do projeto
```

### 1.4 Executar Testes Automatizados (Opcional)

Se o projeto estiver rodando localmente, execute o skill **eng-qa-testsprite** para validação completa:

```
/eng-qa-testsprite diff
```

Isso irá:

- Gerar plano de testes para as mudanças recentes (diff)
- Executar testes E2E (frontend) ou API (backend)
- Gerar relatório em `testsprite_tests/`

> **Observação**: o comportamento exato de "diff" pode variar (staged vs uncommitted). Se necessário, valide com o usuário qual estado do Git deve ser considerado antes de executar.

> **Nota**: Este passo é opcional mas recomendado para mudanças significativas.

**Se qualquer validação falhar:**
→ Corrigir os problemas antes de prosseguir
→ Informar o usuário sobre os erros

---

## Fase 2: Verificar Branch

> 🌿 **GitFlow**: a branch foi criada no `eng.start` e os commits foram feitos pelo `eng.work`.
> Esta fase apenas verifica que estamos na branch correta antes do push.

### 2.1 Verificar Branch Ativa

A branch de feature foi criada no `eng.start`. Verificar:

```bash
git branch --show-current
```

A branch deve seguir o padrão `{TASK_MANAGER_KEY}-{titulo-em-kebab-case}`.

**Cenários:**

| Situação | Ação |
|----------|------|
| Branch com `{TASK_MANAGER_KEY}` | ✅ Prosseguir |
| Branch errada / `main` / `develop` | Fazer checkout na branch correta: `git checkout {TASK_MANAGER_KEY}-{titulo-kebab}` |

### 2.2 Confirmar Branch de Destino

Branch de destino padrão: **`dev`** (GitFlow).

> ⚠️ **Nunca fazer push direto para `main` ou `master`** sem confirmação explícita do usuário.

---

**Se não estiver na branch correta:**

```bash
git checkout {TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

### 2.2 Verificar Commits da Branch

```bash
git log dev..HEAD --oneline
```

Deve listar os commits das fases implementadas no `eng.work`.

**Se houver mudanças não commitadas** (ex: ajuste manual fora do `eng.work`):

```bash
# Adicionar arquivos individualmente (NUNCA git add .)
git add {arquivo1} {arquivo2}
git commit -m "{TASK_MANAGER_KEY} chore: ajustes pré-PR

Refs: {TASK_MANAGER_KEY}"
```

---

## Fase 3: Push

### 3.1 Enviar para Remote

```bash
git push -u origin {NOME_DA_BRANCH}
```

**Verificar push:**

```bash
git log --oneline -3
```

---

## Fase 4: Criar Merge Request / Pull Request

Ler `VERSION_CONTROL` do `$IDE/ENV.md` (`gitlab` | `github` | `bitbucket`).
Use **MR** se GitLab, **PR** se GitHub/Bitbucket.

### 4.1 Preparar descrição

Template, nesta ordem (o primeiro que existir):

```bash
cat $IDE/.gitlab/merge_request_templates/default.md 2>/dev/null \
  || cat .github/PULL_REQUEST_TEMPLATE.md 2>/dev/null \
  || cat pull_request_template.md 2>/dev/null \
  || cat $IDE/templates/engineering/PR-template.md
```

Preencher com a tarefa. Link do card:

| TASK_MANAGER | URL |
|--------------|-----|
| jira | `{TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}` |
| linear | `{TASK_MANAGER_URL_BASE}/issue/{TASK_MANAGER_KEY}` |
| github | `{TASK_MANAGER_URL_BASE}/issues/{TASK_MANAGER_KEY}` |
| asana | `{TASK_MANAGER_URL_BASE}/0/0/{TASK_MANAGER_KEY}` |

`{TASK_MANAGER_KEY}` = `{TASK_MANAGER_KEY}`.

> ⚠️ Não mencione AI, Claude ou assistentes no MR/PR.

### 4.2 Criar MR/PR via adapter

- **Título**: `{TASK_MANAGER_KEY}: {Título da tarefa}`
- **Branch origem**: `{NOME_DA_BRANCH}`
- **Branch destino**: a informada pelo usuário (`dev` / `main` / hotfix)
- **Descrição**: template preenchido, gravado em arquivo temporário

```bash
BODY_FILE=$(mktemp)
# gravar a descrição preenchida em $BODY_FILE

jarvis vcs create-merge \
  --source "${NOME_DA_BRANCH}" \
  --target "${TARGET_BRANCH}" \
  --title "${TASK_MANAGER_KEY}: ${TITULO_DA_TAREFA}" \
  --body-file "$BODY_FILE"

rm -f "$BODY_FILE"
```

O adapter lê `git remote get-url origin` e `VERSION_CONTROL` / hostname (GitLab, GitHub, Bitbucket). Token: `.npmrc` (GitLab), `gh auth` / `GITHUB_TOKEN` (GitHub), `BITBUCKET_TOKEN` (Bitbucket).

Se o CLI `jarvis` não estiver instalado no repo alvo, usar `node {caminho-do-clone-do-jarvis}/bin/jarvis.js vcs create-merge ...`.

**Erros comuns:**

| Código | Causa | Solução |
|--------|-------|---------|
| `401 Unauthorized` | PAT ausente ou sem scope `api` | Gerar novo PAT com scope `api` em `~/.npmrc` |
| `404 Not Found` | Namespace desatualizado no remote | `git remote set-url origin <nova-url>` |
| `422` | Branch origem não existe no remote | Verificar se o push (Fase 3) foi executado |

---

## Fase 5: Comentário no card — Conclusão

Pular se `TASK_MANAGER` estiver vazio (freelance).

Após MR criado com sucesso, registrar:

```
/eng-global-task-comment {TASK_MANAGER_KEY} ✅ [Jarvis] MR criado: {TITULO_DO_MR} → {TARGET_BRANCH} | Link: {LINK_DO_MR}
```

---

## Fase 6: Atualizar Board

Pular se `TASK_MANAGER` estiver vazio (freelance).

### 6.1 Mover Card

Mova o card para a etapa equivalente a "em revisão" no seu board. Quem assumiu o card o move; não é preciso esperar o TECH LEAD ou o PM.

### 6.2 Adicionar Comentário

Adicione um comentário no card com o link do MR:

```
MR aberto: {LINK_DO_MR}
Branch: {NOME_DA_BRANCH}
```

---

## Fase 6: Processar Code Review

### 7.1 Aguardar Comentários

Aguarde 3-5 minutos para a ferramenta de code review processar.

### 7.2 Analisar Comentários

Para cada comentário:

1. Avaliar se requer correção
2. Avaliar se pode ser explicado/ignorado
3. Apresentar ao usuário

### 7.3 Aplicar Correções

Se necessário:

```bash
# Fazer mudanças
git add {arquivos_alterados}
git commit -m "fix: corrigir {problema} conforme code review"
git push
```

---

## Fase 7: Conclusão

### 8.1 Registrar Métricas de Lead Time

Calcule e registre o lead time (tempo desde eng.start até PR criado):

```bash
# Calcular lead time se .timestamp_start existir
if [ -f $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start ]; then
  START_TIME=$(cat $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start)
  END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Calcular diferença em minutos (macOS/Linux compatível)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$START_TIME" +%s 2>/dev/null || echo 0)
    END_EPOCH=$(date +%s)
  else
    # Linux
    START_EPOCH=$(date -d "$START_TIME" +%s 2>/dev/null || echo 0)
    END_EPOCH=$(date +%s)
  fi

  LEAD_TIME_MINUTOS=$(( (END_EPOCH - START_EPOCH) / 60 ))
  LEAD_TIME_HORAS=$(awk "BEGIN {printf \"%.1f\", $LEAD_TIME_MINUTOS/60}")

  echo "$LEAD_TIME_MINUTOS" > $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.lead_time_minutes

  LEAD_TIME_MSG="⏱️ Lead time: $LEAD_TIME_HORAS horas ($LEAD_TIME_MINUTOS minutos)"
else
  LEAD_TIME_MSG="⏱️ Lead time: não calculado (timestamp inicial ausente)"
fi
```

### 8.2 Mensagem Final

```
✅ MERGE REQUEST CRIADO COM SUCESSO!

📋 Resumo:
- Branch: {NOME_DA_BRANCH}
- MR: {LINK_DO_MR}
- Jira: {TASK_MANAGER_KEY} → "In Review"

📊 Validações:
- Testes: ✅ Passando
- Lint: ✅ OK
- Build: ✅ OK

{LEAD_TIME_MSG}

📌 Próximos passos:
1. Aguardar revisão do time
2. Processar comentários do code review
3. Merge após aprovação

🔗 Links:
- MR: {LINK_DO_MR}
- Jira: {TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY}
```

## Fase 8: Limpeza da Sessão

### 9.1 Solicitar Confirmação

Após o MR ser criado com sucesso, **solicitar confirmação do usuário**:

```
🧹 Deseja limpar a sessão?

A pasta $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ será removida.
A documentação permanece no Jira e no MR.

Confirmar? (s/n)
```

> ⚠️ **IMPORTANTE**: Sempre pedir confirmação antes de executar comandos destrutivos.

### 9.2 Remover Pasta da Sessão

Se confirmado:

```bash
rm -rf $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
```

**Exemplo:**

```bash
rm -rf $SESSIONS_DIR/eng/task-123/
```

### 9.3 Confirmar Limpeza

```
🧹 SESSÃO LIMPA!

📁 Removido: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
   - architecture.md ✅
   - plan.md ✅
   - context.md ✅ (se existia)

ℹ️ A documentação permanece no:
   - Card do Jira: {TASK_MANAGER_KEY}
   - Merge Request: {LINK_DO_MR}
```

> ⚠️ **NOTA**: A documentação não é perdida! Ela está anexada no Jira e registrada no MR.

---

## Regras Importantes

### ⛔ NÃO FAÇA

- ❌ `git add .` (adiciona arquivos indesejados)
- ❌ Push direto para `main`/`master`
- ❌ Commit sem referenciar TASK_MANAGER_KEY
- ❌ Branch sem padrão de nomenclatura
- ❌ Mencionar AI/Claude no MR

### ✅ FAÇA SEMPRE

- ✅ Validar testes antes do commit
- ✅ Adicionar arquivos específicos
- ✅ Usar mensagem de commit padronizada
- ✅ Criar branch no padrão `{TASK_MANAGER_KEY}-{titulo}`
- ✅ Preencher template do MR completamente
- ✅ Mover card para "In Review"
- ✅ **Limpar sessão após criar MR** (`rm -rf $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`)

---

## Tratamento de Erros

### Se os testes falharem:

→ Listar testes que falharam
→ Sugerir correções
→ NÃO prosseguir com o PR

### Se já existir uma branch com o mesmo nome:

→ Verificar se é a branch correta
→ Se sim, fazer checkout nela
→ Se não, perguntar ao usuário

### Se o push falhar:

→ Verificar se há conflitos
→ Resolver conflitos se necessário
→ Tentar push novamente
