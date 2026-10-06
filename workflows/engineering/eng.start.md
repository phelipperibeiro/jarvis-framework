---
description: Inicia o planejamento de uma tarefa criando o architecture.md
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules-on-demand/engineering/eng.start-rules.md"
template_file: "$IDE/templates/engineering/architecture-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Requer análise arquitetural profunda, investigação de codebase e raciocínio complexo para criar documentação técnica de qualidade
---

# start

Este comando inicia o **planejamento** de uma nova feature.

> 📋 **Rules**: `$IDE/rules-on-demand/engineering/eng.start-rules.md` — **antes de começar, leia esse arquivo e siga-o**: ele não é carregado automaticamente no início da sessão.
> 📤 **Template**: `$IDE/templates/engineering/architecture-template.md`

> ⚠️ **IMPORTANTE**: Este workflow é APENAS para planejamento e documentação.
> **NÃO execute código, NÃO crie arquivos de código, NÃO faça commits.**
> O único artefato a ser criado é o `architecture.md`.

### Skills invocados durante o workflow

| Passo | Skill | Condição |
|-------|-------|----------|
| Cabeçalho (agente) | `eng.agent` (agente) | Sempre — identidade do workflow |
| Fase 0.1: Análise de Contexto (CDD) | `/jarvis-context-detect` | Se `ENABLE_CDD=true` no ENV.md (execução obrigatória antes da Fase 1); `ENABLE_CDD=false` pula |
| Fase 0.5: Advisor (opcional) | `eng.advisor.agent` (agente) | Se o usuário escolher usar o Advisor no alerta e o `architecture.md` tiver questões em aberto (aberto só na primeira questão) |
| Fase 2.2: Buscar Documentação Central | `/jarvis-docs-central` | Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md (buscar PRD, ARD e RFCs relacionados) |
| Fase 3.4: Estratégia de Testes | `eng.qa.test-architect` (agente) | Se a feature tiver requisitos de performance ou segurança (APIs públicas, dados sensíveis, alta carga ou requisitos não-funcionais explícitos) |
| Fase 3.4: Estratégia de Testes | `/eng-platform` | Se a feature tiver requisitos de performance (latência, throughput, escalabilidade) |
| Fase 3.4: Estratégia de Testes | `/eng-ai` | Se a feature envolver IA (LLM, RAG, agentes, chatbots, embeddings) |
| Fase 3.4: Estratégia de Testes | `/eng-frontend` (via `eng.specializations-rules.md`) | Se a feature envolver interface ou componentes frontend; a regra também carrega as especializações de `FRONTEND_SPECIALIZATIONS` |
| Fase 3.4: Estratégia de Testes | `/eng-backend` (via `eng.specializations-rules.md`) | Se a feature envolver APIs, autenticação ou workers backend; a regra também carrega as especializações de `BACKEND_SPECIALIZATIONS` |
| Fase 3.4: Estratégia de Testes | `/eng-data` (via `eng.specializations-rules.md`) | Se a feature envolver engenharia de dados (pipelines ETL/ELT, Glue, Airflow, contratos de dados, camadas bronze/silver/gold); a regra também carrega as especializações de `DATA_SPECIALIZATIONS` |
| Fase 3.4: Estratégia de Testes | `/eng-automation` (via `eng.specializations-rules.md`) | Se a feature envolver RPA ou extração de dados/scraping; a regra também carrega as especializações de `AUTOMATION_SPECIALIZATIONS` |
| Fase 3.4: Estratégia de Testes | `/eng-platform` (via `eng.specializations-rules.md`) | Se a feature envolver infraestrutura (IaC, contêineres, CI/CD, observabilidade, SRE, custo); a regra também carrega as especializações de `PLATFORM_SPECIALIZATIONS` |
| Fase 4.3: Questões em Aberto | `/eng-global-task-comment` | Se o Advisor foi usado e houve questões em aberto: **um** comentário de auditoria (freelance pula; o registro fica só no `architecture.md`) |

---

## Entrada

