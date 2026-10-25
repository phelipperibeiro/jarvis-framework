---
name: jarvis-init
description: Inicializa o framework JARVIS e guia novos membros no processo de onboarding. Use quando precisar configurar o ambiente, criar ENV.md, validar MCPs ou orientar um novo desenvolvedor.
argument-hint: "[upgrade | nome-do-membro-opcional]"
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
4. **`TASK_MANAGER` vazio = freelance** — sem board. Workflows pedem `TASK_MANAGER_KEY` (controle próprio) e as ações viram `.md`.
5. **Context7 obrigatório**; demais MCPs (Redis, Sentry, TestSprite) **não bloqueiam**. Board e git não usam MCP: usam a CLI oficial (contrato 7).
6. **Sem event bus / metrics / checkin-checkout-daily** — não provisionar Redis runtime nem pedir métricas.
7. **Board e git pela CLI oficial, sem token** — `gh` (GitHub), `glab` (GitLab), `acli` (Jira Cloud), com o login delas (`gh auth login`, `glab auth login`, `acli jira auth login`). Nenhum token vai no ENV.md (não existem `TOKEN_TASK_MANAGER` nem `TOKEN_VERSION_CONTROL` no template). Catálogo: `bin/lib/integrations/vendors.json`. Linear, Asana e Bitbucket não são suportados (o eixo fica em freelance).
8. **Autonomia** — qualquer `POSITION` (JUNIOR…CTO / PM) pode rodar o card ponta a ponta (`/eng.start` → `/eng.pr`). Sem gate obrigatório de TL/PM no init.
9. **Fonte do ENV** — só `templates/ENV-template.md`. Não inventar variáveis. `JARVIS_PROJECT` default: `https://github.com/phelipperibeiro/jarvis-framework` (sempre a URL completa; trocar só para um fork interno).
10. **IDEs** — windsurf, claude, cursor, codex, opencode, gemini/antigravity, kiro.

## Objetivo

- Configurar ambiente de desenvolvimento
- Validar MCP obrigatório (Context7) e descobrir a CLI do board e do git (instalada e logada; não bloqueante)
- Criar arquivos de configuração (ENV.md, AGENTS.md) e pastas `.jarvis/sessions/{eng,prod,qa}`
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
   C: Upgrade — adicionar variáveis novas do template (não toca nos valores existentes)
   D: Cancelar
   ```

**Se opção C (Upgrade):**

> No terminal, rode antes `jarvis init --upgrade --ide {ide}`: ele atualiza os arquivos do framework, acrescenta as variáveis novas e move os documentos para as pastas novas (itens 1–8, 10 a 12). Aqui ficam o Central docs antigo (item 9), as pendências que ele listar e o passo das stacks.
> **O upgrade só acrescenta chaves novas:** nenhuma chave já existente, preenchida ou não, é alterada, salvo as exceções declaradas no item 9 (`CENTRAL_DOCS_LOCATION` e `TOKEN_TASK_MANAGER`, com confirmação; `JARVIS_PROJECT` vazio, automático).
> Trocou o `ARTIFACT_STYLE` (ou HUB, POSITION, AREA, SQUAD) à mão? O Passo 8 copia ou remove as rules desse perfil.

1. Ler todas as chaves do `templates/ENV-template.md`
2. Ler todas as chaves do `$IDE/ENV.md` existente
3. Ler `HUB` do ENV.md existente
4. Se `HUB≠DATA`: excluir do diff todas as chaves `DATA_*` (exceto `DATA_SPECIALIZATIONS`, que é obrigatória em qualquer HUB) — não propor adicioná-las
5. Calcular diff: chaves no template que **não existem** no ENV.md atual (respeitando exclusão de DATA_* para não-DATA)
6. Se não houver diff:
   ```
   ✅ ENV.md já está atualizado. Nenhuma variável nova encontrada.
   ```
   Oferecer o **passo 9 (adicionar as stacks)**, que a pessoa pode pular, e então encerrar.
7. Se houver diff, exibir prévia:
   ```
   🔍 Variáveis novas encontradas no template:
     + NOVA_VAR_1=
     + NOVA_VAR_2=valor-padrão

   Serão adicionadas ao final do ENV.md sem alterar os valores existentes.
   ```
8. **Exceção — documentos nos caminhos antigos:** procure documentos de trabalho em `$DOCS_FOLDER/product`, `$DOCS_FOLDER/engineering/{ARD,RFC,qa,swagger,openapi,robots,c4}`, `docs/engineering/{robots,swagger,openapi,c4}` e os discoveries em `$PROD_DOCS/discoveries/`.
   - Se houver, liste o que encontrou e pergunte com `AskUserQuestion` (uma pergunta para todos) se move para `docs/jarvis/…` (`$PROD_DOCS`, `$ENG_DOCS/…` e, para os discoveries, `$DISCOVERIES_DOCS`). Use `git mv` quando o arquivo for versionado e `mv` quando não for e, só se a raiz do workspace tiver `.git`, garanta `docs/jarvis/` no `.gitignore`.
   - **Conflito** (arquivo com o mesmo nome no destino): não sobrescreva; liste e pule esse arquivo. A pasta antiga só é removida se ficar vazia.
   - **`related_discovery`:** depois de mover discoveries, nos `.md` de `$PROD_DOCS`, troque todo `related_discovery:` cujo **nome de arquivo** seja o de um discovery movido pelo caminho novo (relativo ao workspace). Isso também conserta valores que já estavam quebrados.
   - **Sem confirmação, não mova nada:** as chaves **novas** recebem o caminho antigo (`DISCOVERIES_DOCS=$PROD_DOCS/discoveries`; `PROD_DOCS`/`ENG_DOCS` só se também forem novas). Chave que já existe não muda: avise que os documentos ficaram no caminho antigo.
   - Depois, ofereça a carga inicial do Central docs (Passo 5.3).
9. **Exceção — Central docs antigo:** se o `ENV.md` tiver `CENTRAL_DOCS_REPO` preenchido e não tiver `CENTRAL_DOCS_STORAGE`, propor a migração (só com confirmação): `CENTRAL_DOCS_STORAGE=filesystem`, `CENTRAL_DOCS_LOCATION=docs/jarvis/central-docs` (Passo 5.2) e `git clone {CENTRAL_DOCS_REPO} {LOCATION}`. Depois, comentar a linha antiga (`# CENTRAL_DOCS_REPO=… (migrado em YYYY-MM-DD)`) e `CENTRAL_DOCS_CACHE_TTL`. Sem confirmação, não mexe e avisa que os comandos de docs vão pedir o Upgrade.
   - **Central docs no padrão antigo do modo workspace:** se `CENTRAL_DOCS_LOCATION` for `./central-docs` (ou `central-docs`) e essa pasta existir, ofereça com `AskUserQuestion` (**Mover** | **Manter**) mover para `docs/jarvis/central-docs`, o padrão atual. Com **Mover**: se o destino já existir, não sobrescreva (avise e mantenha); senão, `mv ./central-docs docs/jarvis/central-docs` e troque o valor de `CENTRAL_DOCS_LOCATION` no `ENV.md`. Esta é a única alteração de uma chave existente no Upgrade e só acontece com a confirmação. Com **Manter**, nada muda.
