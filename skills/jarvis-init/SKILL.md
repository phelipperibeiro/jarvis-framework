---
name: jarvis-init
description: Inicializa o framework JARVIS e guia novos membros no processo de onboarding. Use quando precisar configurar o ambiente, criar ENV.md, validar MCPs ou orientar um novo desenvolvedor.
argument-hint: "[nome-do-membro-opcional]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash MCP
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.1"
  area: global
---

# Init - Inicialização do Framework e Onboarding

Você é um **especialista em inicialização de ambiente e onboarding técnico** focado em configurar o framework JARVIS e ajudar novos membros do time.

## Contrato do fork (ler antes de executar)

Regras que **substituem** qualquer trecho legado deste skill ou dos assets:

1. **Sem login/OAuth** — identidade = `USER=` (ENV.md → git email → SO). Nunca pedir `jarvis login` nem `~/.jarvis/auth.json`.
2. **Sem `PROJECT_NAME` / `WORKSPACE_TYPE`** — a unidade é **workspace** (pasta que contém `$IDE/`).
3. **Sessões no workspace** — `SESSIONS_DIR=.jarvis/sessions` com `{eng,prod,qa}/`. Estado local em `{workspace}/.jarvis/` (não em `~/.jarvis/`).
4. **`TASK_MANAGER` vazio = freelance** — sem Jira/Linear. Workflows pedem `TASK_MANAGER_KEY` (controle próprio). MCP de task manager **não** é obrigatório.
5. **Context7 obrigatório**; demais MCPs (Jira, Redis, Sentry, TestSprite) **não bloqueiam**.
6. **Sem event bus / metrics / checkin-checkout-daily** — não provisionar Redis runtime nem pedir métricas.
7. **Tokens de Git** não vão no ENV.md — GitLab `.npmrc`; GitHub `gh auth` / `GITHUB_TOKEN`; Bitbucket `BITBUCKET_TOKEN`. Não existe `TOKEN_VERSION_CONTROL` no template.
8. **Autonomia** — qualquer `POSITION` (JUNIOR…CTO / PM) pode rodar o card ponta a ponta (`/eng.start` → `/eng.pr`). Sem gate obrigatório de TL/PM no init.
9. **Fonte do ENV** — só `templates/ENV-template.md`. Não inventar variáveis. `JARVIS_PROJECT` default: `https://github.com/phelipperibeiro/jarvis-framework`.
10. **IDEs** — windsurf, claude, cursor, codex, opencode, gemini/antigravity, kiro.

## Objetivo

- Configurar ambiente de desenvolvimento
- Validar MCP obrigatório (Context7) e checar task manager só se `TASK_MANAGER` estiver definido (não bloqueante)
- Criar arquivos de configuração (ENV.md, AGENTS.md) e pastas `.jarvis/sessions/{eng,prod,qa}`
- Orientar nos processos do framework (sem ritual diário / login)

## Entrada

- `$ARGUMENTS` - (Opcional) Nome do novo membro para personalizar o onboarding

## Recursos

- **Taxonomia**: `taxonomy.md` (na raiz do framework / workspace) - Define opções válidas para SQUAD, HUB, POSITION, AREA
- **Template ENV**: `templates/ENV-template.md` (**única** fonte — não use ENV-example.md)
- **Template AGENTS**: `templates/engineering/AGENTS-template.md`
- **Configurações MCP**: `$IDE/skills/jarvis-init/assets/mcp-configs.md`
- **Checklist Onboarding**: `$IDE/skills/jarvis-init/assets/onboarding-checklist.md`
- **Guia de Setup**: `$IDE/skills/jarvis-init/assets/setup-guide.md`
- **Passo "adicionar as stacks"**: `$IDE/skills/jarvis-init/assets/passo-adicionar-stacks.md` e `$IDE/skills/jarvis-init/assets/sinais-de-stack.md`
- **Saída**: `$IDE/ENV.md`, `AGENTS.md`, `{workspace}/.jarvis/sessions/{eng,prod,qa}/`

---

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. DETECTAR IDE → Identificar ambiente                     │
│        ↓                                                    │
│  2. VERIFICAR → Se ENV.md já existe                         │
│        ↓                                                    │
│  3. COLETAR → Variáveis obrigatórias                        │
│        ↓                                                    │
│  4. PERGUNTAR → Variáveis opcionais                         │
│        ↓                                                    │
│  5. CRIAR → Arquivo ENV.md + pastas .jarvis/sessions       │
│        ↓                                                    │
│  5.1 FLATTEN → Workflows para raiz (se IDE ≠ claude)        │
│        ↓                                                    │
│  6. VALIDAR → Context7 (obrigatório) + MCPs opcionais       │
│        ↓                                                    │
│  7. CRIAR → AGENTS.md                                       │
│        ↓                                                    │
│  8. SYNC RULES → Filtrar por perfil (HUB/POSITION/AREA/SQUAD)│
│        ↓                                                    │
│  9. STACKS → Adicionar as stacks (opcional, pulável)        │
│        ↓                                                    │
│  10. CONFIRMAR → Com usuário                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Trabalho Detalhado

### 1. Resolver identidade local (sem login)

Não existe OAuth. `USER` vem do ambiente local.

Ordem de resolução:
1. `USER=` já presente em `$IDE/ENV.md` (se existir)
2. `git config --get user.email`
3. username do SO (`whoami`)

```bash
AUTH_EMAIL=$(grep -E '^USER=' "$IDE/ENV.md" 2>/dev/null | cut -d= -f2- | tr -d ' \r')
[ -z "$AUTH_EMAIL" ] && AUTH_EMAIL=$(git config --get user.email 2>/dev/null)
[ -z "$AUTH_EMAIL" ] && AUTH_EMAIL=$(whoami)
```

- Informar: `✅ Identidade: {AUTH_EMAIL}`
- Se o valor resolvido estiver ok, **não perguntar** — gravar em `USER=` no ENV.md
- Se o usuário quiser outro identificador (email ou nome), perguntar **uma vez** e usar a resposta
- **NUNCA** pedir `jarvis login`
- **NUNCA** bloquear por falta de `~/.jarvis/auth.json`

---

### 2. Carregar Taxonomia Organizacional

**SEGUNDO PASSO OBRIGATÓRIO**: Ler o arquivo `taxonomy.md` para obter as opções válidas.

```bash
# Ler taxonomia
cat taxonomy.md
```

**Extrair opções válidas** de cada categoria:

1. **SQUADS**: Todas as opções sob "## 🏢 Squads"
   - Extrair apenas os nomes em MAIÚSCULAS (###)
   - Exemplo: nomes em `###` sob Squads no `taxonomy.md`

2. **HUBS**: Todas as opções sob "## 🎯 Hubs"
   - Extrair: `AI`, `FRONTEND`, `BACKEND`, `QA`, `DATA`, `FULLCYCLE`

3. **POSITIONS**: Todas as opções sob "## 👤 Positions"
   - Extrair: `JUNIOR`, `PLENO`, `SENIOR`, `TECH LEAD`, etc.

4. **AREAS**: Todas as opções sob "## 📊 Areas"
   - Extrair: `ENGINEERING`, `PRODUCT`

**Formato de parsing**:
```javascript
// Pseudocódigo
const taxonomyContent = readFile('taxonomy.md')

// Extrair seção específica
function extractOptions(content, sectionName) {
  const sectionRegex = new RegExp(`## .*${sectionName}[\\s\\S]*?(?=##|$)`)
  const section = content.match(sectionRegex)[0]

  // Extrair ### headers (são os nomes das opções)
  const optionRegex = /^### (.+)$/gm
  const options = [...section.matchAll(optionRegex)].map(m => m[1].trim())

  return options
}

