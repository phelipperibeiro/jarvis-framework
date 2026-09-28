# AGENTS.md - Pasta templates/

Instrucoes especificas para agentes de IA que manipulam a pasta de templates.

---

## Proposito desta Pasta

A pasta `templates/` contem **modelos de documentos** usados pelo framework para gerar artefatos padronizados (ARD, RFC, Tech Spec, PR, etc.).

---

## Estrutura

```
templates/
├── engineering/                    # Templates tecnicos
│   ├── architecture-template.md    # Template de arquitetura
│   ├── ARD-template.md             # Architecture Review Document
│   ├── RFC-template.md             # Request For Comments
│   ├── RFC-Playbook@1.0.0.md       # Playbook para RFCs
│   ├── tech-spec-template.md       # Especificacao tecnica
│   ├── plan-template.md            # Plano de execucao
│   ├── work-progress-template.md   # Progresso de trabalho
│   ├── PR-template.md              # Pull Request
│   ├── c4-model-template.md        # Diagramas C4
│   ├── AGENTS-template.md          # Template de AGENTS.md
│   ├── CONTACTS-template.md        # Template de contatos
│   └── qa/                         # Templates de QA
│       ├── test-plan-template.md
│       └── quality-gate-template.md
└── product/                        # Templates de produto
    ├── PRD-template.md             # Product Requirements Document
    ├── FRD-template.md             # Feature Requirements Document
    ├── epic-template.md            # Epicos
    ├── story-template.md           # User Stories
    └── issue-template.md           # Issues/Tasks
```

---

## Convencoes de Nomenclatura

| Tipo | Padrao | Exemplos |
|------|--------|----------|
| Template padrao | `{nome}-template.md` | `ARD-template.md` |
| Template com versao | `{nome}@{versao}.md` | `RFC-Playbook@1.0.0.md` |
| Template de QA | `qa/{nome}-template.md` | `qa/test-plan-template.md` |

---

## Estrutura de um Template

Todo template deve seguir o padrao:

```markdown
# {Nome do Documento}

> Template para {proposito}. Substitua os placeholders {...}.

## Metadados

| Campo | Valor |
|-------|-------|
| Autor | {autor} |
| Data | {data} |
| Versao | {versao} |

## Secao 1
{conteudo}

## Secao 2
{conteudo}

---

**Notas para o agente**:
- Instrucao 1
- Instrucao 2
```

---

## Placeholders

Use chaves `{...}` para indicar campos a serem preenchidos:

| Placeholder | Descricao |
|-------------|-----------|
| `{nome}` | Nome do documento/feature |
| `{autor}` | Autor do documento |
| `{data}` | Data de criacao |
| `{versao}` | Versao do documento |
| `{descricao}` | Descricao do conteudo |
| `{...}` | Conteudo especifico |

---

## Templates por Dominio

### Engineering

| Template | Uso | Comando |
|----------|-----|---------|
| `architecture-template.md` | Design arquitetural | `/eng.start` |
| `ARD-template.md` | Revisao de arquitetura | `/eng.create-ard` |
| `RFC-template.md` | Proposta de mudanca | `/eng.create-rfc` |
| `tech-spec-template.md` | Especificacao tecnica | `/eng.build-tech-spec` |
| `plan-template.md` | Plano de execucao | `/eng.plan` |
| `PR-template.md` | Pull Request | `/eng.pr` |

### Product

| Template | Uso | Comando |
|----------|-----|---------|
| `PRD-template.md` | Requisitos de produto | `/prod.spec.prd` |
| `FRD-template.md` | Requisitos de feature | `/prod.spec.frd` |
| `epic-template.md` | Epicos | `/prod.spec.epic` |
| `story-template.md` | User Stories | `/prod.spec.issue` |

---

## Regras

### Nunca

- Modificar template sem atualizar workflows dependentes
- Remover campos obrigatorios de um template
- Criar template sem placeholders claros
- Usar formatacao inconsistente entre templates
- Criar template duplicado (verifique antes)

### Sempre

- Manter consistencia visual entre templates do mesmo dominio
- Documentar campos obrigatorios vs opcionais
- Incluir notas para o agente quando necessario
- Versionar templates com mudancas significativas
- Atualizar este AGENTS.md ao adicionar novo template

---

## Relacao com Outros Componentes

| Componente | Relacao |
|------------|---------|
| Workflows | Workflows usam templates para gerar documentos |
| Skills | Skills referenciam templates para outputs |
| Commands | Commands disparam workflows que usam templates |
| Rules | Rules definem quando usar cada template |

---

## Criando Novo Template

1. Identificar necessidade (nao duplicar existente)
2. Seguir convencao de nomenclatura
3. Definir placeholders claros
4. Incluir metadados padrao
5. Adicionar notas para o agente
6. Atualizar este AGENTS.md
7. Vincular ao workflow correspondente

---

## Validacao de Template

Checklist ao criar/editar:

- [ ] Nomenclatura segue padrao
- [ ] Placeholders usam `{...}`
- [ ] Secao de metadados presente
- [ ] Notas para agente incluidas
- [ ] Consistente com templates do mesmo dominio
- [ ] AGENTS.md atualizado
- [ ] Workflow vinculado (se aplicavel)

---

## Referencias

- `../workflows/` - Workflows que usam templates
- `../skills/` - Skills que referenciam templates
- `../commands/` - Commands que disparam uso
- `../rules/` - Rules que governam templates

---

**Ultima atualizacao**: 2026-01-26