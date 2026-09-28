---
name: eng-tech-analyst
description: Guia o Tech Analyst pelo fluxo de diagnóstico e triagem de chamados — da recepção do card no HUBS board até resolução ou encaminhamento qualificado para o squad dono
version: "1.1.0"
prefix: eng-
area: ENGINEERING
position: TECH ANALYST
---

# Skill: eng-tech-analyst

**Objetivo:** Conduzir o fluxo de atendimento técnico — diagnóstico, verificação de existência, classificação, avaliação de impacto, resolução ou encaminhamento qualificado.

---

## Posição Organizacional

> ⚠️ O Tech Analyst é **transversal** — não pertence a nenhuma squad de desenvolvimento.
> No ENV.md, o campo `SQUAD` deve ser configurado como `SUPPORT`.
> Interfaces com todas as squads, mas reporta ao Tech Lead ou Engineering Manager.

---

## Contexto de Uso

Este skill é ativado quando o Tech Analyst recebe um card no **quadro HUBS** (`TASK_MANAGER_HUBS_BOARD`) do `$TASK_MANAGER` (tipicamente Jira).
O time de atendimento/N2 cria cards nesse board quando não consegue resolver o chamado.
O TA não cria novos cards — **trabalha sempre sobre o card existente** no HUBS board.

> Requer `TASK_MANAGER` preenchido. Sem board (freelance) este skill não se aplica.

Ao final do fluxo, o card do HUBS é:
- **Bug repetido**: vinculado como sub-bug do principal + movido para o board do squad
- **Bug novo**: movido para o board do squad (backlog ou sprint, conforme impacto)

---

## Pré-requisitos obrigatórios

Antes de iniciar qualquer atendimento, verificar no `ENV.md`:

```
TASK_MANAGER             ← obrigatório (jira | linear | github | asana) — sem board este skill não roda
TASK_MANAGER_HUBS_BOARD  ← project key / board de triagem N2 (ex: HUBS)
TOKEN_TASK_MANAGER       ← se o vendor não tiver MCP
TOKEN_OBSERVABILITY      ← recomendado — enriquece alertas ao PM
OBSERVABILITY_ORG        ← se OBSERVABILITY=sentry
OBSERVABILITY            ← sentry | datadog | grafana (opcional)
```

Se `TASK_MANAGER` ou `TASK_MANAGER_HUBS_BOARD` estiver ausente:
```
→ Interromper o fluxo
→ "ENV.md incompleto: TASK_MANAGER e TASK_MANAGER_HUBS_BOARD são obrigatórios para o Tech Analyst."
→ Não atender chamados até que estejam configurados
```

Observabilidade ausente → avisar, mas **não** bloquear a triagem (só perde enriquecimento de alertas).

### Resolução de tools do `$TASK_MANAGER`

Não hardcodar Jira. Resolver a ferramenta pelo valor de `TASK_MANAGER`:

| `TASK_MANAGER` | Ler card | Comentar | Buscar similares | Editar / linkar |
|----------------|----------|----------|------------------|-----------------|
| `jira` | MCP Atlassian `getJiraIssue` | `eng-task-comment` / `addCommentToJiraIssue` | JQL via MCP | `editJiraIssue` / issue links |
| `linear` | Linear MCP/CLI | `eng-task-comment` | busca Linear | Linear update/link |
| `github` | `gh issue view` | `eng-task-comment` | `gh issue list` | `gh issue edit` |
| `asana` | Asana API | `eng-task-comment` | search tasks | Asana update |

Exemplos abaixo com sintaxe Jira são **ilustrativos** quando `TASK_MANAGER=jira`. Com outro vendor, use a linha equivalente da tabela. Comentários preferir sempre `eng-task-comment {HUBS_CARD_KEY} "..."`.

---

## Fluxo de Decisão

### Passo 1 — Receber card do HUBS board

O card chega via quadro `$TASK_MANAGER_HUBS_BOARD`. Leia o card (`{HUBS_CARD_KEY}`):

```
# Exemplo TASK_MANAGER=jira:
mcp__getJiraIssue
  issueIdOrKey: {HUBS_CARD_KEY}

# linear / github / asana: tool equivalente da tabela acima
```

**O problema está bem descrito?**

