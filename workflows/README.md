# Sistema de Workflows do Jarvis

Este diretório contém os workflows (templates) usados pelos comandos slash do Jarvis, organizados por domínio.

---

## Estrutura de Workflows

```
workflows/
├── warm-up.md                    # Preparação de sessão
├── warm-up@1.1.md                # Variante do warm-up
├── all-tools.md                  # Listar ferramentas
│
├── product/                      # Gestão de Produto & Requisitos
│   ├── prod.spec.md              # Entrypoint de especificações
│   ├── prod.spec.discovery.md    # Investigação inicial de uma ideia (rascunho)
│   ├── prod.spec.prd.md          # Documento de Requisitos de Produto
│   ├── prod.spec.frd.md          # Documento de Requisitos Funcionais
│   ├── prod.spec.breakdown.md    # Quebra em versões / épicos / histórias
│   ├── prod.spec.epic.md         # Épicos
│   ├── prod.spec.issue.md        # Issues (stories, tasks, bugs)
│   └── prod.spec.clarify.md      # Esclarecer/validar spec
│
└── engineering/                  # Engenharia & Desenvolvimento
    ├── eng.start.md              # Início de desenvolvimento
    ├── eng.plan.md               # Planejamento
    ├── eng.work.md               # Execução do trabalho
    ├── eng.pre-pr.md             # Validação pré-PR
    ├── eng.pr.md                 # Criação de PR
    ├── eng.review.md             # Revisão
    ├── eng.debug.md              # Debug/incident
    ├── eng.bug-audit.md          # Auditoria de bugs
    ├── eng.docs.md               # Documentação (engenharia)
    ├── eng.create-ard.md         # Criar ARD
    ├── eng.create-ard-from-code.md
    ├── eng.create-rfc.md         # Criar RFC
    ├── eng.build-tech-spec.md    # Criar Tech Spec
    ├── eng.breakdown-subtasks.md # Quebrar em subtarefas
    ├── eng.light-arch.md         # Design arquitetural leve
    ├── eng.rpa.robot.md      # Criar robô RPA do zero ao PR (skill técnica)
    ├── frontend/
    │   ├── eng.frontend-component.md     # Criar/refatorar componente (design system vs remote, a11y, testes)
    │   ├── eng.frontend-review.md        # Revisão de PR frontend (TS, tokens, a11y, MFE)
    │   └── eng.frontend-perf-audit.md    # Auditoria Core Web Vitals e bundle
    └── qa/
        ├── eng-qa-quality-gate-validation.md
        ├── eng-qa-e2e-test-generation.md
        ├── eng-qa-exploratory-session.md
        ├── eng-qa-dev-quality-guide.md
        ├── eng-qa-quality-report.md
        ├── eng-qa-refinement-entry.md
        ├── eng-qa-release-signoff.md
        └── eng-qa-sprint-planning.md
```

---

## Workflows Globais

| Workflow | Propósito |
|----------|-----------|
| `warm-up.md` | Preparar sessão carregando contexto do projeto |
| `warm-up@1.1.md` | Variante do warm-up (versão 1.1) |
| `all-tools.md` | Listar todas as ferramentas disponíveis |

---

## Workflows de Produto

| Workflow | Propósito |
|----------|-----------|
| `prod.spec.md` | Entrypoint unificado para especificações |
| `prod.spec.discovery.md` | Investigar uma ideia inicial (problema, requisitos e viabilidade) e gerar um rascunho |
| `prod.spec.prd.md` | Criar/editar Documento de Requisitos de Produto |
| `prod.spec.frd.md` | Criar/editar Documento de Requisitos Funcionais |
| `prod.spec.breakdown.md` | Quebrar spec grande em versões, épicos e histórias |
| `prod.spec.epic.md` | Criar/editar épicos |
| `prod.spec.issue.md` | Criar/editar issues (stories, tasks, bugs) |
| `prod.spec.clarify.md` | Esclarecer e validar especificações existentes |

---

## Workflows de Engenharia

| Workflow | Propósito |
|----------|-----------|
| `eng.start.md` | Inicializar desenvolvimento e criar architecture.md |
| `eng.plan.md` | Criar plano de execução por fases |
| `eng.work.md` | Executar implementação de código |
| `eng.pre-pr.md` | Validação final antes do PR |
| `eng.pr.md` | Criar branch, commit e Pull Request |
| `eng.review.md` | Revisão de solução/PR |
| `eng.debug.md` | Debug e investigação de incidentes |
| `eng.docs.md` | Atualizar documentação de engenharia |
| `eng.create-ard.md` | Criar ARD (Architecture Review Document) |
| `eng.create-ard-from-code.md` | Criar ARD a partir do código |
| `eng.create-rfc.md` | Criar RFC (Request For Comments) |
| `eng.build-tech-spec.md` | Criar especificação técnica |
| `eng.breakdown-subtasks.md` | Quebrar tech spec em subtarefas |
| `eng.bug-audit.md` | Auditoria e análise de bugs |
| `eng.light-arch.md` | Design arquitetural leve |
| `eng.rpa.robot.md` | Criar robô novo ou manter existente — análise, scaffolding, impl, docs, PR |
| `eng.frontend-component.md` | Criar ou refatorar componente frontend com qualidade (design system vs remote, a11y, testes) |
| `eng.frontend-review.md` | Revisão de código específica para PRs frontend (TypeScript, tokens, a11y, MFE) |
| `eng.frontend-perf-audit.md` | Auditoria de performance frontend (Core Web Vitals, bundle, diagnóstico por métrica) |
| `eng-qa-quality-gate-validation.md` | Validação de quality gate de um ticket |
| `eng-qa-e2e-test-generation.md` | Geração de testes E2E Cypress para uma feature |
| `eng-qa-exploratory-session.md` | Conduzir sessão de teste exploratório |
| `eng-qa-dev-quality-guide.md` | Orientar dev a escrever seus próprios testes Cypress |
| `eng-qa-quality-report.md` | Relatório de qualidade consolidado por sprint/release |
| `eng-qa-refinement-entry.md` | Entrada do QA no refinement de tickets |
| `eng-qa-release-signoff.md` | Sign-off QA pré-deploy (GO/NO-GO) |
| `eng-qa-sprint-planning.md` | Planejamento de capacidade QA por sprint |

---

## Relação Command → Workflow

Cada command em `commands/` referencia seu workflow correspondente:

```markdown
# nome-do-command
Utilize o arquivo `../../workflows/[dominio]/nome-do-workflow.md` como template para este comando.
```

---

## Fluxos de Trabalho Típicos

### 1. Inicialização de Projeto
```bash
/init
/warm-up
/prod.spec.prd
```

### 2. Nova Feature
```bash
/warm-up
/prod.spec.frd
/prod.spec.clarify
/prod.spec.breakdown   # se a feature ainda estiver grande
/eng.start "feature-id"
/eng.plan "feature-id"
/eng.work "feature-id"
/eng.pre-pr
/eng.pr
```

---

## Referências

- [Agentes](../agents/README.md)
- [Rules](../rules/)
- [Templates](../templates/)
- ENV.md (`$IDE/ENV.md`)

---

**Última atualização**: 2026-01-25
