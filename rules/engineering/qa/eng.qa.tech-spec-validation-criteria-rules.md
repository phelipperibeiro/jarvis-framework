> **Applies to:** HUB: QA | POSITION: QA-ENGINEER, SPECIALIST | AREA: ENGINEERING | SQUAD: all

# Critérios de Validação de Tech Spec

Critérios objetivos para validação de especificações técnicas, organizados por tipo de card.

## Para TASKS Normais

### ✅ Obrigatório (Bloqueante)

#### 1. Descrição Clara e Objetiva
- Contexto do problema/necessidade
- Objetivo da tarefa bem definido
- Escopo delimitado

#### 2. Critérios de Aceitação
- Pelo menos 3 critérios bem definidos
- Critérios específicos e mensuráveis
- Formato: "O sistema deve..." ou "Quando... então..."

#### 3. Cenários de Teste
- Pelo menos 2 cenários identificados
- Casos de sucesso definidos
- Casos de erro/exceção identificados

#### 4. Análise Técnica
- Abordagem técnica documentada
- Tecnologias/bibliotecas a serem utilizadas
- Impactos em outras partes do sistema identificados

#### 5. Dependências
- Dependências técnicas mapeadas
- Dependências de outros cards identificadas (se houver)

### ⚡ Desejável (Não Bloqueante)

- Estimativa de complexidade (P, M, G)
- Riscos identificados
- Alternativas de implementação consideradas
- Diagrama ou fluxo (quando aplicável)

---

## Para SPIKE (Discovery)

### ✅ Obrigatório (Bloqueante)

#### 1. Objetivo do Spike
- O que precisa ser investigado/descoberto
- Perguntas que precisam ser respondidas
- Escopo bem definido

#### 2. Referência de Discovery
- **CRÍTICO**: Local onde será realizado o discovery
- Links para documentação oficial
- APIs, SDKs ou ferramentas a serem investigadas
- Exemplo: "Banco Rendimento - https://desenvolvedores.rendimento.com.br/api-portal/"

#### 3. Critérios de Conclusão
- O que define o spike como concluído
- Entregáveis esperados (POC, documento, análise comparativa, etc.)
- Tempo máximo estimado

#### 4. Contexto e Justificativa
- Por que este spike é necessário
- Qual decisão depende deste discovery

### ⚡ Desejável (Não Bloqueante)

- Alternativas a serem comparadas
- Critérios de avaliação
- Impacto da decisão no projeto

---

## Para BUG

### ✅ Obrigatório (Bloqueante)

#### 1. Descrição do Bug
- Comportamento esperado
- Comportamento atual (incorreto)
- Impacto do bug

#### 2. Passos para Reproduzir
- Lista numerada e clara
- Dados de teste necessários
- Ambiente onde ocorre

#### 3. Análise Técnica
- Causa raiz identificada (ou hipótese)
- Arquivos/componentes afetados
- Solução proposta

#### 4. Severidade e Prioridade
- Classificação de severidade
- Justificativa da prioridade

---

## Checklist Rápido por Tipo

### Task
- [ ] Descrição com contexto, objetivo e escopo
- [ ] Mínimo 3 critérios de aceitação mensuráveis
- [ ] Mínimo 2 cenários de teste (sucesso + erro)
- [ ] Análise técnica com stack e impactos
- [ ] Dependências mapeadas

### Spike
- [ ] Objetivo e perguntas definidas
- [ ] **Referências de discovery** (docs, APIs, SDKs)
- [ ] Critérios de conclusão e entregáveis
- [ ] Contexto e justificativa do spike

### Bug
- [ ] Comportamento esperado vs atual
- [ ] Passos para reproduzir numerados
- [ ] Causa raiz e arquivos afetados
- [ ] Severidade e prioridade justificadas
