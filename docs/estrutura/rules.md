# `rules/` — guardrails

## Para que serve

Regras que a IDE/agente deve obedecer (segurança, fluxo eng.start/work/pr, QA, frontend, data, RPA, RTK…).

Diferente de skills: rules são **restrições e padrões contínuos**; skills são **playbooks sob demanda**.

## Como é montado

```
rules/
├── artifact-style-rules.md         # só se ARTIFACT_STYLE=human-generated
├── rtk-rules.md                    # só se RTK_ENABLED=true
├── company-overlay-rules.md        # overlay de empresa > especialização > core, conferido na chamada (#199)
├── engineering/
│   ├── eng-rules.md                # regras gerais de engenharia
│   ├── eng-security-rules.md
│   ├── eng.specializations-rules.md # carregamento de especializações por stack
│   ├── eng.skills-rules.md       # área obrigatória nos skills e aviso de skill inexistente
│   └── eng.integrations-rules.md # vendors pelo ENV.md (board, git, Central docs)
└── product/
    └── prod-rules.md

rules-on-demand/                    # lidas pelo comando; não carregadas no início da sessão
├── engineering/
│   ├── eng.start-rules.md
│   ├── eng.gate0-rules.md        # Gate 0 de eng.plan, eng.work, eng.pre-pr e eng.pr
│   ├── eng.plan-rules.md
│   ├── eng.work-rules.md
│   ├── eng.pre-pr-rules.md
│   ├── eng.pr-rules.md
│   ├── eng.tech-spec-rules.md
│   ├── eng.transitions-rules.md
│   ├── eng.bump-rules.md
│   ├── eng.security-rules.md      # seções de etapa da eng-security-rules (architecture.md e gate-checklist.md)
│   ├── eng.rpa-rules.md          # inclui a documentação de robôs
│   └── frontend/
│       └── eng.frontend-rules.md # padrões de frontend (lida pelos comandos e pelo agente de frontend)
├── product/
│   ├── prod.guided-rules.md        # modo Developer-Guided (só com PROD_MODE=developer-guided)
│   ├── prod.spec-common-rules.md   # princípios e busca de contexto dos prod.spec.* (lida pelo comando)
│   └── prod.spec-rules.md          # princípios de escrita de spec (lida pelos sete prod.spec.*)
├── doc-links-rules.md              # links clicáveis nos documentos gerados (lida pelos comandos que gravam documentos)
└── warm-up-consume-rules.md        # consumo do /warm-up (só quando há aquecimento)
```

### `rules/` e `rules-on-demand/`

- `rules/`: o Claude Code carrega tudo no início da sessão. Fica só o que vale sempre.
- `rules-on-demand/`: regras de **uma etapa** (um comando) ou **transversais** a vários comandos (como `doc-links-rules.md` e `warm-up-consume-rules.md`). O comando manda ler o arquivo no início (`rules_file` e a linha "Rules"). As duas exceções do Passo 8 valem nas duas pastas.
- `jarvis tokens` mostra quanto o início da sessão carrega.

## Como uma rule chega à IDE

O `jarvis init` copia `rules/` e `rules-on-demand/` inteiras. O `jarvis rules sync` (Passo 8 do `/jarvis-init`, também no fim do `jarvis init --upgrade` e da reinstalação) aplica o overlay de `COMPANY_PROFILE` e as duas exceções, decididas pelo nome do arquivo (o conteúdo não é lido):

1. `artifact-style-rules.md` só com `ARTIFACT_STYLE=human-generated`
2. `rtk-rules.md` só com `RTK_ENABLED=true`

As demais valem para todos. O que é de uma área só (os padrões de frontend, a escrita de spec de produto) fica em `rules-on-demand/`, e o comando da área manda ler: assim não pesa no início da sessão de quem não usa.

## No ciclo de vida

1. Editadas neste repo.
2. `jarvis init` copia o conjunto **inteiro** para `.$IDE/rules/` e `.$IDE/rules-on-demand/` (sync bruto; as rules que saíram de `rules/` são removidas das instalações antigas via `OBSOLETE_PATHS`).
3. `/jarvis-init` tira as duas exceções desligadas e aplica o overlay (Passo 8 → `jarvis rules sync`). O `jarvis init --upgrade` e a reinstalação (`--force` ou a opção 2 do menu) já rodam o mesmo passo no fim; nesses dois caminhos, a `rtk-rules.md` pede também o `rtk` no PATH. No Kiro, o passo grava ou apaga o `steering/{nome}` junto com a rule.

Se você só rodar `jarvis init` numa pasta nova (sem `ENV.md`), a IDE fica também com as duas exceções até o `/jarvis-init`.

## Para quem vai criar ou editar uma rule

Esta seção era antes `rules/AGENTS.md`. Esse arquivo foi removido: era o único `AGENTS.md` do repositório force-carregado em toda sessão (caso especial em `profile-filter.js`), diferente de `skills/AGENTS.md`, `workflows/AGENTS.md`, `templates/AGENTS.md` e `agents/AGENTS.md`, que só são lidos sob demanda. O conteúdo de autoria está aqui agora.

### Hierarquia de Regras

```
1. .windsurf/rules / .cursor/rules  (mais alta)
2. rules/engineering/eng-rules.md
3. rules-on-demand/engineering/eng.{comando}-rules.md
4. rules-on-demand/product/prod.guided-rules.md (só com PROD_MODE=developer-guided)
5. rules-on-demand/product/prod.spec-common-rules.md (lida pelos prod.spec.* que gravam documento)
6. rules-on-demand/product/prod.spec-rules.md (lida pelos prod.spec.*)
7. rules/product/prod-rules.md (mais baixa)
```

Regras mais específicas têm precedência sobre regras gerais.

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplos |
|------|--------|----------|
| Regra geral | `{dominio}-rules.md` | `eng-rules.md` |
| Regra de comando | `{dominio}.{comando}-rules.md` | `eng.work-rules.md` |
| Regra de uma área | `rules-on-demand/engineering/{área}/{dominio}.{área}-rules.md` | `frontend/eng.frontend-rules.md` |

### Estrutura obrigatória de um arquivo de regra

Sem frontmatter YAML. Exceção: `description`, quando a rule precisa de descrição no steering do Kiro. **Não declarar `trigger:` no frontmatter.** O Claude Code ignora o campo e carrega toda rule da pasta (sem `paths`) no início da sessão. Uma rule que só serve a uma área ou a um comando vai para `rules-on-demand/`.

```markdown
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
3. **Regras de área** (`rules-on-demand/engineering/{área}/`, como `frontend/`) — padrões de uma área só, lidos pelo comando e pelo agente da área, fora do início da sessão.
4. **Regras de Produto** (`product/`) — especificações, requisitos, validação de PRD/FRD.

### Regras Críticas do Framework

**Fases de Desenvolvimento:**

| Fase | Comandos | Restrição |
|------|----------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente análise, sem código |
| Implementação | `eng.work` | Código e testes, commit por fase, sem push nem PR |
| Entrega | `eng.pr` | Push e PR, depois da pergunta (regra de ouro) |

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