<task_manager_key>
#$ARGUMENTS
</task_manager_key>

Ler `TASK_MANAGER` do `$IDE/ENV.md`. Seguir `$IDE/rules/engineering/eng.integrations-rules.md` (freelance vs board).

**Se não receber argumentos**, perguntar e **aguardar**:

- `TASK_MANAGER` vazio → *Qual o seu número de controle para esta tarefa? (ex: F-042, CLIENTE-agosto)*
- `TASK_MANAGER` preenchido → *Qual o id do card no {TASK_MANAGER}? (ex: TASK-123)*

> 📁 **Padrão de Nomenclatura**: A pasta da sessão será criada com o `TASK_MANAGER_KEY` em **lowercase**.
> Exemplo: `TASK-123` → `$SESSIONS_DIR/eng/task-123/`

---

## Fase 0.1: Análise de Contexto (CDD)

> 🎯 **Objetivo**: Adaptar o rigor e cerimônia do workflow com base no contexto real da tarefa.
> ⚙️ **Configurável**: Controlada pela variável `ENABLE_CDD` no ENV.md

**Verificação de Ativação:**

```bash
grep "^ENABLE_CDD=" $IDE/ENV.md
```

- Se `ENABLE_CDD=false` ou não definida → **Pular esta fase** e ir direto para Fase 1

- Se `ENABLE_CDD=true` → **Executar obrigatoriamente o skill `/jarvis-context-detect` agora** (não pular, não sugerir ao usuário — executar)

### 0.1 Executar Detecção de Contexto

**OBRIGATÓRIO quando `ENABLE_CDD=true`**: invocar o skill imediatamente antes de qualquer outra ação:

```
/jarvis-context-detect {TASK_MANAGER_KEY}
```

> ⚠️ Não continue para a Fase 1 sem que o `/jarvis-context-detect` tenha sido executado com sucesso e o `context.md` gerado.

O skill `/jarvis-context-detect` irá:
- Analisar a branch, Jira key e características do projeto
- Ler POSITION e MAX_AI_EXECUTION_PERCENTAGE do ENV.md
- Gerar o arquivo `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/context.md`

### 0.2 Herdar CONTEXT_PROFILE

Após a detecção, o arquivo `context.md` conterá:

```
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [normal|alta|baixa]
  rigor: [mínimo|padrão|alto]
  comunicacao: [didático|direto|estratégico]
  autonomia: [baixa|média|alta]
```

### 0.3 Adaptar Workflow por Contexto

| Tipo detectado | Impacto no workflow |
|----------------|---------------------|
| `hotfix` | Skip 3.3 (padrões), architecture.md mínimo |
| `bugfix` | Architecture.md simplificado, foco em root cause |
| `feature` | Fluxo completo com todas as fases |
| `refactor` | Aumentar Fase 3 (análise de impacto) |

| Autonomia | Comportamento |
|-----------|---------------|
| `alta` | Executar mais, perguntar menos, documentar decisões tomadas |
| `média` | Balanço entre execução e validação |
| `baixa` | Apresentar opções ao invés de decidir, aguardar validação |

### 0.4 Confirmar com Usuário

O perfil detectado será apresentado automaticamente pelo skill.
Se o usuário solicitar ajustes, re-execute com `--override`.

---

## Fase 0.5: Advisor (opcional)

Logo depois de obter o `TASK_MANAGER_KEY`, pergunte com `AskUserQuestion` (sem a ferramenta, use a tabela de `prod-rules.md`): **"Usar o Advisor nas questões em aberto desta tarefa?"** (**Não**, padrão / **Sim**). Com **Não**, siga como sempre e não mencione mais o Advisor.

Com **Sim**, pergunte **"Qual modelo para o Advisor?"** com os itens de `ADVISOR_MODELS` do `ENV.md` (até 4 opções; o resto em "Outro"). Lista vazia ou ausente: use `Sonnet 5.5` sem perguntar; lista de um item: use-o sem perguntar. Traduza o nome pela família (primeira palavra em minúsculas: `sonnet`, `opus`, `fable`, `haiku`); se o modelo não for aceito pela IDE, use `sonnet` e avise em uma linha. Se a IDE não permitir escolher o modelo do subagente, avise e não faça a segunda pergunta.

