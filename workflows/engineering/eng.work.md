---
description: Fluxo de implementação de código (commit por fase, SEM push nem PRs)
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.work-rules.md"
template_file: "$IDE/templates/engineering/work-progress-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: very_high
model_justification: Implementação de código requer máxima precisão, entendimento profundo do codebase e geração de código de alta qualidade
---

# Engineer Work

Este comando executa a **implementação de código** seguindo o plano de execução.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.work-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 📤 **Template**: `$IDE/templates/engineering/work-progress-template.md`

> ⚠️ **IMPORTANTE**: Este workflow é para codificação com commits incrementais por fase.
> **NÃO crie PRs, NÃO faça push**, mas **FAZ commit ao final de cada fase validada.**

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Fase 0 › 0.1 Verificar ou Gerar Contexto da Sessão | `/jarvis-context-detect` | Se `ENABLE_CDD=true` e o `context.md` não existir (obrigatório antes da Fase 1) |
| Fase 0.5: Comentário no card — Início | `/eng-global-task-comment` | Se `TASK_MANAGER` estiver preenchido (freelance pula) |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-frontend` (via `eng.specializations-rules.md`) | Se o domínio da feature for frontend (componentes, UI, estado, estilos, bundle, a11y); a regra também carrega `FRONTEND_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-backend` (via `eng.specializations-rules.md`) | Se o domínio da feature for backend (endpoints, auth, workers, filas, cache, banco, integrações); a regra também carrega `BACKEND_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-automation` (via `eng.specializations-rules.md`) | Se o domínio da feature for RPA, scraping, extração de dados, ETL ou parsing; a regra também carrega `AUTOMATION_SPECIALIZATIONS` |
| Fase 3 › 3.1 Implementar Código (skill de domínio) | `/eng-platform` (via `eng.specializations-rules.md`) | Se o domínio da feature for infraestrutura (IaC, contêineres, CI/CD, observabilidade, SRE, custo); a regra também carrega `PLATFORM_SPECIALIZATIONS` |
| Fase 3 › 3.3.1 Identificar Gaps de Teste | `eng.qa.test-planner` (agente) | Sempre, depois de implementar o código da fase |
| Fase 3 › 3.3.2 Implementar Testes Faltantes (Opção A) | `eng.qa.testing-engineer` (agente) | Se o test-planner identificar gaps e a estratégia do `architecture.md` seção 6.5 indicar testes manuais (unitário/integração) |
| Fase 3 › 3.3.2 Implementar Testes Faltantes (Opção B) | `/eng-qa` | Se a estratégia do `architecture.md` seção 6.5 indicar uma especialização registrada em `QA_SPECIALIZATIONS` |
| Fase 6 › 6.2 Se Todas as Fases Foram Concluídas | `/eng-global-task-comment` | Se `TASK_MANAGER` estiver preenchido e todas as fases estiverem concluídas (freelance pula) |

---

## Regra de Execução Máxima

Este workflow respeita o limite `MAX_AI_EXECUTION_PERCENTAGE` do `ENV.md`, conforme `$RULES_FOLDER/engineering/eng-rules.md` (cálculo sobre o to-do do `plan.md`; ao atingir o limite, parar, reportar e aguardar o usuário).

---

## Entrada

<task_manager_key>
#$ARGUMENTS
</task_manager_key>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Seguir `$IDE/rules/engineering/eng.integrations-rules.md`.

**Se não receber argumentos**, perguntar e **aguardar**:

- `TASK_MANAGER` vazio → *Qual o seu número de controle para esta tarefa? (ex: F-042)*
- `TASK_MANAGER` preenchido → *Qual o id do card no {TASK_MANAGER}?*

---

## Fase 0: Análise de Contexto (CDD)

> 🎯 **Objetivo**: Adaptar o rigor de implementação e validação com base no contexto real.
> ⚙️ **Configurável**: Controlada pela variável `ENABLE_CDD` no ENV.md

**Verificação de Ativação:**

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou não definida → **Pular esta fase** e usar comportamento padrão (Fase 1)
- Se `ENABLE_CDD=true` → Executar obrigatoriamente os passos 0.1 e 0.2 abaixo

### 0.1 Verificar ou Gerar Contexto da Sessão

**OBRIGATÓRIO quando `ENABLE_CDD=true`**: verificar se `context.md` já existe:

```bash
cat $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md 2>/dev/null
```

- Se **existir** → ler o `CONTEXT_PROFILE` e continuar para 0.2
- Se **não existir** → **invocar o skill `/jarvis-context-detect {TASK_MANAGER_KEY}` agora** (não continuar sem ele)

```
/jarvis-context-detect {TASK_MANAGER_KEY}
```

> ⚠️ Não avance para a Fase 1 sem `context.md` gerado.

```yaml
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [normal|alta|baixa]
  rigor: [mínimo|padrão|alto]
  comunicacao: [didático|direto|estratégico]
  autonomia: [baixa|média|alta]
  projeto:
    testes: [existentes|ausentes]
    typescript: [strict|relaxado|ausente]
    cicd: [configurado|ausente]
