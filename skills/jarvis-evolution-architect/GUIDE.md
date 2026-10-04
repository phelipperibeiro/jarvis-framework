# Guia - Jarvis Evolution Architect

## 🚀 Como Usar

### Instalação

Coloque a pasta na estrutura do seu Jarvis:

```bash
cp -r jarvis-evolution-architect/ .jarvis/skills/
```

Ou extraia o ZIP dentro de `.jarvis/skills/`.

### Invocação

No chat da sua IDE (Claude, Cursor, Windsurf, etc):

```
/jarvis-evolution-architect "Sua pergunta ou situação arquitetural aqui"
```

### Exemplos de Invocação

```
/jarvis-evolution-architect "Deveria criar um novo agent para isso?"

/jarvis-evolution-architect "Acho que essa feature está muito complexa. Como simplificaria?"

/jarvis-evolution-architect "Pesquise como outros frameworks resolvem contexto"

/jarvis-evolution-architect "Qual a diferença entre criar skill vs rule?"
```

---

## 📋 O Que a Skill Faz

### Analisa
- ✅ Decisões arquiteturais
- ✅ Propostas de novos agentes/skills/workflows
- ✅ Complexidade arquitetural
- ✅ Tendências em AI-native development

### Questiona
- ✅ Antes de concordar com proposta
- ✅ Intenção real do problema
- ✅ Se existe solução existente
- ✅ Trade-offs envolvidos

### Pesquisa
- ✅ Tendências atuais
- ✅ Práticas recentes
- ✅ Comportamento de ferramentas
- ✅ Comparação com outros frameworks

### Recomenda
- ✅ Com opinião técnica forte
- ✅ Com justificativa
- ✅ Com próximos passos
- ✅ Sendo direto sobre discordâncias

---

## 🎯 Lentes de Análise

A skill usa **4 lentes** para avaliar decisões:

### 1️⃣ SDD (Spec-Driven Development)
Questiona a intenção, requisitos, comportamento esperado:

```
"Qual é realmente o problema que você está tentando resolver?"
"Quais são os critérios de aceitação?"
"Como vai saber que está pronto?"
```

### 2️⃣ CDD (Context-Driven Development)
Avalia como informação flui entre artefatos:

```
"Que contexto o novo agent precisa?"
"Quando ele precisa dessa informação?"
"Existe duplicação?"
```

### 3️⃣ Agentic Software Engineering
Pensa em como agentes de IA entendem e usam:

```
"Isso ajuda o agente a entender melhor?"
"Tomar melhores decisões?"
"Ser mais autônomo com segurança?"
```

### 4️⃣ Developer Experience
Considera facilidade de uso:

```
"É fácil de entender?"
"É fácil de manter?"
"É fácil de debugar?"
```

---

## 📊 Estrutura Típica de Resposta

Quando você faz uma pergunta, a skill responde assim:

### 1. Minha Leitura
*"O que eu entendi do seu problema"*

```
Você quer adicionar uma etapa de validação de specs depois 
que são criadas, possivelmente como um novo agent.
```

### 2. O Que Eu Acho
*"Minha avaliação técnica direta"*

```
Não criaria um novo agent ainda. A pergunta certa é: 
"Esse reviewer precisa realmente de identidade própria?"
```

### 3. O Que Eu Mudaria
*"Melhorias à proposta"*

```
Começaria como uma etapa de workflow, não agent.
```

### 4. O Que Eu Não Faria
*"O que considero problemático"*

```
Não criaria agent só porque "reviewar" é responsabilidade.
```

### 5. Como Eu Faria
*"Proposta arquitetural alternativa"*

```
1. Criar skill "eng-spec-review"
2. Integrar como workflow
3. Monitorar padrões
4. Extrait para agent depois se necessário
```

### 6. Trade-Offs
*"O que ganhamos e perdemos"*

```
✅ Menor complexidade inicial
❌ Refatoração pode ser custosa depois
```

### 7. Minha Recomendação
*"Decisão clara e opinativa"*

```
Comece com skill + workflow. Agent pode esperar.
```

---

## 🔄 Preferência Evolutiva

A skill sempre questiona: **"Por que criar novo?"**

A ordem de preferência é:

```
1. REUSE - Usar artefato existente como está
   ✅ Se resolve 100% do problema

2. EXTEND - Estender artefato existente
   ✅ Se reuse não resolve
   
3. REFACTOR - Reorganizar artefato existente
   ✅ Se extend adiciona muita complexidade
   
4. CREATE - Criar novo artefato
   ⚠️ Última opção, sempre justifique
```

---

## 🏗️ Classificação de Artefatos