Registre a escolha no cabeçalho do `architecture.md` (`Advisor:`). O agente `eng.advisor.agent` só é aberto na primeira questão em aberto (Fase 4.3).

---

## Fase 1: Preparação do Ambiente

### 1.1 Criar Branch de Feature (GitFlow)

Crie a branch de trabalho a partir de `dev` seguindo o padrão GitFlow:

```bash
# Garantir que está em dev e atualizado
git checkout dev
git pull origin dev

# Criar branch no padrão {TASK_MANAGER_KEY}-{titulo-em-kebab-case}
git checkout -b {TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

**Se a branch já existir**, fazer checkout nela:

```bash
git checkout {TASK_MANAGER_KEY}-{titulo-em-kebab-case}
```

**Verificar branch ativa:**

```bash
git branch --show-current
```

**Regras de nomenclatura:**

| Campo | Regra |
|-------|-------|
| `TASK_MANAGER_KEY` | UPPERCASE (ex: `TASK-123`) |
| Título | kebab-case — lowercase, hífens, sem acentos |
| Tamanho | Máximo 50 caracteres no título |

**Exemplos:**

| TASK_MANAGER_KEY | Título | Branch |
|----------|--------|--------|
| `TASK-123` | "Implementar autenticação JWT" | `TASK-123-implementar-autenticacao-jwt` |
| `BUG-789` | "Fix null pointer em login" | `BUG-789-fix-null-pointer-em-login` |

> ⚠️ Se o usuário já estiver em uma branch com o padrão correto do TASK_MANAGER_KEY, use-a sem criar nova.
> ⚠️ **NUNCA** criar branch a partir de `main`/`master`. Sempre a partir de `dev`.
> ✅ A branch criada aqui será usada em todos os workflows subsequentes (work, pre-pr, pr).

### 1.2 Criar Diretório de Sessão

Crie o diretório da sessão se não existir:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
```

> ⚠️ **IMPORTANTE**: O `TASK_MANAGER_KEY` deve ser convertido para **lowercase**.
> Exemplo: `TASK-123` → `task-123`

### 1.3 Registrar Início da Sessão

Registre o timestamp inicial para cálculo de lead time:

```bash
# Criar arquivo de timestamp (usado para calcular lead time em eng.pr)
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" > $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/.timestamp_start
```

> 💡 Este timestamp será usado pelo `eng.pr` para calcular o lead time (início → PR criado)

---

## Fase 2: Entendimento da Tarefa

### 2.1 Coleta de Informações

Solicite ao usuário os dados de entrada:

- Card do Jira (ID ou conteúdo)
- Git Issues relacionadas
- Contexto adicional

### 2.2 Buscar Documentação Central (condicional)

Se `CENTRAL_DOCS_REPO` estiver configurado no ENV.md, buscar docs relacionados:

**Passo 1:** Identificar docs relevantes com base no Jira ID e tags do card

**Passo 2:** Buscar documentos via skill jarvis-docs-central:
- PRD relacionado (contexto de produto)
- ARD geral do produto (arquitetura macro)
- ARD específico do repo (se existir)
- RFCs relevantes

**Passo 3:** Incorporar ao contexto antes de prosseguir para análise

**Comportamento:**
- Se docs encontrados → carregar e exibir resumo
- Se não encontrados → perguntar se tem docs localmente
- Se `CENTRAL_DOCS_REPO` vazio → pular silenciosamente

### 2.3 Análise do Requisito

Examine os cards, seus pais e filhos, e desenvolva compreensão do que deve ser implementado.

**Se docs do central foram carregados:**
- Validar alinhamento com PRD
- Verificar restrições arquiteturais do ARD
- Considerar decisões de RFCs relacionados

**Reflita sobre:**

