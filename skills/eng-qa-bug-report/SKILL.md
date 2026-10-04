---
name: eng-qa-bug-report
description: Gera relatórios estruturados de bugs e cria cards no $TASK_MANAGER automaticamente. Use para documentar bugs encontrados durante audit ou debugging.
argument-hint: "[modo] [argumentos]"
disable-model-invocation: false
allowed-tools: Read Grep Glob Bash Write MCP
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
---

# Bug Report - Geração de Relatórios e Cards de Bugs

Você é um **especialista em documentação de bugs**, responsável por gerar relatórios estruturados e criar cards no $TASK_MANAGER de forma automática e consistente.

## Objetivo

Facilitar a documentação e rastreamento de bugs encontrados durante:
- Bug Audit (`/eng.bug-audit`)
- Debugging (`/eng.debug`)
- Code Review
- Testes manuais

---

## Modos de Operação

### 1. **create** - Criar card único no $TASK_MANAGER

```bash
/eng-qa-bug-report create \
  --title="Título do bug" \
  --category="BUG-CRÍTICO" \
  --severity="P0" \
  --location="src/auth/login.ts:45" \
  --description="Descrição detalhada" \
  --suggestion="Sugestão de correção"
```

### 2. **batch** - Criar múltiplos cards a partir de relatório

```bash
/eng-qa-bug-report batch --from-audit="./sessions/bug-audit-20260208/bug-audit-report.md"
```

### 3. **generate-report** - Gerar apenas relatório (sem criar cards)

```bash
/eng-qa-bug-report generate-report \
  --bugs="./bugs-list.json" \
  --output="./sessions/bug-report.md"
```

---

## Entrada

### Modo `create`

**Argumentos obrigatórios** (sempre):
- `--title` - Título no formato `[SERVIÇO] descrição do problema` (ex: `[auth] Token expirado retorna 500 ao invés de 401`)
- `--category` - Categoria (BUG-CRÍTICO, BUG-ALTO, BUG-MÉDIO, BUG-BAIXO, CODE-SMELL, DÉBITO-TÉCNICO, SEGURANÇA, PERFORMANCE)
- `--location` - Localização no código (arquivo:linha)
- `--description` - Descrição detalhada do problema (o que acontece, onde, quando)
- `--environment` - Ambiente onde ocorre: `dev`, `staging` ou `prod`
- `--behavior-actual` - O que o sistema faz atualmente (comportamento observado)
- `--behavior-expected` - O que o sistema deveria fazer (comportamento correto)

**Argumentos obrigatórios para P0/P1** (BUG-CRÍTICO, BUG-ALTO, SEGURANÇA):
- `--reproduction` - Passos para reproduzir (pré-condições → passos → resultado atual)
- `--impact` - Impacto no negócio/usuário (quem é afetado, volume, consequência)
- `--entry-endpoint` - Endpoint ou ação que dispara o fluxo com bug (ex: `POST /auth/login`)

**Argumentos opcionais**:
- `--severity` - Prioridade (P0, P1, P2, P3) [default: calculado automaticamente]
- `--suggestion` - Sugestão de correção
- `--acceptance-criteria` - Como validar que o bug foi corrigido
- `--correlation-id` - Correlation ID / Request ID da requisição com falha (fundamental para bugs cross-service)
- `--affected-services` - Serviços envolvidos no fluxo (ex: `account,auth,notification`)
- `--frequency` - Frequência do bug: `recorrente`, `intermitente` ou `uma-vez` [default: desconhecido]
- `--linked-to` - `TASK_MANAGER_KEY` do card de origem (ex: `PROJ-456`) — obrigatório quando criado a partir de `eng.debug` para manter rastreabilidade entre débito técnico e bug investigado
- `--assignee` - Assignee sugerido
- `--labels` - Labels adicionais (separadas por vírgula)

### Modo `batch`

**Argumentos obrigatórios**:
- `--from-audit` - Caminho para o relatório de audit

**Argumentos opcionais**:
- `--priority-filter` - Criar apenas P0,P1 | P0,P1,P2 | all [default: P0,P1]
- `--dry-run` - Simular sem criar cards [default: false]

### Modo `generate-report`

