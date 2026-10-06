---
description: Fluxo para preparar a sessão com contexto personalizado por perfil
version: "1.7"
auto_execution_mode: 1
env_file: "@/ENV.md"
model_tier: low
model_justification: Leitura seletiva de contexto e apresentação de menu — não requer raciocínio complexo
---

# warm-up — Contexto Personalizado por Perfil

## Objetivo

Preparar a sessão carregando **somente o contexto necessário** para o perfil do usuário,
evitando leitura desnecessária de arquivos e economizando tokens.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 0.5 › 2. Para cada tecnologia identificada | `context7` (MCP: `resolve-library-id`, `query-docs`) | Se houver variável de stack com valor no ENV.md (uma consulta por tecnologia identificada); sem variável de stack, pula silenciosamente |
| Passo 2 — Sincronizar Documentação Central | `/jarvis-docs-central` | Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md (Modo 1: Buscar Docs, via Skill tool) |
| Passo 4 › Menu TECH LEAD › opções A a H | `/eng.start`, `/eng.debug`, `/eng.create-ard`, `/eng.create-ard-from-code`, `/eng.create-rfc`, `/eng.build-tech-spec`, `/eng.review`, `/eng.docs` | Se `POSITION=TECH LEAD` e `AREA=ENGINEERING` (menu dedicado) e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu CTO › opções A a D | `/eng.review`, `/eng.create-ard`, `/eng.create-rfc`, `/eng.build-tech-spec` | Se `POSITION` for CTO ou equivalente (menu dedicado, para qualquer `AREA`) e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu ENGINEERING + DATA › opções A a C | `/data.new-pipeline`, `/eng-data`, `/data.contract` | Se `AREA=ENGINEERING` e `HUB=DATA` e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu ENGINEERING + QA › opções A a C | `/eng.qa-refinement-entry`, `/eng.qa-sprint-planning`, `/eng.qa-release-signoff` | Se `AREA=ENGINEERING` e (`HUB=QA` ou Quality Champion) e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu ENGINEERING (qualquer HUB) › opções A a I | `/eng.start`, `/eng.debug`, `/eng.create-ard`, `/eng.create-ard-from-code`, `/eng.create-rfc`, `/eng.build-tech-spec`, `/eng.review`, `/eng.docs`, `/eng.rpa.robot` | Se `AREA=ENGINEERING` (qualquer HUB, sem menu mais específico) e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu PRODUCT › opções A a D | `/prod.spec.prd`, `/prod.spec.frd`, `/prod.spec.issue`, `/prod.spec.epic` | Se `AREA=PRODUCT` (ou `POSITION` PM/TPM/GPM em `AREA=ENGINEERING`) e o usuário escolher uma das opções (cada opção chama o workflow correspondente, na ordem do menu e do roteamento do Passo 4; `Outro` não chama workflow) |
| Passo 4 › Menu genérico › opção B | `/eng.docs` | Se `AREA` não tiver menu próprio (menu genérico) e o usuário escolher a opção B (se existir; senão criar diretamente) |
| Integração com CDD | `/jarvis-context-detect` | Se `ENABLE_CDD=true` no ENV.md, depois de o usuário selecionar a opção do menu e antes de iniciar o workflow escolhido |

---

## Passo 0 — Ler ENV.md (silenciosamente)

Leia o arquivo `$IDE/ENV.md` e extraia as seguintes variáveis:

```bash
grep -E "^(POSITION|SQUAD|HUB|AREA|WORKSPACE|WORKSPACE_REPOS|DOCS_FOLDER|RULES_FOLDER|FLOWS_FOLDER|TEMPLATES_FOLDER|MAX_AI_EXECUTION_PERCENTAGE|ENABLE_CDD)=" $IDE/ENV.md
```

Variáveis que guiam o carregamento de contexto:

| Variável | Uso |
|----------|-----|
| `POSITION` | Define profundidade e foco do contexto |
| `HUB` | Define especialidade técnica prioritária |
| `AREA` | Define domínio (ENGINEERING vs PRODUCT vs outros) |
| `SQUAD` | Referência de squad para contexto do time |
| `WORKSPACE` | Pasta do `$IDE/`. Vazio = nome dessa pasta |
| `WORKSPACE_REPOS` | Allowlist. Vazio = todas as subpastas com `.git/` |
| `DOCS_FOLDER` | Caminho base dos documentos do workspace |
| `RULES_FOLDER` | Caminho base das regras |
| `FLOWS_FOLDER` | Caminho base dos workflows |
| `MAX_AI_EXECUTION_PERCENTAGE` | Calibra nível de autonomia |
| `ENABLE_CDD` | Ativa/desativa calibração contextual |

