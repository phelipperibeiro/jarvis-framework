> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow PR (Pull Request / Merge Request)

## Propósito

O workflow `pr` tem como objetivo **gerar o `pull-request.md` e, depois da pergunta (regra de ouro), fazer o push e abrir um Merge Request** seguindo os padrões do time.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

Antes de qualquer ação, leia `$IDE/rules-on-demand/engineering/eng.gate0-rules.md` e aplique as Regras 0.1 (chave da tarefa), 0.2 (branch protegida) e 0.3 (a branch contém a chave, no padrão da skill `eng-global-branch`). Se qualquer condição falhar, o workflow para imediatamente.

---

## Princípios Fundamentais

### 1. Padrão de Nomenclatura de Branch

O nome da branch vem da skill `eng-global-branch` (ou do fork dela no overlay da empresa): com card, a chave é obrigatória no nome; a convenção do projeto define o prefixo e o estilo (`feature/{TASK_MANAGER_KEY}-{titulo}`); sem convenção, `{TASK_MANAGER_KEY}-{titulo}`. A regra completa e os exemplos estão só na skill.

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
- `hotfix/…` (nome pela skill `eng-global-branch`) - Para correções direto em produção (Apenas MRs com hotfix podem ser abertos diretamente para a branch main
sempre utiliza a branch main)

---


## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. VALIDAR → Testes passando, lint OK                      │
│        ↓                                                    │
│  2. CRIAR BRANCH → nome da skill eng-global-branch          │
│        ↓                                                    │
│  3. STAGE → git add (arquivos específicos)                  │
│        ↓                                                    │
│  4. COMMIT → Mensagem padronizada                           │
│        ↓                                                    │
│  5. PUSH → Enviar para remote (depois da Fase 0)            │
│        ↓                                                    │
│  6. CRIAR MR (desenvolvedor) → Template, depois da Fase 0   │
│        ↓                                                    │
│  7. ORIENTAR (desenvolvedor) → Mover o card para "In Review"│
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
   git checkout -b {NOME_DA_BRANCH}   # nome montado pela skill eng-global-branch
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

O push só sai depois da escolha de publicar da Fase 0 do `eng.pr` (regra de ouro, `eng.integrations-rules.md`).

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

O texto do MR segue o template escolhido na Fase 4.1 do `eng.pr` (o do projeto, se existir; senão `$IDE/templates/engineering/PR-template.md`), preenchido com a tarefa e com o link do card pela tabela "URL do card" de `eng.integrations-rules.md`.

---

## Regras de Segurança

### ⛔ NUNCA FAÇA

- ❌ `git add .` (adiciona arquivos indesejados)
- ❌ Commitar arquivos de configuração local
- ❌ Commitar credenciais ou tokens
- ❌ Mencionar AI/Claude no PR
- ❌ Com `ARTIFACT_STYLE=human-generated`: push de commit ou PR com marca de IA ou da IDE (`Co-Authored-By` de ferramenta, "Generated with …") — conferir antes (Fase 3.0 do `eng.pr`)
- ❌ [!IMPORTANT] PUSH DIRETO PARA `main`/`dev`

### ✅ SEMPRE FAÇA

- ✅ Adicionar arquivos específicos
- ✅ Verificar `git status` antes do commit
- ✅ Usar mensagens de commit descritivas
- ✅ Referenciar o TASK_MANAGER_KEY no commit
- ✅ Gerar o `pull-request.md` na sessão e publicar só com o **Sim**

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Branch sem padrão**
   - ❌ `feature/login`
   - ✅ `feature/TASK-123-implementar-login` (com convenção) ou `TASK-123-implementar-login` (sem), pela skill `eng-global-branch`

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
- [ ] Branch criada com o nome da skill `eng-global-branch`
- [ ] Arquivos adicionados individualmente (não `git add .`)
- [ ] Commit com mensagem padronizada
- [ ] Commit referencia o TASK_MANAGER_KEY
- [ ] Push realizado (só com o Sim)
- [ ] MR criado a partir do `pull-request.md` (só com o Sim)
- [ ] Branch de destino correta
- [ ] Card do Jira movido para "In Review"
- [ ] Comentários de code review processados
- [ ] `pull-request.md` aprovado na sessão (e publicado, se o usuário respondeu Sim)
- [ ] Pergunta "O PR já foi aprovado e mergeado?" no fim (Sim → `/eng.spec-consolidate`)
- [ ] `daily.md` gerado ou atualizado e aprovado (com ou sem PR publicado), com a linha de timesheet na mensagem final

---

## Sessão e publicação

- O texto do PR fica em **`$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/pull-request.md`**, aprovado pelo usuário.
- **Publicar (push + MR/PR) só com a escolha "Revisar o texto e publicar" (depois da aprovação do texto) ou "Publicar sem revisar o texto"** da Fase 0 (`eng.transitions-rules.md`). Com "Só gerar os arquivos" (na Fase 0 ou no `[Só gerar os arquivos]` da revisão do texto), o arquivo fica na sessão e nada é enviado.
- **A sessão nunca é apagada por este comando:** o `/eng.spec-consolidate`, que roda depois do merge, precisa do `architecture.md`, do `plan.md`, do `gate-checklist.md` (com as rodadas anteriores `gate-checklist-rodada-{N}.md`, se houver) e do `pull-request.md`. A pessoa apaga à mão quando quiser.

## daily.md (registro do esforço)

- Gerado na Conclusão do `eng.pr`, em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/daily.md`, **com ou sem PR publicado**, para não passar batido quando o PR é aberto à mão. Se houver PR (o criado nesta execução ou o já aberto da branch), preencher o campo `pr`; sem PR, deixá-lo vazio.
- **Sempre perguntar a data** (hoje ou retroativa) com `AskUserQuestion`.
- **Período de mais de um dia:** antes de contar os dias trabalhados, perguntar sobre sábado/domingo trabalhados, feriados e outros dias não trabalhados (o usuário informa as datas).
- ***Post mortem*:** automático com `tipo: bugfix|hotfix` no `context.md` ou com mais de 1 dia trabalhado; nos outros casos, perguntar Sim/Não.
- **Nova execução** (`daily.md` já existe): perguntar a origem da mudança.
  - **Ajuste do próprio usuário:** focar no que foi entregue, sem citar troca de escopo nem retrabalho.
  - **Pedido da liderança:** documentar o que mudou, quem pediu e o impacto.
- **Formato fixo** (`templates/engineering/daily-template.md`): uma seção `## AAAA-MM-DD` com "Descrição detalhada" e "Timesheet" (uma linha).
- **Revisão conjunta:** mostrar a descrição e a linha de timesheet juntas, com `[Aprovar]`/`[Ajustar]`; ajustar as duas juntas até aprovar.
- **Nunca publicar** o `daily.md` e nunca incluir e-mails, tokens nem valores de variáveis.

