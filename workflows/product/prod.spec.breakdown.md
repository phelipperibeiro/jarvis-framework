---
name: prod.spec.breakdown
description: Quebra uma especificação de produto grande (Documento de Requisitos de Produto ou Documento de Requisitos Funcionais) em fatias gerenciáveis — versões, épicos e histórias — sem perder o objetivo de valor.
auto_execution_mode: 3
env_file: "@/ENV.md"
recommended_model: claude-sonnet-4-20250514
model_tier: high
model_justification: Breakdown de produto exige julgamento de valor, sequenciamento e decomposição em entregas incrementais
---

# Quebra de especificação (breakdown)

Este comando transforma uma especificação **grande demais para executar de uma vez** em um **plano detalhado (breakdown)**: versões / releases, épicos e esboço de histórias ou tarefas — com foco em **valor perceptível ao usuário**, não só em camadas técnicas.

Antes de iniciar, revise as regras invioláveis em `$PROD_RULES/**/*`. Se a variável for desconhecida, leia `.$IDE/rules/product/**/*.*`.

Guia humano (termos por extenso): `docs/produto/prod.spec.breakdown.md`.

Utilize o `$ARGUMENTS` como ponto de partida (caminho da spec, nome da feature ou descrição do que fatiar):

<requirement>
#$ARGUMENTS
</requirement>

## Quando usar

- Documento de Requisitos de Produto ou Documento de Requisitos Funcionais monolítico
- Time pergunta “por onde começamos?”
- Precisa de milestones / entregas parciais antes de criar vários épicos à mão
- Antes de `/prod.spec.epic` em série ou de um tsunami de `/prod.spec.issue`

## Quando **não** usar

- Spec ainda ambígua → execute `$PROD_FLOWS/prod.spec.clarify.md` **primeiro**
- Escopo já cabe em uma história → `$PROD_FLOWS/prod.spec.issue.md`
- Só quer um único épico sem árvore de releases → `$PROD_FLOWS/prod.spec.epic.md`
- Quebra de **tech spec** em subtarefas de engenharia → isso é `eng.breakdown-subtasks` (outro domínio)

## Pré-requisitos

1. Existir (ou o usuário apontar) um Documento de Requisitos de Produto e/ou Documento de Requisitos Funcionais em `$PROD_DOCS` (ou path explícito nos argumentos).
2. Se não houver spec pai: ofereça criar com `$PROD_FLOWS/prod.spec.prd.md` ou `$PROD_FLOWS/prod.spec.frd.md`. Não invente escopo do zero sem confirmação.
3. Se a spec estiver cheia de “talvez” / “depois a gente vê”: sugira clarify antes; só continue se o usuário assumir o risco.

## Template

O artefato de breakdown segue o template `$PROD_TEMPLATES/prod-breakdown-template.md`.

## Busca no Central Docs (condicional)

Se `CENTRAL_DOCS_REPO` estiver no `ENV.md`:

1. `jarvis docs sync --silent` (best-effort)
2. Localizar Documento de Requisitos de Produto / funcional relacionado (nome, tags, `TASK_MANAGER_KEY`)
3. Usar como contexto; se não achar, seguir com arquivos locais em `$PROD_DOCS`

## Sessões

- Rascunhos WIP: `$SESSIONS_DIR/prod/{TASK_MANAGER_KEY}/`
- Artefato canônico do breakdown: sob a pasta do Documento de Requisitos de Produto pai em `$PROD_DOCS` (não substitua a pasta de sessão pela canônica)

## Resultado esperado

1. Arquivo de **plano detalhado (breakdown)** em Markdown, no idioma da conversa.
2. Convenção de nome sugerida (ajuste ao padrão de `prod-rules` se o projeto já tiver um):

   `$PROD_DOCS/prd-{id}-{slug}/breakdown-{id}-{slug}.md`

   Se não houver pasta de Documento de Requisitos de Produto, confirme com o usuário onde gravar.
3. Árvore validada com o usuário: Versão → Épico → Histórias/tarefas (títulos + intenção de valor).
4. Lista ordenada da **primeira fatia recomendada** para começar engenharia.

