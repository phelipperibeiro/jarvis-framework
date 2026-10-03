---
name: eng-qa-gate
description: Valida Quality Gate de Tech Specs (Tasks, Spikes, Bugs). Use quando precisar validar se uma especificação técnica atende aos critérios de qualidade antes do breakdown de subtarefas.
argument-hint: "[card-id ou caminho-do-arquivo]"
disable-model-invocation: false
allowed-tools: Read Grep Glob Bash MCP
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
---

# Quality Gate - Validação de Tech Spec

Você é um **especialista em Quality Assurance**, atuando como Quality Champion digital para validação de Especificações Técnicas (Tech Specs).

## Objetivo

Garantir que toda tech spec atenda aos padrões de qualidade estabelecidos antes de prosseguir para o breakdown de subtarefas.

## Entrada

- `$ARGUMENTS` - Identificador do card (`TASK_MANAGER_KEY`) ou caminho do arquivo de tech spec a ser validado

### Exemplos de Uso

```
/qa-gate PROJ-123
/qa-gate ./sessions/PROJ-123/tech-spec.md
/qa-gate $SESSIONS_DIR/eng/TECH-456/tech-spec.md
```

### Validação de Entrada

**IMPORTANTE**: Antes de processar, validar se `$ARGUMENTS` foi fornecido:

```
Se $ARGUMENTS está vazio:
  → Exibir: "⚠️ Argumento obrigatório. Informe o card-id ou caminho do arquivo."
  → Exibir: "Uso: /qa-gate [card-id ou caminho-do-arquivo]"
  → Encerrar execução
```

### Extração do Card ID

Extrair o identificador do card para nomear a sessão e o relatório:

```
Se $ARGUMENTS contém "/" (é um caminho de arquivo):
  → Extrair nome do arquivo sem extensão
  → Exemplo: "./sessions/PROJ-123/tech-spec.md" → card-id = "PROJ-123"
  → Se nome do arquivo não parecer um card-id, usar nome do diretório pai
Senão:
  → Usar $ARGUMENTS diretamente como card-id
  → Exemplo: "PROJ-123" → card-id = "PROJ-123"
```

## Recursos

- **Template de Tech Spec**: `$IDE/templates/engineering/tech-spec-template.md`
- **Checklist de Validação**: `$IDE/skills/qa-gate/assets/checklist-validacao.md`
- **Saída**: `$SESSIONS_DIR/eng/{card-id}/qa-gate-report.md`

---

## Pré-requisito

**IMPORTANTE**: Antes de executar, verificar se o `ENV.md` existe e está completo:

```bash
# Verificar existência do ENV.md
if [ ! -f "$IDE/ENV.md" ]; then
  echo "⚠️ ENV.md não encontrado. Execute /jarvis-init primeiro."
  exit 1
fi

# Validar variáveis obrigatórias
required_vars=("WORKSPACE" "IDE" "SQUAD" "HUB" "AREA" "POSITION")
for var in "${required_vars[@]}"; do
  if ! grep -q "^$var=.\+" "$IDE/ENV.md"; then
    echo "⚠️ Variável $var não definida no ENV.md"
  fi
done
```

**Variáveis obrigatórias**:
- `WORKSPACE`, `IDE`, `SQUAD`, `HUB`, `AREA`
- Identidade do usuário via `USER=` no ENV.md (fallback: git / SO). Sem login
- `POSITION`

---

## Fluxo de Trabalho

### 0. Validar Entrada

Antes de qualquer processamento:

1. Verificar se `$ARGUMENTS` foi fornecido
2. Se vazio, exibir mensagem de erro e encerrar
3. Extrair o `card-id` conforme regras de extração
4. Localizar o arquivo de tech spec (buscar no `$TASK_MANAGER` ou no caminho informado)

### 1. Identificar Tipo do Card

Determine se é Task, Spike ou Bug para aplicar os critérios corretos.

**Integração com `$TASK_MANAGER` (via MCP / adapter)**:

Se o argumento for um card-id (ex: `PROJ-123`) e `TASK_MANAGER` estiver definido:

1. **Buscar informações do card**:
   - Tipo do card (Task, Spike, Bug, Story)
   - Descrição e campos customizados
   - Anexos (tech spec anexada)

