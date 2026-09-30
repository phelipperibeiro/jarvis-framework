# Universo de Produto no Jarvis (para quem desenvolve)

Este guia é para **desenvolvedoras e desenvolvedores** que querem se virar sozinhos no trabalho de produto — o mesmo território de Product Manager e Product Owner — usando o Jarvis a favor.

Leitura rápida de install: [README](../../README.md). Visão geral do framework: [visão geral](../visao-geral.md).

## O que você vai aprender aqui

1. A **pirâmide de especificações** (do “por quê” ao “o que fazer na sprint”)
2. **Quando** usar cada comando de produto
3. Como o Jarvis organiza pastas, status e o caminho até o código (`/eng.start` …)

## Papéis em linguagem simples

| Papel                | Em uma frase                                                                           |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Product Manager**  | Decide _o que_ construir e _por quê_ (problema, valor, prioridade)                     |
| **Product Owner**    | Mantém o backlog saudável: épicos, histórias, aceite, ordem de entrega                 |
| **Desenvolvedor(a)** | Entrega o _como_ com qualidade — e, neste framework, **também pode escrever as specs** |

No Jarvis, qualquer `POSITION` pode conduzir o card ponta a ponta. Você não precisa esperar um PM para rascunhar um Documento de Requisitos de Produto — mas precisa ser honesto sobre ambiguidades (aí entra o comando de esclarecimento).

## Pirâmide (do macro ao micro)

```
Discovery (opcional)                        ← rascunho de uma ideia: problema, hipóteses, viabilidade
        ↓
Documento de Requisitos de Produto          ← visão / problema / escopo macro
        ↓
Documento de Requisitos Funcionais          ← comportamento detalhado de uma feature
        ↓
Épico                                       ← fatia grande de valor (várias sprints)
        ↓
História de usuário / Tarefa / Bug          ← unidade da sprint
```

O `discovery` vem **antes** do topo: é um rascunho para decidir se vale especificar. Esclarecimento (`clarify`) e quebra (`breakdown`) **atravessam** a pirâmide: melhoram ou fatiam o que já existe.

## Comandos (uma página cada)

**Dúvida “qual spec?”** → comece por [`prod.spec.guide.md`](./prod.spec.guide.md) (árvore de decisão).

| Comando na IDE         | Documento                                          | Use quando…                                   |
| ---------------------- | -------------------------------------------------- | --------------------------------------------- |
| `/prod.spec`           | [prod.spec.md](./prod.spec.md)                     | Não sabe por onde começar                     |
| `/prod.spec.discovery` | [prod.spec.discovery.md](./prod.spec.discovery.md) | Só tem uma ideia e quer investigá-la antes     |
| `/prod.spec.prd`       | [prod.spec.prd.md](./prod.spec.prd.md)             | Precisa do documento macro de produto         |
| `/prod.spec.frd`       | [prod.spec.frd.md](./prod.spec.frd.md)             | Precisa detalhar comportamento de uma feature |
| `/prod.spec.breakdown` | [prod.spec.breakdown.md](./prod.spec.breakdown.md) | Precisa fatiar uma spec grande                |
| `/prod.spec.clarify`   | [prod.spec.clarify.md](./prod.spec.clarify.md)     | A spec está ambígua antes de planejar código  |
| `/prod.spec.epic`      | [prod.spec.epic.md](./prod.spec.epic.md)           | Precisa agrupar várias histórias sob um tema  |
| `/prod.spec.issue`     | [prod.spec.issue.md](./prod.spec.issue.md)         | Precisa da unidade de trabalho da sprint      |

Relacionado (roadmap): workflow `prod.roadmap.preview` — visão de planejamento; não substitui as specs acima.

## Como o Jarvis te ajuda na prática

1. **`ENV.md`** — define pastas (`PROD_DOCS`, `PROD_FLOWS`, `PROD_RULES`, …). Sem isso, rode `/init-jarvis`.
2. **Rules** — `rules/product/prod-rules.md` são as regras invioláveis (idioma, status, nomes de arquivo).
3. **Workflows** — os arquivos em `workflows/product/` são o “roteiro” que a IA segue ao você digitar o comando.
4. **Skills** — `prod-specs` / `prod-specs-update` geram e sincronizam o Markdown final.
5. **Sessões** — rascunhos em `.jarvis/sessions/prod/{TASK_MANAGER_KEY}/`; a versão canônica fica em `$PROD_DOCS`.
6. **Depois da spec** — engenharia: `/eng.start` → `/eng.plan` → `/eng.work` → `/eng.pr`.

## Status dos itens (`$ITEM_STATUS`)

| Status          | Significado                         |
| --------------- | ----------------------------------- |
| `icebox`        | Ideia ainda sem prioridade/escopo   |
| `in_review`     | Em descoberta ou revisão            |
| `backlog`       | Pronto para priorizar implementação |
| `in_progress`   | Em desenvolvimento                  |
| `in_production` | Em produção                         |
| `cancelled`     | Descontinuado                       |

## Onde os arquivos nascem

Padrão (ver `prod-rules.md`):

- Documento de Requisitos de Produto → `$PROD_DOCS/prd-{id}-{nome}/prd-{id}-{nome}.md`
- Documento de Requisitos Funcionais → dentro da pasta daquele produto → `frd-{id}-{nome}.md`
- Épico → `…/issues/epic-{id}-{nome}.md`
- História / tarefa → `…/issues/{story\|task}-{id}-{nome}.md`

## Glossário (sempre por extenso neste guia)

| Evite só a sigla | Prefira                                                          |
| ---------------- | ---------------------------------------------------------------- |
| “o PRD”          | **Documento de Requisitos de Produto**                           |
| “o FRD / RFD”    | **Documento de Requisitos Funcionais**                           |
| “a issue”        | **história de usuário**, **tarefa** ou **bug** (seja específico) |
| “o epic”         | **épico**                                                        |

Siglas podem aparecer **entre parênteses na primeira menção** de cada página; no resto do texto, use a forma longa.

## Ordem sugerida para um feature novo

```
/prod.spec          (se estiver perdido)
    → /prod.spec.discovery  (opcional: só tem uma ideia)
    → /prod.spec.prd
    → /prod.spec.clarify
    → /prod.spec.frd        (feature a feature)
    → /prod.spec.breakdown  (se ainda estiver grande)
    → /prod.spec.epic
    → /prod.spec.issue
    → /eng.start …
```

Nem todo projeto precisa de todos os degraus. Freelance com escopo pequeno pode ir de um Documento de Requisitos Funcionais curto + histórias. O importante é **não pular o esclarecimento** se ainda houver “talvez”, “depende” ou “a gente vê depois”.

Regras oficiais do agente: [`rules/product/prod-rules.md`](../../rules/product/prod-rules.md).
