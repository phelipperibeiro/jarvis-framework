---
trigger: always_on
---

> **Applies to:** HUB: all | POSITION: all | AREA: ENGINEERING | SQUAD: all

# Regras do Workflow Work

## Propósito

O workflow `work` tem como **único objetivo** implementar código seguindo o plano de execução (`plan.md`). É uma etapa de **codificação pura**, sem commits ou PRs.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

> Esta regra é executada **antes de qualquer ação**. Se qualquer condição falhar, o workflow para imediatamente.

### Regra 0.1 — TASK_MANAGER_KEY obrigatório

Ler `TASK_MANAGER` do ENV.md. Ver `eng.integrations-rules.md` (freelance vs board).

Se `$ARGUMENTS` não trouxer o key: **perguntar e aguardar**. Não inventar. Não exigir `XXX-000`.

- Freelance (`TASK_MANAGER` vazio): *Qual o seu número de controle para esta tarefa?*
- Com board: *Qual o id do card no {TASK_MANAGER}?*

Sem resposta → **PARAR**. Com resposta → seguir (pasta/branch em lowercase).

### Regra 0.2 — Proibido executar em branch protegida

Verificar branch atual:

```bash
git branch --show-current
```

Se for `main`, `master`, `develop`, `staging` ou `homolog`:

```
🚫 BLOQUEADO: Você está em uma branch protegida ({BRANCH_ATUAL}).

Este workflow só pode ser executado em uma branch de feature.
Execute /eng.start {TASK_MANAGER_KEY} primeiro para criar a branch correta.

Branch esperada: {TASK_MANAGER_KEY}-{titulo-kebab-case}
```

**→ PARAR. Não executar nenhuma fase.**

### Regra 0.3 — Branch deve corresponder ao TASK_MANAGER_KEY

Se a branch atual **não contém** o `{TASK_MANAGER_KEY}` no nome:

```
⚠️ ATENÇÃO: A branch atual ({BRANCH_ATUAL}) não corresponde à tarefa {TASK_MANAGER_KEY}.

  Branch atual:  {BRANCH_ATUAL}
  Esperado:      branch contendo {TASK_MANAGER_KEY}

Confirmar que está na branch certa? (s/n)
```

**→ Aguardar confirmação explícita antes de prosseguir.**

---

## Princípios Fundamentais

### 1. Somente Codificação - NUNCA Commits ou PRs

O `work` é **estritamente proibido** de:


| ❌ Proibido                                 | ✅ Permitido                        |
| ------------------------------------------- | ----------------------------------- |
| Fazer commits                               | Escrever código                    |
| Criar Pull Requests                         | Criar/modificar arquivos de código |
| Executar`git add`, `git commit`, `git push` | Ler arquivos da sessão             |
| Mover cards no Jira                         | Executar testes locais              |
| Fazer merge de branches                     | Atualizar`plan.md` com progresso    |
| Sugerir "vamos fazer o PR agora"            | Validar código com o usuário      |

### 2. Escopo de Atuação

O `work` atua **exclusivamente** em:

```
$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
├── architecture.md  → LEITURA (referência)
└── plan.md          → LEITURA + ESCRITA (progresso)
```

E no **código do projeto** conforme definido no `plan.md`.

### 3. Ciclo de Trabalho

O workflow segue um ciclo rígido:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. LER plan.md → Identificar fase em progresso             │
│        ↓                                                    │
│  2. APRESENTAR → Plano de abordagem da fase                 │
│        ↓                                                    │
│  3. AGUARDAR → Aprovação do usuário                         │
│        ↓                                                    │
│  4. IMPLEMENTAR → Código conforme plano                     │
│        ↓                                                    │
│  5. TESTAR → Validar localmente                             │
│        ↓                                                    │
│  6. VALIDAR → Usuário revisa código                         │
│        ↓                                                    │
│  7. ATUALIZAR plan.md → Marcar fase como concluída          │
│        ↓                                                    │
│  8. REPETIR → Próxima fase (se houver)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Comportamento Esperado

### Fase de Leitura

1. **Ler arquivos da sessão**

   - `architecture.md` - Entender a arquitetura
   - `plan.md` - Identificar fase atual
2. **Identificar fase em progresso**

   - Procurar por `[Em Progresso ⏰]` ou `[In Progress ⏰]`
   - Se nenhuma em progresso, identificar a primeira `[Não Iniciada ⏳]`

### Fase de Planejamento