Critérios mínimos para considerar "bem descrito":
- Qual ação o usuário tentou fazer?
- O que aconteceu (sintoma)?
- O que deveria ter acontecido (esperado)?
- Quando ocorreu (data/hora)?
- Dados do usuário/conta afetada (ID, email, etc.)?

Se **não estiver bem descrito**:
```
→ Comentar no HUBS card via eng-task-comment solicitando as informações faltantes ao N2.
→ Não avançar sem diagnóstico mínimo.
```

Se **estiver bem descrito** → ir ao Passo 2.

---

### Passo 2 — Verificar se o bug já existe

#### 2.1 — IA extrai keywords do card

Antes de buscar, a IA analisa a descrição do card e extrai as dimensões do bug:

| Dimensão | Exemplo |
|----------|---------|
| **Módulo** | checkout, login, cadastro, pagamento, relatório |
| **Sintoma** | timeout, erro-404, dado-incorreto, tela-branca, loop |
| **Ação** | salvar, enviar, carregar, exportar, autenticar |
| **Contexto** | mobile, desktop, pj, pf, producao |

Estas keywords serão usadas tanto para busca quanto para taggear o bug se for novo.

#### 2.2 — IA busca candidatos (duas passagens)

**Passagem 1 — por keywords (labels/`kw:*` no board):**
```
# Exemplo TASK_MANAGER=jira:
mcp__searchJiraIssuesUsingJql
JQL: project != {TASK_MANAGER_HUBS_BOARD} AND type = Bug
     AND labels in ("kw:{keyword-1}", "kw:{keyword-2}") ORDER BY created DESC

# Outros vendors: busca equivalente por label/tag no board (fora do HUBS)
```
> Busca em boards de squad, excluindo o HUBS (triagem).
> Retorna bugs já tagueados com as mesmas keywords — match mais preciso.

**Passagem 2 — por texto (fallback):**
```
# Exemplo TASK_MANAGER=jira:
mcp__searchJiraIssuesUsingJql
JQL: project != {TASK_MANAGER_HUBS_BOARD} AND type = Bug
     AND summary ~ "{palavras-chave}" ORDER BY created DESC

# Outros vendors: search por texto no título/descrição
```
> Cobre bugs antigos (antes do sistema de keywords) e casos de keywords diferentes para o mesmo conceito.

Deduplica resultados das duas passagens. Limitar a 5 candidatos totais.

#### 2.3 — IA rankeia, apresenta candidatos e emite sugestão

Para cada candidato, calcular score de similaridade:
- **Keywords em comum** com o card atual (peso maior)
- **Similaridade textual** do summary

Apresentar ao Tech Analyst (máximo 3, do mais ao menos similar) **sempre com sugestão explícita da IA**:

**Com candidatos encontrados:**
```
Encontrei {N} bug(s) possivelmente relacionado(s):

1. {TASK_MANAGER_KEY} — "{summary}" [Alta similaridade]
   Keywords em comum: checkout, timeout, pagamento
   Motivo: {explicação objetiva}

2. {TASK_MANAGER_KEY} — "{summary}" [Média similaridade]
   Keywords em comum: checkout
   Motivo: {explicação objetiva}

💡 Sugestão: este parece ser o mesmo bug que {TASK_MANAGER_KEY_1} — {motivo resumido em 1 linha}.
   Confirme ou ajuste abaixo.
```

**Sem candidatos:**
```
Nenhum bug similar encontrado após duas passagens de busca
(keywords: {lista} | texto: "{termos}").

💡 Sugestão: parece ser um bug novo — nenhuma ocorrência anterior encontrada no `$TASK_MANAGER`.
   Confirme ou informe a chave se souber que existe.
```

> A sugestão é baseada no score mais alto. Score > 0.7 → "parece ser o mesmo bug".
> Score entre 0.5–0.7 → "possivelmente relacionado, confirme com cuidado".
> Score < 0.5 ou sem candidatos → "parece ser bug novo".

#### 2.4 — Tech Analyst confirma (AskUserQuestion)

```
AskUserQuestion:
  "Este chamado é o mesmo bug que algum dos tickets acima?"
  Opções:
  - "Sim — é o {TASK_MANAGER_KEY_1} [sugerido]"   ← destacar o sugerido quando score > 0.7
  - "Sim — é o {TASK_MANAGER_KEY_2}"
  - "Não — é um bug novo [sugerido]"       ← destacar quando nenhum candidato
  - "Existe, mas não está na lista" → campo livre para informar a chave
```

