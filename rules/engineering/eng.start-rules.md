---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow Start

## Propósito

O workflow `start` tem como **único objetivo** criar o documento de arquitetura (`architecture.md`) para uma nova feature/tarefa. É uma etapa de **planejamento**, não de execução.

---

## Princípios Fundamentais

### 1. Somente Planejamento - NUNCA Execução

O `start` é **estritamente proibido** de:

| ❌ Proibido                          | ✅ Permitido                              |
| ------------------------------------ | ----------------------------------------- |
| Criar arquivos de código (.ts, .js)  | Criar `architecture.md`                   |
| Modificar código existente           | Ler código para análise                   |
| Executar comandos no terminal        | Listar arquivos e estruturas              |
| Instalar dependências                | Buscar padrões no codebase                |
| Fazer commits                        | Criar diretório da sessão                 |
| Executar testes                      | Documentar decisões                       |
| Iniciar servidores                   | Dialogar com usuário                      |

### 2. Artefato Único

O **único artefato** produzido pelo `start` é:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md
```

> 📁 **Padrão**: `TASK_MANAGER_KEY` é o ID do card em **lowercase** (ex: `TASK-123` → `task-123`)

Nenhum outro arquivo deve ser criado, modificado ou deletado.

### 3. Aprovação Obrigatória

O workflow **só é considerado completo** após:

1. O `architecture.md` estar preenchido
2. O usuário revisar o documento
3. O usuário **aprovar explicitamente** para prosseguir

---

## Comportamento Esperado

### Fase de Entrada

1. **Receber identificador da tarefa (TASK_MANAGER_KEY)**
   - Ler `TASK_MANAGER` do ENV.md (`eng.integrations-rules.md`)
   - Se não veio em `$ARGUMENTS`: **perguntar e aguardar**
     - Freelance (vazio): número de controle próprio (ex: `F-042`)
     - Com board: id do card naquele vendor
   - Converter para **lowercase** (ex: `F-042` → `f-042`)

2. **Criar diretório da sessão**
   - Caminho: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`
   - Se já existir, avisar o usuário

### Fase de Investigação

3. **Coletar informações do requisito**
   - Buscar card no board só se `TASK_MANAGER` estiver preenchido
   - Ler documentação relacionada
   - Analisar código existente (LEITURA APENAS)

4. **Fazer perguntas de clarificação**
   - Mínimo 3, máximo 5 perguntas
   - Aguardar respostas antes de prosseguir
   - Iterar até ter compreensão sólida

### Fase de Documentação

5. **Criar architecture.md**
   - Usar template: `$IDE/templates/engineering/architecture-template.md`
   - Preencher TODAS as seções
   - Ser específico (arquivos reais, nomes de classes)

6. **Apresentar ao usuário**
   - Resumo das principais decisões
   - Riscos identificados
   - Solicitar revisão

### Fase de Aprovação

7. **Aguardar aprovação**
   - Se aprovado → Informar próximos passos
   - Se rejeitado → Iterar no documento
   - NUNCA prosseguir automaticamente

---

## Regras de Nomenclatura

### TASK_MANAGER_KEY (Identificador da Sessão)

O nome da pasta de sessão é **sempre o TASK_MANAGER_KEY em lowercase**:

```
{TASK-123} → {task-123}
```

**Regras:**
- Converter para **lowercase**
- Manter o formato original (projeto-número)
- Não adicionar sufixos ou descrições

**Exemplos:**
| Input (TASK_MANAGER_KEY)    | Nome da Pasta (Sessão)               |
| ------------------- | ------------------------------------- |
| `TASK-123`          | `$SESSIONS_DIR/eng/task-123/`        |
| `STORY-456`         | `$SESSIONS_DIR/eng/story-456/`       |
| `BUG-789`           | `$SESSIONS_DIR/eng/bug-789/`         |
| `SPIKE-42`          | `$SESSIONS_DIR/eng/spike-42/`        |

---

## Qualidade do Architecture.md

### Seções Obrigatórias

O documento DEVE conter:

- [ ] **Contexto** - Por que isso está sendo feito
- [ ] **Objetivo** - O que será alcançado
- [ ] **Escopo** - O que está incluído/excluído
- [ ] **Estado Atual** - Como funciona hoje
- [ ] **Estado Proposto** - Como funcionará
- [ ] **Componentes Impactados** - Lista de arquivos
- [ ] **Decisões Arquiteturais** - Com justificativas
- [ ] **Dependências** - Internas e externas
- [ ] **Riscos** - Com mitigações
- [ ] **Estratégia de Testes** - Tipos e cobertura

### Critérios de Qualidade

| Critério                    | Descrição                                      |
| --------------------------- | ---------------------------------------------- |
| **Especificidade**          | Usa caminhos reais, não genéricos              |
| **Completude**              | Todas as seções preenchidas                    |
| **Clareza**                 | Sem ambiguidades ou jargões indefinidos        |
| **Rastreabilidade**         | Links para Jira, docs, código                  |
| **Decisões Justificadas**   | Cada decisão tem "por quê"                     |
| **Riscos Mapeados**         | Riscos têm mitigações definidas                |

---

## Interação com Usuário

### Perguntas de Clarificação

Sempre pergunte sobre:

1. **Escopo** - O que definitivamente NÃO está incluído?
2. **Prioridade** - Qual parte é mais crítica?
3. **Dependências** - Algo bloqueia esta implementação?
4. **Restrições** - Há limitações técnicas conhecidas?
5. **Validação** - Como saberemos que está funcionando?

### Comunicação

- **Seja claro** sobre o que é fato vs. suposição
- **Declare incertezas** explicitamente
- **Não assuma** - sempre pergunte
- **Aguarde respostas** antes de prosseguir

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Escapar para execução**
   - "Vou criar o arquivo de teste para validar..."
   - "Deixa eu instalar a dependência para verificar..."

2. **Documentação genérica**
   - "Modificar os arquivos necessários"
   - "Implementar a funcionalidade"

3. **Pular aprovação**
   - Prosseguir sem confirmação explícita do usuário

4. **Assumir requisitos**
   - Decidir escopo sem confirmar com usuário

5. **Ignorar riscos**
   - Não documentar riscos óbvios

### ✅ Boas Práticas

1. **Ser específico**
   - "Modificar `src/services/auth.service.ts` linha ~45"

2. **Justificar decisões**
   - "Escolhemos JWT porque o sistema já usa e..."

3. **Mapear arquivos reais**
   - Usar glob/grep para encontrar arquivos existentes

4. **Documentar trade-offs**
   - "Isso adiciona latência mas simplifica a arquitetura"

---

## Transição para Próxima Etapa

Ao finalizar o `start`, informe claramente:

```
✅ Architecture.md criado e aprovado!

📄 Documento: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/architecture.md

📌 Próximos passos:
1. eng.plan  → Criar plano detalhado com subtarefas
2. eng.work  → Iniciar implementação

⚠️ Lembre-se: Use eng.plan antes de eng.work
```

---

## Checklist de Conclusão

Antes de considerar o `start` completo:

- [ ] Diretório `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/` criado
- [ ] Arquivo `architecture.md` criado e completo
- [ ] Template seguido corretamente
- [ ] Todas as seções obrigatórias preenchidas
- [ ] Decisões têm justificativas
- [ ] Riscos têm mitigações
- [ ] Componentes impactados listados com caminhos reais
- [ ] Usuário revisou o documento
- [ ] Usuário aprovou explicitamente
- [ ] Nenhum código foi executado/criado
- [ ] Próximos passos comunicados
