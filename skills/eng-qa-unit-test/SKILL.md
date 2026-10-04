---
name: eng-qa-unit-test
description: >
  Gera testes unitários para código novo ou modificado seguindo as convenções do projeto.
  Trigger: Use quando precisar criar testes unitários para funções, classes ou módulos.
argument-hint: "[caminho-do-arquivo]"
disable-model-invocation: false
allowed-tools: Read Write Edit Grep Glob Bash mcp__TestSprite__testsprite_bootstrap mcp__TestSprite__testsprite_generate_code_summary mcp__TestSprite__testsprite_generate_frontend_test_plan mcp__TestSprite__testsprite_generate_backend_test_plan mcp__TestSprite__testsprite_generate_code_and_execute mcp__TestSprite__testsprite_rerun_tests
license: AGPL-3.0
metadata:
  author: jarvis-team
  version: "1.0"
  area: qa
---

# QA Unit Test - Gerador de Testes Unitários

Você é um **especialista em testes unitários** focado em criar testes de alta qualidade seguindo as convenções do projeto.

## Objetivo

Gerar testes unitários completos para código novo ou modificado, garantindo cobertura adequada e seguindo padrões de teste do projeto.

## Entrada

- `$ARGUMENTS` - Caminho do arquivo ou função para criar testes

## Recursos

- **Saída**: Arquivo de teste no padrão do projeto (`.test.ts`, `.spec.ts`, `_test.py`, etc.)

---

## Pré-requisito

Verificar se o `ENV.md` existe e está completo antes de executar.

---

## Quando Usar

Use esta skill quando:
- Precisar criar testes unitários para novo código
- Quiser aumentar a cobertura de testes de código existente
- Necessitar de testes para funções ou classes específicas
- Estiver fazendo TDD e precisar de testes antes da implementação

**NÃO usar quando:**
- Precisar de testes de integração (use qa-integration-test)
- Precisar de testes e2e (use qa-e2e-test)
- O código já tiver cobertura adequada

---

## Validação de Entrada

```
Se $ARGUMENTS está vazio:
  → Exibir: "⚠️ Argumento obrigatório. Informe o caminho do arquivo."
  → Exibir: "Uso: /eng-qa-unit-test [caminho-do-arquivo]"
  → Encerrar execução
```

---

## Integração com TestSprite MCP

Esta skill prioriza o uso do TestSprite MCP para geração automática de testes quando disponível.

### Verificação de Disponibilidade

Para verificar se o TestSprite está disponível:

1. **Tente chamar** `testsprite_bootstrap` com parâmetros mínimos
2. **Se a tool existir e responder**: Prossiga com o Fluxo A (MCP)
3. **Se a tool não existir ou retornar erro**: Prossiga com o Fluxo B (Manual)

**Erros que indicam indisponibilidade:**
- `Tool not found`
- `MCP server not connected`
- `Connection refused`
- Timeout sem resposta

> **Importante**: Não tente reconectar ou instalar o MCP automaticamente. Se indisponível, siga direto para o Fluxo B.

### Decisão de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  VERIFICAR TESTSPRITE MCP                                   │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ Tool testsprite_bootstrap│                               │
│  │ disponível?              │                               │
│  └───────────┬─────────────┘                                │
│              │                                              │
│         SIM  │  NÃO                                         │
│         ↓    │  ↓                                           │
│       FLUXO  │  FLUXO                                       │
│       MCP    │  MANUAL                                      │
│       (A)    │  (B)                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FLUXO A: TestSprite MCP (Preferencial)

Se o TestSprite MCP estiver disponível, use as seguintes ferramentas para gerar testes automaticamente.

### A.1. Detectar Tipo de Projeto

Identifique se o projeto é frontend ou backend:

```bash
# Verificar indicadores de Frontend
grep -E "(react|vue|angular|next|nuxt|svelte|vite)" package.json 2>/dev/null

# Verificar indicadores de Backend
ls requirements.txt go.mod pom.xml Cargo.toml 2>/dev/null
grep -E "(express|fastify|nest|koa|hapi)" package.json 2>/dev/null
```

| Indicador | Tipo |
|-----------|------|
| `react`, `vue`, `angular`, `next`, `svelte`, `vite` | Frontend |
| `express`, `fastify`, `nest`, `koa`, `hapi` | Backend |
| `requirements.txt`, `pytest` | Backend (Python) |
| `go.mod` | Backend (Go) |
| `pom.xml`, `build.gradle` | Backend (Java) |

### A.2. Detectar Porta Local

```bash
# Verificar porta em package.json ou .env
grep -E "PORT|port" package.json .env 2>/dev/null
```

| Framework | Porta Padrão |
|-----------|-------------|
| Vite/React | 5173 |
| Next.js/CRA | 3000 |
| Express/Node | 3000 |
| Django/FastAPI | 8000 |

