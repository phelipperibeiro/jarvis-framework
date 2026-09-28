# Exemplos de Análise - Quality Gate

Exemplos práticos de validações de tech spec em diferentes cenários.

---

## Exemplo 1: Task Conforme (Score 100%)

### Contexto
Task de implementação de nova funcionalidade com tech spec completa e bem documentada.

### Comentário Gerado

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: ✅ Conforme
**Score**: 100/100
**Tipo de Card**: Task

### ✅ Pontos Positivos
- Descrição clara com contexto do problema e objetivo bem definido
- 5 critérios de aceitação específicos e mensuráveis
- 4 cenários de teste identificados (2 de sucesso + 2 de erro)
- Análise técnica detalhada com stack escolhida (React + TypeScript + Axios)
- Dependências técnicas e de outros cards mapeadas
- Estimativa de complexidade fornecida (M - Médio)
- Riscos identificados e mitigações propostas

### 🔧 Recomendações

Tech spec aprovada! Pode prosseguir para breakdown de subtarefas.

**Próximos passos**:
1. Executar `breakdown_spec_tech` para quebrar em subtarefas
2. Revisar subtarefas geradas
3. Iniciar implementação

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Exemplo 2: Spike Bloqueado (Score 30%)

### Contexto
Spike de discovery com informações insuficientes - faltam referências críticas.

### Comentário Gerado

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: 🚫 Não conforme
**Score**: 30/100
**Tipo de Card**: Spike

### 🚫 Problemas Identificados

#### Bloqueantes (Obrigatório corrigir)
- [ ] **Referência de Discovery**: AUSENTE - Não informado onde o discovery será realizado
  - **Impacto**: Time não sabe quais documentações/APIs consultar
  - **Como corrigir**: Adicione links para:
    - Documentação oficial da tecnologia/ferramenta
    - APIs ou SDKs a serem investigados
    - Exemplos: "Banco Rendimento - https://desenvolvedores.rendimento.com.br/api-portal/"

- [ ] **Critérios de Conclusão**: Não definido o que caracteriza o spike como concluído
  - **Impacto**: Spike pode se estender indefinidamente
  - **Como corrigir**: Defina claramente:
    - Entregáveis esperados (POC, documento comparativo, análise técnica)
    - Perguntas que precisam ser respondidas
    - Tempo máximo estimado

- [ ] **Objetivo**: Muito vago, não especifica as perguntas a serem respondidas
  - **Impacto**: Time não sabe o que precisa descobrir
  - **Como corrigir**: Liste perguntas específicas, exemplo:
    - "A biblioteca X suporta autenticação OAuth2?"
    - "Qual o custo de API calls para volume esperado?"
    - "É possível fazer cache de respostas?"

### 🔧 Recomendações

**⚠️ Card BLOQUEADO para breakdown**

Antes de prosseguir, é necessário:

1. **Adicionar Referências de Discovery**
   - Exemplo para API externa:
     ```
     ## Referências
     - Documentação: https://developer.example.com/docs
     - API Reference: https://api.example.com/v2/reference
     - SDK Node.js: https://github.com/example/node-sdk
     ```

2. **Definir Critérios de Conclusão**
   - Exemplo:
     ```
     ## Critérios de Conclusão
     - [ ] POC funcional demonstrando integração básica
     - [ ] Documento comparativo com alternativas (X vs Y vs Z)
     - [ ] Resposta para as 3 perguntas críticas listadas
     - **Deadline**: 2 dias úteis
     ```

3. **Especificar Objetivo**
   - Transforme "Investigar solução de pagamento" em:
     ```
     ## Perguntas a Responder
     1. Qual gateway tem menor taxa de transação?
     2. Qual suporta split de pagamento?
     3. Qual tem melhor documentação e suporte?
     ```

**Após correções**:
- Solicite nova análise executando `quality_gate_tech_spec` novamente
- O card será reavaliado com os novos critérios

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Exemplo 3: Bug Parcial (Score 70%)

### Contexto
Bug report com bom detalhamento mas faltando análise técnica completa.

### Comentário Gerado

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: ⚠️ Parcialmente conforme
**Score**: 70/100
**Tipo de Card**: Bug

### ✅ Pontos Positivos
- Descrição clara do comportamento esperado vs atual
- Passos para reproduzir bem detalhados e numerados
- Dados de teste fornecidos
- Ambiente de ocorrência especificado
- Severidade e prioridade justificadas

### 🚫 Problemas Identificados

