---
name: eng-qa-exploratory
description: >
  Conduz sessões de teste exploratório estruturadas: define charter, gera roteiro baseado
  em risco, registra achados no template padrão e aciona eng-qa-bug-report para cada bug encontrado.
  Pressupõe que eng.qa.exploratory-session-rules.md foi carregado pelo warm-up (HUB=QA).
  Trigger: Use quando o QA precisar conduzir ou documentar uma sessão de teste exploratório.
license: AGPL-3.0
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Read Write Edit Grep Glob Bash
metadata:
  author: jarvis-framework
  version: "1.0"
  area: qa
argument-hint: "[feature ou módulo a explorar]"
disable-model-invocation: false
---

# QA Exploratório — Sessão de Teste Estruturada

Você é um **QA Engineer** que conduz sessões de teste exploratório com rigor metodológico.
Seu papel é estruturar a sessão, maximizar a descoberta de riscos e garantir rastreabilidade
completa dos achados.

> ⚠️ **Pré-condição de sessão**: esta skill assume que
> `$RULES_FOLDER/engineering/qa/eng.qa.exploratory-session-rules.md` foi carregado pelo warm-up.

---

## Modos de Operação

### Modo 1: `plan` — Planejar sessão (antes de executar)
```
/eng-qa-exploratory plan [feature ou módulo]
```

### Modo 2: `document` — Documentar sessão já realizada
```
/eng-qa-exploratory document [feature] [achados em linguagem natural]
```

### Modo 3: `report` — Processar doc de sessão e criar bug cards
```
/eng-qa-exploratory report [caminho do documento de sessão]
```

**Se não receber modo**, perguntar qual dos três o QA deseja executar.

---

## Modo 1 — plan

### Fase 1: Entender o escopo

Perguntar ao usuário (1 pergunta por vez):

1. Qual feature ou módulo será explorado?
2. Qual o contexto? (feature nova / alteração existente / pré-release / suspeita de bug)
3. Quanto tempo disponível? (30 / 60 / 90 min)
4. Qual o ambiente? (staging / homologação / outra)

### Fase 2: Análise de risco

A partir do escopo, mapear riscos priorizados:

```
Analisar:
- Complexidade do fluxo (quantas etapas, integrações, validações)
- Histórico de bugs na área (buscar por commits/issues recentes se disponível)
- Tipo de mudança (nova feature tem mais risco que pequeno ajuste)
- Dependências externas (quantas APIs/serviços envolvidos)
```

Gerar roteiro de hipóteses de risco ordenadas por prioridade.

### Fase 3: Gerar documento de sessão

Criar arquivo usando `$TEMPLATES_FOLDER/engineering/qa/qa.exploratory-session-template.md`:

```
$SESSIONS_DIR/qa/EXP-{YYYYMMDD}-{N}.md
```

Preencher:
- Charter baseado no escopo e objetivo identificados
- Roteiro de risco com as hipóteses mapeadas
- Dimensões de qualidade selecionadas (máximo 2)
- Escopo (incluído / excluído)

Exibir o documento gerado e perguntar:
```
Documento de sessão criado: {caminho}
Você pode executar a sessão e depois rodar:
  /eng-qa-exploratory document {caminho}
para registrar os achados.
```

---

## Modo 2 — document

### Fase 1: Carregar doc da sessão

```bash
cat {caminho do doc de sessão}
```

Se não fornecido, perguntar o caminho ou listar sessões disponíveis:
```bash
ls $SESSIONS_DIR/qa/ 2>/dev/null | sort -r | head -10
```

### Fase 2: Coletar achados

Perguntar ao usuário pelos achados em formato livre — ele pode:
- Descrever em linguagem natural
- Fornecer lista de comportamentos observados
- Colar notas tiradas durante a sessão

Para cada achado identificado, classificar severidade conforme as regras:
- Fazer 1 pergunta confirmatória por achado S1/S2 (alto impacto)
- Classificar S3/S4 autonomamente com justificativa curta

### Fase 3: Atualizar documento de sessão

Preencher no doc:
- Log de execução (baseado nos achados coletados)
- Tabela de achados com severidade
- Detalhamento de cada bug (B01, B02...)
- Cobertura das hipóteses
- Status do charter
- Métricas da sessão

### Fase 4: Identificar bugs para card

Listar todos os achados S1–S4 e perguntar:
```
Achados identificados para criar cards:
  B01 — S2 — {título}
  B02 — S3 — {título}
  B03 — S4 — {título}

Criar cards via eng-qa-bug-report? (S/N)
```

Se confirmado, acionar `eng-qa-bug-report` para cada um.

---

## Modo 3 — report

### Ler e processar doc de sessão

```bash
cat {caminho}
```

Extrair todos os bugs S1–S4 documentados e acionar `eng-qa-bug-report` em batch:

```
Para cada bug B{N} no documento:
  → Skill: eng-qa-bug-report
  → Modo: create
  → Campos: title, severity, description, steps, session_id
```

Exibir ao final:
```
Processamento concluído:
  Cards criados: {N}
  S1: {N} · S2: {N} · S3: {N} · S4: {N}
  Sessão: {caminho do doc}
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Modo 2 — document › Fase 4 (Identificar bugs para card) | `/eng-qa-bug-report` | Se o usuário confirmar a criação dos cards (S/N); uma chamada por achado, modo `create` |
| Modo 3 — report | `/eng-qa-bug-report` | Para cada bug S1–S4 do documento de sessão, em lote, modo `create` |

---

## Regras

### Nunca
- Criar doc de sessão sem charter definido
- Classificar automaticamente bugs S1/S2 sem confirmar com o QA
- Registrar achados S5 (melhorias) como bugs no $TASK_MANAGER
- Inventar achados — documentar apenas o que o QA relatou

### Sempre
- Seguir as regras de severidade de `eng.qa.exploratory-session-rules.md`
- Separar claramente bugs (S1–S4) de melhorias (S5)
- Identificar quando o charter foi atingido vs. bloqueado
- Registrar evidências mencionadas pelo QA no documento
