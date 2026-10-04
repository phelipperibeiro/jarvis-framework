# Jarvis Evolution Architect

**Mentor de arquitetura especializado em evolução do Jarvis Framework.**

---

## 🎯 O que é?

Uma **skill de mentoria arquitetural** que você invoca quando tem dúvidas sobre:

- ✅ Deveria criar um novo agent, skill, workflow ou rule?
- ✅ Como simplificar essa solução?
- ✅ Qual é realmente o problema que estou tentando resolver?
- ✅ Devemos adotar essa tendência?
- ✅ Qual a diferença entre SDD e CDD na prática?

---

## 🚀 Como Usar

### 1. Instale

O skill vem com o framework. Sincronize a pasta da IDE (`$IDE/skills/`):

```bash
jarvis init --ide claude --force   # ou a sua IDE (cursor, windsurf, ...)
```

### 2. Invoque

No chat da sua IDE:

```
/jarvis-evolution-architect "Sua pergunta arquitetural"
```

### 3. Exemplos

```
/jarvis-evolution-architect "Deveria criar um novo agent para validar specs?"

/jarvis-evolution-architect "Acho essa arquitetura complexa demais. O que eu mudaria?"

/jarvis-evolution-architect "Pesquise como MCP pode ser relevante pro Jarvis"
```

---

## 🧠 Lentes de Análise

A skill usa **4 lentes** para avaliar decisões:

| Lente | O que questiona |
|-------|----------------|
| **SDD** | Intenção, requisitos, comportamento esperado |
| **CDD** | Contexto, quando necessário, sem duplicação |
| **Agentic SE** | Entendimento, decisões, autonomia do agente |
| **Developer Experience** | Simplicidade, discoverability, manutenção |

---

## 💡 Filosofia

**A pergunta principal não é:**
> "Qual feature podemos adicionar?"

**A pergunta principal é:**
> "Qual é a melhor maneira de resolver o problema mantendo o Jarvis simples, extensível, coerente e AI-native?"

---

## 📊 Preferência Evolutiva

A skill questiona **por que criar novo**. Ordem de preferência:

```
1. REUSE    → Usar existente como está
2. EXTEND   → Estender existente
3. REFACTOR → Reorganizar existente
4. CREATE   → Criar novo (justifique!)
```

---

## 🛡️ O Que a Skill Protege

A skill **questiona ativamente**:

- 🚫 Overengineering
- 🚫 Abstrações desnecessárias
- 🚫 Duplicação
- 🚫 Excesso de configuração
- 🚫 Excesso de agentes/skills
- 🚫 Workflows desnecessariamente complexos
- 🚫 Fragmentação excessiva

---

## 💬 Como Responde

Estrutura típica de resposta:

```
Minha Leitura:
[O que entendi]

O Que Eu Acho:
[Avaliação técnica]

O Que Eu Mudaria:
[Melhorias]

O Que Eu Não Faria:
[Problemas]

Como Eu Faria:
[Proposta arquitetural]

Trade-Offs:
[Ganhamos/Perdemos]

Minha Recomendação:
[Decisão clara]
```

---

## 📁 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| **SKILL.md** | Definição técnica da skill (role, comportamento, lentes) |
| **GUIDE.md** | Como usar (invocação, quando usar, exemplos) |
| **EXAMPLES.md** | Exemplos reais de conversas |
| **REFERENCES.md** | Documentação detalhada (SDD, CDD, Agentic SE) |
| **README.md** | Este arquivo |

---

## ✅ Quando Usar

```
✅ "Deveria criar um novo agent?"
✅ "Essa feature deveria ser skill ou workflow?"
✅ "Acho isso muito complexo, como simplificar?"
✅ "Qual a diferença entre agente e workflow?"
✅ "Devemos adotar X tendência?"

❌ "Qual skill uso para X?" (use /jarvis-find-skill)
❌ "Como implemento X?" (use skill específica)
❌ "Como debugo isso?" (use documentação)
```

---

## 🎓 Exemplos Rápidos

### Exemplo 1: Nova Feature
```
Você: "Vou criar um agent Spec Reviewer"
Skill: "Não ainda. Começaria como workflow... [análise]"
```

### Exemplo 2: Simplificação
```
Você: "Temos 50+ skills, descobrimento é difícil"
Skill: "Problema é discovery, não quantidade. [propostas]"
```

### Exemplo 3: Tendência
```
Você: "Devemos adotar MCP?"
Skill: "Pesquisa necessária. [análise de tendência]"
```

---

## 🔧 Personalidade

- 🎯 Técnica e estratégica
- 💬 Direta e opinativa
- 🤔 Questiona antes de concordar
- 🔍 Pesquisa quando necessário
- 🤝 Colaborativa mas honesta

**Você está falando com alguém que conhece arquitetura de software profundamente.**

---

## 📚 Recursos Inclusos

### REFERENCES.md
Documentação completa de:
- SDD (Spec-Driven Development)
- CDD (Context-Driven Development)
- Agentic Software Engineering
- Developer Experience
- Classificação de artefatos
- Preferência evolutiva
- Princípios de proteção

### EXAMPLES.md
5 exemplos reais:
1. Nova Feature - Spec Reviewer Agent
2. Simplificação - Context Optimizer
3. Tendência - MCP Integration
4. Discovery - Skills Organization
5. Arquitetura - Agents vs Workflows

### GUIDE.md
Tudo que você precisa saber para usar:
- Como invocar
- Lentes de análise
- Estrutura de resposta
- Quando usar/não usar
- Boas perguntas

---

## 🚀 Próximos Passos

1. **Instale** com `jarvis init` (o skill vai para `$IDE/skills/`)
2. **Leia** GUIDE.md para entender como usar
3. **Consulte** REFERENCES.md para conceitos detalhados
4. **Use** `/jarvis-evolution-architect` quando tiver dúvidas arquiteturais
5. **Veja** EXAMPLES.md para padrões de conversa

---

## 🎯 Vision

Esta skill é parte da estratégia de manter o Jarvis:

- ✅ **Simples** - Sem overengineering
- ✅ **Extensível** - Fácil de evoluir
- ✅ **Coerente** - Padrões consistentes
- ✅ **AI-native** - Otimizado para agentes de IA

---

## 📝 Metadatas

```
Name: jarvis-evolution-architect
Area: architecture
Specialization: jarvis-framework-evolution
Version: 1.0
Framework: Jarvis 2.0+
License: AGPL-3.0
```

---

## 🔗 Integração com Jarvis

A skill está pronta para integrar no Jarvis Framework padrão:

```
.jarvis/
├── skills/
│   ├── jarvis-evolution-architect/
│   │   ├── SKILL.md
│   │   ├── GUIDE.md
│   │   ├── EXAMPLES.md
│   │   ├── REFERENCES.md
│   │   └── README.md
│   ├── eng-*
│   ├── qa-*
│   └── ...
├── agents/
├── workflows/
├── rules/
└── templates/
```

---

**Criada**: 2026-10-04  
**Versão**: 1.0  
**Status**: Pronto para usar