**Argumentos obrigatórios**:
- `--bugs` - Caminho para arquivo JSON com lista de bugs

**Argumentos opcionais**:
- `--output` - Caminho de saída [default: ./sessions/bug-report-{timestamp}.md]
- `--format` - Formato (markdown, json, html) [default: markdown]

---

## Validação de Entrada

```bash
# 1. Campos obrigatórios para todos os cards
missing_fields=()
[ -z "$TITLE" ]            && missing_fields+=("--title (formato: [SERVIÇO] descrição)")
[ -z "$CATEGORY" ]         && missing_fields+=("--category")
[ -z "$LOCATION" ]         && missing_fields+=("--location (arquivo:linha)")
[ -z "$DESCRIPTION" ]      && missing_fields+=("--description")
[ -z "$ENVIRONMENT" ]      && missing_fields+=("--environment (dev|staging|prod)")
[ -z "$BEHAVIOR_ACTUAL" ]  && missing_fields+=("--behavior-actual")
[ -z "$BEHAVIOR_EXPECTED" ] && missing_fields+=("--behavior-expected")

if [ ${#missing_fields[@]} -gt 0 ]; then
  echo "⛔ Campos obrigatórios faltando:"
  for field in "${missing_fields[@]}"; do
    echo "  - $field"
  done
  exit 1
fi

# 2. Validar formato do título: deve começar com [SERVIÇO]
if ! echo "$TITLE" | grep -qE "^\[.+\] .+"; then
  echo "⛔ Formato de título inválido."
  echo "  Esperado: [SERVIÇO] descrição do problema"
  echo "  Exemplo:  [auth] Token expirado retorna 500 ao invés de 401"
  exit 1
fi

# 3. Validar categoria
valid_categories="BUG-CRÍTICO|BUG-ALTO|BUG-MÉDIO|BUG-BAIXO|CODE-SMELL|DÉBITO-TÉCNICO|SEGURANÇA|PERFORMANCE"
if ! echo "$CATEGORY" | grep -qE "^($valid_categories)$"; then
  echo "⛔ Categoria inválida: $CATEGORY"
  echo "  Categorias válidas: $valid_categories"
  exit 1
fi

# 4. Campos extras obrigatórios para P0/P1 (BUG-CRÍTICO, BUG-ALTO, SEGURANÇA)
high_priority_categories="BUG-CRÍTICO|BUG-ALTO|SEGURANÇA"
if echo "$CATEGORY" | grep -qE "^($high_priority_categories)$"; then
  missing_p1=()
  [ -z "$REPRODUCTION" ]     && missing_p1+=("--reproduction (pré-condições + passos + resultado atual)")
  [ -z "$IMPACT" ]           && missing_p1+=("--impact (quem é afetado, volume, consequência)")
  [ -z "$ENTRY_ENDPOINT" ]   && missing_p1+=("--entry-endpoint (endpoint ou ação que dispara o fluxo)")

  if [ ${#missing_p1[@]} -gt 0 ]; then
    echo "⛔ Campos obrigatórios para ${CATEGORY} (P0/P1) faltando:"
    for field in "${missing_p1[@]}"; do
      echo "  - $field"
    done
    echo ""
    echo "  Cards ${CATEGORY} sem esses campos não podem ser investigados."
    exit 1
  fi
fi

# 5. Validar formato de location (arquivo:linha)
if ! echo "$LOCATION" | grep -qE ".+:[0-9]+$"; then
  echo "⛔ Formato de localização inválido: $LOCATION"
  echo "  Esperado: arquivo:linha  →  src/auth/token-validator.ts:67"
  exit 1
fi
```

---

## Pré-requisitos

### Validar ENV.md

```bash
if [ ! -f "$IDE/ENV.md" ]; then
  echo "⚠️ ENV.md não encontrado. Execute /jarvis-init primeiro."
  exit 1
fi

# Validar variáveis obrigatórias
required_vars=("WORKSPACE" "IDE" "SQUAD" "HUB" "AREA" "POSITION")
for var in "${required_vars[@]}"; do
  if ! grep -q "^$var=.\+" "$IDE/ENV.md"; then
    echo "⚠️ Variável $var não definida no ENV.md"
  fi
done
```

### Detectar Task Manager Configurado