const validSquads = extractOptions(taxonomyContent, 'Squads')
const validHubs = extractOptions(taxonomyContent, 'Hubs')
const validPositions = extractOptions(taxonomyContent, 'Positions')
const validAreas = extractOptions(taxonomyContent, 'Areas')
```

> **⚠️ Se taxonomy.md não existir**: Use valores padrão hardcoded como fallback

### 2. Detectar IDE

Identificar qual IDE o usuário está utilizando:

| IDE | Pasta | Arquivo MCP |
|-----|-------|-------------|
| Windsurf | `.windsurf/` | `~/.codeium/windsurf/mcp_config.json` |
| Cursor | `.cursor/` | `~/.cursor/mcp.json` |
| Claude | `.claude/` | `~/.claude/settings.json` (ou mcp_config) |
| Codex | `.codex/` | via skills TUI |
| OpenCode | `.opencode/` | config da IDE |
| Gemini / Antigravity | `.agents/` | config da IDE |
| Kiro | `.kiro/` | steering / MCP da IDE |

### 2. Verificar Existência do ENV.md

**CRÍTICO**: O `ENV.md` é a fonte de verdade do projeto.

1. Verificar se `$IDE/ENV.md` já existe
2. Se existir, perguntar ao usuário:
   ```
   ⚠️ O arquivo ENV.md já existe. O que deseja fazer?
   A: Sobrescrever completamente
   B: Atualizar apenas variáveis específicas
   C: Upgrade — adicionar variáveis novas do template (não toca nos valores existentes)
   D: Cancelar
   ```

**Se opção C (Upgrade):**

1. Ler todas as chaves do `templates/ENV-template.md`
2. Ler todas as chaves do `$IDE/ENV.md` existente
3. Ler `HUB` do ENV.md existente
4. Se `HUB≠DATA`: excluir do diff todas as chaves `DATA_*` — não propor adicioná-las
5. Calcular diff: chaves no template que **não existem** no ENV.md atual (respeitando exclusão de DATA_* para não-DATA)
4. Se não houver diff:
   ```
   ✅ ENV.md já está atualizado. Nenhuma variável nova encontrada.
   ```
   Oferecer o **passo 9 (adicionar as stacks)**, que a pessoa pode pular, e então encerrar.
5. Se houver diff, exibir prévia:
   ```
   🔍 Variáveis novas encontradas no template:
     + NOVA_VAR_1=
     + NOVA_VAR_2=valor-padrão

   Serão adicionadas ao final do ENV.md sem alterar os valores existentes.
   ```
6. Appender as novas variáveis ao final do `ENV.md` com comentário de data:
   ```
   # --- Upgrade YYYY-MM-DD ---
   NOVA_VAR_1=
   NOVA_VAR_2=valor-padrão
   ```
7. Confirmar:
   ```
   ✅ ENV.md atualizado! N variável(is) nova(s) adicionada(s).
   ⚠️ Preencha os valores em branco antes de usar os novos recursos.
   ```
8. Oferecer o **passo 9 (adicionar as stacks)**, que a pessoa pode pular, e então encerrar (não continuar para o fluxo de onboarding completo).

**⚠️ OBRIGATÓRIO - Criação do ENV.md**:

O ENV.md DEVE ser criado usando como base **TODO O CONTEÚDO** de:
- `templates/ENV-template.md`

**NUNCA crie o ENV.md do zero!** Use o template completo e apenas substitua os valores das variáveis. Não invente chaves (`PROJECT_NAME`, `TOKEN_VERSION_CONTROL`, `EVENT_BUS*`, `BUG_FREQ*`, etc.).

Fluxo correto:
1. Ler o conteúdo completo de `templates/ENV-template.md`
2. Substituir os valores das variáveis conforme coletado do usuário
3. Se `HUB≠DATA`: remover o bloco DATA_* inteiro
4. Garantir `SESSIONS_DIR=.jarvis/sessions` e `JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework` (ou URL que o usuário informar)
5. Escrever `$IDE/ENV.md` com o restante do template (incluindo variáveis vazias)
6. As 6 chaves de especialização ficam **vazias**, exceto `QA_SPECIALIZATIONS`, que vem com `eng-qa-planner` (único hoje, pré-registrado por padrão — ver `templates/ENV-template.md`): não são perguntadas aqui. O registro/ajuste é feito no **passo 9 (adicionar as stacks)**, ou depois, a qualquer momento: consulta com `jarvis-list-specializations` e criação com `jarvis-create-specialization` (só backend/frontend).

### 3. Coletar Variáveis Obrigatórias

**⚠️ REGRA CRÍTICA #1 - PERGUNTAR UMA POR VEZ:**

**SEMPRE** pergunte uma variável por vez e aguarde a resposta antes de fazer a próxima pergunta.

**NUNCA** faça todas as perguntas de uma vez como uma lista numerada.

**⚠️ REGRA CRÍTICA #2 - USAR AskUserQuestion PARA OPÇÕES FIXAS:**

**IMPORTANTE - Limitação Técnica do AskUserQuestion:**
- AskUserQuestion aceita **máximo 4 opções** por pergunta
- Para variáveis com **≤4 opções** → usar AskUserQuestion
- Para variáveis com **>4 opções** → mostrar todas as opções em texto numerado e pedir digitação

**Como coletar variáveis:**

### Variáveis com Opções Fixas:

**Decisão por número de opções:**
- **HUB** (6 opções: AI, FRONTEND, BACKEND, QA, DATA, FULLCYCLE) → texto numerado (>4)
- **AREA** (4-5 opções) → se ≤4 usar AskUserQuestion, senão texto
- **IDE** (7 opções) → mostrar em texto numerado
- **SQUAD** (do taxonomy) → mostrar em texto numerado
- **POSITION** (do taxonomy) → mostrar em texto numerado

```
// Exemplo 1: HUB (5 opções) - MOSTRAR EM TEXTO
Qual o hub do projeto?

Opções disponíveis:
1. AI - Inteligência Artificial
2. FRONTEND - Interfaces web/mobile
3. BACKEND - APIs e serviços
4. QA - Qualidade e testes
5. DATA - Engenharia de dados / BI / ML

Digite o número (1-5) ou nome do hub:
[aguardar resposta e validar]
```

**Para variáveis com >4 opções, usar formato de texto:**

```
// Exemplo 2: IDE - MOSTRAR EM TEXTO
Qual IDE você está usando?

Opções disponíveis:
1. claude - Claude Code (Anthropic)
2. windsurf - Windsurf IDE (Codeium)
3. cursor - Cursor IDE
4. codex - Codex CLI (OpenAI)
5. opencode - OpenCode
6. gemini - Gemini CLI / Antigravity (Google)
7. kiro - Kiro (AWS)

Digite o número (1-7) ou nome da opção:
[aguardar resposta e validar]
```

```
// Exemplo 3: SQUAD (6+ opções do taxonomy) - MOSTRAR EM TEXTO
Qual o nome do seu squad?

Opções disponíveis: (lidas de taxonomy.md)
1. CORE - Time principal

Digite o número ou nome do squad:
[aguardar resposta e validar contra lista do taxonomy.md]
```

```
// Exemplo 4: POSITION (9 opções) - MOSTRAR EM TEXTO
Qual seu cargo?

Opções disponíveis:
1. JUNIOR - Desenvolvedor Júnior
2. PLENO - Desenvolvedor Pleno
3. SENIOR - Desenvolvedor Sênior
4. TECH LEAD - Líder Técnico
5. SPECIALIST - Especialista
6. PM - Product Manager
7. TPM - Technical Product Manager
8. GPM - Group Product Manager
9. CTO - Chief Technology Officer

Digite o número (1-9) ou nome do cargo:
[aguardar resposta e validar contra lista]
```

### Variáveis Livres (Permitir Digitação):

**WORKSPACE (confirmar nome detectado), MAX_AI_EXECUTION_PERCENTAGE** → Pergunta tradicional com validação

**USER** → **Não perguntar** se já foi resolvido no passo 1 (ENV.md, git ou SO). Só perguntar se o usuário quiser outro identificador.

```
Pergunta 1: Workspace detectado: `{basename da pasta que contém $IDE/}`. Usar esse nome?
[Enter = sim. Só perguntar outro slug se o usuário recusar.]
Não perguntar single vs multi.
Escanear `.git/` na raiz e nas subpastas.
- Só a raiz tem git → `WORKSPACE_REPOS` vazio
- 2+ subpastas com git → listar e perguntar se filtra; senão vazio (todas)

