# `templates/` — modelos de documento e ENV

## Para que serve

Modelos Markdown que skills/workflows preenchem (ARD, RFC, tech spec, PRD, planos QA…) e o **template canônico do ENV** do projeto.

## Como é montado

```
templates/
├── AGENTS.md
├── ENV-template.md              # ÚNICA fonte do ENV.md no init (fork)
└── engineering/
    ├── AGENTS-template.md       # gera AGENTS.md do projeto alvo (com a linha do mapa e, no modo workspace, o bloco de repositórios mantido pelo /jarvis-init repos)
    ├── advisor-template.md      # prompts e auditoria do Advisor (eng.start)
    ├── ARD-template.md
    ├── RFC-template.md
    ├── RFC-Playbook.md
    ├── tech-spec-template.md
    ├── tech-spec-delivery-template.md
    ├── ref-spec-template.md     # Reference Spec do eng.build-tech-spec
    ├── architecture-template.md
    ├── light-arch-template.md   # desenho leve do eng.light-arch (sem branch nem PR)
    ├── c4-model-template.md
    ├── plan-template.md
    ├── PR-template.md
    ├── breakdown-subtasks-template.md  # formato de cada subtarefa (template_file do eng.breakdown-subtasks)
    ├── debug-report-template.md      # relatório do /eng.debug (caso investigar)
    ├── bug-audit-report-template.md  # relatório do /eng.debug (caso varrer)
    ├── data-pipeline-template.md
    ├── data-contract-template.md
    ├── central-feature-template.md   # Central docs: página da funcionalidade
    ├── central-delivery-template.md  # Central docs: registro da entrega
    ├── central-product-template.md   # Central docs: página do produto (transversal)
    ├── central-home-template.md      # Central docs: página inicial do squad (editável, só uma vez)
    ├── central-session-template.md   # Central docs: página-índice da sessão de um card (history/{card}/{card}.md)
    └── qa/
        ├── qa.release-signoff-template.md
        ├── qa.sprint-plan-template.md
        ├── qa.test-strategy-template.md         # estratégia do Modo A do eng.qa.test-planner
        ├── qa.test-coverage-report-template.md  # relatório de cobertura do Modo B do eng.qa.test-planner
        └── qa.test-suite-report-template.md     # relatório de teste do eng.qa.testing-engineer
```

Os templates de produto (PRD, FRD, épico, issue, breakdown e discovery) ficam em `templates/product/`, que é o que `$PROD_TEMPLATES` aponta; o núcleo engineering está nesta árvore.

## `ENV-template.md` (crítico)

O skill `jarvis-init` **deve** copiar este arquivo inteiro e só substituir valores. Não inventar chaves.

Cada assunto fica numa moldura de três linhas (`# ====`, título, `# ====`). No fim de todo caminho que grava o `ENV.md`, o `/jarvis-init` o valida contra este template (passo 9.5 do skill): cada problema vira uma pergunta, e o arquivo é regravado na mesma estrutura e ordem, com as chaves fora do template no último bloco, marcadas `# (descontinuada)`. O `jarvis init --upgrade` (terminal) acrescenta as chaves novas no fim e apaga as que saíram do template (lista em `REMOVED_KEYS`, `bin/lib/core/env-upgrade.js`; o resumo mostra só os nomes); para `COMPANY_PROFILE` (overlay de empresa, #199) ele pergunta o valor no terminal, e Enter, `--yes` ou entrada sem terminal gravam o default `stark-industries`.

Inclui (entre outros):

- Workspace / `USER` / `MAX_AI_EXECUTION_PERCENTAGE` / `ENABLE_CDD`
- `SQUAD`, `HUB`, `AREA`, `POSITION`
- Pastas IDE (`FLOWS_FOLDER`, `SESSIONS_DIR`, …)
- Task manager (vazio = freelance), VCS, chat, storage…
- `BACKEND_SPECIALIZATIONS` e `FRONTEND_SPECIALIZATIONS` (seção "Especializações de stack"): listas de nomes de skill, separadas por vírgula, que os `eng.*` carregam junto da skill base; precisam **existir**, mesmo vazias (ver [especializações de stack](../especializacoes-de-stack.md))
- `JARVIS_PROJECT`, `CENTRAL_DOCS_*`
- `RTK_ENABLED`

## No ciclo de vida

1. Versionados neste repo.
2. `jarvis init` → `.$IDE/templates/`.
3. `/jarvis-init` lê `templates/ENV-template.md` (do framework ou da cópia na IDE, conforme o skill) e grava `$IDE/ENV.md`.
4. Outros workflows leem o template correspondente ao artefato (ARD, plan, …).