9.1. **Exceção — `TOKEN_TASK_MANAGER` com valor:** o token não é mais usado (o board passa pela CLI do vendor). Nunca leia, mostre ou copie o valor: confira só se a linha tem algo depois do `=`. Explique e oriente o login da CLI do `TASK_MANAGER` (ex.: `acli jira auth login`). Pergunte com `AskUserQuestion` (**Esvaziar a linha** | **Manter**). Com **Esvaziar**, troque a linha por `TOKEN_TASK_MANAGER=`; com **Manter**, nada muda e avise que o valor fica sem uso no ENV. É a segunda exceção declarada à regra "o upgrade só acrescenta" (a primeira é a `CENTRAL_DOCS_LOCATION`).
9.2. **Exceção — `JARVIS_PROJECT` vazio:** grave `https://github.com/phelipperibeiro/jarvis-framework` sem perguntar e avise ("estava vazio; preenchido com o repositório oficial do Jarvis"). Preenchido com qualquer valor, não muda. O `jarvis init --upgrade` já faz isso no terminal.
9.3. **Eixos sem forma de acesso:** se `TASK_MANAGER` ou `VERSION_CONTROL` estiver preenchido com um vendor do catálogo e o `*_ACCESS` correspondente estiver ausente, vazio ou inválido (fora de `cli`/`manual`; avise o valor errado), faça para aquele eixo o Passo 4 (descoberta da CLI, forma de acesso e variáveis), com a gravação única do fim. Vendor fora do catálogo (Linear, Asana, Bitbucket): avise que não é suportado e que o eixo fica em freelance; não mude a chave.
10. **Exceção — `PROD_MODE`:** se `PROD_MODE` estiver entre as chaves novas, grave pelo `AREA`: `ENGINEERING` → `developer-guided`, `PRODUCT` → `product-led`. Com outra `AREA` (ou vazia), faça a mesma pergunta do Passo 3 (Pergunta 8 — modo de condução) e grave a resposta. `PROD_MODE` que já existe, mesmo vazia, não muda. As demais chaves continuam sem pergunta.
    - **`WORKSPACE_MODE`:** o `jarvis init --upgrade` já grava o modo detectado (raiz sem `.git` e 1+ subpastas com `.git/` = `workspace`; raiz com `.git` = `project`). Se a chave existir vazia, detecte do mesmo jeito e grave; se existir preenchida, não muda.
    - **`.gitignore` numa raiz sem `.git` (ex.: `WORKSPACE_MODE=workspace`):** a raiz não é versionada, então esse arquivo não tem efeito. Não o apague; só avise: `ℹ️ O .gitignore da raiz do workspace não tem efeito (a raiz não é um repositório). Pode removê-lo se quiser.`
