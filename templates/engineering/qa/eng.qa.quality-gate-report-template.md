# Template de Comentário - Quality Gate

Estrutura padronizada para comentários de validação de tech spec no Jira.

## Estrutura Base

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: [✅ Conforme / ⚠️ Parcialmente / 🚫 Não conforme]
**Score**: X/100
**Tipo de Card**: [Task / Spike / Bug]

### ✅ Pontos Positivos
- Item 1
- Item 2
- Item 3

### 🚫 Problemas Identificados

#### Bloqueantes
- [ ] **[Área]**: Descrição do problema e impacto
- [ ] **[Área]**: Descrição do problema e impacto

#### Melhorias Recomendadas
- [ ] **[Área]**: Sugestão de melhoria
- [ ] **[Área]**: Sugestão de melhoria

### 🔧 Recomendações

1. **[Área]**: Ação específica e acionável
   - Exemplo concreto ou referência

2. **[Área]**: Ação específica e acionável
   - Exemplo concreto ou referência

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Variações por Status

### ✅ CONFORME (Score 100%)

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: ✅ Conforme
**Score**: 100/100
**Tipo de Card**: [Task/Spike/Bug]

### ✅ Pontos Positivos
- [Liste todos os critérios atendidos]
- [Destaque aspectos particularmente bem feitos]
- [Mencione completude da documentação]

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

### ⚠️ PARCIAL (Score 50-99%)

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: ⚠️ Parcialmente conforme
**Score**: X/100
**Tipo de Card**: [Task/Spike/Bug]

### ✅ Pontos Positivos
- [Liste critérios já atendidos]
- [Destaque o que está bem feito]

### 🚫 Problemas Identificados

#### Melhorias Recomendadas
- [ ] **[Critério]**: Problema específico identificado
  - **Como melhorar**: Ação específica
  - **Exemplo**: [Forneça exemplo concreto]

- [ ] **[Critério]**: Problema específico identificado
  - **Como melhorar**: Ação específica

### 🔧 Recomendações

1. **[Área crítica]**: Priorize esta correção
   - [Orientação detalhada]

2. **[Área secundária]**: Melhoria incremental
   - [Orientação detalhada]

**Decisão**: Card pode prosseguir com ressalvas. Considere as melhorias para aumentar qualidade.

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

### 🚫 BLOQUEADO (Score < 50%)

```markdown
## 🎯 Quality Gate - Tech Spec

**Status**: 🚫 Não conforme
**Score**: X/100
**Tipo de Card**: [Task/Spike/Bug]

### 🚫 Problemas Identificados

#### Bloqueantes (Obrigatório corrigir)
- [ ] **[Critério crítico]**: AUSENTE - Descrição do gap
  - **Impacto**: Por que isso bloqueia a implementação
  - **Como corrigir**: [Passo a passo ou exemplo]

- [ ] **[Critério crítico]**: AUSENTE - Descrição do gap
  - **Impacto**: Por que isso bloqueia a implementação
  - **Como corrigir**: [Passo a passo ou exemplo]

#### Melhorias Recomendadas
- [ ] **[Critério]**: Problema adicional
  - **Como melhorar**: Sugestão específica

### 🔧 Recomendações

**⚠️ Card BLOQUEADO para breakdown**

Antes de prosseguir, é necessário:

1. **[Área crítica 1]**: [Ação obrigatória]
   - Exemplo: [Fornecer exemplo concreto]
   - Referência: [Link para template ou doc]

2. **[Área crítica 2]**: [Ação obrigatória]
   - Exemplo: [Fornecer exemplo concreto]
   - Referência: [Link para template ou doc]

**Após correções**:
- Solicite nova análise executando `quality_gate_tech_spec` novamente
- O card será reavaliado com os novos critérios

### 📚 Referência
Validação baseada em: (processo de quality gate do projeto)

---
*Análise realizada pelo Quality Champion*
```

---

## Guia de Preenchimento

### Seção: Pontos Positivos
- **Quando usar**: Sempre que houver critérios atendidos
- **Formato**: Lista com bullets
- **Tom**: Positivo e específico
- **Exemplo**: ❌ "Descrição boa" → ✅ "Descrição clara com contexto do problema e objetivo bem definido"

### Seção: Problemas Identificados

#### Bloqueantes
- **Quando usar**: Critérios obrigatórios não atendidos
- **Formato**: Checkbox + Área + Descrição
- **Tom**: Objetivo e direto
- **Sempre incluir**: Impacto + Como corrigir

#### Melhorias Recomendadas
- **Quando usar**: Critérios opcionais ou melhorias incrementais
- **Formato**: Checkbox + Área + Sugestão
- **Tom**: Construtivo e educativo

### Seção: Recomendações
- **Quando usar**: Sempre
- **Formato**: Numerado com ações específicas
- **Tom**: Acionável e prático
- **Sempre incluir**: Exemplos concretos ou referências

---

## Boas Práticas

### ✅ FAZER

- Ser específico nos problemas identificados
- Fornecer exemplos concretos
- Incluir links para templates ou documentação
- Usar checkboxes para facilitar acompanhamento
- Focar no "como corrigir", não apenas no problema
- Priorizar problemas bloqueantes no topo

### ❌ EVITAR

- Linguagem vaga ou genérica
- Críticas sem sugestões de correção
- Tom negativo ou desmotivador
- Excesso de formalidade
- Mencionar pessoas (removido do processo)
- Listar muitos problemas sem priorização

---

## Emojis Padronizados

| Emoji | Uso | Contexto |
|-------|-----|----------|
| 🎯 | Título principal | Quality Gate - Tech Spec |
| ✅ | Conformidade | Status conforme, pontos positivos |
| ⚠️ | Atenção | Status parcial, ressalvas |
| 🚫 | Bloqueio | Status não conforme, problemas críticos |
| 🔧 | Ação | Recomendações, próximos passos |
| 📚 | Referência | Links para documentação |

---

## Checklist Pré-Publicação

Antes de publicar o comentário, verifique:

- [ ] Status correto (Conforme/Parcial/Bloqueado)
- [ ] Score calculado está presente
- [ ] Tipo de card identificado
- [ ] Todos os problemas bloqueantes listados
- [ ] Recomendações são acionáveis
- [ ] Exemplos concretos fornecidos
- [ ] Link de referência incluído
- [ ] Tom objetivo e construtivo
- [ ] Checkboxes para acompanhamento
