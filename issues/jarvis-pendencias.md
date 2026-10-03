# Jarvis Framework — Pendências e Melhorias

> Documento de rastreamento de evoluções necessárias no framework

---

## 🎯 Prioridade Alta

### 1. Suporte a Multi-Repositório

**Problema**: Hoje o Jarvis funciona apenas em cenário single-repo. Squads que trabalham com múltiplos repositórios não conseguem usar o framework de forma eficiente.

#### Cenário Atual (Single-repo) ✅

```
projeto/
├── .windsurf/          # Jarvis instalado aqui
│   ├── ENV.md
│   ├── agents/
│   ├── skills/
│   ├── workflows/
│   └── rules/
├── src/
├── package.json
└── README.md
```

**Funciona bem**: contexto único, navegação simples, logs centralizados.

#### Cenário Desejado (Multi-repo) ⚠️

```
workspace-squad/        # Jarvis deveria ficar aqui (nível workspace)
├── .windsurf/         # ❌ Hoje não funciona nesse nível
│   ├── ENV.md         # Compartilhado entre todos os repos
│   ├── agents/
│   ├── sessions/
│   ├── skills/
│   ├── workflows/
│   └── rules/
│
├── repo-api-1/          # Repositório 1 (backend-1)
│   ├── .git/
│   ├── src/
│   └── package.json
│
├── repo-api-2/          # Repositório 2 (backend-2)
│   ├── .git/
│   ├── src/
│   └── package.json
│
├── repo-frontend/     # Repositório 3 (frontend)
│   ├── .git/
│   ├── src/
│   └── package.json
│
└── repo-workers/      # Repositório 4 (workers/jobs)
    ├── .git/
    ├── src/
    └── package.json
```

**Necessário**: detectar workspace, compartilhar contexto, navegar entre repos, agregar informações.

---

## 📋 Tarefas para Implementar Multi-Repo

> ⚠️ **Atualização**: `WORKSPACE_TYPE` foi removido. Workspace = pasta do `$IDE/`.
> Repos = `WORKSPACE_REPOS` (allowlist) ou scan de subpastas com `.git/`.
> O CLI sobe ancestrais a partir do cwd até achar `$IDE/ENV.md`.

> 🔒 **Retrocompatibilidade**:
> - 0–1 git na pasta do workspace → fluxo single (sem perguntar repos)
> - 2+ subpastas com `.git/` → perguntar `ACTIVE_REPOS` no warm-up
> - **Nunca quebrar workspaces com um único repo**

### Fase 1: Detecção e Configuração

- [ ] **Detectar workspace multi-repo**
  - Escanear diretório pai do `$IDE/` procurando múltiplos `.git/`
  - Adicionar variável `WORKSPACE_TYPE=single|multi` no `ENV.md`
  - Adicionar variável `WORKSPACE_REPOS=repo1,repo2,repo3` (lista de repos disponíveis)
  - **Otimização de tokens**: Não escanear todos automaticamente — perguntar ao usuário

- [ ] **Atualizar `/jarvis-init`**
  - Perguntar diretamente: "Este é um workspace single-repo ou multi-repo?" 
    - Opções: `single` (padrão) | `multi`
    - Default: `single` (apenas apertar Enter)
  - Se `multi`: 
    - Escanear diretório atual procurando pastas com `.git/`
    - Mostrar lista de repos encontrados
    - Perguntar: "Quais repos deseja incluir no workspace?" (selecionar múltiplos)
    - Preencher `WORKSPACE_REPOS` apenas com os selecionados
  - Se `single`: fluxo normal atual
  - Criar `ENV.md` com `WORKSPACE_TYPE` configurado

- [ ] **Atualizar `ENV-template.md`**
  - Adicionar seção de configuração multi-repo
  - Documentar variáveis `WORKSPACE_TYPE` e `WORKSPACE_REPOS`

### Fase 2: Warm-up Multi-Repo

> ⚠️ **IMPORTANTE**: Todas as tarefas desta fase **só se aplicam quando `WORKSPACE_TYPE=multi`**.
> Se `WORKSPACE_TYPE=single` ou **não definido (padrão = single)**, ignorar completamente e seguir fluxo normal single-repo.