11. Appender as novas variáveis ao final do `ENV.md` com comentário de data:
   ```
   # --- Upgrade YYYY-MM-DD ---
   NOVA_VAR_1=
   NOVA_VAR_2=valor-padrão
   ```
12. Confirmar:
   ```
   ✅ ENV.md atualizado! N variável(is) nova(s) adicionada(s).
   ⚠️ Preencha os valores em branco antes de usar os novos recursos.
   ```
13. Oferecer o **passo 9 (adicionar as stacks)**, que a pessoa pode pular, e então encerrar (não continuar para o fluxo de onboarding completo).

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

> O `WORKSPACE_MODE` não decide o `.gitignore`: ele só é criado ou alterado quando a raiz tem `.git` (Passo 5). Uma pasta sem nenhum `.git` é `project` e mesmo assim não recebe `.gitignore`.

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

**Central docs:** não é perguntado aqui. Ele é ligado por padrão e configurado no **Passo 5.2**, que roda sempre.

#### Variáveis Opcionais (alinhar ao `templates/ENV-template.md`)

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `TASK_MANAGER` | *(vazio = freelance)* | `jira`, `github`, `gitlab` |
| `TASK_MANAGER_ACCESS` | *(vazio)* | `cli` ou `manual` (definido pela descoberta da CLI) |
| `TASK_MANAGER_URL_BASE` | *(vazio)* | GitHub/GitLab: repositório dos cards (obrigatório); Jira: o site, só para o link |
| `VERSION_CONTROL` | *(vazio)* | `github`, `gitlab` |
| `VERSION_CONTROL_ACCESS` | *(vazio)* | `cli` ou `manual` |
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
| `JARVIS_PROJECT` | `https://github.com/phelipperibeiro/jarvis-framework` | URL completa do repo do framework (`/jarvis-report-issue`); trocar só para um fork |
| `CENTRAL_DOCS_STORAGE` / `_LOCATION` | `filesystem` / pasta padrão do modo de trabalho | Central docs (o que foi implementado), configurado no Passo 5.2; vazio = desligado |
| `JARVIS_DOCS` / `ENG_DOCS` | `$DOCS_FOLDER/jarvis` / `$JARVIS_DOCS/engineering` | Documentos de trabalho (não perguntar; `docs/jarvis/` no `.gitignore` só se a raiz tiver `.git`) |
| `DISCOVERIES_FOLDER_NAME` / `DISCOVERIES_DOCS` | `discoveries` / `$JARVIS_DOCS/$DISCOVERIES_FOLDER_NAME` | Discoveries, fora de `product/` (não perguntar) |
| `CENTRAL_DOCS_REF` / `_TARGET_BRANCH` / `_REVIEWERS` | `main` / `main` / *(vazio)* | Só quando a pasta do Central docs tem `.git` |
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

# 8. Documentos de trabalho em docs/jarvis/ — nos DOIS modos de trabalho:
#    JARVIS_DOCS=$DOCS_FOLDER/jarvis, PROD_DOCS=$JARVIS_DOCS/product, ENG_DOCS=$JARVIS_DOCS/engineering
#    (valores do template). Uma docs/ já existente não é tocada.

# 9. .gitignore — SÓ se a raiz do workspace for um repositório (tem .git).
#    Raiz sem .git (modo workspace, ou pasta sem nenhum repositório) não é versionada:
#    NÃO crie nem altere o .gitignore da raiz.
if [ -e .git ]; then
  for line in '.jarvis/' 'docs/jarvis/' 'CDD-MIND-MAP.md'; do
    grep -qxF "$line" .gitignore 2>/dev/null || echo "$line" >> .gitignore
  done
