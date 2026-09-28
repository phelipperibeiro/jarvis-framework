---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow PR (Pull Request / Merge Request)

## Propósito

O workflow `pr` tem como objetivo **criar a branch, commitar as alterações e abrir um Merge Request** seguindo os padrões do time.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

> Esta regra é executada **antes de qualquer ação**. Se qualquer condição falhar, o workflow para imediatamente.

### Regra 0.1 — TASK_MANAGER_KEY obrigatório

Ler `TASK_MANAGER` do ENV.md. Ver `eng.integrations-rules.md` (freelance vs board).

Se `$ARGUMENTS` não trouxer o key: **perguntar e aguardar**. Não inventar. Não exigir `XXX-000`.

- Freelance (`TASK_MANAGER` vazio): *Qual o seu número de controle para esta tarefa?*
- Com board: *Qual o id do card no {TASK_MANAGER}?*

Sem resposta → **PARAR**. Com resposta → seguir (pasta/branch em lowercase).

**→ PARAR. Não executar nenhuma fase.**

### Regra 0.2 — Proibido executar em branch protegida

Verificar branch atual:

```bash
git branch --show-current
```

Se for `main`, `master`, `develop`, `staging` ou `homolog`:

```
🚫 BLOQUEADO: Você está em uma branch protegida ({BRANCH_ATUAL}).

Este workflow só pode ser executado em uma branch de feature.
Execute /eng.start {TASK_MANAGER_KEY} primeiro para criar a branch correta.

Branch esperada: {TASK_MANAGER_KEY}-{titulo-kebab-case}
```

**→ PARAR. Não executar nenhuma fase.**

### Regra 0.3 — Branch deve corresponder ao TASK_MANAGER_KEY

Se a branch atual **não contém** o `{TASK_MANAGER_KEY}` no nome:

```
⚠️ ATENÇÃO: A branch atual ({BRANCH_ATUAL}) não corresponde à tarefa {TASK_MANAGER_KEY}.

  Branch atual:  {BRANCH_ATUAL}
  Esperado:      branch contendo {TASK_MANAGER_KEY}

Confirmar que está na branch certa? (s/n)
```

**→ Aguardar confirmação explícita antes de prosseguir.**

---

## Princípios Fundamentais

### 1. Padrão de Nomenclatura de Branch

O nome da branch **DEVE** seguir o padrão:

```
{TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

**Regras:**
- `TASK_MANAGER_KEY` em **UPPERCASE** (ex: `TASK-123`, `STORY-456`)
- Título extraído do Jira convertido para **kebab-case**
- Remover caracteres especiais
- Substituir espaços por hífens

**Exemplos:**

| TASK_MANAGER_KEY | Título no Jira | Nome da Branch |
|----------|----------------|----------------|
| `TASK-123` | "Implementar autenticação JWT" | `TASK-123-implementar-autenticacao-jwt` |
| `STORY-456` | "Adicionar botão de logout" | `STORY-456-adicionar-botao-de-logout` |
| `BUG-789` | "Fix: null pointer em login" | `BUG-789-fix-null-pointer-em-login` |

### 2. Padrão de Commit

**Formato da mensagem de commit:**

```
{TASK_MANAGER_KEY} {tipo}({escopo}): {descrição}
```

**Tipos permitidos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplo:**
```
TASK-123 feat(auth): implementar autenticação JWT
```

Sempre utilizar commits de 1 linha, dividir em vários commits quando for necessário, caso esteja implementando uma tarefa pai, commits de filhas devem conter o TASK_MANAGER_KEY das filhas.

### 3. Branch de Destino

O MR deve ser aberto para a branch especificada pelo usuário.

**Branches comuns:**
- `develop` - Para features e bugs
- `main` - Para hotfixes (com aprovação)
- `hotfix/{TASK_MANAGER_KEY}-{titulo-em-kebab-case}` - Para correções direto em produção (Apenas MRs com hotfix podem ser abertos diretamente para a branch main
sempre utiliza a branch main)

---


## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. VALIDAR → Testes passando, lint OK                      │
│        ↓                                                    │
│  2. CRIAR BRANCH → {TASK_MANAGER_KEY}-{titulo}                      │
│        ↓                                                    │
│  3. STAGE → git add (arquivos específicos)                  │
│        ↓                                                    │
│  4. COMMIT → Mensagem padronizada                           │
│        ↓                                                    │
│  5. PUSH → Enviar para remote                               │
│        ↓                                                    │
│  6. CRIAR MR (desenvolvedor) → Com template preenchido      │
│        ↓                                                    │
│  7. ATUALIZAR JIRA (desenvolvedor) → Mover para "In Review" │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Comportamento Esperado

### Fase 1: Validação

1. **Executar testes**
   ```bash
   npm test  # ou comando do projeto
   ```

2. **Verificar lint**
   ```bash
   npm run lint  # ou comando do projeto
   ```

3. **Verificar build**
   ```bash
   npm run build  # ou comando do projeto
   ```

**Se qualquer validação falhar**, corrigir antes de prosseguir.

### Fase 2: Criação da Branch

1. **Obter informações do Jira**
   - TASK_MANAGER_KEY (ex: `TASK-123`)
   - Título da tarefa

2. **Criar branch**
   ```bash
   git checkout -b {TASK_MANAGER_KEY}-{titulo-kebab-case}
   ```

3. **Confirmar criação**
   ```bash
   git branch --show-current
   ```

### Fase 3: Stage e Commit

1. **Adicionar arquivos específicos** (NUNCA usar `git add .`)
   ```bash
   git add {arquivo1} {arquivo2} ...
   ```

2. **Criar commit**
   ```bash
   git commit -m "{TASK_MANAGER_KEY} {tipo}({escopo}): {descrição}"
   ```

### Fase 4: Push

1. **Enviar para remote**
   ```bash
   git push -u origin {nome-da-branch}
   ```

### Fase 5: Criar Merge Request

1. **Preencher template do MR** com:
   - Descrição clara do objetivo
   - Link para o card do Jira
   - Lista de mudanças realizadas
   - Testes executados
   - Checklist de revisão

2. **Definir branch de destino** (conforme solicitado pelo usuário)

3. **Criar MR** fica a cargo do desenvolvedor criar o MR da branch de origem para a destino, você pode retornar o link rápido de criação do MR do gitlab.

### Fase 6: Atualizar Jira

1. Desenvolvedor deve mover o card para "In Review"

---

## Template do Merge Request

O MR deve seguir o template em `$IDE/templates/engineering/PR-template.md`:

```markdown
## Descrição