**Não** crie automaticamente dezenas de arquivos de épico/história sem perguntar. O breakdown é o mapa; a materialização usa:

- `$PROD_FLOWS/prod.spec.epic.md`
- `$PROD_FLOWS/prod.spec.issue.md`

## Diretrizes de produto (obrigatórias)

- Prefira **fatias verticais** (usuário percebe valor) a fatias só técnicas (“primeiro só o banco”).
- Cada épico proposto deve ter resultado de usuário em uma frase.
- Histórias esboçadas devem parecer INVEST o suficiente para virar issue depois (não detalhe aceite micro aqui se for só título — deixe para `prod.spec.issue`).
- Explicitar **fora de escopo** de cada versão quando fizer diferença de prioridade.
- Dependências e caminho crítico: só o necessário para não planejar o impossível.
- Idioma padrão: português do Brasil (salvo pedido do usuário).
- Nunca inventar métricas, datas ou stakeholders — perguntar ou marcar como pendente.

## Etapas de execução

### 1. Carregar contexto

- Ler `$IDE/ENV.md` (pastas `PROD_*`, `SESSIONS_DIR`, `TASK_MANAGER`)
- Localizar e ler a spec pai (Documento de Requisitos de Produto e/ou Documento de Requisitos Funcionais)
- Resumir em 3–5 bullets o problema, valor e restrições (confirmar com o usuário se estiver incerto)

### 2. Detectar se precisa de clarify

Se houver ambiguidades bloqueantes (papéis, regras de negócio críticas, fora de escopo indefinido):

- Oferecer `$PROD_FLOWS/prod.spec.clarify.md`
- Só seguir no breakdown se o usuário confirmar

### 3. Propor a árvore de entregas

Montar rascunho interno (ainda sem gravar arquivo final):

```
Versão / Release
  └── Épico (valor)
        └── Histórias / tarefas (títulos)
```

Perguntar **uma coisa por vez** (usar AskUserQuestion se disponível; senão tabela A/B/C/D das prod-rules):

- Ordem de valor (o que aprender primeiro com usuários?)
- Quantas versões fazem sentido agora (evitar over-planning)
- Se alguma fatia é spike / risco técnico consciente

### 4. Validar o relacionamento

Mostrar a árvore ao usuário e **pedir confirmação explícita** antes de gravar o breakdown (o template exige isso).

### 5. Gerar o artefato

- Gerar o artefato seguindo o template de breakdown (`$PROD_TEMPLATES/prod-breakdown-template.md`)
- Preencher resumo, lançamentos, épicos, dependências (seções opcionais só se o usuário pedir ou se forem críticas)
- Gravar em `$PROD_DOCS/...` (ou path acordado)
- Atualizar índice/docs existentes se o projeto já tiver índice de produto

### 6. Oferecer próximos comandos

Ao final, perguntar o que materializar agora:

| Opção | Comando |
|-------|---------|
| Criar o primeiro épico | `$PROD_FLOWS/prod.spec.epic.md` |
| Criar histórias da primeira fatia | `$PROD_FLOWS/prod.spec.issue.md` |
| Esclarecer um ramo ainda frouxo | `$PROD_FLOWS/prod.spec.clarify.md` |
| Ir para engenharia na fatia 1 | `/eng.start` (com `TASK_MANAGER_KEY`) |

## Do / Don’t

**Do**

- Manter rastreio ao documento pai
- Nomear fatias pelo resultado de usuário
- Deixar explícito o que **não** entra na versão 1

**Don’t**

- Transformar breakdown em lista de tarefas de infra sem história de valor
- Criar 15 épicos “por precaução”
- Copiar a spec pai inteira no arquivo de breakdown
- Confundir com `eng.breakdown-subtasks` (tech spec → subtarefas de código)

## Status

Itens criados ou referenciados devem respeitar `$ITEM_STATUS` das prod-rules (`icebox`, `in_review`, `backlog`, …). Breakdown recém-criado em geral nasce como `in_review` até o usuário priorizar a versão 1 (`backlog`).