```bash
# Ler task manager do ENV.md
TASK_MANAGER=$(grep "^TASK_MANAGER=" "$IDE/ENV.md" | cut -d= -f2 | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
TOKEN_TASK_MANAGER=$(grep "^TOKEN_TASK_MANAGER=" "$IDE/ENV.md" | cut -d= -f2)

# Validar se está configurado (vazio = freelance → LOCAL)
if [ -z "$TASK_MANAGER" ] || [ "$TASK_MANAGER" = "[jira,linear,github,asana]" ]; then
  echo "⚠️ TASK_MANAGER vazio — modo freelance/local."
  echo "Cards serão salvos em $SESSIONS_DIR/qa/bug-reports/"
  TASK_MANAGER="local"
fi

# Verificar integração disponível (valores do ENV-template: jira|linear|github|asana)
case "$TASK_MANAGER" in
  jira)
    if mcp list 2>/dev/null | grep -q "claude_ai_Atlassian" || [ -n "$TOKEN_TASK_MANAGER" ]; then
      TASK_MANAGER_ENABLED=true
      echo "✅ Integração Jira disponível"
    else
      TASK_MANAGER_ENABLED=false
      echo "⚠️ Jira configurado mas MCP/token indisponível. Salvando localmente."
    fi
    ;;
  linear)
    if command -v linear >/dev/null 2>&1 || [ -n "$TOKEN_TASK_MANAGER" ]; then
      TASK_MANAGER_ENABLED=true
      echo "✅ Integração Linear disponível"
    else
      TASK_MANAGER_ENABLED=false
      echo "⚠️ Linear configurado mas CLI/token indisponível. Salvando localmente."
    fi
    ;;
  github)
    if command -v gh >/dev/null 2>&1 || [ -n "$TOKEN_TASK_MANAGER" ] || [ -n "$GITHUB_TOKEN" ]; then
      TASK_MANAGER_ENABLED=true
      echo "✅ Integração GitHub Issues disponível"
    else
      TASK_MANAGER_ENABLED=false
      echo "⚠️ GitHub configurado mas gh/token indisponível. Salvando localmente."
    fi
    ;;
  asana)
    if [ -n "$TOKEN_TASK_MANAGER" ]; then
      TASK_MANAGER_ENABLED=true
      echo "✅ Integração Asana disponível"
    else
      TASK_MANAGER_ENABLED=false
      echo "⚠️ Asana configurado mas token indisponível. Salvando localmente."
    fi
    ;;
  local|*)
    TASK_MANAGER_ENABLED=false
    TASK_MANAGER="local"
    echo "📝 Modo local: Cards serão salvos em $SESSIONS_DIR/qa/bug-reports/"
    ;;
esac
```

---

## Fluxo de Trabalho

### Modo `create` - Criar Card Único

#### 0. Verificar Duplicatas

Antes de qualquer outra ação, verificar se já existe card similar no `$TASK_MANAGER` (se configurado).
Usar o skill de triagem disponível:

```
/triage-issue --message="{TITLE}: {DESCRIPTION}"
```

Se o skill `atlassian:triage-issue` não estiver disponível, buscar diretamente:

```
mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql({
  jql: "project = \"{PROJECT_KEY}\" AND summary ~ \"{palavras-chave do título}\" ORDER BY created DESC",
  maxResults: 5
})
```

**Resultado esperado:**

| Resultado | Ação |
|-----------|------|
| Card idêntico já existe | Interromper e informar o usuário com o ID do card existente |
| Card similar existe | Perguntar ao usuário: criar novo ou adicionar comentário ao existente? |
| Nenhum similar | Prosseguir para o próximo passo |

> ⛔ Nunca criar card sem executar este passo. Duplicatas desperdiçam tempo de triagem e
> geram ruído no backlog.

#### 1. Validar Entrada

- Verificar argumentos obrigatórios
- Validar categoria
- Validar formato de location (arquivo:linha)

#### 2. Calcular Severidade (se não fornecida)

```
Severidade = f(Categoria, Impacto, Localização)

Regras automáticas:
- BUG-CRÍTICO + produção → P0
- SEGURANÇA → P0
- BUG-CRÍTICO + staging → P1
- BUG-ALTO → P1
- BUG-MÉDIO → P2
- BUG-BAIXO, CODE-SMELL, DÉBITO-TÉCNICO → P3
```