### A.3. Bootstrap do TestSprite

```javascript
testsprite_bootstrap({
  localPort: 5173,  // Ajustar conforme detectado
  type: "frontend", // Ou "backend" conforme detectado
  projectPath: "$PROJECT_ROOT",
  testScope: "diff" // Foca no arquivo específico
})
```

### A.4. Gerar Sumário do Código

```javascript
testsprite_generate_code_summary({
  projectRootPath: "$PROJECT_ROOT"
})
```

### A.5. Gerar Plano de Testes

Para Frontend:
```javascript
testsprite_generate_frontend_test_plan({
  projectPath: "$PROJECT_ROOT",
  needLogin: false // Ajustar se necessário
})
```

Para Backend:
```javascript
testsprite_generate_backend_test_plan({
  projectPath: "$PROJECT_ROOT"
})
```

### A.6. Gerar e Executar Testes

```javascript
testsprite_generate_code_and_execute({
  projectName: "$WORKSPACE",
  projectPath: "$PROJECT_ROOT",
  testIds: [], // Vazio = todos, ou especificar IDs
  additionalInstruction: "Foco em testes unitários para: $ARGUMENTS"
})
```

### A.7. Re-executar Testes (se necessário)

```javascript
testsprite_rerun_tests({
  projectPath: "$PROJECT_ROOT"
})
```

### A.8. Saída do TestSprite

O TestSprite gera automaticamente:
- `testsprite_tests/` - Pasta com todos os testes gerados
- `TestSprite_MCP_Test_Report.md` - Relatório em Markdown
- `TestSprite_MCP_Test_Report.html` - Relatório em HTML
- `testsprite_tests/tmp/test_results.json` - Resultados detalhados

---

## FLUXO B: Geração Manual (Fallback)

Se o TestSprite MCP NÃO estiver disponível, siga o fluxo manual abaixo.

### Padrões Críticos (Fluxo Manual)

#### Padrão 1: Detectar Framework de Teste

```bash
# JavaScript/TypeScript
grep -E "(jest|vitest|mocha|jasmine)" package.json

# Python
ls pytest.ini pyproject.toml setup.cfg 2>/dev/null | head -1

# Go - usa testing nativo
```

| Framework | Padrão de Arquivo | Import |
|-----------|-------------------|--------|
| Jest | `*.test.ts`, `*.spec.ts` | `import { describe, it, expect } from '@jest/globals'` |
| Vitest | `*.test.ts`, `*.spec.ts` | `import { describe, it, expect } from 'vitest'` |
| Pytest | `test_*.py`, `*_test.py` | `import pytest` |
| Go | `*_test.go` | `import "testing"` |

#### Padrão 2: Estrutura AAA (Arrange-Act-Assert)

Todo teste deve seguir a estrutura AAA:

```typescript
describe('NomeDaFuncao', () => {
  it('should [comportamento esperado] when [condição]', () => {
    // Arrange - Preparar dados de entrada
    const input = { ... };

    // Act - Executar a função
    const result = funcao(input);

    // Assert - Verificar resultado
    expect(result).toBe(esperado);
  });
});
```

#### Padrão 3: Cobertura Mínima de Cenários

Todo teste deve cobrir:
- Caminho feliz (happy path)
- Casos de borda (edge cases)
- Tratamento de erros
- Valores nulos/undefined

### Árvore de Decisão (Fluxo Manual)

```
Arquivo TypeScript?     → Jest ou Vitest (verificar package.json)
Arquivo Python?         → Pytest
Arquivo Go?             → testing nativo
Arquivo Java?           → JUnit
Caso contrário          → Perguntar ao usuário
```

### Fluxo de Trabalho (Manual)

#### B.1. Analisar Arquivo de Origem

```bash
# Ler o arquivo para entender a estrutura
cat $ARGUMENTS
```

Identificar:
- Funções/métodos exportados
- Dependências e imports
- Tipos de entrada e saída
- Possíveis cenários de teste

#### B.2. Verificar Testes Existentes

```bash
# Verificar se já existe arquivo de teste
ls ${ARGUMENTS%.ts}.test.ts 2>/dev/null || \
ls ${ARGUMENTS%.ts}.spec.ts 2>/dev/null || \
echo "Nenhum teste encontrado"
```

#### B.3. Criar Arquivo de Teste

Criar o arquivo de teste seguindo:
- Convenção de nomenclatura do projeto
- Imports necessários
- Mocks de dependências externas

#### B.4. Implementar Testes

Para cada função/método:
1. Criar `describe` block
2. Implementar casos de teste (happy path primeiro)
3. Adicionar casos de borda
4. Adicionar casos de erro