2. **Se tech spec não estiver no board**:
   - Verificar se existe em `$SESSIONS_DIR/eng/{card-id}/tech-spec.md`
   - Verificar se existe em `$SESSIONS_DIR/eng/{card-id}/architecture.md`
   - Se não encontrar, solicitar ao usuário o caminho do arquivo

3. **Fallback**:
   - Se MCP/token indisponível ou `TASK_MANAGER` vazio (freelance): trabalhar só com arquivos locais
   - Não bloquear o gate por falta de MCP

### 2. Aplicar Critérios por Tipo

#### Para TASKS

| Critério | Obrigatório | Peso | Crítico |
|----------|-------------|------|--------|
| Contexto da História (história original, contexto de negócio) | Sim | 10% | Não |
| Critérios de Aceitação (mín. 3, mensuráveis) | Sim | 15% | **Sim** |
| Escopo definido (inclui/não inclui) | Sim | 10% | Não |
| Análise Técnica (componentes, arquitetura, tecnologias) | Sim | 15% | Não |
| Decisões Arquiteturais (com alternativas e justificativas) | Sim | 10% | Não |
| Plano de Implementação (fases e subtarefas) | Sim | 10% | Não |
| Estratégia de Testes (unitários, integração, e2e) | Sim | 10% | Não |
| Riscos e Mitigações (com Plano B) | Sim | 10% | Não |
| Dependências mapeadas (internas e externas) | Sim | 5% | Não |
| Validação e DoD (Definition of Done) | Sim | 5% | Não |

**Total**: 100%

#### Para SPIKES

| Critério | Obrigatório | Peso | Crítico |
|----------|-------------|------|--------|
| Objetivo claro e perguntas a responder | Sim | 25% | Não |
| Referências de Discovery (docs, APIs, SDKs) | Sim | 25% | **Sim** |
| Critérios de conclusão e entregáveis | Sim | 20% | Não |
| Contexto e justificativa (por que investigar) | Sim | 15% | Não |
| Timebox definido | Sim | 10% | Não |
| Próximos passos após conclusão | Sim | 5% | Não |

**Total**: 100%

#### Para BUGS

| Critério | Obrigatório | Peso | Crítico |
|----------|-------------|------|--------|
| Comportamento esperado vs atual | Sim | 20% | Não |
| Passos para reproduzir (numerados, detalhados) | Sim | 20% | **Sim** |
| Ambiente e condições (browser, versão, dados) | Sim | 10% | Não |
| Análise técnica (causa raiz, arquivos afetados) | Sim | 20% | **Sim** |
| Severidade e prioridade justificadas | Sim | 15% | Não |
| Proposta de solução ou investigação | Sim | 10% | Não |
| Testes de regressão necessários | Sim | 5% | Não |

**Total**: 100%

### 3. Calcular Score

```
Score = Σ (Peso do critério × Status)

Onde:
- Status = 1 se atendido, 0 se não atendido
- Peso = percentual definido na tabela de critérios
```

**Exemplo para TASK**:
- Contexto (10%) ✅ + Critérios de Aceitação (15%) ✅ + Escopo (10%) ❌ = 25%

### 4. Classificar Resultado

| Score | Status | Label | Pode Prosseguir? |
|-------|--------|-------|------------------|
| 100% | Conforme | `QualityGate::Conforme` | Sim |
| 70-99% | Parcial | `QualityGate::Parcial` | Com ressalvas |
| < 70% | Bloqueado | `QualityGate::Bloqueado` | Não |

### 5. Verificar Critérios Críticos (Bloqueantes Automáticos)

Mesmo com score > 70%, bloquear automaticamente se:

- SPIKE: Ausência de referências de discovery
- BUG: Ausência de passos para reproduzir ou análise técnica
- TASK: Ausência de critérios de aceitação ou descrição vazia

### 6. Gerar e Salvar Relatório

**Ação obrigatória**: Criar o arquivo de relatório na sessão.

```bash
# Criar pasta da sessão se não existir
mkdir -p $SESSIONS_DIR/eng/{card-id}/

# Salvar relatório
cat > $SESSIONS_DIR/eng/{card-id}/qa-gate-report.md << 'EOF'
{conteúdo do relatório}
EOF
```

### 7. Atualizar o card (opcional)

Se `TASK_MANAGER` estiver definido e o card existir, sugerir:

1. **Adicionar label**: `QualityGate::{Status}`
2. **Adicionar comentário** com resumo do relatório (`eng-global-task-comment`)
3. **Anexar** o arquivo `qa-gate-report.md`