> **Não invente valores ausentes.** Se uma variável crítica não estiver definida, continue com o comportamento padrão indicado abaixo.
>
> `$IDE/ENV.md` pode estar num ancestral do cwd (workspace acima do repo aberto).
> Se `WORKSPACE` estiver vazio, usar o nome da pasta que contém `$IDE/`.
> Repos = `WORKSPACE_REPOS` ou scan de subpastas com `.git/`. Se houver mais de um, perguntar quais carregar nesta sessão (`ACTIVE_REPOS`). Um git na raiz = fluxo atual.

---

## Passo 0.5 — Reconhecimento do Stack Técnico (silenciosamente)

Objetivo: garantir contexto completo do stack **antes** de qualquer workflow,
para nunca inventar ou sugerir tecnologias fora do que o projeto usa.

### 1. Extrair variáveis de stack do ENV.md

Além das variáveis de perfil (Passo 0), extrair todas as variáveis de tecnologia
definidas no ENV.md — qualquer variável não relacionada a perfil de usuário com
valor não vazio. Exemplos de padrões comuns:

- Mensageria  : `MESSAGE_BROKER`, `MESSAGE_BROKER_URL_API`, `MESSAGE_BROKER_API_AUTH`
- Banco       : `DB_*`, `DATABASE_*`
- Cache       : `CACHE_*`, `REDIS_*`
- Outros serviços: qualquer var com `_URL`, `_HOST`, `_API` no nome

> Não hardcode nomes de tecnologias. Leia o que está definido e infira a tech
> pelo valor da variável (ex: `MESSAGE_BROKER=rabbitmq` → tech = RabbitMQ).

### 2. Para cada tecnologia identificada

**a) Carregar documentação via context7:**
```
mcp__context7__resolve-library-id → query: {nome da tecnologia}
mcp__context7__query-docs         → carregar docs relevantes
```
→ Usar a documentação como referência para toda a sessão.

**b) Se houver URL de API de gerenciamento + credenciais:**
- Consultar a API para entender a topologia real do serviço
  (ex: exchanges, filas e bindings ativos para RabbitMQ via management API)
- Usar as variáveis `*_URL_API` + `*_API_AUTH` correspondentes
- Registrar o que foi encontrado como contexto da sessão

### 3. Invariante de sessão — crítica

> 🔒 A partir deste passo, para toda a sessão:
> - Trabalhar **somente** com as tecnologias identificadas aqui
> - **Nunca sugerir alternativas tecnológicas** não presentes no stack identificado
> - **Nunca inventar** configurações, topologias ou comportamentos não confirmados
>   via ENV, API ou codebase
> - Exceção: **somente se o usuário solicitar explicitamente**

> Se nenhuma variável de stack for encontrada no ENV.md, pular silenciosamente.

---

## Passo 1 — Determinar Perfil de Comunicação

O perfil de comunicação é derivado de `POSITION` (conforme definido no `$IDE/taxonomy.md`).
**Não use a lista abaixo como hardcode** — use-a como referência de interpretação semântica:

| Categoria semântica | Exemplos de POSITION | Perfil de comunicação |
|---------------------|---------------------|----------------------|
| Técnico iniciante | JUNIOR, PLENO | `didático` — explicar decisões, incluir contexto |
| Técnico sênior | SENIOR, TECH LEAD, SPECIALIST | `direto` — foco em trade-offs e riscos |
| Gestão de produto | PM, TPM, GPM | `estratégico` — impacto e visão de produto |
| Executivo | CTO e equivalentes | `estratégico` — visão de alto nível |
| Não definido | — | `didático` (padrão conservador) |

> O mapeamento exato de quais POSITIONs existem vem do `$IDE/taxonomy.md` — não assuma valores fora desse arquivo.

---

## Passo 2 — Sincronizar Documentação Central (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md, invocar o skill `jarvis-docs-central` via Skill tool para carregar docs do produto.

> ⚠️ **IMPORTANTE**: NÃO executar `jarvis docs sync` diretamente via Bash.
> Usar sempre: **Skill tool → jarvis-docs-central (Modo 1: Buscar Docs)**

O skill `jarvis-docs-central` gerencia:
- Extração de token do `.npmrc`
- Fallback quando `index.md` não existe (navegação por árvore)
- Tratamento de erros

**Invocação:**
```
Skill tool: jarvis-docs-central
Modo: 1 (Buscar Docs)
Contexto: warm-up - sincronização inicial
```

