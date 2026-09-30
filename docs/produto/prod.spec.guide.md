# `prod.spec.guide` — qual especificação usar?

Ponto de entrada para quem desenvolve e precisa escolher um `prod.spec.*` **em segundos**.

Detalhes e exemplos longos: [README do universo de produto](./README.md) e as páginas de cada comando.  
Comando “estou perdido”: [`/prod.spec`](./prod.spec.md).

---

## Respostas rápidas

| Pergunta | Use |
|----------|-----|
| Estou começando algo novo e não sei o tipo | [`/prod.spec`](./prod.spec.md) → depois a árvore abaixo |
| Tenho só uma ideia e não sei se vale a pena | [`prod.spec.discovery`](./prod.spec.discovery.md) — investigação inicial (rascunho) |
| Preciso do “quê / por quê” do produto ou iniciativa | [`prod.spec.prd`](./prod.spec.prd.md) — Documento de Requisitos de Produto |
| Preciso detalhar comportamento de uma feature | [`prod.spec.frd`](./prod.spec.frd.md) — Documento de Requisitos Funcionais |
| A spec ficou grande demais | [`prod.spec.breakdown`](./prod.spec.breakdown.md) |
| Há ambiguidades / furos | [`prod.spec.clarify`](./prod.spec.clarify.md) |
| Preciso agrupar várias histórias sob um tema | [`prod.spec.epic`](./prod.spec.epic.md) |
| Preciso de história, tarefa ou bug (unidade da sprint) | [`prod.spec.issue`](./prod.spec.issue.md) |

Não há ordem obrigatória. Combine quando fizer sentido (ex.: Documento de Requisitos Funcionais → esclarecer → quebrar → épico → histórias).

---

## Árvore de decisão

```text
O que você precisa agora?

├─ Não sei qual documento criar
│  └─ /prod.spec
│
├─ Só tenho uma ideia crua; não sei se o problema é real nem se é viável
│  └─ prod.spec.discovery   (rascunho; depois prd, frd ou issue)
│
├─ Definir visão / problema / escopo macro do produto ou iniciativa
│  └─ prod.spec.prd   (Documento de Requisitos de Produto)
│
├─ Detalhar comportamento, regras e aceite de UMA feature
│  └─ prod.spec.frd   (Documento de Requisitos Funcionais)
│
├─ Tirar dúvidas ou preencher buracos numa spec que JÁ existe
│  └─ prod.spec.clarify
│
├─ A spec (ou a iniciativa) ficou grande demais para executar
│  └─ prod.spec.breakdown  → depois epic e/ou issue
│
├─ Organizar um bloco de valor multi-sprint (agrupar trabalho)
│  └─ prod.spec.epic
│
└─ Criar unidade executável (história / tarefa / bug)
   └─ prod.spec.issue
```

**Atalho mental:** ideia (`discovery`, opcional) → macro (`prd`) → detalhe (`frd`) → clareza (`clarify`) → fatia (`breakdown`) → tema (`epic`) → card (`issue`) → `/eng.start`. Pule degraus se o escopo já for pequeno.

---

## Comparativo (quando usar × quando não)

| Spec | Use quando | Não use quando |
|------|------------|----------------|
| `discovery` | Só existe uma ideia; o problema e a viabilidade ainda não foram investigados | Já sabe o que construir (`prd`, `frd` ou `issue`) |
| `prd` | Iniciativa nova, pivot, “não tem nada escrito” | Ajuste mínimo de UI / um card óbvio |
| `frd` | Feature com fluxos, erros, papéis, aceite rico | Ainda não há problema/valor claros (`prd` antes) |
| `clarify` | Spec existe mas está ambígua **antes** de codar | Ainda não há arquivo de spec |
| `breakdown` | Monolito; “por onde começamos?” | Ambígua (clarify primeiro) ou já cabe numa issue |
| `epic` | Tema multi-sprint / várias histórias | Uma história só; ou só visão de produto (`prd`) |
| `issue` | Trabalho da sprint, bug, tarefa técnica ligada a valor | Tema enorme sem fatia (`epic`/`breakdown`) |

---

## Uma ficha por spec

### `prod.spec.prd` — Documento de Requisitos de Produto

| | |
|--|--|
| **Problema que resolve** | Ninguém alinhou *o quê* e *por quê* no nível do produto/iniciativa |
| **Resultado esperado** | Markdown macro em `$PROD_DOCS/prd-…/` (problema, personas, valor, fora de escopo, sucesso) |
| **Próximo passo** | `clarify` se houver furos → `frd` e/ou `breakdown` / `epic` |
| **Exemplo** | “Vamos lançar módulo de convites para times e não temos nada documentado.” |