#### 3. Enriquecer Descrição

Adicionar informações contextuais:

```bash
# Ler código da localização (±5 linhas)
file=$(echo "$LOCATION" | cut -d: -f1)
line=$(echo "$LOCATION" | cut -d: -f2)
start=$((line - 5))
end=$((line + 5))

code_snippet=$(sed -n "${start},${end}p" "$file" | cat -n)

# Buscar informações de commit
git_blame=$(git blame -L "$line,$line" "$file" 2>/dev/null)
git_log=$(git log -1 --format="%h - %s (%ar by %an)" "$file" 2>/dev/null)
```

#### 4. Gerar Estrutura do Card

```markdown
# {TITLE}
> Formato obrigatório: [SERVIÇO] descrição concisa do problema

**Categoria**: {CATEGORY}
**Prioridade**: {SEVERITY}
**Ambiente**: {ENVIRONMENT}
**Localização**: `{LOCATION}`
**Reportado por**: {USER do ENV.md / git / SO}
**Data**: {timestamp}

---

## Descrição

{DESCRIPTION}
> O que acontece, em qual contexto, com qual frequência (recorrente / intermitente / uma vez).

---

## Comportamento

### Atual (o que o sistema faz)
{BEHAVIOR_ACTUAL}

### Esperado (o que deveria fazer)
{BEHAVIOR_EXPECTED}

---

## Impacto

{IMPACT}
> Quem é afetado, volume estimado de usuários/requests, consequência de negócio.
> ⛔ Obrigatório para BUG-CRÍTICO, BUG-ALTO e SEGURANÇA.

---

## Passos para Reproduzir

> ⛔ Obrigatório para BUG-CRÍTICO, BUG-ALTO e SEGURANÇA.
> Sem reprodução documentada, o bug não pode ser investigado nem validado.

**Pré-condições**: {ambiente, usuário de teste, dados necessários}

**Passos**:
1. {passo 1}
2. {passo 2}
3. {passo 3 — resultado atual observado}

**Resultado atual**: {o que acontece no último passo}
**Resultado esperado**: {o que deveria acontecer}

---

## Contexto de Rastreamento

**Endpoint de entrada**: {ENTRY_ENDPOINT ou "não identificado"}
**Serviços envolvidos**: {AFFECTED_SERVICES ou "não mapeado"}
**Correlation ID**: {CORRELATION_ID ou "⚠️ não disponível — rastreamento manual necessário"}
**Frequência**: {FREQUENCY ou "desconhecido"}
**Card de origem**: {LINKED_TO ou "N/A — não originado de investigação"}

> ℹ️ Se Correlation ID não disponível e `--affected-services` tem 2+ serviços, criar débito técnico automaticamente
> conforme regra em `$IDE/rules/engineering/eng-rules.md`.
> ℹ️ Se `--linked-to` foi fornecido, criar link Jira entre este card e o card de origem após a criação.

---

## Localização no Código

**Arquivo**: `{file}`
**Linha**: {line}

```{linguagem}
{code_snippet}
```

**Último commit neste arquivo**: {git_log}
**Autor da linha**: {git_blame}

---

## Critério de Aceitação

> Como validar que o bug foi corrigido? Definir antes de implementar.

{ACCEPTANCE_CRITERIA ou critério inferido pelo AI com base no comportamento esperado}

Exemplo:
- [ ] `POST {endpoint}` retorna `{status esperado}` quando `{condição}`
- [ ] Teste de regressão cobre o cenário reproduzido acima
- [ ] Sem regressão em `{fluxos relacionados}`

---

## Sugestão de Correção

{SUGGESTION ou "A definir na investigação — executar /eng.debug {TASK_MANAGER_KEY}"}

### Arquivos Prováveis de Modificar
- `{file}`

### Testes Necessários
- [ ] Teste que reproduz o bug (deve falhar antes da correção, passar depois)
- [ ] Teste de regressão para {fluxo adjacente}

---

## Prevenção Futura

{como evitar que esse tipo de bug ocorra novamente}
> Ex: adicionar validação, melhorar observabilidade, cobrir cenário em testes.

---

**Labels**: `bug-report`, `{category}`, `{severity}`, `{squad}`, `{hub}`
**Assignee**: {ASSIGNEE ou "A definir"}
```

