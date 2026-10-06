---
description: Planejamento de execução faseada para a feature
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.plan-rules.md"
template_file: "$IDE/templates/engineering/plan-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Planejamento detalhado requer decomposição de tarefas complexas, análise de dependências e estimativas precisas
---

# Engineer Plan

Este workflow cria um **plano de execução detalhado e faseado** para implementar a feature de forma incremental.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.plan-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.

---

## Argumentos

<arguments>
#$ARGUMENTS
</arguments>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Se o `TASK_MANAGER_KEY` não vier nos argumentos: **perguntar e aguardar** (`eng.integrations-rules.md`). Freelance → número de controle próprio.

---

## Pré-requisitos

Antes de executar este workflow:

1. O arquivo `architecture.md` **DEVE existir** em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`
2. Se não existir, peça ao usuário para executar o workflow `start` primeiro

> 📁 **Padrão de pasta**: `{TASK_MANAGER_KEY}` é o ID do card em **lowercase** (ex: `TASK-123` → `task-123`)

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Fase 0 › 0.1 Herdar Contexto da Sessão | `/jarvis-context-detect` | Se `ENABLE_CDD=true` e o `context.md` não existir |
| Fase 2: Pesquisa no Codebase | `repoprompt` (MCP: `search`, `read_selected_files`) | Para buscar e ler arquivos relevantes do codebase |
| Fase 2: Pesquisa no Codebase (se necessário) | `context7` (MCP) | Se for preciso consultar a documentação de bibliotecas |
| Fase 3: Criação do Plano (exceção) | `eng.advisor.agent` (agente) | Só por exceção: questão nova em aberto, com o Advisor habilitado no `eng.start` (cabeçalho do `architecture.md`) |
| Fase 3: Criação do Plano (exceção) | `/eng-global-task-comment` | Só por exceção: comentário de auditoria da questão nova consultada ao Advisor (freelance pula) |

---

## Fluxo de Execução

### Fase 0: Análise de Contexto (CDD)

> 🎯 **Objetivo**: Adaptar a granularidade e rigor do plano com base no contexto.
> ⚙️ **Configurável**: Esta fase é opcional e controlada pela variável `ENABLE_CDD` no ENV.md

**Verificação de Ativação:**

Antes de herdar o contexto, verifique se o CDD está habilitado:

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou não definida → **Pular esta fase** e usar comportamento padrão (Fase 1)
- Se `ENABLE_CDD=true` → Herdar contexto normalmente

Antes de criar o plano, herde o contexto da sessão (se CDD estiver habilitado):

#### 0.1 Herdar Contexto da Sessão

Leia o `CONTEXT_PROFILE` do arquivo `context.md` (gerado pelo `/jarvis-context-detect`):

```bash
# Localização: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md
```

```
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [normal|alta|baixa]
  rigor: [mínimo|padrão|alto]
  comunicacao: [didático|direto|estratégico]
  autonomia: [baixa|média|alta]
```

> Se `context.md` não existir, verifique o `architecture.md` ou execute `/jarvis-context-detect {TASK_MANAGER_KEY}`

#### 0.2 Calibração do Plano por Tipo

| Tipo | Ajuste no Plano |
|------|-----------------|
| `hotfix` | 1-2 fases máximo, foco cirúrgico, skip de testes extensivos |
| `bugfix` | 2-3 fases, incluir fase de teste que reproduz o bug |
| `feature` | Fases completas (~1h cada), todas as validações |
| `refactor` | Fase 0 obrigatória de testes antes de qualquer mudança |

#### 0.3 Granularidade por POSITION

| POSITION | Granularidade do Plano |
|----------|------------------------|
| `junior`, `pleno` | Mais detalhado, passos menores, mais checkpoints |
| `senior`, `staff` | Fases maiores, menos micro-gerenciamento |
| `tech-lead` | Visão estratégica, delegar detalhes |

#### 0.4 Autonomia por MAX_AI_EXECUTION_PERCENTAGE

| Valor | Comportamento no Planejamento |
|-------|-------------------------------|
| `>= 80%` | Criar plano completo, validar apenas no final |
| `70-79%` | Apresentar outline, detalhar após aprovação |
| `60-69%` | Apresentar cada fase para aprovação antes de detalhar |

---

### Fase 1: Leitura do Architecture

1. **Ler** o arquivo `architecture.md` da sessão
2. **Extrair** informações essenciais:
   - Objetivo da feature
   - Requisitos funcionais e não-funcionais
   - Decisões arquiteturais
   - Restrições técnicas

### Fase 2: Pesquisa no Codebase

1. **Buscar** arquivos relevantes usando:
   - `repoprompt:search` para encontrar arquivos específicos
   - `repoprompt:read_selected_files` para ler código em batch
2. **Analisar**:
   - Padrões existentes no projeto
   - Arquivos que serão modificados
   - Dependências técnicas

3. **Pesquisar** (se necessário):
   - WebSearch para melhores práticas
   - context7 para documentação de bibliotecas

### Fase 3: Criação do Plano

1. **Dividir** o trabalho em **fases incrementais**:
   - Cada fase deve levar ~1 hora (máximo)
   - Cada fase deve ser testável independentemente
   - Fases devem ser ordenadas por dependências

2. **Detalhar** cada tarefa com:
   - **O que fazer**: Descrição clara
   - **Onde fazer**: Arquivo(s) envolvido(s)
   - **Como fazer**: Abordagem técnica
   - **Como verificar**: Critério de conclusão

3. **Incluir tarefa de testes em CADA fase** (obrigatório):
   - Cada fase DEVE ter uma tarefa `X.T Testes da Fase X`
   - Basear nos requisitos definidos em `architecture.md` seção 6.5
   - Especificar tipos de teste: unitário, integração, e2e
   - Definir cobertura mínima esperada
   - Listar o que será testado (funcionalidades da fase)

4. **Usar** o template em `$IDE/templates/engineering/plan-template.md`

**Questão nova em aberto (exceção).** O ideal é que todas as questões tenham sido levantadas no `eng.start`. Se surgir uma nova e o cabeçalho do `architecture.md` indicar um Advisor, consulte `eng.advisor.agent` com o Prompt 2 de `$IDE/templates/engineering/advisor-template.md` (refaça o Prompt 1 se o subagente não existir mais), acrescente a questão à seção 8 marcada "levantada no `eng.plan`", adote a sugestão do Advisor e poste o comentário de auditoria com `/eng-global-task-comment` (é desvio do plano; cite-o no PR como lacuna do `eng.start`). Sem Advisor, pergunte ao usuário.

### Fase 4: Validação

1. **Apresentar** o plano ao humano
2. **Discutir** ajustes necessários
3. **Atualizar** `architecture.md` se houver mudanças arquiteturais
4. **Confirmar** antes de prosseguir

---

## Saída Esperada

Arquivo criado:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/plan.md
```

Com:

- Fases numeradas e detalhadas
- Tarefas específicas com critérios de conclusão
- Dependências claras (sequencial/paralelo)
- Status iniciais definidos (⏳)

---

## Próximo Passo

Após a validação do plano com o humano, informar:

> ✅ Plano criado e validado! Pronto para executar o workflow `work` e iniciar a implementação.

---

## Regras Importantes

- ⚠️ **Consulte** as regras completas em `$IDE/rules-on-demand/engineering/eng.plan-rules.md`
- ⏱️ **Fases de ~1 hora** - Não criar fases maiores
- 🔄 **Incremental** - Cada fase deve entregar valor testável
- 🗣️ **Validar** - Sempre confirmar o plano com o humano antes de prosseguir