#### B.5. Executar e Validar

```bash
# JavaScript/TypeScript
npm test -- --testPathPattern={arquivo}

# Python
pytest {arquivo} -v

# Go
go test -v -run {funcao}
```

### Skills invocados durante a execução do skill

| Passo | Skill | Condição |
|-------|-------|----------|
| — | Nenhuma — skill autocontida | — |

---

## Regras

### Nunca
- Criar testes que dependem de estado externo
- Usar dados de produção em testes
- Ignorar casos de erro
- Criar testes sem assertions
- Usar `any` em mocks TypeScript
- Pular a verificação do TestSprite MCP

### Sempre
- Verificar disponibilidade do TestSprite primeiro
- Seguir estrutura AAA (no fluxo manual)
- Nomear testes de forma descritiva
- Isolar testes (não dependem uns dos outros)
- Mockar dependências externas
- Cobrir happy path + edge cases + errors

---

## Tratamento de Erros

### Arquivo não encontrado
- Exibir: "⚠️ Arquivo '{caminho}' não encontrado."
- Verificar se o caminho está correto
- Sugerir usar glob para encontrar arquivo

### Framework não detectado
- Exibir: "⚠️ Framework de teste não detectado."
- Listar frameworks suportados
- Perguntar ao usuário qual usar

### Testes já existem
- Exibir: "⚠️ Arquivo de teste já existe em '{caminho}'"
- Perguntar se deseja sobrescrever ou adicionar novos testes

### TestSprite falhou
- Exibir: "⚠️ TestSprite retornou erro. Alternando para fluxo manual."
- Continuar com Fluxo B automaticamente

---

## Checklist de Conclusão

### Fluxo A (TestSprite)
- [ ] TestSprite MCP verificado e disponível
- [ ] Tipo de projeto detectado (frontend/backend)
- [ ] Bootstrap executado com sucesso
- [ ] Plano de testes gerado
- [ ] Testes executados
- [ ] Relatório gerado

### Fluxo B (Manual)
- [ ] Arquivo de origem analisado
- [ ] Framework de teste identificado
- [ ] Arquivo de teste criado no padrão correto
- [ ] Todos os exports públicos testados
- [ ] Happy path coberto
- [ ] Edge cases cobertos
- [ ] Casos de erro cobertos
- [ ] Testes executados com sucesso
- [ ] Sem warnings ou erros de tipo

---

## Output

### Fluxo A (TestSprite MCP)

| Artefato | Descrição |
|----------|-----------|
| `testsprite_tests/` | Pasta com testes gerados automaticamente |
| `TestSprite_MCP_Test_Report.md` | Relatório em Markdown |
| `TestSprite_MCP_Test_Report.html` | Relatório visual em HTML |
| `testsprite_tests/tmp/test_results.json` | Resultados detalhados em JSON |

### Fluxo B (Manual)

| Artefato | Descrição |
|----------|-----------|
| `{arquivo}.test.ts` | Arquivo de teste unitário (TypeScript/Jest) |
| `{arquivo}.spec.ts` | Arquivo de teste unitário (TypeScript/Vitest) |
| `test_{arquivo}.py` | Arquivo de teste unitário (Python/Pytest) |
| `{arquivo}_test.go` | Arquivo de teste unitário (Go) |

---

## Mensagem de Conclusão

### Fluxo A (TestSprite)

```
Testes unitários gerados com TestSprite!

Arquivo de origem: {caminho-origem}
Método: TestSprite MCP (automático)
Tipo: {frontend|backend}

Artefatos gerados:
- testsprite_tests/
- TestSprite_MCP_Test_Report.md
- TestSprite_MCP_Test_Report.html

Próximo passo: Revisar o relatório em TestSprite_MCP_Test_Report.md
```

### Fluxo B (Manual)

```
Testes unitários criados manualmente!

Arquivo de origem: {caminho-origem}
Arquivo de teste: {caminho-teste}
Framework: {framework}

Cobertura:
- [x] Funções testadas: {n}
- [x] Casos de teste: {n}
- [x] Happy path: {n}
- [x] Edge cases: {n}
- [x] Error cases: {n}

Comando para executar:
{comando-de-execução}

Próximo passo: Executar os testes com o comando acima
```

---

## Resumo dos Fluxos

| Aspecto | Fluxo A (TestSprite) | Fluxo B (Manual) |
|---------|---------------------|------------------|
| Quando usar | TestSprite MCP disponível | TestSprite não instalado |
| Automação | Total - gera e executa testes | Parcial - requer implementação |
| Saída | Testes + Relatório HTML/MD | Arquivo de teste |
| Esforço | Mínimo | Requer escrita manual |

---

## Recursos Adicionais

- **Referências**: Ver [references/](references/) para guias de teste do projeto