{Objetivo claro do MR em 2-3 frases}

## Tarefas Relacionadas

- [x] [{TASK_MANAGER_KEY}]({TASK_MANAGER_URL_BASE}/browse/{TASK_MANAGER_KEY})

## Mudanças Propostas

- {Mudança 1}
- {Mudança 2}
- {Mudança N}

## Testes Realizados

- {Tipo de teste}: {Resultado}
- Unitários: ✅ Passando
- Lint: ✅ OK

## Revisores

- @{revisor1}
- @{revisor2}

## Checklist de Revisão

- [x] As mudanças estão alinhadas com os requisitos da tarefa do Jira
- [x] Os testes foram executados e passaram
- [x] O código segue as convenções de estilo
- [ ] A documentação foi atualizada (se necessário)
```

---

## Regras de Segurança

### ⛔ NUNCA FAÇA

- ❌ `git add .` (adiciona arquivos indesejados)
- ❌ Commitar arquivos de configuração local
- ❌ Commitar credenciais ou tokens
- ❌ Mencionar AI/Claude no PR
- ❌ [!IMPORTANT] PUSH DIRETO PARA `main`/`dev`

### ✅ SEMPRE FAÇA

- ✅ Adicionar arquivos específicos
- ✅ Verificar `git status` antes do commit
- ✅ Usar mensagens de commit descritivas
- ✅ Referenciar o TASK_MANAGER_KEY no commit
- ✅ **Limpar sessão após criar MR**

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Branch sem padrão**
   - ❌ `feature/login`
   - ✅ `TASK-123-implementar-login`

2. **Commit genérico**
   - ❌ `fix bug`
   - ✅ `fix(auth): corrigir validação de token expirado`

3. **Adicionar tudo**
   - ❌ `git add .`
   - ✅ `git add src/auth.ts src/auth.test.ts`

4. **Esquecer referência**
   - ❌ Commit sem TASK_MANAGER_KEY
   - ✅ Commit começando com `TASK-123`

---

## Checklist de Conclusão

Antes de considerar o PR completo:

- [ ] Testes passando com cobertura maior 80%
- [ ] Lint OK
- [ ] Build OK
- [ ] Branch criada no padrão `{TASK_MANAGER_KEY}-{titulo}`
- [ ] Arquivos adicionados individualmente (não `git add .`)
- [ ] Commit com mensagem padronizada
- [ ] Commit referencia o TASK_MANAGER_KEY
- [ ] Push realizado
- [ ] MR criado com template preenchido
- [ ] Branch de destino correta
- [ ] Card do Jira movido para "In Review"
- [ ] Comentários de code review processados
- [ ] **Sessão limpa** (`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` removida)

---

## Limpeza da Sessão

### Por que limpar?

1. **Evitar poluição**: Sessões antigas ocupam espaço e confundem
2. **Fonte da verdade**: A documentação oficial está no Jira e no MR
3. **Organizacão**: Manter apenas sessões ativas

### O que é removido?

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
├── architecture.md    → Removido
├── plan.md            → Removido
└── context.md         → Removido (se existir)
```

### Onde a documentação permanece?

- **Card do Jira**: Tech spec anexada, comentários
- **Merge Request**: Descrição, histórico de commits
- **Código**: Comentários inline, docstrings

### Comando de limpeza

```bash
rm -rf $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
```
