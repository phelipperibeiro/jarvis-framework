# Sistema de Workflows do Jarvis

Este diretório contém os workflows (templates) usados pelos comandos slash do Jarvis, organizados por domínio.

---

## Estrutura de Workflows

```
workflows/
├── warm-up.md                    # Preparação de sessão
├── taxonomy.md                   # Gerenciar o taxonomy.md (opções organizacionais)
│
├── product/                      # Gestão de Produto & Requisitos
│   ├── prod.spec.md              # Entrypoint de especificações
│   ├── prod.spec.discovery.md    # Investigação inicial de uma ideia (rascunho)
│   ├── prod.spec.prd.md          # Documento de Requisitos de Produto
│   ├── prod.spec.frd.md          # Documento de Requisitos Funcionais
│   ├── prod.spec.ard.md          # ARD a partir do produto
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
    ├── eng.debug.md              # Debug: investiga um bug ou varre um escopo
    ├── eng.create-ard.md         # Criar ARD
    ├── eng.create-rfc.md         # Criar RFC
    ├── eng.build-tech-spec.md    # Criar Tech Spec (Delivery Spec ou Reference Spec)
    ├── eng.light-arch.md         # Design arquitetural leve
    ├── eng.rpa.robot.md      # Criar robô RPA do zero ao PR (skill técnica)
    ├── eng.spec-consolidate.md   # Consolidar no Central docs o que a entrega implementou
    ├── eng.daily-report.md       # Juntar os daily.md das sessões por dia
    └── frontend/
        ├── eng.frontend-component.md     # Criar/refatorar componente (design system vs remote, a11y, testes)
        ├── eng.frontend-review.md        # Revisão de PR frontend (TS, tokens, a11y, MFE)
        └── eng.frontend-perf-audit.md    # Auditoria Core Web Vitals e bundle
```

---

## Workflows Globais

| Workflow | Propósito |
|----------|-----------|
| `warm-up.md` | Preparar sessão carregando contexto do projeto |
| `taxonomy.md` | Gerenciar o `taxonomy.md` de forma segura (opções organizacionais) |

---

## Workflows de Produto

| Workflow | Propósito |
|----------|-----------|
| `prod.spec.md` | Entrypoint unificado para especificações |
| `prod.spec.discovery.md` | Investigar uma ideia inicial (problema, requisitos e viabilidade) e gerar um rascunho |
| `prod.spec.prd.md` | Criar/editar Documento de Requisitos de Produto |
| `prod.spec.frd.md` | Criar/editar Documento de Requisitos Funcionais |
| `prod.spec.ard.md` | Levantar requisitos arquiteturais com o PM e conduzir o ARD |
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
| `eng.pr.md` | Push e Pull Request, depois da pergunta (regra de ouro) |
| `eng.debug.md` | Investiga um bug ou varre um escopo atrás de problemas |
| `eng.create-ard.md` | Criar ARD (Architecture Review Document) |
| `eng.create-rfc.md` | Criar RFC (Request For Comments) |
| `eng.build-tech-spec.md` | Criar especificação técnica (Delivery Spec ou Reference Spec) |
| `eng.light-arch.md` | Design arquitetural leve |
| `eng.rpa.robot.md` | Criar robô novo ou manter existente — análise, scaffolding, impl, docs, PR |
| `eng.spec-consolidate.md` | Consolidar no Central docs o que a entrega implementou, por funcionalidade (publicar, arquivar, finalizar) |
| `eng.daily-report.md` | Juntar os `daily.md` das sessões em um relatório por dia, com alertas das sessões sem `daily.md` |
| `eng.frontend-component.md` | Criar ou refatorar componente frontend com qualidade (design system vs remote, a11y, testes) |
| `eng.frontend-review.md` | Revisão de código específica para PRs frontend (TypeScript, tokens, a11y, MFE) |
| `eng.frontend-perf-audit.md` | Auditoria de performance frontend (Core Web Vitals, bundle, diagnóstico por métrica) |

---

## Relação Command → Workflow

Na IDE, cada workflow é instalado como command na pasta de comandos dela (ex.: `.claude/commands/`); o nome do command é o nome do arquivo.

---

## Fluxos de Trabalho Típicos

### 1. Inicialização de Projeto
```bash
/jarvis-init
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
