---
name: jarvis-init
description: Inicializa o framework JARVIS e guia novos membros no processo de onboarding. Use quando precisar configurar o ambiente, criar ENV.md, validar MCPs ou orientar um novo desenvolvedor.
argument-hint: "[upgrade | nome-do-membro-opcional]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash
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
3. **Sessões no workspace** — `$SESSIONS_DIR` (padrão `.jarvis/sessions`, configurável) com `{eng,prod,qa}/`. Estado local em `{workspace}/.jarvis/` (não em `~/.jarvis/`).
4. **`TASK_MANAGER` vazio = freelance** — sem board. Workflows pedem `TASK_MANAGER_KEY` (controle próprio) e as ações viram `.md`.
5. **Context7 obrigatório**; demais MCPs (Redis, Sentry, TestSprite) **não bloqueiam**. Board e git não usam MCP: usam a CLI oficial (contrato 7).
6. **Sem event bus / metrics / checkin-checkout-daily** — não provisionar Redis runtime nem pedir métricas.
7. **Board e git pela CLI oficial, sem token** — `gh` (GitHub), `glab` (GitLab), `acli` (Jira Cloud), com o login delas (`gh auth login`, `glab auth login`, `acli jira auth login`). Nenhum token vai no ENV.md (não existem `TOKEN_TASK_MANAGER` nem `TOKEN_VERSION_CONTROL` no template). Catálogo: `bin/lib/integrations/vendors.json`. Linear, Asana e Bitbucket não são suportados (o eixo fica em freelance).
8. **Autonomia** — qualquer `POSITION` (JUNIOR…CTO / PM) pode rodar o card ponta a ponta (`/eng.start` → `/eng.pr`). Sem gate obrigatório de TL/PM no init.
9. **Fonte do ENV** — só `templates/ENV-template.md`. Não inventar variáveis. `JARVIS_PROJECT` default: `https://github.com/phelipperibeiro/jarvis-framework` (sempre a URL completa; trocar só para um fork interno).
10. **IDEs** — windsurf, claude, cursor, codex, opencode, gemini/antigravity, kiro.
11. **Instalação só global** — `npm install -g jarvis-ai-framework`. O `jarvis init` roda dentro do projeto e copia os assets do Jarvis global; cópia local no projeto (`node_modules` ou dependência no `package.json`) é ignorada. Antes de tudo, confira a versão (Passo 0).

## Objetivo

- Configurar ambiente de desenvolvimento
- Validar MCP obrigatório (Context7) e descobrir a CLI do board e do git (instalada e logada; não bloqueante)
- Criar arquivos de configuração (ENV.md, AGENTS.md) e pastas `$SESSIONS_DIR/{eng,prod,qa}`
- Orientar nos processos do framework (sem ritual diário / login)

## Entrada

- `$ARGUMENTS` - (Opcional) `upgrade` (sem diferenciar maiúsculas): com `$IDE/ENV.md` existente, vai direto ao **Upgrade (C)** do passo "2. Verificar Existência do ENV.md", sem o menu A/B/C/D; sem `ENV.md`, avisa e segue a criação normal. Qualquer outro valor é o nome do novo membro, para personalizar o onboarding.

## Recursos

- **Taxonomia**: `taxonomy.md` (na raiz do framework / workspace) - Define opções válidas para SQUAD, HUB, POSITION, AREA
- **Template ENV**: `templates/ENV-template.md` (**única** fonte — não use ENV-example.md)
- **Template AGENTS**: `templates/engineering/AGENTS-template.md`
- **Configurações MCP**: `$IDE/skills/jarvis-init/assets/mcp-configs.md`
- **Checklist Onboarding**: `$IDE/skills/jarvis-init/assets/onboarding-checklist.md`
- **Guia de Setup**: `$IDE/skills/jarvis-init/assets/setup-guide.md`
- **Passo "adicionar as stacks"**: `$IDE/skills/jarvis-init/assets/passo-adicionar-stacks.md` e `$IDE/skills/jarvis-init/assets/sinais-de-stack.md`
- **Passo 8 sem o CLI**: `$IDE/skills/jarvis-init/assets/rules-sync-manual.md` (fallback do `jarvis rules sync`)
- **Upgrade (C)**: `$IDE/skills/jarvis-init/assets/upgrade.md`
- **Opções padrão e exemplos de validação**: `$IDE/skills/jarvis-init/assets/validacoes.md`
- **Exemplo de execução**: `$IDE/skills/jarvis-init/assets/exemplo-execucao.md`
- **Saída**: `$IDE/ENV.md`, `AGENTS.md`, `{workspace}/$SESSIONS_DIR/{eng,prod,qa}/`

---

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  0. CONFERIR VERSÃO → jarvis-lock.json × jarvis --version   │
│        ↓                                                    │
│  1. DETECTAR IDE → Identificar ambiente                     │
│        ↓                                                    │
│  2. VERIFICAR → Se ENV.md já existe                         │
│        ↓                                                    │
│  3. COLETAR → Variáveis obrigatórias                        │
│        ↓                                                    │
│  4. PERGUNTAR → Variáveis opcionais                         │
│        ↓                                                    │
│  5. CRIAR → Arquivo ENV.md + pastas $SESSIONS_DIR          │
│        ↓                                                    │
│  5.1 FLATTEN → Workflows para raiz (se IDE ≠ claude)        │
│        ↓                                                    │
│  6. VALIDAR → Context7 (obrigatório)                        │
│        ↓                                                    │
│  7. CRIAR → AGENTS.md                                       │
│        ↓                                                    │
│  8. SYNC RULES → jarvis rules sync (perfil do ENV.md)       │
│        ↓                                                    │
│  9. STACKS → Adicionar as stacks (opcional, pulável)        │
│        ↓                                                    │
│  9.5 VALIDAR ENV.md → Arquivo inteiro × template (sempre)   │
│        ↓                                                    │
│  10. CONFIRMAR → Com usuário                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Trabalho Detalhado

### 0. Conferir a versão (antes de tudo)

O texto deste skill e dos assets em `$IDE/` é o da versão que fez o último sync (`jarvis-lock.json`). Se ela estiver atrás do Jarvis global, você estaria seguindo regras antigas.