fi
```

### 5.2 Central docs (sempre)

O Central docs é **ligado por padrão**: é onde fica o registro do que **foi implementado**, gerado pelo `/eng.spec-consolidate` depois de cada PR. Explique em uma frase ao usuário:

```
📚 Central docs: o registro do que foi implementado (um documento completo por funcionalidade
e um por entrega), consultado pela IA e por outros squads. Os rascunhos (PRD, FRD, ARD, RFC, SPEC)
ficam em docs/jarvis/ e não vão para lá.
```

Pergunte com `AskUserQuestion`:
- **"Onde fica o Central docs?"**
  - A) Pasta local (padrão)
  - B) Repositório de documentação (git)
  - C) Desligar

**A ou B:**
- `CENTRAL_DOCS_STORAGE=filesystem`.
- `CENTRAL_DOCS_LOCATION=docs/jarvis/central-docs` nos dois modos de trabalho, junto dos documentos de trabalho (a pessoa pode digitar outro caminho). Com `.git` na raiz, `docs/jarvis/` no `.gitignore` já cobre a pasta; sem `.git` na raiz (como no modo workspace) ela não é versionada, e nenhum `.gitignore` é necessário.
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
WORKSPACE_MODE={workspace|project}
USER={resolvido}
MAX_AI_EXECUTION_PERCENTAGE={60-100}
ENABLE_CDD=true

# --- Organização ---
SQUAD={valor}
HUB={valor}
AREA={valor}
POSITION={valor}

# --- Condução e estilo ---
PROD_MODE={product-led|developer-guided}
ARTIFACT_STYLE={ai-generated|human-generated}

# --- IDE e pastas ---
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

# --- Task manager (opcional; vazio = freelance) ---
TASK_MANAGER=
TASK_MANAGER_ACCESS=
TASK_MANAGER_URL_BASE=

# --- Controle de versão / chat / demais opcionais do template ---
VERSION_CONTROL=
VERSION_CONTROL_ACCESS=
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
5. Incluir (ou acrescentar, se o `AGENTS.md` já existir e não citar) a linha que identifica o mapa como contexto de workspace:
   `> Contexto de workspace: [CDD-MIND-MAP.md](CDD-MIND-MAP.md) (tecnologias e papel de cada repositório; lido pelo /warm-up).`

### 8. Profile-Aware Rules Sync

**Executar após gravar o ENV.md** (nos fluxos create, update B e upgrade C).

Objetivo: garantir que `$IDE/rules/` e `$IDE/rules-on-demand/` contenham apenas as rules relevantes para o perfil do usuário, reduzindo tokens carregados em sessão. A pasta `rules/` é carregada no início da sessão; a `rules-on-demand/` guarda as rules de uma etapa só, que cada workflow lê quando precisa (o Claude Code não a carrega sozinho). O filtro é o mesmo nas duas pastas, e `bin/lib/core/profile-filter.js` o espelha em JS (usado por `jarvis tokens`): ao mudar a lógica aqui, mude lá e em `rules/AGENTS.md`.

**Passos:**

```
1. Ler HUB, POSITION, AREA, SQUAD e ARTIFACT_STYLE (vazio = `ai-generated`) do ENV.md recém-gravado
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

  // ARTIFACT_STYLE (5º campo opcional): ausente no bloco = 'all'; perfil vazio = 'ai-generated'.
  // Sem coringa: FULLCYCLE e GENERALIST não o satisfazem (é escolha da pessoa, não papel).
  const styleMatches = matches(appliesTo.ARTIFACT_STYLE || 'all', profile.ARTIFACT_STYLE || 'ai-generated')

  return (
    hubMatches &&
    positionMatches &&
    areaMatches &&
    matches(appliesTo.SQUAD, profile.SQUAD) &&
    styleMatches
  )
}
```

**Parser do bloco `applies_to`:**

```javascript
// Exemplo de bloco: > **Applies to:** HUB: all | POSITION: all | AREA: all | SQUAD: all
// 5º campo opcional:  ... | SQUAD: all | ARTIFACT_STYLE: human-generated
function parseAppliesTo(fileContent) {
  const match = fileContent.match(
    /> \*\*Applies to:\*\* HUB: ([^|]+)\| POSITION: ([^|]+)\| AREA: ([^|]+)\| SQUAD: ([^|\n]+)(?:\| ARTIFACT_STYLE: ([^|\n]+))?/
  )
  if (!match) return null // sem bloco = universal
  return {
    HUB:            match[1].trim(),
    POSITION:       match[2].trim(),
    AREA:           match[3].trim(),
    SQUAD:          match[4].trim(),
    ARTIFACT_STYLE: (match[5] || 'all').trim(),
  }
}
```

**Copiar preservando subpastas:**

```bash
# Exemplo: rules/engineering/frontend/eng.frontend-rules.md
# Destino: $IDE/rules/engineering/frontend/eng.frontend-rules.md
# (o mesmo vale para rules-on-demand/ → $IDE/rules-on-demand/)
mkdir -p "$IDE/$pasta/$(dirname $relPath)"
cp "$pasta/$relPath" "$IDE/$pasta/$relPath"   # $pasta = rules ou rules-on-demand
```

**Saída para o usuário:**

```
🔍 Sincronizando rules para o perfil: HUB={HUB} | POSITION={POSITION} | AREA={AREA} | SQUAD={SQUAD} | ARTIFACT_STYLE={ARTIFACT_STYLE}

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
6. **Monta o `CDD-MIND-MAP.md`** (o mapa de tecnologias do workspace, lido pelo `/warm-up`): com a mesma leitura do sub-passo 3, agora para **todas as áreas**, preenche uma linha por repositório (papel, linguagem, framework, área, até 5 ferramentas principais) pelo `$IDE/templates/cdd-mind-map-template.md`, mostra a tabela e pede a validação com `AskUserQuestion` (**Confirmar** | **Corrigir** | **Incluir informação**). Grava na raiz do workspace (com `.git` na raiz, já no `.gitignore`, Passo 5). Se o mapa já existe, só acrescenta os repositórios que faltam. Pular é permitido: o primeiro `/warm-up` cria o mapa.

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
2. Se o ENV.md tiver dados sensíveis e estiver num repositório (raiz com `.git`), adicioná-lo ao `.gitignore`
3. Com `.git` na raiz, garantir `.jarvis/` no `.gitignore` (sem `.git`, como no modo workspace, a raiz não é versionada)
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
- ✅ Criar `.jarvis/sessions/{eng,prod,qa}` e, só com `.git` na raiz, garantir `.jarvis/` no `.gitignore`
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
| **taxonomy.md não encontrado** | Usar DEFAULT_OPTIONS (CORE + hubs com DATA) e avisar |
| **taxonomy.md inválido/corrompido** | Usar DEFAULT_OPTIONS e alertar |
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

