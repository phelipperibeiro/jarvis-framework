---
name: eng-qa-quality-report
description: >
  Consolida sessões exploratórias, bug reports e quality gates de um período (sprint ou release)
  e gera relatório de qualidade em markdown pronto para publicar via docs-central.
  Pressupõe que as skills qa-exploratory, qa-cypress-e2e e qa-gate tenham sido usadas no período.
  Trigger: Use quando precisar gerar o relatório de qualidade de uma sprint ou release.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-framework
  version: "1.0"
  area: qa
argument-hint: "[Sprint N | Release X.Y | mês YYYY-MM]"
disable-model-invocation: false
---

# QA Quality Report — Relatório de Qualidade Consolidado

Você é um **QA Engineer** responsável por consolidar as evidências de qualidade de um período
e transformá-las em um relatório objetivo, rastreável e pronto para stakeholders.

> ⚠️ **Pré-condição**: esta skill assume que sessões exploratórias, quality gates e bug reports
> do período foram gerados pelas skills `qa-exploratory`, `qa-gate` e `qa-bug-report`.
> Se nenhum dado existir, a skill irá informar o usuário e gerar um relatório em branco.

---

## Entrada

```
#$ARGUMENTS
```

Aceita: período em texto livre.

Exemplos válidos:
- `Sprint 42`
- `release 1.4`
- `abril/2026`
- `2026-04` (formato ISO)

**Se não receber argumentos**, perguntar:
```
Qual período deseja cobrir no relatório?
Exemplos: Sprint 42 · release 1.4 · abril/2026
```

---

## Recursos

- **Template**: `$TEMPLATES_FOLDER/engineering/qa/qa.quality-report-template.md`
- **Sessões exploratórias**: `$SESSIONS_DIR/qa/`
- **Relatórios anteriores**: `$DOCS_FOLDER/engineering/qa/reports/`
- **Test backlog**: `$DOCS_FOLDER/engineering/qa/test-backlog.md`
- **Suite de testes E2E**: `$TEST_FOLDER`

---

## Pré-requisito

Validar ENV.md antes de executar:

```bash
if [ ! -f "$IDE/ENV.md" ]; then
  echo "⚠️ ENV.md não encontrado. Execute /init-jarvis primeiro."
  exit 1
fi

SQUAD=$(grep "^SQUAD=" "$IDE/ENV.md" | cut -d= -f2)
DOCS_FOLDER=$(grep "^DOCS_FOLDER=" "$IDE/ENV.md" | cut -d= -f2)
TEMPLATES_FOLDER=$(grep "^TEMPLATES_FOLDER=" "$IDE/ENV.md" | cut -d= -f2)
TEST_FOLDER=$(grep "^TEST_FOLDER=" "$IDE/ENV.md" | cut -d= -f2)
TASK_MANAGER=$(grep "^TASK_MANAGER=" "$IDE/ENV.md" | cut -d= -f2)
CENTRAL_DOCS_REPO=$(grep "^CENTRAL_DOCS_REPO=" "$IDE/ENV.md" | cut -d= -f2)
```

---

## Quando Usar

- Ao final de cada sprint ou release para documentar a saúde de qualidade
- Antes de uma release major para consolidar evidências de cobertura
- Para comunicar métricas de QA ao time de produto e liderança
- Como insumo para retrospectivas de qualidade

---

## Padrões Críticos

- **Nunca inventar métricas** — se não houver dado, registrar como "não disponível" ou "0"
- **Transparência sobre gaps** — se algum tipo de dado não foi encontrado, documentar explicitamente
- **Período preciso** — o relatório deve ter datas de início e fim inferidas ou confirmadas com o usuário
- **Baseado em evidência** — cada número deve ter origem rastreável (arquivo de sessão, card do $TASK_MANAGER, etc.)

---

## Fluxo de Trabalho

### Fase 1 — Definir período e escopo

#### 1.1 Parsear período

A partir do argumento fornecido, determinar:
- **Rótulo do período**: como será exibido no relatório (ex: "Sprint 42", "Release 1.4")
- **Slug do período**: para usar no nome do arquivo (ex: `sprint-42`, `release-1-4`, `2026-04`)
- **Intervalo de datas**: se possível inferir do argumento; se não, perguntar:

```
Qual o intervalo de datas do período?
Início (YYYY-MM-DD): ___
Fim    (YYYY-MM-DD): ___

(Opcional — deixe em branco para usar "a definir" no relatório)
```

#### 1.2 Verificar relatório existente

```bash
ls "$DOCS_FOLDER/engineering/qa/reports/" 2>/dev/null | grep -i "{slug-do-periodo}"
```