- [ ] **Atualizar `/warm-up` (Passo 0)**
  - Detectar se está em workspace multi-repo (`WORKSPACE_TYPE=multi`)
  - **Se single**: pular toda a lógica multi-repo, seguir fluxo atual
  - **Se multi**: Ler `ENV.md` do nível workspace (não do repo individual)
  - Validar que todos os repos listados existem

- [ ] **Novo Passo 0.6: Reconhecimento de Repos (com otimização de tokens)**
  - Listar todos os repos disponíveis em `WORKSPACE_REPOS`
  - **Perguntar ao usuário**: "Quais repositórios você quer carregar nesta sessão?"
    - Opções: selecionar múltiplos ou "todos"
    - Salvar seleção em variável de sessão `ACTIVE_REPOS`
  - Para cada repo em `ACTIVE_REPOS` (não todos):
    - Ler `README.md` (resumo do repo)
    - Executar `git status --short` (estado atual)
    - Executar `git log --oneline -3` (commits recentes)
    - Identificar stack técnico (package.json, requirements.txt, etc.)
  - Consolidar informações em resumo único
  - **Economia**: Evita escanear repos não relacionados à tarefa atual

- [ ] **Atualizar Passo 3: Resumo de Contexto**
  - Incluir seção "Repositórios" quando multi-repo
  - Mostrar status de cada repo em `ACTIVE_REPOS` (branch, commits pendentes, modificações)
  - Exibir resumo consolidado do workspace

- [ ] **Atualizar Passo 4: Menu Adaptado**
  - Menu permanece o mesmo (não pergunta repo aqui)
  - A seleção de repos é feita no `/eng.start` quando necessário

### Fase 3: Workflows Multi-Repo

> 📌 **Regra Principal**: Se `WORKSPACE_TYPE=multi`:
> - `/eng.start` → Detecta repos (via MCP Jira ou pergunta) → cria `architecture.md` consolidado
> - `/eng.plan` → Lê `architecture.md` → planeja TODOS os repos → cria `plan.md` consolidado
> - `/eng.work` → Lê `plan.md` → executa TUDO em TODOS os repos automaticamente

#### Exemplo de Fluxo Completo Multi-Repo

```bash
# 1. Warm-up da sessão
/warm-up
→ Detecta WORKSPACE_TYPE=multi
→ Pergunta: "Quais repos carregar?" → seleciona repo-api, repo-frontend, repo-workers
→ ACTIVE_REPOS = repo-api, repo-frontend, repo-workers
→ Escaneia e exibe resumo consolidado dos 3 repos

# 2. Iniciar nova task
/eng.start TASK-123
→ Detecta via MCP Jira ou pergunta: "Quais repos esta task afeta?"
→ Usuário seleciona: repo-api, repo-frontend
→ TASK_REPOS = repo-api, repo-frontend
→ Cria architecture.md consolidado (workspace-squad/architecture.md)

# 3. Planejar trabalho
/eng.plan
→ Lê architecture.md e TASK_REPOS
→ Planeja esforço em repo-api (4h)
→ Planeja esforço em repo-frontend (3h)
→ Cria plan.md consolidado (workspace-squad/plan.md)
→ Esforço total: 7h

# 4. Implementar
/eng.work
→ Lê plan.md e TASK_REPOS
→ Trabalha em repo-api (1/2) → implementa, faz commits
→ Trabalha em repo-frontend (2/2) → implementa, faz commits
→ Concluído!

# 5. Validar antes do PR
/eng.pre-pr
→ Lê TASK_REPOS
→ Valida repo-api: testes, linting ✅
→ Valida repo-frontend: testes, linting ✅

# 6. Criar Pull Requests
/eng.pr
→ Lê TASK_REPOS
→ Detecta commits em repo-api e repo-frontend
→ Cria MR #45 em repo-api
→ Cria MR #78 em repo-frontend
→ Adiciona cross-reference entre MRs
→ Registra no task-log: [repo-api] MR #45, [repo-frontend] MR #78
```

**Observação**: `repo-workers` foi carregado no warm-up (`ACTIVE_REPOS`) mas não foi usado na task (`TASK_REPOS`). Isso é normal — nem todo repo carregado precisa ser modificado.

---