#### Melhorias Recomendadas
- [ ] **Análise Técnica**: Causa raiz não identificada
  - **Como melhorar**: Adicione seção com:
    - Hipótese da causa raiz (mesmo que preliminar)
    - Arquivos/componentes possivelmente afetados
    - Sugestão de solução
  - **Exemplo**:
    ```
    ## Análise Técnica
    **Causa provável**: Race condition no useEffect do componente UserProfile
    **Arquivos afetados**: src/components/UserProfile.tsx (linha 45-52)
    **Solução proposta**: Adicionar cleanup function e verificar mounted state
    ```

- [ ] **Screenshots/Logs**: Não há evidências visuais
  - **Como melhorar**: Anexe screenshots ou logs de console
  - Ajuda a confirmar o problema e facilita reprodução

### 🔧 Recomendações

**Decisão**: Card pode prosseguir com ressalvas. Considere adicionar análise técnica para facilitar correção.

1. **Priorize análise técnica**: Mesmo que seja hipótese inicial
   - Ajuda quem for corrigir a ter um ponto de partida
   - Pode ser refinada durante implementação

2. **Adicione evidências**: Screenshots ou logs facilitam validação
   - Print do comportamento incorreto
   - Log de console com erros (se aplicável)

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Exemplo 4: Task Parcial - Faltam Cenários de Teste (Score 80%)

### Contexto
Task bem documentada mas com cobertura de testes incompleta.

### Comentário Gerado

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: ⚠️ Parcialmente conforme
**Score**: 80/100
**Tipo de Card**: Task

### ✅ Pontos Positivos
- Descrição excelente com contexto de negócio
- 4 critérios de aceitação claros e mensuráveis
- Análise técnica detalhada com diagramas
- Dependências bem mapeadas
- Estimativa de complexidade realista

### 🚫 Problemas Identificados

#### Melhorias Recomendadas
- [ ] **Cenários de Teste**: Apenas 1 cenário de sucesso identificado
  - **Como melhorar**: Adicione pelo menos mais 2 cenários:
    - 1 cenário de erro/exceção
    - 1 cenário de edge case
  - **Exemplos baseados nesta task**:
    ```
    ## Cenários de Teste

    ### Sucesso
    1. ✅ Usuário cria conta com todos os dados válidos

    ### Erros e Exceções
    2. Email já cadastrado → Deve exibir erro específico
    3. CPF inválido → Deve validar antes de enviar
    4. Senha fraca → Deve exigir senha forte

    ### Edge Cases
    5. Usuário clica "Criar" múltiplas vezes → Deve prevenir duplicação
    6. Internet cai durante criação → Deve haver retry ou mensagem clara
    ```

### 🔧 Recomendações

**Decisão**: Card pode prosseguir, mas cenários de teste melhorariam qualidade.

1. **Adicione cenários de erro**: Pensando em:
   - Validações de campos
   - Erros de API
   - Problemas de conectividade

2. **Considere edge cases**: O que pode dar errado?
   - Múltiplos cliques
   - Timeouts
   - Dados inválidos ou maliciosos

**Benefício**: Cenários bem definidos facilitam QA e reduzem bugs em produção.

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Padrões Observados

### Cards Conformes (100%)
- Documentação completa e objetiva
- Todos os critérios obrigatórios atendidos
- Exemplos concretos quando necessário
- Critérios de aceitação mensuráveis
- Cenários de teste abrangentes

### Cards Parciais (50-99%)
- **Gaps comuns**:
  - Faltam 1-2 cenários de teste
  - Análise técnica superficial
  - Dependências não completamente mapeadas
- **Sempre podem prosseguir**, mas com ressalvas

### Cards Bloqueados (< 50%)
- **Gaps críticos**:
  - Spike sem referências de discovery
  - Task sem critérios de aceitação
  - Bug sem passos para reproduzir
  - Descrição vazia ou genérica
- **Não podem prosseguir** até correção

---

## Dicas para Análise

### Como Identificar Bloqueantes
1. Leia critérios obrigatórios do tipo de card
2. Verifique presença de cada critério
3. Se faltam 3+ critérios → Bloqueante automático
4. Se presente mas vago/incompleto → Avaliar gravidade

### Como Calcular Score
1. Liste todos os critérios obrigatórios (geralmente 4-5)
2. Marque quais estão atendidos
3. Calcule: (Atendidos / Total) × 100
4. Ajuste se houver critério crítico não atendido

### Como Escrever Recomendações
- ✅ Seja específico: "Adicione 2 cenários de erro"
- ❌ Evite genérico: "Melhore os testes"
- ✅ Forneça exemplo concreto
- ❌ Evite apenas apontar problema
- ✅ Explique o benefício da correção
- ❌ Evite tom negativo ou desmotivador