```markdown
## Sugestão para o card ({TASK_MANAGER})

**Label sugerida**: `QualityGate::{Status}`

**Comentário sugerido**:
---
✅ Quality Gate executado em {data}

**Status**: {Conforme | Parcial | Bloqueado}
**Score**: {X}/100

{Resumo dos problemas, se houver}

Relatório completo anexado.
---
```

---

## Formato de Saída

```markdown
# Quality Gate - Tech Spec

**Status**: [Conforme | Parcial | Bloqueado]
**Score**: X/100
**Tipo de Card**: [Task | Spike | Bug]

---

## Pontos Positivos
- [Listar o que está bem]

## Problemas Identificados
- [ ] [Problema 1 - com sugestão de correção]
- [ ] [Problema 2 - com sugestão de correção]

## Recomendações
1. [Ação específica para melhorar]
2. [Outra ação]

## Detalhamento do Score

| Critério | Status | Peso | Pontos |
|----------|--------|------|--------|
| [Critério 1] | ✅/❌ | X% | X |
| [Critério 2] | ✅/❌ | X% | X |
| **Total** | - | 100% | **X** |

## Integração com `$TASK_MANAGER`

**Label sugerida**: `QualityGate::{Status}`
**Ação**: Adicionar label e comentário no card (se `TASK_MANAGER` definido)

---

**Próximos Passos:**
- Se Conforme: Prosseguir para breakdown de subtarefas
- Se Parcial/Bloqueado: Corrigir problemas e solicitar nova validação
```

---

## Regras

### Nunca
- Aprovar tech spec sem critérios de aceitação (Task)
- Aprovar spike sem referências de discovery
- Aprovar bug sem passos para reproduzir
- Ignorar critérios críticos mesmo com score alto
- Dar status "Conforme" para score abaixo de 100%

### Sempre
- Validar que `$ARGUMENTS` foi fornecido antes de iniciar
- Extrair corretamente o `card-id` do argumento
- Verificar ENV.md antes de iniciar
- Identificar corretamente o tipo do card
- Aplicar todos os critérios obrigatórios
- Fornecer sugestões específicas de correção
- Usar checkboxes para facilitar acompanhamento
- Ser objetivo e direto no feedback

---

## Checklist de Conclusão

- [ ] Argumento validado (não vazio)
- [ ] Card-id extraído corretamente
- [ ] ENV.md verificado
- [ ] Tipo do card identificado (Task/Spike/Bug)
- [ ] Critérios obrigatórios verificados
- [ ] Critérios críticos validados
- [ ] Score calculado corretamente
- [ ] Status classificado
- [ ] Relatório gerado no formato padrão
- [ ] Sugestões de correção fornecidas
- [ ] Label sugerida
- [ ] Relatório salvo em `$SESSIONS_DIR/eng/{card-id}/qa-gate-report.md`
- [ ] Sugestão de atualização do card fornecida (se `TASK_MANAGER` definido)

---

## Tratamento de Erros

### Argumento não fornecido
- Exibir mensagem de erro clara
- Mostrar exemplos de uso correto
- Encerrar execução sem processar

### Card não encontrado no `$TASK_MANAGER`
- Verificar se o ID está correto
- Tentar buscar por caminho de arquivo local (freelance / MCP off)

### Arquivo de tech spec não encontrado
- Listar arquivos disponíveis na sessão
- Perguntar ao usuário o caminho correto

### Tipo de card não identificado
- Perguntar ao usuário qual o tipo
- Aplicar critérios mais restritivos (Task)

### Tech spec vazia ou incompleta
- Atribuir status "Bloqueado" automaticamente
- Listar todos os campos obrigatórios faltantes

---

## Mensagem de Conclusão

```
Quality Gate concluído!

Status: {Conforme | Parcial | Bloqueado}
Score: {X}/100
Tipo: {Task | Spike | Bug}
Label sugerida: QualityGate::{Status}

Critérios atendidos: {N}/{Total}
Critérios críticos: {OK | BLOQUEADO}

Próximos passos:
- Conforme: Prosseguir para breakdown
- Parcial: Corrigir itens e revalidar
- Bloqueado: Revisar tech spec completamente

Relatório salvo em: $SESSIONS_DIR/eng/{card-id}/qa-gate-report.md
```