**Output esperado:**
```
🔄 Sincronizando docs de {SQUAD}/{WORKSPACE}...
✅ Docs sincronizados
📊 5 documentos disponíveis:
   - 1 PRD(s)
   - 1 FRD(s)
   - 2 ARD(s)
   - 1 RFC(s)
```

**Comportamento:**
- Se `CENTRAL_DOCS_REPO` vazio → pula silenciosamente
- Se erro de token → exibe aviso mas continua
- Se `index.md` não existe → navega estrutura do repo e lista docs disponíveis
- Se erro genérico → exibe mensagem clara e continua sem bloquear

Após sincronizar, exibir resumo dos documentos disponíveis:
- PRDs compartilhados do produto
- ARDs gerais e específicos do repo atual
- RFCs relevantes
- Dependências externas (outros produtos/squads)

---

## Passo 3 — Carregar Contexto Seletivo por AREA e HUB

**Regra fundamental**: os caminhos são construídos **dinamicamente** a partir dos valores lidos do ENV.md.
Não use caminhos hardcoded. Não escaneie pastas inteiras.

### 3.1 — Construir caminhos base a partir do ENV e taxonomy

```bash
# 1. Ler AREA e HUB do ENV
AREA=$(grep "^AREA=" $IDE/ENV.md | cut -d= -f2)
HUB=$(grep "^HUB=" $IDE/ENV.md | cut -d= -f2)

# 2. Ler prefixo da AREA no taxonomy (linha "prefix: xxx" abaixo do ### AREA)
{prefix}   = valor de "prefix:" definido sob ### {AREA} em $IDE/taxonomy.md
{area}     = lowercase(AREA)

ex: AREA=ENGINEERING → prefix="eng",  area="engineering"
    AREA=PRODUCT     → prefix="prod", area="product"
```

> Se o prefixo não estiver definido no taxonomy, usar `lowercase(AREA)` como fallback.

### 2.2 — Sequência de leitura (executar nessa ordem)

**Sempre leia:**
```
git log --oneline -3             ← commits recentes (independente de perfil)
git status --short               ← estado atual do repositório
```

**Docs da área (tentar em ordem, parar no primeiro encontrado):**
```
1. $DOCS_FOLDER/{area}/index.md  ← índice de docs da área (ex: docs/engineering/index.md)
2. $DOCS_FOLDER/index.md         ← índice geral (fallback)
2. $DOCS_FOLDER/AGENTS.md        ← resumo para agents geral (fallback)
(não ler os docs em si — apenas o índice para mapear o que existe)
```

**README (apenas para perfil didático ou quando não há docs/index.md):**
```
README.md (raiz do projeto)      ← visão geral do projeto
```

> As regras de área e de hub (`$RULES_FOLDER/`) já foram carregadas no início da sessão — não precisam ser relidas aqui.

### 2.3 — Exemplos de caminhos gerados (ilustrativo)

| AREA | prefix | HUB | Caminhos tentados |
|------|--------|-----|-------------------|
| ENGINEERING | eng | QA | `docs/engineering/index.md` |
| ENGINEERING | eng | AI | `docs/engineering/index.md` |
| PRODUCT | prod | — | `docs/product/index.md` |

> **Importante**: Se um arquivo ou pasta não existir, ignore silenciosamente — não errar, não inventar.
> Novos valores de AREA ou HUB adicionados ao taxonomy.md funcionam automaticamente sem alterar este workflow.

---

## Passo 3 — Resumo de Contexto Carregado

Após as leituras, exiba **somente** um resumo compacto:

```
── Sessão iniciada ──────────────────────────────────────
  Workspace: {WORKSPACE}
  Perfil   : {POSITION} · {HUB} · {SQUAD}
  Autonomia: {MAX_AI_EXECUTION_PERCENTAGE}%
  Stack    : {lista das techs identificadas no ENV}
  Docs     : {context7 carregado para cada tech + docs de área}
  Topologia: {resumo da consulta à API de gerenciamento, se disponível}
  Commits  : {N} commits recentes carregados
─────────────────────────────────────────────────────────
```

---

## Passo 4 — Menu Adaptado por AREA

O menu é determinado pelos valores de `POSITION`, `AREA` e `HUB` lidos do ENV.md.

> ⚠️ **Ordem de precedência — verificar SEMPRE nesta sequência:**
> 1. **POSITION** — se houver menu dedicado para o POSITION, usá-lo diretamente (ignora AREA+HUB)
> 2. **AREA + HUB** — combinações específicas (DATA, QA, RPA)
> 3. **AREA** — menu genérico da área
> 4. **Genérico** — fallback para AREAs sem menu próprio
>
> **Nunca avaliar menus de AREA antes de verificar se o POSITION tem menu dedicado.**