1. Leia o `version` do `jarvis-lock.json` da pasta do workspace. Sem o arquivo, o projeto é novo: siga para o Passo 1.
2. Rode `jarvis --version` (o Jarvis global). Sem o `jarvis` no PATH, explique que o Jarvis é instalado só global (`npm install -g jarvis-ai-framework`) e pergunte com `AskUserQuestion` se segue mesmo assim (**Instalar antes** | **Seguir assim mesmo**).
3. Compare as duas versões (`x.y.z`):
   - **Lock mais antigo que o global:** explique em uma frase ("os assets deste projeto são da {lock}; o seu Jarvis global é a {global}") e pergunte com `AskUserQuestion`: **Atualizar os assets agora (Recomendada)** | **Seguir assim mesmo**. Para atualizar, na pasta do workspace:
     - com `$IDE/ENV.md`: `jarvis init --upgrade --ide {ide}`;
     - sem `$IDE/ENV.md` (o projeto passou pelo `jarvis init` e ainda não pelo `/jarvis-init`): `jarvis init --ide {ide} --force`, porque o `--upgrade` exige o `ENV.md`.

     Depois, recomece este skill pelo Passo 0, porque o texto dele pode ter mudado.
   - **Lock mais novo que o global:** avise que o Jarvis global está desatualizado (`npm install -g jarvis-ai-framework`) e siga. Não rode o `jarvis init` com esse global: ele rebaixaria os assets.
   - **Iguais:** siga.

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

> **⚠️ Se taxonomy.md não existir ou for inválido**: use os valores padrão e mostre o aviso de `assets/validacoes.md` (seção "Valores Padrão (Fallback)").

### 2. Detectar IDE

Identificar qual IDE o usuário está utilizando:

| IDE | Pasta | Arquivo MCP (gravado pelo `jarvis init`) |
|-----|-------|-------------|
| Windsurf | `.windsurf/` | só global: `~/.config/devin/mcp_config.json` (o init mostra o trecho) |
| Cursor | `.cursor/` | `.cursor/mcp.json` |
| Claude | `.claude/` | `.mcp.json` (na raiz do workspace) |
| Codex | `.codex/` | `.codex/config.toml` (projeto confiável) |
| OpenCode | `.opencode/` | `opencode.json` |
| Gemini / Antigravity | `.agents/` | `.gemini/settings.json` e `.agents/mcp_config.json` |
| Kiro | `.kiro/` | `.kiro/settings/mcp.json` |

> Formatos e como ativar cada um: tabela "Caminhos de Configuração" em `assets/mcp-configs.md`.

### 2. Verificar Existência do ENV.md

**CRÍTICO**: O `ENV.md` é a fonte de verdade do projeto.

1. Verificar se `$IDE/ENV.md` já existe
2. Se existir e `$ARGUMENTS` for `upgrade`, siga direto para a opção C, sem perguntar. Se existir e não vier `upgrade`, perguntar ao usuário:
   ```
   ⚠️ O arquivo ENV.md já existe. O que deseja fazer?
   A: Sobrescrever completamente
   B: Atualizar apenas variáveis específicas
   C: Upgrade — adicionar variáveis novas do template (não troca valor existente sem a sua resposta)
   D: Cancelar
   ```
   A (que segue o fluxo completo), B e C terminam pelo **passo 9.5 (validar o ENV.md)**; D não toca no arquivo.

**Se opção C (Upgrade):**

Siga `assets/upgrade.md` do começo ao fim (nota do terminal e itens 1-12). Ele termina oferecendo o passo 9 (a única etapa que a pessoa pode pular) e rodando o passo 9.5, cujo item 5 (Resumo) é o resumo do Upgrade, e então encerra, sem continuar o onboarding.

**⚠️ OBRIGATÓRIO - Criação do ENV.md**:

O ENV.md DEVE ser criado usando como base **TODO O CONTEÚDO** de:
- `templates/ENV-template.md`

**NUNCA crie o ENV.md do zero!** Use o template completo e apenas substitua os valores das variáveis. Não invente chaves (`PROJECT_NAME`, `TOKEN_VERSION_CONTROL`, `EVENT_BUS*`, `BUG_FREQ*`, etc.).

Fluxo correto:
1. Ler o conteúdo completo de `templates/ENV-template.md`
2. Substituir os valores das variáveis conforme coletado do usuário
3. Garantir `SESSIONS_DIR` (padrão `.jarvis/sessions`) e `JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework` (ou URL que o usuário informar)
4. Escrever `$IDE/ENV.md` com o restante do template (incluindo variáveis vazias)
5. As 6 chaves de especialização ficam **vazias**, exceto `QA_SPECIALIZATIONS`, que vem com `eng-qa-planner` (único hoje, pré-registrado por padrão — ver `templates/ENV-template.md`): não são perguntadas aqui. O registro/ajuste é feito no **passo 9 (adicionar as stacks)**, ou depois, a qualquer momento: consulta com `jarvis-list-specializations` e criação com `jarvis-create-specialization` (só backend/frontend).

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
- **PROD_MODE** (2 opções: product-led, developer-guided) → AskUserQuestion, sempre perguntado e sem opção sugerida
- **ARTIFACT_STYLE** (2 opções: ai-generated, human-generated) → AskUserQuestion, `ai-generated` primeiro

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
Escanear `.git/` na raiz e nas subpastas e gravar `WORKSPACE_MODE` (o que define o modo é a RAIZ ser ou não um repositório, não o número de repositórios):
- Raiz com `.git` → `WORKSPACE_MODE=project`, `WORKSPACE_REPOS` vazio (se também houver subpastas com `.git`, como submódulos, grave `project` e avise)
- Raiz sem `.git` e 1 ou mais subpastas com `.git` → `WORKSPACE_MODE=workspace`; com 2 ou mais, listar e perguntar se filtra (`WORKSPACE_REPOS`); senão vazio (todas)
- Raiz sem `.git` e nenhuma subpasta com `.git` → `WORKSPACE_MODE=project`

> O `WORKSPACE_MODE` não decide o `.gitignore` nem o `.git/info/exclude`: eles só são criados ou alterados quando a raiz tem `.git` (Passo 5). Uma pasta sem nenhum `.git` é `project` e mesmo assim não recebe nenhum dos dois.

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

```
Pergunta 8 (opções fixas - 2 opções - usar AskUserQuestion) — PROD_MODE:
Como você quer que os comandos de produto (prod.*) e o eng.create-ard conduzam a conversa?
- Product-Led: para PMs. Fluxo direto, com os termos de PM, sem explicações extras.
- Developer-Guided: para devs e futuros PMs. Uma pergunta por vez, explicando cada termo e etapa enquanto você faz.
```

*[Perguntar **sempre**, para qualquer `AREA` e qualquer `POSITION` (inclusive `GENERALIST` e PM). **Não** marcar nenhuma opção como recomendada nem sugerir padrão por área ou cargo. Gravar `PROD_MODE=product-led` ou `PROD_MODE=developer-guided`.]*