> **Regra crítica:** a decisão final é sempre do Tech Analyst.
> A IA sugere com base em score; o humano confirma. Uma identificação errada polui o contador de frequência.

**Tech Analyst confirma existente:**
```
→ Passo 3A: Vincular como sub-bug e atualizar frequência
```

**Tech Analyst confirma bug novo:**
```
→ Passo 3B: Classificar, taggear e mover para o board do squad
```

---

### Passo 3A — Bug existente: Vincular como sub-bug e atualizar frequência

Se o bug principal é **legado sem keywords** (não tem labels/tags `kw:*`), adicionar antes:

```
AskUserQuestion:
  "Este bug não tem keywords. Quais aplicar?"
  → IA sugere baseado no card do HUBS
  → TA confirma

→ Aplicar labels/tags kw:* no bug principal (tool do `$TASK_MANAGER`):
  # Exemplo jira:
  mcp__editJiraIssue
  labels: ["kw:{keyword-1}", "kw:{keyword-2}", ...]
```

**Vincular o card do HUBS como sub-bug do principal:**

```
# Exemplo TASK_MANAGER=jira — outros vendors: link/relate equivalente
1. Verificar tipos de link disponíveis (se necessário):
   mcp__getIssueLinkTypes

2. Criar vínculo:
   mcp__createIssueLink
     type: { name: "Duplicate" }   ← ou o tipo "sub-bug de" no board
     inwardIssue: { key: "{HUBS_CARD_KEY}" }
     outwardIssue: { key: "{PRINCIPAL_TASK_MANAGER_KEY}" }

3. Mover o card do HUBS para o board do squad:
   mcp__editJiraIssue
     issueIdOrKey: {HUBS_CARD_KEY}
     fields: { project: { key: "{board_code do squad confirmado}" } }
```

> Após vincular, o card do HUBS passa a aparecer no board do squad como sub-bug do principal.
> O bug principal acumula o histórico completo de ocorrências.

Registrar a ocorrência no card principal (skill `eng-task-comment`):

```
Último sub-bug: {HUBS_CARD_KEY}
Área: {FRONT|BACK|BD|PROCESSO}
Keywords: {lista}
```

> Cada sub-bug vinculado = 1 ocorrência no histórico do card. Sem event bus.

```
→ Encerrar atendimento — registrar no card do HUBS como
  "Vinculado como sub-bug de {PRINCIPAL_TASK_MANAGER_KEY} — bug conhecido, aguardando fix"
```

---

### Passo 3B — Bug novo: Classificar, taggear e mover para o squad

#### 3B.0 — Confirmar keywords com o Tech Analyst

As keywords extraídas no Passo 2.1 serão aplicadas como labels no card.
Apresentar para confirmação antes de mover:

```
AskUserQuestion:
  "Keywords identificadas para este bug: {kw:checkout, kw:timeout, kw:pagamento}
   Deseja ajustar alguma?"
  Opções:
  - "Estão corretas"
  - "Quero ajustar" → campo livre para editar
```

> Keywords usam o prefixo `kw:` nos labels/tags do `$TASK_MANAGER` para diferenciar de outras labels.

#### 3B.1 — Classificar área do bug

Determinar a área responsável:

| Classificação | Critério |
|---------------|----------|
| `FRONT` | Problema visual, comportamento de UI, formulário, renderização |
| `BACK` | Erro de API, lógica de negócio, falha de processamento, dados incorretos |
| `BD` | Inconsistência de dados, constraint violada, dado faltante/duplicado |
| `PROCESSO` | Fluxo operacional incorreto, regra de negócio mal implementada |

#### 3B.2 — Determinar squad dona e avaliar impacto

**Fonte 1 — taxonomy.modules (sempre consultar primeiro):**

A IA cruza as keywords do bug com o campo `modules` de cada squad em `taxonomy.md`:

```
Score por squad = keywords do bug que aparecem nos modules do squad / total de keywords do bug
```

Se score > 0 em algum squad → apresentar candidatos e pular para confirmação.

**Fonte 2 — Central Docs (fallback: sem match em taxonomy):**

```
skill: docs-central (Modo 1: Buscar Docs)
Query: "ownership {módulo identificado nas keywords}"
→ Buscar em ARDs, PRDs e RFCs menção ao squad dono do módulo
```