#### 5. Criar Card no Task Manager (via Adapter)

```bash
# Função: create_task_card
# Cria card no task manager configurado ou salva localmente
create_task_card() {
  local title="$1"
  local description="$2"
  local priority="$3"
  local category="$4"
  local labels="$5"

  if [ "$TASK_MANAGER_ENABLED" = true ]; then
    case "$TASK_MANAGER" in
      jira)
        TASK_MANAGER_KEY=$(mcp__claude_ai_Atlassian__createJiraIssue \
          --project="$(grep '^PROJECT_KEY=' "$IDE/ENV.md" | cut -d= -f2)" \
          --issueType="Bug" \
          --summary="$title" \
          --description="$description" \
          --priority="$priority" \
          --labels="$labels" | jq -r '.key')

        echo "✅ Card criado no Jira: $TASK_MANAGER_KEY"
        echo "$TASK_MANAGER_KEY"
        ;;

      linear)
        CARD_ID=$(linear issue create \
          --title="$title" \
          --description="$description" \
          --priority="$priority" \
          --label="$labels" \
          --team="$(grep '^LINEAR_TEAM_ID=' "$IDE/ENV.md" | cut -d= -f2)" \
          --json | jq -r '.id')

        echo "✅ Card criado no Linear: $CARD_ID"
        echo "$CARD_ID"
        ;;

      github)
        CARD_NUMBER=$(gh issue create \
          --title="$title" \
          --body="$description" \
          --label="$labels" \
          --json number | jq -r '.number')

        echo "✅ Issue criado no GitHub: #$CARD_NUMBER"
        echo "$CARD_NUMBER"
        ;;

      asana)
        echo "⚠️ Asana: use API/TOKEN_TASK_MANAGER ou crie o card manualmente e salve o GID como TASK_MANAGER_KEY"
        return 1
        ;;

      *)
        echo "⚠️ Task manager $TASK_MANAGER não suportado neste adapter"
        return 1
        ;;
    esac
  else
    # Fallback: Salvar card localmente
    mkdir -p "$SESSIONS_DIR/qa/bug-reports"
    card_file="$SESSIONS_DIR/qa/bug-reports/bug-$(date +%Y%m%d-%H%M%S).md"

    cat > "$card_file" << EOF
# $title

**Categoria**: $category
**Prioridade**: $priority
**Labels**: $labels
**Task Manager**: $TASK_MANAGER (offline/não configurado)

---

$description

---

**Ação necessária**: Criar card manualmente no $TASK_MANAGER
EOF

    echo "📝 Card salvo localmente: $card_file"
    echo "⚠️ Integração com $TASK_MANAGER indisponível. Crie card manualmente."
    echo "$card_file"
  fi
}

# Chamar função de criação
CARD_RESULT=$(create_task_card "$TITLE" "$CARD_CONTENT" "$SEVERITY" "$CATEGORY" "bug-report,$CATEGORY,$SEVERITY")
```

#### 6. Gerar Resumo

```markdown
✅ Bug report criado

**Título**: {TITLE}
**Prioridade**: {SEVERITY}
**Categoria**: {CATEGORY}
**Localização**: {LOCATION}

{Card $TASK_MANAGER: {ID} ou Card local: ./sessions/bug-reports/bug-XXX.md}

**Próximos passos**:
- Revisar e ajustar prioridade se necessário
- Atribuir para desenvolvedor apropriado
- Planejar correção na próxima sprint (P0/P1) ou backlog (P2/P3)
```

---

### Modo `batch` - Criar Múltiplos Cards

#### 1. Ler Relatório de Audit

```bash
audit_report="$FROM_AUDIT"

if [ ! -f "$audit_report" ]; then
  echo "⚠️ Relatório não encontrado: $audit_report"
  exit 1
fi
```

#### 2. Parsear Problemas do Relatório

