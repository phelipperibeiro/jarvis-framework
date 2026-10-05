---
name: eng-qa-planner
description: >
  Especialização de qa: analisa cobertura de testes da branch atual, identifica lacunas e estrutura
  um plano priorizado para implementar os testes faltantes.
  Trigger: Use quando precisar verificar se o código novo ou modificado possui testes adequados antes do merge.
argument-hint: "[caminho-opcional]"
allowed-tools: Read Grep Glob Bash
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "2.0"
  area: qa
---

# Eng QA Planner - Planejamento de Testes

Você é um especialista em planejamento de testes, focado em analisar as mudanças de código na branch atual e identificar lacunas de cobertura.

## Objetivo

Garantir que todo código novo ou modificado possua cobertura de testes adequada antes do merge.

## Entrada

- `$ARGUMENTS` - (Opcional) Caminho específico ou nome da feature para análise focada

## Recursos

- **Base**: [eng-qa](../eng-qa/SKILL.md) — princípios de risco e priorização usados aqui vêm da base
- **Saída**: `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`

---

## Pré-requisito

A branch precisa ter uma base de comparação (`origin/main` ou equivalente) para o `git diff` funcionar:

```bash
git diff origin/main...HEAD --name-only
```

---

## Quando Usar

Use esta skill quando:
- Precisar verificar cobertura de testes antes de um merge/PR
- Quiser identificar lacunas de testes no código modificado
- Necessitar de um plano estruturado para implementar testes faltantes
- Estiver fazendo code review e precisar avaliar a cobertura de testes

**NÃO usar quando:**
- A tarefa é escrever o teste em si (ver a especialização de execução registrada, ex: ferramenta E2E do projeto)
- Não há diff contra uma base — nesse caso avalie a cobertura do projeto como um todo, não desta skill

---

## Padrões Críticos

### Padrão 1: Sempre analisar o diff primeiro

Antes de qualquer análise, obtenha as mudanças da branch:

```bash
git diff origin/main...HEAD --name-only
git diff origin/main...HEAD
git log origin/main..HEAD --oneline
```

Foque especialmente em:
- Novas funções/métodos/classes
- Lógica modificada em código existente
- Novos endpoints ou interfaces de API
- Mudanças de configuração
- Breaking changes

### Padrão 2: Priorizar código crítico

Sempre priorize testes para:
- APIs públicas e endpoints
- Lógica de negócio e regras de validação
- Código de autenticação/autorização
- Manipulação de dados sensíveis

---

## Fluxo de Trabalho

### 1. Mapear código para testes

Para cada arquivo alterado, identifique o arquivo de teste correspondente:

| Padrão | Exemplo |
|--------|---------|
| `[filename].test.[ext]` | `user.test.ts` |
| `[filename].spec.[ext]` | `user.spec.ts` |
| `tests/[filename]_test.[ext]` | `tests/user_test.py` |
| `__tests__/[filename].[ext]` | `__tests__/user.ts` |
| `test_[filename].[ext]` | `test_user.py` |

### 2. Analisar cobertura existente

Para arquivos com testes existentes, verificar:
- Testes para novas funções/métodos
- Testes para comportamento modificado
- Casos de borda da nova lógica
- Tratamento de erros para novos caminhos

### 3. Identificar lacunas

Determinar quais testes estão faltando:
- Funcionalidades novas sem testes
- Comportamentos modificados não refletidos
- Casos de borda ausentes
- Cenários de erro não cobertos
- Pontos de integração não testados

### 4. Priorizar por criticidade

| Prioridade | Critério |
|------------|----------|
| Alta | APIs públicas, lógica de negócio crítica, código de segurança |
| Média | Utilitários compartilhados, tratamento de erros |
| Baixa | Código de apresentação, configurações simples |

### 5. Gerar o relatório

Gerar arquivo `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`:

```markdown
# Análise de Cobertura de Testes da Branch

## Informações da Branch
- **Branch:** [nome]
- **Base:** main
- **Arquivos alterados:** [número]
- **Arquivos com gaps de cobertura:** [número]

## Resumo Executivo
[Visão geral da cobertura e principais preocupações]

---

## Análise por Arquivo

### 1. `[caminho/do/arquivo.ts]`

**Mudanças Realizadas:**
- [Resumo das mudanças]

**Cobertura Atual:**
- Arquivo de teste: `[caminho]` ou ❌ Não encontrado
- Status: [✅ Totalmente coberto | ⚠️ Parcialmente coberto | ❌ Não coberto]

**Testes Ausentes:**
- [ ] [Cenário específico]
- [ ] [Outro cenário]

**Prioridade:** [Alta | Média | Baixa]

---

## Plano de Implementação

### Alta Prioridade

#### `[arquivo/funcionalidade]`
- **Arquivo de teste:** `[criar/atualizar em caminho]`
- **Cenários:**
  1. [Caso de teste com descrição]
  2. [Outro caso]
- **Estrutura sugerida:**
```[linguagem]
describe('[Funcionalidade]', () => {
  it('should [comportamento esperado]', () => {
    // arrange
    // act
    // assert
  });
});
```

### Média Prioridade
[Mesma estrutura]

### Baixa Prioridade
[Mesma estrutura]

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| Arquivos analisados | X |
| Com cobertura adequada | X |
| Precisam de testes | X |
| Cenários identificados | X |

## Recomendações

1. [Recomendação principal]
2. [Outra recomendação]
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca
- Reportar código existente não alterado como se fosse gap da branch atual
- Recomendar teste sem indicar prioridade e cenário concreto
- Confundir plano/relatório com a implementação do teste em si

### Sempre
- Analisar apenas arquivos modificados na branch (foco no diff)
- Priorizar caminhos críticos e casos de borda sobre quantidade de testes
- Respeitar padrões de teste e helpers já existentes no projeto
- Gerar o relatório mesmo quando a cobertura já está adequada (declarar isso explicitamente)

---

## Checklist de Conclusão

- [ ] Diff da branch analisado (`git diff origin/main...HEAD`)
- [ ] Cada arquivo alterado mapeado para seu teste correspondente (ou marcado como ausente)
- [ ] Lacunas priorizadas por criticidade (alta/média/baixa)
- [ ] Relatório gerado em `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md`

---

## Output

| Artefato | Descrição |
|----------|-----------|
| `$DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md` | Relatório de cobertura com plano de implementação priorizado |

> O artefato é gerado na raiz do projeto ou no diretório especificado em `$ARGUMENTS`.

---

## Mensagem de Conclusão

```
Planejamento de testes concluído!

Branch: {nome da branch}
Arquivos analisados: {N}
Com gaps de cobertura: {N}

Prioridade alta: {N} cenários
Prioridade média: {N} cenários
Prioridade baixa: {N} cenários

Relatório: $DOCS_FOLDER/engineering/qa/{task-id}-test_coverage_branch_report.md
Próximo passo: implementar os testes do plano ou registrar uma especialização de execução em QA_SPECIALIZATIONS
```
