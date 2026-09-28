# Progresso da Fase: {FASE_NUMERO}

> 📁 **Sessão**: `$SESSIONS_DIR/eng/{TASK_MANAGER_KEY}/`
> 🎫 **Card**: `{TASK_MANAGER_KEY}`

---

## 1. Resumo da Fase

### 1.1 Objetivo
{Descrição do objetivo desta fase conforme definido no plan.md}

### 1.2 Tarefas Planejadas

| # | Tarefa | Status | Arquivo(s) |
|---|--------|--------|------------|
| 1 | {tarefa_1} | ⏳ Pendente | `{arquivo}` |
| 2 | {tarefa_2} | ⏳ Pendente | `{arquivo}` |
| 3 | {tarefa_3} | ⏳ Pendente | `{arquivo}` |

---

## 2. Plano de Abordagem

### 2.1 Ordem de Execução

```
1. {primeira_tarefa}
   └── Justificativa: {por que começar por esta}

2. {segunda_tarefa}
   └── Depende de: {dependência}

3. {terceira_tarefa}
   └── Pode ser paralela com: {outra_tarefa}
```

### 2.2 Arquivos a Serem Criados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `{caminho/arquivo.ts}` | Criação | {descrição} |
| `{caminho/arquivo.test.ts}` | Criação | Testes para {componente} |

### 2.3 Arquivos a Serem Modificados

| Arquivo | Tipo de Mudança | Descrição |
|---------|-----------------|-----------|
| `{caminho/arquivo.ts}` | Adição | {descrição da mudança} |
| `{caminho/index.ts}` | Export | Adicionar export do novo módulo |

---

## 3. Pontos de Atenção

### 3.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| {risco_1} | Média | Alto | {como mitigar} |

### 3.2 Dependências

- **Internas**: {módulos/arquivos que esta fase depende}
- **Externas**: {bibliotecas/serviços externos}

### 3.3 Decisões Pendentes

- [ ] {decisão_1}: {opções disponíveis}
- [ ] {decisão_2}: {aguardando informação}

---

## 4. Implementação

### 4.1 Tarefa 1: {nome_tarefa}

**Status**: ⏰ Em Progresso

**Descrição**:
{O que será implementado}

**Código Principal**:
```{linguagem}
// Código será adicionado aqui durante implementação
```

**Testes**:
```{linguagem}
// Testes serão adicionados aqui
```

---

### 4.2 Tarefa 2: {nome_tarefa}

**Status**: ⏳ Não Iniciada

**Descrição**:
{O que será implementado}

---

## 5. Validação

### 5.1 Testes Executados

| Tipo | Comando | Status | Observação |
|------|---------|--------|------------|
| Unitário | `npm test` | ⏳ | Aguardando |
| Lint | `npm run lint` | ⏳ | Aguardando |
| Build | `npm run build` | ⏳ | Aguardando |

### 5.2 Checklist de Qualidade

- [ ] Código segue padrões do projeto
- [ ] Testes unitários criados
- [ ] Sem erros de lint
- [ ] Build passa sem erros
- [ ] Documentação inline adicionada

---

## 6. Conclusão da Fase

### 6.1 Resumo do Que Foi Feito

{Descrição do que foi implementado}

### 6.2 Arquivos Criados/Modificados

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `{arquivo}` | Criado | +{XX} |
| `{arquivo}` | Modificado | +{XX} -{YY} |

### 6.3 Comentários para Próximas Fases

- **Decisão tomada**: {decisão e justificativa}
- **Mudança de plano**: {o que mudou e por quê}
- **Aprendizado**: {algo descoberto}
- **Atenção**: {ponto importante para próximas fases}

---

## 7. Próximos Passos

✅ **Fase {FASE_NUMERO} concluída!**

📌 **Opções**:
1. Iniciar próxima fase (`Fase {FASE_NUMERO + 1}`)
2. Revisar código implementado
3. Executar testes adicionais

⚠️ **Lembrete**: Use `eng.pr` quando estiver pronto para criar o Pull Request.
