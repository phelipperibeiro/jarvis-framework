# Análise de Cobertura de Testes da Branch

## Informações da Branch

| Campo | Valor |
|-------|-------|
| **Branch** | `{BRANCH_NAME}` |
| **Base** | `main` |
| **Data da Análise** | `{DATA}` |
| **Arquivos Alterados** | {NUMERO_ARQUIVOS} |
| **Arquivos com Gaps** | {NUMERO_GAPS} |

---

## Resumo Executivo

{VISAO_GERAL_COBERTURA}

### Estatísticas Rápidas

| Métrica | Valor |
|---------|-------|
| Arquivos analisados | {X} |
| Com cobertura adequada | {X} |
| Precisam de testes | {X} |
| Cenários identificados | {X} |

---

## Análise por Arquivo

### 1. `{CAMINHO_ARQUIVO}`

**Mudanças Realizadas:**
- {RESUMO_MUDANCAS}

**Cobertura Atual:**
- **Arquivo de teste**: `{CAMINHO_TESTE}` | ❌ Não encontrado
- **Status**: ✅ Totalmente coberto | ⚠️ Parcialmente coberto | ❌ Não coberto

**Testes Ausentes:**
- [ ] {CENARIO_1}
- [ ] {CENARIO_2}

**Prioridade:** Alta | Média | Baixa

---

## Plano de Implementação

### 🔴 Alta Prioridade

#### `{ARQUIVO_FUNCIONALIDADE}`

- **Arquivo de teste**: `{CRIAR_ATUALIZAR_CAMINHO}`
- **Cenários**:
  1. {CASO_TESTE_1}
  2. {CASO_TESTE_2}
- **Estrutura sugerida**:

```typescript
describe('{FUNCIONALIDADE}', () => {
  it('should {COMPORTAMENTO_ESPERADO}', () => {
    // arrange
    // act
    // assert
  });
});
```

### 🟡 Média Prioridade

{MESMA_ESTRUTURA}

### 🟢 Baixa Prioridade

{MESMA_ESTRUTURA}

---

## Recomendações

1. **{RECOMENDACAO_PRINCIPAL}**
2. **{OUTRA_RECOMENDACAO}**

---

## Próximos Passos

- [ ] Implementar testes de alta prioridade
- [ ] Revisar cobertura após implementação
- [ ] Executar suite completa antes do merge
