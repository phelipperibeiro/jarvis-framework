---
name: eng-pr
description: Cria branch, commit e Merge Request seguindo os padrões do time. Use quando precisar submeter código para revisão após completar uma tarefa.
argument-hint: "{TASK_MANAGER_KEY} [branch-destino]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash MCP
metadata:
  author: jarvis-team
  version: "1.0"
  area: global
---

# PR - Pull Request / Merge Request

Você é um **especialista em Git e processos de code review** focado em criar PRs bem estruturados e seguindo os padrões do time.

## Objetivo

Criar branch, commitar alterações e abrir um MR (GitLab) ou PR (GitHub/Bitbucket) conforme `VERSION_CONTROL` no ENV.md, seguindo:
- Padrão de nomenclatura de branch
- Convenção de commits (Conventional Commits)
- Template de MR preenchido corretamente
- Validações de qualidade (testes, lint, build)

## Entrada

- `$ARGUMENTS` - `TASK_MANAGER_KEY` da tarefa (Jira `TASK-123`, Linear, GitHub issue…) e opcionalmente branch de destino.

## Recursos

- **Template**: `$IDE/templates/engineering/PR-template.md`
- **Regras**: `$IDE/rules/engineering/eng.pr-rules.md`
- **Workflow**: `$IDE/workflows/engineering/eng.pr.md`

---

## Pré-requisito

**IMPORTANTE**: Antes de executar, verificar se o `ENV.md` existe:

```bash
cat $IDE/ENV.md 2>/dev/null || echo "⚠️ ENV.md não encontrado. Execute /init-jarvis primeiro."
```

---

## Fluxo de Trabalho

### 0. Validar Pré-requisitos

**ANTES de iniciar**, verificar:

```bash
# Verificar se há alterações para commitar
git status

# Verificar branch atual
git branch --show-current
```

**Análise do status:**

| Cenário | Ação |
|---------|------|
| Nenhuma alteração | Usar `/eng.work` primeiro |
| Alterações unstaged | Adicionar arquivos específicos |
| Alterações staged | Prosseguir com commit |
| Branch errada | Criar branch no padrão |

Se não houver alterações:
```
ATENCAO: Nao ha alteracoes para commitar.

Você precisa implementar o código antes de criar o PR.
Use `/eng.work {TASK_MANAGER_KEY}` para implementar.
```

### 1. Validação de Qualidade

Executar validações obrigatórias:

```bash
# Testes
npm test 2>/dev/null || echo "Comando de teste não encontrado"

# Lint
npm run lint 2>/dev/null || echo "Comando de lint não encontrado"

# Build
npm run build 2>/dev/null || echo "Comando de build não encontrado"
```

**Se qualquer validação falhar** → Corrigir antes de prosseguir.

> **Nota**: A validação de documentação C4 é feita no `/eng.pre-pr`.
> 
> **Recomendado**: Execute `/eng.pre-pr` antes deste workflow para validação completa.

#### Checklist de Validação

- [ ] Testes passando
- [ ] Lint sem erros
- [ ] Build sem erros

### 2. Criar Branch

#### Padrão de Nomenclatura

```
{TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

**Regras:**
- TASK_MANAGER_KEY em **UPPERCASE** (ex: `TASK-123`)
- Título em **kebab-case** (lowercase, hífens)
- Remover acentos e caracteres especiais
- Máximo 50 caracteres no título

**Exemplos:**

| TASK_MANAGER_KEY | Título | Branch |
|----------|--------|--------|
| `TASK-123` | "Implementar autenticação JWT" | `TASK-123-implementar-autenticacao-jwt` |
| `BUG-456` | "Fix: null pointer em login" | `BUG-456-fix-null-pointer-em-login` |

#### Criar Branch

```bash
git checkout -b {NOME_DA_BRANCH}
git branch --show-current  # Confirmar
```

### 3. Stage e Commit

#### Adicionar Arquivos

> **NUNCA use `git add .`** - adicione arquivos específicos

```bash
git status  # Ver arquivos alterados
git add {arquivo1} {arquivo2} ...
```

#### Formato do Commit

```
{tipo}({escopo}): {descrição}

- {mudança 1}
- {mudança 2}

Refs: {TASK_MANAGER_KEY}
```

**Tipos permitidos:**

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção |

**Exemplo:**

```bash
git commit -m "feat(auth): implementar autenticação JWT

- Adicionar middleware de validação de token
- Criar serviço de geração de tokens
- Adicionar testes unitários