> Se o valor de AREA não tiver menu definido abaixo, use o **menu genérico**.
> Novos valores de AREA adicionados ao taxonomy.md devem ganhar um menu correspondente aqui.

---

### Menu para POSITION=TECH LEAD (sobrepõe menu genérico de ENGINEERING)

> ℹ️ Usar este menu quando `POSITION=TECH LEAD` e `AREA=ENGINEERING`.
> O Tech Lead é responsável pelos gates de qualidade do time.

```
Como você quer continuar?

A: Iniciar sessão para codar (eng.start)
B: Debug / Investigar problema (eng.debug)
C: Criar ou iterar ARD (eng.create-ard)
D: Criar ou iterar ARD desde o codebase (eng.create-ard-from-code)
E: Abrir ou iterar RFC (eng.create-rfc)
F: Fazer tech spec (eng.build-tech-spec)
G: Revisar código / PR (eng.review)
H: Documentar (eng.docs)
I: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/engineering/eng.start.md`
- B → `$FLOWS_FOLDER/engineering/eng.debug.md`
- C → `$FLOWS_FOLDER/engineering/eng.create-ard.md`
- D → `$FLOWS_FOLDER/engineering/eng.create-ard-from-code.md`
- E → `$FLOWS_FOLDER/engineering/eng.create-rfc.md`
- F → `$FLOWS_FOLDER/engineering/eng.build-tech-spec.md`
- G → `$FLOWS_FOLDER/engineering/eng.review.md`
- H → `$FLOWS_FOLDER/engineering/eng.docs.md`
- I → perguntar e rotear dinamicamente

---

### Menu para POSITION=CTO (sobrepõe AREA)

> ℹ️ Usar este menu para qualquer `AREA` quando `POSITION` é equivalente a CTO.
> Foco estratégico: arquitetura, risco e decisões de alto impacto — sem granularidade operacional.

```
Como você quer continuar?

A: Revisar código / PR estratégico (eng.review)
B: Criar ou iterar ARD (eng.create-ard)
C: Abrir ou iterar RFC (eng.create-rfc)
D: Fazer tech spec (eng.build-tech-spec)
E: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/engineering/eng.review.md`
- B → `$FLOWS_FOLDER/engineering/eng.create-ard.md`
- C → `$FLOWS_FOLDER/engineering/eng.create-rfc.md`
- D → `$FLOWS_FOLDER/engineering/eng.build-tech-spec.md`
- E → perguntar e rotear dinamicamente

---

### Menu para AREA=ENGINEERING e HUB=DATA

> ℹ️ Usar este menu quando `AREA=ENGINEERING` **e** `HUB=DATA`.

```
Como você quer continuar?

A: Criar pipeline novo (data.new-pipeline)
B: Trabalhar com dados — onboarding de fonte, debug, dashboard/BI ou orquestração (eng-data)
C: Criar contrato de dados (data.contract)
D: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/engineering/data/data.new-pipeline.md`
- B → skill `eng-data`
- C → `$FLOWS_FOLDER/engineering/data/data.contract.md`
- D → perguntar e rotear dinamicamente

---

### Menu para AREA=ENGINEERING e (HUB=QA ou Quality Champion)

> ℹ️ Usar este menu quando `AREA=ENGINEERING` **e** uma das condições:
> - `HUB=QA`
> - O usuário atual (`USER` do ENV.md) constar em `members.md` com `Quality Champion` no campo Posição
>
> Para verificar se o usuário é Quality Champion:
> ```bash
> grep -i "$USER" members.md | grep -i "Quality Champion"
> ```
> Se retornar resultado → usuário é Quality Champion → usar este menu.

```
Como você quer continuar?

A: Mapear estratégia de testes para uma feature (qa.refinement-entry)
B: Planejar capacidade QA da sprint (qa.sprint-planning)
C: Sign-off de release (qa.release-signoff)
D: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/engineering/qa/eng.qa-refinement-entry.md`
- B → `$FLOWS_FOLDER/engineering/qa/eng.qa-sprint-planning.md`
- C → `$FLOWS_FOLDER/engineering/qa/eng.qa-release-signoff.md`
- D → perguntar e rotear dinamicamente

---

### Menu para AREA=ENGINEERING (qualquer HUB)

