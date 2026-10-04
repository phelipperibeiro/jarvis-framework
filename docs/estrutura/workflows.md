# `workflows/` — fluxos e comandos slash

## Para que serve

Cada workflow é um Markdown que a IDE expõe como **comando** (`/eng.start`, `/eng.pr`, …). Define a **fase** do processo: o que pode/não pode fazer, qual agent chamar, quais skills acionar.

## Como é montado

```
workflows/
├── AGENTS.md
├── README.md
├── warm-up.md                 # aquecimento de contexto
├── taxonomy.md                # atalho /taxonomy
├── all-tools.md
├── engineering/
│   ├── eng.start.md
│   ├── eng.plan.md
│   ├── eng.work.md
│   ├── eng.pre-pr.md
│   ├── eng.pr.md
│   ├── eng.docs.md
│   ├── eng.debug.md
│   ├── eng.review.md
│   ├── eng.create-ard.md / eng.create-rfc.md / …
│   ├── eng.security-*.md
│   ├── eng.rpa.robot.md
│   ├── data/                  # data.new-pipeline, data.contract, …
│   ├── frontend/              # component, review, perf-audit, …
│   ├── qa/                    # fluxos QA
└── product/
    ├── prod.spec.md
    ├── prod.spec.discovery.md
    ├── prod.spec.prd.md
    ├── prod.spec.frd.md
    ├── prod.spec.epic.md
    ├── prod.spec.issue.md
    ├── prod.spec.clarify.md
    └── prod.roadmap.preview.md
```

## Flatten no `jarvis init`

Muitas IDEs (Windsurf, Cursor, …) **só carregam** workflows na raiz de `.$IDE/workflows/` (ou `commands/` no Claude).

O sync-engine **achata** subpastas: move `engineering/eng.start.md` → `workflows/eng.start.md`, etc., e remove pastas vazias.

Por isso, após o init, a árvore na IDE pode parecer “plana”, embora neste repo continue organizada por domínio.

## Claude vs outras IDEs

| IDE | Pasta de fluxos (`FLOWS_FOLDER`) |
|-----|----------------------------------|
| Claude | `commands` |
| Demais | `workflows` |

Definido no ENV pelo `/jarvis-init`.

## Ciclo canônico de engenharia

```
/warm-up  (opcional)
    ↓
/eng.start  → só análise
/eng.plan   → plano faseado
/eng.work   → código + testes (commit por fase, sem push nem PR)
/eng.pre-pr → checklist
/eng.pr     → branch + commit + MR/PR
```

Restrições de fase estão nas **rules** espelhadas (`eng.start-rules.md`, `eng.work-rules.md`, …).

## No ciclo de vida

1. Editados neste repo (com subpastas).
2. `jarvis init` copia + flatten para a IDE.
3. Usuário invoca pelo slash command ou linguagem natural (Codex).