- [ ] **Atualizar `/eng.start`**
  - **Detectar automaticamente** `WORKSPACE_TYPE` no início
  - **Se single**: 
    - Fluxo normal (repo atual)
    - Criar `architecture.md` no repo
  - **Se multi**: 
    - **Detectar repos automaticamente**:
      - Via MCP Jira: ler issue, identificar repos mencionados (labels, descrição, componentes)
      - Se não estiver claro no Jira: perguntar "Quais repos?" (selecionar de `ACTIVE_REPOS`)
    - Salvar em `TASK_REPOS` (variável de sessão)
    - **Criar `architecture.md` consolidado** no nível workspace
    - Incluir: visão geral, seção por repo, dependências, ordem de implementação/deploy

- [ ] **Atualizar `/eng.plan`**
  - **Detectar automaticamente** `WORKSPACE_TYPE`
  - **Se single**: 
    - Fluxo normal (planejar esforço no repo atual)
    - Criar `plan.md` no repo
  - **Se multi**: 
    - Ler `architecture.md` e `TASK_REPOS`
    - **Planejar trabalho considerando TODOS os repos**:
      - Esforço por repo (complexidade, tempo, riscos, subtarefas)
      - Consolidar: esforço total, dependências, ordem de execução
    - **Criar `plan.md` consolidado** no nível workspace
    - Atualizar `architecture.md` com referência ao `plan.md`

- [ ] **Atualizar `/eng.work`**
  - **Detectar automaticamente** `WORKSPACE_TYPE`
  - **Se single**: 
    - Fluxo normal (implementar no repo atual)
  - **Se multi**: 
    - Ler `plan.md` e `TASK_REPOS`
    - **Executar TUDO que foi planejado em TODOS os repositórios**:
      - Seguir ordem definida no `plan.md`
      - Implementar repo por repo automaticamente
      - Fazer commits incrementais em cada repo
      - Exibir progresso: "Trabalhando em repo-api (1/2)"

- [ ] **Atualizar `/eng.pre-pr`**
  - **Detectar automaticamente** `WORKSPACE_TYPE`
  - **Se single**: Validações normais
  - **Se multi**: 
    - Ler `TASK_REPOS` (repos da task atual)
    - Validar cada repo em `TASK_REPOS` que tenha commits
    - Executar testes, linting, etc. em cada repo afetado

- [ ] **Atualizar `/eng.pr`**
  - **Detectar automaticamente** `WORKSPACE_TYPE`
  - **Se single**: Criar MR no repo atual (fluxo normal)
  - **Se multi**: 
    - Ler `TASK_REPOS` (repos da task atual)
    - Escanear via `git status` apenas repos em `TASK_REPOS`
    - Identificar repos com commits (staged, locais, branches)
    - Criar MR individual em cada repo detectado
    - Adicionar cross-reference entre MRs (se múltiplos)
    - Registrar no task-log com prefixo `[repo-name]`
  - Exibir confirmação informativa ao usuário

### Fase 4: CLI Multi-Repo

- [ ] **Atualizar `jarvis checkin`**
  - Detectar workspace multi-repo
  - Consolidar status de todos os repos no log diário
  - Perguntar em quais repos o dev vai trabalhar hoje

- [ ] **Atualizar `jarvis checkout`**
  - Consolidar highlights de todos os repos
  - Gerar resumo único para o Slack

- [ ] **Atualizar `jarvis task-log`**
  - Permitir especificar repo onde a task foi entregue
  - Formato: `jarvis task-log TASK-123 --repo repo-api`

### Fase 5: Runtime Multi-Repo

- [ ] **Atualizar eventos de métricas**
  - Incluir campo `repo` nos eventos
  - Agregar métricas por repo e por workspace

- [ ] **Dashboard multi-repo**
  - Endpoint `/metrics/dashboard` com filtro por repo
  - Visão consolidada do workspace inteiro

### Fase 6: Documentação

- [ ] **Atualizar `README.md`**
  - Seção sobre multi-repo
  - Exemplos de uso

- [ ] **Atualizar `AGENTS.md`**
  - Instruções sobre detecção de workspace
  - Regras de navegação entre repos

- [ ] **Criar guia de migração**
  - Como migrar de single-repo para multi-repo
  - Como organizar workspace existente

---

## ⚡ Otimização de Tokens em Multi-Repo

**Problema**: Escanear todos os repos automaticamente pode consumir muitos tokens desnecessariamente.

**Solução**: Carregamento seletivo e sob demanda.

