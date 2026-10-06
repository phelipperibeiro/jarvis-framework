# `rules/` — guardrails

## Para que serve

Regras que a IDE/agente deve obedecer (segurança, fluxo eng.start/work/pr, QA, frontend, data, RPA, RTK…).

Diferente de skills: rules são **restrições e padrões contínuos**; skills são **playbooks sob demanda**.

## Como é montado

```
rules/
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

Isso reduz tokens carregados na sessão.

## No ciclo de vida

1. Editadas neste repo.
2. `jarvis init` copia o conjunto **inteiro** para `.$IDE/rules/` e `.$IDE/rules-on-demand/` (sync bruto; as rules que saíram de `rules/` são removidas das instalações antigas via `OBSOLETE_PATHS`).
3. `/jarvis-init` **filtra** de novo conforme perfil (e RTK).

Se você só rodar `jarvis init` sem o skill de init, a IDE pode ter rules a mais do que o perfil precisa — o filtro fino é responsabilidade do `/jarvis-init`.

## Para quem vai criar ou editar uma rule

Esta seção era antes `rules/AGENTS.md`. Esse arquivo foi removido: era o único `AGENTS.md` do repositório force-carregado em toda sessão (caso especial em `profile-filter.js`), diferente de `skills/AGENTS.md`, `workflows/AGENTS.md`, `templates/AGENTS.md` e `agents/AGENTS.md`, que só são lidos sob demanda. O conteúdo de autoria está aqui agora.

### Hierarquia de Regras

```
1. .windsurf/rules / .cursor/rules  (mais alta)
2. rules/engineering/eng-rules.md
3. rules-on-demand/engineering/eng.{comando}-rules.md
4. rules/product/prod-rules.md (mais baixa)
```

Regras mais específicas têm precedência sobre regras gerais.

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Regra geral | `{dominio}-rules.md` | `eng-rules.md` |
| Regra de comando | `{dominio}.{comando}-rules.md` | `eng.work-rules.md` |
| Regra de QA | `qa/{nome}-rules.md` | `qa/eng.qa.cypress-standards-rules.md` |

### Estrutura obrigatória de um arquivo de regra

```markdown
> **Applies to:** HUB: {valor ou all} | POSITION: {valor ou all} | AREA: {valor ou all} | SQUAD: {valor ou all}

# {Nome} Rules

## Objetivo
O que estas regras governam.

## Escopo
Quando estas regras se aplicam.

## Regras

### Obrigatório
- Regra 1

### Proibido
- Nunca fazer X

### Recomendado
- Preferir A sobre B

## Exceções
Quando as regras podem ser flexibilizadas.

## Referências
Links para documentação relacionada.
```

### Tipos de Regras

1. **Regras Gerais** (`eng-rules.md`) — valem para todo o domínio de engenharia; base para as específicas.
2. **Regras de Comando** (`eng.{comando}-rules.md`) — específicas de um comando, podem sobrescrever regras gerais.
3. **Regras de QA** (`qa/`) — qualidade, testes, critérios de aceitação, cobertura.
4. **Regras de Produto** (`product/`) — especificações, requisitos, validação de PRD/FRD.

### Regras Críticas do Framework

**Fases de Desenvolvimento:**

| Fase | Comandos | Restrição |
|------|----------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente análise, sem código |
| Implementação | `eng.work` | Código e testes, commit por fase, sem push nem PR |
| Entrega | `eng.pr` | Branch, commit e PR |

**Segurança:** nunca inventar credenciais/tokens/segredos; nunca expor dados sensíveis em logs; sempre validar dados externos.

**ENV.md:** validar antes de qualquer comando (exceto `/jarvis-init`); respeitar `MAX_AI_EXECUTION_PERCENTAGE`.

### Nunca / Sempre (para quem edita `rules/`)

**Nunca:**
- Criar regra que contradiz `.windsurfrules`
- Criar regra sem escopo claro
- Misturar regras de domínios diferentes no mesmo arquivo
- Criar regra muito genérica ou muito específica
- Ignorar regras existentes ao criar novas

**Sempre:**
- Seguir a hierarquia de regras
- Documentar exceções explicitamente
- Manter consistência com regras existentes
- Referenciar regras relacionadas
- Atualizar ao modificar comportamento do framework

### Relação com outros componentes

| Componente | Relação |
|------------|---------|
| Agents | Seguem as regras |
| Skills | Implementam as regras |
| Workflows | Executam conforme as regras |
| Templates | Respeitam as regras |