```

### 0.2 Adaptar Implementação por Contexto

| Tipo | Impacto na Implementação |
|------|--------------------------|
| `hotfix` | Foco cirúrgico, skip testes extensivos, validação mínima |
| `bugfix` | Implementar fix + teste que reproduz o bug |
| `feature` | Fluxo completo com testes e validações |
| `refactor` | Testes obrigatórios antes E depois, garantir comportamento idêntico |

### 0.3 Calibração de Testes (do context.md)

Use as características do projeto detectadas:

| projeto.testes | Comportamento |
|----------------|---------------|
| `existentes` | Exigir testes para código novo, seguir padrões |
| `ausentes` | Sugerir testes, mas não bloquear |

| projeto.cicd | Comportamento |
|--------------|---------------|
| `configurado` | Executar validações locais antes de finalizar |
| `ausente` | Alertar sobre ausência de validação automática |

### 0.4 Ajuste de Autonomia (do context.md)

| autonomia | Comportamento na Implementação |
|-----------|--------------------------------|
| `alta` | Implementar fase completa, pausar apenas entre fases |
| `média` | Implementar, pausar em decisões de design |
| `baixa` | Apresentar cada arquivo antes de criar, aguardar aprovação |

> 💡 O contexto é herdado do `eng.start` e não precisa ser re-apresentado ao usuário.

---

## Fase 0.5: Comentário no card — Início

Pular se `TASK_MANAGER` estiver vazio (freelance).

Antes de iniciar a implementação, registrar início:

```
/eng-global-task-comment {TASK_MANAGER_KEY} ⚙️ [Jarvis] Iniciando implementação - Fase {N} do plano
```

> Usa o skill `/eng-global-task-comment`. Não bloquear se falhar.

---

## Fase 1: Leitura da Sessão

### 1.1 Carregar Arquivos

Leia os arquivos da sessão em `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`:

1. **`context.md`** - CONTEXT_PROFILE com calibrações (gerado por `/jarvis-context-detect`)
2. **`architecture.md`** - Entender decisões arquiteturais
3. **`plan.md`** - Identificar fase atual e tarefas

### 1.2 Identificar Fase Atual

Procure no `plan.md`:

- Fase marcada como `[Em Progresso ⏰]`
- Se nenhuma, identifique a primeira `[Não Iniciada ⏳]`

---

## Fase 2: Planejamento da Implementação

### 2.1 Apresentar Plano de Abordagem

Apresente ao usuário:

```
📋 PLANO DE IMPLEMENTAÇÃO - Fase {N}

🎯 Objetivo:
{objetivo da fase}

📝 Tarefas:
1. {tarefa_1} → {arquivo}
2. {tarefa_2} → {arquivo}
3. {tarefa_3} → {arquivo}

📁 Arquivos a criar:
- {arquivo_novo_1}
- {arquivo_novo_2}

✏️ Arquivos a modificar:
- {arquivo_existente_1}
- {arquivo_existente_2}

⚠️ Pontos de atenção:
- {risco_ou_decisão}
```

### 2.2 Aguardar Aprovação

**PARE e aguarde confirmação do usuário antes de implementar.**

Se o usuário tiver sugestões, ajuste o plano.

---

## Fase 3: Implementação

### 3.1 Implementar Código

**Skill de domínio (condicional)**: antes de implementar, identifique o domínio da feature e consulte o skill correspondente para padrões e boas práticas:

| Domínio | Indicadores | Skill |
|---------|-------------|-------|
| Frontend | componentes, UI, estado, estilos, bundle, a11y | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área frontend: `eng-frontend` + `FRONTEND_SPECIALIZATIONS`) |
| Backend | endpoints, auth, workers, filas, cache, banco, integrações | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área backend: `eng-backend` + `BACKEND_SPECIALIZATIONS`) |
| Automation (RPA & Web) | RPA, web scraping, Puppeteer, extração de dados, ETL, parsing | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área automation: `eng-automation` + `AUTOMATION_SPECIALIZATIONS`) |
| Platform (infra) | IaC, contêineres/orquestração, pipeline de CI/CD, observabilidade, SRE, custo de nuvem | regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) (área platform: `eng-platform` + `PLATFORM_SPECIALIZATIONS`) |

Para cada tarefa da fase:

1. **Analisar contexto**
   - Verificar arquivos similares no projeto
   - Entender padrões utilizados

2. **Implementar**
   - Seguir convenções do projeto
   - Criar código limpo e documentado
   - Adicionar comentários explicativos

3. **Criar testes**
   - Testes unitários para cada função/método
   - Cobrir casos de sucesso e erro

### 3.2 Executar Validações Locais

Após implementar:

```bash
# Executar testes
npm test # ou comando do projeto