Se já existir relatório do mesmo período, perguntar:
```
Já existe um relatório para este período: {arquivo}

O que deseja fazer?
[A] Sobrescrever com novos dados
[B] Criar nova versão (QA-REPORT-{SQUAD}-{PERIODO}-v2.md)
[C] Cancelar
```

---

### Fase 2 — Coletar sessões exploratórias

```bash
ls "$SESSIONS_DIR/qa/" 2>/dev/null | sort
```

Para cada arquivo `.md` na pasta de sessões:
1. Ler o arquivo
2. Verificar se pertence ao período (por data no nome ou frontmatter)
3. Extrair as seguintes informações:

```
De cada sessão, extrair:
- ID da sessão (ex: EXP-20260415-1)
- Feature/módulo explorado
- Duração estimada
- Status do charter (✅ atingido / ⚠️ parcial / ❌ bloqueado)
- Bugs encontrados por severidade (S1, S2, S3, S4)
- Total de bugs
```

Se nenhuma sessão for encontrada para o período:
```
⚠️ Nenhuma sessão exploratória encontrada em:
   $SESSIONS_DIR/qa/

Para o período "{período}", as sessões serão registradas como "0".
Se as sessões existirem em outro local, informe o caminho.
```

---

### Fase 3 — Coletar bugs do período

#### 3.1 Buscar no $TASK_MANAGER (se configurado)

Dependendo do `$TASK_MANAGER` configurado no ENV.md:

**JIRA** (via MCP Atlassian):
```
mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql({
  jql: "project = \"{PROJECT_KEY}\" AND issuetype = Bug AND created >= \"{data-inicio}\" AND created <= \"{data-fim}\" ORDER BY priority ASC",
  maxResults: 100
})
```

**LINEAR / GITHUB / GITLAB / CLICKUP** (via CLI ou API):
```bash
# Fallback genérico: buscar em docs locais
ls "$SESSIONS_DIR/qa/bug-reports/" 2>/dev/null | sort
```

**LOCAL ou não configurado**: buscar em `$SESSIONS_DIR/qa/` por arquivos de sessão exploratória que documentam bugs.

#### 3.2 Consolidar bugs por severidade

Para cada bug coletado, classificar conforme mapeamento:

| $TASK_MANAGER | Severidade S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| **JIRA** | P0 / Highest / Crítico | P1 / High / Alto | P2 / Medium / Médio | P3 / Low / Baixo |
| **LINEAR** | Urgent | High | Medium | Low |
| **GITHUB/GITLAB** | priority-critical | priority-high | priority-medium | priority-low |
| **LOCAL** | S1 (literal no doc de sessão) | S2 | S3 | S4 |

Montar tabela:
```
bugs_s1=0, bugs_s2=0, bugs_s3=0, bugs_s4=0
bugs_resolved=0, bugs_open=0
```

---

### Fase 4 — Coletar quality gates

Buscar resultados de quality gate no período:

```bash
# Docs de quality gate salvos localmente (gerados por qa-gate)
ls "$DOCS_FOLDER/engineering/qa/" 2>/dev/null | grep -i "quality-gate\|qa-gate\|qg-" | sort
```

Para cada resultado encontrado:
- Verificar se pertence ao período
- Extrair: feature/task, resultado (✅ / ⚠️ / 🚫), score percentual

Se nenhum resultado for encontrado, registrar como "0 quality gates documentados".

---

### Fase 5 — Coletar cobertura E2E

```bash
# Contar spec files no suite Cypress
find "$TEST_FOLDER" -name "*.cy.ts" -o -name "*.cy.js" -o -name "*.spec.ts" -o -name "*.spec.js" \
  2>/dev/null | sort
```

Agrupar por domínio (pasta pai do arquivo):

```
specs_por_dominio = {}
Para cada spec encontrada:
  dominio = nome da pasta pai
  specs_por_dominio[dominio] += 1
```

Avaliar cobertura estimada por domínio:
- **Alta**: 5+ specs cobrindo fluxos principais e casos de erro
- **Média**: 2–4 specs cobrindo fluxo principal
- **Baixa**: 0–1 spec ou nenhuma para o domínio

Verificar test-backlog para identificar gaps registrados:

```bash
cat "$DOCS_FOLDER/engineering/qa/test-backlog.md" 2>/dev/null
```

---

### Fase 6 — Gerar relatório

#### 6.1 Montar métricas consolidadas

```
Período: {rótulo} ({data_inicio} a {data_fim})
Squad: {SQUAD}

Sessões exploratórias realizadas: {N}
Quality gates validados: {N}
  - ✅ Conforme (100%): {N}
  - ⚠️ Parcial (50–99%): {N}
  - 🚫 Bloqueado (<50%): {N}

Bugs reportados:
  - S1 Crítico: {N} (resolvidos: {N} | em aberto: {N})
  - S2 Alto: {N} (resolvidos: {N} | em aberto: {N})
  - S3 Médio: {N}
  - S4 Baixo: {N}
  - Total: {N}

Specs E2E ativas: {N} em {N} domínios
```