```
Como você quer continuar?

A: Iniciar sessão para codar (eng.start)
B: Debug / Investigar problema (eng.debug)
C: Criar ou iterar um ARD do zero ou desde um PRD (eng.create-ard)
D: Criar ou iterar um ARD desde o codebase (eng.create-ard-from-code)
E: Abrir ou iterar um RFC (eng.create-rfc)
F: Fazer uma tech spec (eng.build-tech-spec)
G: Revisar código / PR (eng.review)
H: Documentar (eng.docs)
I: Criar ou manter robô RPA (eng.rpa.robot) — skill técnica, não depende de squad
J: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/engineering/eng.start.md`
- B → `$FLOWS_FOLDER/engineering/eng.debug.md`
- C → `$FLOWS_FOLDER/engineering/eng.create-ard.md`
- D → `$FLOWS_FOLDER/engineering/eng.create-ard-from-code.md`
- E → `$FLOWS_FOLDER/engineering/eng.create-rfc.md`
- F → `$FLOWS_FOLDER/engineering/eng.build-tech-spec.md`
- G → `$FLOWS_FOLDER/engineering/eng.review.md`
- H → `$FLOWS_FOLDER/engineering/eng.docs.md`
- I → `$FLOWS_FOLDER/engineering/eng.rpa.robot.md`
- J → perguntar e rotear dinamicamente

### Menu para AREA=PRODUCT

```
Como você quer continuar?

A: Criar nova PRD (prod.spec.prd)
B: Criar novo FRD (prod.spec.frd)
C: Criar story, task ou issue (prod.spec.issue)
D: Detalhar épico (prod.spec.epic)
E: Outro
```

Roteamento:
- A → `$FLOWS_FOLDER/product/prod.spec.prd.md`
- B → `$FLOWS_FOLDER/product/prod.spec.frd.md`
- C → `$FLOWS_FOLDER/product/prod.spec.issue.md`
- D → `$FLOWS_FOLDER/product/prod.spec.epic.md`
- E → perguntar e rotear dinamicamente

### Menu genérico (qualquer AREA além de ENGINEERING/PRODUCT)

```
Como você quer continuar?

A: Perguntar algo sobre o projeto
B: Criar documentação
C: Outro
```

Roteamento:
- A → responder com base no contexto carregado
- B → `$FLOWS_FOLDER/engineering/eng.docs.md` (se existir) ou criar diretamente
- C → perguntar qual atividade e rotear dinamicamente

### Ajuste de menu por POSITION (sobrepõe AREA quando aplicável)

| POSITION semântico | Ajuste no menu |
|-------------------|----------------|
| CTO e equivalentes | Menu estratégico (arquitetura e risco) — ver seção "Menu para POSITION=CTO" acima |
| TECH LEAD em AREA=ENGINEERING | Menu completo de engenharia — ver seção "Menu para POSITION=TECH LEAD" acima |
| PM, TPM, GPM em AREA=ENGINEERING | Mostrar menu PRODUCT mesmo estando na área ENGINEERING |

---

## Passo 5 — Limite de Execução (MAX_AI_EXECUTION_PERCENTAGE)

A regra completa de `MAX_AI_EXECUTION_PERCENTAGE` (cálculo, comportamento ao atingir o limite e calibração por valor) está em `$RULES_FOLDER/engineering/eng-rules.md` — já carregada no início da sessão. Declare ao usuário o limite configurado, quantas tarefas isso representa e o que ficará para execução humana.

---

## Regras do Warm-up

### Nunca faça
- Ler uma pasta inteira para mapear contexto — use o índice ou leia arquivos específicos
- Inventar valores de ENV não definidos
- Recusar contexto de outra área: Dev/TL/PM podem carregar rules de engenharia **e** de produto (autonomia ponta-a-ponta)
- Perguntar informações que já constam no ENV.md
- Sugerir tecnologia alternativa não presente no stack identificado no Passo 0.5
- Assumir topologia de serviços sem consultar ENV ou API de gerenciamento

### Sempre faça
- Ler ENV.md primeiro, antes de qualquer outra coisa
- Carregar stack técnico do ENV antes de qualquer workflow (Passo 0.5)
- Usar context7 para documentação das tecnologias identificadas no stack
- Consultar API de gerenciamento quando disponível (`*_URL_API` + `*_API_AUTH` no ENV)
- Usar `$RULES_FOLDER`, `$DOCS_FOLDER`, `$FLOWS_FOLDER` em vez de caminhos hardcoded
- Exibir o resumo de contexto antes do menu
- Rotear para o workflow correto sem repetir perguntas já respondidas
- Ignorar silenciosamente arquivos que não existem

---

## Integração com CDD

Se `ENABLE_CDD=true` no ENV.md, **após o usuário selecionar a opção do menu**,
execute `/jarvis-context-detect` antes de iniciar o workflow escolhido.

Se `ENABLE_CDD=false` ou não definido, prossiga diretamente para o workflow.