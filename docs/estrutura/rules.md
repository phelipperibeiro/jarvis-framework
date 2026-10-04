# `rules/` — guardrails

## Para que serve

Regras que a IDE/agente deve obedecer (segurança, fluxo eng.start/work/pr, QA, frontend, data, RPA, RTK…).

Diferente de skills: rules são **restrições e padrões contínuos**; skills são **playbooks sob demanda**.

## Como é montado

```
rules/
├── AGENTS.md
├── rtk-rules.md                    # opt-in: só se RTK_ENABLED=true
├── engineering/
│   ├── eng-rules.md                # regras gerais de engenharia
│   ├── eng-security-rules.md
│   ├── eng.specializations-rules.md # carregamento de especializações por stack
│   ├── eng.skills-rules.md       # área obrigatória nos skills e aviso de skill inexistente
│   ├── … (docs, bump, integrations, …)
│   ├── frontend/
│   ├── data/
│   ├── qa/
│   └── rpa/
└── product/
    └── prod-rules.md

rules-on-demand/                    # lidas pelo workflow; não carregadas no início da sessão
└── engineering/
    ├── eng.start-rules.md
    ├── eng.plan-rules.md
    ├── eng.work-rules.md
    ├── eng.pre-pr-rules.md
    ├── eng.pr-rules.md
    ├── eng.tech-spec-rules.md
    └── eng.breakdown-subtasks-rules.md
```

### `rules/` e `rules-on-demand/`

- `rules/`: o Claude Code carrega tudo no início da sessão. Fica só o que vale sempre.
- `rules-on-demand/`: regras de **uma etapa só** (um comando). O workflow manda ler o arquivo no início (`rules_file` e a linha "Rules"). O mesmo bloco `Applies to` e o mesmo filtro por perfil valem nas duas pastas.
- `jarvis tokens` mostra quanto cada perfil carrega no início.

## Bloco `Applies to:`

Muitas rules começam com:

```markdown
> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all
```

No `/jarvis-init` (passo de sync de rules):

1. Lê `HUB`, `POSITION`, `AREA`, `SQUAD` do ENV
2. Copia para `.$IDE/rules/` e `.$IDE/rules-on-demand/` só o que **bate** no perfil
3. Remove da IDE o que não bate
4. Exceção: `rtk-rules.md` só se `RTK_ENABLED=true`
5. `rules/AGENTS.md` sempre copia

Isso reduz tokens carregados na sessão.

## No ciclo de vida

1. Editadas neste repo.
2. `jarvis init` copia o conjunto **inteiro** para `.$IDE/rules/` e `.$IDE/rules-on-demand/` (sync bruto; as rules que saíram de `rules/` são removidas das instalações antigas via `OBSOLETE_PATHS`).
3. `/jarvis-init` **filtra** de novo conforme perfil (e RTK).

Se você só rodar `jarvis init` sem o skill de init, a IDE pode ter rules a mais do que o perfil precisa — o filtro fino é responsabilidade do `/jarvis-init`.
