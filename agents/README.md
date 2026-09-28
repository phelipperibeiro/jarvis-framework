# README

Este diretório contém **agentes especializados** organizados por domínio.

**Agentes ativos:** Usados automaticamente pelos workflows
**Agentes arquivados:** Disponíveis para uso especializado quando necessário

---

## 📂 Estrutura Organizada

```
agents/
├── engineering/                  # ⚙️ Agentes do domínio de Engenharia (ATIVOS)
│   ├── eng.agent.md              # Agent principal de engenharia
│   ├── eng.bug-hunter.md         # Caça e análise de bugs
│   ├── eng.dev-code-reviewer.md  # Code reviewer
│   ├── eng.docs-writer.md        # Escritor de documentação
│   ├── eng.tech-analyst.agent.md # Triagem e diagnóstico de chamados N2
│   ├── eng.rpa.agent.md          # Automação RPA (ARACHNE)
│   ├── eng.frontend.agent.md     # Especialista frontend: React, MFE, design system, a11y
│   ├── eng.ux-designer.agent.md  # Especialista UX/UI: heurísticas, jornada, microcopy
│   ├── data/                     # Data Engineering (1 agent)
│   │   └── eng.data-engineer.agent.md
│   └── qa/                       # QA específico de engenharia (6 agents)
├── product/                      # 🎯 Agentes do domínio de Produto (ATIVOS)
│   └── prod.pm-checker.md        # Product Manager checker
└── archive/                      # 📦 Biblioteca de agentes arquivados
    └── product/                  # Product WIP (5)
```

**📊 Total:**
- **16 agents ativos** (prontos para uso)
  - Engineering main: 8 (6 main + 1 data + subpasta qa)
  - QA: 6
  - Product: 1
- **5 agents arquivados** (uso especializado quando necessário)

---

## ⚙️ 1. Engenharia (15 agents)

**Pasta**: `engineering/`

Agentes específicos para fluxos e regras do domínio de Engenharia.

### Agents Principais (9)
- `eng.agent.md` - `@eng.agent` - Agent principal de engenharia
- `eng.bug-hunter.md` - `@eng.bug-hunter` - Caça e análise de bugs
- `eng.dev-code-reviewer.md` - `@eng.dev-code-reviewer` - Code review
- `eng.docs-writer.md` - `@eng.docs-writer` - Documentação técnica
- `eng.tech-analyst.agent.md` - `@eng.tech-analyst` - Triagem e diagnóstico de chamados N2
- `eng.rpa.agent.md` - `@eng.rpa` - Automação e scraping RPA (ARACHNE)
- `eng.frontend.agent.md` - `@eng.frontend` - Especialista frontend: React, micro frontend, design system, a11y
- `eng.ux-designer.agent.md` - `@eng.ux-designer` - Especialista UX/UI: heurísticas Nielsen, jornada, microcopy
- `eng.cybersecurity.agent.md` - `@eng.cybersecurity` - Especialista em cybersecurity e AppSec (SENTINEL): OWASP Top 10, secrets, supply chain, incident response


### Data Agents (1)
**Subpasta**: `engineering/data/`

- `eng.data-engineer.agent.md` - `@eng.data-engineer` - Pipelines ETL/ELT, contratos de dados, qualidade (HEPHAESTUS)

### QA Agents (6)
**Subpasta**: `engineering/qa/`

- `eng.qa.quality-champion-task-agent.md` - `@eng.qa.quality-champion-task-agent`
- `eng.qa.test-planner.md` - `@eng.qa.test-planner`
- `eng.qa.testing-engineer.md` - `@eng.qa.testing-engineer` _(stack primária: Cypress + TypeScript)_
- `eng.qa.test-architect.md` - `@eng.qa.test-architect`
- `eng.qa.cypress-specialist.md` - `@eng.qa.cypress-specialist` — Page Objects, Custom Commands, CI, debugging
- `eng.qa.quality-strategist.md` - `@eng.qa.quality-strategist` — priorização de esforço, risco de feature, distribuição QA/dev

---

## 🎯 2. Produto (1 agente)

**Pasta**: `product/`

Agentes específicos para fluxos e validações do domínio de Produto.

