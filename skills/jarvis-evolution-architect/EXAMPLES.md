# Exemplos - Jarvis Evolution Architect

## 📌 Exemplo 1: Nova Feature - Spec Reviewer Agent

**Pergunta:**
> "Estou pensando em criar um novo agent chamado Spec Reviewer. Ele analisaria se as especificações estão completas. O que você acha?"

### Resposta Estruturada

**Minha Leitura:**
Você quer adicionar uma etapa de validação de specs depois que são criadas, possivelmente como um novo agent independente.

**O Que Eu Acho:**
Não criaria um novo agent ainda. A pergunta certa é: "Esse reviewer precisa realmente de identidade própria?"

**O Que Eu Mudaria:**
Começaria como uma **etapa de workflow** no workflow de spec atual. Se depois perceber que o reviewer tem:
- Comportamento próprio (não apenas validação)
- Contexto especializado (diferente da spec)
- Ciclo de vida independente

...aí extraio para um agent.

**O Que Eu Não Faria:**
- Não criaria um agent novo só porque "reviewar" é uma responsabilidade
- Não adicionaria complexidade arquitetural sem estar 100% certo

**Como Eu Faria:**
```
1. Criar uma skill "eng-spec-review" que valida critérios de completude
2. Integrar como etapa do workflow "spec-validation" 
3. Monitorar padrões de uso por 2-3 ciclos
4. Se ver que vai além de validação → extrair para agent
```

**Trade-Offs:**
- ✅ Menor complexidade inicial
- ✅ Mais fácil iterar
- ❌ Se precisar depois, refatorar será um pouco mais custoso

**Minha Recomendação:**
Comece com skill + workflow. Agent pode esperar.

---

## 📌 Exemplo 2: Nova Funcionalidade - Context Optimizer

**Pergunta:**
> "Sinto que os agentes estão recebendo muita informação desnecessária. Deveria criar um Context Optimizer skill?"

### Resposta Estruturada

**Minha Leitura:**
Contexto em excesso está prejudicando qualidade das decisões dos agentes. Você quer uma forma de otimizar isso.

**O Que Eu Acho:**
Problema real. Mas a solução não é uma nova skill, é uma **regra arquitetural sobre CDD** (Context-Driven Development).

**O Que Eu Mudaria:**
Em vez de skill:
1. Criar uma **Rule** que define "Minimal Context Principle"
2. Documentar em REFERENCES.md quando usar contexto e quando não
3. Adicionar checklist na skill de spec para "contextos mínimos necessários"

**Como Eu Faria:**
```
rules/cdd/
├── minimal-context-principle.md
└── context-validation-checklist.md

skills/
├── ...
└── eng-spec-review/
    └── checklists/
        └── context-needs.md
```

**Trade-Offs:**
- ✅ Educativo (desenvolvedores entendem a razão)
- ✅ Sistêmico (afeta todas as skills)
- ❌ Requer disciplina

**Minha Recomendação:**
Trata como um problema arquitetural, não uma feature nova.

---

## 📌 Exemplo 3: Tecnologia Nova - MCP Integration

**Pergunta:**
> "MCP (Model Context Protocol) saiu novo. Devemos integrar ao Jarvis?"

### Resposta Estruturada

**Minha Leitura:**
MCP é um protocolo novo da Anthropic para contexto estruturado. Você quer saber se relevante pro Jarvis.

**O Que Eu Acho:**
Potencialmente muito relevante. Mas precisa de pesquisa antes de decidir.

**Pesquisa (você faz isso):**
- Documentação oficial do MCP
- Casos de uso em AI frameworks
- Comparação com abordagem atual do Jarvis
- Complexidade de integração

**Avaliação de Tendência:**
```
Tendência: MCP Protocol
↓
Problema que resolve: 
  - Contexto estruturado entre agentes
  - Compartilhamento de recursos entre ferramentas
  - Padrão de interoperabilidade
↓
Relevância para Jarvis:
  - ALTA (contexto é core do Jarvis)
↓
Benefício:
  - Agentes compartilham recursos nativamente
  - Interop com outras ferramentas
  - Menos duplicação de informação
↓
Complexidade:
  - Média (já existe, mas precisa integração)
↓
Trade-off:
  - Ganhamos: interop + padrão aberto
  - Perdemos: abstração a mais, curva aprendizado
↓
Decisão: EXPERIMENT
```

**Minha Recomendação:**
Criar um projeto piloto integrando MCP com um agent existente. Validar complexidade real antes de decisão arquitetural.

---

## 📌 Exemplo 4: Simplificação - Muitas Skills?

**Pergunta:**
> "Temos 50+ skills. Está difícil achar qual skill usar. Deveria consolidar?"