```
Pergunta 9 (opções fixas - 2 opções - usar AskUserQuestion) — ARTIFACT_STYLE:
Qual o estilo dos artefatos que o Jarvis gera (commits, PRs, comentários e documentos)?
- AI-Generated (padrão): como hoje, com metadados, links de rastreabilidade e padrões da ferramenta.
- Human-Generated: nada do que é publicado (commit, PR, comentário no card, issue) leva marca de IA; e todo documento gerado oferece, no fim, uma versão humanizada ({nome}.public.md) para repassar a clientes ou stakeholders.
```

*[`ai-generated` como primeira opção. Gravar `ARTIFACT_STYLE=ai-generated` ou `ARTIFACT_STYLE=human-generated`. A escolha muda as rules copiadas no Passo 8: com `human-generated`, entra `rules/artifact-style-rules.md`.]*

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
| `WORKSPACE_MODE` | Modo de trabalho | `workspace` (raiz sem `.git` e 1+ subpastas com `.git/`) ou `project` (raiz com `.git`). Detectado, não perguntado |
| `IDE` | IDE utilizada | `windsurf`, `claude`, `cursor`, `codex`, `opencode`, `gemini`, `kiro` (antigravity → gemini) |
| `SQUAD` | Nome do squad | Deve estar em `taxonomy.md` → Squads |
| `HUB` | Hub do workspace | Deve estar em `taxonomy.md` → Hubs (**inclui DATA**) |
| `AREA` | Área do workspace | Deve estar em `taxonomy.md` → Areas |
| `MAX_AI_EXECUTION_PERCENTAGE` | Limite de execução da AI | Número entre 60 e 100 |
| `USER` | Identidade do usuário (email ou nome) | ENV.md → git `user.email` → usuário do SO. Sem login |
| `POSITION` | Cargo do usuário | Deve estar em `taxonomy.md` → Positions. Autonomia ponta a ponta em qualquer cargo |
| `PROD_MODE` | Modo de condução dos comandos de produto e do `eng.create-ard` | `product-led` ou `developer-guided`. Sempre perguntado, sem opção sugerida (Pergunta 8) |
| `ARTIFACT_STYLE` | Estilo dos artefatos gerados | `ai-generated` (padrão) ou `human-generated` (Pergunta 9). No Upgrade (C), entra com `ai-generated` |

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

### 4. Perguntar Sobre Variáveis Opcionais

```
🔧 Deseja configurar variáveis opcionais?
A: Sim, configurar todas
B: Sim, escolher quais configurar
C: Não, usar valores padrão (tudo vazio / freelance)
```

Se **A** ou **B**, perguntar sobre cada variável opcional conforme seleção — **uma por vez**.

**Board de cards e controle de versão (pergunte cedo):** o Jarvis fala com eles **só pela CLI oficial** do vendor, com o login dela; sem a CLI, as ações viram `.md`. Vendors, comandos e variáveis vêm de `bin/lib/integrations/vendors.json` (o catálogo). Faça um eixo de cada vez, com uma pergunta por vez.

1. **Vendor do board (`TASK_MANAGER`):**
   ```
   Usa algum board de cards?
   1. jira (Jira Cloud, *.atlassian.net)
   2. github (GitHub Issues)
   3. gitlab (GitLab Issues)
   4. Nenhum (freelance) → TASK_MANAGER= vazio
   (Outro, como Linear ou Asana → não suportado: o eixo fica em freelance)
   ```
   - **Nenhum** ou **Outro**: avise "{vendor} ainda não é suportado; o eixo fica em modo freelance (as ações viram `.md`)" quando for o caso, deixe `TASK_MANAGER` vazio, pule a descoberta e as variáveis deste eixo e siga para o próximo. Workflows vão pedir o `TASK_MANAGER_KEY` na hora da tarefa.
   - **jira**: pergunte se é **Jira Cloud** ou **Jira Data Center/Server**. Data Center/Server não tem CLI oficial: avise, grave `TASK_MANAGER=jira` e `TASK_MANAGER_ACCESS=manual` (as ações viram `.md` com o link do card) e siga para as variáveis.
2. **Descoberta da CLI** (só leitura; nunca instale nem faça login pela pessoa): rode o `bin` do vendor com `--version` e o `auth_status` do catálogo (`gh auth status`, `glab auth status`, `acli jira auth status`). Em github e gitlab, confira o login **no host** do `TASK_MANAGER_URL_BASE` (board) ou do `origin` (git), com `auth_status_host` (`--hostname {host}`): um login no github.com não vale para um GitHub Enterprise ou GitLab próprio. Mostre o resultado em linguagem simples:
   - instalada e logada (exit 0) → "`gh`: instalada, logada" → proponha `cli`;
   - instalada, login inválido (exit ≠ 0, ex.: `glab` com 401) → mostre o `login_cmd` e o `login_url` do catálogo;
   - não instalada → mostre o `install_url`.
   Nos dois últimos, pergunte com `AskUserQuestion`: **Verificar de novo** (depois que a pessoa instalar ou logar) | **Seguir com `manual`**. Com a confirmação, defina `TASK_MANAGER_ACCESS=cli` ou `manual`.
3. **Variáveis do vendor:** pergunte só as que o catálogo marca para aquele vendor (`variables` com `required_for`), uma por vez. Antes de cada uma, explique com os campos do catálogo: o que é (`what`), para que o Jarvis a usa, onde achar o valor (`where`), um exemplo (`example`) e se é obrigatória. Se a pessoa não souber, repita onde achar e mostre o link da doc oficial (`doc_url`; quando é um por vendor, o do vendor escolhido). Nunca preencha o valor por conta própria.
   - Hoje: `TASK_MANAGER_URL_BASE` (obrigatória para github e gitlab, que dão o repositório dos cards; opcional para jira, só para o link do card). Obrigatória sem valor → avise a consequência e defina `TASK_MANAGER_ACCESS=manual`.
   - Nenhuma variável guarda token.
4. **Vendor do git (`VERSION_CONTROL`):** `github`, `gitlab` ou vazio (Bitbucket/outro → não suportado, vazio). Faça a mesma descoberta do item 2 e defina `VERSION_CONTROL_ACCESS`. Não há variável de repositório: o repo e o host vêm do `git remote get-url origin`.
5. **Gravação única:** guarde as respostas dos dois eixos e grave tudo no Passo 5, depois do "sim" no bloco final. Se o init for interrompido antes, nada é gravado.
6. **Perfil de empresa (`COMPANY_PROFILE`):** o overlay é a camada da empresa por cima do core (`$IDE/overlays/{perfil}/`), só com o que o `/jarvis-fork` substituiu; todo workspace tem um, e o default é `stark-industries` (o overlay padrão do Jarvis). Pergunte com `AskUserQuestion`: **Manter o default `stark-industries`** (primeira opção) | **Nome da empresa** (texto livre, em kebab-case: letras minúsculas, números e hífen). Nome fora do padrão ou igual a uma pasta do core (`skills`, `rules`, `workflows`, `commands`, `agents`, `rules-on-demand`, `templates`, `scripts`, `overlays`) → mostre o motivo e pergunte de novo. A chave **nunca** fica vazia. A pasta vazia do perfil é criada pelo `jarvis init` e pelo Passo 8 (única escrita permitida em `$IDE/overlays/`); nenhum arquivo é gravado nela aqui.