A skill ajuda a classificar o que você está pensando criar:

| Tipo | Use quando... |
|------|---------------|
| **Agent** | Identidade própria + contexto especializado + autonomia |
| **Skill** | Playbook executável, reutilizável, acionável |
| **Workflow** | Sequência de etapas coordenadas |
| **Rule** | Diretriz, constraint, gate, convenção |
| **Template** | Modelo de documento reutilizável |
| **Specification** | Requisitos estruturados com rastreabilidade |
| **Context** | Informação usada por múltiplos artefatos |

**Regra importante**: Não escolha pelo nome. Analise a responsabilidade.

---

## 🛡️ Proteção do Jarvis

A skill **questiona** essas situações:

- 🚫 Overengineering
- 🚫 Abstrações desnecessárias
- 🚫 Duplicação
- 🚫 Excesso de configuração
- 🚫 Excesso de contexto
- 🚫 Excesso de agentes
- 🚫 Workflows desnecessariamente complexos
- 🚫 Regras conflitantes
- 🚫 Fragmentação excessiva

---

## 📚 Quando Usar Evolution Architect

### ✅ USE:

```
"Deveria criar um novo agent para X?"
"Essa feature deveria ser skill ou workflow?"
"Acho essa solução muito complexa, como simplificaria?"
"Qual é realmente o problema aqui?"
"Devemos adotar essa tendência?"
"Qual a diferença entre SDD e CDD na prática?"
"Pesquise como o MCP funciona e se relevante pro Jarvis"
```

### ❌ NÃO USE:

```
"Qual skill devo usar para X?" (use /jarvis-find-skill)
"Como implemento feature X?" (use skill específica)
"Como debugo essa skill?" (use documentação ou skill específica)
"Como faço um pull request?" (use fluxo de engenharia)
```

---

## 🔍 Pesquisa - Quando a Skill Pesquisa

A skill pode **pesquisar a web** quando necessário:

### Pesquisa quando:
```
✅ Tendências em AI-native development
✅ Novas capacidades de ferramentas (Claude Code, Cursor)
✅ Comparação com outros frameworks
✅ Documentação oficial de tecnologia
✅ Práticas recentes
```

### Não pesquisa quando:
```
❌ Conhecimento consolidado (arquitetura, princípios)
❌ Práticas bem-estabelecidas (SOLID, TDD, etc)
❌ Jarvis Framework (conhecimento interno)
```

---

## 💬 Passo a Passo - Típica Conversa

### Você entra com:
```
/jarvis-evolution-architect "Vou criar um novo agent 
chamado PR Reviewer que valida qualidade de PRs. 
O que você acha?"
```

### Skill responde:

1. **Questiona**
   - "Qual é realmente o critério de qualidade?"
   - "O agent toma decisões ou apenas reporta?"
   - "Isso não deveria ser parte do workflow existente?"

2. **Analisa** (internamente)
   - Verifica se existe fluxo de PR existente
   - Avalia se é agente ou etapa de workflow
   - Pensa em contexto necessário

3. **Recomenda**
   - Opinião: não criaria agente novo
   - Alternativa: estender skill existente
   - Próximos passos: começar com rule + skill

---

## 🚀 Dica: Faça Boas Perguntas

A qualidade da resposta depende da qualidade da pergunta.

### ❌ Pergunta fraca:
```
"Como criar um novo agent?"
```

### ✅ Pergunta forte:
```
"Vou criar um agent que valida PRs quanto a qualidade. 
Esse agent analisaria código, complexity, coverage, 
style. O que você acha? Deveria ser agent ou algo diferente?"
```

---

## 🎓 Conceitos Chave

### SDD (Spec-Driven Development)
- Começa com intenção clara
- Define requisitos antes de solução
- Rastreia relação spec → implementação

### CDD (Context-Driven Development)
- Contexto certo no lugar certo
- No momento certo
- Mínimo ruído, sem duplicação

### Agentic Software Engineering
- Decisões que beneficiam agentes
- Contexto que facilita entendimento
- Autonomia com segurança

---

## 📞 Suporte

Se a skill não responder bem:

1. **Reformule sua pergunta** - Seja mais específico
2. **Forneça contexto** - Explique o problema
3. **Cite restrições** - Quais são limitações?
4. **Dê exemplos** - Mostre o que você pensa em criar

---

## 🔗 Referências Internas

- **SKILL.md** - Definição técnica da skill
- **REFERENCES.md** - Documentação detalhada das lentes
- **EXAMPLES.md** - Exemplos de conversas reais

---

**Última atualização**: 2026-10-04  
**Versão**: 1.0  
**Framework**: Jarvis 1.0+
