# Regras do Workflow Work

## Propósito

O workflow `work` tem como **único objetivo** implementar código seguindo o plano de execução (`plan.md`). É uma etapa de **codificação**: commita ao final de cada fase validada, mas nunca faz push nem abre PR.

---

## ⛔ Gate 0: Pré-requisitos Obrigatórios

Antes de qualquer ação, leia `$IDE/rules-on-demand/engineering/eng.gate0-rules.md` e aplique as Regras 0.1 (chave da tarefa), 0.2 (branch protegida) e 0.3 (a branch contém a chave, no padrão da skill `eng-global-branch`). Se qualquer condição falhar, o workflow para imediatamente.

---

## Princípios Fundamentais

### 1. Codificação com commit por fase - NUNCA push ou PR

O `work` é **estritamente proibido** de:


| ❌ Proibido                                        | ✅ Permitido                                              |
| -------------------------------------------------- | --------------------------------------------------------- |
| Fazer `git push`                                   | Escrever código                                           |
| Criar Pull Requests                                | Criar/modificar arquivos de código                        |
| Usar `git add .`                                   | `git add` de arquivos específicos da fase                 |
| Commitar sem aprovação do usuário na fase          | Commitar no momento da tabela "Quando sai o commit" da 1.3 do workflow (por fase, por tarefa ou ao final), com testes passando |
| Commitar com testes falhando                       | Executar testes locais                                    |
| Mover cards no Jira                                | Ler arquivos da sessão                                    |
| Fazer merge de branches                            | Atualizar `plan.md` com progresso                         |
| Sugerir "vamos fazer o PR agora"                   | Validar código com o usuário                              |

O commit segue o formato do workflow (`{TASK_MANAGER_KEY} {tipo}({escopo}): {descrição}`, com `Refs:`). Push e PR são responsabilidade do `eng.pr`.

**Escolhas do início** (`eng.transitions-rules.md`, Fase 1.3 do workflow): execução, commits e o que vem depois. Com "Todas de uma vez", a escolha é a aprovação das fases; com "Tarefa a tarefa", o ciclo inteiro (plano, implementação, testes, validação, marcação no `plan.md` e retomada) é por tarefa; com "Um por tarefa", cada tarefa vira um commit, nunca antes da validação do usuário (com "Tarefa a tarefa", depois da validação de cada tarefa; com "Fase a fase" ou "Todas de uma vez", ao fim da fase, depois da 3.2 e da 3.3, um por tarefa; a `{fase}.T` é a última tarefa da fase e leva os testes da fase; tabela "Quando sai o commit" da 1.3); com "Um commit só ao final", o commit é um só, depois da última fase; com "Rodar o `/eng.pr`", o work termina chamando o `/eng.pr` (que faz o push e o PR, não o work).

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
    - ⚠️ **NUNCA sugerir push ou PR** (são do `eng.pr`)

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

Com **"Fase a fase, com aprovação (como hoje)"**, o workflow **DEVE pausar e aguardar confirmação**:

1. ✋ **Antes de iniciar qualquer fase**
2. ✋ **Após completar implementação** (antes de atualizar plan.md)
3. ✋ **Antes de iniciar próxima fase**

Com **"Tarefa a tarefa, com aprovação"**, as mesmas três pausas valem para cada tarefa: antes de iniciá-la, depois de implementá-la (antes de marcá-la no `plan.md` e de commitar) e antes da próxima tarefa (que substitui a pausa entre fases).

Com **"Todas de uma vez"**, essas pausas não acontecem. **Em qualquer escolha**, o workflow para no limite do `MAX_AI_EXECUTION_PERCENTAGE`, com um teste falhando e diante de uma questão nova em aberto. Se a parada cai no meio de uma fase cujo commit só sai no fim dela, ele também pergunta se commita o que já está pronto ou deixa sem commit (o padrão), como na Fase 1.3 do workflow; com o commit, as tarefas commitadas ficam `[Completada ✅]`; a retomada segue só as tarefas que não estão `[Completada ✅]` e confere com `git status` e `git log` o que ainda falta commitar.

### Comunicação

- Seja claro sobre o que foi feito
- Destaque arquivos criados/modificados
- Mencione testes executados
- Liste decisões tomadas

---

## Erros Comuns a Evitar

### ❌ Anti-padrões

1. **Escapar para Git**

   - "Agora podemos criar o PR..."
   - "Deixa eu dar push das alterações..."
   - `git add .` ou commit com testes falhando
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

⚠️ Este workflow commita (por fase, por tarefa ou ao final), mas NÃO faz push nem PR.
   Use `eng.pr` quando estiver pronto para submeter.
```

Depois, siga a escolha **Depois do work** da Fase 1.3 (sugerir o `/eng.pre-pr`, chamá-lo, chamar o `/eng.pr` ou parar).

---

## Checklist de Conclusão de Fase

Antes de considerar uma fase completa:

- [ ]  Todas as tarefas da fase foram implementadas
- [ ]  Testes locais passando
- [ ]  Lint/formatação OK
- [ ]  Usuário validou o código
- [ ]  `plan.md` atualizado com status
- [ ]  Comentários adicionados no plan.md
- [ ]  Commit da fase (ou de cada tarefa, com "Um por tarefa") feito (arquivos adicionados um a um, testes passando)
- [ ]  NENHUM push foi feito
- [ ]  NENHUM PR foi criado
- [ ]  Próximos passos comunicados