3. **Apresentar plano de abordagem**

   - Listar tarefas da fase
   - Ordem de execução proposta
   - Arquivos que serão criados/modificados
   - Riscos ou pontos de atenção
4. **Aguardar aprovação**

   - NUNCA iniciar sem confirmação do usuário
   - Se usuário tiver sugestões, ajustar plano

### Fase de Implementação

5. **Implementar código**

   - Seguir padrões do projeto
   - Usar arquivos existentes como referência
   - Criar testes junto com o código
   - Documentar decisões no código
6. **Executar testes locais**

   - Rodar testes unitários
   - Verificar lint/formatação
   - Validar que não quebrou nada existente

### Fase de Validação

7. **Solicitar validação do usuário**

   - Apresentar resumo do que foi feito
   - Destacar pontos importantes
   - Aguardar feedback
8. **Iterar se necessário**

   - Fazer ajustes solicitados
   - Revalidar após mudanças

### Fase de Atualização

9. **Atualizar plan.md**

   - Marcar tarefas como `[Completada ✅]`
   - Adicionar comentários sobre:
     - Decisões tomadas
     - Problemas encontrados
     - Mudanças de direção
     - Aprendizados
10. **Comunicar próximos passos**

    - Informar que a fase foi concluída
    - Perguntar se deseja iniciar próxima fase
    - ⚠️ **NUNCA sugerir PR ou commit**

---

## Regras de Atualização do plan.md

### Marcadores de Status


| Status        | Marcador             |
| ------------- | -------------------- |
| Não iniciada | `[Não Iniciada ⏳]` |
| Em progresso  | `[Em Progresso ⏰]`  |
| Completada    | `[Completada ✅]`    |
| Bloqueada     | `[Bloqueada 🚫]`     |

### Comentários Obrigatórios

Ao concluir uma fase, adicione na seção `### Comentários:`:

```markdown
### Comentários:

- **Decisão**: {decisão tomada e por quê}
- **Mudança**: {algo que mudou em relação ao planejado}
- **Aprendizado**: {algo descoberto durante implementação}
- **Atenção**: {ponto importante para próximas fases}
```

---

## Interação com Usuário

### Pontos de Pausa Obrigatórios

O workflow **DEVE pausar e aguardar confirmação**:

1. ✋ **Antes de iniciar qualquer fase**
2. ✋ **Após completar implementação** (antes de atualizar plan.md)
3. ✋ **Antes de iniciar próxima fase**

### Comunicação

- Seja claro sobre o que foi feito
- Destaque arquivos criados/modificados
- Mencione testes executados
- Liste decisões tomadas

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Escapar para Git**

   - "Vou fazer o commit dessas mudanças..."
   - "Agora podemos criar o PR..."
   - "Deixa eu dar push das alterações..."
2. **Pular validação**

   - Implementar várias fases sem pausar
   - Não aguardar confirmação do usuário
3. **Não atualizar plan.md**

   - Esquecer de marcar tarefas como concluídas
   - Não adicionar comentários
4. **Ignorar testes**

   - Implementar sem testar
   - Não rodar lint/formatação

### ✅ Boas Práticas

1. **Implementação incremental**

   - Uma tarefa por vez
   - Testar após cada mudança
2. **Comunicação clara**

   - Explicar o que está fazendo
   - Mostrar código relevante
3. **Documentação no código**

   - Comentários explicativos
   - JSDoc/docstrings

---

## Transição para Próxima Etapa

Ao finalizar **TODAS as fases** do `plan.md`, informe:

```
✅ Todas as fases do plano foram implementadas!

📁 Sessão: $SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/
📄 Plan atualizado: plan.md

📌 Próximos passos:
1. Revise todo o código implementado
2. Execute os testes completos
3. Quando estiver pronto, use `eng.pr` para criar o Pull Request

⚠️ Este workflow NÃO faz commits ou PRs.
   Use `eng.pr` quando estiver pronto para submeter.
```

---

## Checklist de Conclusão de Fase

Antes de considerar uma fase completa:

- [ ]  Todas as tarefas da fase foram implementadas
- [ ]  Testes locais passando
- [ ]  Lint/formatação OK
- [ ]  Usuário validou o código
- [ ]  `plan.md` atualizado com status
- [ ]  Comentários adicionados no plan.md
- [ ]  NENHUM commit foi feito
- [ ]  NENHUM PR foi criado
- [ ]  Próximos passos comunicados