**Central docs:** não é perguntado aqui. Ele é ligado por padrão e configurado no **Passo 5.2**, que roda sempre.

#### Variáveis Opcionais (alinhar ao `templates/ENV-template.md`)

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `COMPANY_PROFILE` | `stark-industries` | Perfil de empresa: nome do overlay em `$IDE/overlays/{valor}/` (default = overlay padrão do Jarvis; nunca vazio) |
| `TASK_MANAGER` | *(vazio = freelance)* | `jira`, `github`, `gitlab` |
| `TASK_MANAGER_ACCESS` | *(vazio)* | `cli` ou `manual` (definido pela descoberta da CLI) |
| `TASK_MANAGER_URL_BASE` | *(vazio)* | GitHub/GitLab: repositório dos cards (obrigatório); Jira: o site, só para o link |
| `VERSION_CONTROL` | *(vazio)* | `github`, `gitlab` |
| `VERSION_CONTROL_ACCESS` | *(vazio)* | `cli` ou `manual` |
| `MESSAGE_COMUNICATOR` | *(vazio)* | `slack`, `discord`, `teams` |
| `MESSAGE_COMUNICATOR_BOT_TOKEN` / `_SIGNING_SECRET` / `_APP_TOKEN` | *(vazio)* | Tokens do chat |
| `ALERTS_CHANNEL` | *(vazio)* | Canal de alertas |
| `OBJECT_STORAGE` | *(vazio)* | `aws_s3`, `gcs`, `azure_blob` |
| `TOKEN_OBJECT_STORAGE` | *(vazio)* | Token storage |
| `TEST_FOLDER` | *(vazio)* | Pasta de testes |
| `JARVIS_PROJECT` | `https://github.com/phelipperibeiro/jarvis-framework` | URL completa do repo do framework (`/jarvis-report-issue`); trocar só para um fork |
| `CENTRAL_DOCS_STORAGE` / `_LOCATION` | `filesystem` / pasta padrão do modo de trabalho | Central docs (o que foi implementado), configurado no Passo 5.2; vazio = desligado |
| `JARVIS_DOCS` / `ENG_DOCS` | `$DOCS_FOLDER/jarvis` / `$JARVIS_DOCS/engineering` | Documentos de trabalho (não perguntar; `$JARVIS_DOCS/` no `.gitignore` só se a raiz tiver `.git`) |
| `DISCOVERIES_FOLDER_NAME` / `DISCOVERIES_DOCS` | `discoveries` / `$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME` | Discoveries, fora de `product/` (não perguntar) |
| `CENTRAL_DOCS_REF` / `_TARGET_BRANCH` / `_REVIEWERS` | `main` / `main` / *(vazio)* | Só quando a pasta do Central docs tem `.git` |
| `SESSIONS_DIR` | `.jarvis/sessions` | Não perguntar — gravar o padrão. A pessoa pode trocar depois no `ENV.md`: o `jarvis init` cria as pastas e o `.gitignore` a partir da chave |
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

# 5. Garantir chaves de sistema do template:
#    SESSIONS_DIR=.jarvis/sessions
#    ENABLE_CDD=true
#    JARVIS_PROJECT=https://github.com/phelipperibeiro/jarvis-framework  (se usuário não sobrescrever)
#    NÃO incluir: TOKEN_VERSION_CONTROL, PROJECT_NAME, EVENT_BUS*, metrics*

# 6. Criar pastas de sessão no workspace (pasta que contém $IDE/):
mkdir -p "$SESSIONS_DIR/eng" "$SESSIONS_DIR/prod" "$SESSIONS_DIR/qa"   # SESSIONS_DIR expandido (padrão .jarvis/sessions)

# 7. Documentos de trabalho em $JARVIS_DOCS — nos DOIS modos de trabalho:
#    JARVIS_DOCS=$DOCS_FOLDER/jarvis, PROD_DOCS=$JARVIS_DOCS/product, ENG_DOCS=$JARVIS_DOCS/engineering
#    (valores do template). Uma docs/ já existente não é tocada.

# 8. Git — SÓ se a raiz do workspace for um repositório (tem .git: modo projeto).
#    Raiz sem .git (modo workspace, ou pasta sem nenhum repositório) não é versionada:
#    NÃO crie nem altere o .gitignore nem o .git/info/exclude.
#    Quem grava é o CLI (`jarvis init` e `jarvis init --upgrade`), não este texto, e não há lista para repetir aqui:
#      - .git/info/exclude (local, fora do PR): AGENTS.md, CLAUDE.md e CDD-MIND-MAP.md
#      - .gitignore: .jarvis/ (e o $SESSIONS_DIR/ relativo fora dela), $JARVIS_DOCS/ e a pasta da IDE
#    Arquivo gerado já versionado (AGENTS.md/CLAUDE.md) só vira aviso; sair do git é decisão do Upgrade.
```

### 5.2 Central docs (sempre)

O Central docs é **ligado por padrão**: é onde fica o registro do que **foi implementado**, gerado pelo `/eng.spec-consolidate` depois de cada PR. Explique em uma frase ao usuário:

```
📚 Central docs: o registro do que foi implementado (um documento completo por funcionalidade
e um por entrega), consultado pela IA e por outros squads. Os rascunhos (PRD, FRD, ARD, RFC, SPEC)
ficam em $JARVIS_DOCS e não vão para lá.
```

Pergunte com `AskUserQuestion`:
- **"Onde fica o Central docs?"**
  - A) Pasta local (padrão)
  - B) Repositório de documentação (git)
  - C) Desligar

**A ou B:**
- `CENTRAL_DOCS_STORAGE=filesystem`.
- `CENTRAL_DOCS_LOCATION=$JARVIS_DOCS/central-docs` (padrão do template; hoje `docs/jarvis/central-docs`) nos dois modos de trabalho, junto dos documentos de trabalho (a pessoa pode digitar outro caminho). Com `.git` na raiz, `$JARVIS_DOCS/` no `.gitignore` já cobre a pasta; sem `.git` na raiz (como no modo workspace) ela não é versionada, e nenhum `.gitignore` é necessário.
- **A:** `mkdir -p {LOCATION}` e criar `{LOCATION}/AGENTS.md` mínimo, explicando:
  - a estrutura `{SQUAD}/product/{produto}/feature-*.md` e `{SQUAD}/engineering/{produto}/delivery-*.md`;
  - que o `{SQUAD}/index.md` é gerado pelo `jarvis docs publish`.
- **B:** pedir a URL e rodar `git clone {URL} {LOCATION}`. Se `{LOCATION}` já existir com `.git`, só usar. Perguntar `CENTRAL_DOCS_TARGET_BRANCH` (padrão `main`).

**C:** `CENTRAL_DOCS_STORAGE=` vazio. O `/eng.spec-consolidate` fica indisponível até ligar.

Nunca coloque o Central docs no versionamento de um repositório de código.

### 5.3 Carga inicial do Central docs (se houver documentos)

Com o Central docs ligado:
1. Procure PRD, FRD, ARD, RFC e SPEC em `$PROD_DOCS`, `$ENG_DOCS/{ARD,RFC,SPEC}` (e nos caminhos antigos, se não foram movidos).
2. Se encontrar algum, mostre a contagem e pergunte com `AskUserQuestion` (**Sim / Não**): **"Gerar o Central docs agora a partir desses documentos?"**
3. Com **Sim**, chame `/eng.spec-consolidate --inicial`. Ele agrupa os documentos por funcionalidade, gera um `feature-*.md` por grupo (sem registro de entrega, porque não há PR) e só publica depois da revisão e do seu Sim.
4. Com **Não**, siga. Dá para rodar o `/eng.spec-consolidate --inicial` depois.

**⚠️ REGRA CRÍTICA - FLOWS_FOLDER:**

```javascript
if (IDE === "claude") {
  FLOWS_FOLDER = "commands"
} else {
  FLOWS_FOLDER = "workflows"
}
```

O arquivo `$IDE/ENV.md` deve seguir a **estrutura e ordem** de `templates/ENV-template.md` (não um dump reordenado), com cada assunto na moldura de `# ====` do template; o passo 9.5 confere no fim. Blocos mínimos esperados após o init (os títulos são os do template; os comentários de cada bloco foram omitidos):