- **Contexto**: Qual a motivação por trás deste desenvolvimento?
- **Meta**: Qual é o resultado esperado para esta issue?
- **Estratégia**: Como deve ser desenvolvido (direcionalmente, sem detalhes)?
- **APIs/Ferramentas**: Se demanda novas, você as compreende?
- **Validação**: Como deve ser validado?
- **Dependências**: Quais são?
- **Limitações**: Quais existem?

### 2.3 Perguntas de Clarificação

Formule **3-5 perguntas críticas** para concluir a tarefa.

Apresente ao usuário:

1. Sua compreensão da tarefa
2. Suas propostas iniciais
3. As perguntas de clarificação

**Aguarde respostas antes de prosseguir.**

Se precisar de mais clarificações, continue o diálogo até ter compreensão sólida.

---

## Fase 3: Investigação Técnica

### 3.1 Análise do Codebase

Use ferramentas de busca para entender o código existente:

- **Glob**: Encontrar arquivos relacionados
- **Grep**: Buscar padrões e implementações similares
- **Read**: Analisar arquivos críticos que serão impactados

### 3.2 Documentação Existente

Verifique:

- `$DOCS_FOLDER/**/*.md` - Documentação do projeto
- `$SESSIONS_DIR/eng/**/*.md` - Tech specs anteriores
- `README.md`, `ARCHITECTURE.md` - Visão geral do projeto onde está sendo executado
- Anexos no Jira - PRD, FRD, ARD, RFC

### 3.3 Padrões e Convenções

Documente:

- Padrões arquiteturais do projeto
- Convenções de nomenclatura
- Estrutura de pastas
- Frameworks e bibliotecas utilizadas
- Padrões de testes

### 3.4 Estratégia de Testes (Condicional)

**Se a feature tiver requisitos de performance ou segurança**, invoque o agente [eng.qa.test-architect]($IDE/agents/engineering/qa/eng.qa.test-architect.md) para definir:

- **Tipos de teste necessários**: unitário, integração, e2e, performance, segurança
- **Thresholds de cobertura**: mínimos aceitáveis para a feature
- **Requisitos de performance**: latência, throughput, carga esperada (se aplicável)
- **Requisitos de segurança**: RBAC, validação de input, proteção contra injeção (se aplicável)
- **Estrutura de testes**: pastas e convenções a seguir

> ⚠️ **Quando executar**: Features que envolvam APIs públicas, processamento de dados sensíveis, alta carga esperada ou requisitos não-funcionais explícitos.

**Se a feature tiver requisitos de performance** (latência, throughput, escalabilidade), use a base [eng-platform]($IDE/skills/eng-platform/SKILL.md) (temas 14 — Profiling, 15 — Testes de Carga e Chaos Engineering, 16 — Cache Multi-Camada) para:
- Estabelecer baseline de métricas antes de implementar
- Definir thresholds e SLIs/SLOs da feature
- Planejar load tests com cenários realistas

**Se a feature envolver IA** (LLM, RAG, agentes, chatbots, embeddings), use o skill [eng-ai]($IDE/skills/eng-ai/SKILL.md) para:
- Projetar a arquitetura de IA com fluxo de dados e seleção de modelo
- Definir estratégias de cache, custo e guardrails de segurança
- Planejar observabilidade e métricas de avaliação do sistema de IA

**Se a feature envolver interface ou componentes frontend** (componentes, estado, estilos, renderização, performance de UI, acessibilidade), aplique a regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) para a área **frontend**: ela carrega o skill base [eng-frontend]($IDE/skills/eng-frontend/SKILL.md) mais as especializações registradas em `FRONTEND_SPECIALIZATIONS`, e então:
- Definir estratégia de componentes, estado e renderização
- Planejar performance de UI (bundle, Core Web Vitals, carregamento tardio)
- Estabelecer padrões de acessibilidade e cobertura de testes de interface
- Seguir o que cada especialização registrada pedir para a stack do projeto