**Fonte 3 — Histórico do `$TASK_MANAGER` (fallback final):**

```
# Exemplo TASK_MANAGER=jira:
mcp__searchJiraIssuesUsingJql
JQL: labels in ("kw:{keyword-principal}") AND type = Bug ORDER BY created DESC LIMIT 10
→ Verificar em qual board_code a maioria dos bugs foi criada

# Outros vendors: busca por tag/label equivalente
```

**Confirmação pelo TA (após qualquer fonte):**

```
AskUserQuestion:
  "Squad sugerida para este bug:"
  Opções:
  - "{SQUAD_1} — módulos em comum: {lista} [via taxonomy]"
  - "{SQUAD_2} — {motivo} [via Central Docs / histórico do TASK_MANAGER]"
  - "Outra squad" → campo livre
```

**Avaliar impacto:**

| Critério | Alto | Baixo |
|----------|------|-------|
| Usuários afetados | Múltiplos / todos | Isolado / específico |
| Funcionalidade crítica | Sim (pagamento, auth, core) | Não (secundária) |
| Bloqueio total | Sim | Não (workaround existe) |
| Regressão recente | Sim (deploy recente) | Não |

#### 3B.3 — Mover card do HUBS para o board do squad

Aplicar keywords e mover o card em sequência (`$TASK_MANAGER` — exemplos Jira):

```
# Exemplo TASK_MANAGER=jira
1. Aplicar keywords e label support-item:
   mcp__editJiraIssue
     issueIdOrKey: {HUBS_CARD_KEY}
     labels: ["kw:{keyword-1}", "kw:{keyword-2}", ..., "support-item"]

2. Mover para o board do squad:
   mcp__editJiraIssue
     issueIdOrKey: {HUBS_CARD_KEY}
     fields: { project: { key: "{board_code do squad confirmado}" } }

3. Destino dentro do board (AskUserQuestion):
   "O card vai para:"
   - "Backlog do squad" → não alterar sprint
   - "Sprint atual"     → editar sprint/iteration no vendor
```

> ⚠️ A decisão de sprint vs backlog é baseada no impacto:
> - Alto impacto → sugerir sprint atual (TA confirma)
> - Médio/baixo impacto → backlog

Se o impacto for **alto**, perguntar antes de comentar no card:

```
AskUserQuestion:
  "Descreva o impacto em linguagem de negócio (opcional — vai no comentário do card):"
  Opções:
  - "Pular" → não inclui impact_description
  - Texto livre → ex: "Usuários PJ não conseguem exportar relatório de NF no mobile"
```

Registrar no card (skill `eng-task-comment`): área, impacto, keywords e squad de destino.
Se `MESSAGE_COMUNICATOR` estiver configurado e impacto alto, avisar o PM no canal do squad. Sem event bus.

---

### Passo 4 — Executar solução no Tech Analyst

> ⚠️ **Regras críticas:**
> - BD: somente leitura — NUNCA executar INSERT, UPDATE, DELETE em produção
> - MCP: usar apenas ações disponíveis no backoffice
> - Scripts: executar apenas scripts aprovados e auditáveis
> - Documentar cada ação executada

Executar a solução com as ferramentas disponíveis:

```
Ferramentas disponíveis:
- Backoffice do sistema (ações de admin)
- MCP (ações internas via ferramenta)
- BD read-only (SELECT para diagnóstico e verificação)
- Scripts internos aprovados (validar com Tech Lead antes de usar)
```

Após executar:
1. Verificar que o problema foi resolvido
2. Registrar solução no card do HUBS com detalhes técnicos
3. Voltar ao Passo 3A para atualizar frequência do bug principal

---

### Passo 5 — Encaminhamento qualificado

> **Regra crítica:** Nunca encaminhar por reflexo. Encaminhar somente após ter:
> 1. Diagnóstico claro do problema
> 2. Área identificada (Front/Back/BD/Processo)
> 3. Impacto avaliado (alto/baixo)
> 4. Confirmado que está fora do escopo do Tech Analyst

O card já existe no HUBS board — **não criar novo ticket**.
O encaminhamento é feito movendo o card para o board do squad (Passo 3B.3).

**Destino no board do squad depende do impacto:**

