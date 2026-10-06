# `templates/` — modelos de documento e ENV

## Para que serve

Modelos Markdown que skills/workflows preenchem (ARD, RFC, tech spec, PRD, planos QA…) e o **template canônico do ENV** do projeto.

## Como é montado

```
templates/
├── AGENTS.md
├── ENV-template.md              # ÚNICA fonte do ENV.md no init (fork)
└── engineering/
    ├── AGENTS-template.md       # gera AGENTS.md do projeto alvo
    ├── advisor-template.md      # prompts e auditoria do Advisor (eng.start)
    ├── ARD-template.md
    ├── RFC-template.md
    ├── RFC-Playbook.md
    ├── tech-spec-template.md
    ├── architecture-template.md
    ├── c4-model-template.md
    ├── plan-template.md
    ├── PR-template.md
    ├── breakdown-subtasks-template.md
    ├── data-pipeline-template.md
    ├── data-contract-template.md
    ├── work-progress-template.md
    └── qa/
        ├── qa.cypress-test-template.md
        ├── qa.exploratory-session-template.md
        ├── qa.quality-report-template.md
        ├── qa.release-signoff-template.md
        ├── qa.sprint-plan-template.md
        └── eng.qa.quality-gate-*-template.md
```

Os templates de produto (PRD, FRD, épico, issue, breakdown e discovery) ficam em `templates/product/`, que é o que `$PROD_TEMPLATES` aponta; o núcleo engineering está nesta árvore.

## `ENV-template.md` (crítico)

O skill `jarvis-init` **deve** copiar este arquivo inteiro e só substituir valores. Não inventar chaves.

Inclui (entre outros):

- Workspace / `USER` / `MAX_AI_EXECUTION_PERCENTAGE` / `ENABLE_CDD`
- `SQUAD`, `HUB`, `AREA`, `POSITION`
- Pastas IDE (`FLOWS_FOLDER`, `SESSIONS_DIR`, …)
- Task manager (vazio = freelance), VCS, chat, DB, broker, observabilidade…
- `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS` (seção "Especializações de stack"): listas de nomes de skill, separadas por vírgula, que os `eng.*` carregam junto da skill base; precisam **existir**, mesmo vazias (ver [especializações de stack](../especializacoes-de-stack.md))
- `JARVIS_PROJECT`, `CENTRAL_DOCS_*`
- `RTK_ENABLED`
- Bloco `DATA_*` (só se `HUB=DATA`)

## No ciclo de vida

1. Versionados neste repo.
2. `jarvis init` → `.$IDE/templates/`.
3. `/jarvis-init` lê `templates/ENV-template.md` (do framework ou da cópia na IDE, conforme o skill) e grava `$IDE/ENV.md`.
4. Outros workflows leem o template correspondente ao artefato (ARD, plan, …).