```bash
# Extrair problemas por prioridade
problems=$(awk '/^### P[0-3]/,/^###/' "$audit_report")

# Aplicar filtro de prioridade
case "$PRIORITY_FILTER" in
  "P0,P1")
    problems=$(echo "$problems" | awk '/^### P0/,/^### P1/')
    ;;
  "P0,P1,P2")
    problems=$(echo "$problems" | awk '/^### P0/,/^### P2/')
    ;;
  "all")
    # Todos os problemas
    ;;
esac
```

#### 3. Iterar e Criar Cards

```bash
# Para cada problema identificado
while IFS= read -r problem; do
  # Extrair campos (título, categoria, localização, descrição)
  title=$(echo "$problem" | grep -oP '#### \K.*')
  category=$(echo "$problem" | grep -oP 'Categoria: \K.*')
  location=$(echo "$problem" | grep -oP 'Localização: \K.*')
  # ... extrair outros campos

  # Criar card usando modo create
  /eng-qa-bug-report create \
    --title="$title" \
    --category="$category" \
    --location="$location" \
    # ... outros argumentos
done
```

#### 4. Sumarizar Criação em Batch

```markdown
✅ Batch bug report concluído

**Cards criados**: {N}
- P0: {N}
- P1: {N}
- P2: {N}
- P3: {N}

**Relatório de origem**: {audit_report}

**Cards criados**:
| Card ID | Título | Prioridade | Categoria |
|---------|--------|------------|-----------|
| {ID-1} | {título} | P0 | BUG-CRÍTICO |
| {ID-2} | {título} | P1 | SEGURANÇA |
| ... | ... | ... | ... |

**Próximos passos**:
- Revisar cards P0 imediatamente
- Planejar correção de P1 na próxima sprint
- Priorizar P2/P3 no backlog
```

---

### Modo `generate-report` - Gerar Relatório

#### 1. Ler Arquivo de Bugs

```bash
bugs_file="$BUGS"

if [ ! -f "$bugs_file" ]; then
  echo "⚠️ Arquivo de bugs não encontrado: $bugs_file"
  exit 1
fi

# Espera formato JSON:
# [
#   {
#     "title": "...",
#     "category": "...",
#     "severity": "...",
#     "location": "...",
#     "description": "...",
#     "impact": "...",
#     "suggestion": "..."
#   },
#   ...
# ]
```

#### 2. Gerar Relatório Consolidado

```markdown
# Bug Report Consolidado

**Data**: $(date +%Y-%m-%d)
**Workspace**: ${WORKSPACE}
**Total de bugs**: {N}

---

## Resumo por Severidade

| Severidade | Quantidade |
|------------|------------|
| P0 (Crítico) | {N} |
| P1 (Alto) | {N} |
| P2 (Médio) | {N} |
| P3 (Baixo) | {N} |

## Resumo por Categoria

| Categoria | Quantidade |
|-----------|------------|
| BUG-CRÍTICO | {N} |
| SEGURANÇA | {N} |
| BUG-ALTO | {N} |
| CODE-SMELL | {N} |
| ... | ... |

---

## Bugs Detalhados

{Para cada bug, incluir estrutura completa do card}
```

#### 3. Salvar Relatório

```bash
output_file="${OUTPUT:-$SESSIONS_DIR/qa/bug-report-$(date +%Y%m%d-%H%M%S).md}"

mkdir -p "$(dirname "$output_file")"
echo "$REPORT_CONTENT" > "$output_file"

echo "✅ Relatório gerado: $output_file"
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Fluxo de Trabalho › Modo `create` › 0. Verificar Duplicatas | `/triage-issue` (skill externo `atlassian:triage-issue`) | Se `$TASK_MANAGER` estiver configurado e o skill estiver disponível; senão a busca é direta via MCP (não é skill) |
| Bug-to-Test (pós-criação) | `/eng-qa-cypress-e2e` | Se o usuário responder **[S] Gerar agora** à oferta de teste de regressão |

---

## Formato de Saída

### Card Individual (create)

```markdown
✅ Bug report criado

**Card**: {CARD_ID ou local path}
**Título**: {TITLE}
**Prioridade**: {SEVERITY}
**Categoria**: {CATEGORY}
**Localização**: {LOCATION}

**Próximos passos**: {ações sugeridas}
```

### Batch Creation (batch)

```markdown
✅ Batch bug report concluído

