# `docs/` — documentação humana

## Para que serve

Material de leitura **para pessoas** (e para onboarding): proposta do framework, mapa do fork, e catálogo da estrutura do repo.

**Não** é a pasta `docs/` do produto do cliente. Templates de ARD/PRD ficam em `templates/`; docs gerados de um projeto alvo ficam no `DOCS_FOLDER` do ENV (geralmente `docs/` **dentro do workspace do produto**).

## Como é montado

```
docs/
├── README.md                         # índice desta pasta
├── visao-geral.md                    # proposta + conceitos + fluxos
├── comandos.md                       # consulta rápida: todos os comandos eng.* e prod.*
├── produto/                          # universo PM/PO + um guia por comando
│   ├── README.md
│   └── prod.spec*.md
├── engenharia/                       # universo de engenharia + um guia por comando eng.*
│   ├── README.md
│   └── eng.*.md
└── estrutura/
    ├── README.md                     # como as pastas se montam
    ├── raiz.md                       # README, AGENTS, LICENSE, package, taxonomy, members
    ├── agents.md
    ├── bin.md
    ├── docs.md                       # este arquivo
    ├── issues.md
    ├── node_modules.md
    ├── rules.md
    ├── skills.md
    ├── templates.md
    └── workflows.md
```

## Relação com o pacote npm

`docs/` **não** está em `package.json` → `files`. Continua no GitHub para leitura; não é copiado pelo `jarvis init` para `.$IDE/`.

## Relação com `jarvis docs sync`

O CLI `jarvis docs sync|fetch|publish` fala com o **Central docs**, a documentação aprovada da org (configurada no ENV: `CENTRAL_DOCS_STORAGE` + `CENTRAL_DOCS_LOCATION`; hoje uma pasta, com git opcional). Isso é outra coisa: docs de produto/arquitetura da org, não esta pasta `docs/` do framework.
