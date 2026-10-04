# README

Este diretório contém **agentes especializados** organizados por domínio, usados automaticamente pelos workflows.

---

## 📂 Estrutura Organizada

```
agents/
├── engineering/                  # ⚙️ Agentes do domínio de Engenharia
│   ├── eng.agent.md              # Agent principal de engenharia
│   ├── eng.bug-hunter.md         # Caça e análise de bugs
│   ├── eng.dev-code-reviewer.md  # Code reviewer
│   ├── eng.docs-writer.md        # Escritor de documentação
│   ├── eng.rpa.agent.md          # Automação RPA (ARACHNE)
│   ├── eng.frontend.agent.md     # Especialista frontend (neutro de stack): UI, estado, a11y
│   ├── eng.ux-designer.agent.md  # Especialista UX/UI: heurísticas, jornada, microcopy
│   ├── data/                     # Data Engineering (1 agent)
│   │   └── eng.data-engineer.agent.md
│   └── qa/                       # QA específico de engenharia (5 agents)
└── product/                      # 🎯 Agentes do domínio de Produto
    ├── prod.pm-checker.md        # Product Manager checker
    └── prod.discovery-interviewer.md  # Entrevistador de discovery
```

**📊 Total: 16 agents**
- Engineering: 14 (8 main + 1 data + 5 QA)
- Product: 2

---

## ⚙️ 1. Engenharia (14 agents)

**Pasta**: `engineering/`

Agentes específicos para fluxos e regras do domínio de Engenharia.

### Agents Principais (9)
- `eng.agent.md` - `@eng.agent` - Agent principal de engenharia
- `eng.bug-hunter.md` - `@eng.bug-hunter` - Caça e análise de bugs
- `eng.dev-code-reviewer.md` - `@eng.dev-code-reviewer` - Code review
- `eng.docs-writer.md` - `@eng.docs-writer` - Documentação técnica
- `eng.rpa.agent.md` - `@eng.rpa` - Automação e scraping RPA (ARACHNE)
- `eng.frontend.agent.md` - `@eng.frontend` - Especialista frontend (neutro de stack): UI, estado, performance, a11y
- `eng.ux-designer.agent.md` - `@eng.ux-designer` - Especialista UX/UI: heurísticas Nielsen, jornada, microcopy
- `eng.cybersecurity.agent.md` - `@eng.cybersecurity` - Especialista em cybersecurity e AppSec (SENTINEL): OWASP Top 10, secrets, supply chain, incident response


### Data Agents (1)
**Subpasta**: `engineering/data/`

- `eng.data-engineer.agent.md` - `@eng.data-engineer` - Pipelines ETL/ELT, contratos de dados, qualidade (HEPHAESTUS)

### QA Agents (5)
**Subpasta**: `engineering/qa/`

- `eng.qa.quality-champion-task-agent.md` - `@eng.qa.quality-champion-task-agent`
- `eng.qa.test-planner.md` - `@eng.qa.test-planner`
- `eng.qa.testing-engineer.md` - `@eng.qa.testing-engineer` _(stack primária: Cypress + TypeScript — inclui domínio e debugging Cypress)_
- `eng.qa.test-architect.md` - `@eng.qa.test-architect`
- `eng.qa.quality-strategist.md` - `@eng.qa.quality-strategist` — priorização de esforço, risco de feature, distribuição QA/dev

---

## 🎯 2. Produto (2 agentes)

**Pasta**: `product/`

Agentes específicos para fluxos e validações do domínio de Produto.

- `prod.pm-checker.md` - `@prod.pm-checker`
- `prod.discovery-interviewer.md` - `@prod.discovery-interviewer`: entrevista o usuário sobre uma ideia e gera o rascunho de discovery

---

## 📊 Distribuição dos Agentes

| Domínio | Agentes | Uso |
|---------|---------|-----|
| ⚙️ **Engineering** (main) | 8 | Agent principal, bug hunter, code review, docs, RPA, frontend, UX, cybersecurity |
| 🧪 **QA** (sub-eng) | 5 | Test planning, testing (+Cypress), test architect, quality champion, quality strategist |
| 📊 **Data** (sub-eng) | 1 | Pipelines, contratos de dados, qualidade |
| 🎯 **Product** | 2 | PM checker, discovery interviewer |

**Total: 16 agents**

---

## 🎯 Como Usar os Agentes

### 🔗 Relação entre Agents e Skills

- **Agents**: definem persona, postura e forma de atuação.
- **Skills**: definem playbooks executáveis e padrões detalhados (fonte de verdade operacional).

Quando um agente estiver atuando em um tema que possui skill correspondente, ele deve seguir o skill como referência principal.

### Mapeamento recomendado (Workflows/Comandos → Skills)

- **eng.docs** → `eng-global-docs-write` (principal) e `jarvis-docs-index` (quando houver índice).
- **eng.pre-pr** → `eng-qa-test-plan` (cobertura) e `eng-global-docs-write` (docs).
- **eng.pr** → `eng-global-pr`.
- **qa-quality-gate-validation** → `eng-qa-gate`.
- **Sessão de teste exploratório (charter, risco, achados, bug cards)** → `eng-qa-exploratory`.
- **Gerar specs Cypress + TypeScript (Page Objects, data-testid, intercept)** → `eng-qa-cypress-e2e`.
- **Orientar dev sobre cobertura Cypress sem escrever o teste** → `eng-qa-dev-guide`.
- **Consolidar sessões, bugs e quality gates e gerar relatório de qualidade por período** → `eng-qa-quality-report`.
- **APIs, auth, workers, filas, caching, banco de dados** → regra `eng.specializations-rules.md` (área backend: `eng-backend` + `BACKEND_SPECIALIZATIONS`).
- **Componentes, UI, estado, estilos, performance, acessibilidade** → regra `eng.specializations-rules.md` (área frontend: `eng-frontend` + `FRONTEND_SPECIALIZATIONS`).
- **Web scraping, Puppeteer, extração de dados, ETL** → `eng-scraper`.
- **Converter fluxo manual (produto/dev) em robô Playwright via Stagehand** → `eng-scraper-robot-builder`.
- **Criar ou manter robô RPA** → `eng.rpa.robot new|update {card}` (workflow).
- **Testes E2E em linguagem natural, fluxos de usuário, smoke tests pós-deploy** → `eng-qa-e2e`.
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

### Invocação Manual

Você também pode invocar agentes manualmente usando `@`:

```bash
# Invocar agente específico
@eng.qa.test-planner "analisar cobertura de testes da branch"

# Múltiplos agentes em paralelo
@eng.frontend.agent @eng.ux-designer.agent "revisar fluxo de checkout"

# Agentes especializados
@eng.qa.testing-engineer
```

---

## 🔄 Fluxo de Trabalho Típico

```
1. 🏗️ PLANEJAMENTO
   └─> /eng.start, /eng.plan → @eng.agent coordena

2. 💻 IMPLEMENTAÇÃO
   └─> /eng.work → @eng.agent

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

**Última atualização**: 2026-10-04
**Agents ativos:** 16 (Engineering: 8 main + 5 QA + 1 Data, Product: 2)
