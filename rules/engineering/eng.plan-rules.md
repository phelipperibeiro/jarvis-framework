---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow Plan (Planejamento de Execução)

## Propósito

O workflow `plan` tem como objetivo **criar um plano de execução detalhado e faseado** que permita implementar a feature de forma incremental e retomável.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

> Esta regra é executada **antes de qualquer ação**. Se qualquer condição falhar, o workflow para imediatamente.

### Regra 0.1 — TASK_MANAGER_KEY obrigatório

Ler `TASK_MANAGER` do ENV.md. Ver `eng.integrations-rules.md` (freelance vs board).

Se `$ARGUMENTS` não trouxer o key: **perguntar e aguardar**. Não inventar. Não exigir `XXX-000`.

- Freelance (`TASK_MANAGER` vazio): *Qual o seu número de controle para esta tarefa?*
- Com board: *Qual o id do card no {TASK_MANAGER}?*

Sem resposta → **PARAR**. Com resposta → seguir (pasta/branch em lowercase).

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

## ⚠️ REGRA CRÍTICA: SOMENTE PLANEJAMENTO

> **Este workflow é EXCLUSIVAMENTE para criar o `plan.md`.**
> 
> **NÃO é permitido:**
> - ❌ Escrever código
> - ❌ Criar arquivos de código (.ts, .js, .py, etc.)
> - ❌ Modificar arquivos existentes do projeto
> - ❌ Executar comandos de build/test
> - ❌ Fazer commits ou criar branches
> - ❌ Iniciar implementação
>
> **O ÚNICO artefato permitido é o arquivo `plan.md`.**

Se o usuário pedir para começar a implementação, responda:

```
⏸️ O workflow `plan` é apenas para planejamento.

Para implementar o código, use o workflow `work`:
→ eng.work {TASK_MANAGER_KEY}
```

---

## Princípios Fundamentais

### 1. Localização do Arquivo

O arquivo `plan.md` deve ser criado em:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/plan.md
```

Onde `{TASK_MANAGER_KEY}` é o ID do card em **lowercase** (ex: `TASK-123` → `task-123`).

### 2. Pré-requisito

Antes de criar o `plan.md`, o arquivo `architecture.md` **DEVE existir** na mesma pasta da sessão. Se não existir, execute o workflow `start` primeiro.

---

## Estrutura do Plano

### Fases

O plano deve ser dividido em **fases incrementais**, onde cada fase:

- Pode ser executada por um desenvolvedor em **1 hora** (máximo)
- Entrega valor testável
- Não quebra o sistema durante a implementação
- Permite retomar o trabalho se a sessão for interrompida

### Tarefas dentro das Fases

Cada fase contém tarefas que:

- São específicas e acionáveis
- Possuem critério de conclusão claro
- Indicam dependências (sequencial ou paralelo)
- Incluem detalhes de implementação

---

## Status das Fases e Tarefas

### Indicadores de Status

| Status | Emoji | Uso |
|--------|-------|-----|
| Completada | ✅ | Fase/tarefa finalizada e testada |
| Em Progresso | ⏰ | Fase/tarefa sendo executada agora |
| Não Iniciada | ⏳ | Fase/tarefa ainda não começada |
| Bloqueada | 🚫 | Fase/tarefa com impedimento |

### Regras de Status

1. **Apenas UMA fase** pode estar `Em Progresso ⏰` por vez
2. **Apenas UMA tarefa** pode estar `Em Progresso ⏰` dentro de uma fase
3. Marcar como `Completada ✅` somente após verificação
4. Usar `Bloqueada 🚫` quando houver dependência externa

---

## Fluxo de Criação do Plano

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. LER ARCHITECTURE.MD                                     │
│        ↓                                                    │
│  2. ANALISAR ESCOPO → Entender requisitos e restrições      │
│        ↓                                                    │
│  3. PESQUISAR → Buscar arquivos relevantes no código        │
│        ↓                                                    │
│  4. DIVIDIR EM FASES → Incrementos de ~1 hora               │
│        ↓                                                    │
│  5. DETALHAR TAREFAS → Específicas e acionáveis             │
│        ↓                                                    │
│  6. IDENTIFICAR DEPENDÊNCIAS → Sequencial vs paralelo       │
│        ↓                                                    │
│  7. CRIAR PLAN.MD → Usando o template                       │
│        ↓                                                    │
│  8. VALIDAR COM HUMANO → Confirmar antes de prosseguir      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Comportamento Esperado

### Fase 1: Análise do Architecture.md

1. **Ler** o arquivo `architecture.md` da sessão
2. **Extrair**:
   - Objetivo da feature
   - Requisitos funcionais e não-funcionais
   - Decisões arquiteturais
   - Restrições técnicas
   - Dependências externas

### Fase 2: Pesquisa no Codebase

1. **Identificar** arquivos existentes que serão modificados
2. **Buscar** padrões similares já implementados
3. **Analisar** estrutura atual do projeto
4. **Documentar** descobertas relevantes

### Fase 3: Divisão em Fases

1. **Agrupar** trabalho em incrementos lógicos
2. **Garantir** que cada fase:
   - Seja independentemente testável
   - Não quebre funcionalidades existentes
   - Possa ser commitada separadamente
3. **Ordenar** por dependências técnicas

### Fase 4: Detalhamento de Tarefas

Para cada tarefa, incluir:

- **O que fazer**: Descrição clara da ação
- **Onde fazer**: Arquivo(s) envolvido(s)
- **Como fazer**: Abordagem técnica
- **Como testar**: Verificação de conclusão

### Fase 5: Validação

1. **Apresentar** o plano ao humano
2. **Discutir** ajustes necessários
3. **Atualizar** `architecture.md` se houver mudanças arquiteturais

---

## Template do Plan.md

O arquivo deve seguir o template em `$IDE/templates/engineering/plan-template.md`.

---

## Regras de Atualização

### Durante a Execução (workflow `work`)

1. **Atualizar status** conforme progresso
2. **Adicionar comentários** sobre mudanças de direção
3. **Documentar** aprendizados importantes
4. **Registrar** bloqueios e resoluções

### Seção de Comentários

Cada fase pode ter uma seção `### Comentários:` para:

- Mudanças de direção necessárias
- Aprendizados durante a implementação
- Decisões tomadas em conjunto
- Problemas encontrados e soluções

---

## Regras de Qualidade

### ⛔ NUNCA FAÇA

- ❌ Criar `plan.md` sem ler `architecture.md`
- ❌ Fases que levam mais de 1 hora
- ❌ Tarefas vagas como "implementar feature"
- ❌ Ignorar dependências entre tarefas
- ❌ Pular a validação com o humano
- ❌ Escrever em outro idioma que não pt-BR

### ✅ SEMPRE FAÇA

- ✅ Basear o plano no `architecture.md`
- ✅ Dividir em fases de ~1 hora
- ✅ Detalhar cada tarefa com contexto
- ✅ Indicar dependências (sequencial/paralelo)
- ✅ Usar os emojis de status corretamente
- ✅ Validar o plano com o humano antes de prosseguir
- ✅ Escrever tudo em português (pt-BR)

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Fases muito grandes**
   - ❌ "Implementar todo o backend"
   - ✅ "Criar endpoint de autenticação"

2. **Tarefas vagas**
   - ❌ "Fazer os testes"
   - ✅ "Criar teste unitário para validação de token em `auth.service.spec.ts`"

3. **Sem ordem de execução**
   - ❌ Lista solta de tarefas
   - ✅ Fases numeradas com dependências claras

4. **Sem critério de conclusão**
   - ❌ "Melhorar código"
   - ✅ "Refatorar `UserService` para usar injeção de dependência - verificar com teste unitário"

---

## Checklist de Conclusão

Antes de considerar o plano completo:

- [ ] `architecture.md` foi lido e compreendido
- [ ] Pesquisa no codebase foi realizada
- [ ] Plano dividido em fases de ~1 hora
- [ ] Cada fase tem tarefas específicas
- [ ] Tarefas indicam o que, onde e como
- [ ] Dependências estão claras (sequencial/paralelo)
- [ ] Status iniciais definidos (todos ⏳)
- [ ] Conteúdo em português (pt-BR)
- [ ] Validado com o humano
- [ ] `plan.md` criado em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`

---

## Integração com Outros Workflows

### Entrada (de onde vem)

```
eng.start → architecture.md → eng.plan
```

### Saída (para onde vai)

```
eng.plan → plan.md → eng.work → código
```

### Relacionamento

| Workflow | Relação |
|----------|---------|
| `start` | Cria o `architecture.md` que é entrada do `plan` |
| `plan` | Cria o `plan.md` com fases de execução |
| `work` | Executa o `plan.md` e atualiza status |
| `pr` | Finaliza após todas as fases completadas |
