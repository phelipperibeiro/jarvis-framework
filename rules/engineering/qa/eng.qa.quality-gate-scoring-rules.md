> **Applies to:** HUB: QA | POSITION: QA-ENGINEER, SPECIALIST | AREA: ENGINEERING | SQUAD: all

# Regras de Classificação de Score

Sistema de pontuação e bloqueio para quality gates de tech specs.

## Faixas de Score

### 🚫 BLOQUEANTE - Score < 50%

**Status**: Não conforme
**Label**: `QualityGate::Bloqueado`
**Ação**: Card **NÃO PODE** prosseguir para breakdown. Deve retornar para refinamento.

#### Quando bloquear:
- Faltam 3 ou mais critérios obrigatórios
- Descrição completamente vazia ou genérica
- SPIKE sem referências de discovery
- Critérios de aceitação ausentes ou muito vagos
- Bug sem passos para reproduzir
- Análise técnica inexistente ou incompleta
- Subtarefas propostas são fatias horizontais (só enum, só repository, só factory, só DTO, só contratos sem implementação funcional) ou não passam no Teste de Validação de independência

#### Mensagem ao time:
> ⚠️ **Card bloqueado para breakdown**. Tech spec não atende aos critérios mínimos de qualidade. Refine conforme recomendações e solicite nova análise.

---

### ⚠️ PARCIAL - Score 50-99%

**Status**: Parcialmente conforme
**Label**: `QualityGate::Parcial`
**Ação**: Card **PODE** prosseguir, mas com ressalvas. Recomenda-se refinamento antes.

#### Quando classificar como parcial:
- 1-2 critérios obrigatórios faltando
- Critérios presentes mas podem ser melhorados
- Faltam alguns cenários de teste
- Análise técnica superficial
- Dependências parcialmente mapeadas

#### Mensagem ao time:
> ℹ️ **Card pode prosseguir com ressalvas**. A tech spec está funcional mas pode ser melhorada. Considere as recomendações para aumentar qualidade.

---

### ✅ CONFORME - Score 100%

**Status**: Conforme
**Label**: `QualityGate::Conforme`
**Ação**: Card está **PRONTO** para breakdown de subtarefas.

#### Quando aprovar:
- Todos os critérios obrigatórios atendidos
- Tech spec clara, completa e acionável
- Equipe pode iniciar implementação sem dúvidas
- Critérios de aceitação mensuráveis
- Cenários de teste identificados
- Análise técnica detalhada
- Dependências mapeadas

#### Mensagem ao time:
> ✅ **Tech spec aprovada!** Todos os critérios de qualidade atendidos. Card pronto para breakdown de subtarefas.

---

## Cálculo de Score

### Metodologia

1. **Identificar critérios obrigatórios** do tipo de card (Task/Spike/Bug)
2. **Verificar cada critério**: Atendido = 1 ponto, Não atendido = 0 pontos
3. **Calcular percentual**: (Critérios atendidos / Total critérios) × 100

### Exemplo: Task

| Critério | Atendido? | Peso |
|----------|-----------|------|
| Descrição Clara | ✅ Sim | 15% |
| Critérios de Aceitação | ✅ Sim | 20% |
| Cenários de Teste | ❌ Não | 15% |
| Análise Técnica | ✅ Sim | 15% |
| Dependências | ⚠️ Parcial | 10% |
| **Valor Unitário (fatia vertical)** | ✅ Sim | **25%** |

**Score**: 80/100 → **Parcial**

> **Critério 6 — Valor Unitário (fatia vertical)** é o critério de maior peso. Avalia se as subtarefas propostas são **entregáveis completos e independentes** (endpoint inteiro, modal inteiro, tela inteira) e **não** fatias horizontais (só enum, só repository, só factory, só DTO). Uma subtarefa só é válida se, mergeada isoladamente, a aplicação continua funcionando e a entrega é observável.

---

## Matriz de Decisão

| Score | Status | Label | Pode prosseguir? | Ação requerida |
|-------|--------|-------|------------------|----------------|
| 0-49% | 🚫 Não conforme | `QualityGate::Bloqueado` | ❌ Não | Refinamento obrigatório |
| 50-99% | ⚠️ Parcial | `QualityGate::Parcial` | ⚠️ Com ressalvas | Refinamento recomendado |
| 100% | ✅ Conforme | `QualityGate::Conforme` | ✅ Sim | Prosseguir para breakdown |

---

## Regras Especiais

### Critérios Críticos (Bloqueantes Automáticos)

Mesmo com score > 50%, o card é **automaticamente bloqueado** se:

#### Para SPIKE:
- ❌ Ausência completa de referências de discovery

#### Para BUG:
- ❌ Ausência de passos para reproduzir
- ❌ Ausência de análise técnica

#### Para TASK:
- ❌ Ausência de critérios de aceitação
- ❌ Descrição vazia ou extremamente genérica (< 50 caracteres)
- ❌ Subtarefas propostas são fatias horizontais (split por camada) — ex: cards separados para "criar enum", "criar repository", "criar factory", "criar DTO", "criar contratos/interfaces" sem implementação funcional
- ❌ Subtarefas não passam no Teste de Validação de independência (não mergeáveis isoladamente sem quebrar o sistema)

### Exemplo:
```
Score calculado: 60% (Parcial)
Mas: Task sem critérios de aceitação
Resultado final: BLOQUEADO (critério crítico não atendido)
```

---

## Processo de Reavaliação

### Após Correções

1. Desenvolvedor corrige problemas apontados
2. Solicita nova análise (comentário mencionando Quality Champion)
3. Nova validação é realizada
4. Score é recalculado
5. Label é atualizada

### Histórico de Validações

Cada validação deve incluir:
- Data/hora da análise
- Score obtido
- Status resultante
- Principais gaps identificados

Isso permite rastreabilidade e melhoria contínua do processo.

---

## Exceções e Escalação

### Quando Escalar

Em casos excepcionais, pode-se solicitar aprovação manual:

- Urgência crítica (produção parada)
- Contexto especial conhecido pelo time
- Tech spec de spike exploratório inicial

**Processo**:
1. Adicionar comentário justificando exceção
2. Mencionar tech lead ou arquiteto
3. Obter aprovação explícita
4. Documentar decisão no card

**Label**: `QualityGate::Exceção` (substitui label automática)

---

## Métricas de Qualidade

### KPIs Sugeridos

- **Taxa de conformidade**: % de cards com score 100%
- **Taxa de bloqueio**: % de cards < 50%
- **Tempo médio de refinamento**: Tempo entre bloqueio e aprovação
- **Reincidência**: Cards bloqueados > 1 vez

Essas métricas ajudam a identificar gaps de processo e melhorar qualidade geral das tech specs.