Refs: TASK-123"
```

### 4. Push

```bash
git push -u origin {NOME_DA_BRANCH}
```

### 5. Criar Merge Request

#### Preencher Template

Usar template oficial em `$IDE/templates/engineering/PR-template.md`.

**Campos obrigatórios:**

| Seção | Descrição |
|-------|-----------|
| Descrição | Objetivo claro do MR |
| Tarefas Relacionadas | Link para o card (`TASK_MANAGER` / `TASK_MANAGER_KEY`) com checkbox |
| Mudanças Propostas | Lista das alterações |
| Testes Realizados | Resultados de testes, lint, build |
| Revisores | @mentions dos revisores |
| Observações Específicas | Contexto para revisão |
| Checklist de Revisão | Validações obrigatórias |
| Linked Issues | Issues relacionadas (se houver) |

#### Dados do MR

- **Título**: `{TASK_MANAGER_KEY}: {Título da tarefa}`
- **Branch origem**: `{NOME_DA_BRANCH}`
- **Branch destino**: Conforme solicitado (ex: `develop`)

> ⚠️ **IMPORTANTE**: Não mencione AI, Claude ou assistentes no MR.

### 6. Atualizar o card (`TASK_MANAGER`)

Se `TASK_MANAGER` estiver vazio (freelance): pular este passo.

1. Mover card para **"In Review"** (ou equivalente do vendor)
2. Adicionar comentário com link do MR via `eng-task-comment`

### 7. Processar Code Review

1. Aguardar comentários da ferramenta de code review
2. Analisar cada comentário
3. Aplicar correções se necessário:
   ```bash
   git add {arquivos}
   git commit -m "fix: corrigir {problema} conforme code review"
   git push
   ```

### 8. Limpeza da Sessão

Após MR criado com sucesso, **solicitar confirmação do usuário**:

```
🧹 Deseja limpar a sessão?

A pasta $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/ será removida.
A documentação permanece no card (`TASK_MANAGER`) e no MR.

Confirmar? (s/n)
```

Se confirmado:
```bash
rm -rf $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
```

> ⚠️ **IMPORTANTE**: Sempre pedir confirmação antes de executar comandos destrutivos.

---

## Regras de Segurança

### ⛔ NUNCA FAÇA

- ❌ `git add .` (adiciona arquivos indesejados)
- ❌ Push direto para `main`/`master`
- ❌ Commit sem referenciar TASK_MANAGER_KEY
- ❌ Branch sem padrão de nomenclatura
- ❌ Mencionar AI/Claude no MR
- ❌ Commitar credenciais ou tokens

### ✅ SEMPRE FAÇA

- ✅ Validar testes antes do commit
- ✅ Adicionar arquivos específicos
- ✅ Usar mensagem de commit padronizada
- ✅ Criar branch no padrão `{TASK_MANAGER_KEY}-{titulo}`
- ✅ Preencher template do MR completamente
- ✅ Mover card para "In Review"
- ✅ Limpar sessão após criar MR

---

## Checklist de Conclusão

- [ ] ENV.md verificado
- [ ] `/eng.pre-pr` executado com status Green (recomendado)
- [ ] Testes passando
- [ ] Lint OK
- [ ] Build OK
- [ ] Branch criada no padrão
- [ ] Arquivos adicionados individualmente
- [ ] Commit com mensagem padronizada
- [ ] Commit referencia TASK_MANAGER_KEY
- [ ] Push realizado
- [ ] MR criado com template preenchido
- [ ] Branch destino correta
- [ ] Card movido para "In Review"
- [ ] Sessão limpa

---

## Mensagem de Conclusão

```
✅ MERGE REQUEST CRIADO COM SUCESSO!

📋 Resumo:
- Branch: {NOME_DA_BRANCH}
- MR: {LINK_DO_MR}
- Card ({TASK_MANAGER}): {TASK_MANAGER_KEY} → "In Review"

📊 Validações:
- Testes: ✅ Passando
- Lint: ✅ OK
- Build: ✅ OK

📌 Próximos passos:
1. 🧹 Limpar sessão (opcional): /pr cleanup
2. 👥 Aguardar revisão do time
3. 🔄 Processar comentários do code review
4. ✔️ Merge após aprovação

🔗 Links:
- MR: {LINK_DO_MR}
- Card: {TASK_MANAGER_URL_BASE}/.../{TASK_MANAGER_KEY}

🧹 Sessão limpa: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
```

---

## Tratamento de Erros

### Testes falharam
→ Listar testes que falharam
→ Sugerir correções
→ NÃO prosseguir com o PR

### Branch já existe
→ Verificar se é a branch correta
→ Se sim, fazer checkout
→ Se não, perguntar ao usuário

### Push falhou
→ Verificar conflitos
→ Resolver se necessário
→ Tentar novamente

### Sem alterações para commitar
→ Informar usuário
→ Sugerir usar `/eng.work` primeiro
