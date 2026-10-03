---
description: Inicia o planejamento de uma tarefa criando o architecture.md
auto_execution_mode: 3
agent: "$IDE/agents/engineering/eng.agent.md"
rules_file: "$IDE/rules/engineering/eng.start-rules.md"
template_file: "$IDE/templates/engineering/architecture-template.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Requer análise arquitetural profunda, investigação de codebase e raciocínio complexo para criar documentação técnica de qualidade
---

# start

Este comando inicia o **planejamento** de uma nova feature.

> 📋 **Rules**: `$IDE/rules/engineering/eng.start-rules.md`
> 📤 **Template**: `$IDE/templates/engineering/architecture-template.md`

> ⚠️ **IMPORTANTE**: Este workflow é APENAS para planejamento e documentação.
> **NÃO execute código, NÃO crie arquivos de código, NÃO faça commits.**
> O único artefato a ser criado é o `architecture.md`.

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

- Se `ENABLE_CDD=true` → **Executar obrigatoriamente o skill `/context-detect` agora** (não pular, não sugerir ao usuário — executar)

### 0.1 Executar Detecção de Contexto

**OBRIGATÓRIO quando `ENABLE_CDD=true`**: invocar o skill imediatamente antes de qualquer outra ação:

```
/context-detect {TASK_MANAGER_KEY}
```

> ⚠️ Não continue para a Fase 1 sem que o `/context-detect` tenha sido executado com sucesso e o `context.md` gerado.

O skill `/context-detect` irá:
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

## Fase 0.5: Comentário no card — Início

Pular se `TASK_MANAGER` estiver vazio (freelance).

Após obter o `TASK_MANAGER_KEY`, registrar o início do planejamento:

```
/eng-task-comment {TASK_MANAGER_KEY} 🚀 [Jarvis] Iniciando planejamento - architecture.md sendo criado
```

> Usa o skill `/eng-task-comment` (MCP Atlassian → fallback curl). Não bloquear se falhar.

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

**Passo 2:** Buscar documentos via skill docs-central:
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

**Se a feature tiver requisitos de performance** (latência, throughput, escalabilidade), use o skill [eng-performance-engineer]($IDE/skills/eng-performance-engineer/SKILL.md) para:
- Estabelecer baseline de métricas antes de implementar
- Definir thresholds e SLIs/SLOs da feature
- Planejar load tests com cenários realistas

**Se a feature envolver IA** (LLM, RAG, agentes, chatbots, embeddings), use o skill [eng-ai-engineer]($IDE/skills/eng-ai-engineer/SKILL.md) para:
- Projetar a arquitetura de IA com fluxo de dados e seleção de modelo
- Definir estratégias de cache, custo e guardrails de segurança
- Planejar observabilidade e métricas de avaliação do sistema de IA

**Se a feature envolver aspectos avançados do framework NestJS** (módulos, DI, guards, interceptors, pipes, exception filters, ConfigModule, autenticação Passport/JWT), use o skill [eng-nestjs]($IDE/skills/eng-nestjs/SKILL.md) para:
- Definir arquitetura de módulos e boundaries de domínio
- Planejar estratégia de guards e interceptors
- Configurar autenticação e validação de entrada

**Se a feature envolver interface ou componentes frontend** (React, Next.js, SSR/SSG, performance de UI, acessibilidade), use o skill [eng-frontend]($IDE/skills/eng-frontend/SKILL.md) para:
- Definir estratégia de componentes, estado e renderização
- Planejar performance de UI (bundle, Core Web Vitals, lazy loading)
- Estabelecer padrões de acessibilidade e cobertura de testes de interface

**Se a feature envolver o design system** (novo componente compartilhado, tokens, Storybook, breaking change em componente público), use o skill [eng-design-system]($IDE/skills/eng-design-system/SKILL.md) para:
- Determinar se o componente pertence ao design system ou ao remote (reutilizável vs local)
- Definir tokens semânticos, variantes CVA e API pública de props
- Planejar story no Storybook e estratégia de versionamento (patch/minor/major)

**Se a feature envolver micro frontend** (novo remote, integração ao shell, Module Federation, contratos de interface, shared dependencies), use o skill [eng-microfrontend]($IDE/skills/eng-microfrontend/SKILL.md) para:
- Definir arquitetura shell/remote e o que será exposto
- Planejar contrato de interface em TypeScript (tipos em `mfe-contracts`)
- Estratégia de shared dependencies e event bus para comunicação desacoplada

**Se a feature envolver APIs, autenticação ou workers backend** (endpoints REST/GraphQL, JWT/OAuth2, RBAC, RabbitMQ, cron, integrações externas, caching), use o skill [eng-backend]($IDE/skills/eng-backend/SKILL.md) para:
- Definir design de endpoints (paginação, versionamento, idempotência)
- Planejar autenticação/autorização e controle de acesso
- Arquitetar workers, filas RabbitMQ e integrações com retry/circuit breaker

**Se a feature envolver engenharia de dados** (pipelines ETL/ELT, modelagem dimensional, ingestão em S3/Athena, jobs AWS Glue, DAGs Airflow, contratos de dados, Great Expectations, camadas bronze/silver/gold), use o skill [eng-data-engineer]($IDE/skills/eng-data-engineer/SKILL.md) para:
- Definir a arquitetura Medallion da feature (bronze → silver → gold)
- Planejar Expectation Suite obrigatória e checks de qualidade
- Documentar pipeline com `data-pipeline-template.md` antes de implementar
- Garantir idempotência e nomenclatura padronizada

**Se a feature envolver extração de dados ou scraping** (web scraping, Puppeteer, parsing, ETL), use o skill [eng-scraper]($IDE/skills/eng-scraper/SKILL.md) para:
- Avaliar viabilidade ética e legal (robots.txt, ToS)
- Definir ferramenta e arquitetura do scraper
- Planejar resiliência, rate limiting e formato de saída

**Se a feature envolver autenticação, autorização, inputs de usuário, dados sensíveis ou endpoints públicos**, use o skill [eng-cybersecurity]($IDE/skills/eng-cybersecurity/SKILL.md) para:
- Mapear superfície de ataque e dados sensíveis (PII, financeiros)
- Definir modelo de auth e RBAC adequado
- Planejar estratégia de sanitização de inputs
- Documentar vetores de risco na seção de segurança do `architecture.md`

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

### 5.3 Atualizar Board

> Consultar `$IDE/rules/engineering/eng.downstream-flow-rules.md` para regras completas de transição.

De acordo com o fluxo downstream, ao assumir este card o **DEV** (`JUNIOR` / `PLENO` / `SENIOR` / `SPECIALIST`) deve mover o card para **"Em progresso"**.

> Este é o sinal de que a entrega está em andamento e o DEV assumiu a responsabilidade ponta-a-ponta.

### 5.4 Comentário no card — Conclusão

Pular se `TASK_MANAGER` estiver vazio (freelance).

Registrar conclusão do planejamento:

```
/eng-task-comment {TASK_MANAGER_KEY} ✅ [Jarvis] Planejamento concluído - architecture.md criado. Branch: {NOME_DA_BRANCH}
```

### 5.5 Finalização

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