**Total de cards criados**: {N}
**Distribuição por prioridade**:
- P0: {N} cards
- P1: {N} cards
- P2: {N} cards
- P3: {N} cards

**Relatório detalhado**: {output_path}
```

### Report Generation (generate-report)

```markdown
✅ Relatório gerado

**Arquivo**: {output_path}
**Total de bugs**: {N}
**Formato**: {markdown | json | html}
```

---

## Regras

### Nunca
- Criar card P0/P1 sem passos de reprodução — um bug irreproduzível não pode ser investigado
- Criar card sem `--behavior-actual` E `--behavior-expected` — sem contraste claro o dev não sabe o que corrigir
- Aceitar título fora do formato `[SERVIÇO] descrição` — padronização é obrigatória para triagem
- Aceitar `--description` vago como "não funciona" ou "está quebrado" — exigir contexto objetivo
- Criar duplicatas sem verificar se já existe card similar (buscar no `$TASK_MANAGER` antes de criar)
- Pular validação por severidade — P0/P1 têm campos extras obrigatórios, sempre verificar

### Sempre
- Validar todos os campos obrigatórios antes de qualquer outra ação
- Incluir snippet do código problemático (±5 linhas em torno do `--location`)
- Incluir `git blame` da linha para rastreabilidade de quem/quando introduziu o bug
- Definir critério de aceitação (mesmo que inferido) — como saber que o bug foi resolvido?
- Sinalizar ausência de Correlation ID como débito técnico P2 quando `--affected-services` tem 2+ serviços
- Salvar localmente se task manager não disponível, com instrução de criação manual
- Notificar usuário com o ID do card criado e próximo passo sugerido (`/eng.debug {TASK_MANAGER_KEY}`)

---

## Referências (leia só o tema que a tarefa pedir)

Leia **só** o arquivo do tema que a tarefa pedir; o restante fica fora do contexto.

| Tema | Quando ler | Arquivo |
|------|-----------|---------|
| Integração com Task Managers (Adapter Pattern) | A tarefa configurar ou implementar o adapter de um task manager (Jira, Linear, GitHub, Asana), mapear prioridades, usar o fallback local ou adicionar um task manager novo | `references/1-integracao-task-managers.md` |
| Exemplos de Uso | Precisar de um exemplo completo dos modos create, batch ou generate-report | `references/2-exemplos-de-uso.md` |
| Bug-to-Test (pós-criação) | Depois de criar o card, a pessoa quiser gerar o teste que reproduz o bug | `references/3-bug-to-test.md` |

## Checklist de Conclusão

### Modo `create`
- [ ] Argumentos validados
- [ ] Severidade calculada
- [ ] Código da localização incluído
- [ ] Card estruturado gerado
- [ ] Card criado no task manager (ou salvo localmente)
- [ ] Usuário notificado

### Modo `batch`
- [ ] Relatório de audit lido
- [ ] Problemas parseados e filtrados
- [ ] Cards criados para cada problema
- [ ] Resumo gerado
- [ ] Usuário notificado

### Modo `generate-report`
- [ ] Arquivo de bugs lido
- [ ] Relatório consolidado gerado
- [ ] Relatório salvo no output
- [ ] Usuário notificado

---

## Tratamento de Erros

### Argumentos inválidos
- Exibir mensagem de erro clara
- Mostrar exemplos de uso correto
- Encerrar execução

### Arquivo não encontrado
- Verificar caminho fornecido
- Sugerir caminhos alternativos
- Listar arquivos disponíveis

### Task Manager indisponível
- Salvar cards localmente
- Gerar comandos CLI para execução manual (quando aplicável)
- Notificar usuário sobre fallback e como configurar

### Categoria/Severidade inválida
- Listar valores válidos
- Sugerir valor mais próximo
- Solicitar correção

---

## Mensagens de Status

### Início
```
📝 Bug Report iniciado

Modo: {create | batch | generate-report}
Argumentos: {lista de argumentos fornecidos}

Processando...
```

### Durante Processamento
```
⏳ Criando card {N} de {total}...
⏳ Parseando relatório de audit...
⏳ Gerando relatório consolidado...
```

### Conclusão
```
✅ Bug report concluído!

{Resumo específico do modo}

**Próximos passos**: {ações recomendadas}
```

---

