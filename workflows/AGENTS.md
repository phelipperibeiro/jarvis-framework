# AGENTS.md - Pasta workflows/

Instrucoes especificas para agentes de IA que manipulam a pasta de workflows.

---

## Proposito desta Pasta

A pasta `workflows/` contem os **templates de execucao** dos comandos slash. Cada workflow define o passo a passo que um comando deve seguir.

---

## Estrutura

```
workflows/
├── init.md                         # Inicializacao do framework
├── warm-up.md                      # Preparacao de sessao
├── warm-up@1.1.md                  # Versao alternativa
├── help.md                         # Guia de ajuda
├── all-tools.md                    # Listar ferramentas
│
├── docs/                           # Workflows de documentacao
│   ├── build-product-docs.md
│   ├── build-business-docs.md
│   ├── build-tech-docs.md
│   └── build-index.md
│
├── product/                        # Workflows de produto
│   ├── prod.spec.md               # Entrypoint de specs
│   ├── prod.spec.prd.md           # Documento de Requisitos de Produto
│   ├── prod.spec.frd.md           # Documento de Requisitos Funcionais
│   ├── prod.spec.breakdown.md     # Quebra em versões / épicos / histórias
│   ├── prod.spec.epic.md          # Epicos
│   ├── prod.spec.issue.md         # Issues
│   └── prod.spec.clarify.md       # Clarificacao
│
└── engineering/                    # Workflows de engenharia
    ├── eng.start.md               # Inicio de desenvolvimento
    ├── eng.plan.md                # Planejamento
    ├── eng.work.md                # Execucao
    ├── eng.pre-pr.md              # Validacao pre-PR
    ├── eng.pr.md                  # Criacao de PR
    ├── eng.review.md              # Revisao
    ├── eng.debug.md               # Debug
    ├── eng.docs.md                # Documentacao
    ├── eng.create-ard.md          # Criar ARD
    ├── eng.create-ard-from-code.md
    ├── eng.create-rfc.md          # Criar RFC
    ├── eng.build-tech-spec.md     # Tech Spec
    ├── eng.breakdown-subtasks.md  # Subtarefas
    ├── light-arch.md              # Design leve
    ├── frontend/
    │   ├── eng.frontend-component.md   # Criar/refatorar componente frontend
    │   ├── eng.frontend-review.md      # Revisão de PR frontend
    │   └── eng.frontend-perf-audit.md  # Auditoria de performance (Core Web Vitals)
    └── qa/
        └── eng-qa-quality-gate-validation.md
```

---

## Relacao Command → Workflow

Cada command em `commands/` referencia um workflow:

```markdown
# nome-do-command
Utilize o arquivo `../../workflows/[dominio]/nome-do-workflow.md` como template.
```

| Command | Workflow |
|---------|----------|
| `/init` | `init.md` |
| `/warm-up` | `warm-up.md` |
| `/eng.start` | `engineering/eng.start.md` |
| `/eng.plan` | `engineering/eng.plan.md` |
| `/eng.work` | `engineering/eng.work.md` |
| `/eng.pr` | `engineering/eng.pr.md` |
| `/eng.frontend-component` | `engineering/frontend/eng.frontend-component.md` |
| `/eng.frontend-review` | `engineering/frontend/eng.frontend-review.md` |
| `/eng.frontend-perf-audit` | `engineering/frontend/eng.frontend-perf-audit.md` |
| `/prod.spec.prd` | `product/prod.spec.prd.md` |

---

## Convencoes de Nomenclatura

| Tipo | Padrao | Exemplos |
|------|--------|----------|
| Workflow global | `{nome}.md` | `init.md`, `warm-up.md` |
| Workflow versionado | `{nome}@{versao}.md` | `warm-up@1.1.md` |
| Workflow de engenharia | `eng.{acao}.md` | `eng.start.md`, `eng.pr.md` |
| Workflow de produto | `prod.{acao}.md` | `prod.spec.prd.md` |
| Workflow de docs | `build-{tipo}-docs.md` | `build-tech-docs.md` |

---

## Estrutura de um Workflow

Todo workflow deve conter:

```markdown
# {Nome do Workflow}

## Objetivo
O que este workflow faz.

## Pre-requisitos
- Validar ENV.md
- Outros requisitos

## Entrada
- `$ARGUMENTS` - Descricao
- Outros inputs

## Fluxo de Execucao

### Fase 1: {Nome}
1. Passo 1
2. Passo 2

### Fase 2: {Nome}
1. Passo 1
2. Passo 2

## Output
Artefatos gerados.

## Mensagem de Conclusao
Feedback ao usuario.
```

---

## Fases de Desenvolvimento

Workflows de engenharia seguem fases restritas:

| Fase | Workflows | Restricao |
|------|-----------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente analise, SEM codigo |
| Implementacao | `eng.work` | Codigo e testes, SEM commits |
| Entrega | `eng.pr` | Branch, commit e PR |

**IMPORTANTE**: Respeitar estritamente as restricoes de cada fase.

---

## Workflows vs Skills

| Aspecto | Workflows | Skills |
|---------|-----------|--------|
| Define | O que fazer | Como fazer |
| Nivel | Macro (fases) | Micro (passos) |
| Ativacao | Via comando slash | Via workflow ou manual |
| Escopo | Fluxo completo | Tarefa especifica |

**Regra**: Workflows podem invocar skills para tarefas especificas.

---

## Regras

### Nunca

- Criar workflow sem command correspondente
- Pular validacao de ENV.md (exceto `/init`)
- Misturar fases de desenvolvimento em um workflow
- Executar codigo em fase de planejamento
- Fazer commit em fase de implementacao
- Duplicar workflow existente

### Sempre

- Validar ENV.md no inicio (exceto `/init`)
- Respeitar restricoes de fase
- Definir output esperado
- Incluir mensagem de conclusao
- Manter consistencia com workflows similares
- Referenciar templates quando aplicavel

---

## Fluxos Tipicos

### Inicializacao de Projeto

```bash
/init
/warm-up
/prod.spec.prd
```

### Nova Feature

```bash
/warm-up
/prod.spec.frd
/eng.start "feature-id"
/eng.plan "feature-id"
/eng.work "feature-id"
/eng.pre-pr
/eng.pr
```

### Documentacao

```bash
/warm-up
/build-product-docs
/build-tech-docs
/build-index
```

---

## Criando Novo Workflow

1. Identificar necessidade (verificar existentes)
2. Criar command em `commands/`
3. Criar workflow seguindo estrutura padrao
4. Definir restricoes de fase (se engenharia)
5. Vincular a templates (se aplicavel)
6. Atualizar README.md
7. Testar fluxo completo

---

## Referencias

- `README.md` - Lista completa de workflows
- `../commands/` - Commands que invocam workflows
- `../skills/` - Skills invocados por workflows
- `../templates/` - Templates usados por workflows
- `../rules/` - Regras que governam workflows

---

**Ultima atualizacao**: 2026-01-26