# AGENTS.md - Pasta rules/

Instrucoes especificas para agentes de IA que manipulam a pasta de regras.

---

## Proposito desta Pasta

A pasta `rules/` contem **regras e diretrizes** que governam o comportamento do framework Jarvis. Sao restricoes e padroes que agentes e workflows devem seguir.

---

## Estrutura

```
rules/
├── engineering/              # Regras de engenharia
│   ├── eng-rules.md          # Regras gerais de engenharia
│   ├── eng.start-rules.md    # Regras para /eng.start
│   ├── eng.plan-rules.md     # Regras para /eng.plan
│   ├── eng.work-rules.md     # Regras para /eng.work
│   ├── eng.pr-rules.md       # Regras para /eng.pr
│   ├── eng.bump-rules.md     # Regras para versionamento
│   ├── eng.tech-spec-rules.md # Regras para tech specs
│   └── qa/                   # Regras de QA
└── product/                  # Regras de produto
    └── prod-rules.md    # Regras de especificacao
```

---

## Hierarquia de Regras

```
1. .windsurf/rules / .cursor/rules  (mais alta)
2. rules/engineering/eng-rules.md
3. rules/engineering/eng.{comando}-rules.md
4. rules/product/prod-rules.md (mais baixa)
```

**Regra**: Regras mais especificas tem precedencia sobre regras gerais.

---

## Convencoes de Nomenclatura

| Tipo | Padrao | Exemplos |
|------|--------|----------|
| Regra geral | `{dominio}-rules.md` | `eng-rules.md` |
| Regra de comando | `{dominio}.{comando}-rules.md` | `eng.work-rules.md` |
| Regra de QA | `qa/{nome}-rules.md` | `qa/test-rules.md` |

---

## Profile-Aware Rules Loading

Cada arquivo de rule declara para quais perfis se aplica via bloco `applies_to`, inserido logo após o frontmatter YAML (ou no início do arquivo se não houver frontmatter):

```markdown
> **Applies to:** HUB: {valor ou all} | POSITION: {valor ou all} | AREA: {valor ou all} | SQUAD: {valor ou all}
```

**Eixos de filtragem:**

| Eixo | Exemplos de valor | `all` significa |
|------|-------------------|-----------------|
| HUB | FRONTEND, BACKEND, QA, DATA, AI, FULLCYCLE | qualquer hub |
| POSITION | TECH LEAD, PM, QA-ENGINEER, SENIOR | qualquer cargo |
| AREA | ENGINEERING, PRODUCT | qualquer área |
| SQUAD | CORE, SUPPORT | qualquer squad |

**Regras:**
- Uma rule é aplicada se **todos** os eixos forem satisfeitos (AND, não OR)
- Arquivos sem bloco `applies_to` são considerados **universais** — copiados para qualquer perfil
- `rules/AGENTS.md` nunca é filtrado — sempre copiado

**Quem faz a filtragem:** o skill `/init-jarvis` (Passo 9 — Profile-Aware Rules Sync). Ao criar, atualizar ou fazer upgrade do ENV.md, copia para `$IDE/rules/` apenas as rules que batem com o perfil (HUB + POSITION + AREA + SQUAD) e deleta as que não batem mais.

**Ao criar uma nova rule**, definir o bloco `applies_to` é obrigatório. Sem ele, a rule é tratada como universal — o que pode ser indesejado para rules domain-specific.

---

## Estrutura de um Arquivo de Regras

Todo arquivo de regras deve conter:

```markdown
# {Nome} Rules

## Objetivo
O que estas regras governam.

## Escopo
Quando estas regras se aplicam.

## Regras

### Obrigatorio
- Regra 1
- Regra 2

### Proibido
- Nunca fazer X
- Nunca fazer Y

### Recomendado
- Preferir A sobre B
- Considerar C quando D

## Excecoes
Quando as regras podem ser flexibilizadas.

## Referencias
Links para documentacao relacionada.
```

---

## Tipos de Regras

### 1. Regras Gerais (`eng-rules.md`)
- Aplicam-se a todo o dominio de engenharia
- Definem padroes transversais
- Sao a base para regras especificas

### 2. Regras de Comando (`eng.{comando}-rules.md`)
- Especificas para um comando slash
- Detalham restricoes do comando
- Podem sobrescrever regras gerais

### 3. Regras de QA (`qa/`)
- Focadas em qualidade e testes
- Definem criterios de aceitacao
- Padroes de cobertura

### 4. Regras de Produto (`product/`)
- Governam especificacoes e requisitos
- Padroes de documentacao de produto
- Validacao de PRD/FRD

---

## Regras Criticas do Framework

### Fases de Desenvolvimento

| Fase | Comandos | Restricao |
|------|----------|-----------|
| Planejamento | `eng.start`, `eng.plan` | Somente analise, SEM codigo |
| Implementacao | `eng.work` | Codigo e testes, SEM commits |
| Entrega | `eng.pr` | Branch, commit e PR |

### Seguranca

- Nunca inventar credenciais, tokens ou segredos
- Nunca expor dados sensiveis em logs ou outputs
- Sempre validar dados externos
- Priorizar seguranca sobre velocidade

### ENV.md

- Validar ENV.md antes de qualquer comando (exceto `/init-jarvis`)
- Respeitar `MAX_AI_EXECUTION_PERCENTAGE`

---

## Nunca

- Criar regra que contradiz `.windsurfrules`
- Criar regra sem definir escopo claro
- Misturar regras de dominios diferentes no mesmo arquivo
- Criar regra muito generica ou muito especifica
- Ignorar regras existentes ao criar novas

## Sempre

- Seguir hierarquia de regras
- Documentar excecoes explicitamente
- Manter consistencia com regras existentes
- Referenciar regras relacionadas
- Atualizar ao modificar comportamento do framework

---

## Relacao com Outros Componentes

| Componente | Relacao |
|------------|---------|
| Agents | Agentes devem seguir as regras |
| Skills | Skills implementam as regras |
| Workflows | Workflows executam conforme regras |
| Templates | Templates respeitam as regras |

---

## Referencias

- `../agents/` - Agentes que seguem estas regras
- `../workflows/` - Workflows que executam conforme regras
- `../skills/` - Skills que implementam regras
- `.windsurfrules` - Regras globais do framework

---

**Ultima atualizacao**: 2026-01-26