### `prod.spec.frd` — Documento de Requisitos Funcionais

| | |
|--|--|
| **Problema que resolve** | “Queremos a feature X” sem fluxos, regras nem critérios de aceite |
| **Resultado esperado** | `frd-…md` na pasta do documento macro pai |
| **Próximo passo** | `clarify` → `issue` (ou `breakdown`/`epic` se ainda for grande) |
| **Exemplo** | “Detalhar aceitar convite por e-mail (expirado, usuário novo, já logado).” |

### `prod.spec.breakdown` — quebra em fatias

| | |
|--|--|
| **Problema que resolve** | Spec boa, mas impossível de entregar de uma vez |
| **Resultado esperado** | Plano (versões → épicos → títulos de histórias); **não** cria 20 cards sozinho |
| **Próximo passo** | Materializar com `epic` e `issue`; primeira fatia → `/eng.start` |
| **Exemplo** | “Central de notificações: push + e-mail + in-app + admin.” |

### `prod.spec.discovery` — investigação inicial de uma ideia

| | |
|--|--|
| **Problema que resolve** | Especificar uma ideia com problema e requisitos presumidos, sem saber se é real ou viável |
| **Resultado esperado** | Rascunho `discovery-…md` com hipóteses, viabilidade, veredito e próximo passo sugerido; não cria tarefas |
| **Próximo passo** | Só uma sugestão: `prd` (e `breakdown`), `frd`, `issue`, retomar o discovery ou arquivar |
| **Exemplo** | “E se o Jarvis gerasse relatórios de uso?” |

### `prod.spec.clarify` — esclarecimento

| | |
|--|--|
| **Problema que resolve** | Ambiguidades caras se descobertas no `/eng.work` |
| **Resultado esperado** | Spec atualizada com decisões; poucas perguntas certeiras |
| **Próximo passo** | `breakdown` / `epic` / `issue` → engenharia |
| **Exemplo** | “O FRD não diz o que acontece com convite expirado.” |

### `prod.spec.epic` — épico

| | |
|--|--|
| **Problema que resolve** | Várias histórias sem guarda-chuva de valor / prioridade |
| **Resultado esperado** | `epic-…md` com resultado de usuário e aceite de alto nível |
| **Próximo passo** | Várias `issue` → `/eng.start` na primeira |
| **Exemplo** | “Épico: onboarding do primeiro workspace.” |

### `prod.spec.issue` — história / tarefa / bug

| | |
|--|--|
| **Problema que resolve** | Falta a unidade que entra no board e no `/eng.start` |
| **Resultado esperado** | `story-|task-|bug-…md` com aceite testável |
| **Próximo passo** | `/eng.start` → `/eng.plan` → `/eng.work` → `/eng.pr` |
| **Exemplo** | “Como convidado, quero aceitar o link do e-mail para entrar no workspace.” |

---

## Como as specs se relacionam (sem ordem fixa)

```text
prd ──┬── clarify ──┬── frd ── clarify ──┬── issue ── eng.*
      │             │                    │
      │             └── breakdown ── epic ── issue ── eng.*
      │
      └── epic ── issue ── eng.*     (projeto já em andamento, sem macro novo)

issue sozinha                         (bug / ajuste claro, escopo mínimo)
```

- **`clarify` + qualquer spec:** melhora o arquivo **antes** de fatiar ou codar.  
- **`breakdown` + `epic` + `issue`:** breakdown é o mapa; epic/issue são a materialização.  
- **`frd` sem `prd`:** ok se a feature for local e o contexto do produto já existir na cabeça/código — registre o vínculo quando houver pasta pai.  
- **`epic`/`issue` sem `prd`:** permitido; ofereça criar o documento macro se a iniciativa for grande.

---

## Anti-padrões (escolha errada)

| Situação | Evite | Prefira |
|----------|-------|---------|
| “Só um botão” | `prd` | `issue` |
| Feature rica sem fluxos | só `issue` | `frd` (+ `clarify`) |
| Spec vaga e já quer quebrar | só `breakdown` | `clarify` → depois `breakdown` |
| Um card que é um tema de 2 meses | uma `issue` | `breakdown` / `epic` |
| Lista de tarefas de banco sem valor | `breakdown` “técnico” | fatia com resultado de usuário + `issue` |

---

## Depois da spec

Engenharia no Jarvis: `/eng.start` → `/eng.plan` → `/eng.work` → `/eng.pre-pr` → `/eng.pr`  
Use o mesmo `TASK_MANAGER_KEY` (card do board ou controle freelance).

Rules do agente: [`rules/product/prod-rules.md`](../../rules/product/prod-rules.md).
