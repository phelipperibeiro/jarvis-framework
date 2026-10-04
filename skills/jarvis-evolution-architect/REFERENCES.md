# Referências - Jarvis Evolution Architect

## 📚 Lentes Arquiteturais

### SDD (Spec-Driven Development)
- **Intenção clara**: O que está tentando resolver?
- **Requisitos bem definidos**: Qual comportamento esperado?
- **Critérios de aceitação**: Como saber que está pronto?
- **Rastreabilidade**: De onde vem cada requisito?
- **Validação**: Como verifica que implementação atende spec?

**Quando usar**: Sempre que decidir sobre uma nova feature ou mudança arquitetural.

### CDD (Context-Driven Development)
- **Contexto certo**: Qual contexto o agente precisa?
- **Momento certo**: Quando esse contexto deve estar disponível?
- **Mínimo ruído**: Apenas informação relevante?
- **Sem duplicação**: Existe em apenas um lugar?
- **Sem conflito**: As informações contradizem?

**Quando usar**: Ao avaliar como arquitetura compartilha informações.

### Agentic Software Engineering
- **Agent Understanding**: O agente entende melhor?
- **Agent Decision Making**: O agente toma melhores decisões?
- **Agent Consistency**: Comportamento mais consistente?
- **Agent Autonomy**: Mais autonomia com segurança?
- **Agent Verification**: Mais fácil verificar resultado?
- **Context Efficiency**: Contexto relevante sem excesso?

**Quando usar**: Ao avaliar se uma feature/mudança beneficia agentes de IA.

### Developer Experience
- **Simplicidade**: É fácil de entender?
- **Discoverability**: O desenvolvedor consegue descobrir?
- **Ergonomia**: É natural de usar?
- **Documentação**: Está bem documentado?
- **Manutenção**: É fácil manter?
- **Debugging**: É fácil debugar?
- **Onboarding**: É fácil aprender?
- **Previsibilidade**: Comportamento é previsível?

**Quando usar**: Ao avaliar qualidade arquitetural do ponto de vista do desenvolvedor.

---

## 🏗️ Classificação de Artefatos

### Agent
**Quando usar:**
- Possui identidade própria e bem-definida
- Tem responsabilidades bem separadas
- Requer contexto especializado
- Toma decisões independentes
- Tem ciclo de vida próprio

**Não usar quando:**
- É apenas uma etapa de um workflow
- É auxiliar a outro agente
- Responsabilidade é muito especializada/única

### Skill
**Quando usar:**
- É um playbook executável
- Define padrões detalhados
- Pode ser reutilizado em múltiplos contextos
- É acionável via comando
- Tem metadatas e configurações

**Não usar quando:**
- É apenas uma decisão de um agente
- É configuração estática

### Workflow
**Quando usar:**
- É uma sequência de etapas
- Coordena múltiplos artefatos
- Define ordem e condições
- É um fluxo de execução

**Não usar quando:**
- É apenas uma skill única
- É decisão de um agente

### Rule
**Quando usar:**
- É uma diretriz/constraint
- Afeta múltiplos artefatos
- É um gate/validação
- É uma convenção

### Template
**Quando usar:**
- É um modelo de documento
- Reutilizável em múltiplos projetos
- Define estrutura, não conteúdo

### Specification
**Quando usar:**
- É um documento estruturado
- Define requisitos, comportamento, critérios de aceitação
- Precisa rastreabilidade

### Context
**Quando usar:**
- É informação estruturada
- Usada por múltiplos artefatos
- Deve estar disponível em momento específico
- Pode ser persistente ou sob demanda

---

## 🛡️ Princípios de Proteção

### Contra Overengineering
- Questionar se solução é mais complexa que problema
- Procurar a menor solução viável
- Evitar camadas de abstração desnecessárias

### Contra Duplicação
- Verificar se existe similar antes de criar novo
- Preferir reusar e estender
- Identificar padrões repetidos

### Contra Fragmentação
- Manter coerência arquitetural
- Evitar múltiplos jeitos de fazer a mesma coisa
- Centralizar decisões estratégicas

### Contra Excesso de Contexto
- Fornecer apenas o necessário
- Evitar contexto muito amplo ou muito específico
- Validar se informação está no lugar certo

---

## 📊 Matriz de Decisão

| Tipo | Use quando... | Evite quando... |
|------|---------------|-----------------|
| **Agent** | Identidade própria + contexto especializado | Apenas uma etapa/auxiliar |
| **Skill** | Playbook reutilizável acionável | Configuração estática |
| **Workflow** | Sequência de etapas coordenadas | Skill única |
| **Rule** | Diretriz/gate/convenção | Decisão de um agent |
| **Template** | Modelo de documento reutilizável | Conteúdo único |
| **Specification** | Requisitos estruturados com rastreabilidade | Simples tarefa |
| **Context** | Informação usada por múltiplos artefatos | Informação local |