```markdown
# =============================================================================
# Workspace e identidade
# =============================================================================
WORKSPACE=
WORKSPACE_REPOS=
WORKSPACE_MODE={workspace|project}
USER={resolvido}
MAX_AI_EXECUTION_PERCENTAGE={60-100}
ENABLE_CDD=true

# =============================================================================
# Organização (obrigatório — opções vêm do taxonomy.md)
# =============================================================================
SQUAD={valor}
HUB={valor}
AREA={valor}
POSITION={valor}

# =============================================================================
# IDE e pastas
# =============================================================================
IDE={valor}
DOCS_FOLDER=docs
FLOWS_FOLDER={commands|workflows}
TEMPLATES_FOLDER=templates
RULES_FOLDER=.$IDE/rules
SESSIONS_DIR=.jarvis/sessions
JARVIS_DOCS=$DOCS_FOLDER/jarvis
ENG_DOCS=$JARVIS_DOCS/engineering
PROD_FOLDER_NAME=product
PROD_RULES=...
PROD_FLOWS=...
PROD_TEMPLATES=...
PROD_DOCS=...
DISCOVERIES_FOLDER_NAME=discoveries
DISCOVERIES_DOCS=...
PROD_MODE={product-led|developer-guided}
ARTIFACT_STYLE={ai-generated|human-generated}

# =============================================================================
# Task manager (opcional)
# =============================================================================
TASK_MANAGER=
TASK_MANAGER_ACCESS=
TASK_MANAGER_URL_BASE=

# =============================================================================
# Controle de versão (opcional)
# =============================================================================
VERSION_CONTROL=
VERSION_CONTROL_ACCESS=
# ... restante do template, cada assunto na sua moldura (MESSAGE_COMUNICATOR*, OBJECT_STORAGE, JARVIS_PROJECT, CENTRAL_DOCS_*, etc.)
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

JARVIS_DOCS=$DOCS_FOLDER/jarvis
ENG_DOCS=$JARVIS_DOCS/engineering
PROD_FOLDER_NAME=product
PROD_RULES=$RULES_FOLDER/$PROD_FOLDER_NAME
PROD_FLOWS=.$IDE/$FLOWS_FOLDER
PROD_TEMPLATES=.$IDE/$TEMPLATES_FOLDER/$PROD_FOLDER_NAME
PROD_DOCS=$JARVIS_DOCS/$PROD_FOLDER_NAME
DISCOVERIES_FOLDER_NAME=discoveries
DISCOVERIES_DOCS=$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME
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
| TestSprite | Se o usuário quiser | **Não** |
| Redis / Sentry / event bus | Removidos do init — não checar | — |

**Context7 é obrigatório.** O `jarvis init` (instalação e `--upgrade`) já grava o Context7 no arquivo de MCP **que a IDE lê, no formato dela** (tabela "Caminhos de Configuração" em `assets/mcp-configs.md`). Antes de validar:
1. Confira o arquivo de MCP da IDE ativa. Se faltar o `context7`, acrescente-o no formato da tabela, sem tocar nos outros servidores; com JSON inválido, não altere e avise. Na Windsurf, que só tem config global, mostre o trecho e o caminho para a pessoa incluir.
2. Valide o Context7 (abaixo). O servidor só fica ativo numa sessão nova da IDE: se o arquivo está certo e o Context7 ainda não responde nesta sessão, **não bloqueie**. Registre como pendente, siga o init e, no fim, mostre o que falta (a "Para ativar" da tabela: reiniciar, aprovar ou confiar no projeto).
3. Só bloqueie se o arquivo não puder ser gravado nem corrigido.

Não inventar docs de libs no lugar.

**MCPs opcionais nunca bloqueiam.** Board e git não passam por MCP: a CLI de cada um é descoberta no Passo 4 (e conferida de novo no Passo 12), sem bloquear. Freelance / `TASK_MANAGER` vazio é válido.

**Regras anti-travamento (MCPs opcionais e CLIs):**
1. **Uma tentativa** por MCP opcional ou CLI. Timeout curto. Sem retry em loop.
2. Se o MCP ou a CLI não existir, não responder ou pedir login → **avisar e seguir**. Nunca esperar a pessoa configurar o board no meio do init.
3. Se `TASK_MANAGER` estiver vazio → **pular** a checagem do board.
4. Nunca diga "não posso continuar sem o board".

**Verificação**:
```javascript
// Context7 (OBRIGATÓRIO) — sem resposta com o arquivo de MCP certo: pendente de ativação, seguir.
// Parar só se o arquivo de MCP estiver ausente ou inválido e não puder ser corrigido.
mcp1_resolve-library-id({ libraryName: "react", query: "test" })