### Estratégia de Carregamento

```
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE_TYPE=multi detectado                              │
│   ↓                                                          │
│ Listar repos disponíveis (WORKSPACE_REPOS)                  │
│   ↓                                                          │
│ PERGUNTAR: "Quais repos você quer carregar?"                │
│   ├─ Opção 1: Selecionar específicos (ex: repo-api, repo-frontend) │
│   ├─ Opção 2: Todos                                         │
│   └─ Opção 3: Nenhum (trabalhar sem contexto de repo)       │
│   ↓                                                          │
│ Salvar em ACTIVE_REPOS (variável de sessão)                 │
│   ↓                                                          │
│ Escanear APENAS repos selecionados                          │
│   ↓                                                          │
│ Permitir adicionar mais repos durante a sessão (/load-repo) │
└─────────────────────────────────────────────────────────────┘
```

### Variáveis de Configuração

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `WORKSPACE_REPOS` | ENV.md (persistente) | Lista completa de repos disponíveis no workspace |
| `ACTIVE_REPOS` | Sessão (temporário) | Repos carregados na sessão atual (warm-up) |
| `TASK_REPOS` | Sessão (temporário) | Repos que a task atual afeta (definido no /eng.start) |

### Comandos de Navegação

```bash
/repos                    # Listar todos os repos disponíveis
/load-repo repo-workers   # Carregar repo adicional na sessão (warm-up)
/repo-status              # Status de todos os ACTIVE_REPOS
```

> **Nota**: Não há comando `/switch-repo`. A ordem de trabalho nos repos é definida no `/eng.start` e seguida automaticamente pelo `/eng.work`.

### Exemplo de Fluxo

```
Dev abre workspace com 5 repos:
  WORKSPACE_REPOS=repo-api,repo-frontend,repo-workers,repo-admin,repo-mobile

/warm-up pergunta:
  "Quais repos você quer carregar?"
  [ ] repo-api
  [x] repo-frontend
  [ ] repo-workers
  [ ] repo-admin
  [ ] repo-mobile

Resultado:
  ACTIVE_REPOS=repo-frontend
  → Escaneia APENAS repo-frontend
  → Economia: ~80% de tokens

Durante a sessão, dev percebe que precisa do repo-api:
  /load-repo repo-api
  → Adiciona repo-api ao ACTIVE_REPOS
  → Escaneia apenas repo-api (não reescaneia repo-frontend)

Dev inicia task:
  /eng.start TASK-123
  → Pergunta: "Quais repos?" → seleciona repo-api, repo-frontend
  → TASK_REPOS = repo-api,repo-frontend

  /eng.work
  → Trabalha em repo-api (1/2)
  → Implementa, faz commits
  → Avança para repo-frontend (2/2)
  → Implementa, faz commits
  → Concluído!
```

### Benefícios

- **Economia de tokens**: 60-90% dependendo do número de repos
- **Warm-up mais rápido**: menos arquivos para ler
- **Contexto focado**: apenas o necessário para a tarefa
- **Flexibilidade**: adicionar repos sob demanda

---

## 🔧 Melhorias Técnicas Necessárias

### Detecção de Workspace

```bash
# Algoritmo de detecção
1. Verificar se existe $IDE/ENV.md
2. Se não existir, subir um nível e verificar ../$IDE/ENV.md
3. Se encontrar, verificar WORKSPACE_TYPE
4. Se multi-repo, escanear pastas no mesmo nível procurando .git/
5. Validar que WORKSPACE_REPOS corresponde aos repos encontrados
```

### Status de Repos

```bash
/repos                       # Lista todos os repos do workspace
/repo-status                 # Status de todos os ACTIVE_REPOS
```

> **Nota**: Em multi-repo, não há conceito de "repo ativo" ou "trocar de repo". Os workflows trabalham automaticamente em todos os repos da `TASK_REPOS` na ordem definida.

### Agregação de Logs

```bash
# Log diário multi-repo
~/.jarvis/logs/{squad}/YYYY-MM-DD.md

## Check-in
- Repos ativos hoje: repo-api, repo-frontend
- Planejamento: ...

## Entregas
- [repo-api] TASK-123: Implementar endpoint X
- [repo-frontend] TASK-124: Consumir endpoint X

## Check-out
- Highlights consolidados de ambos os repos
```

