# `agents/` — personas de IA

## Para que serve

Cada agent é um arquivo Markdown com **persona, postura e escopo**. Quando um workflow declara um agent (ou o usuário invoca `@eng.agent`), a IDE carrega esse arquivo como contexto de comportamento.

Agents **não** substituem skills: agent = *como* atuar; skill = *passos* detalhados.

## Como é montado

```
agents/
├── AGENTS.md                 # regras da pasta para a IA
├── README.md                 # lista humana
├── engineering/              # agentes de engenharia
│   ├── eng.agent.md          # agente principal (ATHENA)
│   ├── eng.bug-hunter.md
│   ├── eng.dev-code-reviewer.md
│   ├── eng.docs-writer.md
│   ├── eng.frontend.agent.md
│   ├── eng.rpa.agent.md             # ARACHNE
│   ├── eng.ux-designer.agent.md
│   ├── data/
│   │   └── eng.data-engineer.agent.md   # HEPHAESTUS
│   └── qa/
│       ├── eng.qa.test-planner.md
│       ├── eng.qa.testing-engineer.md
│       ├── eng.qa.test-architect.md
│       ├── eng.qa.quality-champion-task-agent.md
│       └── eng.qa.quality-strategist.md
└── product/
    ├── prod.pm-checker.md
    └── prod.discovery-interviewer.md
```

## No ciclo de vida

1. Versionados neste repo.
2. `jarvis init` copia `agents/` → `.$IDE/agents/`.
3. Workflows referenciam o agent no frontmatter (`agent: ...`).
4. OpenCode/Kiro podem transformar frontmatter no sync (ver `bin/lib/core/sync-engine.js`).

## Quando criar um agent novo

- Domínio novo com postura distinta (ex.: “só segurança”, “só triagem N2”).
- Se for só um playbook repetível → prefira **skill**, não agent.

Ver também: `agents/AGENTS.md`, `agents/README.md`.