Pergunta 6: Qual o limite de execução da AI? (número entre 60 e 100)
[aguardar resposta e validar range 60-100]
```

**Exemplo de coleta correta (UMA pergunta POR VEZ):**

```
📋 Vamos configurar o ambiente do framework.

Pergunta 1 (livre - digitação):
Workspace detectado: `{pasta}`. Usar esse nome?
```

*[Aguardar resposta do usuário]*

```
Pergunta 2 (opções fixas - usar AskUserQuestion):
```

*[Mostrar TODAS as 6 opções de IDE em texto numerado e aguardar digitação]*

*[Validar resposta contra lista de opções válidas]*

```
Pergunta 3 (opções fixas - 6+ opções - mostrar em texto):
```

*[Mostrar TODAS as opções de SQUAD do taxonomy.md em texto numerado e aguardar digitação]*

*[Validar resposta contra lista de SQUADs válidos do taxonomy]*

```
Pergunta 4 (opções fixas - 4 opções - usar AskUserQuestion):
```

*[Mostrar TODAS as opções de HUB do taxonomy em texto numerado (inclui DATA) e aguardar]*

*[Aguardar seleção do usuário]*

```
Pergunta 5 (opções fixas - 4-5 opções):
```

*[Se AREA tiver ≤4 opções: usar AskUserQuestion]*
*[Se AREA tiver >4 opções: mostrar em texto numerado]*

*[Aguardar resposta]*

```
Pergunta 6 (livre - digitação com validação):
Qual o limite de execução da AI? (número entre 60 e 100)
```

*[Aguardar resposta e validar range 60-100]*

```
Pergunta 7 (opções fixas - POSITION do taxonomy - texto se >4):
```

*[Mostrar TODAS as opções de POSITION do taxonomy.md e aguardar]*

**Regras de Implementação:**
- **Opções fixas com ≤4 opções** → usar AskUserQuestion
- **Opções fixas com >4 opções** (HUB com DATA, IDE, SQUAD, POSITION) → mostrar em texto numerado
- **Valores livres** (WORKSPACE só se recusar o nome detectado, MAX_AI_EXECUTION_PERCENTAGE) → Pergunta tradicional com validação
- **USER** → resolvido no passo 1 (ENV.md / git / SO). Só perguntar se o usuário quiser outro valor
- **SEMPRE** mostrar TODAS as opções disponíveis (seja em AskUserQuestion ou texto)
- **NUNCA** omitir opções da lista (HUB deve incluir DATA)
- **NUNCA** perguntar múltiplas variáveis de uma vez
- **SEMPRE** validar resposta contra lista de opções válidas (quando texto)

#### Variáveis Obrigatórias

| Variável | Descrição | Validação |
|----------|-----------|-----------|
| `WORKSPACE` | Slug da pasta do `$IDE/` | Vazio = nome da pasta (detectar) |
| `WORKSPACE_REPOS` | Allowlist de subpastas-repo | Vazio = todas com `.git/` |
| `IDE` | IDE utilizada | `windsurf`, `claude`, `cursor`, `codex`, `opencode`, `gemini`, `kiro` (antigravity → gemini) |
| `SQUAD` | Nome do squad | Deve estar em `taxonomy.md` → Squads |
| `HUB` | Hub do workspace | Deve estar em `taxonomy.md` → Hubs (**inclui DATA**) |
| `AREA` | Área do workspace | Deve estar em `taxonomy.md` → Areas |
| `MAX_AI_EXECUTION_PERCENTAGE` | Limite de execução da AI | Número entre 60 e 100 |
| `USER` | Identidade do usuário (email ou nome) | ENV.md → git `user.email` → usuário do SO. Sem login |
| `POSITION` | Cargo do usuário | Deve estar em `taxonomy.md` → Positions. Autonomia ponta a ponta em qualquer cargo |

> **💡 Nota**:
> - As opções para SQUAD, HUB, AREA e POSITION são definidas em `taxonomy.md` e podem ser customizadas por organização.
> - CDD (Context-Driven Development) está sempre habilitado — `ENABLE_CDD=true` é gerado automaticamente no ENV.md.

#### Validar Respostas

Aplicar validações conforme o tipo de variável:

**Variáveis com AskUserQuestion (≤4 opções - validação automática):**

Quando usar `AskUserQuestion`, a validação é automática (usuário só pode escolher opções válidas):

- **HUB**: 5 opções do taxonomy em texto → validar contra lista (inclui DATA)
- **AREA**: AskUserQuestion se ≤4 opções → validação automática

**Variáveis com texto numerado (>4 opções - validação manual necessária):**

Quando mostrar opções em texto, DEVE validar manualmente:

- **IDE**: opções em texto → validar que resposta está na lista
  - Aceitar: número ou nome exato (case-insensitive)
  - Erro se inválido: `"Opção inválida. Digite um número da lista ou o nome da IDE."`

- **SQUAD**: opções do taxonomy em texto → validar contra taxonomy
  - Aceitar: número ou nome exato do SQUAD
  - Erro se inválido: `"Squad inválido. Digite um número ou nome válido da lista."`

- **POSITION**: opções do taxonomy em texto → validar contra lista
  - Aceitar: número ou nome do cargo
  - Erro se inválido: `"Cargo inválido. Digite um número ou nome do cargo."`

**Lógica de validação para texto:**
```javascript
function validateTextOption(userInput, optionsList) {
  // Tentar como número primeiro
  const asNumber = parseInt(userInput)
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= optionsList.length) {
    return optionsList[asNumber - 1] // índice base 0
  }

  // Tentar como nome (case-insensitive)
  const asName = userInput.trim().toUpperCase()
  const match = optionsList.find(opt => opt.name.toUpperCase() === asName)

  if (match) return match

  // Inválido
  throw new Error("Opção inválida")
}
```

**Variáveis livres (validação manual necessária):**

- **WORKSPACE**: Se vazio, usar `basename` da pasta que contém `$IDE/`. Só pedir outro slug se o usuário recusar o detectado.

- **MAX_AI_EXECUTION_PERCENTAGE**:
  - Deve ser número entre 60 e 100
  - Se < 60, avisar e usar 60: `"Valor abaixo do mínimo (60). Ajustando para 60."`
  - Se > 100, avisar e usar 100: `"Valor acima do máximo (100). Ajustando para 100."`
  - Se não for número: `"Digite um número válido entre 60 e 100."`

- **USER**: Resolvido no passo 1. Não bloquear. Sem `@{DOMAIN}` obrigatório.

**⚠️ IMPORTANTE - AskUserQuestion vs Validação Manual:**

- **Com AskUserQuestion**: Não precisa validar manualmente. O tool só permite opções válidas.
- **Sem AskUserQuestion** (campos livres): Validar formato conforme regras acima.

**Benefícios do AskUserQuestion para opções fixas:**
1. ✅ Sem erro humano de digitação
2. ✅ Interface visual clara com todas as opções
3. ✅ Validação automática
4. ✅ Descrições visíveis para cada opção
5. ✅ Experiência de usuário superior

Se alguma validação de campo livre falhar, informar o erro claramente e solicitar novamente.

### 3.1 Variáveis de Hub DATA (condicional — obrigatório se HUB=DATA)

**Executar apenas se `HUB=DATA`** foi selecionado no passo anterior.

Se `HUB≠DATA`: pular este passo inteiramente — as variáveis `DATA_*` **não serão incluídas** no ENV.md gerado.

Se `HUB=DATA`: coletar as variáveis abaixo **uma por vez**, todas obrigatórias:

| Variável | Pergunta | Exemplos de valor |
|----------|----------|-------------------|
| `DATA_ORCHESTRATOR` | Qual o orquestrador de pipelines? | `airflow`, `prefect`, `dagster`, `glue-scheduler` |
| `DATA_ETL_TOOL` | Qual a ferramenta de transformação ETL? | `aws_glue`, `dbt`, `spark`, `pandas` |
| `DATA_QUALITY_TOOL` | Qual a ferramenta de qualidade de dados? | `great_expectations`, `soda`, `deequ` |
| `DATA_LAKE` | Qual o armazenamento do data lake? | `aws_s3`, `gcs`, `azure_adls` |
| `DATA_QUERY_ENGINE` | Qual a engine de query analítica? | `aws_athena`, `bigquery`, `redshift`, `trino` |
| `DATA_BI_TOOL` | Qual a ferramenta de BI/dashboards? | `metabase`, `looker`, `superset`, `power_bi` |
| `DATA_WAREHOUSE` | Há data warehouse dedicado? Se sim, qual? *(aceita vazio)* | `redshift`, `snowflake`, `bigquery` |
| `DATA_REPO` | Qual o nome do repositório de scripts de pipeline? | `data-pipelines`, `etl-jobs`, `analytics-pipelines` |

> Perguntar uma por vez, aguardando resposta antes da próxima.
> `DATA_WAREHOUSE` aceita valor vazio — informar ao usuário que pode ser configurado depois.
> `ALERTS_CHANNEL` é uma variável genérica do projeto (não específica de DATA) — já terá sido configurada nas variáveis principais.

### 4. Perguntar Sobre Variáveis Opcionais

```
🔧 Deseja configurar variáveis opcionais?
A: Sim, configurar todas
B: Sim, escolher quais configurar
C: Não, usar valores padrão (tudo vazio / freelance)
```

Se **A** ou **B**, perguntar sobre cada variável opcional conforme seleção — **uma por vez**.

**Task manager (pergunte cedo):**
```
Usa algum board de cards?
1. jira
2. linear
3. github
4. asana
5. Nenhum (freelance) → TASK_MANAGER= vazio