- `prod.pm-checker.md` - `@prod.pm-checker`

---

## 📦 3. Agentes Arquivados

**Pasta**: `archive/`

**Total:** 9 agentes especializados para uso quando necessário

⚠️ **Importante:** Estes agentes estão **desativados por padrão** para simplificar o onboarding.

**Quando usar:**
- ✅ Caso de uso específico e bem definido
- ✅ Necessidade de especialização profunda
- ✅ Agents ativos não cobrem a necessidade

**📖 [Ver guia completo →](archive/README.md)**

### Categorias disponíveis:

| Categoria | Agents | Exemplos |
|-----------|--------|----------|
| 🏗️ **Arquitetura & Design** | 2 | frontend-architect, ux-ui-design-expert |
| 💻 **Implementação** | 2 | react-developer, frontend-react-specialist |
| 🎯 **Produto WIP** | 5 | prod.wip.collect, prod.wip.refine, prod.wip.spec.breakdown, etc. |

**Como ativar:** Ver `archive/README.md` para instruções detalhadas

---

## 📊 Distribuição dos Agentes

### Agentes Ativos (9)

| Domínio | Agentes | Uso |
|---------|---------|-----|
| ⚙️ **Engineering** | 5 | Agent principal, bug hunter, code review, docs, tech analyst |
| 🧪 **QA** (sub-eng) | 6 | Test planning, testing, quality gate, Cypress specialist, quality strategist |
| 📊 **Data** (sub-eng) | 1 | Pipelines, contratos de dados, qualidade |
| 🎯 **Product** | 1 | PM checker |

**Total ativos:** 13 agents

### Agentes Arquivados (9)

| Categoria | Agentes | Quando usar |
|-----------|---------|-------------|
| 🏗️ **Arquitetura** | 2 | Frontend architecture, UX/UI design |
| 💻 **Implementação** | 2 | React especializado |
| 🎯 **Produto WIP** | 5 | Product workflows em desenvolvimento |

**Total arquivados:** 9 agents

**📖 Detalhes completos:** `archive/README.md`

---

## 🎯 Como Usar os Agentes

### 🔗 Relação entre Agents e Skills

- **Agents**: definem persona, postura e forma de atuação.
- **Skills**: definem playbooks executáveis e padrões detalhados (fonte de verdade operacional).

Quando um agente estiver atuando em um tema que possui skill correspondente, ele deve seguir o skill como referência principal.

### Mapeamento recomendado (Workflows/Comandos → Skills)

- **eng.docs** → `eng-docs-write` (principal) e `docs-index` (quando houver índice).
- **eng.pre-pr** → `eng-qa-test-plan` (cobertura) e `eng-docs-write` (docs).
- **eng.pr** → `eng-pr`.
- **qa-quality-gate-validation** → `eng-qa-gate`.
- **Sessão de teste exploratório (charter, risco, achados, bug cards)** → `eng-qa-exploratory`.
- **Gerar specs Cypress + TypeScript (Page Objects, data-testid, intercept)** → `eng-qa-cypress-e2e`.
- **Orientar dev sobre cobertura Cypress sem escrever o teste** → `eng-qa-dev-guide`.
- **Consolidar sessões, bugs e quality gates e gerar relatório de qualidade por período** → `eng-qa-quality-report`.
- **APIs, auth, workers, RabbitMQ, caching** → `eng-backend`.
- **Componentes, UI, estado, SSR/SSG, performance, acessibilidade** → `eng-frontend`.
- **Módulos NestJS, DI, guards, interceptors, Passport/JWT** → `eng-nestjs`.
- **Web scraping, Puppeteer, extração de dados, ETL** → `eng-scraper`.
- **Converter fluxo manual (produto/dev) em robô Playwright via Stagehand** → `eng-scraper-robot-builder`.
- **Criar ou manter robô RPA** → `eng.rpa.robot new|update {card}` (workflow).
- **Testes E2E em linguagem natural, fluxos de usuário, smoke tests pós-deploy** → `eng-qa-e2e`.
- **Atendimento técnico N2, triagem de chamados, diagnóstico, classificação de bugs, escalonamento** → `eng-tech-analyst`.
- **Pipelines de dados, ETL/ELT, Glue, Airflow, Athena, bronze/silver/gold, contratos de dados, Great Expectations** → `eng-data-engineer`.