```

Se o Context7 não responder, mas o arquivo de MCP estiver certo (pendente de ativação):
```
⏳ Context7 configurado em {arquivo}, mas ainda não ativo nesta sessão.
{Para ativar, da tabela da IDE}. Continuando o init…
```

Se o arquivo de MCP não puder ser gravado ou corrigido (ex.: JSON inválido):
```
🚫 Context7 não configurado: {arquivo} — {motivo}.
Corrija o arquivo (formato em assets/mcp-configs.md), {Para ativar} e rode /jarvis-init upgrade.
```


> **Configurações detalhadas**: Ver `assets/mcp-configs.md`

### 6.1 — Perfil de Plugins Claude Code (apenas se IDE=claude, opcional)

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
5. Incluir (ou acrescentar, se o `AGENTS.md` já existir e não citar) a linha que identifica o mapa de tecnologias do projeto:
   `> Mapa de tecnologias do projeto: [CDD-MIND-MAP.md](CDD-MIND-MAP.md) (tecnologias e papel de cada repositório, ou da raiz no modo projeto; lido pelo /warm-up).`
6. No modo projeto (raiz com `.git`), o `AGENTS.md` (e o `CLAUDE.md`, que é cópia dele) já está no `.git/info/exclude`, gravado pelo CLI antes de o arquivo existir: **não escreva no `.gitignore`**. Avise a pessoa: "para versionar de propósito, remova a linha do `.git/info/exclude`". Se o CLI avisou que o arquivo já está versionado, **não o tire do índice aqui**: a decisão é do Upgrade (`assets/upgrade.md`).

### 8. Profile-Aware Rules Sync

**Executar após gravar o ENV.md** (criar, atualizar B, upgrade C e no item 4 do 9.5).
Na pasta do workspace, rode `jarvis rules sync --ide {ide}` e mostre à pessoa o resumo que ele imprime. O comando filtra `$IDE/rules/` e `$IDE/rules-on-demand/` pelo perfil do ENV.md (HUB, POSITION, AREA, SQUAD, ARTIFACT_STYLE; `rtk-rules.md` só com RTK_ENABLED=true), aplica o overlay de `COMPANY_PROFILE` (cria a pasta vazia do perfil se faltar) e não toca em arquivo que não seja do core nem do overlay. Não filtre à mão. O `jarvis init --upgrade` e a reinstalação (`--force` ou a opção 2 do menu) já rodam esse filtro no fim, quando o ENV.md tem os 4 eixos (ali, a `rtk-rules.md` pede também o `rtk` no PATH); o Passo 8 continua valendo na criação do ENV.md e sempre que o perfil muda.
Sem o `jarvis` no PATH, ou se o comando sair com erro (ENV incompleto, versão do lock diferente), siga `assets/rules-sync-manual.md`.

---

### 9. Adicionar as stacks (opcional)

Oferecido sempre que o `ENV.md` fica pronto: criação, atualização, **Upgrade (C)** e o caso "já atualizado". **Não** é oferecido ao cancelar (D). A pessoa pode **pular**; ao pular, as listas ficam como estão e o projeto usa só a skill base.

A **detecção de stack por código e a criação de skill novo** (sub-passos 9.4-9.6 do `passo-adicionar-stacks.md`, que não são o passo 9.5 de validação do ENV.md) tratam **somente backend e frontend** — são as únicas áreas com universo de stack aberto (qualquer linguagem/framework novo). **Listar o que já está instalado e registrar direto** (sub-passo 9.3 do mesmo arquivo) vale para as **6 áreas** com especialização (backend, frontend, qa, data, automation, platform): essas 4 últimas têm um conjunto fixo de skills pré-construídos, sem detecção por código nem criação — só listar e registrar (ver `architecture.md` da #63, Decisão 3.5). O passo:

1. Confere que as 6 variáveis de especialização existem (acrescenta vazias as que faltarem)
2. Lista as especializações instaladas de todas as 6 áreas, registradas ou não, e deixa registrar qualquer uma direto
3. **Lê** o workspace (a análise **só lê**: não altera arquivos do projeto nem as listas), identifica as stacks de backend e de frontend, inclusive de vários projetos, e **mostra o que encontrou antes de sugerir** (só essas 2 áreas)
4. Para cada stack de backend/frontend, sugere **registrar o skill que já existe** (mesmo `area` e `stack`) ou **criar um novo** com `/jarvis-create-specialization {área} {stack}`; a pessoa escolhe, e o que não aceita não muda
5. Mostra um resumo das 6 listas e do que foi registrado ou criado
6. **Monta o `CDD-MIND-MAP.md`** (o mapa de tecnologias, lido pelo `/warm-up`: do workspace ou, no modo projeto, do repositório): com a mesma leitura do sub-passo 3, agora para **todas as áreas**, preenche uma linha por repositório (papel, linguagem, framework, área, até 5 ferramentas principais) pelo `$IDE/templates/cdd-mind-map-template.md`, mostra a tabela e pede a validação com `AskUserQuestion` (**Confirmar** | **Corrigir** | **Incluir informação**). Grava na raiz do workspace (com `.git` na raiz, já no `.git/info/exclude`, Passo 5). Se o mapa já existe, só acrescenta os repositórios que faltam. Pular é permitido: o primeiro `/warm-up` cria o mapa.

O tempo de ~10 minutos é referência, não limite. Nunca leia `.env*`, chaves ou credenciais.

> **Fluxo completo**: Ver `assets/passo-adicionar-stacks.md`. **Tabela de detecção**: `assets/sinais-de-stack.md`.

---

### 9.5 Validar o ENV.md (sempre, no fim)

Roda no fim de todo caminho que grava o `ENV.md`: criação (opção A ou ENV.md novo), atualização de variáveis (B) e Upgrade (C, inclusive "já atualizado"), depois do passo 9. Não roda ao cancelar (D). Objetivo: o arquivo fica **100% correto** e **separado por assunto**, na estrutura e na ordem de `templates/ENV-template.md`, com cada assunto na moldura de `# ====`:

```
# =============================================================================
# Workspace e identidade
# =============================================================================
```

**Nunca mostre valor de variável**: nas perguntas e na saída vão só o nome da chave e se a linha tem algo depois do `=`.

**1. Conferir o arquivo inteiro contra o template.** Cada item que falhar é um problema:

| Verificação | Exemplo | Correção sugerida (primeira opção, "(Recomendada)") |
|---|---|---|
| Chave do template ausente | falta `WORKSPACE_MODE` | Acrescentar no assunto dela, com o padrão do template. |
| Chave fora do template (saiu dele ou é do projeto) | `QA_SIGNOFF_BRANCHES`, `MINHA_VAR` | Mover para o bloco final "Variáveis fora do template", com `# (descontinuada)` numa linha própria logo acima da chave e o valor intacto |
| Chave duplicada | `HUB=` duas vezes | Manter a preenchida (ou a última) |
| Valor fora das opções | `HUB=BACKEN`, `MAX_AI_EXECUTION_PERCENTAGE=40`, `TASK_MANAGER_ACCESS=api` | Perguntar o valor, com as opções do template ou do `taxonomy.md` (as mesmas perguntas do passo 3) |
| `COMPANY_PROFILE` vazio, fora do padrão ou igual a uma pasta do core | `COMPANY_PROFILE=`, `COMPANY_PROFILE=Acme Corp`, `COMPANY_PROFILE=rules` | A mesma pergunta do item 6 do passo 4 (default `stark-industries` primeiro). Vazio não é válido: a chave sempre tem um perfil |
| Obrigatória vazia | `SQUAD=` | A mesma pergunta do passo 3 |
| Lista de exemplo não escolhida | `TASK_MANAGER=[jira, github, gitlab]` | Escolher uma ou esvaziar |
| Fora da ordem ou do assunto | blocos `# --- Upgrade ... ---` no fim; uma `*_SPECIALIZATIONS` longe das irmãs | Regravar na ordem do template |
| Comentários ou separadores diferentes dos do template | comentário antigo; `# --- Assunto ---` | Trocar pelos do template (a pergunta avisa que comentários próprios se perdem) |

Não pergunte de novo o que as exceções 8 a 8.3 do Upgrade já resolveram nesta execução.

**2. Perguntar cada problema** com `AskUserQuestion`: **uma pergunta por problema**, em chamadas de até 4 abas, agrupadas por tipo de verificação. Cada pergunta tem a correção sugerida como primeira opção, marcada "(Recomendada)", e uma opção que mantém o arquivo como está (ex.: "Manter como está"). Nada é corrigido sem resposta. Sem problema nenhum, não pergunte: avise `✅ ENV.md conferido: nada a corrigir.`

**3. Regravar (só o que foi aceito).**
- **Reorganização aceita:** use a estrutura do template (ordem, comentários e molduras), mas só com as chaves que o arquivo já tem mais as acrescentadas por resposta: chave que a pessoa recusou acrescentar não entra. Ponha o valor atual de cada chave no lugar dela, cada uma no seu assunto e junto das irmãs, e desfaça os blocos datados. As chaves fora do template vão para o último bloco, "Variáveis fora do template", cada uma com `# (descontinuada)` logo acima. **Nenhuma chave é apagada**, salvo as que a pessoa mandou remover numa resposta. O comentário fica numa linha própria: na mesma linha da chave, o CLI o leria como parte do valor.
- **Reorganização recusada:** grave só as correções de conteúdo aceitas, no lugar em que cada chave está, sem mover o resto.
- **Conferência antes de gravar:** o **conjunto de chaves** depois é o de antes, mais as acrescentadas e menos as removidas por resposta; e o mapa chave → valor das chaves mantidas é igual (só mudam as corrigidas por resposta). Se não for, não grave e avise: `⚠️ A regravação mudaria chaves ou valores que não foram respondidos: nada gravado.`

**4. Rules do perfil.** Se uma correção mudou `HUB`, `POSITION`, `AREA`, `SQUAD`, `ARTIFACT_STYLE` ou `RTK_ENABLED`, rode o **passo 8** de novo: ele já rodou com os valores antigos, e as rules em `$IDE/rules/` seriam de outro perfil.

**5. Resumo.** Liste o que foi corrigido e o que ficou pendente (respostas "Manter como está"), só com nomes de chave, e se o passo 8 rodou de novo.

---

### 10. Confirmar Criação

```
✅ Arquivo ENV.md criado com sucesso!

📁 Localização: $IDE/ENV.md

📋 Resumo das configurações:
- Workspace: {WORKSPACE}
- Repos: {WORKSPACE_REPOS ou (todas as pastas com .git/)}
- Sessões: {SESSIONS_DIR}/eng|prod|qa
- Task manager: {TASK_MANAGER ou "vazio (freelance)"} — acesso: {TASK_MANAGER_ACCESS} ({bin}: logada | sem login | ausente)
- Controle de versão: {VERSION_CONTROL ou vazio} — acesso: {VERSION_CONTROL_ACCESS} ({bin}: logada | sem login | ausente)
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
2. No modo projeto (raiz com `.git`), o `jarvis init` já põe a pasta da IDE (onde fica o ENV.md) no `.gitignore`; se ela já estava versionada, ele só avisa e não a remove
3. No modo projeto, o `jarvis init` mantém `.jarvis/` no `.gitignore` e `AGENTS.md`, `CLAUDE.md` e `CDD-MIND-MAP.md` no `.git/info/exclude` (local). Sem `.git` (modo workspace), a raiz não é versionada e nada é gravado
4. Nenhum token no ENV: board e git usam o login da CLI (`gh auth login`, `glab auth login`, `acli jira auth login`)
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

Confirmar acessos relevantes (não bloqueantes): Git; a CLI do board e do git (`auth status` do catálogo) se `TASK_MANAGER`/`VERSION_CONTROL` estiverem definidos; chat se `MESSAGE_COMUNICATOR` estiver definido; ambiente de Dev.

### 13. Entregar Checklist

Apresentar checklist de onboarding por período (Dia 1, Semana 1, Mês 1).

> **Checklists detalhados**: Ver `assets/onboarding-checklist.md`

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| Passo 5.3 — Carga inicial do Central docs | `/eng.spec-consolidate --inicial` | Se o Central docs estiver ligado, houver PRD/FRD/ARD/RFC/SPEC e o usuário responder Sim (também no Upgrade, depois da migração) |
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
- ❌ Travar o init esperando a CLI do board / Redis / Sentry
- ❌ Instalar a CLI ou fazer o login pela pessoa; pedir, ler ou gravar token do board ou do git
- ❌ Prosseguir sem o Context7 no arquivo de MCP da IDE (pendente de ativação é aceito; arquivo ausente ou inválido, não)
- ❌ Omitir hub DATA da lista de HUB
- ❌ Criar AGENTS.md sem detectar stack
- ❌ Apresentar checkin/checkout/daily como parte do onboarding

### ✅ SEMPRE FAÇA

- ✅ **SEMPRE usar templates/ENV-template.md como base**
- ✅ **SEMPRE copiar TODO o conteúdo do template**
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
- ✅ Criar `$SESSIONS_DIR/{eng,prod,qa}` e, só com `.git` na raiz, garantir `.jarvis/` (e o `$SESSIONS_DIR/` relativo fora de `.jarvis/`) e a pasta da IDE no `.gitignore`, e `AGENTS.md`, `CLAUDE.md` e `CDD-MIND-MAP.md` no `.git/info/exclude`
- ✅ Explicar freelance se `TASK_MANAGER` vazio (`TASK_MANAGER_KEY` próprio)
- ✅ Garantir o Context7 no arquivo de MCP que a IDE lê, no formato dela, e validá-lo (obrigatório; pendente de ativação não bloqueia)
- ✅ Descobrir a CLI do board e do git em best-effort (1 tentativa, nunca bloquear)
- ✅ Pular a descoberta do board se `TASK_MANAGER` estiver vazio
- ✅ Criar AGENTS.md na raiz
- ✅ Apresentar checklist ao final

---

## Tratamento de Erros

| Erro | Ação |
|------|------|
| **taxonomy.md não encontrado** | Usar DEFAULT_OPTIONS (`assets/validacoes.md`) (CORE + hubs com DATA) e avisar |
| **taxonomy.md inválido/corrompido** | Usar DEFAULT_OPTIONS (`assets/validacoes.md`) e alertar |
| **AskUserQuestion não disponível** | Usar texto numerado para todas as opções fixas — não bloquear o init |
| **Múltiplas perguntas feitas de uma vez** | ERRO CRÍTICO - NUNCA faça isso. Pergunte uma por vez e aguarde resposta |
| **WORKSPACE vazio** | Usar o nome da pasta que contém `$IDE/`; confirmar com o usuário |
| **MAX_AI_EXECUTION_PERCENTAGE fora do range** | Ajustar automaticamente: <60 → 60, >100 → 100. Avisar usuário do ajuste. |
| **USER inválido** | Pedir outro identificador (email ou nome). Sem validação de `@{DOMAIN}`. |
| Template ENV não encontrado | Bloquear e pedir o pacote/framework com `templates/ENV-template.md` |
| Context7 não responde | Arquivo de MCP certo: registrar como pendente, seguir e orientar a ativação no fim. Arquivo ausente/inválido e impossível de corrigir: **parar** e orientar `assets/mcp-configs.md` |
| CLI do board/git ausente ou sem login | Mostrar o link de instalação/login, oferecer `manual` e **continuar** (1 tentativa) |
| Stack não detectada | Perguntar ao usuário |
| IDE não detectada | Perguntar ao usuário qual IDE usa |

---

## Mensagem de Conclusão

```
✅ Inicialização concluída!