# Verificar lint
npm run lint # ou comando do projeto

# Verificar build
npm run build # ou comando do projeto
```

### 3.3 Análise e Implementação de Testes

Após implementar o código da fase, execute o ciclo de testes:

#### 3.3.1 Identificar Gaps de Teste

Invoque o agente [eng.qa.test-planner]($IDE/agents/engineering/qa/eng.qa.test-planner.md) para:

- Analisar o código implementado na fase
- Identificar funções/métodos sem cobertura de teste
- Mapear casos de borda não cobertos
- Gerar relatório de gaps em `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`

#### 3.3.2 Implementar Testes Faltantes

Se o test-planner identificar gaps, escolha a abordagem baseada na **estratégia definida no `architecture.md` seção 6.5**:

**Opção A: Testes manuais (unitário/integração tradicional)**

Invoque o agente [eng.qa.testing-engineer]($IDE/agents/engineering/qa/eng.qa.testing-engineer.md) para:

- Escrever testes unitários/integração para código novo
- Cobrir casos de sucesso e erro identificados
- Seguir padrões de teste do projeto (Jest, Vitest, pytest, etc.)
- Garantir cobertura mínima definida na estratégia

**Opção B: Especialização registrada em QA_SPECIALIZATIONS**

Se a estratégia de testes (definida pelo `test-architect` no `eng.start`) indicar uma ferramenta de geração/execução automatizada, use a especialização registrada em `QA_SPECIALIZATIONS` (via a base [eng-qa]($IDE/skills/eng-qa/SKILL.md)) para o escopo do diff da fase.

**Quando usar cada opção:**

| Cenário | Usar |
|---------|------|
| Testes unitários de funções/classes | testing-engineer |
| Fluxo com ferramenta automatizada já registrada em `QA_SPECIALIZATIONS` | a especialização registrada |
| Sem especialização registrada | testing-engineer |

> ⚠️ **Importante**: Consulte `architecture.md` seção 6.5 para ver qual abordagem foi definida pelo test-architect.

#### 3.3.3 Revalidar

Após implementar os testes:

```bash
# Executar todos os testes
npm test # ou comando do projeto

# Verificar cobertura
npm run test:coverage # se disponível
```

> 💡 **Fluxo**: Implementa código → test-planner (gaps) → testing-engineer OU especialização de `QA_SPECIALIZATIONS` (implementa) → valida

---

## Fase 4: Validação com Usuário

### 4.1 Apresentar Resultado

```
✅ IMPLEMENTAÇÃO CONCLUÍDA - Fase {N}

📁 Arquivos criados:
- {arquivo_1} (+XX linhas)
- {arquivo_2} (+YY linhas)

✏️ Arquivos modificados:
- {arquivo_3} (+XX -YY linhas)

🧪 Testes:
- Unitários: ✅ Passando
- Lint: ✅ OK
- Build: ✅ OK

📝 Decisões tomadas:
- {decisão_1}: {justificativa}

❓ Aguardando sua validação para atualizar o plan.md
```

### 4.2 Iterar se Necessário

Se o usuário solicitar mudanças:

- Fazer ajustes
- Revalidar testes
- Apresentar novamente

---

## Fase 5: Atualização do plan.md

### 5.1 Commit da Fase (Gitflow)

Após aprovação do usuário, commitar as mudanças desta fase:

#### 5.1.1 Determinar Layer e Scope

Com base nos arquivos modificados na fase, identificar:

| Layer | Indicadores |
|-------|-------------|
| `Backend` | controllers, services, repositories, workers, queues, migrations |
| `Frontend` | components, pages, hooks, styles, assets |
| `Fullstack` | mudanças em ambas as camadas |
| `Infra` | CI/CD, Docker, configs de infraestrutura |
| `Tests` | apenas arquivos de teste |
| `Docs` | apenas documentação |

**Scope**: nome do módulo/serviço principal afetado (ex: `account-api`, `auth-module`, `dashboard`)

#### 5.1.2 Adicionar Arquivos Específicos

> ⚠️ **NUNCA use `git add .`**

```bash
git status  # Ver arquivos alterados pela fase
git add {arquivo1} {arquivo2} ...  # Adicionar apenas os da fase atual
```

#### 5.1.3 Criar Commit

**Formato obrigatório:**

```
{TASK_MANAGER_KEY} [{Layer}][{scope}] {título da fase}
```

**Exemplos:**

```bash
git commit -m "PLAT-202 [Backend][account-api] Implementar autenticação JWT"
git commit -m "PLAT-202 [Frontend][auth-module] Adicionar formulário de login"
git commit -m "BUG-89 [Backend][payment-service] Fix: null pointer no processamento"
```

**Comando:**

```bash
git commit -m "{TASK_MANAGER_KEY} [{Layer}][{scope}] {título da fase}"
```

---

### 5.3 Marcar Fase como Concluída

Atualize o `plan.md`:

1. Mudar status das tarefas para `[Completada ✅]`
2. Mudar status da fase para `[Completada ✅]`
3. Adicionar seção de comentários

### 5.4 Adicionar Comentários

```markdown
### Comentários:

- **Decisão**: {decisão tomada e por quê}
- **Mudança**: {algo que mudou em relação ao planejado}
- **Aprendizado**: {algo descoberto durante implementação}
- **Atenção**: {ponto importante para próximas fases}
```

### 5.3 Commit da Fase (GitFlow)

Após validação do usuário e atualização do `plan.md`, commitar a fase na branch atual:

```bash
# Verificar branch (deve ser a branch criada no eng.start)
git branch --show-current

# Adicionar arquivos específicos da fase (NUNCA git add .)
git add {arquivo1} {arquivo2} ... {arquivos da fase}

# Commit com mensagem padronizada
git commit -m "{TASK_MANAGER_KEY} {tipo}({escopo}): {descrição da fase}

- {mudança 1}
- {mudança 2}

Refs: {TASK_MANAGER_KEY}"
```

**Regras de commit:**
- Sempre referenciar o `TASK_MANAGER_KEY` no início e no `Refs:`
- Uma fase = um commit (agrupar todas as mudanças da fase)
- Tipo: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- **NUNCA** usar `git add .` — adicionar arquivos individualmente

**Exemplos:**

```bash
# Fase de data layer
git commit -m "TASK-123 feat(users): criar migration e schema de usuários

- Criar migration create_users_table
- Definir modelo User com validações

Refs: TASK-123"

# Fase de backend
git commit -m "TASK-123 feat(auth): implementar endpoint POST /auth/register

- Criar AuthService com validação de email e hash de senha
- Criar AuthController com endpoint de registro
- Adicionar testes unitários do AuthService

Refs: TASK-123"
```

> ⚠️ Se testes falham → **NÃO commitar**. Corrigir primeiro, depois commitar.
## Fase 6: Próximos Passos

### 6.1 Se Houver Mais Fases

```
✅ Fase {N} concluída com sucesso!

📌 Próxima fase disponível: Fase {N+1}
   - {resumo da próxima fase}

❓ Deseja iniciar a Fase {N+1}?
```

**AGUARDE confirmação antes de iniciar.**

### 6.2 Se Todas as Fases Foram Concluídas

**Comentário no card — Conclusão** (pular se freelance):

```
/eng-global-task-comment {TASK_MANAGER_KEY} ✅ [Jarvis] Implementação concluída - todas as {N} fases completadas. Commits realizados por fase.
```

```
🎉 TODAS AS FASES CONCLUÍDAS!

📁 Sessão: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
📄 Plan atualizado: plan.md ✅
🌿 Branch: {TASK_MANAGER_KEY}-{titulo} — {N} commits realizados

📊 Resumo:
- Fases completadas: {N}
- Commits realizados: {N} (um por fase)
- Arquivos criados: {X}
- Arquivos modificados: {Y}
- Testes adicionados: {Z}

📌 Próximos passos:
1. Revise o código e os commits: git log --oneline
2. Execute os testes completos do projeto
3. Execute `eng.pr` para abrir o MR para dev

⚠️ LEMBRETE: push e PR são responsabilidade do `eng.pr`.
```

## Regras Importantes

### ⛔ NÃO FAÇA

- ❌ NÃO crie Pull Requests
- ❌ NÃO faça push (`git push`) — push é responsabilidade do `eng.pr`
- ❌ NÃO use `git add .` — adicionar arquivos individualmente
- ❌ NÃO commite sem aprovação explícita do usuário na fase
- ❌ NÃO commite com testes falhando
- ❌ NÃO mova cards no Jira
- ❌ NÃO sugira "vamos fazer o PR agora"

### ✅ FAÇA SEMPRE

- ✅ Implementar código conforme plan.md
- ✅ Criar/modificar arquivos de código
- ✅ Criar testes
- ✅ Executar validações locais (lint, test, build)
- ✅ Atualizar plan.md com progresso
- ✅ Dialogar com usuário para validação
- ✅ **Commitar ao final de cada fase validada** (GitFlow — Fase 5.3)

---

## Tratamento de Situações

### Se o usuário pedir para fazer commit antes da fase estar concluída:

→ Informe que commits são feitos ao final de cada fase completa e validada (Fase 5.3)

### Se faltar o plan.md:

→ Não prossiga sem o plano

### Se houver bloqueio técnico:

→ Documente no plan.md como `[Bloqueada 🚫]`
→ Explique o bloqueio ao usuário
→ Sugira alternativas se possível