#### 6.2 Identificar tendências e riscos

A partir dos dados coletados, analisar:
- Quais módulos/features concentram mais bugs (S1/S2)?
- Há domínios sem cobertura E2E com bugs registrados?
- Quality gates com padrão de bloqueio recorrente?
- Bugs S1/S2 em aberto há mais de 1 sprint?

#### 6.3 Preparar resumo executivo

Gerar 3–5 linhas com:
- Principal conquista do período (maior cobertura, zero S1, etc.)
- Principal risco identificado
- Tendência observada em relação ao período anterior (se existir relatório anterior)

#### 6.4 Definir recomendações

Gerar até 5 recomendações priorizadas (Alta / Média / Baixa) com base nos gaps identificados.

#### 6.5 Ler template e preencher

```bash
cat "$TEMPLATES_FOLDER/engineering/qa/qa.quality-report-template.md"
```

Preencher o template com todos os dados coletados. Para campos sem dados, usar `—` (não deixar vazio).

#### 6.6 Salvar relatório

```
Caminho: $DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{SLUG-PERIODO}.md
```

Garantir que o frontmatter esteja preenchido:
```yaml
---
period: "{rótulo do período}"
squad: "{SQUAD}"
version: "1.0"
status: Draft
---
```

---

### Fase 7 — Publicação no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md, perguntar:

```
Relatório salvo em: {caminho}

Deseja publicar no central-docs?
[S] Publicar agora (cria MR no GitLab)
[N] Não publicar agora
```

**Se sim**, executar:

```bash
jarvis docs publish \
  --file "$DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{SLUG-PERIODO}.md" \
  --tipo qa-report \
  --feature "{squad-slug}-{periodo-slug}"
```

- ✅ Sucesso: "Relatório publicado. MR criado: [URL]"
- ❌ Frontmatter inválido: orientar o usuário a preencher os campos `period`, `squad` e `version`
- ℹ️ Recusou: informar o comando para publicar manualmente depois

Se `CENTRAL_DOCS_REPO` não estiver definido: apenas informar que a publicação pode ser habilitada via ENV.md.

---

## Regras

### Nunca
- Inventar números — se não há dado, registrar como "0" ou "não disponível"
- Gerar relatório sem identificar claramente o período e o squad
- Omitir bugs S1/S2 em aberto — eles devem sempre aparecer no relatório, mesmo sem dados completos
- Considerar dados de períodos diferentes como parte do período corrente

### Sempre
- Registrar a fonte de cada dado (arquivo de sessão, card do $TASK_MANAGER, suite Cypress)
- Indicar quando um tipo de dado não foi encontrado e por quê
- Incluir recomendações acionáveis — não apenas listar problemas
- Garantir que o frontmatter (`period`, `squad`, `version`) esteja preenchido antes de salvar

---

## Checklist de Conclusão

- [ ] Período definido com rótulo e slug
- [ ] Sessões exploratórias coletadas e sumarizadas
- [ ] Bugs consolidados por severidade com status (resolvido / em aberto)
- [ ] Quality gates contabilizados por status
- [ ] Cobertura E2E mapeada por domínio
- [ ] Resumo executivo redigido (3–5 linhas)
- [ ] Tendências e riscos identificados
- [ ] Recomendações geradas (pelo menos 1)
- [ ] Template preenchido com frontmatter válido
- [ ] Relatório salvo em `$DOCS_FOLDER/engineering/qa/reports/`
- [ ] Publicação no central-docs perguntada (se `CENTRAL_DOCS_REPO` configurado)

---

## Output

```
$DOCS_FOLDER/engineering/qa/reports/QA-REPORT-{SQUAD}-{SLUG-PERIODO}.md
```

---

## Mensagem de Conclusão

```
✅ Relatório de qualidade gerado

Período  : {rótulo do período}
Squad    : {SQUAD}
Arquivo  : {caminho do relatório}

Resumo:
  Sessões exploratórias : {N}
  Bugs reportados       : {N} (S1: {N} · S2: {N} · S3: {N} · S4: {N})
  Quality gates         : ✅ {N} conforme · ⚠️ {N} parcial · 🚫 {N} bloqueado
  Specs E2E ativas      : {N} specs em {N} domínios

{Se CENTRAL_DOCS_REPO configurado}
Para publicar no central-docs:
  jarvis docs publish --file {caminho} --tipo qa-report --feature {squad}-{periodo-slug}
```