📁 Arquivos criados:
- ENV.md: $IDE/ENV.md
- AGENTS.md: ./AGENTS.md
- Sessões: $SESSIONS_DIR/{eng,prod,qa}/

🔧 Configuração:
- IDE: {ide}
- Workspace: {WORKSPACE}
- Repos: {WORKSPACE_REPOS ou (todas as pastas com .git/)}
- Task manager: {TASK_MANAGER ou freelance} — CLI: {logada | sem login | ausente | pulado}
- Controle de versão: {VERSION_CONTROL ou vazio} — CLI: {logada | sem login | ausente | pulado}
- Squad: {SQUAD}
- Especializações: {registradas/criadas, ou "só skill base"}

✅ MCPs:
- Context7: {OK | pendente de ativação: {Para ativar}} (obrigatório)
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
- [ ] **Perguntou o `PROD_MODE`** (Product-Led ou Developer-Guided), sem opção sugerida, qualquer que seja a área ou o cargo
- [ ] **Perguntou o `ARTIFACT_STYLE`** (AI-Generated primeiro ou Human-Generated)
- [ ] **Mostrou TODAS as opções disponíveis** (HUB inclui DATA; nunca omitiu)
- [ ] **Incluiu descrição útil em cada opção** (seja AskUserQuestion ou texto)
- [ ] **Validou respostas em texto contra lista de opções válidas**
- [ ] **Usou multiSelect: false no AskUserQuestion** (apenas uma opção por variável)
- [ ] Detectou IDE corretamente
- [ ] Verificou se ENV.md já existe
- [ ] Se ENV.md existe: ofereceu opção de Upgrade (C) além de Sobrescrever/Atualizar/Cancelar
- [ ] Se Upgrade: calculou diff template vs ENV.md e acrescentou apenas as variáveis faltantes, no assunto de cada uma (sem bloco datado)
- [ ] **Validou o ENV.md inteiro no passo 9.5**: uma pergunta por problema, regravação na ordem do template com as molduras de `# ====`, chaves fora do template no fim com `# (descontinuada)`, nenhum valor exibido nem trocado sem resposta
- [ ] Coletou todas as variáveis obrigatórias
- [ ] USER gravado no ENV.md a partir da identidade local
- [ ] Validou MAX_AI_EXECUTION_PERCENTAGE (60-100) - para campos livres
- [ ] Confirmou WORKSPACE (nome da pasta do `$IDE/` ou override)
- [ ] ENABLE_CDD=true e SESSIONS_DIR preenchido (padrão .jarvis/sessions)
- [ ] Criou `$SESSIONS_DIR/{eng,prod,qa}` e, só com `.git` na raiz, `.jarvis/` e a pasta da IDE no `.gitignore` e as três entradas locais no `.git/info/exclude` (raiz sem `.git`: nenhum dos dois)
- [ ] TASK_MANAGER: valor ou vazio (freelance) explicado
- [ ] Não gravou TOKEN_VERSION_CONTROL / PROJECT_NAME / EVENT_BUS*
- [ ] Perguntou sobre variáveis opcionais
- [ ] **Ajustou FLOWS_FOLDER baseado no IDE (commands se claude, workflows se outros)**
- [ ] Criou arquivo ENV.md usando template completo
- [ ] **Se IDE ≠ claude: moveu todos os workflows de subpastas para a raiz de `$IDE/workflows/`**
- [ ] Garantiu o Context7 no arquivo de MCP da IDE e o validou (ou o registrou como pendente de ativação)
- [ ] Se TASK_MANAGER/VERSION_CONTROL definidos: descobriu a CLI (instalada e logada) e gravou `*_ACCESS` (`cli` ou `manual`) após confirmação
- [ ] Se TASK_MANAGER vazio: pulou a descoberta do board
- [ ] Não pediu nem gravou token do board ou do git
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
- **Detecção de IDE**: A variável `$IDE` é detectada automaticamente (`.windsurf/`, `.claude/`, `.cursor/`, `.codex/`, `.opencode/`, `.agents/`)
- **Nunca inventar dados**: Se informação não estiver disponível, perguntar ao usuário
- **Nunca expor credenciais**: Tokens e senhas nunca devem ser expostos no chat
- **Segurança primeiro**: Em caso de dúvida, priorizar segurança e integridade de dados
- **Ações destrutivas**: Nunca executar sem confirmação explícita do usuário

> **Regras completas**: Ver `$IDE/rules/engineering/eng-rules.md`