---

## 🔀 Ciclo de Vida Independente por Repo

> ⚠️ **CRÍTICO**: Em multi-repo, cada repositório mantém seu próprio ciclo de vida Git.

### Commits Individuais

```bash
# Cada repo tem seus próprios commits
workspace-squad/
├── repo-api/
│   └── .git/          # Histórico independente
│       └── commits próprios do repo-api
│
├── repo-frontend/
│   └── .git/          # Histórico independente
│       └── commits próprios do repo-frontend
│
└── repo-workers/
    └── .git/          # Histórico independente
        └── commits próprios do repo-workers
```

**Regras**:
- Commits são feitos **no repo sendo trabalhado** no momento
- Não existe "commit cross-repo" — cada repo commita separadamente
- Se uma feature afeta múltiplos repos, fazer commits em cada um
- `/eng.work` trabalha repo por repo automaticamente seguindo `TASK_REPOS`

### Merge Requests Individuais

```bash
# Exemplo: Feature que afeta 2 repos
TASK-123: Implementar autenticação OAuth

Repo 1 (repo-api):
  → Branch: feature/TASK-123-oauth-backend
  → MR #45: [TASK-123] Implementar OAuth no backend
  → Merge em: repo-api/main

Repo 2 (repo-frontend):
  → Branch: feature/TASK-123-oauth-frontend
  → MR #78: [TASK-123] Integrar OAuth no frontend
  → Merge em: repo-frontend/main
```

**Regras**:
- Cada repo abre seu próprio MR
- MRs podem referenciar uns aos outros (cross-reference)
- Deploy pode exigir coordenação entre MRs (ordem de merge)

### Workflows Auto-Detectáveis

**Todos os workflows principais detectam `WORKSPACE_TYPE` automaticamente no início**:

```bash
# Padrão de detecção (início de cada workflow)
WORKSPACE_TYPE=$(grep "^WORKSPACE_TYPE=" $IDE/ENV.md | cut -d= -f2)

if [ "$WORKSPACE_TYPE" = "multi" ]; then
  # Lógica multi-repo
else
  # Lógica single-repo (padrão)
fi
```

### Exemplo: `/eng.pr` em Multi-Repo

Quando `WORKSPACE_TYPE=multi`:

1. **Detectar automaticamente** repos com commits na sessão:
   ```bash
   # Para cada repo em ACTIVE_REPOS
   git -C repo-name status --short
   git -C repo-name diff --cached --name-only
   
   # Identificar quais repos têm:
   # - Mudanças staged (git add)
   # - Commits locais não pushados
   # - Branch diferente de main/master
   ```

2. **Processar cada repo detectado**:
   - Validar branch local
   - Criar MR individual
   - Adicionar referência cruzada na descrição do MR (se múltiplos)
   - Registrar no `task-log` com prefixo `[repo-name]`

3. **Confirmação ao usuário** (apenas informativa):
   ```
   ✅ Detectados commits em 2 repos:
      - repo-api (branch: feature/TASK-123-oauth-backend)
      - repo-frontend (branch: feature/TASK-123-oauth-frontend)
   
   Criando MRs individuais...
   → MR #45 criado em repo-api
   → MR #78 criado em repo-frontend
   → Cross-reference adicionado entre MRs
   ```

### Exemplo de `architecture.md` Consolidado