Pergunta 8: Modo dos comandos de produto?
[AskUserQuestion: Product-Led | Developer-Guided, sem opção sugerida]

Pergunta 9: Estilo dos artefatos?
[AskUserQuestion: AI-Generated (padrão) | Human-Generated]

Pergunta 10 (opcional): Usa board de cards? jira/github/gitlab ou Nenhum (freelance) → descoberta da CLI e variáveis (Passo 4)
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
- [ ] Se Upgrade: calculou diff template vs ENV.md e appendou apenas variáveis faltantes
- [ ] Coletou todas as variáveis obrigatórias
- [ ] USER gravado no ENV.md a partir da identidade local
- [ ] Validou MAX_AI_EXECUTION_PERCENTAGE (60-100) - para campos livres
- [ ] Confirmou WORKSPACE (nome da pasta do `$IDE/` ou override)
- [ ] ENABLE_CDD=true e SESSIONS_DIR=.jarvis/sessions
- [ ] Criou `.jarvis/sessions/{eng,prod,qa}` e, só com `.git` na raiz, `.jarvis/` no `.gitignore` (raiz sem `.git`: nenhum `.gitignore`)
- [ ] TASK_MANAGER: valor ou vazio (freelance) explicado
- [ ] Não gravou TOKEN_VERSION_CONTROL / PROJECT_NAME / EVENT_BUS*
- [ ] Perguntou sobre variáveis opcionais
- [ ] **Ajustou FLOWS_FOLDER baseado no IDE (commands se claude, workflows se outros)**
- [ ] **Se HUB=DATA: coletou variáveis DATA_* obrigatórias (passo 3.1)**
- [ ] **Se HUB≠DATA: bloco DATA_* removido completamente do ENV.md gerado**
- [ ] Criou arquivo ENV.md usando template completo
- [ ] **Se IDE ≠ claude: moveu todos os workflows de subpastas para a raiz de `$IDE/workflows/`**
- [ ] Garantiu o Context7 no arquivo de MCP da IDE e o validou (ou o registrou como pendente de ativação)
- [ ] Se TASK_MANAGER/VERSION_CONTROL definidos: descobriu a CLI (instalada e logada) e gravou `*_ACCESS` (`cli` ou `manual`) após confirmação
- [ ] Se TASK_MANAGER vazio: pulou a descoberta do board
- [ ] Não pediu nem gravou token do board ou do git
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
- **Detecção de IDE**: A variável `$IDE` é detectada automaticamente (`.windsurf/`, `.claude/`, `.cursor/`, `.codex/`, `.opencode/`, `.agents/`)
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