### Resposta Estruturada

**Minha Leitura:**
Discoverability é problema. Muitas skills, sem navegação clara.

**O Que Eu Acho:**
Consolidar skills **não é a resposta**. Problema é **organização e documentação**, não quantidade.

**O Que Eu Mudaria:**
1. Criar um **INDEX.md** principal que agrupa skills por contexto
2. Adicionar tags em metadatas das skills
3. Criar uma skill `/jarvis-find-skill` que busca
4. Melhorar `metadata.area` e `metadata.tags`

**O Que Eu Não Faria:**
- Não consolidaria skills de responsabilidades diferentes
- Não criaria mega-skills com 10 opções

**Como Eu Faria:**
```
skills/
├── INDEX.md (mapa visual de skills por contexto)
├── eng-* (10 skills de engenharia)
├── qa-* (8 skills de QA)
├── prod-* (6 skills de produto)
└── ...

INDEX.md:
## Engineering Skills
Tarefas comuns:
- `/eng.start` → planeja feature
- `/eng.work` → implementa
- `/eng.test` → testa
- ...
```

**Trade-Offs:**
- ✅ Mantém responsabilidades separadas
- ✅ Fácil estender com novas skills
- ❌ Precisa documentação ativa

**Minha Recomendação:**
Skills estão OK. Melhore discovery com INDEX e tags.

---

## 📌 Exemplo 5: Arquitetura - Agents vs Workflows

**Pergunta:**
> "Qual a diferença entre um agent e um workflow? Quando usar cada um?"

### Resposta Estruturada

**Minha Leitura:**
Confusão sobre quando criar um novo agente vs uma sequência de workflow.

**O Que Eu Acho:**
Diferença fundamental:
- **Agent**: Identidade, contexto, autonomia
- **Workflow**: Orquestração, sequência, decisões

**Quando Criar um Agent:**
```
❌ Pode ser workflow se:
  - É apenas uma sequência de etapas
  - Não tem contexto especializado
  - Não toma decisões independentes

✅ Cria um agent se:
  - Tem identidade própria (Role bem-definida)
  - Contexto especializado (informação específica)
  - Autonomia (toma decisões sozinho)
  - Ciclo de vida próprio (pode rodar repetidamente)
```

**Exemplo - Spec Reviewer:**
```
Se é apenas: validar lista de critérios
→ Workflow (sequência de checks)

Se é: entender intent da spec + sugerir melhorias
→ Agent (tem opinião, expertise, contexto)
```

**Minha Recomendação:**
Default para workflow. Extrai para agent só se notar padrões de autonomia e expertise.

---

## 💬 Padrão de Conversa - Sua Entrada

Quando você invoca a skill:

```
/jarvis-evolution-architect "Estou achando a arquitetura do Jarvis complexa. O que eu deveria remover?"
```

### Fluxo esperado:

1. **Eu questiono** 
   - "Qual aspecto está complexo?"
   - "Como isso afeta desenvolvedores?"
   - "Afeta agentes de IA ou código?"

2. **Eu analiso**
   - Vejo estado atual
   - Comparo com preferência evolutiva
   - Avalio trade-offs

3. **Eu recomendo**
   - Com opinião
   - Com justificativa
   - Com próximos passos

---

## 🎯 Entrada Típica vs Resposta Inesperada

### ❌ Não fazer isso:
```
"Qual skill devo usar para X?"
```
❌ Isso não é pergunta arquitetural. Use `/jarvis-find-skill` em vez disso.

### ✅ Fazer isso:
```
"Acho que deveria criar uma nova skill para X. Essa skill faria Y. O que você acha? Deveria ser uma skill ou algo diferente?"
```
✅ Questão arquitetural legítima.

### ✅ Fazer isso:
```
"Estou indeciso entre duas formas de resolver X. Uma é com um novo agent, outra é estender o workflow existente. Como você abordaria?"
```
✅ Questão de design com trade-offs.

---

## 📊 Matriz de Quando Usar Evolution Architect

| Situação | Use Evolution Architect |
|----------|----------------------|
| "Devo criar um novo agent?" | ✅ SIM |
| "Essa feature deveria ser skill ou workflow?" | ✅ SIM |
| "Acho que essa feature está complexa demais" | ✅ SIM |
| "Qual skill usa para X?" | ❌ NÃO (use `/jarvis-find-skill`) |
| "Como implement feature X?" | ❌ NÃO (use skill específica) |
| "Devemos adotar X tendência?" | ✅ SIM |
| "Qual a diferença entre SDD e CDD?" | ✅ SIM |
| "Como faço para debugar skill X?" | ❌ NÃO (use skill específica) |

---

**Última atualização**: 2026-10-04