```markdown
# TASK-123: Implementar Autenticação OAuth

## Visão Geral
Implementar autenticação OAuth 2.0 com Google e GitHub.
Afeta 2 repositórios: backend (API) e frontend (UI).

## Dependências entre Repos
- Backend deve ser deployado ANTES do frontend
- Frontend consome endpoints criados no backend

## Mudanças em repo-api

### Endpoints Novos
- POST /auth/oauth/google
- POST /auth/oauth/github
- GET /auth/oauth/callback

### Tecnologias
- Passport.js (estratégias OAuth)
- JWT para tokens de sessão

### Arquivos Afetados
- src/auth/oauth.controller.ts
- src/auth/strategies/google.strategy.ts
- src/auth/strategies/github.strategy.ts

## Mudanças em repo-frontend

### Componentes Novos
- LoginWithGoogle.tsx
- LoginWithGitHub.tsx
- OAuthCallback.tsx

### Tecnologias
- React OAuth2 | PKCE
- Zustand (estado de autenticação)

### Arquivos Afetados
- src/components/auth/LoginWithGoogle.tsx
- src/stores/authStore.ts

## Planejamento de Esforço

### repo-api
- **Complexidade**: Média
- **Tempo estimado**: 4h
- **Riscos**: Integração com providers OAuth externos
- **Subtarefas**:
  1. Configurar Passport.js (1h)
  2. Implementar estratégia Google (1.5h)
  3. Implementar estratégia GitHub (1.5h)
  4. Testes unitários (30min)

### repo-frontend
- **Complexidade**: Baixa
- **Tempo estimado**: 3h
- **Riscos**: Fluxo de redirect pode ser confuso para usuário
- **Subtarefas**:
  1. Criar componentes de login (1h)
  2. Integrar com backend (1h)
  3. Tratamento de erros (30min)
  4. Testes E2E (30min)

### Consolidado
- **Esforço total**: 7h
- **Dependência**: Backend deve estar pronto antes do frontend
- **Ordem de execução**: repo-api → repo-frontend

## Ordem de Implementação

1. Backend (repo-api)
   - Implementar estratégias OAuth
   - Criar endpoints
   - Testar com Postman

2. Frontend (repo-frontend)
   - Implementar componentes de login
   - Integrar com endpoints do backend
   - Testar fluxo completo

## Ordem de Deploy

1. Deploy backend → produção
2. Aguardar validação
3. Deploy frontend → produção
```

**Localização**: `workspace-squad/architecture.md` (nível workspace, não dentro de repo individual)

### Exemplo de Task Log Multi-Repo

```markdown
## Entregas

### TASK-123: Implementar OAuth
- [repo-api] MR #45 aberto — Backend OAuth implementado
- [repo-frontend] MR #78 aberto — Frontend integrado com OAuth
- Ordem de deploy: backend primeiro, depois frontend
```

### Coordenação de Deploy

```bash
# Algumas features exigem ordem específica de deploy
TASK-456: Adicionar campo novo na API

1. Deploy repo-api primeiro (adiciona campo)
   → MR #50 mergeado → deploy em produção
   
2. Aguardar deploy do backend
   
3. Deploy repo-frontend depois (consome campo)
   → MR #82 mergeado → deploy em produção

# Documentar ordem no MR ou no task-log
```

---

## 🎯 Squads Afetados

Squads que **precisam** de multi-repo:

- **ENGINEERING-CORE**: api-gateway (repo separado) + core (monolito)
- **CROSS-PRODUCT**: auth (repo separado) + módulos no monolito
- **RPA**: múltiplos robôs em repos separados
- **DATA**: pipelines (repo separado) + transformações (outro repo)

---

## 📊 Impacto Estimado

| Componente | Impacto | Esforço |
|------------|---------|---------|
| `/warm-up` | Alto | Médio |
| `/jarvis-init` | Alto | Baixo |
| Workflows de engenharia | Médio | Médio |
| CLI (checkin/checkout) | Alto | Alto |
| Runtime (eventos) | Baixo | Baixo |
| Documentação | Médio | Baixo |

**Total estimado**: 3-4 sprints para implementação completa

---

## 🚀 Roadmap Sugerido

### Sprint 1: Fundação
- Detecção de workspace
- Atualização do `/jarvis-init`
- Atualização do `ENV-template.md`

### Sprint 2: Warm-up
- Reconhecimento de repos
- Resumo consolidado
- Menu adaptado

### Sprint 3: Workflows
- Adicionar detecção automática de `WORKSPACE_TYPE` em todos os workflows
- `/eng.start`, `/eng.plan`, `/eng.work`, `/eng.pre-pr`, `/eng.pr` multi-repo
- Detecção automática de repos com commits
- Cross-reference entre MRs

### Sprint 4: CLI e Runtime
- Atualização de checkin/checkout/task-log
- Eventos multi-repo
- Dashboard consolidado

---

## 📝 Notas

- Manter **retrocompatibilidade** com single-repo
- Não quebrar instalações existentes
- Permitir migração gradual (squad por squad)
- Documentar bem os dois cenários


Após a reunião de ontem, tentei fazer alguns testes e encontrei alguma oportunidades de melhorias no Jarvis e gostaria do seu feedback sobre o esboço antes de seguir com a atualização no framework.

