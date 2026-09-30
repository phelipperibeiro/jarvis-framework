# `/prod.spec.frd` — Documento de Requisitos Funcionais

Workflow: `workflows/product/prod.spec.frd.md`  
Template: `templates/product/prod-frd-template.md`

## Em uma frase

Cria ou atualiza o **Documento de Requisitos Funcionais** (*Functional Requirements Document*) — o comportamento detalhado de **uma** capacidade.

## O que é (universo de produto)

Onde o Documento de Requisitos de Produto fala do produto inteiro (ou de uma iniciativa grande), o Documento de Requisitos Funcionais fala:

- Fluxos do usuário (passo a passo)
- Regras de negócio
- Estados da interface e mensagens
- Critérios de aceite da feature
- Casos extremos (erros, permissões, vazio, mobile…)

É a ponte entre “queremos convites” e “a história X entra no board”. Product Owner usa isso para aceitar entrega; engenharia usa para não inventar regra na pressa.

> Nas rules antigas pode aparecer “RFD” — no Jarvis o artefato canônico é o **Documento de Requisitos Funcionais** (arquivo `frd-…`).

## Quando usar

- Feature com vários caminhos (happy path + erros + papéis diferentes)
- Precisa alinhar design + eng + QA no mesmo texto
- O documento macro já existe e agora você detalha um pedaço

## Quando **não** usar

- Ainda não há clareza do problema/valor → comece pelo Documento de Requisitos de Produto
- Trabalho trivial de uma sprint → história direta pode bastar
- Só quer fatiar escopo sem detalhar UX → breakdown / épico

## Exemplo

> “Dentro do módulo de convites, detalhar o fluxo de aceitar convite por e-mail.”

1. Confirme que existe pasta do Documento de Requisitos de Produto pai
2. `/prod.spec.frd aceitar convite por e-mail`
3. Saída típica:  
   `$PROD_DOCS/prd-001-convites-times/frd-001-aceitar-convite-email.md`
4. Revise critérios de aceite
5. [`/prod.spec.clarify`](./prod.spec.clarify.md) se sobrar “e se o token expirar?”
6. Quebre em histórias com [`/prod.spec.issue`](./prod.spec.issue.md)

## Como o framework te favorece

- Mantém o funcional **dentro** da pasta do documento macro (rastreabilidade)
- O comando aplica o template `prod-frd-template.md`
- Central docs (se configurado) evita duplicar feature já especificada em outro squad

## Relação com QA

Documento de Requisitos Funcionais bom vira roteiro de teste exploratório e base de Cypress/E2E. QA agradece critérios de aceite testáveis (“então vejo X”), não (“sistema deve ser intuitivo”).

## Próximo passo típico

[`clarify`](./prod.spec.clarify.md) → [`issue`](./prod.spec.issue.md) (ou [`epic`](./prod.spec.epic.md) se forem muitas histórias) → `/eng.start`