```
Alto impacto:
→ Executar Passo 3B.2 e 3B.3 com impact=alto
→ Card vai preferencialmente para a sprint atual do squad
→ Avisar PM via `$MESSAGE_COMUNICATOR` se configurado (sem event bus)

Médio/baixo impacto:
→ Executar Passo 3B.2 e 3B.3 com impact=medio/baixo
→ Card vai para o backlog do squad
→ Frequência = contagem de sub-bugs / comments no card principal (`eng-task-comment`) — sem Redis
```

Registrar no card do HUBS (via `eng-task-comment`) antes de mover:

```
eng-task-comment {HUBS_CARD_KEY} "Encaminhado para squad {SQUAD} — {motivo}. Impacto: {alto|medio|baixo}. HS: {HS_TICKET_ID}"
```

---

## Padrão de Descrição para Cards Movidos

Ao mover o card do HUBS para o squad, verificar se a descrição segue o padrão mínimo.
Se estiver incompleta, enriquecer via edit do `$TASK_MANAGER` (ex. Jira: `mcp__editJiraIssue`):

```markdown
## Resumo
{Uma linha clara descrevendo o bug — inclua o contexto}
ex: "Usuário não consegue finalizar pagamento quando endereço tem acento"

## Ambiente
- Ambiente: Produção
- Data/hora da ocorrência: {DATA}
- Usuário/conta afetada: {ID ou email — anonimizar se necessário}

## Passos para Reprodução
1. {passo 1}
2. {passo 2}
3. {resultado obtido}

## Comportamento Esperado
{O que deveria ter acontecido}

## Diagnóstico Técnico
{O que o Tech Analyst investigou — logs, queries, observações}
{Área identificada: FRONT / BACK / BD / PROCESSO}
{Impacto: alto / baixo}

## Chamado de Origem
HS: {ID do ticket no Helpscout}
HUBS card: {HUBS_CARD_KEY}
```

---

## Comunicação Padrão

### Para QA (frequência alta — via `$MESSAGE_COMUNICATOR` se configurado)
```
⚠️ [Tech Analyst] Bug {TASK_MANAGER_KEY} — Alta Frequência
{N} ocorrências registradas (sub-bugs / comments no card).
Área: {CLASSIFICAÇÃO}
Link: {TASK_MANAGER_URL_BASE}/.../{TASK_MANAGER_KEY}
Recomendação: revisar cobertura de testes ou priorizar fix.
```

### Para PM (impacto alto — via `$MESSAGE_COMUNICATOR` + dados de `$OBSERVABILITY` se houver)
```
🚨 [Tech Analyst] Bug de alto impacto — Priorização necessária
Problema: {descrição em linguagem de negócio}
Área técnica: {CLASSIFICAÇÃO}
Observabilidade: {N ocorrências} · {M usuários afetados} · desde {DATA}
Card: {TASK_MANAGER_URL_BASE}/.../{TASK_MANAGER_KEY}
```

---

## Ferramentas por Passo

| Passo | Ferramenta |
|-------|------------|
| Receber card | `$TASK_MANAGER` HUBS board (MCP se `jira`; senão adapter/`eng-task-comment`) |
| Verificar existência | Busca no board (JQL se Jira) |
| Vincular sub-bug | Link de issue do vendor |
| Mover card para squad | Edit do card no `$TASK_MANAGER` |
| Atualizar frequência | Comentário no card (`eng-task-comment`) — sem Redis / event bus |
| Classificar + impacto | Comentário no card (`eng-task-comment`) |
| Executar solução | MCP + BD read-only + backoffice |
| Comunicar PM / QA | Comentário no card + `$MESSAGE_COMUNICATOR` se configurado |

---

## Regras Críticas

- **NUNCA** criar novo ticket no `$TASK_MANAGER` — o card do HUBS board já existe
- **NUNCA** escrever no banco de dados de produção — somente leitura
- **NUNCA** encaminhar sem diagnóstico completo (área + impacto avaliados)
- **SEMPRE** vincular como sub-bug antes de registrar a ocorrência no card principal
- **SEMPRE** mover o card do HUBS para o board do squad ao final do atendimento
- **SEMPRE** registrar no card do HUBS o que foi feito (comment antes de mover)
- **SEMPRE** registrar a ocorrência no card principal ao confirmar um bug existente
- **SEMPRE** usar linguagem de negócio ao comunicar PM, linguagem técnica ao comunicar QA/Dev