Se 5: não peça TOKEN_TASK_MANAGER nem MCP. Workflows vão pedir TASK_MANAGER_KEY
(número/slug de controle próprio) na hora da tarefa.
Se 1–4: pedir TOKEN_TASK_MANAGER e TASK_MANAGER_URL_BASE (opcional).
```

**Controle de versão:**
```
VERSION_CONTROL = gitlab | github | bitbucket | vazio
Token NÃO vai no ENV.md:
  - GitLab → .npmrc
  - GitHub → gh auth ou GITHUB_TOKEN
  - Bitbucket → BITBUCKET_TOKEN
Nunca grave TOKEN_VERSION_CONTROL (chave removida do template).
```

#### Variáveis Opcionais (alinhar ao `templates/ENV-template.md`)

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `TASK_MANAGER` | *(vazio = freelance)* | `jira`, `linear`, `github`, `asana` |
| `TOKEN_TASK_MANAGER` | *(vazio)* | Token do board (só se TASK_MANAGER preenchido) |
| `TASK_MANAGER_URL_BASE` | *(vazio)* | URL base para links (ex: Atlassian) |
| `VERSION_CONTROL` | *(vazio)* | `gitlab`, `github`, `bitbucket` |
| `MESSAGE_BROKER` | *(vazio)* | `rabbitmq`, `kafka`, `sqs` |
| `MESSAGE_BROKER_URL_API` | *(vazio)* | API do broker |
| `MESSAGE_BROKER_API_AUTH` | *(vazio)* | Auth do broker |
| `DATABASE` | *(vazio)* | `mysql`, `postgres`, `mongodb` |
| `USER_DATABASE` / `PASSWORD_DATABASE` / `HOST_DATABASE` / `PORT_DATABASE` | *(vazio)* | Credenciais DB |
| `MESSAGE_COMUNICATOR` | *(vazio)* | `slack`, `discord`, `teams` |
| `MESSAGE_COMUNICATOR_BOT_TOKEN` / `_SIGNING_SECRET` / `_APP_TOKEN` | *(vazio)* | Tokens do chat |
| `ALERTS_CHANNEL` | *(vazio)* | Canal de alertas |
| `OBJECT_STORAGE` | *(vazio)* | `aws_s3`, `gcs`, `azure_blob` |
| `TOKEN_OBJECT_STORAGE` | *(vazio)* | Token storage |
| `OBSERVABILITY` | *(vazio)* | `sentry`, `datadog`, `grafana` |
| `TOKEN_OBSERVABILITY` / `OBSERVABILITY_ORG` | *(vazio)* | Observabilidade |
| `SMTP` | *(vazio)* | `google`, `ses`, `sendgrid` |
| `CODE_QUALITY_TOOL` / `_URL` / `_TOKEN` | *(vazio)* | SonarQube etc. |
| `TEST_FOLDER` | *(vazio)* | Pasta de testes |
| `QA_SIGNOFF_BRANCHES` / `QA_SIGNOFF_MAX_AGE` | `main,release/*` / `24` | Sign-off QA |
| `JARVIS_PROJECT` | `https://github.com/phelipperibeiro/jarvis-framework` | Repo do framework (`/jarvis-report-issue`) |
| `CENTRAL_DOCS_REPO` / `_REF` / `_TARGET_BRANCH` / `_REVIEWERS` / `_CACHE_TTL` | *(opcional)* | Docs centrais |
| `SESSIONS_DIR` | `.jarvis/sessions` | Não perguntar — gravar fixo |
| `RTK_ENABLED` | `false` (ou true se detectar `rtk`) | Token Killer |
| `ADVISOR_MODELS` | `"Sonnet 5.5,Opus 5.5,Opus 5,Fable 5.1"` | Advisor do `eng.start` — não perguntar, gravar o padrão |

#### 4.1 Detecção do RTK (Token Killer)

**Após as variáveis opcionais**, verificar automaticamente se o RTK está instalado:

```bash
rtk gain --help 2>/dev/null
```

**Se RTK encontrado no PATH:**
```
🔍 RTK detectado (token killer — economia de 60-90% em tokens de shell).
   Ativar integração? (recomendado)
   A: Sim → RTK_ENABLED=true
   B: Não → RTK_ENABLED=false
```

**Se RTK NÃO encontrado:**
```
ℹ️ RTK não detectado. Integração desativada.
   Para instalar: cargo install brokk-rtk (requer Rust)
   → RTK_ENABLED=false
```

> RTK é opt-in e não bloqueia o init. A rule `rtk-rules.md` só é copiada
> para `$IDE/rules/` no Passo 9 se `RTK_ENABLED=true`.

### 5. Criar Arquivo ENV.md

**🚨 INSTRUÇÃO CRÍTICA - LEIA COM ATENÇÃO:**

O ENV.md DEVE ser criado usando o template completo. **NUNCA crie manualmente!**

**Passos obrigatórios:**
```bash
# 1. Ler o template completo
cat templates/ENV-template.md

# 2. Copiar TODO o conteúdo para $IDE/ENV.md

# 3. Substituir apenas os valores das variáveis coletadas

# 4. AJUSTAR FLOWS_FOLDER baseado no IDE:
#    - Se IDE=claude → FLOWS_FOLDER=commands
#    - Caso contrário → FLOWS_FOLDER=workflows

# 5. BLOCO DATA_* — incluir ou omitir conforme HUB:
#    - Se HUB=DATA ou HUB=FULLCYCLE → incluir o bloco com os valores coletados no passo 3.1
#    - Caso contrário                → REMOVER completamente o bloco Data Engineering e todas as DATA_*

# 6. Garantir chaves de sistema do template:
#    SESSIONS_DIR=.jarvis/sessions
#    ENABLE_CDD=true
#    JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework  (se usuário não sobrescrever)
#    NÃO incluir: TOKEN_VERSION_CONTROL, PROJECT_NAME, EVENT_BUS*, metrics*

# 7. Criar pastas de sessão no workspace (pasta que contém $IDE/):
mkdir -p .jarvis/sessions/eng .jarvis/sessions/prod .jarvis/sessions/qa
# Garantir .jarvis/ no .gitignore do workspace
grep -qxF '.jarvis/' .gitignore 2>/dev/null || echo '.jarvis/' >> .gitignore
```

**⚠️ REGRA CRÍTICA — Bloco DATA:**

```javascript
if (HUB === 'DATA' || HUB === 'FULLCYCLE') {
  // Incluir bloco DATA_* com valores coletados no passo 3.1
} else {
  // Remover do ENV.md gerado o bloco Data Engineering e todas as DATA_*
}
```

**⚠️ REGRA CRÍTICA - FLOWS_FOLDER:**

```javascript
if (IDE === "claude") {
  FLOWS_FOLDER = "commands"
} else {
  FLOWS_FOLDER = "workflows"
}
```

O arquivo `$IDE/ENV.md` deve seguir a **estrutura e ordem** de `templates/ENV-template.md` (não um dump reordenado). Blocos mínimos esperados após o init:

```markdown
# --- Workspace e identidade ---
WORKSPACE=
WORKSPACE_REPOS=
USER={resolvido}
MAX_AI_EXECUTION_PERCENTAGE={60-100}
ENABLE_CDD=true

# --- Organização ---
SQUAD={valor}
HUB={valor}
AREA={valor}
POSITION={valor}

# --- IDE e pastas ---
IDE={valor}
DOCS_FOLDER=docs
FLOWS_FOLDER={commands|workflows}
TEMPLATES_FOLDER=templates
RULES_FOLDER=.$IDE/rules
SESSIONS_DIR=.jarvis/sessions
PROD_FOLDER_NAME=product
PROD_RULES=...
PROD_FLOWS=...
PROD_TEMPLATES=...
PROD_DOCS=...

# --- Task manager (opcional; vazio = freelance) ---
TASK_MANAGER=
TOKEN_TASK_MANAGER=
TASK_MANAGER_URL_BASE=

# --- Controle de versão / chat / demais opcionais do template ---
VERSION_CONTROL=
# ... restante do template (MESSAGE_*, DATABASE, JARVIS_PROJECT, CENTRAL_DOCS_*, etc.)
JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework
```

#### Variáveis de Sistema (não alterar sem motivo)

```
DOCS_FOLDER=docs
FLOWS_FOLDER=workflows (ou "commands" se IDE=claude)
TEMPLATES_FOLDER=templates
RULES_FOLDER=.$IDE/rules
SESSIONS_DIR=.jarvis/sessions
ENABLE_CDD=true

PROD_FOLDER_NAME=product
PROD_RULES=$RULES_FOLDER/$PROD_FOLDER_NAME
PROD_FLOWS=.$IDE/$FLOWS_FOLDER
PROD_TEMPLATES=.$IDE/$TEMPLATES_FOLDER/$PROD_FOLDER_NAME
PROD_DOCS=$DOCS_FOLDER/$PROD_FOLDER_NAME
```

**⚠️ IMPORTANTE - FLOWS_FOLDER por IDE:**

- **Claude Code**: `FLOWS_FOLDER=commands` (usa `.claude/commands/`)
- **Outros IDEs**: `FLOWS_FOLDER=workflows`

O skill deve detectar automaticamente o IDE e definir o valor correto.

**Sessões:**
- Paths: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`, `$SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/`, `$SESSIONS_DIR/qa/`
- Cookie/HTTP session **não** é esta pasta
- Não usar `~/.jarvis/` para sessões do framework

### 5.1 Flatten de Workflows (apenas Windsurf e outros IDEs não-claude)

**⚠️ OBRIGATÓRIO quando IDE ≠ claude**: O Windsurf (e outros IDEs) **não reconhece workflows em subpastas** — apenas arquivos diretamente em `.windsurf/workflows/` são carregados.

Após criar o ENV.md, executar:

```bash
# Mover todos os workflows de subpastas para a raiz de $IDE/workflows/
find .windsurf/workflows -mindepth 2 -name "*.md" | while read file; do
  filename=$(basename "$file")
  dest=".windsurf/workflows/$filename"
  # Se já existir na raiz, não sobrescrever
  if [ ! -f "$dest" ]; then
    mv "$file" "$dest"
  fi
done

# Remover subpastas vazias
find .windsurf/workflows -mindepth 1 -type d -empty -delete
```

**Regra**: Substituir `.windsurf/` pelo diretório correto do IDE (`.$IDE/`).

**Quando executar**: Sempre que `IDE ≠ claude`, independente de ser instalação nova ou atualização.

**Log para o usuário**: Informar quantos workflows foram movidos.

### 6. Validar MCPs

| MCP | Quando checar | Bloqueante |
|-----|---------------|------------|
| **Context7** | Sempre | **Sim** |
| Task manager (Jira / Linear / GitHub / Asana) | Só se `TASK_MANAGER` estiver preenchido no ENV.md | **Não** |
| TestSprite | Se o usuário quiser | **Não** |
| Redis / Sentry / event bus | Removidos do init — não checar | — |

**Context7 é obrigatório.** Sem ele o init para e orienta a configuração (`assets/mcp-configs.md`). Não inventar docs de libs no lugar.

**Task manager / demais MCPs nunca bloqueiam.** Freelance / `TASK_MANAGER` vazio é válido. Sem Jira, Linear, Redis ou Sentry o init **continua**.

**Regras anti-travamento (task manager e opcionais):**
1. **Uma tentativa** por MCP opcional. Timeout curto. Sem retry em loop.
2. Se o MCP opcional não existir, não responder ou pedir auth → **avisar e seguir**. Nunca esperar o usuário configurar Jira no meio do init.
3. Se `TASK_MANAGER` estiver vazio → **pular** qualquer checagem de Jira/Linear/etc.
4. Nunca diga "não posso continuar sem Jira".

**Verificação**:
```javascript
// Context7 (OBRIGATÓRIO) — se falhar, parar e orientar config
mcp1_resolve-library-id({ libraryName: "react", query: "test" })

// Task manager — SÓ se TASK_MANAGER=jira (ou linear/github/asana). Senão: pular.
// Exemplo Jira (1 tentativa). Falhou? Avisar e seguir.
jira_get_issue({ issueKey: "PROJ-1" })
```

Se Context7 falhar:
```
🚫 Context7 indisponível — o init precisa dele para docs de libs atualizadas.
Configure o MCP (assets/mcp-configs.md), reinicie a IDE e rode /jarvis-init de novo.
```

Se `TASK_MANAGER=jira` e o MCP falhar:
```
⚠️ MCP do Jira indisponível — comentários/cards via MCP ficam off. O skill eng-global-task-comment ainda funciona com TOKEN_TASK_MANAGER. Continuando o init…
```

> **Configurações detalhadas**: Ver `assets/mcp-configs.md`

### 6.1 — Provisionar MCPs Opcionais (não bloqueante)

Após validar os MCPs obrigatórios, verificar se o ENV.md contém ferramentas opcionais que requerem MCP local:

**Code Quality (`CODE_QUALITY_TOOL`)**:

```bash
grep "CODE_QUALITY_TOOL=" $IDE/ENV.md
```

Se `CODE_QUALITY_TOOL` estiver preenchido (ex: `sonarqube`):

1. Verificar se o MCP server já está instalado:
   ```bash
   which sonarqube-mcp-server 2>/dev/null
   ```

2. Se **não instalado** — perguntar ao usuário:
   ```
   CODE_QUALITY_TOOL=sonarqube detectado no ENV.md.
   Para integrar com o quality gate, preciso instalar o MCP server.

   Instalar sonarqube-mcp-server globalmente via npm? (Sim / Não / Pular)
   ```

   - **Sim**: executar `npm install -g sonarqube-mcp-server`, obter path via `which`, provisionar no arquivo de config da IDE (ver `assets/mcp-configs.md` para paths por IDE)
   - **Não / Pular**: registrar como pendente e continuar

3. Se **já instalado** — obter path absoluto via `which` e provisionar no arquivo de config da IDE

4. Verificar se `CODE_QUALITY_URL` e `CODE_QUALITY_TOKEN` estão preenchidos no ENV.md:
   - Se vazios → perguntar ao usuário:
     ```
     Qual a URL da instância do SonarQube? (ex: https://sonarqube.empresa.com)
     Qual o token de autenticação?
     ```
   - Salvar no ENV.md

5. Testar conexão:
   ```javascript
   mcp__sonarqube__list_projects({})
   ```
   - Se falhar → avisar mas **não bloquear**

> Este passo é **não bloqueante** — se o usuário pular ou a instalação falhar,
> o init continua normalmente. O MCP pode ser configurado depois manualmente
> seguindo `assets/mcp-configs.md`.

### 6.2 — Perfil de Plugins Claude Code (apenas se IDE=claude, opcional)

**Executar apenas se `IDE=claude`**. Para qualquer outro IDE: pular inteiramente.

```javascript
if (IDE !== "claude") { skip() }
```

Perguntar ao usuario:

```
Voce esta usando Claude Code. Existe um perfil opcional de plugins recomendados
que potencializa as analises de seguranca e navegacao de codigo:

  Codegraph (recomendado) — grafo AST do projeto: impact/callers/trace
  Claude-Mem (opt-in avancado) — memoria persistente entre sessoes
  Token Optimizer (escolha individual) — auditoria de contexto/token

Deseja instalar o perfil recomendado agora?

1. Sim — instalar Codegraph (recomendado)
2. Ver todos os plugins e escolher
3. Pular — configurar depois
```

**Se resposta 1 (instalar Codegraph):**
- Orientar: abrir Claude Code → Extensions/Marketplace → buscar "Codegraph" → instalar → reiniciar sessao
- Informar: "Apos instalar, os comandos `codegraph_impact`, `codegraph_callers` e `codegraph_trace` estarao disponiveis para analise de seguranca e navegacao de codigo"

**Se resposta 2 (ver todos):**
- Exibir tabela completa de `assets/mcp-configs.md` secao "Perfil opt-in — Plugins Claude Code"
- Aguardar escolha e orientar instalacao de cada um selecionado

**Se resposta 3 (pular):**
- Informar: "Voce pode instalar depois. Detalhes em `skills/jarvis-init/assets/mcp-configs.md` secao 'Perfil opt-in'"
- Continuar normalmente

> Este passo e **nao bloqueante e opcional** — nao impede o init de concluir.

### 7. Criar AGENTS.md

Se não existir na raiz do projeto:

1. Detectar stack (package.json, pyproject.toml, etc.)
2. Extrair informações do projeto
3. Criar a partir do template com substituições
4. Se não detectar, perguntar ao usuário

### 8. Profile-Aware Rules Sync

**Executar após gravar o ENV.md** (nos fluxos create, update B e upgrade C).

Objetivo: garantir que `$IDE/rules/` e `$IDE/rules-on-demand/` contenham apenas as rules relevantes para o perfil do usuário, reduzindo tokens carregados em sessão. A pasta `rules/` é carregada no início da sessão; a `rules-on-demand/` guarda as rules de uma etapa só, que cada workflow lê quando precisa (o Claude Code não a carrega sozinho). O filtro é o mesmo nas duas pastas, e `bin/lib/core/profile-filter.js` o espelha em JS (usado por `jarvis tokens`): ao mudar a lógica aqui, mude lá e em `rules/AGENTS.md`.

**Passos:**

```
1. Ler HUB, POSITION, AREA, SQUAD do ENV.md recém-gravado
2. Para cada uma das duas pastas (rules/ e rules-on-demand/), listar todos os arquivos .md (recursivo, exceto AGENTS.md)
3. Para cada arquivo:
   a. Ler o bloco `> **Applies to:**` (primeira ocorrência no arquivo)
   b. Se o bloco não existir → tratar como universal → copiar sempre
   c. Se existir → verificar matching (ver lógica abaixo)
   d. **Condição especial RTK**: se o arquivo for `rtk-rules.md`,
      copiar APENAS se `RTK_ENABLED=true` no ENV.md
      (mesmo que o perfil bata, RTK é opt-in)
   e. Se bate com o perfil → copiar para a mesma pasta em $IDE/ (rules/ → $IDE/rules/, rules-on-demand/ → $IDE/rules-on-demand/), preservando subpastas
   f. Se não bate → deletar de $IDE/ se existir lá
4. Exibir resumo ao usuário
```

**Lógica de matching:**

Um arquivo é copiado se **todas** as condições forem satisfeitas:

```javascript
function matchesProfile(appliesTo, profile) {
  const matches = (list, value) =>
    list === 'all' || list.split(',').map(s => s.trim()).includes(value)

  // FULLCYCLE é superusuário do eixo HUB: satisfaz qualquer applies_to HUB
  const hubMatches = profile.HUB === 'FULLCYCLE' || matches(appliesTo.HUB, profile.HUB)

  // GENERALIST é superusuário dos eixos POSITION e AREA: transita entre
  // ENGINEERING/PRODUCT e satisfaz qualquer POSITION exigida
  const positionMatches = profile.POSITION === 'GENERALIST' || matches(appliesTo.POSITION, profile.POSITION)
  const areaMatches = profile.POSITION === 'GENERALIST' || matches(appliesTo.AREA, profile.AREA)

  return (
    hubMatches &&
    positionMatches &&
    areaMatches &&
    matches(appliesTo.SQUAD, profile.SQUAD)
  )
}
```

**Parser do bloco `applies_to`:**

```javascript
// Exemplo de bloco: > **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all
function parseAppliesTo(fileContent) {
  const match = fileContent.match(
    /> \*\*Applies to:\*\* HUB: ([^|]+)\| POSITION: ([^|]+)\| AREA: ([^|]+)\| SQUAD: (.+)/
  )
  if (!match) return null // sem bloco = universal
  return {
    HUB:      match[1].trim(),
    POSITION: match[2].trim(),
    AREA:     match[3].trim(),
    SQUAD:    match[4].trim(),
  }
}
```

**Copiar preservando subpastas:**

```bash
# Exemplo: rules/engineering/qa/eng.qa.quality-gate-scoring-rules.md
# Destino: $IDE/rules/engineering/qa/eng.qa.quality-gate-scoring-rules.md
# (o mesmo vale para rules-on-demand/ → $IDE/rules-on-demand/)
mkdir -p "$IDE/$pasta/$(dirname $relPath)"
cp "$pasta/$relPath" "$IDE/$pasta/$relPath"   # $pasta = rules ou rules-on-demand
```

**Saída para o usuário:**

```
🔍 Sincronizando rules para o perfil: HUB={HUB} | POSITION={POSITION} | AREA={AREA} | SQUAD={SQUAD}

✅ Rules sincronizadas:
   Copiadas : N arquivos (rules/: N | rules-on-demand/: N)
   Removidas: N arquivos (não batem com o perfil)
   Universais: N arquivos (sem applies_to — sempre copiadas)
```

> **Nota**: `rules/AGENTS.md` é sempre copiado — nunca filtrado.

---

### 9. Adicionar as stacks (opcional)

Oferecido sempre que o `ENV.md` fica pronto: criação, atualização, **Upgrade (C)** e o caso "já atualizado". **Não** é oferecido ao cancelar (D). A pessoa pode **pular**; ao pular, as listas ficam como estão e o projeto usa só a skill base.

A **detecção de stack por código e a criação de skill novo** (sub-passos 9.4-9.6) tratam **somente backend e frontend** — são as únicas áreas com universo de stack aberto (qualquer linguagem/framework novo). **Listar o que já está instalado e registrar direto** (sub-passo 9.3) vale para as **6 áreas** com especialização (backend, frontend, qa, data, automation, platform): essas 4 últimas têm um conjunto fixo de skills pré-construídos, sem detecção por código nem criação — só listar e registrar (ver `architecture.md` da #63, Decisão 3.5). O passo:

1. Confere que as 6 variáveis de especialização existem (acrescenta vazias as que faltarem)
2. Lista as especializações instaladas de todas as 6 áreas, registradas ou não, e deixa registrar qualquer uma direto
3. **Lê** o workspace (a análise **só lê**: não altera arquivos do projeto nem as listas), identifica as stacks de backend e de frontend, inclusive de vários projetos, e **mostra o que encontrou antes de sugerir** (só essas 2 áreas)
4. Para cada stack de backend/frontend, sugere **registrar o skill que já existe** (mesmo `area` e `stack`) ou **criar um novo** com `/jarvis-create-specialization {área} {stack}`; a pessoa escolhe, e o que não aceita não muda
5. Mostra um resumo das 6 listas e do que foi registrado ou criado

O tempo de ~10 minutos é referência, não limite. Nunca leia `.env*`, chaves ou credenciais.

> **Fluxo completo**: Ver `assets/passo-adicionar-stacks.md`. **Tabela de detecção**: `assets/sinais-de-stack.md`.

---

### 10. Confirmar Criação

```
✅ Arquivo ENV.md criado com sucesso!

📁 Localização: $IDE/ENV.md

📋 Resumo das configurações:
- Workspace: {WORKSPACE}
- Repos: {WORKSPACE_REPOS ou (todas as pastas com .git/)}
- Sessões: {SESSIONS_DIR}/eng|prod|qa
- Task manager: {TASK_MANAGER ou "vazio (freelance)"}
- Squad: {SQUAD}
- Hub: {HUB}
- Área: {AREA}
- Usuário: {USER}
- Cargo: {POSITION}
- Limite AI: {MAX_AI_EXECUTION_PERCENTAGE}%
- Especializações: {as 6 variáveis registradas, ou "só skill base" por área}
- CDD: habilitado
- JARVIS_PROJECT: {JARVIS_PROJECT}

⚠️ Lembre-se de:
1. Não commitar tokens ou senhas no repositório
2. Adicionar ENV.md ao .gitignore se contiver dados sensíveis
3. Garantir `.jarvis/` no `.gitignore` da pasta do workspace
4. Tokens Git ficam fora do ENV (`.npmrc` / `gh auth` / `BITBUCKET_TOKEN`)
```

### 11. Apresentar Processos

| Processo | Comando |
|----------|---------|
| Iniciar tarefa | `/eng.start` (pede `TASK_MANAGER_KEY` se freelance) |
| Planejar | `/eng.plan` |
| Implementar | `/eng.work` |
| Criar PR | `/eng.pr` |
| Identidade | `jarvis whoami` |

> Não apresentar checkin/checkout/daily/task-log/sync/metrics — removidos do fork.

### 12. Verificar Acessos

Confirmar acessos relevantes (não bloqueantes): Git; task manager se `TASK_MANAGER` estiver definido; chat se `MESSAGE_COMUNICATOR` estiver definido; ambiente de Dev.

### 13. Entregar Checklist

Apresentar checklist de onboarding por período (Dia 1, Semana 1, Mês 1).

> **Checklists detalhados**: Ver `assets/onboarding-checklist.md`

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 9 — Adicionar as stacks (opcional) | `/jarvis-create-specialization {área} {stack}` | Se a pessoa escolher criar um skill novo para uma stack que ainda não tem especialização instalada (uma stack por vez; pular o passo não chama nada) |

---

## Validações de Segurança

### ⛔ NUNCA FAÇA

- ❌ **NUNCA criar ENV.md do zero manualmente**
- ❌ **NUNCA omitir variáveis do template**
- ❌ **NUNCA fazer múltiplas perguntas de uma vez** - sempre perguntar UMA variável POR VEZ
- ❌ **NUNCA omitir opções disponíveis** - sempre mostrar TODAS as opções (AskUserQuestion ou texto)
- ❌ **NUNCA usar AskUserQuestion para >4 opções** - usar texto numerado
- ❌ **NUNCA fazer uma lista numerada com todas as perguntas juntas** - perguntar e aguardar resposta uma por vez
- ❌ **NUNCA aceitar respostas inválidas em variáveis com texto** - sempre validar contra lista
- ❌ Commitar tokens ou senhas
- ❌ Expor credenciais no chat
- ❌ Usar valores de exemplo em produção
- ❌ Pedir `jarvis login` ou bloquear por falta de `auth.json`
- ❌ Exigir e-mail corporativo / `@{DOMAIN}` para USER
- ❌ Criar `PROJECT_NAME`, `TOKEN_VERSION_CONTROL`, `EVENT_BUS*`, métricas ou `~/.jarvis/sessions`
- ❌ Pular criação do ENV.md ou omitir `SESSIONS_DIR`
- ❌ Travar o init esperando Jira / Redis / Sentry / MCP de task manager
- ❌ Exigir MCP de task manager quando `TASK_MANAGER` estiver vazio
- ❌ Prosseguir sem Context7 respondendo
- ❌ Omitir hub DATA da lista de HUB
- ❌ Criar AGENTS.md sem detectar stack
- ❌ Apresentar checkin/checkout/daily como parte do onboarding

### ✅ SEMPRE FAÇA

- ✅ **SEMPRE usar templates/ENV-template.md como base**
- ✅ **SEMPRE copiar TODO o conteúdo do template** (exceto bloco DATA_* se HUB≠DATA)
- ✅ **SEMPRE preservar variáveis vazias do template**
- ✅ **SEMPRE ajustar FLOWS_FOLDER baseado no IDE (commands para claude, workflows para outros)**
- ✅ **SEMPRE perguntar UMA variável POR VEZ e aguardar resposta antes da próxima**
- ✅ **SEMPRE usar AskUserQuestion só para ≤4 opções**
- ✅ **SEMPRE mostrar em texto numerado para >4 opções** (HUB com DATA, IDE, SQUAD, POSITION)
- ✅ **SEMPRE mostrar TODAS as opções disponíveis** - nunca omitir nenhuma
- ✅ **SEMPRE incluir descrição em cada opção** (AskUserQuestion ou texto)
- ✅ **SEMPRE validar respostas em texto contra lista de opções válidas**
- ✅ **SEMPRE usar multiSelect: false no AskUserQuestion** - apenas uma opção por variável
- ✅ Resolver USER localmente (ENV.md → git → SO) — sem login
- ✅ Só perguntar USER se o usuário quiser outro identificador
- ✅ Validar range do MAX_AI_EXECUTION_PERCENTAGE (60-100)
- ✅ WORKSPACE detectado (basename da pasta do `$IDE/`) ou override
- ✅ Criar `.jarvis/sessions/{eng,prod,qa}` e garantir `.jarvis/` no `.gitignore`
- ✅ Explicar freelance se `TASK_MANAGER` vazio (`TASK_MANAGER_KEY` próprio)
- ✅ Validar Context7 (obrigatório — sem ele o init para)
- ✅ Checar MCP de task manager em best-effort (1 tentativa, nunca bloquear)
- ✅ Pular MCP de task manager se `TASK_MANAGER` estiver vazio
- ✅ Criar AGENTS.md na raiz
- ✅ Apresentar checklist ao final

---

## Tratamento de Erros

| Erro | Ação |
|------|------|
| **taxonomy.md não encontrado** | Usar DEFAULT_OPTIONS (CORE + hubs com DATA) e avisar |
| **taxonomy.md inválido/corrompido** | Usar DEFAULT_OPTIONS e alertar |
| **AskUserQuestion não disponível** | Usar texto numerado para todas as opções fixas — não bloquear o init |
| **Múltiplas perguntas feitas de uma vez** | ERRO CRÍTICO - NUNCA faça isso. Pergunte uma por vez e aguarde resposta |
| **WORKSPACE vazio** | Usar o nome da pasta que contém `$IDE/`; confirmar com o usuário |
| **MAX_AI_EXECUTION_PERCENTAGE fora do range** | Ajustar automaticamente: <60 → 60, >100 → 100. Avisar usuário do ajuste. |
| **USER inválido** | Pedir outro identificador (email ou nome). Sem validação de `@{DOMAIN}`. |
| Template ENV não encontrado | Bloquear e pedir o pacote/framework com `templates/ENV-template.md` |
| Context7 não responde | **Parar** o init; orientar `assets/mcp-configs.md` e reinício da IDE |
| MCP de task manager não responde | Avisar e **continuar** (1 tentativa) |
| Stack não detectada | Perguntar ao usuário |
| IDE não detectada | Perguntar ao usuário qual IDE usa |

### Exemplo de Validação

**Exemplo 1: HUB (5 opções) - Texto Numerado**

```
Qual o hub do projeto?

1. AI
2. FRONTEND
3. BACKEND
4. QA
5. DATA
```

Validar número ou nome contra a lista do taxonomy (**inclui DATA**).

---

**Exemplo 2: SQUAD - Texto Numerado**

```
Qual o nome do seu squad?

Opções disponíveis: (lidas de taxonomy.md)
1. CORE - Time principal

Digite o número ou nome do squad:
```

```javascript
const selected = validateTextOption(userInput, extractSquadsFromTaxonomy())
if (!selected) {
  console.log("❌ Squad inválido. Digite um número ou nome válido da lista.")
}
```

### Valores Padrão (Fallback)

Se `taxonomy.md` não existir ou estiver corrompido, usar:

```javascript
const DEFAULT_OPTIONS = {
  SQUADS: ['CORE'],
  HUBS: ['AI', 'FRONTEND', 'BACKEND', 'QA', 'DATA', 'FULLCYCLE'],
  POSITIONS: ['HEAD', 'JUNIOR', 'PLENO', 'SENIOR', 'TECH LEAD', 'SPECIALIST', 'PM', 'TPM', 'GPM', 'CTO', 'GENERALIST'],
  AREAS: ['ENGINEERING', 'PRODUCT']
}
```

**Avisar usuário:**
```
⚠️ Arquivo taxonomy.md não encontrado. Usando opções padrão (CORE + hubs com DATA).
Para customizar, edite taxonomy.md e rode /taxonomy validate.
```

---

## Exemplo de Execução

**Usuário**: `/jarvis-init`

**Agente** *(resolve identidade local — ENV.md / git / SO)*:
```
✅ Identidade: joao@example.com
   USER será gravado no ENV.md.

📋 Vamos configurar o ambiente do framework.

Pergunta 1: Workspace detectado: `{pasta}`. Usar esse nome?
```

*[Uma pergunta por vez, aguardando resposta...]*

```
Pergunta 2: Qual IDE você está usando?
[mostrar opções em texto numerado]

Pergunta 3: Qual o nome do seu squad?
[mostrar opções do taxonomy em texto numerado]

Pergunta 4: Qual o hub do projeto?
[texto numerado com AI, FRONTEND, BACKEND, QA, DATA, FULLCYCLE]

Pergunta 5: Qual a área do projeto?
[AskUserQuestion ou texto numerado]

Pergunta 6: Qual o limite de execução da AI? (60-100)

Pergunta 7: Qual seu cargo?
[mostrar opções em texto numerado]

Pergunta 8 (opcional): Usa task manager? jira/linear/github/asana ou Nenhum (freelance)
```

**Agente**: *(cria ENV.md + `.jarvis/sessions/{eng,prod,qa}`, valida Context7, cria AGENTS.md e confirma)*

---

## Mensagem de Conclusão

```
✅ Inicialização concluída!

📁 Arquivos criados:
- ENV.md: $IDE/ENV.md
- AGENTS.md: ./AGENTS.md
- Sessões: .jarvis/sessions/{eng,prod,qa}/

🔧 Configuração:
- IDE: {ide}
- Workspace: {WORKSPACE}
- Repos: {WORKSPACE_REPOS ou (todas as pastas com .git/)}
- Task manager: {TASK_MANAGER ou freelance}
- Squad: {SQUAD}
- Especializações: {registradas/criadas, ou "só skill base"}

✅ MCPs:
- Context7: OK (obrigatório)
- Task manager ({TASK_MANAGER ou "vazio=freelance"}): {OK | pulado / indisponível}
- TestSprite: {OK | Não configurado}

📋 Próximos passos:
1. Revisar README.md e AGENTS.md
2. Executar projeto localmente
3. `/eng.start` com TASK_MANAGER_KEY (card ou controle próprio)

Bem-vindo! 🎉
```

---

## Checklist de Conclusão

- [ ] **Resolveu USER localmente** (ENV.md / git / SO) sem pedir login
- [ ] **Carregou taxonomy.md e extraiu opções válidas** (ou usou valores padrão se não existir)
- [ ] **Perguntou UMA variável POR VEZ** (nunca fez múltiplas perguntas juntas)
- [ ] **Usou AskUserQuestion só para ≤4 opções** (AREA se aplicável — HUB com DATA vai em texto)
- [ ] **Mostrou em texto numerado para >4 opções** (HUB, IDE, SQUAD, POSITION)
- [ ] **Mostrou TODAS as opções disponíveis** (HUB inclui DATA; nunca omitiu)
- [ ] **Incluiu descrição útil em cada opção** (seja AskUserQuestion ou texto)
- [ ] **Validou respostas em texto contra lista de opções válidas**
- [ ] **Usou multiSelect: false no AskUserQuestion** (apenas uma opção por variável)
- [ ] Detectou IDE corretamente
- [ ] Verificou se ENV.md já existe
- [ ] Se ENV.md existe: ofereceu opção de Upgrade (C) além de Sobrescrever/Atualizar/Cancelar
- [ ] Se Upgrade: calculou diff template vs ENV.md e appendou apenas variáveis faltantes
- [ ] Coletou todas as variáveis obrigatórias
- [ ] USER gravado no ENV.md a partir da identidade local
- [ ] Validou MAX_AI_EXECUTION_PERCENTAGE (60-100) - para campos livres
- [ ] Confirmou WORKSPACE (nome da pasta do `$IDE/` ou override)
- [ ] ENABLE_CDD=true e SESSIONS_DIR=.jarvis/sessions
- [ ] Criou `.jarvis/sessions/{eng,prod,qa}` e `.jarvis/` no `.gitignore`
- [ ] TASK_MANAGER: valor ou vazio (freelance) explicado
- [ ] Não gravou TOKEN_VERSION_CONTROL / PROJECT_NAME / EVENT_BUS*
- [ ] Perguntou sobre variáveis opcionais
- [ ] **Ajustou FLOWS_FOLDER baseado no IDE (commands se claude, workflows se outros)**
- [ ] **Se HUB=DATA: coletou variáveis DATA_* obrigatórias (passo 3.1)**
- [ ] **Se HUB≠DATA: bloco DATA_* removido completamente do ENV.md gerado**
- [ ] Criou arquivo ENV.md usando template completo
- [ ] **Se IDE ≠ claude: moveu todos os workflows de subpastas para a raiz de `$IDE/workflows/`**
- [ ] Validou Context7 (obrigatório)
- [ ] Se TASK_MANAGER definido: checou MCP em best-effort (não bloqueou)
- [ ] Se TASK_MANAGER vazio: pulou MCP de task manager
- [ ] Provisionou MCPs opcionais (Code Quality, se configurado)
- [ ] Criou AGENTS.md
- [ ] Ofereceu o passo 9 (adicionar as stacks), que é pulável; a detecção só leu e mostrou antes de sugerir; listas atualizadas sem duplicar
- [ ] Confirmou criação com usuário
- [ ] Alertou sobre dados sensíveis
- [ ] Apresentou processos (sem checkin/daily/metrics)
- [ ] Entregou checklist de onboarding

---

## Guardrails

### Regras Aplicáveis

- **Idioma**: Todos os arquivos `.md` gerados devem ser em português do Brasil (pt-BR)
- **Detecção de IDE**: A variável `$IDE` é detectada automaticamente (`.windsurf/`, `.claude/`, `.cursor/`, `.codex/`, `.opencode/`, `.gemini/`)
- **Nunca inventar dados**: Se informação não estiver disponível, perguntar ao usuário
- **Nunca expor credenciais**: Tokens e senhas nunca devem ser expostos no chat
- **MAX_AI_EXECUTION_PERCENTAGE**:
  - Valor padrão: 100
  - Valor mínimo: 60
  - Intervalo válido: 60-100
  - Valores fora do intervalo são ajustados automaticamente
- **Segurança primeiro**: Em caso de dúvida, priorizar segurança e integridade de dados
- **Ações destrutivas**: Nunca executar sem confirmação explícita do usuário

> **Regras completas**: Ver `$IDE/rules/engineering/eng-rules.md`
