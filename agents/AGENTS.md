# AGENTS.md - Pasta agents/

Instrucoes especificas para agentes de IA que manipulam a pasta de agentes.

---

## Proposito desta Pasta

A pasta `agents/` contem **definicoes de agentes especializados** que atuam no framework Jarvis. Cada agente tem uma persona, postura e forma de atuacao especifica.

---

## Estrutura

```
agents/
├── engineering/           # Agentes ativos de engenharia (12 agents)
│   ├── eng.agent.md
│   ├── eng.bug-hunter.md
│   ├── eng.dev-code-reviewer.md
│   ├── eng.docs-writer.md
│   ├── data/              # Agentes de Data (1 agent)
│   │   └── eng.data-engineer.agent.md
│   └── qa/                # Agentes de QA (6 agents)
│       ├── eng.qa.test-planner.md
│       ├── eng.qa.testing-engineer.md
│       ├── eng.qa.test-architect.md
│       ├── eng.qa.quality-champion-task-agent.md
│       ├── eng.qa.cypress-specialist.md
│       └── eng.qa.quality-strategist.md
├── product/               # Agentes ativos de produto (2 agents)
│   ├── prod.pm-checker.md
│   └── prod.discovery-interviewer.md
└── archive/              # Biblioteca de agentes arquivados (9 agents)
    ├── architecture-design/  # 2 agents
    ├── implementation/       # 2 agents
    └── product/              # 5 agents
```

---

## Convencoes de Nomenclatura

| Tipo | Padrao | Exemplos |
|------|--------|----------|
| Engenharia | `eng.{componente}.md` | `eng.agent.md`, `eng.docs-writer.md` |
| QA | `eng.qa.{componente}.md` | `eng.qa.test-planner.md` |
| Produto | `prod.{componente}.md` | `prod.pm-checker.md` |
| Generico | `{nome-descritivo}.md` | `backend-architect.md` |

---

## Regras ao Criar/Editar Agentes

### Estrutura Obrigatoria de um Agente

Todo arquivo de agente deve conter:

1. **Cabecalho** - Nome e descricao curta
2. **Persona** - Quem e o agente (expertise, postura)
3. **Objetivo** - O que o agente faz
4. **Quando Usar** - Cenarios de ativacao
5. **Entrada/Saida** - O que recebe e produz
6. **Restricoes** - O que NAO deve fazer

### Exemplo de Estrutura

```markdown
# @nome-do-agente

Descricao curta do agente.

## Persona
...

## Objetivo
...

## Quando Usar
...

## Entrada
...

## Saida
...

## Restricoes
...
```

---

## Diferenca entre Agents e Skills

| Aspecto | Agents | Skills |
|---------|--------|--------|
| Define | Persona e postura | Playbook executavel |
| Foco | Quem e o agente | Como executar a tarefa |
| Detalhe | Alto nivel | Passo a passo |
| Fonte de verdade | Comportamento | Operacional |

**Regra**: Quando um agente atua em tema com skill correspondente, o skill tem precedencia para detalhes operacionais.

---

## Ativacao de Agentes

### Automatica (via comandos)

```bash
/eng.start "feature"   # Ativa agentes de arquitetura
/eng.pre-pr            # Ativa agentes de revisao e QA
/eng.work              # Ativa agentes de implementacao
```

### Manual (via @)

```bash
@eng.qa.test-planner "analisar cobertura"
@backend-architect "design de API"
@eng.dev-code-reviewer "revisar PR #123"
```

---

## Context-Driven Development (CDD)

Os agentes do framework sao **conscientes de contexto** quando o CDD esta habilitado (`ENABLE_CDD=true` no ENV.md).

### Como CDD Afeta os Agentes

Quando habilitado, agentes leem o `CONTEXT_PROFILE` gerado pelo skill `/context-detect`:

```yaml
CONTEXT_PROFILE:
  tipo: [hotfix|bugfix|feature|refactor]
  urgencia: [alta|normal|baixa]
  rigor: [minimo|padrao|alto]
  comunicacao: [didatico|direto|estrategico]
  autonomia: [baixa|media|alta]
```

**Calibracao por Contexto:**

| Aspecto | Impacto no Agente |
|---------|-------------------|
| `tipo: hotfix` | Foco cirurgico, menos validacoes, documentacao minima |
| `tipo: feature` | Fluxo completo, todas as validacoes, documentacao detalhada |
| `urgencia: alta` | Priorizacao de velocidade, less is more |
| `urgencia: baixa` | Analise profunda, considerar melhorias estruturais |
| `comunicacao: didatico` | Explicar decisoes, incluir referencias, usar exemplos |
| `comunicacao: direto` | Conciso, focar em trade-offs e riscos |
| `autonomia: alta` | Executar decisoes, reportar ao final |
| `autonomia: baixa` | Apresentar opcoes, aguardar aprovacao |

### Desabilitando CDD

Se `ENABLE_CDD=false` (padrao), agentes operam sem calibracao contextual:
- Comportamento padrao para todas as tarefas
- Sem leitura de `CONTEXT_PROFILE`
- Sem adaptacao de rigor ou comunicacao

**Para habilitar CDD**, adicione ao `ENV.md`:
```
ENABLE_CDD=true
```

> 📚 **Skill relacionado**: `.windsurf/skills/context-detect/SKILL.md`

---

## Agentes Ativos vs Arquivados

### Ativos (em uso regular)
- `engineering/` - Agentes de engenharia (12 agents: 5 main + 6 QA + 1 Data)
- `product/` - Agentes de produto (2 agents)

### Arquivados (biblioteca de referência)
- `archive/` - Agentes genéricos organizados por área funcional (11 agents)
- Podem ser ativados manualmente quando necessário
- Servem como referência para criar novos agentes

---

## Fluxo de Trabalho Tipico

```
1. ARQUITETURA
   └─> @backend-architect, @frontend-architect

2. IMPLEMENTACAO
   └─> @backend-python-specialist, @react-developer

3. TESTES
   └─> @eng.qa.test-planner, @eng.qa.testing-engineer

4. REVISAO
   └─> @eng.dev-code-reviewer

5. DOCUMENTACAO
   └─> @eng.docs-writer
```

---

## Nunca

- Criar agente sem definir persona clara
- Duplicar funcionalidade de agente existente
- Misturar responsabilidades de dominios diferentes
- Colocar detalhes operacionais (isso vai no skill)
- Criar agente para tarefa unica (use skill)

## Sempre

- Verificar se ja existe agente similar antes de criar
- Seguir convencoes de nomenclatura
- Documentar quando usar e quando NAO usar
- Manter agentes focados em uma responsabilidade
- Atualizar README.md ao adicionar novo agente

---

## Referencias

- `README.md` - Lista completa de agentes
- `../skills/` - Skills correspondentes
- `../workflows/` - Workflows que ativam agentes
- `../rules/` - Regras que agentes devem seguir

---

**Última atualização**: 2026-04-26