**Se a feature envolver APIs, autenticação ou workers backend** (endpoints, autenticação/autorização, filas e mensageria, jobs agendados, integrações externas, cache, banco de dados), aplique a regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) para a área **backend**: ela carrega o skill base [eng-backend]($IDE/skills/eng-backend/SKILL.md) mais as especializações registradas em `BACKEND_SPECIALIZATIONS`, e então:
- Definir design de endpoints (paginação, versionamento, idempotência)
- Planejar autenticação/autorização e controle de acesso
- Arquitetar workers, filas e integrações com retry/circuit breaker
- Seguir o que cada especialização registrada pedir para a stack do projeto

**Se a feature envolver engenharia de dados** (pipelines ETL/ELT, modelagem dimensional, ingestão em S3/Athena, jobs AWS Glue, DAGs Airflow, contratos de dados, Great Expectations, camadas bronze/silver/gold), aplique a regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) para a área **data**: ela carrega o skill base [eng-data]($IDE/skills/eng-data/SKILL.md) mais as especializações registradas em `DATA_SPECIALIZATIONS`, e então:
- Definir a arquitetura Medallion da feature (bronze → silver → gold)
- Planejar Expectation Suite obrigatória e checks de qualidade
- Documentar pipeline com `data-pipeline-template.md` antes de implementar
- Garantir idempotência e nomenclatura padronizada

**Se a feature envolver RPA ou extração de dados** (web scraping, Puppeteer, parsing, ETL, automação de browser/fluxos de trabalho), aplique a regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) para a área **automation**: ela carrega o skill base [eng-automation]($IDE/skills/eng-automation/SKILL.md) mais as especializações registradas em `AUTOMATION_SPECIALIZATIONS`, e então:
- Avaliar viabilidade ética e legal (robots.txt, ToS)
- Definir ferramenta e arquitetura do robô/scraper
- Planejar resiliência, rate limiting e formato de saída

**Se a feature envolver autenticação, autorização, inputs de usuário, dados sensíveis ou endpoints públicos**, use os padrões de segurança já embutidos na base de domínio ([eng-backend]($IDE/skills/eng-backend/SKILL.md) tema 10, [eng-frontend]($IDE/skills/eng-frontend/SKILL.md)) ou, para infraestrutura, no [eng-platform]($IDE/skills/eng-platform/SKILL.md) (temas 9 e 13), e então:
- Mapear superfície de ataque e dados sensíveis (PII, financeiros)
- Definir modelo de auth e RBAC adequado
- Planejar estratégia de sanitização de inputs
- Documentar vetores de risco na seção de segurança do `architecture.md`

**Se a feature envolver infraestrutura** (provisionamento, IaC, contêineres/orquestração, pipeline de CI/CD, observabilidade, confiabilidade/SRE ou custo de nuvem), aplique a regra [eng.specializations-rules.md]($IDE/rules/engineering/eng.specializations-rules.md) para a área **platform**: ela carrega o skill base [eng-platform]($IDE/skills/eng-platform/SKILL.md) mais as especializações registradas em `PLATFORM_SPECIALIZATIONS`, e então:
- Definir provedor, orquestrador e ferramenta de IaC a usar (ou já em uso no projeto)
- Planejar observabilidade mínima (métricas, logs, traces) e SLO/SLI quando a mudança afetar confiabilidade
- Estimar custo e revisar segurança de infraestrutura (menor privilégio, segredos) antes de provisionar

Documente a estratégia de testes no `architecture.md` na seção apropriada.

---

## Fase 4: Criação do Architecture.md

### 4.1 Criar Arquivo

Crie o arquivo `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md` usando o template:

```
.$IDE/templates/engineering/architecture-template.md
```

Copie a estrutura do template e preencha com as informações coletadas.

### 4.2 Preenchimento

Preencha **TODAS** as seções com as informações coletadas nas fases anteriores.

**Seja específico:**

- Liste arquivos reais que serão modificados
- Use nomes de classes/funções existentes
- Referencie código encontrado na investigação

### 4.3 Questões em Aberto