### Ativação Automática (Agents Ativos)

Os agentes ativos ativam automaticamente baseado no contexto dos workflows:

```bash
# Exemplo: /eng.start ativa agentes de engenharia
/eng.start JIRA-123
# → @eng.agent coordena análise e arquitetura

# Exemplo: /eng.pre-pr ativa múltiplos agentes de qualidade
/eng.pre-pr JIRA-123
# → @eng.dev-code-reviewer, @eng.qa.test-planner, @eng.docs-writer

# Exemplo: /eng-qa-gate ativa agentes de QA
/eng-qa-gate
# → @eng.qa.quality-champion-task-agent valida qualidade
```

### Uso de Agents Arquivados

Agents arquivados precisam ser invocados explicitamente:

```bash
# Opção 1: Invocar pontualmente
"Use o agent backend-architect (agents/archive/architecture-design/backend-architect.md)
para revisar a arquitetura de microservices"

# Opção 2: Ativar permanentemente
mv agents/archive/architecture-design/backend-architect.md agents/engineering/

# Opção 3: Criar skill customizado
/skill-creator  # criar skill que usa agent arquivado
```

### Invocação Manual

Você também pode invocar agentes manualmente usando `@`:

```bash
# Invocar agente específico
@eng.qa.test-planner "analisar cobertura de testes da branch"

# Múltiplos agentes em paralelo
@backend-architect @database-architect "design de API para sistema multi-tenant"

# Agentes especializados
@lovable-frontend-prompt-generator
@eng.qa.testing-engineer
```

---

## 🔄 Fluxo de Trabalho Típico

```
1. 🏗️ PLANEJAMENTO
   └─> /eng.start, /eng.plan → @eng.agent coordena

2. 💻 IMPLEMENTAÇÃO
   └─> /eng.work → @eng.agent (+ @react-developer se archived ativado)

3. 🧪 TESTES
   └─> @eng.qa.test-planner, @eng.qa.testing-engineer, @eng.qa.test-architect

4. ✅ REVISÃO
   └─> @eng.dev-code-reviewer

5. 📚 DOCUMENTAÇÃO
   └─> @eng.docs-writer → /eng.docs

6. 🔧 ENTREGA
   └─> /eng.pre-pr, /eng.pr
```

---

## 🎓 Benefícios da Organização

### ✅ Navegação Mais Fácil
- Encontre o agente certo rapidamente
- Estrutura lógica por função

### ✅ Melhor Compreensão
- README em cada categoria explica propósito
- Casos de uso documentados

### ✅ Manutenção Facilitada
- Adicionar novos agentes fica mais claro
- Identificar gaps de cobertura

### ✅ Onboarding Mais Rápido
- Desenvolvedores entendem o sistema rapidamente
- Documentação contextual por área

---

## 📝 Notas Importantes

- **Todos os agentes são compatíveis** com os comandos slash existentes
- **Ativação automática** baseada em contexto continua funcionando
- **Invocação manual** com `@nome-do-agente` permanece a mesma
- **Agentes de QA consolidados** em `engineering/qa/` (antes estavam em stand-by)

---

## 🔗 Links Relacionados

- [Workflows](../workflows/README.md)
- JARVIS.md (`$IDE/JARVIS.md`)
- ENV.md (`$IDE/ENV.md`)

---

---

## 🎯 Recomendação de Uso

### Para times PEQUENOS (< 5 devs):
```
✅ Use apenas agents ativos (9 agents)
❌ Mantenha arquivados sem ativar
```

### Para times MÉDIOS (5-15 devs):
```
✅ Use agents ativos
⚠️  Ative 1-2 agents arquivados SE necessário
```

### Para times GRANDES (> 15 devs):
```
✅ Use agents ativos
✅ Ative agents arquivados por especialização/squad
```

---

**Última atualização**: 2026-04-26
**Agents ativos:** 13 (Engineering: 5 main + 6 QA + 1 Data, Product: 1)
**Agents arquivados:** 9 (Architecture: 2, Implementation: 2, Product WIP: 5)
**Total:** 22 agents
