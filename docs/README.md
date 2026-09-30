# Documentação do Jarvis

Índice da pasta `docs/`. O [README](../README.md) na raiz é a **leitura rápida** (install/sync). Aqui está o material **detalhado**.

| Documento | Conteúdo |
|-----------|----------|
| [visao-geral.md](./visao-geral.md) | Proposta, CDD, conceitos, como as peças se montam, fluxos |
| [estrutura/](./estrutura/README.md) | Cada arquivo/pasta da raiz explicado em subpáginas |
| [engenharia/](./engenharia/README.md) | Universo de engenharia: um guia por comando `/eng.*` |
| [comandos.md](./comandos.md) | Consulta rápida: todos os comandos `eng.*` e `prod.*` numa página |
| [produto/](./produto/README.md) | Universo de produto (PM/PO) + um guia por comando `/prod.spec*` |
| [produto/prod.spec.guide.md](./produto/prod.spec.guide.md) | **Qual spec usar?** — árvore de decisão |

## Estrutura do repositório (mapa)

```
jarvis/
├── README.md              → leitura rápida
├── AGENTS.md              → instruções para agentes de IA neste repo
├── LICENSE                → AGPL-3.0
├── package.json           → pacote jarvis-framework + bin jarvis
├── taxonomy.md            → squads / hubs / positions / areas válidos
├── members.md             → lista de membros (opcional, org)
├── agents/                → personas de IA
├── skills/                → playbooks executáveis
├── workflows/             → comandos slash / fluxos
├── rules/                 → guardrails (filtrados por perfil)
├── templates/             → ENV + modelos de documento
├── bin/                   → CLI (jarvis init, list, …)
├── docs/                  → esta documentação
├── issues/                → pendências / notas internas do framework
└── node_modules/          → dependências locais de desenvolvimento (não é o produto)
```

Detalhe de cada item: [estrutura/README.md](./estrutura/README.md).

**Versão:** ver `package.json` · Repo: [phelipperibeiro/jarvis-framework](https://github.com/phelipperibeiro/jarvis-framework)