Levante na seção 8 **tudo** que for diferente do código ou ambíguo no card, no formato do template (é aqui que as questões devem aparecer; levantá-las depois é exceção).

**Com Advisor** (Fase 0.5), use os textos de `$IDE/templates/engineering/advisor-template.md`:
1. Na primeira questão, abra `eng.advisor.agent` em segundo plano com o modelo escolhido e envie o **Prompt 1** (carga inicial). Se ele responder que precisa de ajuda para localizar o contexto, pergunte ao usuário com `AskUserQuestion` (opção "Não há documento: siga só com o card e o código") e reenvie.
2. Envie cada questão com o **Prompt 2**, uma por mensagem, para a mesma instância.
3. Preencha "Sugestão do Sub-Agent (Advisor)", **"Decisão adotada" (a sugestão do Advisor, que prevalece; não a substitua nem a conteste)**, "Divergência" e "Impacto da decisão". Confira no código os fatos em que a sugestão se apoia antes de registrar.
4. Poste **um** comentário de auditoria na issue com `/eng-global-task-comment`, no modelo do template (freelance pula).

**Sem Advisor:** apresente as questões ao usuário, como sempre.

---

## Fase 5: Revisão e Aprovação

### 5.1 Apresentação ao Usuário

Apresente:

1. Resumo do que foi documentado
2. Principais decisões arquiteturais
3. Riscos identificados
4. Link para o arquivo criado

### 5.2 Iteração

Se o usuário tiver feedback:

- Atualize o documento
- Apresente novamente
- Continue até aprovação explícita

**Com Advisor**, o gate segue a autonomia do `context.md` (CDD): `alta` → apresente o resumo e siga para o `eng.plan` sem aguardar; `média` ou `baixa` → aguarde a aprovação explícita. Sem `context.md`, use a tabela "Autonomia por POSITION" de `eng-rules.md`. Sem Advisor, nada muda.

### 5.3 Atualizar Board

Pular se `TASK_MANAGER` estiver vazio (freelance).

Se estiver preenchido, mova o card para a etapa equivalente a "em andamento" no seu board. Quem assumiu o card conduz a entrega; ninguém precisa liberar a transição.

### 5.4 Finalização

Quando o usuário aprovar, informe:

```
✅ Architecture.md criado com sucesso!

🌿 Branch: {TASK_MANAGER_KEY}-{titulo-em-kebab-case} (criada a partir de dev)
📄 Arquivo: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md
🌿 Branch:  {NOME_DA_BRANCH}

🔄 Board: mova o card para "Em progresso" no seu board de tarefas.

📌 Próximos passos:
1. Execute `eng.plan` para criar o plano detalhado de execução
2. Execute `eng.work` para implementar (commita automaticamente ao final de cada fase)
3. Execute `eng.pr` para abrir o MR para dev

🚫 Lembre-se: Este workflow NÃO executa código.
   Para implementar, use os comandos de execução.
```

---

## Regras Importantes

### ⛔ NÃO FAÇA

- ❌ NÃO execute código
- ❌ NÃO crie arquivos de código (.ts, .js, .py, etc.)
- ❌ NÃO faça commits
- ❌ NÃO instale dependências
- ❌ NÃO modifique arquivos de código existentes
- ❌ NÃO crie branch a partir de `main`/`master`

### ✅ FAÇA APENAS

- ✅ Criar branch a partir de `dev` no padrão `{TASK_MANAGER_KEY}-{titulo}`
- ✅ Criar o diretório `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`
- ✅ Criar o arquivo `architecture.md`
- ✅ Investigar e analisar o codebase (leitura apenas)
- ✅ Dialogar com o usuário para clarificações

---

## Tratamento de Erros

### Se o usuário pedir para executar código:

→ Informe que este workflow é apenas para planejamento

### Se faltar informações críticas:

→ Liste o que falta
→ Pergunte ao usuário antes de prosseguir

### Se houver dúvidas sobre a arquitetura:

→ Apresente as opções ao usuário
→ Aguarde decisão antes de documentar