---

## 🔄 Preferência Evolutiva

```
1. REUSE - Usar existente como está
   ↓ (se não resolve 100%)
2. EXTEND - Estender existente
   ↓ (se extend adiciona muita complexidade)
3. REFACTOR - Reorganizar existente
   ↓ (se reorganizar não suficiente)
4. CREATE - Criar novo artefato
   ↓ (JUSTIFIQUE POR QUE NÃO REUSE/EXTEND)
```

**Regra**: Criar algo novo deve ser a última opção e bem justificada.

---

## 🎯 Framework Jarvis Atual

### Conceitos
- **Agents**: 17 ativos (eng, qa, product, data, security)
- **Skills**: 50+ playbooks executáveis
- **Workflows**: Templates de execução (eng, product)
- **Rules**: Diretrizes por contexto
- **Templates**: Modelos de documentos
- **Specifications**: PRD, ARD, Tech Spec

### Convenções
- Skills em `skills/{nome}/`
- Agents em `agents/{area}/`
- Workflows em `workflows/{area}/`
- Rules em `rules/{area}/`
- Todas com metadatas (area, author, version)

### Filosofia
- AI-native: Otimizado para agentes de IA
- Composable: Artefatos reutilizáveis
- Simple: Complexidade adicional deve ser justificada
- Extensible: Fácil de evoluir

---

## 🔍 Tendências em AI-native Development

### Áreas para monitorar
- AI Coding Agents (Claude Code, Cursor, Codex, Windsurf)
- Agent Infrastructure (MCP, subagents, orchestration)
- Development Methodologies (SDD, CDD, Context Engineering)
- Context Management (estratégias, eficiência)
- Agent Autonomy (decisões, verificação)

### Avaliação de Tendências
```
Tendência → Problema que resolve → Relevância para Jarvis
→ Benefício → Complexidade → Trade-off → Decisão
```

**Decisões:**
- **ADOPT**: Implementar agora
- **EXPERIMENT**: Testar em projeto piloto
- **WATCH**: Acompanhar evolução
- **REJECT**: Não alinha com filosofia do Jarvis

---

## 💬 Padrões de Resposta

### Estrutura Consultiva
```
Minha leitura:
[O que entendi do problema]

O que eu acho:
[Avaliação técnica direta]

O que eu mudaria:
[Melhorias]

O que eu não faria:
[Decisões questionáveis]

Como eu faria:
[Proposta arquitetural]

Trade-offs:
[O que ganhamos e perdemos]

Minha recomendação:
[Decisão clara e opinativa]
```

### Quando Pesquisar
- Tendências atuais
- Práticas recentes
- Comparação com frameworks similares
- Comportamento de ferramentas atuais
- Tecnologia recente

### Quando Não Pesquisar
- Arquitetura consolidada
- Princípios estabelecidos
- Práticas bem-conhecidas

---

## 🎓 Exemplo: Avaliação de Nova Feature

**Pergunta**: "Devemos criar um novo agent Spec Reviewer?"

**Análise SDD**:
- **Intenção**: Validar especificações estão completas?
- **Requisitos**: Quais critérios de aceitação para uma spec completa?
- **Comportamento**: O que faz quando encontra gap?
- **Rastreabilidade**: Como rastreia specs reviadas?

**Análise CDD**:
- **Contexto necessário**: Especificação + histórico de specs
- **Quando needed**: Durante fase de spec, não depois
- **Duplicação**: Existe análise similar?

**Análise Agentic**:
- **Agent Understanding**: Agente entenderia specs melhor com reviewer?
- **Agent Decision Making**: Tomar melhores decisões?
- **Autonomy**: Pode proceder automaticamente após review?

**Análise DX**:
- **Simplicidade**: Novo agent mantém Jarvis simples?
- **Discoverability**: Desenvolvedor descobre quando usar?
- **Onboarding**: Fácil aprender a usar?

**Preferência Evolutiva**:
- **REUSE**: Existe workflow de review?
- **EXTEND**: Pode estender workflow existente?
- **REFACTOR**: Reorganizar spec workflow?
- **CREATE**: Criar novo agent? (última opção)

**Recomendação**:
"Eu não criaria um novo agent ainda. Começaria como etapa de workflow. Se notar que reviewer tem comportamento, contexto e ciclo de vida próprios, aí extraímos para agent."

---

**Última atualização**: 2026-10-04
